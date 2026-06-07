PRAGMA foreign_keys = ON;

UPDATE app_settings
SET value = 'hardened_username_password',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE key = 'auth.mode';

UPDATE identity_providers
SET status = 'disabled',
    auto_provision_users = 0,
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE provider = 'google_workspace';

UPDATE site_programs
SET active = 0
WHERE site_id IN (
  'site-capstone-sandbox-main',
  'site-desert-valley-high',
  'site-canyon-ridge-career',
  'site-north-valley-tech'
);

UPDATE site_users
SET membership_status = 'archived'
WHERE site_id IN (
  'site-capstone-sandbox-main',
  'site-desert-valley-high',
  'site-canyon-ridge-career',
  'site-north-valley-tech'
);

UPDATE sites
SET status = 'archived',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id IN (
  'site-capstone-sandbox-main',
  'site-desert-valley-high',
  'site-canyon-ridge-career',
  'site-north-valley-tech'
)
OR slug IN (
  'capstone-sandbox-main',
  'desert-valley-high',
  'canyon-ridge-career',
  'north-valley-tech'
);

INSERT OR IGNORE INTO sites (
  id,
  tenant_id,
  name,
  slug,
  status,
  school_year
) VALUES
  (
    'site-test-high-school',
    'tenant-capstone-sandbox',
    'Test High School',
    'test-high-school',
    'active',
    '2026-2027'
  ),
  (
    'site-east-career-technical-academy',
    'tenant-capstone-sandbox',
    'East Career & Technical Academy',
    'east-career-technical-academy',
    'active',
    '2026-2027'
  );

UPDATE sites
SET name = 'Test High School',
    slug = 'test-high-school',
    status = 'active',
    school_year = '2026-2027',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'site-test-high-school';

UPDATE sites
SET name = 'East Career & Technical Academy',
    slug = 'east-career-technical-academy',
    status = 'active',
    school_year = '2026-2027',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'site-east-career-technical-academy';

DELETE FROM site_programs
WHERE site_id IN ('site-test-high-school', 'site-east-career-technical-academy');

UPDATE site_users
SET membership_status = 'archived'
WHERE site_id IN ('site-test-high-school', 'site-east-career-technical-academy');
