// =============================================================
//  NAVIGATION & WEATHER — drifting through zones, steering,
//  and rolling the daily weather.
//
//  The island drifts along a loop of zones (each zone's `next`).
//  Rare zones can sweep you up by chance (`rareFrom`). With a
//  Rudder you pick the next zone yourself from its `neighbors`.
//  Sails make you drift 50% faster.
// =============================================================

import { G, discover } from './state.js';
import { DATA } from '../data/index.js';
import { hasBuilding } from './island.js';
import { weightedPick, chance } from './utils.js';
import { emit } from './events.js';

export const zone = () => DATA.ZONES[G.state.nav.zone];
export const driftSpeed = () => (hasBuilding('sails') ? 1.5 : 1);
export const canSteer = () => hasBuilding('rudder');

/** Is a zone reachable this season? */
export function zoneOpen(id, season = G.state.time.season) {
  const z = DATA.ZONES[id];
  return !z.seasons || z.seasons.includes(season);
}

/** Choose the default next zone after `fromId` (including lucky rare zones). */
export function rollNext(fromId) {
  for (const [id, z] of Object.entries(DATA.ZONES)) {
    if (z.rare && z.rareFrom && z.rareFrom[fromId] && zoneOpen(id) && chance(z.rareFrom[fromId])) return id;
  }
  return DATA.ZONES[fromId].next;
}

/** Steer toward a neighbouring zone (needs a rudder, or during the tutorial). */
export function steer(id) {
  const nav = G.state.nav;
  if (!canSteer() && G.state.phase !== 'tutorial') return 'You need a Rudder to steer.';
  if (!zone().neighbors.includes(id)) return 'Too far to steer there from here.';
  if (!zoneOpen(id)) return `${DATA.ZONES[id].name} can't be reached this season.`;
  nav.next = id;
  nav.steered = true;
  emit('nav:steer', { id });
  return '';
}

/** Days left before reaching the next zone. */
export const daysToNext = () => Math.max(0, Math.ceil((zone().days - G.state.nav.daysIn) / driftSpeed()));

/** Called each new day. */
export function driftOvernight() {
  const nav = G.state.nav;
  nav.daysIn += driftSpeed();
  if (nav.daysIn >= zone().days) {
    const prev = nav.zone;
    nav.zone = nav.next;
    nav.daysIn = 0;
    nav.steered = false;
    nav.next = rollNext(nav.zone);
    discover('zones', nav.zone, DATA.ZONES[nav.zone].name);
    // Forecast was rolled for the old zone; refresh it.
    G.state.weather.forecast = [rollWeather(nav.zone), rollWeather(nav.zone), rollWeather(nav.next)];
    emit('zone:entered', { from: prev, to: nav.zone });
  }
}

// ---------------- weather ----------------
export function rollWeather(zoneId, season = G.state.time.season) {
  const w = { ...DATA.ZONES[zoneId].weather };
  if (season === 3 && DATA.ZONES[zoneId].climate !== 'warm') w.snow = (w.snow || 0) + 2;
  if (season === 1) w.clear = (w.clear || 0) + 1;
  if (season === 2) w.wind = (w.wind || 0) + 1;
  if (season === 0) w.rain = (w.rain || 0) + 1;
  return weightedPick(w) || 'clear';
}

/** Today's weather comes from the forecast; a new day joins the end. */
export function weatherOvernight() {
  const wz = G.state.weather;
  const nextZone = daysToNext() <= 3 ? G.state.nav.next : G.state.nav.zone;
  wz.today = wz.forecast.shift() || rollWeather(G.state.nav.zone);
  // The forecast must make sense for the zone we're in now.
  const zw = DATA.ZONES[G.state.nav.zone].weather;
  if (!zw[wz.today] && !(wz.today === 'snow' && G.state.time.season === 3)) wz.today = rollWeather(G.state.nav.zone);
  wz.forecast.push(rollWeather(nextZone));
  while (wz.forecast.length < 3) wz.forecast.push(rollWeather(nextZone));
  emit('weather', wz.today);
}
