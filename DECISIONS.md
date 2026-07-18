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
