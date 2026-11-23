-- AYURE Backend V10 network schema for Cloudflare D1.
-- SQLite-compatible translation of the historical Supabase V10 model.
-- Authorization is enforced by AYURE server routes; D1 does not provide RLS.
-- IDs are supplied by the server (UUID strings). No auth.users dependency is assumed.
-- Existing ayure_leads is intentionally preserved: Join v0 has a live receipt contract.

CREATE TABLE IF NOT EXISTS ayure_profiles (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('buyer','owner','investor','operator','service_provider','agent','business')),
  display_name TEXT NOT NULL,
  business_name TEXT,
  headline TEXT,
  bio TEXT,
  location_text TEXT,
  markets TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(markets) AND json_type(markets) = 'array'),
  services TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(services) AND json_type(services) = 'array'),
  proof_state TEXT NOT NULL DEFAULT 'reported' CHECK (proof_state IN ('example','projected','reported','verified')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','suspended')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS ayure_properties (
  id TEXT PRIMARY KEY NOT NULL,
  owner_profile_id TEXT REFERENCES ayure_profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  location_text TEXT NOT NULL,
  price REAL,
  bedrooms REAL,
  bathrooms REAL,
  area_sqft REAL,
  property_type TEXT,
  summary TEXT,
  image_urls TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(image_urls) AND json_type(image_urls) = 'array'),
  proof_state TEXT NOT NULL DEFAULT 'reported' CHECK (proof_state IN ('example','projected','reported','verified')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','unavailable')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS ayure_services (
  id TEXT PRIMARY KEY NOT NULL,
  provider_profile_id TEXT NOT NULL REFERENCES ayure_profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  service_tags TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(service_tags) AND json_type(service_tags) = 'array'),
  markets TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(markets) AND json_type(markets) = 'array'),
  price_from REAL,
  proof_state TEXT NOT NULL DEFAULT 'reported' CHECK (proof_state IN ('example','projected','reported','verified')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','paused')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS ayure_opportunities (
  id TEXT PRIMARY KEY NOT NULL,
  creator_profile_id TEXT REFERENCES ayure_profiles(id) ON DELETE SET NULL,
  property_id TEXT REFERENCES ayure_properties(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  opportunity_type TEXT NOT NULL,
  summary TEXT,
  location_text TEXT,
  target_roles TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(target_roles) AND json_type(target_roles) = 'array'),
  budget_min REAL,
  budget_max REAL,
  proof_state TEXT NOT NULL DEFAULT 'reported' CHECK (proof_state IN ('example','projected','reported','verified')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','published','matched','closed')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS ayure_intents (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT,
  anonymous_fingerprint TEXT,
  intent_kind TEXT NOT NULL CHECK (intent_kind IN ('explore','buy','find_operator','transform','invest','offer_services')),
  location_text TEXT,
  budget_max REAL,
  target_kinds TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(target_kinds) AND json_type(target_kinds) = 'array'),
  terms TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(terms) AND json_type(terms) = 'array'),
  consented INTEGER NOT NULL DEFAULT 0 CHECK (consented IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS ayure_connections (
  id TEXT PRIMARY KEY NOT NULL,
  requester_profile_id TEXT NOT NULL REFERENCES ayure_profiles(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('profile','property','service','opportunity','business')),
  target_id TEXT NOT NULL,
  intent_id TEXT REFERENCES ayure_intents(id) ON DELETE SET NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','accepted','declined','closed')),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS ayure_profiles_type_status_idx
  ON ayure_profiles(profile_type, status);
CREATE INDEX IF NOT EXISTS ayure_properties_status_location_idx
  ON ayure_properties(status, location_text);
CREATE INDEX IF NOT EXISTS ayure_services_status_idx
  ON ayure_services(status);
CREATE INDEX IF NOT EXISTS ayure_opportunities_status_location_idx
  ON ayure_opportunities(status, location_text);
CREATE INDEX IF NOT EXISTS ayure_intents_kind_created_idx
  ON ayure_intents(intent_kind, created_at DESC);
CREATE INDEX IF NOT EXISTS ayure_connections_requester_status_idx
  ON ayure_connections(requester_profile_id, status);
