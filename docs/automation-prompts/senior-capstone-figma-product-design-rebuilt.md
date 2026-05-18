---
automation_id: "senior-capstone-figma-product-design-rebuilt"
name: "Senior Capstone Figma Product Design Rebuilt"
snapshot_generated_utc: "2026-05-18T15:26:06Z"
rrule: "FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA,SU;BYHOUR=1,7,13,19;BYMINUTE=15"
model: "gpt-5.5"
reasoning_effort: "xhigh"
prompt_sha256: "b8b8b61a61cc2a221035711a9c8482c153fb5ca74d22dc837f90824c2b1f60ce"
source_toml: "C:\Users\bryan\.codex\automations\senior-capstone-figma-product-design-rebuilt\automation.toml"
---

# Senior Capstone Figma Product Design Rebuilt

## Prompt

~~~~text
Lane: Senior Capstone Figma Product Design.

Schedule intent: non-overlap core rotation, 4x/day at 01:15, 07:15, 13:15, and 19:15 PT. Do not change schedule, workspace, model, reasoning effort, or ACTIVE status unless Bryan explicitly asks.

Revised MVP target: build a GitHub-to-Cloudflare hosted Senior Capstone app whose MVP is a security-focused database-backed system with users, groups, roles, progress updates, private evidence, submissions, reviews, approvals, announcements, dashboards, audit logs, exports, and protected student records. Figma is the heavy functional product-design source; Canva is the heavy supporting-image source. No student-to-student messaging.

Active Figma write target: continue `Senior Capstone App - Product UI System Recreated`, file key `z4t4tFPAKrMDh6pIYOeEw6`, URL `https://www.figma.com/design/z4t4tFPAKrMDh6pIYOeEw6`. This file was created in Bryan's `Senior Project App` Figma team/project, observed at `https://www.figma.com/files/team/1638213362346160913/all-projects?fuid=1601310066605052228`, team id `1638213362346160913`, plan key `team::1638213362346160913`.

Reference-only prior Figma files: `Senior Capstone App - Product UI System Regenerated`, key `LLucMgAPscRa9020iHHigB`, URL `https://www.figma.com/design/LLucMgAPscRa9020iHHigB`, was created under older target `team::1601310068697743794` and is now reference-only. The earlier first-pass file `fkfNI9JNy0A3Rm8KnoxJLj` is superseded historical context only.

Current recreated file state: the active file contains four pages: `00 Master Plan + Foundations` (primary frame `2:5`), `01 Components + App Screens` (board `3:2`, student desktop `3:66`, guided proposal `3:154`, teacher queue `3:190`, mentor/admin snapshots `3:246`, mobile student `3:301`), `02 Automation Handoff` (handoff board `5:2`, lane handoff cards `5:38`), and `03 Product Preview + State Variants` (board `6:2`, student state `6:34`, teacher state `6:77`, mentor state `6:112`, admin state `6:127`, edge states `6:143`, review drawer `6:198`, admin override modal `6:219`, mobile state `6:232`, rebuild mapping `6:257`). Canvas writes succeeded. Final screenshot/metadata verification is still pending because the follow-up MCP call hit the Education-plan tool-call limit for the new team `1638213362346160913`.

Autonomous loop contract: treat `docs/master-plan.md` as the master planner and `docs/progress/run-log.md` plus `docs/progress/runs/` as the pass logger. Start by reading the master planner and recent pass logger entries, choose one bounded Figma slice, then update the Figma lane log, pass logger, run manifest, and any material memory/handoff/backlog/decision/artifact/human-decision records. If evidence shows this automation prompt or support scripts are stale, use `automation_update` only for this automation's own prompt/config, regenerate prompt snapshots with `scripts/snapshot-automation-prompts.ps1`, update `scripts/check-automation-contract.ps1` when the contract changed, run that checker, log the self-improvement result, commit, and push.

Start every run by inspecting `git status --short --branch`. Read `docs/master-plan.md`, `docs/automation-runbook.md`, `docs/automation-self-improvement.md`, `docs/automation-cadence.md`, `docs/automation-milestones.md`, `docs/automation-memory.md`, `docs/progress/run-log.md`, recent `docs/progress/runs/`, `docs/progress/handoffs.md`, `docs/progress/decision-log.md`, `docs/automation-backlog.md`, `docs/artifacts.json`, `docs/human-decisions.md`, `docs/progress/figma.md`, and adjacent lane logs before selecting work.

Own app UI source of truth: app shell, admin account/group/progress management, role-aware dashboards, proposal/research workflow, upload/evidence states, review queues, announcement surfaces, components, design tokens, responsive/mobile-aware states, accessibility states, and developer-ready specs.

Priority next slice: when Figma MCP quota resets, run metadata/screenshot verification for active file `z4t4tFPAKrMDh6pIYOeEw6`, especially `03 Product Preview + State Variants`, then resolve or update `H-2026-05-18-007`. After verification, deepen one bounded state/component area: richer status component variants, review drawer variants, admin override modal states, route/data-field annotations, or mobile student refinements. Record page/frame IDs, links, data fields, permissions, states, interactions, acceptance checks, and rebuild handoffs. Update lane log, `docs/progress/run-log.md`, structured run manifest in `docs/progress/runs/`, artifacts/handoffs/backlog/memory/decision log/human decisions when materially needed.

Rate-limit handling: if Figma MCP returns a rate-limit error whose upgrade/paywall link points at team `1601310068697743794`, stop retrying that old file/team and log that the run is still routed incorrectly. If the link points at team `1638213362346160913`, the route is correct and the blocker is simply the current Education-plan MCP quota; log the blocker and preserve the next verification/deepening action.

Self-improvement: use `automation_update` only for this automation's own prompt/config if evidence from `docs/automation-self-improvement.md` justifies it. Otherwise log `self-improvement: none`. Validate, inspect `git status --short`, commit with prefix `figma:`, and push the current branch.
~~~~
