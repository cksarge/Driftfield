// =============================================================
//  MAIN — boots the game, wires systems together, runs the loop.
// =============================================================

import { G } from './state.js';
import { DATA } from '../data/index.js';
import { on } from './events.js';
import { loadSettings, loadSlot, saveGame, touchSlot } from './save.js';
import { tickClock } from './time.js';
import { runNight, initDay } from './day.js';
import { updateAnimals } from './animals.js';
import { trackCropDiscovery } from './farming.js';
import { initStory } from './story.js';
import { startTutorial, startMainGame, skipTutorial, updateStorm, initTips } from './tutorial.js';
import { todayFestival } from './festivals.js';
import { getCrop, itemInfo } from './items.js';
import { discover } from './state.js';
import { initRender, render, centerCamera, triggerVisual } from './render.js';
import { initInput } from './input.js';
import { chooseSeed, chooseFert, choosePaint } from './interact.js';
import { audio } from './audio.js';
import { $, toast, showDialog, updateHUD, updateToolbar, closeAllPanels, setObjective, highlight } from './ui/ui.js';
import { openBag } from './ui/bag.js';
import { openMixer } from './ui/mixpanel.js';
import { openCraft } from './ui/craftpanel.js';
import { openBuild } from './ui/buildpanel.js';
import { openTrade } from './ui/tradepanel.js';
import { openExplore } from './ui/explorepanel.js';
import { openJournal } from './ui/journal.js';
import { showTitle, hideTitle, openSettings, openFestival, hooks } from './ui/menus.js';

// ---------------- boot ----------------
loadSettings();
const canvas = $('#game');
initRender(canvas);
initInput(canvas);
initStory();
initDay();
initTips();
wireButtons();
wireEvents();
showTitle();
requestAnimationFrame(loop);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => { /* offline install optional */ }));
}

// ---------------- starting & loading ----------------
hooks.newGame = (slot, name, skip) => {
  hideTitle();
  closeAllPanels();
  if (skip) {
    startMainGame(slot, name);
    G.rt.whiteHold = false;
    showDialog('wendell', [DATA.WAKE_LINES[2].replace(/^Wendell: /, ''), DATA.WAKE_LINES[4].replace(/^Wendell: /, ''), DATA.WAKE_LINES[5].replace(/^Wendell: /, '')],
      () => setObjective('Till soil with the Hoe, plant a seed, then water it.'));
    audio.setMood('calm');
  } else {
    startTutorial(slot, name);
  }
  centerCamera();
  G.rt.running = true;
};
hooks.loadGame = (slot) => {
  const s = loadSlot(slot);
  if (!s) { toast('Could not load that save.', 'warn'); return; }
  hideTitle(); closeAllPanels();
  G.state = s;
  G.rt.storm = null; G.rt.whiteHold = false; G.rt.placing = null; G.rt.tool = 'hand';
  touchSlot(); saveGame();
  centerCamera();
  audio.setMood('calm');
  G.rt.running = true;
  setObjective(''); highlight(null);
  toast(`Welcome back to ${s.farmName}!`);
};
hooks.toTitle = () => {
  G.rt.running = false;
  closeAllPanels(); setObjective(''); highlight(null);
  G.state = null;
  showTitle();
};
hooks.sleep = () => sleep(false);

// ---------------- the night ----------------
let sleeping = false;
function sleep(passedOut) {
  if (sleeping || !G.state || G.state.phase !== 'main') return;
  if (!passedOut && G.state.time.min < 17 * 60) {
    toast('It\'s too early to sleep! (After 5 pm.)');
    return;
  }
  sleeping = true;
  closeAllPanels();
  const fade = $('#fade');
  fade.classList.add('on');
  setTimeout(() => {
    runNight();
    fade.classList.remove('on');
    sleeping = false;
    if (passedOut) showDialog('wendell', ['You dozed off under the stars again. That\'s alright. The island kept you safe.']);
  }, 900);
}

// ---------------- main loop ----------------
let last = performance.now(), hudTimer = 0, t = 0;
function loop(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now; t += dt;
  const s = G.state;
  if (s && G.rt.running) {
    if (!G.rt.paused && s.phase === 'main' && !sleeping) {
      if (tickClock(dt)) sleep(true);
    }
    if (G.rt.storm) updateStorm(dt);
    document.body.classList.toggle('cinematic', !!(G.rt.storm || G.rt.whiteHold));
    if (s.phase === 'tutorial' && G.rt.tutDarkTarget !== undefined && !G.rt.storm) G.rt.tutDark += ((G.rt.tutDarkTarget || 0) - G.rt.tutDark) * Math.min(1, dt * 0.5);
    updateAnimals(dt);
    movePlayer(dt);
    if (G.rt.thunderSoon > 0) { G.rt.thunderSoon -= dt; if (G.rt.thunderSoon <= 0) audio.thunder(false); }
    hudTimer -= dt;
    if (hudTimer <= 0) { hudTimer = 0.25; updateHUD(); updateFestivalButton(); }
    audio.update(G.rt.storm ? 'storm' : s.weather.today);
  }
  if (s) render(dt, t);
  requestAnimationFrame(loop);
}

