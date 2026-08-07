/**
 * Bridge WebSocket client (see plan.md §2.5, §7). Contract OWNED by rueckblick-app-tauri.
 *
 * The desktop app is not a server that is always up — it is an app the user may not have
 * opened yet. So connecting is best-effort and noisy failure is wrong: the client retries
 * with a backoff and says nothing, because "Rueckblick is not running" is an ordinary
 * state rather than an error the user needs to see in a popup.
 */
import {
  BRIDGE_URL,
  UNKNOWN_TOKEN,
  encode,
  parseAppMessage,
  type ClientMessage,
} from '../shared/protocol.js';
import {
  clearToken,
  getInstanceId,
  getToken,
  setBudgets,
  setConnected,
  setPairError,
  setRules,
  setToken,
} from '../shared/storage.js';

const RECONNECT_MIN_MS = 1_000;
const RECONNECT_MAX_MS = 30_000;

class BridgeClient {
  private socket: WebSocket | null = null;
  private backoffMs = RECONNECT_MIN_MS;
  private pendingCode: string | null = null;
  private authenticated = false;

  /** True once the app has accepted us and heartbeats are worth sending. */
  get ready(): boolean {
    return this.authenticated && this.socket?.readyState === WebSocket.OPEN;
  }

  /** Idempotent: a second call while connected does nothing. */
  async connect(): Promise<void> {
    if (this.socket && this.socket.readyState <= WebSocket.OPEN) return;
    // Nothing to say without either a code to offer or a token to present.
    if (!this.pendingCode && !(await getToken())) return;

    const socket = new WebSocket(BRIDGE_URL);
    this.socket = socket;

    socket.onopen = () => {
      void this.greet();
    };
    socket.onmessage = (event) => {
      void this.receive(String(event.data));
    };
    socket.onclose = () => {
      this.authenticated = false;
      void setConnected(false);
      this.scheduleReconnect();
    };
    // An error is followed by a close; retrying is handled there, so this stays
    // quiet rather than logging on every attempt while the app is shut.
    socket.onerror = () => {};
  }

  /** Offer a code the user just typed, and connect if we are not already. */
  async pair(code: string): Promise<void> {
    this.pendingCode = code;
    await setPairError(null);
    if (this.ready || this.socket?.readyState === WebSocket.OPEN) {
      await this.greet();
      return;
    }
    this.socket = null;
    await this.connect();
  }

  send(message: ClientMessage): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(encode(message));
    }
  }

  private async greet(): Promise<void> {
    const instanceId = await getInstanceId();
    if (this.pendingCode) {
      this.send({
        type: 'pair_request',
        code: this.pendingCode,
        instance_id: instanceId,
      });
      return;
    }
    const token = await getToken();
    if (token) {
      this.send({ type: 'auth', token, instance_id: instanceId });
      return;
    }
    this.socket?.close();
  }

  private async receive(raw: string): Promise<void> {
    const message = parseAppMessage(raw);
    if (!message) return;

    switch (message.type) {
      case 'pair_ok':
        this.pendingCode = null;
        this.authenticated = true;
        this.backoffMs = RECONNECT_MIN_MS;
        await setToken(message.token);
        await setConnected(true);
        await setPairError(null);
        break;
      case 'pair_error':
        this.pendingCode = null;
        await setPairError(message.reason);
        break;
      case 'auth_ok':
        this.authenticated = true;
        this.backoffMs = RECONNECT_MIN_MS;
        await setConnected(true);
        break;
      case 'auth_error':
        this.authenticated = false;
        await setConnected(false);
        // Only this one reason. Any other means the app is confused or
        // restarting, and forgetting the token would make the user pair again
        // for no reason.
        if (message.reason === UNKNOWN_TOKEN) await clearToken();
        break;
      case 'rules':
        await setRules(message.rules);
        break;
      case 'budget_state':
        await setBudgets(message.budgets);
        break;
    }
  }

  private scheduleReconnect(): void {
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 2, RECONNECT_MAX_MS);
    setTimeout(() => void this.connect(), delay);
  }
}

export const bridge = new BridgeClient();
