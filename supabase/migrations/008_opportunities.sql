-- Opportunities stay separate from posts. Publishing maintains one canonical post.

create type public.opportunity_category as enum (
  'hackathon',
  'robotics_competition',
  'science_fair',
  'research_program',
  'olympiad',
  'scholarship',
  'fellowship',
  'internship',
  'grant',
  'maker_event',
  'startup_competition',
  'innovation_challenge',
  'workshop'
);

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null,
  organizer text not null,
  description text not null,
  category public.opportunity_category not null,
  location text,
  state text,
  country char(2),
  is_online boolean not null default false,
  eligibility text,
  min_age smallint,
  max_age smallint,
  team_size_min smallint,
  team_size_max smallint,
  deadline timestamptz,
  start_date timestamptz,
  prize text,
  official_url text not null,
  image_url text,
  is_verified boolean not null default false,
  is_published boolean not null default false,
  is_demo boolean not null default false,
  created_by uuid not null references public.profiles (id) on delete restrict,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opportunities_slug_key unique (slug),
  constraint opportunities_title_length check (char_length(title) between 3 and 160),
  constraint opportunities_slug_format check (private.is_slug(slug)),
  constraint opportunities_organizer_length check (char_length(organizer) between 1 and 120),
  constraint opportunities_description_length check (char_length(description) between 1 and 8000),
  constraint opportunities_location_length check (
    location is null or char_length(location) between 1 and 120
  ),
  constraint opportunities_state_length check (state is null or char_length(state) between 1 and 80),
  constraint opportunities_country_code check (country is null or country ~ '^[A-Z]{2}$'),
  constraint opportunities_eligibility_length check (
    eligibility is null or char_length(eligibility) between 1 and 1000
  ),
  constraint opportunities_age_range check (
    (min_age is null or min_age between 0 and 120)
    and (max_age is null or max_age between 0 and 120)
    and (min_age is null or max_age is null or min_age <= max_age)
  ),
  constraint opportunities_team_size check (
    (team_size_min is null or team_size_min >= 1)
    and (team_size_max is null or team_size_max >= 1)
    and (team_size_min is null or team_size_max is null or team_size_min <= team_size_max)
  ),
  constraint opportunities_prize_length check (prize is null or char_length(prize) between 1 and 200),
  constraint opportunities_official_https check (private.is_https_url(official_url)),
  constraint opportunities_image_https check (image_url is null or private.is_https_url(image_url))
);

alter table public.posts
  add constraint posts_opportunity_id_fkey
  foreign key (opportunity_id) references public.opportunities (id) on delete restrict;

alter table public.posts
  add constraint posts_opportunity_key unique (opportunity_id);

create table public.opportunity_skills (
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  skill_id uuid not null references public.skills (id) on delete cascade,
  primary key (opportunity_id, skill_id)
);

create table public.opportunity_saves (
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (opportunity_id, profile_id)
);

create or replace function private.normalize_opportunity()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.title = btrim(new.title);
  new.slug = lower(btrim(new.slug));
  new.organizer = btrim(new.organizer);
  new.description = btrim(new.description);
  new.official_url = btrim(new.official_url);
  if new.location is not null then
    new.location = nullif(btrim(new.location), '');
  end if;
  if new.state is not null then
    new.state = nullif(btrim(new.state), '');
  end if;
  if new.country is not null then
    new.country = nullif(upper(btrim(new.country)), '');
  end if;
  if new.eligibility is not null then
    new.eligibility = nullif(btrim(new.eligibility), '');
  end if;
  if new.prize is not null then
    new.prize = nullif(btrim(new.prize), '');
  end if;
  if new.image_url is not null then
    new.image_url = nullif(btrim(new.image_url), '');
  end if;
  return new;
end;
$$;

create trigger opportunities_bi_10_normalize
before insert or update on public.opportunities
for each row
execute function private.normalize_opportunity();

create trigger opportunities_bu_updated_at
before update on public.opportunities
for each row
execute function private.set_updated_at();

create or replace function private.publish_opportunity_post()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.system_write', 'true', true);

  if new.is_published and new.removed_at is null then
    if exists (select 1 from public.posts where opportunity_id = new.id) then
      update public.posts
      set removed_at = null,
          title = new.title,
          content = left(new.description, 8000),
          is_demo = new.is_demo
      where opportunity_id = new.id;
    else
      insert into public.posts (
        author_id,
        type,
        opportunity_id,
        title,
        content,
        visibility,
        is_demo
      )
      values (
        new.created_by,
        'opportunity',
        new.id,
        new.title,
        left(new.description, 8000),
        'public',
        new.is_demo
      );
    end if;
  else
    update public.posts
    set removed_at = coalesce(removed_at, now())
    where opportunity_id = new.id
      and removed_at is null;
  end if;

  perform set_config('app.system_write', 'false', true);
  return new;
end;
$$;

create trigger opportunities_aiu_publish
after insert or update on public.opportunities
for each row
execute function private.publish_opportunity_post();
