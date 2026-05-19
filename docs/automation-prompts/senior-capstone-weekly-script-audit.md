---
automation_id: "senior-capstone-weekly-script-audit"
name: "Senior Capstone Weekly Script Audit"
snapshot_generated_utc: "2026-05-19T15:53:04Z"
rrule: "FREQ=WEEKLY;BYDAY=SU;BYHOUR=23;BYMINUTE=39"
model: "gpt-5.4"
reasoning_effort: "high"
prompt_sha256: "60617b498aa4861964749bb949a5bd1e5cdf9c28e6da8e02b0cb6b5fae2d9dbe"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-weekly-script-audit\automation.toml"
---

# Senior Capstone Weekly Script Audit

## Prompt

~~~~text
Thoroughly audit and upgrade the Senior Capstone project's automation-support script layer. Focus on scripts/automation-config.json, scripts/check-automation-contract.ps1, scripts/measure-automation-efficiency.ps1, scripts/snapshot-automation-prompts.ps1, scripts/run-powershell-script.mjs, scripts/run-node-script.ps1, scripts/run-npm-script.ps1, scripts/check-site-options.mjs, scripts/check-alpha-contract.mjs, package.json script commands, and docs/progress/runs/README.md. Start by inspecting git status and the recent run manifests, then look for brittle path handling, duplicated config, weak TOML/JSON parsing, incorrect truthiness checks, unsafe file operations, timestamp/manifest attribution gaps, missing validation coverage, non-interactive execution failures, and drift between live automation TOMLs, prompt snapshots, docs, and tests. Make only high-confidence script/documentation upgrades that improve reliability, measurement accuracy, unattended operation, or future failure detection. Do not change product app/site behavior, live automation schedules, statuses, workspace, model, reasoning effort, or unrelated dirty files unless the audit proves a script contract requires it. Validate changes with the strongest available local checks, preferring scripts/run-npm-script.ps1 and scripts/run-node-script.ps1 in unattended runs so bundled Node is resolved before any plain node/npm fallback. Include evidence of checks run, any blockers, and the exact next action in the closeout. Commit and push only the files touched by this weekly script audit.
~~~~
