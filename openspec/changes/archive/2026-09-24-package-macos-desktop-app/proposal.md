## Why

Play Store Miner currently requires starting two development servers and opening a browser. A locally built macOS app would let its owner launch the existing research workspace from Finder while keeping research data and the SerpApi credential outside the app bundle.

## What Changes

- Add an Apple Silicon macOS `.app` build and a desktop launch path for the existing React UI and Express API.
- Store the desktop database in the app's per-user data directory and provide a one-time move command for the populated repository database without losing its research records.
- Add local SerpApi key setup so launching from Finder does not depend on a shell environment or the repository `.env` file.
- Restrict access to the local API and keep the Electron renderer isolated from Node.js privileges.
- Document local build, launch, data location, backup, and migration steps.

## Capabilities

### New Capabilities

- `desktop-app`: Local macOS packaging, launch lifecycle, UI/API access, and desktop runtime security.
- `desktop-data-and-settings`: Per-user database, one-time data move, and SerpApi credential setup.

### Modified Capabilities

None. Existing research and quota behavior remains the same inside the desktop app.

## Impact

Adds Electron and packaging tooling at the repository root. Changes the server startup and database-path wiring, the client API transport as needed for desktop authentication, and documentation. The browser development workflow remains available. The distributable contains application code and built UI assets, but excludes `.env` and research databases.
