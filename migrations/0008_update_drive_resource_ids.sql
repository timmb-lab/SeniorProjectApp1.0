-- Update the active Google Drive evidence repository to the verified sandbox Workspace resources.
UPDATE evidence_repositories
SET
  root_folder_id = '1pfEhlrU1fax9N8LfaoA1Cyo5nUIXetG2',
  index_sheet_id = '1BCrBQ-5AKLmhvZr7tjJf3o1tibg13p_U21BiuN_ivN0'
WHERE id = 'default-google-drive';

UPDATE app_settings
SET
  value = '1BCrBQ-5AKLmhvZr7tjJf3o1tibg13p_U21BiuN_ivN0',
  updated_at = datetime('now')
WHERE key = 'evidence.index_sheet_id';
