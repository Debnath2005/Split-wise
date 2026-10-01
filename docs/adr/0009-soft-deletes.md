# 0009. Soft deletes

- **Status:** Accepted
- **Date:** 2026-10-01

## Context
Users delete expenses by mistake, and other members need to see what was removed. Hard deletes lose the history and make undo impossible.

## Decision
- `expenses`, `settlements` and `groups` have `deleted_at` (and `deleted_by` where relevant). Deleting sets these columns. Rows are never removed.
- Delete and restore happen only through RPCs (`delete_expense` / `restore_expense`, and the same for settlements), and each logs an activity entry.
- Balance views and list queries exclude `deleted_at IS NOT NULL`.
- Leaving a group sets `group_members.left_at` instead of deleting the row.

## Consequences
- ➕ Undo is cheap, the audit trail is complete, and the activity feed can show deleted items.
- ➖ Every query must filter out deleted rows. This is centralised in views and partial indexes.
- ➖ Tables only grow, and data can't be purged without a separate process.

## Alternatives considered
- **Hard delete with an archive table:** restoring is more complicated, and there is more to keep in sync.
- **Hard delete:** no undo and no history.
