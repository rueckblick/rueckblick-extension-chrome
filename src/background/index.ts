/**
 * Service-worker entry point (see plan.md §7).
 *
 * A Manifest V3 worker is killed and restarted constantly, so nothing here may assume it
 * has been running: every wake reconnects and restarts the tracker, both of which are
 * idempotent. The alarm exists because a worker with no timers is a worker Chrome will
 * not wake at all, and half a minute is the shortest interval it allows.
 */
import { bridge } from './bridge.js';
import { startTracker } from './tracker.js';

const TICK_ALARM = 'rueckblick-tick';

function wake(): void {
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

chrome.runtime.onMessage.addListener((message, _sender, respond) => {
  if (message?.type === 'pair' && typeof message.code === 'string') {
    void bridge.pair(message.code).then(() => respond({ ok: true }));
    return true;
  }
  return false;
});

wake();
