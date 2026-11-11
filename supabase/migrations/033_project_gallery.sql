-- Extra photos on a public project. The cover stays on projects.cover_image_url.

create table public.project_gallery (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  image_url text not null,
  created_at timestamptz not null default now(),
  constraint project_gallery_url check (private.is_storage_url(image_url)),
  constraint project_gallery_project_url unique (project_id, image_url)
);

create index project_gallery_project_idx
  on public.project_gallery (project_id, created_at);

alter table public.project_gallery enable row level security;

grant select on public.project_gallery to anon, authenticated;
grant insert, delete on public.project_gallery to authenticated;

create policy project_gallery_select on public.project_gallery
for select to anon, authenticated
using (private.can_view_project(project_id, (select auth.uid())));

create policy project_gallery_insert on public.project_gallery
for insert to authenticated
with check (
  not private.is_suspended((select auth.uid()))
  and exists (
    select 1
    from public.projects
    where id = project_id
      and owner_id = (select auth.uid())
      and removed_at is null
      and visibility = 'public'
  )
  and (
    select count(*)
    from public.project_gallery as existing
    where existing.project_id = project_gallery.project_id
  ) < 8
);

create policy project_gallery_delete on public.project_gallery
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
