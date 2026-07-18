/**
 * Bridge WebSocket client (see plan.md §2.5, §7). Contract OWNED by rueckblick-app-tauri.
 *
 * Future responsibility (`BridgeClient`): reconnect backoff 1 s doubling to 30 s;
 * idempotent connect; no-op when there is neither a token nor a pending pair code;
 * per-profile `crypto.randomUUID()` instance id kept in `chrome.storage.local`. On open:
 * a pending code -> `pair_request`, else a token -> `auth`, else close. Handles
 * `pair_ok` (store token), `auth_error` (clear token ONLY for reason `unknown_token`),
 * `rules` (-> local), `budget_state` (-> session + `lastStateAt = Date.now()`); every
 * state change triggers re-enforcement. On close: mark disconnected, re-enforce, schedule
 * reconnect.
 *
 * No bridge logic yet — scaffold only.
 */

export {};
