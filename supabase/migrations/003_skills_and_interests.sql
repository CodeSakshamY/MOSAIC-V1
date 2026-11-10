-- Reference catalogues and the profile joins. Users do not edit the catalogues.

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  category text not null,
  created_at timestamptz not null default now(),
  constraint skills_name_key unique (name),
  constraint skills_slug_key unique (slug),
  constraint skills_name_length check (char_length(name) between 1 and 80),
  constraint skills_slug_format check (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(slug) between 1 and 60
  ),
  constraint skills_category_length check (char_length(category) between 1 and 40)
);

create table public.interests (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  category text not null,
  constraint interests_name_key unique (name),
  constraint interests_slug_key unique (slug),
  constraint interests_name_length check (char_length(name) between 1 and 80),
  constraint interests_slug_format check (
    slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    and char_length(slug) between 1 and 60
  ),
  constraint interests_category_length check (char_length(category) between 1 and 40)
);

create table public.profile_skills (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  proficiency smallint,
  created_at timestamptz not null default now(),
  primary key (profile_id, skill_id),
  constraint profile_skills_proficiency_range check (
    proficiency is null or proficiency between 1 and 5
  )
);

create table public.profile_interests (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  interest_id uuid not null references public.interests (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, interest_id)
);
