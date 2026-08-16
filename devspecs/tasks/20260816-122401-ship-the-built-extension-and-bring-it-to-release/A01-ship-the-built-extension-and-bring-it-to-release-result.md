# Task 20260816-122401-ship-the-built-extension-and-bring-it-to-release A01 Result

## Summary

- Target: `A01` - Ship the built extension and bring it to release posture: correct the stale knowledge base, audit site-model parity with the desktop's new domain capture, build an in-repo mock-bridge plus Playwright verification harness, and add Firefox support with a packaged release artefact
- Outcome: -

## Completion Contract

- Attempted slice: `A01` - Ship the built extension and bring it to release posture: correct the stale knowledge base, audit site-model parity with the desktop's new domain capture, build an in-repo mock-bridge plus Playwright verification harness, and add Firefox support with a packaged release artefact
- Gate tested: promote, improve, rework, rollback, or block
- What changed: -
- Evidence for decision: -
- What remains: -
- Next iteration: -

## Changed Files

-

## Tests

-

## Decision

-

## Follow-up

-

## References

- `A00-index.md`
- `A01-ship-the-built-extension-and-bring-it-to-release-plan.md`

## Checkpoint History

### Checkpoint
- Created At: 2026-08-16T13:37:13Z
- Stage: validated
- Decision: complete
- Source: `checkpoints/20260816-133713-validated.md`
- Structured Evidence: `checkpoints/20260816-133713-validated.json`
- Note: All four selected directions done and merged. K01: two implementation commits shipped (PR#1) and AGENTS.md corrected -- it claimed 'toolchain skeleton, implementation pending, all src/ files are documented stubs' about a repo whose halves were built and browser-verified. K02: found and fixed a real attribution bug -- a non-website tab was reported by sending nothing, indistinguishable from an asleep MV3 worker, so the journal kept charging the last site; ten minutes on github.com plus five on a new tab recorded as fifteen of github.com. Fixed across both repos (three-state Site observation; contract owner first), mutation-checked at both ends. K03: mock bridge plus real Chromium drives the whole checklist, in CI under xvfb; stubs OS window focus and nothing else, and the fail-closed test starts from an allowed budget so it cannot pass vacuously. K04: one build, two engine zips, web-ext lint clean (0/0/0); found a Chrome-only runtime enum in the DNR rule builder that would throw off Chrome and block nothing -- a fail-open invisible to any Chrome test. Two process misses worth recording: I read a grepped 'Tests 18 passed' while the line above said a file had failed (vitest was picking up the Playwright spec), and I ran the Rust gates but not pnpm lint after a Markdown edit. CI caught both. Firefox is packaged and validated, never exercised -- Playwright cannot load an MV3 extension into it, and the docs say so.
- What changed: All four selected directions done and merged. K01: two implementation commits shipped (PR#1) and AGENTS.md corrected -- it claimed 'toolchain skeleton, implementation pending, all src/ files are documented stubs' about a repo whose halves were built and browser-verified. K02: found and fixed a real attribution bug -- a non-website tab was reported by sending nothing, indistinguishable from an asleep MV3 worker, so the journal kept charging the last site; ten minutes on github.com plus five on a new tab recorded as fifteen of github.com. Fixed across both repos (three-state Site observation; contract owner first), mutation-checked at both ends. K03: mock bridge plus real Chromium drives the whole checklist, in CI under xvfb; stubs OS window focus and nothing else, and the fail-closed test starts from an allowed budget so it cannot pass vacuously. K04: one build, two engine zips, web-ext lint clean (0/0/0); found a Chrome-only runtime enum in the DNR rule builder that would throw off Chrome and block nothing -- a fail-open invisible to any Chrome test. Two process misses worth recording: I read a grepped 'Tests 18 passed' while the line above said a file had failed (vitest was picking up the Playwright spec), and I ran the Rust gates but not pnpm lint after a Markdown edit. CI caught both. Firefox is packaged and validated, never exercised -- Playwright cannot load an MV3 extension into it, and the docs say so.
- Evidence for decision: -
- What remains: -
- Next iteration: -
