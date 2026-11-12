// =============================================================
//  MIXING STATION — combine a base with ingredients, one at a time.
//
//  A mix is an ordered list of effects. Adding an ingredient:
//    1. TRANSFORMS: the ingredient changes existing effects
//       (e.g. Storm Pepper turns Calming → Energizing).
//    2. ADDS: the ingredient's own effects join (if there's room).
//    3. COMBOS: pairs of effects fuse into new ones
//       (Sweet + Sour → Zesty), repeated until nothing changes.
//  Because transforms only touch effects already present, ORDER
//  MATTERS: the same ingredients in a different order can give a
//  completely different product.
//
//  The finished product's name, colour and value all come from its
//  effects. Products are registered as player-made items ('x:<id>').
// =============================================================

import { G, discover } from './state.js';
import { DATA } from '../data/index.js';
import { itemInfo, getCrop, registerItem, addItem, count, pay, canAfford } from './items.js';
import { mixHex, colorName, hash } from './utils.js';
import { emit } from './events.js';

/** What an ingredient does when added: { adds, transforms }. */
export function ingredientDef(key) {
  const info = itemInfo(key);
  if (!info) return null;
  if (info.kind === 'crop') {
    const c = getCrop(info.cropId);
    return { adds: info.effects.slice(0, 3), transforms: (c.mix && c.mix.transforms) || {} };
  }
  if (info.kind === 'product') return { adds: (info.effects || []).slice(0, 2), transforms: {} };
  const raw = DATA.ITEMS[key];
  if (raw && raw.mix) return { adds: raw.mix.adds || [], transforms: raw.mix.transforms || {} };
  return null;
}

/** Can this item be used as an ingredient at all? */
export const isIngredient = (key) => !!ingredientDef(key);

/** Start a new mixing session (nothing is consumed until bottled). */
export function newSession(baseId) {
  const base = DATA.BASES[baseId];
  return { base: baseId, effects: [...base.start], steps: [], log: [], fresh: [] };
}

/**
 * Apply one ingredient to a session (pure: returns a NEW session).
 * session.log gets a human-readable description of what happened.
 */
export function applyIngredient(session, key) {
  const def = ingredientDef(key);
  const s = { ...session, effects: [...session.effects], steps: [...session.steps, key], log: [], fresh: [] };
  if (!def || s.steps.length > DATA.MAX_STEPS) return session;
  const name = itemInfo(key).name;

  // 1. transforms
  for (const [from, to] of Object.entries(def.transforms)) {
    const i = s.effects.indexOf(from);
    if (i >= 0) {
      if (s.effects.includes(to)) s.effects.splice(i, 1);
      else s.effects[i] = to;
      s.log.push(`${name} turned ${eff(from)} into ${eff(to)}.`);
      s.fresh.push(to);
    }
  }
  // 2. adds
  for (const e of def.adds) {
    if (s.effects.includes(e)) continue;
    if (s.effects.length >= DATA.MAX_EFFECTS) { s.log.push(`No room for ${eff(e)}.`); continue; }
    s.effects.push(e); s.fresh.push(e);
    s.log.push(`${name} added ${eff(e)}.`);
  }
  // 3. combos (repeat until stable)
  let changed = true, guard = 0;
  while (changed && guard++ < 12) {
    changed = false;
    for (const c of DATA.COMBOS) {
      const ia = s.effects.indexOf(c.a), ib = s.effects.indexOf(c.b);
      if (ia >= 0 && ib >= 0) {
        s.effects[Math.min(ia, ib)] = c.result;
        s.effects.splice(Math.max(ia, ib), 1);
        s.effects = [...new Set(s.effects)];
        s.log.push(`${eff(c.a)} + ${eff(c.b)} fused into ${eff(c.result)}!`);
        s.fresh.push(c.result);
        changed = true;
      }
    }
  }
  if (!s.log.length) s.log.push(`${name} didn't change anything.`);
  return s;
}
const eff = (id) => (DATA.EFFECTS[id] ? DATA.EFFECTS[id].name : id);

