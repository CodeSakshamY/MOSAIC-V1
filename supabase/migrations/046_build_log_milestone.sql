-- A build log can be recorded as a milestone. The dated project milestones stay separate.

create type public.build_log_kind as enum (
  'update',
  'milestone'
);

alter table public.build_logs
  add column kind public.build_log_kind not null default 'update';

create or replace function private.guard_build_log_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if private.is_trusted_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.removed_at is not null then
      raise exception 'removed_at is not a client field';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
    or new.project_id is distinct from old.project_id
    or new.author_id is distinct from old.author_id
    or new.created_at is distinct from old.created_at
    or new.kind is distinct from old.kind then
    raise exception 'This build log field cannot be changed';
  end if;

  if new.removed_at is distinct from old.removed_at
    and not private.is_staff(auth.uid()) then
    raise exception 'Only staff can remove a build log';
  end if;

  if private.is_staff(auth.uid())
    and auth.uid() is distinct from old.author_id
    and (
      new.title is distinct from old.title
      or new.content is distinct from old.content
      or new.media_urls is distinct from old.media_urls
      or new.kind is distinct from old.kind
    ) then
    raise exception 'Staff can only change removed_at on a build log';
  end if;

  return new;
end;
$$;
