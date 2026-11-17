# A4 · Skill file + with/without-AI time experiment

**Due: Friday, 27 November 2026, 12:00.** Weight: 5%. No late submissions; extensions only if requested before the deadline.
Full brief and rubric: <https://www.gen-ai.startupengineer.io/sessions/04_skills/session.html>

You are a project lead at Nordhafen Industriebedarf GmbH (fictional). Every Friday you send a weekly status report to the managing director. You package this recurring task as a **skill**: a folder with a `SKILL.md` file that the agent loads only when the task needs it. Then you measure what the skill saves you once checking is counted: you write one report by hand and one with AI, on two equivalent project weeks, with a coin deciding which is which. At home you also place your own recurring tasks on a delegation matrix, test your skill's trigger and voice, and scout use cases for your capstone.

The project material sits in `tasks/`: one practice pack to build and test your skill, and two packs (`pack_A`, `pack_B`) for the timed runs. Each pack is a scaled-down project week (about 900 words): last week's report, a milestone plan, meeting notes, e-mails, a chat excerpt, a budget note. A real week has more material, so keep this in mind when you interpret your result.

**Time:** the lab covers the skill build and the timed runs. Plan about 4–5 hours at home for skill v2, the tests, the matrix, the scouting and the reflection.

## What you edit, and what you leave alone

| Edit | Leave alone |
|:-----|:------------|
| `.agents/skills/status-report/` at the **repository root** (not inside `a04/`): `SKILL.md`, `template.md`, `voice.md`, optional `example.md` | `tasks/`: the three packs (read-only, for you and for the agent) |
| `experiment_log.md`, `skill_test.md`, `voice_test.md`, `delegation_matrix.md`, `scouting.md`, `REFLECTION.md` | `report_template.md` and `send_ready_checklist.md`: everyone uses the same versions, so outputs are comparable (copy the template; do not change the original) |
| `output/`: your reports (`practice_vN.md`, `manual_pack_X.md`, `ai_pack_X.md`, trigger-test and voice-test files) | `output/laps.csv`: written by `tools/lap.sh`; commit it, do not edit it |
| the **root** `AGENTS.md` (add the a04 section in Hands-on 2) | `tools/lap.sh` and `skill_skeleton/` (you copy the skeleton once, then work only in `.agents/skills/status-report/`) |

The skill name and place are fixed: `.agents/skills/status-report/SKILL.md`, with `name: status-report`. The instructor's pack C run looks exactly there.

Keep exactly **one** `AGENTS.md`, at the repository root, and start OpenCode from the repository root.

**Fresh session** always means: quit OpenCode (`/exit` or Ctrl+C) and start it again from the repository root. `/new` is not a substitute, because OpenCode reads skills only at startup.

**Commits.** Use exactly these quote-free messages: `a04-start`, `a04-coins`, `a04-skill-v1`, `a04-run1`, `a04-run2`, `a04-scores`, `a04-final`. From Hands-on 2 on, always stage with `git add a04 .agents AGENTS.md`.

## Hands-on 1 (block 1): fetch and start

Note your spend first, then fetch the folder and commit it (terminal):

```bash
bash tools/check-setup.sh --usage
bash tools/get-assignment.sh a04
git add a04
git commit -m a04-start
```

Write the spend into `a04/REFLECTION.md` §3 (*Spend before A4*). The fetch script suggests a commit command with quotes; use the quote-free one above (quotes get lost when you paste into the Codespace terminal).

Then open `a04/delegation_matrix.md`, list five recurring tasks (from your own work or a realistic target role) and place two on the matrix. No AI for this step.

## Hands-on 2 (block 1): install the skill skeleton

You need two terminals. **Terminal 1** runs OpenCode. Open **terminal 2** with the **+** in the terminal panel; it is for commands while OpenCode runs.

**Terminal 2:** create the skill folder from the skeleton and open the file:

```bash
cd /workspaces/gen-ai-workbench
mkdir -p .agents/skills
cp -r a04/skill_skeleton .agents/skills/status-report
code .agents/skills/status-report/SKILL.md
```

In the editor, write a first `description`: one line, in double quotes, saying what the skill does and when to use it. For example: `description: "Writes the weekly project status report for management from a folder of project files. Use when the user asks for a weekly status report for a project folder."`

