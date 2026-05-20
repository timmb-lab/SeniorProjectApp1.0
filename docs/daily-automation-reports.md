# Daily Automation Reports

This file is the optional fallback daily report log for the Senior Capstone daily summary automation.

The intended permanent destination is the Google Doc titled `Senior Capstone Daily Automation Log`. This repo fallback should only be used when Google Drive write access is blocked or unavailable.

## Current Setup Note

Daily reporting is owned by `senior-capstone-daily-mvp-summary` and should summarize the prior 24 hours each morning.

Destinations:
- Email: `bryan.timm89@gmail.com`
- Google Drive target account: `bryan.timm89@gmail.com`
- Google Doc title: `Senior Capstone Daily Automation Log`

Current blocker:
- Google Drive write/create attempts returned `403 Forbidden` during setup.

Expected behavior until fixed:
- Send the daily report through the available Codex automation output, and email it if Gmail access works in that automation context.
- Write a fallback entry here only if Bryan explicitly asks for committed daily report history.
- Include an action-required note asking Bryan to reconnect or reauthorize Google Drive with write access for `bryan.timm89@gmail.com`.
