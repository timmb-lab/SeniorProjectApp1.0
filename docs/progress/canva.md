# Canva Progress

This lane log preserves Canva visual-system work, asset IDs, handoffs, verification notes, and next slices. The Canva automation should append here after each run.

## 2026-05-17 Proposal Approval Process Strip

Automation:
- `senior-capstone-canva-visual-system`

Visual slice:
- Proposal approval process strip.

Canva artifact:
- Canva folder: `FAHJ-n-VqFE`
- Primary asset: `DAHJ-v7TOM8`
- Format note: no-text visual, `1600x500`
- Palette source: `styles.css`

Purpose:
- Provide a single visual anchor for the proposal review and approval path.
- Support onboarding and empty states around the student proposal workflow.
- Help students understand the movement from proposal submission to review, revision, and approval without baking workflow labels into an image.

Audience and placement:
- Student proposal dashboard empty states.
- Teacher proposal review queue empty/help states.
- Figma/rebuild can use it as a supporting visual in proposal workflow surfaces, with all app labels and status text rendered as live UI text.

Acceptance check:
- In-app labels remain live text.
- Alt text is present wherever the visual is embedded.
- Illustration does not include staff names or real student data.
- Contrast remains acceptable at small sizes.

Known unresolved decision:
- Final status labels still need to be finalized.
- Product/design should decide whether the flow should show a hard split between `Revision requested` and `Approved`, or only a loop-back revision arrow.

Handoff packet:
- Consumer lane: Figma and core rebuild.
- Artifact/spec: `docs/visual-assets/canva-asset-specs.md`, asset `DAHJ-v7TOM8`.
- Exact next action: design/build proposal dashboard empty-state family using live text labels and this no-text visual as support.
- Acceptance check: empty states distinguish no proposals yet, filtered out, waiting on review, and revision requested without implying a student has completed work they have not submitted.
- Known limits: visual ID came from the Canva automation memory line; no local exported image file is present in the repo yet.

Next Canva slice:
- Proposal dashboard empty-state family: no proposals yet, filtered out, waiting on review, revision requested.

## 2026-05-18 First-Pass Visual System

Automation:
- Manual Canva kickoff for future `senior-capstone-canva-visual-system` runs.

Master-plan section:
- Product Destination
- North Star Workflow
- First Real Vertical Slice
- Lane Responsibilities

Logs referenced:
- `docs/master-plan.md`
- `docs/automation-memory.md`
- `docs/progress/run-log.md`
- `docs/progress/handoffs.md`
- `docs/progress/decision-log.md`
- `docs/automation-backlog.md`

Canva folder:
- `FAHJ-8DxQyk`
- `https://www.canva.com/folder/FAHJ-8DxQyk`

Editable designs created:
- `DAHJ-3dKnPU` - workflow infographic, 1 page, `800x2000`, edit `https://www.canva.com/d/C-dVNnTDKRODcKi`, view `https://www.canva.com/d/tfRo2Sq_1JHu0zu`.
- `DAHJ-xaMuj8` - visual-system report, 7 pages, `794x1123`, edit `https://www.canva.com/d/NXZGwxgXRKYnTPc`, view `https://www.canva.com/d/MA6S4b_xAC69y1C`.
- `DAHJ-6LVuME` - program identity poster, 1 page, `1588x2246`, edit `https://www.canva.com/d/J9nRXQPXi0O-_hM`, view `https://www.canva.com/d/2FoRYnzFDrZAHqc`.

Verification:
- Canva folder creation returned success.
- All three designs were created from generation candidates and moved to the folder.
- Canva page metadata was fetched for all three designs.

Handoff packet:
- Consumer lane: Canva.
- Artifact/spec: `docs/visual-assets/canva-first-pass.md`, `docs/visual-assets/canva-asset-specs.md`.
- Exact next action: refine the proposal dashboard empty-state family using the workflow infographic and visual-system report as source material.
- Acceptance check: output includes app placement, dimensions, alt text, privacy notes, live-text guidance, and a committed asset registry entry.
- Known limits: generated visual content still needs human/design QA for exact copy, contrast, and whether any text should be removed from images.

Next Canva slice:
- Proposal dashboard empty-state family.
