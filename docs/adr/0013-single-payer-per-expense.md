# 0013. Exactly one payer per expense

- **Status:** Accepted
- **Date:** 2026-10-01

## Context
Supporting several payers per expense makes the form, the validation and the pairwise balance definition more complex.

## Decision
- `expenses.paid_by` is a single user.
- A debt edge is "participant owes payer `owed_paise`" for every split where `user_id <> paid_by`.

## Consequences
- ➕ Simple form, simple and unambiguous pairwise balances.
- ➖ An expense paid jointly must be entered as two expenses.
- ➖ Adding several payers later needs a payers table and a new ADR.

## Alternatives considered
- **A `paid_paise` column on each split:** the pairwise balance becomes unclear, and the UI cost is high for an MVP.
