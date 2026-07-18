import { describe, expect, it } from 'vitest';

import { BRIDGE_URL, PROTOCOL_VERSION } from '../src/shared/protocol.js';

/**
 * Trivial constants test — proves the toolchain (vitest + TS) runs end to end.
 *
 * The real suites are PLANNED (see okf/playbooks/dev-verify.md):
 *   - matching.test.ts : glob semantics vectors replicated from the desktop app's
 *                        crates/core (§2.1) — this repo pins the semantics via vectors.
 *   - decision.test.ts : one named test per row of the fail-closed matrix (§2.2).
 *   - protocol.test.ts : parse/drop tests for every bridge message type (§2.5).
 */
describe('protocol constants', () => {
  it('pins the bridge protocol version to 1', () => {
    expect(PROTOCOL_VERSION).toBe(1);
  });

  it('points the bridge at the loopback endpoint', () => {
    expect(BRIDGE_URL).toBe('ws://127.0.0.1:8434');
  });
});
