# ADR-0001: Cloudflare Stack, Auth, Database, And Private Upload Foundation

Status: accepted; partially refined by `D-2026-05-18-019`

Date: 2026-05-18

Owner lane: rebuild

Human decision link: `HD-2026-05-18-001`

## Context

The project cannot become a functional hosted Capstone Project app until the foundation exists for:

- Hardened usernames/passwords for the MVP pilot because district SSO is not available yet.
- User groups, cohorts, and role assignments.
- Student, mentor, program teacher, admin, and misc admin roles.
- Least-privilege authorization.
- Private upload/evidence storage through Google Drive for the MVP pilot.
- Database-backed progress updates, submissions, reviews, approvals, comments, status history, announcements, deadlines, exports, and audit events.
- Server-trusted dashboard aggregates.
- GitHub-connected Cloudflare deployment, environment variables, secrets, backup/export, custom domain readiness, and local development.

The current repo still contains the original static guide shell. It has no production app scaffold, managed auth, database, private file storage, migrations, API layer, tests, CI, or deployment pipeline.

## Accepted Decision

Use this as the revised default implementation path unless later implementation evidence forces a superseding ADR:

- App framework: TypeScript app deployable through GitHub to Cloudflare Workers/Pages.
- Runtime/API: Cloudflare Workers.
- Database: Cloudflare D1. The first remote database is `senior-capstone-db` (`3141d9ac-08b7-49c1-92ba-bbf50c1a611f`).
- Private upload storage: Google Drive evidence repository for MVP, with D1 metadata and access state. R2 is a future fallback only if enabled and approved.
- Auth: hardened username/password flow behind an app-owned interface. School SSO remains a future swap-in if it becomes available.
- Authorization: server-enforced roles, groups, cohort/program assignments, and least-privilege permission checks for student-own records, assigned mentor records, program/cohort teacher records, admin records, and narrow misc admin permissions.
- ORM/migrations: Drizzle, Prisma, or Cloudflare-native migration tooling after the rebuild lane compares fit with D1/R2 and permission workflows.
- Deployment: GitHub-connected Cloudflare Workers/Pages with preview and production environments.
- Custom domain: Bryan will purchase a domain; rebuild should document DNS/cutover steps when the Cloudflare deployment is ready.
- Testing: unit tests for permissions and workflow transitions, integration tests for submission/review/evidence access, and smoke tests for role dashboards.

## Why This Direction

Bryan has stated the hosting goal is GitHub to Cloudflare Workers with a future purchased domain. The MVP should align the architecture with that target instead of treating Cloudflare as a later migration.

The core risk is security and data integrity. The app needs a real database, account/group model, role-scoped access, private evidence artifacts, progress updates, audit logging, and trusted dashboard metrics before visual polish can be called product progress.

The alternative is keeping the earlier Supabase/Vercel recommendation. That may still be technically easier for auth/database/storage, but it conflicts with the revised Cloudflare deployment goal and should now be treated as a fallback or superseding decision only if Cloudflare security/account requirements prove unsuitable.

## Open Questions

- Which Google Drive folder ID should be the evidence repository root?
- Which bootstrap secret and first admin credentials should be used for the first admin account?
- Are student emails available and allowed for account identity?
- What file types and maximum upload sizes should the pilot allow?
- Are there district restrictions on third-party storage for student records?
- Who can provision secrets and production environment variables?
- What D1/Google Drive backup, export, retention, and incident-response process is acceptable for student records?

## Implementation Acceptance Criteria

This ADR is accepted. The rebuild lane should now satisfy these implementation checks:

- Record local setup, environment variables, and deployment assumptions.
- The schema plan includes users, groups, memberships, roles, programs, cohorts, mentor assignments, requirements, progress records, submissions, evidence artifacts, reviews, comments, announcements, status history, audit events, exports, and deadlines.
- Permission tests are planned for student-own access, assigned mentor access, program/cohort teacher access, admin access, misc admin narrowing, and unauthorized denial.
- Private upload access, deletion/replacement rules, signed URLs, retention, archive/export, and audit events are explicitly addressed.
- GitHub-to-Cloudflare preview and production deployment steps are documented.

## Consequences

- Rebuild should prioritize stack acceptance and scaffold over broad UI/doc polish.
- Figma and Canva can continue improving implementation-ready specs and supporting visuals, but rebuild should not claim app functionality until this foundation is created and tested.
- Weekly deep audits should keep this as a P0 issue until accepted or superseded.
