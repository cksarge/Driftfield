// =============================================================
//  FESTIVALS — seasonal celebrations and contests.
// =============================================================

import { G, discover } from './state.js';
import { DATA } from '../data/index.js';
import { itemInfo, removeItem, count, giveKey, addItem } from './items.js';
import { randomHybrid } from './breeding.js';
import { rand, chance, pick } from './utils.js';
import { emit } from './events.js';

export function todayFestival() {
  const t = G.state.time;
  for (const [id, f] of Object.entries(DATA.FESTIVALS)) if (f.season === t.season && f.day === t.day) return id;
  return null;
}

const recKey = (id) => `y${G.state.time.year}-${id}`;
export const festivalRecord = (id) => G.state.festivals[recKey(id)] || {};

/** Join the festival: collect the attendance gift (once per year). */
export function attend(id) {
  const f = DATA.FESTIVALS[id];
  const rec = G.state.festivals[recKey(id)] = festivalRecord(id);
  if (rec.attended) return false;
  rec.attended = true;
  Object.entries(f.prizes.enter || {}).forEach(([k, n]) => giveKey(k, n));
  discover('secrets', 'festival:' + id, f.name);
  emit('festival:attended', id);
  return true;
}

/** What can be entered into this festival's contest? */
export function contestEntries(id) {
  const f = DATA.FESTIVALS[id];
  return Object.keys(G.state.inv).filter(k => {
    const i = itemInfo(k);
    if (f.contest === 'crop') return i.kind === 'crop';
    if (f.contest === 'mix') return i.kind === 'mix';
    if (f.contest === 'dye') return i.kind === 'dye';
    return false;
  }).map(itemInfo);
}

export function entryScore(key) {
  const i = itemInfo(key);
  let s = i.value || 0;
  if (i.effects) s += i.effects.length * 8;
  if (i.kind === 'dye') {
    const unusual = ['prismatic', 'shimmering', 'glowing', 'starry', 'velvet', 'mysterious'];
    s += i.effects.filter(e => unusual.includes(e)).length * 15;
  }
  if (i.crop && (i.crop.hybrid || i.crop.legendary)) s += 15 + (i.crop.gen || 0) * 3;
  return Math.round(s);
}

/** Enter the contest with an item. Returns { score, target, won }. */
export function enterContest(id, key) {
  const f = DATA.FESTIVALS[id];
  const rec = G.state.festivals[recKey(id)] = festivalRecord(id);
  if (rec.entered || count(key) < 1) return null;
  removeItem(key, 1);
  const score = entryScore(key);
  const judges = f.target * rand(0.85, 1.15);
  const won = score >= judges;
  rec.entered = true; rec.won = won;
  if (won) {
    Object.entries(f.prizes.win || {}).forEach(([k, n]) => giveKey(k, n));
    discover('secrets', 'ribbon:' + id, f.name + ' champion');
  }
  emit('festival:contest', { id, won, score });
  return { score, target: Math.round(f.target), won };
}

// ---------------- Starfall night ----------------
export const isStarfallNight = () => todayFestival() === 'starfall' && G.state.time.min >= 19 * 60;

/** Catching a falling star. */
export function catchStar() {
  if (chance(0.25)) {
    const id = randomHybrid();
    addItem('seed:' + id, 1);
    return 'A strange seed fell with the star!';
  }
  const k = pick(['star_dust', 'star_dust', 'sky_crystal', 'seed:star_lily']);
  addItem(k, 1);
  return '+1 ' + itemInfo(k).name;
}
