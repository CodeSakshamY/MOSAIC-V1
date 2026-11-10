-- Column guards and account anonymize. Guards are security invoker so current_user is the caller.

create or replace function private.project_has_public_posts(project uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.posts
    where project_id = project
      and visibility = 'public'
      and removed_at is null
  );
$$;

create or replace function private.guard_profile_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if private.is_trusted_writer() then
    return new;
  end if;

  if old.deleted_at is not null then
    raise exception 'This profile is closed';
  end if;

  if new.id is distinct from old.id
    or new.is_demo is distinct from old.is_demo
    or new.deleted_at is distinct from old.deleted_at then
    raise exception 'is_demo and deleted_at cannot be changed by a client';
  end if;

  return new;
end;
$$;

create trigger profiles_bu_20_guard
before update on public.profiles
for each row
execute function private.guard_profile_columns();

create or replace function private.guard_project_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if private.is_trusted_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.is_demo or new.featured_at is not null or new.removed_at is not null then
      raise exception 'featured_at, removed_at, and is_demo are not client fields';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
    or new.owner_id is distinct from old.owner_id
    or new.created_at is distinct from old.created_at
    or new.is_demo is distinct from old.is_demo then
    raise exception 'This project field cannot be changed';
  end if;

  if new.featured_at is distinct from old.featured_at
    and not private.is_staff(auth.uid()) then
    raise exception 'featured_at is staff-only';
  end if;

  if new.removed_at is distinct from old.removed_at
    and not private.is_staff(auth.uid()) then
    raise exception 'Only staff can remove a project';
  end if;

  if private.is_staff(auth.uid())
    and not private.is_project_editor(old.id, auth.uid())
    and (
      new.name is distinct from old.name
      or new.slug is distinct from old.slug
      or new.description is distinct from old.description
      or new.detailed_description is distinct from old.detailed_description
      or new.problem is distinct from old.problem
      or new.solution is distinct from old.solution
      or new.cover_image_url is distinct from old.cover_image_url
      or new.category is distinct from old.category
      or new.status is distinct from old.status
      or new.github_url is distinct from old.github_url
      or new.demo_url is distinct from old.demo_url
      or new.documentation_url is distinct from old.documentation_url
      or new.visibility is distinct from old.visibility
      or new.looking_for_contributors is distinct from old.looking_for_contributors
      or new.collaboration_type is distinct from old.collaboration_type
      or new.parent_project_id is distinct from old.parent_project_id
    ) then
    raise exception 'Staff can only feature or remove a project';
  end if;

  if new.visibility = 'private'
    and old.visibility is distinct from 'private'
    and private.project_has_public_posts(new.id) then
    raise exception 'Make the project posts private before hiding the project';
  end if;

  return new;
end;
$$;

create trigger projects_biu_20_guard
before insert or update on public.projects
for each row
execute function private.guard_project_columns();

create or replace function private.guard_post_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if private.is_trusted_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.is_demo or new.removed_at is not null then
      raise exception 'is_demo and removed_at are not client fields';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
    or new.author_id is distinct from old.author_id
    or new.type is distinct from old.type
    or new.project_id is distinct from old.project_id
    or new.build_log_id is distinct from old.build_log_id
    or new.opportunity_id is distinct from old.opportunity_id
    or new.is_demo is distinct from old.is_demo
    or new.created_at is distinct from old.created_at then
    raise exception 'This post field cannot be changed';
  end if;

  if new.removed_at is distinct from old.removed_at
    and not private.is_staff(auth.uid()) then
    raise exception 'Only staff can remove a post';
  end if;

  if private.is_staff(auth.uid())
    and auth.uid() is distinct from old.author_id
    and (
      new.title is distinct from old.title
      or new.content is distinct from old.content
      or new.media_urls is distinct from old.media_urls
      or new.visibility is distinct from old.visibility
    ) then
    raise exception 'Staff can only change removed_at on a post';
  end if;

  return new;
end;
$$;

create trigger posts_biu_20_guard
before insert or update on public.posts
for each row
execute function private.guard_post_columns();

create or replace function private.guard_build_log_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if private.is_trusted_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.removed_at is not null then
      raise exception 'removed_at is not a client field';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
    or new.project_id is distinct from old.project_id
    or new.author_id is distinct from old.author_id
    or new.created_at is distinct from old.created_at then
    raise exception 'This build log field cannot be changed';
  end if;

  if new.removed_at is distinct from old.removed_at
    and not private.is_staff(auth.uid()) then
    raise exception 'Only staff can remove a build log';
  end if;

  if private.is_staff(auth.uid())
    and auth.uid() is distinct from old.author_id
    and (
      new.title is distinct from old.title
      or new.content is distinct from old.content
      or new.media_urls is distinct from old.media_urls
    ) then
    raise exception 'Staff can only change removed_at on a build log';
  end if;

  return new;
