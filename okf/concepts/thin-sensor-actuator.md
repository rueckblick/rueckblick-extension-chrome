---
type: concept
title: Thin sensor/actuator — responsibility split and single decision point
description: How the extension observes and enforces, and why there is exactly one matcher and one decision function
tags: [rueckblick, extension, architecture, invariants]
timestamp: 2026-07-18
---

# Thin sensor/actuator

The extension is deliberately thin. The desktop app **decides** (owns the budget cache,
talks to the server); the extension **executes** (redirects, sweeps) and **reports** raw
URLs. This split (plan.md §2.5, §7) keeps all budget authority in one place and keeps raw
browsing data on the machine — only rule-matched seconds reach the server, and only via the
app.

## Responsibility split (plan.md §7)

### Shared, pure, unit-tested (`src/shared/`)

- **`protocol.ts`** — bridge wire protocol. `PROTOCOL_VERSION = 1`,
  `BRIDGE_URL = "ws://127.0.0.1:8434"`. `encode()` stamps `v: 1`; `parseAppMessage()`
  strictly validates every field per message type and returns null on anything malformed or
  wrong-version, so an unknown frame never changes state.
- **`matching.ts`** — the ONE URL matcher (see below).
- **`decision.ts`** — the ONE block/allow decision (`GRACE_MS = 90_000`); implements the
  [[fail-closed-matrix]].
- **`storage.ts`** — typed access to the two storage areas. `chrome.storage.local`
  (`{token?, instanceId?, rules?}`) survives restart — what cold-start blocking needs;
  `chrome.storage.session` (`{budgets?, lastStateAt?, bridgeConnected?, lastPairError?}`)
  evaporates on restart, so a cold start has no fresh state and blocks. `clearToken()`
  removes only the token.

### Service worker (`src/background/`)

- **`index.ts`** — on every worker wake: `reenforce()` FIRST (block all budgeted patterns
  until the first `budget_state`), then `bridge.connect()` + `startTracker()`. A
  `chrome.alarms` `rueckblick-tick` every 0.5 min (Chrome minimum) survives worker death and
  re-checks staleness + retries connect. Routes popup `pair` and content-script `nav`
  messages.
- **`bridge.ts`** — `BridgeClient`: reconnect backoff 1 s → 30 s, idempotent connect,
  pair/auth handshake, dispatch of `pair_ok` / `auth_error` (clears token only on
  `unknown_token`) / `rules` / `budget_state`; each state change re-enforces.
- **`enforcer.ts`** — the ONLY thing that redirects: `syncDnrRules()` (one DNR redirect rule
  per blocked rule × pattern → `/block.html?rule=<key>`, `main_frame`, priority 1),
  `sweepOpenTabs()`, `redirectIfBlocked()` for SPA navs.
- **`tracker.ts`** — `SAMPLE_MS = 1000`; emits `url_heartbeat` for the active tab of the
  last-focused window while authenticated. Never persists raw URLs.

### Content script (`src/content/spa-watcher.ts`)

IIFE, `document_start`; polls `location.href` every 1 s and reports `{type:"nav"}`. **No
matching logic** — it is a pure change detector; the background enforcer decides.

### UI (`src/ui/`)

`popup.ts` (status, pairing form, budget list; re-renders on `storage.onChanged`) and
`block.ts` (reads `?rule=`, countdown to `resets_at`, sibling budgets — **display-only, no
unblock path**).

## Single decision point (plan.md §1.6)

- **One matcher.** `matching.ts` produces a single regex source used BOTH verbatim as the
  DNR `regexFilter` AND compiled for JS-side matching. No second matcher may exist in
  `enforcer.ts`, `tracker.ts`, or the content script.
- **One decision function.** `decision.ts` is the only place block/allow is decided, against
  the cached state and its age. Every client component routes through it.

Duplicating either would let the DNR redirect and the JS check disagree — a fail-open gap.
The glob semantics themselves are owned by the desktop app's `crates/core` (plan.md §2.1);
this repo replicates them and pins them with test vectors, never redefines them.
