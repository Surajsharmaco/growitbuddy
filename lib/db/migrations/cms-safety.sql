-- Additive migration. No existing content or media is modified.
BEGIN;
CREATE TABLE IF NOT EXISTS cms_revisions (
  id text PRIMARY KEY, section text NOT NULL, post_id text NOT NULL,
  slug text NOT NULL, title text NOT NULL, post jsonb NOT NULL,
  reason text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cms_revisions_post_idx
  ON cms_revisions(section, post_id, created_at);
CREATE TABLE IF NOT EXISTS cms_backups (
  id text PRIMARY KEY, snapshot jsonb NOT NULL, checksum text NOT NULL,
  reason text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cms_backups_created_idx ON cms_backups(created_at);
CREATE TABLE IF NOT EXISTS cms_backup_keys (
  id text PRIMARY KEY, secret_hash text UNIQUE NOT NULL,
  revoked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(), expires_at timestamptz NOT NULL
);
COMMIT;
