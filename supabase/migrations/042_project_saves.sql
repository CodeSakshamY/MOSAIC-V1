-- A member can save a project for themselves.

create table public.project_saves (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  project_id uuid not null references public.projects (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, project_id)
);

create index project_saves_project_idx on public.project_saves (project_id);

alter table public.project_saves enable row level security;

grant select, insert, delete on public.project_saves to authenticated;

create policy project_saves_select on public.project_saves
for select to authenticated
using (profile_id = (select auth.uid()));

create policy project_saves_insert on public.project_saves
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
  and private.can_view_project(project_id, (select auth.uid()))
);

create policy project_saves_delete on public.project_saves
for delete to authenticated
using (profile_id = (select auth.uid()));
