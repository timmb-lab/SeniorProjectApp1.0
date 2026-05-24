# Administrator Demo Script

## Opening

"Thanks for taking a few minutes. This is a fake-data local demo of Capstone Project. It is designed to show how a school administration team could see senior project progress, teacher review work, mentor coverage, and end-of-project readiness in one role-scoped workspace. This is not real student data, not a FERPA certification claim, and not a hosted pilot claim yet."

## 7-Minute Quick Demo

| Time | Screen | Script |
| --- | --- | --- |
| 0:00-0:45 | Sign in | "I am signing in as school Administration for the fake Desert Valley High School." |
| 0:45-1:45 | Site Dashboard | "This shows who needs attention across the selected school: submissions, risk, mentor coverage, presentation, and archive readiness." |
| 1:45-2:45 | Student Directory | Search `Revision Loop Demo`. "Instead of chasing spreadsheets, administration can filter by story, risk, status, or search." |
| 2:45-3:45 | Student Detail | Open `Rich Timeline Demo`. "This is the student story: evidence, teacher feedback, mentor support, presentation, archive, and timeline." |
| 3:45-4:45 | Review Queue | Switch to `teacher-it-01@demo-staff.capstone.test`. "Teachers see only their scoped work and can review submitted items." |
| 4:45-5:45 | Mentor Assignments | Back as Administration. "This shows missing mentor coverage and lets authorized school staff resolve it." |
| 5:45-6:30 | Operations | Filter `archive_failed` or `presentation_pending`. "This is the closeout list: who is ready, who is blocked, who needs follow-up." |
| 6:30-7:00 | Close | "Everything shown is fake data. Local proof, hosted API/data proof, and hosted browser screenshots are ready with credential caveats." |

## 15-Minute Deeper Demo

| Time | Screen | Script |
| --- | --- | --- |
| 0:00-1:00 | Frame | "This is an operations layer for capstones. It does not replace Canvas, Remind, Google Classroom, Infinite Campus, email, or district messaging." |
| 1:00-2:30 | Site Dashboard | "Desert Valley High School has 250 fake students; the two secondary fake sites have 60 each. The point is selected-site visibility." |
| 2:30-4:00 | Student Directory | Search `Missing Mentor Demo`, then `Revision Loop Demo`. "These story filters let staff quickly find common capstone situations." |
| 4:00-6:00 | Detail / Timeline | Open `Rich Timeline Demo`. "The detail drawer is bounded and redacted; it gives context without exposing raw storage identifiers." |
| 6:00-8:00 | Review Queue | IT teacher. "This teacher can approve, request revision, or add comment-only feedback only for in-scope submitted work." |
| 8:00-10:00 | Mentor Assignments | Administration. "This shows mentor load, missing mentors, and a reason-required assign flow. Reassign/deactivate are not claimed yet." |
| 10:00-12:00 | Operations | Show Presentation, Archive, Readiness. "End-of-project worklists show who is ready to present, ready to archive, or blocked." |
| 12:00-13:00 | Viewer | Viewer persona. "A viewer can inspect the same operational picture without changing records." |
| 13:00-14:00 | Mentor | Mentor persona. "Mentors see assigned students only." |
| 14:00-15:00 | Caveats | "A real pilot needs hosted proof, remote migration/seed gates, SSO/data policy, legal/security review, and no real student data until approved." |

## Story Students To Search

- `Model Excellent Demo`
- `Missing Mentor Demo`
- `Awaiting Review Demo`
- `Revision Loop Demo`
- `Presentation Pending Demo`
- `Archive Ready Demo`
- `Archive Failed Demo`
- `High Risk Demo`
- `Rich Timeline Demo`

## Plain-Language Talking Points

- "This shows who needs attention."
- "This is role-scoped."
- "This uses fake data today."
- "This is not replacing school messaging or Canvas."
- "This is designed around private evidence and audit-sensitive operations."
- "Hosted fake-data API proof is ready after the multisite migration and approved remote seed; hosted browser screenshots are available with viewer/generated-credential caveats."

## Closing Pitch

"The current local MVP shows the shape of a practical capstone operations center: school administration can see the whole selected site, teachers can review scoped work, mentors see assigned students, viewers can inspect read-only, and closeout worklists show presentation/archive readiness. Hosted API/data proof is ready, and hosted browser screenshots are available with credential-path caveats."

## Caveats To Say If Asked

- "No real student data is used today."
- "We are not claiming FERPA certification."
- "We are not claiming production pilot readiness."
- "Hosted browser proof is ready with caveats; viewer browser proof and generated remote staff credential login are still blocked."
- "Archive retry/export and presentation scheduling mutations are future work."
- "Tenant-owned Drive and data retention policies need a technical/legal decision before real onboarding."

## Do-Not-Show Reminder

Do not show `.secrets`, passwords, credential JSON files, Cloudflare tokens, OAuth secrets, raw Drive IDs, raw D1 internals, or browser tabs with sensitive values.

## Fallback Lines

- If hosted/prod is asked: "Hosted fake-data API proof is ready, and hosted browser screenshots are available with viewer/generated-credential caveats."
- If compliance is asked: "This is privacy-aware design and local proof, not a compliance certification."
- If a screen fails: "The current local proof covers the route; I will use the proof checklist and follow up with a clean screen capture."
