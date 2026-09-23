## ADDED Requirements

### Requirement: Keep SerpApi credentials server-side
The backend SHALL read the SerpApi key from an environment variable and SHALL NOT include it in frontend assets, API responses, SQLite records, or request logs.

#### Scenario: Client inspects usage response
- **WHEN** the frontend requests quota status
- **THEN** the backend returns only quota fields and never the key returned by the Account API

### Requirement: Reuse local results before provider requests
The system SHALL check a locale-specific local cache before every discovery or detail request and SHALL avoid a provider request when the saved result is sufficiently fresh unless the user explicitly refreshes.

#### Scenario: Fresh local result
- **WHEN** an identical chart, search, or app detail request has fresh local data
- **THEN** the operation returns the saved data with zero possible search cost

#### Scenario: Explicit force-live request
- **WHEN** the user explicitly requests a live result that bypasses SerpApi's own cache
- **THEN** the system shows its possible cost before using the provider's `no_cache` option

### Requirement: Preview and guard possible search cost
The system SHALL preview the maximum number of possible searches and check current account quota before any billable action. It SHALL enforce a configurable safety floor and SHALL block billable work when current account status cannot be obtained.

#### Scenario: Multi-page review preview
- **WHEN** the user selects three review pages
- **THEN** the preview states a maximum of three possible searches before execution

#### Scenario: Safety floor reached
- **WHEN** a request's maximum possible cost would reduce remaining searches below the configured floor
- **THEN** the backend rejects the request without calling a billable provider endpoint

#### Scenario: Account status unavailable
- **WHEN** the Account API cannot be checked before a billable request
- **THEN** the backend blocks that request and reports why

### Requirement: Report quota and local request activity honestly
The system SHALL use the Account API for authoritative monthly used and remaining totals and SHALL label local per-operation figures as attempts or possible cost rather than exact billed searches.

#### Scenario: Provider serves a free cached search
- **WHEN** an outbound search is served from SerpApi's cache
- **THEN** the local log records the attempt while the account total remains the authority for actual usage

#### Scenario: Ambiguous timeout
- **WHEN** an outbound request times out after it may have reached SerpApi
- **THEN** the system records an uncertain outcome and does not automatically retry it

