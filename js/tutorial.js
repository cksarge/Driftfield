// =============================================================
//  TUTORIAL — The Perfect Island, the storm, and waking up.
//
//  1. buildPerfectIsland() creates a huge, maxed-out island
//     (never saved).
//  2. Wendell walks you through one task per system (data/tutorial.js).
//     Each completed step darkens the sky a little more.
//  3. The storm cinematic tears the island apart (drawn by render.js
//     using G.rt.storm), then fades to white.
//  4. startMainGame() creates the real save: a tiny rock, a seed pouch,
//     a broken windmill, and Wendell.
// =============================================================

import { G, blankState, discover } from './state.js';
import { DATA } from '../data/index.js';
import { tkey, newTile, addObject, stampShape, bounds, isLand, objectAt } from './island.js';
import { spawnAnimal } from './animals.js';
import { addItem, registerItem } from './items.js';
import { dockTrader } from './trading.js';
import { spawnPassingIsland } from './exploration.js';
import { rollWeather } from './navigation.js';
import { saveGame, touchSlot } from './save.js';
import { on, emit } from './events.js';
import { showDialog, toast, closeAllPanels, setObjective, highlight } from './ui/ui.js';
import { audio } from './audio.js';
import { rand } from './utils.js';

// ---------------- the Perfect Island ----------------
export function buildPerfectIsland(slot, farmName) {
  const s = blankState(slot, farmName);
  G.state = s;
  s.phase = 'tutorial';
  s.time.min = 10 * 60;
  s.coins = 500;

  // A big, round island.
  for (let x = 0; x < 24; x++) for (let y = 0; y < 16; y++) {
    const dx = (x - 11.5) / 12.5, dy = (y - 7.5) / 8.5;
    if (dx * dx + dy * dy <= 1.05) s.tiles[tkey(x, y)] = newTile();
  }
  const B = (ref, x, y, extra) => { ensureLand(ref, x, y); return addObject('building', ref, x, y, extra); };
  const D = (ref, x, y) => { if (!objectAt(x, y)) { ensureLand(null, x, y); addObject('deco', ref, x, y); } };

  B('house', 10, 1); B('mill', 6, 1); B('workshop', 13, 1);
  B('windmill', 3, 3); B('barn', 16, 2); B('coop', 20, 5);
  B('beehive', 8, 5, { data: { bees: true, timer: 0 } }); B('beehive', 15, 5, { data: { bees: true, timer: 0 } });
  B('mixing_station', 9, 4); B('weather_vane', 11, 4); B('workbench', 12, 4);
  B('greenhouse', 2, 9); B('dock', 21, 8); B('market_stall', 18, 11);
  B('sprinkler', 7, 9); B('sprinkler', 14, 9); B('scarecrow', 11, 12);
  B('sails', 1, 6); B('rudder', 1, 8); B('flagpole', 12, 0);
  B('balloon', 19, 13); B('counterweight', 4, 13);
  for (let y = 5; y <= 11; y++) D('stone_path', 11, y);
  [[9, 3], [14, 4], [6, 12], [17, 10]].forEach(([x, y]) => D('lantern', x, y));
  D('flower_bed', 8, 13); D('flower_bed', 15, 13); D('bench', 10, 13); D('wind_chime', 13, 13);
  D('kite', 20, 3); D('fence', 19, 9); D('fence', 19, 10); D('star_lamp', 5, 6);

  // Fields full of ripe crops.
  const field = (x0, x1, y0, y1, pickCrop) => {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
      if (objectAt(x, y) || !isLand(x, y)) continue;
      const t = s.tiles[tkey(x, y)];
      t.soil = 1; t.wet = true; t.q = 2;
      const id = pickCrop(x, y);
      t.crop = { id, age: 9, ripe: true, poll: null, fert: null, dormant: false };
    }
  };
  field(6, 9, 7, 11, (x, y) => (y <= 8 ? 'sky_wheat' : y === 9 ? 'drift_carrot' : 'honey_blossom'));
  field(13, 16, 7, 11, (x, y) => (y <= 8 ? 'sunfruit' : y === 9 ? 'dawn_tomato' : 'tea_bush'));
  field(2, 4, 11, 12, () => 'moon_melon');
  // The sparkling, cross-pollinated crop used in the breeding step.
  s.tiles[tkey(15, 9)].crop.poll = 'sunfruit';
  s.tutorial.sparkle = [15, 9];

  // Animals.
  [[17, 6], [18, 7], [16, 6]].forEach(([x, y], i) => spawnAnimal('cloud_sheep', x, y, { name: ['Bramble', 'Nimbus', 'Puff'][i], pattern: i === 2 ? 'curly' : 'plain' }));
  [[19, 7], [20, 7]].forEach(([x, y]) => spawnAnimal('float_goat', x, y));
  [[21, 6], [20, 6], [18, 9]].forEach(([x, y]) => spawnAnimal('puff_hen', x, y));
  spawnAnimal('breeze_pup', 12, 6, { name: 'Biscuit' });

  // A well-stocked bag.
  const bag = { jar: 10, wood: 30, stone: 20, fiber: 20, rope: 6, plank: 6, compost: 4, ember_coal: 3, cloud_puff: 3,
    moon_dew: 2, sky_salt: 2, sunstone: 1, 'crop:sunfruit': 4, 'crop:frost_berry': 3, 'crop:storm_pepper': 2,
    'crop:tea_bush': 4, 'crop:mist_mint': 3, 'crop:honey_blossom': 3, 'deco:lantern': 3, 'deco:flower_bed': 1,
    'seed:sky_wheat': 6, 'seed:sunfruit': 3, cloud_silk: 2, sky_crystal: 2, feather: 3 };
  Object.entries(bag).forEach(([k, n]) => addItem(k, n, true));
  addItem(registerItem({ id: 'tut_dye', kind: 'dye', name: 'Sunset Dye', base: 'dye', effects: ['warm', 'sweet'], color: '#f4956a', value: 12, tags: ['dye'], icon: { shape: 'dye', color: '#f4956a' } }), 2, true);

  s.blueprints = { greenhouse: true, sails: true, rudder: true, lightning_rod: true };
  s.windmillFixed = true;
  s.tools = { hoe: 3, can: 3 };
  s.glider.level = 3;
  s.nav = { zone: 'sunny', daysIn: 0, next: 'windy' };
  s.weather = { today: 'clear', forecast: ['clear', 'wind', 'storm'] };
  const b = bounds();
  s.player.x = b.cx; s.player.y = b.cy + 1;

  dockTrader('marigold', 24);
  spawnPassingIsland('pebblenook', 0).leave += 48 * 60;
  return s;
}

