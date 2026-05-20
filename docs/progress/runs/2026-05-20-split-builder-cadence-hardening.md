# Split Builder Cadence Hardening

Date: 2026-05-20 PT

## Summary

Verified and hardened the repo-local automation contract for the active split-builder cadence:

- `senior-capstone-nonfigma-mvp-builder` runs hourly at minute 0 PT.
- `senior-capstone-figma-product-builder` runs hourly at minute 30 PT.
- `senior-capstone-hourly-qol-orchestrator` is legacy/manual/diagnostic only.

This run strengthened prompts, lock validation, cadence verification, tests, and operating docs. It did not change product app behavior.

## Repo Verification

- Repo root: `C:\SeniorProjectApp1.0`
- Git top-level: `C:/SeniorProjectApp1.0`
- Branch before: `main`
- Remote origin: `https://github.com/timmb-lab/SeniorProjectApp1.0.git`
- Starting worktree: clean
- HEAD before: `00a2e6e8cb39a9ac382ef267a42e9a2314bcbc16`
- Local and `origin/main` matched before edits.

## Files Changed

- `automation/prompts/senior-capstone-nonfigma-mvp-builder.md`: hardened top-of-hour non-Figma prompt, dirty-start stop, scope boundaries, accepted-pass criteria, and external scheduler claim guard.
- `automation/prompts/senior-capstone-figma-product-builder.md`: hardened bottom-of-hour Figma prompt, dirty-start stop, MVP-028/implementation-ambiguity criteria, connector blocker handling, and external scheduler claim guard.
- `automation/qol/project-lock.json`: removed stale singular 30-minute cadence field and marked the old ID manual/diagnostic/non-recurring.
- `automation/qol/hourly-orchestrator.mjs`: strengthened doctor validation for prompt presence, split builder IDs, oversight IDs, legacy-active rejection, and split RRULEs.
- `scripts/verify-cadence-30min.ps1`: strengthened split-cadence checks for repo root, prompt scope rules, capacity math, lock schema, docs, memory, and artifacts.
- `tests/qol-orchestrator.test.mjs` and `tests/fixtures/qol-registry-legacy-active.json`: added regression coverage for active legacy builder failure and active prompt lane restrictions.
- `docs/automation-cadence.md`, `docs/automation-runbook.md`, `docs/automation-memory.md`, `docs/master-plan.md`, and `docs/artifacts.json`: aligned source-of-truth docs and artifact metadata with split-builder capacity and scheduler boundaries.
- `automation/qol/GUI_ALLOWED_COMMANDS.md`, `automation/qol/README.md`, `automation/qol/REPORT_SCHEMA.md`, and `automation/qol/SCHEDULED_GUI_CANARY.md`: clarified that the old QoL path is legacy diagnostic only.
- `docs/progress/run-log.md` and this manifest: recorded the hardening run.

## Builder Model

- Non-Figma builder: `senior-capstone-nonfigma-mvp-builder`, hourly at minute 0 PT, non-Figma MVP/app/repo/test/accessibility/content/automation lane.
- Figma builder: `senior-capstone-figma-product-builder`, hourly at minute 30 PT, Figma-only product/design lane tied to `MVP-028` or concrete implementation ambiguity.
- Active Figma file key: `z4t4tFPAKrMDh6pIYOeEw6`
- Legacy builder: `senior-capstone-hourly-qol-orchestrator`, manual/diagnostic/non-recurring only.
- Oversight: daily and weekly oversight remain separate and do not replace either builder.

## Scheduler Status

- External scheduler changed from repo: no.
- Repo-local scheduler config found: no.
- Evidence: repo-local search found prompt files, lock files, verifier scripts, diagnostic QoL files, docs, and test fixtures, but no authoritative scheduler manifest capable of changing the external Codex scheduler.
- Remaining Bryan action: update the external scheduler to match repo-local truth.

## Validation Commands And Results

- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\verify-cadence-30min.ps1 -RepoRoot .`: pass.
- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 verify:automation-cadence`: pass.
- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 verify:qol-automation`: pass.
- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:automation`: pass.
- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 test`: pass, 115 tests.
- JSON parse checks for `package.json`, `automation\qol\project-lock.json`, and `docs\artifacts.json`: pass.
- `git diff --check`: pass; Git printed line-ending normalization warnings only.
- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 typecheck`: fail, optional and unrelated to this hardening pass. Errors are in untouched application TypeScript files, mostly `.ts` import-extension settings and Google Drive response typing.

## Commit SHA

Pending until commit is created. The immutable final commit SHA cannot be embedded in this same commit without changing the commit; the final response records the pushed SHA.

## Remaining Risks

- The external Codex scheduler is not controlled by a repo-local manifest in this project, so Bryan must manually configure it or provide direct scheduler access/evidence in a later run.
