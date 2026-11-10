# Implementation plan

Working name: Polymath. Phase 0 record. No application code ships from this document.

## 1. Repository audit

Audited on 9 November 2026.

| Check | Result |
| --- | --- |
| Workspace | `/Users/sakshanm/Documents/cursor saksham` |
| Files | None. The directory is empty. |
| Git | Not a repository. |
| Framework | None. |
| Dependencies | None. |
| Supabase | No config, migrations, or clients. |
| Environment files | None. |
| Existing product code | None. Nothing to preserve or overwrite. |

This is a greenfield build. Phase 1 scaffolds Next.js into this directory beside these documents. `create-next-app` refuses a non-empty directory, so scaffolding will be done explicitly (package.json, Next.js config, `app/`, TypeScript, Tailwind) rather than by wiping the folder.

There is no reason to deviate from the requested stack. Versions below are the current stable choices as of this audit, and they will be pinned at install time.

| Piece | Choice |
| --- | --- |
| Next.js | 16.4.5 or later in the 16.4 line. This is the active LTS and includes the November 2026 security patches for cache disclosure. |
| React | The version Next.js 16.4 installs. |
| TypeScript | Strict mode. `noUncheckedIndexedAccess` on. |
| Tailwind | v4, configured in CSS, which is what current shadcn/ui generates. |
| shadcn/ui | Current CLI. Style `new-york`. Components are copied into `components/ui` and then restyled to the Polymath tokens. |
| Icons | `lucide-react`. |
| Forms | React Hook Form and Zod where a form has more than a couple of fields. Small actions can be server actions with a Zod schema and no client form library. |
| Server state | React Server Components by default. TanStack Query is introduced only for the authenticated feed's incremental loading and for optimistic reactions. It is not wrapped around the app. |
| Supabase | `@supabase/supabase-js` and `@supabase/ssr`. Cookie session. `getClaims()` for server-side identity. No `@supabase/auth-helpers-*`. |
| Package manager | npm. |
| Tests | Vitest for ranking and validation. Playwright for the critical journey once auth exists. |
| Analytics | Vercel Analytics, cookieless, added when the app is actually deployed. PostHog waits until there is a question Vercel Analytics cannot answer. |

## 2. Product shape we are implementing

Polymath is a builder graph with a feed as the front door.

The objects that matter are profiles, projects, build logs, posts, contribution requests, opportunities, and communities. Follows, reactions, comments, and saves are edges on that graph. Reputation is contribution, not a follower count. Follower count is not displayed as a primary statistic.

The loop the interface has to support, in order:

1. A person creates an account and a builder profile.
2. They open a feed of projects, progress, ideas, help requests, and opportunities.
3. They follow people and open a project.
4. They publish their own project and a build log.
5. They find a person and send a contribution request.
6. They save an opportunity.

Direct messages, voice, channel chat, scrapers, machine-learned ranking, and a hiring marketplace are out of scope for V1. Collaboration happens through project discussion, contribution requests, and community membership.

## 3. Deviations from the brief

These are deliberate. Each one is a change from a literal reading of the brief, with the reason.

1. **Session refresh file is `proxy.ts`, not `middleware.ts`.** Next.js 16 renamed Middleware to Proxy. On Next.js 16 a `middleware.ts` file is not the session-refresh entrypoint. The Supabase browser and server clients still live in `lib/supabase/`. The proxy calls `getClaims()`, refreshes auth cookies, and sets `Cache-Control`, `Expires`, and `Pragma` on the response so a shared cache cannot store a `Set-Cookie`.

2. **Key names follow current Supabase terminology.** Legacy `anon` and `service_role` keys are deprecated by the end of 2026. The app reads `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SECRET_KEY`. The publishable key is safe in the browser and still enforces RLS. The secret key bypasses RLS, is read only in server modules guarded by `server-only`, and is never prefixed with `NEXT_PUBLIC_`.

3. **No `src/` directory.** Routes stay at `app/` so the tree matches the brief.

4. **Server mutations live in `actions.ts` files.** A file marked `"use server"` can only export actions. Reads stay in `queries.ts` and are imported by Server Components. Validation stays in `lib/validation`. The brief's `mutations.ts` name is reserved for this action boundary; files are named `actions.ts` so the server boundary is obvious.

