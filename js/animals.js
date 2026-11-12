// =============================================================
//  ANIMALS — feeding, products, breeding and wandering.
//
//  What an animal eats shapes what it makes:
//    • colourful food tints wool, eggs and silk ("Rose Wool")
//    • food effects pass into the product ("Sweet Milk")
//    • Golden or Glowing food → Golden/Glowing products (worth more!)
//  Sky bees live in beehives and flavour honey with nearby flowers.
//  Animals also carry inherited traits (data/animals.js ANIMAL_TRAITS)
//  that change how much and how often they produce.
// =============================================================

import { G, discover } from './state.js';
import { DATA } from '../data/index.js';
import { itemInfo, registerItem, addItem, removeItem, count, getCrop } from './items.js';
import { allTiles, isLand, objectAt, objectDef } from './island.js';
import { hasBuff } from './mixing.js';
import { chance, pick, rand, mixHue, hueName, hexToHue, hueToHex, uid, clamp, mixHex, weightedPick } from './utils.js';
import { emit } from './events.js';

const NAMES = ['Puff', 'Nimbus', 'Biscuit', 'Clover', 'Maple', 'Mochi', 'Pip', 'Wisp', 'Bramble', 'Dumpling', 'Sprout', 'Hazel',
  'Pebble', 'Toffee', 'Cumulus', 'Fern', 'Juniper', 'Marble', 'Noodle', 'Willow', 'Sunny', 'Drizzle', 'Breeze', 'Pickle'];

// ---------------- homes & capacity ----------------
export function capacityFor(species) {
  const home = DATA.ANIMALS[species].home;
  return G.state.objects.filter(o => o.ref === home && !o.broken)
    .reduce((s, o) => s + (DATA.BUILDINGS[home].capacity || 0), 0);
}
export function usedFor(species) {
  const home = DATA.ANIMALS[species].home;
  return G.state.animals.filter(a => DATA.ANIMALS[a.species].home === home).length;
}
export const hasRoomFor = (species) => usedFor(species) < capacityFor(species);

/** Create an animal at a tile. Bees go into a beehive object instead. */
export function spawnAnimal(species, x, y, opts = {}) {
  const def = DATA.ANIMALS[species];
  const a = {
    id: uid(), species, name: opts.name || pick(NAMES),
    hue: opts.hue ?? def.baseHue, light: opts.light ?? def.baseLight, pattern: opts.pattern || 'plain',
    x: x + 0.5, y: y + 0.5, tx: x + 0.5, ty: y + 0.5,
    fed: null, happy: 3, timer: 0, ready: null, baby: opts.baby || 0,
    traits: (opts.traits || []).slice(0, 3),
  };
  G.state.animals.push(a);
  discover('animals', species, def.name);
  discover('animals', species + ':' + a.pattern, `${def.name} (${a.pattern})`);
  a.traits.forEach(t => discover('animals', 'trait:' + t, DATA.ANIMAL_TRAITS[t].name));
  emit('animal:added', a);
  return a;
}

/** Place an animal from the inventory onto the island. Returns '' or an error message. */
export function placeAnimalFromBag(species, x, y) {
  const def = DATA.ANIMALS[species];
  if (count('animal:' + species) < 1) return 'You have none of those.';
  if (def.hive) {
    const o = objectAt(x, y);
    if (!o || o.ref !== 'beehive') return 'Sky bees need a Beehive. Tap a beehive to move them in.';
    if (o.data.bees) return 'That hive already has bees.';
    o.data.bees = true; o.data.timer = 0;
    removeItem('animal:' + species, 1);
    discover('animals', species, def.name);
    emit('animal:added', { species });
    return '';
  }
  if (!isLand(x, y)) return 'Animals need solid ground.';
  if (!hasRoomFor(species)) return `No room! Build another ${DATA.BUILDINGS[def.home].name}.`;
  removeItem('animal:' + species, 1);
  // Now and then a new animal arrives with a trait of its own.
  spawnAnimal(species, x, y, { traits: chance(0.25) ? [randomTrait()] : [] });
  return '';
}

