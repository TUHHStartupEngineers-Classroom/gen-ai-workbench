# A4 experiment log

Fill this in during the lab, as you go. Report the numbers as measured, including unfavourable ones: an honest result that AI did not save time earns full marks.

**Name:**
**Partner (GitHub username):**

## 1. Coin flips

Fill in before any timed work, then commit: `git add a04 .agents AGENTS.md`, then `git commit -m a04-coins`. For the class form, code heads as 1 and tails as 0.

| Coin | Result (heads / tails) | Meaning |
|:-----|:----------------------:|:--------|
| 1: which pack gets AI | | heads: `pack_A` with AI, `pack_B` by hand · tails: `pack_B` with AI, `pack_A` by hand |
| 2: order | | heads: AI first · tails: by hand first |

**My plan:** condition 1 = ______ on pack ___ · condition 2 = ______ on pack ___

## 2. Skill build time (fixed cost)

t_build = Hands-on 2 + lab build + home v2. The lab build starts at the time of your `a04-coins` commit and ends at your `a04-skill-v1` commit; read both with `git log --date=iso --format=%ad%x20%s`.

| Part | Start | End | Minutes |
|:-----|:------|:----|--------:|
| Hands-on 2 (block 1; your estimate) | | | |
| Lab build (`a04-coins` commit → `a04-skill-v1` commit) | | | |
| Home v2 (and later versions) | | | |
| **t_build (total)** | | | |

## 3. Timed runs

Times from `output/laps.csv` (or your stopwatch). `lap.sh` prints the minutes on `stop`. The skill was not changed between the two runs (yes / no):

| | Condition 1 | Condition 2 |
|:--|:--|:--|
| Condition (manual / ai) | | |
| Pack | | |
| Output file | | |
| Start (time) | | |
| Verify (time, ai only: OpenCode has written the file and returned the prompt) | | |
| Stop (time) | | |
| Total minutes | | |
| AI only: drafting minutes (start → verify) | | |
| AI only: checking minutes (verify → stop) | | |
| Finished within 15 min? (yes / 15+ with share of sections done) | | |
| Where (lab / home) | | |
| Timing source (lap.sh / stopwatch / estimate) | | |
| Model (if not Haiku 5.5) | | |
| Anything unusual (Copilot appeared, key facts seen early, interruptions) | | |

Commits: `a04-run1` after condition 1, `a04-run2` after condition 2 (always `git add a04 .agents AGENTS.md` first).

## 4. Send-ready checklist

Tick each item of `send_ready_checklist.md` for each report (x = ticked).

| # | Item | Manual | AI |
|--:|:-----|:------:|:--:|
| 1 | Every section filled in | | |
| 2 | Status colour justified by a fact | | |
| 3 | Every number and date matches a source file | | |
| 4 | No statement without a source | | |
| 5 | Unknown items marked as open | | |
| 6 | Decisions needed stated with a date | | |
| 7 | Nothing from other projects | | |
| 8 | One page, readable without the sources | | |

## 5. Errors found while checking the AI report

One row per error you found during the checking time (and any you or your partner found later; mark those "later").

| # | What was wrong in the AI report | How I found it (which source file) | Fixed by hand or by re-prompting? | Which skill step or check would have prevented it? |
|--:|:--------------------------------|:-----------------------------------|:----------------------------------|:---------------------------------------------------|
| 1 | | | | |
| 2 | | | | |
| 3 | | | | |

## 6. Partner quality scores

**Filled in by your partner, on your laptop** (swap laptops; in a group of three, rotate), with the printed key-fact sheet, after both timed runs were logged. 4 minutes per report. Then commit: `git add a04 .agents AGENTS.md`, then `git commit -m a04-scores`.

Scored by (partner's GitHub username):

| | Manual (pack ___) | AI (pack ___) |
|:--|:--:|:--:|
| Key facts correct (0–10) | | |
| Errors (each wrong or invented statement, and anything the sheet lists as an error if stated) | | |
| **Quality = key facts correct − errors** | | |
| Send-ready (yes / no) | | |
| Disputed points (author, with the quote from the pack) | | |

Key facts seen before a timed run? (yes / no, which run):
Integers entered into the class form? (yes / no):
