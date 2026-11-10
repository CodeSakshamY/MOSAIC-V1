-- The member can read their own suspension state. Sanction rows stay staff-only.

create or replace function public.current_member_status()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then 'signed_out'
    when exists (
      select 1
      from public.account_sanctions
      where profile_id = auth.uid()
        and kind = 'suspension'
        and lifted_at is null
    ) then 'suspended'
    else 'active'
  end;
$$;

revoke all on function public.current_member_status() from public, anon;
grant execute on function public.current_member_status() to authenticated, service_role;
