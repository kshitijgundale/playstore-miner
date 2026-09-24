# Play Store Miner

A local, single-user Google Play research tool. It saves Apps and Games category charts, keyword searches, product details, review samples, and manual shortlist notes in SQLite. The browser never receives the SerpApi key.

## Setup

Requires Node.js 24 or newer (for `node:sqlite`). Run `npm install`, copy `.env.example` to `.env`, and set `SERPAPI_API_KEY` in `.env`. Then run `npm run dev` and open the Vite URL printed by the client. Express listens on `127.0.0.1:3001`; Vite proxies `/api` to it. The default locale is `US/en`; country and language are stored with each observation. Run `npm run build` and `npm test` for checks. Tests use a mock provider and never use live SerpApi quota.

The browser server's SQLite database is `server/data/miner.sqlite` by default when started through the npm workspace scripts. Change `DATA_DIR` to store it elsewhere. The data directories, `.env`, `node_modules/`, and build output are gitignored. Only run one server process against this database: the quota reservation is in-process.

## macOS desktop app

On an Apple Silicon Mac, run `npm install` and `npm run desktop:package`. The local app is created at `out/Play Store Miner-darwin-arm64/Play Store Miner.app`. Open it in Finder or run `open "out/Play Store Miner-darwin-arm64/Play Store Miner.app"`. The app starts its own private local API and built UI; Vite and the browser server do not need to be running. This is an unsigned local build, not an installer.

To move existing research before launching the app, quit the browser server and run `npm run desktop:migrate-data`. The command moves `server/data/miner.sqlite` to the desktop data directory using SQLite's online backup, including committed WAL records. It validates the new database and record counts before removing the old database and its WAL files. It refuses to overwrite an existing desktop database. The app then opens the desktop database immediately; if none exists, it creates a new empty one. Check saved apps, reviews, shortlist selections, and notes before using live provider actions.

Open **Settings** in the desktop sidebar to save a SerpApi key. You can replace or clear it there. The key is stored in a user-only file outside the app and is not returned to the UI. Saved research works without a key; live fetches need one. The desktop data directory is `~/Library/Application Support/Play Store Miner/miner/`; it contains `miner.sqlite` and, when configured, `settings.json`. The exact path is shown in Settings. **Quit the app before copying `miner.sqlite` for backup** so SQLite can finish its WAL writes. Store the backup somewhere else. The app bundle includes neither `.env` nor repository research databases.

To return to the browser workflow, quit the desktop app and point `DATA_DIR` at `~/Library/Application Support/Play Store Miner/miner` before running `npm run dev`. Only run one app or browser server against this database at a time. If you want a separate browser copy, restore one from backup into `server/data/` instead.

## Requests and quota

Apps and Games are separate discovery tabs. Each opens on category charts and also offers Search. Apps categories include `PRODUCTIVITY` and `TOOLS`; Games categories include `GAME` and genres such as `GAME_ACTION` and `GAME_PUZZLE`. Games charts use SerpApi's Games engine. Games keyword search uses that engine too, but its keyword results may include apps. Product detail, reviews, and shortlist are shared by package ID.

Chart results remain fresh locally for 24 hours. Keyword searches and product details remain fresh for 7 days. A fresh match for the same source, locale, and chart or keyword is returned without a provider call. Reviews are fetched only on request; the default is one page of up to 199 one-star reviews, with at most three pages per action. A preview shows the maximum possible searches before every fetch. `Refresh` bypasses the local cache; `Force live` also sets SerpApi `no_cache=true`. SerpApi may serve a refresh from its own one-hour cache for free.

The `SAFETY_FLOOR` environment value sets the minimum searches to keep available and defaults to 20. Before an outbound search, the server checks the free SerpApi Account API and reserves the action's maximum cost. It blocks searches if the account check fails or the reservation would cross the floor. The account's monthly quota fields are authoritative. Local activity is labeled as attempts or possible cost because a SerpApi cached result can cost nothing. Ambiguous failures are recorded and not automatically retried. `GET /api/usage` returns sanitized quota fields and a freshness status; it never includes the API key.

## Evidence and limits

Every saved chart has its own Apps or Games source, country, language, category, chart, source request ID, and observed time. Recent runs and cache lookups are source-specific; old saved runs migrate to Apps with their items intact. Rank history groups by source, locale, category, and chart. Keyword display order is never treated as chart rank. Product metric snapshots are only added for distinct provider observations. Rating, reported review count, and install threshold remain separate: an install band such as `10,000+` is a lower threshold, not an exact count. Unknown price, ad status, IAP status, and update date stay unknown. Historical charts use actual observation dates and show an insufficient-history state when fewer than two comparable points exist. Review sample distribution is separate from the product-level rating distribution. Shortlist notes are manual and no opportunity score is calculated.

SerpApi provider calls live in `server/src/providers/serpapi.js` behind four data methods (`getChart`, `searchApps`, `getApp`, `getReviews`) and a separate quota method (`getAccount`). Normalization and storage are separate from those calls, so another provider can implement the data methods later. Supported categories and charts are maintained in `server/src/services/validate.js`.

## Backup

Stop the browser server before copying `server/data/miner.sqlite` to a backup location, or use SQLite's online backup command. Keep backups outside `server/data/` if they should be versioned. Migrations run on startup in filename order within transactions; a migration failure stops startup.

## Source documentation

- [SerpApi Google Play Store API](https://serpapi.com/google-play-api)
- [SerpApi Google Play Games API](https://serpapi.com/google-play-games)
- [SerpApi Games categories](https://serpapi.com/google-play-games-categories)
- [SerpApi Google Play Product API](https://serpapi.com/google-play-product-api)
- [SerpApi Account API](https://serpapi.com/account-api)
