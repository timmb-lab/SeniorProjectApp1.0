# V6 Until-3PM Screenshot Index

Status: current V6 local fake-account browser proof captured after implementation slices 01-27.

Manifest: `docs/progress/runs/2026-07-07-v6-until-3pm-browser-proof.json`

Screenshot folder: `docs/sales/screenshots/2026-07-07-v6-until-3pm`

Proof verdict: `GREEN_LOCAL_FAKE_ACCOUNT_UI_POLISH_PROOF`

Claim boundary: local fake-account browser UI proof only. This does not prove hosted readiness or real-student pilot readiness.

Counts:

- Total screenshots captured: 78
- Mobile screenshots captured: 32
- Browser-proof failures: 0
- Started: `2026-07-07T19:51:49.026Z`
- Completed: `2026-07-07T19:59:35.138Z`
- Fake data only: `true`
- Real-student production status: `NOT_CLAIMED_READY`

## V6 Visual Focus

- Mobile first-viewport hardening: `07-student-today-phone`, `30-mobile-mentor-today`, `49-program-teacher-today-phone`, `50-viewer-today-phone`, `51-administration-today-phone`, `52-global-admin-today-phone`.
- Role Today primary routes: `03-program-teacher-workspace`, `04-mentor-workspace`, `05-viewer-read-only-workspace`, `26-administration-workspace-today`, `30-mobile-mentor-today`, `48-site-admin-today-phone`, `49-program-teacher-today-phone`, `50-viewer-today-phone`.
- Role Today de-duplicated secondary cards: `02-workspace-site-admin-desktop`, `03-program-teacher-workspace`, `04-mentor-workspace`, `05-viewer-read-only-workspace`, `30-mobile-mentor-today`, `48-site-admin-today-phone`, `49-program-teacher-today-phone`, `50-viewer-today-phone`, `51-administration-today-phone`, `52-global-admin-today-phone`.
- Student route primary content: `24-student-my-work-desktop`, `43-student-my-work-phone`, `53-student-my-work-half-screen`, `25-student-feedback-desktop`, `54-student-feedback-phone`, `22-student-final-files-state`, `55-student-final-checklist-phone`.
- Student detail record-first framing: `13-site-admin-student-detail-click`, `14-viewer-read-only-detail-click`, `23-student-detail-phone`, `28-student-detail-evidence`, `31-mobile-student-detail`, `41-student-detail-timeline`, `45-mobile-student-detail-evidence`.
- Student detail opened-wording cleanup: `13-site-admin-student-detail-click`, `14-viewer-read-only-detail-click`, `15-view-as-student-entered-desktop`, `28-student-detail-evidence`, `41-student-detail-timeline`.
- Hidden Admin student search and empty-state recovery: `16-view-as-student-exited-return`, `21-empty-student-search`.
- Viewer read-only report and assigned-student framing: `39-viewer-students-directory`, `46-mobile-viewer-students`, `74-viewer-reports-desktop`.
- Demo seed marker cleanup: `13-site-admin-student-detail-click`, `23-student-detail-phone`, `39-viewer-students-directory`, `46-mobile-viewer-students`, `61-site-admin-students-workspace`, `64-administration-students-workspace`, `66-global-admin-students-workspace`; manifest text samples containing `DEMO_SEED` or `seed`: `0`.
- Named admin overflow actions: `17-people-access-landing`, `18-admin-students`, `33-admin-assignments`, `35-admin-reports`, `68-mobile-admin-people`, `69-admin-students-half-screen`, `70-mobile-admin-assignments`.
- Admin People school-facing access copy cleanup: `17-people-access-landing`, `68-mobile-admin-people`; manifest text samples containing `inside the current view`: `0`; manifest text samples containing `global scope`: `0`.
- Admin access summary wording cleanup: `17-people-access-landing`, `18-admin-students`, `68-mobile-admin-people`, `69-admin-students-half-screen`; manifest text samples containing `Allowed roles`, `Not available from this account`, or `Global Admin Not available`: `0`.
- CSV import outcome-first flow: `19-csv-import-template`, `38-mobile-admin-imports`, `76-csv-import-preview-errors`, `77-mobile-csv-import-preview-errors`, `78-csv-import-access-error`.
- CSV import visible-copy cleanup: manifest text samples containing `CSV help`, `Open import tools`, or `Guided setup flow`: `0`.
- Report/export boundary hardening: `29-workspace-reports`, `35-admin-reports`, `42-mobile-admin-reports`, `63-site-admin-reports-phone`, `65-administration-reports-phone`, `67-global-admin-reports-phone`, `74-viewer-reports-desktop`.
- Report/export visible-copy cleanup: manifest text samples containing `current admin view`, `storage links`, or `no IDs`: `0`.
- Report counted-language cleanup: manifest text samples containing `denominator` or `Denominator`: `0`.
- Non-CSV row-jargon cleanup: `35-admin-reports`, `36-admin-audit`, `42-mobile-admin-reports`, `70-mobile-admin-assignments`, `71-mobile-admin-programs`, `72-mobile-admin-audit`; manifest text samples containing `redacted rows`, `review rows`, `open stale rows`, or `assignment rows`: `0`.
- Admin setup visible/current-language cleanup: `17-people-access-landing`, `37-mobile-admin-overview`, `68-mobile-admin-people`, `71-mobile-admin-programs`, `73-mobile-global-admin-overview`; manifest text samples containing `loaded` or `unloaded`: `0`.
- Admin Console primary-surface ordering: `01-admin-console-global-admin-desktop`, `32-admin-console-site-admin-overview`, `35-admin-reports`, `37-mobile-admin-overview`, `42-mobile-admin-reports`, `68-mobile-admin-people`, `70-mobile-admin-assignments`, `71-mobile-admin-programs`, `72-mobile-admin-audit`.
- Role-header meta-copy cleanup: `02-workspace-site-admin-desktop`, `03-program-teacher-workspace`, `04-mentor-workspace`, `05-viewer-read-only-workspace`, `30-mobile-mentor-today`, `39-viewer-students-directory`, `48-site-admin-today-phone`, `49-program-teacher-today-phone`, `50-viewer-today-phone`, `63-site-admin-reports-phone`, `74-viewer-reports-desktop`; manifest text samples containing old screen-construction phrases: `0`.
- Setup task/item wording cleanup: `01-admin-console-global-admin-desktop`, `09-admin-console-half-screen`, `24-student-my-work-desktop`, `35-admin-reports`, `42-mobile-admin-reports`, `43-student-my-work-phone`, `53-student-my-work-half-screen`, `73-mobile-global-admin-overview`; manifest text samples containing `Your work screen opens`, `One focused screen`, `Open the exact setup screen`, `setup screen`, `linked setup screen`, or `setup screens`: `0`.
- Path/source wording cleanup: `02-workspace-site-admin-desktop`, `03-program-teacher-workspace`, `04-mentor-workspace`, `05-viewer-read-only-workspace`, `30-mobile-mentor-today`, `36-admin-audit`, `49-program-teacher-today-phone`, `50-viewer-today-phone`, `72-mobile-admin-audit`; manifest text samples containing old route/source-screen phrases: `0`.
- Chromebook/desktop browser priority: next V6 slices should optimize desktop and compact laptop browser use first; mobile screenshots remain regression guardrails.
- RBAC/read-only guard coverage: `05-viewer-read-only-workspace`, `14-viewer-read-only-detail-click`, `20-student-admin-route-blocked`, `39-viewer-students-directory`, `46-mobile-viewer-students`.

## Full Inventory Source

The complete 78-screenshot inventory, expected text checks, role/persona labels, viewport metadata, and per-screenshot caveats are in the manifest:

`docs/progress/runs/2026-07-07-v6-until-3pm-browser-proof.json`
