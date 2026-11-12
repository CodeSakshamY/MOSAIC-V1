-- Mute hides someone's posts from your feed. It does not block them.

create table public.mutes (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  muted_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, muted_id),
  constraint mutes_not_self check (profile_id <> muted_id)
);

alter table public.mutes enable row level security;

grant select, insert, delete on public.mutes to authenticated;

create policy mutes_select on public.mutes
for select to authenticated
using (profile_id = (select auth.uid()));

create policy mutes_insert on public.mutes
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create policy mutes_delete on public.mutes
for delete to authenticated
using (profile_id = (select auth.uid()));
