PRAGMA foreign_keys = ON;

-- School-owned source documents live in the connected Google Drive. The app stores links only.
INSERT OR IGNORE INTO project_templates (
  id, site_id, program_id, phase, title, description, template_url, active, created_by,
  link_check_status, link_checked_by, link_checked_at
)
SELECT
  'template-starter-' || sites.id || '-idea-proposal', sites.id, NULL, 'phase-1',
  'Project Idea and Proposal',
  'Answer short questions to choose a clear, safe project.',
  'https://docs.google.com/document/d/1SWIoBd87WfNLQACp15Iz6GcDiqLq-_15ln1qAjZ4gEE/edit',
  1, NULL, 'staff_confirmed', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM sites WHERE sites.status = 'active';

INSERT OR IGNORE INTO project_templates (
  id, site_id, program_id, phase, title, description, template_url, active, created_by,
  link_check_status, link_checked_by, link_checked_at
)
SELECT
  'template-starter-' || sites.id || '-build-journal', sites.id, NULL, 'phase-2a',
  'Build Journal',
  'Save a short note each time you work on your project.',
  'https://docs.google.com/document/d/1EFj2JHzRcJZmwBkoIov-OLJH_JmfLIC029f2KvIO0zU/edit',
  1, NULL, 'staff_confirmed', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM sites WHERE sites.status = 'active';

INSERT OR IGNORE INTO project_templates (
  id, site_id, program_id, phase, title, description, template_url, active, created_by,
  link_check_status, link_checked_by, link_checked_at
)
SELECT
  'template-starter-' || sites.id || '-mentor-notes', sites.id, NULL, 'phase-2b',
  'Mentor Meeting Notes',
  'Plan your questions and save the advice you get.',
  'https://docs.google.com/document/d/1EuSoBsnrE8dYxUgPh504plQaSOCMPVhzbNKZLbt9e1o/edit',
  1, NULL, 'staff_confirmed', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM sites WHERE sites.status = 'active';

INSERT OR IGNORE INTO project_templates (
  id, site_id, program_id, phase, title, description, template_url, active, created_by,
  link_check_status, link_checked_by, link_checked_at
)
SELECT
  'template-starter-' || sites.id || '-presentation', sites.id, NULL, 'phase-3a',
  'Presentation Plan',
  'Build a clear story and get ready for questions.',
  'https://docs.google.com/document/d/1jBlqq1_VSlyKmgS9Xhm_fw5rIoMFQPJFI5UnHXtegz4/edit',
  1, NULL, 'staff_confirmed', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM sites WHERE sites.status = 'active';

INSERT OR IGNORE INTO project_templates (
  id, site_id, program_id, phase, title, description, template_url, active, created_by,
  link_check_status, link_checked_by, link_checked_at
)
SELECT
  'template-starter-' || sites.id || '-reflection', sites.id, NULL, 'phase-4',
  'Final Reflection',
  'Explain what changed, what you learned, and how you grew.',
  'https://docs.google.com/document/d/1mGI_u6Ci-3FNxDsp26Gp2DuFEMx2viCYwKUa2Vhnics/edit',
  1, NULL, 'staff_confirmed', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM sites WHERE sites.status = 'active';

INSERT OR IGNORE INTO project_templates (
  id, site_id, program_id, phase, title, description, template_url, active, created_by,
  link_check_status, link_checked_by, link_checked_at
)
SELECT
  'template-starter-' || sites.id || '-thank-you', sites.id, NULL, 'phase-4',
  'Thank-You Letter',
  'Write a kind, clear thank-you with one real example.',
  'https://docs.google.com/document/d/1tCIjbJODqHRcEngr-gQS9ZHPp6gOxN46PU7bxoKCljQ/edit',
  1, NULL, 'staff_confirmed', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM sites WHERE sites.status = 'active';

INSERT OR IGNORE INTO project_templates (
  id, site_id, program_id, phase, title, description, template_url, active, created_by,
  link_check_status, link_checked_by, link_checked_at
)
SELECT
  'template-starter-' || sites.id || '-resume', sites.id, NULL, 'finish',
  'Resume Highlights',
  'Turn your project work into short proof of your skills.',
  'https://docs.google.com/document/d/1Z6IDSXGECMqtqVbOQt8PruhtgXMz_KfuiKtA0NJbN2U/edit',
  1, NULL, 'staff_confirmed', NULL, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
FROM sites WHERE sites.status = 'active';
