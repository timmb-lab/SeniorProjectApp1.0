---
automation_id: "senior-capstone-public-site-refresh"
name: "Senior Capstone Public Site Refresh"
snapshot_generated_utc: "2026-05-19T14:47:39Z"
rrule: "FREQ=DAILY;INTERVAL=3;BYHOUR=6;BYMINUTE=20"
model: "gpt-5.4"
reasoning_effort: "medium"
prompt_sha256: "8535978628f618a86964864b62362099c8b39db5fcdc7c5f22354ab8dacb6e30"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-public-site-refresh\automation.toml"
---

# Senior Capstone Public Site Refresh

## Prompt

~~~~text
Refresh the ECTA Senior Capstone public companion site and stakeholder option sites from recent web-app progress logs. Review recent changes in docs/progress/run-log.md, docs/progress/runs/, docs/progress/handoffs.md, docs/automation-memory.md, docs/public-site.md, docs/stakeholder-site-options.md, app.js, alpha.html, app-preview.html, public-companion/, stakeholder-options/titan-blend/, and stakeholder-options/back-to-basics/. Use automation memory at $CODEX_HOME/automations/senior-capstone-public-site-refresh/memory.md when CODEX_HOME is set; otherwise use $HOME/.codex/automations/senior-capstone-public-site-refresh/memory.md and create it if missing. Update public-facing site copy/resources only when recent app work changes what students, staff, mentors, families, or stakeholders should know. Keep all public sites separate from the app backend: do not expose credentials, fake account passwords, private student data, D1 details, Google Drive IDs, or backend-only implementation notes. Maintain the current public companion structure plus the two stakeholder option designs. Prefer npm run build:site-options and npm run check:site-options when npm is on PATH; otherwise use the scripts/run-npm-script.ps1 fallback via powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 build:site-options and powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:site-options. Verify generated output roots, commit and push only relevant public-site/source changes, and verify or deploy the senior-capstone-public, senior-capstone-option-titan, and senior-capstone-option-primary Cloudflare Pages projects when available. Record any exact blocker in docs/public-site.md, docs/stakeholder-site-options.md, or the progress logs.
~~~~
