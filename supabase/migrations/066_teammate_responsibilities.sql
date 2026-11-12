-- What the owner expects a teammate to be responsible for.

alter table public.projects
  add column teammate_responsibilities text;

alter table public.projects
  add constraint projects_teammate_responsibilities_length check (
    teammate_responsibilities is null or char_length(teammate_responsibilities) between 1 and 500
  );
