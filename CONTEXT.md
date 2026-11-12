# Context for the next coding session

This file is the handoff. Read it before editing MOSAIC. The product name is MOSAIC. The repo folder is `/Users/sakshanm/Documents/mosiac`. The Cursor workspace path may still be the old folder `cursor saksham`. Run shell commands with a working directory of `/Users/sakshanm/Documents/mosiac`, or they hit the wrong tree.

## Git

- Feature branch: `cursor/auth-onboarding-public-browse`
- `origin/main` was pushed at `099e261` (merge of the branch through the password-change notice).
- Commits after that merge are local only. They are not on `origin/main`. Newest first at the time of this handoff:
  - `8a1af85` Staff moderation queue: remove a report, suspend, restore
  - `ce33a94` Search by project discipline
  - `113a43c` Hide one project type on Discover
  - `e92b8fe` Search also covers opportunities, events, skills, tags, and typed community names
  - `3e09003` Separate notice switches for follows, comments, and reactions
  - `cf74228` Collaboration request and decision notices
- Do not push unless asked. Do not force-push `main`. Do not change git config.
- Leave `test-results/` and `.env.local` untracked.
- Discover’s section menu, this file, the README corrections, and `deploy.md` belong in the commit that adds the section menu. `origin/main` before that push was `099e261`. Check `git log origin/main -1` before assuming those files are on main.

## How to run commands

- Node 24 is at `$HOME/.local/node/bin`. Put that on `PATH` before `npx`.
- Docker is at `/Applications/Docker.app/Contents/Resources/bin`.
- Local database container: `supabase_db_cursor_saksham`. User `postgres`, database `postgres`. Do not print connection strings or keys.
- `zsh` expands `?` and parentheses. Quote those paths.
- `rg` is not on `PATH`. Use `grep` or Python.
- Do not `db reset`. It deletes local accounts and projects, including Sensor Node. Apply new SQL with `npx supabase@3.1.0 migration up` only.
- Dev server, when one is already running: `npx next dev --hostname 127.0.0.1 --port 3000`. Do not start a second server on port 3000. Playwright uses `http://localhost:3000` and `reuseExistingServer`. The session cookie is for `localhost`, not `127.0.0.1`.
- Checks: `npx tsc --noEmit`, `npx vitest run <file>`, `npx playwright test <spec> --reporter=line`.

## Rules that are easy to break

- Accounts are 13+. Age is a band: `13_15`, `16_17`, `18_24`, `25_34`, `35_plus`. No date of birth, phone, exact address, or live location.
- No direct messages and no MOSAIC group product. `profile_communities` is a list of names a person typed.
- Do not invent deadlines, trending scores, photos of real people, or recommended groups.
- RLS stays on. Server auth uses `getClaims()`, not `getSession()`. Call `await connection()` before creating a Supabase client. `getMember` already does that. Do not wrap signed-in data in `"use cache"`. Pages that redirect export `instant = false`.
- Do not edit an applied migration. The next file is `092_*.sql`. There is no `017_`. `lib/supabase/migrations.test.ts` asserts the file list, currently length 90, last file `091_staff_remove_report.sql`. Update that test and `DATABASE_SCHEMA.md` when you add one.
- Types in `types/database.ts` are hand-patched. An insert the client cannot see because of RLS often still succeeds and then fails on `RETURNING`. Update only the columns you mean to change, or do the write in a security-definer function. That is why `staff_remove_report` exists.
- `is_trusted_writer` is true for the local postgres role or while `app.system_write` / `app.anonymizing` is set. Do not treat `current_user` alone as staff inside a definer function.
- Demo rows stay hidden unless `app.allow_demo` is set. The app does not set it. `ALLOW_DEMO_CONTENT` must stay off in any hosted environment.
- Tick a checklist line only after a Playwright test proves it. Update `README.md` in the same change.

## Discover UI

Sections are one `<select id="discover-section">` plus a Show button. The options are the `views` array in `components/discover/DiscoverFeed.tsx`. There is no second row of the same links.

Filters are separate and only where they change the list:

- People: the closed Filters menu (age, place, skill, and the rest of the people form).
- Projects: search, sort, and the advanced filter (type and status together).
- Ideas, posts, reels: project-type links inside Filters.
- Search: the search box, plus a discipline select that keeps projects of that type.
- Communities, opportunities, events, competitions, hackathons, open source, technologies, collections, editor's picks, and new: no project-type filter.

`e2e/discover-section.spec.ts` checks that split.

## Moderation

`/moderation` is staff-only. `public.current_user_is_staff()` reads `admin_roles`. A normal member sees "This page is for staff."

Staff can dismiss an open report, remove its post, project, comment, or opportunity (`public.staff_remove_report`), suspend the author of a reported post, and restore a suspension. The first admin is inserted in the Supabase SQL editor. There is no insert policy for signed-in users. See `deploy.md`.

Local tests promote a user with:

```sql
insert into public.admin_roles (user_id, role)
select id, 'moderator' from public.profiles where username = '<username>';
```

Run that through `docker exec supabase_db_cursor_saksham psql -U postgres -d postgres`.

## Product facts the README used to get wrong

- Opportunities, events, and a staff report queue exist. MOSAIC groups and direct messages do not.
- Mentions (`@username` in a comment) notify that person.
- Home trending is the public projects whose updates were reacted to most recently, up to eight. It is not a score.
- A report alone does not hide a post from other people. Staff removal does.
- Signup confirmation, password reset, and email change are Supabase Auth emails. Local mail is Mailpit at `http://127.0.0.1:54324`. Production must use custom SMTP. The Next app does not send those messages itself.

## Left unfinished on purpose

The last "next 10 launch items" stopped after the moderation queue. These were the remaining candidates and are not done:

- Discover upcoming events as a date-based list that also includes future hackathons (`MOSAIC_CHECKLIST.md` around the events section).
- The checklist lines for online/offline events and event announcements. The forms already store `is_online` and a registration https link. Those lines were not re-tested in that pass.
- Mark an opportunity as applied, shortlisted, or completed.
- Deadline reminders.
- Two-factor sign-in. Do not add a half-finished factor that can lock people out.
- Google sign-in. The button stays off until a real OAuth client exists.

Do not start direct messages or a group-community product unless the user asks. The checklist still has those sections.

## Useful files

- `MOSAIC_CHECKLIST.md` — tick only after a test.
- `README.md` — product behaviour in prose.
- `deploy.md` — launch for about 500 people.
- `DATABASE_SCHEMA.md` — tables, RLS, migration index.
- `lib/auth/session.ts` — `getMember`, `memberGate`.
- `lib/auth/actions.ts` — sign-up, password, email change, close account, other sessions.
- `components/discover/DiscoverFeed.tsx` — Discover sections, search, lists.
- `app/(member)/moderation/page.tsx` and `lib/moderation/actions.ts`.
- `e2e/*.spec.ts` — Playwright. Password for local accounts created by tests is `Local-test-1!`. Onboarding must wait for each "Step N of 9" before Continue.

## Local data to keep

Do not wipe the database. A real local project, Sensor Node (`sensor-node`), and its owner exist. Many Playwright users exist too. Theme was left on Dark.
