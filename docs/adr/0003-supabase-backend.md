# 0003. Supabase as the backend, no custom server

- **Status:** Accepted
- **Date:** 2026-10-01

## Context
The MVP needs auth, a relational database with transactions for money, and per-user data isolation. A small team shouldn't have to build and run an API server.

## Decision
- Use **Supabase**: Postgres, Auth (Google OAuth), Row Level Security, and Postgres functions called as RPCs.
- The browser talks to Supabase directly with the anon key. There is **no custom API server and no Edge Functions** in the MVP.
- Manage the schema with timestamped files in `supabase/migrations/`. An applied migration is never edited.
- Regenerate `src/types/database.ts` after every migration.

## Consequences
- ➕ Auth, database, API and hosting come ready-made, so we write much less code.
- ➕ Real Postgres: constraints, transactions and views.
- ➖ Security depends on RLS and RPC correctness, which must be tested with pgTAP ([0004](0004-rls-security-boundary.md)).
- ➖ Business rules are written in PL/pgSQL, which is less familiar than TypeScript.
- ➖ We depend on Supabase as a vendor, but it is plain Postgres underneath, so we can move.

## Alternatives considered
- **Node/Express API + Postgres:** full control, but much more code, hosting and auth work.
- **Firebase/Firestore:** no relational integrity, and a poor fit for ledger data.
