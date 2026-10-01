# 0016. Mobile-first UI from a shared component set

- **Status:** Accepted
- **Date:** 2026-10-01

## Context
Most users will be on phones, often one-handed. A consistent look needs a single set of components.

## Decision
- Design for a **360px** width first and scale up with Tailwind breakpoints.
- Navigation is a bottom tab bar plus a floating "+" Add expense button. At `md` and wider it becomes a sidebar.
- Tap targets are ≥ 44px. The layout respects safe-area insets. Amount inputs use `inputmode="decimal"`.
- Screens follow `DESIGN.md` and use **only components from `src/components/ui/`**.
- Money writes wait for the server, with no optimistic updates.
- Targets: Lighthouse mobile Performance ≥ 90 and Accessibility ≥ 95.

## Consequences
- ➕ Built for how the app will actually be used, with a consistent look.
- ➖ Every feature needs a manual check on a real phone before it is accepted.
- ➖ Any new UI pattern first needs a new component in `src/components/ui/`.

## Alternatives considered
- **Desktop-first:** doesn't match how the app will be used.
- **A third-party component kit:** heavier and harder to fit to `DESIGN.md`.
