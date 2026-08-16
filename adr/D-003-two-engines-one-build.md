# D-003 — Two engines from one build, and what is actually verified

- **Date/Author:** 2026-08-16 · reyemb + agent
- **Context:** the extension could only be installed by loading `dist/` unpacked,
  which is fine for whoever built it and no use to anyone else. It was also
  Chrome-only in one specific, invisible way: the `declarativeNetRequest` rule
  builder read `chrome.declarativeNetRequest.RuleActionType.REDIRECT`, a **Chrome
  runtime enum**. On any other engine that object is `undefined`, reading
  `.REDIRECT` throws inside the builder, and nothing is ever blocked — a
  fail-_open_ that no amount of testing in Chrome can see.
- **Options:**
  - Stay Chrome-only and ship a zip for it.
  - Maintain a second source tree, or a `browser`/`chrome` polyfill layer.
  - **One build, two manifests**, and fix the genuinely engine-specific code.
  - Claim Firefox support on the strength of the manifest alone.
- **Decision:** one build, two manifests, and say exactly how far it is verified.
  - **The engines differ in two manifest keys, not in code.** Chrome MV3 runs a
    service worker; Firefox MV3 runs an event page declared as `scripts`. Firefox
    needs an extension id before it will install or sign; Chrome assigns one.
    `scripts/package.mjs` writes both from the same `dist/`. Nothing in
    `background.js` assumes a `ServiceWorkerGlobalScope`, so the same file is
    loaded either way.
  - **The enums were the only real portability bug, and it is fixed properly.**
    The rule builder now uses the strings the contract itself uses — `redirect`,
    `main_frame` — rather than a Chrome object that happens to hold them. That is
    correct on Chrome too; the enum was never the source of truth.
  - **No `browser`/`chrome` polyfill.** Firefox aliases `chrome.*` and returns
    promises from it, which is all this code uses. A shim would be a layer to
    maintain in exchange for nothing, and would hide which engine an incident
    came from.
  - **`data_collection_permissions: none`, and the floor raised to match.**
    Firefox requires the declaration, and for this extension the strongest answer
    is the true one: the focused tab's URL goes to a socket on `127.0.0.1` owned
    by the user's own app and no further, and no URL is written to storage. That
    key needs Firefox 142, so `strict_min_version` is 142 rather than something
    older that would promise less than the manifest states.
  - **What is verified, and what is not.** Both zips build in CI, and the Firefox
    one passes `web-ext lint` — Mozilla's own validator, the same one AMO runs —
    with zero errors, warnings and notices. That checks the manifest and the code
    against what Firefox accepts. It does **not** run the add-on: the extension
    suite drives real Chromium, because Playwright cannot load an MV3 extension
    into Firefox. So Firefox is _packaged and validated_, not _exercised_, and
    the docs say so rather than implying a green tick means it was run.
- **Rationale:** the portability bug was worth finding on its own — it would have
  presented as "the blocker silently stopped blocking" on the first non-Chrome
  install. Beyond that this buys a real artefact and an honest boundary around
  what has and has not been tried.
- **Status:** ACCEPTED. Firefox stays unexercised until something can drive it;
  until then the README and AGENTS.md say packaged-and-validated, not supported.
