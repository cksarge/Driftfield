// =============================================================
//  TIME & CALENDAR — in-game time only, never the real clock.
//
//  At speed 1, one real second = 4 in-game minutes, so a full day
//  (6:00 → 2:00) takes a little over 5 real minutes.
//  time.min is minutes since midnight of the current day; it runs
//  past 24:00 up to 26:00 (2 a.m.), when you fall asleep anyway.
// =============================================================

import { G } from './state.js';
import { SEASONS, DAYS_PER_SEASON } from '../data/index.js';
import { emit } from './events.js';

export const GAME_MIN_PER_SEC = 4;
export const DAY_START = 6 * 60;
export const DAY_END = 26 * 60;

export const hour = () => Math.floor(G.state.time.min / 60) % 24;
export const absMinutes = () => G.state.time.total * 1440 + G.state.time.min;
export const seasonName = (i = G.state.time.season) => SEASONS[i];

/** 0 = full day, 1 = full night. Smooth dawn and dusk. */
export function nightAmount(min = G.state.time.min) {
  const h = (min / 60) % 24;
  if (h >= 6.5 && h < 18) return 0;
  if (h >= 18 && h < 21) return (h - 18) / 3;   // dusk
  if (h >= 21 || h < 4.5) return 1;
  return 1 - (h - 4.5) / 2;                      // 4:30–6:30 dawn
}
export const isNight = () => nightAmount() > 0.6;

export function clockText() {
  const m = G.state.time.min % 1440;
  let h = Math.floor(m / 60), mm = Math.floor(m % 60 / 10) * 10;
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}:${String(mm).padStart(2, '0')} ${ampm}`;
}
export function dateText() {
  const t = G.state.time;
  return `${SEASONS[t.season]} ${t.day}, Year ${t.year}`;
}

let lastHour = -1;
/**
 * Advance the clock by dt real seconds. Returns true when the day is over
 * (the caller then runs the night/new-day sequence in js/day.js).
 */
export function tickClock(dt) {
  const t = G.state.time;
  t.min += dt * GAME_MIN_PER_SEC * G.settings.speed;
  const h = hour();
  if (h !== lastHour) { lastHour = h; emit('hour', h); }
  return t.min >= DAY_END;
}

/** Move the calendar to the next morning. */
export function advanceCalendar() {
  const t = G.state.time;
  t.min = DAY_START;
  t.total += 1;
  t.day += 1;
  if (t.day > DAYS_PER_SEASON) {
    t.day = 1; t.season += 1;
    if (t.season > 3) { t.season = 0; t.year += 1; }
    emit('season', t.season);
  }
}
