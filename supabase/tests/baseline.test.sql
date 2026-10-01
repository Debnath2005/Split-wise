begin;
create extension if not exists pgtap with schema extensions;
select plan(4);

-- A table created after the baseline must not be writable by client roles.
create table public._baseline_probe (id int);

select ok(not has_table_privilege('authenticated', 'public._baseline_probe', 'INSERT'),
  'authenticated has no INSERT on new tables');
select ok(not has_table_privilege('authenticated', 'public._baseline_probe', 'UPDATE'),
  'authenticated has no UPDATE on new tables');
select ok(not has_table_privilege('authenticated', 'public._baseline_probe', 'DELETE'),
  'authenticated has no DELETE on new tables');
select ok(not has_table_privilege('anon', 'public._baseline_probe', 'INSERT'),
  'anon has no INSERT on new tables');

select * from finish();
rollback;
