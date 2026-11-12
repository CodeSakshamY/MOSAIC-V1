# Database schema

Source of truth for the Phase 2 migrations. SQL in `supabase/migrations/` will implement this document. This file is the design, not a migration, and it is not executed.

Postgres 15, as provided by Supabase. UUID primary keys are `gen_random_uuid()`. Timestamps are `timestamptz` and default to `now()`. Text is `text`, not `varchar`, except where a check constraint states the maximum length.

## Extensions

`001_initial_extensions.sql`

- `pgcrypto` for `gen_random_uuid()`.
- `citext` for usernames and emails we store ourselves (we do not copy `auth.users.email` into `profiles`).
- `pg_trgm` for people and project search.

## Enums and closed text sets

Enums are used for sets the product owns. Adding a value is a migration.

| Enum | Values |
| --- | --- |
| `age_group` | `13_15`, `16_17`, `18_24`, `25_34`, `35_plus` |
| `project_status` | `idea`, `researching`, `in_development`, `prototype`, `testing`, `completed`, `on_hold` |
| `member_role` | `owner`, `maintainer`, `contributor` |
| `member_status` | `pending`, `active`, `rejected` |
| `collaboration_type` | `remote`, `local`, `hybrid` |
| `skill_relation` | `uses`, `seeking` |
| `contribution_status` | `pending`, `accepted`, `rejected`, `withdrawn` |
| `post_type` | `project`, `build_log`, `idea`, `help`, `achievement`, `opportunity` |
| `visibility` | `public`, `private` |
| `reaction_type` | `interesting`, `inspired`, `build`, `contribute` |
| `opportunity_category` | `hackathon`, `robotics_competition`, `science_fair`, `research_program`, `olympiad`, `scholarship`, `fellowship`, `internship`, `grant`, `maker_event`, `startup_competition`, `innovation_challenge`, `workshop` |
| `community_category` | `technology`, `discipline`, `city`, `institution`, `research`, `project` |
| `community_role` | `owner`, `moderator`, `member` |
| `notification_type` | `new_follower`, `comment`, `reply`, `contribution_request`, `contribution_accepted`, `contribution_rejected`, `project_update`, `community_activity` |
| `report_reason` | `harassment`, `spam`, `inappropriate`, `impersonation`, `unsafe`, `copyright`, `other` |
| `report_status` | `open`, `reviewing`, `removed`, `dismissed`, `restored` |
| `staff_role` | `admin`, `moderator` |
| `feed_event_type` | `impression`, `dismiss`, `more`, `less` |
| `sanction_kind` | `suspension` |

`relevant_opportunity` is intentionally absent from `notification_type` until a real job creates those rows.

`looking_for` is a `text[]` whose elements must be in this set: `teammates`, `projects`, `competitions`, `feedback`, `contribute`, `learn`, `show_work`, `mentors`. Enforced by a check that uses `<@` against that array.

## Relationship model

```
auth.users
  └─ profiles (1:1)
       ├─ profile_private (1:1)
       ├─ profile_skills ── skills
       ├─ profile_interests ── interests
       ├─ follows (self, directed)
       ├─ blocks (self, directed)
       ├─ projects (owner)
       │    ├─ project_skills ── skills
       │    ├─ project_members ── profiles
       │    ├─ contribution_requests ── profiles
       │    ├─ build_logs
       │    └─ projects.parent_project_id (self)
       ├─ posts
       │    ├─ reactions
       │    ├─ saves
       │    ├─ comments (self, one level)
       │    ├─ feed_events
       │    └─ community_posts ── communities
       ├─ communities (creator)
       │    └─ community_members
       ├─ notifications (recipient, actor)
       ├─ opportunity_saves ── opportunities
       │    └─ opportunity_skills ── skills
       ├─ reports
       └─ admin_roles

opportunities ── posts (one canonical post when published)
build_logs ── posts (one post per log)
projects ── posts (one announcement post, plus later logs and discussion)
account_sanctions ── profiles
```

A person is a profile. A project outlives any single post. A build log is a project event and also a feed post. An idea, a help request, and an achievement are posts, optionally attached to a project. An opportunity is its own entity; the feed post is a pointer so reactions and comments have one parent.

Discover, Home, and project pages read these tables. There is no second content store.

## Tables

### profiles

Public builder identity. Created by a trigger when `auth.users` gains a row.

