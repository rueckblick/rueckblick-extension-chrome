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

**Status: toolchain skeleton — implementation pending.** All `src/` files are documented
stubs; the build produces a loadable-shape `dist/`.

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

PLANNED (not yet real): a `dev`/watch mode, the mock-bridge verification harness, and the
CI image/release workflows (see below and `okf/playbooks/dev-verify.md`).

## Layout

Current (real) layout:

```
public/manifest.json         # full MV3 manifest (config, copied verbatim into dist/)
popup.html  block.html       # HTML entry points at repo root (build inputs)
src/
  shared/    protocol.ts     # PROTOCOL_VERSION=1, BRIDGE_URL — constants only so far
             matching.ts     # the ONE matcher (stub)
             decision.ts     # the ONE decision fn; GRACE_MS=90_000 (stub)
             storage.ts      # local/session storage split (stub)
  background/ index.ts       # service-worker entry (imports protocol constants)
             bridge.ts  enforcer.ts  tracker.ts   # stubs
  content/   spa-watcher.ts  # IIFE content script (stub)
  ui/        popup.ts  block.ts                    # popup/block entries (stubs)
tests/       protocol.test.ts # trivial constants test (toolchain proof)
vite.config.ts  vite.content.config.ts  tsconfig.json  eslint.config.js
adr/  scripts/gen-decisions.sh  DECISIONS.md  okf/  .github/workflows/ci.yml  .mcp.json
```

Planned target layout adds the real suites `tests/{matching,decision,protocol}.test.ts`, a
Python mock bridge + Playwright verification harness, and (later) release/image workflows.
The source-file set already matches plan.md §7; only their contents are stubs.

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

**NOT YET BUILT** — this is the intended design (plan.md §7, §11), documented so the
implementer has one target.

- **Python mock bridge** on `127.0.0.1:8434`: a WebSocket server standing in for the desktop
  app, simulating the §2.5 contract — `pair_ok {token}` in response to `pair_request`,
  `auth_ok` for `auth`, and on-demand `rules {...}` and `budget_state {...}` pushes. It is a
  test double for the app's bridge; the contract is owned by `rueckblick-app-tauri`, so the
  mock conforms to it rather than defining it.
- **Headless Chromium via Playwright** loads the built `dist/` unpacked and drives the §11
  extension checklist: (1) pairing via the popup numeric code, (2) `url_heartbeat` frames
  flowing ~1/s while a tab is focused, (3) DNR redirect to `block.html?rule=<key>` when the
  mock marks a rule blocked, (4) an already-open matching tab swept/redirected, (5)
  cold-start fail-closed — cached rules but no fresh `budget_state` (session storage cleared)
  ⇒ all budgeted patterns blocked on worker wake.
- **Playwright MCP** (committed `.mcp.json`, `pnpm dlx @playwright/mcp@latest`): an agent
  drives `popup.html` and `block.html` interactively during development — filling the pairing
  form, reading the rendered status/budget list, watching the block-page countdown — without
  first hand-writing a spec. Use it against the mock bridge once both exist.

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
