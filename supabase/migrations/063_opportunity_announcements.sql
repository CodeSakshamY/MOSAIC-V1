-- A signed-in builder can announce an opportunity. They cannot mark it verified.

drop policy opportunities_insert on public.opportunities;

create policy opportunities_insert on public.opportunities
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.is_onboarded((select auth.uid()))
  and not private.is_suspended((select auth.uid()))
  and is_demo = false
  and is_verified = false
  and is_published = true
);
