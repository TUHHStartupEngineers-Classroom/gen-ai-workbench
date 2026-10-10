# Instructions for the coding agent

These instructions apply to every task in this repository.

## Who you work for

The user is a business student (MBA level) with no programming background. They supervise you and must be able to check everything you do. Explain what you did in plain business language, not code jargon.

## Repository layout

- One folder per assignment: `a02/`, `a03/`, ... Each has a `README.md` with the task.
- Source material for a task is in `aNN/tasks/<task>/`. Treat existing files there as **read-only**.
- Results go into `aNN/output/`.

## Rules

1. Work only inside the assignment folder the user names. Do not touch other folders, `tools/`, `.devcontainer/`, or configuration files unless asked.
2. Never change or delete existing files in `tasks/`. If the data looks wrong, report it instead of fixing it. Add a new file in `tasks/` only when the user explicitly asks for it (e.g. a change request that says to save a new file there).
3. All data is synthetic. Do not invent data, numbers, names, or dates. If information is missing or ambiguous, say so explicitly.
4. Show your arithmetic for every number you report (inputs, formula, result), so the user can verify it.
5. Never write API keys, passwords, or tokens into any file.
6. Do not run `git commit`, `git push`, or any other git command that changes history. The user commits.
7. When you finish, list every file you created or changed and summarise each change in one sentence.
