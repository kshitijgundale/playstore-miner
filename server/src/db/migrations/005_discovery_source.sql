ALTER TABLE discovery_runs ADD COLUMN discovery_source TEXT NOT NULL DEFAULT 'apps' CHECK(discovery_source IN ('apps','games'));
CREATE INDEX discovery_source_lookup ON discovery_runs(discovery_source,kind,country,language,category_id,chart,keyword,fetched_at DESC);
