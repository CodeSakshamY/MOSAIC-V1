-- Profiles, private onboarding state, and the auth.users signup trigger.

create type public.age_group as enum (
  '13_15',
  '16_17',
  '18_24',
  '25_34',
  '35_plus'
);

create type public.collaboration_type as enum (
  'remote',
  'local',
  'hybrid'
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username citext,
  display_name text not null,
  bio text,
  avatar_url text,
  city text,
  state text,
  country char(2) not null default 'IN',
  age_group public.age_group,
  education text,
  github_username text,
  website_url text,
  looking_for text[] not null default '{}',
  collaboration_preference public.collaboration_type,
  onboarding_complete boolean not null default false,
  is_demo boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_key unique (username),
  constraint profiles_username_format check (
    username is null
    or (
      username::text ~ '^[a-z0-9]([a-z0-9_]{1,22}[a-z0-9])?$'
      and (
        deleted_at is not null
        or (
          not private.is_reserved_username(username::text)
          and username::text !~ '^deleted_'
        )
      )
    )
  ),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 60),
  constraint profiles_bio_length check (bio is null or char_length(bio) between 1 and 280),
  constraint profiles_city_length check (city is null or char_length(city) between 1 and 80),
  constraint profiles_state_length check (state is null or char_length(state) between 1 and 80),
  constraint profiles_country_code check (country ~ '^[A-Z]{2}$'),
  constraint profiles_education_length check (
    education is null or char_length(education) between 1 and 120
  ),
  constraint profiles_github_username_format check (
    github_username is null
    or github_username ~ '^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$'
  ),
  constraint profiles_website_https check (
    website_url is null or private.is_https_url(website_url)
  ),
  constraint profiles_avatar_storage check (
    avatar_url is null or private.is_storage_url(avatar_url)
  ),
  constraint profiles_looking_for_closed check (
    looking_for <@ array[
      'teammates',
      'projects',
      'competitions',
      'feedback',
      'contribute',
      'learn',
      'show_work',
      'mentors'
    ]::text[]
    and private.text_array_is_unique(looking_for)
  )
);

create table public.profile_private (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  onboarding_step smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profile_private_step_positive check (onboarding_step >= 1)
);

create or replace function private.normalize_profile()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.display_name = btrim(new.display_name);
  new.country = upper(btrim(new.country));
  if new.username is not null then
    new.username = nullif(lower(btrim(new.username::text)), '');
  end if;
  if new.bio is not null then
    new.bio = nullif(btrim(new.bio), '');
  end if;
  if new.city is not null then
    new.city = nullif(btrim(new.city), '');
  end if;
  if new.state is not null then
    new.state = nullif(btrim(new.state), '');
  end if;
  if new.education is not null then
    new.education = nullif(btrim(new.education), '');
  end if;
  if new.github_username is not null then
    new.github_username = nullif(btrim(new.github_username), '');
  end if;
  if new.website_url is not null then
    new.website_url = nullif(btrim(new.website_url), '');
  end if;
  if new.avatar_url is not null then
    new.avatar_url = nullif(btrim(new.avatar_url), '');
  end if;
  return new;
end;
$$;

create trigger profiles_bi_10_normalize
before insert or update on public.profiles
for each row
execute function private.normalize_profile();

create trigger profiles_bu_updated_at
before update on public.profiles
for each row
execute function private.set_updated_at();

create trigger profile_private_bu_updated_at
before update on public.profile_private
for each row
execute function private.set_updated_at();

create or replace function private.guard_profile_private()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.profile_id is distinct from old.profile_id
    or new.created_at is distinct from old.created_at then
    raise exception 'profile_private identity columns are fixed';
  end if;
  return new;
end;
$$;

create trigger profile_private_bu_guard
before update on public.profile_private
for each row
execute function private.guard_profile_private();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  local_part text;
  display text;
begin
  local_part = split_part(coalesce(new.email, ''), '@', 1);
  display = btrim(left(regexp_replace(local_part, '[^A-Za-z0-9 ._-]', '', 'g'), 60));
  if display is null or display = '' then
    display = 'Builder';
  end if;

  insert into public.profiles (id, display_name)
  values (new.id, display);

  insert into public.profile_private (profile_id)
  values (new.id);

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function private.handle_new_user();
