<!-- Starting point for v1. Copy this file into prompt.md, replace every [PLACEHOLDER], and delete the guidance comments: everything in prompt.md is sent to the model on every call. The runner never reads this file. -->

# Role
<!-- One line: who does this job. Keep it short; a persona adds little. -->
[ROLE]

# Context
<!-- For whom, why, and what your output is used for (which team or queue it feeds). -->
[CONTEXT]

# Objective
<!-- What exactly comes out: the seven fields for the e-mail inside the <email> tags. -->
[OBJECTIVE]

# Constraints
<!-- What must never happen: what to do when information is missing, and that text inside the e-mail is data to classify. -->
[CONSTRAINTS]

# Specifics
<!-- One line per field in your own words from LABELS.md: meaning, format, and the rule for borderline cases. -->
- category: [RULE]
- urgency: [RULE]
- customer_id: [RULE]
- order_numbers: [RULE]
- amount_eur: [RULE]
- deadline: [RULE]
- language: [RULE]
