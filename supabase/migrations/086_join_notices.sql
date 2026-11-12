-- The project owner is told when someone joins as a contributor.

create or replace function private.notify_on_member_join()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  owner uuid;
  label text;
begin
  if new.role = 'owner' or new.status <> 'active' then
    return new;
  end if;

  select owner_id into owner from public.projects where id = new.project_id;
  if owner is null or owner = new.profile_id or private.is_blocked(new.profile_id, owner) then
    return new;
  end if;

  label = coalesce(private.profile_label(new.profile_id), 'A builder');
  perform set_config('app.system_write', 'true', true);
  insert into public.notifications (recipient_id, actor_id, type, project_id, message)
  values (
    owner,
    new.profile_id,
    'contribution_accepted',
    new.project_id,
    left(label || ' joined your project.', 200)
  );
  perform set_config('app.system_write', 'false', true);
  return new;
end;
$$;

create trigger project_members_ai_notify
after insert on public.project_members
for each row execute function private.notify_on_member_join();
