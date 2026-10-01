# 0004. Row Level Security is the security boundary

- **Status:** Accepted
- **Date:** 2026-10-01

## Context
The browser holds the public anon key and queries Postgres directly. Any check done in the React code can be bypassed, so the database itself must decide what each user can see.

## Decision
- **Every table has RLS enabled.** Access is based on `auth.uid()`.
- Policies use `security definer stable` helpers (`is_group_member(gid)`, `is_friend(uid)`) so policies don't recurse.
- Views use `security_invoker = true`, so a view never shows rows the underlying policies would hide.
- Visibility rules:
  - group data: members only
  - non-group expenses and settlements: the people involved
  - activity: rows in `activity_audience`
  - invites: the inviter, or a preview through an RPC
- Client-side checks are only for a better UI, never for security.
- Every policy has pgTAP tests, including "user C cannot read group G".

## Consequences
- ➕ A single enforcement point that no client can get around.
- ➕ Read queries stay simple and need no API layer.
- ➖ A missing or wrong policy means a data leak, so policy tests are required.
- ➖ Complex policies can slow queries down, so supporting indexes are needed.

## Alternatives considered
- **Authorisation in an API server:** needs a server we chose not to run ([0003](0003-supabase-backend.md)).
- **Filtering in the client:** not secure.
