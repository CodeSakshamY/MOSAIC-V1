-- Owners can read their profile row, so saves can return it.
-- Everyone else can read a profile row only when it is public.
-- Private names still come from profile_directory.

grant select on table public.profiles to anon, authenticated;

drop policy profiles_select on public.profiles;
create policy profiles_select on public.profiles
for select to anon, authenticated
using (
  id = (select auth.uid())
  or (
    deleted_at is null
    and visibility = 'public'
    and (not is_demo or private.allow_demo())
  )
);
