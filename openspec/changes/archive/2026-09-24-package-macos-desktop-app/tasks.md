## 1. Desktop build and server lifecycle

- [x] 1.1 Add Electron and Forge configuration and root scripts for a local macOS arm64 `.app` build; include the built client, server, and migrations while excluding `.env`, research databases, and test fixtures.
- [x] 1.2 Refactor Express setup and database opening so the browser entry retains its current behavior and Electron can start and close a server on `127.0.0.1` with an OS-assigned port.
- [x] 1.3 Add the Electron main entry with a single-instance lock, server readiness before window load, and listener/database cleanup on exit.
- [x] 1.4 Serve the built Vite assets from the desktop server and confirm relative `/api` paths work in the packaged app.

## 2. Desktop API security

- [x] 2.1 Require a random per-launch credential on every desktop `/api` route, including reads and CSV export, and verify requests without it cannot trigger provider calls.
- [x] 2.2 Add a sandboxed, context-isolated window and a narrow preload request bridge; validate IPC senders and allowed API paths/methods in the main process, retaining the browser client transport.
- [x] 2.3 Route CSV downloads through the desktop bridge and verify exported content and filenames match the browser workflow.
- [x] 2.4 Add a restrictive content security policy and block unneeded navigation, new windows, and privileged renderer access.

## 3. Desktop data and settings

- [x] 3.1 Store the desktop database under a dedicated `userData` subdirectory and open it directly without a first-run screen.
- [x] 3.2 Add a one-time move command using SQLite online backup to a temporary file, validate integrity/schema/counts, atomically activate it, and remove the source only after validation.
- [x] 3.3 Add desktop settings to save, replace, and clear the SerpApi key in a user-only file outside the app bundle; expose only configured status to the renderer and make replacement effective for subsequent requests.
- [x] 3.4 Show the desktop data directory and backup guidance in settings, including the need to close the app before copying the database.

## 4. Verification and documentation

- [x] 4.1 Add focused tests for authenticated API access, browser workflow compatibility, WAL-backed migration, failed migration, and key replacement/missing-key behavior.
- [x] 4.2 Build and launch the actual Apple Silicon `.app`; verify `node:sqlite`, saved-data persistence after relaunch, CSV export, single-instance behavior, and absence of `.env`, keys, and research databases from the bundle.
- [x] 4.3 Document local build and launch, moving `server/data/miner.sqlite`, key setup, desktop data location, backup, and rollback to the browser workflow.
