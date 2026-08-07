/**
 * Service-worker entry point (see plan.md §7).
 *
 * A Manifest V3 worker is killed and restarted constantly, so nothing here may assume it
 * has been running: every wake reconnects and restarts the tracker, both of which are
 * idempotent. The alarm exists because a worker with no timers is a worker Chrome will
 * not wake at all, and half a minute is the shortest interval it allows.
 */
import { bridge } from './bridge.js';
import { redirectIfBlocked, reenforce } from './enforcer.js';
import { startTracker } from './tracker.js';

const TICK_ALARM = 'rueckblick-tick';

function wake(): void {
  // Re-enforce FIRST, before anything can connect. A cold start has cached
  // rules and no fresh budget, so this makes "blocked until told otherwise" the
  // initial condition rather than something racing the socket.
  void reenforce();
  void bridge.connect();
  startTracker();
}

chrome.runtime.onStartup.addListener(wake);
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(TICK_ALARM, { periodInMinutes: 0.5 });
  wake();
});
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === TICK_ALARM) wake();
});

chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type === 'pair' && typeof message.code === 'string') {
    void bridge.pair(message.code).then(() => respond({ ok: true }));
    return true;
  }
  // A single-page app navigated without a request declarativeNetRequest could
  // see, so the tab has to be judged directly.
  if (message?.type === 'nav' && typeof message.url === 'string') {
    const tabId = sender.tab?.id;
    if (typeof tabId === 'number') void redirectIfBlocked(tabId, message.url);
    return false;
  }
  return false;
});

// Anything the app tells us changes what must be blocked, and the storage write
// is the one place every path funnels through.
chrome.storage.onChanged.addListener((changes, area) => {
  if ((area === 'session' && changes.budgets) || (area === 'local' && changes.rules)) {
    void reenforce();
  }
});

wake();
