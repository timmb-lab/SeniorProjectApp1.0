# Bad GUI Allowed Commands Fixture

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 automation\qol\doctor.mjs

node automation/qol/hourly-orchestrator.mjs

read automation/qol/reports/latest.md
```
