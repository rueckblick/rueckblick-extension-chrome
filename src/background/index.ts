/**
 * Service-worker entry point (see plan.md §7).
 *
 * Future responsibility: on every worker wake, re-enforce FIRST (block all budgeted
 * patterns until the first `budget_state` arrives), then `bridge.connect()` and
 * `startTracker()`. Registers a `chrome.alarms` `rueckblick-tick` every 0.5 min (the
 * Chrome minimum) that survives worker death and re-checks staleness + retries connect.
 * Routes `onMessage`: `{ type: "pair", code }` from the popup, `{ type: "nav", url }`
 * from the content script -> `redirectIfBlocked(tabId, url)`.
 *
 * No wiring yet — scaffold only. Importing the protocol constants keeps this a real
 * module entry that pass 1 of the build can bundle to dist/background.js.
 */
import { BRIDGE_URL, PROTOCOL_VERSION } from '../shared/protocol.js';

void BRIDGE_URL;
void PROTOCOL_VERSION;
