export const schemaSql = `
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  canonical_json TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS platform_drafts (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  draft_json TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS publish_jobs (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  draft_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  account_id TEXT,
  mode TEXT NOT NULL,
  level TEXT NOT NULL,
  status TEXT NOT NULL,
  external_id TEXT,
  external_url TEXT,
  review_status TEXT,
  result_json TEXT,
  error_code TEXT,
  error_message TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  display_name TEXT,
  auth_type TEXT NOT NULL,
  encrypted_credentials TEXT,
  scopes_json TEXT,
  expires_at INTEGER,
  status TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  post_id TEXT,
  type TEXT NOT NULL,
  local_path TEXT,
  data_url TEXT,
  filename TEXT,
  mime_type TEXT,
  size INTEGER,
  width INTEGER,
  height INTEGER,
  duration INTEGER,
  hash TEXT,
  platform_urls_json TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS publish_logs (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  platform TEXT NOT NULL,
  level TEXT NOT NULL,
  message TEXT NOT NULL,
  raw_json TEXT,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_platform_drafts_post_id ON platform_drafts(post_id);
CREATE INDEX IF NOT EXISTS idx_publish_jobs_post_platform ON publish_jobs(post_id, platform);
CREATE INDEX IF NOT EXISTS idx_publish_logs_job_id ON publish_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_accounts_platform ON accounts(platform);
`;

export const migrationSql = `
ALTER TABLE publish_jobs ADD COLUMN draft_id TEXT;
ALTER TABLE publish_jobs ADD COLUMN account_id TEXT;
ALTER TABLE publish_jobs ADD COLUMN level TEXT;
ALTER TABLE publish_jobs ADD COLUMN external_id TEXT;
ALTER TABLE publish_jobs ADD COLUMN external_url TEXT;
ALTER TABLE publish_jobs ADD COLUMN review_status TEXT;
ALTER TABLE publish_jobs ADD COLUMN error_code TEXT;
ALTER TABLE assets ADD COLUMN data_url TEXT;
ALTER TABLE assets ADD COLUMN filename TEXT;
`;
