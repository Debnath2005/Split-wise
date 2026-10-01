# SPEC — Split-Wise MVP

A Splitwise-style web app for splitting expenses. It is mobile-first, INR only, and runs on Supabase.

> Status: Draft v1 · 2026-10-01

---

## 1. Goals & Non-Goals

### Goals
- Let friends and groups record shared expenses and always see who owes whom.
- Feel like a native app on a phone: fast, one-handed, and adding an expense takes three taps.
- Keep money correct: integer paise everywhere, no floating-point maths, and the splits of every expense always add up to its total.
- Make settling up easy: one tap opens a UPI app with the payee and amount already filled in.

### Non-Goals (MVP)
- Multi-currency or FX conversion. There is a `currency` column, but it is fixed to `'INR'`.
- Multiple payers on a single expense. There is exactly one payer per expense.
- Receipt photos, comments on expenses, recurring expenses, categories/charts.
- Checking that a UPI payment actually went through, or any payment gateway integration.
- Native apps, push notifications, offline writes.
- Email/password, magic link, or phone login.

---

## 2. Tech Stack

| Concern | Choice |
|---|---|
| Build | Vite + React 18 + TypeScript (strict) |
| Routing | React Router v6 (data routers) |
| Server state | TanStack Query v5 |
| Forms / validation | React Hook Form + Zod |
| Styling | Tailwind CSS v3, mobile-first, `prefers-color-scheme` dark mode |
| Backend | Supabase: Postgres, Auth (Google OAuth), Row Level Security, RPC functions |
| Types | `supabase gen types typescript` → `src/types/database.ts` |
| QR (desktop UPI fallback) | `qrcode` npm package |
| Unit tests | Vitest |
| DB tests | Supabase CLI local stack + pgTAP (RLS & RPC tests) |
| E2E | Playwright (Pixel 7 + iPhone 14 viewports) |
| Hosting | Vercel or Netlify (static SPA, rewrite all routes to `/index.html`) |

**Architecture rule:** the client **reads** from tables and views through RLS. The client **writes** anything multi-row or money-related (expenses, settlements, invites, membership changes) **only through Postgres RPC functions**. Each function runs as a single transaction: it validates the input, writes the rows, and writes the activity log entry. That way an expense can never be left without its splits or without an activity record.

---

## 3. Money Rules

1. **Storage:** every amount is a `bigint` of **paise**. Column names end in `_paise`. Floats are never stored.
2. **Percentages** are stored as **basis points** (integer; 100% = 10000), so a value like 33.33% needs no float.
3. **Parsing user input**: `parseRupeesToPaise(input: string): number | null`
   - Accepts `"120"`, `"120.5"`, `"120.50"`, `"1,20,000.00"`. Removes commas and rejects more than 2 decimal places.
   - Works on the string itself (split on `.`, pad the fraction to 2 digits) and **never** calls `parseFloat(x) * 100`.
   - Range: 1 paisa to ₹10,00,00,000 (10^10 paise). This is enforced by a DB `CHECK` as well.
4. **Formatting:** `formatPaise(p)` uses `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })` on `p / 100`. Dividing only to display is fine. Output looks like `₹1,23,456.78`.
5. **The invariant**, checked in the RPC and in a DB constraint trigger: `sum(expense_splits.owed_paise) = expenses.amount_paise`.
6. **Rounding (deterministic):**
   - **Equal:** `base = floor(total / n)`, `remainder = total - base*n`. The first `remainder` participants each get +1 paisa, with participants **sorted by user id**. Example: ₹100 split 3 ways → 3334, 3333, 3333.
   - **Percent:** the basis points must add up to exactly 10000. Each share is `floor(total * bp / 10000)`. The leftover paise go one at a time to the largest fractional remainders, with ties broken by user id (the largest-remainder method).
   - **Exact:** the user enters amounts in paise, and they must add up to the total. The UI shows a live "₹X left to assign" or "₹X over".
7. **Shared code:** the split logic lives in `src/lib/money/` as pure functions with full unit tests. The RPC re-runs the same algorithm in PL/pgSQL and rejects the request if its result differs from what the client sent. The server is authoritative.

---

## 4. Features

