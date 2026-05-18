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
