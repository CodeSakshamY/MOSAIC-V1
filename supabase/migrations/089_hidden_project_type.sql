-- Discover can hide one project type for the signed-in person.

alter table public.profiles
  add column hidden_project_type text;

alter table public.profiles
  add constraint profiles_hidden_project_type check (
    hidden_project_type is null
    or hidden_project_type in (
      'Software',
      'Hardware',
      'CAD',
      'PCB',
      'Firmware',
      'Mechanical',
      'Research',
      'Design'
    )
  );
