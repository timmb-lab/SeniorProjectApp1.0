# Codex GUI Oversight Action Required

Last updated: 2026-05-20

Live GUI registry editing was intentionally not attempted from this repo maintenance run. This preserves GUI visibility and avoids any risk of deleting, recreating, renaming, hiding, disabling, cloning, or changing the hourly builder automations.

Bryan should update the existing visible daily and weekly oversight entries in place:

1. Open Senior Capstone Daily MVP Summary in Codex GUI.
2. Confirm project is SeniorProjectApp1.0.
3. Confirm schedule is Daily at 8:00 AM.
4. Paste the full contents of `automation/prompts/senior-capstone-daily-mvp-summary.md`.
5. Save the existing entry.
6. Do not delete or recreate it.
7. Open Senior Capstone Weekly Strategy Review.
8. Confirm project is SeniorProjectApp1.0.
9. Confirm schedule is Sundays at 6:00 PM.
10. Paste the full contents of `automation/prompts/senior-capstone-weekly-script-audit.md`.
11. Save the existing entry.
12. Do not delete or recreate it.
13. Do not touch `senior-capstone-nonfigma-mvp-builder`.
14. Do not touch `senior-capstone-figma-product-builder`.
15. Do not revive `senior-capstone-hourly-qol-orchestrator`.

Expected visible GUI entries after the paste:

- Senior Capstone Daily MVP Summary
- Senior Capstone Weekly Strategy Review

Do not change the minute 0 / minute 30 split-builder cadence.
