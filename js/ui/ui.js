// =============================================================
//  UI CORE — panels, dialogue, toasts, HUD and the toolbar.
//
//  Panels are HTML overlays built by small render functions.
//  While a panel or dialogue is open, in-game time is paused.
// =============================================================

import { G } from '../state.js';
import { DATA } from '../../data/index.js';
import { itemInfo, count, sortedInventory } from '../items.js';
import { iconURL, drawPortrait } from '../art.js';
import { clockText, dateText } from '../time.js';
import { zone, daysToNext } from '../navigation.js';
import { balance } from '../island.js';
import { traderHere } from '../trading.js';
import { nearbyIslands } from '../exploration.js';
import { BUFF_TEXT } from '../mixing.js';
import { audio } from '../audio.js';
import { esc } from '../utils.js';

export const $ = (sel, root = document) => root.querySelector(sel);
export const h = (tag, attrs = {}, ...kids) => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else if (v !== false && v != null) el.setAttribute(k, v);
  }
  for (const kid of kids.flat()) if (kid != null && kid !== false) el.append(kid.nodeType ? kid : document.createTextNode(kid));
  return el;
};

/** A small item tile with icon, count and tooltip. */
export function itemTile(key, opts = {}) {
  const info = itemInfo(key);
  const n = opts.count ?? count(key);
  const el = h('button', { class: 'item' + (opts.selected ? ' selected' : '') + (opts.dim ? ' dim' : ''), title: info.name, onclick: opts.onclick || null },
    h('img', { src: iconURL(info, 40), alt: '' }),
    opts.hideCount ? null : h('span', { class: 'count' }, n > 999 ? '999+' : String(n)),
    opts.label ? h('span', { class: 'label' }, opts.label) : null,
  );
  attachTip(el, () => itemTooltip(info));
  return el;
}

export function itemTooltip(info) {
  let html = `<b>${esc(info.name)}</b>`;
  if (info.effects && info.effects.length) html += `<div class="fx">${info.effects.map(e => fxChip(e)).join('')}</div>`;
  if (info.crop) {
    const t = info.crop.traits;
    html += `<div class="small">${t.climates.map(c => DATA.CLIMATES[c].name).join(', ')} · ${t.growth} days · yield ${t.yield}${t.rare.length ? ' · ' + t.rare.map(r => DATA.RARE_TRAITS[r].name).join(', ') : ''}</div>`;
  }
  if (info.desc) html += `<div class="small">${esc(info.desc)}</div>`;
  if (info.value) html += `<div class="small">Worth about ${info.value} 🐚</div>`;
  return html;
}

export function fxChip(e) {
  const d = DATA.EFFECTS[e];
  return d ? `<span class="chip" style="--c:${d.color}">${esc(d.name)}</span>` : '';
}

// ---------------- tooltips ----------------
const tip = () => $('#tooltip');
export function attachTip(el, fn) {
  el.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') showTip(fn(), e); });
  el.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') moveTip(e); });
  el.addEventListener('pointerleave', hideTip);
  el.addEventListener('contextmenu', (e) => { e.preventDefault(); showTip(fn(), e); setTimeout(hideTip, 2500); });
}
function showTip(html, e) { const t = tip(); t.innerHTML = html; t.hidden = false; moveTip(e); }
function moveTip(e) {
  const t = tip(); const r = t.getBoundingClientRect();
  t.style.left = Math.min(window.innerWidth - r.width - 8, e.clientX + 14) + 'px';
  t.style.top = Math.min(window.innerHeight - r.height - 8, e.clientY + 14) + 'px';
}
export function hideTip() { tip().hidden = true; }

// ---------------- toasts ----------------
export function toast(text, kind = '') {
  const box = $('#toasts');
  const el = h('div', { class: 'toast ' + kind }, text);
  box.append(el);
  while (box.children.length > 4) box.firstChild.remove();
  setTimeout(() => el.classList.add('out'), 3200);
  setTimeout(() => el.remove(), 3800);
}

