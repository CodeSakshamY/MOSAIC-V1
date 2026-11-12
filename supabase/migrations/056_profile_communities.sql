-- Communities a person chooses to show on a public profile.
-- This is not a MOSAIC group. Joining a group stays a later feature.

create table public.profile_communities (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  role text,
  year smallint,
  created_at timestamptz not null default now(),
  constraint profile_communities_name_length check (char_length(name) between 1 and 80),
  constraint profile_communities_role_length check (
    role is null or char_length(role) between 1 and 40
  ),
  constraint profile_communities_year check (year is null or year between 1950 and 2100)
);

create index profile_communities_profile_idx
  on public.profile_communities (profile_id, created_at desc);

alter table public.profile_communities enable row level security;

grant select on public.profile_communities to anon, authenticated;
grant insert, delete on public.profile_communities to authenticated;

create policy profile_communities_select on public.profile_communities
for select to anon, authenticated
using (
  profile_id = (select auth.uid())
  or exists (
    select 1
    from public.profiles
    where id = profile_id
      and deleted_at is null
      and (not is_demo or private.allow_demo())
  )
);

create policy profile_communities_insert on public.profile_communities
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create policy profile_communities_delete on public.profile_communities
for delete to authenticated
using (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create or replace function private.normalize_profile_community()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.name = btrim(new.name);
  new.role = nullif(btrim(new.role), '');
  return new;
end;
$$;

create trigger profile_communities_bi_05_normalize
before insert or update on public.profile_communities
for each row
execute function private.normalize_profile_community();

create or replace function private.limit_profile_communities()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    select count(*)
    from public.profile_communities
    where profile_id = new.profile_id
  ) >= 20 then
    raise exception 'A profile can list 20 communities';
  end if;
  return new;
end;
$$;

create trigger profile_communities_bi_10_limit
before insert on public.profile_communities
for each row
execute function private.limit_profile_communities();

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
