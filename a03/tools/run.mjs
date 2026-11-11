#!/usr/bin/env node
// run.mjs: sends every e-mail to the model with your prompt and schema,
// saves the answers, and scores them against the golden labels.
//
// Usage (from the repository root, or from anywhere):
//   node a03/tools/run.mjs v1                       # full run, saved as a03/output/runs/v1/
//   node a03/tools/run.mjs v2try --only E03,E17     # only some e-mails (partial run)
//   node a03/tools/run.mjs v3 --repeat 2            # two full runs: v3_r1, v3_r2 + spread
//   node a03/tools/run.mjs --dry-run                # show the exact request, send nothing
//
// Options:
//   --only E03,E17          run only these e-mails (marked "partial" in the run log)
//   --repeat N              run the full set N times (labels <label>_r1 ... <label>_rN)
//   --model <id>            use another OpenRouter model for this run (overrides config.json)
//   --reasoning <level>     none | low | medium | high (overrides config.json)
//   --data <dir>            folder with e-mails (default a03/tasks/emails)
//   --labels <file>         golden labels (default a03/tasks/dev_labels.jsonl)
//   --out <dir>             folder for run folders (default a03/output/runs)
//   --pipeline <dir>        folder with prompt.md, schema.json, config.json (default a03/)
//   --dry-run               print the request for the first e-mail and a cost estimate
//   --yes                   do not ask for confirmation when the estimate is above $0.50
//
// Your API key is read from the environment variable OPENROUTER_API_KEY and
// is never printed or saved. Node 22, no dependencies.
//
// Test-only environment variables: OPENROUTER_BASE_URL (default
// https://openrouter.ai/api/v1), A03_TIMEOUT_MS (default 60000),
// A03_RETRY_BASE_MS (default 2000).

import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { checkSchema, checkConfig, REASONING_LEVELS } from "./fields.mjs";
import {
  A03_DIR,
  DEFAULT_RUNS_DIR,
  DEFAULT_LABELS,
  UserError,
  readJson,
  loadLabels,
  scoreRun,
  printSummary,
  runLogFor,
  listRuns,
  pct,
  usd,
  rel,
} from "./score.mjs";
import { FIELDS } from "./fields.mjs";

