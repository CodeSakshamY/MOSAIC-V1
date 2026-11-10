-- Photo and short-video posts use the post-media bucket.
-- Local Supabase serves those files over http://127.0.0.1, so storage URLs accept that host as well as https.

create or replace function private.is_storage_url(value text)
returns boolean
language sql
immutable
as $$
  select char_length(value) <= 2000
    and value ~ '/storage/v1/object/public/(avatars|project-covers|post-media|community-images)/[^[:space:]]+$'
    and (
      value ~ '^https://[^[:space:]]+$'
      or value ~ '^http://(127\.0\.0\.1|localhost)(:[0-9]+)?/storage/v1/object/public/'
    );
$$;

update storage.buckets
set
  file_size_limit = 33554432,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
where id = 'post-media';
