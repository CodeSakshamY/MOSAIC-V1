-- A comment that names @username tells that person.

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
  else
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
      if not private.is_blocked(new.author_id, follower) then
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
    if not private.is_blocked(new.author_id, mentioned) then
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
