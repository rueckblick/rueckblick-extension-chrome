/**
 * A stand-in for the desktop app's bridge host.
 *
 * The contract is owned by `rueckblick-app-tauri` (`okf/apis/extension-bridge.md`); this
 * conforms to it and never defines it. When the two disagree, this file is wrong.
 *
 * **Why a mock at all, when a real-bridge check already exists.** That one
 * (`scripts/verify-bridge.mjs` over there) needs the desktop app built and running, so it
 * cannot run in this repo's CI, and it cannot force the states that matter most: a revoked
 * token, ninety seconds of silence, a cold start holding cached rules and no fresh budget.
 * Those are the fail-closed rows, and a mock is the only way to sit in them on demand.
 *
 * The danger of a mock is that it agrees with whatever the extension happens to do. Two
 * things guard against it: every frame it sends is built from the same shapes the contract
 * document lists, and the assertions are about what the extension *did* — a heartbeat that
 * arrived, a tab that got redirected — never about the mock's own state.
 */
import { WebSocketServer, type WebSocket } from 'ws';

export type Heartbeat = { url: string; focused: boolean; audible: boolean; at: string };
export type Rule = { key: string; url_patterns: string[]; parent: string | null };
export type Budget = {
  rule: string;
  blocked: boolean;
  remaining_seconds: number;
  resets_at: string;
};

/** The port the contract names. Not configurable: the extension hard-codes it. */
const PORT = 8434;

export class MockBridge {
  #server!: WebSocketServer;
  #socket: WebSocket | null = null;

  /** Every heartbeat received, in order, so a test can assert on cadence and content. */
  heartbeats: Heartbeat[] = [];
  /** Every pairing attempt, so a test can assert a wrong code was refused. */
  pairAttempts: string[] = [];

  /** What to answer a `pair_request` with. Set to null to refuse the next one. */
  token: string | null = 'test-token';

  static async start(): Promise<MockBridge> {
    const bridge = new MockBridge();
    bridge.#server = new WebSocketServer({ host: '127.0.0.1', port: PORT });
    await new Promise<void>((resolve, reject) => {
      bridge.#server.once('listening', () => resolve());
      bridge.#server.once('error', (error: NodeJS.ErrnoException) => {
        // The extension connects to a port the contract names, so the mock has
        // to own that exact one and cannot move out of the way. In practice the
        // squatter is the real app, which is a good thing to be told plainly
        // rather than to debug through five identical timeouts.
        reject(
          error.code === 'EADDRINUSE'
            ? new Error(
                `127.0.0.1:${PORT} is already in use. The desktop app is probably running — ` +
                  'quit it from the tray (it hosts the real bridge on this port) and run again.',
              )
            : error,
        );
      });
    });
    bridge.#server.on('connection', (socket) => bridge.#accept(socket));
    return bridge;
  }

  #accept(socket: WebSocket): void {
    this.#socket = socket;
    socket.on('message', (data) => this.#receive(String(data)));
    socket.on('close', () => {
      if (this.#socket === socket) this.#socket = null;
    });
  }

  #receive(raw: string): void {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let frame: any;
    try {
      frame = JSON.parse(raw);
    } catch {
      return;
    }
    if (frame.v !== 1) return;

    switch (frame.type) {
      case 'pair_request':
        this.pairAttempts.push(frame.code);
        this.#send(
          this.token === null
            ? { type: 'pair_error', reason: 'bad_code' }
            : { type: 'pair_ok', token: this.token },
        );
        break;
      case 'auth':
        // A test that wants the revoked path sets `token` to null first; the one
        // reason that makes the extension throw its token away is this exact string.
        this.#send(
          this.token === null
            ? { type: 'auth_error', reason: 'unknown_token' }
            : { type: 'auth_ok' },
        );
        break;
      case 'url_heartbeat':
        this.heartbeats.push({
          url: frame.url,
          focused: frame.focused,
          audible: frame.audible,
          at: frame.at,
        });
        break;
      default:
        break;
    }
  }

  #send(message: Record<string, unknown>): void {
    this.#socket?.send(JSON.stringify({ v: 1, ...message }));
  }

  /** Push the rules the extension should match against. */
  pushRules(rules: Rule[]): void {
    this.#send({ type: 'rules', rules });
  }

  /** Push budget state. `blocked: true` is what makes a rule's URLs redirect. */
  pushBudgets(budgets: Budget[]): void {
    this.#send({ type: 'budget_state', budgets });
  }

  /** Heartbeats seen since a marker, for asserting cadence over a window. */
  since(count: number): Heartbeat[] {
    return this.heartbeats.slice(count);
  }

  get connected(): boolean {
    return this.#socket !== null && this.#socket.readyState === 1;
  }

  async stop(): Promise<void> {
    this.#socket?.close();
    await new Promise<void>((resolve) => this.#server.close(() => resolve()));
  }
}

/** One rule and one exhausted budget, the shape most tests want. */
export const blockedRule = (key: string, patterns: string[]) => ({
  rules: [{ key, url_patterns: patterns, parent: null }],
  budgets: [{ rule: key, blocked: true, remaining_seconds: 0, resets_at: '2026-01-01T00:00:00Z' }],
});

/** The same rule with time left on it. */
export const allowedRule = (key: string, patterns: string[]) => ({
  rules: [{ key, url_patterns: patterns, parent: null }],
  budgets: [
    { rule: key, blocked: false, remaining_seconds: 1800, resets_at: '2026-01-01T00:00:00Z' },
  ],
});
