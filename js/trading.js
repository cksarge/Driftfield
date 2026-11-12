// =============================================================
//  TRADING — airship merchants, prices, demand and deliveries.
//
//  Prices = item value × trader likes × season × demand.
//  Selling lots of the same thing lowers its price (demand),
//  which recovers a little each night. A Dock and a Market Stall
//  make traders visit more often; the stall also lets you sell
//  (for less) when no airship is docked.
// =============================================================

import { G } from './state.js';
import { DATA } from '../data/index.js';
import { itemInfo, addItem, removeItem, count, getCrop, giveKey, learnRecipe, unlockBlueprint } from './items.js';
import { hasBuilding } from './island.js';
import { absMinutes } from './time.js';
import { weightedPick, randInt, pick, rand, chance, uid } from './utils.js';
import { canFulfill, consumeNeeds, needText } from './needs.js';
import { emit } from './events.js';

export const traderHere = () => {
  const t = G.state.trader;
  return t && absMinutes() < t.leave ? t : null;
};
export const traderDef = (t = G.state.trader) => (t ? DATA.TRADERS[t.id] : null);

/** Bring a specific trader in now (tutorial / testing). */
export function dockTrader(id, hours = 14) {
  const def = DATA.TRADERS[id];
  const season = G.state.time.season;
  const stock = def.sells.map(s => {
    const seasonal = 0.85 + Math.random() * 0.35 + (season === 3 ? 0.1 : 0);
    return { key: s.key, price: Math.max(1, Math.round(s.price * seasonal)), stock: s.stock };
  });
  G.state.trader = { id, leave: absMinutes() + hours * 60, stock };
  emit('trader:arrived', { id });
  if (G.state.phase !== 'tutorial' && G.state.deliveries.filter(d => !d.done).length < 3 && chance(0.65)) makeDelivery(id);
}

/** Morning roll for an airship visit. */
export function tradersOvernight() {
  G.state.trader = null;
  let p = 0.3;
  if (hasBuilding('dock')) p += 0.35;
  if (hasBuilding('market_stall')) p += 0.15;
  if (!chance(p)) return;
  const zoneId = G.state.nav.zone;
  const w = {};
  for (const [id, t] of Object.entries(DATA.TRADERS)) {
    if (t.zones === '*' || t.zones.includes(zoneId)) w[id] = t.weight;
  }
  const id = weightedPick(w);
  if (id) dockTrader(id, randInt(9, 13));
}

// ---------------- prices ----------------
export function sellPrice(key, t = traderHere()) {
  const info = itemInfo(key);
  if (!info || info.noSell || !info.value) return 0;
  let p = info.value;
  const def = t ? DATA.TRADERS[t.id] : null;
  if (def) {
    const L = def.likes || {};
    if (L.kinds && L.kinds[info.kind]) p *= L.kinds[info.kind];
    if (L.bases && info.base && L.bases[info.base]) p *= L.bases[info.base];
    if (L.effects && info.effects) info.effects.forEach(e => { if (L.effects[e]) p *= L.effects[e]; });
    if (L.rare && info.cropId) getCrop(info.cropId).traits.rare.forEach(() => { p *= L.rare; });
    if (def.seasonal && def.seasonal[G.state.time.season]) p *= def.seasonal[G.state.time.season];
  } else {
    p *= 0.7;                                  // market stall, no buyer
  }
  const sold = G.state.demand[key] || 0;
  p *= Math.max(0.4, Math.pow(0.93, sold));
  return Math.max(1, Math.round(p));
}

export const canSellNow = () => !!traderHere() || hasBuilding('market_stall') || G.state.phase === 'tutorial';

export function sell(key, n = 1) {
  if (!canSellNow()) return 0;
  let total = 0;
  for (let i = 0; i < n && count(key) > 0; i++) {
    const p = sellPrice(key);
    if (!p) break;
    removeItem(key, 1);
    G.state.coins += p; total += p;
    G.state.demand[key] = (G.state.demand[key] || 0) + 1;
  }
  if (total) {
    G.state.stats.sold += n; G.state.stats.earned += total;
    emit('trade:sold', { key, n, total });
  }
  return total;
}