// ---------------- feeding ----------------
/** Items an animal will eat. */
export function isFood(key) {
  const i = itemInfo(key);
  return !!i && (i.kind === 'crop' || i.kind === 'mix' || i.kind === 'forage' || key === 'fiber');
}

export function feed(animal, key) {
  if (animal.fed) return 'Already fed today.';
  if (!isFood(key) || count(key) < 1) return 'That isn\'t food.';
  const i = itemInfo(key);
  removeItem(key, 1);
  const crop = i.cropId ? getCrop(i.cropId) : null;
  animal.fed = {
    key, name: i.name, color: i.color || (i.icon && i.icon.color) || null,
    effects: (i.effects || []).slice(0, 3),
    rare: crop ? crop.traits.rare : [],
  };
  animal.happy = Math.min(5, animal.happy + 1);
  if (animal.fed.effects.some(e => ['calming', 'cozy', 'musical'].includes(e))) animal.happy = Math.min(5, animal.happy + 1);
  emit('animal:fed', { animal, key });
  return '';
}

export function collect(animal) {
  if (!animal.ready) return null;
  const key = animal.ready;
  addItem(key, animal.readyCount || 1);
  animal.ready = null; animal.readyCount = 1;
  emit('animal:collected', { animal, key });
  return key;
}

// ---------------- products ----------------
const TINTED = ['Wool', 'Egg', 'Silk', 'Fluff', 'Down'];

const traitDefs = (traits) => (traits || []).map(t => DATA.ANIMAL_TRAITS[t]).filter(Boolean);

/** Days between products, after Quick traits. */
export const productEvery = (a) => Math.max(1, DATA.ANIMALS[a.species].every - traitDefs(a.traits).reduce((s, t) => s + (t.faster || 0), 0));

/** A random trait, weighted by how often each one mutates. */
function randomTrait(exclude = []) {
  const w = {};
  Object.entries(DATA.ANIMAL_TRAITS).forEach(([id, t]) => { if (!exclude.includes(id)) w[id] = t.mutate || 1; });
  return weightedPick(w);
}

/** Build the product an animal makes from what it ate. */
export function makeProduct(species, food, happy = 3, traits = []) {
  const def = DATA.ANIMALS[species];
  if (species === 'breeze_pup') {
    const pool = hasBuff('lucky') || (food && food.effects.includes('lucky'))
      ? ['sky_crystal', 'old_gear', 'sunstone', 'echo_shell'] : ['old_gear', 'lost_sock', 'feather', 'wild_herb', 'stone', 'sky_crystal'];
    return pick(pool);
  }
  const effects = [...def.productEffects];
  const fx = food ? food.effects : [];
  const rare = food ? food.rare : [];
  fx.slice(0, 2).forEach(e => { if (!effects.includes(e) && effects.length < 3) effects.push(e); });
  const T = traitDefs(traits);
  T.forEach(t => { if (t.effect && !effects.includes(t.effect) && effects.length < 4) effects.push(t.effect); });

  let adj = '', color = hueToHex(def.baseHue, 30, def.baseLight), bonus = 0;
  const golden = fx.includes('golden') || rare.includes('golden');
  const glowing = fx.includes('glowing') || rare.includes('glowing');
  if (golden) { adj = 'Golden'; color = '#f5c542'; bonus = 25; if (!effects.includes('golden')) effects.push('golden'); }
  else if (glowing) { adj = 'Glowing'; color = '#fff3a0'; bonus = 18; if (!effects.includes('glowing')) effects.push('glowing'); }
  else if (food && food.color && TINTED.includes(def.product)) {
    color = mixHex([food.color, food.color, '#ffffff']);
    adj = hueName(hexToHue(food.color));
  } else if (fx.length) {
    adj = DATA.EFFECTS[fx[0]].name;
  }
  bonus += T.reduce((s, t) => s + (t.value || 0), 0);
  const mult = T.reduce((m, t) => m * (t.valueMult || 1), 1);
  const value = Math.round((def.productValue + effects.reduce((s, e) => s + DATA.EFFECTS[e].value, 0) * 0.5 + bonus + (happy >= 5 ? 4 : 0)) * mult);
  let name = (adj ? adj + ' ' : '') + def.product;
  if (mult > 1 || T.some(t => t.value >= 6)) name = 'Fine ' + name;
  const key = registerItem({
    kind: 'product', name, effects: effects.slice(0, 4), color, value,
    tags: ['product', def.product.toLowerCase(), ...(def.product === 'Honey' ? ['honey'] : [])],
    icon: { shape: def.productIcon, color }, desc: `Made by your ${def.name.toLowerCase()}.`,
  });
  discover('secrets', 'product:' + name, name);
  return key;
}

