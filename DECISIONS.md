# Decision Log

> Generated from adr/ — edit the per-decision files, not this one.

## D-001 — Scaffold the extension toolchain (hand-rolled, latest versions)

- **Date/Author:** 2026-07-18 · reyemb + agent
- **Context:** `rueckblick-extension-chrome` is an MV3 extension built and loaded unpacked
  (no Web Store). No community scaffolder targets this shape (two-pass Vite build: ESM
  multi-entry + IIFE content script, MV3 manifest, zero runtime deps). It needs a buildable
  toolchain skeleton only — no product logic — per the repo-setup brief.
- **Options:**
  1. Adopt a third-party MV3 scaffolder / framework (WXT, CRXJS, Plasmo).
  2. Hand-roll pnpm + Vite + Vitest + TypeScript + ESLint 9 flat + Prettier with an
     explicit two-pass build.
- **Decision:** Option 2. Hand-rolled scaffold on latest stable toolchain: pnpm 11.9,
  `"type":"module"`, Vite 8, Vitest 4, ESLint 10 (flat, typescript-eslint), Prettier 3,
  `@types/chrome`. **No runtime third-party dependencies** (plan.md §7 hard requirement,
  enforced from day one). The build is `vite build && vite build --config
vite.content.config.ts`: pass 1 emits ESM multi-entry (background, popup.html, block.html)
  into `dist/` with `public/manifest.json` copied and minify off; pass 2 emits the content
  script as an IIFE into the same `dist/` with `emptyOutDir: false`.
- **Rationale:** A framework would pull runtime/build magic and dependencies that conflict
  with the "thin sensor/actuator, no third-party runtime deps" invariant and obscure the
  exact MV3 output. Hand-rolling keeps the loaded-unpacked bundle fully inspectable and the
  two-pass contract explicit. Latest versions follow the brief's "latest everything" rule;
  the ecosystem was coherent on current stable except for TypeScript (see D-002).
- **Status:** ACCEPTED

## D-002 — Pin TypeScript to 5.9 (not the native 7.x port)

- **Date/Author:** 2026-07-18 · reyemb + agent
- **Context:** The brief mandates "latest everything". On 2026-07-18 the `typescript`
  dist-tag `latest` is **7.0.2** — the native (Go) compiler port. Installing it, `tsc
--noEmit` runs, but ESLint crashes hard: `typescript-eslint@8.64.0` →
  `@typescript-eslint/typescript-estree` reads TypeScript compiler internals
  (`ts.Cjs`, program-watch APIs) that the native port does not expose
  (`TypeError: Cannot read properties of undefined (reading 'Cjs')`). typescript-eslint's
  own peer range caps TypeScript at `>=4.8.4 <6.1.0`.
- **Options:**
  1. Keep TypeScript 7.0.2 and drop type-aware/ESLint TS linting until the ecosystem
     catches up.
  2. Pin TypeScript to the latest 5.x (`~5.9.3`) so the whole toolchain is coherent.
- **Decision:** Option 2 — `typescript` pinned to `~5.9.3`. Every other tool stays on
  its latest stable.
- **Rationale:** ESLint over TypeScript is a required quality gate for this repo; losing
  it to run a compiler the lint ecosystem cannot yet parse is a bad trade. This is the
  brief's explicit "adapt to the current idiom and record the deviation" case. Revisit once
  typescript-eslint supports the TS 7 native port.
- **Status:** ACCEPTED

## D-003 — Two engines from one build, and what is actually verified

- **Date/Author:** 2026-08-16 · reyemb + agent
- **Context:** the extension could only be installed by loading `dist/` unpacked,
  which is fine for whoever built it and no use to anyone else. It was also
  Chrome-only in one specific, invisible way: the `declarativeNetRequest` rule
  builder read `chrome.declarativeNetRequest.RuleActionType.REDIRECT`, a **Chrome
  runtime enum**. On any other engine that object is `undefined`, reading
  `.REDIRECT` throws inside the builder, and nothing is ever blocked — a
  fail-*open* that no amount of testing in Chrome can see.
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
    into Firefox. So Firefox is *packaged and validated*, not *exercised*, and
    the docs say so rather than implying a green tick means it was run.
- **Rationale:** the portability bug was worth finding on its own — it would have
  presented as "the blocker silently stopped blocking" on the first non-Chrome
  install. Beyond that this buys a real artefact and an honest boundary around
  what has and has not been tried.
- **Status:** ACCEPTED. Firefox stays unexercised until something can drive it;
  until then the README and AGENTS.md say packaged-and-validated, not supported.
