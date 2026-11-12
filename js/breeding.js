// =============================================================
//  CROSSBREEDING — make new crop varieties from two parents.
//
//  When two different ripe crops sit next to each other, they may
//  cross-pollinate overnight (js/farming.js). Harvesting a pollinated
//  crop gives a hybrid seed made here.
//
//  Hybrids inherit a mix of both parents' traits, with a small chance
//  of mutation (bigger in rare zones and with Lucky buffs). Their id
//  is a hash of their traits, so the same result is the same variety.
//  Specific trait combos turn into LEGENDARY crops (data/crops.js).
// =============================================================

import { G } from './state.js';
import { DATA } from '../data/index.js';
import { getCrop } from './items.js';
import { clamp, chance, pick, rand, randInt, mixHue, hash, hueName, weightedPick } from './utils.js';
import { emit } from './events.js';
import { hasBuff } from './mixing.js';

const NOUNS = ['fruit', 'berry', 'melon', 'bean', 'root', 'mint', 'lily', 'bush', 'tomato', 'pepper', 'chili', 'pumpkin', 'carrot', 'wheat', 'reed', 'fig', 'bloom', 'apple', 'rose', 'lotus', 'blossom', 'cotton'];

/** Split a crop name into a stem ("Sun") and noun ("fruit") for naming hybrids. */
export function nameParts(crop) {
  if (crop.stem) return [crop.stem, crop.noun];
  const words = crop.name.split(' ');
  if (words.length >= 2) return [words[0], words[words.length - 1].toLowerCase()];
  const w = words[0], lw = w.toLowerCase();
  const n = NOUNS.find(s => lw.endsWith(s) && lw.length > s.length);
  return n ? [w.slice(0, w.length - n.length), n] : [w, lw];
}

/** Base crops this crop descends from. */
function lineage(id) {
  const c = getCrop(id);
  if (!c) return [];
  return c.lineage || [id];
}

/** Current mutation chance. */
function mutationChance(extra = 0) {
  const zone = DATA.ZONES[G.state.nav.zone];
  return 0.06 + (zone.mutation || 0) + (hasBuff('lucky') ? 0.06 : 0) + extra;
}

function randomRareTrait() {
  const zone = DATA.ZONES[G.state.nav.zone];
  const w = {};
  Object.keys(DATA.RARE_TRAITS).forEach(r => { w[r] = (zone.favored || []).includes(r) ? 4 : 1; });
  return weightedPick(w);
}

/**
 * Create (or find) the hybrid of crops a × b. Returns the crop id.
 * opts.extraMutation: bonus from Lucky fertilizer etc.
 */
export function createHybrid(aId, bId, opts = {}) {
  const A = getCrop(aId), B = getCrop(bId);
  if (!A || !B) return aId;
  const ta = A.traits, tb = B.traits;
  const mut = mutationChance(opts.extraMutation || 0);
  const mutated = [];

  // --- inherit traits ---
  let hue = (mixHue(ta.hue, tb.hue) + rand(-15, 15) + 360) % 360;
  if (chance(mut)) { hue = rand(0, 360); mutated.push('colour'); }

  let size = chance(0.5) ? ta.size : tb.size;
  if (chance(mut * 2)) { size += pick([-1, 1, 2]); mutated.push('size'); }
  size = clamp(size, 1, 5);

  let flavor = chance(0.5) ? ta.flavor : tb.flavor;
  if (chance(mut)) { flavor = pick(Object.keys(DATA.FLAVORS)); mutated.push('flavour'); }

  let growth = Math.round((ta.growth + tb.growth) / 2) + (chance(0.3) ? randInt(-1, 1) : 0);
  growth = clamp(growth, 1, 9);

  const allClimates = [...new Set([...ta.climates, ...tb.climates])];
  let climates = allClimates.filter(() => chance(0.65));
  if (!climates.length) climates = [pick(ta.climates), pick(tb.climates)];
  if (chance(mut)) { climates.push(pick(Object.keys(DATA.CLIMATES))); mutated.push('climate'); }
  climates = [...new Set(climates)];

  let yld = clamp(Math.round((ta.yield + tb.yield) / 2 + (chance(0.25) ? randInt(-1, 1) : 0)), 1, 5);

  const rareSet = new Set();
  [...new Set([...ta.rare, ...tb.rare])].forEach(r => {
    const both = ta.rare.includes(r) && tb.rare.includes(r);
    if (chance(both ? 0.85 : 0.5)) rareSet.add(r);
  });
  if (chance(mut)) { const r = randomRareTrait(); if (!rareSet.has(r)) { rareSet.add(r); mutated.push(r); } }
  let rare = [...rareSet].slice(0, 3);

  const traits = { hue: Math.round(hue), size, flavor, growth, climates, yield: yld, rare };
  const gen = Math.max(A.gen || 0, B.gen || 0) + 1;
  const lin = [...new Set([...lineage(aId), ...lineage(bId)])];

  // --- legendary? ---
  const leg = checkLegendary(traits, gen, lin);
  if (leg) { emit('legendary', leg); return leg; }

  // --- build the variety ---
  const shape = chance(0.5) ? A.shape : B.shape;
  const [stemA] = nameParts(A), [, nounB] = nameParts(B);
  const id = 'h' + hash(JSON.stringify(traits) + shape);
  if (getCrop(id)) return id;

  let prefix = '';
  const newest = mutated.find(m => DATA.RARE_TRAITS[m]);
  if (newest) prefix = DATA.RARE_TRAITS[newest].prefix;
  else if (rare.length) prefix = DATA.RARE_TRAITS[rare[0]].prefix;
  else if (size >= 5) prefix = 'Giant';
  else if (size === 1 && (ta.size > 1 || tb.size > 1)) prefix = 'Tiny';
  else if (Math.abs(((hue - ta.hue + 540) % 360) - 180) > 50) prefix = hueName(hue);
  // Avoid stutters like "Star Starmelon".
  if (prefix && (stemA + nounB).toLowerCase().includes(prefix.toLowerCase())) prefix = size >= 5 ? 'Giant' : hueName(hue);
  let name = (prefix ? prefix + ' ' : '') + stemA + nounB;
  name = uniqueName(name);

  const transforms = { ...((A.mix && A.mix.transforms) || {}), ...((B.mix && B.mix.transforms) || {}) };
  const tKeys = Object.keys(transforms).slice(0, 3);
  const crop = {
    id, name, hybrid: true, shape, traits, gen, lineage: lin,
    parents: [aId, bId], stem: stemA, noun: nounB,
    flower: !!((A.flower || B.flower) && shape === 'flower'),
    mix: tKeys.length ? { transforms: Object.fromEntries(tKeys.map(k => [k, transforms[k]])) } : undefined,
    desc: describe(traits, A, B, mutated),
  };
  G.state.reg.crops[id] = crop;
  G.state.stats.hybrids++;
  emit('hybrid:created', { id, mutated });
  return id;
}

