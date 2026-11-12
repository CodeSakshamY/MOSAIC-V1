-- A builder can name a collection and put public projects in it.

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  created_at timestamptz not null default now(),
  constraint collections_title_length check (char_length(title) between 1 and 80)
);

create table public.collection_projects (
  collection_id uuid not null references public.collections (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (collection_id, project_id)
);

create index collection_projects_project_idx on public.collection_projects (project_id);

alter table public.collections enable row level security;
alter table public.collection_projects enable row level security;

grant select on public.collections to anon, authenticated;
grant insert on public.collections to authenticated;
grant select on public.collection_projects to anon, authenticated;
grant insert, delete on public.collection_projects to authenticated;

create policy collections_select on public.collections
for select to anon, authenticated
using (true);

create policy collections_insert on public.collections
for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and private.is_onboarded((select auth.uid()))
  and not private.is_suspended((select auth.uid()))
);

create policy collection_projects_select on public.collection_projects
for select to anon, authenticated
using (private.can_view_project(project_id, (select auth.uid())));

create policy collection_projects_insert on public.collection_projects
for insert to authenticated
with check (
  private.can_view_project(project_id, (select auth.uid()))
  and exists (
    select 1
    from public.collections
    where collections.id = collection_id
      and collections.owner_id = (select auth.uid())
  )
);

create policy collection_projects_delete on public.collection_projects
for delete to authenticated
using (
  exists (
    select 1
    from public.collections
    where collections.id = collection_id
      and collections.owner_id = (select auth.uid())
  )
);

create or replace function private.normalize_collection()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.title = btrim(new.title);
  return new;
end;
$$;

create trigger collections_normalize
before insert or update on public.collections
for each row execute function private.normalize_collection();

create or replace function private.guard_collection_cap()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select count(*) from public.collections where owner_id = new.owner_id) >= 5 then
    raise exception 'A builder can keep 5 collections';
  end if;
  return new;
end;
$$;

create trigger collections_cap
before insert on public.collections
for each row execute function private.guard_collection_cap();

create or replace function private.guard_collection_project_cap()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (select count(*) from public.collection_projects where collection_id = new.collection_id) >= 12 then
    raise exception 'A collection can hold 12 projects';
  end if;
  return new;
end;
$$;

create trigger collection_projects_cap
before insert on public.collection_projects
for each row execute function private.guard_collection_project_cap();

create or replace function public.anonymize_profile(target uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if target is null then
    raise exception 'A profile id is required';
  end if;

  perform set_config('app.anonymizing', 'true', true);

  update public.profiles
  set
    display_name = 'Deleted builder',
    bio = null,
    avatar_url = null,
    banner_url = null,
    city = null,
    state = null,
    age_group = null,
    education = null,
    github_username = null,
    website_url = null,
    looking_for = '{}',
    collaboration_preference = null,
    username = 'deleted_' || left(replace(target::text, '-', ''), 8),
    deleted_at = now()
  where id = target;

  if not found then
    raise exception 'Profile not found';
  end if;

  delete from public.profile_skills where profile_id = target;
  delete from public.profile_interests where profile_id = target;
  delete from public.profile_publications where profile_id = target;
  delete from public.profile_competitions where profile_id = target;
  delete from public.profile_communities where profile_id = target;
  delete from public.profile_links where profile_id = target;
  delete from public.profile_sections where profile_id = target;
  delete from public.collections where owner_id = target;
  delete from public.follows where follower_id = target or following_id = target;
  delete from public.project_follows where profile_id = target;
  delete from public.feed_events where user_id = target;
  delete from public.hidden_posts where profile_id = target;
  delete from public.blocks where blocker_id = target or blocked_id = target;
  delete from public.reactions where user_id = target;
  delete from public.saves where user_id = target;
  delete from public.opportunity_saves where profile_id = target;
  delete from public.notifications where recipient_id = target or actor_id = target;

  delete from storage.objects
  where bucket_id in ('avatars', 'post-media')
    and (storage.foldername(name))[1] = target::text;

  perform set_config('app.anonymizing', 'false', true);
end;
$$;