function movePlayer(dt) {
  const p = G.state.player, tg = G.rt.playerTarget;
  G.rt.playerMoving = false;
  if (!tg) return;
  const dx = tg.x - p.x, dy = tg.y - p.y, d = Math.hypot(dx, dy);
  if (d < 0.05) { G.rt.playerTarget = null; return; }
  const sp = Math.min(d, dt * 4.5);
  p.x += dx / d * sp; p.y += dy / d * sp;
  G.rt.playerMoving = true;
}

function updateFestivalButton() {
  const f = G.state.phase === 'main' ? todayFestival() : null;
  const b = $('#btn-festival');
  b.hidden = !f;
  if (f) b.title = DATA.FESTIVALS[f].name;
}

// ---------------- buttons ----------------
function wireButtons() {
  const tools = ['hand', 'hoe', 'water', 'seed', 'fert', 'paint'];
  tools.forEach(tl => $('#tool-' + tl).addEventListener('click', () => {
    audio.unlock(); audio.sfx('click');
    G.rt.placing = null;
    if (tl === 'seed' && (G.rt.tool === 'seed' || !G.rt.seed)) { chooseSeed(); return; }
    if (tl === 'fert' && (G.rt.tool === 'fert' || !G.rt.fert)) { chooseFert(); return; }
    if (tl === 'paint' && (G.rt.tool === 'paint' || !G.rt.paintKey)) { choosePaint(); return; }
    G.rt.tool = tl; updateToolbar();
  }));
  const btn = (id, fn) => $('#' + id).addEventListener('click', () => { audio.unlock(); if (G.state) fn(); });
  btn('btn-bag', () => openBag());
  btn('btn-mix', () => openMixer());
  btn('btn-craft', () => openCraft());
  btn('btn-build', () => openBuild());
  btn('btn-trade', () => openTrade());
  btn('btn-explore', () => openExplore());
  btn('btn-map', () => openJournal('map'));
  btn('btn-journal', () => openJournal());
  btn('btn-sleep', () => sleep(false));
  btn('btn-festival', () => openFestival());
  btn('btn-menu', () => openSettings(false));
  btn('btn-skip', () => skipTutorial());
  $('#btn-mute').addEventListener('click', () => {
    audio.unlock();
    G.settings.muted = !G.settings.muted; audio.applyVolume();
    $('#btn-mute').textContent = G.settings.muted ? '🔇' : '🔊';
  });
  $('#btn-mute').textContent = G.settings.muted ? '🔇' : '🔊';
  $('#mode-cancel').addEventListener('click', () => { G.rt.placing = null; G.rt.tool = 'hand'; updateToolbar(); });
  $('#mode-rotate').addEventListener('click', () => { if (G.rt.placing) G.rt.placing.rot = (G.rt.placing.rot + 1) % 4; });
  $('#dialog').addEventListener('click', () => import('./ui/ui.js').then(m => m.advanceDialog()));
  document.addEventListener('visibilitychange', () => { if (document.hidden) saveGame(); });
  window.addEventListener('pagehide', () => saveGame());
}

