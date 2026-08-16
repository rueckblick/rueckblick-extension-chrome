# AGENTS.md — rueckblick-extension-chrome

## Purpose & role

The Rueckblick MV3 browser extension (Chrome-family; developed on Brave; loaded unpacked —
no Web Store). In the architecture (plan.md §1) it is the **browser-level sensor/actuator**
hanging off the desktop app: it samples the focused active tab once per second, sends
`url_heartbeat` frames to the desktop app over the loopback bridge `ws://127.0.0.1:8434`
(§2.5), and hard-blocks exhausted URLs by **redirecting** them to an in-extension block
page. Desktop per-URL granularity is provided by this extension.

What it will **not** do: it never talks to the budget server, never computes remaining
budget from seconds, never mints time, and never persists raw URLs. The desktop app decides
(owns the budget cache and the server conversation); the extension executes and reports.
Blocking is redirect-based, never element hiding.

**Status: both halves are built, and the whole path was verified in a real browser on
2026-08-07.** The **sensor** half pairs over the loopback bridge and reports the focused
tab once a second; the **enforcement** half redirects via `declarativeNetRequest`, sweeps
already-open tabs, watches SPA navigation, and renders its own block page. 18 tests,
`tsc --noEmit` clean, `dist/` loads unpacked.

Verification is **`scripts/verify-bridge.mjs` in `rueckblick-app-tauri`**, which loads this
`dist/` into a real Chromium against the app's _real_ bridge — not a mock. It showed the
extension pair, be pushed budgets, report focused-tab heartbeats, and land a blocked URL on
`block.html`. Two defects were found by running it rather than reading it:

- **The tracker cached focus from events.** An MV3 worker is killed constantly and routinely
  wakes having missed `onFocusChanged`, so it sent one blur and then went silent forever. It
  now asks per sample.
- **The popup showed a stale pairing error under "Connected"**, reporting a failure where
  there was none.

## Invariants (this repo)

Concrete subset of plan.md §1 that binds the extension:

- **Fail-closed (§1.1).** Every row of the §2.2 decision matrix resolves ambiguity to
  _blocked_ — see `okf/concepts/fail-closed-matrix.md`. No "allow while unknown" path may
  exist. Cold start with cached rules but no fresh state ⇒ blocked; connection lost ≥ 90 s ⇒
  blocked; unknown rule / dangling parent ⇒ blocked; 401/revoked token ⇒ blocked + re-enroll.
- **90-second freshness (§1.3).** `GRACE_MS = 90_000` in `decision.ts`; staleness is computed
  at decision time from `lastStateAt`, never stored as a flag.
- **Single decision point (§1.6).** Exactly ONE matcher (`matching.ts`, whose regex source is
  used verbatim as the DNR `regexFilter` AND compiled for JS matching) and ONE decision
  function (`decision.ts`). No duplicate matching/decision logic anywhere else.
- **Fail-closed by storage split.** Persistent `chrome.storage.local` holds
  `{token?, instanceId?, rules?}`; evaporating `chrome.storage.session` holds
  `{budgets?, lastStateAt?, ...}` so a restart has no fresh state and blocks.
- **No secrets committed (§1.7).** The bridge token lives in `chrome.storage.local` only.
  There is no `.env` with secrets in this repo (`.env*` is gitignored regardless).

## Stack & commands (verified)

Versions read from `package.json` / `pnpm-lock.yaml` on 2026-07-18. **No runtime
third-party dependencies** — dev-only toolchain.

- Node 22.23, pnpm 11.9, `"type": "module"`.
- Vite **8.1.5**, Vitest **4.1.10**, TypeScript **5.9.3** (pinned — see Deviations / D-002),
  ESLint **10.7.0** (flat config) + typescript-eslint **8.64.0**, Prettier **3.9.5**,
  `@types/chrome` **0.2.2**.

Commands that work TODAY:

| Command                             | What it does                                                              |
| ----------------------------------- | ------------------------------------------------------------------------- |
| `pnpm install`                      | dev deps only                                                             |
| `pnpm typecheck`                    | `tsc --noEmit` (strict + `noUncheckedIndexedAccess`, `types: ["chrome"]`) |
| `pnpm lint`                         | `eslint .`                                                                |
| `pnpm format:check` / `pnpm format` | Prettier check / write                                                    |
| `pnpm test`                         | `vitest run`                                                              |
| `pnpm build`                        | two-pass MV3 build → `dist/`                                              |

Two-pass build: `vite build && vite build --config vite.content.config.ts`. Pass 1 emits ESM
multi-entry (`background`, `popup.html`, `block.html`) into `dist/`, `public/manifest.json`
copied, minify off, target `chrome120`. Pass 2 emits the content script as an IIFE into the
same `dist/` with `emptyOutDir: false`.

PLANNED (not yet real): a `dev`/watch mode, an in-repo mock bridge and Playwright harness
(so the extension can be checked without the desktop app running), Firefox support, and a
release workflow producing a packaged artefact rather than only an unpacked `dist/`.

## Layout

Current (real) layout:

