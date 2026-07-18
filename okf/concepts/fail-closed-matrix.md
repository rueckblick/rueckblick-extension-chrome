---
type: concept
title: Fail-closed decision matrix (extension)
description: Every row of the plan.md §2.2 matrix the extension's decision.ts must implement
tags: [rueckblick, extension, fail-closed, decision, invariants]
timestamp: 2026-07-18
---

# Fail-closed decision matrix

The extension's single decision function (`src/shared/decision.ts`, `GRACE_MS = 90_000`)
must implement **every** row below (plan.md §2.2). The governing rule (plan.md §1.1): any
ambiguity — server/app unreachable, stale data, revoked token, unknown rule, malformed
message, clock skew — resolves to **blocked**. There is no code path that "allows while
unknown". A self-control tool whose failure mode is _unblocked_ trains its user to induce
failures.

| Situation                                    | Decision                                    |
| -------------------------------------------- | ------------------------------------------- |
| Connected, fresh budget state (< 90 s)       | enforce exactly what the app pushed         |
| Connection lost < 90 s ago                   | keep last known state                       |
| Connection lost ≥ 90 s                       | **all budgeted rules blocked**              |
| Never paired / not enrolled                  | nothing to match (no rules known)           |
| Cold start with cached rules, no fresh state | **all budgeted rules blocked**              |
| 401 / revoked token                          | cache poisoned ⇒ blocked + re-enroll prompt |
| Unknown rule / dangling parent               | blocked                                     |

## How the storage split enforces this by construction

- **Cold start blocks automatically.** `rules` live in `chrome.storage.local` (persistent),
  but `budgets` + `lastStateAt` live in `chrome.storage.session` (evaporates on restart). So
  after a worker/browser restart the extension knows the rules but has no fresh state — the
  "cold start with cached rules, no fresh state" row — and blocks until the first
  `budget_state` arrives. `index.ts` calls `reenforce()` FIRST on every wake to make this
  the initial condition, not a race.
- **Staleness is time-based, never stored.** Freshness is computed at decision time as
  `Date.now() - lastStateAt >= GRACE_MS`. A stored "fresh" flag could outlive its truth; a
  timestamp cannot.
- **Token revocation poisons the cache.** An `auth_error` with reason `unknown_token` clears
  the stored token (only that reason does), dropping the extension to "never paired" — blocked
  with a re-enroll prompt.

## Test obligation

Each row above becomes a named test in `tests/decision.test.ts` (PLANNED — see
[[dev-verify]]). The matrix is the executable spec for this repo: a change to enforcement
behavior updates this doc in the same commit (OKF records what is true).
