#!/usr/bin/env node
// score.mjs: scores a run of run.mjs against the golden labels.
//
// Usage (from the repository root, or from anywhere):
//   node a03/tools/score.mjs v2                  # (re-)score run v2
//   node a03/tools/score.mjs --compare v1 v2     # what changed between two runs
//   node a03/tools/score.mjs a03/output/runs/v2 --labels a03/tasks/dev_labels.jsonl
//
// Writes into the run folder: scores.md (readable table), scores.json
// (machine-readable), errors.md (every wrong field, grouped by field).
// Appends one row to a03/run_log.md (only once per run label).
//
// Node 22, no dependencies.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { FIELDS, SHORT, DEV_LABELS_SHA256, compareField } from "./fields.mjs";

const TOOLS_DIR = path.dirname(fileURLToPath(import.meta.url));
export const A03_DIR = path.resolve(TOOLS_DIR, "..");
export const DEFAULT_RUNS_DIR = path.join(A03_DIR, "output", "runs");
export const DEFAULT_LABELS = path.join(A03_DIR, "tasks", "dev_labels.jsonl");
export const DEFAULT_RUN_LOG = path.join(A03_DIR, "run_log.md");

export const RUN_LOG_HEADER =
  "| label | date-time | model | reasoning | " +
  FIELDS.map((f) => SHORT[f]).join(" | ") +
  " | mean | all-correct | valid JSON | $ run | $ / 1,000 | hypothesis | change | keep? |";
const RUN_LOG_SEP = "|" + RUN_LOG_HEADER.split("|").slice(1, -1).map(() => "---").join("|") + "|";

export class UserError extends Error {}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

export const pct = (x) => (x === null || x === undefined || Number.isNaN(x) ? "n/a" : (x * 100).toFixed(1) + "%");
export const usd = (x, d = 4) => (x === null || x === undefined || Number.isNaN(x) ? "n/a" : "$" + x.toFixed(d));
// Paths are shown relative to the repository root ("a03/output/runs/v1"),
// the way the README writes them; paths outside the repository in full.
const REPO_ROOT = path.resolve(A03_DIR, "..");
export const rel = (p) => {
  const abs = path.resolve(p);
  const r = path.relative(REPO_ROOT, abs);
  return r === "" ? "." : r.startsWith("..") || path.isAbsolute(r) ? abs : r;
};

export function readJson(file, what) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    throw new UserError(`Cannot find ${what}: ${rel(file)}`);
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    throw new UserError(`${what} (${rel(file)}) is not valid JSON: ${e.message}\nTip: a missing comma or quote is the usual cause. Ask your agent to check the file.`);
  }
}

export function readJsonl(file, what) {
  let text;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    throw new UserError(`Cannot find ${what}: ${rel(file)}`);
  }
  const out = [];
  text.split(/\r?\n/).forEach((line, i) => {
    if (!line.trim()) return;
    try {
      out.push(JSON.parse(line));
    } catch (e) {
      throw new UserError(`${what} (${rel(file)}), line ${i + 1} is not valid JSON: ${e.message}`);
    }
  });
  return out;
}

export function loadLabels(file) {
  const rows = readJsonl(file, "label file");
  const map = new Map();
  for (const r of rows) {
    if (!r || typeof r.id !== "string") throw new UserError(`Every line in ${rel(file)} needs an "id".`);
    map.set(r.id, r);
  }
  return map;
}

