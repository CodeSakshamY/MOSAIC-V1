-- Signing out other sessions marks every older login as finished.
-- The browser that asked keeps a cookie for its own token.

create table public.profile_session_floor (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  valid_after timestamptz not null
);

alter table public.profile_session_floor enable row level security;

grant select, insert, update on public.profile_session_floor to authenticated;

create policy profile_session_floor_select on public.profile_session_floor
for select to authenticated
using (profile_id = (select auth.uid()));

create policy profile_session_floor_insert on public.profile_session_floor
for insert to authenticated
with check (profile_id = (select auth.uid()));

create policy profile_session_floor_update on public.profile_session_floor
for update to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));
