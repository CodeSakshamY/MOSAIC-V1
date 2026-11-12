-- Cap the skills a project is seeking, using the same limit as the tools it uses.

create or replace function private.limit_project_tools()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.relation in ('uses', 'seeking') and (
    select count(*)
    from public.project_skills
    where project_id = new.project_id
      and relation = new.relation
  ) >= 8 then
    raise exception 'A project can list 8 skills for one relation';
  end if;
  return new;
end;
$$;