Add these lines at the end of the **root** `AGENTS.md` (rule 1 there keeps the agent inside the assignment folder; this section lets it work on your skill):

```text
## a04
- For a04 you may create and edit files in .agents/skills/ when I ask. Never edit a04/tasks/.
- Save reports only in a04/output/.
```

**Terminal 1:** start OpenCode fresh from the repository root (if it is running, quit it first with `/exit` or Ctrl+C):

```bash
cd /workspaces/gen-ai-workbench
opencode
```

**Terminal 2:** check that OpenCode finds the skill:

```bash
opencode debug skill | grep -E '^ *"(name|location)":'
```

Expected: two skills, the built-in `customize-opencode` and `status-report` with the location `.agents/skills/status-report/SKILL.md`. (Without the `grep`, the full output also shows your description.)

**In OpenCode (terminal 1):**

```text
Write the weekly status report for the project in a04/tasks/practice/ and save it as a04/output/practice_v0.md.
```

OpenCode asks for permission before it writes or edits a file: read what it wants to do, then allow it. Does the report end with the footer line `Prepared with skill: status-report v0`? Then the skill was loaded.

### The restart rule

**After adding or editing a skill, quit OpenCode and start it again from the repository root.** Check with `opencode debug skill` in terminal 2. The loader never complains: a wrong name or a missing description gives no warning, and a skill without a description never reaches the model. So read your description yourself.

## Lab: build the skill, then the time experiment

### Gate and coin flips (before any timed work)

The gate is the check at the start of the lab: your skill is listed by `opencode debug skill` and you have seen the footer line. Then flip two coins (no coin? `echo $((RANDOM % 2))` in the terminal; 1 = heads, 0 = tails) and write the results into `experiment_log.md` §1:

- **Coin 1** decides which pack gets AI. Heads: `pack_A` with AI, `pack_B` by hand. Tails: `pack_B` with AI, `pack_A` by hand.
- **Coin 2** decides the order. Heads: AI first. Tails: by hand first.

Commit before the first timed run; the commit time shows the coins came first, and it starts your build time:

```bash
git add a04 .agents AGENTS.md
git commit -m a04-coins
```

### Build skill v1 on the practice pack (hard stop 20:30)

Let OpenCode draft the skill with this one prompt (in OpenCode):

```text
Read a04/README.md, a04/report_template.md, a04/send_ready_checklist.md and all files in a04/tasks/practice/. Then complete .agents/skills/status-report/SKILL.md: keep the frontmatter, improve the description (what the skill does and when to use it), and write numbered steps, the checks from the checklist and the boundaries. Copy a04/report_template.md to .agents/skills/status-report/template.md. Do not put any facts from the practice pack into the skill. Do not change anything in a04/tasks/. Show me the file when you are done.
```

OpenCode asks for permission before it writes or edits a file: read what it wants to do, then allow it. Then:

1. Read the draft and edit it by hand where needed.
2. Set the footer at the end of `template.md` to `Prepared with skill: status-report v1`. The footer stays `v1` for the whole lab.
3. Fresh session (quit and restart OpenCode).
4. One practice run: `Write the weekly status report for the project in a04/tasks/practice/ and save it as a04/output/practice_v1.md.`
5. Check the report against `send_ready_checklist.md`. Note what is wrong for your v2 at home; do not fix it now.
6. Commit, by 20:30 at the latest, even if the report is not perfect:

```bash
git add a04 .agents AGENTS.md
git commit -m a04-skill-v1
```

`practice_vN` numbers your practice runs, not skill versions.

### Timed runs

Run condition 1, then condition 2, in the order your coins decided. **Do not change the skill between the two timed runs.** Commit after each run:

```bash
git add a04 .agents AGENTS.md
git commit -m a04-run1
```

(After the second run, the same with `a04-run2`.)

**Laps.** Log every step with `lap.sh` (terminal 2). It adds a row to `a04/output/laps.csv` and prints the minutes on `stop`:

```bash
bash a04/tools/lap.sh manual start
bash a04/tools/lap.sh manual stop
bash a04/tools/lap.sh ai start
bash a04/tools/lap.sh ai verify
bash a04/tools/lap.sh ai stop
```

