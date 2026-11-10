# Polymath

Social infrastructure for people who build things. A builder's identity on Polymath is their projects, their progress, their contributions, and the people they build with.

The product name lives in `lib/brand.ts`. The name can change without a sweep through the interface.

## Status

Phase 3 adds email sign-up, confirmation, login, password reset, and onboarding. Google sign-in is visible and switched off. A local Supabase stack is required for those flows.

Accounts are for people aged 13 and older. Age is stored as a band (`13–15`, `16–17`, `18–24`, `25–34`, `35+`), never as a date of birth.

## Run locally

Requires Node.js 24.

```
npm install
npm run dev
```

Open http://localhost:3000. In development, `/dev/ui` reviews the interface primitives. That route returns a 404 in a production build.

```
npm run typecheck
npm run lint
npm run test
npm run test:e2e
```

Read these before implementation:

- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) — audit, phase sequence, deviations, risks, open decisions
- [ARCHITECTURE.md](./ARCHITECTURE.md) — runtime shape, auth, feed ranking, caching, security boundaries
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) — relational model, deletion behaviour, RLS, storage
- [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) — tokens, typography, layout, component rules
- [DEPLOYMENT.md](./DEPLOYMENT.md) — local setup, Supabase, Vercel, production checklist

The application is not deployed. There is no production URL yet.

## Stack

Next.js 16 (App Router) on Vercel. Supabase Postgres, Auth, and Storage. TypeScript strict. Tailwind CSS. shadcn/ui primitives, themed with the Polymath tokens.

Secrets stay in environment variables. Copy `.env.example` to `.env.local` when Phase 2 needs Supabase. Never commit `.env.local`.
