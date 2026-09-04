# Program Drive activation runbook

Use this once to enable teacher-managed uploads in production. Do not paste credentials into tickets, chat, screenshots, source files, or `wrangler.jsonc`.

## Before activation

- Use a Google Workspace account controlled by the school or district.
- Create or select a Google Cloud project, enable the Google Drive API, and create a dedicated service account for Capstone file storage.
- Keep the service-account key in the approved password or secrets manager. The app needs only the service-account email and private key.
- Create program folders inside a Google Shared Drive. Personal My Drive folders are intentionally rejected because a service account cannot own files there.
- Decide who at the school manages Shared Drive membership and retention. The app does not change those policies.

## Add the two production secrets

Add these encrypted secrets to the production environment of the Cloudflare Pages project `senior-capstone-app`:

- `GOOGLE_DRIVE_CLIENT_EMAIL`: the dedicated service-account email.
- `GOOGLE_DRIVE_PRIVATE_KEY`: the complete private key exactly as issued, including its BEGIN/END lines.

Use the Cloudflare dashboard’s encrypted secrets screen or the approved secret-management workflow. Do not store either value as a plain environment variable or commit it to Git.

After saving, list secret **names only** and confirm both names appear. Never print their values.

## Connect one program

1. A Program Teacher opens Account → Profile → Program file storage.
2. The teacher either chooses **Create my program folder** to create and connect a dedicated folder inside the approved school Shared Drive root, or creates/selects an existing folder inside the school Shared Drive.
3. For an existing folder, the teacher gives the displayed app storage email Editor access.
4. For an existing folder, the teacher pastes its link, checks the sharing confirmation, and chooses **Verify and connect folder**.
5. The status must become **Ready** before a student uploads a file.

The in-app create option is available only when the server credentials and approved Shared Drive root are ready. It does not expose the root or created-folder ID. Because the folder is created inside the school Shared Drive, the school—not the app—continues to control membership, retention, and deletion.

Teachers assigned to more than one program use the Program file settings selector. Each program has an independent folder, status, and revision history.

## Acceptance check

Use synthetic or formally approved test records only.

1. Upload a small PDF as a student and confirm Preview, Download, and Open in Drive.
2. Upload a small DOCX and confirm the preview is a PDF export of the app-created Google Docs companion; download must still return the original DOCX.
3. Confirm the file appears in the expected program folder and not another school or program.
4. Confirm another student, an unassigned Mentor, and a Viewer cannot open the file.
5. Confirm the assigned Mentor and Program Teacher receive only their intended read access.
6. Replace the program folder, upload another file, and confirm the older file remains reachable through its original storage revision.
7. Disconnect future uploads and confirm old evidence remains visible while new file upload falls back to the existing secure-link workflow.

## Failure and rollback

- **Folder will not verify:** confirm it is inside a Shared Drive and the exact service-account email has Editor access.
- **Preview failed:** keep the original file; use Download or Open in Drive. Do not delete and silently replace it.
- **Credentials missing:** direct upload stays disabled. Existing links and files remain intact.
- **Sharing removed:** restore Editor access and use Check connection. Evidence IDs and history do not change.
- **Emergency rollback:** disconnect the affected program folder. This stops future uploads without deleting Drive content or D1 records.

The storage ownership, retention, identifier, and permission boundaries are defined in [ADR-0003](../architecture/adr-0003-teacher-managed-program-drive-storage.md).
