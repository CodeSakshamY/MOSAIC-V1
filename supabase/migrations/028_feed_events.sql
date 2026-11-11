-- Dismiss and impression rows for the signed-in home feed.

create type public.feed_event_type as enum ('impression', 'dismiss');

create table public.feed_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  event_type public.feed_event_type not null,
  created_at timestamptz not null default now()
);

create index feed_events_user_post_idx
  on public.feed_events (user_id, post_id, event_type, created_at desc);

alter table public.feed_events enable row level security;

grant select, insert, delete on public.feed_events to authenticated;

create policy feed_events_select on public.feed_events
for select to authenticated
using (user_id = (select auth.uid()));

create policy feed_events_insert on public.feed_events
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create policy feed_events_delete on public.feed_events
for delete to authenticated
using (user_id = (select auth.uid()));
