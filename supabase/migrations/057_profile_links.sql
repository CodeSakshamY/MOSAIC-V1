-- Extra profile links, including LinkedIn. GitHub and the website stay on the profile row.

create table public.profile_links (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  label text not null,
  url text not null,
  created_at timestamptz not null default now(),
  constraint profile_links_label_length check (char_length(label) between 1 and 40),
  constraint profile_links_url check (char_length(url) <= 300 and private.is_https_url(url)),
  constraint profile_links_profile_url_key unique (profile_id, url)
);

create index profile_links_profile_idx on public.profile_links (profile_id, created_at desc);

alter table public.profile_links enable row level security;

grant select on public.profile_links to anon, authenticated;
grant insert, delete on public.profile_links to authenticated;

create policy profile_links_select on public.profile_links
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

create policy profile_links_insert on public.profile_links
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create policy profile_links_delete on public.profile_links
for delete to authenticated
using (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create or replace function private.normalize_profile_link()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.label = btrim(new.label);
  new.url = btrim(new.url);
  return new;
end;
$$;

create trigger profile_links_bi_05_normalize
before insert or update on public.profile_links
for each row
execute function private.normalize_profile_link();

create or replace function private.limit_profile_links()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    select count(*)
    from public.profile_links
    where profile_id = new.profile_id
  ) >= 8 then
    raise exception 'A profile can list 8 links';
  end if;
  return new;
end;
$$;

create trigger profile_links_bi_10_limit
before insert on public.profile_links
for each row
execute function private.limit_profile_links();

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
