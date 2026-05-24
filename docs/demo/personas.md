# Demo Personas

Phase 5A creates synthetic `.test` personas for the multisite sales demo. Credential values are not documented here; use the ignored local or remote credential file generated under `.secrets/demo-staff-logins-*.json` or `.secrets/demo-remote-staff-logins-*.json`.

| Persona | Fake email | Role | Scope | What to demo |
| --- | --- | --- | --- | --- |
| Priya Platform | platform.admin@demo-staff.capstone.test | Platform Admin | Platform-wide | Platform/system visibility across the fake district and all sites. |
| Owen District | org.admin@demo-staff.capstone.test | Organization Admin | Desert Valley School District | Organization-level access to all three school sites. |
| Avery Administration | admin.desert-valley-high@demo-staff.capstone.test | Administration | Desert Valley High School | Primary-site dashboard, student directory, readiness, mentor, presentation, and archive operations. |
| Camden Career | admin.canyon-ridge-career@demo-staff.capstone.test | Administration | Canyon Ridge Career Academy | Secondary-site proof that the product is not single-school only. |
| Valeria Viewer | viewer.desert-valley-high@demo-staff.capstone.test | Viewer | Desert Valley High School | Read-only operational visibility for primary-site data. |
| Primary IT Program Teacher | teacher-it-01@demo-staff.capstone.test | Program Teacher | IT program | Program teacher dashboard, review queue, submitted work, evidence, and revision loops. |
| Primary Mentor | mentor001@demo-staff.capstone.test | Mentor | Assigned students | Mentor dashboard with assigned students only. |
| Student route proof | demo-student.capstone.test students | Student | Own record only | Student self-service and scoped route proof. Student sign-in credentials are not created in Phase 5A. |

## Search Targets

Use these predictable student name prefixes in demos and proof checks:

| Search prefix | Story bucket | Demo use |
| --- | --- | --- |
| Model Excellent Demo | Model excellent students | Approved work, substantial evidence, mentor meeting, presentation readiness, archive readiness. |
| Missing Mentor Demo | Missing mentor students | Students needing mentor assignment support. |
| Awaiting Review Demo | Submitted awaiting review | Program teacher review queue. |
| Revision Loop Demo | Revision requested | Feedback loop and status history. |
| Presentation Pending Demo | Presentation pending | Presentation operations and outline status. |
| Archive Ready Demo | Archive ready | Archive/export readiness. |
| Archive Failed Demo | Archive/export failed | Failed export/provider-unavailable recovery story. |
| High Risk Demo | Stale/high-risk students | Risk scan for stale or incomplete work. |
| Rich Timeline Demo | Rich timeline students | Evidence, comments, reviews, mentor meetings, presentations, and archive records in one drill-down story. |
