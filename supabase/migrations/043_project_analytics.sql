-- Counts an owner can see without exposing who saved the project.

create or replace function public.owner_project_save_count(target uuid)
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select case
    when exists (
      select 1
      from public.projects
      where id = target
        and owner_id = (select auth.uid())
        and removed_at is null
    )
    then (
      select count(*)
      from public.project_saves
      where project_id = target
    )
    else null
  end;
$$;

revoke all on function public.owner_project_save_count(uuid) from public, anon;
grant execute on function public.owner_project_save_count(uuid) to authenticated;
