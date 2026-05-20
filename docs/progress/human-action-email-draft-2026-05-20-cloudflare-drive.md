# Senior Project App Cloudflare/Drive Action Email Draft

Subject:
Senior Project App: Cloudflare/Drive actions needed for live login/upload verification

Body:
Hi Bryan,

I checked the Senior Project App repo and Cloudflare-connected state. Codex completed the items it could complete safely:

- Repaired the local fake `.test` account seed workflow and confirmed local D1 now has the fake student, teacher, mentor, admin, misc-admin, and no-role smoke accounts.
- Verified local credential-backed workspace login, session restore, student dashboard, evidence link submission, truthful Drive-missing upload blocker, unsupported upload denial, role-route access, and logout.
- Verified the hosted `senior-capstone-app` signed-out workspace route and fake student signed-in workspace path.
- Confirmed live `/api/health` reports the Google Drive evidence root and index configured, but Drive credential parts are still missing.

The following items still require your action:

1. Provide a scoped `CLOUDFLARE_API_TOKEN` to this Codex environment when you want non-interactive read-only Pages/D1 project/deployment/secret verification.
2. Add or verify the Google Drive service-account credential secrets in Cloudflare Pages so Codex can run real live upload/download verification.

Exact Cloudflare steps:

1. Open Cloudflare Dashboard.
2. Go to Workers & Pages.
3. Open project `senior-capstone-app`.
4. Go to Settings.
5. Open Environment Variables.
6. Select Production environment.
7. Add or verify these variables/secrets:
   - `GOOGLE_DRIVE_CLIENT_EMAIL`
   - `GOOGLE_DRIVE_PRIVATE_KEY`
   - `GOOGLE_DRIVE_EVIDENCE_ROOT_ID`
8. For `GOOGLE_DRIVE_PRIVATE_KEY`, paste the full private key exactly as provided by Google, including line breaks or escaped `\n` format according to Cloudflare's secret UI.
9. Save changes.
10. Repeat for Preview environment if preview uploads should be tested too.
11. Redeploy the latest production deployment if Cloudflare does not automatically apply the new secrets.
12. Tell Codex to rerun the Senior Project App Cloudflare/Drive live verification pass.

Verification Codex should run afterward:

- `powershell -NoProfile -NonInteractive -ExecutionPolicy Bypass -File .\scripts\run-npm-script.ps1 check:cloudflare:live`
- `GET https://senior-capstone-app.pages.dev/api/health` and confirm Drive credential parts are true without printing values.
- `GET https://senior-capstone-app.pages.dev/api/evidence/drive-probe` while signed in as an authorized fake/admin account if the route remains safe for smoke use.
- Login with the fake `.test` student account.
- Submit an evidence link through `workspace.html`.
- Upload a small allowed file through the workspace and verify Drive metadata is returned without storage IDs.
- Upload one file larger than 5 MB to exercise the resumable path.
- Download the uploaded file through `/api/evidence/:id/download`.
- Confirm no passwords, private keys, tokens, session cookies, or raw Drive file IDs are printed or committed.

No actual secret values, passwords, private keys, tokens, or session cookies are included in this draft.
