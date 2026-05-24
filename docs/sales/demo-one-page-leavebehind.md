# Capstone Project Demo Summary

## Purpose

Capstone Project is a role-scoped operations workspace for senior project visibility. The current demo uses fake data to show how administrators, teachers, mentors, and viewers can see the right capstone information without turning the app into school messaging.

## What Administrators Can See

- Site dashboard for selected-school progress.
- Student directory with story, risk, status, and mentor filters.
- Student detail with evidence, reviews, mentor context, presentation, archive, and timeline.
- Mentor coverage and missing mentor worklists.
- Presentation, archive, and readiness attention worklists.

## What Teachers Can Do

- See scoped program/cohort student work.
- Review in-scope submitted work.
- Approve, request revision, or add comment-only feedback in the Review Queue.

## What Mentors Can See

- Assigned students only.
- Support-oriented student status and next-action context.

## What Students Can Do

- Use self-service paths for their own capstone record where enabled.
- Students do not receive access to site administration routes.

## What It Does Not Replace

Capstone Project does not replace Canvas, Google Classroom, Remind, Infinite Campus, email, district messaging, legal review, district security review, or procurement approval.

## Current Demo Caveat

This is fake-data demo only. It is proven locally, and Phase 13C proved the hosted fake-data API/data gate after remote D1 migration `0011_multisite_site_role_foundation.sql` and the approved remote seed. Browser persona proof and screenshots remain pending.

## Next Step Before Pilot

Run the hosted proof gate: remote migration 0011, remote fake-data seed/proof, hosted smoke proof, screenshot proof, SSO/data ownership review, and legal/security approval before any real student data is used.