| Column | Notes |
| --- | --- |
| `id` | PK, FK → `auth.users(id)` `ON DELETE CASCADE`. |
| `username` | `citext`, nullable until onboarding, unique, 3–24, `^[a-z0-9]([a-z0-9_]{1,22}[a-z0-9])?$`. Reserved names rejected. |
| `display_name` | 1–60. Placeholder from the email local-part at signup. |
| `bio` | Nullable, max 280. |
| `avatar_url` | Nullable. |
| `city` | Nullable, max 80. Stored trimmed. |
| `state` | Nullable, max 80. |
| `country` | `char(2)`, default `IN`. |
| `age_group` | Nullable until onboarding. |
| `education` | Nullable, max 120. |
| `github_username` | Nullable, GitHub's 39-character pattern. |
| `website_url` | Nullable, `https` only. |
| `looking_for` | `text[]`, default `'{}'`, closed set above. |
| `collaboration_preference` | Nullable `collaboration_type`. Used by people filters. |
| `visibility` | `public` or `private`, default `public`. |
| `onboarding_complete` | Boolean, default false. |
| `is_demo` | Boolean, default false. |
| `deleted_at` | Nullable. Set by the anonymize function. |
| `created_at`, `updated_at` | |

Email, phone, date of birth, street address, and coordinates are not columns.

Public reads of a profile row are the owner, or a public profile that is not deleted. `profile_directory` is what the app reads. It keeps the name and username when a profile is private, and it returns the other columns only to the owner or when `visibility` is public. Discover lists public profiles. Education, skills, interests, experience, certificates, awards, research, competitions, communities, and extra links are readable only for a public profile or by the owner. Public projects and posts stay readable at their own addresses. `profile_certificates.verified_at` and `profile_awards.verified_at` stay empty unless a trusted writer sets them. A profile can have up to 5 extra sections, with a title of 1–80 characters and a body of 1–2000.

### profile_private

Owner-only row created with the profile. Exists so private operational fields are not sitting on the publicly readable table. Postgres RLS is row-level; splitting tables is the practical way to avoid leaking these columns.

| Column | Notes |
| --- | --- |
| `profile_id` | PK, FK → `profiles(id)` `ON DELETE CASCADE`. |
| `onboarding_step` | Smallint, default 1. Lets the member resume onboarding. |
| `created_at`, `updated_at` | |

### skills, interests

Reference data. Seeded by migration. Not user-editable in V1.

`skills`: `id`, `name` unique, `slug` unique, `category`, `created_at`.

`interests`: `id`, `name` unique, `slug` unique, `category`.

Categories for skills are plain text from a fixed seed (`software`, `hardware`, `science`, `design`, `research`, `other`), checked in the seed rather than over-constrained, so a later category is a data change.

### profile_skills, profile_interests

Composite PK `(profile_id, skill_id)` and `(profile_id, interest_id)`.

`profile_skills.proficiency` is nullable `smallint` from 1 to 5. V1's UI does not ask for it. The column exists so we do not migrate the key later. `created_at` on both.

### projects

| Column | Notes |
| --- | --- |
| `id` | UUID PK. |
| `owner_id` | FK → `profiles(id)` `ON DELETE RESTRICT`. |
| `name` | 3–80. |
| `slug` | Unique case-insensitively. Pattern `^[a-z0-9]+(-[a-z0-9]+)*$`, length 3–60. |
| `description` | 1–200. The card line. |
| `tagline` | Nullable, 1–80. One line under the project name. |
| `detailed_description` | Nullable, max 8000. The project page writes this as the documentation. |
| `credits` | Nullable, max 2000. Credits and acknowledgements. |
| `problem` | Nullable, max 2000. |
| `solution` | Nullable, max 2000. |
| `cover_image_url` | Nullable. Public projects only. |
| `category` | Text, max 60, matching an interest slug where possible. |
| `subcategory` | Nullable. A closed list under `category`, checked by `is_project_subcategory`. |
| `status` | `project_status`, default `idea`. The owner can set Idea, Researching, In development, Prototype, Testing, Completed, or On hold. |
| `starts_on`, `ends_on` | Nullable dates from 2000-01-01 through 2100-12-31. The end is on or after the start when both are set. |
| `github_url`, `demo_url`, `documentation_url` | Nullable, `https` only. |
| `visibility` | Default `public`. |
| `looking_for_contributors` | Boolean, default false. |
| `collaboration_type` | Nullable. |
| `parent_project_id` | Nullable FK → `projects(id)` `ON DELETE SET NULL`. Check `parent_project_id <> id`. |
| `featured_at` | Nullable. Writable only by staff. A trigger rejects other updates. |
| `profile_featured_at` | Nullable. The owner can set this on a public project. A profile can feature 3. A private project cannot keep it. |
| `is_demo` | Boolean, default false. |
| `removed_at` | Nullable. Moderator removal. |
| `created_at`, `updated_at` | |

`ON DELETE RESTRICT` on the owner means a profile row cannot disappear while it still owns projects. Account removal anonymizes the profile and does not delete it. See deletion below.

