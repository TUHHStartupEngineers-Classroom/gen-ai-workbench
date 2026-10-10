# A2 · Supervised agent task in your repository

**Due: Friday, 13 November 2026, 12:00.** Weight: 5%. No late submissions; extensions only if requested before the deadline.
Full brief and rubric: <https://www.gen-ai.startupengineer.io/sessions/02_agent_workbench/session.html>

You start A2 in the S02 lab and finish it at home. Pick **one** task: T1, T2, or T3.

| Task | Folder | Business area |
|:-----|:-------|:--------------|
| T1 Travel-expense audit | `tasks/t1_expense_audit/` | Controlling |
| T2 Supplier-quote comparison | `tasks/t2_supplier_quotes/` | Procurement |
| T3 Meeting notes → action tracker | `tasks/t3_action_tracker/` | Project management |

## What you do

1. **Finish the lab task** so that the output in `a02/output/` is complete and correct. Each task has one point where agents typically go wrong. Only verification finds it.
2. **Execute the change request** in your task folder (`change_request.md`). The agent must update all outputs consistently.
3. **Use git as your undo button.** Your history shows at least **5 meaningful commits** (message says what and why) and at least **one deliberate undo** (`git restore` or `git revert --no-edit <hash>`, documented in your reflection: why the change was wrong and how the diff showed it). Undoing a real agent error you found during the task is the best evidence. Start with `undo_drill.md`.
4. **Write `REFLECTION.md`** (max. 1 page plus the AI-use log table).
5. **Update the root `README.md`**: fill in the line under *My assignments* with the task you chose (e.g. `A2: T1 travel-expense audit`).

## Workflow for every agent run

1. Commit before the run (`git add a02/ && git commit -m "..."`). If git says `nothing to commit, working tree clean`, everything is already committed: go ahead.
2. Give the agent a precise instruction. Keep permissions on `ask` and read what it wants to do before you approve.
3. Review the change: `git diff` (or the Source Control view).
4. Verify at least three items against the source files.
5. Commit, or undo.

Check your spend any time with `bash tools/check-setup.sh --usage`.

## Rules

- Do **not** change or delete the existing source files in `tasks/`. The only new file there is the one the change request asks you to save.
- Outputs go into `a02/output/`.
- Never write your API key into any file.

## How to submit

1. Push your final commit (`git push`) and check on GitHub that it arrived.
2. On your repository page on GitHub, click **History** (the clock icon or commit count above the file list), then click the message of your final commit. Copy the URL from the address bar: `https://github.com/<your-username>/gen-ai-workbench/commit/<hash>`.
3. In MS Teams: **Assignments → A2: Supervised agent task → Add work → Link**, paste the commit URL. Add a second link with your repository URL.
4. Click **Turn in** and check that the status shows *Turned in*.

The instructor (`christophihl`) must be a collaborator on your repository, otherwise your work cannot be graded.
