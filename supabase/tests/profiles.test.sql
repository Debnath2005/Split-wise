begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

-- Fixtures: three Google-style users.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-0000-0000-00000000000a', 'asha@example.com',
     '{"full_name": "  Asha Rao  ", "avatar_url": "https://img/a.png"}'),
  ('00000000-0000-0000-0000-00000000000b', 'ravi@example.com',
     '{"name": "Ravi", "picture": "https://img/b.png"}'),
  ('00000000-0000-0000-0000-00000000000c', 'meera.k@example.com', '{}');

-- Trigger
select is((select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000a'),
  'Asha Rao', 'trigger uses trimmed full_name');
select is((select avatar_url from public.profiles where id = '00000000-0000-0000-0000-00000000000a'),
  'https://img/a.png', 'trigger copies avatar_url');
select is((select display_name || '|' || avatar_url from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  'Ravi|https://img/b.png', 'trigger falls back to name + picture');
select is((select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000c'),
  'meera.k', 'trigger falls back to email local part');
select ok((select onboarded_at is null from public.profiles where id = '00000000-0000-0000-0000-00000000000a'),
  'new profiles are not onboarded');

-- Privileges
select ok(not has_table_privilege('authenticated', 'public.profiles', 'INSERT'), 'no client INSERT');
select ok(not has_table_privilege('authenticated', 'public.profiles', 'DELETE'), 'no client DELETE');
select ok(not has_column_privilege('authenticated', 'public.profiles', 'email', 'UPDATE'), 'email not updatable');
select ok(not has_table_privilege('anon', 'public.profiles', 'SELECT'), 'anon cannot read profiles');

-- Act as Asha
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}', true);

select is((select count(*)::int from public.profiles), 1, 'a user sees only their own profile');
select is_empty($$ select 1 from public.profiles where id = '00000000-0000-0000-0000-00000000000b' $$,
  'cannot read another user''s profile');

update public.profiles set display_name = 'Hacked' where id = '00000000-0000-0000-0000-00000000000b';
select lives_ok($$ update public.profiles set display_name = 'Asha R', upi_vpa = 'asha@okaxis',
  onboarded_at = now() where id = '00000000-0000-0000-0000-00000000000a' $$, 'can update own name, UPI ID, onboarding');
select is((select display_name || '|' || upi_vpa from public.profiles), 'Asha R|asha@okaxis', 'own update applied');
select throws_ok($$ update public.profiles set email = 'x@y.z' where id = '00000000-0000-0000-0000-00000000000a' $$,
  '42501', null, 'cannot update own email');
select throws_ok($$ update public.profiles set upi_vpa = 'not a vpa' where id = '00000000-0000-0000-0000-00000000000a' $$,
  '23514', null, 'invalid UPI ID is rejected');
select throws_ok($$ update public.profiles set upi_vpa = repeat('a', 257) || '@okaxis' where id = '00000000-0000-0000-0000-00000000000a' $$,
  '23514', null, 'UPI ID with a local part over 256 chars is rejected');
select throws_ok($$ insert into public.profiles (id, display_name, email) values (gen_random_uuid(), 'X', 'x@y.z') $$,
  '42501', null, 'cannot insert profiles directly');

reset role;
select is((select display_name from public.profiles where id = '00000000-0000-0000-0000-00000000000b'),
  'Ravi', 'another user''s profile was not changed by the update attempt');

select * from finish();
rollback;