### 4.1 Login (Google OAuth)
- Signing in uses `supabase.auth.signInWithOAuth({ provider: 'google' })` with redirect URL `${origin}/auth/callback`.
- On the first sign-in, an `auth.users` insert trigger creates the `profiles` row, copying the name, email, and avatar from the Google metadata.
- Onboarding, shown once: confirm display name and optionally add a **UPI ID** (VPA). Without a VPA, the user can still be paid by cash/"mark as paid", but not by UPI link.
- Every route except `/login`, `/auth/callback`, and `/invite/:token` (which shows a login CTA) is protected.
- Sign out lives on the Account screen.

### 4.2 Friends (invite link only)
- **Add friend:** creates an invite and shows a share sheet. On mobile this calls `navigator.share()`; otherwise it copies the link. The link is `https://<app>/invite/<token>`.
- **Accepting:** the recipient opens the link and signs in with Google if needed. The page shows "Ravi invited you to Split-Wise" with an Accept button. Accepting calls `accept_invite(token)`, which creates the friendship (both directions are implied by one row).
- Tokens are 32-byte random, single-use for friend invites, and expire after 14 days. The inviter can revoke a pending invite.
- The Friends list shows each friend with their **net balance across all groups and non-group expenses**: "owes you ₹X", "you owe ₹X", or "settled up".
- The friend detail page shows the balance breakdown per group plus non-group, the shared expense history, and a **Settle up** button.
- **Removing a friend** is only allowed when the overall balance is ₹0.
- **Non-group expenses:** an expense can be added between the user and one or more friends without a group (`group_id = NULL`).

### 4.3 Groups
- Create a group with a name and an optional emoji/type (Home, Trip, Couple, Other).
- **Add members:**
  - existing friends are added directly (`add_group_member`)
  - anyone else joins through a **group invite link**. It is multi-use until revoked or expired. Accepting it joins the group *and* makes the person friends with the inviter.
- The group page has three tabs:
  - **Expenses:** list grouped by month. Each row shows date, description, "X paid ₹Y", and "you lent / you borrowed ₹Z"
  - **Balances:** each member's net balance, plus the "who owes whom" list (simplified or pairwise, see 4.8)
  - **Settings:** name, simplify toggle, members, leave group
- **Leaving** or **removing a member** is only allowed when that member's net group balance is ₹0.
- Any member can rename the group or change settings. The creator can delete the group, but only when every balance is ₹0 (soft delete).

### 4.4 Add Expense
Fields:
- **Description** (required, ≤ 100 chars)
- **Amount** (required, `inputmode="decimal"`)
- **Paid by:** defaults to me. Can be any member/participant.
- **Group:** pre-filled when opened from a group page. Otherwise "No group" plus picking friends.
- **Date:** defaults to today. Future dates are not allowed.
- **Split:**
  - **Equal:** a checkbox for each participant, all checked by default. Shows the per-person amount.
  - **Exact:** an amount input for each participant, with a live remainder.
  - **Percent:** a % input for each participant, with a live total that must reach 100%. The computed ₹ amount is shown beside each one.
- **Notes** (optional, ≤ 500 chars)

Validation (Zod on the client, repeated in the RPC):
- amount > 0
- at least 1 participant
- the payer must be a group member (or me/a friend for non-group expenses)
- every participant must be a group member, or me plus accepted friends
- the splits must add up exactly to the total

The **"Save" button stays disabled** until the split is valid. Saving calls `create_expense(...)`.

### 4.5 Balances
Definitions, with a single payer per expense:
- **Debt edges:** for each split where `user_id <> paid_by` and `owed_paise > 0`, `user_id` owes `paid_by` the amount `owed_paise`.
- **Settlement edges:** when `from_user` pays `to_user` the amount `amount_paise`, it reduces what `from_user` owes `to_user`.
- **Pairwise balance (A, B, scope):** the sum of edges between A and B within a scope. The scope is a group id, or `NULL` for non-group. A positive value means B owes A.
- **Member net in a group:** `sum(paid) − sum(owed) + sum(settlements sent) − sum(settlements received)`. Positive means the member is owed money.

All of these are computed live, in Postgres views (`v_pair_balances`, `v_group_member_balances`), and are never stored. Soft-deleted expenses and settlements are excluded.

Dashboard (home):
- Total header: "You are owed ₹X", "You owe ₹Y", "Net ₹Z"
- Below it, lists of the user's groups and friends with non-zero balances

