# AGENTS.md before/after test

Does your change to the root `AGENTS.md` change what the agent does? Test it with the **same instruction** twice: once with the old `AGENTS.md`, once with the new one. Start a fresh agent session (`/new` in OpenCode) before **both** runs, so the agent remembers neither the earlier conversation nor the first answer.

Choose rules that change the *answer* to the instruction. The root file already keeps the agent out of `tasks/` and `tools/`, so repeating those rules shows no difference. Start from section 7 of your `a02/REFLECTION.md` ("What I would put into AGENTS.md next time"), then add rules that should change the answer to the instruction. Examples:

- "When you analyse errors, answer with a table: field, e-mail IDs, count, likely cause (one of the four prompt failures, schema, model limit, or label I may dispute)."
- "Never suggest a rule that names a specific customer, e-mail ID or order number."
- "Suggest prompt changes as a short diff; do not edit `a03/prompt.md` yourself."

If OpenCode does not work for you in the lab, do the test at home once it works.

## 1. The instruction (identical in both runs)

```text
Analyse the errors in my latest run and suggest the next change to my prompt.
```

(If you changed the wording, write the exact instruction you used.)

## 2. Answer before (old AGENTS.md, after `/new`)

Paste the agent's answer, or the relevant part of it, verbatim.

Tip: if copying from the OpenCode window is fiddly, type right after the answer, in the same session: *"Copy your last answer verbatim into section 2 of a03/agents_md_test.md. Change nothing else."* The answer already exists, so this does not affect the test. Check that it really is verbatim.

```text

```

## 3. What I added to AGENTS.md

Paste the diff: run `git diff AGENTS.md` from the repository root **before** you commit (after the commit it shows nothing). The a03 section has 3 to 8 rules. Each rule should be specific enough that you can check whether the agent followed it.

```diff

```

## 4. Answer after (new AGENTS.md, after `/new`)

As in section 2 (the tip works here too, with "section 4").

```text

```

## 5. What changed

Which rule changed which behaviour? Point to the concrete difference between the two answers. Which rule had no visible effect, and why do you think so?

Then commit both files: `git add a03 AGENTS.md`, then `git commit -m a03-agents-md-rules`.
