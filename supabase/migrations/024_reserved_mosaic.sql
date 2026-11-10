-- The product name is MOSAIC. That username stays reserved, along with the old working name.

create or replace function private.is_reserved_username(value text)
returns boolean
language sql
immutable
as $$
  select lower(value) = any (array[
    'polymath',
    'mosaic',
    'admin',
    'help',
    'support',
    'home',
    'discover',
    'build',
    'people',
    'opportunities',
    'communities',
    'profile',
    'notifications',
    'settings',
    'login',
    'signup',
    'onboarding',
    'api',
    'auth'
  ]);
$$;
