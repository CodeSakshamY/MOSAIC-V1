# Deployment

Polymath is not deployed. This document is the procedure for getting there. Do not treat a successful local install as a production launch.

There are three environments.

| Environment | App | Database | Demo content |
| --- | --- | --- | --- |
| Local | `next dev` | Supabase CLI, or a remote dev project | Allowed, badged |
| Preview | Vercel preview | A non-production Supabase project | Off |
| Production | Vercel production | The production Supabase project | Off |

Preview and production do not share a database. A migration is applied to the remote dev project first, then to production.

## Credentials

`.env.example` will list names only. `.env.local` is gitignored. You fill it in yourself. Do not paste keys into chat or into a source file.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ALLOW_DEMO_CONTENT=true
```

| Variable | Where it is allowed |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser and server. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Browser and server. This is the current replacement for the legacy anon key. It still goes through RLS. |
| `SUPABASE_SECRET_KEY` | Server only. This is the current replacement for the legacy service-role key. It bypasses RLS. No `NEXT_PUBLIC_` prefix. |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for redirects and metadata. |
| `ALLOW_DEMO_CONTENT` | `true` only on a local machine. Unset or `false` everywhere else. |

Legacy JWT keys (`anon`, `service_role`, the long `eyJ…` strings) still work during Supabase's transition. New projects should create the publishable and secret keys and use those. If a project only has legacy keys, set the publishable variable to the anon key and the secret variable to the service-role key until the new keys exist. Do not commit either.

The secret key is read in `lib/supabase/admin.ts`, which imports `server-only`. A CI check fails if that variable name appears in `app/` or `components/`.

## Local application

Once Phase 1 has scaffolded the app:

```
npm install
cp .env.example .env.local
npm run dev
```

Phase 1 runs without the Supabase variables. Authenticated routes start working in Phase 3, after Phase 2 has a database.

Scripts the repository will provide:

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js dev server. |
| `npm run build` | Production build. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm run lint` | ESLint. |
| `npm run test` | Vitest. |
| `npm run test:e2e` | Playwright, from Phase 3. |

## Local database

Preferred path, because it tests migrations from an empty database:

1. Install Docker.
2. Install the Supabase CLI.
3. From the repo, `npx supabase init` if `supabase/config.toml` is not already present. Phase 2 commits that file.
4. `npx supabase start`.
5. `npx supabase db reset`. This applies `supabase/migrations` in order and then `supabase/seed.sql`.
6. Copy the local URL and publishable key from `npx supabase status` into `.env.local`.
7. Generate types:

```
npx supabase gen types typescript --local > types/database.ts
```

Local auth mail is captured by the Supabase stack. Use that inbox for signup verification. Do not point local development at the production project.

If Docker is not available, create a Supabase project named `polymath-dev`, link it, and run:

```
npx supabase link --project-ref <dev-ref>
npx supabase db push
```

`db push` applies migrations and does not run `supabase/seed.sql`. That is what we want for any hosted database. Demo data stays on the local CLI stack.

## Hosted Supabase

Do this once for `polymath-dev` and again, separately, for `polymath` production.

1. Create the project in the Supabase dashboard. Choose a region close to the first members. `ap-south-1` is the right default for an India-first launch.
2. Create a publishable key and a secret key. Leave the legacy keys unused if the new ones exist.
3. Apply migrations with `npx supabase db push` from a clean `main`, not by pasting SQL into the editor. The editor is reserved for the one-time admin bootstrap below.
4. Generate types against that project when local Docker is unavailable:

```
npx supabase gen types typescript --project-id <ref> > types/database.ts
```

5. Authentication → Providers → Email. Enable email and password. Enable email confirmation.
6. Set the site URL and the redirect allow-list.

Local:

```
http://localhost:3000
http://localhost:3000/auth/callback
```

Production, once the Vercel domain exists:

```
https://<project>.vercel.app
https://<project>.vercel.app/auth/callback
```

Add the custom domain to this list when one exists. Do not use a wildcard redirect.

7. Authentication → URL configuration. Site URL is `NEXT_PUBLIC_SITE_URL` for that environment.
8. Google provider: leave it off until a Google OAuth client exists. When it is turned on, the authorized redirect URI is the Supabase callback (`https://<ref>.supabase.co/auth/v1/callback`), and the app's `/auth/callback` is already on the Supabase redirect allow-list. The application code will be ready before the provider is enabled.
9. Storage buckets are created by the migration, not by hand. Confirm `avatars`, `project-covers`, `post-media`, and `community-images` exist and that the size limits match `DATABASE_SCHEMA.md`.
10. Before any public launch, configure custom SMTP. Supabase's built-in mailer is rate-limited and is not a production mail path.

