-- Cap the tools a project uses. The seeking relation stays unused.

create or replace function private.limit_project_tools()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.relation = 'uses' and (
    select count(*)
    from public.project_skills
    where project_id = new.project_id
      and relation = 'uses'
  ) >= 8 then
    raise exception 'A project can list 8 tools';
  end if;
  return new;
end;
$$;

create trigger project_skills_bi_10_limit
before insert on public.project_skills
for each row
execute function private.limit_project_tools();
