# 0008. Server recomputes splits and is authoritative

- **Status:** Accepted
- **Date:** 2026-10-01

## Context
The add-expense form needs instant per-person amounts, but the client can't be trusted to decide what is stored. Totals often don't divide evenly (₹100 / 3).

## Decision
- **Rounding is deterministic:**
  - equal: `floor(total / n)`, with leftover paise +1 each to participants sorted by user id
  - percent: largest-remainder method, ties broken by user id
  - exact: the amounts must add up to the total
- The algorithm is written in `src/lib/money/split.ts` for live UI feedback **and** in PL/pgSQL inside the expense RPCs.
- The RPC **recomputes the splits and rejects any mismatch**. The server's result is what gets stored.
- A constraint trigger enforces `sum(owed_paise) = amount_paise`.
- `input_value` keeps what the user entered, so editing can reproduce the form.

## Consequences
- ➕ Stored data is always valid and consistent, whatever the client sends.
- ➕ The same input gives the same result on every device.
- ➖ There are two implementations. They must change in the same commit, with matching tests on both sides.

## Alternatives considered
- **Server-only calculation:** no live preview while typing.
- **Trusting the client:** a modified client could store arbitrary splits.