5. **A few columns and tables are added because the product requirements need them.** They are specified in `DATABASE_SCHEMA.md`. Summary: `posts.opportunity_id`, `posts.is_demo`, structured `problem` and `solution` on projects, `project_skills.relation` (`uses` or `seeking`), `community_posts`, `feed_events`, `account_sanctions`, `projects.featured_at`, `is_demo` on demo-capable tables, and real foreign keys on reports instead of a bare polymorphic id.

6. **Opportunity fan-out is not a database trigger.** A trigger that notifies every matching user on insert will lock and spam. V1 creates notifications for follows, comments, replies, contribution requests, and project updates. "Relevant opportunity" notifications are a later explicit job. The feed already surfaces matching opportunities.

7. **Feed ranking is windowed, not a global sort of the whole table.** For You scores the latest 120 eligible candidates and returns 15. Load-more advances the candidate window. Following and Nearby are chronological. The ranker is a pure function in `lib/feed/ranking.ts` with unit tests. Cold-start copy does not claim personalization.

8. **Logged-out home is public and chronological.** It shows recent public projects and published opportunities and invites the visitor to join. It does not say "For you". Personalized tabs exist only for a signed-in, onboarded member.

9. **Demo data never travels in a migration.** Skills and interests are reference data and ship in a migration. Demo profiles, projects, communities, and opportunities live in `supabase/seed.sql`, which `supabase db reset` applies locally and `supabase db push` does not apply to production. Demo rows carry `is_demo = true`. Production queries exclude them unless `ALLOW_DEMO_CONTENT=true`.

10. **Toasts use Sonner.** Current shadcn/ui deprecates its older toast component in favour of Sonner.

11. **Comment threads are one level deep.** A reply cannot have a reply. This is enforced by a trigger. The interface stays readable.

12. **Private projects do not get a public cover image in V1.** The public cover bucket is world-readable. A server action refuses a cover upload for a private project and deletes the public object if a project is made private. Signed-URL covers can come later.

13. **Analytics is Vercel Analytics only**, added at deploy time, with no advertising cookies.

14. **Navigation on small screens has five slots, not seven.** Home, Discover, Build, People, Profile. Opportunities, Communities, Notifications, and Settings stay in the desktop sidebar and under Profile on small screens. Shrinking seven items into a tab bar makes an unusable mobile UI. The destinations are the same.

## 4. Recommended defaults

These are the defaults Phase 1 and Phase 2 will use unless you change them before work starts. The ones that affect the schema are marked.

| Topic | Default | Schema impact |
| --- | --- | --- |
| Minimum age | 13. Age is stored only as a band: `13–15`, `16–17`, `18–24`, `25–34`, `35+`. No date of birth. Approved 9 November 2026. | Yes. The `age_group` enum. |
| Under-13 builders | No accounts. Opportunities may still describe younger eligibility. There is no direct messaging in V1. Exact location, phone, and birth date are not collected. | Yes. The lowest `age_group` value is `13_15`. |
| Profiles | Public. Private fields are simply not stored: no phone, no address, no coordinates, no birth date. | Yes. No visibility enum in V1. |
| Location | Country (default India), state, and city. City is free text, matched by a normalized exact string. Same city, otherwise same state. No geocoder, no coordinates. | Yes. |
| Language | English only. Copy is not wrapped in an i18n framework. | No. |
| Auth methods | Email and password, verification, and password reset first. Google OAuth is wired in the auth UI and redirect list, and stays disabled until Google credentials exist. | No. |
| Education | Optional short text, maximum 120 characters. Not a school graph. | Matches the brief. |
| First admin | After the founder's account exists, one SQL statement inserts `admin_roles`. The application cannot grant admin. | Yes. |
| Account removal | Soft delete. Anonymize the profile, ban the auth user, delete social edges, keep projects and comments attributed to "Deleted builder". | Yes. |
| Guidelines | A real guidelines page ships with onboarding. Report and suspension tools ship in the moderation phase. | No. |

India's DPDP Act treats under-18s as children for consent and prohibits behavioural tracking of children. Members from 13 through 17 are inside that group. Polymath does not behaviourally track anyone in V1 (no ad profile, no third-party analytics beyond cookieless Vercel Analytics), does not offer direct messages, and does not collect a birth date, phone number, or precise location. The 13+ minimum is a product boundary, not a claim of legal compliance. A lawyer should review the guidelines and privacy copy before a public launch. That review is outside the engineering phases.

## 5. Phase sequence

