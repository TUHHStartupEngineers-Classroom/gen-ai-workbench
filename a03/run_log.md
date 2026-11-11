# A3 run log

## Next run: fill in BEFORE you run

Hypothesis: 
Change: 

Write one sentence each, then start the run. Keep the words `Hypothesis:` and `Change:` at the start of their lines. The scorer copies both lines into the new row below and empties them for the next run. One change is one idea that one hypothesis can explain ("enums for category and urgency" is one change; "enums + a new urgency rule" is two).

After the run, fill in **keep?** in the row: keep or revert, and why (compare with `node a03/tools/score.mjs --compare <old> <new>`). If the change hurt: `git restore a03/prompt.md a03/schema.json a03/config.json`, then commit anyway; the run folder and the log row are your evidence. Exploration runs (another model, partial runs) get "exploration" in *keep?*.

## Runs

The scorer adds one row per run. The column `label` holds the run name (`v0`, `v2b`, `v3_r1`). Do not delete rows, not even for runs that made things worse.

| label | date-time | model | reasoning | category | urgency | customer | orders | amount | deadline | language | mean | all-correct | valid JSON | $ run | $ / 1,000 | hypothesis | change | keep? |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
