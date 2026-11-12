// =============================================================
//  FARMING — till, plant, water, fertilize, grow and harvest.
//
//  tile.crop = { id, age, ripe, poll, fert, dormant }
//    age     growth days so far (can be fractional with Speedy)
//    poll    id of the neighbour that cross-pollinated it (or null)
//    fert    effects from fertilizer on this tile
//    dormant true when it can't grow here today (shown with a Zz)
// =============================================================

import { G, discover } from './state.js';
import { DATA } from '../data/index.js';
import { tileAt, isSheltered, objectAt, objectsNear, allTiles, balance } from './island.js';
import { getCrop, addItem, removeItem, itemInfo, count } from './items.js';
import { createHybrid, createSport } from './breeding.js';
import { hasBuff } from './mixing.js';
import { chance, pick } from './utils.js';
import { emit } from './events.js';

const NEIGHBORS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

export function till(x, y) {
  const t = tileAt(x, y);
  if (!t || t.crop || objectAt(x, y)) return false;
  if (t.soil) return false;
  t.soil = 1;
  emit('till', { x, y });
  return true;
}

export function plant(x, y, seedKey) {
  const t = tileAt(x, y);
  if (!t || !t.soil || t.crop || objectAt(x, y) || count(seedKey) < 1) return false;
  const id = seedKey.slice(5);
  if (!getCrop(id)) return false;
  removeItem(seedKey, 1);
  t.crop = { id, age: 0, ripe: false, poll: null, fert: t.fert || null, dormant: false };
  t.fert = null;
  emit('plant', { x, y, id });
  return true;
}

export function water(x, y) {
  const t = tileAt(x, y);
  if (!t || !t.soil) return false;
  if (t.wet) return false;
  t.wet = true;
  emit('water', { x, y });
  return true;
}

/** Spread fertilizer (a mix with base 'fertilizer') on a tile. */
export function fertilize(x, y, key) {
  const t = tileAt(x, y);
  const info = itemInfo(key);
  if (!t || !t.soil || !info || info.base !== 'fertilizer' || count(key) < 1) return false;
  removeItem(key, 1);
  const fx = info.effects;
  if (fx.includes('rich')) t.q = Math.min(3, t.q + 2);
  else t.q = Math.min(3, t.q + 1);
  if (t.crop) t.crop.fert = fx; else t.fert = fx;
  if (fx.includes('healing') && t.crop) t.crop.dormant = false;
  emit('fertilize', { x, y, effects: fx });
  return true;
}

/**
 * How well a crop grows at (x,y) today.
 * rate: 1 = happy, 0.5 = struggling (wrong climate), 0 = dormant.
 * why:  a short explanation for the player ('' when all is well).
 */
export function growStatus(x, y, crop) {
  const def = getCrop(crop.id);
  if (!def) return { rate: 0, why: 'Unknown crop' };
  if (isSheltered(x, y)) return { rate: 1, why: '' };
  const fert = crop.fert || [];
  const zone = DATA.ZONES[G.state.nav.zone];
  if (def.needsWeather && G.state.weather.today !== def.needsWeather && !fert.includes('charged')) {
    return { rate: 0, why: `Only grows during ${DATA.WEATHER[def.needsWeather].name.toLowerCase()}s` };
  }
  if (def.traits.climates.includes(zone.climate) || fert.includes('hardy')) return { rate: 1, why: '' };
  const likes = def.traits.climates.map(c => DATA.CLIMATES[c].name).join(', ');
  if (zone.climate === 'cold' && !hasBuff('warm')) return { rate: 0, why: `Too cold! Dormant until warmer skies (prefers ${likes})` };
  return { rate: 0.5, why: `Growing slowly here (prefers ${likes})` };
}
export const growBlocker = (x, y, crop) => growStatus(x, y, crop).why;

