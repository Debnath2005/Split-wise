# 0012. Google OAuth as the only login

- **Status:** Accepted
- **Date:** 2026-10-01

## Context
Logging in must be quick on phones. Passwords mean extra flows, and phone OTP needs a paid SMS provider.

## Decision
- Supabase Auth with **Google OAuth only**.
- A trigger on `auth.users` creates the `profiles` row.
- Every route except `/login`, `/auth/callback` and `/invite/:token` requires a session. The intended route is kept across the OAuth redirect.

## Consequences
- ➕ One-tap login on Android, with no password storage or reset flows.
- ➖ Users without a Google account can't join.

## Alternatives considered
- **Magic link:** switching to an email app is slow on phones.
- **Phone OTP:** costs money for SMS. Possible later.
- **Email + password:** extra work for little benefit.
