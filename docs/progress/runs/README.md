# Structured Run Manifests

Every productive automation run should create one JSON manifest in this folder.

The manifest is the machine-readable companion to the lane log. Markdown remains the human narrative; JSON lets audits measure whether work is compounding.

## Naming

Use:

```text
YYYY-MM-DD-HHMM-lane-short-scope.json
```

Examples:

```text
2026-05-18-0000-figma-guided-proposal-form.json
2026-05-18-0100-rebuild-stack-decision.json
2026-05-18-2330-weekly-deep-audit.json
```

## Required Fields

```json
{
  "run_id": "2026-05-18-0000-figma-guided-proposal-form",
  "timestamp_local": "2026-05-18T00:00:00-07:00",
  "lane": "figma",
  "automation_id": "senior-capstone-figma-product-design",
  "trigger": "scheduled | manual | user-requested",
  "master_plan_sections": ["Product Destination"],
  "scope": "One bounded slice.",
  "files_changed": [],
  "external_artifacts": [],
  "validation": [],
  "backlog_updates": [],
  "handoffs_opened": [],
  "handoffs_closed": [],
  "decisions_added": [],
  "human_decisions_added": [],
  "self_improvement": {
    "result": "none | updated-own-prompt | blocked",
    "evidence": "",
    "automation_updated": null
  },
  "commit": {
    "message": "",
    "hash": null,
    "pushed": false
  },
  "next": []
}
```

## Rules

- One manifest per run.
- Keep values concrete and grep-friendly.
- Use stable IDs for backlog, handoffs, artifacts, decisions, and human decisions.
- If the run changes a live automation prompt, regenerate `docs/automation-prompts/` and run `scripts/check-automation-contract.ps1`.
- Do not delete old manifests; weekly audits should summarize rather than prune.