### project_gallery

`id`, `project_id`, `image_url`, `created_at`. Up to 8 rows. `image_url` must be a storage URL. Inserts are limited to the owner of a public project. Deletes are limited to that owner. `ON DELETE CASCADE` with the project.

### project_milestones

`id`, `project_id`, `title`, `happens_on`, `major`, `created_at`. Up to 12 rows. `title` is 1–80. `happens_on` is a date from 2000-01-01 through 2100-12-31. The same title cannot repeat on the same day. `major` defaults to false. The owner can set it when adding a milestone or change it later. Other columns stay fixed after insert. Inserts and deletes are limited to the owner. `ON DELETE CASCADE` with the project.

### project_skills

PK `(project_id, skill_id, relation)`. A project can both use Python and be seeking Python. Index on `skill_id`. The project page writes `uses` for tools and `seeking` for skills required. A trigger stops each relation at 8 rows.

### project_members

| Column | Notes |
| --- | --- |
| `id` | UUID PK. |
| `project_id`, `profile_id` | Unique together. |
| `role` | `member_role`. |
| `status` | `member_status`. |
| `joined_at` | Nullable until active. |
| `created_at`, `updated_at` | |

A trigger after insert on `projects` inserts the owner as `role = owner`, `status = active`, `joined_at = now()`. Exactly one active owner is enforced by a deferred constraint trigger. The project page lists those joins, and each build log, as the contribution history.

### contribution_requests

| Column | Notes |
| --- | --- |
| `id` | UUID PK. |
| `project_id` | FK. |
| `requester_id` | FK → `profiles`. Check requester is not the owner, enforced in the action and by a trigger. |
| `message` | 1–1000. |
| `proposed_contribution` | 1–1000. |
| `status` | Default `pending`. |
| `created_at`, `updated_at` | |

Partial unique index on `(project_id, requester_id)` where `status = 'pending'`.

Accepting a request, in one transaction, sets status `accepted` and inserts `project_members` (`contributor`, `active`).

### build_logs

| Column | Notes |
| --- | --- |
| `id` | UUID PK. |
| `project_id` | FK `ON DELETE CASCADE`. A log has no meaning without its project. |
| `author_id` | FK → `profiles` `ON DELETE RESTRICT`. |
| `title` | 1–120. |
| `content` | 1–8000. |
| `media_urls` | `text[]`, default `'{}'`, max 4 elements, each an `https` URL on our storage host. |
| `removed_at` | Nullable. |
| `kind` | `update`, `milestone`, `problem`, `experiment`, `lesson`, or `explanation`. |
| `created_at`, `updated_at` | |

### build_log_follows

A member follows one build log. A later comment on that update notifies them, unless they wrote the comment or already receive it as the post author.

| Column | Notes |
| --- | --- |
| `profile_id` | FK → `profiles` `ON DELETE CASCADE`. Part of the primary key. |
| `build_log_id` | FK → `build_logs` `ON DELETE CASCADE`. Part of the primary key. |
| `created_at` | |

Select is the follower, or anyone who can view the project. Insert and delete stay with the follower, and insert also requires the log to be visible.

### posts

| Column | Notes |
| --- | --- |
| `id` | UUID PK. |
| `author_id` | FK → `profiles` `ON DELETE RESTRICT`. |
| `type` | `post_type`. |
| `project_id` | Nullable FK. |
| `build_log_id` | Nullable FK, unique. One post per log. |
| `opportunity_id` | Nullable FK, unique. One post per opportunity. |
| `title` | Nullable for some types, max 160. Required for idea, help, achievement. |
| `content` | Max 8000. |
| `media_urls` | Same rule as build logs. |
| `visibility` | Default `public`. |
| `is_demo` | Boolean, default false. |
| `removed_at` | Nullable. |
| `created_at`, `updated_at` | |

Check, exactly:

- `project`: `project_id` set, `build_log_id` null, `opportunity_id` null.
- `build_log`: `project_id` and `build_log_id` set, `opportunity_id` null.
- `idea`, `help`, `achievement`: `build_log_id` null, `opportunity_id` null, `project_id` optional.
- `opportunity`: `opportunity_id` set, `project_id` null, `build_log_id` null.

A public post whose project is private is rejected by a trigger. Private posts are readable by the author and by active members of the linked project.

### follows

PK `(follower_id, following_id)`. Both FK → `profiles` `ON DELETE CASCADE`. Check `follower_id <> following_id`. `created_at`.

Cascade is safe: a follow is an edge, not content. The anonymize function deletes edges explicitly before it would matter, and cascade covers a hard purge.

### reactions

`id`, `user_id`, `post_id`, `type`, `created_at`. Unique `(user_id, post_id, type)`. Both FKs `ON DELETE CASCADE`.

