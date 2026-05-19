# Senior Capstone QoL GUI Allowed Commands

The scheduled Codex GUI automation for this project is allowed to use only this operational sequence:

```powershell
powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 automation\qol\doctor.mjs

powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-node-script.ps1 automation\qol\hourly-orchestrator.mjs

read automation/qol/reports/latest.md
```

- Do not call node.exe directly when the wrapper is required.
- Do not run legacy Senior Capstone scripts.
- Do not edit external automation registry entries.
- Do not broaden the action set.
- Do not continue if doctor.mjs fails.
