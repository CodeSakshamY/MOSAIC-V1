-- Competitions a person chooses to show on a public profile.

create table public.profile_competitions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  host text,
  year smallint,
  result text,
  url text,
  created_at timestamptz not null default now(),
  constraint profile_competitions_name_length check (char_length(name) between 1 and 160),
  constraint profile_competitions_host_length check (
    host is null or char_length(host) between 1 and 120
  ),
  constraint profile_competitions_year check (year is null or year between 1950 and 2100),
  constraint profile_competitions_result_length check (
    result is null or char_length(result) between 1 and 80
  ),
  constraint profile_competitions_url check (
    url is null or (char_length(url) <= 300 and private.is_https_url(url))
  )
);

create index profile_competitions_profile_idx
  on public.profile_competitions (profile_id, created_at desc);

alter table public.profile_competitions enable row level security;

grant select on public.profile_competitions to anon, authenticated;
grant insert, delete on public.profile_competitions to authenticated;

create policy profile_competitions_select on public.profile_competitions
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

create policy profile_competitions_insert on public.profile_competitions
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create policy profile_competitions_delete on public.profile_competitions
for delete to authenticated
using (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create or replace function private.normalize_profile_competition()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.name = btrim(new.name);
  new.host = nullif(btrim(new.host), '');
  new.result = nullif(btrim(new.result), '');
  new.url = nullif(btrim(new.url), '');
  return new;
end;
$$;

create trigger profile_competitions_bi_05_normalize
before insert or update on public.profile_competitions
for each row
execute function private.normalize_profile_competition();

create or replace function private.limit_profile_competitions()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    select count(*)
    from public.profile_competitions
    where profile_id = new.profile_id
  ) >= 20 then
    raise exception 'A profile can list 20 competitions';
  end if;
  return new;
end;
$$;

create trigger profile_competitions_bi_10_limit
before insert on public.profile_competitions
for each row
execute function private.limit_profile_competitions();

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