const DEFAULT_BASE_URL = "https://openrouter.ai/api/v1";
const BASE_URL = (process.env.OPENROUTER_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");
const TIMEOUT_MS = Number(process.env.A03_TIMEOUT_MS) || 60000;
const RETRY_BASE_MS = Number(process.env.A03_RETRY_BASE_MS ?? 2000);
const MAX_RETRIES = 3;
const CONFIRM_ABOVE_USD = 0.5;
const SETUP_URL = "https://www.gen-ai.startupengineer.io/sessions/02_agent_workbench/setup.html";
const RUNNER_VERSION = "a03-run 1.0";

// Prices (USD per million tokens, input / output) for models students may try
// with --model. Used only for the cost estimate; the real cost comes from OpenRouter.
const KNOWN_PRICES = {
  "anthropic/claude-haiku-5.5": [0.1, 0.5],
  "openai/gpt-5-nano": [0.05, 0.4],
  "deepseek/deepseek-v4-flash": [0.091, 0.182],
  "deepseek/deepseek-v4-pro": [0.955, 1.911],
  "anthropic/claude-sonnet-5.5": [2, 10],
  "anthropic/claude-opus-5.5": [4, 20],
};
// Rough extra output tokens per e-mail for the estimate.
const REASONING_EXTRA = { none: 0, low: 300, medium: 800, high: 2000 };

class FatalApiError extends Error {}

// ---------------------------------------------------------------------------
// Arguments
// ---------------------------------------------------------------------------

const HELP = `Usage: node a03/tools/run.mjs <label> [options]      e.g.  node a03/tools/run.mjs v1

Options:
  --only E03,E17        run only these e-mails (partial run)
  --repeat N            run the full set N times (<label>_r1 ... _rN) and show the spread
  --model <id>          another OpenRouter model for this run
  --reasoning <level>   none | low | medium | high
  --data <dir>          folder with the e-mails      (default a03/tasks/emails)
  --labels <file>       golden labels                (default a03/tasks/dev_labels.jsonl)
  --out <dir>           where run folders are saved  (default a03/output/runs)
  --pipeline <dir>      folder with prompt.md, schema.json, config.json (default a03/)
  --dry-run             show the exact request for the first e-mail; sends nothing
  --yes                 skip the confirmation question for runs above $${CONFIRM_ABOVE_USD.toFixed(2)}`;

function parseArgs(argv) {
  const a = { _: [] };
  const withValue = ["--only", "--repeat", "--model", "--reasoning", "--data", "--labels", "--out", "--pipeline"];
  for (let i = 0; i < argv.length; i++) {
    const x = argv[i];
    if (x === "--help" || x === "-h") a.help = true;
    else if (x === "--dry-run") a.dryRun = true;
    else if (x === "--yes" || x === "-y") a.yes = true;
    else if (withValue.includes(x)) {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith("--")) throw new UserError(`${x} needs a value.\n\n${HELP}`);
      a[x.slice(2)] = v;
      i++;
    } else if (x.startsWith("-")) throw new UserError(`Unknown option ${x}.\n\n${HELP}`);
    else a._.push(x);
  }
  return a;
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

function loadPipeline(dir) {
  const files = {
    prompt: path.join(dir, "prompt.md"),
    schema: path.join(dir, "schema.json"),
    config: path.join(dir, "config.json"),
  };
  let prompt;
  try {
    prompt = fs.readFileSync(files.prompt, "utf8");
  } catch {
    throw new UserError(`Cannot find your prompt: ${rel(files.prompt)}`);
  }
  if (!prompt.trim()) throw new UserError(`${rel(files.prompt)} is empty. Write your prompt into it first.`);
  const schema = readJson(files.schema, "schema.json");
  const config = readJson(files.config, "config.json");
  return { files, prompt, schema, config };
}

function loadEmails(dataDir, only) {
  let names;
  try {
    names = fs.readdirSync(dataDir).filter((n) => n.endsWith(".txt")).sort();
  } catch {
    throw new UserError(`Cannot find the e-mail folder: ${rel(dataDir)}`);
  }
  if (!names.length) throw new UserError(`No .txt e-mails found in ${rel(dataDir)}`);
  let emails = names.map((n) => ({ id: n.replace(/\.txt$/, ""), file: path.join(dataDir, n) }));
  if (only) {
    const want = only.split(/[,\s]+/).filter(Boolean).map((s) => s.toUpperCase());
    const known = new Set(emails.map((e) => e.id.toUpperCase()));
    const unknown = want.filter((w) => !known.has(w));
    if (unknown.length) throw new UserError(`--only: no e-mail called ${unknown.join(", ")} in ${rel(dataDir)}.`);
    emails = emails.filter((e) => want.includes(e.id.toUpperCase()));
  }
  for (const e of emails) e.text = fs.readFileSync(e.file, "utf8").trim();
  return emails;
}

function buildBody(ctx, email) {
  const body = {
    model: ctx.model,
    messages: [
      { role: "system", content: ctx.prompt },
      { role: "user", content: `<email id="${email.id}">\n${email.text}\n</email>` },
    ],
    response_format: {
      type: "json_schema",
      json_schema: { name: "email_extraction", strict: true, schema: ctx.schema },
    },
    provider: { require_parameters: true },
    reasoning: { effort: ctx.reasoning },
    max_tokens: ctx.config.max_tokens,
    usage: { include: true },
  };
  if (ctx.config.temperature !== undefined) body.temperature = ctx.config.temperature;
  return body;
}

function estimateCost(ctx, emails, times) {
  const fixed = ctx.prompt.length + JSON.stringify(ctx.schema).length + 200;
  let tokIn = 0;
  for (const e of emails) tokIn += (fixed + e.text.length) / 4;
  const tokOut = emails.length * (150 + (REASONING_EXTRA[ctx.reasoning] || 0));
  return ((tokIn * ctx.priceIn + tokOut * ctx.priceOut) / 1e6) * times;
}

// ---------------------------------------------------------------------------
// OpenRouter calls
// ---------------------------------------------------------------------------

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function apiMessage(json, text) {
  const m = json?.error?.message || json?.message || text || "";
  const raw = json?.error?.metadata?.raw;
  const s = String(m) + (raw ? ` (${String(raw).slice(0, 200)})` : "");
  return s.replace(/sk-or-[A-Za-z0-9-]+/g, "[key hidden]").slice(0, 400);
}

function fatalFor(status, msg, ctx) {
  if (status === 401) {
    return `OpenRouter rejected your API key (401: ${msg || "unauthorised"}).\nCheck your key with:  bash tools/check-setup.sh`;
  }
  if (status === 402) {
    return `Your key has no credit left (402: insufficient credits).\nCheck your spend with:  bash tools/check-setup.sh --usage   then e-mail the instructor.`;
  }
  const structured = /support the requested parameters|structured|response_format|json_schema/i.test(msg);
  if (status === 404 && structured) {
    return `No provider of "${ctx.model}" supports structured outputs (JSON schema) with these settings.\nOpenRouter said: ${msg}\nCheck the model name, or try another model, e.g.  --model openai/gpt-5-nano`;
  }
  if (status === 404) {
    return `OpenRouter does not know the model "${ctx.model}" (404: ${msg}).\nCheck the spelling of "model" in config.json or after --model.`;
  }
  if (status === 400) {
    return (
      `OpenRouter rejected the request (400): ${msg}\n` +
      (structured
        ? "The model or provider did not accept your schema for structured outputs. Check schema.json (types, enum, required, additionalProperties)."
        : "A setting in config.json or schema.json is probably not supported by this model.") +
      "\nTip: node a03/tools/run.mjs --dry-run shows the exact request."
    );
  }
  return null;
}

// One e-mail: up to MAX_RETRIES retries on 408/429/5xx, timeouts and network errors.
async function processEmail(ctx, email) {
  const body = buildBody(ctx, email);
  const rec = {
    id: email.id,
    valid_json: false,
    parsed: null,
    raw: null,
    error: null,
    note: null,
    finish_reason: null,
    provider: null,
    model: null,
    tokens: { prompt: 0, completion: 0, reasoning: 0, total: 0 },
    cost: null,
    latency_ms: null,
    attempts: 0,
  };
  let lastProblem = "";
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (ctx.abort) return null;
    rec.attempts = attempt + 1;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    const t0 = Date.now();
    let status = 0;
    let json = null;
    let text = "";
    let retryAfter = 0;
    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ctx.key}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://www.gen-ai.startupengineer.io",
          "X-Title": "gen-ai workbench a03",
        },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      status = res.status;
      retryAfter = Number(res.headers.get("retry-after")) || 0;
      text = await res.text();
      try {
        json = JSON.parse(text);
      } catch {
        json = null;
      }
    } catch (e) {
      status = -1;
      lastProblem = e.name === "AbortError" ? `no answer within ${Math.round(TIMEOUT_MS / 1000)} s (timeout)` : `network error (${e.cause?.code || e.message})`;
    } finally {
      clearTimeout(timer);
    }
    rec.latency_ms = Date.now() - t0;
    ctx.sent += 1;

    // OpenRouter can also report an error inside a 200 response
    if (status === 200 && json && json.error) status = Number(json.error.code) || 502;
    if (status === 200 && json?.choices?.[0]?.error) status = Number(json.choices[0].error.code) || 502;

    if (status === 200 && json) {
      fillFromResponse(rec, json);
      return rec;
    }
    if (status !== -1) {
      const msg = apiMessage(json, text);
      const fatal = fatalFor(status, msg, ctx);
      if (fatal) throw new FatalApiError(fatal);
      lastProblem = status === 200 ? "answer was not readable JSON from OpenRouter" : `HTTP ${status}${msg ? ": " + msg : ""}`;
      const retryable = status === 200 || status === 408 || status === 429 || status >= 500;
      if (!retryable) {
        rec.error = lastProblem;
        return rec;
      }
    }
    if (attempt < MAX_RETRIES) {
      const wait = Math.min(30000, Math.max(retryAfter * 1000, RETRY_BASE_MS * 2 ** attempt));
      await sleep(wait);
    }
  }
  rec.error = `gave up after ${MAX_RETRIES + 1} attempts: ${lastProblem}`;
  return rec;
}

