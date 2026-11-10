-- Reports, staff roles, and sanctions. Clients cannot grant staff.

create type public.report_reason as enum (
  'harassment',
  'spam',
  'inappropriate',
  'impersonation',
  'unsafe',
  'copyright',
  'other'
);

create type public.report_status as enum (
  'open',
  'reviewing',
  'removed',
  'dismissed',
  'restored'
);

create type public.staff_role as enum (
  'admin',
  'moderator'
);

create type public.sanction_kind as enum (
  'suspension'
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete restrict,
  profile_id uuid references public.profiles (id) on delete restrict,
  project_id uuid references public.projects (id) on delete restrict,
  post_id uuid references public.posts (id) on delete restrict,
  comment_id uuid references public.comments (id) on delete restrict,
  reason public.report_reason not null,
  description text,
  status public.report_status not null default 'open',
  reviewed_by uuid references public.profiles (id) on delete restrict,
  reviewed_at timestamptz,
  resolution_note text,
  created_at timestamptz not null default now(),
  constraint reports_description_length check (
    description is null or char_length(description) between 1 and 1000
  ),
  constraint reports_resolution_length check (
    resolution_note is null or char_length(resolution_note) between 1 and 1000
  ),
  constraint reports_one_target check (
    num_nonnulls(profile_id, project_id, post_id, comment_id) = 1
  )
);

create table public.admin_roles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  role public.staff_role not null,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null
);

create table public.account_sanctions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind public.sanction_kind not null,
  reason text not null,
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  lifted_at timestamptz,
  lifted_by uuid references public.profiles (id) on delete restrict,
  constraint account_sanctions_reason_length check (char_length(reason) between 1 and 500)
);