/** Honey flavoured by flowers & crops within 3 tiles of the hive. */
function makeHoney(hive) {
  const counts = {}, hues = [], rareFx = new Set();
  let topCrop = null, topN = 0;
  for (const [x, y, t] of allTiles()) {
    if (Math.abs(x - hive.x) > 3 || Math.abs(y - hive.y) > 3) continue;
    if (t.crop) {
      const c = getCrop(t.crop.id); if (!c) continue;
      const w = c.flower ? 2 : 1;
      counts[c.id] = (counts[c.id] || 0) + w;
      if (counts[c.id] > topN) { topN = counts[c.id]; topCrop = c; }
      hues.push(c.traits.hue);
      c.traits.rare.forEach(r => rareFx.add(DATA.RARE_TRAITS[r].effect));
    }
    const o = objectAt(x, y);
    if (o && o.type === 'deco' && objectDef(o).flower) { counts._deco = (counts._deco || 0) + 1; hues.push(hexToHue(o.color)); }
  }
  const food = { effects: [], rare: [], color: null };
  if (topCrop) {
    const f = DATA.FLAVORS[topCrop.traits.flavor];
    food.effects.push(f.effect);
    [...rareFx].slice(0, 1).forEach(e => food.effects.push(e));
    if (topCrop.traits.rare.includes('golden')) food.rare.push('golden');
  } else if (counts._deco) food.effects.push('floral');
  const key = makeProduct('sky_bee', food);
  // Rename honey after its main flower for flavour.
  const reg = G.state.reg.items[key.slice(2)];
  if (reg && topCrop && !reg.renamed) {
    reg.name = `${topCrop.name} Honey`;
    if (hues.length) reg.color = mixHex([hueToHex(hues.reduce((a, b) => mixHue(a, b)), 70, 55), '#f2b640']);
    reg.icon = { shape: 'honey', color: reg.color };
    reg.renamed = true;
  }
  return key;
}

// ---------------- daily update ----------------
export function animalsOvernight() {
  for (const a of G.state.animals) {
    const def = DATA.ANIMALS[a.species];
    if (a.baby > 0) { a.baby--; a.fed = null; continue; }
    const T = traitDefs(a.traits);
    if (a.fed) {
      a.timer++;
      if (hasBuff('musical') || hasBuff('calming') || hasBuff('cozy')) a.happy = Math.min(5, a.happy + 1);
      if (a.timer >= productEvery(a) && !a.ready) {
        a.ready = makeProduct(a.species, a.fed, a.happy, a.traits);
        a.readyCount = T.some(t => t.doubles && chance(t.doubles)) ? 2 : 1;
        a.timer = 0;
      }
    } else if (!T.some(t => t.steady)) {
      a.happy = Math.max(0, a.happy - 1);
    }
    a.lastFed = !!a.fed;
    a.fed = null;
  }
  // Hives
  for (const h of G.state.objects.filter(o => o.ref === 'beehive' && o.data.bees)) {
    h.data.timer = (h.data.timer || 0) + 1;
    if (h.data.timer >= DATA.ANIMALS.sky_bee.every && !h.data.ready) { h.data.ready = makeHoney(h); h.data.timer = 0; }
  }
  breedAnimals();
}

