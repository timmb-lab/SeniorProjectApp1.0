# ADR-0003: Teacher-Managed Program Drive Storage

Date: 2026-09-04

Status: Accepted for staged rollout

## Context

Students need a simple in-app way to attach project evidence, while schools need durable files to remain in a program-controlled Google Drive folder instead of becoming opaque application storage. The prior launch decision used student-pasted Drive links and disabled direct production uploads. This decision supersedes the evidence-storage portion of ADR-0002; it does not change the authentication decision in that ADR.

## Decision

Each `(site, program)` may have one active Google Drive storage connection. The assigned Program Teacher may either create a dedicated program folder from Profile settings inside the school's pre-approved Shared Drive root, or select an existing folder inside a school Google Shared Drive, share it with the application storage service account as Editor, and paste its URL. The server validates that every connected folder belongs to a Shared Drive and permits the service account to add files before the connection becomes ready. A personal My Drive folder is rejected because service accounts have no storage quota and cannot own files.

Creating a folder in the app is teacher-initiated but does not transfer content ownership to the application. The folder is created inside the school-controlled Shared Drive, so the school continues to own membership, retention, deletion, and off-platform access. The server never returns the new folder ID; the assigned Program Teacher receives only an app-owned Open folder route after authorization.

The app uses the narrow `drive.file` scope. It can create and retrieve files it creates in a teacher-selected folder, but it does not receive general access to the teacher's Drive. A configured program folder enables in-app student uploads for projects in that exact site and program. Programs without a ready folder retain the existing safe Drive-link workflow.

## Storage Contract

### School/program-controlled Google Drive

- Durable uploaded bytes live in the connected program folder.
- The teacher or school controls folder membership, sharing, retention, and off-platform access.
- The application creates original uploads and, for DOCX files, an app-created Google Docs conversion used only to provide a read-only PDF preview.
- A PDF preview streams the original PDF. A DOCX preview exports the app-created converted document as PDF. UTF-8 text and CSV files stream as inert `text/plain`; they are never interpreted as HTML.
- Authorized users receive app-owned preview, download, and Open in Drive routes. The browser does not receive a raw provider identifier until an authorized Open in Drive request redirects to Google's own viewer.
- Replacing or disconnecting a folder affects future uploads only. Existing artifacts retain the storage connection ID and revision used when they were created.
- Disconnect is non-destructive. It does not delete Drive files or D1 evidence records.
- Deleting a Drive file outside the app produces a recoverable broken-file state; the app must not silently substitute another file.

### Application-owned D1 data

- D1 remains the source of truth for site/program/project/student associations, original display name, safe MIME/size metadata, review state, preview state, last-known file availability, folder revision, timestamps, deletion markers, and audit events.
- Raw Drive file IDs, parent folder IDs, preview file IDs, access tokens, private keys, and provider diagnostics never appear in browser JSON, app URLs, rendered markup, or ordinary audit summaries. The sole intentional exception is the final Google-owned destination after an authorized user chooses Open in Drive.
- D1 deletion markers do not automatically delete the externally stored file. A future destructive-delete workflow requires a separately approved retention policy and explicit confirmation.

### Temporary processing

- Upload bodies exist in request memory only for validation and provider transfer; the app does not retain a second durable byte copy.
- Files are limited to 20 MiB and an explicit allowlist. MIME type, extension, and recognizable content signatures must agree; UTF-8 text rejects binary/NUL content; names are normalized; and executable signatures are rejected before provider upload.
- This validation reduces obvious abuse but is not a claim of full malware scanning. A production malware-scanning service is required before expanding the allowlist or accepting untrusted public uploads.

## Authorization and isolation

- Students may upload only to their own authorized submission. The server derives site, program, project, and storage folder from trusted database records; clients cannot choose a parent folder ID.
- Students may view/download only evidence allowed by `canAccessStudent` and project membership rules.
- Mentors may read only assigned-student/project evidence.
- Program Teachers may configure only an exact active program assignment at an accessible site and may read evidence within that scope.
- School Administrators and Site Admins may see safe connection status for accessible sites but cannot change a teacher's connection.
- Global Admins may manage connections for recovery and support. Viewer access stays read-only and never grants folder configuration.
- Every connection view/change, denied access, upload, preview, download, and Open in Drive action is audited without storage identifiers.

## Versions, duplicates, and recovery

- Every upload is a distinct immutable evidence artifact; duplicate names do not overwrite earlier files.
- The Drive name begins with the opaque evidence record ID, while the original normalized name is retained in D1 for display.
- Submission-version snapshots reference evidence records rather than copying file bytes.
- If preview conversion fails, the original DOCX remains downloadable and the UI shows a preview-unavailable state.
- Preview, download, and Open in Drive checks record a safe last-known state: available, missing or inaccessible, access lost, or temporary provider error. A successful later check clears the recovery warning.
- Missing and access-lost states give the user a recovery instruction instead of silently replacing or deleting the evidence record.
- If sharing is removed, `verify` reports a connection problem. Restoring Editor sharing and verifying again repairs future access without changing evidence IDs.

## Rollout

1. Apply migration 0032 and deploy the read-only status/configuration surface.
2. Confirm production service-account credentials and `drive.file` access.
3. Have each Program Teacher create a dedicated program folder in the app or connect and verify an existing Shared Drive folder.
4. Enable direct uploads per configured program. Keep link-only behavior as the fallback for unconfigured programs.
5. Verify PDF and DOCX upload, preview, download, denial, replacement, and disconnect behavior across roles.
6. Consider retiring the legacy global root only after every active program is configured and historical files have an approved recovery plan.

## Resolved responsibility boundary

The truncated request for “separation in contract from the…” is implemented as a strict separation between the application service, the school/program, and Google Workspace:

| Responsibility | Application service | School/program | Google Workspace |
| --- | --- | --- | --- |
| Durable file bytes | Transfers and retrieves only through authorized app routes; keeps no second durable copy | Owns the selected Shared Drive folder, membership, retention decision, and off-platform access | Stores the folder and files under the school's Workspace agreement |
| Metadata and workflow | Owns scoped D1 records, preview state, audit events, and deletion markers | Supplies correct program/folder choice and handles instructional records policy | Supplies provider file status and access enforcement |
| Credentials and identifiers | Protects service-account credentials and provider IDs; never exposes them in app JSON or app URLs | Shares only the chosen folder with the app account | Issues tokens and enforces the narrow provider grant |
| Replacement/disconnect | Revisions the connection; preserves existing evidence references; never deletes externally owned files automatically | Chooses the new folder and separately applies its retention policy to old content | Retains old files until the school changes or deletes them |
| Broken access | Reports a recoverable missing/access-lost state and audits it | Restores sharing or supplies a deliberate replacement | Returns authoritative missing/forbidden/provider status |

This technical contract does not replace a district data-processing agreement, records-retention policy, or Google Workspace agreement. Those agreements govern the school's use of the externally owned content; they do not broaden application permissions or authorize silent deletion.
