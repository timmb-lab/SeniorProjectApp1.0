# UX Visual Audit Phase 6.5

Date: 2026-05-24

## 1. Executive Summary

The current authenticated app is partially aligned to the Figma project, but it is not truly aligned yet. Phase 6 put the right foundation in place: exact product color values are present in `workspace.css`, the workspace has role labels for the new multisite roles, viewer read-only support exists, and future CSS hooks exist for site context, student directory, detail panels, story chips, risk chips, and empty states.

What still does not feel like the Figma design is the rendered product experience. The actual Figma node is a serious product control center with a dark charcoal header, gold eyebrow, white product title, operational subtitle, and explicit posture chips. The current app mostly renders a light card dashboard with ABC-style role coloring, a photo-based sign-in hero, and generic dashboard cards. It has the data and many useful components, but it does not yet lead with the Figma product header or the clear North Star workflow language.

Before this feels demo-ready for administrators, the app needs a Phase 6.6 visual cleanup. The minimum lift is to add the Figma product header pattern to signed-in role surfaces, make status chips fully cover the Figma language, expose reason/owner/next action on problem states, preserve exact palette aliases, tighten empty/error copy, and make the site-scoped operating posture visible before Phase 7 builds the site admin dashboard.

## 2. Actual Figma Source Review

Live Figma was inspected through the Figma MCP connector. Live Figma was edited: no.

| Source | Result |
| --- | --- |
| Figma file key | `z4t4tFPAKrMDh6pIYOeEw6` |
| File metadata inspected | yes, read-only Plugin API call |
| File root | `0:0`, `Document`, editor type `figma` |
| Page count | 7 |
| Page inspected | `0:1`, `00 Master Plan + Foundations` |
| Page metadata | one top-level child |
| Main node inspected | `2:5`, `Senior Capstone Product Control Center` |
| Node metadata | frame, `1680 x 1172.4`, 4 direct children, 122 descendants |
| Design context inspected | yes, `get_design_context` returned generated reference code and embedded visual context |
| Screenshot inspected | yes, `get_screenshot` succeeded; short-lived URL was not recorded in this repo |

Extracted Figma design patterns:

- Product header pattern: dark charcoal header (`#22303a`) with a gold eyebrow, large white title, serious operational subtitle, and status/positioning chips.
- Header chips: `Database-backed MVP`, `No student messaging`, `Cloudflare target`, `Private evidence`, `Audit-sensitive admin`.
- North Star Workflow cards: `Student work surface`, `Teacher review queue`, `Mentor assigned scope`, `Admin operating view`.
- Permission and data rule cards: `Private evidence`, `Role scoped views`, `Audited changes`, `Teacher intervention`.
- Cards: white surface, `#dce4e5` border, 8px radius, compact spacing, small top accent bars by semantic role.
- Tone: serious school operations, database-backed, private-evidence aware, audit-safe, role-scoped, and administrator credible.

Extracted Figma color/token scheme:

| Token | Hex |
| --- | --- |
| ink | `#172026` |
| muted | `#596871` |
| paper | `#fbfaf7` |
| surface | `#ffffff` |
| blue | `#2463a6` |
| green | `#22734d` |
| amber | `#a65f00` |
| red | `#b82f2f` |
| teal | `#047b83` |
| violet | `#6c4aa3` |
| coral | `#c6553d` |
| gold | `#d9a441` |
| border | `#dce4e5` |

Extracted Figma status language:

`Draft`, `Submitted`, `Under review`, `Revision requested`, `Approved`, `Blocked`, `Overridden`, `Archived`.

Status rule:

Status must always use text plus color. Revision, blocked, rejected, and override states must expose reason, owner, and next action.

## 3. Current App Surface Inventory

