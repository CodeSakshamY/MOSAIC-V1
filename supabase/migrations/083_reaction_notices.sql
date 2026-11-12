-- A like, upvote, interesting, or inspired reaction tells the post's author.

alter table public.notifications drop constraint notifications_target;

alter table public.notifications
  add constraint notifications_target check (
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
    or (type = 'security')
    or (type = 'reaction' and actor_id is not null and post_id is not null)
    or (type = 'project_invite' and actor_id is not null and project_id is not null)
  );

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

create trigger reactions_ai_notify
after insert on public.reactions
for each row execute function private.notify_on_reaction();
