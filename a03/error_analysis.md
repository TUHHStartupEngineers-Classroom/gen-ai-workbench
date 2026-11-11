# A3 Error analysis

**Final dev run analysed:** (run name, e.g. `v6_r1`)  · **Mean field accuracy:**  · **Date:**

Start from `output/runs/<run name>/errors.md`. An agent may group the errors for you, but check at least two of its claimed patterns against the e-mails yourself and say which ones you checked.

## The three most frequent error patterns

Describe each pattern in one sentence (what goes wrong, not which e-mail). Root cause: **specification** (the instruction is missing or unclear; name which of the four prompt failures it is), **schema** (the answer format allows the error), **model limit** (clear instruction, model still fails), or **label** (you think the label is wrong; give your argument with reference to `LABELS.md`).

### Pattern 1:

| | |
|:--|:--|
| Field(s) | |
| E-mail IDs and count | |
| Root cause | |
| Checked against the e-mails? (which IDs) | |
| What I tried (version) | |
| Measured effect (from `--compare`) | |

### Pattern 2:

| | |
|:--|:--|
| Field(s) | |
| E-mail IDs and count | |
| Root cause | |
| Checked against the e-mails? (which IDs) | |
| What I tried (version) | |
| Measured effect (from `--compare`) | |

### Pattern 3:

| | |
|:--|:--|
| Field(s) | |
| E-mail IDs and count | |
| Root cause | |
| Checked against the e-mails? (which IDs) | |
| What I tried (version) | |
| Measured effect (from `--compare`) | |

## One remaining risk in production

Which kind of e-mail would your pipeline still get wrong if it processed 2,000 real e-mails a month, what would that cost the business, and how would you mitigate it (rule change, human review, monitoring)?