### 4.6 Settle Up with UPI
Flow (from a group's balances or a friend page):
1. Choose who pays whom. It defaults to "You → [person you owe]" with the suggested amount, which the user can edit and which may be partial.
2. If the **payee has a VPA**:
   - **Mobile:** a "Pay ₹X via UPI" button opens
     `upi://pay?pa=<vpa>&pn=<urlencoded payee name>&am=<rupees.paise>&cu=INR&tn=<urlencoded "Split-Wise: <group/desc>">`
     The `am` value is built from paise using integer maths: `${Math.floor(p/100)}.${String(p%100).padStart(2,'0')}`.
   - **Desktop:** the same URI is rendered as a **QR code** for the user to scan with a phone.
3. When the user returns to the app, they see "Did the payment go through?" with **Yes, record payment** and **No**. Choosing Yes calls `record_settlement(from, to, amount, group_id, method='upi')`.
4. If there is no VPA, or the user prefers, **Record cash payment** records it with `method='cash'`.
5. The payee can also record a payment they received ("Ravi paid me ₹X").

Notes and limitations, to show as a short info tooltip:
- The app **cannot verify** that a UPI payment succeeded, so the payment record is based on trust.
- Some UPI apps limit or warn on P2P intent links. If nothing opens, the user can copy the VPA (there is a copy button).
- VPA validation regex: `^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,64}$`.

### 4.7 Edit / Delete + Activity Feed
- **Who can edit or delete:** any member of the expense's group. For non-group expenses, any participant or the payer.
- **Edit:** the same form, pre-filled. `update_expense(id, ...)` replaces the splits in one transaction.
- **Delete** is a soft delete (`deleted_at`, `deleted_by`). The expense disappears from lists and balances. The activity entry offers **Restore** (`restore_expense`).
- **Settlements** can be deleted (soft) and restored the same way.
- **Activity feed** (`/activity` tab): a reverse-chronological list of events visible to the user, for example:
  - "Ravi added 'Dinner' in Goa Trip: you owe ₹450"
  - "Asha edited 'Cab': amount ₹600 → ₹800"
  - "You deleted 'Snacks'"
  - "Ravi paid you ₹1,200 (UPI)"
  - "Meera joined Goa Trip"
- Each event stores a **JSON snapshot / diff** (`before`, `after`), so an edit can say exactly what changed.
- **Audience:** the RPC writes `activity_audience` rows (group members at that moment, or the participants of a non-group expense). This makes "my feed" a single indexed query and keeps RLS simple.
- The feed uses cursor pagination of 30 per page, ordered by `created_at` then `id`.
- **Unread dot:** `profiles.activity_seen_at` is updated when the feed is opened.

### 4.8 Simplify Debts
- A per-group toggle, `groups.simplify_debts`, **on by default**.
- **When on**, "who owes whom" is calculated from **member nets only**:
  1. Compute each member's net (from 4.5).
  2. Use a greedy approach. Repeatedly match the largest creditor with the largest debtor and transfer `min(|credit|, |debt|)`. Stop when every net is 0.
  3. This gives at most `n − 1` transfers, with ties broken by user id so the result is deterministic.
- **When off**, the app shows the raw pairwise balances within the group, with A→B and B→A netted against each other.
- It is a **pure TS function** (`src/lib/money/simplify.ts`) that runs on the client using the view data. Nothing is stored, and the underlying expenses never change.
- Simplification is **per group only**. Non-group and friend-level totals stay pairwise.
- The settle-up suggestions in a group follow whichever view is active.

---

## 5. Data Model (Postgres)

```sql
-- enums
create type split_type      as enum ('equal','exact','percent');
create type settle_method   as enum ('upi','cash','other');
create type invite_kind     as enum ('friend','group');
create type activity_verb   as enum (
  'expense_created','expense_updated','expense_deleted','expense_restored',
  'settlement_created','settlement_deleted','settlement_restored',
  'group_created','group_updated','member_joined','member_left','member_removed',
  'friend_added');

create table profiles (
  id               uuid primary key references auth.users on delete cascade,
  display_name     text not null check (char_length(display_name) between 1 and 60),
  email            text not null,
  avatar_url       text,
  upi_vpa          text check (upi_vpa ~ '^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{1,64}$'),
  activity_seen_at timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

create table friendships (            -- one row per pair, user_a < user_b
  user_a     uuid not null references profiles,
  user_b     uuid not null references profiles,
  created_at timestamptz not null default now(),
  primary key (user_a, user_b),
  check (user_a < user_b)
);

create table groups (
  id             uuid primary key default gen_random_uuid(),
  name           text not null check (char_length(name) between 1 and 60),
  kind           text not null default 'other',
  simplify_debts boolean not null default true,
  created_by     uuid not null references profiles,
  created_at     timestamptz not null default now(),
  deleted_at     timestamptz
);

create table group_members (
  group_id  uuid not null references groups on delete cascade,
  user_id   uuid not null references profiles,
  joined_at timestamptz not null default now(),
  left_at   timestamptz,                       -- soft leave keeps history readable
  primary key (group_id, user_id)
);

create table invites (
  token       text primary key,               -- base64url(32 random bytes)
  kind        invite_kind not null,
  inviter_id  uuid not null references profiles,
  group_id    uuid references groups,         -- required when kind='group'
  expires_at  timestamptz not null default now() + interval '14 days',
  accepted_by uuid references profiles,       -- friend invites: single use
  revoked_at  timestamptz,
  created_at  timestamptz not null default now(),
  check ((kind = 'group') = (group_id is not null))
);

create table expenses (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid references groups,         -- null = non-group expense
  description  text not null check (char_length(description) between 1 and 100),
  notes        text check (char_length(notes) <= 500),
  amount_paise bigint not null check (amount_paise between 1 and 10000000000),
  currency     char(3) not null default 'INR' check (currency = 'INR'),
  paid_by      uuid not null references profiles,
  split_type   split_type not null,
  expense_date date not null,
  created_by   uuid not null references profiles,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  deleted_by   uuid references profiles
);

create table expense_splits (
  expense_id  uuid not null references expenses on delete cascade,
  user_id     uuid not null references profiles,
  owed_paise  bigint not null check (owed_paise >= 0),
  input_value bigint,                          -- exact: paise · percent: basis points · equal: null
  primary key (expense_id, user_id)
);

create table settlements (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid references groups,         -- null = non-group
  from_user    uuid not null references profiles,
  to_user      uuid not null references profiles,
  amount_paise bigint not null check (amount_paise between 1 and 10000000000),
  method       settle_method not null,
  note         text,
  created_by   uuid not null references profiles,
  created_at   timestamptz not null default now(),
  deleted_at   timestamptz,
  deleted_by   uuid references profiles,
  check (from_user <> to_user)
);

create table activities (
  id         bigint generated always as identity primary key,
  actor_id   uuid not null references profiles,
  verb       activity_verb not null,
  group_id   uuid references groups,
  entity_id  uuid,                             -- expense / settlement / group id
  payload    jsonb not null default '{}',      -- {before, after, summary}
  created_at timestamptz not null default now()
);

create table activity_audience (
  activity_id bigint not null references activities on delete cascade,
  user_id     uuid not null references profiles,
  primary key (user_id, activity_id)           -- serves "my feed" lookups
);
```

**Indexes:**
- `expenses(group_id, expense_date desc) where deleted_at is null`
- `expense_splits(user_id)`
- `settlements(group_id)`
- `settlements(from_user)`
- `settlements(to_user)`
- `group_members(user_id)`

**Views** (`security_invoker = true`, so RLS still applies):
- `v_pair_balances(scope_group_id, creditor, debtor, amount_paise)`, already netted
- `v_group_member_balances(group_id, user_id, net_paise)`
- `v_friend_balances(me, friend, net_paise)`: across all scopes

### 5.1 RPC functions (all `security definer`, `search_path = ''`, each checks `auth.uid()`)

| Function | Purpose |
|---|---|
| `create_invite(kind, group_id?)` → token | Generates a token. For a group invite, the caller must be a member. |
| `accept_invite(token)` | Validates the token (not expired, revoked, or used). Creates the friendship, adds the group membership if it is a group invite, and logs activity. |
| `add_group_member(group_id, user_id)` | Caller must be a member, and the target must be the caller's friend. |
| `leave_group(group_id)` / `remove_group_member(group_id, user_id)` | Allowed only when the member's net is 0. |
| `create_expense(payload jsonb)` → id | Validates membership, recomputes the splits, checks that they add up, inserts, and logs activity plus audience. |
| `update_expense(id, payload jsonb)` | Snapshots `before`, replaces the splits, and logs activity with the diff. |
| `delete_expense(id)` / `restore_expense(id)` | Soft delete or restore, plus activity. |
| `record_settlement(payload jsonb)` → id | Both users must be members of the group (or friends if non-group). Logs activity. |
| `delete_settlement(id)` / `restore_settlement(id)` | Soft delete or restore, plus activity. |

### 5.2 Row Level Security (summary)
Helper functions:
- `is_group_member(gid)`: `security definer stable`, avoids policy recursion
- `is_friend(uid)`

Table policies:
- `profiles`: select own and friends' rows, plus co-members of any group. Update only your own row.
- `friendships`: select rows where you are `user_a` or `user_b`. No direct insert or delete (RPC only).
- `groups` and `group_members`: select where `is_group_member(group_id)`. Update `groups` (name, kind, simplify) where you are a member.
- `expenses` and `expense_splits`: select if group member, or (for non-group) if you are the payer or a participant.
- `settlements`: select if group member, or if you are `from_user` or `to_user`.
- `activities`: select if an `activity_audience` row exists for `auth.uid()`.
- `invites`: select your own. Anyone else only resolves an invite through an RPC `get_invite_preview(token)`, which returns the inviter's name and group name.
- **No direct `insert`/`update`/`delete` grants** on money tables. Writes go through RPCs only.

---

## 6. Screens & Routes (mobile-first)

```
/login                    Google sign-in button, app pitch
/auth/callback            OAuth return → redirect to intended route
/onboarding               name + UPI ID (first login only)
/                         Dashboard: totals, groups & friends with balances
/groups                   group list + "New group"
/groups/new
/groups/:id               tabs: Expenses | Balances | Settings
/friends                  friend list + "Add friend" (share invite)
/friends/:id              per-friend breakdown, history, Settle up
/expenses/new?group=…     add expense (full-screen sheet on mobile)
/expenses/:id             detail: splits, paid by, history, Edit / Delete
/expenses/:id/edit
/settle?group=…&to=…      settle-up flow (UPI / cash)
/activity                 feed with unread dot
/account                  profile, UPI ID, sign out
/invite/:token            invite preview + accept
```

**Mobile UX requirements:**
- **Bottom tab bar:** Home · Groups · Friends · Activity · Account. A floating **"+" Add expense** button sits above it. On ≥ `md` breakpoints this becomes a left sidebar.
- Design for a 360px width first. Tap targets are ≥ 44px. Respect `env(safe-area-inset-bottom)`.
- Forms open as full-screen sheets on mobile and as centred modals on desktop.
- Amount inputs use `inputmode="decimal"` with a large font. The ₹ prefix is fixed.
- **Colour + sign for balances:** green for "owed to you", orange/red for "you owe", grey for "settled". The text label always appears too, never colour alone.
- Loading states use skeletons. Saves are optimistic for the activity "seen" marker only. Money writes wait for the server.
- Lighthouse mobile targets: Performance ≥ 90, Accessibility ≥ 95.

---

## 7. Project Structure

```
src/
  app/               router, providers (QueryClient, Auth)
  features/
    auth/  friends/  groups/  expenses/  balances/  settle/  activity/  account/
      components/  hooks/ (TanStack Query hooks)  api.ts (supabase calls)
  lib/
    money/           parse.ts format.ts split.ts simplify.ts upi.ts  (+ *.test.ts)
    supabase.ts
  components/ui/     Button, Sheet, Tabs, AmountInput, Avatar, EmptyState…
  types/database.ts  generated
supabase/
  migrations/        timestamped SQL (schema, RLS, views, RPCs)
  tests/             pgTAP
  seed.sql
```

Environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. The Google OAuth client ID and secret are configured in the Supabase dashboard, never in the client.

---

## 8. Testing Strategy

- **Unit (Vitest), with 100% branch coverage required for `lib/money`:**
  - parse/format edge cases (`"0.1"`, `"1,00,000"`, `"1.234"` rejected, `""`, negative input)
  - equal, exact, and percent splits, including remainders (₹100/3, ₹0.01/2 → one participant gets 0)
  - simplify-debts: property test. The member nets after the simplified transfers must all be 0, and there must be ≤ n−1 transfers.
  - UPI URI builder (encoding, amount formatting)
- **DB (pgTAP):**
  - an RPC rejects a split sum that doesn't match the total, and rejects a non-member payer or participant
  - RLS: user C cannot read the expenses, settlements, or activity of group G
  - direct inserts into `expenses` are denied
  - leaving a group with a non-zero balance is rejected
- **E2E (Playwright, mobile viewport):**
  - two users accept an invite, create a group, add an equal expense, check balances, settle by cash, and both show "settled up"
  - edit an expense → the activity shows the diff. Delete it → restore it.

---

## 9. Milestone Build Plan

Each milestone ends with something deployable, and its acceptance criteria must pass before moving on.

### M0: Foundations (½–1 day)
- Vite + React + TS + Tailwind + Router + TanStack Query scaffold, ESLint/Prettier, Vitest.
- Local Supabase stack (`supabase init/start`), first migration, typegen script, preview deploy on Vercel.
- App shell: bottom tab bar, sidebar on desktop, placeholder screens.
- **Done when:** `npm run dev`, `npm test`, and `supabase db reset` all succeed, and the preview URL loads on a phone.

### M1: Auth & Profile (1 day)
- Google OAuth, `profiles` trigger, protected routes, onboarding (name + UPI ID with validation), Account page, sign out.
- **Done when:** a new Google user lands on onboarding, then the dashboard. Refreshing keeps the session. RLS stops a user updating another user's profile.

### M2: Money Library (1 day, can run in parallel with M1)
- `lib/money`: parse, format, split (equal/exact/percent), simplify, UPI URI, with full unit tests.
- **Done when:** coverage is 100% and the property tests pass.

### M3: Friends & Invites (1–1.5 days)
- `invites`, `friendships`, `create_invite` / `accept_invite` / `get_invite_preview`, `/invite/:token` page (it survives the login redirect), friends list, share sheet.
- **Done when:** user A shares a link, user B signs in through it and accepts, and both see each other as friends. Reusing, revoking, or letting the token expire is handled.

### M4: Groups (1–1.5 days)
- Groups CRUD, members, group invite links, `add_group_member`, and the group page with its tabs, all with RLS.
- **Done when:** a user can create a group, add a friend, and invite a non-friend through a link. Non-members cannot see the group (pgTAP).

### M5: Expenses (equal) + Balances (2 days)
- `expenses`, `expense_splits`, `create_expense` RPC with server-side split recompute, balance views, add-expense sheet (equal split), group expense list, dashboard totals, friend balances, non-group expenses.
- **Done when:** the E2E test "add ₹999 split 3 ways" gives the correct balances for all 3 users, and a mismatched split sent from the console is rejected.

### M6: Exact & Percent Splits (1 day)
- Split-type switcher, live remainder or percent total, server validation for both types.
- **Done when:** all three split types round-trip (create, then view details) with the correct per-person paise.

### M7: Edit / Delete + Activity Feed (1.5–2 days)
- `update_expense`, `delete_expense`, `restore_expense`, `activities` + `activity_audience`, feed screen with paginated, human-readable lines and edit diffs, unread dot.
- **Done when:** edits and deletes update balances immediately, the feed shows the correct audience-scoped entries, and restore works.

### M8: Settle Up + UPI (1.5 days)
- `settlements` + RPCs, settle-up flow, UPI deep link on mobile, QR code on desktop, "did it go through?" confirmation, cash recording, settlement entries in the feed, delete/restore for settlements.
- **Done when:** on a real Android phone, the UPI app opens with the payee and amount filled in. After the payment is recorded, both users show "settled up".

### M9: Simplify Debts (½–1 day)
- Group toggle, Balances tab uses `simplify()` when it is on, settle suggestions follow the active mode.
- **Done when:** in a 4-person group with circular debts (A→B→C→A), toggling it on reduces the transfers, and the nets stay the same.

### M10: Polish & Launch (1–2 days)
- Empty states, error toasts, skeletons, dark mode, accessibility pass, Lighthouse targets, production Supabase project + Google OAuth production redirect URLs, basic privacy page.
- **Done when:** the full E2E suite passes against staging and the Lighthouse targets are met.

**Rough total: 13–17 developer-days.**

---

## 10. Future (post-MVP)
Multiple payers, receipt uploads (Supabase Storage), comments, categories and spending charts, recurring expenses, multi-currency, CSV export, PWA/offline, push or email notifications for new expenses and reminders, phone OTP login, and a "remind to pay" nudge with a shareable UPI link.

## 11. Open Questions
1. Should non-group expenses support more than one friend at a time? The spec currently allows it.
2. Should group members be able to edit any expense, as in the spec, or only the creator and payer?
3. Should a deleted (soft-deleted) group stay readable in history, or be hidden completely?
