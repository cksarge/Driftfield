// =============================================================
//  BAG — the inventory panel, and what you can do with each item.
// =============================================================

import { G } from '../state.js';
import { DATA } from '../../data/index.js';
import { itemInfo, count, sortedInventory, removeItem } from '../items.js';
import { drink } from '../mixing.js';
import { canSellNow, sell, sellPrice } from '../trading.js';
import { upgradeGlider, glideRange } from '../exploration.js';
import { hasBuilding } from '../island.js';
import { millGrind } from '../buildings.js';
import { iconURL } from '../art.js';
import { openPanel, refreshPanel, closePanel, h, itemTile, itemTooltip, toast, updateToolbar } from './ui.js';
import { audio } from '../audio.js';

const TABS = [
  ['all', 'All', () => true],
  ['seed', 'Seeds', i => i.kind === 'seed'],
  ['crop', 'Produce', i => i.kind === 'crop' || i.kind === 'product'],
  ['mix', 'Mixes & Dyes', i => i.kind === 'mix' || i.kind === 'dye'],
  ['mat', 'Materials', i => ['material', 'forage', 'special'].includes(i.kind)],
  ['place', 'To Place', i => ['deco', 'building', 'land', 'animal'].includes(i.kind)],
];
let tab = 'all', selected = null;

export function openBag(startTab) {
  if (startTab) tab = startTab;
  openPanel({ id: 'bag', title: 'Bag', wide: true, render });
}

function render(body) {
  const tabs = h('div', { class: 'tabs' }, TABS.map(([id, label]) => h('button', { class: 'tab' + (tab === id ? ' on' : ''), onclick: () => { tab = id; refreshPanel(); } }, label)));
  const filter = TABS.find(t => t[0] === tab)[2];
  const list = sortedInventory(filter);
  if (selected && !count(selected)) selected = null;
  body.append(tabs);
  body.append(h('div', { class: 'row small muted' }, `🐚 ${G.state.coins} Shells · Glide range ${glideRange()} · ${Object.keys(G.state.inv).length} kinds of item`));
  if (selected) body.append(detail(selected));
  body.append(list.length ? h('div', { class: 'grid' }, list.map(i => itemTile(i.key, { selected: i.key === selected, onclick: () => { selected = i.key; refreshPanel(); } })))
    : h('p', { class: 'empty' }, 'Nothing here yet.'));
}

function detail(key) {
  const info = itemInfo(key);
  const acts = actionsFor(info);
  return h('div', { class: 'detail' },
    h('img', { src: iconURL(info, 56), alt: '' }),
    h('div', { class: 'grow' }, h('div', { html: itemTooltip(info) }), h('div', { class: 'small muted' }, `You have ${count(key)}`)),
    h('div', { class: 'actions' }, acts));
}

/** Buttons for what can be done with an item right now. */
export function actionsFor(info) {
  const key = info.key, out = [];
  const btn = (label, fn, cls = 'btn small') => out.push(h('button', { class: cls, onclick: fn }, label));
  if (info.kind === 'seed') btn('🌱 Plant', () => { G.rt.tool = 'seed'; G.rt.seed = key; closePanel(); updateToolbar(); toast('Tap tilled soil to plant.'); });
  if (info.base === 'fertilizer') btn('🧪 Spread', () => { G.rt.tool = 'fert'; G.rt.fert = key; closePanel(); updateToolbar(); toast('Tap soil to fertilize.'); });
  if (info.kind === 'dye') btn('🎨 Paint', () => { G.rt.tool = 'paint'; G.rt.paintKey = key; closePanel(); updateToolbar(); toast('Tap a building or decoration to paint it.'); });
  if (info.base && DATA.BASES[info.base].use === 'drink') btn('🥤 Drink', () => { if (drink(key)) { audio.sfx('mix'); toast(`You feel ${info.effects.map(e => DATA.EFFECTS[e].name.toLowerCase()).join(', ')}!`); refreshPanel(); } });
  if (info.kind === 'deco') btn('📍 Place', () => startPlacing('deco', key.slice(5)));
  if (info.kind === 'building') btn('📍 Place', () => startPlacing('building', key.slice(4), true));
  if (info.kind === 'land') btn('🧩 Attach', () => startPlacing('land', key.slice(5)));
  if (info.kind === 'animal') btn('📍 Place', () => startPlacing('animal', key.slice(7)));
  if (key === 'glider_wing') btn('🪂 Upgrade glider', () => {
    if (!hasBuilding('workshop')) { toast('You need a Workshop to fit the wing kit.', 'warn'); return; }
    removeItem(key, 1); upgradeGlider(); audio.sfx('discover'); toast(`Glider upgraded! Range is now ${glideRange()}.`); refreshPanel();
  });
  if (info.kind === 'crop' && hasBuilding('mill') && count(key) >= 3) btn('⚙️ Grind 3 → 2 compost', () => { millGrind(key); refreshPanel(); });
  if (canSellNow() && !info.noSell && info.value) {
    const p = sellPrice(key);
    btn(`Sell 1 · ${p}🐚`, () => { const got = sell(key, 1); if (got) { audio.sfx('coin'); toast(`+${got} Shells`); } refreshPanel(); }, 'btn small gold');
  }
  return out;
}

export function startPlacing(kind, ref, free = false) {
  G.rt.placing = { kind, ref, rot: 0, free };
  G.rt.tool = 'build';
  closePanel();
  updateToolbar();
}