### saves

`id`, `user_id`, `post_id`, `created_at`. Unique `(user_id, post_id)`. `ON DELETE CASCADE`. Used for posts that are not opportunities. Opportunities use `opportunity_saves`.

### comments

| Column | Notes |
| --- | --- |
| `id` | UUID PK. |
| `post_id` | FK `ON DELETE CASCADE`. |
| `author_id` | FK `ON DELETE RESTRICT`. |
| `parent_comment_id` | Nullable self-FK `ON DELETE CASCADE`. |
| `content` | 1–2000. |
| `removed_at` | Nullable. |
| `created_at`, `updated_at` | |

Trigger: the parent belongs to the same post, and the parent has no parent of its own. One level of reply.

### opportunities

| Column | Notes |
| --- | --- |
| `id` | UUID PK. |
| `title` | 3–160. |
| `slug` | Unique, same pattern as projects. |
| `organizer` | 1–120. |
| `description` | 1–8000. |
| `category` | `opportunity_category`. |
| `location` | Nullable, max 120. City or region text. Null when online-only. |
| `state` | Nullable, max 80. |
| `country` | Nullable `char(2)`. |
| `is_online` | Boolean, default false. |
| `eligibility` | Nullable, max 1000. Empty means the UI says the official page has the criteria. |
| `min_age`, `max_age` | Nullable smallint, 0–120, check `min_age <= max_age` when both exist. These describe the opportunity, not a member. They may include ages under 13. Account signup still requires the 13–15 band or older. |
| `team_size_min`, `team_size_max` | Nullable, check order. |
| `deadline`, `start_date` | Nullable `timestamptz`. Null is a valid "not stated". |
| `prize` | Nullable, max 200. |
| `official_url` | Required `https` URL. |
| `image_url` | Nullable. |
| `is_verified` | Boolean, default false. |
| `is_published` | Boolean, default false. |
| `is_demo` | Boolean, default false. |
| `created_by` | FK → `profiles` `ON DELETE RESTRICT`. |
| `removed_at` | Nullable. |
| `created_at`, `updated_at` | |

Publishing inserts the canonical post if one does not exist. Unpublishing does not delete the post; it sets the post `removed_at` so old reactions have a stable parent, and the feed query ignores removed posts.

### opportunity_skills

PK `(opportunity_id, skill_id)`.

### opportunity_saves

PK `(opportunity_id, profile_id)`. `created_at`. `ON DELETE CASCADE`.

### communities

| Column | Notes |
| --- | --- |
| `id` | UUID PK. |
| `name` | 3–80. |
| `slug` | Unique. |
| `description` | 1–2000. |
| `category` | `community_category`. |
| `avatar_url` | Nullable. |
| `created_by` | FK → `profiles` `ON DELETE RESTRICT`. |
| `visibility` | Default `public`. |
| `is_demo` | Boolean, default false. |
| `removed_at` | Nullable. |
| `created_at`, `updated_at` | |

Insert also inserts `community_members` for the creator as `owner`.

### community_members

PK `(community_id, profile_id)`. `role`, `joined_at`. `ON DELETE CASCADE`.

### community_posts

PK `(community_id, post_id)`. `created_at`. Both FKs `ON DELETE CASCADE`.

### notifications

| Column | Notes |
| --- | --- |
| `id` | UUID PK. |
| `recipient_id` | FK `ON DELETE CASCADE`. |
| `actor_id` | Nullable FK `ON DELETE SET NULL`. |
| `type` | `notification_type`. |
| `project_id`, `post_id`, `comment_id`, `community_id` | Nullable FKs. |
| `message` | 1–200. A rendered sentence stored at insert time so the list does not rejoin the world. |
| `read_at` | Nullable. Unread means `read_at is null`. |
| `created_at` | |

Check that the foreign key relevant to the type is present (`new_follower` has an actor, `comment` has a comment, and so on).

No row is inserted when a block exists between actor and recipient.

### reports

| Column | Notes |
| --- | --- |
| `id` | UUID PK. |
| `reporter_id` | FK → `profiles` `ON DELETE RESTRICT`. |
| `profile_id`, `project_id`, `post_id`, `comment_id` | All nullable FKs. Exactly one is non-null. |
| `reason` | `report_reason`. |
| `description` | Nullable, max 1000. |
| `status` | Default `open`. |
| `reviewed_by` | Nullable FK → `profiles`. |
| `reviewed_at` | Nullable. |
| `resolution_note` | Nullable, max 1000. Staff only. |
| `created_at` | |

The "target type" is derived from which FK is set. There is no untyped `target_id`.

### blocks

