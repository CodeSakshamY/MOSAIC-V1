-- The insert policy's row count rejected the first photo. Cap the gallery in a trigger instead.

drop policy project_gallery_insert on public.project_gallery;

create policy project_gallery_insert on public.project_gallery
for insert to authenticated
with check (
  not private.is_suspended((select auth.uid()))
  and exists (
    select 1
    from public.projects
    where id = project_id
      and owner_id = (select auth.uid())
      and removed_at is null
      and visibility = 'public'
  )
);

create or replace function private.limit_project_gallery()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    select count(*)
    from public.project_gallery
    where project_id = new.project_id
  ) >= 8 then
    raise exception 'A project can have 8 gallery photos';
  end if;
  return new;
end;
$$;

create trigger project_gallery_bi_10_limit
before insert on public.project_gallery
for each row
execute function private.limit_project_gallery();
