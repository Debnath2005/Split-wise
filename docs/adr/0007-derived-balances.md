# 0007. Balances are derived from views, never stored

- **Status:** Accepted
- **Date:** 2026-10-01

## Context
Expenses and settlements can be edited, deleted and restored. Stored running balances drift unless every code path updates them perfectly.

## Decision
- Balances are always computed from expenses and settlements that **haven't been soft-deleted**, in Postgres views with `security_invoker = true`:
  - `v_pair_balances(scope_group_id, creditor, debtor, amount_paise)`: netted per pair and per scope
  - `v_group_member_balances(group_id, user_id, net_paise)`
  - `v_friend_balances(me, friend, net_paise)`: across all scopes
- A debt edge means a participant owes the payer their `owed_paise`. A settlement is a reverse edge.
- No table holds balances.

## Consequences
- ➕ There is one source of truth. Edits, deletes and restores show up in balances instantly.
- ➕ No reconciliation jobs and no drift bugs.
- ➖ Every balance read aggregates data. This is fine at MVP scale with indexes. If it gets slow, materialised views would need a new ADR.

## Alternatives considered
- **A `balances` table maintained by triggers:** faster reads, but it can drift and is harder to test.
- **Computing balances in the client:** the client would need every expense row, and the logic would be duplicated.