export function buy(entry) {
  if (entry.stock <= 0 || G.state.coins < entry.price) return false;
  G.state.coins -= entry.price;
  entry.stock--;
  if (entry.key.startsWith('recipe:')) learnRecipe(entry.key.slice(7));
  else if (entry.key.startsWith('bp:')) unlockBlueprint(entry.key.slice(3));
  else addItem(entry.key, 1);
  emit('trade:bought', { key: entry.key });
  return true;
}

export function demandOvernight() {
  for (const k of Object.keys(G.state.demand)) {
    G.state.demand[k] *= 0.6;
    if (G.state.demand[k] < 0.3) delete G.state.demand[k];
  }
}

// ---------------- delivery requests ----------------
function zoneCrops(zoneId) {
  const clim = DATA.ZONES[zoneId].climate;
  return Object.keys(DATA.CROPS).filter(id => DATA.CROPS[id].traits.climates.includes(clim) && DATA.CROPS[id].seedPrice > 0);
}

export function makeDelivery(traderId) {
  const tpl = pick(DATA.DELIVERY_TEMPLATES);
  const qty = randInt(tpl.qty[0], tpl.qty[1]);
  const days = randInt(tpl.days[0], tpl.days[1]);
  let need, text = tpl.text, value = 10;
  const discoveredFx = Object.keys(G.state.disc.effects);
  const fxPool = discoveredFx.length >= 3 ? discoveredFx : ['sweet', 'calming', 'warm', 'refreshing', 'floral'];
  if (tpl.type === 'crop') {
    const pool = zoneCrops(G.state.nav.next).concat(zoneCrops(G.state.nav.zone));
    const id = pick(pool.length ? pool : ['drift_carrot']);
    need = { item: 'crop:' + id, qty };
    text = text.replace('{crop}', DATA.CROPS[id].name);
    value = itemInfo('crop:' + id).value;
  } else if (tpl.type === 'mix' || tpl.type === 'mix2') {
    const base = pick(['juice', 'jam', 'tea', 'soup', 'potion']);
    const e1 = pick(fxPool); let e2 = pick(fxPool); if (e2 === e1) e2 = 'sweet';
    const effects = tpl.type === 'mix2' && e1 !== e2 ? [e1, e2] : [e1];
    need = { mix: { base, effects }, qty };
    text = text.replace('{base}', DATA.BASES[base].name).replace('{effect}', DATA.EFFECTS[e1].name).replace('{effect2}', DATA.EFFECTS[e2].name);
    value = 30 + effects.length * 25;
  } else if (tpl.type === 'rare') {
    const r = pick(['glowing', 'floating', 'frosted', 'charged', 'dreamy', 'golden', 'starry', 'singing']);
    need = { crop: { rare: [r] }, qty };
    text = text.replace('{rare}', DATA.RARE_TRAITS[r].name);
    value = 45;
  } else if (tpl.type === 'hybrid') {
    need = { crop: { hybrid: true }, qty };
    value = 30;
  } else {
    const it = pick(tpl.pool);
    need = { item: it, qty };
    text = text.replace('{item}', itemInfo(it).name);
    value = itemInfo(it).value + 2;
  }
  text = text.replace('{qty}', qty).replace('{zone}', DATA.ZONES[G.state.nav.next].name);
  const d = {
    id: uid(), trader: traderId, text, need, due: G.state.time.total + days,
    reward: Math.round(value * qty * rand(1.5, 2.1)) + 10, done: false,
  };
  G.state.deliveries.push(d);
  emit('delivery:new', d);
  return d;
}

export function fulfillDelivery(d) {
  if (d.done || !canFulfill([d.need])) return false;
  consumeNeeds([d.need]);
  d.done = true;
  G.state.coins += d.reward;
  if (chance(0.35)) giveKey(pick(['old_gear', 'sky_crystal', 'cloud_silk', 'rope', 'land:pebble']), 1);
  emit('delivery:done', d);
  return true;
}

export function deliveriesOvernight() {
  const today = G.state.time.total;
  const expired = G.state.deliveries.filter(d => !d.done && d.due < today);
  expired.forEach(d => emit('delivery:expired', d));
  G.state.deliveries = G.state.deliveries.filter(d => !d.done && d.due >= today);
}

export { needText };
