# Architecture

Polymath is one Next.js application. The browser talks to Next.js. Next.js talks to Supabase. There is no custom Express server and no second API for the same entities.

```
Browser
  → Next.js App Router
      Server Components     reads
      Server Actions        writes
      Route Handlers        health, uploads that need byte inspection, auth callbacks
      proxy.ts              session refresh on each matched request
  → Supabase
      Postgres + RLS
      Auth
      Storage
```

The secret key is used only when RLS cannot express the operation: banning an auth user, bootstrapping nothing from the client, and the account-anonymize path that must touch `auth.users`. Ordinary reads and writes use the user-scoped server client so RLS still applies.

## Identity

Three clients, three privileges.

| Module | Where it runs | Key | RLS |
| --- | --- | --- | --- |
| `lib/supabase/client.ts` | Browser | Publishable | Enforced |
| `lib/supabase/server.ts` | Server Components, actions, route handlers | Publishable, plus the user cookie | Enforced |
| `lib/supabase/admin.ts` | Server only | Secret | Bypassed. Every call site checks an authorization condition first and comments why RLS is insufficient. |

Server code that needs the current member calls `getClaims()` and then reads `profiles` through the user-scoped client. `getSession()` is not used as an authorization check. The session cookie is not trusted on its own.

`proxy.ts` runs on document and data requests, skips static assets, calls `getClaims()` so the auth cookie can rotate, and copies `Cache-Control`, `Expires`, and `Pragma` onto any response it returns. Layouts that protect a section also call `getClaims()`. A hidden link is not a protected route.

Route groups:

| Group | Who can render it |
| --- | --- |
| `(auth)` | Signed-out visitors. Signed-in members are redirected home, or to onboarding if their profile is incomplete. |
| `(main)` | Signed-in members with `onboarding_complete`. |
| `(public)` | Everyone. Logged-out home, public project pages, public profiles, public opportunity pages, guidelines. |
| `admin` | Members whose id is in `admin_roles`. Checked on the server for every admin page and every admin action. |

The logged-out home and a public project page live in `(public)`, not behind the app shell's "you are signed in" assumptions. The signed-in home uses the same visual shell and a different data function.

Suspended members can sign in only as far as a suspension notice. RLS rejects their writes as well, so a skipped UI check still fails.

## Request rules

- Server Components are the default. A file gains `"use client"` only when it needs state, a browser event, or a hook.
- The feed list, project page, profile, people results, opportunities, and communities are rendered on the server.
- Client islands are the composer, reaction buttons, comment box, follow button, filters that should feel immediate, mobile navigation, dialogs, and the feed's load-more control.
- TanStack Query, when it arrives in the feed phase, owns that load-more cache and the optimistic reaction. It does not fetch the first page. The first page is server-rendered.
- Forms that create a project, a post, or an opportunity use React Hook Form plus the shared Zod schema. The same schema runs again inside the server action. The client schema is a courtesy.
- Mutations call `revalidatePath` or `revalidateTag` for the public pages they change. They do not broad-revalidate the whole site.

Action results use one type:

```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
```

## Caching

| Data | Policy |
| --- | --- |
| Signed-in feed, notifications, settings, admin | Dynamic. User-scoped. Never cached at the CDN. Never passed to `use cache`. |
| Public project, public profile, public opportunity | Revalidate on write, with a 60-second fallback so a missed invalidation still expires. |
| Discover sections that are global | Same as public project pages. A section that depends on the viewer's city is dynamic. |
| Skills and interests | Reference data. Long revalidation. |
| Images | `next/image` with `remotePatterns` limited to this project's Supabase storage host. |

Private data is not given a public cache tag.

## Folders

The brief's tree is the target. Files are created in the phase that needs them, not in advance.

```
app/
  (auth)/login, signup, onboarding, forgot-password
  (public)/            logged-out home, guidelines, public share routes
  (main)/              signed-in shell
  admin/
  auth/callback/       OAuth and email-link return
  api/health/
  api/upload/          byte inspection, then Storage
components/ui
components/{navigation,feed,projects,people,opportunities,communities,profile,comments,notifications,moderation}
lib/{supabase,auth,feed,projects,people,opportunities,communities,notifications,moderation,validation}
lib/brand.ts
hooks/                 client islands only
types/database.ts      generated
supabase/migrations
supabase/seed.sql
supabase/tests
proxy.ts
```

`hooks/useUser.ts` and its siblings are thin wrappers for client islands. Server Components call `queries.ts` directly and do not go through a hook.

## Brand

`lib/brand.ts` exports the product name, the one-line description, and the reserved usernames (`polymath`, `admin`, `help`, and the route names). Components import the name from that module.

## Feed

The feed is a query plus a pure function. Discover uses the same tables and does not have its own content types.

### Candidate query

