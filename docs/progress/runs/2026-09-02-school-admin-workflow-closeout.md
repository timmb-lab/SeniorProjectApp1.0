# School Admin workflow closeout

Date: September 2, 2026  
Hosted app: `https://thecapstoneproject.com/`  
Role checked: School Admin using a fake `.test` account and synthetic school data

## Outcome

The complete School Admin path was reviewed in the browser and repaired from the project workspace through the protected Admin Console. The public app now keeps one canonical browser address, puts everyday project monitoring in Workspace, and keeps account, access, import, and setup work in Admin Console.

No real user data was used. No password reset, account removal, import, template edit, or other hosted record mutation was performed during this walkthrough. The production D1 inspection was read-only.

## What changed

- Project rows now send School Admins to project detail, not the Program Teacher review queue they cannot use.
- Project management actions scroll to the selected project instead of a different row.
- Every section returns to the top when opened, while the public URL remains `https://thecapstoneproject.com/`.
- Today sends School Admins to Assignments with school-monitoring language instead of teacher-decision language.
- Students, staff, and account lists are collapsed and searchable. A live search hides non-matching rows and reports the visible count.
- Current access assignments are collapsed by default so hundreds of records do not overwhelm the page.
- School Admin password-reset entry points are available only for eligible lower-role accounts and explain the boundary before action.
- Students now include their current active program in assignment choices, and the school roster limit is high enough for the hosted synthetic roster.
- Operations, presentation, readiness, assignment, and related admin links open the real working screen instead of a generic guidance panel.
- School Admin reports start with four plain questions. Charts, downloads, and the full readiness dashboard stay behind two clear disclosures. Program Teacher reports remain direct.
- Report downloads state exactly when they cover only the current visible project or student page.
- Password-reset setup codes are brought into view and the copy action receives focus after a successful reset.
- Google Drive templates remain available from Projects, with school-level link management kept in protected tools.

## Hosted walkthrough

Verified on the canonical domain in light and dark views:

- Projects: list and board controls, search, filters, pagination, project detail, project settings, team/adult labels, create/group disclosure, Google Drive templates.
- Work queue: school-safe next steps and assignment routing.
- Reports: question-first summary, optional charts/downloads, optional readiness dashboard.
- Student directory: 252 visible students, filters, paging, student detail, Work, Feedback, Evidence, and Timeline tabs.
- Operations: student-specific operations link opens the real filtered worklist.
- Admin Overview: next setup blocker and setup issue disclosures.
- People: staff and student directories, search, view-only student preview, assignment and reset-password menus.
- Assignments: coverage order, mentor/viewer/program-teacher forms, current access disclosure, recent changes, removal rules, and school boundary copy.
- Imports: downloadable templates, preview-first flow, confirmation boundary, and one-time credential handling.
- Reports in Admin Console: bounded downloads, setup issues, optional supporting numbers, and optional readiness dashboard.
- Account and theme controls: role identity, light/dark choice, and school branding.

The hosted role does not receive Program Teacher approval controls, Global Admin security/audit controls, or cross-school access.

## Verification

- `npm run check`: 597 tests; 593 passed, 4 intentionally skipped, 0 failed.
- `npm run check:production-cutover`: passed every configured source, type, role-permission, hosted evidence, domain, redirect, and production check.
- Post-deploy hosted workspace check: every configured fake role passed its permission proof.
- Final deployment: `https://7f4e59bc.senior-capstone-app.pages.dev` with the canonical custom domain verified separately.

The existing real-student pilot status was not changed by this School Admin usability pass. Policy approvals and real roster evidence are still required before claiming a real-student launch.
