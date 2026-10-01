# 0005. All writes go through security definer RPCs

- **Status:** Accepted
- **Date:** 2026-10-01

## Context
Creating an expense writes the expense, its splits, an activity row and its audience rows. Doing this as separate client inserts could leave partial data, and a modified client could write inconsistent money data.

## Decision
- Every mutation of money, membership, friendship or invite data goes through a `security definer` Postgres function, such as `create_expense`, `update_expense`, `delete_expense`, `record_settlement` or `accept_invite`.
- Each function sets `search_path = ''`, checks `auth.uid()` and permissions, validates the input, and writes all the rows plus the activity entry **in one transaction**.
- These tables have **no `insert`/`update`/`delete` grants** for `authenticated`. Only the user's own `profiles` row (name, UPI ID) can be updated directly.
- Zod validation in the client is only for UX. The SQL checks are what count.

## Consequences
- ➕ Writes are atomic. Money data can't be left half-written, and the activity log can't be skipped.
- ➕ Business rules live in one place, the database.
- ➖ Every new mutation needs an RPC, an activity verb, pgTAP tests and regenerated types.
- ➖ Validation exists twice (Zod and SQL).
- ➖ `security definer` functions run with high privileges, so each one must check permissions carefully.

## Alternatives considered
- **Direct table writes with RLS and triggers:** not atomic across several tables, and the rules end up scattered.
- **Edge Functions:** a second runtime and deployment for logic that Postgres handles well.
