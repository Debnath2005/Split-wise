# 0014. Friends and members join only by invite link

- **Status:** Accepted
- **Date:** 2026-10-01

## Context
Placeholder users (added by name before they sign up) need merge logic later, and identity matching can go wrong.

## Decision
- A person can be added only after signing up and accepting an invite.
- Tokens are 32 random bytes in base64url and expire after 14 days.
  - Friend invites are single-use.
  - Group invites are multi-use until revoked. Accepting one also makes the new member friends with the inviter.
- People who aren't the inviter see an invite only through `get_invite_preview(token)`.
- Leaving a group, removing a member, or removing a friend requires a ₹0 balance.

## Consequences
- ➕ Every participant is a real authenticated user. There is no merge logic.
- ➖ More friction: an expense can't include someone until they join.

## Alternatives considered
- **Placeholder members linked by email:** easier to get started with, but brings merge complexity.
