# Active product completion scope

This checklist is part of the current active completion run. It reconciles the user requests that followed the original storage goal so they are not lost or treated as separate, optional ideas.

## Completion standard

- Do not stop to ask product questions when a safe, reasonable implementation choice can be made.
- Use only synthetic `.test` accounts and demo data until the real-student production gate is explicitly opened.
- Verify each change in the browser as the affected role, not only with source-level tests.
- Finish each deployable pass with local `main`, GitHub `main`, Cloudflare production, and the canonical site serving the same verified commit.

## Role and account behavior

- Provide a clear, reliable Global Admin / Site Admin mode switch for eligible users.
- Preserve the selected mode and effective role while navigating; prevent permissions from drifting between global and site screens.
- Make Profile and Security real destinations with functional controls and calm, readable layouts.
- Build role-specific left navigation. Students, Mentors, Program Teachers, School Administrators, Site Admins, Global Admins, and Viewers must see only useful and authorized destinations; Global and Site Admins need complete administration tools.
- Add Back controls on screens where users can enter a focused detail or workflow and reasonably need to return.
- Create and maintain safe synthetic accounts for every role needed for testing, including a student account.
- Walk every reachable screen as Student, Program Teacher, Mentor, School Administrator, Site Admin, Global Admin, and Viewer. Check visible data, buttons, forms, notes, empty/error states, navigation, and authorization boundaries.
- Validate the supplied 25-student roster through the approved safe-user setup workflow: ignore `#` in student IDs, use student ID as username, require a unique temporary password change on first sign-in, assign students to the East Career & Technical Academy IT program and the `timmb` Program Teacher, and do not assign mentors yet. Production import remains behind the existing school/district privacy approval gate.
- Provide authorized Student Management controls for changing a student's program, active status, mentor, and optional support partner/viewer, with school scope checks, session revocation, and audit history.

## Project workspace and guidance

- Keep the application left navigation and top bar.
- On project overview screens, use a two-pane layout inspired by the referenced event detail page: the main guidance/work area scrolls independently on the left while the project summary/context pane remains static on the right.
- Leave obvious space and contrast between panes and major cards; keep text large enough to read and avoid crowded, low-contrast layouts in light and dark modes.
- Give each role meaningful tabs on the project screen. Each tab must explain its purpose, the concrete action the current role should take, what a good result looks like, and who acts next. Remove filler and generic platform language.
- Make each project phase a distinct loaded tab for Students and Mentors. Guide them through Setup, Proposal, Build I, Build II, Present, Celebrate, Reflect, and Finish with concrete expectations, decision prompts, completion criteria, and a few small examples that support rather than constrain creativity.
- Make the current task unmistakable for Students, Mentors, and Program Teachers. A read-only Mentor must immediately understand why the screen is read-only, who is assigned to act, and what useful action the Mentor can take next.
- Fix tab-bar overlap, clipping, scrolling, sticky behavior, and other broken project-workspace behavior across viewport sizes.
- Make project notes functional for authorized members, including add, edit, archive, validation, feedback, and role/privacy enforcement.
- Use restrained color differences between major project boxes to improve scanning without creating clutter.

## Demo data and core workflows

- Rebuild the synthetic demo environment with realistic projects: one fully populated project in every phase, with realistic members, artifacts, submissions, notes, review history, dates, and role-appropriate next actions.
- Make the Mentor Assignments screen readable and functional, including search/filtering, unassigned students, assignment details, and authorized assignment actions.
- Simplify Presentation into the actual workflow: a project member schedules a demonstration date with the Mentor and/or Program Teacher; authorized participants use a clear rubric and add feedback/notes visible only to project members and authorized staff.

## Teacher-managed program storage — excluded from this completion gate

- Do not hold non-Drive completion on Google Drive credentials or connection proof.
- Leave the exact owner actions needed to finish Drive setup; never expose Drive IDs or credentials.

## Release and recurring assurance

- Keep local, GitHub, Cloudflare, and the canonical live site aligned after each completed deployable pass.
- Maintain the requested every-other-hour security/permissions/roles automation. It must focus only on authorization hardening and finish each run by confirming Cloudflare public state, the local repository, and GitHub are aligned. Stay quiet when nothing meaningful changes.

## Evidence required before completion

- Automated checks pass.
- Browser walkthrough evidence exists for every role and every reachable screen.
- Representative desktop and mobile visual evidence confirms the project layout, navigation, role switcher, account menu, notes, Mentor Assignments, and Presentation workflow.
- Permission-denial tests prove cross-role and cross-tenant isolation, including navigation between Global Admin and Site Admin modes.
- The production deployment is tied to the same commit as local and GitHub `main`, and canonical-site checks prove the verified behavior is live.
