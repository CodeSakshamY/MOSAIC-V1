-- Extra profile sections written by the builder. Up to 5.

create table public.profile_sections (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  constraint profile_sections_title_length check (char_length(title) between 1 and 80),
  constraint profile_sections_body_length check (char_length(body) between 1 and 2000)
);

create index profile_sections_profile_idx on public.profile_sections (profile_id, created_at);

alter table public.profile_sections enable row level security;

grant select on public.profile_sections to anon, authenticated;
grant insert, delete on public.profile_sections to authenticated;

create policy profile_sections_select on public.profile_sections
for select to anon, authenticated
using (private.profile_record_visible(profile_id));

create policy profile_sections_insert on public.profile_sections
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create policy profile_sections_delete on public.profile_sections
for delete to authenticated
using (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create or replace function private.normalize_profile_section()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.title = btrim(new.title);
  new.body = btrim(new.body);
  return new;
end;
$$;

create trigger profile_sections_bi_05_normalize
before insert or update on public.profile_sections
for each row
execute function private.normalize_profile_section();

create or replace function private.limit_profile_sections()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    select count(*)
    from public.profile_sections
    where profile_id = new.profile_id
  ) >= 5 then
    raise exception 'A profile can have 5 sections';
  end if;
  return new;
end;
$$;

create trigger profile_sections_bi_10_limit
before insert on public.profile_sections
for each row
execute function private.limit_profile_sections();

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
