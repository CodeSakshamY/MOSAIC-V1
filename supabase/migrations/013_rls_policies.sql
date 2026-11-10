-- Helpers first, then grants, then policies. Helpers stay in private so they are not API endpoints.

create or replace function private.allow_demo()
returns boolean
language sql
stable
as $$
  select current_setting('app.allow_demo', true) = 'true';
$$;

create or replace function private.is_staff(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_roles where user_id = uid
  );
$$;

create or replace function private.is_suspended(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.account_sanctions
    where profile_id = uid
      and kind = 'suspension'
      and lifted_at is null
  );
$$;

create or replace function private.is_onboarded(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = uid
      and onboarding_complete
      and deleted_at is null
  );
$$;

create or replace function private.is_project_member(project uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members
    where project_id = project
      and profile_id = uid
      and status = 'active'
  );
$$;

create or replace function private.is_project_editor(project uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.project_members
    where project_id = project
      and profile_id = uid
      and status = 'active'
      and role in ('owner', 'maintainer')
  );
$$;

create or replace function private.can_view_project(project uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects as item
    where item.id = project
      and item.removed_at is null
      and (not item.is_demo or private.allow_demo())
      and (
        item.visibility = 'public'
        or item.owner_id = uid
        or private.is_project_member(item.id, uid)
      )
  );
$$;

