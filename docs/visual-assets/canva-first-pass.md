# Canva First-Pass Visual System

Date: 2026-05-18

Master-plan sections referenced:
- Product Destination
- North Star Workflow
- First Real Vertical Slice
- Lane Responsibilities

Folder:
- Name: `Senior Capstone App Visual System - First Pass`
- Folder ID: `FAHJ-8DxQyk`
- URL: `https://www.canva.com/folder/FAHJ-8DxQyk`

Purpose:
- Give the Canva automation a real first-pass asset library for app-supporting visuals.
- Keep Canva focused on supporting visuals, not functional app UI.
- Make future assets easier to evaluate against placement, privacy, live-text, and accessibility rules.

## Created Editable Designs

### Workflow Infographic

Design:
- ID: `DAHJ-3dKnPU`
- Title: `Infographic - Streamlined Student Proposal Submission Workflow`
- Edit URL: `https://www.canva.com/d/C-dVNnTDKRODcKi`
- View URL: `https://www.canva.com/d/tfRo2Sq_1JHu0zu`
- Page count: 1
- Verified dimensions: `800x2000`

Intended app placements:
- Student onboarding.
- Proposal/research workflow help.
- Teacher review queue empty/help state.
- Staff training or weekly update summary.

Implementation rules:
- Treat as a supporting visual.
- Pair with live app text for exact statuses, due dates, and required actions.
- Do not use as the only source of workflow instructions.
- Add alt text wherever embedded.

Suggested alt text:
- "Vertical process infographic showing a senior capstone proposal moving from student submission through private evidence, teacher review, revision or approval, audit trail, and dashboard reporting."

### Visual-System Report

Design:
- ID: `DAHJ-xaMuj8`
- Title: `Report - Premium Visual System Report`
- Edit URL: `https://www.canva.com/d/NXZGwxgXRKYnTPc`
- View URL: `https://www.canva.com/d/MA6S4b_xAC69y1C`
- Page count: 7
- Verified dimensions: `794x1123` per page

Intended app placements:
- Design review reference.
- Canva automation source for follow-up asset families.
- Weekly check-in artifact.
- Internal visual-system rationale.

Implementation rules:
- Use it to guide supporting visuals only.
- Do not treat it as functional app layout.
- Keep role/permission/submission copy live in the app.

Suggested alt text:
- "Seven-page visual-system report describing supporting visual directions for the Senior Capstone app, including program identity, upload states, approval states, empty states, and export collateral."

### Program Identity Poster

Design:
- ID: `DAHJ-6LVuME`
- Title: `Geometric Tiles for CTE Programs Poster`
- Edit URL: `https://www.canva.com/d/J9nRXQPXi0O-_hM`
- View URL: `https://www.canva.com/d/2FoRYnzFDrZAHqc`
- Page count: 1
- Verified dimensions: `1588x2246`

Intended app placements:
- Program overview.
- Program filter empty/help state.
- Public guide support surface.
- Print/export cover or staff orientation material.

Implementation rules:
- Program labels in the app should remain live text.
- Visual program tiles must not imply fixed requirements until database-backed program records exist.
- Use alongside program filters and program-specific requirement records.

Suggested alt text:
- "Poster with abstract geometric tiles representing nine CTE programs for the Senior Capstone app."

## Generated Candidate Sets

Workflow infographic candidates:
- Job: `0eb87091-7373-4d84-889a-27ec72ad3031`
- Created candidate: `dg-29db4fea-d316-4ee4-8c2f-8cc172dc48dd`
- Other candidates: `dg-3096a448-e30c-4339-adbb-d2d4b0270fab`, `dg-a4c42138-6ba8-4faf-8263-1d8ffea9fb0a`, `dg-b388bd36-855c-46c4-b945-924c353054ff`

Visual-system report candidates:
- Job: `c4742cb7-4c21-4b7e-a28d-f1adcf4633e8`
- Created candidate: `dg-20f79c3e-8917-47fd-80b3-dcb257f783b4`
- Other candidates: `dg-7e3f3c59-06bb-4e05-9ed0-6d42642627c2`, `dg-abf81144-ffb7-4c8d-9d6a-8d9b203416e1`, `dg-f68a47fa-68ea-4eb5-a6f0-843f6ccaa651`

Program identity candidates:
- Job: `121d6e46-7820-4313-85ef-73b12878883f`
- Created candidate: `dg-0700545b-4db4-467a-92c4-40c20ade9101`
- Other candidates: `dg-26339482-1ab6-4eab-ab7c-2d7f5c9a25b0`, `dg-7e7195fe-1c01-4354-9696-8682ee115ff1`, `dg-a7899527-8ef7-425f-9c47-e40ce096ebbe`

## Next Canva Slices

Priority order:
1. Proposal dashboard empty-state family:
   - No proposals yet.
   - Filtered out.
   - Waiting on review.
   - Revision requested.
2. Upload/evidence state family:
   - Empty evidence space.
   - Upload failed.
   - Private upload.
   - External link access warning.
3. Archive/export reminder family.
4. Recognition/certificate collateral.

Acceptance checks:
- Each asset/spec includes app placement, dimensions, alt text, privacy notes, and live-text guidance.
- No real student names, staff names, or private records.
- No important instructions exist only inside an image.
- Visuals do not outrun implementation of auth, permissions, private storage, review, and audit.
