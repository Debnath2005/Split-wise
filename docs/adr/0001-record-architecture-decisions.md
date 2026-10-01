# 0001. Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-10-01

## Context
SPEC.md says *what* the app does. The reasons for *how* it is built get lost and are easy to undo by accident.

## Decision
- Record significant architecture decisions as numbered ADRs in `docs/adr/`, starting from `template.md`. Each ADR is under 40 lines.
- An accepted ADR is never rewritten. To change a decision, write a new ADR that replaces it, and mark the old one "Superseded by NNNN".
- Check for a relevant ADR before changing how something is built. If the change contradicts an accepted ADR, stop and ask the project owner.

## Consequences
- ➕ A short, searchable record of why the code is built the way it is.
- ➕ Accidental architectural drift gets caught early.
- ➖ A little extra writing for each architectural change.

## Alternatives considered
- **Decisions recorded only in SPEC.md:** mixes requirements with reasoning, and changes leave no history.
- **No written record:** reasons are forgotten and decisions get reversed by accident.
