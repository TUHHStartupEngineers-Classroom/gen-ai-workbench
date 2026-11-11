// fields.mjs: the single source of truth for the A3 fields.
//
// Field names, allowed values, normalisation and comparison rules live here
// and nowhere else. run.mjs and score.mjs import this file, and the
// instructor uses exactly the same file to score the hidden test set.
//
// Students: you do not need to read or change this file. Changing it has no
// effect on your grade (grading always uses the instructor's copy).

// SHA-256 of the shipped tasks/dev_labels.jsonl. "TBD" = check skipped.
// The instructor updates this value whenever a label is corrected (LABELS.md changelog).
export const DEV_LABELS_SHA256 = "44ecdc0631042cfd16b9a3db6e312672936aa88d8d6db21cc24b9dacfd167e80";

// The 7 fields, in the order of the golden label lines.
export const FIELDS = [
  "category",
  "urgency",
  "customer_id",
  "order_numbers",
  "amount_eur",
  "deadline",
  "language",
];

// Short column names for tables and run_log.md.
export const SHORT = {
  category: "category",
  urgency: "urgency",
  customer_id: "customer",
  order_numbers: "orders",
  amount_eur: "amount",
  deadline: "deadline",
  language: "language",
};

// Allowed values of the three enum fields.
export const ENUMS = {
  category: [
    "order_status",
    "delivery_problem",
    "invoice",
    "return_refund",
    "technical_question",
    "quote_request",
    "other",
  ],
  urgency: ["low", "normal", "high"],
  language: ["en", "de"],
};

// Fields whose correct answer can be "nothing" (null, or [] for order numbers).
export const NULLABLE = ["customer_id", "order_numbers", "amount_eur", "deadline"];

// Strings that count as "no value" (after trimming, case-insensitive).
// A schema with explicit nulls makes these unnecessary, but the v0 schema
// only allows strings, so the model has to write *something*.
export const NULL_STRINGS = ["", "null", "none", "n/a"];

const AMOUNT_TOLERANCE = 0.01;

// ---------------------------------------------------------------------------
// Normalisation
// ---------------------------------------------------------------------------

export function isNullLike(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === "string") return NULL_STRINGS.includes(v.trim().toLowerCase());
  return false;
}

// "K 40213", "k40213", " K-40213 " -> "K-40213". Anything else is returned
// trimmed and uppercased (and will not match a correct label).
export function normCustomerId(v) {
  if (isNullLike(v)) return null;
  const s = String(v).trim().toUpperCase();
  const m = s.match(/^K\s*[-_\s]?\s*(\d{5})$/);
  return m ? `K-${m[1]}` : s;
}

function normOrderOne(v) {
  const s = String(v).trim().toUpperCase();
  const m = s.match(/^S\s*O\s*[-_\s]?\s*(\d{6})$/);
  return m ? `SO-${m[1]}` : s;
}

