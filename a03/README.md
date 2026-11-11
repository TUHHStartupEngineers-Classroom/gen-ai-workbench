# A3 · Prompt playbook + accuracy report

**Due: Friday, 20 November 2026, 12:00.** Weight: 5%. No late submissions; extensions only if requested before the deadline.
Full brief and rubric: <https://www.gen-ai.startupengineer.io/sessions/03_prompting_and_context/session.html>

The support inbox of Nordhafen Industriebedarf GmbH (fictional) receives e-mails that must be routed. Your pipeline reads each e-mail and returns 7 fields as JSON (category, urgency, customer id, order numbers, amount, deadline, language). You start from a deliberately weak baseline (v0), improve it one measured change at a time, and document what worked. The field definitions are in `LABELS.md`.

## What you edit, and what you leave alone

| Edit | Leave alone |
|:-----|:------------|
| `prompt.md`: the instructions the model gets (system message) | `tasks/`: the 40 e-mails and the golden labels |
| `schema.json`: the JSON shape of the answer (the 7 field names are fixed; you may add an extra field such as `evidence`, but in strict mode it must also be listed in `required`) | `tools/`: runner and scorer |
| `config.json`: only `"reasoning"` (`none`, `low` or `medium`) | `LABELS.md`: the label book |
| `run_log.md`, `error_analysis.md`, `PLAYBOOK.md`, `agents_md_test.md`, `NOTES.md`, `REFLECTION.md` | `output/runs/`: written by the runner; commit it, do not edit it |
| the **root** `AGENTS.md` (add an a03 section) | |
| `prompt_skeleton.md` (optional): the five component headings with one line of guidance each and a placeholder per field. Copy it into `prompt.md` for v1 and fill it in; the runner does not read it | |

Grading always uses the instructor's runner and labels, so changes to `tools/` or `tasks/` have no effect on your grade.

Keep exactly **one** `AGENTS.md`, at the repository root, and start OpenCode from the repository root (`cd /workspaces/gen-ai-workbench`, then `opencode`). Do not create `a03/AGENTS.md`: depending on where you start OpenCode, it could replace the root rules instead of adding to them.

## Commands (run them from the repository root)

Before your first run, note your spend so far and write it into `REFLECTION.md` §3 (*Spend before A3*):

```bash
bash tools/check-setup.sh --usage
```

Then:

```bash
node a03/tools/run.mjs --dry-run --only E26    # shows the exact request for one e-mail; sends nothing, costs nothing
node a03/tools/run.mjs v0                       # baseline: all 40 e-mails, saved in a03/output/runs/v0/
node a03/tools/run.mjs v1                       # after your first change
node a03/tools/score.mjs --compare v0 v1        # which e-mails and fields got better or worse
node a03/tools/run.mjs v4 --repeat 2            # same version twice (v4_r1, v4_r2): shows the run-to-run spread
node a03/tools/score.mjs --compare v3 v4        # with repeats: compares with v4_r1 and prints the spread
node a03/tools/run.mjs v2test --only E03,E17    # quick check on a few e-mails (partial: not a version)
```

Each run writes `predictions.jsonl` (the model's answers), `scores.md` (accuracy per field), `scores.json` (the same for machines) and `errors.md` (every wrong field, grouped by field) into its folder, and adds a row to `run_log.md`. The run name (`v0`, `v2b`, `v4_r1`) names a version; a *label* is always a correct answer in the golden set. A run name is never reused: if `v2` exists, call the next one `v2b` or `v3`. You may let OpenCode start a run; keep its permissions on `ask`.

## One version = one change

One change is one idea that one hypothesis can explain. It may touch several lines: "enums for category and urgency" is one change, "enums + a new urgency rule" is two.

1. Commit: `git add a03`, then `git commit -m v1-short-name` (no spaces in the message; add `AGENTS.md` to `git add` whenever you changed it).
2. Write your **hypothesis** and the **change** under *Next run* at the top of `run_log.md`, before you run. The scorer copies both lines into the new row.
3. Make **one** change in `prompt.md`, `schema.json` or `config.json`.
4. Run it, then compare with the previous version (`--compare`).
5. Fill in **keep?** in the new row. If the change hurt: `git restore a03/prompt.md a03/schema.json a03/config.json`, then commit anyway; the run folder and the log row are your evidence.
6. Commit, including the new run folder in `a03/output/runs/`: `git add a03`, then `git commit -m v2-short-name`. A plain `git commit -am` would miss the new run folder.

## Deliverables (all in `a03/`, final commit before the deadline)

1. **Final pipeline:** `prompt.md`, `schema.json`, `config.json`. These three files are what the instructor runs on 20 hidden e-mails.
2. **`run_log.md`:** v0 and at least four further versions, each with hypothesis, change and keep/revert decision; the final version run at least twice (`--repeat 2`). All `output/runs/` folders committed.
3. **`error_analysis.md`:** the three most frequent error patterns in your final dev run, plus one remaining production risk.
4. **`PLAYBOOK.md`** (max. 2 pages): how someone else runs and maintains your pipeline, including **one** documented cost-vs-accuracy decision.
5. **Context engineering:** an a03 section in the root `AGENTS.md` (3 to 8 rules), the before/after test in `agents_md_test.md`, and `NOTES.md` used as a session log across at least two agent sessions.
6. **`REFLECTION.md`** (max. 1 page plus the AI-use log).

**How your pipeline is graded on the hidden set:** model fixed to `anthropic/claude-haiku-5.5`; your `reasoning` setting is used if it is `none`, `low` or `medium` (`high` or anything else counts as `none`); `max_tokens` is fixed to 2000; above **$2.00 per 1,000 e-mails** the hidden-test points are capped at half. Your dev score is not your grade: rules that only fit the 40 dev e-mails will not help on new ones.

## Cost

A full run of 40 e-mails cost about $0.004 with the v0 baseline and about $0.02 with a long prompt in the instructor pilot (the scorer shows the real cost of every run and the cost per 1,000 e-mails). The whole assignment should stay below $0.50. The runner asks before any run estimated above $0.50. Check your spend with `bash tools/check-setup.sh --usage`.

## If something goes wrong

- *OPENROUTER_API_KEY is not set* or *401*: run `bash tools/check-setup.sh` and follow the hints.
- *402 / no credit left*: e-mail the instructor.
- The first full run fails or is slow: run three e-mails first (`node a03/tools/run.mjs v0test --only E01,E02,E03`), then the full run.
- OpenCode does not work: the runner does not need it. Do the `AGENTS.md` before/after test at home once OpenCode works (a partner's OpenCode tests the partner's `AGENTS.md`).
- A model or provider does not support structured outputs: try again later, or test with `--model openai/gpt-5-nano` (exploration only; grading uses Haiku).
- You think a label is wrong: post it in the Teams thread for A3. The instructor fixes a label once for everyone (see the changelog in `LABELS.md`). A well-argued dispute also counts as evidence in your error analysis.

## How to submit

As in A2: push your final commit, copy the commit URL from your repository's **History** on GitHub (`https://github.com/<your-username>/gen-ai-workbench/commit/<hash>`), and in **MS Teams → Assignments → A3** add it as a link plus a second link with your repository URL, then click **Turn in**.

## Rules

- Never write your API key into any file. A key in your git history costs 10 points.
- Every submission includes the AI-use log (`REFLECTION.md`); missing log costs 10 points.
- Synthetic data only.
