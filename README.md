# MOSAIC

Social infrastructure for people who build things. A builder's identity on MOSAIC is their projects, their progress, their contributions, and the people they build with.

The product name lives in `lib/brand.ts`. The name can change without a sweep through the interface.

What is finished, and what is not, is tracked in [MOSAIC_CHECKLIST.md](./MOSAIC_CHECKLIST.md). Only behaviour that works is ticked there. Update this README when that behaviour changes.

## What works

Accounts are for people aged 13 and older. Age is stored as a band (`13–15`, `16–17`, `18–24`, `25–34`, `35+`), never as a date of birth. Sign-up uses email and password, with confirmation before the account can be used. Password reset works. Google sign-in is drawn on the form and stays switched off.

A signed-in builder can finish onboarding, edit a profile, and upload a photo or banner. Large photos are reduced before they are stored. Short MP4 and WebM files can be uploaded. There are no direct messages.

**Home** has four tabs. Your projects lists build-log updates and threads on projects you own or belong to. Following lists public posts from people you follow and from projects you follow, newest first. For you scores the latest public posts from your interests, skills, follows, city, and how recent they are, and each card says why it is there. A new account with no skills and no interests gets a recency order and the line "Shown because you're new here." Nearby lists posts from your city, or from your state when the city has none. Each signed-in tab shows 15 posts and loads the next page when you reach the end. For you moves to the next window of 120 only after the current window is full. For you cards have Show more, Show less, and Not interested. Show more raises later posts from that author and project. Show less lowers them. Not interested hides that post from you. The newest choice for an author or project is the one that counts. Logged-out home lists recent public projects and does not say For you. There is no trending list.

**Discover** lists people, projects, ideas, posts, and reels. People and projects can be searched. Filters stay in a closed menu: age band, location, and skill for people; project type for projects, ideas, posts, and reels. Posts can be liked, upvoted, downvoted, commented, reposted, shared, and saved. Those actions stay on Discover, not on Home. The author's Follow button sits on the post, including ideas, reels, and the post page. A post that belongs to a project also has Follow project, and the same control is on the project page. Following then includes posts from those projects. A local Stock account can stand in with sample posts and reels. Run `node scripts/seed-stock.mjs` once. Those rows are placeholders, and the profile says so.

**Forge** is where your projects live. You can create one, keep it public or private, add an optional one-line tagline, filter by type from a closed menu, write build logs and threads, and open a pull request from a fork. The tagline sits under the project name. The description stays the longer summary. Each project type has a closed list of subcategories, and the owner can set one. Forge can filter by it once a type is chosen. The owner can list up to 8 tools the project uses, chosen from the fixed skill list. Forge can filter by one of those tools. The owner can also list up to 8 skills the project needs, from that same list. Forge can filter by one required skill. A public project can have a cover photo and up to 8 gallery photos. The owner can replace or remove them on the project page. The old `/build` address redirects here.

Builders can follow and unfollow each other. Notifications list follows, comments, replies, and project updates, and the bell shows the unread count. You can report a person, a post, or a project. Reporting a post also hides it from your own feeds. Hide on the post does the same without a report. Unhide is in Settings. You can block an account from their profile and unblock them in Settings. Someone you block drops out of your Discover people list. A report does not take the post down for everyone else.

Settings has several colour schemes. Dark is the default. The sidebar stays dark in every scheme.

## Not built yet

Opportunities, communities, messaging, events, and the admin dashboard are not products yet. For you does not inject opportunities, and there is no trending rail. Mention notifications are not sent. Reporting a post does not hide it from everyone else. Reports stay open until a reviewer exists.

The application is not deployed. There is no production URL yet.

## Run locally

Requires Node.js 24 and a local Supabase stack. Copy `.env.example` to `.env.local`. Never commit `.env.local`.

```
npm install
npm run dev
```

Open http://localhost:3000. Use that host for the session. A tab on `127.0.0.1` does not share the login cookie with `localhost`. In development, `/dev/ui` reviews the interface primitives. That route returns a 404 in a production build.

```
npm run typecheck
npm run lint
npm run test
npm run test:e2e
```

Apply database changes with a migration up. Do not reset the database. That deletes local projects and accounts.

## Read these before implementation

- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) — audit, phase sequence, deviations, risks, open decisions
- [ARCHITECTURE.md](./ARCHITECTURE.md) — runtime shape, auth, feed ranking, caching, security boundaries
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — relational model, deletion behaviour, RLS, storage
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — tokens, typography, layout, component rules
- [DEPLOYMENT.md](./DEPLOYMENT.md) — local setup, Supabase, Vercel, production checklist

## Stack

Next.js 16 (App Router) on Vercel. Supabase Postgres, Auth, and Storage. TypeScript strict. Tailwind CSS. shadcn/ui primitives, themed with the MOSAIC tokens.

Secrets stay in environment variables. The Supabase secret is server-only.
