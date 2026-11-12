-- A flat project discussion, separate from titled threads.

create table public.project_discussion (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint project_discussion_body_length check (char_length(body) between 1 and 1000)
);

create index project_discussion_project_idx on public.project_discussion (project_id, created_at desc);

alter table public.project_discussion enable row level security;

grant select on public.project_discussion to anon, authenticated;
grant insert on public.project_discussion to authenticated;

create policy project_discussion_select on public.project_discussion
for select to anon, authenticated
using (private.can_view_project(project_id, (select auth.uid())));

create policy project_discussion_insert on public.project_discussion
for insert to authenticated
with check (
  author_id = (select auth.uid())
  and private.is_onboarded((select auth.uid()))
  and not private.is_suspended((select auth.uid()))
  and private.can_view_project(project_id, (select auth.uid()))
);
