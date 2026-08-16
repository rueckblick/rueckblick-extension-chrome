import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // `artifacts/` holds copies of the built bundles, which are output rather
    // than source and were briefly linted as though they were ours.
    ignores: ['dist/**', 'artifacts/**', 'node_modules/**', 'test-results/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts', 'tests/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.webextensions,
        ...globals.browser,
      },
    },
  },
  {
    files: ['src/content/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['*.config.ts', 'vite.*.config.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    // The harness and the packaging script run in Node, not in a browser. Kept
    // separate from the extension source, which must never reach for Node.
    files: ['scripts/**/*.mjs', 'tests/e2e/**/*.ts', 'tests/harness/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.webextensions,
      },
    },
  },
);
