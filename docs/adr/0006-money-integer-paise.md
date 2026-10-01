# 0006. Money stored as integer paise

- **Status:** Accepted
- **Date:** 2026-10-01

## Context
Floats can't represent most decimal amounts exactly (`0.1 + 0.2 !== 0.3`). A one-paisa drift leaves balances that never reach zero.

## Decision
- Every amount is an **integer number of paise**: a `bigint` column named `*_paise` in Postgres, and a `number` in TypeScript (safe up to 2^53).
- **Percentages are integer basis points** (10000 = 100%).
- Input is parsed **as a string** into paise and never with `parseFloat(x) * 100`. More than 2 decimal places is rejected.
- Paise are divided by 100 only for display (`Intl.NumberFormat('en-IN')`) and for the UPI `am=` parameter, which is built with integer maths.
- **All money maths lives in `src/lib/money/`** and has unit tests.
- **INR only.** `currency` has a `CHECK (currency = 'INR')`. The range is 1 paisa to 10^10 paise.

## Consequences
- ➕ Exact sums, so "splits add up to the total" can be checked strictly.
- ➕ Rounding is in one place and is tested.
- ➖ Every input and output must go through the money helpers. Any arithmetic outside them is a bug.
- ➖ Multi-currency would need a new ADR.

## Alternatives considered
- **Float rupees:** rounding drift.
- **Postgres `numeric` + decimal.js:** exact, but heavier and easy to mix with floats at the boundaries.
