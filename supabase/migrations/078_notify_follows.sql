-- A person can turn off the notification that someone followed them.

alter table public.profiles
  add column notify_follows boolean not null default true;

create or replace function private.notify_on_follow()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  label text;
  allowed boolean;
begin
  if private.is_blocked(new.follower_id, new.following_id) then
    return new;
  end if;

  select notify_follows into allowed from public.profiles where id = new.following_id;
  if allowed = false then
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
