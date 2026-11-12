// =============================================================
//  CRAFTING — known recipes and experimenting at the bench.
//
//  The bench has slots. Put items in (one unit per slot, repeat
//  an item to use more of it) and press Craft. If the slots exactly
//  match a recipe's inputs, you craft it, and if you didn't know
//  that recipe, you just discovered it!
// =============================================================

import { G, discover } from './state.js';
import { DATA } from '../data/index.js';
import { canAfford, pay, addItem, itemMatches, itemInfo, learnRecipe } from './items.js';
import { hasBuilding } from './island.js';
import { emit } from './events.js';

export const BENCH_SLOTS = 8;

export const isKnown = (id) => !!(DATA.RECIPES[id].known || G.state.recipesKnown[id]);
export const hasStation = (station) => station === 'workshop' ? hasBuilding('workshop') : (hasBuilding('workbench') || hasBuilding('workshop'));

export function recipeList() {
  return Object.entries(DATA.RECIPES).map(([id, r]) => ({ id, r, known: isKnown(id), station: hasStation(r.station), affordable: canAfford(r.inputs) }));
}

/** Craft a known recipe directly. */
export function craftKnown(id) {
  const r = DATA.RECIPES[id];
  if (!isKnown(id)) return 'You don\'t know this recipe yet.';
  if (!hasStation(r.station)) return r.station === 'workshop' ? 'Needs a Workshop.' : 'Needs a Workbench.';
  if (!pay(r.inputs)) return 'Missing ingredients.';
  Object.entries(r.output).forEach(([k, n]) => addItem(k, n));
  emit('craft:made', { id });
  return '';
}

/**
 * Try the items in the bench slots (array of item keys).
 * Returns { id } on success, or { error } if nothing matched.
 */
export function experiment(slots) {
  const filled = slots.filter(Boolean);
  if (!filled.length) return { error: 'Put some items on the bench first.' };
  const counts = {};
  filled.forEach(k => { counts[k] = (counts[k] || 0) + 1; });

  for (const [id, r] of Object.entries(DATA.RECIPES)) {
    if (!matches(counts, r.inputs)) continue;
    if (!hasStation(r.station)) return { error: r.station === 'workshop' ? 'This feels like it needs a proper Workshop…' : 'You need a Workbench.' };
    // Pay with exactly the items placed.
    if (!pay(counts)) return { error: 'You don\'t have those items anymore.' };
    Object.entries(r.output).forEach(([k, n]) => addItem(k, n));
    const isNew = !isKnown(id);
    learnRecipe(id);
    if (isNew) discover('recipes', id, outputName(r));
    emit('craft:made', { id, discovered: isNew });
    return { id, discovered: isNew };
  }
  return { error: closeness(counts) };
}

/** Do placed item counts satisfy a recipe's inputs exactly? */
function matches(counts, inputs) {
  const pool = { ...counts };
  let needTotal = 0;
  for (const [spec, n] of Object.entries(inputs)) {
    needTotal += n;
    let left = n;
    for (const k of Object.keys(pool)) {
      if (!left) break;
      if (pool[k] > 0 && itemMatches(k, spec)) { const t = Math.min(left, pool[k]); pool[k] -= t; left -= t; }
    }
    if (left) return false;
  }
  const placed = Object.values(counts).reduce((a, b) => a + b, 0);
  return placed === needTotal;
}

/** A gentle hint when an experiment fails. */
function closeness(counts) {
  let best = null, bestScore = 0;
  for (const [id, r] of Object.entries(DATA.RECIPES)) {
    if (isKnown(id)) continue;
    let score = 0;
    for (const spec of Object.keys(r.inputs)) if (Object.keys(counts).some(k => itemMatches(k, spec))) score++;
    score /= Object.keys(r.inputs).length;
    if (score > bestScore) { bestScore = score; best = r; }
  }
  if (best && bestScore >= 0.99) return 'So close! The amounts don\'t feel quite right.';
  if (best && bestScore >= 0.5) return 'Hmm… something is missing. You\'re on to something.';
  return 'Nothing happens. Try a different combination!';
}

export function outputName(r) {
  const k = Object.keys(r.output)[0];
  const n = r.output[k];
  return (n > 1 ? n + ' × ' : '') + itemInfo(k).name;
}
