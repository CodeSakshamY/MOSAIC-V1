-- Secondary indexes. Primary keys and unique constraints already have indexes.

create index profiles_location_idx
  on public.profiles (lower(city), state)
  where deleted_at is null;

create index profiles_display_name_trgm
  on public.profiles using gin (display_name gin_trgm_ops);

create index profiles_username_trgm
  on public.profiles using gin ((username::text) gin_trgm_ops);

create index projects_owner_idx on public.projects (owner_id);

create index projects_parent_idx on public.projects (parent_project_id);

create index projects_public_created_idx
  on public.projects (created_at desc)
  where visibility = 'public' and removed_at is null;

create index projects_name_trgm
  on public.projects using gin (name gin_trgm_ops);

create index project_members_profile_idx on public.project_members (profile_id);

create index project_skills_skill_idx on public.project_skills (skill_id);

create index contribution_requests_project_status_idx
  on public.contribution_requests (project_id, status);

create index contribution_requests_requester_idx
  on public.contribution_requests (requester_id);

create index build_logs_project_created_idx
  on public.build_logs (project_id, created_at desc);

create index posts_feed_idx
  on public.posts (created_at desc, id desc)
  where removed_at is null;

create index posts_author_created_idx
  on public.posts (author_id, created_at desc);

create index posts_project_idx on public.posts (project_id);

create index posts_type_idx on public.posts (type);

create index comments_post_created_idx
  on public.comments (post_id, created_at);

create index follows_following_idx on public.follows (following_id);

create index reactions_post_idx on public.reactions (post_id);

create index saves_post_idx on public.saves (post_id);

create index opportunities_published_deadline_idx
  on public.opportunities (is_published, deadline);

create index notifications_unread_idx
  on public.notifications (recipient_id, created_at desc)
  where read_at is null;

create index reports_status_created_idx
  on public.reports (status, created_at);

create index blocks_blocked_idx on public.blocks (blocked_id);

create index community_members_profile_idx
  on public.community_members (profile_id);
