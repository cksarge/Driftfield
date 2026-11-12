// =============================================================
//  EXPLORATION — islands drifting past, gliding, and what you find.
//
//  Each morning (and sometimes at noon) an island from the current
//  zone's pool drifts past for several hours. If it's within your
//  glide range you can visit. A visit gives you some energy; every
//  spot you use costs 1 energy and 30 in-game minutes.
// =============================================================

import { G, discover } from './state.js';
import { DATA } from '../data/index.js';
import { absMinutes } from './time.js';
import { hasBuff } from './mixing.js';
import { addItem, giveKey, unlockBlueprint, learnRecipe } from './items.js';
import { spawnAnimal } from './animals.js';
import { allTiles, objectAt } from './island.js';
import { weightedPick, randInt, chance, pick, uid, rand } from './utils.js';
import { emit } from './events.js';

// ---------------- passing islands ----------------
export function nearbyIslands() {
  const now = absMinutes();
  return G.state.nearby.filter(n => now >= n.arrive && now < n.leave);
}

function islandOpen(id) {
  const I = DATA.ISLANDS[id], s = G.state;
  if (I.seasons && !I.seasons.includes(s.time.season)) return false;
  if (I.after === 'lit' && !s.story.lit) return false;
  return I.zones === '*' || I.zones.includes('*') || I.zones.includes(s.nav.zone);
}

/** Spawn an island drifting past. hoursFromNow: arrival delay. */
export function spawnPassingIsland(forceId = null, hoursFromNow = 0) {
  const s = G.state;
  const present = new Set(s.nearby.map(n => n.id));
  let id = forceId;
  if (!id) {
    const w = {};
    for (const [iid, I] of Object.entries(DATA.ISLANDS)) {
      if (present.has(iid) || !islandOpen(iid)) continue;
      let wt = I.chance;
      // Islands still holding lost pieces show up a little more often.
      if (I.spots.some(sp => sp.type === 'piece' && !s.disc.pieces[sp.piece])) wt *= 1.5;
      w[iid] = wt;
    }
    id = weightedPick(w);
  }
  if (!id) return null;
  const now = absMinutes();
  const n = {
    uid: uid(), id, arrive: now + hoursFromNow * 60, leave: now + hoursFromNow * 60 + randInt(8, 12) * 60,
    side: chance(0.5) ? -1 : 1, lane: rand(0.15, 0.85), uses: {},
    secrets: DATA.ISLANDS[id].spots.map(sp => sp.type === 'secret' && chance(sp.chance + (hasBuff('lucky') ? 0.25 : 0))),
  };
  s.nearby.push(n);
  emit('island:passing', n);
  return n;
}

export function islandsOvernight() {
  const s = G.state;
  const now = absMinutes();
  s.nearby = s.nearby.filter(n => n.leave > now);
  if (chance(0.8)) spawnPassingIsland(null, 0);
  if (chance(0.45)) spawnPassingIsland(null, randInt(4, 7));
}

// ---------------- glider ----------------
export function glideRange() {
  let r = 1 + G.state.glider.level;
  if (G.state.objects.some(o => o.ref === 'telescope')) r += 1;
  if (hasBuff('floaty')) r += 2;
  return r;
}

export function upgradeGlider() {
  G.state.glider.level++;
  emit('glider:upgraded', G.state.glider.level);
}

export function visitEnergy() {
  return 3 + G.state.glider.level + (hasBuff('energizing') ? 2 : 0) + (hasBuff('speedy') ? 1 : 0);
}

/** Start a visit. Returns the visit object or an error string. */
export function startVisit(n) {
  const I = DATA.ISLANDS[n.id];
  if (I.distance > glideRange()) return `Too far! You need glide range ${I.distance} (yours is ${glideRange()}). Try a Floaty potion.`;
  G.rt.visit = { n, energy: visitEnergy() };
  G.state.stats.explored++;
  discover('islands', n.id, I.name);
  emit('explore:start', n);
  return G.rt.visit;
}

export function endVisit() {
  G.rt.visit = null;
  G.state.time.min += 30;           // the glide home takes a little while
  emit('explore:end');
}

export function spotVisible(n, idx) {
  const sp = DATA.ISLANDS[n.id].spots[idx];
  if (sp.type === 'secret') return n.secrets[idx];
  return true;
}

