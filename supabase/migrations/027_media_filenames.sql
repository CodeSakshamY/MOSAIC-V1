-- Short videos are stored in post-media. The folder rule has to allow those names.

drop policy storage_insert_own_folder on storage.objects;
drop policy storage_update_own_folder on storage.objects;

create policy storage_insert_own_folder
on storage.objects
for insert
to authenticated
with check (
  (storage.foldername(name))[1] = (select auth.uid())::text
  and (
    (
      bucket_id in ('avatars', 'project-covers', 'community-images')
      and name ~ '^[^/]+/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
    )
    or (
      bucket_id = 'post-media'
      and name ~ '^[^/]+/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|mp4|webm)$'
    )
  )
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
  (storage.foldername(name))[1] = (select auth.uid())::text
  and (
    (
      bucket_id in ('avatars', 'project-covers', 'community-images')
      and name ~ '^[^/]+/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp)$'
    )
    or (
      bucket_id = 'post-media'
      and name ~ '^[^/]+/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|mp4|webm)$'
    )
  )
);
