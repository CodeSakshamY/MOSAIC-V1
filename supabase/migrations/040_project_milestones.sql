-- Named dates on a project. The start and end stay on projects.

create table public.project_milestones (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  happens_on date not null,
  created_at timestamptz not null default now(),
  constraint project_milestones_title_length check (char_length(title) between 1 and 80),
  constraint project_milestones_day check (happens_on between date '2000-01-01' and date '2100-12-31'),
  constraint project_milestones_project_title_day unique (project_id, title, happens_on)
);

create index project_milestones_project_idx
  on public.project_milestones (project_id, happens_on, created_at);

alter table public.project_milestones enable row level security;

grant select on public.project_milestones to anon, authenticated;
grant insert, delete on public.project_milestones to authenticated;

create policy project_milestones_select on public.project_milestones
for select to anon, authenticated
using (private.can_view_project(project_id, (select auth.uid())));

create policy project_milestones_insert on public.project_milestones
for insert to authenticated
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

create policy project_milestones_delete on public.project_milestones
for delete to authenticated
using (
  not private.is_suspended((select auth.uid()))
  and exists (
    select 1
    from public.projects
    where id = project_id
      and owner_id = (select auth.uid())
      and removed_at is null
  )
);

create or replace function private.normalize_project_milestone()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.title = btrim(new.title);
  return new;
end;
$$;

create trigger project_milestones_bi_05_normalize
before insert or update on public.project_milestones
for each row
execute function private.normalize_project_milestone();

create or replace function private.limit_project_milestones()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    select count(*)
    from public.project_milestones
    where project_id = new.project_id
  ) >= 12 then
    raise exception 'A project can have 12 milestones';
  end if;
  return new;
end;
$$;

create trigger project_milestones_bi_10_limit
before insert on public.project_milestones
for each row
execute function private.limit_project_milestones();