| Surface | Current state | Score | Biggest UX issue | Biggest visual issue | Recommended action | Priority | Fix type |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| Sign-in screen | Functional auth entry with Google/local/reset states | 2 | Reads as generic workspace login, not product control center | Photo hero and giant title do not match dark Figma product header | Replace hero treatment with Figma dark header, chips, and private/evidence posture copy | P0 | CSS-only plus JS copy |
| Workspace shell/topbar/rail | Sticky topbar, role rail, tabs, next-step card | 2 | Shell does not foreground role/scope and site context strongly enough | Light topbar and rail cards differ from dark header baseline | Add product header band above role work surface; tighten rail to role/scope operations | P0 | CSS-only plus JS render change |
| Role-aware workspace landing | Redirects overview to the primary role's section | 2 | Users do not see the North Star workflow framing or product chips | Overview lacks Figma control-center header and workflow cards | Add lightweight role landing header with chips and North Star concepts | P0 | JS render change |
| Overview | Useful fallback for role-pending/misc cases | 2 | Overview is a generic priorities card rather than a product system overview | Light hero card with gold border only | Use Figma header and role/scope cards | P1 | JS render change |
| Admin command center | Data-backed legacy admin overview with metrics and dashboard cards | 3 | Strong data shape, but it is global/admin, not site-administration yet | Gradient light hero and red admin accent do not match violet admin operating view | Keep data cards, add Figma product header, admin operating view language, and audit/private chips | P0 | CSS-only plus JS render change |
| Future site admin dashboard area | Not built; only future classes and route direction exist | 1 | No site-scoped dashboard route or data yet | No visible site product pattern | Phase 7 should build from audit requirements, not from current light admin card style | P0 | Later route work |
| Program teacher dashboard | Data-backed scoped dashboard, review risks, students list | 3 | Needs faster review-queue actions and intervention context | Uses same generic command-center pattern, not teacher review lane card pattern | Add teacher review queue header, filters, reason/owner/next-action for revision/blocked rows | P1 | JS render change |
| Mentor dashboard | Data-backed assigned student list with meeting/presentation signals | 3 | Assigned scope is clear, but mentor coaching actions are thin | Generic cards; coral mentor accent is not visible enough | Add mentor assigned scope header and cards with meeting/readiness/evidence grouping | P1 | JS render change |
| Student workspace | Data-backed next action, submissions, evidence forms, evidence list | 3 | Student work is functional, but research/proposal sections are not guided yet | Light cards lack student work surface accent and product header | Add next-action card pattern, section status detail, private evidence language | P1 | JS render change |
| Review queue | Shows submitted work with evidence count and status | 2 | No filters, reasons, owners, or direct review actions | Table is sparse and generic | Upgrade queue rows to Figma dense review queue requirements | P1 | JS render change |
| Evidence upload/link forms | Link and file upload flows with progress and retry states | 3 | Privacy posture is present in places but not at form entry | Forms look utilitarian rather than private evidence workspace | Add private evidence rule card copy and teal accent to upload/link panels | P1 | CSS-only plus JS copy |
| Presentation section | Data-backed slots and check-out/check-in actions | 3 | Empty/conflict/reason states are not richly explained | Generic list/card treatment | Add presentation operations header and clearer status reason/owner/next action | P2 | JS render change |
| Archive/readiness section | Data-backed archive checks, storage, retention, redaction | 3 | Provider/retention language is technical for admins and students | Light cards, no Figma permission/data rule framing | Rewrite to plain operational language and use rule cards | P2 | JS copy plus CSS |
| Users/access/security section | Admin import, one-time setup display, password change | 3 | Import UI is admin-safe but not yet site-scoped or delivery-policy complete | Generic form cards, no audit-sensitive admin header | Add audit-sensitive admin posture, reason/owner fields, site scope copy | P1 | JS render change |
| Viewer read-only mode | Read-only banner exists | 3 | Viewer mode is only a banner, not consistently marked in actions/cards | Banner uses teal but not header chip system | Add persistent read-only chip in product header and disable action affordances visibly | P1 | JS render change |
| Empty states | Many surfaces have explicit empty copy | 3 | Empty states often say what is missing but not owner/next action | Dashed generic blocks do not match Figma cards | Convert priority empty states to card pattern with reason, owner, next action | P0 | JS copy plus CSS |
| Error/permission-denied states | 401/403, role-pending, no-assignment, permission-denied are visible | 3 | Denied states still generic and do not always name owner/next action | Error cards use red border but no Figma problem-state structure | Add problem-state detail rows for reason, owner, next action | P0 | JS render change |
| Account smoke page | Internal QA page, clearly marked fake only | 2 | Useful QA, but could confuse if surfaced near product demo | Uses older teal/card style, not Figma product system | Keep out of production nav; no need to polish before Phase 7 | P3 | No change |
| Alpha page | Internal QA console, has dark sidebar | 2 | Contains legacy alpha notice/announcement concept and is not production posture | Separate alpha palette, not Figma control center | Keep internal; do not use in sales demo | P3 | No change |
| Public guide surface | East Tech public guide and teacher/student guide mode | 1 | Public guide is intentionally not the authenticated product | Titan/East Tech palette differs from Figma product palette | Keep separate; do not force Figma product system onto public guide yet | P3 | No change |
| App preview surface | Rich public preview with product concepts and role tabs | 3 | Still says preview/not live and uses localStorage guide app context | Closer to Figma but uses old global Titan aliases and extra statuses | Use as reference only; migrate useful patterns into workspace | P2 | Later route/JS work |

