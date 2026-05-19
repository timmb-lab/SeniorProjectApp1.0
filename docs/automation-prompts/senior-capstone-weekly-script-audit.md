---
automation_id: "senior-capstone-weekly-script-audit"
name: "Senior Capstone Weekly Script Audit"
snapshot_generated_utc: "2026-05-19T01:09:46Z"
rrule: "FREQ=WEEKLY;BYDAY=SU;BYHOUR=23;BYMINUTE=45"
model: "gpt-5.4"
reasoning_effort: "high"
prompt_sha256: "bfe9759683bc396ac56283c48dd128446a5d57c9011eda6395947b158f5ad16d"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-weekly-script-audit\automation.toml"
---

# Senior Capstone Weekly Script Audit

## Prompt

~~~~text
Thoroughly audit and upgrade the Senior Capstone project's automation-support script layer. Focus on scripts/automation-config.json, scripts/check-automation-contract.ps1, scripts/measure-automation-efficiency.ps1, scripts/snapshot-automation-prompts.ps1, scripts/run-powershell-script.mjs, scripts/check-alpha-contract.mjs, package.json script commands, and docs/progress/runs/README.md. Start by inspecting git status and the recent run manifests, then look for brittle path handling, duplicated config, weak TOML/JSON parsing, incorrect truthiness checks, unsafe file operations, timestamp/manifest attribution gaps, missing validation coverage, non-interactive execution failures, and drift between live automation TOMLs, prompt snapshots, docs, and tests. Make only high-confidence script/documentation upgrades that improve reliability, measurement accuracy, unattended operation, or future failure detection. Do not change product app/site behavior, live automation schedules, statuses, workspace, model, reasoning effort, or unrelated dirty files unless the audit proves a script contract requires it. Validate changes with the strongest available local checks, preferring npm scripts when available and falling back to bundled Node plus scripts/run-powershell-script.mjs when npm is unavailable. Include evidence of checks run, any blockers, and the exact next action in the closeout. Commit and push only the files touched by this weekly script audit.
~~~~
