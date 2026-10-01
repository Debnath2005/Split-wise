-- M1: profiles (SPEC §4.1, §5). ADR 0004: RLS is the boundary. ADR 0005: the only
-- direct client write is a user's own name / UPI ID / onboarding flag.

create table public.profiles (
  id               uuid primary key references auth.users on delete cascade,
  display_name     text not null check (char_length(display_name) between 1 and 60),
  email            text not null,
  avatar_url       text,
  -- SPEC's VPA regex; Postgres caps {m,n} at 255, so the 256 max is a separate length check.
  upi_vpa          text check (
                     upi_vpa ~ '^[a-zA-Z0-9.\-_]{2,}@[a-zA-Z][a-zA-Z0-9]{1,64}$'
                     and char_length(split_part(upi_vpa, '@', 1)) <= 256
                   ),
  onboarded_at     timestamptz,
  activity_seen_at timestamptz not null default now(),
  created_at       timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Own row only for now; M3/M4 widen SELECT to friends and group co-members.
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Baseline already revoked default writes; grant exactly what the client may do.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (display_name, upi_vpa, onboarded_at) on public.profiles to authenticated;

-- Create the profile from Google metadata on first sign-in.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  name text;
begin
  name := nullif(btrim(coalesce(meta->>'full_name', meta->>'name', '')), '');
  if name is null then
    name := nullif(split_part(coalesce(new.email, ''), '@', 1), '');
  end if;

  insert into public.profiles (id, display_name, email, avatar_url)
  values (
    new.id,
    left(coalesce(name, 'User'), 60),
    coalesce(new.email, ''),
    coalesce(meta->>'avatar_url', meta->>'picture')
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
