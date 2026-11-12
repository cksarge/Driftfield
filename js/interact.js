// =============================================================
//  INTERACT — what happens when you tap the world with each tool.
// =============================================================

import { G } from './state.js';
import { TILE } from './art.js';
import { tileAt, objectAt, isLand, canPlaceLand, placeLand, objectDef } from './island.js';
import { till, plant, water, fertilize, harvest, growBlocker } from './farming.js';
import { animalAt, placeAnimalFromBag } from './animals.js';
import { placeBuilding, placeDeco, pickUp, moveObject, paintObject, cycleRoof } from './buildings.js';
import { getCrop, itemInfo, count, removeItem, pay, canAfford } from './items.js';
import { catchStar } from './festivals.js';
import { floatText, sparkle, screenToWorld } from './render.js';
import { audio } from './audio.js';
import { emit } from './events.js';
import { toast, pickItem, updateToolbar, openPanel, closePanel, h } from './ui/ui.js';
import { openMixer } from './ui/mixpanel.js';
import { openCraft } from './ui/craftpanel.js';
import { openTrade } from './ui/tradepanel.js';
import { openJournal } from './ui/journal.js';
import { openExplore } from './ui/explorepanel.js';
import { openAnimalMenu, openBuildingMenu, openCustomize, hooks } from './ui/menus.js';

// Tool upgrades (watering can & hoe) bought at the Workshop.
export const TOOL_UPGRADES = {
  2: { plank: 5, old_gear: 2, coins: 100 },
  3: { sky_crystal: 3, old_gear: 4, coins: 300 },
};
const AREA = {
  1: [[0, 0]],
  2: [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]],
  3: [[-1, -1], [0, -1], [1, -1], [-1, 0], [0, 0], [1, 0], [-1, 1], [0, 1], [1, 1]],
};
const toolLevel = (t) => (G.state.tools && G.state.tools[t]) || 1;

/** Walk the little farmer over to a tile. */
function walkTo(tx, ty) {
  if (!isLand(tx, ty)) return;
  G.rt.playerTarget = { x: tx + 0.5, y: ty + 0.85 };
}

const fx = (tx, ty, text, color) => floatText((tx + 0.5) * TILE, ty * TILE, text, color);