/** Name, colour and value of what the session would produce. */
export function describeMix(session) {
  const base = DATA.BASES[session.base];
  const effects = session.effects;
  const color = effects.length ? mixHex(effects.map(e => DATA.EFFECTS[e].color)) : base.color;
  const effVal = effects.reduce((s, e) => s + DATA.EFFECTS[e].value, 0);
  const value = Math.round((base.value + effVal * base.mult) * (1 + 0.08 * Math.max(0, effects.length - 2)));

  let name;
  if (session.base === 'dye') {
    name = colorName(color) + ' Dye';
    if (effects.includes('prismatic')) name = 'Prismatic Dye';
    else if (effects.includes('glowing')) name = 'Glowing ' + name;
    else if (effects.includes('shimmering')) name = 'Shimmering ' + name;
  } else {
    // Most valuable effects become the adjectives.
    const top = [...effects].sort((a, b) => DATA.EFFECTS[b].value - DATA.EFFECTS[a].value).slice(0, 2);
    const adj = top.map(e => DATA.EFFECTS[e].name).join(' ');
    const grade = effects.length >= 8 ? 'Legendary ' : effects.length >= 6 ? 'Grand ' : '';
    name = `${grade}${adj ? adj + ' ' : ''}${base.name}`;
  }
  return { name, color, value, effects: [...effects], base: session.base };
}

/** Items needed to bottle this session (base needs + one of each step). */
export function sessionCost(session) {
  const cost = { ...DATA.BASES[session.base].needs };
  session.steps.forEach(k => { cost[k] = (cost[k] || 0) + 1; });
  return cost;
}

export const canBottle = (session) => canAfford(sessionCost(session));

/** Consume ingredients, create the product, record discoveries. Returns item key. */
export function bottle(session, customName) {
  if (!pay(sessionCost(session))) return null;
  const d = describeMix(session);
  const sortedFx = [...d.effects].sort();
  const id = 'm' + hash(session.base + '|' + sortedFx.join(','));
  const kind = session.base === 'dye' ? 'dye' : 'mix';
  const key = registerItem({
    id, name: d.name, kind, base: session.base, effects: d.effects, color: d.color, value: d.value,
    tags: [kind, session.base, ...(session.base === 'honey' ? ['honey'] : [])],
    icon: { shape: kind === 'dye' ? 'dye' : (session.base === 'potion' ? 'bottle' : session.base === 'fertilizer' || session.base === 'feed' ? 'sack' : 'jar'), color: d.color },
    desc: DATA.BASES[session.base].desc,
  });
  addItem(key, 1);
  G.state.stats.mixes++;

  // Mix Journal: remember the exact recipe (ingredients in order).
  const recipeKey = session.base + '>' + session.steps.join('>');
  let entry = G.state.journal.find(j => j.recipe === recipeKey);
  if (!entry) {
    entry = { recipe: recipeKey, base: session.base, steps: [...session.steps], item: key, name: customName || d.name, made: 0 };
    G.state.journal.unshift(entry);
  }
  entry.made++;
  if (customName) entry.name = customName;

  discover('mixes', id, d.name);
  d.effects.forEach(e => discover('effects', e, DATA.EFFECTS[e].name));
  emit('mix:made', { key, effects: d.effects, base: session.base });
  return key;
}

/** Rebuild a session from a Mix Journal entry. */
export function sessionFromJournal(entry) {
  let s = newSession(entry.base);
  for (const k of entry.steps) s = applyIngredient(s, k);
  return s;
}

// ---------------- using products ----------------
/** Active buffs from drinks last until the end of the day. */
export function hasBuff(effect) {
  const b = G.state && G.state.buffs;
  return !!(b && b.day === G.state.time.total && b.effects.includes(effect));
}

/** Drink a juice/tea/soup/potion: its effects become today's buffs. */
export function drink(key) {
  const info = itemInfo(key);
  if (!info || !info.base || DATA.BASES[info.base].use !== 'drink') return false;
  if (count(key) < 1) return false;
  G.state.inv[key]--; if (!G.state.inv[key]) delete G.state.inv[key];
  const b = G.state.buffs;
  if (b.day !== G.state.time.total) { b.day = G.state.time.total; b.effects = []; }
  info.effects.forEach(e => { if (!b.effects.includes(e)) b.effects.push(e); });
  emit('drink', { key, effects: info.effects });
  emit('inventory:changed');
  return true;
}

/** Effects with gameplay meaning for buffs, for the UI. */
export const BUFF_TEXT = {
  floaty: 'Glide +2 range', lucky: 'More mutations & better finds', energizing: '+2 exploring energy',
  speedy: '+1 exploring energy', warm: 'Crops grow in cold zones', glowing: 'Lanterns glow brighter',
  musical: 'Animals extra happy', calming: 'Animals extra happy', cozy: 'Animals extra happy',
};
