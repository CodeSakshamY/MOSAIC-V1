-- Optional credits on a project.

alter table public.projects
  add column credits text,
  add constraint projects_credits_length check (
    credits is null or char_length(credits) between 1 and 2000
  );

create or replace function private.guard_project_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if private.is_trusted_writer() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if new.is_demo or new.featured_at is not null or new.removed_at is not null then
      raise exception 'featured_at, removed_at, and is_demo are not client fields';
    end if;
    return new;
  end if;

  if new.id is distinct from old.id
    or new.owner_id is distinct from old.owner_id
    or new.created_at is distinct from old.created_at
    or new.is_demo is distinct from old.is_demo then
    raise exception 'This project field cannot be changed';
  end if;

  if new.featured_at is distinct from old.featured_at
    and not private.is_staff(auth.uid()) then
    raise exception 'featured_at is staff-only';
  end if;

  if new.removed_at is distinct from old.removed_at
    and not private.is_staff(auth.uid()) then
    raise exception 'Only staff can remove a project';
  end if;

  if private.is_staff(auth.uid())
    and not private.is_project_editor(old.id, auth.uid())
    and (
      new.name is distinct from old.name
      or new.slug is distinct from old.slug
      or new.description is distinct from old.description
      or new.tagline is distinct from old.tagline
      or new.subcategory is distinct from old.subcategory
      or new.detailed_description is distinct from old.detailed_description
      or new.credits is distinct from old.credits
      or new.problem is distinct from old.problem
      or new.solution is distinct from old.solution
      or new.cover_image_url is distinct from old.cover_image_url
      or new.category is distinct from old.category
      or new.status is distinct from old.status
      or new.starts_on is distinct from old.starts_on
      or new.ends_on is distinct from old.ends_on
      or new.github_url is distinct from old.github_url
      or new.demo_url is distinct from old.demo_url
      or new.documentation_url is distinct from old.documentation_url
      or new.visibility is distinct from old.visibility
      or new.looking_for_contributors is distinct from old.looking_for_contributors
      or new.collaboration_type is distinct from old.collaboration_type
      or new.parent_project_id is distinct from old.parent_project_id
    ) then
    raise exception 'Staff can only feature or remove a project';
  end if;

  if new.visibility = 'private'
    and old.visibility is distinct from 'private'
    and private.project_has_public_posts(new.id) then
    raise exception 'Make the project posts private before hiding the project';
  end if;

  return new;
end;
$$;