export function onWorldTap(tx, ty, wx, wy) {
  const s = G.state;
  const prev = G.rt.hover;
  G.rt.hover = { x: tx, y: ty };

  // ---------- placing things ----------
  const p = G.rt.placing;
  if (p) {
    // Touch: first tap previews, a second tap on the same spot confirms.
    if (!prev || prev.x !== tx || prev.y !== ty) return;
    let err = '';
    if (p.kind === 'land') {
      if (!canPlaceLand(p.ref, tx, ty, p.rot)) err = 'Land must touch your island and not overlap.';
      else { removeItem('land:' + p.ref, 1); placeLand(p.ref, tx, ty, p.rot); }
    } else if (p.kind === 'building') err = placeBuilding(p.ref, tx, ty);
    else if (p.kind === 'deco') err = placeDeco(p.ref, tx, ty);
    else if (p.kind === 'animal') err = placeAnimalFromBag(p.ref, tx, ty);
    else if (p.kind === 'move') err = moveObject(p.moving, tx, ty);
    if (err) { toast(err, 'warn'); audio.sfx('error'); return; }
    audio.sfx('build');
    sparkle((tx + 0.5) * TILE, (ty + 0.5) * TILE, '#ffffff', 12);
    // Keep placing more of the same if you still have some (decor, land, paths).
    const more = (p.kind === 'deco' && count('deco:' + p.ref) > 0) || (p.kind === 'land' && count('land:' + p.ref) > 0) || (p.kind === 'animal' && count('animal:' + p.ref) > 0);
    if (!more) { G.rt.placing = null; G.rt.tool = 'hand'; }
    updateToolbar();
    return;
  }

  walkTo(tx, ty);
  const tile = tileAt(tx, ty);
  const obj = objectAt(tx, ty);
  const tool = G.rt.tool;

  if (tool === 'move') {
    if (!obj) return;
    if (obj.ref === 'house' || obj.ref === 'windmill') { toast('That one is too heavy to move.', 'warn'); return; }
    G.rt.placing = { kind: 'move', moving: obj, ref: obj.ref, rot: 0 };
    toast('Now tap where it should go.');
    updateToolbar();
    return;
  }
  if (tool === 'remove') {
    if (!obj) return;
    const err = pickUp(obj);
    if (err) toast(err, 'warn'); else { audio.sfx('build'); toast(`Picked up ${objectDef(obj).name}.`); }
    return;
  }
  if (tool === 'roof') {
    if (obj && obj.type === 'building') { cycleRoof(obj); audio.sfx('click'); }
    return;
  }
  if (tool === 'paint') {
    if (!G.rt.paintKey || count(G.rt.paintKey) < 1) { choosePaint(); return; }
    if (!obj) return;
    const part = obj.type === 'building' && wy < obj.y + obj.h * 0.35 ? 'roof' : 'wall';
    const err = paintObject(obj, G.rt.paintKey, part);
    if (err) toast(err, 'warn'); else { audio.sfx('mix'); sparkle((tx + 0.5) * TILE, ty * TILE, itemInfo(G.rt.paintKey).color || '#fff'); }
    updateToolbar();
    return;
  }
  if (tool === 'hoe') {
    let n = 0;
    for (const [dx, dy] of AREA[toolLevel('hoe')]) if (till(tx + dx, ty + dy)) n++;
    if (n) audio.sfx('till');
    else if (tile && tile.crop) toast('Something is already growing there.');
    else if (obj) toast('There\'s something in the way.');
    return;
  }
  if (tool === 'water') {
    let n = 0;
    for (const [dx, dy] of AREA[toolLevel('can')]) if (water(tx + dx, ty + dy)) n++;
    if (n) { audio.sfx('water'); sparkle((tx + 0.5) * TILE, (ty + 0.5) * TILE, '#8fd0ff', 6); }
    else if (tile && !tile.soil) toast('Till the soil first.');
    return;
  }
  if (tool === 'seed') {
    if (!G.rt.seed || count(G.rt.seed) < 1) { chooseSeed(); return; }
    if (!tile || !tile.soil) { toast('Till the soil with the Hoe first.'); return; }
    if (tile.crop) { handTap(tx, ty, wx, wy); return; }
    if (plant(tx, ty, G.rt.seed)) {
      audio.sfx('plant');
      const c = getCrop(G.rt.seed.slice(5));
      const why = growBlocker(tx, ty, tile.crop);
      if (why) toast(`${c.name}: ${why}. It will wait.`, 'warn');
      if (count(G.rt.seed) < 1) { toast('Out of those seeds.'); G.rt.seed = null; }
      updateToolbar();
    }
    return;
  }
  if (tool === 'fert') {
    if (!G.rt.fert || count(G.rt.fert) < 1) { chooseFert(); return; }
    if (fertilize(tx, ty, G.rt.fert)) { audio.sfx('plant'); sparkle((tx + 0.5) * TILE, (ty + 0.5) * TILE, '#b0ffb0', 8); updateToolbar(); }
    else toast('Fertilizer goes on tilled soil.');
    return;
  }
  handTap(tx, ty, wx, wy);
}

/** The Hand: harvest, care for animals, use buildings. */
function handTap(tx, ty, wx, wy) {
  const a = animalAt(wx, wy);
  if (a) { G.rt.selectedAnimal = a; openAnimalMenu(a); return; }
  const tile = tileAt(tx, ty), obj = objectAt(tx, ty);
  if (tile && tile.crop) {
    const c = tile.crop, def = getCrop(c.id);
    if (c.ripe) {
      const r = harvest(tx, ty);
      if (r) {
        audio.sfx('harvest');
        fx(tx, ty, `+${r.qty} ${def.name}`, '#fff6c0');
        sparkle((tx + 0.5) * TILE, (ty + 0.5) * TILE, '#fff3a0', 8);
        if (r.hybrid) { const hc = getCrop(r.hybrid); toast(`✨ Hybrid seed: ${hc.name}!`); fx(tx, ty - 0.5, '✨ Hybrid seed!', '#ffd6f5'); }
        if (r.sport) toast(`✨ A new sport appeared: ${getCrop(r.sport).name}!`);
      }
    } else {
      const why = growBlocker(tx, ty, c);
      toast(`${def.name}: ${Math.floor(c.age)}/${def.traits.growth} days${tile.wet ? ' · watered' : ' · needs water'}${why ? ' · ' + why : ''}`);
    }
    return;
  }
  if (obj) { useObject(obj); return; }
}

