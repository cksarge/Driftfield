// =============================================================
//  ITEMS & INVENTORY
//
//  Every item is referenced by a KEY string:
//    'wood'               plain item from data/items.js
//    'seed:<cropId>'      seeds (base, legendary or hybrid crop)
//    'crop:<cropId>'      harvested produce
//    'x:<id>'             player-made item (mix, dye, animal product)
//                         stored in state.reg.items
//    'deco:<id>'          decoration you can place
//    'bld:<id>'           a free building you can place (recovered)
//    'land:<id>'          land chunk you can attach
//    'animal:<species>'   an animal in a crate, ready to place
//  Trader-only (bought = unlocked immediately, never in inventory):
//    'recipe:<id>', 'bp:<buildingId>'
//
//  itemInfo(key) turns any key into a description object.
// =============================================================

import { DATA } from '../data/index.js';
import { G } from './state.js';
import { hueToHex, hash } from './utils.js';
import { emit } from './events.js';

/** Look up any crop: base, legendary, or player-bred hybrid. */
export function getCrop(id) {
  return DATA.CROPS[id] || DATA.LEGENDARIES[id] || (G.state && G.state.reg.crops[id]) || null;
}

/** Sell value of one piece of produce, computed from traits. */
export function cropValue(crop) {
  const t = crop.traits;
  let v = 3 + t.size * 2 + t.growth * 1.5 + (t.yield <= 1 ? 4 : 0);
  t.rare.forEach(r => { v += (DATA.RARE_TRAITS[r] ? DATA.RARE_TRAITS[r].value : 10); });
  if (crop.legendary) v += 60;
  if (crop.gen) v += crop.gen * 2;
  return Math.round(v);
}

/** Effects a crop adds when used as a Mixing Station ingredient. */
export function cropEffects(crop) {
  const t = crop.traits;
  const out = [];
  const f = DATA.FLAVORS[t.flavor];
  if (f) out.push(f.effect);
  t.rare.forEach(r => { const rt = DATA.RARE_TRAITS[r]; if (rt && !out.includes(rt.effect)) out.push(rt.effect); });
  if (t.size >= 5 && !out.includes('bountiful')) out.push('bountiful');
  return out;
}

/** Register a player-made item (mix, dye, animal product). Returns its key. */
export function registerItem(def) {
  const id = def.id || hash(JSON.stringify([def.kind, def.base || '', def.name, def.effects || [], def.color || '']));
  if (!G.state.reg.items[id]) G.state.reg.items[id] = { ...def, id };
  return 'x:' + id;
}

/** Turn any item key into a description: name, kind, value, icon… */
export function itemInfo(key) {
  if (!key) return null;
  const [prefix, rest] = key.includes(':') ? [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)] : [null, key];

  if (prefix === 'seed' || prefix === 'crop') {
    const c = getCrop(rest);
    if (!c) return unknown(key);
    const hex = hueToHex(c.traits.hue, 65, 58);
    if (prefix === 'seed') {
      return { key, name: c.name + ' Seeds', kind: 'seed', cropId: rest, value: Math.max(2, Math.round((c.seedPrice || cropValue(c) * 1.2) / 2)),
        icon: { shape: 'seedbag', color: hex }, desc: c.desc || '', crop: c, tags: ['seed'] };
    }
    return { key, name: c.name, kind: 'crop', cropId: rest, value: cropValue(c), icon: { shape: 'crop', crop: rest, color: hex },
      desc: c.desc || '', crop: c, effects: cropEffects(c), color: hex, tags: c.flower ? ['crop', 'flower'] : ['crop'] };
  }
  if (prefix === 'x') {
    const d = G.state && G.state.reg.items[rest];
    if (!d) return unknown(key);
    return { key, ...d, icon: d.icon || { shape: d.kind === 'dye' ? 'dye' : 'jar', color: d.color }, tags: d.tags || [d.kind] };
  }
  if (prefix === 'deco') {
    const d = DATA.DECOR[rest];
    if (!d) return unknown(key);
    return { key, name: d.name, kind: 'deco', value: 20, icon: { shape: 'deco', deco: rest, color: d.color }, desc: d.desc, tags: ['deco'] };
  }
  if (prefix === 'bld') {
    const b = DATA.BUILDINGS[rest];
    if (!b) return unknown(key);
    return { key, name: b.name + ' (ready to place)', kind: 'building', value: 0, noSell: true, icon: { shape: 'building', color: b.roof }, desc: b.desc, tags: [] };
  }
  if (prefix === 'land') {
    const l = DATA.LAND[rest];
    if (!l) return unknown(key);
    return { key, name: l.name, kind: 'land', value: l.value, icon: { shape: 'land', land: rest, color: '#8fcf7a' }, desc: 'Attach to your island in Build → Land.', tags: ['land'] };
  }
  if (prefix === 'animal') {
    const a = DATA.ANIMALS[rest];
    if (!a) return unknown(key);
    return { key, name: a.name, kind: 'animal', value: Math.round((a.price || 100) * 0.6), icon: { shape: 'animal', species: rest, color: '#fff' }, desc: a.desc + ' Place it from Build → Animals.', tags: ['animal'] };
  }
  if (prefix === 'recipe') {
    const r = DATA.RECIPES[rest];
    const outKey = r ? Object.keys(r.output)[0] : null;
    const out = outKey ? itemInfo(outKey) : null;
    return { key, name: 'Recipe: ' + (out ? out.name : rest), kind: 'recipe', value: 0, icon: { shape: 'scroll', color: '#f0e0b0' }, desc: 'Learn a crafting recipe.', tags: [] };
  }
  if (prefix === 'bp') {
    const b = DATA.BUILDINGS[rest];
    return { key, name: 'Blueprint: ' + (b ? b.name : rest), kind: 'blueprint', value: 0, icon: { shape: 'scroll', color: '#a8d0f0' }, desc: b ? b.desc : '', tags: [] };
  }
  if (prefix === 'clue') {
    const c = DATA.CLUES[rest];
    return { key, name: 'Clue: ' + (c ? c.title : rest), kind: 'clue', value: 0, icon: { shape: 'scroll', color: '#e8d8a8' }, desc: '', tags: [] };
  }
  const it = DATA.ITEMS[key];
  if (!it) return unknown(key);
  return { key, ...it, tags: it.tags || [it.kind], effects: it.mix ? it.mix.adds : [] };
}

