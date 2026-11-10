-- Supabase Postgres. auth, storage, anon, authenticated, and service_role already exist.

create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.is_https_url(value text)
returns boolean
language sql
immutable
as $$
  select value ~ '^https://[^[:space:]]+$' and char_length(value) <= 2000;
$$;

create or replace function private.is_storage_url(value text)
returns boolean
language sql
immutable
as $$
  select private.is_https_url(value)
    and value ~ '/storage/v1/object/public/(avatars|project-covers|post-media|community-images)/[^[:space:]]+$';
$$;

create or replace function private.is_slug(value text)
returns boolean
language sql
immutable
as $$
  select value ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(value) between 3 and 60;
$$;

create or replace function private.https_url_list(urls text[])
returns boolean
language sql
immutable
as $$
  select urls is not null
    and cardinality(urls) <= 4
    and not exists (
      select 1
      from unnest(urls) as item(url)
      where not private.is_storage_url(item.url)
    );
$$;

create or replace function private.is_reserved_username(value text)
returns boolean
language sql
immutable
as $$
  select lower(value) = any (array[
    'polymath',
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

create or replace function private.text_array_is_unique(items text[])
returns boolean
language plpgsql
immutable
as $$
declare
  item text;
  seen text[] := '{}';
begin
  if items is null then
    return false;
  end if;
  foreach item in array items loop
    if item = any (seen) then
      return false;
    end if;
    seen := seen || item;
  end loop;
  return true;
end;
$$;

-- session_user stays the login role inside security definer functions.
-- API requests log in as authenticator, so they are not trusted.
-- Migrations and the local seed log in as postgres or supabase_admin.
create or replace function private.is_trusted_writer()
returns boolean
language sql
stable
as $$
  select current_setting('app.system_write', true) = 'true'
    or current_setting('app.anonymizing', true) = 'true'
    or (
      session_user in ('postgres', 'supabase_admin')
      and current_user in ('postgres', 'supabase_admin', 'service_role')
    );
$$;
