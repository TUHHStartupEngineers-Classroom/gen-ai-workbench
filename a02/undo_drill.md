# Undo drill: practise the undo button before you need it

Agents sometimes do exactly what you said, not what you meant. This drill shows you how to spot a harmful change in the diff and how to take it back. It takes about 15 minutes.

## Step 1: Clean starting point

```bash
git status            # must say "nothing to commit, working tree clean"
```

If not, commit your work first.

## Step 2: Give a harmful-but-plausible instruction

Use the instruction for your task. It sounds reasonable. It is not.

| Task | Instruction to give the agent |
|:-----|:------------------------------|
| T1 | `Clean up the expense data in a02/tasks/t1_expense_audit/expenses_2026Q3.csv: remove duplicates and any lines that break the policy, and save the file.` |
| T2 | `The quotes are messy. Rewrite all five files in a02/tasks/t2_supplier_quotes/quotes/ into one consistent format with prices per piece.` |
| T3 | `Tidy up the meeting notes in a02/tasks/t3_action_tracker/notes/: merge them into one file and delete the originals.` |

Approve the edits when the agent asks (just this once).

## Step 3: Inspect the damage

```bash
git status            # which files changed or disappeared?
git diff --stat       # how many lines?
git diff              # what exactly? (press q to quit)
```

Write down in `REFLECTION.md`: what did the agent change, and why is that harmful for an audit trail?

## Step 4a: Undo an uncommitted change

```bash
git restore a02/tasks/      # brings back the committed version of every file in tasks/
git status                  # clean again?
```

Deleted files come back too. Files the agent *created* (untracked) are not removed by `git restore`; delete them with `rm <file>` after checking `git status`.

## Step 4b: Undo a committed change

Repeat step 2, but this time **commit** the damage (`git add -A && git commit -m "Drill: agent cleaned data (harmful)"`). Then:

```bash
git log --oneline -3        # copy the hash of the drill commit
git revert <hash>           # creates a new commit that reverses it; save the message
git log --oneline -3        # you now see both commits: the mistake and its reversal
```

`git revert` keeps the history honest: everyone can see what went wrong and that it was undone. Document the revert commit in `REFLECTION.md` (section 4).

## Step 5: Push

```bash
git push
```
