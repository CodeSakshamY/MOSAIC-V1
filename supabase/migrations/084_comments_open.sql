-- The author of a post can close comments on their posts.

alter table public.profiles
  add column comments_open boolean not null default true;

create or replace function private.guard_comment_open()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  author uuid;
  open boolean;
begin
  select author_id into author from public.posts where id = new.post_id;
  if author is null or author = new.author_id then
    return new;
  end if;

  select comments_open into open from public.profiles where id = author;
  if open = false then
    raise exception 'Comments are closed';
  end if;

  return new;
end;
$$;

create trigger comments_bi_open
before insert on public.comments
for each row execute function private.guard_comment_open();
