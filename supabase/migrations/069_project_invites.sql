-- An owner can invite a builder onto a project.

create table public.project_invites (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  invitee_id uuid not null references public.profiles (id) on delete cascade,
  invited_by uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  constraint project_invites_status check (status in ('pending', 'accepted', 'declined')),
  constraint project_invites_project_invitee_key unique (project_id, invitee_id)
);

create index project_invites_invitee_idx on public.project_invites (invitee_id, status);

alter table public.project_invites enable row level security;

grant select, insert, update on public.project_invites to authenticated;

create policy project_invites_select on public.project_invites
for select to authenticated
using (
  invitee_id = (select auth.uid())
  or invited_by = (select auth.uid())
  or private.is_project_editor(project_id, (select auth.uid()))
);

create policy project_invites_insert on public.project_invites
for insert to authenticated
with check (
  invited_by = (select auth.uid())
  and private.is_project_editor(project_id, (select auth.uid()))
  and not private.is_suspended((select auth.uid()))
  and invitee_id <> invited_by
  and status = 'pending'
);

create policy project_invites_update on public.project_invites
for update to authenticated
using (
  invitee_id = (select auth.uid())
  and status = 'pending'
  and not private.is_suspended((select auth.uid()))
)
with check (
  invitee_id = (select auth.uid())
  and status in ('accepted', 'declined')
);

create or replace function private.accept_project_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' and new.status = 'accepted' and old.status is distinct from 'accepted' then
    insert into public.project_members (project_id, profile_id, role, status, joined_at)
    values (new.project_id, new.invitee_id, 'contributor', 'active', now())
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

create trigger project_invites_bu_accept
before update on public.project_invites
for each row
execute function private.accept_project_invite();
