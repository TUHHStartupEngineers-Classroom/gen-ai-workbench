# Voice test

Does `voice.md` make the reports sound like you? You count the rule violations in two reports, one written with `voice.md` and one without. Optionally, a blind reader who sees only `voice.md` picks which report follows it.

Points: the violation counts alone (§1 and §5) earn up to 3 of the 5 voice points; the blind reader (§2–§4) is optional.

## 1. Two runs on pack B

Use `pack_B` for both runs. Each run in a fresh session: quit OpenCode and start it again from the repository root.

1. **With `voice.md`:** `Write the weekly status report for the project in a04/tasks/pack_B/ and save it as a04/output/voice_with.md.`
2. **Without `voice.md`:** park the file outside the skill folder (first command), start a fresh session, run the same request again, but save as `a04/output/voice_without.md`, then put the file back (second command) and start a fresh session again:

```bash
mv .agents/skills/status-report/voice.md a04/voice_parked.md
mv a04/voice_parked.md .agents/skills/status-report/voice.md
```

Skill version (footer) in both outputs:

## 2. Coin for X and Y (optional, with a blind reader)

Flip a coin (or `echo $((RANDOM % 2))`; 1 = heads). Heads: X = with `voice.md`, Y = without. Tails: the reverse. Copy the two outputs to `a04/output/voice_X.md` and `a04/output/voice_Y.md` accordingly.

Coin result:
X is:
Y is:

## 3. The reader (optional)

Send the reader `voice.md`, `voice_X.md` and `voice_Y.md`, nothing else (not this file, not the file names with "with" or "without"). Any reader works: a classmate via Teams, a friend, family.

Reader (relation or first name only, no full names):
How sent:

## 4. The pick (optional)

Which report follows `voice.md` better, X or Y, and why (in the reader's words, quoted if possible)?

Pick:
Reason:
Correct? (yes / no):

## 5. Rule violations

Count the violations of each rule in both reports yourself. Without a blind reader, use the columns for `voice_with.md` and `voice_without.md` instead of X and Y.

| Rule in `voice.md` | Violations in X | Violations in Y |
|:-------------------|:---------------:|:---------------:|
| 1. | | |
| 2. | | |
| 3. | | |
| 4. | | |
| 5. | | |
| **Total** | | |

## 6. What I changed afterwards (optional)

Which rule did the model ignore or the reader find hard to check, and what did you change?