/** Harvest a ripe crop. Returns a summary object or null. */
export function harvest(x, y) {
  const t = tileAt(x, y);
  if (!t || !t.crop || !t.crop.ripe) return null;
  const c = t.crop, def = getCrop(c.id);
  const fert = c.fert || [];
  let qty = def.traits.yield + (t.q >= 2 ? 1 : 0) + (fert.includes('bountiful') ? 2 : 0);
  addItem('crop:' + c.id, qty);
  const result = { id: c.id, qty, seeds: 0, hybrid: null, sport: null };

  // A seed back sometimes, so you can keep growing your favourites.
  if (chance(def.hybrid || def.legendary ? 0.6 : 0.45)) { addItem('seed:' + c.id, 1); result.seeds = 1; }

  // Cross-pollinated? You get a hybrid seed.
  if (c.poll && getCrop(c.poll)) {
    const hid = createHybrid(c.id, c.poll, { extraMutation: fert.includes('lucky') ? 0.08 : 0 });
    addItem('seed:' + hid, 1);
    result.hybrid = hid;
    emit('hybrid:seed', { id: hid });
  }
  // Rare-trait fertilizers can coax out a "sport" (same crop + new trait).
  const traitFx = { glowing: 'glowing', floaty: 'floating', golden: 'golden', frosty: 'frosted', sparkling: 'crystal',
    musical: 'singing', starry: 'starry', shimmering: 'shimmering', charged: 'charged', dreamy: 'dreamy', ancient: 'ancient' };
  const candidates = fert.filter(e => traitFx[e] && !def.traits.rare.includes(traitFx[e]));
  if (candidates.length && chance(0.35)) {
    const sid = createSport(c.id, traitFx[pick(candidates)]);
    addItem('seed:' + sid, 1);
    result.sport = sid;
    emit('hybrid:seed', { id: sid });
  }

  t.crop = null; t.wet = false;
  if (t.q > 0 && chance(0.3)) t.q--;           // soil tires a little with each harvest
  G.state.stats.harvested += qty;
  emit('harvest', { x, y, ...result });
  return result;
}

// ---------------- the overnight farming pass ----------------
/** Called once per new day by js/day.js (before weather watering). */
export function growOvernight() {
  const tilt = balance();
  const birdsTargets = [];

  for (const [x, y, t] of allTiles()) {
    const c = t.crop;
    if (!c) continue;
    const def = getCrop(c.id);
    if (!def) { t.crop = null; continue; }
    if (!c.ripe) {
      const { rate } = growStatus(x, y, c);
      c.dormant = rate === 0;
      if (rate > 0 && t.wet) {
        let g = rate;
        if ((c.fert || []).includes('speedy')) g += 0.5;
        if (t.q >= 3) g += 0.25;
        if (tilt.tilted) g *= 0.5;                // tilting islands stress plants
        c.age += g;
        if (c.age >= def.traits.growth) { c.ripe = true; emit('ripe', { x, y }); }
      }
    } else if (!isSheltered(x, y) && objectsNear(x, y, 'scarecrow', 3).length === 0) {
      birdsTargets.push(t);
    }
    t.wet = false;
  }

  // Sky birds peck one unprotected ripe crop now and then.
  if (birdsTargets.length && chance(0.2)) {
    const t = pick(birdsTargets);
    t.crop = null;
    emit('birds', {});
  }

  // Cross-pollination between different ripe neighbours.
  const hives = G.state.objects.filter(o => o.ref === 'beehive' && o.data.bees);
  for (const [x, y, t] of allTiles()) {
    const c = t.crop;
    if (!c || !c.ripe || c.poll) continue;
    const options = NEIGHBORS.map(([dx, dy]) => tileAt(x + dx, y + dy))
      .filter(n => n && n.crop && n.crop.ripe && n.crop.id !== c.id).map(n => n.crop.id);
    if (!options.length) continue;
    let p = 0.3 + (hasBuff('lucky') ? 0.1 : 0);
    if (hives.some(h => Math.abs(h.x - x) <= 4 && Math.abs(h.y - y) <= 4)) p += 0.2;
    if (chance(p)) c.poll = pick(options);
  }
}

/** Morning watering: rain/snow/mist and sprinklers. */
export function morningWater() {
  const w = DATA.WEATHER[G.state.weather.today];
  const powered = G.state.windmillFixed;
  for (const [x, y, t] of allTiles()) {
    if (!t.soil) continue;
    if (w.waters && !isSheltered(x, y)) t.wet = true;
  }
  for (const s of G.state.objects.filter(o => o.ref === 'sprinkler')) {
    const r = powered ? 2 : 1;
    for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) {
      const t = tileAt(s.x + dx, s.y + dy);
      if (t && t.soil) t.wet = true;
    }
  }
}

/** Discover crops whenever their seeds or produce enter the bag. */
export function trackCropDiscovery(key) {
  if (key.startsWith('seed:') || key.startsWith('crop:')) {
    const id = key.slice(5), c = getCrop(id);
    if (c) discover('crops', id, c.name);
  }
}
