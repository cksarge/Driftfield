// =============================================================
//  EXPLORE PANEL — glide to passing islands, use spots, meet folk.
// =============================================================

import { G } from '../state.js';
import { DATA } from '../../data/index.js';
import { nearbyIslands, glideRange, startVisit, endVisit, useSpot, spotDone, spotVisible } from '../exploration.js';
import { meet, chatter, currentQuest, acceptQuest, turnIn, giveGift, friendship } from '../quests.js';
import { canFulfill, needText, haveCount, needQty } from '../needs.js';
import { itemInfo } from '../items.js';
import { iconURL, drawPortrait } from '../art.js';
import { absMinutes } from '../time.js';
import { openPanel, refreshPanel, closePanel, h, toast, pickItem, showDialog } from './ui.js';
import { audio } from '../audio.js';

let log = [], npc = null;

export function openExplore(n = null) {
  if (G.rt.visit) { openPanel({ id: 'explore', title: DATA.ISLANDS[G.rt.visit.n.id].name, wide: true, render: renderVisit, onClose: leaveIfVisiting }); return; }
  if (n) { tryVisit(n); return; }
  openPanel({ id: 'explore', title: 'Explore', wide: true, render: renderList });
}

function renderList(body) {
  const list = nearbyIslands();
  body.append(h('p', { class: 'muted small' }, `Your glide range is ${glideRange()}. Floaty potions, telescopes and glider upgrades let you reach farther.`));
  if (!list.length) { body.append(h('p', { class: 'empty' }, 'No islands close enough right now. Keep an eye on the sky. They drift by every day.')); return; }
  body.append(h('div', { class: 'cards' }, list.map(n => {
    const I = DATA.ISLANDS[n.id];
    const hrs = Math.max(0, Math.round((n.leave - absMinutes()) / 60));
    const reach = I.distance <= glideRange();
    const visited = !!G.state.disc.islands[n.id];
    const hasPiece = I.spots.some(sp => sp.type === 'piece' && !G.state.disc.pieces[sp.piece]);
    return h('button', { class: 'card' + (reach ? '' : ' dim'), onclick: () => tryVisit(n) },
      h('div', { class: 'swatch', style: `background:linear-gradient(${I.colors[0]} 40%, ${I.colors[1]} 40%)` }),
      h('b', {}, I.name + (visited ? '' : ' ✨')),
      h('div', { class: 'small' }, I.desc),
      h('div', { class: 'small muted' }, `Distance ${I.distance} · drifting away in ~${hrs}h${hasPiece && visited ? ' · something of yours is here…' : ''}`));
  })));
}

function tryVisit(n) {
  const res = startVisit(n);
  if (typeof res === 'string') { toast(res, 'warn'); audio.sfx('error'); return; }
  audio.sfx('whoosh');
  log = [`You glide over to ${DATA.ISLANDS[n.id].name}.`];
  npc = null;
  openPanel({ id: 'explore', title: DATA.ISLANDS[n.id].name, wide: true, render: renderVisit, onClose: leaveIfVisiting });
}

function leaveIfVisiting() { if (G.rt.visit) { endVisit(); toast('You glide home.'); } }

function renderVisit(body) {
  const v = G.rt.visit;
  if (!v) { body.append(h('p', {}, 'You are home.')); return; }
  if (npc) return renderNpc(body);
  const I = DATA.ISLANDS[v.n.id];
  body.append(h('div', { class: 'isle-banner', style: `--g:${I.colors[0]};--r:${I.colors[1]}` }, h('div', { class: 'small' }, I.desc)));
  body.append(h('div', { class: 'row' }, h('span', { class: 'energy' }, 'Energy ', '●'.repeat(Math.max(0, v.energy)), h('span', { class: 'muted' }, '○'.repeat(Math.max(0, Math.min(8, 8 - v.energy))))), h('span', { class: 'grow' }),
    h('button', { class: 'btn', onclick: () => closePanel() }, '🪂 Glide home')));
  body.append(h('div', { class: 'spots' }, I.spots.map((sp, i) => {
    if (!spotVisible(v.n, i)) return null;
    const done = spotDone(v.n, i);
    const icon = { gather: '🧺', seeds: '🌱', chest: '🎁', npc: '💬', piece: '💛', secret: '🔍' }[sp.type];
    const label = sp.type === 'npc' ? `${sp.label}: ${DATA.CHARACTERS[sp.character].name}` : sp.label;
    return h('button', { class: 'spot' + (done ? ' done' : '') + (sp.type === 'piece' && !done ? ' special' : ''), disabled: done, onclick: () => use(i) },
      h('span', { class: 'ic' }, icon), h('span', {}, label), done ? h('span', { class: 'small muted' }, ' ✓') : null);
  })));
  body.append(h('div', { class: 'mixlog' }, log.slice(-6).map(l => h('div', {}, l))));
}

