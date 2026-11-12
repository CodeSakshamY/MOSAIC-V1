-- An invitation tells the invited builder.

create or replace function private.notify_on_project_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  label text;
begin
  if new.status <> 'pending' then
    return new;
  end if;
  if private.is_blocked(new.invited_by, new.invitee_id) then
    return new;
  end if;

  label = coalesce(private.profile_label(new.invited_by), 'A builder');
  perform set_config('app.system_write', 'true', true);
  insert into public.notifications (recipient_id, actor_id, type, project_id, message)
  values (
    new.invitee_id,
    new.invited_by,
    'project_invite',
    new.project_id,
    left(label || ' invited you to a project.', 200)
  );
  perform set_config('app.system_write', 'false', true);
  return new;
end;
$$;

create trigger project_invites_ai_notify
after insert on public.project_invites
for each row execute function private.notify_on_project_invite();
