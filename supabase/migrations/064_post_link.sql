-- An optional https attachment on a feed post. Photos and videos stay in storage.

alter table public.posts
  add column link_url text;

alter table public.posts
  add constraint posts_link_url check (
    link_url is null or (char_length(link_url) <= 300 and private.is_https_url(link_url))
  );
