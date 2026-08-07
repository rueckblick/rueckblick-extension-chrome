/**
 * Focused-tab tracker (see plan.md §7).
 *
 * One heartbeat a second for the active tab of the focused window, and nothing at all
 * when no window has focus — a browser in the background is not where the user is, and
 * saying otherwise would charge a rule for a page nobody is looking at.
 *
 * Raw URLs are never persisted here. They are sent to the desktop app, which matches them
 * against rules and keeps only what it is allowed to keep.
 */
import { bridge } from './bridge.js';

const SAMPLE_MS = 1_000;

let timer: ReturnType<typeof setInterval> | null = null;
let reportedBlur = false;

export function startTracker(): void {
  if (timer !== null) return;

  // Blur is reported the moment it happens rather than waiting for the next
  // sample, so the app stops charging a rule as soon as the browser is behind
  // something else.
  chrome.windows.onFocusChanged.addListener((windowId) => {
    if (windowId === chrome.windows.WINDOW_ID_NONE) blur();
  });

  timer = setInterval(() => void sample(), SAMPLE_MS);
}

function blur(): void {
  if (reportedBlur) return;
  reportedBlur = true;
  bridge.send({
    type: 'url_heartbeat',
    url: '',
    focused: false,
    audible: false,
    at: new Date().toISOString(),
  });
}

/**
 * Focus is asked for on every sample rather than remembered from an event.
 *
 * A Manifest V3 worker is killed and restarted constantly, so it routinely wakes
 * having missed every `onFocusChanged` it would have needed — and a tracker that
 * only learns about focus from events then reports nothing at all until the user
 * happens to switch windows. Asking costs one call a second and cannot be missed.
 */
async function sample(): Promise<void> {
  if (!bridge.ready) return;

  const window = await chrome.windows.getLastFocused().catch(() => null);
  if (!window?.focused || typeof window.id !== 'number') {
    blur();
    return;
  }
  reportedBlur = false;

  const [tab] = await chrome.tabs.query({ active: true, windowId: window.id });
  // Only real pages. A new tab, the extensions page or a devtools window is not
  // somewhere the user spent time on the web.
  if (!tab?.url || !/^https?:/.test(tab.url)) return;

  bridge.send({
    type: 'url_heartbeat',
    url: tab.url,
    focused: true,
    audible: tab.audible ?? false,
    at: new Date().toISOString(),
  });
}
