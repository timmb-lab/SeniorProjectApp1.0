---
automation_id: "senior-capstone-figma-product-design-rebuilt"
name: "Senior Capstone Figma Product Design Standby"
snapshot_generated_utc: "2026-05-18T16:27:07Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=1,7,13,19;BYMINUTE=15"
model: "gpt-5.5"
reasoning_effort: "xhigh"
prompt_sha256: "92f502a03eff1b9248b479f8c6a7587bf4a9e6748baedf8b5f0624b6174ee23a"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-figma-product-design-rebuilt\automation.toml"
---

# Senior Capstone Figma Product Design Standby

## Prompt

~~~~text
Lane: Senior Capstone Figma Product Design Standby.

Schedule intent: this specialist lane is intentionally PAUSED so the Senior Capstone system has one primary 5x/day gold-standard orchestrator. The retained standby schedule is 01:15, 07:15, 13:15, and 19:15 PT for future reactivation only if Bryan explicitly asks. Do not change schedule, workspace, model, reasoning effort, or status unless Bryan explicitly asks or a committed automation decision supersedes this standby model.

Gold standard role while paused: preserve a ready-to-run specialist prompt that the primary orchestrator can consult, snapshot, and reactivate if needed without losing master planner, pass logger, laddering, self-healing, no-intervention approval, commit, and push requirements.

Revised MVP target: build a GitHub-to-Cloudflare hosted Senior Capstone app whose MVP is a security-focused database-backed system with users, groups, roles, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. No student-to-student messaging.

Active Figma write target: continue `Senior Capstone App - Product UI System Recreated`, file key `z4t4tFPAKrMDh6pIYOeEw6`, URL `https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6`, in Bryan's `Senior Project App` Figma team/project, team id `1638213362346160913`, plan key `team::1638213362346160913`. Reference-only prior file: `LLucMgAPscRa9020iHHigB`.

Autonomous loop contract: treat `docs/master-plan.md` as the master planner and `docs/progress/run-log.md` plus `docs/progress/runs/` as the pass logger. Start by inspecting `git status --short --branch`, then read `docs/master-plan.md`, `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-cadence.md`, `docs/automation-milestones.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, recent `docs/progress/runs/`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, `docs/artifacts.json`, `docs/human-decisions.md`, `docs/progress/figma.md`, and adjacent lane logs before selecting work.

Work ladder when active: 1) Figma blocker needed by the hosted app, 2) active-file screenshot/metadata verification, 3) state/component variant that maps to a database-backed workflow, 4) dev-ready annotations for permissions/data fields, 5) rebuild handoff cleanup.

No-intervention connector rule: if Figma MCP quota, auth, account, or approval would block a write, do not wait for Bryan. Use a repo-side spec or handoff fallback, log the blocker, and continue validation, commit, and push the current branch.

Self-improvement: use `automation_update` only for this automation's own prompt/config if evidence from `docs/automation-self-improvement.md` justifies it. Regenerate prompt snapshots with `scripts/snapshot-automation-prompts.ps1`, update `scripts/check-automation-contract.ps1` when the contract changed, run that checker, and log the self-improvement result. Otherwise log `self-improvement: none`. Validate touched files, inspect `git status --short`, commit with prefix `figma:`, and push the current branch.
Publication/script auto-approval hard rule: for this project, do not end with local-only repo changes. After any repo file change, run validation, inspect `git status --short`, stage only current-run files, commit with the correct lane prefix, and push the current branch. If push is rejected, fetch/rebase once on a clean worktree and retry; never force push. Run project scripts non-interactively with auto-approved execution flags such as `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\...`. Do not add `Read-Host`, `PromptForChoice`, `Pause`, or confirmation gates to project scripts; scripts should default to the safe approved path, expose explicit flags for risky external/destructive actions, and write committed blockers instead of waiting for unattended approval.
~~~~