Each phase ends with a written summary: what landed, files, migrations, tests, remaining issues, and what you need to do. Work does not skip ahead of a failing phase.

### Phase 0 — this document set

Done when you approve the plan, or mark up the defaults in section 4.

### Phase 1 — foundation

Scaffold Next.js 16, TypeScript strict, Tailwind v4, shadcn/ui, ESLint, and Vitest. Add the design tokens, fonts, logo wordmark, app shell, desktop sidebar, mobile bar, and the reusable primitives listed in `DESIGN_SYSTEM.md`. Add a development-only component gallery. Add route scaffolds for the seven sections. Scaffolds contain a real heading and one sentence of purpose. They contain no sample people, no sample counts, and no buttons whose handler is missing.

Home shows the three-column frame and an honest empty feed for a signed-out visitor. It does not invent posts.

Done when `npm run typecheck`, `npm run lint`, and `npm run test` pass, and the shell has been checked at desktop and mobile widths.

You do not need to provide credentials for this phase.

### Phase 2 — database

Add the Supabase clients, `proxy.ts`, `.env.example`, and the migrations in `DATABASE_SCHEMA.md`. Generate `types/database.ts`. Add a SQL RLS script that runs as `anon`, as two different users, and as a moderator.

Done when `supabase db reset` applies every migration in order on a local stack, the RLS script passes, and generated types compile. If Docker is unavailable, the same migrations are applied to a remote development project and the RLS checks are run there.

You will need a Supabase project and three environment variables in `.env.local`. Put them in the file, not in chat.

### Phase 3 — auth and onboarding

Email signup, verification, login, logout, password reset, Google-ready buttons, protected routes, profile trigger, and the onboarding steps from the brief. Draft community guidelines linked from signup. Redirect incomplete profiles to onboarding. Redirect suspended or deleted accounts to a static explanation.

Done when a new account can sign up, finish onboarding, and land on an empty feed that explains how to publish or discover, and when a signed-out request to a protected page reaches login. Playwright covers this path.

### Phase 4 — profiles

Public profile page, skills, interests, project lists, activity, follow and unfollow. Statistics are counts of projects, contributions, forks, and collaborations. Follower count is not a headline number.

Done when one onboarded member can open another member's profile and follow them, and a blocked or deleted profile does not appear in discovery.

### Phase 5 — projects

Create, edit, detail page with the six tabs, members, skills, status, links, contribution requests, and fork/remix with a parent link. Covers upload only for public projects.

Done when a member can publish a public project, open it by slug, and receive a contribution request that only they and the requester can read.

### Phase 6 — feed

Tabs, candidate queries, the five post presentations, reactions, saves, comments, windowed ranking, and the "why am I seeing this" line. Vitest covers the ranker, including cold start, dismiss penalty, and author diversity.

Done when the signed-in home feed is database-backed, paginated, and free of hardcoded posts.

### Phase 7 — build logs

Create and edit a log, attach it to a project, show it on the project timeline and in the feed. Image upload with type and size checks.

### Phase 8 — people

Search and filters over skills, interests, state, city, age band, collaboration preference, and looking-for. Results come from the database. An empty filter result is an empty state, not a padded list.

### Phase 9 — opportunities

Listing, detail, filters, saves, and admin create/edit. Every card requires an official URL. A missing deadline renders as "See the official page", never as an invented date. Demo rows stay hidden in production.

### Phase 10 — communities

Create, list, join, leave, detail, related projects and posts. No channels and no chat.

### Phase 11 — discover

Editorial sections composed from the same projects, people, opportunities, and communities. Trending means a documented score (recent reactions and saves over a fixed window), and the section is omitted when the window is empty. It is never filled with placeholders.

### Phase 12 — notifications

Persist the event types listed in the schema, mark read, and list them. No realtime channel.

### Phase 13 — moderation

Report, block, admin role check on the server, report queue, remove content, suspend and restore. Admin navigation is hidden from everyone else and the pages themselves reject non-admins.

### Phase 14 — hardening

RLS review, secret scan, upload checks, URL allow-list, index and query review, pagination caps, image config, accessibility pass, responsive pass, metadata, error copy, and the production checklist in `DEPLOYMENT.md`. Fixes land in this phase. The phase does not end as a list of unfixed findings.

Critical journey, covered by Playwright against a local or preview environment:

1. Sign up.
2. Finish onboarding.
3. Open the feed.
4. Open a project.
5. Open its creator and follow them.
6. Create a project.
7. Publish a build log.
8. Find a person.
9. Send a contribution request.
10. Open an opportunity and save it.

