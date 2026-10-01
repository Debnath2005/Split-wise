# 0011. Activity log with an explicit audience

- **Status:** Accepted
- **Date:** 2026-10-01

## Context
Members need a feed of who changed what. Working out at read time who may see an old event is complicated and changes as membership changes.

## Decision
- Every mutating RPC writes an `activities` row (`verb`, `actor_id`, `group_id`, `entity_id`, and a `payload` holding `{before, after, summary}`).
- It also writes `activity_audience` rows: the group members at that moment, or the participants of a non-group expense.
- RLS on `activities` is "an audience row exists for `auth.uid()`".
- The feed uses cursor pagination by `(created_at, id)`. Unread state comes from `profiles.activity_seen_at`.

## Consequences
- ➕ A user's feed is one indexed query, and the history stays correct after people leave.
- ➕ Edit diffs are exact.
- ➖ The audience table grows with members × events.

## Alternatives considered
- **Computing the audience from current membership:** wrong after people leave, and the policies are complicated.
