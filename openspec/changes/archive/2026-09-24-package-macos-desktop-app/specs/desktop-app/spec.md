## ADDED Requirements

### Requirement: Local macOS app build
The project SHALL provide a reproducible local build command that creates a launchable Apple Silicon macOS `.app` containing the built research UI, API, and database migrations, without bundling the repository `.env` or research databases.

#### Scenario: Launch packaged app
- **WHEN** the owner builds and opens the `.app` on the target Mac
- **THEN** the research workspace opens without a separately started Vite or Express process

#### Scenario: Excluded private files
- **WHEN** the packaged app is inspected
- **THEN** it contains no SerpApi key, `.env` file, or repository research database

### Requirement: Managed desktop lifecycle
The desktop app SHALL start one local API instance before loading the UI, SHALL stop its listener and database connection on exit, and SHALL prevent a second desktop instance from opening the same database.

#### Scenario: Second launch
- **WHEN** the owner opens the `.app` while it is already running
- **THEN** the existing window is focused and no second API or database writer starts

### Requirement: Private desktop API
The desktop app SHALL bind its API to loopback on an OS-assigned port and SHALL reject API requests lacking a valid per-launch credential. The UI SHALL access existing research and CSV export features through the authenticated desktop path.

#### Scenario: Other local client requests API
- **WHEN** a client without the current launch credential requests an API endpoint
- **THEN** the API denies the request without reading or changing research data or making a provider call

#### Scenario: Desktop export
- **WHEN** the owner exports saved reviews from the desktop UI
- **THEN** a CSV download is produced with the same scope and content as the browser workflow

### Requirement: Isolated desktop window
The desktop renderer SHALL have no direct Node.js access, SHALL use context isolation and sandboxing, and SHALL not navigate to untrusted content or open arbitrary windows.

#### Scenario: External navigation attempt
- **WHEN** content attempts to navigate the research window away from the bundled app
- **THEN** the desktop app blocks that navigation
