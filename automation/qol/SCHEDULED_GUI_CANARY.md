# Legacy Diagnostic GUI Canary

The current canary baseline run_id is `20260519T190403Z-605c9b99`.

This canary is for the legacy diagnostic/manual QoL runner only. It is not an active recurring builder and does not replace any of the four quarter-hour split builders.

The next legacy diagnostic GUI canary succeeds only if `automation/qol/reports/latest.md` is fresh and shows all of these:

- `run_id` is newer than the current canary baseline.
- `run_started_at` and `run_finished_at` belong to the same fresh run.
- `orchestrator_path` is `automation/qol/hourly-orchestrator.mjs`.
- `invocation_adapter` is `scripts/run-node-script.ps1`.
- `wrapper_required` is `true`.
- `direct_node_execution_allowed` is `false`.
- `lock_acquired` is `true`.
- `lock_released` is `true`.
- `state_written` is `true`.
- `log_written` is `true`.
- `report_written` is `true`.
- `safety_status` is `PASS` or `UNKNOWN_REGISTRY_UNINSPECTABLE`.
- `unexpected_project_automation_detected` is not `true`.
- Active builder automation count is exactly `4` only when `registry_health_verified` is `true` and `registry_evidence_source` is live hidden-registry evidence mirrored to `automation/qol/state/automation-registry-evidence.json`; test fixtures under `tests/fixtures/` are not live scheduler proof.
- Active Senior Capstone automation count may include the two oversight automations when live hidden-registry evidence shows them active.
- Otherwise, registry state must be reported as `UNKNOWN_REGISTRY_UNINSPECTABLE`.

After this canary succeeds, future diagnostic runs must not keep using this baseline as their only freshness check. Use the latest repo-local run evidence and report timestamps. If freshness cannot be established from repo-local evidence, report that honestly.
