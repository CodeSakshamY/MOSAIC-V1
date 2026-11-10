-- Build logs, feed posts, comments, reactions, and post saves.

create type public.post_type as enum (
  'project',
  'build_log',
  'idea',
  'help',
  'achievement',
  'opportunity'
);

create type public.reaction_type as enum (
  'interesting',
  'inspired',
  'build',
  'contribute'
);

create table public.build_logs (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete restrict,
  title text not null,
  content text not null,
  media_urls text[] not null default '{}',
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint build_logs_title_length check (char_length(title) between 1 and 120),
  constraint build_logs_content_length check (char_length(content) between 1 and 8000),
  constraint build_logs_media check (private.https_url_list(media_urls))
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete restrict,
  type public.post_type not null,
  project_id uuid references public.projects (id) on delete restrict,
  build_log_id uuid references public.build_logs (id) on delete cascade,
  opportunity_id uuid,
  title text,
  content text not null,
  media_urls text[] not null default '{}',
  visibility public.visibility not null default 'public',
  is_demo boolean not null default false,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint posts_build_log_key unique (build_log_id),
  constraint posts_title_length check (title is null or char_length(title) between 1 and 160),
  constraint posts_content_length check (char_length(content) between 1 and 8000),
  constraint posts_media check (private.https_url_list(media_urls)),
  constraint posts_titled_types check (
    type not in ('idea', 'help', 'achievement') or title is not null
  ),
  constraint posts_shape check (
    (
      type = 'project'
      and project_id is not null
      and build_log_id is null
      and opportunity_id is null
    )
    or (
      type = 'build_log'
      and project_id is not null
      and build_log_id is not null
      and opportunity_id is null
    )
    or (
      type in ('idea', 'help', 'achievement')
      and build_log_id is null
      and opportunity_id is null
    )
    or (
      type = 'opportunity'
      and opportunity_id is not null
      and project_id is null
      and build_log_id is null
    )
  )
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete restrict,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  content text not null,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint comments_content_length check (char_length(content) between 1 and 2000)
);

create table public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  type public.reaction_type not null,
  created_at timestamptz not null default now(),
  constraint reactions_user_post_type_key unique (user_id, post_id, type)
);

create table public.saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid not null references public.posts (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint saves_user_post_key unique (user_id, post_id)
);

create trigger build_logs_bu_updated_at
before update on public.build_logs
for each row
execute function private.set_updated_at();

create trigger posts_bu_updated_at
before update on public.posts
for each row
execute function private.set_updated_at();

create trigger comments_bu_updated_at
before update on public.comments
for each row
execute function private.set_updated_at();

create or replace function private.guard_post_shape()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.visibility = 'private' and new.project_id is null then
    raise exception 'A private post needs a project';
  end if;

  if new.visibility = 'public'
    and new.project_id is not null
    and exists (
      select 1
      from public.projects
      where id = new.project_id
        and visibility = 'private'
    ) then
    raise exception 'A public post cannot point at a private project';
  end if;

  return new;
end;
$$;

create trigger posts_biu_shape
before insert or update on public.posts
for each row
execute function private.guard_post_shape();

create or replace function private.guard_comment_depth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_post uuid;
  parent_parent uuid;
begin
  if new.parent_comment_id is null then
    return new;
  end if;

  select post_id, parent_comment_id
  into parent_post, parent_parent
  from public.comments
  where id = new.parent_comment_id;

  if parent_post is null then
    raise exception 'The parent comment does not exist';
  end if;
  if parent_post <> new.post_id then
    raise exception 'A reply must stay on the same post';
  end if;
  if parent_parent is not null then
    raise exception 'Replies are one level deep';
  end if;

  return new;
end;
$$;

create trigger comments_biu_depth
before insert or update on public.comments
for each row
execute function private.guard_comment_depth();

create or replace function private.create_project_announcement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.posts
    where project_id = new.id
      and type = 'project'
  ) then
    return null;
  end if;

  perform set_config('app.system_write', 'true', true);
  insert into public.posts (
    author_id,
    type,
    project_id,
    title,
    content,
    visibility,
    is_demo
  )
  values (
    new.owner_id,
    'project',
    new.id,
    new.name,
    new.description,
    case
      when new.visibility = 'public' then 'public'::public.visibility
      else 'private'::public.visibility
    end,
    new.is_demo
  );
  perform set_config('app.system_write', 'false', true);
  return null;
end;
$$;

create constraint trigger projects_announce
after insert on public.projects
deferrable initially deferred
for each row
execute function private.create_project_announcement();

create or replace function private.on_build_log_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  project_visibility public.visibility;
  project_demo boolean;
begin
  if exists (
    select 1
    from public.posts
    where build_log_id = new.id
  ) then
    return null;
  end if;

  select visibility, is_demo
  into project_visibility, project_demo
  from public.projects
  where id = new.project_id;

  perform set_config('app.system_write', 'true', true);
  insert into public.posts (
    author_id,
    type,
    project_id,
    build_log_id,
    title,
    content,
    visibility,
    is_demo
  )
  values (
    new.author_id,
    'build_log',
    new.project_id,
    new.id,
    new.title,
    new.content,
    case
      when project_visibility = 'public' then 'public'::public.visibility
      else 'private'::public.visibility
    end,
    project_demo
  );
  perform set_config('app.system_write', 'false', true);
  return null;
end;
$$;

create constraint trigger build_logs_announce
after insert on public.build_logs
deferrable initially deferred
for each row
execute function private.on_build_log_created();
