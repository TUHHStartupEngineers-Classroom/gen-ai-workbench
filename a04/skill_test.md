# Trigger test

A good skill loads when the request matches its description, and only then. Use `pack_B` for this test. Test it with two requests, each in a **fresh session**: quit OpenCode and start it again from the repository root before each request.

Evidence that the skill loaded: the report ends with the footer line `Prepared with skill: status-report v<n>`, and the OpenCode window shows a call of the `skill` tool for `status-report` (if your window shows tool calls). Report what you saw, not what you expected.

## 1. Does OpenCode find the skill?

Run in terminal 2 and paste the output:

```bash
opencode debug skill | grep -E '^ *"(name|location)":'
```

```text

```

Expected: two skills, the built-in `customize-opencode` and `status-report` with the location `.agents/skills/status-report/SKILL.md`.

## 2. The description I tested

Paste the `description` line from `.agents/skills/status-report/SKILL.md` exactly as it was during the test.

```text

```

## 3. Matching request (should load the skill)

Reword the request: not the lab request word for word, and not naming the skill. Save the output as `a04/output/trigger_match.md`. Example:

```text
Our managing director needs this week's update for the project in a04/tasks/pack_B/. Please save it as a04/output/trigger_match.md.
```

- Request (exact text):
- Footer line in `trigger_match.md`? (yes / no, version):
- `skill` tool call visible? (yes / no / window does not show it):
- Loaded as expected? (yes / no):

## 4. Near-miss request (should NOT load the skill)

A near miss is a request close to the task that must not trigger the skill, for example summarising one single e-mail from `pack_B`, or a different kind of document. If it writes a file, save it as `a04/output/trigger_nearmiss.md`.

- Request (exact text):
- Footer line in the output? (yes / no):
- `skill` tool call visible? (yes / no / window does not show it):
- Stayed quiet as expected? (yes / no):

## 5. Misfire fixed, or a harder near miss

- **If a test misfired** (no load on the matching request, or a load on the near miss): what you changed in the description (before → after), why, and the result of the re-test in a fresh session.
- **Otherwise:** test a harder near miss (closer to the task) in a fresh session and report it.

| | Description | Request | Result |
|:--|:--|:--|:--|
| First test | | | |
| Fix and re-test, or harder near miss | | | |

This file goes into your `a04-final` commit (`git add a04 .agents AGENTS.md`).
