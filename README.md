# Play Store Miner

A local, single-user Google Play research tool. It saves Apps and Games category charts, keyword searches, product details, review samples, and manual shortlist notes in SQLite. The browser never receives the SerpApi key.

## Setup

Requires Node.js 24 or newer (for `node:sqlite`). Run `npm install`, copy `.env.example` to `.env`, and set `SERPAPI_API_KEY` in `.env`. Then run `npm run dev` and open the Vite URL printed by the client. Express listens on `127.0.0.1:3001`; Vite proxies `/api` to it. The default locale is `US/en`; country and language are stored with each observation. Run `npm run build` and `npm test` for checks. Tests use a mock provider and never use live SerpApi quota.

The SQLite database is `data/miner.sqlite` by default. Change `DATA_DIR` to store it elsewhere. The `data/` directory, `.env`, `node_modules/`, and build output are gitignored. Only run one server process against this database: the quota reservation is in-process.

## Requests and quota

Apps and Games are separate discovery tabs. Each opens on category charts and also offers Search. Apps categories include `PRODUCTIVITY` and `TOOLS`; Games categories include `GAME` and genres such as `GAME_ACTION` and `GAME_PUZZLE`. Games charts use SerpApi's Games engine. Games keyword search uses that engine too, but its keyword results may include apps. Product detail, reviews, and shortlist are shared by package ID.

Chart results remain fresh locally for 24 hours. Keyword searches and product details remain fresh for 7 days. A fresh match for the same source, locale, and chart or keyword is returned without a provider call. Reviews are fetched only on request; the default is one page of up to 199 one-star reviews, with at most three pages per action. A preview shows the maximum possible searches before every fetch. `Refresh` bypasses the local cache; `Force live` also sets SerpApi `no_cache=true`. SerpApi may serve a refresh from its own one-hour cache for free.

The `SAFETY_FLOOR` environment value sets the minimum searches to keep available and defaults to 20. Before an outbound search, the server checks the free SerpApi Account API and reserves the action's maximum cost. It blocks searches if the account check fails or the reservation would cross the floor. The account's monthly quota fields are authoritative. Local activity is labeled as attempts or possible cost because a SerpApi cached result can cost nothing. Ambiguous failures are recorded and not automatically retried. `GET /api/usage` returns sanitized quota fields and a freshness status; it never includes the API key.

## Evidence and limits

Every saved chart has its own Apps or Games source, country, language, category, chart, source request ID, and observed time. Recent runs and cache lookups are source-specific; old saved runs migrate to Apps with their items intact. Rank history groups by source, locale, category, and chart. Keyword display order is never treated as chart rank. Product metric snapshots are only added for distinct provider observations. Rating, reported review count, and install threshold remain separate: an install band such as `10,000+` is a lower threshold, not an exact count. Unknown price, ad status, IAP status, and update date stay unknown. Historical charts use actual observation dates and show an insufficient-history state when fewer than two comparable points exist. Review sample distribution is separate from the product-level rating distribution. Shortlist notes are manual and no opportunity score is calculated.

SerpApi provider calls live in `server/src/providers/serpapi.js` behind four data methods (`getChart`, `searchApps`, `getApp`, `getReviews`) and a separate quota method (`getAccount`). Normalization and storage are separate from those calls, so another provider can implement the data methods later. Supported categories and charts are maintained in `server/src/services/validate.js`.

## Backup

Stop the server before copying `data/miner.sqlite` to a backup location, or use SQLite's online backup command. Keep backups outside `data/` if they should be versioned. Migrations run on startup in filename order within transactions; a migration failure stops startup.

## Source documentation

- [SerpApi Google Play Store API](https://serpapi.com/google-play-api)
- [SerpApi Google Play Games API](https://serpapi.com/google-play-games)
- [SerpApi Games categories](https://serpapi.com/google-play-games-categories)
- [SerpApi Google Play Product API](https://serpapi.com/google-play-product-api)
- [SerpApi Account API](https://serpapi.com/account-api)