## 4. Figma Pattern Gap Matrix

| Figma pattern | Current implementation | Gap | Priority | Fix phase |
| --- | --- | --- | --- | --- |
| Dark product header / hero | Sign-in has photo hero; signed-in surfaces have light topbar and light command hero | Missing primary Figma visual anchor | P0 | Phase 6.6 |
| Gold eyebrow | `workspace-kicker` exists but uses role primary color | Gold context text is not consistent | P0 | Phase 6.6 |
| Header chips | Role chips and workspace chips exist | Missing exact product posture chips | P0 | Phase 6.6 |
| North Star Workflow cards | App preview has role concepts; workspace does not show the four-card North Star set | Product direction is not visible after login | P1 | Phase 6.6 or Phase 7 |
| Semantic color tokens | Exact values exist mostly as `--abc-*`; app also inherits older global `styles.css` tokens | Token values exist, but naming and usage are inconsistent | P0 | Phase 6.6 |
| Status chips | Status pill component exists | Missing explicit blocked, overridden, archived, and some problem-state variants in workspace CSS | P0 | Phase 6.6 |
| Role/scope cards | Role banner exists | Needs stronger site/org/program/assignment semantics | P0 | Phase 7 |
| Permission/data rule cards | Mostly in docs and some archive/security copy | Not represented as reusable workspace cards | P1 | Phase 6.6 |
| Admin operating view | Legacy admin command center exists | Not site-aware and visually not the violet admin operating lane | P0 | Phase 7 |
| Teacher review queue | Basic table/list exists | Lacks filters, evidence/source signals, intervention reasons, direct actions | P1 | Later review workflow |
| Mentor assigned scope | Dashboard/list exists | Needs meeting/readiness/evidence grouping and scope reassurance | P1 | Later mentor assignment |
| Student work surface | Student dashboard exists | Needs guided proposal/research sections and stronger next-action pattern | P1 | Phase 9 or later workflow |
| No messaging/announcements posture | Workspace removed announcements; public docs note removal | Exact `No student messaging` chip is missing from product UI | P0 | Phase 6.6 |
| Audit-safe admin language | Audit summaries and import reason exist | Header/posture language is not visible enough on admin surfaces | P0 | Phase 7 |
| Private evidence language | Evidence/archive mention private storage/redaction | Needs more consistent entry-point language and rule cards | P1 | Phase 6.6 |
| Blocked/revision/override reason/owner/next-action pattern | Some status text and details exist | Problem states do not always expose the required trio | P0 | Phase 6.6 |
| School-operations seriousness | Backend and copy are serious | Visual layer still reads like a generic dashboard in several places | P0 | Phase 6.6 |
| Primary color palette fidelity | Workspace has exact hex values; public/alpha/account surfaces drift | Product app palette not used consistently across all app-like surfaces | P1 | Phase 6.6 for workspace only |

## 5. Color and Token Fidelity Audit