end;
$$;

create trigger build_logs_biu_20_guard
before insert or update on public.build_logs
for each row
execute function private.guard_build_log_columns();

create or replace function private.guard_comment_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if private.is_trusted_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.removed_at is not null then
      raise exception 'removed_at is not a client field';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
    or new.post_id is distinct from old.post_id
    or new.author_id is distinct from old.author_id
    or new.parent_comment_id is distinct from old.parent_comment_id
    or new.created_at is distinct from old.created_at then
    raise exception 'This comment field cannot be changed';
  end if;

  if new.removed_at is distinct from old.removed_at
    and not private.is_staff(auth.uid()) then
    raise exception 'Only staff can remove a comment';
  end if;

  if private.is_staff(auth.uid())
    and auth.uid() is distinct from old.author_id
    and new.content is distinct from old.content then
    raise exception 'Staff can only change removed_at on a comment';
  end if;

  return new;
end;
$$;

create trigger comments_biu_20_guard
before insert or update on public.comments
for each row
execute function private.guard_comment_columns();

create or replace function private.guard_opportunity_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if private.is_trusted_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.is_demo then
      raise exception 'is_demo cannot be set by a client';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
    or new.is_demo is distinct from old.is_demo then
    raise exception 'This opportunity field cannot be changed';
  end if;

  return new;
end;
$$;

create trigger opportunities_biu_20_guard
before insert or update on public.opportunities
for each row
execute function private.guard_opportunity_columns();

create or replace function private.guard_community_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if private.is_trusted_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.is_demo or new.removed_at is not null then
      raise exception 'is_demo and removed_at are not client fields';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
    or new.is_demo is distinct from old.is_demo then
    raise exception 'This community field cannot be changed';
  end if;

  if new.removed_at is distinct from old.removed_at
    and not private.is_staff(auth.uid()) then
    raise exception 'Only staff can remove a community';
  end if;

  return new;
end;
$$;

create trigger communities_biu_20_guard
before insert or update on public.communities
for each row
execute function private.guard_community_columns();

create or replace function private.guard_notification_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if private.is_trusted_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    raise exception 'Notifications are created by the system';
  end if;

  if new.id is distinct from old.id
    or new.recipient_id is distinct from old.recipient_id
    or new.actor_id is distinct from old.actor_id
    or new.type is distinct from old.type
    or new.project_id is distinct from old.project_id
    or new.post_id is distinct from old.post_id
    or new.comment_id is distinct from old.comment_id
    or new.community_id is distinct from old.community_id
    or new.message is distinct from old.message
    or new.created_at is distinct from old.created_at then
    raise exception 'Only read_at can be changed';
  end if;

  return new;
end;
$$;

create trigger notifications_biu_guard
before insert or update on public.notifications
for each row
execute function private.guard_notification_columns();

create or replace function private.guard_report_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or private.is_trusted_writer() then
    return new;
  end if;

  if new.reporter_id is distinct from old.reporter_id
    or new.profile_id is distinct from old.profile_id
    or new.project_id is distinct from old.project_id
    or new.post_id is distinct from old.post_id
    or new.comment_id is distinct from old.comment_id
    or new.reason is distinct from old.reason
    or new.description is distinct from old.description
    or new.created_at is distinct from old.created_at
    or new.id is distinct from old.id then
    raise exception 'Report content is fixed';
  end if;

  return new;
end;
$$;

create trigger reports_biu_guard
before insert or update on public.reports
for each row
execute function private.guard_report_columns();

create or replace function private.guard_sanction_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' or private.is_trusted_writer() then
    return new;
  end if;

  if new.profile_id is distinct from old.profile_id
    or new.kind is distinct from old.kind
    or new.reason is distinct from old.reason
    or new.created_by is distinct from old.created_by
    or new.created_at is distinct from old.created_at
    or new.id is distinct from old.id then
    raise exception 'A sanction can only be lifted';
  end if;

  return new;
end;
$$;

create trigger account_sanctions_biu_guard
before insert or update on public.account_sanctions
for each row
execute function private.guard_sanction_columns();

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
  where bucket_id = 'avatars'
    and (storage.foldername(name))[1] = target::text;

  perform set_config('app.anonymizing', 'false', true);
end;
$$;

revoke all on function public.anonymize_profile(uuid) from public, anon, authenticated;
grant execute on function public.anonymize_profile(uuid) to service_role;

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to anon, authenticated, service_role;
