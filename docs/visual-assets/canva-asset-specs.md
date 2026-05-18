# Canva Asset Specs

This registry tracks Canva-created or Canva-specified assets that should support the hosted app. Assets here are not the product by themselves; they must map to app placement, live text, permissions, accessibility, and implementation notes.

## Proposal Approval Process Strip

Asset ID:
- `DAHJ-v7TOM8`

Canva folder:
- `FAHJ-n-VqFE`

Source:
- Canva automation memory line from `senior-capstone-canva-visual-system`.

Format:
- No-text visual.
- `1600x500`.

Palette:
- Based on `styles.css`.

Intended app placements:
- Student proposal dashboard empty state.
- Student proposal status overview.
- Teacher proposal review queue support/empty state.
- Onboarding or help surface explaining proposal review flow.

Functional boundaries:
- Keep all labels, statuses, dates, counts, and instructional copy as live app text.
- Do not use this image to communicate required steps without adjacent accessible text.
- Do not include real student names, staff names, student photos, or private record data.

Required alt text:
- "Illustration of a senior project proposal moving through submission, review, revision, and approval."

Implementation notes:
- Treat this as a supporting visual only.
- Pair with status pills from the app: `Draft`, `Submitted`, `Under review`, `Revision requested`, `Approved`.
- If the final product direction chooses a hard split between revision and approval, use the visual beside live UI that explains the two outcomes.
- If the final product direction chooses a loop-back revision path, use the visual beside live UI that makes resubmission clear.
- Verify contrast and legibility wherever the asset is displayed at small sizes.

Open decisions:
- Final status labels.
- Whether proposal review flow is represented as a hard split or a revision loop-back.

Next asset family:
- Proposal dashboard empty states:
  - No proposals yet.
  - Filtered out.
  - Waiting on review.
  - Revision requested.

## First-Pass Visual System Folder

Folder:
- `FAHJ-8DxQyk`
- `https://www.canva.com/folder/FAHJ-8DxQyk`

Source:
- Manual first-pass request: "Use Canva & Figma to make a huge first pass at everything so the automations can pick up from there."

Designs:
- Workflow infographic: `DAHJ-3dKnPU`, edit `https://www.canva.com/d/C-dVNnTDKRODcKi`, view `https://www.canva.com/d/tfRo2Sq_1JHu0zu`, 1 page, `800x2000`.
- Visual-system report: `DAHJ-xaMuj8`, edit `https://www.canva.com/d/NXZGwxgXRKYnTPc`, view `https://www.canva.com/d/MA6S4b_xAC69y1C`, 7 pages, `794x1123`.
- Program identity poster: `DAHJ-6LVuME`, edit `https://www.canva.com/d/J9nRXQPXi0O-_hM`, view `https://www.canva.com/d/2FoRYnzFDrZAHqc`, 1 page, `1588x2246`.

Detailed spec:
- `docs/visual-assets/canva-first-pass.md`

Primary handoff:
- Canva automation should inspect these three editable designs, choose one follow-up asset family, and refine from there.
- Figma/rebuild should consume only app-appropriate support visuals and keep functional UI text live.
