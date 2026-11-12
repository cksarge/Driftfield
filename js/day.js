// =============================================================
//  THE NIGHT — everything that happens between one day and the next.
//  Order matters: crops grow on yesterday's water, then the calendar
//  moves, the island drifts, new weather arrives and waters crops,
//  and finally traders, islands and surprises show up.
// =============================================================

import { G } from './state.js';
import { DATA } from '../data/index.js';
import { advanceCalendar } from './time.js';
import { growOvernight, morningWater } from './farming.js';
import { animalsOvernight } from './animals.js';
import { buildingsOvernight } from './buildings.js';
import { driftOvernight, weatherOvernight } from './navigation.js';
import { tradersOvernight, demandOvernight, deliveriesOvernight } from './trading.js';
import { islandsOvernight } from './exploration.js';
import { todayFestival } from './festivals.js';
import { giveKey } from './items.js';
import { discover } from './state.js';
import { chance } from './utils.js';
import { saveGame } from './save.js';
import { on, emit } from './events.js';

export function runNight() {
  const s = G.state;
  growOvernight();
  animalsOvernight();
  buildingsOvernight();
  advanceCalendar();
  driftOvernight();
  weatherOvernight();
  morningWater();
  demandOvernight();
  deliveriesOvernight();
  tradersOvernight();
  islandsOvernight();
  rollEvent(false);
  const fest = todayFestival();
  // Recover the player gently if they somehow have nothing to plant.
  if (!Object.keys(s.inv).some(k => k.startsWith('seed:')) && s.coins < 10) giveKey('seed:drift_carrot', 3);
  saveGame();
  emit('day:start', { festival: fest });
}

/** Roll for one random event. night = evening events only. */
export function rollEvent(night) {
  const s = G.state;
  s.eventsSeen = s.eventsSeen || {};
  for (const [id, e] of Object.entries(DATA.EVENTS)) {
    if (!!e.night !== night) continue;
    if (e.zones !== '*' && !e.zones.includes(s.nav.zone)) continue;
    if (e.weather && s.weather.today !== e.weather) continue;
    if (e.once && s.eventsSeen[id]) continue;
    if (e.after === 'lit' && !s.story.lit) continue;
    if (!chance(e.chance)) continue;
    s.eventsSeen[id] = (s.eventsSeen[id] || 0) + 1;
    Object.entries(e.give || {}).forEach(([k, n]) => giveKey(k, n));
    if (e.luck) { s.buffs.day = s.time.total; if (!s.buffs.effects.includes('lucky')) s.buffs.effects.push('lucky'); }
    if (e.secret) discover('secrets', 'event:' + id, e.name);
    emit('event', { id, def: e });
    return id;
  }
  return null;
}

/** Evening events fire at 9 pm. */
export function initDay() {
  on('hour', (h) => { if (h === 21 && G.state && G.state.phase === 'main') rollEvent(true); });
}