**Start a 15-minute timer on your phone at every `start`.** `lap.sh` does not warn you live. If `lap.sh` fails, use the phone stopwatch and write the times into the log.

**By hand (manual condition).** Before `lap.sh manual start`: copy the template and delete its footer line (manual reports carry no footer):

```bash
cp a04/report_template.md a04/output/manual_pack_X.md
```

(X = your manual pack.) Lap `start` when you open the first pack file, write the report in the VS Code editor, and lap `stop` when every item of `send_ready_checklist.md` is ticked. No OpenCode, no chatbot, no translation tool, no other AI tool. Turn GitHub Copilot inline completions off first (Copilot icon in the status bar), if you have Copilot.

**With AI (AI condition).** Fresh session first (quit and restart OpenCode). Lap `start` as you send this request (X = your AI pack; do not name the skill, the description has to trigger it):

```text
Write the weekly status report for the project in a04/tasks/pack_X/ and save it as a04/output/ai_pack_X.md.
```

OpenCode asks for permission before it writes the file: allow it (this is part of drafting). Lap `verify` when OpenCode has written the file and returned the prompt. Checking means reading the report against the source files, fixing by hand, or re-prompting; all of it counts. Lap `stop` when every item of `send_ready_checklist.md` is ticked. Write every error you found into `experiment_log.md` §5 (what was wrong, how you found it).

**The 15-minute cap.** Each condition has at most 15 minutes. If you are not done, stop at 15 minutes and log the run as **15+**, with the share of sections done. A 15+ run is a valid result, not a failure.

**Build time** is logged separately in `experiment_log.md` §2 and is not part of either timed run: t_build = Hands-on 2 + lab build (from the `a04-coins` commit to the `a04-skill-v1` commit) + home v2. Read your commit times with `git log --date=iso --format=%ad%x20%s`.

### Partner check

Do not look at the key facts before both timed runs are logged; if it happens anyway, note it in the log. Then:

1. **Swap laptops** with your partner. In a group of three, rotate: A scores B, B scores C, C scores A.
2. With the printed key-fact sheet, your partner scores your two reports, **4 minutes per report**, and writes the scores directly into **your** `experiment_log.md` §6:
   - key facts correct (0–10);
   - errors (each wrong or invented statement, and anything the sheet lists as an error if stated);
   - **quality = key facts correct − errors**;
   - send-ready: yes or no.
3. Swap back. You may dispute a point with a quote from the pack; note it in §6.
4. Enter your integers into the anonymous class form (coins coded 1 = heads, 0 = tails), then commit:

```bash
git add a04 .agents AGENTS.md
git commit -m a04-scores
```

### After the lab (at home)

1. **Skill v2:** for each thing you fixed in the AI report or noted in the practice check, which step or check would have prevented it? Fix it, set the footer to `v2` (raise it with every later version), start a fresh session, run the practice pack again (`practice_v2.md`, …) and check it.
2. Trigger test (`skill_test.md`), voice file and voice test (`voice_test.md`), delegation matrix, scouting, reflection.
3. Commit and push:

```bash
git add a04 .agents AGENTS.md
git commit -m a04-final
git push
```

## Deliverables (final commit before the deadline)

1. **Skill** (`.agents/skills/status-report/`): `SKILL.md` (frontmatter with a specific description; numbered steps; checks before answering; boundaries; where to save), `template.md`, `voice.md`, optional `example.md` (one good report for an invented project that is in none of the packs). Version 2 or later; the footer line `Prepared with skill: status-report v<n>` stays at the end of the template. No facts from any pack inside the skill.
2. **Trigger test** (`skill_test.md`): excerpt of `opencode debug skill`; one matching request (reworded, output `a04/output/trigger_match.md`) and one near-miss request, each in a fresh session, with whether the skill loaded; if a test misfired, fixed and re-tested; otherwise a harder near-miss tested.
3. **Time experiment** (`experiment_log.md` + `output/`): coin results committed before the first timed run; laps (`laps.csv` or written times) with drafting and checking split for AI; both reports; checklist ticked; partner scores; build time; every error found while checking the AI report.
4. **Interpretation** (`REFLECTION.md` §1–2, max. 1 page): your result (minutes and quality, both conditions); comparison with Noy & Zhang, Brynjolfsson et al. and Dell'Acqua et al.; three threats to validity; break-even in report-weeks.
5. **Voice test** (`voice_test.md`): the two reports (with and without `voice.md`, same pack), rule violations counted in each; optionally a blind reader's pick with the X/Y coin (violation counts alone earn up to 3 of the 5 points).
6. **Delegation matrix** (`delegation_matrix.md`): six plausible recurring tasks (own work or a realistic target role) with both axes justified, zones and decisions; one task split into sub-tasks; your next skill candidate with a break-even estimate.
7. **Use-case scouting** (`scouting.md`): two or three candidate capstone use cases with all fields; your preferred one in one sentence (feeds team formation in S06).
8. **Cost and AI-use log** (`REFLECTION.md` §3 + table): spend before and after, AI-use log.

