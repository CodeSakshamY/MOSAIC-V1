-- People who saved a project hear about a new build log.

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
    union
    select profile_id
    from public.project_saves
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