A SQL function `feed_candidates(tab, cursor_created_at, cursor_id, window)` returns at most 120 rows. It joins author, project, cover, tags, reaction counts, and the current viewer's reaction, save, and dismiss state. It applies RLS by running as `security invoker`. It filters out:

- the viewer's blocks in either direction
- suspended or deleted authors
- private posts the viewer cannot access
- `is_demo` rows unless demo content is explicitly allowed
- the viewer's own posts, on For You

Tabs:

| Tab | Candidates | Order |
| --- | --- | --- |
| For You | Latest eligible public posts in the window, plus published opportunities that match the viewer's skills, interests, or age band. | Scored, then a diversity pass. |
| Following | Posts by followed people and posts attached to followed projects. | Chronological. |
| Nearby | Same normalized city, otherwise same state. If the profile has no city or state, the tab explains that and offers settings. It does not substitute a global feed. | Chronological, with a small note when results are state-level rather than city-level. |

Logged-out home calls a different function: latest public projects and published non-demo opportunities, chronological, cached as public data. The word "personalized" does not appear.

### Ranker

`rankFeed(candidates, viewer)` is pure. It does not fetch. Tests construct candidates by hand.

Score for a post, before the diversity pass:

| Signal | Weight |
| --- | --- |
| Interest overlap, 0 to 1 | × 30 |
| Skill overlap, 0 to 1 | × 24 |
| Viewer follows the author | + 18 |
| Viewer follows the project | + 14 |
| Recency `16 * e^(-ageHours / 168)` | up to + 16 |
| Same city | + 8 |
| Same state, when the city differs | + 4 |
| Project is seeking a skill the viewer has, and the viewer asked to contribute or find teammates | + 12 |
| Has a cover image | + 3 |
| Body longer than 280 characters | + 2 |
| Viewer dismissed it | − 40 |
| Viewer was shown it in the last 7 days | − 8 |
| Viewer already reacted | − 6 |

Opportunities use the same function with skill overlap, age-band eligibility, deadline proximity (a dated deadline inside 14 days adds 6; a null deadline adds nothing), and location. An opportunity with no overlap and no location match is not injected into For You. It can still appear on the Opportunities page.

Diversity pass: walk the scored list and subtract `10 * (appearances of this author already chosen)`. Cap a single author at 2 items per page of 15. A page of 15 is the unit. The next page is the next candidate window, not an offset into a personalized global ranking. That limitation is accepted and tested so it does not get "fixed" later by loading the whole table.

Cold start, meaning the viewer has no skills and no interests yet: skip the personalized weights. Order the window by recency and the diversity pass. The explanation line is "Shown because you're new here. Add interests and it will sharpen."

### Explanation line

Each For You card can show one sentence, chosen from the largest positive term that actually fired:

- interest overlap → "Matches interests you added."
- skill overlap → "Uses skills from your profile."
- follow → "From someone you follow."
- seeking → "Looking for a skill you have."
- same city → "From your city."
- recency only → "Recently published."

If the only reason left is recency, say that. Do not invent a relevance story.

### Dismiss and impressions

`feed_events` stores `impression` and `dismiss` for the signed-in viewer. Rendering a page writes impressions for the ids actually returned. Dismiss is an explicit control on the card, not a hover. Impressions older than 30 days can be deleted later; V1 does not depend on that job.

### Writes that become feed items

Creating a project inserts the project and a `project` post in one transaction. Creating a build log inserts the log and a `build_log` post in one transaction. Ideas, help requests, and achievements are posts; they may optionally point at a project. Publishing an opportunity inserts one `opportunity` post so reactions have a single parent. Saving an opportunity writes `opportunity_saves`, including when the save button is on a feed card. Opportunity cards do not also write `saves`, so a save has one destination.

### Reactions

A member may hold several reaction types on one post at once (`interesting` and `inspired` together). They may hold each type once. The verbs in the interface are Interesting, Inspired, Build, and Contribute. Contribute on a project card links to the contribution request flow. It does not pretend the member has joined the team.

## Projects

A project is a row, not a post with a title. The post is the feed announcement. The permanent page is `/projects/[slug]`.

Tabs read the same project id:

| Tab | Source |
| --- | --- |
| Overview | The project row, skills, links, problem, solution. |
| Build log | `build_logs` for that project. |
| Team | `project_members` with status `active`. |
| Contributors | Active members whose role is `contributor`, plus accepted contribution requests. |
| Forks | Projects whose `parent_project_id` is this project. |
| Discussion | Comments on the project's posts. |

Forking creates a new project with `parent_project_id` set, copies name, description, and skills into the new row, and does not copy build logs or team membership. The new page shows the parent link. The parent page lists the fork.

Looking for collaborators is `looking_for_contributors` plus `project_skills` rows with `relation = 'seeking'`. It is not a job listing. A request has a message and a proposed contribution. The owner accepts or rejects. Accepting creates an active `project_members` row in the same transaction.

Slug rules: lowercase, `a-z`, `0-9`, and single hyphens, 3 to 60 characters, unique case-insensitively. Generated from the name and suffixed on collision.

