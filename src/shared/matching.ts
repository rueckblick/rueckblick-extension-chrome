/**
 * The ONE URL-matching implementation for the extension (see plan.md §2.1, §7).
 *
 * A pattern becomes a single regex source used BOTH verbatim as a
 * `declarativeNetRequest` `regexFilter` AND compiled for JS-side matching, so the thing
 * that blocks a request and the thing that decides a tab is blocked can never disagree.
 *
 * Semantics are the desktop app's `crates/core::glob_match`, replicated here and pinned by
 * vectors — this repo does not own them:
 *   - `*` matches any character sequence, including slashes.
 *   - Anchored at both ends unless the pattern starts or ends with `*`.
 *   - Case-sensitive; regex-special characters in literal segments are escaped.
 */

const SPECIAL = /[.+?^${}()|[\]\\]/g;

/** The regex source for one glob pattern. */
export function patternToRegex(pattern: string): string {
  const escaped = pattern.split('*').map((segment) => segment.replace(SPECIAL, '\\$&'));
  return `^${escaped.join('.*')}$`;
}

export function matches(pattern: string, url: string): boolean {
  try {
    return new RegExp(patternToRegex(pattern)).test(url);
  } catch {
    // A pattern this build cannot compile matches nothing rather than
    // everything: a broken rule must not become a block-the-web rule.
    return false;
  }
}
