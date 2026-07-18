/**
 * SPA navigation watcher — content script (see plan.md §7).
 *
 * Future responsibility: poll `location.href` every 1 s and report changes to the service
 * worker as `{ type: "nav", url }`. Contains NO matching logic (the background enforcer
 * decides); wraps its work in try/catch so it survives extension reloads. Runs at
 * `document_start` and is bundled as an IIFE by pass 2 of the build (it cannot be an ES
 * module in the page world).
 *
 * No watcher logic yet — scaffold only. The IIFE wrapper below keeps pass 2 emitting a
 * valid dist/content.js.
 */
(() => {
  // Intentionally empty until the SPA watcher is implemented.
})();