// ---------------- reacting to game events ----------------
function wireEvents() {
  const loud = () => G.state && G.state.phase === 'main' && !G.rt.quiet;
  const CAT = { crops: 'Seed Almanac', mixes: 'Mix Journal', effects: 'New effect', animals: 'Animal', islands: 'Island', characters: 'New friend', recipes: 'Recipe', zones: 'Zone', secrets: 'Secret', decor: 'Decoration' };
  on('discovered', ({ category, label }) => {
    if (!loud() || category === 'clues' || category === 'pieces') return;
    toast(`✨ ${CAT[category] || 'Discovery'}: ${label}`, 'discover');
    if (category !== 'effects') audio.sfx('discover');
  });
  on('item:added', ({ key }) => {
    trackCropDiscovery(key);
    if (key.startsWith('deco:')) discover('decor', key.slice(5), DATA.DECOR[key.slice(5)].name);
  });
  on('object:placed', (o) => { if (o.type === 'deco') discover('decor', o.ref, DATA.DECOR[o.ref].name); });
  on('recipe:learned', (id) => { if (loud()) { const r = DATA.RECIPES[id]; toast(`📜 Recipe learned: ${itemInfo(Object.keys(r.output)[0]).name}`); } });
  on('blueprint:unlocked', (id) => { discover('blueprints', id, DATA.BUILDINGS[id].name); if (loud()) toast(`📐 Blueprint: ${DATA.BUILDINGS[id].name}! Build it from the Build menu.`); });
  on('clue:new', ({ clue }) => { if (loud()) { audio.chime(); showDialog('wendell', [`A clue! "${clue.title}". I've put it in the Journal under Beacon.`]); } });
  on('truth', () => showDialog('wendell', ['Wait. Put the clues together…', DATA.TRUTH, 'Let\'s finish the Beacon. For everyone.']));
  on('legendary', (id) => { const c = getCrop(id); toast(`🌟 LEGENDARY: ${c.name}!`, 'discover'); audio.chime(); });
  on('birds', () => { if (loud()) toast('🐦 Sky birds pecked a ripe crop! A scarecrow keeps them away.'); });
  on('animal:born', ({ animal }) => {
    if (!loud()) return;
    toast(`🍼 A baby ${DATA.ANIMALS[animal.species].name} was born: ${animal.name}!`, 'discover');
    if (animal.newTrait) toast(`✨ ${animal.name} has a brand-new trait: ${DATA.ANIMAL_TRAITS[animal.newTrait].name}!`, 'discover');
  });
  on('trader:arrived', ({ id }) => { if (loud()) toast(`🎈 ${DATA.TRADERS[id].ship} has docked!`); });
  on('delivery:new', (d) => { if (loud()) toast(`📦 New delivery request: "${d.text}"`); });
  on('delivery:expired', (d) => { if (loud()) toast(`The ${DATA.TRADERS[d.trader].ship} left without their delivery. Maybe next time.`); });
  on('zone:entered', ({ to }) => { if (loud()) { toast(`🧭 Drifted into ${DATA.ZONES[to].name}`); } });
  on('game:started', () => centerCamera());
  on('windmill:fixed', () => discover('secrets', 'windmill', 'The windmill turns again'));
  on('piece:found', ({ piece }) => { if (loud()) toast(`💛 Recovered: ${piece.name}`, 'discover'); });
  on('quest:done', () => { /* toast handled by the panel */ });
  on('event', ({ def }) => {
    if (!loud()) return;
    if (def.visual) triggerVisual(def.visual);
    setTimeout(() => showDialog('wendell', [def.text]), 600);
  });
  on('day:start', ({ festival }) => {
    if (!loud()) return;
    const s = G.state;
    toast(`☀️ ${['Spring', 'Summer', 'Autumn', 'Winter'][s.time.season]} ${s.time.day}: ${DATA.WEATHER[s.weather.today].name} in ${DATA.ZONES[s.nav.zone].name}`);
    if (festival) setTimeout(() => showDialog('wendell', [`It's the ${DATA.FESTIVALS[festival].name} today! Tap the 🎉 button to join in.`]), 900);
    audio.setMood(s.story.lit ? 'happy' : 'calm');
  });
  on('beacon:lit', () => {
    G.state.story.ended = true;
    audio.setMood('happy');
    G.rt.flash = 0.8;
    showDialog('wendell', [...DATA.ENDING, 'Endless mode: the sky goes on forever, and so do your discoveries.']);
  });
  on('chapter2:start', () => setTimeout(() => showDialog('wendell', DATA.CHAPTER_TWO.hint), 1200));
  on('epilogue', () => { audio.chime(); G.rt.flash = 0.5; setTimeout(() => showDialog('wendell', [...DATA.EPILOGUE, 'The sky is yours. Keep growing, keep mixing, keep drifting.']), 400); });
  on('harvest', () => { /* sounds handled by interact */ });
  on('drink', ({ effects }) => { if (effects.includes('floaty')) toast('You feel light as a feather. Glide range +2 today!'); });
  on('hour', (h) => {
    if (!G.state || G.state.phase !== 'main') return;
    if (h === 20) audio.setMood('night');
    if (h === 7) audio.setMood(G.state.story.lit ? 'happy' : 'calm');
    if (h === 19 && todayFestival() === 'starfall') toast('⭐ Stars are falling! Tap them to catch them!');
    if (h === 0) toast('It\'s getting very late. Sleep from the 😴 button.');
  });
}
