# Curriculum Framework Integration

Date: 2026-05-18

## Purpose

This document records how the four source PDFs were absorbed into the hosted Capstone Project app framework. The goal is not to recreate the old folder-and-link workflow inside a prettier shell. The goal is to turn the real Senior Project cycle into guided app workflows, private evidence spaces, role-based reviews, dashboards, alerts, exports, and better student work.

The app should make the right action obvious enough that students are led to the next useful step, while staff spend less time hunting links and more time pushing students toward stronger projects.

## Source Files Ingested

Raw extracted text is stored in `docs/source-materials/`, with page boundaries and character counts.

| Source | Extracted text | Pages | Characters |
| --- | --- | ---: | ---: |
| Senior Project Research Proposal Challenge | `docs/source-materials/research-proposal-challenge.txt` | 3 | 7,397 |
| Senior Project Cycle Linked Document | `docs/source-materials/senior-project-cycle-linked-document.txt` | 2 | 5,095 |
| Semester 2 Senior Project Senior Guide | `docs/source-materials/senior-guide.txt` | 3 | 5,213 |
| Semester 2 Senior Project Mentor Teacher Guide | `docs/source-materials/mentor-teacher-guide.txt` | 2 | 2,319 |

The structured app seed file is `data/capstone-framework.json`.

## Core Translation

The PDFs describe a process that currently depends on:

- Students creating their own copies of documents.
- Students moving files into a Senior Project folder.
- Students linking final products into a cycle document.
- Students emailing or sharing work with staff.
- Teachers checking separate links, forms, rubrics, schedules, and attendance records.
- Staff manually figuring out who is missing what.

The hosted app should translate that into:

- Automatic private student workspaces.
- Requirement records seeded from the Senior Project cycle.
- Upload/link evidence spaces per requirement.
- Draft, submitted, under review, revision requested, approved, blocked, and credited statuses.
- Mentor and teacher review queues.
- Meeting attendance and make-up tracking.
- Presentation scheduling and check-out tracking.
- Celebration display evidence and food/ingredient safety checks.
- Reflection collection and final archive/export.
- Dashboards that answer who is stuck, what is missing, who needs review, and which programs need support.

## Required App Workflow

The app must seed and support these requirements:

| Requirement | Due/Timing | Owner/Credit | App translation |
| --- | --- | --- | --- |
| Senior Project workspace | Before cycle work | Admin/program support | Private workspace replaces the old linked-document hub. |
| Resume | October 1 and 2 | English | Upload/link resume with quality checklist. |
| Proposal draft | October 9 and 10 | Program class | Program teacher review gate for feasibility and CTE fit. |
| Approved proposal | November 14 | English, Government, Program | Locked approved proposal version with status history. |
| Research Proposal Challenge | December/January | English | Guided form for problem, solution, evidence, counterclaim, AI-supported revision, final proposal, and why it matters. |
| Mentor Meeting One Plan of Action | January 14, make-up January 16 | Required attendance | Prep notes, proposal copy, attendance, missed-meeting follow-up, and next action. |
| Mentor Meeting Two Outline | February 18 | Program class | Presentation outline approval and presentation time scheduling. |
| Thanks and Thanks | March 24 | English and Government | Thank-you letter submission. |
| Presentation Day | March 26 | English, Government, Program | Slides, presentation time, check-out/check-in, rubric score, and completion status. |
| Celebration Day | March 27 | Program teachers | Display plan, setup photo, rubric, safety/ingredient list when needed. |
| Reflections 1-5 | April 8 and 9 | English and Government | Five separate reflection submissions with evidence where needed. |
| Personal archive/export | May 5 | Student/admin support | Download/export package before district account loss. |

## Research Proposal Challenge As A Quality Engine

The Research Proposal Challenge is the strongest built-in mechanism for improving project quality. The app should treat it as a guided quality gate, not a static worksheet.

App sections:

- Problem and proposed solution.
- Why the project matters personally.
- Three relevant research sources.
- One key quote connected to the project.
- Counterclaim and fact-based refutation.
- Student's own-words solution draft.
- AI feedback as revision support.
- Final version that keeps student voice.
- Why solving the problem matters.

Quality checks should ask:

