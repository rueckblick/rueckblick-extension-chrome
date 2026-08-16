/**
 * The §11 extension checklist, driven against a mock bridge.
 *
 * This is the half `scripts/verify-bridge.mjs` in the app repo cannot do. That one is
 * better where it overlaps — it drives the *real* host, so it proves the contract is read
 * the same way by both sides — but it needs the desktop app built and running, and it
 * cannot put the bridge into the states that matter most. Everything asserted here is
 * about what the **extension** did: a heartbeat that arrived, a tab that was redirected.
 * Nothing asserts the mock's own state, which would only prove the mock works.
 */
import { test, expect, chromium, type BrowserContext } from '@playwright/test';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { MockBridge, allowedRule, blockedRule } from '../harness/mock-bridge.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const EXTENSION = path.resolve(here, '../../dist');

let bridge: MockBridge;
let context: BrowserContext;
let profile = '';

/** The worker's id, which is also the extension id every page URL is built from. */
async function serviceWorker(ctx: BrowserContext) {
  const existing = ctx.serviceWorkers()[0];
  const worker = existing ?? (await ctx.waitForEvent('serviceworker', { timeout: 20_000 }));
  return { worker, id: new URL(worker.url()).host };
}

test.beforeEach(async () => {
  if (!fs.existsSync(EXTENSION)) {
    throw new Error(`no dist/ at ${EXTENSION} — run \`pnpm build\` first`);
  }
  bridge = await MockBridge.start();
  profile = fs.mkdtempSync(path.join(process.env.TMPDIR ?? '/tmp', 'rb-ext-'));
  context = await chromium.launchPersistentContext(profile, {
    headless: false,
    args: [`--disable-extensions-except=${EXTENSION}`, `--load-extension=${EXTENSION}`],
  });
});

test.afterEach(async () => {
  // Guarded individually: when `beforeEach` fails, tearing down what never
  // started would replace the real error with a confusing one about `profile`.
  await context?.close().catch(() => {});
  await bridge?.stop().catch(() => {});
  if (profile) fs.rmSync(profile, { recursive: true, force: true });
});

/**
 * Make the worker believe its window has OS focus.
 *
 * The one thing this harness stubs, and it has to: an automated browser does not hold
 * desktop focus, so `chrome.windows.getLastFocused()` answers `focused: false` and the
 * tracker correctly reports a blur. Everything focus-dependent would then pass by never
 * running. Only the flag is faked — the window id and the tab query underneath it are
 * real, so what is asserted is still the extension's own logic about a real tab.
 *
 * Without it these tests flake on whether the window happened to have focus, which is
 * exactly how this was found.
 */
async function forceFocus(ctx: BrowserContext) {
  await ctx.serviceWorkers()[0]?.evaluate(() => {
    const original = chrome.windows.getLastFocused.bind(chrome.windows);
    chrome.windows.getLastFocused = (async (...args: unknown[]) => ({
      ...(await (original as (...a: unknown[]) => Promise<chrome.windows.Window>)(...args)),
      focused: true,
    })) as typeof chrome.windows.getLastFocused;
  });
}

/** Pair through the popup, exactly as a person would. */
async function pair(ctx: BrowserContext, id: string) {
  const popup = await ctx.newPage();
  await popup.goto(`chrome-extension://${id}/popup.html`);
  await popup.fill('#code', '123456');
  await popup.click('button[type=submit]');
  await expect
    .poll(() => bridge.pairAttempts.length, { message: 'the popup never sent a pair_request' })
    .toBeGreaterThan(0);
  return popup;
}

test('pairs through the popup and reports the focused tab', async () => {
  const { id } = await serviceWorker(context);
  await pair(context, id);
  await forceFocus(context);

  const tab = await context.newPage();
  await tab.goto('https://example.com/', { waitUntil: 'domcontentloaded' }).catch(() => {});
  await tab.bringToFront();

  await expect
    .poll(
      () => bridge.heartbeats.filter((h) => h.focused && h.url.includes('example.com')).length,
      {
        message: 'no heartbeat named the focused tab',
        timeout: 15_000,
      },
    )
    .toBeGreaterThan(0);
});

/**
 * The bug this harness exists to have caught.
 *
 * A tab that is not a website used to be reported by sending nothing, which is
 * indistinguishable from this worker being asleep — so the app went on charging the last
 * site the user was on. It must now say so out loud: focused, with an empty url.
 */
