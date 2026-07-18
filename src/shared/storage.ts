/**
 * Typed access to extension storage (see plan.md §7).
 *
 * Future responsibility: wrap the two storage areas with the fail-closed split that makes
 * cold-start blocking correct by construction:
 *   - `chrome.storage.local`   = { token?, instanceId?, rules? }
 *       survives restart — exactly what cold-start blocking needs (cached rules let the
 *       worker re-enforce before any fresh budget arrives).
 *   - `chrome.storage.session` = { budgets?, lastStateAt?, bridgeConnected?, lastPairError? }
 *       evaporates on restart — so a cold start has NO fresh budget state and blocks.
 *   `clearToken()` removes only the token (used on `auth_error: unknown_token`).
 *
 * No storage logic yet — scaffold only.
 */

export {};
