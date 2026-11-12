-- The announcer can withdraw a listing. Only a trusted writer can mark it checked.

create or replace function private.can_view_opportunity(opportunity uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.opportunities as item
    where item.id = opportunity
      and item.removed_at is null
      and (not item.is_demo or private.allow_demo() or item.created_by = uid)
      and (
        private.is_staff(uid)
        or item.created_by = uid
        or item.is_published
      )
  );
$$;

create or replace function private.guard_opportunity_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if private.is_trusted_writer() or private.is_staff((select auth.uid())) then
    return new;
  end if;

  if new.created_by is distinct from (select auth.uid())
    or new.id is distinct from old.id
    or new.created_by is distinct from old.created_by
    or new.is_verified is distinct from old.is_verified
    or new.is_demo is distinct from old.is_demo
    or new.title is distinct from old.title
    or new.slug is distinct from old.slug
    or new.organizer is distinct from old.organizer
    or new.description is distinct from old.description
    or new.category is distinct from old.category
    or new.official_url is distinct from old.official_url
    or new.deadline is distinct from old.deadline
    or new.removed_at is distinct from old.removed_at
    or old.is_published = false
    or new.is_published = true then
    raise exception 'You can only withdraw your own listing';
  end if;

  return new;
end;
$$;

create trigger opportunities_bu_guard
before update on public.opportunities
for each row execute function private.guard_opportunity_update();

create policy opportunities_owner_withdraw on public.opportunities
for update to authenticated
using (created_by = (select auth.uid()) and is_published = true and removed_at is null)
with check (created_by = (select auth.uid()) and is_published = false and removed_at is null);
