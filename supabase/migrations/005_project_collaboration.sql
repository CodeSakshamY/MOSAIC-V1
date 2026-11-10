-- Requests to join a project. Accepting one adds an active contributor.

create type public.contribution_status as enum (
  'pending',
  'accepted',
  'rejected',
  'withdrawn'
);

create table public.contribution_requests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  requester_id uuid not null references public.profiles (id) on delete restrict,
  message text not null,
  proposed_contribution text not null,
  status public.contribution_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contribution_requests_message_length check (char_length(message) between 1 and 1000),
  constraint contribution_requests_proposal_length check (
    char_length(proposed_contribution) between 1 and 1000
  )
);

create unique index contribution_requests_one_pending_idx
  on public.contribution_requests (project_id, requester_id)
  where status = 'pending';

create trigger contribution_requests_bu_updated_at
before update on public.contribution_requests
for each row
execute function private.set_updated_at();

create or replace function private.guard_contribution_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.projects
    where id = new.project_id
      and owner_id = new.requester_id
  ) then
    raise exception 'The project owner cannot request to contribute';
  end if;

  if tg_op = 'INSERT'
    and new.status <> 'pending'
    and not private.is_trusted_writer() then
    raise exception 'A contribution request starts pending';
  end if;

  if tg_op = 'UPDATE' then
    if new.project_id is distinct from old.project_id
      or new.requester_id is distinct from old.requester_id
      or new.message is distinct from old.message
      or new.proposed_contribution is distinct from old.proposed_contribution
      or new.created_at is distinct from old.created_at
      or new.id is distinct from old.id then
      raise exception 'A contribution request can only change status';
    end if;

    if auth.uid() = old.requester_id then
      if old.status <> 'pending' or new.status <> 'withdrawn' then
        raise exception 'The requester can only withdraw a pending request';
      end if;
    elsif private.is_trusted_writer() then
      null;
    else
      if old.status <> 'pending' or new.status not in ('accepted', 'rejected') then
        raise exception 'An editor can accept or reject a pending request';
      end if;
    end if;
  end if;

  if tg_op = 'UPDATE'
    and new.status = 'accepted'
    and old.status is distinct from 'accepted' then
    insert into public.project_members (project_id, profile_id, role, status, joined_at)
    values (new.project_id, new.requester_id, 'contributor', 'active', now())
    on conflict on constraint project_members_project_profile_key
    do update
      set status = 'active',
          role = case
            when project_members.role = 'owner' then project_members.role
            else 'contributor'
          end,
          joined_at = coalesce(project_members.joined_at, now());
  end if;

  return new;
end;
$$;

create trigger contribution_requests_biu_guard
before insert or update on public.contribution_requests
for each row
execute function private.guard_contribution_request();
