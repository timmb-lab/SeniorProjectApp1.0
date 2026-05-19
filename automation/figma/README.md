# Repo-Local Figma Evolution Lane

This lane is invoked from `automation/qol/hourly-orchestrator.mjs` only when `FIGMA_EVOLUTION_ENABLED=true`.

Default behavior is safe:

- Disabled runs report `SKIPPED_DISABLED`.
- Enabled runs select at most one bounded backlog task.
- Direct Figma mutation is refused unless the repo process can verify a project-local writer adapter or mock mode.
- If the Codex/Figma tool is authorized in the app but unreachable from Node, the lane writes a dry-run patch proposal and reports `FIGMA_AUTHORIZED_BUT_TOOL_UNREACHABLE`.

Manual dry-run/canary command:

```powershell
$env:FIGMA_EVOLUTION_ENABLED="true"; $env:FIGMA_MODE="mcp"; $env:FIGMA_FILE_KEY="<target file key>"; node automation/figma/hourly-figma-orchestrator.mjs
```

That command creates or updates only `automation/figma/state`, `automation/figma/logs`, `automation/figma/reports`, and `automation/figma/patches` unless a reachable writer adapter is explicitly configured.
Enabled non-mock modes require `FIGMA_FILE_KEY` from the environment so a live Figma target is never selected by repo default.

Local mock command for tests only:

```powershell
$env:FIGMA_EVOLUTION_ENABLED="true"; $env:FIGMA_MODE="mock"; node automation/figma/hourly-figma-orchestrator.mjs
```

Real Figma canary requirements:

- target page: `Senior Capstone Automation Lab`
- target frame: `Hourly Figma Evolution`
- one sandbox task per run
- no delete operations
- no production page mutation
- report, state, log, and lock-release evidence written locally