function unknown(key) { return { key, name: key, kind: 'unknown', value: 0, icon: { shape: 'rock', color: '#999' }, desc: '', tags: [] }; }

// ---------------- inventory ----------------
export const count = (key) => (G.state.inv[key] || 0);

export function addItem(key, n = 1, silent = false) {
  if (n <= 0) return;
  const inv = G.state.inv;
  inv[key] = (inv[key] || 0) + n;
  if (!silent) emit('item:added', { key, n });
}

export function removeItem(key, n = 1) {
  const inv = G.state.inv;
  if ((inv[key] || 0) < n) return false;
  inv[key] -= n;
  if (inv[key] <= 0) delete inv[key];
  emit('item:removed', { key, n });
  return true;
}

/** Does item `key` satisfy a spec like 'wood', 'tag:honey' or 'kind:dye'? */
export function itemMatches(key, spec) {
  if (spec === key) return true;
  if (spec.startsWith('tag:')) { const i = itemInfo(key); return !!(i && i.tags && i.tags.includes(spec.slice(4))); }
  if (spec.startsWith('kind:')) { const i = itemInfo(key); return !!(i && i.kind === spec.slice(5)); }
  return false;
}

/** All inventory keys matching a spec. */
export function keysMatching(spec) {
  return Object.keys(G.state.inv).filter(k => G.state.inv[k] > 0 && itemMatches(k, spec));
}

export function countSpec(spec) {
  if (spec === 'coins') return G.state.coins;
  return keysMatching(spec).reduce((s, k) => s + G.state.inv[k], 0);
}

/** Can we pay a { spec: qty } cost? ('coins' allowed) */
export function canAfford(cost) {
  return Object.entries(cost || {}).every(([spec, n]) => countSpec(spec) >= n);
}

/** Pay a cost. Returns the list of keys actually consumed. */
export function pay(cost) {
  if (!canAfford(cost)) return null;
  const used = [];
  for (const [spec, n] of Object.entries(cost || {})) {
    if (spec === 'coins') { G.state.coins -= n; continue; }
    let left = n;
    for (const k of keysMatching(spec)) {
      const take = Math.min(left, G.state.inv[k]);
      removeItem(k, take); used.push(k); left -= take;
      if (!left) break;
    }
  }
  emit('inventory:changed');
  return used;
}

/** Give a reward key (handles coins, recipes, blueprints and clues). */
export function giveKey(key, qty = 1) {
  if (key === 'coins') { G.state.coins += qty; emit('coins', qty); return; }
  if (key.startsWith('recipe:')) { learnRecipe(key.slice(7)); return; }
  if (key.startsWith('bp:')) { unlockBlueprint(key.slice(3)); return; }
  if (key.startsWith('clue:')) { emit('clue:found', key.slice(5)); return; }
  if (key === 'seed:random_hybrid') { emit('random:hybrid'); return; }
  addItem(key, qty);
}

export function learnRecipe(id) {
  if (!DATA.RECIPES[id]) return;
  if (!G.state.recipesKnown[id]) {
    G.state.recipesKnown[id] = true;
    emit('recipe:learned', id);
  }
}

export function unlockBlueprint(id) {
  if (!DATA.BUILDINGS[id]) return;
  if (!G.state.blueprints[id]) {
    G.state.blueprints[id] = true;
    emit('blueprint:unlocked', id);
  }
}

/** Sort order for inventory display. */
const KIND_ORDER = ['seed', 'crop', 'mix', 'dye', 'product', 'material', 'forage', 'special', 'deco', 'building', 'land', 'animal'];
export function sortedInventory(filter) {
  return Object.keys(G.state.inv)
    .filter(k => G.state.inv[k] > 0)
    .map(k => itemInfo(k))
    .filter(i => !filter || filter(i))
    .sort((a, b) => (KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)) || a.name.localeCompare(b.name));
}