// ---------------- panels ----------------
let current = null;
export function openPanel({ id, title, render, wide = false, onClose = null }) {
  closePanel(true);
  hideTip();
  const root = $('#panel-root');
  const body = h('div', { class: 'panel-body' });
  const panel = h('div', { class: 'panel' + (wide ? ' wide' : ''), role: 'dialog', 'aria-label': title },
    h('header', {}, h('h2', {}, title), h('button', { class: 'close', 'aria-label': 'Close', onclick: () => closePanel() }, '✕')),
    body);
  root.innerHTML = '';
  root.append(h('div', { class: 'scrim', onclick: () => closePanel() }), panel);
  root.hidden = false;
  current = { id, render, body, onClose };
  render(body);
  audio.sfx('page');
  updatePause();
}
export function refreshPanel() {
  if (!current) return;
  const st = current.body.scrollTop;
  current.body.innerHTML = '';
  current.render(current.body);
  current.body.scrollTop = st;
}
export function closePanel(silent = false) {
  if (!current) return;
  const c = current; current = null;
  $('#panel-root').hidden = true; $('#panel-root').innerHTML = '';
  if (c.onClose) c.onClose();
  if (!silent) audio.sfx('soft');
  updatePause();
}
export const panelOpen = (id) => !!current && (!id || current.id === id);
export function closeAllPanels() { closePanel(true); closePicker(); }

// ---------------- item picker (small modal over panels) ----------------
let pickerResolve = null;
/** Ask the player to choose an item. Resolves with a key or null. */
export function pickItem(title, filter, emptyText = 'Nothing suitable in your bag.') {
  closePicker();
  return new Promise((resolve) => {
    pickerResolve = resolve;
    const list = sortedInventory(filter);
    const box = h('div', { class: 'picker' },
      h('header', {}, h('h3', {}, title), h('button', { class: 'close', onclick: () => finishPick(null) }, '✕')),
      list.length ? h('div', { class: 'grid' }, list.map(i => itemTile(i.key, { onclick: () => finishPick(i.key) })))
        : h('p', { class: 'empty' }, emptyText));
    const root = $('#picker-root');
    root.innerHTML = ''; root.append(h('div', { class: 'scrim', onclick: () => finishPick(null) }), box); root.hidden = false;
    updatePause();
  });
}
function finishPick(k) { const r = pickerResolve; closePicker(); if (r) r(k); }
function closePicker() { pickerResolve = null; const root = $('#picker-root'); if (root) { root.hidden = true; root.innerHTML = ''; } updatePause(); }

/** Simple yes/no question. */
export function confirmBox(text, yes = 'Yes', no = 'Cancel') {
  return new Promise((resolve) => {
    const root = $('#picker-root');
    const done = (v) => { root.hidden = true; root.innerHTML = ''; updatePause(); resolve(v); };
    root.innerHTML = '';
    root.append(h('div', { class: 'scrim', onclick: () => done(false) }),
      h('div', { class: 'picker confirm' }, h('p', {}, text),
        h('div', { class: 'row end' }, h('button', { class: 'btn ghost', onclick: () => done(false) }, no), h('button', { class: 'btn', onclick: () => done(true) }, yes))));
    root.hidden = false; updatePause();
  });
}

// ---------------- dialogue ----------------
let dlg = null;
/**
 * Show lines of dialogue from a character.
 * opts.auto: ms per line (auto-advance), opts.onLine(i), opts.choices: [{label, fn}] after last line.
 */
export function showDialog(speaker, lines, onDone = null, opts = {}) {
  if (dlg && dlg.queue) { dlg.queue.push({ speaker, lines, onDone, opts }); return; }
  dlg = { speaker, lines, i: 0, onDone, opts, queue: [] };
  renderDialog();
  updatePause();
}
function renderDialog() {
  const box = $('#dialog');
  const raw = dlg.lines[dlg.i];
  const ch = DATA.CHARACTERS[dlg.speaker];
  // Lines like "HOOT: text" keep their own speaker label.
  box.hidden = false;
  const cv = $('#dialog-portrait');
  drawPortrait(cv.getContext('2d'), dlg.speaker, cv.width);
  $('#dialog-name').textContent = ch ? ch.name : '';
  $('#dialog-text').textContent = raw;
  const choices = $('#dialog-choices'); choices.innerHTML = '';
  const last = dlg.i >= dlg.lines.length - 1;
  if (last && dlg.opts.choices) dlg.opts.choices.forEach(c => choices.append(h('button', { class: 'btn small', onclick: (e) => { e.stopPropagation(); endDialog(); c.fn(); } }, c.label)));
  $('#dialog-next').hidden = !!(last && dlg.opts.choices);
  if (dlg.opts.onLine) dlg.opts.onLine(dlg.i);
  clearTimeout(dlg.timer);
  if (dlg.opts.auto) dlg.timer = setTimeout(advanceDialog, dlg.opts.auto);
}
export function advanceDialog() {
  if (!dlg) return;
  if (dlg.i >= dlg.lines.length - 1 && dlg.opts.choices) return;
  audio.sfx('soft');
  dlg.i++;
  if (dlg.i >= dlg.lines.length) endDialog(); else renderDialog();
}
function endDialog() {
  if (!dlg) return;
  clearTimeout(dlg.timer);
  const d = dlg; dlg = null;
  $('#dialog').hidden = true;
  updatePause();
  if (d.onDone) d.onDone();
  const next = d.queue.shift();
  if (next) { showDialog(next.speaker, next.lines, next.onDone, next.opts); dlg.queue = d.queue; }
}
export const dialogOpen = () => !!dlg;