function breedAnimals() {
  const bySpecies = {};
  G.state.animals.forEach(a => { if (!a.baby && a.lastFed && a.happy >= 3) (bySpecies[a.species] = bySpecies[a.species] || []).push(a); });
  for (const [sp, list] of Object.entries(bySpecies)) {
    if (list.length < 2 || !hasRoomFor(sp)) continue;
    const [p1, p2] = [list[0], list[1 + Math.floor(Math.random() * (list.length - 1))]];
    const fertile = [...traitDefs(p1.traits), ...traitDefs(p2.traits)].reduce((s, t) => s + (t.fertile || 0), 0);
    if (!chance(0.12 + fertile + (hasBuff('musical') ? 0.08 : 0))) continue;
    const def = DATA.ANIMALS[sp];
    let hue = (mixHue(p1.hue, p2.hue) + rand(-20, 20) + 360) % 360;
    if (chance(0.1)) hue = rand(0, 360);
    let pattern = chance(0.5) ? p1.pattern : p2.pattern;
    if (chance(0.15)) pattern = pick(def.patterns);
    const light = clamp((p1.light + p2.light) / 2 + rand(-10, 10), 55, 97);
    const traits = inheritTraits(p1.traits || [], p2.traits || []);
    const t = randomFreeTile();
    const baby = spawnAnimal(sp, t[0], t[1], { hue, light, pattern, baby: 3, traits: traits.list });
    baby.parents = [p1.name, p2.name];
    baby.newTrait = traits.mutated;
    emit('animal:born', { animal: baby, parents: [p1, p2] });
  }
}

/** Each parent trait passes on 50% of the time (85% if both have it), plus a small mutation chance. */
export function inheritTraits(a, b) {
  const list = [];
  [...new Set([...a, ...b])].forEach(t => { if (DATA.ANIMAL_TRAITS[t] && chance(a.includes(t) && b.includes(t) ? 0.85 : 0.5)) list.push(t); });
  let mutated = null;
  if (list.length < 3 && chance(0.12 + (hasBuff('lucky') ? 0.08 : 0))) { mutated = randomTrait(list); list.push(mutated); }
  return { list: list.slice(0, 3), mutated };
}

export function collectHive(o) {
  if (!o.data.ready) return null;
  const key = o.data.ready;
  addItem(key, 1);
  o.data.ready = null;
  emit('animal:collected', { key });
  return key;
}

// ---------------- wandering (runtime only) ----------------
function randomFreeTile() {
  const tiles = allTiles().filter(([x, y]) => !objectAt(x, y));
  const t = tiles.length ? pick(tiles) : allTiles()[0];
  return t ? [t[0], t[1]] : [0, 0];
}

export function updateAnimals(dt) {
  for (const a of G.state.animals) {
    const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
    if (d < 0.05) {
      if (chance(dt * 0.25)) {
        const nx = Math.round(a.x - 0.5 + rand(-2.5, 2.5)), ny = Math.round(a.y - 0.5 + rand(-2.5, 2.5));
        if (isLand(nx, ny) && !objectAt(nx, ny)) { a.tx = nx + 0.5; a.ty = ny + 0.5; }
      }
    } else {
      const sp = Math.min(d, dt * 0.6);
      a.x += dx / d * sp; a.y += dy / d * sp;
      a.facing = dx < 0 ? -1 : 1;
    }
    // If land vanished under them (tutorial storm), snap back.
    if (!isLand(Math.floor(a.x), Math.floor(a.y)) && !G.rt.storm) {
      const t = randomFreeTile(); a.x = a.tx = t[0] + 0.5; a.y = a.ty = t[1] + 0.5;
    }
  }
}

export function animalAt(wx, wy) {
  let best = null, bd = 0.6;
  for (const a of G.state.animals) {
    const d = Math.hypot(a.x - wx, a.y - wy);
    if (d < bd) { bd = d; best = a; }
  }
  return best;
}

