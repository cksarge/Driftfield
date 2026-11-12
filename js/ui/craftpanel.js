// =============================================================
//  CRAFTING PANEL — experiment on the bench, or craft known recipes.
// =============================================================

import { G } from '../state.js';
import { DATA } from '../../data/index.js';
import { itemInfo, count } from '../items.js';
import { BENCH_SLOTS, experiment, recipeList, craftKnown, hasStation, outputName } from '../crafting.js';
import { iconURL } from '../art.js';
import { openPanel, refreshPanel, h, itemTile, toast, pickItem } from './ui.js';
import { audio } from '../audio.js';

let slots = Array(BENCH_SLOTS).fill(null);
let message = '';

export function openCraft() {
  if (!hasStation('bench') && G.state.phase === 'main') {
    toast('Place your Workbench first (Bag → To Place).', 'warn');
    return;
  }
  openPanel({ id: 'craft', title: 'Crafting', wide: true, render });
}

function render(body) {
  // Experiment bench
  body.append(h('h3', {}, 'Experiment'));
  body.append(h('p', { class: 'small muted' }, 'Put items on the bench (repeat an item to add more of it) and press Craft. If it matches a recipe, you discover it!'));
  const used = {};
  slots.forEach(k => { if (k) used[k] = (used[k] || 0) + 1; });
  body.append(h('div', { class: 'bench' }, slots.map((k, i) => k
    ? h('button', { class: 'slot full', title: 'Remove', onclick: () => { slots[i] = null; refreshPanel(); } }, h('img', { src: iconURL(itemInfo(k), 36), alt: itemInfo(k).name }))
    : h('button', { class: 'slot', onclick: async () => {
      const key = await pickItem('Put on the bench', (it) => count(it.key) > (used[it.key] || 0) && !['building', 'land', 'animal'].includes(it.kind));
      if (key) { slots[i] = key; message = ''; refreshPanel(); }
    } }, '+'))));
  body.append(h('div', { class: 'row' },
    h('button', { class: 'btn gold', onclick: tryCraft }, '🔨 Craft'),
    h('button', { class: 'btn ghost', onclick: () => { slots = Array(BENCH_SLOTS).fill(null); message = ''; refreshPanel(); } }, 'Clear'),
    message ? h('span', { class: 'msg' }, message) : null));

  // Recipe book
  const list = recipeList();
  const known = list.filter(r => r.known), unknown = list.filter(r => !r.known);
  body.append(h('h3', {}, `Recipe Book (${known.length}/${list.length})`));
  body.append(h('div', { class: 'recipes' }, known.map(({ id, r, station, affordable }) => {
    const outKey = Object.keys(r.output)[0];
    return h('div', { class: 'recipe' + (affordable && station ? '' : ' dim') },
      itemTile(outKey, { count: r.output[outKey], hideCount: r.output[outKey] === 1 }),
      h('div', { class: 'grow' }, h('b', {}, outputName(r)),
        h('div', { class: 'small' }, Object.entries(r.inputs).map(([k, n]) => `${n}× ${specName(k)} (${haveSpec(k)})`).join(' · ')),
        r.station === 'workshop' ? h('div', { class: 'small muted' }, 'Workshop') : null),
      h('button', { class: 'btn small', disabled: !(affordable && station), onclick: () => {
        const err = craftKnown(id);
        if (err) toast(err, 'warn'); else { audio.sfx('build'); toast(`Crafted ${outputName(r)}`); }
        refreshPanel();
      } }, 'Craft'));
  })));
  if (unknown.length) {
    body.append(h('h3', {}, 'Undiscovered'));
    body.append(h('div', { class: 'recipes' }, unknown.map(({ r }) => h('div', { class: 'recipe secret' },
      h('div', { class: 'item q' }, '?'),
      h('div', { class: 'grow small' }, h('i', {}, r.hint || 'Keep experimenting…'), r.station === 'workshop' ? h('div', { class: 'muted' }, 'Needs a Workshop') : null)))));
  }
}

function specName(k) { return k.startsWith('kind:') ? 'any ' + k.slice(5) : k.startsWith('tag:') ? 'any ' + k.slice(4) : itemInfo(k).name; }
function haveSpec(k) {
  if (k.startsWith('kind:') || k.startsWith('tag:')) return Object.keys(G.state.inv).filter(x => { const i = itemInfo(x); return k.startsWith('kind:') ? i.kind === k.slice(5) : (i.tags || []).includes(k.slice(4)); }).reduce((s, x) => s + G.state.inv[x], 0);
  return count(k);
}

function tryCraft() {
  const res = experiment(slots);
  if (res.error) { message = res.error; audio.sfx('error'); refreshPanel(); return; }
  const r = DATA.RECIPES[res.id];
  slots = Array(BENCH_SLOTS).fill(null);
  if (res.discovered) { audio.sfx('discover'); message = `✨ Discovered: ${outputName(r)}!`; }
  else { audio.sfx('build'); message = `Crafted ${outputName(r)}.`; }
  refreshPanel();
}
