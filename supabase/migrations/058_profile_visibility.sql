-- A profile can be public or private. The table itself is not readable by the API.
-- profile_directory hides private details. Profile lists are readable only for a public profile or the owner.

alter table public.profiles
  add column visibility public.visibility not null default 'public';

create or replace function private.profile_is_public(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = target
      and deleted_at is null
      and visibility = 'public'
      and (not is_demo or private.allow_demo())
  );
$$;

create or replace function private.profile_details_visible(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target = (select auth.uid()) or private.profile_is_public(target);
$$;

create view public.profile_directory
with (security_barrier = true, security_invoker = false) as
select
  p.id,
  p.username,
  p.display_name,
  p.visibility,
  p.deleted_at,
  p.onboarding_complete,
  case when private.profile_details_visible(p.id) then p.bio else null end as bio,
  case when private.profile_details_visible(p.id) then p.avatar_url else null end as avatar_url,
  case when private.profile_details_visible(p.id) then p.banner_url else null end as banner_url,
  case when private.profile_details_visible(p.id) then p.education else null end as education,
  case when private.profile_details_visible(p.id) then p.city else null end as city,
  case when private.profile_details_visible(p.id) then p.state else null end as state,
  case when private.profile_details_visible(p.id) then p.age_group else null end as age_group,
  case when private.profile_details_visible(p.id) then p.github_username else null end as github_username,
  case when private.profile_details_visible(p.id) then p.website_url else null end as website_url,
  case when private.profile_details_visible(p.id) then p.collaboration_preference else null end as collaboration_preference,
  case when private.profile_details_visible(p.id) then p.looking_for else '{}'::text[] end as looking_for
from public.profiles p
where (
  p.deleted_at is null
  or p.id = (select auth.uid())
)
and (
  not p.is_demo
  or private.allow_demo()
  or p.id = (select auth.uid())
);

revoke select on table public.profiles from public, anon, authenticated;
grant select on public.profile_directory to anon, authenticated;

create or replace function private.profile_record_visible(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select target = (select auth.uid()) or private.profile_is_public(target);
$$;

drop policy profile_skills_select on public.profile_skills;
create policy profile_skills_select on public.profile_skills
for select to anon, authenticated
using (private.profile_record_visible(profile_id));

drop policy profile_interests_select on public.profile_interests;
create policy profile_interests_select on public.profile_interests
for select to anon, authenticated
using (private.profile_record_visible(profile_id));

drop policy profile_education_select on public.profile_education;
create policy profile_education_select on public.profile_education
for select to anon, authenticated
using (private.profile_record_visible(profile_id));

drop policy profile_experience_select on public.profile_experience;
create policy profile_experience_select on public.profile_experience
for select to anon, authenticated
using (private.profile_record_visible(profile_id));

drop policy profile_certificates_select on public.profile_certificates;
create policy profile_certificates_select on public.profile_certificates
for select to anon, authenticated
using (private.profile_record_visible(profile_id));

drop policy profile_awards_select on public.profile_awards;
create policy profile_awards_select on public.profile_awards
for select to anon, authenticated
using (private.profile_record_visible(profile_id));

drop policy profile_publications_select on public.profile_publications;
create policy profile_publications_select on public.profile_publications
for select to anon, authenticated
using (private.profile_record_visible(profile_id));

drop policy profile_competitions_select on public.profile_competitions;
create policy profile_competitions_select on public.profile_competitions
for select to anon, authenticated
using (private.profile_record_visible(profile_id));

drop policy profile_communities_select on public.profile_communities;
create policy profile_communities_select on public.profile_communities
for select to anon, authenticated
using (private.profile_record_visible(profile_id));

drop policy profile_links_select on public.profile_links;
create policy profile_links_select on public.profile_links
for select to anon, authenticated
using (private.profile_record_visible(profile_id));
