# T2 · Supplier-quote comparison (Procurement)

All companies, people, and numbers are synthetic.

**Business situation.** You work in Procurement at Kessler Haustechnik GmbH. Production needs 20,000 stainless-steel bolts for heat-pump housings. Five suppliers have sent quotes, each in its own format. The buyer wants a comparison table and a recommendation for tomorrow's sourcing meeting.

**Source files (read-only):**

| File | Content |
|:-----|:--------|
| `requirements.md` | What we need, by when, the mandatory certificate, and how to compare (landed cost, freight table, CHF rate) |
| `quotes/q1_*.md` … `quotes/q5_*.md` | The five supplier quotes |

**Deliverables:**

1. `a02/output/t2_comparison.csv`: one row per quote with at least: supplier, quote file, quoted price as written, price unit, currency, Incoterm, price per piece in EUR, goods total EUR, freight/clearance EUR, surcharges EUR, landed total EUR, 3.1 certificate (yes/no), meets delivery date (yes/no), compliant (yes/no), rank among compliant quotes.
2. `a02/output/t2_recommendation.md`: one paragraph recommending a supplier, with the landed total and the reasons the other quotes lose or are excluded.

**What good looks like.** Every quote is normalised to the same basis (EUR per piece, landed in Hamburg, 20,000 pieces). Every number can be traced to a quote and the requirements. The recommended supplier meets every mandatory requirement.

## Starter instruction (deliberately thin, improve it)

```text
Compare the five quotes and tell me which supplier is cheapest. Save a table to output/t2_comparison.csv.
```

Before you run the agent: read the requirements and at least two quotes yourself. What could make a quote look cheaper than it is?

## Before you commit: verify

Recompute the landed total of at least three quotes by hand (or with a calculator), including the one the agent recommends. Check the certificate and delivery date of the recommended supplier against the quote. Note what you checked in `a02/REFLECTION.md`.
