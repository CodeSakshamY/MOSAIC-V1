-- An owner can mark a dated milestone as major. The project page highlights those.

alter table public.project_milestones
  add column major boolean not null default false;

grant update on public.project_milestones to authenticated;

create policy project_milestones_update on public.project_milestones
for update to authenticated
using (
  not private.is_suspended((select auth.uid()))
  and exists (
    select 1
    from public.projects
    where id = project_id
      and owner_id = (select auth.uid())
      and removed_at is null
  )
)
with check (
  not private.is_suspended((select auth.uid()))
  and exists (
    select 1
    from public.projects
    where id = project_id
      and owner_id = (select auth.uid())
      and removed_at is null
  )
);

create or replace function private.guard_project_milestone_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.id is distinct from old.id
    or new.project_id is distinct from old.project_id
    or new.title is distinct from old.title
    or new.happens_on is distinct from old.happens_on
    or new.created_at is distinct from old.created_at then
    raise exception 'Only the major flag of a milestone can change';
  end if;
  return new;
end;
$$;

create trigger project_milestones_bu_10_guard
before update on public.project_milestones
for each row
execute function private.guard_project_milestone_columns();
