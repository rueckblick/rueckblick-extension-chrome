/**
 * Enforcement — the ONLY thing that redirects (see plan.md §7).
 *
 * The redirect regex comes verbatim from matching.ts, so what Chrome blocks at the network
 * layer and what this file decides about an open tab are the same string. A second matcher
 * here would drift, and the drift would show up as "it blocked the page but not the video".
 */
import { blockedRuleKeys } from '../shared/decision.js';
import { matches, patternToRegex } from '../shared/matching.js';
import { getBudgets, getRules } from '../shared/storage.js';

/** Dynamic rule ids are ours to own; everything in this range is replaced wholesale. */
const RULE_ID_BASE = 1;

async function lastStateAt(): Promise<number | null> {
  const stored = await chrome.storage.session.get('lastStateAt');
  return typeof stored.lastStateAt === 'number' ? stored.lastStateAt : null;
}

/** The patterns that must be blocked right now, with the rule each came from. */
async function blockedPatterns(): Promise<{ key: string; pattern: string }[]> {
  const [rules, budgets, at] = await Promise.all([getRules(), getBudgets(), lastStateAt()]);
  const blocked = blockedRuleKeys({ rules, budgets, lastStateAt: at, now: Date.now() });
  return rules
    .filter((rule) => blocked.has(rule.key))
    .flatMap((rule) => rule.url_patterns.map((pattern) => ({ key: rule.key, pattern })));
}

/**
 * Replace every dynamic rule with the current block set.
 *
 * Replaced rather than diffed: the whole set is small, and a diff that went wrong would
 * leave a redirect in place for a budget that has since reset — the failure people notice
 * and rightly resent.
 */
export async function syncDnrRules(): Promise<void> {
  const patterns = await blockedPatterns();
  const existing = await chrome.declarativeNetRequest.getDynamicRules();

  const addRules = patterns.map((entry, index) => ({
    id: RULE_ID_BASE + index,
    priority: 1,
    action: {
      type: chrome.declarativeNetRequest.RuleActionType.REDIRECT,
      redirect: {
        extensionPath: `/block.html?rule=${encodeURIComponent(entry.key)}`,
      },
    },
    condition: {
      regexFilter: patternToRegex(entry.pattern),
      resourceTypes: [chrome.declarativeNetRequest.ResourceType.MAIN_FRAME],
    },
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map((rule) => rule.id),
    addRules,
  });
}

/**
 * Send any already-open tab that is now blocked to the block page.
 *
 * Network-level rules only catch the *next* request, and exhausting a budget in the middle
 * of a video would otherwise leave the video playing — which is precisely the moment the
 * limit was meant to hold.
 */
export async function sweepOpenTabs(): Promise<void> {
  const patterns = await blockedPatterns();
  if (patterns.length === 0) return;

  const tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] });
  for (const tab of tabs) {
    if (typeof tab.id !== 'number' || !tab.url) continue;
    const hit = patterns.find((entry) => matches(entry.pattern, tab.url as string));
    if (hit) {
      await chrome.tabs.update(tab.id, {
        url: chrome.runtime.getURL(`block.html?rule=${encodeURIComponent(hit.key)}`),
      });
    }
  }
}

/**
 * One tab, one URL — for navigations a single-page app performs without a request
 * `declarativeNetRequest` ever sees.
 */
export async function redirectIfBlocked(tabId: number, url: string): Promise<void> {
  const patterns = await blockedPatterns();
  const hit = patterns.find((entry) => matches(entry.pattern, url));
  if (!hit) return;
  await chrome.tabs.update(tabId, {
    url: chrome.runtime.getURL(`block.html?rule=${encodeURIComponent(hit.key)}`),
  });
}

/** Everything enforcement does, after any change to rules or budget. */
export async function reenforce(): Promise<void> {
  await syncDnrRules();
  await sweepOpenTabs();
}