function ensureLand(ref, x, y) {
  const [w, h] = ref ? DATA.BUILDINGS[ref].size : [1, 1];
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) if (!isLand(x + i, y + j)) G.state.tiles[tkey(x + i, y + j)] = newTile();
}

// ---------------- running the steps ----------------
export const tutorialDarkness = () => (G.state && G.state.phase === 'tutorial') ? (G.rt.tutDark || 0) : 0;
let unsub = null;

export function startTutorial(slot, farmName) {
  G.rt.quiet = true;
  buildPerfectIsland(slot, farmName);
  G.rt.quiet = false;
  G.rt.tutDark = 0;
  G.rt.beaconOverride = 1;
  audio.setMood('happy');
  runStep(0);
}

function runStep(i) {
  const steps = DATA.TUTORIAL_STEPS;
  G.state.tutorial.step = i;
  if (i >= steps.length) { setObjective(''); highlight(null); startStorm(); return; }
  const st = steps[i];
  // Make sure the step can actually be done.
  if (st.id === 'breed') ensureSparkle();
  if (st.id === 'glide' && !G.state.nearby.length) spawnPassingIsland('pebblenook', 0);
  if (st.id === 'trade' && !G.state.trader) dockTrader('marigold', 24);
  G.rt.tutDarkTarget = st.dark;
  if (st.dark > 0.5) audio.setMood('uneasy');
  showDialog('wendell', st.say, () => { setObjective(st.task); highlight(st.ui); });
  if (unsub) unsub();
  unsub = on(st.event, () => {
    if (G.state.phase !== 'tutorial' || G.state.tutorial.step !== i) return;
    unsub(); unsub = null;
    highlight(null);
    toast('✓ ' + st.task.split('(')[0].trim());
    setTimeout(() => runStep(i + 1), 900);
  });
}

function ensureSparkle() {
  const s = G.state;
  const [x, y] = s.tutorial.sparkle;
  const t = s.tiles[tkey(x, y)];
  if (!t) return;
  t.soil = 1;
  if (objectAt(x, y)) return;
  t.crop = { id: 'dawn_tomato', age: 9, ripe: true, poll: 'sunfruit', fert: null, dormant: false };
}

/** Skip straight to waking up on the rock. */
export function skipTutorial() {
  if (unsub) { unsub(); unsub = null; }
  closeAllPanels();
  setObjective(''); highlight(null);
  const { slot, farmName } = G.state;
  wakeUp(slot, farmName);
}

