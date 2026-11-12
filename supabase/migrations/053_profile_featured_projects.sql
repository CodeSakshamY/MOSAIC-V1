-- A builder can feature up to 3 of their public projects on their profile.
-- This is separate from featured_at, which stays staff-only.

alter table public.projects
  add column profile_featured_at timestamptz;

create or replace function private.guard_profile_featured()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.visibility <> 'public' then
    new.profile_featured_at = null;
  end if;

  if new.profile_featured_at is not null
    and old.profile_featured_at is null
    and (
      select count(*)
      from public.projects
      where owner_id = new.owner_id
        and id <> new.id
        and removed_at is null
        and profile_featured_at is not null
    ) >= 3 then
    raise exception 'A profile can feature 3 projects';
  end if;

  return new;
end;
$$;

create trigger projects_bu_20_profile_featured
before update on public.projects
for each row
execute function private.guard_profile_featured();
