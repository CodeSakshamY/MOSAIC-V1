-- Communities, membership, and the posts a community gathers. No chat table.

create type public.community_category as enum (
  'technology',
  'discipline',
  'city',
  'institution',
  'research',
  'project'
);

create type public.community_role as enum (
  'owner',
  'moderator',
  'member'
);

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  description text not null,
  category public.community_category not null,
  avatar_url text,
  created_by uuid not null references public.profiles (id) on delete restrict,
  visibility public.visibility not null default 'public',
  is_demo boolean not null default false,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint communities_slug_key unique (slug),
  constraint communities_name_length check (char_length(name) between 3 and 80),
  constraint communities_slug_format check (private.is_slug(slug)),
  constraint communities_description_length check (char_length(description) between 1 and 2000),
  constraint communities_avatar_storage check (
    avatar_url is null or private.is_storage_url(avatar_url)
  )
);

create table public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.community_role not null,
  joined_at timestamptz not null default now(),
  primary key (community_id, profile_id)
);

create table public.community_posts (
  community_id uuid not null references public.communities (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (community_id, post_id)
);

create or replace function private.normalize_community()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.name = btrim(new.name);
  new.slug = lower(btrim(new.slug));
  new.description = btrim(new.description);
  if new.avatar_url is not null then
    new.avatar_url = nullif(btrim(new.avatar_url), '');
  end if;
  return new;
end;
$$;

create trigger communities_bi_10_normalize
before insert or update on public.communities
for each row
execute function private.normalize_community();

create trigger communities_bu_updated_at
before update on public.communities
for each row
execute function private.set_updated_at();

create or replace function private.add_community_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.community_members (community_id, profile_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger communities_ai_owner
after insert on public.communities
for each row
execute function private.add_community_owner();

create or replace function private.guard_community_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  community uuid;
  departing uuid;
begin
  if tg_op = 'DELETE' and old.role = 'owner' then
    community = old.community_id;
    departing = old.profile_id;
  elsif tg_op = 'UPDATE'
    and old.role = 'owner'
    and new.role is distinct from 'owner' then
    community = old.community_id;
    departing = old.profile_id;
  else
    return coalesce(new, old);
  end if;

  if private.is_trusted_writer() then
    return coalesce(new, old);
  end if;

  if not exists (
    select 1
    from public.community_members
    where community_id = community
      and role = 'owner'
      and profile_id <> departing
  ) then
    raise exception 'Transfer community ownership before leaving';
  end if;

  return coalesce(new, old);
end;
$$;

create trigger community_members_bd_owner
before delete or update on public.community_members
for each row
execute function private.guard_community_owner();
