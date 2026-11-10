-- Like, upvote, and downvote, plus a repost that keeps the original author.

alter type public.reaction_type add value if not exists 'like';
alter type public.reaction_type add value if not exists 'upvote';
alter type public.reaction_type add value if not exists 'downvote';

create table public.reposts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint reposts_user_post_key unique (user_id, post_id)
);

create index reposts_post_idx on public.reposts (post_id);

alter table public.reposts enable row level security;

grant select on public.reposts to anon, authenticated;
grant insert, delete on public.reposts to authenticated;

create policy reposts_select on public.reposts
for select to anon, authenticated
using (private.can_read_post(post_id, (select auth.uid())));

create policy reposts_insert on public.reposts
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
  and private.can_read_post(post_id, (select auth.uid()))
);

create policy reposts_delete on public.reposts
for delete to authenticated
using (user_id = (select auth.uid()));
