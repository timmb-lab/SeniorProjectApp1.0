# Staff Pilot Onboarding Checklist

Status: draft checklist for a future approved real-student pilot. Do not use with real student data until the go/no-go gate is approved.

## Login Path

- Confirm whether staff use school SSO or approved managed-local accounts.
- Confirm the sign-in URL and support contact.
- Confirm reset-required or password-reset expectations before pilot day.
- Never share setup passwords through unapproved channels.

## Role Expectations

| Role | Can see | Cannot do |
| --- | --- | --- |
| Program Teacher | Assigned program/cohort/site review work and in-scope student detail | Cross program/site scope, manage global users, create elevated admins |
| Mentor | Assigned students and support context | Review unassigned students, manage accounts, approve work outside role |
| Viewer | Assigned student context in read-only mode | Mutate, review, import, assign, schedule, export, or reset passwords |
| Administration | Allowed school/program setup and student/staff context | Become Global Admin, bypass site/program scope, weaken audit controls |
| Site Admin | Assigned-site users, assignments, programs, imports, reports, and audit surfaces allowed to the role | Cross school/site scope, create Global Admin |
| Global Admin | Platform-level oversight through local-account-only admin access | Use SSO as Global Admin or remove the last active local Global Admin |

Global Admin remains a local account; do not convert it to SSO during pilot setup.

## Viewer Read-Only

- Viewer is for monitoring assigned student context.
- Viewer must not mutate student work, reviews, assignments, imports, exports, schedules, or accounts.
- Viewer must not approve, upload, import, assign, schedule, export, or change accounts.
- Report immediately if Viewer sees mutation controls.

## View As Student

- Staff-only and authorization-scoped.
- Use only to understand what an assigned/allowed student sees.
- Do not treat it as a student impersonation tool for edits.
- It must remain read-only and must not open unauthorized students.

## Assignment Checks

- Confirm the current school/site before changing assignments.
- Use the smallest role/scope that lets the person do the job.
- Check mentor, viewer, Program Teacher, Administration, and Site Admin coverage before adding broader access.
- Confirm missing coverage in Admin Assignments before importing more accounts.

## Feedback And Review Workflow

- Program Teacher decisions should be made from the Review Queue or student detail surfaces that are in scope.
- Read prior feedback and proof before saving a decision.
- Do not save broad status changes to work around missing evidence.
- If a student record appears incomplete or wrong, pause and contact the roster/support owner.

## Support Process

- Login issue: contact support owner with role, site, time, and error text.
- Wrong assignment: pause action, confirm current scope, and ask the access owner to correct the smallest assignment.
- Missing student work: confirm roster mapping and workflow status before asking the student to resubmit.
- Possible data exposure: stop, record time and user, and escalate to pilot owner, privacy/data owner, support owner, and technical owner.

## Data Handling Reminders

- Use only approved pilot data.
- Do not paste student data into public docs, screenshots, Figma, Canva, chat tools, or issue trackers unless approved.
- Do not share credentials or setup passwords in screenshots or docs.
- Do not export/archive student records unless that workflow is explicitly in pilot scope and approved.
- Fake-account proof remains fake-account proof; it is not real-student pilot approval.
