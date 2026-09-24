## Purpose

Keep desktop research data and SerpApi settings in per-user storage, with a safe move from the repository database.

## Requirements

### Requirement: Persistent per-user desktop database
The desktop app SHALL keep its writable SQLite database under a dedicated per-user app data directory, independent of the application bundle and process working directory.

#### Scenario: Relaunch after saving research
- **WHEN** the owner closes and reopens the `.app`
- **THEN** previously saved discoveries, reviews, shortlist selections, and notes remain available

### Requirement: Safe one-time database move
The project SHALL provide a command to move the existing research database into desktop storage before launch. The move SHALL include committed WAL content, validate the destination before removing the source, and never replace an existing desktop database. When no desktop database exists, the app SHALL start with a new one without an import screen.

#### Scenario: Move populated repository database
- **WHEN** the owner runs the move command for the populated `server/data/miner.sqlite` database
- **THEN** the desktop app retains its apps, discovery runs, reviews, shortlist selections, and notes

#### Scenario: Move failure
- **WHEN** the source database cannot be backed up or validated
- **THEN** the command reports the failure, keeps the source, and does not activate a partial destination database

#### Scenario: Desktop database already exists
- **WHEN** the app is launched with an existing desktop database
- **THEN** it opens that database directly without overwriting it

#### Scenario: No desktop database exists
- **WHEN** the app is launched without a desktop database
- **THEN** it opens a new empty database without an import screen

### Requirement: Local SerpApi key settings
The desktop app SHALL let the owner save, replace, and clear a SerpApi key in per-user configuration outside the bundle. Only configured status SHALL be exposed to the renderer; the API and logs SHALL not reveal the key.

#### Scenario: Configure key from Finder launch
- **WHEN** the owner opens the `.app` from Finder and saves a SerpApi key in settings
- **THEN** quota checks and provider requests can use that key without a shell environment or repository `.env`

#### Scenario: Key unavailable
- **WHEN** no key is configured
- **THEN** saved local research remains available and live provider actions report that configuration is required

#### Scenario: Replace key
- **WHEN** the owner saves a replacement key
- **THEN** subsequent provider requests use the replacement without exposing either key to the renderer

### Requirement: Desktop data location is discoverable
The desktop app SHALL display its data directory path and document how to back up the database when the app is closed.

#### Scenario: Owner prepares backup
- **WHEN** the owner opens desktop settings
- **THEN** the app shows the current data directory and backup guidance
