# rueckblick-extension-chrome

MV3 browser extension for [Rueckblick](../../plan.md) — a self-hosted, cross-device
screen-time tracker and blocker. This extension is a **thin sensor/actuator**: it samples
the focused browser tab once per second, reports raw URLs to the Rueckblick desktop app over
a loopback WebSocket bridge, and hard-blocks exhausted URLs by redirecting to an
in-extension block page. It never talks to the budget server, and it never decides budgets —
the desktop app owns that.

Chrome-family, developed on Brave, **loaded unpacked** (no Web Store).

## Status

**Scaffold — implementation not started.** The toolchain, MV3 manifest, two-pass build,
and quality gates are real and pass. All source files under `src/` are stubs whose doc
comments state their future responsibility (per plan.md §7); the build produces a
loadable-shape `dist/`. No product logic, matching, decision, or bridge code exists yet.

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
