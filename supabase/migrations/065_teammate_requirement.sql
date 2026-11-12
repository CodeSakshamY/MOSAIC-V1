-- The owner can publish what kind of teammate the project needs.

alter table public.projects
  add column teammate_requirement text;

alter table public.projects
  add constraint projects_teammate_requirement_length check (
    teammate_requirement is null or char_length(teammate_requirement) between 1 and 500
  );
