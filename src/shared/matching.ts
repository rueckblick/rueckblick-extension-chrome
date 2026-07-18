/**
 * The ONE URL-matching implementation for the extension (see plan.md §2.1, §7).
 *
 * Future responsibility: convert a rule glob pattern into a single regex source that is
 * used BOTH verbatim as a `declarativeNetRequest` `regexFilter` AND compiled for JS-side
 * matching — one implementation, no drift. Glob semantics (canonically defined in the
 * desktop app's `crates/core::glob_match`) are replicated here and pinned by the test
 * vectors in tests/ (this repo replicates the semantics via vectors; it does not own them):
 *
 *   - `*` matches any character sequence, including slashes.
 *   - Anchored at both ends unless the pattern starts/ends with `*`.
 *   - Case-sensitive; regex-special chars in literal segments are escaped
 *     (`/[.+?^${}()|[\]\\]/g`); segments joined with `.*`, wrapped `^...$`.
 *
 * No matching logic yet — scaffold only.
 */

export {};
