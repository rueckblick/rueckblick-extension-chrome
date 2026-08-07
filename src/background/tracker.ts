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

let focusedWindowId: number | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

export function startTracker(): void {
  if (timer !== null) return;

  chrome.windows.onFocusChanged.addListener((windowId) => {
    focusedWindowId = windowId === chrome.windows.WINDOW_ID_NONE ? null : windowId;
    // Tell the app immediately that the browser lost focus, rather than letting
    // the last URL sit there until it goes stale on its own.
    if (focusedWindowId === null) {
      bridge.send({
        type: 'url_heartbeat',
        url: '',
        focused: false,
        audible: false,
        at: new Date().toISOString(),
      });
    }
  });

  // The worker may start while a window is already focused.
  void chrome.windows.getLastFocused().then((window) => {
    if (window.focused && typeof window.id === 'number') focusedWindowId = window.id;
  });

  timer = setInterval(() => void sample(), SAMPLE_MS);
}

async function sample(): Promise<void> {
  if (!bridge.ready || focusedWindowId === null) return;

  const [tab] = await chrome.tabs.query({ active: true, windowId: focusedWindowId });
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
