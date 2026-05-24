# Functionality UX Upgrade

Automation slug: `functionality-ux-upgrade-hourly`

Recommended cadence: hourly at minute 20 Pacific Time.

Repo: `C:\SeniorProjectApp1.0`

Remote: `https://github.com/timmb-lab/SeniorProjectApp1.0.git`

Branch: `main`

## Purpose

Every hour, perform one bounded, repo-grounded improvement to real app functionality, dashboard depth, role-aware workflows, navigation, empty states, permission messaging, or user-facing language. The goal is to make the Capstone Project workspace feel like a real school-facing application for Site Admins, Administration/AP/Principal users, Viewer/read-only staff, Program Teachers, Mentors, and Students.

This automation is product-readiness focused. It is not a marketing polish lane, a fake-page builder, a broad refactor lane, or a credential/config/deployment lane.

## Required Start

From `C:\SeniorProjectApp1.0`, verify identity before reading broadly or editing:

```powershell
git rev-parse --show-toplevel
git branch --show-current
git remote -v
git status --short --branch
git rev-parse HEAD
```

Continue only when:

- the repo root is `C:\SeniorProjectApp1.0`
- branch is `main`
- origin is `https://github.com/timmb-lab/SeniorProjectApp1.0.git`
- the worktree is clean or only contains files created by this same run

If unrelated dirty files exist, stop with `DIRTY_WORKTREE` and list them. Do not stage, stash, overwrite, or revert user work.

## Required Reading

Read these before choosing work:

- `docs/functionality-language-audit.md`
- `docs/student-progress-dashboard.md`
- `docs/generated/production-route-inventory.md`
- `docs/automation-cadence.md`
- `docs/automation-backlog.md`
- `workspace.html`
- `workspace.js`
- `workspace.css`
- relevant `functions/api/**` and `functions/_lib/**` files for the selected route
- relevant `tests/**` files for the selected area

Use targeted `rg` searches for current repo evidence. Do not infer behavior from file names alone.

## Work Selection

Select exactly one bounded work order from `docs/functionality-language-audit.md` or a newer repo-grounded finding discovered during the run. Prefer the highest-value safe item that is still needed.

Good work orders include:

- home/workspace screen language cleanup
- removing prompt, developer, prototype, scaffold, fake, mock, placeholder, debug, tenant, RBAC, or implementation jargon from normal user-facing UI
- one dashboard card click-through to an existing real section
- one student detail open action from an existing authorized list
- one role-safe filter or search improvement
- one viewer/Admin/AP/principal read-only clarity improvement
- one program teacher workflow improvement
- one mentor assigned-student workflow improvement
- one student next-step or empty-state clarity improvement backed by real data
- one permission/error message improvement
- one verifier/test for user-facing language, dashboard links, student detail rendering, mentor assignment permissions, or empty states

Avoid broad rewrites. Do not continue into a second slice just because the first one was small.

## Product Rules

- Preserve authentication, authorization, tenant isolation, site isolation, program/cohort scope, mentor assigned-student scope, and student privacy.
- Use real existing data and routes.
- Do not fake metrics, records, routes, buttons, links, or workflow completion.
- Do not add `href="#"`, empty links, dead buttons, or cards that imply missing functionality works.
- Make a card clickable only if a real student-safe or staff-safe route/section exists and the current role can use it.
- Keep normal user-facing language simple, direct, school-safe, and non-technical.
- Keep student language friendly, clear, and useful for ELL/IEP students.
- Keep staff/admin language professional and action-oriented.
- Keep Viewer experiences read-only and visibly read-only.
- Keep mentors unable to assign students to themselves or expand access.
- Keep staff-only notes and admin controls hidden from students.

## Forbidden Work

Do not work on:

- marketing-only polish unrelated to app workflow
- pure color/style changes unless they fix functional clarity
- mock or placeholder pages
- auth weakening
- RBAC weakening
- tenant/site/program/student privacy weakening
- dangerous reset/security controls
- secrets, `.env`, `.secrets`, tokens, OAuth, domain/DNS, Cloudflare live config
- remote seed/reset/migration/deploy commands
- real user or credential creation
- broad schema migrations
- broad refactors without direct user value
- unrelated curriculum/content files
- announcements reintroduction
- claims of real pilot readiness or FERPA certification

## Implementation Requirements

For the selected slice:

1. Re-scan the current repo for the specific issue.
2. Identify exact files and routes involved.
3. Confirm the change is still needed.
4. Implement the smallest safe change.
5. Reuse existing helpers/components/styles where practical.
6. Add or update a focused test/verifier when possible.
7. Update `docs/functionality-language-audit.md`, `docs/automation-backlog.md`, or a run log only when the change materially changes the backlog/status.
8. Run the narrowest relevant validation first, then broader checks when user-facing source changes.

## Validation

Use existing package scripts only. Prefer:

```powershell
npm run verify:functionality-language
npm run test
npm run typecheck
npm run check:production-surfaces
npm run check
git diff --check
```

Run commands that exist in `package.json`. Do not invent new commands unless the run adds the matching script.

If validation fails:

- identify the first failing command
- identify the first relevant error
- decide whether the run caused it
- fix if related and safe
- otherwise record it as pre-existing and do not claim a clean pass

## Closeout

Before committing:

```powershell
git status --short
git diff --stat
git diff --check
```

Inspect the final diff manually. Stage only files intentionally touched by the run.

Commit on `main` only when validation is acceptable. Suggested commit message style:

```text
ux: improve role workflow clarity
```

Do not push unless the triggering prompt explicitly asks for a push.

Final response must include:

- repo identity and starting/ending SHA
- selected work order
- files changed
- permission and privacy considerations
- validation commands and results
- commit hash if committed
- blockers or caveats
- next recommended work order
