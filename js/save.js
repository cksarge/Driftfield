// =============================================================
//  SAVE / LOAD — local save slots, export and import.
//
//  Saves are small JSON blobs (tens of KB), so localStorage is a
//  good fit. Every storage call is wrapped in try/catch: if storage
//  is blocked (private mode, disabled cookies) the game keeps working
//  with an in-memory fallback, and Export Save still works.
// =============================================================

import { G, SAVE_VERSION, blankState } from './state.js';

export const SLOT_COUNT = 3;
const PREFIX = 'driftfield.slot.';
const SETTINGS_KEY = 'driftfield.settings';
const memory = {};            // fallback when localStorage is unavailable
let storageOk = true;

function lsGet(k) {
  try { const v = localStorage.getItem(k); return v === null ? (memory[k] ?? null) : v; }
  catch (e) { storageOk = false; return memory[k] ?? null; }
}
function lsSet(k, v) {
  memory[k] = v;
  try { localStorage.setItem(k, v); return true; } catch (e) { storageOk = false; return false; }
}
function lsDel(k) {
  delete memory[k];
  try { localStorage.removeItem(k); } catch (e) { storageOk = false; }
}

export const storageAvailable = () => storageOk;

/** Save the current game into its slot. */
export function saveGame() {
  const s = G.state;
  if (!s || s.phase === 'tutorial') return false;   // the tutorial island is never saved
  s.savedAt = { day: s.time.total, label: `Year ${s.time.year}, ${['Spring', 'Summer', 'Autumn', 'Winter'][s.time.season]} ${s.time.day}` };
  return lsSet(PREFIX + s.slot, JSON.stringify(s));
}

export function loadSlot(slot) {
  const raw = lsGet(PREFIX + slot);
  if (!raw) return null;
  try { return migrate(JSON.parse(raw)); } catch (e) { console.warn('Bad save in slot', slot, e); return null; }
}

export function deleteSlot(slot) { lsDel(PREFIX + slot); }

/** Short summaries for the title screen. */
export function slotSummaries() {
  const out = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    const s = loadSlot(i);
    out.push(s ? { slot: i, name: s.farmName, label: s.savedAt ? s.savedAt.label : '', coins: s.coins, beacon: s.story.stage, lastPlayed: s.lastPlayed || 0 } : { slot: i, empty: true });
  }
  return out;
}

/** Most recently played slot, for "Continue". */
export function latestSlot() {
  const list = slotSummaries().filter(s => !s.empty).sort((a, b) => b.lastPlayed - a.lastPlayed);
  return list.length ? list[0].slot : null;
}

/** Fill in fields added in later versions so old saves keep working. */
function migrate(s) {
  if (!s || typeof s !== 'object') return null;
  s.version = s.version || 1;
  // Make sure every discovery category exists (older saves may lack new ones).
  const fresh = blankState(s.slot || 0, s.farmName);
  for (const k of Object.keys(fresh.disc)) s.disc[k] = s.disc[k] || {};
  for (const k of Object.keys(fresh)) if (s[k] === undefined) s[k] = fresh[k];
  // (future migrations go here: if (s.version < 2) { ... })
  s.version = SAVE_VERSION;
  return s;
}

// ---------------- export / import ----------------
export function exportSave() {
  const s = G.state;
  if (!s) return;
  saveGame();
  const blob = new Blob([JSON.stringify({ game: 'driftfield', version: SAVE_VERSION, save: s }, null, 0)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `driftfield-${(s.farmName || 'island').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-y${s.time.year}.json`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

/** Export a slot without loading it (title screen). */
export function exportSlot(slot) {
  const s = loadSlot(slot);
  if (!s) return;
  const blob = new Blob([JSON.stringify({ game: 'driftfield', version: SAVE_VERSION, save: s })], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `driftfield-slot${slot + 1}.json`;
  document.body.appendChild(a); a.click(); a.remove();
}

/** Read a save file chosen by the player into `slot`. Resolves to true on success. */
export function importSaveFile(file, slot) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        const s = migrate(data.save || data);
        if (!s || !s.tiles || !s.time) throw new Error('Not a Driftfield save');
        s.slot = slot;
        s.lastPlayed = Date.now();
        lsSet(PREFIX + slot, JSON.stringify(s));
        resolve(true);
      } catch (e) { console.warn(e); resolve(false); }
    };
    reader.onerror = () => resolve(false);
    reader.readAsText(file);
  });
}

// ---------------- settings ----------------
export function loadSettings() {
  try { const raw = lsGet(SETTINGS_KEY); if (raw) Object.assign(G.settings, JSON.parse(raw)); } catch (e) { /* defaults */ }
}
export function saveSettings() { lsSet(SETTINGS_KEY, JSON.stringify(G.settings)); }

/** Mark the slot as most recently played (real time is only used for sorting slots). */
export function touchSlot() { if (G.state) G.state.lastPlayed = Date.now(); }
