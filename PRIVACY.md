# Privacy

What this extension can see, what it does with it, and where it goes.

This describes the code in this repository. Where something is not built it says
so, rather than describing an intention.

## The short version

**Nothing leaves your computer.** The extension holds no account, sends no
analytics, reports no crashes, and contains no third-party code of any kind — it
has zero runtime dependencies. It opens exactly one connection, to
`127.0.0.1:8434`, which is the Rueckblick desktop app running on the same
machine. There is no server belonging to us, so there is nowhere else for
anything to go.

If the desktop app is not running, the extension does nothing at all.

## What it can see

To do its job it is granted access to every site (`<all_urls>`) and to your
tabs. That is a broad permission and it is worth being precise about what is
actually read:

| It reads                                      | Why                                                                                 |
| --------------------------------------------- | ----------------------------------------------------------------------------------- |
| The URL of the **focused** tab, once a second | The app matches it against your own rules to decide what to count and what to block |
| Whether a browser window has focus            | Time in a background window is not time you are spending, and must not be counted   |
| Whether the focused tab is playing audio      | Reported; the app currently ignores it                                              |
| The URL of a page as it loads                 | Only to decide whether that page is blocked                                         |

It does **not** read page content, form fields, passwords, cookies, your
history, or anything inside a page. There is no `scripting` permission and no
code that touches the DOM apart from a content script that watches for the
address changing without a page load (which single-page sites do), and reports
only that it changed.

## What it stores

| Where                    | What                                                                             | Survives a restart    |
| ------------------------ | -------------------------------------------------------------------------------- | --------------------- |
| `chrome.storage.local`   | The pairing token the desktop app issued, an id for this browser, and your rules | Yes                   |
| `chrome.storage.session` | The current budget state                                                         | **No** — deliberately |

**No URL is ever written to storage.** The focused tab's address is read, sent
over the loopback socket, and dropped. It is never persisted here, in any form.

The budget state lives in session storage on purpose: when the browser restarts,
the extension holds rules it cannot prove anything about, and the safe answer is
to block until the app says otherwise rather than to allow on the strength of
something it read yesterday.

## What the desktop app does with it

The app matches the URL against your rules and keeps the **host** — `github.com`
— never the path or the query. That reduction happens in the app, before
anything is stored. See that app's `PRIVACY.md`, which is the authority on what
it keeps.

## Permissions, one at a time

- **`<all_urls>`** — your rules are patterns you write yourself and the app
  pushes them at runtime, so no narrower set can be declared when the extension
  is installed. It is used to match and to redirect, never to read a page.
- **`tabs`** — to read the URL of the focused tab. Without it the extension
  cannot tell YouTube from a code review and every site is one bucket.
- **`declarativeNetRequest`** — how a blocked page is redirected. Chrome applies
  the rule; the extension never sees the request.
- **`storage`** — the token, the rules, the budget. Described above.
- **`alarms`** — a Manifest V3 worker is stopped constantly. A periodic alarm
  wakes it so tracking resumes rather than silently stopping.

## Removing it

Uninstalling removes everything it stored. Unpairing from the desktop app
(**Settings → Browser extension → Forget**) invalidates the token, and the
extension discards its copy the next time it tries to reconnect.

## Contact

Issues: <https://github.com/rueckblick/rueckblick-extension-chrome/issues>
