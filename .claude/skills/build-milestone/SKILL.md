---
name: build-milestone
description: Plan, build, verify and commit one milestone from SPEC.md (e.g. M3), stopping for approval before building and before committing.
argument-hint: <milestone-id e.g. M3>
disable-model-invocation: true
---

# Build milestone $ARGUMENTS

If `$ARGUMENTS` is empty or doesn't match a milestone heading in `SPEC.md` §9 (`### M<n>: …`), list the milestones and ask which one to build. Stop there.

## 1. Read

- Read the `$ARGUMENTS` section of `SPEC.md` §9, plus every feature, schema, RLS and RPC section it touches.
- Read `docs/adr/README.md`, then every ADR that is relevant to this milestone.
- Read `CLAUDE.md`, and `DESIGN.md` if it exists.
- Check that the earlier milestones are done (their code and tests exist). If one isn't, tell the user and ask whether to continue.

## 2. Plan, then STOP

Present the plan:

- the goal and the milestone's "Done when" criteria, quoted from SPEC.md
- the files and migrations to create or change, plus any new RPCs, policies and components
- the tests to add: unit tests for `src/lib/money`, pgTAP tests for RLS and RPCs, and E2E tests where SPEC asks for them
- the ADRs that apply, and how the plan follows them
- **anything missing from SPEC.md, or anything that would contradict an accepted ADR, listed as questions**

Then **wait for the user's approval.** Don't write any code until they say yes. If they ask for changes, revise the plan and ask again.

## 3. Build

- Build only the approved scope. If something comes up that isn't in SPEC.md, or a change would contradict an ADR, stop and ask.
- Follow the rules in CLAUDE.md: TypeScript strict, money in integer paise, money maths only in `src/lib/money/` with tests, UI only from `src/components/ui/`, writes through RPCs, and new migrations rather than edits to applied ones.
- After any migration, regenerate `src/types/database.ts`.

## 4. Verify

Run every check that exists in the project:

- tests (`npm test`, and `supabase test db` when there are DB changes)
- `npm run lint`
- `npm run build`
- `npx playwright test` if E2E tests exist

Fix any failure and run all the checks again. Repeat until everything passes. Never move on with something red.

## 5. Report, then STOP

- Show the results of every check: pass/fail counts and anything that was skipped, with the reason.
- Go through the milestone's "Done when" criteria and mark each one as met or not.
- Give a numbered list of **exactly what to check manually on a phone**: the screen or URL, the steps, and the expected result, including the 360px layout and tap targets where they're relevant.
- Explain how to open the app on a phone (for example `npm run dev -- --host` and the LAN URL).

Then **wait for the user to confirm.** Don't commit anything yet.

## 6. Fix loop

If the user reports a problem, fix it and go back to step 4.

## 7. Commit (only after confirmation)

- If the folder isn't a git repository yet, run `git init` first.
- Run `git status`, and stage only the files for this milestone. Never stage `.env` files or secrets.
- Commit with a message like `feat(M<n>): <milestone title>` and a short body listing what was built. Follow any commit attribution rules that apply.
- Never commit when a test fails or the build is broken.
- Report the commit hash. Don't push.