function use(i) {
  const res = useSpot(i);
  if (res.npc) { npc = res.npc; const first = meet(npc); refreshPanel(); if (first) showDialog(npc, DATA.CHARACTERS[npc].intro); return; }
  log.push(...res.lines);
  if (res.ok) audio.sfx(res.lines.some(l => l.startsWith('Recovered')) ? 'discover' : 'harvest'); else audio.sfx('error');
  if (res.lines.some(l => l.startsWith('Recovered'))) {
    const line = res.lines.find(l => l.startsWith('Wendell:'));
    if (line) showDialog('wendell', [line.replace(/^Wendell: "|"$/g, '')]);
  }
  refreshPanel();
}

// ---------------- talking to characters ----------------
function renderNpc(body) {
  const c = DATA.CHARACTERS[npc];
  const cv = h('canvas', { width: 72, height: 72, class: 'portrait' });
  drawPortrait(cv.getContext('2d'), npc, 72);
  const hearts = Math.min(10, Math.floor(friendship(npc) / 3));
  body.append(h('div', { class: 'speaker' }, cv, h('div', {}, h('b', {}, c.name), h('div', { class: 'small muted' }, c.title), h('div', { class: 'hearts' }, '♥'.repeat(hearts) + '♡'.repeat(10 - hearts)))));

  const qid = currentQuest(npc);
  if (qid) {
    const q = DATA.QUESTS[qid];
    const active = !!G.state.quests.active[qid];
    const ok = canFulfill(q.needs);
    body.append(h('div', { class: 'quest' },
      h('b', {}, (active ? '📜 ' : '❗ ') + q.title), h('div', { class: 'small' }, q.desc),
      h('ul', { class: 'small' }, q.needs.map(n => h('li', {}, `${needText(n)} ${n.clue ? (haveCount(n) ? '✓' : '') : `(${haveCount(n)}/${needQty(n)})`}`))),
      active
        ? h('button', { class: 'btn gold small', disabled: !ok, onclick: () => {
          if (turnIn(qid)) { audio.sfx('discover'); showDialog(npc, [q.reward.say || 'Thank you!']); toast(`Quest complete: ${q.title}`); refreshPanel(); }
        } }, ok ? 'Hand over' : 'Not yet…')
        : h('button', { class: 'btn small', onclick: () => { acceptQuest(qid); toast(`New quest: ${q.title}`); refreshPanel(); } }, 'Accept')));
  }
  body.append(h('div', { class: 'row wrap' },
    h('button', { class: 'btn small', onclick: () => showDialog(npc, [chatter(npc)]) }, '💬 Chat'),
    h('button', { class: 'btn small', onclick: gift }, '🎁 Give a gift'),
    h('span', { class: 'grow' }),
    h('button', { class: 'btn small ghost', onclick: () => { npc = null; refreshPanel(); } }, '← Back to island')));
  if (c.shop) {
    body.append(h('h3', {}, 'For sale'));
    body.append(h('div', { class: 'rows' }, c.shop.map(e => {
      const info = itemInfo(e.key);
      const owned = (e.key.startsWith('recipe:') && G.state.recipesKnown[e.key.slice(7)]);
      return h('div', { class: 'trow' + (owned ? ' dim' : '') }, h('div', { class: 'item' }, h('img', { src: iconURL(info, 40), alt: '' })),
        h('div', { class: 'grow' }, h('b', {}, info.name), h('div', { class: 'small' }, `${e.price} 🐚`)),
        h('button', { class: 'btn small', disabled: owned || G.state.coins < e.price, onclick: () => {
          import('../trading.js').then(m => { if (m.buy({ ...e, stock: 1 })) { audio.sfx('coin'); toast(`Bought ${info.name}`); refreshPanel(); } });
        } }, owned ? 'Known' : 'Buy'));
    })));
  }
}

async function gift() {
  const key = await pickItem(`A gift for ${DATA.CHARACTERS[npc].name}`, i => !['building', 'land', 'animal'].includes(i.kind) && !i.noSell);
  if (!key) return;
  const pts = giveGift(npc, key);
  if (pts === 2) { audio.sfx('discover'); showDialog(npc, ['Oh! I LOVE this! How did you know?']); }
  else if (pts === 1) { audio.sfx('soft'); showDialog(npc, ['Thank you, that\'s very kind.']); }
  refreshPanel();
}
