# Workspace UI Polish Screenshot Index

Date: 2026-06-30

Environment: local Pages proof by default (`npm run prove:workspace-ui-polish`). A caller may set `WORKSPACE_UI_POLISH_BASE_URL`, but the claim boundary stays fake-account UI proof only.

Proof status: `GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF` when `docs/progress/runs/2026-06-30-workspace-ui-polish-browser-proof.json` has no failures.

Manifest: `docs/progress/runs/2026-06-30-workspace-ui-polish-browser-proof.json`

Screenshot directory: `docs/sales/screenshots/2026-06-30-ui-polish/`

## Claim Boundary

These screenshots prove local fake-account demo UI state only. They do not prove real-student pilot readiness, FERPA certification, SSO readiness, support readiness, retention readiness, or district policy approval. Real-student pilot remains **NO-GO** until the required pilot blockers have actual proof.

`student_archive_manifest_download` remains a future/not-ready pilot item unless a later hosted proof explicitly shows a scoped student manifest download is available and safe.

## Screenshots

| File | Persona | Role | Account type | Viewport | What the screenshot proves | Caveat |
| --- | --- | --- | --- | --- | --- | --- |
| `docs/sales/screenshots/2026-06-30-ui-polish/01-admin-console-global-admin-desktop.png` | Global Admin | `admin` | Fake `.test` demo staff account | 1920x1080 | Admin Console opens with a clear operating order before setup, access, audit, or safety tools. | Local fake-account UI proof only. |
| `docs/sales/screenshots/2026-06-30-ui-polish/02-workspace-site-admin-desktop.png` | Site Admin | `site_admin` | Fake `.test` demo staff account | 1440x900 | Daily Workspace shows site status and separates setup work into Admin Console. | Local fake-account UI proof only. |
| `docs/sales/screenshots/2026-06-30-ui-polish/03-program-teacher-workspace.png` | Program Teacher | `program_teacher` | Fake `.test` demo staff account | 1440x900 | Program Teacher lands on review-first program work and scoped student context. | Local fake-account UI proof only. |
| `docs/sales/screenshots/2026-06-30-ui-polish/04-mentor-workspace.png` | Mentor | `mentor` | Fake `.test` demo staff account | 1440x900 | Mentor starts from assigned-student support rather than broad admin controls. | Local fake-account UI proof only. |
| `docs/sales/screenshots/2026-06-30-ui-polish/05-viewer-read-only-workspace.png` | Viewer | `viewer` | Fake `.test` demo staff account | 1440x900 | Viewer sees a read-only Student Directory boundary. | Local fake-account UI proof only. |
| `docs/sales/screenshots/2026-06-30-ui-polish/06-student-workspace-desktop.png` | Student | `student` | Fake `.test` demo student account | 1440x900 | Student sees a plain-language Senior Project dashboard with next-action and completion lanes. | Local fake-account UI proof only. |
| `docs/sales/screenshots/2026-06-30-ui-polish/07-student-phone.png` | Student mobile | `student` | Fake `.test` demo student account | 390x844 | Student first screen stacks safely at phone width. | Local fake-account UI proof only. |
| `docs/sales/screenshots/2026-06-30-ui-polish/08-staff-view-as-student-phone.png` | Site Admin previewing student | `site_admin` | Fake `.test` demo staff account using read-only preview | 390x844 | Staff View as Student keeps the banner and read-only boundary visible on phone. | Local fake-account UI proof only. |
| `docs/sales/screenshots/2026-06-30-ui-polish/09-admin-console-half-screen.png` | Global Admin half-screen | `admin` | Fake `.test` demo staff account | 820x900 | Admin Console operating order stacks without horizontal overflow. | Local fake-account UI proof only. |
| `docs/sales/screenshots/2026-06-30-ui-polish/10-workspace-half-screen.png` | Site Admin half-screen | `site_admin` | Fake `.test` demo staff account | 820x900 | Workspace role path and dashboard remain readable at half-screen width. | Local fake-account UI proof only. |
| `docs/sales/screenshots/2026-06-30-ui-polish/11-drawer-open-phone.png` | Student mobile drawer | `student` | Fake `.test` demo student account | 390x844 | Phone drawer opens with a named Workspace menu and student-safe routes. | Local fake-account UI proof only. |
| `docs/sales/screenshots/2026-06-30-ui-polish/12-drawer-open-half-screen.png` | Site Admin half-screen drawer | `site_admin` | Fake `.test` demo staff account | 820x900 | Half-screen drawer opens without horizontal overflow. | Local fake-account UI proof only. |

## Screenshot Hygiene

- The repeatable script checks expected screen text, visible password values, secret-like rendered text, drawer state for drawer captures, and horizontal overflow.
- The script writes only screenshot metadata, role labels, routes, viewports, checks, and a short text sample. It does not write credential values.
- Fake `.test` account labels and fake demo records may appear in screenshots.
- Upload-heavy hosted evidence proof is intentionally separate from this local UI polish screenshot set.
