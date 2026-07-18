/**
 * Popup UI (see plan.md §7).
 *
 * Future responsibility: render the action popup — a status line ("not paired" /
 * "App not reachable — budgets locked (fail-closed after 90 s)" / "Connected"), a numeric
 * pairing form when unpaired, any pair error, and the budget list ("blocked" in red, or
 * remaining min/s per rule). Re-renders on `chrome.storage.onChanged`. Sends
 * `{ type: "pair", code }` to the background worker.
 *
 * No UI logic yet — scaffold only. The mount lookup below is a placeholder side effect
 * so the build keeps the popup.html -> popup.js wiring in dist/ (no rendering happens yet).
 */

const mount = document.getElementById('app');
void mount;

export {};