PK `(blocker_id, blocked_id)`. Check the two ids differ. `created_at`. `ON DELETE CASCADE`.

### admin_roles

PK `user_id` FK → `profiles(id)` `ON DELETE CASCADE`. `role` is `staff_role`. `created_at`. `created_by` nullable FK, null for the bootstrap row.

No client insert policy. See RLS.

### account_sanctions

| Column | Notes |
| --- | --- |
| `id` | UUID PK. |
| `profile_id` | FK. |
| `kind` | `sanction_kind`. |
| `reason` | Max 500. Not publicly readable. |
| `created_by` | FK → `profiles`. |
| `created_at` | |
| `lifted_at` | Nullable. |
| `lifted_by` | Nullable FK. |

A profile is suspended when a `suspension` row with `lifted_at is null` exists. `is_suspended(uid)` is a `security definer` function used by write policies.

### feed_events

`id`, `user_id`, `post_id`, `event_type`, `created_at`. Index `(user_id, post_id, event_type, created_at desc)`. Not unique: impressions can repeat across days. Dismiss is treated as "any dismiss row exists". `more` and `less` are the For you controls, and the newest one for an author or project wins. `ON DELETE CASCADE`.

## Deletion strategy

Content that other people rely on is not cascade-deleted with a person.

| Event | Behaviour |
| --- | --- |
| Member deletes their account | Server action, confirmed, calls `anonymize_profile(uid)` as the secret client after checking the caller is that member. The function removes avatar object, sets `display_name` to `Deleted builder`, clears bio, city, state, education, github, website, looking_for, skills, and interests, sets username to `deleted_` plus the first 8 hex chars of the id, sets `deleted_at`, deletes follows, blocks, reactions, saves, opportunity saves, feed events, and notifications. Projects, posts, comments, and build logs remain, still attributed to that profile id. The auth user is then banned so the session cannot continue. The profile row stays to satisfy `ON DELETE RESTRICT`. |
| Moderator removes a post, comment, log, project, or opportunity | Set `removed_at`. Feed, discover, and public pages filter `removed_at is null`. Reports keep their FK. |
| Moderator suspends | Insert `account_sanctions`. Writes fail RLS. The public profile remains visible unless a separate removal is chosen. A suspended member's existing public work stays up. |
| Hard purge | Not a product button. A later compliance function may delete the auth user only after projects are reassigned or also purged. `profiles.id` cascading from `auth.users` is the mechanical path for that future function. It is unreachable while `projects.owner_id` is `RESTRICT` and the person still owns projects, which is the point. |
| Follow, block, reaction, save, membership edge | `ON DELETE CASCADE`. These are edges. |
| Build logs | Cascade with the project, because they are part of the project. |
| Comments | Cascade with the post. |

`anonymize_profile` is `security definer`, owned by the migration role, and granted only to `service_role`. It is not granted to `authenticated`.

## Row level security

Enabled on every table in the `public` schema that this document defines. `anon` and `authenticated` receive no privileges on `admin_roles` except a select policy for the caller's own row, no privileges on `account_sanctions`, and no select on `reports` except the reporter's own rows. Staff read reports and sanctions through `security definer` functions, or through policies that call `is_staff(auth.uid())`.

`is_staff`, `is_suspended`, and `is_project_member` are `security definer`, `stable`, and `search_path` is set to `public`. Policy helpers and trigger functions live in the `private` schema so PostgREST does not expose them. `anonymize_profile(uuid)` stays in `public` and is granted only to `service_role`.

