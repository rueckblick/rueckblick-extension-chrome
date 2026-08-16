# Task 20260816-122401-ship-the-built-extension-and-bring-it-to-release A01 Plan

## Goal

Ship the built extension and bring it to release posture: correct the stale knowledge base, audit site-model parity with the desktop's new domain capture, build an in-repo mock-bridge plus Playwright verification harness, and add Firefox support with a packaged release artefact

## Description

Create a bounded implementation slice for `Ship the built extension and bring it to release posture: correct the stale knowledge base, audit site-model parity with the desktop's new domain capture, build an in-repo mock-bridge plus Playwright verification harness, and add Firefox support with a packaged release artefact`. This plan is grounded by the task index preflight, but it is not authoritative; confirm predicted files and tests before making edits.

## Resources

- `A00-index.md`
- `A01-ship-the-built-extension-and-bring-it-to-release-result.md`
- `task.json`
- `adr/D-001-scaffold-toolchain.md`
- `DECISIONS.md`

## Starting Context

### Files to Inspect First

- No pack-ranked files. Verify checkpoint leads below or search before editing.

### Tests to Inspect First

- No pack-ranked files. Verify checkpoint leads below or search before editing.

## Expected Change Surface

- Unknown. Identify the primary file before editing.

## Out-of-Scope Areas

- Replanning the whole thread unless evidence says this slice should split or be superseded.
- Broad pack-ranking changes unless they are necessary for this task.
- Treating the generated context as complete without verification.

## Risks

- Primary implementation surface is unknown.
- Relevant tests may be missing from the initial pack.
- Pack completeness is not high; verify the working set before editing.

## Success Criteria

- [ ] Primary implementation surface is verified before edits.
- [ ] Relevant tests are found or the test-surface miss is recorded.
- [ ] Changes stay inside the bounded slice.
- [ ] A checkpoint records actual files, tests, misses, noise, and decision.

## Tasks

- [ ] Inspect the predicted primary files.
- [ ] Inspect same-package, same-stem, or receipt-related tests.
- [ ] Refine the slice if context is incomplete.
- [ ] Implement the smallest useful change.
- [ ] Run focused validation.
- [ ] Update `A01-ship-the-built-extension-and-bring-it-to-release-result.md` or run `ds task checkpoint`.

## Decision Gates

- Promote: the workspace was useful enough and misses are actionable.
- Improve: useful start, but incomplete/noisy enough to require template or retrieval changes.
- Rework: task workspace feels like planning overhead or fails to capture useful evidence.
- Rollback: workspace creates false confidence or worsens agent performance.
- Block: external input or a missing prerequisite prevents useful progress.
