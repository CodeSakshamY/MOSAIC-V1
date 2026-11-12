-- Staff removal runs with definer rights so the removed row can be written.

create or replace function public.staff_remove_report(report uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item public.reports%rowtype;
begin
  if not private.is_staff((select auth.uid())) then
    raise exception 'Staff only';
  end if;

  select * into item from public.reports where id = report and status = 'open';
  if item.id is null then
    return;
  end if;

  if item.post_id is not null then
    update public.posts set removed_at = now() where id = item.post_id;
  end if;
  if item.project_id is not null then
    update public.projects set removed_at = now() where id = item.project_id;
  end if;
  if item.comment_id is not null then
    update public.comments set removed_at = now() where id = item.comment_id;
  end if;
  if item.opportunity_id is not null then
    update public.opportunities set is_published = false where id = item.opportunity_id;
  end if;

  update public.reports
  set status = 'removed', reviewed_at = now(), reviewed_by = (select auth.uid())
  where id = item.id;
end;
$$;

revoke all on function public.staff_remove_report(uuid) from public, anon;
grant execute on function public.staff_remove_report(uuid) to authenticated;
