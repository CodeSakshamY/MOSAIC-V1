-- Pull requests from a fork to its parent. The original description changes only when the owner merges.

create table public.project_pull_requests (
  id uuid primary key default gen_random_uuid(),
  target_project_id uuid not null references public.projects (id) on delete cascade,
  source_project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete restrict,
  title text not null,
  body text not null,
  proposed_description text not null,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_pull_requests_title_length check (char_length(title) between 1 and 120),
  constraint project_pull_requests_body_length check (char_length(body) between 1 and 2000),
  constraint project_pull_requests_proposal_length check (char_length(proposed_description) between 1 and 200),
  constraint project_pull_requests_status check (status in ('open', 'merged', 'closed')),
  constraint project_pull_requests_distinct check (target_project_id <> source_project_id)
);

create unique index project_pull_requests_one_open_idx
  on public.project_pull_requests (source_project_id)
  where status = 'open';

create index project_pull_requests_target_idx
  on public.project_pull_requests (target_project_id, created_at desc);

create trigger project_pull_requests_bu_updated_at
before update on public.project_pull_requests
for each row
execute function private.set_updated_at();

create or replace function private.guard_project_pull_request()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  source_owner uuid;
  source_parent uuid;
  target_owner uuid;
begin
  select owner_id, parent_project_id
  into source_owner, source_parent
  from public.projects
  where id = new.source_project_id;

  select owner_id
  into target_owner
  from public.projects
  where id = new.target_project_id;

  if tg_op = 'INSERT' then
    if new.author_id is distinct from auth.uid()
      or source_owner is distinct from auth.uid()
      or source_parent is distinct from new.target_project_id
      or new.status <> 'open' then
      raise exception 'A pull request must come from your fork of that project';
    end if;
    return new;
  end if;

  if new.target_project_id is distinct from old.target_project_id
    or new.source_project_id is distinct from old.source_project_id
    or new.author_id is distinct from old.author_id
    or new.title is distinct from old.title
    or new.body is distinct from old.body
    or new.proposed_description is distinct from old.proposed_description
    or new.created_at is distinct from old.created_at
    or new.id is distinct from old.id then
    raise exception 'A pull request can only change status';
  end if;

  if old.status <> 'open' or new.status not in ('merged', 'closed') then
    raise exception 'This pull request is already finished';
  end if;

  if auth.uid() = old.author_id and new.status = 'closed' then
    return new;
  end if;

  if auth.uid() is distinct from target_owner then
    raise exception 'Only the project owner can review this pull request';
  end if;

  if new.status = 'merged' then
    perform set_config('app.system_write', 'true', true);
    update public.projects
      set description = new.proposed_description
      where id = new.target_project_id;
    perform set_config('app.system_write', 'false', true);
  end if;

  return new;
end;
$$;

create trigger project_pull_requests_biu_guard
before insert or update on public.project_pull_requests
for each row
execute function private.guard_project_pull_request();

grant select on public.project_pull_requests to anon, authenticated;
grant insert, update on public.project_pull_requests to authenticated;

alter table public.project_pull_requests enable row level security;

create policy project_pull_requests_select on public.project_pull_requests
for select to anon, authenticated
using (
  private.can_view_project(target_project_id, (select auth.uid()))
  or private.can_view_project(source_project_id, (select auth.uid()))
);

create policy project_pull_requests_insert on public.project_pull_requests
for insert to authenticated
with check (
  author_id = (select auth.uid())
  and private.is_onboarded((select auth.uid()))
  and not private.is_suspended((select auth.uid()))
);

create policy project_pull_requests_update on public.project_pull_requests
for update to authenticated
using (
  not private.is_suspended((select auth.uid()))
  and (
    author_id = (select auth.uid())
    or private.is_project_editor(target_project_id, (select auth.uid()))
  )
)
with check (
  not private.is_suspended((select auth.uid()))
  and (
    author_id = (select auth.uid())
    or private.is_project_editor(target_project_id, (select auth.uid()))
  )
);
