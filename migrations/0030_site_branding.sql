PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS site_branding (
  site_id TEXT PRIMARY KEY REFERENCES sites(id) ON DELETE CASCADE,
  theme_key TEXT NOT NULL DEFAULT 'default'
    CHECK (theme_key IN ('default', 'east-tech', 'desert-valley', 'canyon-ridge', 'north-valley')),
  updated_by_user_id TEXT REFERENCES user_accounts(id) ON DELETE SET NULL,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

INSERT OR IGNORE INTO site_branding (site_id, theme_key)
SELECT id, 'default'
FROM sites;

INSERT INTO site_branding (site_id, theme_key)
SELECT id, 'east-tech' FROM sites WHERE id = 'site-east-career-technical-academy'
ON CONFLICT(site_id) DO UPDATE SET theme_key = excluded.theme_key;

INSERT INTO site_branding (site_id, theme_key)
SELECT id, 'desert-valley' FROM sites WHERE id = 'site-desert-valley-high'
ON CONFLICT(site_id) DO UPDATE SET theme_key = excluded.theme_key;

INSERT INTO site_branding (site_id, theme_key)
SELECT id, 'canyon-ridge' FROM sites WHERE id = 'site-canyon-ridge-career'
ON CONFLICT(site_id) DO UPDATE SET theme_key = excluded.theme_key;

INSERT INTO site_branding (site_id, theme_key)
SELECT id, 'north-valley' FROM sites WHERE id IN ('site-north-valley-high', 'site-north-valley-tech')
ON CONFLICT(site_id) DO UPDATE SET theme_key = excluded.theme_key;
