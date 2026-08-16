import { describe, expect, it } from 'vitest';

import { GRACE_MS, blockedRuleKeys } from '../src/shared/decision.js';
import type { BridgeBudget, BridgeRule } from '../src/shared/protocol.js';

/** One named test per row of okf/concepts/fail-closed-matrix.md. */
const rules: BridgeRule[] = [
  { key: 'shorts', url_patterns: ['*://www.youtube.com/shorts*'], parent: 'youtube' },
  { key: 'youtube', url_patterns: ['*://www.youtube.com/*'], parent: null },
];

const budget = (rule: string, blocked: boolean, remaining = 600): BridgeBudget => ({
  rule,
  blocked,
  remaining_seconds: remaining,
  resets_at: '2026-08-08T00:00:00+02:00',
});

const NOW = 1_000_000;

describe('fail-closed decision matrix', () => {
  it('connected with fresh state enforces exactly what the app pushed', () => {
    const blocked = blockedRuleKeys({
      rules,
      budgets: [budget('shorts', true), budget('youtube', false)],
      lastStateAt: NOW - 1_000,
      now: NOW,
    });
    expect([...blocked]).toEqual(['shorts']);
  });

  it('keeps the last known state while the connection has been lost under 90 s', () => {
    const blocked = blockedRuleKeys({
      rules,
      budgets: [budget('shorts', true), budget('youtube', false)],
      lastStateAt: NOW - (GRACE_MS - 1),
      now: NOW,
    });
    expect([...blocked]).toEqual(['shorts']);
  });

  it('blocks every budgeted rule once the state is 90 s old', () => {
    const blocked = blockedRuleKeys({
      rules,
      budgets: [budget('shorts', false), budget('youtube', false)],
      lastStateAt: NOW - GRACE_MS,
      now: NOW,
    });
    expect([...blocked].sort()).toEqual(['shorts', 'youtube']);
  });

  it('has nothing to match when never paired, rather than blocking the web', () => {
    expect(blockedRuleKeys({ rules: [], budgets: [], lastStateAt: null, now: NOW }).size).toBe(0);
  });

  it('blocks on a cold start that has cached rules but no fresh state', () => {
    const blocked = blockedRuleKeys({ rules, budgets: [], lastStateAt: null, now: NOW });
    expect([...blocked].sort()).toEqual(['shorts', 'youtube']);
  });

  it('blocks a rule the app sent no budget for', () => {
    const blocked = blockedRuleKeys({
      rules,
      budgets: [budget('youtube', false)],
      lastStateAt: NOW,
      now: NOW,
    });
    expect(blocked.has('shorts')).toBe(true);
  });

  it('blocks a child whose parent is exhausted', () => {
    const blocked = blockedRuleKeys({
      rules,
      budgets: [budget('shorts', false), budget('youtube', true)],
      lastStateAt: NOW,
      now: NOW,
    });
    expect([...blocked].sort()).toEqual(['shorts', 'youtube']);
  });

  it('blocks a child whose parent is not a rule it knows', () => {
    const dangling: BridgeRule[] = [
      { key: 'orphan', url_patterns: ['*://x/*'], parent: 'missing' },
    ];
    const blocked = blockedRuleKeys({
      rules: dangling,
      budgets: [budget('orphan', false)],
      lastStateAt: NOW,
      now: NOW,
    });
    expect(blocked.has('orphan')).toBe(true);
  });

  it('treats an exhausted remaining count as blocked even if the flag says otherwise', () => {
    const blocked = blockedRuleKeys({
      rules,
      budgets: [budget('shorts', false, 0), budget('youtube', false)],
      lastStateAt: NOW,
      now: NOW,
    });
    expect(blocked.has('shorts')).toBe(true);
  });
});
