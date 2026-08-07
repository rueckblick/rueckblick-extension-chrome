/**
 * Bridge wire protocol (see plan.md §2.5, contract OWNED by rueckblick-app-tauri).
 *
 * `encode()` stamps every outbound frame with `v: PROTOCOL_VERSION`, and
 * `parseAppMessage()` returns null for anything malformed, wrong-version or unknown, so
 * an unknown frame can never change state. That is the same fail-closed rule the host
 * applies in the other direction: neither side acts on something it does not understand.
 */

/** Bridge protocol version. Frames with `v !== PROTOCOL_VERSION` are dropped whole. */
export const PROTOCOL_VERSION = 1 as const;

/** Loopback WebSocket endpoint served by the desktop app (plan.md §2.5). */
export const BRIDGE_URL = 'ws://127.0.0.1:8434' as const;

export type ClientMessage =
  | { type: 'pair_request'; code: string; instance_id: string }
  | { type: 'auth'; token: string; instance_id: string }
  | { type: 'url_heartbeat'; url: string; focused: boolean; audible: boolean; at: string };

export type BridgeRule = { key: string; url_patterns: string[]; parent: string | null };
export type BridgeBudget = {
  rule: string;
  blocked: boolean;
  remaining_seconds: number;
  resets_at: string;
};

export type AppMessage =
  | { type: 'pair_ok'; token: string }
  | { type: 'pair_error'; reason: string }
  | { type: 'auth_ok' }
  | { type: 'auth_error'; reason: string }
  | { type: 'rules'; rules: BridgeRule[] }
  | { type: 'budget_state'; budgets: BridgeBudget[] };

/** The one `auth_error` reason that clears the stored token. */
export const UNKNOWN_TOKEN = 'unknown_token' as const;

export function encode(message: ClientMessage): string {
  return JSON.stringify({ v: PROTOCOL_VERSION, ...message });
}

const isString = (value: unknown): value is string => typeof value === 'string';

/**
 * Strictly validate one inbound frame.
 *
 * Every field named by the contract is checked, because a frame that is half-understood
 * is more dangerous than one that is rejected: it could leave the extension enforcing a
 * budget it only partly read.
 */
export function parseAppMessage(raw: string): AppMessage | null {
  let frame: unknown;
  try {
    frame = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof frame !== 'object' || frame === null) return null;
  const msg = frame as Record<string, unknown>;
  if (msg.v !== PROTOCOL_VERSION) return null;

  switch (msg.type) {
    case 'pair_ok':
      return isString(msg.token) ? { type: 'pair_ok', token: msg.token } : null;
    case 'pair_error':
      return isString(msg.reason) ? { type: 'pair_error', reason: msg.reason } : null;
    case 'auth_ok':
      return { type: 'auth_ok' };
    case 'auth_error':
      return isString(msg.reason) ? { type: 'auth_error', reason: msg.reason } : null;
    case 'rules':
      return Array.isArray(msg.rules) && msg.rules.every(isRule)
        ? { type: 'rules', rules: msg.rules as BridgeRule[] }
        : null;
    case 'budget_state':
      return Array.isArray(msg.budgets) && msg.budgets.every(isBudget)
        ? { type: 'budget_state', budgets: msg.budgets as BridgeBudget[] }
        : null;
    default:
      return null;
  }
}

function isRule(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const rule = value as Record<string, unknown>;
  return (
    isString(rule.key) &&
    Array.isArray(rule.url_patterns) &&
    rule.url_patterns.every(isString) &&
    (rule.parent === null || isString(rule.parent))
  );
}

function isBudget(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false;
  const budget = value as Record<string, unknown>;
  return (
    isString(budget.rule) &&
    typeof budget.blocked === 'boolean' &&
    typeof budget.remaining_seconds === 'number' &&
    isString(budget.resets_at)
  );
}
