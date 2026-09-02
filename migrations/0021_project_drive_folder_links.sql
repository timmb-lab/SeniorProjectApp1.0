PRAGMA foreign_keys = ON;

ALTER TABLE projects ADD COLUMN drive_folder_url TEXT;
ALTER TABLE projects ADD COLUMN drive_folder_added_by TEXT REFERENCES user_accounts(id) ON DELETE SET NULL;
ALTER TABLE projects ADD COLUMN drive_folder_updated_at TEXT;
