# D-002 — Pin TypeScript to 5.9 (not the native 7.x port)

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
