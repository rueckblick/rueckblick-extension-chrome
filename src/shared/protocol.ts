/**
 * Bridge wire protocol (see plan.md §2.5, contract OWNED by rueckblick-app-tauri).
 *
 * Future responsibility:
 *   - `encode()` stamps every outbound frame with `v: PROTOCOL_VERSION`.
 *   - `parseAppMessage()` strictly validates each field per message type and returns
 *     null on anything malformed or wrong-version, so an unknown frame never changes
 *     state (fail-closed by construction).
 *
 * This file currently exports only the pure constants from the contract. No encode /
 * parse logic yet — that is implementation, not scaffold.
 */

/** Bridge protocol version. Frames with `v !== PROTOCOL_VERSION` are dropped whole. */
export const PROTOCOL_VERSION = 1 as const;

/** Loopback WebSocket endpoint served by the desktop app (plan.md §2.5). */
export const BRIDGE_URL = 'ws://127.0.0.1:8434' as const;
