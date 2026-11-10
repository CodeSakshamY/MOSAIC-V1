-- Not a migration. Run after `supabase db reset`, then roll back:
-- psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
--
-- This checks row-level security. Column guards that trust the migration role
-- stay open when the script connects as postgres and only switches role,
-- because session_user is still postgres. API requests log in as authenticator,
-- so those guards are closed there.

begin;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    'authenticated', 'authenticated', 'ada@polymath.test',
    extensions.crypt('test-only', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    now(), now(), '', '', '', ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    'authenticated', 'authenticated', 'grace@polymath.test',
    extensions.crypt('test-only', extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb,
    now(), now(), '', '', '', ''
  );

update public.profiles
set username = 'ada_builder', display_name = 'Ada', age_group = '18_24', onboarding_complete = true
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';

update public.profiles
set username = 'grace_builder', display_name = 'Grace', age_group = '16_17', onboarding_complete = true
where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';

set local role authenticated;
select set_config('request.jwt.claim.sub', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', true);
select set_config('request.jwt.claim.role', 'authenticated', true);
select set_config(
  'request.jwt.claims',
  '{"sub":"aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1","role":"authenticated"}',
  true
);

do $$
declare
  n integer;
begin
  if auth.uid() is distinct from 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'::uuid then
    raise exception 'RLS_FAIL: auth.uid() did not follow the test setting';
  end if;

  update public.profiles
  set bio = 'Builds sensors.'
  where id = auth.uid();
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'RLS_FAIL: a member could not update their own profile';
  end if;

  update public.profiles
  set bio = 'nope'
  where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2';
  get diagnostics n = row_count;
  if n <> 0 then
    raise exception 'RLS_FAIL: a member updated someone else''s profile';
  end if;

  begin
    insert into public.skills (name, slug, category)
    values ('Invented', 'invented', 'software');
    raise exception 'RLS_FAIL: a member inserted a skill';
  exception
    when insufficient_privilege then
      null;
    when others then
      if sqlerrm like 'RLS_FAIL:%' then
        raise;
      end if;
  end;

  begin
    insert into public.admin_roles (user_id, role)
    values (auth.uid(), 'admin');
    raise exception 'RLS_FAIL: a member granted themselves staff';
  exception
    when insufficient_privilege then
      null;
    when others then
      if sqlerrm like 'RLS_FAIL:%' then
        raise;
      end if;
  end;
end $$;

set local role anon;
select set_config('request.jwt.claim.sub', '', true);
select set_config('request.jwt.claims', '{}', true);

do $$
declare
  n integer;
begin
  select count(*) into n from public.skills;
  if n < 40 then
    raise exception 'RLS_FAIL: anon could not read the skill catalogue';
  end if;

  select count(*) into n
  from public.profiles
  where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1';
  if n <> 1 then
    raise exception 'RLS_FAIL: anon could not read a public profile';
  end if;

  begin
    insert into public.follows (
      follower_id,
      following_id
    )
    values (
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'
    );
    raise exception 'RLS_FAIL: anon inserted a follow';
  exception
    when insufficient_privilege then
      null;
    when others then
      if sqlerrm like 'RLS_FAIL:%' then
        raise;
      end if;
  end;
end $$;

rollback;
