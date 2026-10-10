# Undo drill: practise the undo button before you need it

Agents sometimes do exactly what you said, not what you meant. This drill shows you how to spot a harmful change in the diff and how to take it back. Steps 1–4a take about 15 minutes in class; step 4b is optional in class and can be done at home for A2.

## Step 1: Clean starting point

You need a committed output file from your task (e.g. `a02/output/t1_findings.md`).

```bash
git status            # must say "nothing to commit, working tree clean"
```

If not, review and commit your work first (`git add a02/ && git commit -m "..."`).

## Step 2: Give a harmful-but-plausible instruction

Use the instruction for your task. It sounds reasonable. It is not: it throws away audit evidence from your own output.

| Task | Instruction to give the agent |
|:-----|:------------------------------|
| T1 | `Clean up a02/output/t1_findings.md: remove every line you are not sure about, and save the file.` |
| T2 | `Clean up a02/output/t2_comparison.csv: remove every row you are not sure about, and save the file.` |
| T3 | `Clean up a02/output/t3_actions.csv: remove every action you are not sure about, and save the file.` |

Approve the edits when the agent asks (just this once).

**If the agent refuses** or asks you to confirm which lines: that is a rule working, and a good sign. Make the damage yourself instead: open the output file in the editor, delete a few lines, save, and continue with step 3.

## Step 3: Inspect the damage

```bash
git status            # which files changed?
git diff --stat       # how many lines?
git diff              # what exactly? (press q to quit)
```

Write down in `REFLECTION.md` (section 5): what changed, why is that harmful for an audit trail, and how did the diff show it?

## Step 4a: Undo an uncommitted change

```bash
git restore a02/output/     # brings back the committed version of every file in a02/output/
git status                  # clean again?
```

Deleted files come back too. Files the agent *created* (untracked) are not removed by `git restore`; delete them with `rm <file>` after checking `git status`.

## Step 4b (optional in class, at home for A2): Undo a committed change

Repeat step 2, but this time **commit** the damage (`git add a02/ && git commit -m "Drill: agent cleaned up findings (harmful)"`). Then:

```bash
git log --oneline -3              # copy the hash of the drill commit
git revert --no-edit <hash>       # creates the undo commit itself; nothing else to add or commit
git log --oneline -3              # you now see both commits: the mistake and its reversal
```

`git revert` keeps the history honest: everyone can see what went wrong and that it was undone. Paste the commit URL of your revert into `REFLECTION.md` (section 5).

An undo of a *real* agent error that you found during the task is even better evidence than this drill. Document it the same way.

## Step 5: Push

```bash
git push
```
