/**
 * SPA navigation watcher — content script (see plan.md §7).
 *
 * YouTube changes video without a page load, so `declarativeNetRequest` never sees a
 * request to redirect. This reports the change and lets the background enforcer decide;
 * it contains no matching logic of its own, because a second matcher would drift from the
 * one the block rules are built from.
 */
(() => {
  const POLL_MS = 1_000;
  let lastHref = location.href;

  setInterval(() => {
    try {
      if (location.href === lastHref) return;
      lastHref = location.href;
      chrome.runtime.sendMessage({ type: 'nav', url: lastHref });
    } catch {
      // The extension was reloaded or the context invalidated. The next tick
      // either works or this frame is going away; either way, not worth noise.
    }
  }, POLL_MS);
})();
