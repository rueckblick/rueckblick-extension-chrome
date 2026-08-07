/**
 * The ONE block/allow decision function for the extension (see plan.md §2.2, §7).
 *
 * Every row of okf/concepts/fail-closed-matrix.md, in one place. The governing rule: any
 * ambiguity — app unreachable, stale data, revoked token, unknown rule, dangling parent —
 * resolves to blocked. There is no path that allows while unknown, because a self-control
 * tool whose failure mode is *unblocked* teaches its user to induce failures.
 */
import type { BridgeBudget, BridgeRule } from './protocol.js';

/** A budget answer is stale after 90 s (plan.md §1 invariant 3). */
export const GRACE_MS = 90_000 as const;

export type DecisionInput = {
  rules: BridgeRule[];
  budgets: BridgeBudget[];
  /** When the last `budget_state` arrived, or null if none has this session. */
  lastStateAt: number | null;
  now: number;
};

/**
 * The rule keys that must be blocked right now.
 *
 * Returns keys rather than a yes/no for one URL so the caller can build both the
 * declarativeNetRequest rule set and the tab sweep from a single answer.
 */
export function blockedRuleKeys(input: DecisionInput): Set<string> {
  const { rules, budgets, lastStateAt, now } = input;
  const known = new Set(rules.map((rule) => rule.key));

  // Never paired, or paired and told nothing yet: there are no rules, so there
  // is nothing to match. Blocking here would block the whole web on install.
  if (rules.length === 0) return new Set();

  // Cold start with cached rules and no fresh state, and connection lost for
  // longer than the grace window, are the same condition seen from two sides:
  // we do not know what the budget is, so everything budgeted is blocked.
  const stale = lastStateAt === null || now - lastStateAt >= GRACE_MS;
  if (stale) return known;

  const blocked = new Set<string>();
  for (const budget of budgets) {
    // A budget naming a rule we do not know is not something to reason about.
    if (!known.has(budget.rule)) continue;
    if (budget.blocked || budget.remaining_seconds <= 0) blocked.add(budget.rule);
  }

  for (const rule of rules) {
    // A rule the app never sent a budget for is an unknown, and unknown blocks.
    if (!budgets.some((budget) => budget.rule === rule.key)) {
      blocked.add(rule.key);
      continue;
    }
    // A child whose parent is exhausted is exhausted, and a parent that is
    // named but missing is a dangling reference — blocked either way.
    if (rule.parent !== null) {
      if (!known.has(rule.parent) || blocked.has(rule.parent)) blocked.add(rule.key);
    }
  }

  return blocked;
}