/** Is a spot used up? */
export function spotDone(n, idx) {
  const sp = DATA.ISLANDS[n.id].spots[idx];
  const opened = G.state.opened || (G.state.opened = {});
  if (sp.type === 'chest' || sp.type === 'secret') return !!opened[n.id + ':' + idx];
  if (sp.type === 'piece') return !!G.state.disc.pieces[sp.piece];
  if (sp.type === 'npc') return false;
  return (n.uses[idx] || 0) >= (sp.uses || 1);
}

/**
 * Use a spot. Returns { ok, lines: [...] } describing what happened.
 * NPC spots return { npc: id } so the UI can open a conversation.
 */
export function useSpot(idx) {
  const v = G.rt.visit;
  if (!v) return { ok: false, lines: ['You are not on an island.'] };
  const n = v.n, sp = DATA.ISLANDS[n.id].spots[idx];
  if (sp.type === 'npc') return { ok: true, npc: sp.character };
  if (spotDone(n, idx)) return { ok: false, lines: ['Nothing more here today.'] };
  if (v.energy <= 0) return { ok: false, lines: ['You\'re out of energy. Time to glide home.'] };
  v.energy--;
  G.state.time.min += 30;
  const lines = [];
  const lucky = hasBuff('lucky');

  if (sp.type === 'gather') {
    const q = randInt(sp.qty[0], sp.qty[1]) + (lucky ? 1 : 0);
    addItem(sp.item, q);
    n.uses[idx] = (n.uses[idx] || 0) + 1;
    lines.push(`+${q} ${DATA.ITEMS[sp.item].name}`);
    if (chance(lucky ? 0.2 : 0.08)) { addItem('lost_sock', 1); lines.push('+1 Lost Sock (huh?)'); }
    emit('explore:gather', { item: sp.item, q });
  } else if (sp.type === 'seeds') {
    const k = lucky ? 2 : 1;
    for (let i = 0; i < k; i++) { const c = pick(sp.pool); addItem('seed:' + c, randInt(1, 2)); lines.push(`Seeds: ${DATA.CROPS[c].name}`); }
    n.uses[idx] = (n.uses[idx] || 0) + 1;
    emit('explore:gather', { seeds: true });
  } else if (sp.type === 'chest' || sp.type === 'secret') {
    G.state.opened[n.id + ':' + idx] = true;
    for (const l of sp.loot) { giveKey(l.key, l.qty || 1); lines.push(lootText(l)); }
    if (sp.type === 'secret') discover('secrets', n.id + ':' + idx, sp.label);
    emit('explore:gather', { chest: true });
  } else if (sp.type === 'piece') {
    const p = recoverPiece(sp.piece);
    lines.push(`Recovered: ${p.name}!`);
    lines.push(`Wendell: "${p.memory}"`);
    emit('explore:gather', { piece: true });
  }
  return { ok: true, lines };
}

function lootText(l) {
  if (l.key === 'coins') return `+${l.qty} Shells`;
  if (l.key.startsWith('recipe:')) return `Recipe learned!`;
  if (l.key.startsWith('bp:')) return `Blueprint: ${DATA.BUILDINGS[l.key.slice(3)].name}!`;
  if (l.key.startsWith('clue:')) return `Clue found: ${DATA.CLUES[l.key.slice(5)].title}`;
  if (l.key.startsWith('deco:')) return `Found: ${DATA.DECOR[l.key.slice(5)].name}`;
  return `+${l.qty || 1} ${(DATA.ITEMS[l.key] || { name: l.key }).name}`;
}

// ---------------- lost pieces of the old island ----------------
export function recoverPiece(id) {
  const p = DATA.PIECES[id];
  if (G.state.disc.pieces[id]) return p;
  if (p.kind === 'deco') addItem('deco:' + p.ref, 1);
  else if (p.kind === 'building') { unlockBlueprint(p.ref); addItem('bld:' + p.ref, 1); }
  else if (p.kind === 'recipes') p.ref.forEach(r => learnRecipe(r));
  else if (p.kind === 'animal') {
    const n = p.count || 1;
    for (let i = 0; i < n; i++) {
      const free = allTiles().filter(([x, y]) => !objectAt(x, y));
      const t = free.length ? pick(free) : [0, 0];
      spawnAnimal(p.ref, t[0], t[1], { name: i === 0 ? p.animalName : undefined });
    }
  }
  discover('pieces', id, p.name);
  emit('piece:found', { id, piece: p });
  return p;
}

export const piecesFound = () => Object.keys(G.state.disc.pieces).length;
export const piecesTotal = () => Object.keys(DATA.PIECES).length;