```
public/manifest.json         # full MV3 manifest (config, copied verbatim into dist/)
popup.html  block.html       # HTML entry points at repo root (build inputs)
src/
  shared/    protocol.ts     # PROTOCOL_VERSION=1, BRIDGE_URL, frame types
             matching.ts     # the ONE matcher: one regex source, used verbatim as the DNR
                             #   regexFilter AND compiled for JS matching
             decision.ts     # the ONE decision fn; GRACE_MS=90_000, fail-closed
             storage.ts      # local (token/instanceId/rules) vs session (budgets/lastStateAt)
  background/ index.ts       # service-worker entry; wires bridge, tracker, enforcer
             bridge.ts       # loopback WebSocket: pair, auth, reconnect
             tracker.ts      # 1 Hz focused-tab heartbeat; asks per sample, never caches focus
             enforcer.ts     # the only thing that redirects: DNR rules + open-tab sweep
  content/   spa-watcher.ts  # IIFE; reports SPA route changes, holds no matcher of its own
  ui/        popup.ts  block.ts                    # pairing UI; block page with countdown
tests/       matching.test.ts decision.test.ts protocol.test.ts   # 18 tests
vite.config.ts  vite.content.config.ts  tsconfig.json  eslint.config.js
adr/  scripts/gen-decisions.sh  DECISIONS.md  okf/  .github/workflows/ci.yml  .mcp.json
```

Planned target layout adds an in-repo mock bridge + Playwright harness, and release
workflows. The source-file set matches plan.md §7.

## Contracts

- **OWNS:** nothing. This repo defines no `okf/apis/` contract.
- **CONSUMES:**
  - **Extension bridge** (`ws://127.0.0.1:8434`, §2.5) — owned by **`rueckblick-app-tauri`**
    (`okf/apis/extension-bridge.md`). Messages: `pair_request` / `auth` / `url_heartbeat`
    up; `pair_ok` / `pair_error` / `auth_ok` / `auth_error` / `rules` / `budget_state` down.
    This repo conforms; any contract change starts in the app repo and fans out here.
  - **Glob semantics** (§2.1) — canonically defined in the desktop app's
    `crates/core::glob_match`. This repo **replicates** them via test vectors in `tests/`; it
    never redefines them. If the semantics change, the app repo is the source of truth and
    this repo's vectors are updated to match.

## Mock & verification

Two harnesses, and each covers what the other cannot.

**In this repo: `pnpm e2e`** — a mock bridge plus real Chromium, driving the §11 checklist.

```sh
pnpm e2e          # builds dist/, then runs the suite
```

| Test                       | What it pins                                               |
| -------------------------- | ---------------------------------------------------------- |
| pairs through the popup    | the numeric code reaches the bridge and a token comes back |
| in front, not on a website | leaving a site is **reported**, never implied by silence   |
| redirects a blocked URL    | the DNR rule lands on `block.html?rule=<key>`              |
| sweeps an open tab         | a tab already open when the budget runs out is redirected  |
| no fresh budget            | a cached rule with stale state resolves to **blocked**     |

Two things it deliberately does:

- **It stubs OS window focus, and only that.** An automated browser does not hold desktop
  focus, so `chrome.windows.getLastFocused()` answers `focused: false` and the tracker
  correctly reports a blur — every focus-dependent test would pass by never running. Only
  the flag is faked; the window id and tab query under it are real. This was found the
  honest way, by the suite flaking on whether the window happened to have focus.
- **The fail-closed test starts from an _allowed_ budget.** Starting from a blocked one
  would pass whether or not fail-closed works, because the answer never changes.

**Port 8434 is not shareable.** The extension connects to the port the contract names, so
the mock must own that exact one. If the desktop app is running it already holds it, and
the harness says so rather than timing out five times.

**In the app repo: `scripts/verify-bridge.mjs`** — the same extension against the _real_
bridge. Stronger where they overlap, because it proves both sides read the contract the
same way; but it needs the desktop app built and running, so it cannot run in CI and cannot
force a revoked token, a 90-second silence, or a cold start.

```sh
cargo run -p rueckblick-bridge --example pair_host   # prints CODE <digits>
node scripts/verify-bridge.mjs <digits>              # in the app repo
```

**Playwright MCP** (committed `.mcp.json`): drive `popup.html` and `block.html`
interactively during development without first hand-writing a spec.

See `okf/playbooks/dev-verify.md` for the step-by-step flow.

## Knowledge & process

- **okf/** is the living knowledge base and records what is **true**. Any behavior-altering
  change updates the affected okf doc **in the same commit** — stale knowledge is a bug. The
  fail-closed matrix (`okf/concepts/fail-closed-matrix.md`) is this repo's executable spec.
- **adr/ + DECISIONS.md:** one decision per file in `adr/D-00X-<slug>.md`; `DECISIONS.md` is
  **generated** — run `scripts/gen-decisions.sh` after editing an ADR, commit both. Never
  hand-edit `DECISIONS.md`.
- **DevSpecs:** non-trivial work runs as a bounded `ds` task (epic → slices; plan → implement
  → validate → one of the six decision gates). `ds apply next` emits the one-slice prompt;
  follow it exactly and record a checkpoint with evidence before claiming a slice done. `okf`
  is registered as a markdown source (`ds config paths` shows it `[ok]`).

## Deviations from plan.md

| plan.md said (snapshot 2026-07-18) | This repo does                                                                                         | See   |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------ | ----- |
| TypeScript ^5.9                    | TypeScript pinned `~5.9.3` (registry `latest` is the native 7.x port, which crashes typescript-eslint) | D-002 |
| Vite ^6.4, Vitest ^3.2             | Vite 8.1.5, Vitest 4.1.10 (brief: "latest everything")                                                 | D-001 |
| ESLint 9 flat                      | ESLint 10.7.0 flat (typescript-eslint 8) — same flat-config idiom, newer major                         | D-001 |
| `@types/chrome ^0.0.287`           | `@types/chrome ^0.2.2` (current line; scoped-package renumbering)                                      | D-001 |

TypeScript is the one intentional non-latest pin; everything else is on current stable. The
extension source-file set and the two-pass build match plan.md §7 exactly.
