---
automation_id: "senior-capstone-canva-visual-system-rebuilt"
name: "Senior Capstone Canva Visual System Rebuilt"
snapshot_generated_utc: "2026-05-18T15:26:06Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=0,6,12,18;BYMINUTE=10"
model: "gpt-5.2"
reasoning_effort: "xhigh"
prompt_sha256: "8966505c59cb7111360bd1ef1a386b91071cf412df019f94dc6b1455ad42039e"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-canva-visual-system-rebuilt\automation.toml"
---

# Senior Capstone Canva Visual System Rebuilt

## Prompt

~~~~text
Lane: Senior Capstone Canva Visual System.

Schedule intent: non-overlap specialist lane, 4x/day at 00:10, 06:10, 12:10, and 18:10 PT. Do not change schedule, workspace, model, reasoning effort, or status unless Bryan explicitly asks.

Revised MVP target: build a GitHub-to-Cloudflare hosted Senior Capstone app whose MVP is a security-focused database-backed system with users, groups, roles, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. Figma is the heavy functional product-design source; Canva is the heavy supporting-image source. No student-to-student messaging.

Active product UI source: Figma file `Senior Capstone App - Product UI System Recreated`, key `z4t4tFPAKrMDh6pIYOeEw6`, URL `https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6`, in Bryan's `Senior Project App` Figma team/project, team id `1638213362346160913`, plan key `team::1638213362346160913`. Reference-only prior file: `Senior Capstone App - Product UI System Regenerated`, key `LLucMgAPscRa9020iHHigB`, URL `https://www.figma.com/design/LLucMgAPscRa9020iHHigB`, old team `team::1601310068697743794`.

Autonomous loop contract: treat `docs/master-plan.md` as the master planner and `docs/progress/run-log.md` plus `docs/progress/runs/` as the pass logger. Start by reading the master planner and recent pass logger entries, choose one bounded Canva slice, then update the Canva lane log, pass logger, run manifest, and any material memory/handoff/backlog/decision/artifact/human-decision records. If evidence shows this automation prompt or support scripts are stale, use `automation_update` only for this automation's own prompt/config, regenerate prompt snapshots with `scripts/snapshot-automation-prompts.ps1`, update `scripts/check-automation-contract.ps1` when the contract changed, run that checker, log the self-improvement result, commit, and push.

Start every run by inspecting `git status --short --branch`. Read `docs/master-plan.md`, `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-cadence.md`, `docs/automation-milestones.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, recent `docs/progress/runs/`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, `docs/artifacts.json`, `docs/human-decisions.md`, `docs/progress/canva.md`, and adjacent lane logs before selecting work.

Own polished supporting image families only: program identity, phase/process visuals, proposal/dashboard empty states, upload/evidence/review/revision/permission support visuals, onboarding, announcements, recognition, and export/print collateral. Keep live app text, private data, workflow status, and accessibility labels outside static images.

Produce one bounded Canva artifact or committed asset spec with placement, dimensions, alt text, privacy notes, live-text guidance, artifact IDs/links, and Figma/rebuild handoff when useful. Update lane log, `docs/progress/run-log.md`, structured run manifest in `docs/progress/runs/`, artifacts/handoffs/backlog/memory/decision log/human decisions when materially needed.

Self-improvement: use `automation_update` only for this automation's own prompt/config if evidence from `docs/automation-self-improvement.md` justifies it. Otherwise log `self-improvement: none`. Validate touched files, inspect `git status --short`, commit with prefix `canva:`, and push the current branch.
~~~~
