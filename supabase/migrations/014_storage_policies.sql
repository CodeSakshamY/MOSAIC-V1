-- Public buckets. The Storage API enforces size and MIME type. Policies enforce the folder.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp']),
  ('project-covers', 'project-covers', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('post-media', 'post-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('community-images', 'community-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy storage_public_read
on storage.objects
for select
to anon, authenticated
using (
  bucket_id in ('avatars', 'project-covers', 'post-media', 'community-images')
);

create policy storage_insert_own_folder
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('avatars', 'project-covers', 'post-media', 'community-images')
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ '^[^/]+/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
);

create policy storage_update_own_folder
on storage.objects
for update
to authenticated
using (
  bucket_id in ('avatars', 'project-covers', 'post-media', 'community-images')
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id in ('avatars', 'project-covers', 'post-media', 'community-images')
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and name ~ '^[^/]+/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
);

create policy storage_delete_own_folder
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('avatars', 'project-covers', 'post-media', 'community-images')
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
