# Fifth-Grade Language Standard

Status: required for the signed-in Capstone Project app.

The app must help a student or adult know what happened, what to do next, and where to click. Directions should feel calm even when the work is not done.

## Rules

1. Put the next step first.
2. Use short sentences. No prose string may be longer than 22 words.
3. Keep the full signed-in app at an estimated grade level of 5.9 or lower.
4. Use common verbs: open, read, fix, add, send, save, ask, and check.
5. Keep a needed school term, such as mentor or project, but explain it when it first appears.
6. Use one main action in each card or row.
7. Give an error a safe next step.
8. Do not show code, system names, storage IDs, or access-rule jargon.

The grade estimate is a guard, not a promise that every reader will understand every school term. Role-based tests still check the real rendered student and staff screens.

## Check

Run `npm run verify:fifth-grade-language`. It reads user-facing strings from the app's syntax tree. The check fails when the estimated grade is above 5.9 or a prose string is longer than 22 words.

Run `node scripts/audit-workspace-readability.mjs` to list hard copy that should be made simpler during normal editing.
