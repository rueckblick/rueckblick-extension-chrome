---
type: playbook
title: Develop, load-unpacked, and verify the extension
description: Build/gate commands, load-unpacked flow, and the mock-bridge Playwright verification
tags: [rueckblick, extension, verification, playbook, mock-bridge]
timestamp: 2026-07-18
---

# Dev & verification playbook

## Quality gates (work today)

```bash
pnpm install          # dev deps only; NO runtime third-party deps
pnpm typecheck        # tsc --noEmit (strict + noUncheckedIndexedAccess, types: ["chrome"])
pnpm lint             # eslint (flat config, typescript-eslint)
pnpm format:check     # prettier --check
pnpm test             # vitest run
pnpm build            # two-pass MV3 build -> dist/
```

The two-pass build is `vite build && vite build --config vite.content.config.ts`:
pass 1 emits ESM multi-entry (`background`, `popup.html`, `block.html`) into `dist/` with
`public/manifest.json` copied and minify off; pass 2 emits the content script as an IIFE
into the same `dist/` (`emptyOutDir: false`). Result is a loadable-shape `dist/`:

```
dist/manifest.json  background.js  content.js  popup.html  popup.js  block.html  block.js
```

## Load unpacked (manual smoke)

1. `pnpm build`.
2. Chrome-family browser → `chrome://extensions` (Brave: `brave://extensions`) → enable
   **Developer mode** → **Load unpacked** → select `dist/`.
3. The action popup opens `popup.html`; the block page is a web-accessible resource at
   `chrome-extension://<id>/block.html`.

Reload the unpacked extension after each `pnpm build`. (Once implemented, the desktop app's
bridge must be running on `ws://127.0.0.1:8434` for pairing to succeed — see the app repo.)

## Verification harness — NOT YET BUILT (plan.md §7, §11)

The intended automated verification, to be added when the implementation lands:

- **Python mock bridge** on `127.0.0.1:8434` — a WebSocket server simulating the app side of
  the §2.5 contract: answers `pair_request` with `pair_ok {token}`, accepts `auth` with
  `auth_ok`, and pushes `rules {...}` and `budget_state {...}` frames on demand. It is a
  test double for the app's bridge; the bridge contract is **owned by
  `rueckblick-app-tauri`** (`okf/apis/extension-bridge.md`) — the mock conforms to it, it
  does not define it.
- **Headless Chromium via Playwright** loading the built `dist/` unpacked
  (`--load-extension=dist --disable-extensions-except=dist`, non-headless or the new headless
  that supports extensions), driving the flows in the §11 extension checklist:
  1. **Pairing** — enter a numeric code in the popup → mock returns `pair_ok` → token stored.
  2. **Heartbeats** — the mock observes `url_heartbeat` frames arriving ~1/s while a tab is
     focused.
  3. **DNR redirect** — mock pushes a `budget_state` marking a rule blocked → navigating a
     matching URL redirects to `block.html?rule=<key>`.
  4. **Tab sweep** — an already-open matching tab is redirected when the rule goes blocked.
  5. **Cold-start fail-closed** — with cached rules but no fresh `budget_state` (session
     storage cleared), all budgeted patterns are blocked on worker wake.
- **Playwright MCP** (committed `.mcp.json`) lets an agent drive `popup.html` and
  `block.html` interactively during development — click the pairing form, read the rendered
  status/budget list, watch the block-page countdown — without hand-writing a spec first.

## Test suites

All built. `pnpm test` runs the unit matrix, `pnpm e2e` the browser one.

- `matching.test.ts` — glob-semantics vectors replicated from the desktop app's
  `crates/core` (plan.md §2.1). This repo pins the semantics via vectors; it does not own
  them.
- `decision.test.ts` — one named test per row of the [[fail-closed-matrix]].
- `protocol.test.ts` — parse/drop tests for every bridge message type (malformed and
  `v !== 1` frames dropped whole).
- `e2e/extension.spec.ts` — a real browser with the extension loaded, against
  `tests/harness/mock-bridge.ts`: pairing, focused-tab reporting, leaving a website,
  redirecting a blocked URL, always-blocked copy, the open-tab sweep, and cold-start
  fail-closed. `vitest.config.ts` excludes it, so the two runners do not collide —
  without that, vitest globbed the spec and reported a pass it never ran.