test('says it is in front and not on a website, rather than going quiet', async () => {
  const { id } = await serviceWorker(context);
  await pair(context, id);
  await forceFocus(context);

  const tab = await context.newPage();
  await tab.goto('https://example.com/', { waitUntil: 'domcontentloaded' }).catch(() => {});
  await tab.bringToFront();
  await expect
    .poll(() => bridge.heartbeats.some((h) => h.url.includes('example.com')), { timeout: 15_000 })
    .toBe(true);

  // Somewhere that is not the web at all.
  const mark = bridge.heartbeats.length;
  await tab.goto('about:blank');
  await tab.bringToFront();

  await expect
    .poll(() => bridge.since(mark).some((h) => h.focused && h.url === ''), {
      message: 'leaving a website must be reported, not implied by silence',
      timeout: 15_000,
    })
    .toBe(true);
});

test('redirects a blocked URL to its own block page', async () => {
  const { id } = await serviceWorker(context);
  await pair(context, id);

  const { rules, budgets } = blockedRule('example', ['*://example.com/*']);
  bridge.pushRules(rules);
  bridge.pushBudgets(budgets);
  // The rules land in storage, and the storage write is what triggers re-enforcement.
  await expect
    .poll(async () => (await context.serviceWorkers()[0]?.evaluate(hasDynamicRules)) ?? false, {
      timeout: 15_000,
    })
    .toBe(true);

  const tab = await context.newPage();
  await tab.goto('https://example.com/', { waitUntil: 'domcontentloaded' }).catch(() => {});

  await expect.poll(() => tab.url(), { timeout: 15_000 }).toContain('block.html');
  await expect(tab.url()).toContain('rule=example');
});

/** A tab already open when the budget runs out has no request left to redirect. */
test('sweeps a tab that was already open when the budget ran out', async () => {
  const { id } = await serviceWorker(context);
  await pair(context, id);

  const tab = await context.newPage();
  await tab.goto('https://example.com/', { waitUntil: 'domcontentloaded' }).catch(() => {});
  expect(tab.url()).toContain('example.com');

  const { rules, budgets } = blockedRule('example', ['*://example.com/*']);
  bridge.pushRules(rules);
  bridge.pushBudgets(budgets);

  await expect
    .poll(() => tab.url(), {
      message: 'an open tab must be swept, not left alone',
      timeout: 15_000,
    })
    .toContain('block.html');
});

/**
 * The fail-closed row only a mock can reach.
 *
 * Rules survive a restart in `local`; budgets do not (`session`). So a worker that wakes
 * holds a rule it can prove nothing about, and must block rather than wait to be told.
 *
 * The test starts from an **allowed** budget on purpose. Starting from a blocked one would
 * pass whether or not fail-closed works, because the answer never changes — it would prove
 * only that the page was already blocked.
 *
 * A literal worker restart is not scriptable (`registration.update()` kills the handle it
 * was called through), so this reproduces the *state* a restart leaves rather than the
 * event: the fresh budget gone, the bridge unable to send another, the cached rule intact.
 */
test('blocks when the budget it was told about is no longer fresh', async () => {
  const { id } = await serviceWorker(context);
  await pair(context, id);

  const { rules, budgets } = allowedRule('example', ['*://example.com/*']);
  bridge.pushRules(rules);
  bridge.pushBudgets(budgets);

  // With time on the clock the page loads normally. Establishing this is what
  // makes the assertion below mean something.
  const open = await context.newPage();
  await open.goto('https://example.com/', { waitUntil: 'domcontentloaded' }).catch(() => {});
  await expect.poll(() => open.url(), { timeout: 15_000 }).toContain('example.com');

  // Nothing can push fresh state any more, and what made it fresh is gone.
  await bridge.stop();
  await context.serviceWorkers()[0]?.evaluate(async () => {
    await chrome.storage.session.clear();
  });

  const tab = await context.newPage();
  await tab.goto('https://example.com/', { waitUntil: 'domcontentloaded' }).catch(() => {});
  await expect
    .poll(() => tab.url(), {
      message: 'a cached rule with no fresh budget must resolve to blocked',
      timeout: 15_000,
    })
    .toContain('block.html');
});

/** Runs inside the service worker: are our dynamic block rules installed? */
async function hasDynamicRules() {
  const rules = await chrome.declarativeNetRequest.getDynamicRules();
  return rules.length > 0;
}
