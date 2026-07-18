/**
 * Focused-tab tracker (see plan.md §7).
 *
 * Future responsibility: `SAMPLE_MS = 1000`; track window focus via
 * `chrome.windows.onFocusChanged`; while authenticated, send
 * `url_heartbeat { url, focused: true, audible: tab.audible ?? false, at: ISO }` for the
 * active tab of the last-focused window, 1×/s. Raw URLs are never persisted by the
 * extension — only the desktop app maps them to rule-matched seconds for the server.
 *
 * No tracker logic yet — scaffold only.
 */

export {};
