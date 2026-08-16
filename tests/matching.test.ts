import { describe, expect, it } from 'vitest';

import { matches, patternToRegex } from '../src/shared/matching.js';

/**
 * Vectors replicated from the desktop app's crates/core::glob_match, which owns these
 * semantics. If one of these ever disagrees with that implementation, this repo is wrong.
 */
describe('glob semantics', () => {
  it('matches a literal pattern exactly', () => {
    expect(matches('https://a.example/x', 'https://a.example/x')).toBe(true);
    expect(matches('https://a.example/x', 'https://a.example/xy')).toBe(false);
  });

  it('lets a star cross slashes', () => {
    expect(matches('*://www.youtube.com/shorts*', 'https://www.youtube.com/shorts/abc')).toBe(true);
    expect(matches('*://www.youtube.com/*', 'https://www.youtube.com/watch?v=1')).toBe(true);
  });

  it('anchors both ends unless the pattern stars them', () => {
    expect(matches('https://a.example/*', 'http://other/https://a.example/x')).toBe(false);
    expect(matches('*youtube.com*', 'https://m.youtube.com/feed')).toBe(true);
  });

  it('is case-sensitive, like the owning implementation', () => {
    expect(matches('*://www.youtube.com/shorts*', 'https://www.YouTube.com/shorts/a')).toBe(false);
  });

  it('escapes regex metacharacters in literal segments', () => {
    // The dot must not act as "any character", or a.example would match axexample.
    expect(matches('https://a.example/*', 'https://axexample/x')).toBe(false);
    expect(patternToRegex('a.b')).toBe('^a\\.b$');
  });

  it('shares one regex source with declarativeNetRequest', () => {
    // The same string is handed to Chrome as regexFilter, so it has to be a
    // plain source with no flags or delimiters.
    expect(patternToRegex('*://www.youtube.com/shorts*')).toBe(
      '^.*://www\\.youtube\\.com/shorts.*$',
    );
  });

  it('treats an uncompilable pattern as matching nothing', () => {
    // A broken rule must not become a block-the-web rule.
    expect(matches('(', 'https://anything')).toBe(false);
  });
});
