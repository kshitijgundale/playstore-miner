ALTER TABLE reviews ADD COLUMN marked_at TEXT;
ALTER TABLE reviews ADD COLUMN review_note TEXT;
CREATE INDEX reviews_marked_lookup ON reviews(package_id,country,language,marked_at DESC) WHERE marked_at IS NOT NULL;
