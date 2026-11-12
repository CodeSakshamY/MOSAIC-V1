-- A build log can keep a PDF alongside photos and short videos.

update storage.buckets
set
  file_size_limit = 33554432,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf']
where id = 'post-media';

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
      and name ~ '^[^/]+/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|mp4|webm|pdf)$'
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
      and name ~ '^[^/]+/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|jpeg|png|webp|mp4|webm|pdf)$'
    )
  )
);

create or replace function private.on_build_log_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  project_visibility public.visibility;
  project_demo boolean;
begin
  if exists (
    select 1
    from public.posts
    where build_log_id = new.id
  ) then
    return null;
  end if;

  select visibility, is_demo
  into project_visibility, project_demo
  from public.projects
  where id = new.project_id;

  perform set_config('app.system_write', 'true', true);
  insert into public.posts (
    author_id,
    type,
    project_id,
    build_log_id,
    title,
    content,
    media_urls,
    visibility,
    is_demo
  )
  values (
    new.author_id,
    'build_log',
    new.project_id,
    new.id,
    new.title,
    new.content,
    new.media_urls,
    case
      when project_visibility = 'public' then 'public'::public.visibility
      else 'private'::public.visibility
    end,
    project_demo
  );
  perform set_config('app.system_write', 'false', true);
  return null;
end;
$$;
