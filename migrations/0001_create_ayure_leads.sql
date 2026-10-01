-- Cloudflare D1 migration for AYURE Join-only v0.
-- D1 uses SQLite semantics. Authorization remains in AYURE's server route.

CREATE TABLE IF NOT EXISTS ayure_leads (
  receipt TEXT PRIMARY KEY NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  goal TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'received',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),

  CONSTRAINT ayure_leads_role_check
    CHECK (role IN ('buyer', 'owner', 'investor', 'operator', 'service_provider')),

  CONSTRAINT ayure_leads_name_check
    CHECK (length(trim(name)) BETWEEN 2 AND 120),

  CONSTRAINT ayure_leads_email_check
    CHECK (length(email) <= 254 AND email = lower(trim(email))),

  CONSTRAINT ayure_leads_goal_check
    CHECK (length(trim(goal)) BETWEEN 8 AND 2000),

  CONSTRAINT ayure_leads_status_check
    CHECK (status IN ('received', 'reviewed', 'contacted', 'archived'))
);

CREATE INDEX IF NOT EXISTS ayure_leads_created_at_idx
  ON ayure_leads (created_at DESC);

CREATE INDEX IF NOT EXISTS ayure_leads_status_created_at_idx
  ON ayure_leads (status, created_at DESC);
