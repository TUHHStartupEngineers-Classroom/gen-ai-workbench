# Prompt playbook: support-inbox triage

Maximum 2 pages. Write it for a colleague who takes over the pipeline tomorrow and has not seen your run log: they must be able to run it, judge its output and maintain it.

**Owner:**  · **Final version:** (run name, e.g. `v6`)  · **Last updated:**

## 1. Purpose and business use

What the pipeline does, for whom, and which decision or routing step it feeds (2 to 4 sentences).

## 2. Field definitions and decision rules

The rules your final prompt applies, in plain language, one short block per field. Where your rule is more precise than `LABELS.md`, say so. General rules only: no rules about individual customers or e-mails.

| Field | Rule in plain language |
|:------|:-----------------------|
| category | |
| urgency | |
| customer_id | |
| order_numbers | |
| amount_eur | |
| deadline | |
| language | |

## 3. Settings

- Model:
- Reasoning effort, and why:
- Schema summary (enums, nulls, descriptions, any extra field and why):
- Prompt structure (which components, examples yes/no):

## 4. Performance on the dev set

Mean field accuracy and its spread over at least two runs of the final version (spread = highest minus lowest, in points), plus per-field accuracy. Name the runs the numbers come from (e.g. `v6_r1`, `v6_r2`).

| Field | Accuracy (final version) |
|:------|:------------------------:|
| | |

## 5. Expected cost

Cost per 1,000 e-mails (from the score table), and what drives it.

**One cost-vs-accuracy decision.** Describe one change that cost more (examples, reasoning, a longer prompt): what it added per 1,000 e-mails, what it gained in points on which field, what that means at 2,000 e-mails a month (how many fewer wrong tickets), and whether you kept it.

## 6. Known limitations

Where the pipeline is known to fail or be unreliable.

## 7. When a human must look at an e-mail

A concrete, checkable rule (which field values or situations go to a person).

## 8. Version history

One line per version: run name, the one change, mean field accuracy, kept or reverted.

| Version | Change | Mean | Kept? |
|:--------|:-------|:----:|:-----:|
| v0 | baseline | | |
