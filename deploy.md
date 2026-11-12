# Deploy MOSAIC for about 500 people

This is the current launch guide. [DEPLOYMENT.md](./DEPLOYMENT.md) is older and still says Polymath in places. Follow this file.

The app is a Next.js 16 server on Node 24, with Supabase for Postgres, Auth, and Storage. Five hundred accounts, their projects, and their posts fit a small hosted database. The parts that will fail in public use are email, a wrong site URL, and a database reset.

## What you need before the first real signup

- A domain, with DNS you can edit. HTTPS is required.
- A Supabase project in a region near the members. `ap-south-1` (Mumbai) is the right default.
- A place to run Next.js. Vercel is the path below. A single Node server running `npm run build && npm run start` is the alternative.
- Custom SMTP (Resend, Postmark, Amazon SES, or similar). Supabase's built-in mailer is rate-limited and will not deliver confirmation mail for 500 people.
- The Supabase publishable key and secret key. They are created in the dashboard. They never go in git, chat, or a `NEXT_PUBLIC_` variable except the publishable key.

## 1. Create the production database

1. Create a new Supabase project. Do not reuse a project that already has local test users.
2. In Authentication → Providers, turn email/password on. Turn email confirmation on. Leave Google off until a real Google OAuth client exists. The button in the app stays disabled until then.
3. In Authentication → URL configuration, set Site URL to the public origin, for example `https://mosaic.example`. Add these redirect URLs and no wildcard:

```
https://mosaic.example
https://mosaic.example/auth/callback
```

4. In Authentication → SMTP, enter the custom SMTP host, port, username, password, and sender. Send a test message from the dashboard to your own inbox before any public signup.
5. Apply the repo migrations from a clean checkout of the commit you intend to run. This applies files in order and does not wipe data:

```
npx supabase@3.1.0 link --project-ref <project-ref>
npx supabase@3.1.0 db push
```

Do not run `supabase db reset` against this project. Do not paste the migration files into the SQL editor one by one. There is no `017_` file. The sequence includes `001` through `016` and then `018` upward.

6. Confirm the storage buckets from the migrations exist: `avatars`, `project-covers`, `post-media`, `community-images`.

## 2. Configure the app

Set these on the host. Names match `.env.example`.

| Name | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | The project URL, `https://<ref>.supabase.co`. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The publishable key. If the project only has legacy keys, use the anon key here. It still goes through RLS. |
| `SUPABASE_SECRET_KEY` | The secret key, server only. Legacy equivalent: the service-role key. Never prefix it with `NEXT_PUBLIC_`. |
| `NEXT_PUBLIC_SITE_URL` | `https://mosaic.example`, no trailing path. |
| `ALLOW_DEMO_CONTENT` | Unset, or `false`. Demo rows must stay hidden. |

Signup confirmation, password reset, and email change are sent by Supabase Auth, not by a mailer inside this repo. If SMTP is wrong, people can create a row and then never get in.

## 3. Deploy the Next.js app

From the same commit you migrated:

```
npm ci
npm run typecheck
npm run build
```

On Vercel, import the GitHub repo, set the environment variables for Production, and set the production branch to `main`. Add the custom domain. After the domain works, re-check the Supabase Site URL and redirect list so they use that domain and not only the `vercel.app` host.

If you are not using Vercel, run the build on the server and keep `npm run start` behind HTTPS. One Node process is enough for 500 people. Restart it on deploy. Do not point it at the local Docker database.

The app talks to Supabase over the hosted API. You do not need a separate `DATABASE_URL` for the running site.

## 4. Make the first staff account

Sign up through the public site and finish onboarding. Then, once, in the Supabase SQL editor:

```sql
insert into public.admin_roles (user_id, role)
select id, 'admin'
from public.profiles
where username = '<founder-username>';
```

Open `/moderation` while signed in as that person. You should see open reports and suspensions. Any other account should see "This page is for staff."

From that page, staff can dismiss a report, remove the reported post, project, comment, or opportunity, suspend the author of a reported post, and restore a suspension.

## 5. Smoke test with two real inboxes

Do this on the public URL before telling anyone else.

1. Sign up with inbox A. Open the confirmation message. Land in onboarding. Finish it.
2. Sign up with inbox B. Confirm. Follow A. A sees a follow notice. B can turn that notice off in Settings.
3. A creates a public project and a post. B comments, and includes `@<A's username>`. A sees the comment notice and the mention.
4. B reports the post. A, as staff, removes it from `/moderation`. B no longer sees the post.
5. Reset a password from the login form. The message arrives, and the new password works.
6. Settings → start an email change. The new inbox gets the confirmation. The old address still signs in until that message is opened.
7. Download account data. Close a throwaway account and confirm the closed-account page.

## Capacity for about 500 people

- The app already refuses a sixth post or a sixth opportunity announcement from the same account within ten minutes, and it refuses an exact duplicate post.
- Photos are reduced before storage. Short MP4 and WebM uploads are allowed. Watch the storage size in the Supabase dashboard. Five hundred active people who upload covers and commit photos will outgrow the free storage quota. Move to a paid disk before you invite them, not after uploads start failing.
- Use at least the smallest paid Supabase compute, with daily backups turned on. The free project pauses and has a small mailbox and database ceiling.
- Auth email is the limiter, not the Node server. Custom SMTP with a verified domain is required. Expect confirmation mail during the first invite wave. A few hundred messages on launch day is normal.
- Keep one production database. Use a second Supabase project only for a rehearsal. Apply a new migration there with `db push`, click through the changed page, then `db push` production. Never reset either one.

## What will still be missing after this deploy

- Direct messages and MOSAIC groups.
- Google sign-in.
- Two-factor sign-in.
- Deadline reminders and "mark as applied".
- An error monitor, uptime check, and analytics. Add those with a hosted service when you have an account. The app does not ship a vendor key.

## When something is wrong

- "Confirm your email" and no message: SMTP settings, not the Next app.
- Login works on `localhost` and not on the domain: Site URL or the redirect allow-list.
- A page loads and then bounces to `/profile`: the session cookie host does not match the site URL.
- A write looks like it failed but the row exists: RLS blocked the `RETURNING` row. Do not "fix" that by disabling RLS.
- A new migration file was added: `db push` that file's project. Do not edit a file that has already been applied.
