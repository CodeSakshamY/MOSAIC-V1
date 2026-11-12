-- Follow one build log. A later comment on that update notifies the follower.

create table public.build_log_follows (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  build_log_id uuid not null references public.build_logs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, build_log_id)
);

create index build_log_follows_log_idx on public.build_log_follows (build_log_id);

alter table public.build_log_follows enable row level security;

grant select on public.build_log_follows to anon, authenticated;
grant insert, delete on public.build_log_follows to authenticated;

create policy build_log_follows_select on public.build_log_follows
for select to anon, authenticated
using (
  profile_id = (select auth.uid())
  or exists (
    select 1
    from public.build_logs
    where id = build_log_id
      and removed_at is null
      and private.can_view_project(project_id, (select auth.uid()))
  )
);

create policy build_log_follows_insert on public.build_log_follows
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
  and exists (
    select 1
    from public.build_logs
    where id = build_log_id
      and removed_at is null
      and private.can_view_project(project_id, (select auth.uid()))
  )
);

create policy build_log_follows_delete on public.build_log_follows
for delete to authenticated
using (profile_id = (select auth.uid()));

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

  perform set_config('app.system_write', 'false', true);
  return new;
end;
$$;
