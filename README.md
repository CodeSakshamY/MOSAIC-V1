# MOSAIC

Social infrastructure for people who build things. A builder's identity on MOSAIC is their projects, their progress, their contributions, and the people they build with.

The product name lives in `lib/brand.ts`. The name can change without a sweep through the interface.

What is finished, and what is not, is tracked in [MOSAIC_CHECKLIST.md](./MOSAIC_CHECKLIST.md). Only behaviour that works is ticked there. Update this README when that behaviour changes.

## What works

Accounts are for people aged 13 and older. Age is stored as a band (`13–15`, `16–17`, `18–24`, `25–34`, `35+`), never as a date of birth. Sign-up uses email and password, with confirmation before the account can be used. Password reset works. Google sign-in is drawn on the form and stays switched off.

A signed-in builder can finish onboarding, edit a profile, and upload a photo or banner. Interests from the fixed list show on the profile, and the builder can change them. The owner can feature up to 3 public projects, and those show under Featured. Projects whose status is Completed show in their own list. Other projects you own stay under Repositories. A builder can list up to 20 publications, each with a title and an optional venue, year, https link, and summary. A builder can list up to 20 competitions the same way, including an optional result they write themselves. A builder can list up to 20 communities they have taken part in, with an optional role and year. MOSAIC groups are not open yet. A builder can set how they like to collaborate: remote, in the same city, or hybrid. Clearing it removes the preference. The reasons chosen during setup show as Looking for, and the builder can change them. At least one reason stays selected. A builder can add up to 8 extra https links, such as LinkedIn, with a short label. GitHub and the website stay separate. The activity list is built from projects they started, updates they wrote, achievements, research, competitions, and communities. It shows the newest 30, and private projects stay out of other people's lists. A builder can set the profile to private. Other people then see the name, the username, and that the profile is private. Discover leaves that profile out. The profile lists stay hidden in the database. Public projects and posts stay available at their own addresses. A certificate or an award shows Verified only after a trusted writer marks it. A builder cannot mark their own. Profile details counts nine real parts: username, name, photo, bio, city, skills, interests, looking for, and a project or an education entry. It names the parts that are still open. A builder can add up to 5 titled sections. Discover people can be limited to a discipline, which is the category of an interest someone has chosen. They can also be limited to one interest, or to people who have a public project in a chosen category. Collaboration preference filters the same list to Remote, in the same city, or Hybrid. Home lists up to eight public builders who share one of your interests. The People page shows that same list when you are signed in. Home also lists community names that you and another builder both typed. Those are not MOSAIC groups. Trending on Home is the public projects whose updates were reacted to most recently, up to eight. A signed-in builder can publish an idea, a question, an achievement, or a showcase of one public project they own. A project update also shows in that feed as Build in public. An experiment update is labelled Experiment. Pending collaboration requests for your projects show on Home. An opportunity announcement needs an official https link. The deadline stays empty unless the builder types one, and the builder cannot mark it verified. An event announcement uses the date and registration link the builder enters, and it is marked online only when they say so. A feed post can include an https attachment, and a project update can upload a photo, a short video, or a PDF. A post tied to a project shows that project's name and link. Interesting is its own reaction, separate from like and the votes. Inspired is a separate reaction as well. Discover people shows the builders who share one of your interests. It also lists builders who have a public project in a category you work in. Another builder's profile lists the interests you both chose. It also lists people you both follow. Discover people can be limited to a reason from Looking for, including teammates. Find mentors also includes builders who have listed work. Research collaborators are builders who chose the Research interest or own a public Research project. Co-founders are looking to discover projects. Student teams listed a school and are looking for teammates. A collaboration request asks for a message and what the person would do, and the project owner can read both. The owner can accept or decline it, and that decision stays on the project. The owner can also mark the project open to collaborators and publish what a teammate would do. Large photos are reduced before they are stored. Short MP4 and WebM files can be uploaded. There are no direct messages.

**Home** has four tabs. Your projects lists build-log updates and threads on projects you own or belong to. Following lists public posts from people you follow and from projects you follow, newest first. For you scores the latest public posts from your interests, skills, follows, city, and how recent they are, and each card says why it is there. A new account with no skills and no interests gets a recency order and the line "Shown because you're new here." Nearby lists posts from your city, or from your state when the city has none. Each signed-in tab shows 15 posts and loads the next page when you reach the end. For you moves to the next window of 120 only after the current window is full. For you cards have Show more, Show less, and Not interested. Show more raises later posts from that author and project. Show less lowers them. Not interested hides that post from you. The newest choice for an author or project is the one that counts. Logged-out home lists recent public projects and does not say For you. There is no trending list.

**Discover** lists people, projects, ideas, posts, and reels. People and projects can be searched. Filters stay in a closed menu: age band, location, and skill for people; project type for projects, ideas, posts, and reels. Posts can be liked, upvoted, downvoted, commented, reposted, shared, and saved. Those actions stay on Discover, not on Home. The author's Follow button sits on the post, including ideas, reels, and the post page. A post that belongs to a project also has Follow project, and the same control is on the project page. Following then includes posts from those projects. A local Stock account can stand in with sample posts and reels. Run `node scripts/seed-stock.mjs` once. Those rows are placeholders, and the profile says so.

**Forge** is where your projects live. You can create one, keep it public or private, add an optional one-line tagline, filter by type from a closed menu, write build logs and threads, and open a pull request from a fork. The tagline sits under the project name. The description stays the longer summary. Each project type has a closed list of subcategories, and the owner can set one. Forge can filter by it once a type is chosen. The owner can list up to 8 tools the project uses, chosen from the fixed skill list. Forge can filter by one of those tools. The owner can also list up to 8 skills the project needs, from that same list. Forge can filter by one required skill. The owner can set the project status to Idea, Researching, In development, Prototype, Testing, Completed, or On hold. Forge can filter by that status. A new project starts as Idea. The owner can set an optional start date and end date, and the project page shows that span. The owner can add up to 12 milestones, each with a name and a date. They show in date order, and the owner can remove one. The owner can write project documentation of up to 8000 characters. It shows on the project, and an empty save clears it. The owner can also write credits of up to 2000 characters. An empty save clears those too. Build logs also show on the project as an update history, with the author and the date, apart from the commit form. Active members show as the team, with Owner, Maintainer, or Contributor. Contributions list each join and each build log, oldest first. Someone who is not on a public project can ask to contribute. The owner can accept or decline. Accepting adds them as a contributor. A signed-in builder can save a project and find it under Saved on their profile. Share copies the project link. The owner sees counts for followers, saves, forks, updates, threads, the team, and pending requests. The save count does not show who saved it. Related lists up to five public projects in the same type that share a tool or the same subcategory. The owner can save up to 20 named versions, newest first, and remove one. Lineage lists ancestors, this project, and forks, with the people on each. A commit can include up to 4 photos, short videos, or PDFs. Those files show on the commit and in the update history. A commit can be recorded as an update, a milestone, a problem, an experiment, a failed attempt, or a technical explanation. The badge shows on the commit and in the update history. Anyone who can see the update can comment on it. A signed-in builder can like that update, and upvote or downvote it. Upvote and downvote replace each other. Like stays on its own. A signed-in builder can follow one update. A later comment on it shows in their notifications. The dated milestones on the project stay a separate list. The owner can mark one as major. Major milestones show at the top of the project and keep a Major badge in the dated list. A public project can have a cover photo and up to 8 gallery photos. The owner can replace or remove them on the project page. The old `/build` address redirects here.

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
