# rueckblick-extension-chrome

MV3 browser extension for [Rueckblick](../../plan.md) — a self-hosted, cross-device
screen-time tracker and blocker. This extension is a **thin sensor/actuator**: it samples
the focused browser tab once per second, reports raw URLs to the Rueckblick desktop app over
a loopback WebSocket bridge, and hard-blocks blocked URLs by redirecting to an
in-extension block page. It never talks to the budget server, and it never decides budgets —
the desktop app owns that.

Chrome-family, developed on Brave. **Loaded unpacked** from a release zip; a store
listing is prepared but not submitted (see [STORE.md](STORE.md)).

## Status

**Built and released.** Pairing, focused-tab reporting, `declarativeNetRequest` blocking,
the open-tab sweep, the SPA navigation watcher and the block page all exist and are
covered by an in-repo Playwright suite that drives a real browser against a mock bridge
(`pnpm e2e`). The whole path was verified against the real desktop app on 2026-08-07.

Two kinds of block reach it, both as ordinary pushed rules: a **budget** the desktop app
reports as exhausted, and a site the user marked **always blocked**, which arrives with
an empty `resets_at` and needs no budget server behind it.

**Firefox is packaged and linted but has never been run.** `pnpm package` emits both
engines' zips and `pnpm lint:firefox` is clean; nobody has watched the add-on work.

## Build & test

Requires Node 22 and pnpm 11. **No runtime third-party dependencies** — dev-only toolchain.

```bash
pnpm install
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint (flat config)
pnpm format:check   # prettier --check
pnpm test           # vitest run
pnpm build          # two-pass MV3 build -> dist/
```

`pnpm build` runs `vite build && vite build --config vite.content.config.ts`: pass 1 emits
the ESM background/popup/block bundle into `dist/` (manifest copied from `public/`); pass 2
emits the IIFE content script into the same `dist/`. Load `dist/` via
`chrome://extensions` → Developer mode → Load unpacked.

See [okf/playbooks/dev-verify.md](okf/playbooks/dev-verify.md) for the load-unpacked flow
and the planned mock-bridge + headless-Chromium verification.

## Where to look

- **[AGENTS.md](AGENTS.md)** — canonical context for humans and coding agents: invariants,
  layout, contracts, mock/verification strategy, process.
- **[okf/](okf/index.md)** — living knowledge base (concepts, playbook).
- **[DECISIONS.md](DECISIONS.md)** — generated from `adr/`; run `scripts/gen-decisions.sh`
  after editing an ADR.
