# 0010. Simplify debts runs on the client only

- **Status:** Accepted
- **Date:** 2026-10-01

## Context
Circular debts in a group (A→B→C→A) lead to unnecessary payments. Simplifying changes only how payments are *suggested*, not what anyone owes.

## Decision
- Add a per-group toggle, `groups.simplify_debts` (default `true`).
- `src/lib/money/simplify.ts` is a pure function. It takes the member nets from `v_group_member_balances` and greedily matches the largest creditor with the largest debtor, breaking ties by user id. This gives at most n−1 transfers.
- The result is **never stored**, and expenses are never rewritten.
- It applies within a group only. Friend-level and non-group balances stay pairwise.
- Settle-up suggestions follow the active mode.

## Consequences
- ➕ No second source of truth, and toggling is instant.
- ➕ Easy to test with property tests (after the transfers every net is 0, using ≤ n−1 transfers).
- ➖ Greedy matching isn't always the absolute minimum number of transfers, but it never exceeds n−1.
- ➖ Different clients could show different suggestions if the code versions differ. Determinism keeps this rare.

## Alternatives considered
- **Storing simplified debts server-side:** goes stale on every edit.
- **An optimal minimum-transfer algorithm:** NP-hard, and not worth it at group sizes.
