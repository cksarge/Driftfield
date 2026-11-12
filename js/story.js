// =============================================================
//  STORY — repairing the Great Sky Beacon and solving the mystery.
// =============================================================

import { G, discover } from './state.js';
import { DATA } from '../data/index.js';
import { canFulfill, consumeNeeds } from './needs.js';
import { on, emit } from './events.js';

export const beaconStage = () => G.state.story.stage;
export const beaconDone = () => G.state.story.stage >= DATA.BEACON_STAGES.length;
export const currentStage = () => DATA.BEACON_STAGES[G.state.story.stage] || null;

/** Try to complete the current Beacon stage. */
export function repairBeacon() {
  const st = currentStage();
  if (!st || !canFulfill(st.needs)) return false;
  consumeNeeds(st.needs);
  G.state.story.stage++;
  emit('beacon:stage', { stage: G.state.story.stage, say: st.say });
  if (beaconDone()) {
    G.state.story.lit = true;
    emit('beacon:lit');
  }
  return true;
}

/** Brightness of the distant Beacon (0 dark … 1 blazing). */
export function beaconGlow() {
  const s = G.state;
  if (!s) return 0;
  if (s.phase === 'tutorial') return G.rt.beaconOverride ?? 1;
  if (s.story.lit) return 1;
  return s.story.stage * 0.08;      // faint glimmers as you repair it
}

export const coreClues = () => Object.entries(DATA.CLUES).filter(([, c]) => c.core).map(([id]) => id);
export const truthKnown = () => coreClues().every(id => G.state.disc.clues[id]);

/** Wire story listeners (called once at boot). */
export function initStory() {
  on('clue:found', (id) => {
    const c = DATA.CLUES[id];
    if (!c) return;
    if (discover('clues', id, c.title)) {
      emit('clue:new', { id, clue: c });
      if (truthKnown() && !G.state.story.truthShown) {
        G.state.story.truthShown = true;
        emit('truth');
      }
    }
  });
}