| Figma token | Required hex | Current token exists | CSS variable name | Exact hex match | Recommended correction | Priority |
| --- | --- | --- | --- | --- | --- | --- |
| ink | `#172026` | yes | `--abc-ink` | yes | Add stable semantic alias such as `--color-ink`; use for text instead of inherited `--ink` where possible | P1 |
| muted | `#596871` | yes | `--abc-muted`, `--text-muted` | yes | Prefer `--text-muted` or add `--color-muted` for app code | P1 |
| paper | `#fbfaf7` | yes | `--abc-paper`, `--surface-page` | yes | Remove soft-blue page gradient on authenticated app if strict Figma background is desired | P1 |
| surface | `#ffffff` | yes | `--abc-card`, `--surface-card` | yes | Add `--color-surface` alias for readability | P2 |
| blue | `#2463a6` | yes | `--abc-blue`, `--color-primary` | yes | Keep as review/submitted and teacher accent | P0 |
| green | `#22734d` | yes | `--abc-green`, `--color-success` | yes | Keep as approved/complete | P0 |
| amber | `#a65f00` | yes | `--abc-amber`, `--color-warning` | yes | Keep as revision/action-needed | P0 |
| red | `#b82f2f` | yes | `--abc-red`, `--color-danger` | yes | Use for blocked/rejected/error, not default admin lane | P0 |
| teal | `#047b83` | yes | `--abc-teal`, `--color-info` | yes | Use for evidence/private artifact lane | P0 |
| violet | `#6c4aa3` | partial | `--abc-purple` | yes value, name mismatch | Add `--abc-violet` alias and use for audit/admin override | P0 |
| coral | `#c6553d` | yes | `--abc-coral` | yes | Use for intervention/coaching accents | P1 |
| gold | `#d9a441` | partial | `--abc-yellow`, `--color-accent` | yes value, name mismatch | Add `--abc-gold` alias and use for eyebrow/header context | P0 |
| border | `#dce4e5` | partial | `--abc-line`, `--border-soft` | yes value, name mismatch | Add `--color-border` or `--border` alias for Figma terminology | P1 |

Summary: the workspace contains exact Phase 6 palette values, but it still uses ABC-era alias names (`yellow`, `purple`, `line`) and older global tokens from `styles.css` in some shared controls. The issue is no longer raw hex accuracy; it is semantic naming, consistent usage, and visual composition.

## 6. Screen-by-Screen UX Findings

| Screen/section | What works | What does not feel like Figma/product system | What needs to change | Fix type |
| --- | --- | --- | --- | --- |
| Sign-in / unauthenticated state | Auth states are clear; Google/local/reset paths are safe | Photo hero and fallback wording feel like a school portal, not the product control center | Use dark product header, gold eyebrow, Figma chips, and private/audit posture copy | CSS-only plus JS copy |
| Role-aware workspace landing | Users land on useful role data quickly | The first signed-in view skips the Figma North Star framing | Add product header and role/scope banner before the role dashboard | JS render change |
| Site admin / admin overview | Metrics, risks, audit, quick actions, archive and presentation summaries exist | It is global/legacy admin, not site administration; visual style is light and generic | Phase 7 should build site-aware dashboard using Figma admin operating view | Later route work plus JS |
| Program teacher dashboard | Scoped data, needs-review list, and student visibility exist | Lacks Figma dense queue, filter bar, and intervention-focused actions | Add queue filters, source/evidence signals, and problem-state details | JS render change |
| Mentor dashboard | Assigned-only language and risk counts exist | Mentor support still feels like a list, not a scoped coaching surface | Group meeting, readiness, evidence, and next coaching action per student | JS render change |
| Student workspace | Next action, submissions, evidence upload/link forms exist | Missing guided proposal/research sections and calm work-surface hierarchy | Add next-action card, section completeness, version/revision detail | JS render change |
| Review queue | Program teacher/admin can see submitted work | Too sparse for teacher review workflow; no reason/owner/next action | Add review rows with intervention flags, filters, and direct action states | JS render change |
| Evidence upload/link forms | Captures metadata, validates upload, shows progress, avoids storage IDs | Privacy rule is not visually elevated at the form start | Add private evidence rule card and access-check language | CSS-only plus JS copy |
| Presentation section | Shows scheduled slots and day-of check-in/out actions | Empty/conflict/provider states are thin | Add status details and clearer owner/action language | JS render change |
| Archive/readiness section | Strong redaction, retention, scoped download, provider distinctions | Uses technical labels like provider and retention without administrator-friendly framing | Translate to school operations language and add permission/data cards | JS copy |
| Users/access/security section | Import reason, no-store one-time credentials, password rotation are covered | Not visually audit-sensitive; site-scoped admin policy is not visible yet | Add audit-sensitive header and site scope labels once routes exist | JS render change |
| Viewer read-only mode | Viewer banner exists and role label is correct | Read-only state does not permeate every surface | Persist read-only marker in header and action areas | JS render change |
| Empty states | Most sections have explicit copy | Many do not name owner or next action | Convert important empty states to Figma-style reason/owner/next-action cards | JS copy plus CSS |
| Error/permission-denied states | Permission-denied, no-assignment, reset, disabled, expired states exist | Problem states are too generic and do not always expose required details | Add reason, owner, next action rows | JS render change |
| Mobile/narrow layout | CSS collapses major grids and topbar | Dense dashboards may still create long generic card stacks | Verify after Phase 6.6 and Phase 7 with browser screenshots | CSS plus hosted proof later |

