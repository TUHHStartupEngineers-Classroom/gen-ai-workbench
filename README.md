# gen-ai workbench

**Generative AI for Managers, WS 2026/27.** Your personal workbench for all individual assignments (A2 to A11).

You work here in a GitHub Codespace with a coding agent (OpenCode) and a capped OpenRouter key. Step-by-step setup, troubleshooting, and top-up rules:
<https://www.gen-ai.startupengineer.io/sessions/02_agent_workbench/setup.html>

## Quick start

1. Create your own copy: **Use this template → Create a new repository**, name `gen-ai-workbench`, visibility **Private**.
2. Add the instructor as collaborator: **Settings → Collaborators → Add people → `christophihl`**.
3. Store your course key as a Codespaces secret named `OPENROUTER_API_KEY` (GitHub profile → Settings → Codespaces → New secret, give this repository access).
4. Open a Codespace: **Code → Codespaces → Create codespace on main**.
5. In the terminal: `bash tools/check-setup.sh`. Every check `[ok]` and the last line says *All checks passed*? Start the agent with `opencode`.

**Stop your Codespace when you are done** (Codespaces → … → Stop). The free quota is limited.

## What is in this repository

| Path | What it is |
|:-----|:-----------|
| `a02/` | Assignment A2: supervised agent task (lab tasks, change requests, reflection template) |
| `AGENTS.md` | Standing instructions the agent reads before every run. You will improve it in S03. |
| `opencode.json` | Agent settings: default model, permissions (`ask` before edits and commands) |
| `tools/check-setup.sh` | Setup check; `--usage` shows your key's spend |
| `tools/get-assignment.sh` | Fetches the starter folder of a new assignment, e.g. `bash tools/get-assignment.sh a03` |
| `.devcontainer/` | Recipe that builds your Codespace and installs the agent |

## My assignments

One line per assignment: which task you chose.

- A2: T_ (fill in: T1, T2, or T3)

## How to submit an assignment

1. Commit and push your final work in the assignment folder (e.g. `git add a02/`, `git commit -m "..."`, `git push`).
2. On your repository page on GitHub, click **History** (the clock icon or commit count above the file list), then click the message of your final commit. Copy the URL from the address bar (`https://github.com/<your-username>/gen-ai-workbench/commit/<hash>`).
3. In **MS Teams → Assignments → A*N*** click **Add work → Link**, paste the commit URL, add a second link with your repository URL, then click **Turn in**.

Deadline: Friday 12:00 on the day of the next session. No late submissions.

## Rules

- **Never** put your API key into a file, a commit, a chat, or a screenshot. It lives only in the Codespaces secret. A key found in your git history costs 10 points and is revoked.
- Synthetic or public data only.
- Every submission includes an AI-use log (see `a02/REFLECTION.md`).
