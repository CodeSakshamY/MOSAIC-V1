-- Replace the project status list with the seven statuses a builder can set.

alter type public.project_status rename to project_status_old;

create type public.project_status as enum (
  'idea',
  'researching',
  'in_development',
  'prototype',
  'testing',
  'completed',
  'on_hold'
);

alter table public.projects alter column status drop default;

alter table public.projects
  alter column status type public.project_status
  using (
    case status::text
      when 'idea' then 'idea'
      when 'planning' then 'researching'
      when 'building' then 'in_development'
      when 'working' then 'in_development'
      when 'prototype' then 'prototype'
      when 'testing' then 'testing'
      when 'shipped' then 'completed'
      when 'abandoned' then 'on_hold'
      else 'idea'
    end
  )::public.project_status;

alter table public.projects alter column status set default 'idea';

drop type public.project_status_old;
