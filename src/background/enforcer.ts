/**
 * Enforcement — the ONLY thing that redirects (see plan.md §7).
 *
 * Future responsibility:
 *   - `syncDnrRules()`  : replace all dynamic `declarativeNetRequest` rules with one
 *                         redirect rule per (blocked rule × pattern) -> extensionPath
 *                         `/block.html?rule=<key>`, `main_frame` only, priority 1.
 *   - `sweepOpenTabs()` : `chrome.tabs.update` any open http/https tab that matches a
 *                         blocked rule ("exhausting a budget mid-video ends the video").
 *   - `redirectIfBlocked(tabId, url)` : covers SPA navigations reported by the content
 *                         script.
 * The redirect regex source comes verbatim from matching.ts — no second matcher lives here.
 *
 * No enforcement logic yet — scaffold only.
 */

export {};
