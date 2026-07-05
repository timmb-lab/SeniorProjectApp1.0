# Plain-Language And ESL UI Guidelines

Status: durable product guidance for Capstone Project UI copy. Use this guide when editing Student, Staff Workspace, Admin Console, onboarding, and proof-facing docs.

Purpose: help students and adults understand the next safe action without reading long explanations. Plain language is part of readiness, but it is not policy approval for a real-student pilot.

## Core Rules

1. Put the next action first.
2. Use short sentences.
3. Use the same verb for the same action every time.
4. Explain one task at a time.
5. Use the role name only when it helps the user know who can act.
6. Keep fake/demo/proof wording out of normal student screens.
7. Keep security and permission details out of student copy. Show a calm help path instead.
8. Do not claim Done, Approved, Ready, or Pilot-ready unless the data and approvals support it.

## Student Copy Rules

Student screens should answer three questions:

1. What am I working on?
2. What do I do next?
3. Where do I click?

Use this pattern:

- First line: what happened.
- Second line: what the student should do.
- Button: the action, not the explanation.

Good examples:

- No feedback yet. Your Program Teacher or mentor will leave notes here after they review your work.
- We could not load your capstone right now. Refresh the page or ask your Program Teacher.
- This work needs changes. Open the feedback, fix the note, then send your updated work.

Avoid:

- Your role scope does not include this resource.
- Submission mutation failed.
- Proof script did not hydrate this manifest.

## Staff Copy Rules

Staff screens should help adults support students without turning the page into a permission report.

Use:

- Needs review
- Needs help
- Missing setup
- Recently updated
- Open Student
- Review Work
- View Proof Files
- Add Note
- Manage Assignment

Viewer copy should be calm and explicit:

Read-only access. You can view this student, but you cannot make changes.

Empty states should say what kind of empty state it is:

- No reviews waiting right now.
- No students are assigned to you yet.
- No students match those filters.

## Admin Copy Rules

Admin screens can name setup and policy issues, but the label should still tell an operator what to fix.

Use:

- Missing mentor
- Missing graduation year
- Staff member needs a role
- Program needs a teacher
- Import failed
- Download template
- Check errors

Replace:

| Avoid | Use |
| --- | --- |
| validation failed | Check the highlighted fields. |
| invalid target | This person cannot be assigned here. |
| insufficient scope | You do not have access to change this assignment. |
| provider unavailable | Staff setup is needed. |

Keep real-student readiness caveats in operator docs and proof reports. Do not put long policy language into normal student UI.

## Error-State Rules

Errors should include:

1. What did not work.
2. What to try next.
3. Who can help if it still fails.

Use:

- We could not load this page right now. Refresh the page or ask the support owner.
- We could not save this change. Check the highlighted fields and try again.
- This link is not available to your account. Ask your Program Teacher or support owner.

Avoid:

- Forbidden
- Unauthorized
- RBAC denied
- mutation failed
- invalid scope

## Empty-State Rules

Empty states should be one short sentence plus one action sentence when helpful.

Use:

- No feedback yet. Your Program Teacher or mentor will leave notes here after they review your work.
- No proof files yet. Add proof when your checklist item asks for it.
- No reviews waiting right now. Check again after students turn in work.

Avoid:

- Showing 0 of 0
- Empty dataset
- No matching records for current scope

## Status Labels

Use these labels for student-facing status:

| Data state | Student label | Staff/admin label |
| --- | --- | --- |
| draft | Draft | Draft |
| submitted | Turned in or Waiting for review | Submitted |
| under_review | Waiting for review | Under review |
| revision_requested | Needs changes | Needs revision |
| approved | Approved | Approved |
| complete | Done | Complete |
| pending | Not confirmed yet | Pending |
| missing_evidence | Missing proof | Missing evidence |
| blocked | Ask for help | Blocked |
| setup_needed | Staff setup needed | Setup needed |

## Action Labels

Use these labels when they fit the existing workflow:

- Continue My Work
- View Feedback
- Turn in Work
- Send updated work
- Upload Proof File
- Add proof
- Ask for Help
- Open Student
- Review Work
- View Proof Files
- Add Note
- Download template
- Check errors

Use one action per row when possible. Rows should not need a paragraph to explain which button matters.

## Banned Or Discouraged Student UI Phrases

Normal student screens must not show:

- RBAC
- mutation
- hydration
- manifest
- fake pilot
- proof script
- Forbidden
- Unauthorized
- Showing 0 of 0
- Admin Console
- Staff Workspace
- Submitted Work
- Evidence / Files
- Needs Revision

Staff/admin screens may use staff terms when they name a real workflow. Student screens should use the simpler label.

## ESL And Lower-Reading-Level Tips

- Use common words before school or technical terms.
- Define important terms once.
- Use consistent verbs: open, fix, send, upload, ask.
- Avoid idioms, sarcasm, culture-specific references, and vague phrases like handle this.
- Prefer active voice.
- Keep button text short.
- Put dates and names close to the task they explain.
- Give one next step before showing optional details.

## Readiness And Privacy Rules

- Fake-account proof is not real-student pilot approval.
- Do not say the real-student pilot is ready until manual/policy evidence is complete.
- Do not include real student names in docs, tests, screenshots, or proof files unless the school has approved that use.
- Do not expose secrets, storage IDs, Drive IDs, tokens, setup credentials, or raw audit payloads in UI copy.
- Do not explain permissions to students as security internals. Give the user a help path.

## Before And After Examples

| Before | After |
| --- | --- |
| Submission mutation failed. | We could not send this work. Try again or ask your Program Teacher. |
| Revision requested. | Needs changes. |
| Send revision. | Send updated work. |
| Evidence / Files | Proof Files |
| Showing 0 of 0 records. | No students match those filters. |
| Insufficient scope. | You do not have access to change this assignment. |

## Contributor Checklist

Before committing UI copy:

- Student screens answer what, next, and where to click.
- Empty states use one clear sentence plus one action sentence.
- Error states include a recovery path.
- Student copy avoids banned proof, debug, and staff/admin terms.
- Staff/admin copy names the next safe operation.
- Readiness docs keep fake-account proof separate from real-student pilot approval.
- Tests or proof docs cover the changed surface.
