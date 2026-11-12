-- The signed-in person can record that their password changed.

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
  );

create or replace function public.record_security_notice()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Sign in first';
  end if;

  perform set_config('app.system_write', 'true', true);
  insert into public.notifications (recipient_id, type, message)
  values ((select auth.uid()), 'security', 'Your password was changed.');
  perform set_config('app.system_write', 'false', true);
end;
$$;

revoke all on function public.record_security_notice() from public, anon;
grant execute on function public.record_security_notice() to authenticated;
