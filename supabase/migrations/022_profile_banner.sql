-- A wide profile banner. Photos stay in storage, never as an arbitrary web address.

alter table public.profiles
  add column banner_url text;

alter table public.profiles
  add constraint profiles_banner_storage check (
    banner_url is null or private.is_storage_url(banner_url)
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
  if new.banner_url is not null then
    new.banner_url = nullif(btrim(new.banner_url), '');
  end if;
  return new;
end;
$$;

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
  delete from public.follows where follower_id = target or following_id = target;
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
