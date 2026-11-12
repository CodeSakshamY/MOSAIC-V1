-- How much time the owner expects from a teammate.

alter table public.projects
  add column time_commitment text;

alter table public.projects
  add constraint projects_time_commitment_length check (
    time_commitment is null or char_length(time_commitment) between 1 and 80
  );
