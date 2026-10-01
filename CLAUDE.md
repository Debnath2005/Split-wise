# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Splitwise-style expense splitter, mobile-first, INR only. Stack: Vite + React + TypeScript, Tailwind, TanStack Query, Supabase (Google OAuth, Postgres, RLS, RPCs). Build order follows the SPEC.md milestones (M0–M10).

## Rules

- **Follow `SPEC.md`.** If something isn't in it, ask before building it.
- **ADRs live in `docs/adr/`.** Before changing how something is built, check for a relevant ADR. If a change would contradict an accepted ADR, stop and ask instead of going ahead.
- **UI** follows `DESIGN.md` and uses only components from `src/components/ui/`.
- **TypeScript strict.** Money is always integer paise, never floats.
- **All money maths lives in `src/lib/money/`**, with unit tests.

## Architecture (details in SPEC.md §3–§5)

- The client reads tables and views through RLS. Every write goes through a `security definer` RPC, which validates, writes the rows, and logs `activities` + `activity_audience` in one transaction. Money tables have no direct write grants.
- The split logic is in `src/lib/money/split.ts` and again in the RPCs (the server recomputes and is authoritative). Change both together.
- Balances come from views and are never stored. Deletes are soft and can be restored. Simplify-debts runs on the client only.
- Never edit an applied migration. Add a new one, then regenerate `src/types/database.ts`.

## Commands

```bash
npm run dev            # Vite dev server (npm run dev -- --host for phone on LAN)
npm test               # Vitest; single test: npx vitest run <file> -t "<name>"
npm run lint           # ESLint, zero warnings allowed
npm run build          # tsc -b + vite build
npm run format         # Prettier (Markdown is ignored)
npm run db:start       # local Supabase (needs Docker); prints URL + anon key for .env.local
npm run db:reset       # re-apply supabase/migrations
npm run db:test        # pgTAP tests in supabase/tests
npm run db:types       # regenerate src/types/database.ts after every migration
```

## Finishing a task

1. Run tests, lint, and the build. Fix any failures before continuing.
2. Report the results, and list exactly what the user should check manually on a phone.
3. Wait for the user to confirm it works. **Do not commit before confirmation.**
4. If the user reports a problem, fix it and repeat from step 1.
5. Only after confirmation, commit with a clear message.

Never commit failing tests or a broken build.
