# Weekly Readiness And Dependency Cadence

Date: 2026-06-14

Use `npm run readiness:weekly` before the weekly pilot-readiness review. Use `npm run readiness:weekly -- --full` when the machine has enough time to run the full test and typecheck ladder from the report script.

## Local Gates

- Permission role matrix: Program Teacher stays program/cohort scoped and does not gain global security powers; mentors stay assigned-student only.
- Mutation origin coverage: POST and DELETE mutation routes use the shared same-origin guard.
- Workspace URL state: review, student detail, mentor focus, presentation, audit, archive, and operations links restore only bounded filters.
- Workspace accessibility contract: navigation, disclosures, filters, review decisions, upload progress, and mobile breakpoints keep stable accessible markers.
- Workspace error-state contract: major sections and common action failures keep user-safe recovery messages for sign-in, access, missing records, conflicts, rate limits, provider outages, and server failures.
- Workspace mobile contract: critical student, mentor, Program Teacher, site, viewer, and Users & Access surfaces keep stacked-layout and tap-target guards for small screens.
- Production surface scan: public UI and docs must not expose token-shaped values, Drive storage IDs, setup credentials, private keys, or internal QA links.

## Dependency Cadence

- Weekly: run the readiness command, note Wrangler, Workers types, and TypeScript versions in the review notes, and only update one dependency family at a time.
- Before pilot: run `npm run typecheck`, `npm run test`, `npm run check`, and any hosted proof gate that has approved fake `.test` credentials.
- After a dependency update: rerun upload, auth, permission, review, archive, and workspace focused tests before trusting the general check result.
- Do not update Cloudflare, SSO, storage, or credential delivery behavior in the same change as a dependency bump unless the release note explains the dependency requirement.

## Hosted And Browser Proof

Hosted and mobile screenshot checks are not marked complete by this local command. The local mobile contract catches obvious responsive regressions, but real screenshot proof stays skipped until an approved hosted runtime and fake `.test` credentials are available.