function fillFromResponse(rec, json) {
  const choice = json.choices?.[0] || {};
  const msg = choice.message || {};
  let content = msg.content;
  if (Array.isArray(content)) content = content.map((p) => (typeof p === "string" ? p : p?.text || "")).join("");
  rec.raw = typeof content === "string" ? content : content == null ? "" : JSON.stringify(content);
  rec.finish_reason = choice.finish_reason || choice.native_finish_reason || null;
  rec.provider = json.provider || null;
  rec.model = json.model || null;
  const u = json.usage || {};
  rec.tokens = {
    prompt: u.prompt_tokens || 0,
    completion: u.completion_tokens || 0,
    reasoning: u.completion_tokens_details?.reasoning_tokens || u.reasoning_tokens || 0,
    total: u.total_tokens || (u.prompt_tokens || 0) + (u.completion_tokens || 0),
  };
  rec.cost = typeof u.cost === "number" ? u.cost : null;
  let t = rec.raw.trim();
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) t = fence[1];
  if (!t) {
    rec.note =
      rec.finish_reason === "length"
        ? "empty answer: max_tokens was used up (reasoning?) before the JSON was written"
        : "empty answer";
    return;
  }
  try {
    const parsed = JSON.parse(t);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      rec.parsed = parsed;
      rec.valid_json = true;
    } else rec.note = "answer is JSON, but not one object with fields";
  } catch {
    rec.note = rec.finish_reason === "length" ? "answer cut off at max_tokens (invalid JSON)" : "invalid JSON";
  }
}

