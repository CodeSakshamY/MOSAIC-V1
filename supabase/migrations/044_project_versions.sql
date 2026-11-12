-- Named versions on a project. Milestones stay a separate list of dates.

create table public.project_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint project_versions_title_length check (char_length(title) between 1 and 80),
  constraint project_versions_note_length check (
    note is null or char_length(note) between 1 and 1000
  )
);

create index project_versions_project_idx
  on public.project_versions (project_id, created_at desc);

alter table public.project_versions enable row level security;

grant select on public.project_versions to anon, authenticated;
grant insert, delete on public.project_versions to authenticated;

create policy project_versions_select on public.project_versions
for select to anon, authenticated
using (private.can_view_project(project_id, (select auth.uid())));

create policy project_versions_insert on public.project_versions
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

create policy project_versions_delete on public.project_versions
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

create or replace function private.normalize_project_version()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.title = btrim(new.title);
  if new.note is not null then
    new.note = nullif(btrim(new.note), '');
  end if;
  return new;
end;
$$;

create trigger project_versions_bi_05_normalize
before insert or update on public.project_versions
for each row
execute function private.normalize_project_version();

create or replace function private.limit_project_versions()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    select count(*)
    from public.project_versions
    where project_id = new.project_id
  ) >= 20 then
    raise exception 'A project can have 20 versions';
  end if;
  return new;
end;
$$;

create trigger project_versions_bi_10_limit
before insert on public.project_versions
for each row
execute function private.limit_project_versions();
