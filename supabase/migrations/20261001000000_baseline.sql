-- Baseline (M0). See ADR 0004 (RLS is the security boundary) and ADR 0005
-- (all writes go through security definer RPCs).
--
-- Supabase grants ALL on new public tables to anon/authenticated by default.
-- Revoke write privileges by default so every table must opt in explicitly;
-- SELECT stays grantable and is still filtered by RLS.

alter default privileges for role postgres in schema public
  revoke insert, update, delete, truncate on tables from anon, authenticated;
