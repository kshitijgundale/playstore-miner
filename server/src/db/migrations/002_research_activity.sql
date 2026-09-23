ALTER TABLE apps ADD COLUMN research_updated_at TEXT;
CREATE INDEX shortlist_recent ON apps(research_updated_at DESC);
