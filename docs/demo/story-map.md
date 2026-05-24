# Multisite Demo Story Map

The Phase 5A seed uses one fake district, three fake sites, and named primary-site student buckets so Bryan can rehearse the same sales story repeatedly without using real student data.

## Sites

| Site | ID | Student count | Purpose |
| --- | --- | ---: | --- |
| Desert Valley High School | `site-desert-valley-high` | 250 | Fully populated primary sales-demo site. |
| Canyon Ridge Career Academy | `site-canyon-ridge-career` | 60 | Secondary site proving multi-site scale. |
| North Valley Technical High School | `site-north-valley-tech` | 60 | Secondary site proving multi-site scale. |

## Primary-Site Story Buckets

| Bucket | Search prefix | Minimum count | Seed behavior |
| --- | --- | ---: | --- |
| Model excellent students | Model Excellent Demo | 3 | Approved/archived work with evidence, mentor activity, presentation/archive readiness. |
| Missing mentor students | Missing Mentor Demo | 10 | Primary-site students intentionally left without active mentor assignments. |
| Submitted awaiting review | Awaiting Review Demo | 10 | Submitted proposal records with evidence awaiting teacher decision. |
| Revision requested | Revision Loop Demo | 10 | Revision-requested submissions with feedback, comments, and status history. |
| Presentation pending | Presentation Pending Demo | 10 | Presentation-stage students with pending or revision-needed outline status. |
| Archive ready | Archive Ready Demo | 10 | Completed students with complete archive export metadata. |
| Archive/export failed | Archive Failed Demo | 5 | Completed students with failed archive export rows and no Drive IDs. |
| Stale/high-risk students | High Risk Demo | 5 | Older high-risk records with missing mentor/evidence pressure. |
| Rich timeline students | Rich Timeline Demo | 3 | Multiple evidence rows, comments, reviews, status history, mentor meetings, presentation slots, and archive records. |

## Proof Expectations

- All demo users use `demo-student.capstone.test` or `demo-staff.capstone.test`.
- Student credentials are not created in Phase 5A.
- Evidence links use `https://example.com/capstone-demo/...`.
- No announcements are created.
- The legacy `announcements` table remains deprecated/schema-only.
- The remote seeder supports the same shape but Phase 5A runs no remote write.
- Phase 7 `/api/site/dashboard` proof uses this shape directly: the primary site returns exactly 250 students, each secondary site returns exactly 60 students, and the primary-site dashboard does not include secondary-site student counts.
- Phase 8 `/api/site/students` proof uses the same shape for the Student Directory: primary site returns exactly 250 total unfiltered matching students, while returned row count respects pagination; each secondary site returns 60 total matching students; and story filters map to stable canonical values such as `model_excellent`, `missing_mentor`, `awaiting_review`, `revision_requested`, `presentation_pending`, `archive_ready`, `archive_failed`, `high_risk`, and `rich_timeline`.
- Phase 9 `/api/site/students/:studentId` proof resolves Model Excellent Demo, Missing Mentor Demo, Revision Loop Demo, Archive Failed Demo, and Rich Timeline Demo students by these display-name prefixes. Detail responses are site-scoped, role-scoped, bounded, and redacted; `/api/site/students/:studentId/timeline` proves multiple safe event types for Rich Timeline Demo.
- Phase 10 `/api/site/review-queue` proof uses submitted and revision-requested story rows for selected-site teacher review. Program teacher queue rows are scoped to the selected site and teacher-visible program, viewer/site-admin views are read-only, and decision mutations for approved, revision-requested, and comment-only outcomes are proven in integration tests.
- Phase 11 `/api/site/mentor-assignments` proof uses Missing Mentor Demo and selected-site no-mentor rows for mentor coverage. The local proof stays non-mutating, while integration tests prove site-admin assignment, duplicate prevention, same-site student/mentor validation, and student detail/directory/dashboard refresh after assignment.
