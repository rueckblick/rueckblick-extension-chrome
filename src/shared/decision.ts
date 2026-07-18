/**
 * The ONE block/allow decision function for the extension (see plan.md §2.2, §7).
 *
 * Future responsibility: implement every row of the fail-closed decision matrix
 * (okf/concepts/fail-closed-matrix.md) against the cached budget state and its age.
 * Uncertainty of any kind — stale state, lost connection ≥ GRACE_MS, unknown rule,
 * dangling parent, revoked token, cold start without fresh state — resolves to blocked.
 * There is no "allow while unknown" path.
 *
 * Only the staleness constant is defined here; the decision logic is not yet implemented.
 */

/** A budget answer is stale after 90 s (plan.md §1 invariant 3). */
export const GRACE_MS = 90_000 as const;