// Returns a sorted array of unique normalised order numbers. null, "" and
// "null" count as [] (no order number). A single string (v0 schema) is split
// at commas, semicolons, slashes and line breaks; a string that is a JSON
// array is parsed.
export function normOrderNumbers(v) {
  if (isNullLike(v)) return [];
  let items;
  if (Array.isArray(v)) {
    items = v;
  } else if (typeof v === "string") {
    const t = v.trim();
    if (t.startsWith("[")) {
      try {
        const parsed = JSON.parse(t);
        items = Array.isArray(parsed) ? parsed : [t];
      } catch {
        items = t.replace(/^\[|\]$/g, "").split(/[,;\/\n]+/);
      }
    } else {
      items = t.split(/[,;\/\n]+|\s+(?:and|und)\s+/i);
    }
  } else {
    items = [v];
  }
  const out = items
    .filter((x) => !isNullLike(x))
    .map((x) => normOrderOne(typeof x === "string" ? x.replace(/^["']|["']$/g, "") : x))
    .filter((x) => x !== "");
  return [...new Set(out)].sort();
}

// Numbers stay numbers. Strings are parsed in German or English format:
// "1.234,50" -> 1234.5, "1,234.50" -> 1234.5, "1234,5" -> 1234.5,
// "EUR 980" / "980 €" -> 980. Unparseable strings -> NaN (never matches).
export function normAmount(v) {
  if (isNullLike(v)) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : NaN;
  if (typeof v !== "string") return NaN;
  let s = v.trim().replace(/eur(o|os)?|€/gi, "").replace(/[\s ']/g, "");
  if (s === "" ) return NaN;
  const neg = s.startsWith("-");
  if (neg || s.startsWith("+")) s = s.slice(1);
  if (!/^[\d.,]+$/.test(s)) return NaN;
  const hasDot = s.includes(".");
  const hasComma = s.includes(",");
  if (hasDot && hasComma) {
    // the separator that comes last is the decimal separator
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) s = s.replace(/\./g, "").replace(",", ".");
    else s = s.replace(/,/g, "");
  } else if (hasComma) {
    if (/^\d{1,3}(,\d{3})+$/.test(s)) s = s.replace(/,/g, ""); // 1,234 (EN thousands)
    else if (/^\d+,\d+$/.test(s)) s = s.replace(",", "."); // 1234,50 (DE decimal)
    else return NaN;
  } else if (hasDot) {
    if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, ""); // 1.234 (DE thousands)
    else if (!/^\d+\.\d+$/.test(s)) return NaN;
  }
  const n = Number(s);
  if (!Number.isFinite(n)) return NaN;
  return neg ? -n : n;
}

// Accepts ISO dates "2026-10-16" (also "2026-10-16T00:00:00Z"); checks that
// the date exists. Other formats ("16.10.2026", "Friday") are returned as
// they are and will not match.
export function normDeadline(v) {
  if (isNullLike(v)) return null;
  const s = String(v).trim();
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T\s])/);
  if (!m) return s;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return s;
  return `${m[1]}-${m[2]}-${m[3]}`;
}

// Enum fields: exact match after trimming (case matters: "High" is not "high").
export function normEnum(v) {
  if (isNullLike(v)) return null;
  return typeof v === "string" ? v.trim() : JSON.stringify(v);
}

export function normalise(field, v) {
  switch (field) {
    case "customer_id":
      return normCustomerId(v);
    case "order_numbers":
      return normOrderNumbers(v);
    case "amount_eur":
      return normAmount(v);
    case "deadline":
      return normDeadline(v);
    default:
      return normEnum(v);
  }
}

// ---------------------------------------------------------------------------
// Comparison
// ---------------------------------------------------------------------------

// Returns { correct, note }. note is "" or a short plain-English hint used in
// errors.md: null errors and partial order-number overlaps are flagged.
export function compareField(field, expected, predicted) {
  const e = normalise(field, expected);
  const p = normalise(field, predicted);
  let correct;
  if (field === "order_numbers") {
    correct = e.length === p.length && e.every((x, i) => x === p[i]);
  } else if (field === "amount_eur") {
    if (e === null || p === null) correct = e === p;
    else correct = Number.isFinite(p) && Math.abs(e - p) <= AMOUNT_TOLERANCE + 1e-9;
  } else {
    correct = e === p;
  }
  let note = "";
  if (!correct) {
    const eEmpty = field === "order_numbers" ? e.length === 0 : e === null;
    const pEmpty = field === "order_numbers" ? p.length === 0 : p === null;
    if (eEmpty && !pEmpty) note = "NULL ERROR: label is empty, model gave a value (invented?)";
    else if (!eEmpty && pEmpty) note = "NULL ERROR: label has a value, model gave none (missed)";
    else if (field === "order_numbers") {
      const hit = p.filter((x) => e.includes(x)).length;
      if (hit > 0) note = `partial overlap: ${hit} of ${e.length} expected found, ${p.length - hit} extra`;
    } else if (field === "amount_eur" && Number.isNaN(p)) {
      note = "could not read the value as a number";
    } else if (field === "deadline" && typeof p === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(p)) {
      note = "not an ISO date (YYYY-MM-DD)";
    } else if (ENUMS[field] && typeof p === "string" && !ENUMS[field].includes(p)) {
      note = "not one of the allowed values";
    }
  }
  return { correct, note };
}

// ---------------------------------------------------------------------------
// Checks for the files students edit
// ---------------------------------------------------------------------------

function enumValuesOf(prop) {
  // enum may sit on the property itself or inside anyOf / oneOf variants
  const out = [];
  if (!prop || typeof prop !== "object") return out;
  if (Array.isArray(prop.enum)) out.push(...prop.enum);
  for (const k of ["anyOf", "oneOf"]) {
    if (Array.isArray(prop[k])) for (const sub of prop[k]) out.push(...enumValuesOf(sub));
  }
  return out;
}

function hasEnum(prop) {
  if (!prop || typeof prop !== "object") return false;
  if (Array.isArray(prop.enum)) return true;
  return ["anyOf", "oneOf"].some((k) => Array.isArray(prop[k]) && prop[k].some(hasEnum));
}

// Checks schema.json. Returns { errors: [...], warnings: [...] } in plain English.
// errors stop the run; warnings are printed and the run continues.
export function checkSchema(schema) {
  const errors = [];
  const warnings = [];
  if (!schema || typeof schema !== "object" || Array.isArray(schema)) {
    errors.push("schema.json must contain one JSON object ({ ... }).");
    return { errors, warnings };
  }
  if (schema.type !== "object") errors.push('The top level of schema.json needs "type": "object".');
  const props = schema.properties;
  if (!props || typeof props !== "object" || Array.isArray(props)) {
    errors.push('schema.json needs a "properties" object that lists the 7 fields.');
    return { errors, warnings };
  }
  const missing = FIELDS.filter((f) => !(f in props));
  const extra = Object.keys(props).filter((f) => !FIELDS.includes(f));
  for (const f of missing) {
    errors.push(`Field "${f}" is missing in "properties". The 7 field names are fixed: ${FIELDS.join(", ")}.`);
  }
  if (missing.length && extra.length) {
    errors.push(`Unknown field name(s): ${extra.join(", ")}. Did you rename a field? Field names cannot be changed.`);
  } else if (extra.length) {
    warnings.push(`Extra field(s) ${extra.join(", ")}: allowed, but not scored. Justify them in PLAYBOOK.md.`);
  }
  for (const f of Object.keys(ENUMS)) {
    if (!(f in props) || !hasEnum(props[f])) continue;
    const bad = enumValuesOf(props[f]).filter((v) => v !== null && !ENUMS[f].includes(v));
    if (bad.length) {
      errors.push(
        `Field "${f}" lists value(s) that are not allowed: ${bad.map((v) => JSON.stringify(v)).join(", ")}. ` +
          `Allowed: ${ENUMS[f].join(", ")}.`
      );
    }
  }
  for (const f of FIELDS) {
    if (f in props && !ENUMS[f] && hasEnum(props[f])) {
      warnings.push(`Field "${f}" has an "enum" list. Only category, urgency and language have fixed values; check this is intended.`);
    }
  }
  const req = Array.isArray(schema.required) ? schema.required : [];
  const notReq = Object.keys(props).filter((f) => !req.includes(f));
  if (notReq.length) {
    warnings.push(`Not listed in "required": ${notReq.join(", ")}. Strict structured outputs expect every field in "required".`);
  }
  if (schema.additionalProperties !== false) {
    warnings.push('"additionalProperties": false is missing at the top level. Strict structured outputs need it.');
  }
  return { errors, warnings };
}

export const REASONING_LEVELS = ["none", "low", "medium", "high"];

// Checks config.json. Returns { errors, warnings }.
export function checkConfig(cfg) {
  const errors = [];
  const warnings = [];
  if (!cfg || typeof cfg !== "object" || Array.isArray(cfg)) {
    errors.push("config.json must contain one JSON object ({ ... }).");
    return { errors, warnings };
  }
  if (typeof cfg.model !== "string" || !cfg.model.includes("/")) {
    errors.push('config.json: "model" must be an OpenRouter model name such as "anthropic/claude-haiku-5.5".');
  }
  if (!REASONING_LEVELS.includes(cfg.reasoning)) {
    errors.push(`config.json: "reasoning" must be one of ${REASONING_LEVELS.join(", ")}.`);
  } else if (cfg.reasoning === "high") {
    warnings.push('reasoning "high" is fine for exploring, but the graded run allows only none, low or medium (high is treated as none).');
  }
  if (!Number.isInteger(cfg.max_tokens) || cfg.max_tokens < 1) {
    errors.push('config.json: "max_tokens" must be a whole number, e.g. 2000.');
  }
  if (cfg.concurrency !== undefined && (!Number.isInteger(cfg.concurrency) || cfg.concurrency < 1 || cfg.concurrency > 8)) {
    errors.push('config.json: "concurrency" must be a whole number from 1 to 8.');
  }
  for (const k of ["price_in_per_m", "price_out_per_m"]) {
    if (cfg[k] !== undefined && (typeof cfg[k] !== "number" || cfg[k] < 0)) {
      errors.push(`config.json: "${k}" must be a number (USD per million tokens).`);
    }
  }
  return { errors, warnings };
}
