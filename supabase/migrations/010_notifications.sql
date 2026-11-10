-- Notification rows are written by triggers. Clients can only mark them read or delete them.

create type public.notification_type as enum (
  'new_follower',
  'comment',
  'reply',
  'contribution_request',
  'contribution_accepted',
  'contribution_rejected',
  'project_update',
  'community_activity'
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  type public.notification_type not null,
  project_id uuid references public.projects (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  community_id uuid references public.communities (id) on delete cascade,
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_message_length check (char_length(message) between 1 and 200),
  constraint notifications_target check (
    (type = 'new_follower' and actor_id is not null)
    or (
      type in ('comment', 'reply')
      and actor_id is not null
      and post_id is not null
      and comment_id is not null
    )
    or (
      type in (
        'contribution_request',
        'contribution_accepted',
        'contribution_rejected'
      )
      and actor_id is not null
      and project_id is not null
    )
    or (type = 'project_update' and project_id is not null and post_id is not null)
    or (type = 'community_activity' and community_id is not null)
  )
);

create or replace function private.profile_label(uid uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(nullif(btrim(display_name), ''), 'A builder')
  from public.profiles
  where id = uid;
$$;

create or replace function private.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  label text;
begin
  if private.is_blocked(new.follower_id, new.following_id) then
    return new;
  end if;

  label = coalesce(private.profile_label(new.follower_id), 'A builder');
  perform set_config('app.system_write', 'true', true);
  insert into public.notifications (recipient_id, actor_id, type, message)
  values (
    new.following_id,
    new.follower_id,
    'new_follower',
    left(label || ' followed you.', 200)
  );
  perform set_config('app.system_write', 'false', true);
  return new;
end;
$$;

create trigger follows_ai_notify
after insert on public.follows
for each row
execute function private.notify_on_follow();

create or replace function private.notify_on_comment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
  parent_author uuid;
  label text;
begin
  if new.removed_at is not null then
    return new;
  end if;

  select author_id into post_author from public.posts where id = new.post_id;
  label = coalesce(private.profile_label(new.author_id), 'A builder');
  perform set_config('app.system_write', 'true', true);

  if new.parent_comment_id is null then
    if post_author is not null
      and post_author <> new.author_id
      and not private.is_blocked(new.author_id, post_author) then
      insert into public.notifications (
        recipient_id, actor_id, type, post_id, comment_id, message
      )
      values (
        post_author,
        new.author_id,
        'comment',
        new.post_id,
        new.id,
        left(label || ' commented on your post.', 200)
      );
    end if;
    perform set_config('app.system_write', 'false', true);
    return new;
  end if;

  select author_id into parent_author
  from public.comments
  where id = new.parent_comment_id;

  if parent_author is not null
    and parent_author <> new.author_id
    and not private.is_blocked(new.author_id, parent_author) then
    insert into public.notifications (
      recipient_id, actor_id, type, post_id, comment_id, message
    )
    values (
      parent_author,
      new.author_id,
      'reply',
      new.post_id,
      new.id,
      left(label || ' replied to you.', 200)
    );
  end if;

  if post_author is not null
    and post_author <> new.author_id
    and post_author is distinct from parent_author
    and not private.is_blocked(new.author_id, post_author) then
    insert into public.notifications (
      recipient_id, actor_id, type, post_id, comment_id, message
    )
    values (
      post_author,
      new.author_id,
      'comment',
      new.post_id,
      new.id,
      left(label || ' commented on your post.', 200)
    );
  end if;

  perform set_config('app.system_write', 'false', true);
  return new;
end;
$$;

create trigger comments_ai_notify
after insert on public.comments
for each row
execute function private.notify_on_comment();

create or replace function private.notify_on_contribution()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner_id uuid;
  actor uuid;
  label text;
begin
  select projects.owner_id into owner_id
  from public.projects
  where projects.id = new.project_id;

  actor = coalesce(auth.uid(), owner_id);
  label = coalesce(private.profile_label(new.requester_id), 'A builder');
  perform set_config('app.system_write', 'true', true);

  if tg_op = 'INSERT' and new.status = 'pending' then
    if owner_id is not null
      and owner_id <> new.requester_id
      and not private.is_blocked(new.requester_id, owner_id) then
      insert into public.notifications (
        recipient_id, actor_id, type, project_id, message
      )
      values (
        owner_id,
        new.requester_id,
        'contribution_request',
        new.project_id,
        left(label || ' wants to contribute.', 200)
      );
    end if;
    perform set_config('app.system_write', 'false', true);
    return new;
  end if;

  if tg_op = 'UPDATE'
    and old.status = 'pending'
    and new.status = 'accepted'
    and not private.is_blocked(actor, new.requester_id) then
    insert into public.notifications (
      recipient_id, actor_id, type, project_id, message
    )
    values (
      new.requester_id,
      actor,
      'contribution_accepted',
      new.project_id,
      'Your contribution request was accepted.'
    );
  elsif tg_op = 'UPDATE'
    and old.status = 'pending'
    and new.status = 'rejected'
    and not private.is_blocked(actor, new.requester_id) then
    insert into public.notifications (
      recipient_id, actor_id, type, project_id, message
    )
    values (
      new.requester_id,
      actor,
      'contribution_rejected',
      new.project_id,
      'Your contribution request was declined.'
    );
  end if;

  perform set_config('app.system_write', 'false', true);
  return new;
end;
$$;

create trigger contribution_requests_aiu_notify
after insert or update on public.contribution_requests
for each row
execute function private.notify_on_contribution();

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

-- Deferred so the build-log post exists before the fan-out.
-- There is no project-follow table yet, so active members stand in for followers.
create constraint trigger build_logs_notify
after insert on public.build_logs
deferrable initially deferred
for each row
execute function private.notify_on_build_log();