// ---------------- the storm ----------------
function startStorm() {
  closeAllPanels();
  audio.setMood('storm');
  G.state.weather.today = 'storm';
  // Every 4×4 block of land becomes a fragment that flies off on its own path.
  const frags = {};
  const b = bounds();
  for (const k of Object.keys(G.state.tiles)) {
    const [x, y] = k.split(',').map(Number);
    const id = Math.floor(x / 4) + ',' + Math.floor(y / 4);
    if (!frags[id]) {
      const cx = Math.floor(x / 4) * 4 + 2 - b.cx, cy = Math.floor(y / 4) * 4 + 2 - b.cy;
      const d = Math.hypot(cx, cy) || 1;
      frags[id] = { vx: cx / d * rand(2, 5), vy: cy / d * rand(2, 5) - rand(0, 2), spin: rand(-0.6, 0.6), delay: rand(0, 1.5) };
    }
  }
  G.rt.storm = { t: 0, frags, struck: false, white: 0 };
  showDialog('wendell', DATA.STORM_LINES.map(l => l.replace(/^Wendell: /, '')), null, { auto: 1700 });
}

/** Called every frame by the game loop while the storm plays. */
export function updateStorm(dt) {
  const st = G.rt.storm;
  if (!st) return;
  st.t += dt;
  G.rt.tutDark = Math.min(1, G.rt.tutDark + dt * 0.1);
  if (st.t > 3 && st.t < 5) G.rt.beaconOverride = Math.random() < 0.5 ? 1 : 0.2;
  if (st.t >= 5.2 && !st.struck) {
    st.struck = true; G.rt.beaconOverride = 0;
    G.rt.flash = 1; audio.thunder(true);
    st.breakAt = st.t + 0.6;
  }
  if (st.t > 9) st.white = Math.min(1, (st.t - 9) / 2.2);
  if (st.t > 11.6 && !st.done) {
    st.done = true;
    const { slot, farmName } = G.state;
    wakeUp(slot, farmName);
  }
}

/** Offset of a land fragment during the storm (used by render.js). */
export function fragmentOffset(x, y) {
  const st = G.rt.storm;
  if (!st || !st.breakAt || st.t < st.breakAt) return null;
  const f = st.frags[Math.floor(x / 4) + ',' + Math.floor(y / 4)];
  if (!f) return null;
  const t = Math.max(0, st.t - st.breakAt - f.delay);
  return { dx: f.vx * t * t * 0.6, dy: f.vy * t * t * 0.6 + t * 0.4, rot: f.spin * t * t * 0.3 };
}

// ---------------- waking up ----------------
function wakeUp(slot, farmName) {
  audio.setMood('quiet');
  G.rt.whiteHold = true;
  startMainGame(slot, farmName);
  showDialog('wendell', DATA.WAKE_LINES.map(l => l.replace(/^Wendell: /, '')), () => {
    G.rt.whiteHold = false;
    audio.setMood('calm');
    setObjective('Till soil with the Hoe, plant a seed, then water it.');
  }, { onLine: (i) => { if (i === 1) G.rt.whiteFade = true; } });
}

/** Create the real game: one small rock, a seed pouch, a broken windmill. */
export function startMainGame(slot, farmName) {
  G.rt.storm = null; G.rt.tutDark = 0; G.rt.beaconOverride = null; G.rt.flash = 0;
  G.rt.quiet = true;                       // no discovery pop-ups while setting up
  const s = blankState(slot, farmName);
  G.state = s;
  s.phase = 'main';
  stampShape(DATA.START_ROCK, 0, 0);
  addObject('building', 'windmill', 1, 0, { broken: true });
  Object.entries({
    'seed:sunfruit': 4, 'seed:honey_blossom': 4, 'seed:dawn_tomato': 3, 'seed:drift_carrot': 4, 'seed:sky_wheat': 3,
    wood: 8, stone: 6, fiber: 6, jar: 3, compost: 2, 'bld:workbench': 1, 'land:pebble': 2,
  }).forEach(([k, n]) => addItem(k, n, true));
  s.coins = 60;
  s.nav = { zone: 'sunny', daysIn: 0, next: 'windy' };
  s.weather = { today: 'clear', forecast: [rollWeather('sunny'), rollWeather('sunny'), rollWeather('windy')] };
  const b = bounds();
  s.player.x = b.cx; s.player.y = b.cy + 0.5;
  discover('zones', 'sunny', DATA.ZONES.sunny.name);
  discover('characters', 'wendell', 'Wendell');
  ['sunfruit', 'honey_blossom', 'dawn_tomato', 'drift_carrot', 'sky_wheat'].forEach(c => discover('crops', c, DATA.CROPS[c].name));
  spawnPassingIsland('pebblenook', 2);
  G.rt.tool = 'hoe';
  touchSlot();
  saveGame();
  G.rt.quiet = false;
  emit('game:started');
}

/** Gentle early-game tips from Wendell. */
export function initTips() {
  on('day:start', () => {
    const s = G.state;
    if (!G.settings.hints) return;
    const tip = DATA.EARLY_TIPS.find(t => t.when === 'day:' + s.time.total && !s.tipsShown[t.when]);
    if (tip) { s.tipsShown[tip.when] = true; setTimeout(() => showDialog('wendell', [tip.text]), 1200); }
  });
  on('piece:found', ({ piece }) => { if (G.state.phase === 'main') audio.chime(); });
}
