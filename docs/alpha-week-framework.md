# Day 7 Alpha Build Framework

Date: 2026-05-18

This is the working framework for the alpha due Sunday, 2026-05-24 PT. Count Monday, 2026-05-18 as Day 1. The target is a full app-flow alpha, not pilot readiness. Production user accounts may remain incomplete, but a reviewer must be able to walk the full Senior Capstone workflow through seeded/demo personas without editing code.

## Alpha Principles

- No real student records, credentials, private evidence, or staff-only notes go into alpha.
- Password reset, invitations, imports, district SSO, and full account hardening stay post-alpha unless they stop the alpha walkthrough. First-admin bootstrap and fake role-account seeding are already complete, but they do not make the alpha pilot-ready for real student records.
- The alpha must clearly label seeded/demo personas and account shortcuts.
- Dashboard, review, progress, evidence metadata, audit, and export states must come from app state, API routes, D1, or another documented server-owned demo-state layer, not static copy.
- Private evidence file bytes can remain incomplete for alpha, but evidence metadata, access states, validation, review linkage, and audit history must work.
- Student-to-student messaging is out of scope.
- Figma is the functional product-design source for route, state, component, permission, and acceptance details. Canva is supporting imagery only.

## Current Foundation

As of 2026-05-18, the repo has:

- Cloudflare Pages project `senior-capstone-app` recorded in `docs/backend-setup.md`.
- D1 database `senior-capstone-db` with migration `migrations/0001_foundation.sql` already applied remotely.
- Google Drive evidence root folder and index sheet recorded in `docs/backend-setup.md` and `docs/artifacts.json`.
- First admin `bryan.timm89@gmail.com` plus four fake `.test` role accounts are seeded in production D1; fake account credentials live only in ignored local `.secrets/`.
- Alpha route `alpha.html`, client state/actions in `alpha.js`, styling in `alpha.css`, D1-backed endpoint `/api/alpha/state`, and state model `functions/_lib/alpha-flow-model.js`.
- Seeded personas for student, program teacher, mentor, admin, and misc admin.
- First runbook in `docs/alpha-runbook.md`.
- Alpha CI/check rail in `.github/workflows/ci.yml`, `tests/alpha-flow.test.mjs`, `scripts/check-alpha-contract.mjs`, and `scripts/check-automation-contract.ps1`.

Current blocker to direct Cloudflare mutation from this Codex session:

- The Cloudflare plugin is discoverable, but the MCP API call currently returns `Auth required`. Repo-side Cloudflare setup should continue; remote mutations need connector reauthorization or a working `wrangler` environment.

## Daily Build Goal

Each day should produce at least two accepted MVP passes when the repo is unblocked:

- First accepted pass: visible app-flow implementation or persistence.
- Second accepted pass: verification, tests, mobile/error states, or deployment evidence for that same app path.
- Stretch pass: Figma, Canva, audit, or docs only when it directly unblocks Day 7 alpha or closes a P0/P1 handoff.

Accepted progress means a pushed commit or published external artifact with validation or an explicit blocker that reduces ambiguity.

## Daily Plan

### Day 1 - Monday, 2026-05-18

Goal:
- Lock alpha scope and account exception.
- Preserve Cloudflare/D1/Google Drive setup records.
- Create the first role/persona alpha shell.
- Seed fake login-capable alpha role accounts without exposing credentials.
- Add the alpha framework, CI/check rail, and closeout discipline.

Done when:
- `alpha.html` can represent student, teacher, mentor, admin, misc-admin, proposal, evidence, review, meeting/presentation, dashboard, and audit states.
- Fake student, teacher, mentor, and misc-admin accounts can log in for smoke checks.
- `npm run check` exists and includes syntax, alpha-contract, and type checks.
- The next pass has a specific D1/server-owned persistence task.

### Day 2 - Tuesday, 2026-05-19

Goal:
- Preserve and re-verify the D1-backed alpha, first-admin bootstrap, and fake account proof on Cloudflare Pages after new commits.
- Stop any deploy/bootstrap ambiguity from leaking into the rest of the week.

