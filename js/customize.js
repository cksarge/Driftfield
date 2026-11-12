// =============================================================
//  CUSTOMIZE — outfits, hats, colours, flag, sails and balloon.
//  Every dye you've made adds its colour to the palette.
// =============================================================

import { G, totalDiscoveries } from './state.js';
import { DATA } from '../data/index.js';

/** Is an outfit/hat unlocked? Rules are in data/clothing.js. */
export function unlocked(rule) {
  const s = G.state;
  if (rule === 'start') return true;
  if (rule === 'festival') return Object.values(s.festivals).some(f => f.attended);
  const [kind, val] = rule.split(':');
  if (kind === 'beacon') return s.story.stage >= Number(val);
  if (kind === 'pieces') return Object.keys(s.disc.pieces).length >= Number(val);
  if (kind === 'discoveries') return totalDiscoveries() >= Number(val);
  if (kind === 'quest') return !!s.quests.done[val];
  return false;
}

export function unlockText(rule) {
  if (rule === 'festival') return 'Attend any festival';
  const [kind, val] = rule.split(':');
  if (kind === 'beacon') return `Beacon repair stage ${val}`;
  if (kind === 'pieces') return `Recover ${val} lost pieces`;
  if (kind === 'discoveries') return `${val} discoveries`;
  if (kind === 'quest') return `Finish "${DATA.QUESTS[val].title}"`;
  return '';
}

/** Base colours plus every dye colour you've made. */
export function palette() {
  const dyeColors = Object.values(G.state.reg.items).filter(i => i.kind === 'dye').map(i => i.color);
  return [...new Set([...DATA.BASE_COLORS, ...dyeColors])];
}