## People

Search is Postgres `pg_trgm` over display name, username, and skill name, plus equality filters. Limit 20 per page, maximum 50 pages. This is enough for the first thousands of members and it avoids a second search system.

Follow creates a row in `follows` and a notification. Self-follow is rejected by a constraint and by RLS.

## Opportunities

Rows are curated by an admin. The official URL is required. The interface never fills a missing deadline, prize, or eligibility with a guess. Filters are For you (skill, interest, age band), Near me (state or online), Online, Closing soon (a real deadline within 14 days), category, and eligibility text search.

`is_verified` means an admin checked the official URL. It does not mean the organizer has a partnership with Polymath.

## Communities

A community has members, a description, and posts linked through `community_posts`. A post can sit in more than one community. V1's composer asks for at most one. There are no channels, roles beyond owner, moderator, and member, or live messages. "Community activity" on the page is recent posts linked to that community.

## Notifications

Inserted by the database for follow, comment, reply, contribution request, contribution accepted, contribution rejected, and a project update (a new build log notifies followers of the project, not the author). The application lists them and marks them read. It does not open a websocket. Opportunity notifications are not generated in V1.

A member can read and update only their own rows. Actors who are blocked are not turned into a notification.

## Moderation

Reports use real foreign keys, one target per report. The reporter can insert and can read their own reports. Moderators and admins can read and update the queue. `admin_roles` has no insert, update, or delete policy for `authenticated`. A security-definer `is_staff(uid)` reads that table.

Blocking is mutual for discovery and comments: either direction hides each person from the other's feed, people search, and comment box. It does not erase old public comments. Those stay until a moderator removes them.

Suspension sets `account_sanctions` and rejects writes through RLS. Restoration clears the sanction. Content removal soft-deletes the post or comment (`removed_at`) so a report still has a target.

## Validation and content safety

- Zod schemas live in `lib/validation` and are the only parsers for profile, project, post, comment, opportunity, community, and report input.
- Length caps are enforced in Zod and as database check constraints.
- Stored text is plain text. The renderer preserves line breaks and linkifies `https` URLs. It does not parse Markdown or HTML in V1. That decision removes a class of stored-XSS bugs while the product is young. Rich text can be reconsidered later with a sanitizer.
- User-supplied URLs must pass `https` validation before they are stored or rendered.
- Uploads: JPEG, PNG, WebP. Avatars 2 MB. Covers and post images 5 MB. The server reads the first bytes and checks the signature. The object name is `{userId}/{uuid}` with an extension chosen from the sniffed type. The client filename is discarded.
- File paths returned to the browser are the Storage public URL for public buckets, or nothing. The service role is not used to mint a URL for an object the user should not see.

## Authorization map

| Operation | Rule |
| --- | --- |
| Edit profile | `auth.uid() = id`, not suspended, not deleted. |
| Create project | Onboarded, not suspended. Owner member row is inserted with the project. |
| Edit project | Owner or active maintainer. |
| Read private project | Owner or active member. |
| Request to contribute | Onboarded, not the owner, not already active, no other pending request. |
| Review a request | Owner or active maintainer of that project. |
| Write a public post | Onboarded, not suspended, under the hourly cap. |
| Comment | Can read the parent post, not blocked by the author, depth limit held. |
| Read notifications | Recipient only. |
| Review reports | Staff only. |
| Insert `admin_roles` | SQL editor or service role, never the client. |

## Errors, loading, and empty states

- Each route group has `loading.tsx` and `error.tsx`. Errors say what failed and offer a retry. They do not print Postgres messages, stack traces, or ids that are not already public.
- Empty states say what will appear and the single action that fills them ("Publish a project", "Add a city", "Follow a builder"). They are not illustrated with fake cards.
- A control that is not built is absent. It is not rendered as a quiet button.

## Testing boundaries

| Layer | Tool | Lives with |
| --- | --- | --- |
| Ranker, URL guards, Zod schemas, slug and username rules | Vitest | The module, from the phase that adds it |
| Migrations apply, constraints reject bad rows | `supabase db reset` plus SQL | Phase 2 |
| RLS | `supabase/tests` role-play script | Phase 2, extended when policies change |
| Critical journey and mobile layout | Playwright | Phase 3 onward |
| Typecheck and lint | `tsc --noEmit`, ESLint | Every phase |

## Performance boundaries

- Page size 15 for the feed, 20 for people and opportunities.
- No unbounded `select *` in a Server Component.
- Lists select the columns the card renders.
- Indexes are part of the migration, not a follow-up. See the schema doc.
- Avatars and covers go through `next/image` with explicit sizes.

## What this architecture refuses to grow into accidentally

A chat backend, a scraper, a recommendation model, a public GraphQL layer, a service-role client in a Client Component, or a parallel "discover posts" table. New product surface area is a new phase, not a new client.
