-- Education, work, and certificates a person chooses to show on a public profile.
-- Years only. No date of birth.

create table public.profile_education (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  school text not null,
  credential text,
  start_year smallint,
  end_year smallint,
  created_at timestamptz not null default now(),
  constraint profile_education_school_length check (char_length(school) between 1 and 120),
  constraint profile_education_credential_length check (
    credential is null or char_length(credential) between 1 and 120
  ),
  constraint profile_education_years check (
    (start_year is null or start_year between 1950 and 2100)
    and (end_year is null or end_year between 1950 and 2100)
    and (start_year is null or end_year is null or end_year >= start_year)
  )
);

create table public.profile_experience (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  organization text not null,
  summary text,
  start_year smallint,
  end_year smallint,
  created_at timestamptz not null default now(),
  constraint profile_experience_title_length check (char_length(title) between 1 and 120),
  constraint profile_experience_organization_length check (char_length(organization) between 1 and 120),
  constraint profile_experience_summary_length check (
    summary is null or char_length(summary) between 1 and 500
  ),
  constraint profile_experience_years check (
    (start_year is null or start_year between 1950 and 2100)
    and (end_year is null or end_year between 1950 and 2100)
    and (start_year is null or end_year is null or end_year >= start_year)
  )
);

create table public.profile_certificates (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  issuer text not null,
  year smallint,
  credential_url text,
  created_at timestamptz not null default now(),
  constraint profile_certificates_name_length check (char_length(name) between 1 and 160),
  constraint profile_certificates_issuer_length check (char_length(issuer) between 1 and 120),
  constraint profile_certificates_year check (year is null or year between 1950 and 2100),
  constraint profile_certificates_url check (
    credential_url is null or private.is_https_url(credential_url)
  )
);

create index profile_education_profile_idx on public.profile_education (profile_id, created_at desc);
create index profile_experience_profile_idx on public.profile_experience (profile_id, created_at desc);
create index profile_certificates_profile_idx on public.profile_certificates (profile_id, created_at desc);

grant select on public.profile_education to anon, authenticated;
grant insert, delete on public.profile_education to authenticated;
grant select on public.profile_experience to anon, authenticated;
grant insert, delete on public.profile_experience to authenticated;
grant select on public.profile_certificates to anon, authenticated;
grant insert, delete on public.profile_certificates to authenticated;

alter table public.profile_education enable row level security;
alter table public.profile_experience enable row level security;
alter table public.profile_certificates enable row level security;

create policy profile_education_select on public.profile_education
for select to anon, authenticated
using (
  profile_id = (select auth.uid())
  or exists (
    select 1 from public.profiles
    where id = profile_id
      and deleted_at is null
      and (not is_demo or private.allow_demo())
  )
);

create policy profile_education_insert on public.profile_education
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create policy profile_education_delete on public.profile_education
for delete to authenticated
using (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create policy profile_experience_select on public.profile_experience
for select to anon, authenticated
using (
  profile_id = (select auth.uid())
  or exists (
    select 1 from public.profiles
    where id = profile_id
      and deleted_at is null
      and (not is_demo or private.allow_demo())
  )
);

create policy profile_experience_insert on public.profile_experience
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create policy profile_experience_delete on public.profile_experience
for delete to authenticated
using (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create policy profile_certificates_select on public.profile_certificates
for select to anon, authenticated
using (
  profile_id = (select auth.uid())
  or exists (
    select 1 from public.profiles
    where id = profile_id
      and deleted_at is null
      and (not is_demo or private.allow_demo())
  )
);

create policy profile_certificates_insert on public.profile_certificates
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create policy profile_certificates_delete on public.profile_certificates
for delete to authenticated
using (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);
