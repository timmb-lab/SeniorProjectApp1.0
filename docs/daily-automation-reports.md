# Daily Automation Reports

This file is the fallback daily report log for the Senior Capstone single GUI runner.

The intended permanent destination is the Google Doc titled `Senior Capstone Daily Automation Log`. This repo fallback should only be used when Google Drive write access is blocked or unavailable.

## Current Setup Note

Daily reporting is owned by `senior-capstone-hourly-qol-orchestrator` and should happen at most once per local day when needed.

Destinations:
- Email: `bryan.timm89@gmail.com`
- Google Drive target account: `bryan.timm89@gmail.com`
- Google Doc title: `Senior Capstone Daily Automation Log`

Current blocker:
- Google Drive write/create attempts returned `403 Forbidden` during setup.

Expected behavior until fixed:
- Send the daily email if Gmail access works.
- Write a fallback entry here if Google Drive append/create remains blocked.
- Include an action-required note asking Bryan to reconnect or reauthorize Google Drive with write access for `bryan.timm89@gmail.com`.
