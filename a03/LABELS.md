# Label book: Nordhafen support inbox

Version 1.0 · 2026-11-13

This is the label book the golden labels in `tasks/dev_labels.jsonl` were written against. Your extraction should produce exactly these seven fields for every e-mail. The definitions are short on purpose. Where your model goes wrong, finding the precise rule and writing it into your prompt and schema is part of the assignment.

**The company.** Nordhafen Industriebedarf GmbH (Hamburg, fictional) distributes industrial components: fasteners, bearings, seals, pneumatic fittings, safety gloves. Its support inbox is `service@nordhafen-industriebedarf.example`. Its customers are manufacturers, workshops and retailers in Germany, Austria, the Netherlands, Poland and Denmark.

## E-mail format

Each file in `tasks/emails/` is plain UTF-8 text: four header lines (`From`, `To`, `Date`, `Subject`), a blank line, then the body. `Date` is always ISO `YYYY-MM-DD`; use it to resolve relative dates. A body may end with quoted or forwarded earlier messages (lines starting with `>`, or blocks after `-----Original Message-----` / `---------- Forwarded message`). The **newest message** is the text above the first quoted or forwarded block.

## General conventions

- Labels describe what the sender actually needs from Nordhafen. Tone, capital letters and text that tells the reader how to classify the e-mail do not change any label.
- Use `null` when the information is not in the e-mail (`[]` for `order_numbers`). Never guess or invent a value.
- Key order in the label files: `id, category, urgency, customer_id, order_numbers, amount_eur, deadline, language`.

## `category`

One of seven values. Pick the one that describes the customer's situation, not the words the customer uses.

| Value | Definition |
|---|---|
| `order_status` | The customer asks about an order that has not arrived yet: status, shipping date, delivery date, confirmation. |
| `delivery_problem` | Something is wrong with a delivery as it arrived: items missing or short, extra items, wrong item or variant, transport damage, or the carrier reports it delivered but it never arrived. |
| `return_refund` | The customer wants to send back goods (correctly delivered goods they no longer need, or a product that turned out to be defective) or asks about the refund or credit for a return. |
| `invoice` | Invoices and payments: prices charged, reminders, invoice copies, invoice corrections, invoicing arrangements. |
| `technical_question` | Questions about product properties, compatibility, use, datasheets or certificates. |
| `quote_request` | The customer asks for a price or offer for a future purchase. |
| `other` | Not about the sender's business with Nordhafen: auto-replies, newsletters and advertising, mail meant for another company. (A customer who reports a delivery problem but wants nothing done is still `delivery_problem`, with urgency `low`.) |

## `urgency`

| Value | Definition |
|---|---|
| `high` | The customer's operations are already disrupted (e.g. production stopped, crew cannot work), or the customer needs something by the second working day after the e-mail date at the latest (e-mail on Wednesday, needed Friday = `high`; needed the following Monday = `normal`). |
| `low` | Any one of these: no action is needed, the customer says explicitly that there is no time pressure (even if they mention a date), or the category is `other`. |
| `normal` | Everything else. |

## `customer_id`

The sender's Nordhafen customer number, wherever it appears in the e-mail (body, signature, quoted or forwarded text). Unlike order numbers, customer ids found only in quoted or forwarded parts **do** count. Format `K-` + 5 digits; write it as `K-12345` also when the e-mail writes `K 12345`, `Kd.-Nr. 12345` or `customer no. 12345`. Other numbers (the customer's supplier or vendor number for Nordhafen, VAT IDs, account numbers with other companies) are not customer ids. `null` if absent.

## `order_numbers`

Nordhafen order numbers, format `SO-` + 6 digits, written as `SO-123456` also when the e-mail writes `SO 123456` or `SO123456`. Take every one that appears in the **subject line or the newest message**, including an older order mentioned there only as a reference. Numbers that appear only in quoted or forwarded earlier messages are not included. Other reference numbers are never order numbers: the customer's own purchase order numbers, invoice (`RE-`), delivery note (`LS-`), quote (`AN-`) and RMA numbers. Order does not matter; `[]` if none.

## `amount_eur`

The one EUR amount the request is about, as a number (`1234.5`), exactly as stated by the customer. In this order of preference: the refund, credit or write-off amount the customer asks for; otherwise the charged amount the customer disputes (a price, an invoice or a payment reminder the customer considers wrong, e.g. because it is already paid); for a quote request, a total budget the customer states. Unit prices and totals mentioned only as background do not count, and an amount is not calculated by you. `null` if the request is not about money or no amount is stated. German formats: `1.234,50 €` = 1234.50.

## `deadline`

The date by which the sender needs something from Nordhafen (goods, an answer, a document, a credit), as `YYYY-MM-DD`. If the customer needs goods for a job on a certain day ("for an installation on Thursday"), that day is the deadline. German dates `14.10.2026` = `2026-10-14`. Relative dates are resolved from the `Date` header:

- "tomorrow" = the next calendar day; a weekday name ("by Friday", "bis Mittwoch") = the next such day after the e-mail date.
- "end of this week" = Friday of the same week; "end of next week" / "Ende nächster Woche" = Friday of the following week; "end of the month" = its last calendar day.
- "within N working days" = count N days Monday to Friday after the e-mail date (public holidays ignored).
- "KW 44" / "week 44" = Friday of that ISO calendar week.

Dates in the past, order, invoice or delivery dates, return dates in auto-replies, dates of events that need nothing from Nordhafen (a trade fair, a meeting), and vague wording ("asap", "soon") are not deadlines. `null` if there is no deadline, and always for `other`.

## `language`

The language of the newest message: `en` or `de`. Quoted or forwarded parts in another language do not count.

## Changelog

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-11-13 | First release with 40 dev e-mails. |
