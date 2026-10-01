# 0018. Defer Google sign-in; show the button as "Coming soon"

- **Status:** Accepted
- **Date:** 2026-10-01
- **Supersedes:** the Google part of [0017](0017-email-password-and-google-login.md)

## Context
Getting Google OAuth working (a Google Cloud client, redirect URIs for local, preview and production, provider config in each Supabase environment) is slowing M1 down. Email + password covers everyone.

## Decision
- **Email + password is the only working sign-in method** for now. Everything else in 0017 still applies.
- `/login` still shows "Continue with Google", but **disabled**, with a "Coming soon" note.
- The Google plumbing stays in the code (`signInWithGoogle`, `/auth/callback`). The provider is disabled in the local `supabase/config.toml`.
- To turn it on later: enable the button, enable the provider in each environment, and write an ADR that supersedes this one.

## Consequences
- ➕ M1 needs no OAuth setup to test, on any device.
- ➕ Re-enabling Google is a small change.
- ➖ A visible button that does nothing. The "Coming soon" note must make that clear.
- ➖ Android users lose the one-tap option for now.

## Alternatives considered
- **Remove the button completely:** cleaner, but the user wants it to stay visible.
- **Keep Google working:** blocked on OAuth setup.
