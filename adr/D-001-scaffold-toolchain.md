# D-001 — Scaffold the extension toolchain (hand-rolled, latest versions)

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
