CREATE TABLE apps (
  package_id TEXT PRIMARY KEY, first_seen_at TEXT NOT NULL, last_seen_at TEXT NOT NULL,
  shortlisted_at TEXT, wedge_note TEXT, improvement_note TEXT, pricing_note TEXT, complaints_note TEXT
);
CREATE TABLE discovery_runs (
  id INTEGER PRIMARY KEY, kind TEXT NOT NULL CHECK(kind IN ('chart','search')),
  country TEXT NOT NULL, language TEXT NOT NULL, category_id TEXT, chart TEXT, keyword TEXT,
  provider TEXT NOT NULL, fetched_at TEXT NOT NULL, source_observed_at TEXT NOT NULL,
  source_request_id TEXT NOT NULL,
  UNIQUE(kind,country,language,category_id,chart,keyword,provider,source_request_id)
);
CREATE INDEX discovery_lookup ON discovery_runs(kind,country,language,category_id,chart,keyword,fetched_at DESC);
CREATE TABLE discovery_items (
  run_id INTEGER NOT NULL REFERENCES discovery_runs(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES apps(package_id), section TEXT NOT NULL,
  display_position INTEGER NOT NULL, chart_rank INTEGER,
  title TEXT, developer TEXT, category TEXT, rating REAL, reported_count INTEGER,
  reported_count_source TEXT, install_band_text TEXT, price_text TEXT, icon_url TEXT, description TEXT,
  ads_flag INTEGER, iap_flag INTEGER, updated_on_text TEXT,
  PRIMARY KEY(run_id,section,display_position,package_id)
);
CREATE INDEX discovery_items_app ON discovery_items(package_id,run_id);
CREATE TABLE app_details (
  package_id TEXT NOT NULL REFERENCES apps(package_id), country TEXT NOT NULL, language TEXT NOT NULL,
  fetched_at TEXT NOT NULL, source_observed_at TEXT NOT NULL, source_request_id TEXT NOT NULL,
  title TEXT, developer TEXT, category TEXT, icon_url TEXT, description TEXT,
  screenshots_json TEXT, related_json TEXT, rating_distribution_json TEXT, updated_on_text TEXT,
  rating REAL, reported_count INTEGER, reported_count_source TEXT, install_band_text TEXT,
  price_text TEXT, ads_flag INTEGER, iap_flag INTEGER, iap_price_range TEXT,
  PRIMARY KEY(package_id,country,language)
);
CREATE TABLE app_snapshots (
  id INTEGER PRIMARY KEY, package_id TEXT NOT NULL REFERENCES apps(package_id),
  country TEXT NOT NULL, language TEXT NOT NULL, source_type TEXT NOT NULL,
  source_request_id TEXT NOT NULL, observed_at TEXT NOT NULL,
  rating REAL, reported_count INTEGER, reported_count_source TEXT,
  install_band_text TEXT, install_floor INTEGER, price_text TEXT, ads_flag INTEGER, iap_flag INTEGER,
  UNIQUE(package_id,country,language,source_type,source_request_id)
);
CREATE INDEX snapshots_history ON app_snapshots(package_id,country,language,source_type,observed_at);
CREATE TABLE reviews (
  package_id TEXT NOT NULL REFERENCES apps(package_id), review_id TEXT NOT NULL,
  country TEXT NOT NULL, language TEXT NOT NULL, stars INTEGER,
  body TEXT, likes INTEGER, review_date TEXT, first_fetched_at TEXT NOT NULL, last_seen_at TEXT NOT NULL,
  PRIMARY KEY(package_id,review_id,country,language)
);
CREATE INDEX reviews_lookup ON reviews(package_id,country,language,stars,review_date);
CREATE TABLE review_fetches (
  id INTEGER PRIMARY KEY, package_id TEXT NOT NULL REFERENCES apps(package_id),
  country TEXT NOT NULL, language TEXT NOT NULL, rating_filter INTEGER,
  source_sort INTEGER NOT NULL, requested_page_token TEXT, next_page_token TEXT,
  result_count INTEGER NOT NULL, fetched_at TEXT NOT NULL, source_observed_at TEXT NOT NULL,
  source_request_id TEXT NOT NULL, UNIQUE(package_id,country,language,source_request_id)
);
CREATE TABLE api_requests (
  id INTEGER PRIMARY KEY, operation TEXT NOT NULL, params_json TEXT NOT NULL,
  outcome TEXT NOT NULL, possible_cost INTEGER NOT NULL, source_request_id TEXT,
  created_at TEXT NOT NULL, message TEXT
);
CREATE INDEX api_requests_recent ON api_requests(created_at DESC);
CREATE TABLE account_snapshots (
  id INTEGER PRIMARY KEY, searches_per_month INTEGER, this_month_usage INTEGER,
  plan_searches_left INTEGER, plan_renewal_date TEXT, fetched_at TEXT NOT NULL
);
