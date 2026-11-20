# A4 experiment log

Fill this in during the lab, as you go. Report the numbers as measured, including unfavourable ones: an honest result that the skill did not save time, or that your forecast was off, earns full marks.

**Name:**
**Partner (GitHub username):**

## 1. Forecast (before the timed run)

Three whole numbers of minutes, for the pack A report. Write them before the skill build, then commit: `git add a04 .agents AGENTS.md`, then `git commit -m a04-forecast`. Do not change them afterwards. Base the numbers on the practice pack (same structure and size as pack A), your `practice_v0.md` and `send_ready_checklist.md`. **Do not open pack A before `lap.sh ai start`**: reading it untimed would make your checking look shorter than it is.

| Field | Minutes |
|:------|--------:|
| `F_manual`: this report by hand | |
| `F_ai_total`: with your skill, checking included | |
| `F_ai_check`: of which checking | |

## 2. Timed run (AI, pack A)

Times from `output/laps.csv` (or your stopwatch). `lap.sh ai stop` prints the minutes.

**Felt estimate first.** When every checklist item is ticked, and **before** you run `bash a04/tools/lap.sh ai stop`, write how many minutes the whole run felt like. Do not look at the clock or the laps first.

| `R_ai_total`: felt minutes for the whole run | |
|:--|--:|

| | |
|:--|:--|
| Output file | `a04/output/ai_pack_A.md` |
| Start (time) | |
| Verify (time: OpenCode has written the file and returned the prompt) | |
| Stop (time) | |
| Measured drafting minutes (start → verify) | |
| Measured checking minutes (verify → stop) | |
| Measured total minutes | |
| Finished within 15 min? (yes / 15+ with share of sections done) | |
| Where (lab / home) | |
| Timing source (lap.sh / stopwatch / estimate) | |
| Model (if not Haiku 5.5) | |
| Skill version used (footer) | |
| Anything unusual (interruptions, key facts seen early) | |

**Send-ready checklist** (`send_ready_checklist.md`; x = ticked before `stop`):

| # | Item | Ticked |
|--:|:-----|:------:|
| 1 | Every section filled in | |
| 2 | Status colour justified by a fact | |
| 3 | Every number and date matches a source file | |
| 4 | No statement without a source | |
| 5 | Unknown items marked as open | |
| 6 | Decisions needed stated with a date | |
| 7 | Nothing from other projects | |
| 8 | One page, readable without the sources | |

Then commit: `git add a04 .agents AGENTS.md`, then `git commit -m a04-run`.

## 3. Partner quality score

**Filled in by your partner, on your laptop** (swap laptops; in a group of three, rotate), with the printed key-fact sheet for pack A, after your timed run was logged. 4 minutes. Then commit: `git add a04 .agents AGENTS.md`, then `git commit -m a04-scores`.

Scored by (partner's GitHub username):

| | `ai_pack_A.md` |
|:--|:--:|
| Key facts correct (0–10) | |
| Errors (each wrong or invented statement, and anything the sheet lists as an error if stated) | |
| **Quality = key facts correct − errors** | |
| Send-ready (yes / no) | |
| Disputed points (author, with the quote from the pack) | |

Key facts seen before the timed run? (yes / no):
Integers entered into the class form? (yes / no):

## 4. Errors found while checking

One row per error you found in the AI report during the checking time (and any you or your partner found later; mark those "later").

| # | What was wrong in the AI report | How I found it (which source file) | Fixed by hand or by re-prompting? | Which skill step or check would have prevented it? |
|--:|:--------------------------------|:-----------------------------------|:----------------------------------|:---------------------------------------------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

## 5. Skill build time (fixed cost)

t_build = Hands-on 2 + lab build + home v2. The lab build starts at the time of your `a04-forecast` commit and ends at your `a04-skill-v1` commit; read both with `git log --date=iso --format=%ad%x20%s`.

| Part | Start | End | Minutes |
|:-----|:------|:----|--------:|
| Hands-on 2 (block 1; your estimate) | | | |
| Lab build (`a04-forecast` commit → `a04-skill-v1` commit) | | | |
| Home v2 (and later versions) | | | |
| **t_build (total)** | | | |

## 6. Comparison (fill in after class)

The manual baseline is an **estimate**, not a measured time: T_est ≈ 20 minutes to write the pack A report by hand until all eight checklist items are ticked (plausible range 15–25; reading ≈ 6, writing ≈ 12, checklist ≈ 2 minutes).

| | Forecast | Measured | Felt |
|:--|--:|--:|--:|
| AI total minutes | `F_ai_total` = | | `R_ai_total` = |
| AI checking minutes | `F_ai_check` = | | |
| Checking share of the AI total (%) | | | |

| Manual time | Minutes |
|:--|--:|
| My forecast `F_manual` | |
| Manual baseline (estimated, pack A): T_est | 20 |
