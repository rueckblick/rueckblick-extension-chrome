/**
 * Block page UI (see plan.md §7).
 *
 * Display-only, and deliberately so: there is no unblock path here. The budget resets on
 * the server, not in the page that is telling you it ran out.
 */
import { getBudgets } from '../shared/storage.js';

const mount = document.getElementById('app');
const rule = new URLSearchParams(location.search).get('rule') ?? '';

function countdown(resetsAt: string, now: number): string {
  const target = Date.parse(resetsAt);
  if (Number.isNaN(target) || target <= now) return '–';
  const seconds = Math.floor((target - now) / 1000);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

async function render(): Promise<void> {
  if (!mount) return;
  const budgets = await getBudgets();
  const mine = budgets.find((budget) => budget.rule === rule);

  mount.innerHTML = '';

  const title = document.createElement('h1');
  title.textContent = rule ? `${rule} is out of time` : 'Out of time';
  mount.append(title);

  const resets = document.createElement('p');
  // "–" when there is no fresh state: saying "resets in 0m" would be a guess,
  // and this page exists because guesses are not good enough.
  resets.textContent = mine ? `Resets in ${countdown(mine.resets_at, Date.now())}` : 'Resets in –';
  resets.className = 'resets';
  mount.append(resets);

  const others = budgets.filter((budget) => budget.rule !== rule && !budget.blocked);
  if (others.length > 0) {
    const list = document.createElement('ul');
    for (const budget of others) {
      const left = Math.max(0, Math.round(budget.remaining_seconds / 60));
      const item = document.createElement('li');
      item.textContent = `${budget.rule} — ${left} min left`;
      list.append(item);
    }
    mount.append(list);
  }
}

void render();
setInterval(() => void render(), 1_000);
