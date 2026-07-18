---
type: concept
title: rueckblick-extension-chrome — knowledge base index
description: Living KB for the MV3 browser extension (thin sensor/actuator over the desktop bridge)
tags: [rueckblick, extension, mv3, index]
timestamp: 2026-07-18
---

# rueckblick-extension-chrome — OKF index

The Rueckblick browser extension is an **MV3 thin sensor/actuator** (Chrome-family,
developed on Brave, loaded unpacked — no Web Store). It samples the focused active tab
once per second, reports raw URLs to the desktop app over a loopback WebSocket bridge, and
**hard-blocks exhausted URLs by redirecting to an in-extension block page**. It never talks
to the budget server — the desktop app owns the budget cache and the server conversation.

Status: **toolchain scaffold — implementation not started.** Source files are stubs whose
doc comments state their future responsibility; the build produces a loadable-shape `dist/`.

## What this repo is (and is not)

- **Is:** a sensor (1/s `url_heartbeat` to the app) and an actuator (DNR redirects, tab
  sweeps). Blocking is redirect-based, never element hiding.
- **Is not:** a budget authority. It never mints time, never computes remaining budget from
  seconds, and never reaches the server. Raw URLs never leave the machine — only the app
  maps them to rule-matched seconds.

## Core invariants that bind this repo (plan.md §1)

- **Fail-closed (§1.1):** any ambiguity resolves to _blocked_. Implemented via the decision
  matrix — see [[fail-closed-matrix]].
- **90-second freshness (§1.3):** a budget answer is stale after 90 s (`GRACE_MS`); stale ⇒
  all budgeted rules blocked.
- **Single decision point (§1.6):** ONE matcher (`matching.ts`) and ONE decision function
  (`decision.ts`). See [[thin-sensor-actuator]].
- **No secrets committed (§1.7):** the bridge token lives in `chrome.storage.local`, never
  in the repo.

## Concepts

- [[thin-sensor-actuator]] — the sensor/actuator responsibility split (§7) and the
  one-matcher / one-decision principle.
- [[fail-closed-matrix]] — every row of the §2.2 decision matrix this repo must implement.

## Playbooks

- [[dev-verify]] — load-unpacked flow and the PLANNED mock-bridge + headless-Chromium
  verification (§7, §11).

## Contracts (not owned here)

This repo owns **no** contract. It consumes two, both defined in other repos:

- **Extension bridge (`ws://127.0.0.1:8434`)** — owned by `rueckblick-app-tauri`
  (`okf/apis/extension-bridge.md`, plan.md §2.5). This repo conforms; a needed change starts
  in the app repo.
- **Glob semantics** — canonically defined in the desktop app's `crates/core::glob_match`
  (plan.md §2.1). This repo **replicates** them via test vectors; it does not own or redefine
  them.