A second test proves a non-member cannot read a private project, a private contribution request, or another person's notifications, and cannot self-assign an admin role.

## 6. Module boundaries

Presentation components do not import the Supabase client. They receive data from Server Components or from a hook that calls a server action.

| Path | Responsibility |
| --- | --- |
| `app/` | Routes, layouts, loading and error UI, metadata. |
| `components/ui/` | Unthemed-by-default primitives, restyled. |
| `components/` | Product components, grouped by feature. |
| `lib/supabase/` | Browser client, server client, secret client. |
| `lib/validation/` | Zod schemas, shared by forms and actions. |
| `lib/<feature>/queries.ts` | Reads. |
| `lib/<feature>/actions.ts` | Writes. `"use server"`. |
| `lib/feed/ranking.ts` | Pure scoring. No database import. |
| `lib/brand.ts` | Product name and short description. |
| `types/database.ts` | Generated. Not edited by hand. |
| `supabase/migrations/` | Schema source of truth. |
| `supabase/seed.sql` | Local demo only. |
| `supabase/tests/` | RLS assertions. |

Actions return `{ ok: true, data } | { ok: false, error: string }`. The `error` string is written for a person using the product. Postgres errors are logged on the server and replaced with that string.

## 7. Technical risks

| Risk | Response |
| --- | --- |
| Next.js cache leaking a signed-in response. The November 2026 advisory is specifically about this class of bug. | Pin Next.js 16.4.5 or newer. Personalized pages call `cookies()` via the Supabase server client and are dynamic. Do not wrap user data in `use cache` or `unstable_cache`. The proxy sets the no-store headers Supabase documents. |
| A mistaken RLS policy exposes private projects, reports, or notifications. | RLS on every user table. A repeatable SQL test with `anon` and two users. Admin checks use `admin_roles`, never a profile column. |
| The secret key reaches the browser. | `lib/supabase/admin.ts` imports `server-only`. No `NEXT_PUBLIC_` prefix. A CI grep fails the build if `SUPABASE_SECRET_KEY` or `service_role` appears under `app/` or `components/`. |
| Public storage makes a private project cover world-readable. | No public cover for private projects in V1. See deviation 12. |
| SVG upload as an XSS gadget. Next.js image optimization has had an SVG bypass. | Accept JPEG, PNG, and WebP only. Sniff bytes in the upload action. Reject SVG even when the browser claims otherwise. |
| `javascript:` links in website, demo, or official URL fields. | Zod requires `https`. |
| Feed queries becoming N+1. | One candidate query returns the card's author, project, counts, and the viewer's reaction and save state. The ranker runs in memory on that page. |
| Ranking cursor instability. | Windowed candidates, documented in the architecture. Tested. |
| Demo opportunities mistaken for real ones. | `is_demo`, seed file separated from migrations, production filter, visible "Demo" label wherever demo content is allowed. |
| Auth email landing in spam, or Supabase's built-in mail rate limit blocking signups. | Deployment doc requires custom SMTP before a public launch. Local development can use Supabase's local mail catcher. |
| No rate limit on signup, posts, or reports. | Server actions enforce small fixed limits (10 posts an hour, 5 projects a day, 10 reports a day) with a count query. This is a brake, not a full abuse system. |
| City spelling splits "Bengaluru" and "Bangalore". | Accepted in V1. Nearby means normalized exact city, then state. No geocoder. |
| Account deletion destroying shared projects. | Soft delete. Specified in the schema doc. |
| First-admin bootstrap being forgotten, or an admin policy left open. | No insert policy for `authenticated` on `admin_roles`. Bootstrap SQL is in the deployment doc and is run by you in the SQL editor. |
| Scope exploding into chat, scrapers, or a second content system for Discover. | Those are explicitly out of the phase list. Discover reads the same tables as the feed. |

## 8. What Phase 1 will not do

- No fake feed, fake members, fake counts, or fake opportunities.
- No Supabase calls before Phase 2.
- No commit and no push unless you ask.
- No new library beyond the stack in section 1.
- No pages that look finished while their buttons do nothing.

## 9. Approval

Approved on 9 November 2026 with one change: the minimum age is 13, with a `13–15` band. Public profiles and email-first auth stay as written. Phase 1 is underway.

You do not need to create the Supabase project until Phase 2.
