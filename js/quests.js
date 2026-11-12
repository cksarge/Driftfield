// =============================================================
//  CHARACTERS & QUESTS — talking, gifts, friendship and requests.
// =============================================================

import { G, discover } from './state.js';
import { DATA } from '../data/index.js';
import { itemInfo, removeItem, count, giveKey, getCrop } from './items.js';
import { canFulfill, consumeNeeds } from './needs.js';
import { pick } from './utils.js';
import { emit } from './events.js';

export function meet(charId) {
  const c = DATA.CHARACTERS[charId];
  const first = discover('characters', charId, c.name);
  return first;
}

/** Something for the character to say right now. */
export function chatter(charId) {
  const c = DATA.CHARACTERS[charId];
  return pick(c.lines);
}

export const friendship = (charId) => G.state.friendship[charId] || 0;

/** The quest this character currently offers (or null). */
export function currentQuest(charId) {
  const c = DATA.CHARACTERS[charId];
  for (const qid of c.quests || []) {
    if (G.state.quests.done[qid]) continue;
    const q = DATA.QUESTS[qid];
    // Quests that depend on clues stay hidden until you know them.
    if (q.needs.some(n => n.clue && !G.state.disc.clues[n.clue])) return null;
    return qid;
  }
  return null;
}

export function acceptQuest(qid) {
  G.state.quests.active[qid] = true;
  emit('quest:accepted', qid);
}

export function turnIn(qid) {
  const q = DATA.QUESTS[qid];
  if (!canFulfill(q.needs)) return false;
  consumeNeeds(q.needs);
  delete G.state.quests.active[qid];
  G.state.quests.done[qid] = true;
  const r = q.reward || {};
  if (r.coins) G.state.coins += r.coins;
  Object.entries(r.items || {}).forEach(([k, n]) => giveKey(k, n));
  (r.unlock || []).forEach(k => giveKey(k, 1));
  if (r.clue) giveKey('clue:' + r.clue);
  G.state.friendship[q.giver] = friendship(q.giver) + 3;
  emit('quest:done', qid);
  return true;
}

/** Give a gift; returns 2 (loved), 1 (liked) or 0 (not accepted). */
export function giveGift(charId, key) {
  if (count(key) < 1) return 0;
  const c = DATA.CHARACTERS[charId];
  const info = itemInfo(key);
  if (!info || ['building', 'land', 'animal'].includes(info.kind)) return 0;
  const L = c.loves || {};
  let loved = false;
  if (L.keys && L.keys.includes(key)) loved = true;
  if (L.kinds && L.kinds.includes(info.kind)) loved = true;
  if (L.effects && (info.effects || []).some(e => L.effects.includes(e))) loved = true;
  if (L.rare && info.cropId && getCrop(info.cropId).traits.rare.some(r => L.rare.includes(r))) loved = true;
  removeItem(key, 1);
  const pts = loved ? 2 : 1;
  G.state.friendship[charId] = friendship(charId) + pts;
  // Friends sometimes give something back.
  if (G.state.friendship[charId] % 6 < pts) {
    giveKey(pick(['old_gear', 'sky_crystal', 'cloud_silk', 'rope', 'moon_dew', 'land:pebble']), 1);
  }
  emit('gift', { charId, key, loved });
  return pts;
}
