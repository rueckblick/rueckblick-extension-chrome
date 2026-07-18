import { defineConfig } from 'vite';

/**
 * Pass 2 of the two-pass MV3 build (see §7 of plan.md / okf/playbooks/dev-verify.md).
 *
 * The content script (src/content/spa-watcher.ts) is emitted as a single self-contained
 * IIFE at dist/content.js, because MV3 content scripts run in the page world and cannot
 * be ES modules. emptyOutDir is false so this build augments the dist/ produced by
 * pass 1 rather than wiping it.
 */
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'chrome120',
    minify: false,
    lib: {
      entry: 'src/content/spa-watcher.ts',
      formats: ['iife'],
      name: 'RueckblickContent',
      fileName: () => 'content.js',
    },
  },
});