| Table | Select | Insert | Update | Delete |
| --- | --- | --- | --- | --- |
| `profiles` | `deleted_at` is null, and `is_demo` is false unless the database setting `app.allow_demo` is true. Owner can read their own row in any case. | Trigger only, as `security definer`. No client insert. | Owner, not suspended. A trigger rejects client changes to `is_demo` and `deleted_at`. | None for clients. |
| `profile_private` | Owner. | Trigger. | Owner, for `onboarding_step` only. | None. |
| `skills`, `interests` | Anyone. | None. | None. | None. |
| `profile_skills`, `profile_interests` | Anyone. | Owner, not suspended. | Owner. | Owner. |
| `projects` | Public and not removed: anyone. Private: owner and active members. Demo hidden unless the database setting `app.allow_demo` is true. | Onboarded, not suspended, `owner_id = auth.uid()`. | Owner or active maintainer, not suspended. Trigger guards `featured_at` and `is_demo`. | None in V1. Removal sets `removed_at` and is staff-only. |
| `project_skills` | Same as the parent project. | Editor of the project. | Editor. | Editor. |
| `project_members` | Same as the parent project. Pending rows visible to the person invited and the editors. | Editors, or the accept-request transaction. | Editors. | Editors, but not the last owner. |
| `contribution_requests` | Requester, and owner or maintainer of the project. | Requester, onboarded, not suspended, not a member, project is looking or is public. | Requester may set `withdrawn` from `pending`. Editors may set `accepted` or `rejected` from `pending`. | None. |
| `build_logs` | Same visibility as the project, and `removed_at` null. | Active member of the project, author is self. | Author. | None. Staff sets `removed_at`. |
| `posts` | Public and not removed: anyone. Private: author and project members. | Author is self, not suspended, onboarded, type allowed. | Author, while not removed. | None. Staff sets `removed_at`. |
| `follows` | Anyone. | Self as follower, target exists, not self, not blocked either way, not suspended. | None. | Self as follower. |
| `reactions`, `saves` | Anyone for counts. The viewer also needs their own row, which this select covers. | Self, not suspended, post readable. | None. | Self. |
| `comments` | Parent post readable, comment not removed. | Author self, post readable, not blocked either way with the post author, not suspended. | Author. | None. Staff sets `removed_at`. |
| `opportunities` | `is_published`, not removed, demo rule. Staff can read drafts. | Staff. | Staff. | None. |
| `opportunity_skills` | Same as the opportunity. | Staff. | Staff. | Staff. |
| `opportunity_saves` | Owner of the save. | Self. | None. | Self. |
| `communities` | Public, or a member if private. Not removed. | Onboarded, not suspended, creator is self. | Owner or moderator. | None. |
| `community_members` | Visible when the community is visible. | Self for `member` on a public community. Owner adds moderators. | Owner. | Self for leaving. Owner cannot leave without transferring ownership, enforced by a trigger. |
| `community_posts` | Community visible and post readable. | Author of the post, and a member of the community. | None. | Author or community moderator. |
| `notifications` | Recipient. | Trigger and `security definer` only. | Recipient may set `read_at`. | Recipient may delete their own. |
| `reports` | Reporter's own rows. Staff all rows. | Reporter is self, exactly one target, not suspended. | Staff, for status and resolution. | None. |
| `blocks` | The blocker, for their own list. | Self as blocker, not self, not suspended. | None. | Self as blocker. |
| `admin_roles` | Own row only, so the shell can show Admin. | None for `authenticated` and `anon`. | None. | None. |
| `account_sanctions` | Staff. | Staff. | Staff, to set `lifted_at`. | None. |
| `feed_events` | Owner. | Owner, for their own user id. | None. | Owner. |

Write policies also require `not is_suspended(auth.uid())` and, for publishing, `onboarding_complete`. Staff moderation actions are the exception: a moderator who is not suspended can still write reports and sanctions while their own social writes follow the same rules as everyone else.

`anon` can select public profiles, public projects, public posts, public comments, published opportunities, public communities, skills, and interests. `anon` cannot insert anything.

## Triggers and functions

`015_functions_and_triggers.sql`

| Function | Purpose |
| --- | --- |
| `set_updated_at()` | Before update, sets `updated_at`. Applied to every table that has the column. |
| `handle_new_user()` | After insert on `auth.users`, inserts `profiles` and `profile_private`. Username left null. Display name derived from the email local-part, stripped to 60 characters. |
| `add_project_owner()` | After insert on `projects`. |
| `add_community_owner()` | After insert on `communities`. |
| `guard_project_admin_columns()` | Rejects changes to `featured_at` and `is_demo` unless `is_staff`. |
| `guard_post_shape()` | Private post cannot point at a missing project; public post cannot point at a private project. |
| `guard_comment_depth()` | One level, same post. |
| `guard_single_owner()` | A project keeps one active owner. |
| `notify_on_follow()` | Inserts `new_follower` unless blocked. |
| `notify_on_comment()` | Inserts `comment` or `reply` for the post author or parent author, not for self, not if blocked. |
| `notify_on_contribution()` | Request, accepted, rejected. |
| `notify_on_build_log()` | `project_update` for followers of the project, excluding the author. |
| `publish_opportunity_post()` | Maintains the canonical post. |
| `create_project_announcement()` | Inserts the `project` post if the action did not already insert one. The action prefers to insert both so the title is explicit; the trigger is the backstop. |
| `anonymize_profile(uuid)` | Account removal. `service_role` only. |
| `is_staff(uuid)`, `is_suspended(uuid)`, `is_project_member(uuid, uuid)` | Policy helpers. |

Notification inserts run as `security definer` so a member can cause a notification for someone else without having insert rights on that someone's rows.

## Indexes

Besides primary keys and unique constraints:

