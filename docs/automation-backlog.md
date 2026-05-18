# Automation Backlog

This file tracks unresolved cross-lane issues for the Senior Capstone rebuild. The content audit automation owns backlog hygiene.

## Status Values

- `open`
- `in-progress`
- `blocked`
- `resolved`

## Severity Values

- `P0`: blocks safe hosted launch or risks student privacy/security/data integrity.
- `P1`: breaks core workflow, role clarity, dashboard trust, or program coverage.
- `P2`: causes confusion, inconsistency, accessibility weakness, or implementation ambiguity.
- `P3`: polish, copy refinement, or future enhancement.

## Items

### SC-001

- `severity`: P1
- `owner`: rebuild
- `status`: open
- `source`: 2026 source-PDF curriculum ingestion
- `affected area`: framework seed loading
- `evidence`: `data/capstone-framework.json` now defines required submissions, due labels, credit owners, review gates, quality checks, staff actions, and dashboard signals, but no app seed loader or schema consumes it yet.
- `next action`: Create the first framework seed loader and minimal tables/types for requirements, sections, quality checks, deadlines, credit owners, and review gates.
- `last updated`: 2026-05-18

### SC-002

- `severity`: P1
- `owner`: figma
- `status`: open
- `source`: Research Proposal Challenge PDF
- `affected area`: student proposal/research workflow
- `evidence`: The source assignment is a guided quality engine. `docs/design/figma-first-pass-product-system.md` now defines the target sections and states, but the actual Figma canvas screen was not built because the Figma Starter MCP tool-call limit blocked writes after file creation.
- `next action`: Build the guided Research Proposal Challenge form in Figma when quota allows, including section-level completeness states, revision feedback, private evidence attachments, and teacher intervention queue.
- `last updated`: 2026-05-18

### SC-003

- `severity`: P1
- `owner`: rebuild
- `status`: open
- `source`: Cycle linked document, senior guide, and mentor teacher guide PDFs
- `affected area`: private evidence/upload/link model
- `evidence`: Source workflow repeatedly asks students to link documents, slides, photos, letters, reflections, and final products, but the hosted app has not yet implemented private EvidenceArtifact storage, external-link metadata, access checks, or review status.
- `next action`: Implement or spec the private EvidenceArtifact model and permission tests before any dashboard relies on submission counts.
- `last updated`: 2026-05-18

### SC-004

- `severity`: P1
- `owner`: rebuild
- `status`: open
- `source`: Senior guide and mentor teacher guide PDFs
- `affected area`: mentor meetings, presentation scheduling, celebration evidence, and archive/export
- `evidence`: The PDFs require mentor meeting attendance/make-up tracking, outline approval, presentation time scheduling, presentation check-out/check-in, celebration setup photo, ingredient lists for food, and May 5 personal archive/export, but these are not implemented yet.
- `next action`: Create implementation slices after SC-001/SC-003 for meeting attendance, presentation slots, celebration evidence, and archive/export workflow.
- `last updated`: 2026-05-18
