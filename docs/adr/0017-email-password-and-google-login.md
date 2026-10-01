# 0017. Email + password sign-in, with Google as a second option

- **Status:** Accepted (Google part superseded by [0018](0018-defer-google-sign-in.md))
- **Date:** 2026-10-01
- **Supersedes:** [0012](0012-google-oauth-only.md)

## Context
Google-only login (ADR 0012) shut out users without a Google account, and the Google OAuth setup slowed down testing. Email + password works for everyone, and Supabase Auth supports it natively.

## Decision
- **Email + password** is the main sign-in method (`signUp`, `signInWithPassword`). **Google OAuth** stays as a secondary "Continue with Google" button.
- **No email confirmation** in the MVP (`enable_confirmations = false`). Signing up logs you in immediately.
- Passwords are 8–72 characters (72 is bcrypt's limit). Supabase enforces the minimum of 8 too.
- **Forgot password:** `resetPasswordForEmail` sends a link to `/reset-password`, which sets a new password with `updateUser`. The response never reveals whether an email has an account.
- The `profiles` trigger stays as it is. For email sign-ups there's no metadata, so the name defaults to the part of the email before `@`, and the user confirms it during onboarding.

## Consequences
- ➕ Anyone with an email address can join, and testing needs no OAuth setup.
- ➖ We now handle passwords: reset flow, error messages, and the possibility of credential stuffing (Supabase rate limits help).
- ➖ Without confirmation, someone can sign up with an email that isn't theirs. Turn confirmation on once custom SMTP is set up.
- ➖ Reset emails need **custom SMTP** for real users. Supabase's built-in sender only delivers to project team members, at a low rate.

## Alternatives considered
- **Google only (0012):** shuts out users without Google, and testing is harder.
- **Email + password only:** Google is still the one-tap option for Android users, so we keep it.
- **Magic link:** switching to the email app is slow on phones, and it needs SMTP for every login.
