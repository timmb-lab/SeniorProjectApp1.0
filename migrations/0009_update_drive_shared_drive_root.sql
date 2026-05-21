-- Move the active Google Drive evidence repository to Bryan's Shared Drive folder.
UPDATE evidence_repositories
SET
  root_folder_id = '0AJHkstxfN-dTUk9PVA',
  index_sheet_id = '1BCrBQ-5AKLmhvZr7tjJf3o1tibg13p_U21BiuN_ivN0'
WHERE id = 'default-google-drive';

UPDATE app_settings
SET
  value = '1BCrBQ-5AKLmhvZr7tjJf3o1tibg13p_U21BiuN_ivN0',
  updated_at = datetime('now')
WHERE key = 'evidence.index_sheet_id';
