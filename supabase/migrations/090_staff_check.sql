-- The signed-in person can ask whether they are staff.

create or replace function public.current_user_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.is_staff((select auth.uid()));
$$;

revoke all on function public.current_user_is_staff() from public, anon;
grant execute on function public.current_user_is_staff() to authenticated;
