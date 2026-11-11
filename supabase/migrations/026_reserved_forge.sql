-- Forge is a route, so that username stays reserved.

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
    'forge',
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
