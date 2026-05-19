# Scheduled GUI Canary

The next scheduled top-of-hour GUI run succeeds only if `automation/qol/reports/latest.md` shows all of these:

- `run_id` is newer than `20260519T184416Z-84c7f2ca`.
- `orchestrator_path` is `automation/qol/hourly-orchestrator.mjs`.
- `invocation_adapter` is `scripts/run-automation.ps1`.
- `wrapper_required` is `true`.
- `direct_node_execution_allowed` is `false`.
- `lock_acquired` is `true`.
- `lock_released` is `true`.
- `state_written` is `true`.
- `log_written` is `true`.
- `report_written` is `true`.
- `safety_status` is `PASS` or `UNKNOWN_REGISTRY_UNINSPECTABLE`.
- External registry status is not overstated.
- Active Senior Capstone automation count remains exactly 1 if independently checked.
- No legacy automations are reactivated.
