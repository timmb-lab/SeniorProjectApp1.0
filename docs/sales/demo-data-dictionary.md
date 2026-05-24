# Demo Data Dictionary

## Claim Labels

- Proven locally: validated by local proof/tests.
- Fake-data demo only: synthetic records for demonstration.
- Hosted fake-data API proof ready: remote D1 migration 0011 and the Phase 13C fake-data seed/proof gate passed; browser persona proof and screenshots remain pending.
- Planned / future: not built or not proven yet.
- Not claimed: do not state as true.

## Fake Organization

| Name | ID | Claim label |
| --- | --- | --- |
| Desert Valley School District | `tenant-desert-valley` | Fake-data demo only |

## Fake Sites

| Site | ID | Fake students | Claim label |
| --- | --- | ---: | --- |
| Desert Valley High School | `site-desert-valley-high` | 250 | Proven locally |
| Canyon Ridge Career Academy | `site-canyon-ridge-career` | 60 | Proven locally |
| North Valley Technical High School | `site-north-valley-tech` | 60 | Proven locally |

## Fake Roles

| Role | Demo persona | Claim label |
| --- | --- | --- |
| Platform admin | Priya Platform | Proven locally |
| Organization admin | Owen District | Proven locally |
| Site Administration | Avery Administration / Camden Career | Proven locally |
| Viewer | Valeria Viewer | Proven locally |
| Program Teacher | Primary IT Program Teacher | Proven locally |
| Mentor | Primary Mentor | Proven locally |
| Student | Fake student records only; no seeded student login credentials | Fake-data demo only |

## Story Buckets

| Story bucket | Search prefix | Demo meaning |
| --- | --- | --- |
| `model_excellent` | Model Excellent Demo | Strong completed capstone story. |
| `missing_mentor` | Missing Mentor Demo | Needs mentor assignment. |
| `awaiting_review` | Awaiting Review Demo | Submitted work waiting for teacher review. |
| `revision_requested` | Revision Loop Demo | Feedback loop and revision state. |
| `presentation_pending` | Presentation Pending Demo | Presentation readiness or outline attention. |
| `archive_ready` | Archive Ready Demo | Closeout/archive-ready student. |
| `archive_failed` | Archive Failed Demo | Archive/export failure story without storage IDs. |
| `high_risk` | High Risk Demo | Stale/high-risk intervention need. |
| `rich_timeline` | Rich Timeline Demo | Full drill-down story with multiple event types. |

## Canonical Statuses

Submission/status values:

- `draft`
- `submitted`
- `under_review`
- `revision_requested`
- `approved`
- `blocked`
- `archived`
- `complete`

Presentation statuses:

- `ready`
- `pending`
- `scheduled`
- `completed`
- `missing`
- `outline_pending`
- `outline_revision_needed`
- `attention_required`

Archive statuses:

- `ready`
- `complete`
- `failed`
- `missing`
- `queued`
- `running`
- `expired`
- `expiring_soon`
- `provider_unavailable`

Risk values:

- `high`
- `medium`
- `low`
- `stale`
- `no_mentor`

## What Is Seeded

- Fake students, staff, mentors, programs, cohorts, and site memberships.
- Fake submissions and progress records.
- Fake evidence metadata using `https://example.com/capstone-demo/...`.
- Fake reviews, comments, status history, and submission versions.
- Fake mentor meetings.
- Fake presentation slots.
- Fake archive/export metadata.
- Fake audit markers where supported.

## What Is Not Real

- Student identities.
- Parent identities.
- School staff identities.
- District data.
- Real Drive files.
- Real student evidence.
- Hosted pilot readiness.
- Legal/security approval.
- FERPA certification.
- Billing/subscription state.

## What Not To Infer

- Do not infer real student performance from fake story buckets.
- Do not infer district adoption or approval.
- Do not infer storage ownership or retention policy.
- Do not infer hosted readiness.
- Do not infer that presentation scheduling or archive retry/export mutations are available in Operations.
