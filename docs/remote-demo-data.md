# Remote Demo Data

Remote demo seeding is intentionally gated for Cloudflare D1:

```powershell
npm run seed:demo:remote:dry-run
npm run seed:demo:remote
npm run prove:demo:remote
```

`seed:demo:remote` expands to `--remote --write --confirm SEED_REMOTE_DEMO` and refuses remote write without `CLOUDFLARE_API_TOKEN`.

## Safety

- Demo users use only `demo-student.capstone.test` and `demo-staff.capstone.test`.
- No `nv.ccsd.net`, `gmail.com`, `thecapstoneapp.com`, or `learntechonline.com` demo users are created.
- Bryan admin accounts, real users, tenant/domain/provider rows, and Drive repository/settings rows are snapshotted and preserved.
- Cleanup deletes only demo-owned rows: `demo-` IDs, approved demo domains, `example.com/capstone-demo` evidence, or `DEMO_SEED` markers.
- No physical Google Drive files are created. Evidence uses metadata plus `https://example.com/capstone-demo/...` URLs only.
- Staff credential files are written only under ignored `.secrets/demo-remote-staff-logins-*.json`; student credentials are not created.

## Seed Shape

- 250 fake students across all nine programs.
- 48 fake mentors.
- 1 fake program teacher per program.
- 225 active mentor assignments, leaving 25 students intentionally unassigned.
- Fake submissions, evidence, comments, reviews, status history, submission versions, mentor meetings, presentation slots, announcements, and archive metadata.

The proof script verifies remote D1 counts, role scope boundaries, hosted dashboard rendering, example.com-only evidence, and absence of Drive ID or secret leaks in rendered API responses.
