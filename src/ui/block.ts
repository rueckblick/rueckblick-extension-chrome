/**
 * Block page UI (see plan.md §7).
 *
 * Future responsibility: read `?rule=<key>` from the URL; show the rule key, a countdown
 * to `resets_at` (re-rendered 1×/s, "–" when there is no fresh state), and the remaining
 * budgets of sibling rules. Display-only — there is NO unblock path ("the budget resets on
 * the server, not here").
 *
 * No UI logic yet — scaffold only. The mount lookup below is a placeholder side effect
 * so the build keeps the block.html -> block.js wiring in dist/ (no rendering happens yet).
 */

const mount = document.getElementById('app');
void mount;

export {};
