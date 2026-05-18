# ADR-0001: Stack, Auth, Database, And Private Upload Foundation

Status: proposed

Date: 2026-05-18

Owner lane: rebuild

Human decision link: `HD-2026-05-18-001`

## Context

The project cannot become a functional hosted Senior Capstone app until the foundation exists for:

- Secure usernames/passwords or managed auth.
- Student, mentor, program teacher, admin, and misc admin roles.
- Least-privilege authorization.
- Private upload/evidence storage.
- Database-backed submissions, reviews, approvals, comments, status history, deadlines, exports, and audit events.
- Server-trusted dashboard aggregates.
- Environment variables, secrets, deployment, backup/export, and local development.

The current repo still contains the original static guide shell. It has no production app scaffold, managed auth, database, private file storage, migrations, API layer, tests, CI, or deployment pipeline.

## Proposed Decision

Use this as the default implementation path unless Bryan rejects or supersedes it:

- App framework: Next.js with TypeScript.
- Auth: Supabase Auth with email/password or school-approved managed login strategy.
- Database: Supabase Postgres.
- Private upload storage: Supabase Storage with bucket policies and signed access patterns.
- Authorization: database-backed roles plus row-level security policies for student-own records, assigned mentor records, program/cohort teacher records, admin records, and narrow misc admin permissions.
- ORM/migrations: Drizzle or Prisma after the rebuild lane compares fit with Supabase/RLS workflows.
- Deployment: Vercel or another approved host compatible with Next.js and school account/secrets requirements.
- Testing: unit tests for permissions and workflow transitions, integration tests for submission/review/evidence access, and smoke tests for role dashboards.

## Why This Direction

Supabase gives one coherent managed path for auth, Postgres, private storage, policies, and audit-friendly data modeling. That directly maps to the app's hardest requirements: protected student records, role-scoped access, private evidence artifacts, and trusted dashboard metrics.

The alternative is stitching together separate auth, database, object storage, policy, and deployment services before any student workflow can be real. That can work, but it slows the first vertical slice and increases integration risk.

## Open Questions

- Which account/organization should own Supabase and deployment resources?
- Is school Google/Microsoft SSO required, or is username/password acceptable for the first pilot?
- Are student emails available and allowed for account identity?
- What file types and maximum upload sizes should the pilot allow?
- Are there district restrictions on third-party storage for student records?
- Who can provision secrets and production environment variables?

## Acceptance Criteria

This ADR can move from proposed to accepted when:

- Bryan accepts the default stack or selects a replacement.
- The rebuild lane records local setup, environment variables, and deployment assumptions.
- The schema plan includes users, roles, programs, mentor assignments, requirements, submissions, evidence artifacts, reviews, comments, status history, audit events, exports, and deadlines.
- Permission tests are planned for student-own access, assigned mentor access, program/cohort teacher access, admin access, misc admin narrowing, and unauthorized denial.
- Private upload access, deletion/replacement rules, signed URLs, retention, archive/export, and audit events are explicitly addressed.

## Consequences

- Rebuild should prioritize stack acceptance and scaffold over broad UI/doc polish.
- Figma and Canva can continue improving implementation-ready specs and supporting visuals, but rebuild should not claim app functionality until this foundation is created and tested.
- Weekly deep audits should keep this as a P0 issue until accepted or superseded.