| Index | Why |
| --- | --- |
| `profiles (lower(city), state)` where `deleted_at is null` | Nearby and people filters. |
| `profiles` GIN trgm on `display_name`, trgm on `username` | People search. |
| `projects (owner_id)`, `(parent_project_id)`, `(created_at desc)` where public and not removed | Lists, forks, discover. |
| `projects` GIN trgm on `name` | Search. |
| `project_members (profile_id)` | "Projects by this person". |
| `project_skills (skill_id)` | Skill filter. |
| `contribution_requests (project_id, status)`, `(requester_id)` | Review queue. |
| `build_logs (project_id, created_at desc)` | Timeline. |
| `posts (created_at desc, id desc)` where not removed | Feed windows. |
| `posts (author_id, created_at desc)`, `(project_id)`, `(type)` | Profile activity, project discussion. |
| `comments (post_id, created_at)` | Threads. |
| `follows (following_id)` | "Who follows", and the following-tab join. The PK already serves `follower_id`. |
| `reactions (post_id)`, `saves (post_id)` | Counts. |
| `opportunities (is_published, deadline)` | Closing soon. |
| `notifications (recipient_id, created_at desc)` where `read_at is null` | Unread list. |
| `reports (status, created_at)` | Queue. |
| `blocks (blocked_id)` | Reverse lookup. |
| `feed_events (user_id, created_at desc)` | Impression penalty. |
| `community_members (profile_id)` | "Communities I joined". |

Feed candidate generation uses the posts time index and joins; it does not seq-scan. The Phase 6 migration adds `feed_candidates` and an `explain` check is part of that phase's test note.

### profile_publications

A builder can list up to 20 papers or notes. `title` is 1–160. `venue` is optional, 1–120. `year` is optional, 1950–2100. `url` is an optional https link up to 300 characters. `summary` is optional, 1–500. Select follows the same visibility as the profile. Insert and delete stay with that member. `ON DELETE CASCADE` with the profile.

### profile_competitions

A builder can list up to 20 competitions. `name` is 1–160. `host` and `result` are optional, 1–120 and 1–80. `year` is optional, 1950–2100. `url` is an optional https link up to 300 characters. The result is text the builder writes. Select, insert, and delete follow the publication rules.

### profile_communities

A builder can list up to 20 groups they have taken part in. `name` is 1–80. `role` is optional, 1–40. `year` is optional, 1950–2100. This list is not a MOSAIC group. Select, insert, and delete follow the publication rules.

### profile_links

Up to 8 extra https links. `label` is 1–40. `url` is at most 300 characters. The same URL cannot be saved twice on one profile. GitHub and the website stay on `profiles`. Select, insert, and delete follow the publication rules.

## Storage

`014_storage_policies.sql` creates the buckets.

| Bucket | Public | Max | Types | Path |
| --- | --- | --- | --- | --- |
| `avatars` | Yes | 2 MB | jpeg, png, webp | `{userId}/{uuid}.{ext}` |
| `project-covers` | Yes | 5 MB | jpeg, png, webp | `{userId}/{uuid}.{ext}` |
| `post-media` | Yes | 5 MB | jpeg, png, webp | `{userId}/{uuid}.{ext}` |
| `community-images` | Yes | 2 MB | jpeg, png, webp | `{userId}/{uuid}.{ext}` |

Public means anyone who knows the URL can fetch the object. That is acceptable for avatars, public covers, public post images, and community images. It is not acceptable for private projects, which is why the upload action refuses covers and post media for private posts.

Storage policies: an authenticated user may insert and update only inside a folder equal to their uid, within the size and MIME limits. Users may delete their own objects. They may not write into another user's folder. `anon` can read and cannot write.

The upload route still sniffs bytes and chooses the extension. Storage MIME checks are a second line, not the only line.

## Seed

`016_seed_reference.sql` inserts skills and interests only. It is safe for production. It uses fixed UUIDs so later seeds and tests can refer to them, and `ON CONFLICT DO NOTHING` so re-running is harmless.

Illustrative groups, not a promise of the final taxonomy: programming languages, machine learning, robotics, electronics, CAD, biology, mathematics, cybersecurity, aerospace, design, and research methods. Roughly 40 skills and 20 interests. Names are real disciplines, not jokes.

`supabase/seed.sql` is local-only and contains:

- one demo profile, `is_demo = true`, username `demo_builder`, display name "Demo Builder". Usernames cannot contain hyphens, so the local username uses an underscore.
- two demo projects, one of them a fork of the other
- one demo build log and its post
- two demo communities
- two demo opportunities with `is_demo = true`, official URLs pointing at `https://example.com`, deadlines only if we also label the row as demo

No demo row is presented as a real person, a real prize, or a real deadline. The application shows a Demo badge when `ALLOW_DEMO_CONTENT` is on, and the production default is off.

