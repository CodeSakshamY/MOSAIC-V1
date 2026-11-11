-- Watch a project. Build-log notifications go to members and to these followers.

create table public.project_follows (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, project_id)
);

create index project_follows_project_idx on public.project_follows (project_id);

alter table public.project_follows enable row level security;

grant select on public.project_follows to anon, authenticated;
grant insert, delete on public.project_follows to authenticated;

create policy project_follows_select on public.project_follows
for select to anon, authenticated
using (
  profile_id = (select auth.uid())
  or private.can_view_project(project_id, (select auth.uid()))
);

create policy project_follows_insert on public.project_follows
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
  and private.can_view_project(project_id, (select auth.uid()))
);

create policy project_follows_delete on public.project_follows
for delete to authenticated
using (profile_id = (select auth.uid()));

create or replace function private.notify_on_build_log()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  related_post uuid;
  label text;
  recipient uuid;
begin
  select id into related_post
  from public.posts
  where build_log_id = new.id;

  if related_post is null then
    return new;
  end if;

  label = coalesce(private.profile_label(new.author_id), 'A builder');
  perform set_config('app.system_write', 'true', true);

  for recipient in
    select profile_id
    from public.project_members
    where project_id = new.project_id
      and status = 'active'
      and profile_id <> new.author_id
    union
    select profile_id
    from public.project_follows
    where project_id = new.project_id
      and profile_id <> new.author_id
  loop
    if not private.is_blocked(new.author_id, recipient) then
      insert into public.notifications (
        recipient_id, actor_id, type, project_id, post_id, message
      )
      values (
        recipient,
        new.author_id,
        'project_update',
        new.project_id,
        related_post,
        left(label || ' published a build log.', 200)
      );
    end if;
  end loop;

  perform set_config('app.system_write', 'false', true);
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
  delete from public.project_follows where profile_id = target;
  delete from public.feed_events where user_id = target;
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
