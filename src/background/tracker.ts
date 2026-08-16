/**
 * Focused-tab tracker (see plan.md §7).
 *
 * One heartbeat a second while a browser window has focus, and nothing at all when none
 * does — a browser in the background is not where the user is, and saying otherwise would
 * charge a rule for a page nobody is looking at.
 *
 * **Silence and "not on a website" are different messages.** A focused window showing a
 * new tab, the browser's own settings or a PDF is reported as focused with an empty url.
 * Sending nothing there would look exactly like this worker being asleep, and the app
 * treats silence as "no observation" — leaving the journal charging the last site the user
 * was on.
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
  // Only real pages count as a site. A new tab, the browser's own settings, a
  // PDF or a devtools window is not somewhere the user spent time on the web.
  //
  // But it is still *reported*, as focused with an empty url. Sending nothing
  // would be indistinguishable from this worker being asleep, and the app
  // treats silence as "no observation" — so the journal would go on charging
  // the last website the user was on. Ten minutes on github.com followed by
  // five on a new tab page would be recorded as fifteen minutes of github.com.
  const onAWebsite = typeof tab?.url === 'string' && /^https?:/.test(tab.url);

  bridge.send({
    type: 'url_heartbeat',
    url: onAWebsite ? (tab.url as string) : '',
    focused: true,
    audible: tab?.audible ?? false,
    at: new Date().toISOString(),
  });
}