create or replace function private.can_read_post(post uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.is_staff(uid)
    or exists (
      select 1
      from public.posts as item
      where item.id = post
        and item.removed_at is null
        and (not item.is_demo or private.allow_demo())
        and (
          item.author_id = uid
          or (
            item.visibility = 'public'
            and (
              item.project_id is null
              or private.can_view_project(item.project_id, uid)
            )
          )
          or (
            item.visibility = 'private'
            and item.project_id is not null
            and private.is_project_member(item.project_id, uid)
          )
        )
    );
$$;

create or replace function private.post_author_id(post uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select author_id from public.posts where id = post;
$$;

create or replace function private.can_attach_post(project uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select project is null
    or exists (
      select 1
      from public.projects as item
      where item.id = project
        and item.removed_at is null
        and (not item.is_demo or private.allow_demo())
        and (
          private.is_project_member(item.id, uid)
          or item.visibility = 'public'
        )
    );
$$;

create or replace function private.can_request_contribution(project uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.projects as item
    where item.id = project
      and item.removed_at is null
      and item.owner_id <> uid
      and (not item.is_demo or private.allow_demo())
      and (item.looking_for_contributors or item.visibility = 'public')
      and not private.is_project_member(item.id, uid)
  );
$$;

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
      and (
        private.is_staff(uid)
        or (
          item.is_published
          and item.removed_at is null
          and (not item.is_demo or private.allow_demo())
        )
      )
  );
$$;

create or replace function private.can_view_community(community uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.communities as item
    where item.id = community
      and item.removed_at is null
      and (not item.is_demo or private.allow_demo())
      and (
        item.visibility = 'public'
        or exists (
          select 1
          from public.community_members as member
          where member.community_id = item.id
            and member.profile_id = uid
        )
      )
  );
$$;

create or replace function private.is_community_owner(community uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_members
    where community_id = community
      and profile_id = uid
      and role = 'owner'
  );
$$;

create or replace function private.is_community_moderator(community uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_members
    where community_id = community
      and profile_id = uid
      and role in ('owner', 'moderator')
  );
$$;

create or replace function private.is_community_member(community uuid, uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_members
    where community_id = community
      and profile_id = uid
  );
$$;

revoke all on all tables in schema public from public, anon, authenticated;
grant all on all tables in schema public to service_role;

grant select on public.profiles to anon, authenticated;
grant update on public.profiles to authenticated;

grant select on public.profile_private to authenticated;
grant update on public.profile_private to authenticated;

grant select on public.skills to anon, authenticated;
grant select on public.interests to anon, authenticated;

grant select on public.profile_skills to anon, authenticated;
grant insert, update, delete on public.profile_skills to authenticated;

grant select on public.profile_interests to anon, authenticated;
grant insert, delete on public.profile_interests to authenticated;

grant select on public.projects to anon, authenticated;
grant insert, update on public.projects to authenticated;

grant select on public.project_skills to anon, authenticated;
grant insert, update, delete on public.project_skills to authenticated;

grant select on public.project_members to anon, authenticated;
grant insert, update, delete on public.project_members to authenticated;

grant select, insert, update on public.contribution_requests to authenticated;

grant select on public.build_logs to anon, authenticated;
grant insert, update on public.build_logs to authenticated;

grant select on public.posts to anon, authenticated;
grant insert, update on public.posts to authenticated;

grant select on public.comments to anon, authenticated;
grant insert, update on public.comments to authenticated;

grant select on public.reactions to anon, authenticated;
grant insert, delete on public.reactions to authenticated;

grant select on public.saves to anon, authenticated;
grant insert, delete on public.saves to authenticated;

grant select on public.follows to anon, authenticated;
grant insert, delete on public.follows to authenticated;

grant select, insert, delete on public.blocks to authenticated;

grant select on public.opportunities to anon, authenticated;
grant insert, update on public.opportunities to authenticated;

grant select on public.opportunity_skills to anon, authenticated;
grant insert, delete on public.opportunity_skills to authenticated;

grant select, insert, delete on public.opportunity_saves to authenticated;

grant select on public.communities to anon, authenticated;
grant insert, update on public.communities to authenticated;

grant select on public.community_members to anon, authenticated;
grant insert, update, delete on public.community_members to authenticated;

grant select on public.community_posts to anon, authenticated;
grant insert, delete on public.community_posts to authenticated;

grant select, update, delete on public.notifications to authenticated;

grant select, insert, update on public.reports to authenticated;

grant select on public.admin_roles to authenticated;

grant select, insert, update on public.account_sanctions to authenticated;

alter table public.profiles enable row level security;
alter table public.profile_private enable row level security;
alter table public.skills enable row level security;
alter table public.interests enable row level security;
alter table public.profile_skills enable row level security;
alter table public.profile_interests enable row level security;
alter table public.projects enable row level security;
alter table public.project_skills enable row level security;
alter table public.project_members enable row level security;
alter table public.contribution_requests enable row level security;
alter table public.build_logs enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.saves enable row level security;
alter table public.follows enable row level security;
alter table public.blocks enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_skills enable row level security;
alter table public.opportunity_saves enable row level security;
alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.community_posts enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.admin_roles enable row level security;
alter table public.account_sanctions enable row level security;

create policy profiles_select on public.profiles
for select to anon, authenticated
using (
  id = (select auth.uid())
  or (
    deleted_at is null
    and (not is_demo or private.allow_demo())
  )
);

create policy profiles_update on public.profiles
for update to authenticated
using (
  id = (select auth.uid())
  and deleted_at is null
  and not private.is_suspended((select auth.uid()))
)
with check (
  id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create policy profile_private_select on public.profile_private
for select to authenticated
using (profile_id = (select auth.uid()));

create policy profile_private_update on public.profile_private
for update to authenticated
using (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
)
with check (profile_id = (select auth.uid()));

create policy skills_select on public.skills
for select to anon, authenticated
using (true);

create policy interests_select on public.interests
for select to anon, authenticated
using (true);

create policy profile_skills_select on public.profile_skills
for select to anon, authenticated
using (true);

create policy profile_skills_insert on public.profile_skills
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create policy profile_skills_update on public.profile_skills
for update to authenticated
using (profile_id = (select auth.uid()) and not private.is_suspended((select auth.uid())))
with check (profile_id = (select auth.uid()));

create policy profile_skills_delete on public.profile_skills
for delete to authenticated
using (profile_id = (select auth.uid()) and not private.is_suspended((select auth.uid())));

create policy profile_interests_select on public.profile_interests
for select to anon, authenticated
using (true);

create policy profile_interests_insert on public.profile_interests
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create policy profile_interests_delete on public.profile_interests
for delete to authenticated
using (profile_id = (select auth.uid()) and not private.is_suspended((select auth.uid())));

create policy projects_select on public.projects
for select to anon, authenticated
using (private.can_view_project(id, (select auth.uid())));

create policy projects_insert on public.projects
for insert to authenticated
with check (
  owner_id = (select auth.uid())
  and private.is_onboarded((select auth.uid()))
  and not private.is_suspended((select auth.uid()))
  and featured_at is null
  and is_demo = false
);

create policy projects_update on public.projects
for update to authenticated
using (
  private.is_staff((select auth.uid()))
  or (
    not private.is_suspended((select auth.uid()))
    and (
      owner_id = (select auth.uid())
      or private.is_project_editor(id, (select auth.uid()))
    )
  )
)
with check (
  private.is_staff((select auth.uid()))
  or (
    not private.is_suspended((select auth.uid()))
    and (
      owner_id = (select auth.uid())
      or private.is_project_editor(id, (select auth.uid()))
    )
  )
);

create policy project_skills_select on public.project_skills
for select to anon, authenticated
using (private.can_view_project(project_id, (select auth.uid())));

create policy project_skills_write on public.project_skills
for all to authenticated
using (
  private.is_project_editor(project_id, (select auth.uid()))
  and not private.is_suspended((select auth.uid()))
)
with check (
  private.is_project_editor(project_id, (select auth.uid()))
  and not private.is_suspended((select auth.uid()))
);

create policy project_members_select on public.project_members
for select to anon, authenticated
using (
  (
    status = 'active'
    and private.can_view_project(project_id, (select auth.uid()))
  )
  or profile_id = (select auth.uid())
  or private.is_project_editor(project_id, (select auth.uid()))
);

create policy project_members_insert on public.project_members
for insert to authenticated
with check (
  private.is_project_editor(project_id, (select auth.uid()))
  and not private.is_suspended((select auth.uid()))
);

create policy project_members_update on public.project_members
for update to authenticated
using (
  private.is_project_editor(project_id, (select auth.uid()))
  and not private.is_suspended((select auth.uid()))
)
with check (
  private.is_project_editor(project_id, (select auth.uid()))
  and not private.is_suspended((select auth.uid()))
);

create policy project_members_delete on public.project_members
for delete to authenticated
using (
  private.is_project_editor(project_id, (select auth.uid()))
  and not private.is_suspended((select auth.uid()))
);

create policy contribution_requests_select on public.contribution_requests
for select to authenticated
using (
  requester_id = (select auth.uid())
  or private.is_project_editor(project_id, (select auth.uid()))
);

create policy contribution_requests_insert on public.contribution_requests
for insert to authenticated
with check (
  requester_id = (select auth.uid())
  and private.is_onboarded((select auth.uid()))
  and not private.is_suspended((select auth.uid()))
  and private.can_request_contribution(project_id, (select auth.uid()))
);

create policy contribution_requests_update on public.contribution_requests
for update to authenticated
using (
  not private.is_suspended((select auth.uid()))
  and (
    requester_id = (select auth.uid())
    or private.is_project_editor(project_id, (select auth.uid()))
  )
)
with check (
  not private.is_suspended((select auth.uid()))
  and (
    requester_id = (select auth.uid())
    or private.is_project_editor(project_id, (select auth.uid()))
  )
);

create policy build_logs_select on public.build_logs
for select to anon, authenticated
using (
  (removed_at is null or private.is_staff((select auth.uid())))
  and private.can_view_project(project_id, (select auth.uid()))
);

create policy build_logs_insert on public.build_logs
for insert to authenticated
with check (
  author_id = (select auth.uid())
  and private.is_onboarded((select auth.uid()))
  and not private.is_suspended((select auth.uid()))
  and private.is_project_member(project_id, (select auth.uid()))
);

create policy build_logs_update on public.build_logs
for update to authenticated
using (
  private.is_staff((select auth.uid()))
  or (
    author_id = (select auth.uid())
    and removed_at is null
    and not private.is_suspended((select auth.uid()))
  )
)
with check (
  private.is_staff((select auth.uid()))
  or (
    author_id = (select auth.uid())
    and not private.is_suspended((select auth.uid()))
  )
);

create policy posts_select on public.posts
for select to anon, authenticated
using (private.can_read_post(id, (select auth.uid())));

create policy posts_insert on public.posts
for insert to authenticated
with check (
  author_id = (select auth.uid())
  and private.is_onboarded((select auth.uid()))
  and not private.is_suspended((select auth.uid()))
  and type in ('idea', 'help', 'achievement')
  and is_demo = false
  and private.can_attach_post(project_id, (select auth.uid()))
);

create policy posts_update on public.posts
for update to authenticated
using (
  private.is_staff((select auth.uid()))
  or (
    author_id = (select auth.uid())
    and removed_at is null
    and not private.is_suspended((select auth.uid()))
  )
)
with check (
  private.is_staff((select auth.uid()))
  or (
    author_id = (select auth.uid())
    and not private.is_suspended((select auth.uid()))
  )
);

create policy comments_select on public.comments
for select to anon, authenticated
using (
  (removed_at is null or private.is_staff((select auth.uid())))
  and (
    private.can_read_post(post_id, (select auth.uid()))
    or private.is_staff((select auth.uid()))
  )
);

create policy comments_insert on public.comments
for insert to authenticated
with check (
  author_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
  and private.can_read_post(post_id, (select auth.uid()))
  and not private.is_blocked(
    (select auth.uid()),
    private.post_author_id(post_id)
  )
);

create policy comments_update on public.comments
for update to authenticated
using (
  private.is_staff((select auth.uid()))
  or (
    author_id = (select auth.uid())
    and removed_at is null
    and not private.is_suspended((select auth.uid()))
  )
)
with check (
  private.is_staff((select auth.uid()))
  or (
    author_id = (select auth.uid())
    and not private.is_suspended((select auth.uid()))
  )
);

create policy reactions_select on public.reactions
for select to anon, authenticated
using (
  user_id = (select auth.uid())
  or private.can_read_post(post_id, (select auth.uid()))
);

create policy reactions_insert on public.reactions
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
  and private.can_read_post(post_id, (select auth.uid()))
);

create policy reactions_delete on public.reactions
for delete to authenticated
using (user_id = (select auth.uid()));

create policy saves_select on public.saves
for select to anon, authenticated
using (
  user_id = (select auth.uid())
  or private.can_read_post(post_id, (select auth.uid()))
);

create policy saves_insert on public.saves
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
  and private.can_read_post(post_id, (select auth.uid()))
);

create policy saves_delete on public.saves
for delete to authenticated
using (user_id = (select auth.uid()));

create policy follows_select on public.follows
for select to anon, authenticated
using (true);

create policy follows_insert on public.follows
for insert to authenticated
with check (
  follower_id = (select auth.uid())
  and follower_id <> following_id
  and not private.is_suspended((select auth.uid()))
  and not private.is_blocked(follower_id, following_id)
  and exists (
    select 1
    from public.profiles
    where id = following_id
      and deleted_at is null
  )
);

create policy follows_delete on public.follows
for delete to authenticated
using (follower_id = (select auth.uid()));

create policy blocks_select on public.blocks
for select to authenticated
using (blocker_id = (select auth.uid()));

create policy blocks_insert on public.blocks
for insert to authenticated
with check (
  blocker_id = (select auth.uid())
  and blocker_id <> blocked_id
  and not private.is_suspended((select auth.uid()))
);

create policy blocks_delete on public.blocks
for delete to authenticated
using (blocker_id = (select auth.uid()));

create policy opportunities_select on public.opportunities
for select to anon, authenticated
using (private.can_view_opportunity(id, (select auth.uid())));

create policy opportunities_insert on public.opportunities
for insert to authenticated
with check (
  private.is_staff((select auth.uid()))
  and not private.is_suspended((select auth.uid()))
  and created_by = (select auth.uid())
  and is_demo = false
);

create policy opportunities_update on public.opportunities
for update to authenticated
using (private.is_staff((select auth.uid())) and not private.is_suspended((select auth.uid())))
with check (private.is_staff((select auth.uid())));

create policy opportunity_skills_select on public.opportunity_skills
for select to anon, authenticated
using (private.can_view_opportunity(opportunity_id, (select auth.uid())));

create policy opportunity_skills_write on public.opportunity_skills
for all to authenticated
using (private.is_staff((select auth.uid())) and not private.is_suspended((select auth.uid())))
with check (private.is_staff((select auth.uid())) and not private.is_suspended((select auth.uid())));

create policy opportunity_saves_select on public.opportunity_saves
for select to authenticated
using (profile_id = (select auth.uid()));

create policy opportunity_saves_insert on public.opportunity_saves
for insert to authenticated
with check (
  profile_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
  and private.can_view_opportunity(opportunity_id, (select auth.uid()))
);

create policy opportunity_saves_delete on public.opportunity_saves
for delete to authenticated
using (profile_id = (select auth.uid()));

create policy communities_select on public.communities
for select to anon, authenticated
using (private.can_view_community(id, (select auth.uid())));

create policy communities_insert on public.communities
for insert to authenticated
with check (
  created_by = (select auth.uid())
  and private.is_onboarded((select auth.uid()))
  and not private.is_suspended((select auth.uid()))
  and is_demo = false
);

create policy communities_update on public.communities
for update to authenticated
using (
  private.is_staff((select auth.uid()))
  or (
    not private.is_suspended((select auth.uid()))
    and private.is_community_moderator(id, (select auth.uid()))
  )
)
with check (
  private.is_staff((select auth.uid()))
  or (
    not private.is_suspended((select auth.uid()))
    and private.is_community_moderator(id, (select auth.uid()))
  )
);

create policy community_members_select on public.community_members
for select to anon, authenticated
using (private.can_view_community(community_id, (select auth.uid())));

create policy community_members_insert on public.community_members
for insert to authenticated
with check (
  not private.is_suspended((select auth.uid()))
  and (
    (
      profile_id = (select auth.uid())
      and role = 'member'
      and private.can_view_community(community_id, (select auth.uid()))
    )
    or (
      role = 'moderator'
      and private.is_community_owner(community_id, (select auth.uid()))
    )
  )
);

create policy community_members_update on public.community_members
for update to authenticated
using (private.is_community_owner(community_id, (select auth.uid())))
with check (private.is_community_owner(community_id, (select auth.uid())));

create policy community_members_delete on public.community_members
for delete to authenticated
using (
  profile_id = (select auth.uid())
  or private.is_community_owner(community_id, (select auth.uid()))
);

create policy community_posts_select on public.community_posts
for select to anon, authenticated
using (
  private.can_view_community(community_id, (select auth.uid()))
  and private.can_read_post(post_id, (select auth.uid()))
);

create policy community_posts_insert on public.community_posts
for insert to authenticated
with check (
  private.is_community_member(community_id, (select auth.uid()))
  and private.post_author_id(post_id) = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
);

create policy community_posts_delete on public.community_posts
for delete to authenticated
using (
  private.post_author_id(post_id) = (select auth.uid())
  or private.is_community_moderator(community_id, (select auth.uid()))
);

create policy notifications_select on public.notifications
for select to authenticated
using (recipient_id = (select auth.uid()));

create policy notifications_update on public.notifications
for update to authenticated
using (recipient_id = (select auth.uid()))
with check (recipient_id = (select auth.uid()));

create policy notifications_delete on public.notifications
for delete to authenticated
using (recipient_id = (select auth.uid()));

create policy reports_select on public.reports
for select to authenticated
using (
  reporter_id = (select auth.uid())
  or private.is_staff((select auth.uid()))
);

create policy reports_insert on public.reports
for insert to authenticated
with check (
  reporter_id = (select auth.uid())
  and not private.is_suspended((select auth.uid()))
  and num_nonnulls(profile_id, project_id, post_id, comment_id) = 1
);

create policy reports_update on public.reports
for update to authenticated
using (private.is_staff((select auth.uid())) and not private.is_suspended((select auth.uid())))
with check (private.is_staff((select auth.uid())));

create policy admin_roles_select on public.admin_roles
for select to authenticated
using (user_id = (select auth.uid()));

create policy account_sanctions_select on public.account_sanctions
for select to authenticated
using (private.is_staff((select auth.uid())));

create policy account_sanctions_insert on public.account_sanctions
for insert to authenticated
with check (
  private.is_staff((select auth.uid()))
  and not private.is_suspended((select auth.uid()))
  and created_by = (select auth.uid())
);

create policy account_sanctions_update on public.account_sanctions
for update to authenticated
using (private.is_staff((select auth.uid())))
with check (private.is_staff((select auth.uid())));

revoke all on all functions in schema private from public;
grant execute on all functions in schema private to anon, authenticated, service_role;
