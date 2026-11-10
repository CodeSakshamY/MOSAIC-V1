-- Projects, the skills they use or seek, and the single active owner.

create type public.project_status as enum (
  'idea',
  'planning',
  'prototype',
  'building',
  'testing',
  'working',
  'shipped',
  'abandoned'
);

create type public.member_role as enum (
  'owner',
  'maintainer',
  'contributor'
);

create type public.member_status as enum (
  'pending',
  'active',
  'rejected'
);

create type public.skill_relation as enum (
  'uses',
  'seeking'
);

create type public.visibility as enum (
  'public',
  'private'
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete restrict,
  name text not null,
  slug text not null,
  description text not null,
  detailed_description text,
  problem text,
  solution text,
  cover_image_url text,
  category text not null,
  status public.project_status not null default 'idea',
  github_url text,
  demo_url text,
  documentation_url text,
  visibility public.visibility not null default 'public',
  looking_for_contributors boolean not null default false,
  collaboration_type public.collaboration_type,
  parent_project_id uuid references public.projects (id) on delete set null,
  featured_at timestamptz,
  is_demo boolean not null default false,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_slug_key unique (slug),
  constraint projects_name_length check (char_length(name) between 3 and 80),
  constraint projects_slug_format check (private.is_slug(slug)),
  constraint projects_description_length check (char_length(description) between 1 and 200),
  constraint projects_detailed_description_length check (
    detailed_description is null or char_length(detailed_description) between 1 and 8000
  ),
  constraint projects_problem_length check (
    problem is null or char_length(problem) between 1 and 2000
  ),
  constraint projects_solution_length check (
    solution is null or char_length(solution) between 1 and 2000
  ),
  constraint projects_category_length check (char_length(category) between 1 and 60),
  constraint projects_github_https check (github_url is null or private.is_https_url(github_url)),
  constraint projects_demo_https check (demo_url is null or private.is_https_url(demo_url)),
  constraint projects_docs_https check (
    documentation_url is null or private.is_https_url(documentation_url)
  ),
  constraint projects_cover_public check (
    cover_image_url is null
    or (visibility = 'public' and private.is_storage_url(cover_image_url))
  ),
  constraint projects_not_own_parent check (parent_project_id is distinct from id)
);

create table public.project_skills (
  project_id uuid not null references public.projects (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  relation public.skill_relation not null,
  primary key (project_id, skill_id, relation)
);

create table public.project_members (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null,
  status public.member_status not null,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_members_project_profile_key unique (project_id, profile_id),
  constraint project_members_joined_when_active check (
    status <> 'active' or joined_at is not null
  )
);

create or replace function private.normalize_project()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.name = btrim(new.name);
  new.slug = lower(btrim(new.slug));
  new.description = btrim(new.description);
  new.category = btrim(new.category);
  if new.detailed_description is not null then
    new.detailed_description = nullif(btrim(new.detailed_description), '');
  end if;
  if new.problem is not null then
    new.problem = nullif(btrim(new.problem), '');
  end if;
  if new.solution is not null then
    new.solution = nullif(btrim(new.solution), '');
  end if;
  if new.cover_image_url is not null then
    new.cover_image_url = nullif(btrim(new.cover_image_url), '');
  end if;
  if new.github_url is not null then
    new.github_url = nullif(btrim(new.github_url), '');
  end if;
  if new.demo_url is not null then
    new.demo_url = nullif(btrim(new.demo_url), '');
  end if;
  if new.documentation_url is not null then
    new.documentation_url = nullif(btrim(new.documentation_url), '');
  end if;
  return new;
end;
$$;

create trigger projects_bi_10_normalize
before insert or update on public.projects
for each row
execute function private.normalize_project();

create trigger projects_bu_updated_at
before update on public.projects
for each row
execute function private.set_updated_at();

create trigger project_members_bu_updated_at
before update on public.project_members
for each row
execute function private.set_updated_at();

create or replace function private.add_project_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.project_members (project_id, profile_id, role, status, joined_at)
  values (new.id, new.owner_id, 'owner', 'active', now());
  return new;
end;
$$;

create trigger projects_ai_owner
after insert on public.projects
for each row
execute function private.add_project_owner();

create or replace function private.guard_single_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  project uuid;
  owners integer;
begin
  project = coalesce(new.project_id, old.project_id);
  if not exists (select 1 from public.projects where id = project) then
    return null;
  end if;

  select count(*)
  into owners
  from public.project_members
  where project_id = project
    and role = 'owner'
    and status = 'active';

  if owners <> 1 then
    raise exception 'A project must have exactly one active owner';
  end if;

  if tg_op = 'UPDATE'
    and old.project_id is distinct from new.project_id
    and exists (select 1 from public.projects where id = old.project_id) then
    select count(*)
    into owners
    from public.project_members
    where project_id = old.project_id
      and role = 'owner'
      and status = 'active';
    if owners <> 1 then
      raise exception 'A project must have exactly one active owner';
    end if;
  end if;

  return null;
end;
$$;

create constraint trigger project_members_one_owner
after insert or update or delete on public.project_members
deferrable initially deferred
for each row
execute function private.guard_single_owner();