export function sha256File(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

// Integrity check of the shipped dev labels. Returns true (edited), false
// (unchanged) or null (not checked: other label file, or hash not set yet).
export function labelsModified(labelsPath) {
  if (DEV_LABELS_SHA256 === "TBD") return null;
  if (path.resolve(labelsPath) !== path.resolve(DEFAULT_LABELS)) return null;
  return sha256File(labelsPath) !== DEV_LABELS_SHA256;
}

const median = (xs) => {
  const s = xs.filter((x) => typeof x === "number").sort((a, b) => a - b);
  if (!s.length) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

const cell = (v) => {
  const s = v === undefined ? "(missing)" : JSON.stringify(v);
  return s.replace(/\|/g, "\\|").replace(/\n/g, " ");
};

function pad(s, n, right = false) {
  s = String(s);
  return right ? s.padStart(n) : s.padEnd(n);
}

// Path of the run log that belongs to a run folder: a03/run_log.md for the
// normal runs folder, otherwise run_log.md next to the run folders (--out).
export function runLogFor(runDir) {
  const parent = path.resolve(runDir, "..");
  return parent === path.resolve(DEFAULT_RUNS_DIR) ? DEFAULT_RUN_LOG : path.join(parent, "run_log.md");
}

export function resolveRunDir(arg, runsDir = DEFAULT_RUNS_DIR) {
  const candidates = [path.resolve(arg), path.join(runsDir, arg)];
  for (const c of candidates) if (fs.existsSync(path.join(c, "predictions.jsonl"))) return c;
  // "v3" after "--repeat": use v3_r1
  const r1 = path.join(runsDir, `${arg}_r1`);
  if (fs.existsSync(path.join(r1, "predictions.jsonl"))) {
    console.log(`(No run "${arg}"; using its first repeat "${arg}_r1".)`);
    return r1;
  }
  throw new UserError(
    `No run called "${arg}" found (looked in ${rel(runsDir)}).\nExisting runs: ${listRuns(runsDir).join(", ") || "none yet"}`
  );
}

export function listRuns(runsDir = DEFAULT_RUNS_DIR) {
  try {
    return fs
      .readdirSync(runsDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => d.name)
      .sort();
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

export function scoreRun(runDir, opts = {}) {
  const metaPath = path.join(runDir, "run_meta.json");
  const meta = fs.existsSync(metaPath) ? readJson(metaPath, "run_meta.json") : {};
  const label = meta.label || path.basename(runDir);
  let labelsPath = opts.labels ? path.resolve(opts.labels) : meta.labels_path || DEFAULT_LABELS;
  if (!fs.existsSync(labelsPath)) {
    if (opts.labels) throw new UserError(`Cannot find the label file: ${rel(labelsPath)}`);
    labelsPath = DEFAULT_LABELS;
  }
  const labels = loadLabels(labelsPath);
  const preds = readJsonl(path.join(runDir, "predictions.jsonl"), "predictions.jsonl");
  const cfgPath = path.join(runDir, "snapshot", "config.json");
  const cfg = fs.existsSync(cfgPath) ? readJson(cfgPath, "snapshot/config.json") : {};
  const priceIn = meta.price_in_per_m ?? cfg.price_in_per_m ?? 0;
  const priceOut = meta.price_out_per_m ?? cfg.price_out_per_m ?? 0;

  const perField = Object.fromEntries(FIELDS.map((f) => [f, { correct: 0, total: 0 }]));
  const errors = Object.fromEntries(FIELDS.map((f) => [f, []]));
  const perEmail = [];
  const noLabel = [];
  const invalid = [];
  const apiErrors = [];
  let nullFalse = 0;
  let nullMissed = 0;

  for (const p of preds) {
    const gold = labels.get(p.id);
    if (!gold) {
      noLabel.push(p.id);
      continue;
    }
    const valid = p.valid_json === true && p.parsed && typeof p.parsed === "object" && !Array.isArray(p.parsed);
    if (!valid) {
      invalid.push(p);
      if (p.error) apiErrors.push(p.id);
    }
    const fields = {};
    for (const f of FIELDS) {
      perField[f].total += 1;
      let ok = false;
      let note = "";
      if (valid) {
        ({ correct: ok, note } = compareField(f, gold[f], p.parsed[f]));
      } else {
        note = p.error ? "no answer from OpenRouter" : "invalid JSON";
      }
      fields[f] = ok;
      if (ok) perField[f].correct += 1;
      else {
        if (note.includes("invented")) nullFalse += 1;
        if (note.includes("missed")) nullMissed += 1;
        if (valid) errors[f].push({ id: p.id, expected: gold[f], predicted: p.parsed[f], note });
      }
    }
    perEmail.push({ id: p.id, valid_json: valid, all_correct: FIELDS.every((f) => fields[f]), fields });
  }

  const n = perEmail.length;
  if (n === 0) {
    throw new UserError(
      `None of the e-mails in run "${label}" has a label in ${rel(labelsPath)}. Check --labels.`
    );
  }
  for (const f of FIELDS) perField[f].accuracy = perField[f].correct / perField[f].total;
  const mean = FIELDS.reduce((s, f) => s + perField[f].accuracy, 0) / FIELDS.length;

  // cost: OpenRouter's usage.cost if present, else tokens x config prices
  let cost = 0;
  let fromApi = 0;
  const tok = { prompt: 0, completion: 0, reasoning: 0 };
  for (const p of preds) {
    const t = p.tokens || {};
    tok.prompt += t.prompt || 0;
    tok.completion += t.completion || 0;
    tok.reasoning += t.reasoning || 0;
    if (typeof p.cost === "number") {
      cost += p.cost;
      fromApi += 1;
    } else {
      cost += ((t.prompt || 0) * priceIn + (t.completion || 0) * priceOut) / 1e6;
    }
  }
  const costSource = fromApi === preds.length ? "openrouter" : fromApi === 0 ? "estimate from tokens x config prices" : "mixed";
  const modified = labelsModified(labelsPath);

  const scores = {
    label,
    scored_at: new Date().toISOString(),
    model: meta.model || cfg.model || "unknown",
    reasoning: meta.reasoning || cfg.reasoning || "unknown",
    partial: Boolean(meta.only && meta.only.length),
    n_scored: n,
    n_requests: preds.length,
    n_labels: labels.size,
    fields: perField,
    mean_field_accuracy: mean,
    all_correct_rate: perEmail.filter((e) => e.all_correct).length / n,
    valid_json_rate: perEmail.filter((e) => e.valid_json).length / n,
    api_errors: apiErrors.length,
    null_errors: { invented: nullFalse, missed: nullMissed },
    tokens: tok,
    cost_run: cost,
    cost_per_1000: preds.length ? (cost / preds.length) * 1000 : null,
    cost_source: costSource,
    median_latency_ms: median(preds.map((p) => p.latency_ms)),
    labels_path: labelsPath,
    labels_sha256: sha256File(labelsPath),
    labels_modified: modified,
    unlabelled_ids: noLabel,
    per_email: perEmail,
  };

  fs.writeFileSync(path.join(runDir, "scores.json"), JSON.stringify(scores, null, 2) + "\n");
  fs.writeFileSync(path.join(runDir, "scores.md"), scoresMarkdown(scores));
  fs.writeFileSync(path.join(runDir, "errors.md"), errorsMarkdown(scores, errors, invalid));

  if (opts.log !== false) scores.run_log = appendRunLog(runLogFor(runDir), scores);
  return scores;
}

function summaryLines(s) {
  return [
    ["Mean field accuracy", pct(s.mean_field_accuracy), ""],
    ["All 7 fields correct", pct(s.all_correct_rate), `(${s.per_email.filter((e) => e.all_correct).length}/${s.n_scored} e-mails)`],
    ["Valid JSON", pct(s.valid_json_rate), `(${s.per_email.filter((e) => e.valid_json).length}/${s.n_scored})`],
    ["Cost of this run", usd(s.cost_run), `(${usd(s.cost_per_1000, 2)} per 1,000 e-mails)`],
  ];
}

function scoresMarkdown(s) {
  const L = [];
  L.push(`# Scores: run ${s.label}`, "");
  L.push(`Model \`${s.model}\` · reasoning \`${s.reasoning}\` · ${s.n_scored} e-mails scored${s.partial ? " (partial run: not comparable with full runs)" : ""} · scored ${s.scored_at.slice(0, 16).replace("T", " ")} UTC`, "");
  if (s.labels_modified) L.push("**Warning: the label file was edited. These scores are not comparable; grading uses the original labels.**", "");
  L.push("| Field | Accuracy | Correct |", "|:--|--:|--:|");
  for (const f of FIELDS) L.push(`| ${f} | ${pct(s.fields[f].accuracy)} | ${s.fields[f].correct}/${s.fields[f].total} |`);
  L.push("", "| Metric | Value |", "|:--|--:|");
  for (const [k, v, extra] of summaryLines(s)) L.push(`| ${k} | ${v} ${extra} |`);
  L.push(`| Null errors | ${s.null_errors.invented} invented, ${s.null_errors.missed} missed |`);
  L.push(`| Tokens (prompt / completion / of which reasoning) | ${s.tokens.prompt} / ${s.tokens.completion} / ${s.tokens.reasoning} |`);
  L.push(`| Cost source | ${s.cost_source} |`);
  L.push(`| Median latency | ${s.median_latency_ms === null ? "n/a" : (s.median_latency_ms / 1000).toFixed(1) + " s"} |`);
  if (s.api_errors) L.push(`| E-mails without an answer (API error) | ${s.api_errors} |`);
  L.push("", "Details of every wrong field: `errors.md` in this folder.", "");
  return L.join("\n");
}

function errorsMarkdown(s, errors, invalid) {
  const L = [];
  L.push(`# Errors: run ${s.label}`, "");
  L.push(
    `Every field that does not match the label, grouped by field. Values are shown as JSON: \`null\` = no value, \`"null"\` = the text "null". ` +
      `"NULL ERROR" marks a value where the label is empty (invented) or a missing value where the label has one (missed).`,
    ""
  );
  L.push(`Mean field accuracy ${pct(s.mean_field_accuracy)} · ${s.n_scored} e-mails · model \`${s.model}\` · reasoning \`${s.reasoning}\``, "");
  if (invalid.length) {
    L.push(`## No usable answer (${invalid.length} e-mails, all 7 fields count as wrong)`, "");
    L.push("| id | problem | raw answer (first 200 characters) |", "|:--|:--|:--|");
    for (const p of invalid) {
      const raw = typeof p.raw === "string" ? p.raw.slice(0, 200) : "";
      L.push(`| ${p.id} | ${(p.error || p.note || "invalid JSON").replace(/\|/g, "\\|")} | ${raw.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ") || "(empty)"} |`);
    }
    L.push("");
  }
  for (const f of FIELDS) {
    const list = errors[f];
    const wrongTotal = s.fields[f].total - s.fields[f].correct;
    L.push(`## ${f}: ${wrongTotal} wrong of ${s.fields[f].total} (accuracy ${pct(s.fields[f].accuracy)})`, "");
    if (!list.length) {
      L.push(wrongTotal ? "Only e-mails without a usable answer (see above)." : "No errors.", "");
      continue;
    }
    L.push("| id | expected (label) | predicted (model) | note |", "|:--|:--|:--|:--|");
    for (const e of list) L.push(`| ${e.id} | ${cell(e.expected)} | ${cell(e.predicted)} | ${e.note} |`);
    L.push("");
  }
  return L.join("\n");
}

// Appends one row per run label to run_log.md (never twice for the same label).
export function appendRunLog(logPath, s) {
  let text = fs.existsSync(logPath) ? fs.readFileSync(logPath, "utf8") : "";
  if (!text.includes("| label | date-time |")) {
    text = (text ? text.replace(/\n*$/, "\n\n") : "# Run log\n\n") + RUN_LOG_HEADER + "\n" + RUN_LOG_SEP + "\n";
    fs.writeFileSync(logPath, text);
  }
  const exists = text.split("\n").some((line) => {
    const c = line.split("|");
    return c.length > 2 && c[1].trim().split(" ")[0] === s.label;
  });
  if (exists) return { path: logPath, appended: false };
  // Copy the "Hypothesis:" / "Change:" lines written before the run into the
  // row and empty them again (full runs only; partial runs leave them alone).
  let hyp = "";
  let chg = "";
  const tableStart = text.indexOf("| label | date-time |");
  let head = text.slice(0, tableStart);
  const tail = text.slice(tableStart);
  const repeatN = Number((s.label.match(/_r(\d+)$/) || [])[1] || 0);
  if (!s.partial && repeatN <= 1) {
    const grab = (name) => {
      const re = new RegExp(`^(${name}:)[ \\t]*(.*)$`, "m");
      const m = head.match(re);
      if (!m) return "";
      head = head.replace(re, "$1 ");
      return m[2].trim().replace(/\|/g, "/");
    };
    hyp = grab("Hypothesis");
    chg = grab("Change");
    text = head + tail;
  } else if (repeatN > 1) {
    hyp = `repeat of ${s.label.replace(/_r\d+$/, "")}_r1`;
  }
  let labelCell = s.label;
  if (s.partial) labelCell += ` (partial ${s.n_scored}/${s.n_labels})`;
  if (s.labels_modified) labelCell += " (LABELS EDITED: not comparable)";
  const now = new Date();
  const two = (x) => String(x).padStart(2, "0");
  const dt = `${now.getFullYear()}-${two(now.getMonth() + 1)}-${two(now.getDate())} ${two(now.getHours())}:${two(now.getMinutes())}`;
  const row = [
    labelCell,
    dt,
    s.model,
    s.reasoning,
    ...FIELDS.map((f) => pct(s.fields[f].accuracy)),
    pct(s.mean_field_accuracy),
    pct(s.all_correct_rate),
    pct(s.valid_json_rate),
    usd(s.cost_run),
    usd(s.cost_per_1000, 2),
    hyp,
    chg,
    "",
  ];
  const line = "| " + row.join(" | ") + " |";
  fs.writeFileSync(logPath, text.replace(/\n*$/, "\n") + line + "\n");
  return { path: logPath, appended: true };
}

// ---------------------------------------------------------------------------
// Terminal output
// ---------------------------------------------------------------------------

export function printSummary(s, runDir) {
  const out = [];
  out.push("");
  out.push(`Run ${s.label}  ·  ${s.n_scored} e-mails${s.partial ? " (partial)" : ""}  ·  ${s.model}  ·  reasoning ${s.reasoning}`);
  if (s.labels_modified) {
    out.push("");
    out.push("  WARNING: tasks/dev_labels.jsonl was edited. Scores are not comparable; grading uses the original labels.");
  }
  out.push("");
  out.push(`  ${pad("Field", 15)}${pad("Accuracy", 9, true)}   Correct`);
  for (const f of FIELDS) {
    out.push(`  ${pad(f, 15)}${pad(pct(s.fields[f].accuracy), 9, true)}   ${s.fields[f].correct}/${s.fields[f].total}`);
  }
  out.push("  " + "-".repeat(42));
  for (const [k, v, extra] of summaryLines(s)) out.push(`  ${pad(k, 22)}${pad(v, 8, true)}   ${extra}`);
  if (s.null_errors.invented || s.null_errors.missed) {
    out.push(`  ${pad("Null errors", 22)}${pad(s.null_errors.invented + s.null_errors.missed, 8, true)}   (${s.null_errors.invented} invented, ${s.null_errors.missed} missed)`);
  }
  if (s.api_errors) {
    out.push("");
    out.push(`  Note: ${s.api_errors} e-mail(s) got no answer from OpenRouter (rate limit, timeout or server error).`);
    out.push("  Their fields count as wrong. Run again with a new label when OpenRouter is calmer.");
  }
  if (s.cost_source !== "openrouter") out.push(`  (cost: ${s.cost_source})`);
  out.push("");
  out.push(`Saved: ${rel(runDir)}/  (scores.md, errors.md, predictions.jsonl)`);
  if (s.run_log) {
    out.push(
      s.run_log.appended ? `Added a row to ${rel(s.run_log.path)}` : `${rel(s.run_log.path)} already has a row for ${s.label} (not added again)`
    );
  }
  console.log(out.join("\n"));
}

// ---------------------------------------------------------------------------
// Compare two runs
// ---------------------------------------------------------------------------

function loadScores(runDir) {
  const p = path.join(runDir, "scores.json");
  if (fs.existsSync(p)) return readJson(p, "scores.json");
  return scoreRun(runDir, { log: false });
}

// Runs that are repeats of the same version: v3_r1, v3_r2, ... (also finds
// them when given "v3" or "v3_r2").
export function findRepeats(runDir) {
  const parent = path.dirname(runDir);
  const base = path.basename(runDir).replace(/_r\d+$/, "");
  const re = new RegExp("^" + base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "_r\\d+$");
  return listRuns(parent)
    .filter((n) => re.test(n) && fs.existsSync(path.join(parent, n, "predictions.jsonl")))
    .map((n) => ({ name: n, scores: loadScores(path.join(parent, n)) }))
    .filter((r) => !r.scores.partial);
}

export function spreadOf(repeats) {
  const means = repeats.map((r) => r.scores.mean_field_accuracy);
  return { min: Math.min(...means), max: Math.max(...means), range: Math.max(...means) - Math.min(...means) };
}

export function compareRuns(argA, argB, runsDir = DEFAULT_RUNS_DIR) {
  const dirA = resolveRunDir(argA, runsDir);
  const dirB = resolveRunDir(argB, runsDir);
  const A = loadScores(dirA);
  const B = loadScores(dirB);
  const ea = new Map(A.per_email.map((e) => [e.id, e]));
  const common = B.per_email.filter((e) => ea.has(e.id)).map((e) => e.id).sort();
  if (!common.length) throw new UserError(`Runs ${A.label} and ${B.label} have no e-mails in common.`);
  const eb = new Map(B.per_email.map((e) => [e.id, e]));
  const out = [];
  out.push("");
  out.push(`Compare ${A.label} -> ${B.label}  (${common.length} e-mails in both runs)`);
  if (A.partial || B.partial || common.length !== A.per_email.length || common.length !== B.per_email.length) {
    out.push("  Note: at least one run is partial or the runs cover different e-mails. Only the common e-mails are compared.");
  }
  if (A.labels_sha256 && B.labels_sha256 && A.labels_sha256 !== B.labels_sha256) {
    out.push("  WARNING: the two runs were scored with different label files. The comparison is not fair.");
  }
  out.push("");
  const w = Math.max(8, A.label.length + 1, B.label.length + 1);
  out.push(`  ${pad("Field", 15)}${pad(A.label, w, true)}${pad(B.label, w, true)}${pad("change", 9, true)}   fixed  broken`);
  let fixedTotal = 0;
  let brokenTotal = 0;
  const details = [];
  let meanA = 0;
  let meanB = 0;
  for (const f of FIELDS) {
    const fixed = common.filter((id) => !ea.get(id).fields[f] && eb.get(id).fields[f]);
    const broken = common.filter((id) => ea.get(id).fields[f] && !eb.get(id).fields[f]);
    const accA = common.filter((id) => ea.get(id).fields[f]).length / common.length;
    const accB = common.filter((id) => eb.get(id).fields[f]).length / common.length;
    meanA += accA / FIELDS.length;
    meanB += accB / FIELDS.length;
    fixedTotal += fixed.length;
    brokenTotal += broken.length;
    const d = (accB - accA) * 100;
    out.push(
      `  ${pad(f, 15)}${pad(pct(accA), w, true)}${pad(pct(accB), w, true)}${pad((d >= 0 ? "+" : "") + d.toFixed(1), 9, true)}   ${pad(fixed.length, 5, true)}  ${pad(broken.length, 6, true)}`
    );
    if (fixed.length) details.push(`  ${f}: fixed (wrong -> right): ${fixed.join(", ")}`);
    if (broken.length) details.push(`  ${f}: broken (right -> wrong): ${broken.join(", ")}`);
  }
  const dm = (meanB - meanA) * 100;
  out.push("  " + "-".repeat(15 + 2 * w + 9 + 16));
  out.push(`  ${pad("Mean", 15)}${pad(pct(meanA), w, true)}${pad(pct(meanB), w, true)}${pad((dm >= 0 ? "+" : "") + dm.toFixed(1), 9, true)}   ${pad(fixedTotal, 5, true)}  ${pad(brokenTotal, 6, true)}`);
  out.push("");
  const net = fixedTotal - brokenTotal;
  out.push(`Net: ${fixedTotal} field answers fixed, ${brokenTotal} broken -> net ${net >= 0 ? "+" : ""}${net} of ${common.length * FIELDS.length} field answers.`);
  if (details.length) {
    out.push("");
    out.push("Which e-mails flipped:");
    out.push(...details);
  }
  // run-to-run noise
  const reps = [findRepeats(dirA), findRepeats(dirB)].filter((r) => r.length >= 2);
  out.push("");
  if (reps.length) {
    let best = null;
    for (const r of reps) {
      const sp = spreadOf(r);
      if (!best || sp.range > best.range) best = { ...sp, names: r.map((x) => x.name) };
    }
    const range = best.range * 100;
    out.push(`Run-to-run spread: ${best.names.join(", ")} differ by ${range.toFixed(1)} points (mean field accuracy ${pct(best.min)} to ${pct(best.max)}).`);
    if (Math.abs(dm) > range) {
      out.push(`The change (${dm >= 0 ? "+" : ""}${dm.toFixed(1)} points) is larger than this spread: probably a real ${dm >= 0 ? "improvement" : "decline"}.`);
    } else {
      out.push(`The change (${dm >= 0 ? "+" : ""}${dm.toFixed(1)} points) is within this spread: it could be noise. Do not over-interpret it.`);
    }
  } else {
    out.push("No repeats found, so the run-to-run noise is unknown. To see it: node a03/tools/run.mjs <label> --repeat 2");
  }
  out.push("");
  out.push("Next: write your hypothesis and decision in a03/run_log.md");
  console.log(out.join("\n"));
  return { meanA, meanB, fixed: fixedTotal, broken: brokenTotal };
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const HELP = `Usage:
  node a03/tools/score.mjs <run>                 score a run again (e.g. v2)
  node a03/tools/score.mjs --compare <runA> <runB>
Options:
  --labels <file>   label file (default: a03/tasks/dev_labels.jsonl, or the one the run used)
  --runs <dir>      folder that contains the runs (default: a03/output/runs)
  --no-log          do not add a row to run_log.md`;

function main(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") args.help = true;
    else if (a === "--compare") args.compare = true;
    else if (a === "--no-log") args.noLog = true;
    else if (a === "--labels" || a === "--runs") {
      if (argv[i + 1] === undefined) throw new UserError(`${a} needs a value.\n\n${HELP}`);
      args[a.slice(2)] = argv[++i];
    } else if (a.startsWith("--")) throw new UserError(`Unknown option ${a}.\n\n${HELP}`);
    else args._.push(a);
  }
  if (args.help) return console.log(HELP);
  const runsDir = args.runs ? path.resolve(args.runs) : DEFAULT_RUNS_DIR;
  if (args.compare) {
    if (args._.length !== 2) throw new UserError(`--compare needs two runs, e.g. --compare v1 v2\n\n${HELP}`);
    compareRuns(args._[0], args._[1], runsDir);
    return;
  }
  if (args._.length !== 1) throw new UserError(HELP);
  const dir = resolveRunDir(args._[0], runsDir);
  const s = scoreRun(dir, { labels: args.labels, log: !args.noLog });
  printSummary(s, dir);
  console.log("\nNext: write your hypothesis and decision in a03/run_log.md");
}

const isMain = (() => {
  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();

if (isMain) {
  try {
    main(process.argv.slice(2));
  } catch (e) {
    if (e instanceof UserError) {
      console.error("\n" + e.message);
      process.exit(1);
    }
    throw e;
  }
}
