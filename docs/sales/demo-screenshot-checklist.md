# Demo Screenshot Checklist

Phase 14 generated a hosted fake-data screenshot set with caveats. The index is `docs/sales/hosted-browser-proof-screenshot-index.md`.

Each screenshot must be labeled with date, environment, persona, and claim status. Do not capture passwords, `.secrets`, credential files, tokens, OAuth secrets, raw Drive IDs, private URLs, or raw D1 tables.

## Targets

- [x] Sign-in / product header.
- [x] Site Dashboard through the existing fake hosted admin fallback.
- [x] Student Directory with a story filter.
- [x] Student Detail / Timeline for `Rich Timeline Demo`.
- [x] Review Queue through the existing fake hosted program teacher fallback.
- [x] Mentor Assignments through the existing fake hosted admin fallback.
- [x] Operations Readiness with archive failed and presentation pending filters.
- [ ] Viewer read-only state as Valeria Viewer: blocked by credential path.
- [x] Mentor no-active-assignment state through the existing fake hosted mentor fallback.
- [ ] Mobile or narrow viewport if supported by the demo plan.

## Required Label Format

Use:

```text
YYYY-MM-DD - Environment - Persona - Screen - Claim label
```

Example:

```text
2026-05-24 - local fake-data demo - Avery Administration - Site Dashboard - Proven locally
```