## 7. Accessibility / ADA / ELL Review

- Heading hierarchy is mostly usable, but signed-in role sections mix `h1` and `h2` inconsistently because overview redirects to role panels. Phase 6.6 should standardize one top product heading per active screen.
- Text density is reasonable for student surfaces and too generic for admin surfaces. Admin views need denser data, but also stronger grouping and labels so principals can scan without decoding developer terms.
- Button labels are mostly clear (`Refresh`, `Sign out`, `Open`, `Upload file`), but repeated `Open` on metric tiles is weak for screen readers and nontechnical admins. Use action-specific labels where practical.
- Status currently uses visible text plus color, which is good. The gap is status coverage and problem-state detail, not color-only dependence.
- Focus states improved in Phase 6 for buttons, tabs, quick actions, metric tiles, and inputs. Evidence links and other link buttons inherit focus through shared button classes; future custom controls must stay covered.
- Contrast risks are low for the exact Figma token values. Softer backgrounds from older global CSS should be checked when used behind muted text.
- Mobile readability is protected by grid collapses, but dense tables become stacked rows and may need stronger field labels in Phase 7.
- Plain-language clarity is mixed. Terms such as `scoped`, `provider`, `artifact`, `aggregate`, and `retention` should be paired with school-operations language for ELL users and nontechnical administrators.
- Visible source includes useful `aria-live` for the main workspace and upload status. Future status changes should keep `role="status"` or explicit live regions for async upload/check-in/archive outcomes.

## 8. Sales Demo Readiness Review

Would this look credible in front of principals/APs today? Partially. The backend-backed data and role-safe posture are credible, but the visual system does not yet make the product feel like the live Figma control center. A principal would likely understand that it works, but still see a generic dashboard rather than a polished school-operations product.

What would feel unfinished:

- The first signed-in screen does not use the Figma dark product header and chips.
- Site administration is not visibly site-scoped yet.
- Student directory and student detail are not built.
- Problem states do not always show reason, owner, and next action.
- The current admin visual language uses red/admin accents where Figma expects the audit/admin lane to lean violet and serious.

What would confuse a nontechnical admin:

- The difference between legacy `admin`, `site_admin`, `platform_admin`, and `misc_admin`.
- Technical archive/storage/provider language.
- Why the app preview looks richer than the authenticated workspace in some areas.
- Why site context is not the first thing shown to an Administration persona.

Minimum design/UX lift before showing it:

- Add a reusable Figma product header pattern to the authenticated workspace.
- Add exact posture chips, including `No student messaging`.
- Add role/scope/site context near the top of every role view.
- Complete status chip styling for all Figma statuses.
- Add reason, owner, and next action to revision/blocked/override/denied states.
- Tighten empty-state copy for demo story buckets.

Story-map demo students to surface visually later:

- `Model Excellent Demo`
- `Missing Mentor Demo`
- `Awaiting Review Demo`
- `Revision Loop Demo`
- `Presentation Pending Demo`
- `Archive Ready Demo`
- `Archive Failed Demo`
- `High Risk Demo`
- `Rich Timeline Demo`

## 9. Implementation Roadmap

### Phase 6.6 - quick CSS/UX cleanup before Phase 7

Small safe visual fixes only. No route changes.

