import { defineConfig } from 'vite';

/**
 * Pass 1 of the two-pass MV3 build (see §7 of plan.md / okf/playbooks/dev-verify.md).
 *
 * Multi-entry ESM bundle emitted into dist/:
 *   - background service worker  (src/background/index.ts -> dist/background.js)
 *   - popup page                 (popup.html            -> dist/popup.html)
 *   - block page                 (block.html            -> dist/block.html)
 *
 * The content script is NOT built here — MV3 content scripts may not be ES modules,
 * so it is emitted as an IIFE by pass 2 (vite.content.config.ts) into the same dist
 * with emptyOutDir disabled. public/manifest.json is copied verbatim by Vite's
 * publicDir handling. Minification is off so the loaded-unpacked bundle stays
 * inspectable.
 */
export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'chrome120',
    minify: false,
    modulePreload: false,
    rollupOptions: {
      input: {
        background: 'src/background/index.ts',
        popup: 'popup.html',
        block: 'block.html',
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
    },
  },
});