/** A fertilizer-induced "sport": same crop, plus one rare trait. */
export function createSport(cropId, trait) {
  const C = getCrop(cropId);
  if (!C || C.traits.rare.includes(trait)) return cropId;
  const traits = { ...C.traits, climates: [...C.traits.climates], rare: [...C.traits.rare, trait].slice(-3) };
  const gen = (C.gen || 0) + 1;
  const leg = checkLegendary(traits, gen, lineage(cropId));
  if (leg) { emit('legendary', leg); return leg; }
  const id = 'h' + hash(JSON.stringify(traits) + C.shape);
  if (getCrop(id)) return id;
  const [stem, noun] = nameParts(C);
  const crop = {
    id, name: uniqueName(DATA.RARE_TRAITS[trait].prefix + ' ' + C.name),
    hybrid: true, shape: C.shape, traits, gen, lineage: lineage(cropId), parents: [cropId, cropId], stem, noun,
    flower: !!C.flower, mix: C.mix, desc: `A ${DATA.RARE_TRAITS[trait].name.toLowerCase()} sport of ${C.name}, coaxed out by fertilizer.`,
  };
  G.state.reg.crops[id] = crop;
  G.state.stats.hybrids++;
  emit('hybrid:created', { id, mutated: [trait] });
  return id;
}

/** A random hybrid of two base crops (from events). */
export function randomHybrid() {
  const base = Object.keys(DATA.CROPS);
  const a = pick(base); let b = pick(base);
  while (b === a) b = pick(base);
  return createHybrid(a, b, { extraMutation: 0.15 });
}

function checkLegendary(traits, gen, lin) {
  const zone = G.state.nav.zone, weather = G.state.weather.today;
  for (const [id, L] of Object.entries(DATA.LEGENDARIES)) {
    const r = L.requires;
    if (r.rare && !r.rare.every(x => traits.rare.includes(x))) continue;
    if (r.flavor && traits.flavor !== r.flavor) continue;
    if (r.minSize && traits.size < r.minSize) continue;
    if (r.minGen && gen < r.minGen) continue;
    if (r.zone && zone !== r.zone) continue;
    if (r.weather && weather !== r.weather) continue;
    if (r.lineage && !r.lineage.every(x => lin.includes(x))) continue;
    if (r.hueRange && (traits.hue < r.hueRange[0] || traits.hue > r.hueRange[1])) continue;
    return id;
  }
  return null;
}

function uniqueName(name) {
  const taken = new Set(Object.values(G.state.reg.crops).map(c => c.name));
  if (!taken.has(name)) return name;
  const numerals = ['II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  for (const n of numerals) if (!taken.has(`${name} ${n}`)) return `${name} ${n}`;
  return name + ' ' + Math.floor(Math.random() * 1000);
}

function describe(t, A, B, mutated) {
  const bits = [`A cross of ${A.name} and ${B.name}.`];
  const sizeWord = ['', 'Tiny', 'Small', 'Medium', 'Large', 'Huge'][t.size];
  bits.push(`${sizeWord}, ${DATA.FLAVORS[t.flavor].name.toLowerCase()} and ${hueName(t.hue).toLowerCase()}.`);
  if (mutated.length) bits.push(`Mutated: ${mutated.join(', ')}!`);
  return bits.join(' ');
}
