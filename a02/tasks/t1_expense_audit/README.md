# T1 · Travel-expense audit (Controlling)

All companies, people, and numbers are synthetic.

**Business situation.** You work in Controlling at Nordhafen Logistik GmbH, a Hamburg logistics company. Every quarter, Controlling checks all submitted travel expenses against the travel policy before they are reimbursed. The Q3 2026 file has 60 expense lines from 8 employees, in EUR, USD, and GBP. Your head of Controlling wants the audit by Monday.

**Source files (read-only):**

| File | Content |
|:-----|:--------|
| `expenses_2026Q3.csv` | All Q3 expense lines (one row per expense) |
| `travel_policy.md` | The rules: currency rates, caps, receipts, weekends, duplicates |

**Deliverable:** `a02/output/t1_findings.md` with

1. a table of every flagged line: line ID, employee, date, category, original amount and currency, amount in EUR, rule broken (policy section), amount at risk in EUR;
2. the **total amount at risk** in EUR;
3. a short note on anything you could not decide from the files.

**What good looks like.** Every flag cites a policy rule and can be traced to one line in the CSV. Every number can be recomputed from the source. No line is flagged that complies with the policy.

## Starter instruction (deliberately thin, improve it)

```text
Check the expenses against the policy and write the findings to a02/output/t1_findings.md.
```

Before you run the agent: read both files yourself (`head`, `cat`, `wc -l`). Then decide what the agent must be told so that you can trust its result.

## Before you commit: verify

Pick at least three flagged lines and one line the agent did *not* flag, and check each against the CSV and the policy by hand. Note what you checked in `a02/REFLECTION.md`.
