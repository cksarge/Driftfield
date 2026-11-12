// =============================================================
//  NEEDS — one shared way to describe "what someone wants".
//  Used by quests, delivery requests, the Beacon and festivals.
//  (Format documented at the top of data/quests.js.)
// =============================================================

import { G } from './state.js';
import { DATA } from '../data/index.js';
import { itemInfo, getCrop, removeItem, itemMatches } from './items.js';

/** Does one inventory item satisfy a need? */
export function itemSatisfies(key, need) {
  if (need.item) return key === need.item;
  if (need.tag) return itemMatches(key, 'tag:' + need.tag);
  if (need.kind) return itemMatches(key, 'kind:' + need.kind);
  const info = itemInfo(key);
  if (!info) return false;
  if (need.mix) {
    if (!info.base) return false;
    if (need.mix.base && info.base !== need.mix.base) return false;
    return (need.mix.effects || []).every(e => info.effects.includes(e));
  }
  if (need.crop) {
    if (info.kind !== 'crop') return false;
    const c = getCrop(info.cropId);
    if (need.crop.hybrid && !(c.hybrid || c.legendary)) return false;
    if (need.crop.legendary && !c.legendary) return false;
    if (need.crop.rare && !need.crop.rare.every(r => c.traits.rare.includes(r))) return false;
    return true;
  }
  return false;
}

/** How many of a need the player currently has. */
export function haveCount(need) {
  if (need.clue) return G.state.disc.clues[need.clue] ? 1 : 0;
  return Object.entries(G.state.inv).filter(([k, n]) => n > 0 && itemSatisfies(k, need)).reduce((s, [, n]) => s + n, 0);
}

export const needQty = (need) => need.qty || 1;
export const canFulfill = (needs) => needs.every(n => haveCount(n) >= needQty(n));

/** Remove the needed items (clues are kept). Prefers the least valuable matches. */
export function consumeNeeds(needs) {
  if (!canFulfill(needs)) return false;
  for (const need of needs) {
    if (need.clue) continue;
    let left = needQty(need);
    const keys = Object.keys(G.state.inv).filter(k => G.state.inv[k] > 0 && itemSatisfies(k, need))
      .sort((a, b) => (itemInfo(a).value || 0) - (itemInfo(b).value || 0));
    for (const k of keys) {
      const take = Math.min(left, G.state.inv[k]);
      removeItem(k, take); left -= take;
      if (!left) break;
    }
  }
  return true;
}

/** Human-readable text for a need. */
export function needText(need) {
  const q = needQty(need);
  if (need.clue) return `Know the clue "${DATA.CLUES[need.clue].title}"`;
  if (need.item) return `${q} × ${itemInfo(need.item).name}`;
  if (need.tag) return `${q} × any ${need.tag}`;
  if (need.kind) return `${q} × any ${need.kind}`;
  if (need.mix) {
    const base = need.mix.base ? DATA.BASES[need.mix.base].name : 'mix';
    const fx = (need.mix.effects || []).map(e => DATA.EFFECTS[e].name).join(' + ');
    return `${q} × ${base} with ${fx}`;
  }
  if (need.crop) {
    if (need.crop.rare) return `${q} × crop with ${need.crop.rare.map(r => DATA.RARE_TRAITS[r].name).join(' + ')} trait`;
    if (need.crop.legendary) return `${q} × legendary crop`;
    if (need.crop.hybrid) return `${q} × hybrid crop`;
    return `${q} × crop`;
  }
  return '?';
}
