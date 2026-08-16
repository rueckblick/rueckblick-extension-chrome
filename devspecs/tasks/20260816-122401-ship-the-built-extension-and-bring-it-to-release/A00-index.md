# Task 20260816-122401-ship-the-built-extension-and-bring-it-to-release

## Task

Ship the built extension and bring it to release posture: correct the stale knowledge base, audit site-model parity with the desktop's new domain capture, build an in-repo mock-bridge plus Playwright verification harness, and add Firefox support with a packaged release artefact

## Status

packed

## Series

A

## Profile

code-change

## Created At

2026-08-16T12:24:01Z

## Original Query

Ship the built extension and bring it to release posture: correct the stale knowledge base, audit site-model parity with the desktop's new domain capture, build an in-repo mock-bridge plus Playwright verification harness, and add Firefox support with a packaged release artefact

## Repo / Workspace

- Repo: `/home/reyemb/dev/rueckblick/extension/rueckblick-extension-chrome`
- Workspace: `/home/reyemb/dev/rueckblick/extension/rueckblick-extension-chrome/devspecs/tasks/20260816-122401-ship-the-built-extension-and-bring-it-to-release`

## Resources

- `task.json`
- `A01-ship-the-built-extension-and-bring-it-to-release-plan.md`
- `A01-ship-the-built-extension-and-bring-it-to-release-result.md`

## Task Slices

- A01: Ship the built extension and bring it to release posture: correct the stale knowledge base, audit site-model parity with the desktop's new domain capture, build an in-repo mock-bridge plus Playwright verification harness, and add Firefox support with a packaged release artefact. Plan: `A01-ship-the-built-extension-and-bring-it-to-release-plan.md`. Result: `A01-ship-the-built-extension-and-bring-it-to-release-result.md`.

## Relevant Map Areas

- `DECISIONS.md`
- `adr`

## Likely Primary Files

None found in the initial preflight.

## Likely Tests

None found in the initial preflight.

## Likely Docs / Plans / Config

- `adr/D-001-scaffold-toolchain.md` - D-001 — Scaffold toolchain & version selection
  Evidence: indexed section match: D-001 — Scaffold toolchain & version selection lines 1-29; query term match in body: base; query term match in body: build
- `DECISIONS.md` - Decision Log
  Evidence: section-packed context: Decision Log > D-019 — Sub-app attribution via AccessibilityService, isolated in a FOSS build flavor; Decision Log > D-028 — Tag-driven signed releases, R8 on, keys never in the repo; Decision Log > D-037 — Sync is one engine over several transports; the first one is a folder; indexed section match: Decision Log > D-019 — Sub-app attribution via AccessibilityService, isolated in a FOSS build flavor lines 598-683; Decision Log > D-037 — Sync is one engine over several transports; the first one is a folder lines 1602-1790; query term match in body: add

## Supporting Context

None found in the initial preflight.

## Related Git Receipts

- `8a93a28` 2026-07-18 - Scaffold MV3 extension toolchain, stubs, and knowledge base
  Matched paths: `DECISIONS.md`, `adr/D-001-scaffold-toolchain.md`

## Noise Risks

None found in the initial preflight.

## Known Knowns

- Git receipts provide historical trust evidence for packed paths.

## Known Unknowns

- Primary implementation surface is unknown.
- Relevant tests may be missing from the initial pack.
- Pack completeness is not high; verify the working set before editing.

## Confidence Summary

- Primary file confidence: low
- Test coverage confidence: low
- Docs/config coverage confidence: high
- Git receipt confidence: medium
- Noise risk: low
- Pack completeness: low

Why:

- no clear primary implementation file was found
- test companion coverage was not evident from the initial pack
- found 1 related Git receipt(s)

Agent instruction:
Validate the test and integration surface before editing. Record critical misses and distracting inclusions in the slice result or a task checkpoint.

## Suggested Starting Slice

Use `A01-ship-the-built-extension-and-bring-it-to-release-plan.md` as the first bounded plan in this task thread. Refine it before editing if primary files, tests, or integration points look incomplete.

## Agent Preflight Checklist

- [ ] Verify the likely primary files against the repo before editing.
- [ ] Search for same-package or same-command tests if test confidence is not high.
- [ ] Check receipt-touched related files before assuming the pack is complete.
- [ ] Record files actually read, edited, tests run, misses, and noise in `A01-ship-the-built-extension-and-bring-it-to-release-result.md` or `ds task checkpoint`.