- Add semantic aliases for exact Figma tokens (`--abc-violet`, `--abc-gold`, `--color-ink`, `--color-border`) while preserving existing aliases.
- Add reusable dark product header classes for authenticated role surfaces.
- Add exact header chip rendering helper or static copy for posture chips.
- Complete workspace status chip styles for `blocked`, `rejected`, `overridden`, `archived`, `ready`, and `configured`.
- Add a small problem-state detail component for reason, owner, and next action.
- Improve empty-state wording for review queue, mentor assignment, archive readiness, and permission denied.
- Keep announcement routes/UI absent.

### Phase 7 - site admin dashboard design requirements

- Build the site admin dashboard as an administrator operating view, not a generic metric grid.
- Start with the Figma dark product header, gold eyebrow, and chips.
- Show site context: organization, site, active scope, read-only or admin mode.
- Use violet/admin/audit accent for admin operating view; reserve red for blocked/errors.
- Include operational tiles for active students, missing mentors, awaiting review, revision loops, presentation pending, archive ready, archive failed, and high-risk students.
- Surface `Private evidence`, `Role scoped views`, `Audited changes`, and `Teacher intervention` rule cards.
- Include no announcements or messaging controls.
- Every blocked/revision/override signal must show reason, owner, and next action.

### Phase 8 - student directory design requirements

- Use a dense filter bar with site, program, cohort, status, mentor, risk, archive, and presentation filters.
- Show story chips for demo buckets.
- Use text plus color status chips.
- Show private evidence count without exposing raw storage identifiers.
- Support viewer read-only marker.
- Mobile should become stacked, labeled rows rather than a squeezed table.

### Phase 9 - student detail design requirements

- Use a site-scoped detail panel or route with student identity, program/cohort, mentor, teacher, status, risk, evidence, review history, presentation, archive, and audit timeline.
- Keep staff-only notes separate from student-visible evidence.
- Revision/blocked states must show reason, owner, and next action.
- Viewer mode must be read-only throughout.

### Later phases

- Review workflow: dense teacher queue, drawer, approval/request-revision/comment actions, history.
- Mentor assignment: assignment operations, coverage gaps, meeting status, coaching notes.
- Archive/reporting: administrator export workflows, provider-unavailable states, retention policy language, hosted archive proof.
- Hosted screenshot proof: after route-connected screens exist, capture desktop and mobile proof for sign-in, site admin, directory, detail, teacher, mentor, viewer, empty, and denied states.

## 10. Design Acceptance Checklist

Future phases must satisfy:

- Uses the dark product header pattern where appropriate.
- Uses gold eyebrow/product context text.
- Uses Figma color tokens exactly unless documented.
- Uses text plus color for status.
- Uses reason, owner, and next action for problem states.
- Uses a role/scope banner.
- Includes no announcements.
- Includes read-only viewer marker.
- Exposes private evidence and audit-safe language.
- Uses North Star workflow concepts.
- Feels like school operations, not a developer dashboard.
- Works on mobile.
- Has accessible focus states.
- Shows no raw Drive IDs, storage identifiers, credentials, or secrets.

## 11. Recommendations

Do before Phase 7:

- Run `06.6_design_cleanup_before_dashboard.txt`.
- Keep changes to CSS, copy, status chips, header component/render helpers, and tests.
- Do not add routes yet.

Do inside Phase 7:

- Build the site admin dashboard against the Figma operating-view pattern and this audit.
- Make site context, story buckets, private evidence, and audit safety visible in the first viewport.
- Phase 7 status: completed for the site dashboard vertical slice. `/api/site/dashboard` now backs the authenticated workspace Site Dashboard, uses the Phase 6.6 product header shell, site context badges, status pills, problem-state handling, private evidence / role scoped / audited changes / teacher intervention rule language, and no-announcements posture.

Do after Phase 7:

- Build student directory and student detail using the same token/status/problem-state rules.
- Add browser screenshot proof after route-connected views exist.

Do not do yet:

- Do not edit live Figma.
- Do not run remote migrations, remote writes, remote seed, or deploy.
- Do not build student directory or student detail before the site dashboard.
- Do not reintroduce announcements or messaging.
- Do not change domain, OAuth, or Cloudflare live configuration.