function useObject(o) {
  const def = objectDef(o);
  if (o.type === 'deco') { toast(`${def.name}: ${def.desc}`); return; }
  switch (o.ref) {
    case 'mixing_station': openMixer(); return;
    case 'workbench': openCraft(); return;
    case 'dock': case 'market_stall': openTrade(); return;
    case 'house': openBuildingMenu(o, [['😴 Sleep', () => hooks.sleep()], ['👕 Customize', openCustomize]]); return;
    case 'workshop': openBuildingMenu(o, [['🔨 Craft', openCraft], ['⬆️ Upgrade tools', openUpgrades]]); return;
    case 'weather_vane': case 'sails': case 'rudder': openBuildingMenu(o, [['🗺️ Open map & forecast', () => openJournal('map')]]); return;
    case 'flagpole': openBuildingMenu(o, [['🚩 Design flag', openCustomize]]); return;
    default: openBuildingMenu(o, []);
  }
}

function openUpgrades() {
  openPanel({ id: 'upgrades', title: 'Tool Upgrades', render: (body) => {
    const row = (tool, name, desc) => {
      const lvl = toolLevel(tool), cost = TOOL_UPGRADES[lvl + 1];
      return h('div', { class: 'trow' }, h('div', { class: 'grow' }, h('b', {}, `${name} · level ${lvl}`), h('div', { class: 'small' }, desc[lvl - 1]),
        cost ? h('div', { class: 'small muted' }, 'Next: ' + Object.entries(cost).map(([k, n]) => `${n} ${k === 'coins' ? 'Shells' : itemInfo(k).name}`).join(', ')) : h('div', { class: 'small ok' }, 'Fully upgraded!')),
      cost ? h('button', { class: 'btn small', disabled: !canAfford(cost), onclick: () => { if (pay(cost)) { G.state.tools = G.state.tools || {}; G.state.tools[tool] = lvl + 1; audio.sfx('discover'); toast(`${name} upgraded!`); closePanel(); openUpgrades(); } } }, 'Upgrade') : null);
    };
    body.append(row('can', 'Watering Can', ['Waters 1 tile.', 'Waters a plus shape (5 tiles).', 'Waters a 3×3 square.']),
      row('hoe', 'Hoe', ['Tills 1 tile.', 'Tills a plus shape (5 tiles).', 'Tills a 3×3 square.']),
      h('p', { class: 'small muted' }, `Glider level ${G.state.glider.level}. Glider Wing Kits (from friends, festivals and rare finds) upgrade it from your bag.`));
  } });
}

// ---------------- choosing items for tools ----------------
export async function chooseSeed() {
  const k = await pickItem('Choose seeds to plant', i => i.kind === 'seed', 'No seeds! Buy some from airships or find them on islands.');
  if (k) { G.rt.seed = k; G.rt.tool = 'seed'; updateToolbar(); }
}
export async function chooseFert() {
  const k = await pickItem('Choose fertilizer', i => i.base === 'fertilizer', 'No fertilizer. Make some at the Mixing Station (base: Fertilizer).');
  if (k) { G.rt.fert = k; G.rt.tool = 'fert'; updateToolbar(); }
}
export async function choosePaint() {
  const k = await pickItem('Choose a dye', i => i.kind === 'dye', 'No dyes. Make one at the Mixing Station (base: Dye).');
  if (k) { G.rt.paintKey = k; G.rt.tool = 'paint'; updateToolbar(); }
}

// ---------------- the sky ----------------
export function onSkyTap(sx, sy) {
  const stars = G.rt.fallingStars || [];
  for (let i = 0; i < stars.length; i++) {
    if (Math.hypot(stars[i].x - sx, stars[i].y - sy) < 26) {
      stars.splice(i, 1);
      toast('⭐ ' + catchStar());
      audio.chime();
      emit('star:caught');
      return true;
    }
  }
  for (const hit of G.rt.islandHits || []) {
    if (sx >= hit.x && sx <= hit.x + hit.w && sy >= hit.y && sy <= hit.y + hit.h) {
      // Only count sky taps that are clearly not on the home island.
      const w = screenToWorld(sx, sy);
      if (!isLand(Math.floor(w.x / TILE), Math.floor(w.y / TILE))) { openExplore(hit.n); return true; }
    }
  }
  return false;
}
