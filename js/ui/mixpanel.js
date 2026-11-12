// =============================================================
//  MIXING STATION PANEL — pick a base, add ingredients one by one,
//  watch effects appear, transform and fuse, then bottle it.
//  Nothing is used up until you press "Bottle it".
// =============================================================

import { G, isDiscovered } from '../state.js';
import { DATA } from '../../data/index.js';
import { itemInfo, count, canAfford, countSpec } from '../items.js';
import { newSession, applyIngredient, describeMix, sessionCost, canBottle, bottle, isIngredient, sessionFromJournal } from '../mixing.js';
import { hasBuilding } from '../island.js';
import { iconURL } from '../art.js';
import { openPanel, refreshPanel, h, itemTile, fxChip, toast, pickItem } from './ui.js';
import { sparkle } from '../render.js';
import { audio } from '../audio.js';

let session = null, lastLog = [];

export function openMixer(fromJournal = null) {
  if (!hasBuilding('mixing_station') && G.state.phase === 'main') {
    toast('Build a Mixing Station first (Build → Buildings).', 'warn');
    return;
  }
  if (fromJournal) { session = sessionFromJournal(fromJournal); lastLog = ['Recipe loaded from your Mix Journal.']; }
  openPanel({ id: 'mix', title: 'Mixing Station', wide: true, render });
}

function render(body) {
  if (!session) return renderBases(body);
  const d = describeMix(session);
  const cost = sessionCost(session);
  const base = DATA.BASES[session.base];

  body.append(h('div', { class: 'mix-top' },
    h('div', { class: 'jar', style: `--c:${d.color}` }, h('div', { class: 'liquid' }), h('div', { class: 'shine' })),
    h('div', { class: 'grow' },
      h('h3', {}, d.name),
      h('div', { class: 'fx big', html: d.effects.length ? d.effects.map(e => fxChip(e)).join('') : '<span class="muted small">No effects yet</span>' }),
      h('div', { class: 'small muted' }, `${d.effects.length}/${DATA.MAX_EFFECTS} effects · worth about ${d.value} 🐚 · ${base.desc}`),
    )));

  // What happened on the last addition.
  if (lastLog.length) body.append(h('div', { class: 'mixlog' }, lastLog.map(l => h('div', {}, l))));

  // Steps so far.
  body.append(h('div', { class: 'steps' },
    h('span', { class: 'small muted' }, `${base.name}`),
    session.steps.map((k) => h('span', { class: 'step' }, '→ ', h('img', { src: iconURL(itemInfo(k), 22), alt: '' }), ' ', itemInfo(k).name))));

  const atMax = session.steps.length >= DATA.MAX_STEPS;
  body.append(h('div', { class: 'row wrap' },
    h('button', { class: 'btn', disabled: atMax, onclick: addIngredient }, '+ Add ingredient'),
    h('button', { class: 'btn ghost', disabled: !session.steps.length, onclick: undo }, '↶ Undo'),
    h('button', { class: 'btn ghost', onclick: () => { session = null; lastLog = []; refreshPanel(); } }, 'Start over'),
    h('span', { class: 'grow' }),
    h('button', { class: 'btn gold', disabled: !canBottle(session), onclick: doBottle }, 'Bottle it!')));
  body.append(h('div', { class: 'small muted' }, 'Uses: ' + Object.entries(cost).map(([k, n]) => `${n}× ${k.startsWith('tag:') ? 'any ' + k.slice(4) : itemInfo(k).name} (have ${countSpec(k)})`).join(', ')));
  body.append(h('p', { class: 'hint' }, hint()));
}

function renderBases(body) {
  body.append(h('p', { class: 'muted' }, 'Choose a base. Each ingredient you add can add effects, change existing ones, or fuse them. Order matters!'));
  body.append(h('div', { class: 'cards' }, Object.entries(DATA.BASES).map(([id, b]) => {
    const ok = canAfford(b.needs);
    return h('button', { class: 'card' + (ok ? '' : ' dim'), onclick: () => { session = newSession(id); lastLog = []; refreshPanel(); } },
      h('div', { class: 'swatch', style: `background:${b.color}` }),
      h('b', {}, b.name),
      h('div', { class: 'small' }, b.desc),
      h('div', { class: 'small muted' }, 'Needs: ' + Object.entries(b.needs).map(([k, n]) => `${n} ${k.startsWith('tag:') ? k.slice(4) : itemInfo(k).name}`).join(', ')),
      b.start.length ? h('div', { class: 'fx', html: b.start.map(e => fxChip(e)).join('') }) : null);
  })));
}

async function addIngredient() {
  const used = {};
  session.steps.forEach(k => { used[k] = (used[k] || 0) + 1; });
  Object.entries(DATA.BASES[session.base].needs).forEach(([k, n]) => { used[k] = (used[k] || 0) + n; });
  const key = await pickItem('Add an ingredient', (i) => isIngredient(i.key) && count(i.key) > (used[i.key] || 0), 'No ingredients! Crops, foraged goods and animal products all work.');
  if (!key) return;
  const before = new Set(session.effects);
  session = applyIngredient(session, key);
  lastLog = session.log;
  const newOnes = session.effects.filter(e => !before.has(e) && !isDiscovered('effects', e));
  if (newOnes.length) lastLog = [...lastLog, `✨ New effect: ${newOnes.map(e => DATA.EFFECTS[e].name).join(', ')}! (Bottle it to record it.)`];
  audio.sfx('mix');
  refreshPanel();
}

function undo() {
  const steps = session.steps.slice(0, -1);
  let s = newSession(session.base);
  for (const k of steps) s = applyIngredient(s, k);
  session = s; lastLog = ['Took the last ingredient back out.'];
  refreshPanel();
}

function doBottle() {
  const d = describeMix(session);
  const key = bottle(session);
  if (!key) { toast('Missing something…', 'warn'); return; }
  audio.sfx('discover');
  toast(`Made ${d.name}!`);
  const st = G.state.objects.find(o => o.ref === 'mixing_station');
  if (st) sparkle((st.x + 1) * 48, st.y * 48, d.color, 16);
  lastLog = [`Bottled ${d.name}. Saved to your Mix Journal.`];
  // keep the recipe loaded so it's easy to make another
  refreshPanel();
}

function hint() {
  const tips = [
    'Tip: an ingredient only transforms effects that are already there, so add transformers later.',
    'Tip: two effects can fuse into a rarer one. Try pairing opposites.',
    'Tip: products with more effects are worth more, but there\'s only room for 8.',
    'Tip: hybrid crops carry their parents\' quirks into the mix.',
    'Tip: what you feed animals ends up in their products, and those are ingredients too.',
  ];
  return tips[(session.steps.length + session.base.length) % tips.length];
}