Creating the demo auth user cannot be done with a plain insert in every environment. The local seed file will document a `supabase` auth admin insert that runs only under `supabase db reset`. It is not part of `db push`.

## Migration order

| File | Contents |
| --- | --- |
| `001_initial_extensions.sql` | Extensions. |
| `002_profiles.sql` | Enums used by profiles, `profiles`, `profile_private`, `handle_new_user`. |
| `003_skills_and_interests.sql` | Skills, interests, join tables. |
| `004_projects.sql` | Projects, skills, members, owner trigger, slug checks. |
| `005_project_collaboration.sql` | Contribution requests. |
| `006_posts_and_build_logs.sql` | Build logs, posts, comments, reactions, saves. |
| `007_social_graph.sql` | Follows, blocks. |
| `008_opportunities.sql` | Opportunities, skills, saves. |
| `009_communities.sql` | Communities, members, community posts. |
| `010_notifications.sql` | Notifications and the notify triggers. |
| `011_moderation.sql` | Reports, sanctions, admin roles, `removed_at` columns if not already added. |
| `012_indexes.sql` | Secondary indexes, including trgm. |
| `013_rls_policies.sql` | Enable RLS, policies, grants. |
| `014_storage_policies.sql` | Buckets and storage policies. |
| `015_functions_and_triggers.sql` | Remaining functions: anonymize, staff helpers, admin-column guard. Helpers that policies need are created in 013 before the policies, or 013 is ordered after the helper section of 015. The implementer will put helper functions immediately before the policies that call them, and keep the filenames stable. |
| `016_seed_reference.sql` | Skills and interests. |
| `028_feed_events.sql` | `feed_events` for impressions and dismiss. `feed_candidates` was not created. |
| `029_project_follows.sql` | Watch a project. Build-log notifications include those followers. |
| `030_hidden_posts.sql` | Posts a member hides from their own feeds. |
| `031_feed_preferences.sql` | `more` and `less` values on `feed_event_type`. |
| `032_project_tagline.sql` | Optional one-line tagline on a project. |
| `033_project_gallery.sql` | Extra photos on a public project. |
| `034_project_gallery_cap.sql` | Stop a project at 8 gallery photos. |
| `035_project_subcategories.sql` | Closed subcategory under the project category. |
| `036_project_tools.sql` | Stop a project at 8 tools it uses. |
| `037_project_skills_required.sql` | Stop a project at 8 skills it is seeking. |
| `038_project_status.sql` | Seven project statuses a builder can set. |
| `039_project_timeline.sql` | Optional start and end dates on a project. |
| `040_project_milestones.sql` | Up to 12 named dates on a project. |
| `041_project_credits.sql` | Optional credits on a project. |
| `042_project_saves.sql` | A member's private saved projects. Select, insert, and delete stay with that member. |
| `043_project_analytics.sql` | The owner can count saves. The function returns null for anyone else. |
| `044_project_versions.sql` | Up to 20 named versions on a project. |
| `045_build_log_files.sql` | A build log can include photos, short videos, and PDFs. |
| `046_build_log_milestone.sql` | A build log can be recorded as a milestone. |
| `047_build_log_problem.sql` | A build log can record a problem. |
| `048_build_log_experiment.sql` | A build log can record an experiment. |
| `049_build_log_lesson.sql` | A build log can record a failed attempt. |
| `050_build_log_explanation.sql` | A build log can be a technical explanation. |
| `051_build_log_follows.sql` | Follow one build log. Comments on it notify the follower. |
| `052_major_milestones.sql` | The owner can mark a dated milestone as major. |
| `053_profile_featured_projects.sql` | The owner can feature up to 3 public projects on their profile. |
| `054_profile_publications.sql` | A builder can list research and publications on their profile. |
| `055_profile_competitions.sql` | A builder can list competitions they took part in. |
| `056_profile_communities.sql` | A builder can list communities they have taken part in. |
| `057_profile_links.sql` | Extra https links on a profile, including LinkedIn. |
| `058_profile_visibility.sql` | Public or private profiles. The API reads `profile_directory`. |
| `059_profile_select.sql` | A profile row is readable by its owner, or by anyone when the profile is public. |
| `060_verified_credentials.sql` | `verified_at` on certificates and awards, writable by a trusted writer. |
| `061_profile_sections.sql` | Up to 5 titled sections on a profile. |
| `062_project_showcase_posts.sql` | A builder can post a showcase of a public project they own. |

Later phases append `018_` and upward. They do not edit an applied migration.

## Generated types

After migrations apply:

```
npx supabase gen types typescript --local > types/database.ts
```

Hand-written types in `types/profile.ts` and the other domain files are `Pick` and union helpers over `Database['public']['Tables']`. They are not a second declaration of the columns.
