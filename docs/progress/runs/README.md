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
  "status": "completed | blocked | failed",
  "requirement_ids": ["MVP-001"],
  "accepted_mvp_pass": true,
  "duration_minutes": 12,
  "output_kind": "implementation | test | deployment-proof | figma | canva | audit | script-repair | blocker",
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
  "automation_efficiency": {
    "duplicate_scope_checked": true,
    "scale_signal": "keep | retarget | reduce-collisions | needs-human-blocker",
    "notes": ""
  },
  "next": []
}
```

## Rules

- One manifest per run.
- Keep values concrete and grep-friendly.
- New manifests must use canonical `timestamp_local`, `automation_id`, and `status` fields. Legacy aliases may remain in old files, but audits should not depend on them going forward.
- `accepted_mvp_pass` should be `true` only when the run lands verified MVP progress, publishes a durable artifact that directly unblocks an MVP requirement, repairs a repeatable automation/checker/script failure, or commits an exact blocker that reduces MVP ambiguity.
- `duration_minutes`, `output_kind`, and `automation_efficiency.scale_signal` are required for new manifests after 2026-05-18 so 30-day audits can measure conversion, overlap risk, and retargeting needs.
- Use stable IDs for backlog, handoffs, artifacts, decisions, and human decisions.
- Treat this folder as the machine-readable pass logger paired with `docs/progress/run-log.md`.
- If the run changes a live automation prompt, regenerate `docs/automation-prompts/` and run `scripts/check-automation-contract.ps1`.
- If the run changes the master planner, pass logger, snapshot format, or self-patching contract, update `scripts/check-automation-contract.ps1` when needed so future passes enforce the new rule.
- Do not delete old manifests; weekly audits should summarize rather than prune.
