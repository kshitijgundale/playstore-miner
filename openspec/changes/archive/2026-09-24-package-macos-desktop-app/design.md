## Context

The application is an npm workspace: Vite builds the React client, while Express serves `/api` and `node:sqlite` stores research data. Development uses a fixed port and a Vite proxy. The backend reads `SERPAPI_API_KEY` and a relative `DATA_DIR` from the environment. On this machine `server/data/miner.sqlite` is the populated database (246 apps, 7 discovery runs, 1,263 reviews), and it has a WAL; root `data/miner.sqlite` is empty. The requested target is a locally built Apple Silicon macOS app for one owner.

## Goals / Non-Goals

**Goals:**
- Launch the existing workspace from a macOS `.app` without starting Vite or a separate server.
- Preserve all existing research data through a one-time database move before launch.
- Configure the SerpApi credential from the app without putting it in the bundle or exposing it through the renderer or API.
- Keep the local API restricted to the desktop UI, with current research and quota behavior intact.
- Retain the existing browser development and test workflow.

**Non-Goals:**
- Distribution installers, notarization, auto-updates, cross-platform builds, multi-user sync, or a rewrite of the research UI/API.
- Bundling the current `.env` or any repository database into the `.app`.

## Decisions

### Package with Electron Forge for macOS arm64

Add a desktop main entry and Forge configuration at the workspace root. Build the Vite client before packaging, include the server code and migrations, and exclude `.env`, database files, development dependencies where possible, and test fixtures. Pin a supported Electron version with embedded Node 24 and verify `node:sqlite` in the packaged runtime. Produce a local `.app`; an installer and release signing are outside this change. Forge is preferred over manual packaging because it manages app assembly and resource paths. Development continues to use the existing npm scripts.

### Serve the built UI and API from one private local origin

Refactor server startup so Electron can create and close the Express app and database instead of importing a module that immediately listens. In desktop mode, bind to `127.0.0.1` on an OS-assigned port and serve the built client alongside `/api`. Load the window only after the server is ready. Close the listener and database on app shutdown and enforce a single desktop instance; the in-process quota reservation assumes one server. This keeps existing relative `/api` URLs and CSV downloads workable. An `app://` protocol plus IPC for every route was considered, but would require a larger transport rewrite.

### Authenticate desktop API calls and isolate the renderer

Generate an unpredictable token at each launch. Require it on every `/api` request in desktop mode, including reads and CSV export. Keep the token in Electron's main process. Expose a narrow request bridge through preload; the main process validates the sender and request, forwards it to the local API with the token, and returns JSON or CSV bytes. Adjust the client API helper to use that bridge in desktop mode and keep browser development requests unchanged. Use a sandboxed renderer with context isolation and Node integration disabled, a restrictive content security policy, and deny unneeded navigation and new windows. Loopback binding alone is insufficient because other local processes can reach the port. The bridge permits only `/api` paths and supported request methods; settings use separate, narrow IPC handlers with sender validation. The server must never return the credential or token.

### Use per-user data and a one-time move

Store desktop files under a dedicated subdirectory of `app.getPath('userData')`. Provide a one-time command to move `server/data/miner.sqlite` into that directory before opening the app. Open the source read-only and use `node:sqlite` online backup into a temporary destination, validate integrity, expected tables, and record counts, then atomically place it at the desktop path. This captures committed WAL contents; copying only the `.sqlite` file does not. Remove the old database and WAL files only after validation succeeds. Never overwrite an existing desktop database. The app opens the desktop database directly, creating an empty one if none exists. Show the desktop data location in settings so the owner can back it up.

### Configure the SerpApi key in desktop settings

Offer save, replace, and clear controls. Persist the key in a user-only configuration file outside the bundle (mode `0600`), and keep its value in the privileged process. The renderer receives only configured/unconfigured status. Pass the current key to the provider so replacement takes effect without restarting. A Keychain-backed implementation was considered, but Electron's `safeStorage` documentation warns that unsigned builds can prompt repeatedly because macOS may not recognize successive builds as the same app. The local file matches the existing `.env` security level for this single-user build. Do not log the key, place it in a URL, or include it in errors.

## Risks / Trade-offs

- **Moving a live WAL database** → Use SQLite online backup and require closing the old server before the move; validate the resulting database before removing the source.
- **Two app instances could bypass the in-process quota reservation** → Enforce Electron's single-instance lock and start only one API listener/database connection.
- **A reachable loopback port exposes paid operations** → Require a per-launch token for every API route and deny renderer navigation to untrusted pages.
- **Plaintext per-user key file can be read by software running as this user** → Restrict file permissions and document the local-machine trust boundary; Keychain storage can be a later enhancement when signing is in scope.
- **Packaged paths differ from the repository layout** → Resolve migrations and assets relative to bundled resources, test the actual `.app`, and keep writable files under `userData`.

## Migration Plan

1. Close the browser server and run `npm run desktop:migrate-data` to move `server/data/miner.sqlite` into the desktop data directory. Verify record counts and saved notes/reviews.
2. Build and launch the `.app` without bundling any repository data.
3. Enter the SerpApi key through settings, verify saved data works before a live fetch, then run one quota-previewed provider action if desired.
4. To return to browser development, close the desktop app and point `DATA_DIR` at the desktop data directory, or restore a separate backup to `server/data/`. Desktop data can be backed up from the location shown in settings.

## Open Questions

None blocking. During implementation, confirm Forge's packaged file layout and the exact Electron release's `node:sqlite` behavior with a packaged-app smoke test.