### First admin

The app cannot promote anyone. After the founder has signed up and the profile row exists, run this in the SQL editor of that project, once:

```sql
insert into public.admin_roles (user_id, role)
select id, 'admin'
from public.profiles
where username = '<founder-username>';
```

Confirm one row. There is no insert policy for signed-in users, so this statement succeeds only as the dashboard's privileged connection.

## GitHub

Phase 1 initializes git only when you ask for a commit, or as part of the first commit you request. The repository should contain:

- this documentation
- the application, as phases land
- `.gitignore` that excludes `.env`, `.env.local`, `.env.*.local`, `.vercel`, `node_modules`, and `.next`
- `.env.example` with empty values
- `supabase/migrations`
- a GitHub Actions workflow that runs `npm run typecheck`, `npm run lint`, and `npm run test` on pull requests

It should not contain environment files, the secret key, or a production database dump.

Remote hosting is GitHub. Vercel deploys from that remote. Push only when you ask.

## Vercel

1. Import the GitHub repository.
2. Framework preset: Next.js. Root directory: the repo root. Install command: `npm install`. No monorepo.
3. Set the environment variables for Preview and for Production separately. Preview points at `polymath-dev`. Production points at the production Supabase project. `ALLOW_DEMO_CONTENT` is absent in both.
4. `NEXT_PUBLIC_SITE_URL` on Production is the Vercel URL at first (`https://<project>.vercel.app`). Change it when a domain is attached, and update the Supabase redirect list in the same change.
5. Deploy Production from `main`.
6. Add the deployed origin to Supabase redirect URLs before testing signup.
7. Enable Vercel Analytics in the project. It is cookieless and does not receive profile content. Do not add a marketing pixel.

Node.js version on Vercel should match what Next.js 16 supports. Do not pin an older Node than the framework asks for.

### Production checklist

Run this against the real production URL. Check the item only after watching it succeed. A local pass does not check the item.

- [ ] Production deploy is green.
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the publishable key, and `SUPABASE_SECRET_KEY` is set only on the server.
- [ ] View source or the browser bundle and confirm the secret key is absent.
- [ ] Signup email arrives, the link returns to `/auth/callback` on the production origin, and the session survives a refresh.
- [ ] Password reset returns to the same origin.
- [ ] Onboarding completes and the member lands on an empty feed with a real next step.
- [ ] A public project is readable while signed out.
- [ ] A private project is not readable by another member or by `anon`. Confirm in the network response, not only in the UI.
- [ ] A contribution request is invisible to a third member.
- [ ] Notifications for member A are invisible to member B.
- [ ] A non-admin opening `/admin` is rejected by the server.
- [ ] The founder can open `/admin` after the bootstrap SQL.
- [ ] Avatar upload accepts a JPEG and rejects an SVG and an oversized file.
- [ ] A private project cannot receive a public cover.
- [ ] An opportunity without a deadline does not display an invented date, and its official URL is the one that was entered.
- [ ] Demo rows are absent.
- [ ] Suspended member cannot publish.
- [ ] `npm run build` matches the deployed commit.
- [ ] Custom SMTP is configured before inviting anyone outside the founding group.
- [ ] Supabase backups are enabled on the production project.
- [ ] Redirect URLs list the exact production origin and no unused preview wildcards.

## Custom domain

When you have one: add it in Vercel, set it as the production domain, change `NEXT_PUBLIC_SITE_URL`, add the origin and `/auth/callback` to Supabase, and redeploy. No application code change is required beyond the environment variable.

## Rollback

- Application: redeploy the previous Vercel deployment. Database migrations are forward-only. A bad migration is repaired by a new migration, not by editing an applied file.
- If a migration breaks production, restore the Supabase point-in-time backup first, then fix the migration history so the repaired database and the repo agree. Do not run `db push` again until they agree.
- Secrets: rotate the secret key in the Supabase dashboard, update Vercel, redeploy. Then revoke the old key.

## Health

`app/api/health/route.ts` returns `{ ok: true }` without touching the secret key. It may run a `select 1` through the user-scoped client so a bad URL fails the check. It returns no row data.

## What "deployed" means

The application is deployed when the production checklist has been run against the production URL and the failures found in that run have been fixed. Until then, docs and a green preview do not count.
