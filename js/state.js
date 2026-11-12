// =============================================================
//  STATE — the single object that holds the whole game.
//
//  G.state     everything that gets saved (plain JSON)
//  G.settings  player settings (saved separately, shared by slots)
//  G.rt        runtime-only stuff (camera, particles, UI mode…)
//
//  Everything in G.state must be JSON-safe so saving is trivial.
// =============================================================

import { emit } from './events.js';

export const SAVE_VERSION = 1;

export const G = {
  state: null,
  settings: {
    music: 0.5, sfx: 0.7, muted: false,
    quality: 'high',     // 'high' | 'low' (fewer particles & clouds)
    speed: 1,            // game speed multiplier
    hints: true,
  },
  rt: {
    tool: 'hand',        // current tool: hand | hoe | water | seed | build | remove | move | paint
    seed: null,          // selected seed key when tool === 'seed'
    placing: null,       // { kind:'building'|'deco'|'land', ref, rot, free? }
    paintKey: null,      // dye item used by the paint tool
    camera: { x: 0, y: 0, zoom: 1 },
    paused: false,       // panels pause time
    running: false,
    slot: 0,
    fx: [],              // particles/visual effects
    toastQueue: [],
    hover: null,
    storm: null,         // tutorial storm cinematic state
  },
};

/** A fresh, empty save. js/island.js and js/tutorial.js fill it in. */
export function blankState(slot, farmName) {
  return {
    version: SAVE_VERSION,
    slot, farmName: farmName || 'My Island',
    phase: 'tutorial',          // tutorial → main  (storm is runtime only)
    tutorial: { step: 0 },
    time: { min: 6 * 60, day: 1, season: 0, year: 1, total: 0 },
    coins: 0,
    inv: {},
    tiles: {},                  // 'x,y' → { soil, wet, q, crop }
    objects: [],                // buildings & decorations
    animals: [],
    reg: { crops: {}, items: {} },
    disc: {
      crops: {}, mixes: {}, effects: {}, animals: {}, islands: {}, characters: {},
      recipes: {}, blueprints: {}, pieces: {}, zones: {}, secrets: {}, clues: {}, decor: {},
    },
    journal: [],                // Mix Journal entries
    recipesKnown: {},
    blueprints: {},             // building ids unlocked by blueprint
    nav: { zone: 'sunny', daysIn: 0, next: 'windy' },
    weather: { today: 'clear', forecast: ['clear', 'clear', 'cloudy'] },
    nearby: [],                 // islands drifting past
    opened: {},                 // chests opened forever ("island:spot")
    trader: null,
    demand: {},
    deliveries: [],
    quests: { active: {}, done: {} },
    friendship: {},
    story: { stage: 0, lit: false, truthShown: false, ended: false },
    buffs: { effects: [], day: 0 },
    glider: { level: 1 },
    tools: { hoe: 1, can: 1 },  // upgraded at the Workshop
    player: { x: 0, y: 0, outfit: 'overalls', hat: 'straw', colors: { top: '#5fb0e0', bottom: '#6b4f3a', hat: '#f5d742', skin: '#f2c6a0' } },
    flag: { pattern: 'stripe', c1: '#e05a5a', c2: '#f4ecdc' },
    sail: '#fff6e0', balloon: '#ff9a8a',
    festivals: {},
    tipsShown: {},
    stats: { harvested: 0, mixes: 0, hybrids: 0, sold: 0, earned: 0, explored: 0 },
    windmillFixed: false,
  };
}

// ---------------- discovery ----------------
/**
 * Record a discovery. Returns true if it was new.
 * category: one of the keys in state.disc
 */
export function discover(category, id, label) {
  const s = G.state;
  if (!s || !s.disc[category]) return false;
  if (s.disc[category][id]) return false;
  s.disc[category][id] = { label: label || id, day: s.time.total };
  emit('discovered', { category, id, label });
  return true;
}

export function isDiscovered(category, id) {
  return !!(G.state && G.state.disc[category] && G.state.disc[category][id]);
}

export function totalDiscoveries() {
  const d = G.state.disc;
  return Object.values(d).reduce((s, c) => s + Object.keys(c).length, 0);
}
