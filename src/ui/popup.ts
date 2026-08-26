/**
 * The popup: whether we are connected, and the one form that pairs us.
 *
 * Deliberately plain. This is a status line and a six-digit field, and the only thing it
 * must never do is claim a connection it does not have — a popup that says "connected"
 * while the app is shut is worse than one that says nothing.
 */
import { getBudgets, getPairError, getToken, isConnected } from '../shared/storage.js';

const app = document.querySelector<HTMLElement>('#app');

async function render(): Promise<void> {
  if (!app) return;

  const [connected, token, pairError, budgets] = await Promise.all([
    isConnected(),
    getToken(),
    getPairError(),
    getBudgets(),
  ]);

  const status = connected
    ? 'Connected to Rueckblick'
    : token
      ? 'Not connected — is Rueckblick running?'
      : 'Not paired yet';

  app.innerHTML = '';
  app.append(el('p', status, 'status'));

  // Which version this is, always, connected or not. Loading unpacked never
  // auto-updates, so "am I current?" is a question the user has to be able to
  // answer here — the app can only answer it for browsers it can see.
  app.append(el('p', `Version ${chrome.runtime.getManifest().version}`, 'version'));

  // Only while it still matters. A pairing error left over from an earlier
  // attempt, shown underneath "Connected", tells the user something is wrong
  // when nothing is.
  if (pairError && !connected) {
    app.append(el('p', pairingMessage(pairError), 'error'));
  }

  if (!connected || !token) {
    const form = document.createElement('form');
    const input = document.createElement('input');
    input.id = 'code';
    input.inputMode = 'numeric';
    input.maxLength = 6;
    input.placeholder = '000000';
    input.setAttribute('aria-label', 'Pairing code');
    const submit = document.createElement('button');
    submit.type = 'submit';
    submit.textContent = 'Pair';

    form.append(
      el('p', 'Open Rueckblick, go to Settings, and show a pairing code.', 'hint'),
      input,
      submit,
    );
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const code = input.value.trim();
      if (code.length !== 6) return;
      chrome.runtime.sendMessage({ type: 'pair', code }, () => {
        // The answer arrives through storage, so re-render shortly after rather
        // than pretending the round trip was instant.
        setTimeout(() => void render(), 600);
      });
    });
    app.append(form);
  }

  // Two different things used to read identically here: a budget that has run
  // out says "blocked", and so did a site the user asked never to allow. The
  // empty resets_at separates them, and the difference is worth showing —
  // "blocked" invites you to wait for it, and this one is not coming back.
  const always = budgets.filter((budget) => budget.resets_at === '');
  const timed = budgets.filter((budget) => budget.resets_at !== '');

  if (always.length > 0) {
    app.append(el('p', 'Always blocked', 'eyebrow'));
    const list = document.createElement('ul');
    for (const budget of always) list.append(el('li', budget.rule));
    app.append(list);
  }

  if (timed.length > 0) {
    if (always.length > 0) app.append(el('p', 'Budgets', 'eyebrow'));
    const list = document.createElement('ul');
    for (const budget of timed) {
      const left = budget.blocked
        ? 'blocked'
        : `${Math.max(0, Math.round(budget.remaining_seconds / 60))} min left`;
      list.append(el('li', `${budget.rule} — ${left}`));
    }
    app.append(list);
  }

  // The popup deliberately does not edit this list. The app is the single
  // decision point, and a browser-side copy would have to be kept in step in
  // every profile the user has.
  if (connected) {
    app.append(el('p', 'Set these in Rueckblick under Rules.', 'hint'));
  }
}

/** Say what went wrong in words, not in the contract's identifiers. */
function pairingMessage(reason: string): string {
  switch (reason) {
    case 'bad_code':
      return 'That code was not right. Check the app and try again.';
    case 'code_expired':
      return 'That code has expired. Show a new one in the app.';
    case 'too_many_attempts':
      return 'Too many tries. Show a new code in the app.';
    case 'no_pairing_in_progress':
      return 'The app is not showing a code right now.';
    default:
      return 'Pairing did not work.';
  }
}

function el(tag: string, text: string, className?: string): HTMLElement {
  const node = document.createElement(tag);
  node.textContent = text;
  if (className) node.className = className;
  return node;
}

void render();