async function runPool(ctx, emails, onDone) {
  const results = new Array(emails.length);
  let next = 0;
  let fatal = null;
  const worker = async () => {
    while (!ctx.abort && next < emails.length) {
      const i = next++;
      try {
        results[i] = await processEmail(ctx, emails[i]);
        if (results[i]) onDone();
      } catch (e) {
        ctx.abort = true;
        fatal = fatal || e;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(ctx.concurrency, emails.length) }, worker));
  if (fatal) throw fatal;
  return results;
}

// ---------------------------------------------------------------------------
// One run
// ---------------------------------------------------------------------------

async function runOnce(ctx, label, emails, repeatInfo) {
  const runDir = path.join(ctx.outDir, label);
  fs.mkdirSync(path.join(runDir, "snapshot"), { recursive: true });
  const startedAt = new Date().toISOString();
  const tty = process.stdout.isTTY;
  let done = 0;
  const show = () => {
    if (tty) process.stdout.write(`\r  ${label}: ${done}/${emails.length} e-mails done`);
  };
  console.log(`\nRunning ${label}: ${emails.length} e-mails, ${ctx.model}, reasoning ${ctx.reasoning}, ${ctx.concurrency} at a time ...`);
  show();
  ctx.abort = false;
  let results;
  try {
    results = await runPool(ctx, emails, () => {
      done += 1;
      show();
    });
  } catch (e) {
    if (tty) process.stdout.write("\n");
    fs.rmSync(runDir, { recursive: true, force: true });
    if (e instanceof FatalApiError) {
      e.message += `\n\nThe run was stopped and nothing was saved; you can use the label "${label}" again.`;
    }
    throw e;
  }
  if (tty) process.stdout.write("\n");
  else console.log(`  ${label}: ${done}/${emails.length} e-mails done`);

  fs.writeFileSync(path.join(runDir, "predictions.jsonl"), results.map((r) => JSON.stringify(r)).join("\n") + "\n");
  fs.copyFileSync(ctx.files.prompt, path.join(runDir, "snapshot", "prompt.md"));
  fs.copyFileSync(ctx.files.schema, path.join(runDir, "snapshot", "schema.json"));
  fs.copyFileSync(ctx.files.config, path.join(runDir, "snapshot", "config.json"));
  const meta = {
    label,
    version: repeatInfo ? repeatInfo.base : label,
    repeat: repeatInfo ? `${repeatInfo.i} of ${repeatInfo.n}` : null,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
    model: ctx.model,
    reasoning: ctx.reasoning,
    overrides: ctx.overrides,
    max_tokens: ctx.config.max_tokens,
    concurrency: ctx.concurrency,
    price_in_per_m: ctx.priceIn,
    price_out_per_m: ctx.priceOut,
    data_dir: ctx.dataDir,
    labels_path: ctx.labelsPath,
    n_emails: emails.length,
    only: ctx.only,
    custom_base_url: BASE_URL !== DEFAULT_BASE_URL,
    runner: RUNNER_VERSION,
  };
  fs.writeFileSync(path.join(runDir, "run_meta.json"), JSON.stringify(meta, null, 2) + "\n");

  const noAnswer = results.filter((r) => r.error).length;
  if (noAnswer === results.length) {
    console.log(`\nNone of the ${results.length} e-mails got an answer. Last problem: ${results[0].error}`);
    console.log("Check your internet connection and try again later (with a new label).");
  }
  try {
    const s = scoreRun(runDir, { labels: ctx.labelsPath });
    printSummary(s, runDir);
    return s;
  } catch (e) {
    if (e instanceof UserError) {
      console.log(`\nThe answers are saved in ${rel(runDir)}/, but scoring failed:\n${e.message}`);
      return null;
    }
    throw e;
  }
}