function updatePause() {
  G.rt.paused = !!current || !!dlg || !$('#picker-root').hidden;
}

// ---------------- objective & highlights ----------------
export function setObjective(text) {
  const el = $('#objective');
  el.textContent = text; el.hidden = !text;
}
export function highlight(id) {
  document.querySelectorAll('.pulse').forEach(e => e.classList.remove('pulse'));
  if (id) { const el = document.getElementById(id); if (el) el.classList.add('pulse'); }
}

// ---------------- HUD ----------------
export function updateHUD() {
  const s = G.state;
  if (!s) return;
  $('#hud-date').textContent = dateText();
  $('#hud-time').textContent = clockText();
  const z = zone(), w = DATA.WEATHER[s.weather.today];
  $('#hud-zone').textContent = z.name;
  $('#hud-weather').textContent = weatherIcon(s.weather.today) + ' ' + w.name;
  $('#hud-next').textContent = s.phase === 'main' ? `→ ${DATA.ZONES[s.nav.next].name} in ${daysToNext()}d` : '';
  $('#hud-coins').textContent = s.coins.toLocaleString();
  const buffs = s.buffs.day === s.time.total ? s.buffs.effects.filter(e => BUFF_TEXT[e]) : [];
  const flags = [];
  if (buffs.length) flags.push(`<span class="flag buff" title="${esc(buffs.map(e => BUFF_TEXT[e]).join(' · '))}">✨ ${buffs.map(e => DATA.EFFECTS[e].name).join(', ')}</span>`);
  if (balance().tilted && s.phase === 'main') flags.push('<span class="flag warn" title="Too much weight on one side. Crops grow slower. Add balloons or counterweights.">⚖️ Tilting!</span>');
  if (traderHere()) flags.push(`<span class="flag">🎈 ${esc(DATA.TRADERS[traderHere().id].ship)} docked</span>`);
  const n = nearbyIslands().length;
  if (n) flags.push(`<span class="flag">🏝️ ${n} island${n > 1 ? 's' : ''} nearby</span>`);
  $('#hud-flags').innerHTML = flags.join('');
  $('#btn-trade').classList.toggle('glow', !!traderHere());
  $('#btn-explore').classList.toggle('glow', n > 0);
  $('#btn-skip').hidden = s.phase !== 'tutorial';
  $('#btn-sleep').hidden = s.phase !== 'main';
  updateToolbar();
}

export function weatherIcon(w) {
  return { clear: '☀️', cloudy: '⛅', rain: '🌧️', mist: '🌫️', snow: '❄️', storm: '⛈️', wind: '🍃', aurora: '🌌' }[w] || '☀️';
}

export function updateToolbar() {
  document.querySelectorAll('#toolbar .tool').forEach(b => b.classList.toggle('active', b.dataset.tool === G.rt.tool));
  const seedBtn = $('#tool-seed img'), fertBtn = $('#tool-fert img'), paintBtn = $('#tool-paint img');
  const setIcon = (img, key) => { if (!img) return; if (key && count(key) > 0) { img.src = iconURL(itemInfo(key), 40); img.hidden = false; } else img.hidden = true; };
  setIcon(seedBtn, G.rt.seed); setIcon(fertBtn, G.rt.fert); setIcon(paintBtn, G.rt.paintKey);
  const mode = $('#mode-banner');
  const p = G.rt.placing;
  if (p) {
    const name = p.kind === 'land' ? DATA.LAND[p.ref].name : p.kind === 'building' ? DATA.BUILDINGS[p.ref].name : p.kind === 'deco' ? DATA.DECOR[p.ref].name : p.kind === 'animal' ? DATA.ANIMALS[p.ref].name : '';
    mode.hidden = false;
    $('#mode-text').textContent = (p.moving ? 'Moving ' : 'Placing ') + name + ' · tap a spot';
    $('#mode-rotate').hidden = p.kind !== 'land';
  } else if (G.rt.tool === 'move' || G.rt.tool === 'remove') {
    mode.hidden = false; $('#mode-rotate').hidden = true;
    $('#mode-text').textContent = G.rt.tool === 'move' ? 'Move: tap something to pick it up' : 'Pick up: tap a building or decoration';
  } else mode.hidden = true;
}
