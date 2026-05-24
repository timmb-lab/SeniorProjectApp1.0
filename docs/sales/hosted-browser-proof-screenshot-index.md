# Hosted Browser Proof Screenshot Index

Date: 2026-05-24

Environment: `https://senior-capstone-app.pages.dev`

Proof status: `HOSTED_BROWSER_PROOF_READY_WITH_CAVEATS`

Credential path: `EXISTING_FAKE_HOSTED_CREDENTIALS_USED_FOR_BROWSER_PROOF`

Screenshot hygiene: `SCREENSHOTS_GENERATED_SAFE`

No-secret confirmation: screenshots were inspected for visible passwords, `.secrets` content, Cloudflare tokens, OAuth secrets, raw D1 tables, raw Drive IDs/storage IDs, and credential files. None were observed. Some fake `.test` persona identifiers and fake demo student identifiers may be visible.

## Screenshots

| File | Persona | Screen | Proof status | Caveats |
| --- | --- | --- | --- | --- |
| `docs/sales/screenshots/2026-05-24/01-sign-in-product-shell.png` | Signed-out hosted workspace | Sign-in/product shell | Safe screenshot captured | No password fields contain values. |
| `docs/sales/screenshots/2026-05-24/02-site-admin-dashboard.png` | Existing fake hosted admin fallback | Site Dashboard / Administration surface | Browser navigation proven with caveats | This is the existing hosted fake admin path, not a generated remote `site_admin` credential. |
| `docs/sales/screenshots/2026-05-24/03-student-directory.png` | Existing fake hosted admin fallback | Student Directory | Browser navigation proven with caveats | Rich Timeline search was executed; viewport capture emphasizes the loaded directory shell. |
| `docs/sales/screenshots/2026-05-24/04-student-detail-rich-timeline.png` | Existing fake hosted admin fallback | Student Detail / Timeline | Browser navigation proven with caveats | Browser proof verified the detail drawer and timeline section; viewport capture emphasizes the loaded student section. |
| `docs/sales/screenshots/2026-05-24/05-review-queue-program-teacher.png` | Existing fake hosted program teacher fallback | Review Queue | Browser navigation proven with caveats | Decision controls were verified in-browser without clicking or saving a decision. |
| `docs/sales/screenshots/2026-05-24/06-mentor-assignments.png` | Existing fake hosted admin fallback | Mentor Assignments | Browser navigation proven with caveats | Missing Mentor filter was executed; no assignment mutation was submitted. |
| `docs/sales/screenshots/2026-05-24/07-operations-readiness.png` | Existing fake hosted admin fallback | Operations / Archive Failed | Browser navigation proven with caveats | Archive Failed story filter was verified in-browser. |
| `docs/sales/screenshots/2026-05-24/08-operations-presentation-pending.png` | Existing fake hosted admin fallback | Operations / Presentation Pending | Browser navigation proven with caveats | Presentation Pending story filter was verified in-browser. |
| `docs/sales/screenshots/2026-05-24/09-mentor-assigned-students.png` | Existing fake hosted mentor fallback | Assigned Students | Browser login/navigation proven with caveats | Mentor fallback account rendered no-active-assignment state, so assigned-student rows were not proven. |

## Not Captured

- Viewer read-only screenshot was not generated because the safe existing fake hosted credential file does not include a viewer persona.
- Generated remote staff credentials were not used for screenshots because hosted login still rejects them as invalid credentials.
- Bryan SSO, student login, password screens, Cloudflare screens, `.secrets` files, raw D1 views, and Drive provider screens were not captured.