function suggestLabel(outDir, label) {
  for (const c of "bcdefghijklmnopqrstuvwxyz") {
    if (!fs.existsSync(path.join(outDir, label + c))) return label + c;
  }
  return label + "_new";
}

function printSpread(scores) {
  const names = scores.map((s) => s.label).join(", ");
  const pad = (s, n) => String(s).padStart(n);
  const L = [];
  L.push(`\nSpread over ${scores.length} repeats (${names}): same prompt, schema and settings.`);
  L.push(`  ${"Field".padEnd(22)}${pad("min", 8)}${pad("mean", 8)}${pad("max", 8)}`);
  const row = (name, xs) => {
    const mn = Math.min(...xs);
    const mx = Math.max(...xs);
    const avg = xs.reduce((a, b) => a + b, 0) / xs.length;
    L.push(`  ${name.padEnd(22)}${pad(pct(mn), 8)}${pad(pct(avg), 8)}${pad(pct(mx), 8)}`);
    return mx - mn;
  };
  for (const f of FIELDS) row(f, scores.map((s) => s.fields[f].accuracy));
  L.push("  " + "-".repeat(46));
  const range = row("Mean field accuracy", scores.map((s) => s.mean_field_accuracy));
  const costs = scores.map((s) => s.cost_per_1000).filter((x) => typeof x === "number");
  L.push(`\nThe runs differ by ${(range * 100).toFixed(1)} points in mean field accuracy. A change smaller than that may be noise.`);
  if (costs.length) L.push(`Cost per 1,000 e-mails: ${usd(Math.min(...costs), 2)} to ${usd(Math.max(...costs), 2)}.`);
  console.log(L.join("\n"));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) return console.log(HELP);

  const label = args._[0];
  if (args._.length > 1) throw new UserError(`Only one label, please (got: ${args._.join(" ")}).\n\n${HELP}`);
  if (!label && !args.dryRun) throw new UserError(`Please give the run a name (a label), e.g.  node a03/tools/run.mjs v1\n\n${HELP}`);
  if (label && !/^[A-Za-z0-9][A-Za-z0-9._-]{0,39}$/.test(label)) {
    throw new UserError(`"${label}" is not a good run name. Use letters, digits, - or _, e.g. v2 or v2_fewshot.`);
  }
  let repeat = 1;
  if (args.repeat !== undefined) {
    repeat = Number(args.repeat);
    if (!Number.isInteger(repeat) || repeat < 1 || repeat > 10) throw new UserError("--repeat needs a whole number from 1 to 10, e.g. --repeat 2");
  }
  if (repeat > 1 && args.only) throw new UserError("--repeat works only with full runs; leave out --only.");
  if (args.reasoning !== undefined && !REASONING_LEVELS.includes(args.reasoning)) {
    throw new UserError(`--reasoning must be one of: ${REASONING_LEVELS.join(", ")}`);
  }

  const pipelineDir = path.resolve(args.pipeline || A03_DIR);
  const p = loadPipeline(pipelineDir);

  const sc = checkSchema(p.schema);
  const cc = checkConfig(p.config);
  for (const w of [...sc.warnings, ...cc.warnings]) console.log(`  [note] ${w}`);
  const errs = [...sc.errors, ...cc.errors];
  if (errs.length) {
    throw new UserError(
      `Please fix ${errs.length === 1 ? "this problem" : "these problems"} first (nothing was sent):\n` +
        errs.map((e) => `  - ${e}`).join("\n") +
        `\n\nTip: git diff a03/schema.json a03/config.json shows what you changed since your last commit.`
    );
  }

  const model = args.model || p.config.model;
  const reasoning = args.reasoning || p.config.reasoning;
  let [priceIn, priceOut] = [p.config.price_in_per_m ?? 0, p.config.price_out_per_m ?? 0];
  if (args.model && args.model !== p.config.model) {
    if (KNOWN_PRICES[args.model]) [priceIn, priceOut] = KNOWN_PRICES[args.model];
    else console.log(`  [note] No price known for ${args.model}; the estimate uses the prices in config.json and may be far off.`);
  }
  const overrides = {};
  if (args.model) overrides.model = args.model;
  if (args.reasoning) overrides.reasoning = args.reasoning;

  const dataDir = path.resolve(args.data || path.join(A03_DIR, "tasks", "emails"));
  const labelsPath = path.resolve(args.labels || DEFAULT_LABELS);
  const outDir = path.resolve(args.out || DEFAULT_RUNS_DIR);
  const emails = loadEmails(dataDir, args.only);

  const ctx = {
    prompt: p.prompt,
    schema: p.schema,
    config: p.config,
    files: p.files,
    model,
    reasoning,
    priceIn,
    priceOut,
    overrides,
    concurrency: p.config.concurrency || 4,
    dataDir,
    labelsPath,
    outDir,
    only: args.only ? emails.map((e) => e.id) : null,
    key: null,
    sent: 0,
    abort: false,
  };

  const estimate = estimateCost(ctx, emails, repeat);

  if (args.dryRun) {
    const body = buildBody(ctx, emails[0]);
    console.log("DRY RUN: nothing is sent, nothing costs money.\n");
    console.log(`This is the exact request for ${emails[0].id} (your API key travels separately in a header and is never shown):\n`);
    console.log(`POST ${BASE_URL}/chat/completions`);
    console.log(JSON.stringify(body, null, 2));
    console.log(emails.length === 1
      ? `\nWithout --only, the same request is sent for every e-mail; only the <email> part changes.`
      : `\nThe same request is sent for each of the ${emails.length} e-mails; only the <email> part changes.`);
    console.log(`Estimated cost: about ${usd(estimate)}${repeat > 1 ? ` for ${repeat} runs` : ""} (rough: characters / 4 x price).`);
    return;
  }

  // labels: needed for scoring, check before spending money
  if (!fs.existsSync(labelsPath)) throw new UserError(`Cannot find the label file: ${rel(labelsPath)}`);
  const labels = loadLabels(labelsPath);
  const unlabelled = emails.filter((e) => !labels.has(e.id)).map((e) => e.id);
  if (unlabelled.length) console.log(`  [note] No label for ${unlabelled.join(", ")}: answered, but not scored.`);

  // no overwrite
  const labelsToRun = repeat > 1 ? Array.from({ length: repeat }, (_, i) => `${label}_r${i + 1}`) : [label];
  for (const l of labelsToRun) {
    if (fs.existsSync(path.join(outDir, l))) {
      throw new UserError(
        `A run called "${l}" already exists in ${rel(outDir)}. Runs are never overwritten, so your history stays intact.\n` +
          `Use a new name, e.g.  node a03/tools/run.mjs ${suggestLabel(outDir, label)}${repeat > 1 ? ` --repeat ${repeat}` : ""}\n` +
          `Existing runs: ${listRuns(outDir).join(", ")}`
      );
    }
  }

  // key
  const key = (process.env.OPENROUTER_API_KEY || "").trim();
  if (!key) {
    throw new UserError(
      "OPENROUTER_API_KEY is not set, so the runner cannot reach OpenRouter.\n" +
        "Fix: add the key as a Codespaces secret for this repository, then stop and restart the Codespace.\n" +
        `Setup page: ${SETUP_URL}\nCheck with:  bash tools/check-setup.sh`
    );
  }
  ctx.key = key;
  if (BASE_URL !== DEFAULT_BASE_URL) console.log(`  [note] Using OPENROUTER_BASE_URL=${BASE_URL}`);

  // cost confirmation
  console.log(`Estimated cost: about ${usd(estimate)} for ${emails.length} e-mails${repeat > 1 ? ` x ${repeat} runs` : ""} (rough: characters / 4 x price).`);
  if (estimate > CONFIRM_ABOVE_USD && !args.yes) {
    if (!process.stdin.isTTY) {
      throw new UserError(`The estimate is above $${CONFIRM_ABOVE_USD.toFixed(2)}. Add --yes if you really want to run this.`);
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ans = await rl.question(`This is more than $${CONFIRM_ABOVE_USD.toFixed(2)}. Continue? (y/N) `);
    rl.close();
    if (!/^y(es)?$/i.test(ans.trim())) {
      console.log("Stopped. Nothing was sent.");
      return;
    }
  }

  fs.mkdirSync(outDir, { recursive: true });
  const all = [];
  for (let i = 0; i < labelsToRun.length; i++) {
    const s = await runOnce(ctx, labelsToRun[i], emails, repeat > 1 ? { base: label, i: i + 1, n: repeat } : null);
    if (s) all.push(s);
  }
  if (repeat > 1 && all.length > 1) printSpread(all);
  const log = runLogFor(path.join(outDir, labelsToRun[0]));
  console.log(`\nNext: write your hypothesis and decision in ${rel(log)}`);
}

main().catch((e) => {
  if (e instanceof UserError) {
    console.error("\n" + e.message);
    process.exit(1);
  }
  if (e instanceof FatalApiError) {
    console.error("\n" + e.message);
    process.exit(2);
  }
  console.error("\nUnexpected error in run.mjs. Please post this message in the Teams stuck thread:\n" + (e.stack || e));
  process.exit(3);
});
