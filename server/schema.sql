-- Sangam SQLite Schema
-- Relational model for Collegiate Volunteer & Internship Network

CREATE TABLE IF NOT EXISTS colleges (
  id        TEXT PRIMARY KEY,
  name      TEXT UNIQUE NOT NULL,
  category  TEXT NOT NULL CHECK (category IN ('IIT', 'NIT', 'VIT', 'SRM', 'UNIVERSITY', 'OTHER')),
  city      TEXT NOT NULL DEFAULT '',
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS cities (
  id        TEXT PRIMARY KEY,
  name      TEXT UNIQUE NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS users (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  email               TEXT NOT NULL UNIQUE,
  password_hash       TEXT NOT NULL,
  role                TEXT NOT NULL CHECK (role IN ('student', 'organization')),
  college             TEXT NOT NULL DEFAULT '',
  home_city           TEXT NOT NULL DEFAULT '',
  course              TEXT NOT NULL DEFAULT '',
  skills              TEXT NOT NULL DEFAULT '',
  bio                 TEXT NOT NULL DEFAULT '',
  avatar              TEXT NOT NULL DEFAULT '',
  organization_name   TEXT NOT NULL DEFAULT '',
  organization_city   TEXT NOT NULL DEFAULT '',
  organization_role   TEXT NOT NULL DEFAULT '',
  focus_areas         TEXT NOT NULL DEFAULT '',
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'govt_registered')),
  ngo_darpan_id       TEXT NOT NULL DEFAULT '',
  registration_number TEXT NOT NULL DEFAULT '',
  registration_type   TEXT NOT NULL DEFAULT 'Trust',
  tax_exemption_80g   INTEGER NOT NULL DEFAULT 0,
  tax_exemption_12a   INTEGER NOT NULL DEFAULT 0,
  fcra_registered     INTEGER NOT NULL DEFAULT 0,
  trustee_name        TEXT NOT NULL DEFAULT '',
  verified_at         TEXT NOT NULL DEFAULT '',
  verification_notes  TEXT NOT NULL DEFAULT '',
  trust_score         INTEGER NOT NULL DEFAULT 75,
  created_at          TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS opportunities (
  id              TEXT PRIMARY KEY,
  org_id          TEXT NOT NULL REFERENCES users(id),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  skills_needed   TEXT NOT NULL DEFAULT '',
  city            TEXT NOT NULL,
  address         TEXT NOT NULL DEFAULT '',
  latitude        REAL,
  longitude       REAL,
  schedule        TEXT NOT NULL DEFAULT '',
  date            TEXT NOT NULL,
  duration        TEXT NOT NULL DEFAULT '4 Weeks',
  hours           INTEGER NOT NULL DEFAULT 20,
  capacity        INTEGER NOT NULL,
  applied_count   INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed')),
  category        TEXT NOT NULL DEFAULT 'Community Action',
  activity_format TEXT NOT NULL DEFAULT 'weekly' CHECK (activity_format IN ('weekly', 'one_day_drive', 'campaign')),
  timing_details  TEXT NOT NULL DEFAULT '',
  image           TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS teams (
  id              TEXT PRIMARY KEY,
  opportunity_id  TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  college         TEXT NOT NULL,
  city            TEXT NOT NULL DEFAULT '',
  team_name       TEXT NOT NULL DEFAULT '',
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (opportunity_id, college)
);

CREATE TABLE IF NOT EXISTS team_members (
  id         TEXT PRIMARY KEY,
  team_id    TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_via TEXT NOT NULL DEFAULT 'auto-match',
  joined_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS applications (
  id                TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opportunity_id    TEXT NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  team_id           TEXT REFERENCES teams(id) ON DELETE SET NULL,
  status            TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'withdrawn', 'completed')),
  statement         TEXT NOT NULL DEFAULT '',
  hours_logged      INTEGER NOT NULL DEFAULT 0,
  volunteer_hours   INTEGER NOT NULL DEFAULT 0,
  completion_date   TEXT NOT NULL DEFAULT '',
  completed_at      TEXT,
  certificate_id    TEXT NOT NULL DEFAULT '',
  certificate_hash  TEXT NOT NULL DEFAULT '',
  applied_at        TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (user_id, opportunity_id)
);

CREATE TABLE IF NOT EXISTS stories (
  id             TEXT PRIMARY KEY,
  author_id      TEXT REFERENCES users(id),
  author_name    TEXT NOT NULL,
  college        TEXT NOT NULL DEFAULT '',
  title          TEXT NOT NULL,
  excerpt        TEXT NOT NULL DEFAULT '',
  content        TEXT NOT NULL,
  category       TEXT NOT NULL DEFAULT 'Impact Story',
  opportunity_id TEXT,
  claps          INTEGER NOT NULL DEFAULT 0,
  image          TEXT NOT NULL DEFAULT '',
  created_at     TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS team_messages (
  id         TEXT PRIMARY KEY,
  team_id    TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id    TEXT NOT NULL REFERENCES users(id),
  user_name  TEXT NOT NULL,
  college    TEXT NOT NULL DEFAULT '',
  message    TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Performance & Query Optimization Indexes
CREATE INDEX IF NOT EXISTS idx_colleges_category ON colleges(category);
CREATE INDEX IF NOT EXISTS idx_applications_opportunity_id ON applications(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_teams_opportunity_college ON teams(opportunity_id, college);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_city ON opportunities(city);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);
CREATE INDEX IF NOT EXISTS idx_team_messages_team ON team_messages(team_id);
CREATE INDEX IF NOT EXISTS idx_stories_created ON stories(created_at);
