import { defineConfig } from 'vitest/config';

/**
 * Unit tests only.
 *
 * Vitest's default glob takes `*.spec.ts` as well as `*.test.ts`, so it was picking up the
 * Playwright suite under `tests/e2e/` and failing on `test.beforeEach` — which belongs to a
 * different runner entirely. The two are separated by name *and* by path here, because
 * relying on either alone is how it went unnoticed the first time.
 *
 * The extension suite runs under `pnpm e2e`.
 */
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**', 'artifacts/**'],
  },
});
