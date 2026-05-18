# Human Decision Queue

This file is the durable queue for decisions Bryan needs to make or explicitly accept. Automations should add items here when a decision affects cost, accounts, deployment, privacy, school operations, or long-term maintenance.

Status values:

- `open`
- `recommended`
- `accepted`
- `rejected`
- `superseded`

## Open Decisions

### HD-2026-05-18-001

- `status`: recommended
- `area`: production stack, secure users, database, and private uploads
- `owner`: Bryan with rebuild lane recommendation
- `severity`: P0
- `decision needed`: Choose the production stack for the hosted Senior Capstone app.
- `default recommendation`: Next.js app + Supabase Auth + Supabase Postgres + Supabase Storage + row-level security policies + server-side audit logging, deployed on Vercel or another school-approved host.
- `why this is recommended`: The app needs secure username/password or managed auth, role-based access, private student evidence uploads, database-backed submissions/reviews/approvals, audit logs, and admin dashboards. Supabase gives one coherent path for auth, database, storage, and row-level security, which is faster and safer than hand-rolling these foundations.
- `options`:
  - `A`: Next.js + Supabase + Vercel. Fastest path to secure auth/database/storage with strong local development ergonomics.
  - `B`: Next.js + managed auth provider + managed Postgres + object storage. More configurable, more vendor/account decisions.
  - `C`: Cloudflare Workers/Pages + D1 + R2 + external auth. Strong edge/deployment story, but auth and relational workflow complexity need more design.
  - `D`: Custom server + database + storage. Maximum control, highest maintenance burden.
- `recommended default if Bryan does not override`: Proceed with option A as a proposed ADR and begin scaffold planning around it.
- `impact if delayed`: Rebuild automation can continue producing plans/specs, but cannot honestly implement secure users, permissions, private uploads, reliable dashboards, or audit logs.
- `acceptance check`: `docs/architecture/adr-0001-stack-auth-database-upload.md` is accepted or superseded with a concrete stack, account/provisioning assumptions, local development path, secrets strategy, and security tradeoffs.
- `created`: 2026-05-18

## Accepted Decisions

No accepted human decisions recorded yet.
