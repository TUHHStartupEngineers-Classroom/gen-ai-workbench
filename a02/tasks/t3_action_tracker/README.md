# T3 · Meeting notes → action tracker (Project management)

All companies, people, and numbers are synthetic.

**Business situation.** Brightwater Home launches its Lumo smart thermostat on 20 October 2026. The project has had six weekly meetings, and every minute-taker used a different format. Actions are scattered across six files; nobody knows which ones are still open. The project lead, Lena Hartmann, asks you for a clean action tracker and a status e-mail to the steering committee, **as of the meeting on 6 October 2026**.

**Source files (read-only):** six meeting notes in `notes/`, one per meeting (2026-09-01 to 2026-10-06).

**Deliverables:**

1. `a02/output/t3_actions.csv`: one row per action with: action_id, action, owner, due_date (YYYY-MM-DD), source_file (where the action was first agreed), status (`done` / `open` / `overdue` as of 2026-10-06), last_update_file, note.
2. `a02/output/t3_status_email.md`: a status e-mail draft to the steering committee (max. 200 words): what is done, what is open, what is overdue or at risk, and what needs a decision.

**What good looks like.** Every action appears once, with its *current* owner and due date. Every status is supported by a sentence in the notes. The e-mail invents nothing.

## Starter instruction (deliberately thin, improve it)

```text
Read the meeting notes and make a list of all action items with owner and due date in output/t3_actions.csv. Then write a status e-mail.
```

Before you run the agent: skim all six files yourself (`ls notes`, `cat`). Track one action through all meetings. What can change about an action between meetings?

## Before you commit: verify

Pick at least three actions and trace each through every meeting file by hand: owner, due date, status. Check every "overdue" in the tracker. Note what you checked in `a02/REFLECTION.md`.
