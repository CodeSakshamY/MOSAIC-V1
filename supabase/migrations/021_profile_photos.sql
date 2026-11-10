-- Photos for awards and certificates. Achievement photos use post media.

alter table public.profile_certificates
  add column image_url text;

alter table public.profile_certificates
  add constraint profile_certificates_image check (
    image_url is null or private.is_storage_url(image_url)
  );

create table public.profile_awards (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  issuer text not null,
  year smallint,
  image_url text,
  created_at timestamptz not null default now(),
  constraint profile_awards_title_length check (char_length(title) between 1 and 160),
  constraint profile_awards_issuer_length check (char_length(issuer) between 1 and 120),
  constraint profile_awards_year check (year is null or year between 1950 and 2100),
  constraint profile_awards_image check (image_url is null or private.is_storage_url(image_url))
);

create index profile_awards_profile_idx on public.profile_awards (profile_id, created_at desc);

grant select on public.profile_awards to anon, authenticated;
grant insert, delete on public.profile_awards to authenticated;

alter table public.profile_awards enable row level security;

create policy profile_awards_select on public.profile_awards
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

create policy profile_awards_insert on public.profile_awards
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create policy profile_awards_delete on public.profile_awards
for delete to authenticated
using (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);