Build:
- Pages deployment check for `/alpha.html` and `/api/alpha/state`.
- Bootstrap verification for the first admin account, setup-key removal, and fake role-account login checks.
- Exact blocker record if Cloudflare MCP auth, Wrangler, or Pages deployment is unavailable.

Done when:
- Public or preview alpha route returns the app and API state.
- First-admin bootstrap and fake role-account state are known and documented.

### Day 3 - Wednesday, 2026-05-20

Goal:
- Make the student proposal/evidence path feel like a real workflow.

Build:
- Student dashboard next action, phase, evidence needs, blocked-submit reasons, guided proposal sections, and revision/resubmission flow.
- Evidence metadata validation for URL, title, kind, status, owner, and review linkage.
- Empty, loading, link-check-needed, blocked-submit, upload/provider-unavailable, and access-denied states.

Done when:
- Student can move from revision needed to submitted/resubmitted without code edits.
- Dashboard/audit state changes visibly after each student action.

### Day 4 - Thursday, 2026-05-21

Goal:
- Complete the program teacher review loop.

Build:
- Teacher queue, submission detail, comments, revision request, approval, status history, and dashboard count updates.
- Immutable review history representation.
- Permission checks for program/cohort teacher scope and non-teacher denial.

Done when:
- Student -> teacher review -> revision -> resubmission -> approval can be demonstrated end to end.
- Prior versions and review decisions remain visible in history.

### Day 5 - Friday, 2026-05-22

Goal:
- Add mentor, admin, and misc-admin flow depth.

Build:
- Mentor assigned-student view, meeting attendance/make-up, outline approval cues, presentation slot conflicts, and check-in.
- Admin overview for programs, cohorts, deadlines, templates, audit, exports, and override reason states.
- Misc admin narrow read/reporting view.

Done when:
- Staff/admin roles can inspect the same underlying demo records through correct scopes.
- Broad admin actions are disabled or hidden for misc admin.

### Day 6 - Saturday, 2026-05-23

Goal:
- Harden the walkthrough and deployment proof.

Build:
- Mobile student no-overflow pass.
- Empty/error/permission denied states.
- Export/archive placeholder with scoped authorization language.
- Cloudflare preview deployment attempt or committed blocker with exact error.

Done when:
- Mobile width 390px has no horizontal overflow in the student path.
- A preview URL exists or the deploy blocker is recorded with the next exact action.

### Day 7 - Sunday, 2026-05-24

Goal:
- Finish the alpha acceptance walkthrough.

Build:
- Bug fixes from the walkthrough.
- Known gaps and post-alpha account/security tasks.
- Final acceptance runbook and status entry.

Done when:
- A reviewer can complete the full student -> teacher -> revision/resubmission -> approval -> dashboard/audit loop.
- Mentor, admin, and misc-admin views show scoped, role-appropriate state.
- The repo documents exactly what is mocked, what is server-owned, what is D1-backed, and what remains unsafe for real student data.

## Per-Pass Closeout

Every alpha pass should close with:

- Updated code, docs, run log, rebuild log, and structured run manifest.
- Backlog/handoff movement for `SC-005`, `SC-006`, `H-2026-05-18-006`, or `H-2026-05-18-008` when relevant.
- Validation of JSON/docs plus the strongest runnable alpha check.
- `self-improvement: none` unless a prompt/config repair is directly justified.
- Commit and push with `rebuild:` prefix.

## Sunday Acceptance Checklist

- Student dashboard opens with phase, next action, due items, evidence needs, revision state, and program context.
- Student proposal/research form saves, submits, revises, and resubmits.
- Evidence metadata links to the proposal and has access/failure states.
- Teacher queue opens the submission, comments, requests revision, approves, and updates counts/history.
- Mentor sees assigned-student state, meeting/presentation cues, and scoped actions.
- Admin sees program/cohort, deadlines/templates, audit/activity, export/archive, and override states.
- Misc admin remains narrow and read/reporting oriented.
- Audit/activity history updates after alpha actions.
- Empty, loading, error, permission-denied, upload/evidence failure, revision-needed, approved, and blocked-submit states exist.
- Student path works on mobile without horizontal overflow.
- No real student data is used.