**How it is graded:** the rubric (100 points) is on the session page. Grading never depends on being faster with AI: an honest result that AI did not save time, well explained, earns full marks.

**Pack C (generalisation, 10 points).** After the deadline, the instructor runs your skill twice on a project week you have never seen (pack C), with a request that does not name the skill. Conditions:

- only your skill folder `.agents/skills/status-report/` from the submitted commit is used; the root `AGENTS.md` comes from the template (your a04 section is not used);
- the run is non-interactive, with shell commands off; nobody answers questions or approves anything;
- so the skill must not need shell commands or a question to the user;
- the score is the mean of the two runs; the skill counts as loaded if either run ends with the footer line; if neither does, the points are capped at 3;
- no skill folder in the submitted commit: 0 points for pack C and for skill design (the rest of A4 is graded normally).

## Cost

About $0.15–0.40 for the whole assignment (estimate: 12–15 agent tasks on Haiku 5.5 at about $0.01–0.03 each; the instructor pilot will replace this with a measured number). A fresh session for every task keeps the context, and the cost, small. Check your spend with `bash tools/check-setup.sh --usage`.

## If something goes wrong

| Problem | What to do |
|:--------|:-----------|
| `get-assignment.sh` says the template has no folder `a04/` yet | Wait a minute and retry. If it persists, copy your partner's `a04/` from GitHub. |
| `opencode debug skill` does not list the skill | `ls .agents/skills/*/SKILL.md` must show `.agents/skills/status-report/SKILL.md` at the repository root; the file name is exactly `SKILL.md`; if OpenCode was started before the folder existed, quit and restart. |
| Skill listed but never loaded (no footer line) | Description empty or vague; OpenCode not restarted after the last edit; the request does not match the description. Test once with an explicit request: `Use the status-report skill to ...` |
| The agent refuses to edit `.agents/skills/` | Check the a04 section in the root `AGENTS.md`, then restart; or name the folder in your request; or edit the file yourself in the VS Code editor. |
| OpenCode key problem | Do the manual condition now and the AI condition at home the same evening, with the same rules; write "home" in the log. Run `bash tools/check-setup.sh` for the diagnosis. |
| Haiku slow or endpoint errors | Retry once. If it persists, switch the model with `/models` to `openrouter/openai/gpt-5-nano` and write that into the log. |
| Timer forgotten | Reconstruct the times from the file times (`ls -l --time-style=full-iso a04/output/`) and your commit times; mark them as an estimate. |
| No time left for condition 2 | Finish at home the same evening with the same rules; write "home" in the log. |
| Copilot suggestions appear in the manual condition | Turn completions off (Copilot icon in the status bar) and note it in the log. |
| Key facts seen before a timed run | Note it in the log; that run's quality score is flagged, not discarded. |

## How to submit

As in A3: push your final commit, copy the commit URL from your repository's **History** on GitHub (`https://github.com/<your-username>/gen-ai-workbench/commit/<hash>`), and in **MS Teams → Assignments → A4** add it as a link plus a second link with your repository URL, then click **Turn in**. Make sure the commit contains both `a04/` and `.agents/skills/status-report/`.

## Rules

- Never write your API key into any file. A key in your git history costs 10 points.
- Every submission includes the AI-use log (`REFLECTION.md`); a missing log costs 10 points.
- Synthetic data only. The delegation matrix and the scouting describe tasks, never real company data; the voice sample is your own non-confidential writing. Real or confidential data costs 10 points.
- A skill is a set of instructions that runs with your permissions: read every skill before you install it, including your own after the agent has edited it.
