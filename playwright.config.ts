import { defineConfig } from '@playwright/test';

/**
 * The extension suite.
 *
 * Serial and single-worker on purpose: every test loads the extension into a persistent
 * profile and binds the mock bridge to the one port the contract names (8434). Two workers
 * would fight over both.
 *
 * Not headless. `chrome.windows.getLastFocused()` is what the tracker asks on every sample,
 * and headless Chromium does not model window focus the way the extension depends on — a
 * headless run would report no focused window and no heartbeat would ever be sent, so the
 * suite would pass by never exercising anything.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? 'list' : 'line',
  use: {
    headless: false,
    trace: 'off',
  },
});
