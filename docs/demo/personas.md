# Demo Personas

Phase 5A creates synthetic `.test` personas for the Desert Valley School District multisite sales demo. Credential values are not documented here; use the ignored local or remote credential file generated under `.secrets/demo-staff-logins-*.json` or `.secrets/demo-remote-staff-logins-*.json`.

| Persona | Fake email | Role | Scope | What to demo |
| --- | --- | --- | --- | --- |
| Priya Global | platform.admin@demo-staff.capstone.test | Global Admin | Global | Full fake-district visibility and security tooling; not the primary Program Teacher demo role. |
| Avery Administration | administration.desert-valley-high@demo-staff.capstone.test | Administration | Desert Valley High School | Read-only/oversight primary-site visibility without Global Admin security tools. |
| Sam Site Admin | admin.desert-valley-high@demo-staff.capstone.test | Site Admin | Desert Valley High School | Primary-site operations and access management where permitted. |
| Camden Career | admin.canyon-ridge-career@demo-staff.capstone.test | Site Admin | Canyon Ridge Career Academy | Secondary-site proof that the product is not single-school only. |
| Nia Technical | admin.north-valley-tech@demo-staff.capstone.test | Site Admin | North Valley Technical High School | Third-site proof that the product is not single-school only. |
| Valeria Viewer | viewer.desert-valley-high@demo-staff.capstone.test | Viewer | Desert Valley High School | Read-only operational visibility for primary-site data. |
| Primary IT Program Teacher | teacher-it-01@demo-staff.capstone.test | Program Teacher | IT program | Program teacher dashboard, review queue, submitted work, evidence, and revision loops. |
| Primary Mentor | mentor001@demo-staff.capstone.test | Mentor | Assigned students | Mentor dashboard with assigned students only. |
| Student route proof | demo-student.capstone.test students | Student | Own record only | Student self-service and scoped route proof. Student sign-in credentials are not created in Phase 5A. |

For the next staff/admin/teacher click-around, use [Program Teacher Demo Handoff](program-teacher-demo-handoff.md) as the guided Program Teacher path.

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
