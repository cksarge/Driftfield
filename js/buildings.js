// =============================================================
//  BUILDINGS & DECORATION — what's available, placing, repairing,
//  painting with dyes, roof styles, and each building's daily job.
// =============================================================

import { G } from './state.js';
import { DATA } from '../data/index.js';
import { canAfford, pay, count, removeItem, addItem, itemInfo } from './items.js';
import { addObject, areaFree, removeObject, objectDef, hasBuilding } from './island.js';
import { chance } from './utils.js';
import { emit } from './events.js';

/** Is a building type available to build? */
export function buildingUnlocked(id) {
  const b = DATA.BUILDINGS[id];
  return !b.blueprint || !!G.state.blueprints[id];
}

/** List of buildings for the Build panel. */
export function buildList() {
  return Object.entries(DATA.BUILDINGS).map(([id, b]) => ({
    id, def: b, unlocked: buildingUnlocked(id), free: count('bld:' + id) > 0,
    affordable: count('bld:' + id) > 0 || canAfford(b.cost),
  }));
}

/** Place a building at (x,y). Uses a free 'bld:' item if you have one. */
export function placeBuilding(id, x, y) {
  const b = DATA.BUILDINGS[id];
  const [w, h] = b.size;
  if (!areaFree(x, y, w, h)) return 'Not enough clear ground there.';
  if (count('bld:' + id) > 0) removeItem('bld:' + id, 1);
  else {
    if (!buildingUnlocked(id)) return 'You need the blueprint first.';
    if (!pay(b.cost)) return 'Not enough materials.';
  }
  const o = addObject('building', id, x, y);
  emit('building:placed', o);
  return '';
}

export function placeDeco(id, x, y) {
  if (count('deco:' + id) < 1) return 'You don\'t have that decoration.';
  if (!areaFree(x, y, 1, 1)) return 'Something is already there.';
  removeItem('deco:' + id, 1);
  const o = addObject('deco', id, x, y);
  emit('deco:placed', o);
  return '';
}

/** Pick up a placed object. Decorations return to the bag; buildings refund half. */
export function pickUp(o) {
  if (o.ref === 'windmill' || o.ref === 'house') return 'This one stays put.';
  if (o.type === 'deco') addItem('deco:' + o.ref, 1);
  else {
    const cost = DATA.BUILDINGS[o.ref].cost;
    Object.entries(cost).forEach(([k, n]) => { if (k !== 'coins') addItem(k, Math.floor(n / 2), true); });
    if (o.ref === 'beehive' && o.data.bees) addItem('animal:sky_bee', 1);
  }
  removeObject(o);
  emit('inventory:changed');
  return '';
}

export function moveObject(o, x, y) {
  if (!areaFree(x, y, o.w, o.h, o)) return 'Not enough clear ground there.';
  o.x = x; o.y = y;
  emit('object:moved', o);
  return '';
}

// ---------------- customising ----------------
/** Paint an object with a dye item. part: 'wall' | 'roof'. */
export function paintObject(o, dyeKey, part = 'wall') {
  const info = itemInfo(dyeKey);
  if (!info || info.kind !== 'dye' || count(dyeKey) < 1) return 'Choose a dye first.';
  removeItem(dyeKey, 1);
  if (part === 'roof' && o.type === 'building') o.roofColor = info.color; else o.color = info.color;
  if (info.effects.includes('glowing') || info.effects.includes('prismatic')) o.glow = true;
  emit('object:painted', o);
  return '';
}

export function cycleRoof(o) {
  const def = objectDef(o);
  if (!def.roofs || def.roofs.length < 2) return;
  const i = def.roofs.indexOf(o.roof);
  o.roof = def.roofs[(i + 1) % def.roofs.length];
}

// ---------------- windmill ----------------
export const WINDMILL_REPAIR = { wood: 15, stone: 10, rope: 3, old_gear: 2 };

export function repairWindmill(o) {
  if (!o.broken) return '';
  if (!pay(WINDMILL_REPAIR)) return 'Not enough materials to repair it yet.';
  o.broken = false;
  G.state.windmillFixed = true;
  emit('windmill:fixed');
  return '';
}

// ---------------- daily jobs ----------------
export function buildingsOvernight() {
  const s = G.state;
  for (const o of s.objects) {
    if (o.type !== 'building' || o.broken) continue;
    if (o.ref === 'compost_bin') addItem('compost', 1, true);
    if (o.ref === 'mill' && s.windmillFixed) addItem('compost', 2, true);
    if (o.ref === 'lightning_rod' && s.weather.today === 'storm' && chance(0.7)) {
      addItem('storm_glass', 1, true);
      emit('lightning:caught');
    }
  }
}

/** Mill: grind 3 crops of any kind into 2 compost. */
export function millGrind(cropKey) {
  if (!hasBuilding('mill') || count(cropKey) < 3) return false;
  removeItem(cropKey, 3);
  addItem('compost', 2);
  return true;
}

