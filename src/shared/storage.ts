/**
 * Typed access to extension storage (see plan.md §7).
 *
 * The split is what makes cold-start blocking correct by construction:
 *   - `local`   survives a restart — token, instance id, and the last rules, so a worker
 *               that wakes with no bridge still knows what it would have to block.
 *   - `session` evaporates — budgets and freshness, so a cold start has no fresh budget
 *               state and therefore blocks rather than guessing.
 */
import type { BridgeBudget, BridgeRule } from './protocol.js';

export async function getInstanceId(): Promise<string> {
  const stored = await chrome.storage.local.get('instanceId');
  if (typeof stored.instanceId === 'string') return stored.instanceId;
  // Per browser profile, so a token copied to another profile is recognisably not ours.
  const instanceId = crypto.randomUUID();
  await chrome.storage.local.set({ instanceId });
  return instanceId;
}

export async function getToken(): Promise<string | null> {
  const stored = await chrome.storage.local.get('token');
  return typeof stored.token === 'string' ? stored.token : null;
}

export async function setToken(token: string): Promise<void> {
  await chrome.storage.local.set({ token });
}

/** Only ever called for `auth_error: unknown_token`. */
export async function clearToken(): Promise<void> {
  await chrome.storage.local.remove('token');
}

export async function setRules(rules: BridgeRule[]): Promise<void> {
  await chrome.storage.local.set({ rules });
}

export async function getRules(): Promise<BridgeRule[]> {
  const stored = await chrome.storage.local.get('rules');
  return Array.isArray(stored.rules) ? (stored.rules as BridgeRule[]) : [];
}

export async function setBudgets(budgets: BridgeBudget[]): Promise<void> {
  await chrome.storage.session.set({ budgets, lastStateAt: Date.now() });
}

export async function getBudgets(): Promise<BridgeBudget[]> {
  const stored = await chrome.storage.session.get('budgets');
  return Array.isArray(stored.budgets) ? (stored.budgets as BridgeBudget[]) : [];
}

export async function setConnected(connected: boolean): Promise<void> {
  await chrome.storage.session.set({ bridgeConnected: connected });
}

export async function isConnected(): Promise<boolean> {
  const stored = await chrome.storage.session.get('bridgeConnected');
  return stored.bridgeConnected === true;
}

export async function setPairError(reason: string | null): Promise<void> {
  await chrome.storage.session.set({ lastPairError: reason });
}

export async function getPairError(): Promise<string | null> {
  const stored = await chrome.storage.session.get('lastPairError');
  return typeof stored.lastPairError === 'string' ? stored.lastPairError : null;
}
