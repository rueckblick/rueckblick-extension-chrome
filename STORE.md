# Submitting this to a store

Everything a dashboard asks for, written out so submission is copying rather
than composing. Nothing here is published automatically — a human has to paste
it and press the button.

**Do Firefox first.** AMO is free, accepts our reproducible build, and we
already pass `web-ext lint` with zero findings. The Chrome Web Store costs $5,
requires identity verification, and reviews `<all_urls>` slowly. There is no
reason to spend that before the cheaper route has proved the listing text.

---

## Before either store

- [ ] **Load it once in the browser you are submitting for.** For Chrome this
      has been done many times. **For Firefox it has not** — the add-on is
      packaged and linted but has never been run. Do not submit an add-on
      nobody has watched work.
- [ ] Publish `PRIVACY.md` at a URL. GitHub Pages off this repo is enough; both
      stores need a link, not a file.
- [ ] `pnpm package` and check the version in the filename is the one you mean.

---

## Chrome Web Store

**Account.** One-time $5 registration, identity verification, and a trader /
non-trader declaration (EU DSA). Verification can take days — start it before
you need it.

### Listing

**Name** — `Rueckblick`

**Summary** (132 max)

> Companion to the Rueckblick desktop app: tells it which page is in front, and
> blocks sites once their daily budget is used up.

**Description**

> Rueckblick is a screen-time journal and blocker that runs on your own
> computer. This extension is the browser half of it.
>
> **It does nothing on its own.** It needs the Rueckblick desktop app running on
> the same machine — the app is what decides, and this extension reports and
> enforces. If the app is not running, the extension is idle.
>
> What it does:
>
> • Tells the app which page is in front, so an hour in a browser is recorded as
> the sites you actually spent it on rather than as "browser".
> • Blocks sites whose daily budget the app says is used up, by redirecting them
> to a page that tells you when the budget resets.
> • Blocks sites you told the app you never want at all — those need no budget
> server, and the block page says so instead of offering a countdown.
> • Blocks already-open tabs too, not just new requests.
>
> **Where your browsing goes: nowhere.** The extension opens exactly one
> connection, to 127.0.0.1 — your own computer. There is no account, no
> analytics, no third-party code, and no server of ours anywhere. No URL is ever
> written to storage. The desktop app keeps only the host, github.com and not
> the path.
>
> Free software, GPL-3.0-or-later. Source:
> https://github.com/rueckblick/rueckblick-extension-chrome

**Category** — Productivity · **Language** — English

### Graphics

| Asset            | Size                | Status                      |
| ---------------- | ------------------- | --------------------------- |
| Store icon       | 128×128             | `public/icons/icon-128.png` |
| Screenshot       | 1280×800 or 640×400 | **needed — at least one**   |
| Small promo tile | 440×280             | optional                    |

A good screenshot pair: the popup showing **Connected** with a budget list, and
the block page with its countdown. Both are reachable against the mock bridge —
see `pnpm e2e`.

### Privacy tab

- **Single purpose**: "Report the focused tab to the user's own Rueckblick
  desktop app, and block sites that app says are out of budget."
- **Data usage**: tick nothing. Certify that you do not sell data, do not use it
  for unrelated purposes, and do not use it to judge creditworthiness. All three
  are true: no data leaves the machine.
- **Privacy policy URL**: the published `PRIVACY.md`.

### Permission justifications

Paste these into the corresponding boxes. Reviewers reject vague ones, and each
of these names the failure that permission prevents.

**`host_permissions` — `<all_urls>`**

> The user writes their own blocking rules in the desktop app (for example
> `*://*.youtube.com/shorts*`) and the app pushes them to the extension at
> runtime. Which hosts those cover is not knowable when the extension is
> installed, so no narrower set can be declared. It is used only to match a URL
> and to redirect a blocked one. The extension never reads page content: there
> is no `scripting` permission, and the single content script reports only that
> the address changed without a page load, which is how single-page sites
> navigate.

**`tabs`**

> To read the URL of the focused tab once a second and report it to the local
> desktop app. This is the extension's entire purpose — without it every site
> collapses into one undistinguishable "browser" total, and per-site budgets
> cannot exist. Only the focused tab is read, and only while a browser window
> has focus.

**`declarativeNetRequest`**

> To redirect a page whose budget the desktop app reports as exhausted to the
> extension's own block page. Chrome applies the rule; the extension never
> observes the request. The rule's regex is generated from the user's own
> patterns.

**`storage`**

> Holds the pairing token issued by the desktop app, an id for this browser
> instance, and the user's rules (`storage.local`), plus the current budget
> state (`storage.session`, deliberately cleared on restart so a browser that
> restarts blocks rather than allowing on stale data). No URL is ever stored.

**`alarms`**

> A Manifest V3 service worker is stopped whenever the browser decides to. A
> periodic alarm wakes it so tracking resumes; without it the extension silently
> stops reporting after a few idle minutes and the day's record has holes in it.

### Expect to be asked

- **"Why does this need access to every site?"** — answered above; expect it to
  be asked anyway.
- **"The extension does not appear to work."** A reviewer with no desktop app
  sees the popup say it is not paired. That is why the description says so in
  the second paragraph. Consider adding a note in the reviewer-comments field:
  the app is at https://github.com/rueckblick/rueckblick-app-tauri/releases and
  the extension is inert without it.

---

## Firefox (AMO)

Free account, no fee. Every add-on is signed by Mozilla on submission.

- [ ] `pnpm package` → `artifacts/rueckblick-firefox-<version>.zip`
- [ ] `pnpm lint:firefox` → must be zero errors and zero warnings
- [ ] **Source code submission is required**, because the zip is built by Vite
      rather than written by hand. Give them the repository plus these build
      instructions:

```
pnpm install --frozen-lockfile && pnpm package
Node 22, pnpm 11.9. Output: artifacts/firefox/
Operating system: any; the build is not platform-specific.
```

- [ ] The listing text above works unchanged; AMO has no 132-character summary
      limit but does want a shorter summary than the full description.

`browser_specific_settings` is written by `scripts/package.mjs`, not by hand:
the gecko id, `strict_min_version: 142`, and
`data_collection_permissions: { required: ["none"] }` — which is true, and is
the strongest of the answers Mozilla accepts.

---

## What is deliberately not here

**Self-distribution stays supported.** Loading unpacked from a release zip works
and will keep working; a store listing is a convenience, not a migration. The
desktop app's Settings pane explains the unpacked route, and should keep doing
so — a user who does not want a store account should not be pushed toward one.
