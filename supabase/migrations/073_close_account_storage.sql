-- Closing an account still removes the profile. Storage may refuse a direct delete.

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

  if not private.is_trusted_writer() and (select auth.uid()) is distinct from target then
    raise exception 'You can only close your own account';
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

  begin
    delete from storage.objects
    where bucket_id in ('avatars', 'post-media')
      and (storage.foldername(name))[1] = target::text;
  exception
    when others then
      null;
  end;

  perform set_config('app.anonymizing', 'false', true);
end;
$$;