- Is the problem specific, real, and connected to a clear audience?
- Does the proposed solution describe what the student will actually make, do, teach, build, improve, serve, or demonstrate?
- Are sources relevant enough to prove the problem exists or the solution has promise?
- Does the counterclaim represent a real opposing view?
- Does the refutation use facts instead of only opinion?
- Did AI improve clarity without replacing the student's voice?
- Does the final version state impact beyond vague wellness, awareness, or helping people?

Dashboard signals:

- Missing source count.
- Missing key quote.
- Missing counterclaim/refutation.
- AI feedback present but no final student revision.
- Research submitted but not reviewed.
- Research weak enough to require mentor/teacher intervention.

## Lead-The-Horse Product Rules

The app should be direct and supportive. Students should not have to infer what "good enough" means.

Use these product rules:

- Break long assignments into small required sections with visible completion.
- Make every submission show `What you need`, `What strong work includes`, `What staff will check`, and `What happens next`.
- Show examples and sentence starters without letting students submit generic filler.
- Require specific evidence before students can mark a section ready.
- Warn students when an answer is too vague, too short, missing audience, missing evidence, missing impact, or missing program connection.
- Treat mentor/teacher comments as actionable next steps, not buried notes.
- Show revision requests as a focused checklist.
- Preserve student voice when AI feedback is used.
- Give staff a quick way to flag "this is technically complete but not ambitious enough."
- Use dashboards to surface intervention moments before deadlines collapse.

## Evidence And Upload Model

Every old "link this here" instruction becomes an evidence artifact in the app.

Evidence artifacts must track:

- Owner student.
- Requirement.
- Phase.
- Artifact type: upload, external link, text, image, document, slides, rubric, form response, photo, export.
- Visibility: student, assigned mentor, program teacher, admin, misc permission.
- Review status.
- Created/submitted/approved timestamps.
- File metadata or URL metadata.
- Private storage key for uploads.
- Last checked status for external links.
- Notes about access risk after graduation.

Evidence should support:

- Resume upload/link.
- Proposal draft and approved proposal.
- Research sources and quote.
- Mentor meeting prep notes.
- Presentation outline.
- Presentation slides.
- Celebration setup photo.
- Ingredient list when food is shared.
- Thank-you letter.
- Reflections.
- Final export/archive package.

## Staff Visibility

The app should replace "who turned this in?" guesswork with role dashboards.

Student dashboard:
- Next required action.
- Current phase.
- Missing evidence.
- Feedback and revision requests.
- Approved items.
- Export/archive reminder.

Mentor dashboard:
- Assigned students.
- Meeting one attendance.
- Meeting two outline approval.
- Presentation readiness.
- Students with weak evidence or no recent progress.
- Missed meeting follow-ups.

Program teacher dashboard:
- Proposal draft and final approval queue.
- Students blocked before approval.
- Mentor meeting completion.
- Presentation slots missing.
- Celebration display/photo/ingredient requirements.
- Program-specific evidence gaps.
- Students whose projects are technically complete but not strong enough yet.

Admin dashboard:
- Cohort-wide completion by requirement.
- Program comparison.
- Overdue and missing work.
- Review backlog.
- Missing mentor/program assignments.
- Presentation scheduling conflicts.
- Archive/export completion before May 5.
- Audit-sensitive actions such as overrides, exports, and permission changes.

## Implementation Requirements

The first app build should include:

- A seed loader for `data/capstone-framework.json`.
- Requirement, requirement section, quality check, deadline, and credit-owner records.
- Evidence artifact model that accepts uploads and external links.
- Review gates for proposal draft, approved proposal, research challenge, mentor meeting two outline, presentation, and celebration display.
- Attendance/missed-meeting tracking for mentor meetings.
- Presentation slot and check-out/check-in model.
- Export/archive workflow for May 5.
- Permission tests for private evidence access.
- Dashboard aggregates from server-side state, never client-only state.

## Critical Product Warning

Do not rebuild the old linked document as a static page. That would preserve the paperwork pain.

The app should absorb the logistics and expose the human work:

- Students get guided prompts and visible next steps.
- Mentors get the students who need attention.
- Teachers get review queues and program health.
- Admin gets completion, staffing, scheduling, export, and risk visibility.
- Everyone spends less time chasing links and more time making projects better.
