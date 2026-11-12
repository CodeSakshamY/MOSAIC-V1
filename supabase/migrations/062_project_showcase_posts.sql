-- A builder can publish a showcase post for a public project they own.

drop policy posts_insert on public.posts;

create policy posts_insert on public.posts
for insert to authenticated
with check (
  author_id = (select auth.uid())
  and private.is_onboarded((select auth.uid()))
  and not private.is_suspended((select auth.uid()))
  and is_demo = false
  and private.can_attach_post(project_id, (select auth.uid()))
  and (
    (
      type in ('idea', 'help', 'achievement')
      and project_id is null
    )
    or (
      type = 'project'
      and project_id is not null
      and exists (
        select 1
        from public.projects
        where id = project_id
          and owner_id = (select auth.uid())
          and visibility = 'public'
          and removed_at is null
      )
    )
  )
);
