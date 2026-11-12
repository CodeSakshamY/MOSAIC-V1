-- A person can turn off comment and reaction notices.

alter table public.profiles
  add column notify_comments boolean not null default true;

alter table public.profiles
  add column notify_reactions boolean not null default true;

create or replace function private.allows_comment_notice(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select notify_comments from public.profiles where id = uid), true);
$$;

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
  build_log uuid;
  follower uuid;
  mentioned uuid;
begin
  if new.removed_at is not null then
    return new;
  end if;

  select author_id, build_log_id into post_author, build_log
  from public.posts
  where id = new.post_id;

  label = coalesce(private.profile_label(new.author_id), 'A builder');
  perform set_config('app.system_write', 'true', true);

  if new.parent_comment_id is null then
    if post_author is not null
      and post_author <> new.author_id
      and not private.is_blocked(new.author_id, post_author)
      and private.allows_comment_notice(post_author) then
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
  else
    select author_id into parent_author
    from public.comments
    where id = new.parent_comment_id;

    if parent_author is not null
      and parent_author <> new.author_id
      and not private.is_blocked(new.author_id, parent_author)
      and private.allows_comment_notice(parent_author) then
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
      and not private.is_blocked(new.author_id, post_author)
      and private.allows_comment_notice(post_author) then
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
  end if;

  if build_log is not null then
    for follower in
      select profile_id
      from public.build_log_follows
      where build_log_id = build_log
        and profile_id <> new.author_id
        and profile_id is distinct from post_author
        and profile_id is distinct from parent_author
    loop
      if not private.is_blocked(new.author_id, follower) and private.allows_comment_notice(follower) then
        insert into public.notifications (
          recipient_id, actor_id, type, post_id, comment_id, message
        )
        values (
          follower,
          new.author_id,
          'comment',
          new.post_id,
          new.id,
          left(label || ' commented on an update you follow.', 200)
        );
      end if;
    end loop;
  end if;


  for mentioned in
    select id
    from public.profiles
    where deleted_at is null
      and username is not null
      and id <> new.author_id
      and id is distinct from post_author
      and id is distinct from parent_author
      and new.content ~* ('(^|[^[:alnum:]_])@' || username || '([^[:alnum:]_]|$)')
  loop
    if not private.is_blocked(new.author_id, mentioned) and private.allows_comment_notice(mentioned) then
      insert into public.notifications (
        recipient_id, actor_id, type, post_id, comment_id, message
      )
      values (
        mentioned,
        new.author_id,
        'reply',
        new.post_id,
        new.id,
        left(label || ' mentioned you.', 200)
      );
    end if;
  end loop;

  perform set_config('app.system_write', 'false', true);
  return new;
end;
$$;

create or replace function private.notify_on_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  post_author uuid;
  label text;
  verb text;
begin
  if new.type not in ('like', 'upvote', 'interesting', 'inspired') then
    return new;
  end if;

  select author_id into post_author from public.posts where id = new.post_id;
  if post_author is null or post_author = new.user_id or private.is_blocked(new.user_id, post_author) then
    return new;
  end if;

  if coalesce((select notify_reactions from public.profiles where id = post_author), true) = false then
    return new;
  end if;

  verb = case new.type
    when 'upvote' then 'upvoted'
    when 'interesting' then 'marked interesting'
    when 'inspired' then 'marked inspired'
    else 'liked'
  end;
  label = coalesce(private.profile_label(new.user_id), 'A builder');
  perform set_config('app.system_write', 'true', true);
  insert into public.notifications (recipient_id, actor_id, type, post_id, message)
  values (
    post_author,
    new.user_id,
    'reaction',
    new.post_id,
    left(label || ' ' || verb || ' your post.', 200)
  );
  perform set_config('app.system_write', 'false', true);
  return new;
end;
$$;

