import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**'],
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
);
