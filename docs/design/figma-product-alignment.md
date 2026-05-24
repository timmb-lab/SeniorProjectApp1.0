# Figma Product Alignment

Date: 2026-05-24

## 1. Purpose

Phase 6 applies the Figma/product visual alignment foundation for the multisite sales MVP. The goal is to make the authenticated workspace feel like a polished Capstone Project product for school and district administrators while keeping the work limited to design-system, copy-label, and workspace-surface foundations.

This phase does not build site dashboard routes, student directory routes, student detail routes, review workflow UI, mentor assignment UI, remote data changes, or live Figma changes.

## 2. Sources Inspected

Repo-local Figma/design sources found:

- `docs/design/figma-first-pass-product-system.md`
- `docs/design/figma-product-preview-state-variants.md`
- `docs/progress/figma.md`
- `docs/progress/handoffs.md`
- Figma run manifests under `docs/progress/runs/`

Workspace files inspected:

- `workspace.html`
- `workspace.js`
- `workspace.css`
- `tests/workspace-app.test.mjs`
- `tests/workspace-browser-smoke.test.mjs`
- `tests/production-workflow-source.test.mjs`
- `docs/production-surface-registry.md`
- `docs/generated/production-route-inventory.md`

Figma availability:

- The repo contains explicit Figma product documentation for active file `z4t4tFPAKrMDh6pIYOeEw6`, including route/data/permission handoff nodes and visual token guidance.
- No live Figma file was opened, edited, or claimed updated in Phase 6.
- The implementation uses repo-local Figma documentation plus the approved primary-color / ABC-inspired product direction.

## 3. Figma-To-App Mapping

| Figma/product direction | App surface | Repo implementation | Verification |
| --- | --- | --- | --- |
| Primary color / ABC motif | workspace shell/topbar/cards | `workspace.css` tokens/classes; `workspace.html` asset cache bump | source tests / visual review |
| Admin command center cards | future site admin dashboard | card and metric tile classes in `workspace.css`; existing command center surface in `workspace.js` | workspace source tests |
| Student directory list | future Students section | filter/list/detail classes in `workspace.css` | source tests |
| Student detail drawer | future drill-down | drawer/detail panel classes in `workspace.css` | source tests |
| Viewer read-only mode | future viewer workspace | read-only banner classes in `workspace.css`; viewer banner and role label in `workspace.js` | workspace source tests |
| Status and risk chips | review, readiness, presentation, archive, and story buckets | status pill, story chip, and risk chip classes in `workspace.css` | workspace source tests |
| Site context / school awareness | future site switcher and site admin shell | site switcher and site context badge classes in `workspace.css`; `site_admin` displays as "Administration" in `workspace.js` | workspace source tests |

## 4. Tokens Changed

Phase 6 adds or refines these workspace design tokens:

- `--color-primary`
- `--color-primary-strong`
- `--color-primary-soft`
- `--color-accent`
- `--color-success`
- `--color-warning`
- `--color-danger`
- `--color-info`
- `--surface-page`
- `--surface-card`
- `--surface-row`
- `--border-soft`
- `--text-muted`
- `--radius-card`
- `--radius-control`
- `--radius-pill`
- `--shadow-card`
- `--shadow-soft`
- `--space-card`
- `--space-section`
- `--focus-ring`
- `--font-size-section-title`
- `--font-size-body`
- `--font-size-caption`

The legacy `--abc-*` and `--workspace-*` aliases remain for compatibility with existing workspace styles.

## 5. Phase 6.6 Cleanup Applied

Phase 6.6 applies the highest-priority Figma product-control-center cleanup before the route-connected site admin dashboard build. This remains a workspace-only UX cleanup; no routes, schema, permission logic, seed scripts, remote operations, deployment, domain/OAuth/Cloudflare configuration, or live Figma edits were changed.

Rendered app changes:

- The unauthenticated sign-in surface now renders the reusable dark product header pattern with the gold eyebrow, `Senior Capstone Product` title, operational subtitle, and posture chips.
- The authenticated workspace shell now renders the same product header before role-specific content, with role/scope context chips and a read-only viewer marker when the viewer role is present.
- The posture chips use the Figma language: `Database-backed MVP`, `No student messaging`, `Cloudflare target`, `Private evidence`, and `Audit-sensitive admin`.
- Status pill rendering now flows through a shared status mapping helper and covers the Figma status language plus operational states used by archive, presentation, upload, import, and readiness surfaces.
- Permission denied, role pending, no active assignment, and mentor no-assignment states now expose reason, owner, and next action detail through a reusable problem-state component.
- Viewer read-only mode remains visible in the workspace shell and is reinforced in the product header context.

Token aliases added for future implementation:

- `--color-ink`, `--color-muted`, `--color-paper`, `--color-surface`, `--color-blue`, `--color-green`, `--color-amber`, `--color-red`, `--color-teal`, `--color-violet`, `--color-coral`, `--color-gold`, `--color-border`, and `--color-header`.
- Compatibility aliases `--abc-violet`, `--abc-gold`, and `--abc-border`.

Dead-helper guard:

- `tests/workspace-app.test.mjs` now proves the header, posture chips, status mapping, problem-state detail, and viewer read-only marker are used by real `workspace.js` render paths and rendered workspace output, not only defined in CSS.

## 6. UI Sections Changed

- Sign-in / workspace landing asset version and token usage.
- Workspace topbar and rail token foundation.
- Role banner and role chips.
- Viewer read-only banner pattern.
- Admin command center, dashboard cards, metric tiles, list rows, and quick actions.
- Program teacher and mentor dashboard card patterns.
- Student workspace card/list/evidence patterns through shared row/card tokens.
- Presentation, archive, readiness, audit, and security sections through shared cards, rows, status pills, and focus states.
- Future student directory, filter bar, student row/card, detail drawer/panel, site context, story bucket, risk chip, metric action, and empty-state class support.

## 7. Not Yet Matched / Later Phases

- Full site dashboard UI connected to site-aware route data.
- Student directory UI connected to `/api/site/students`.
- Student detail drawer connected to `/api/site/students/[studentId]`.
- Route-connected filters and site switcher behavior.
- Full review workflow drawer/action UI.
- Mentor assignment operations UI.
- Hosted screenshot proof after route-connected screens exist.
- Direct Figma file update if a later Figma workflow targets the active file.

## 8. Verification

Phase 6 verification commands:

- `npm run test`
- `npm run typecheck`
- `npm run check`
- `npm run check:production-surfaces`
- `git diff --check`

Route inventory is not regenerated in this phase because no route files are added, removed, or renamed.

Phase 6.6 uses the same validation command set and keeps route inventory unchanged because no route files are added, removed, or renamed.
