// =============================================================
//  JOURNAL — quests, Mix Journal, Seed Almanac, Discovery Log,
//  the drift map (with steering) and the Beacon & clues.
// =============================================================

import { G, totalDiscoveries } from '../state.js';
import { DATA } from '../../data/index.js';
import { getCrop, itemInfo, cropValue } from '../items.js';
import { canSteer, steer, zoneOpen, daysToNext } from '../navigation.js';
import { hasBuilding } from '../island.js';
import { canFulfill, needText, haveCount, needQty } from '../needs.js';
import { repairBeacon, currentStage, beaconDone, truthKnown } from '../story.js';
import { piecesFound, piecesTotal } from '../exploration.js';
import { iconURL } from '../art.js';
import { openPanel, refreshPanel, closePanel, h, fxChip, toast, showDialog, weatherIcon } from './ui.js';
import { openMixer } from './mixpanel.js';
import { audio } from '../audio.js';
import { hueToHex, esc } from '../utils.js';

let tab = 'quests', editing = null;
export function openJournal(startTab) {
  if (startTab) tab = startTab;
  openPanel({ id: 'journal', title: 'Journal', wide: true, render });
}

function render(body) {
  const tabs = [['quests', '📜 Quests'], ['mixes', '🧪 Mix Journal'], ['almanac', '🌱 Seed Almanac'], ['log', '⭐ Discoveries'], ['map', '🗺️ Map'], ['beacon', '🗼 Beacon']];
  body.append(h('div', { class: 'tabs' }, tabs.map(([id, l]) => h('button', { class: 'tab' + (tab === id ? ' on' : ''), onclick: () => { tab = id; refreshPanel(); } }, l))));
  ({ quests, mixes, almanac, log: discoveries, map, beacon })[tab](body);
}

// ---------------- quests ----------------
function quests(body) {
  const st = currentStage();
  body.append(h('div', { class: 'quest main' }, h('b', {}, '🗼 Main goal: Repair the Great Sky Beacon'),
    h('div', { class: 'small' }, beaconDone() ? 'The Beacon shines again! The sky is yours to explore.' : `Next: ${st.title}. Open the Beacon tab for details.`),
    h('div', { class: 'small muted' }, `Lost pieces recovered: ${piecesFound()}/${piecesTotal()}`)));
  const active = Object.keys(G.state.quests.active);
  body.append(h('h3', {}, 'Requests from friends'));
  if (!active.length) body.append(h('p', { class: 'empty' }, 'No requests yet. Meet people on passing islands.'));
  active.forEach(qid => {
    const q = DATA.QUESTS[qid];
    body.append(h('div', { class: 'quest' }, h('b', {}, q.title), h('span', { class: 'small muted' }, ` from ${DATA.CHARACTERS[q.giver].name}`),
      h('div', { class: 'small' }, q.desc),
      h('ul', { class: 'small' }, q.needs.map(n => h('li', {}, `${needText(n)} ${n.clue ? '' : `(${haveCount(n)}/${needQty(n)})`}`))),
      canFulfill(q.needs) ? h('div', { class: 'small ok' }, `Ready! Visit ${DATA.CHARACTERS[q.giver].name} to hand it over.`) : null));
  });
  body.append(h('h3', {}, 'Airship deliveries'));
  if (!G.state.deliveries.length) body.append(h('p', { class: 'empty' }, 'None right now.'));
  G.state.deliveries.forEach(d => body.append(h('div', { class: 'quest' }, h('b', {}, `"${d.text}"`),
    h('div', { class: 'small' }, `${DATA.TRADERS[d.trader].name} · ${needText(d.need)} (have ${haveCount(d.need)}) · ${Math.max(0, d.due - G.state.time.total)} days left · ${d.reward} 🐚`),
    h('div', { class: 'small muted' }, 'Deliver from the Trade menu (any time the stall or an airship is around).'))));
  const done = Object.keys(G.state.quests.done);
  if (done.length) body.append(h('p', { class: 'small muted' }, 'Completed: ' + done.map(q => DATA.QUESTS[q].title).join(', ')));
}

// ---------------- Mix Journal ----------------
function mixes(body) {
  const j = G.state.journal;
  body.append(h('p', { class: 'small muted' }, `${Object.keys(G.state.disc.mixes).length} products discovered · ${Object.keys(G.state.disc.effects).length}/${Object.keys(DATA.EFFECTS).length} effects found. Tap Repeat to load a recipe into the Mixing Station.`));
  if (!j.length) { body.append(h('p', { class: 'empty' }, 'Your Mix Journal is empty. Make something at the Mixing Station!')); return; }
  body.append(h('div', { class: 'rows' }, j.map(e => {
    const info = itemInfo(e.item);
    return h('div', { class: 'trow' },
      h('div', { class: 'item' }, h('img', { src: iconURL(info, 40), alt: '' })),
      h('div', { class: 'grow' }, editing === e.recipe ? renameBox(e) : h('b', {}, e.name), h('div', { class: 'fx', html: (info.effects || []).map(fxChip).join('') }),
        h('div', { class: 'small muted' }, DATA.BASES[e.base].name + ' → ' + e.steps.map(k => itemInfo(k).name).join(' → ') + ` · made ${e.made}×`)),
      h('button', { class: 'btn small ghost', title: 'Rename', onclick: () => { editing = e.recipe; refreshPanel(); } }, '✏️'),
      h('button', { class: 'btn small', onclick: () => { closePanel(); openMixer(e); } }, 'Repeat'));
  })));
}

/** Inline text box for naming a creation. */
function renameBox(e) {
  const save = (el) => { const v = el.value.trim(); if (v) e.name = v.slice(0, 40); editing = null; refreshPanel(); };
  const input = h('input', { class: 'rename', value: e.name, maxlength: 40, 'aria-label': 'Name this creation',
    onkeydown: (ev) => { if (ev.key === 'Enter') save(ev.target); if (ev.key === 'Escape') { editing = null; refreshPanel(); } },
    onblur: (ev) => { if (editing) save(ev.target); } });
  setTimeout(() => { input.focus(); input.select(); }, 0);
  return input;
}

// ---------------- Seed Almanac ----------------
function almanac(body) {
  const disc = G.state.disc.crops;
  const all = [...Object.keys(DATA.CROPS), ...Object.keys(G.state.reg.crops), ...Object.keys(DATA.LEGENDARIES)];
  const base = Object.keys(DATA.CROPS).filter(id => disc[id]).length;
  const hyb = Object.keys(G.state.reg.crops).filter(id => disc[id]).length;
  const leg = Object.keys(DATA.LEGENDARIES).filter(id => disc[id]).length;
  body.append(h('p', { class: 'small muted' }, `Base crops ${base}/${Object.keys(DATA.CROPS).length} · Hybrids bred ${hyb} · Legendary ${leg}/${Object.keys(DATA.LEGENDARIES).length}`));
  body.append(h('div', { class: 'almanac' }, all.map(id => {
    const c = getCrop(id);
    if (!disc[id]) {
      if (DATA.LEGENDARIES[id]) return h('div', { class: 'acard secret' }, h('b', {}, '??? (Legendary)'), h('div', { class: 'small' }, h('i', {}, DATA.LEGENDARIES[id].hint)));
      if (DATA.CROPS[id]) return h('div', { class: 'acard secret' }, h('b', {}, '???'), h('div', { class: 'small muted' }, 'Undiscovered crop'));
      return null;
    }
    const t = c.traits;
    return h('div', { class: 'acard' + (c.legendary ? ' legend' : '') },
      h('div', { class: 'row' }, h('img', { src: iconURL(itemInfo('crop:' + id), 40), alt: '' }), h('div', {}, h('b', {}, c.name), h('div', { class: 'small muted' }, c.legendary ? 'Legendary' : c.hybrid ? `Hybrid · generation ${c.gen}` : 'Base crop'))),
      h('div', { class: 'small' }, c.desc || ''),
      h('div', { class: 'traits small' },
        h('span', { class: 'chip', style: `--c:${hueToHex(t.hue, 65, 58)}` }, 'Colour'),
        h('span', {}, `Size ${t.size}`), h('span', {}, DATA.FLAVORS[t.flavor].name), h('span', {}, `${t.growth}d`), h('span', {}, `Yield ${t.yield}`),
        h('span', {}, t.climates.map(cl => DATA.CLIMATES[cl].name).join('/')),
        t.rare.map(r => h('span', { class: 'rare' }, DATA.RARE_TRAITS[r].name))),
      c.parents ? h('div', { class: 'small muted' }, 'Parents: ' + c.parents.map(p => (getCrop(p) || { name: '?' }).name).join(' × ')) : null,
      h('div', { class: 'small muted' }, `Worth ${cropValue(c)} 🐚 each`));
  })));
}

// ---------------- Discovery Log ----------------
function discoveries(body) {
  const d = G.state.disc;
  const cat = (label, cur, total, note) => {
    const pct = total ? Math.round((cur / total) * 100) : null;
    return h('div', { class: 'logrow' }, h('b', {}, label), h('div', { class: 'bar' }, h('div', { style: `width:${pct ?? 100}%` })), h('span', { class: 'small' }, total ? `${cur}/${total} (${pct}%)` : `${cur} ${note || ''}`));
  };
  const animalTotal = Object.values(DATA.ANIMALS).reduce((s, a) => s + 1 + a.patterns.length, 0);
  const hiddenRecipes = Object.values(DATA.RECIPES).filter(r => !r.known).length;
  body.append(h('p', {}, `Total discoveries: ${totalDiscoveries()}`));
  body.append(h('div', { class: 'log' },
    cat('Base & legendary crops', Object.keys(d.crops).filter(id => DATA.CROPS[id] || DATA.LEGENDARIES[id]).length, Object.keys(DATA.CROPS).length + Object.keys(DATA.LEGENDARIES).length),
    cat('Hybrid varieties', Object.keys(d.crops).filter(id => G.state.reg.crops[id]).length, 0, 'bred, endless more to find'),
    cat('Effects', Object.keys(d.effects).length, Object.keys(DATA.EFFECTS).length),
    cat('Mixed products', Object.keys(d.mixes).length, 0, 'invented, thousands possible'),
    cat('Animals & coats', Object.keys(d.animals).length, animalTotal),
    cat('Islands visited', Object.keys(d.islands).length, Object.keys(DATA.ISLANDS).length),
    cat('Zones', Object.keys(d.zones).length, Object.keys(DATA.ZONES).length),
    cat('Characters', Object.keys(d.characters).length, Object.keys(DATA.CHARACTERS).length),
    cat('Recipes discovered', Object.keys(d.recipes).length + Object.keys(G.state.recipesKnown).filter(r => !d.recipes[r]).length, hiddenRecipes),
    cat('Blueprints', Object.keys(d.blueprints).length, Object.values(DATA.BUILDINGS).filter(b => b.blueprint).length),
    cat('Decorations', Object.keys(d.decor).length, Object.keys(DATA.DECOR).length),
    cat('Lost pieces recovered', Object.keys(d.pieces).length, Object.keys(DATA.PIECES).length),
    cat('Clues', Object.keys(d.clues).length, Object.keys(DATA.CLUES).length),
    cat('Secrets & surprises', Object.keys(d.secrets).length, 0, 'found…')));
  const recent = Object.entries(d.pieces).map(([id]) => DATA.PIECES[id].name);
  if (recent.length) body.append(h('p', { class: 'small' }, '💛 Recovered: ' + recent.join(', ')));
}

// ---------------- Map ----------------
function map(body) {
  const s = G.state, nav = s.nav, Z = DATA.ZONES;
  const steerable = canSteer() || s.phase === 'tutorial';
  body.append(h('p', { class: 'small' }, `Now: ${Z[nav.zone].name}. Drifting to ${Z[nav.next].name}${s.phase === 'main' ? ` in about ${daysToNext()} day(s)` : ''}.`));
  body.append(h('p', { class: 'small muted' }, steerable ? 'Tap a glowing neighbour zone to steer toward it.' : 'Build Sky Sails and a Rudder to steer your island. Until then, you follow the wind.'));
  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', '-8 -6 116 112'); svg.setAttribute('class', 'map');
  const seen = s.disc.zones;
  const drawn = new Set();
  for (const [id, z] of Object.entries(Z)) for (const nb of z.neighbors) {
    const k = [id, nb].sort().join('-'); if (drawn.has(k)) continue; drawn.add(k);
    const a = z.pos, b = Z[nb].pos, l = document.createElementNS(svgNS, 'line');
    l.setAttribute('x1', a[0]); l.setAttribute('y1', a[1]); l.setAttribute('x2', b[0]); l.setAttribute('y2', b[1]);
    l.setAttribute('class', 'route' + (z.rare || Z[nb].rare ? ' rare' : '') + ((id === nav.zone && nb === nav.next) || (nb === nav.zone && id === nav.next) ? ' next' : ''));
    svg.append(l);
  }
  for (const [id, z] of Object.entries(Z)) {
    const g = document.createElementNS(svgNS, 'g');
    const known = seen[id] || !z.rare || id === nav.zone;
    const isNeighbor = Z[nav.zone].neighbors.includes(id);
    const can = steerable && isNeighbor && zoneOpen(id);
    g.setAttribute('class', 'zone' + (id === nav.zone ? ' here' : '') + (id === nav.next ? ' next' : '') + (can ? ' can' : '') + (z.rare ? ' rare' : ''));
    const c = document.createElementNS(svgNS, 'circle');
    c.setAttribute('cx', z.pos[0]); c.setAttribute('cy', z.pos[1]); c.setAttribute('r', id === nav.zone ? 7 : 5.5);
    c.setAttribute('fill', known ? z.sky[0] : '#bbb');
    const t = document.createElementNS(svgNS, 'text');
    t.setAttribute('x', z.pos[0]); t.setAttribute('y', z.pos[1] + 11); t.textContent = known ? z.name : '???';
    g.append(c, t);
    if (id === nav.zone) { const p = document.createElementNS(svgNS, 'text'); p.setAttribute('x', z.pos[0]); p.setAttribute('y', z.pos[1] + 2.2); p.setAttribute('class', 'pin'); p.textContent = '🏝'; g.append(p); }
    if (can) g.addEventListener('click', () => {
      const err = steer(id);
      if (err) toast(err, 'warn'); else { audio.sfx('whoosh'); toast(`Steering toward ${z.name}.`); refreshPanel(); }
    });
    const tt = document.createElementNS(svgNS, 'title'); tt.textContent = known ? `${z.name}: ${z.desc}` : 'An unknown zone… maybe only in certain seasons.';
    g.append(tt);
    svg.append(g);
  }
  body.append(svg);
  // Forecast
  if (hasBuilding('weather_vane') || s.phase === 'tutorial') {
    body.append(h('div', { class: 'forecast' }, h('b', {}, 'Forecast: '), `Today ${weatherIcon(s.weather.today)} `, s.weather.forecast.map((w, i) => h('span', { title: DATA.WEATHER[w].name }, ` · Day +${i + 1} ${weatherIcon(w)}${w === 'storm' ? ' ⚠️' : ''}`))));
  } else body.append(h('p', { class: 'small muted' }, 'Build a Weather Vane to see the 3-day forecast.'));
  body.append(h('div', { class: 'zoneinfo small' }, h('b', {}, Z[nav.zone].name + ': '), Z[nav.zone].desc));
}

// ---------------- Beacon & clues ----------------
function beacon(body) {
  const s = G.state;
  body.append(h('div', { class: 'stages' }, DATA.BEACON_STAGES.map((st, i) => h('div', { class: 'stage' + (i < s.story.stage ? ' done' : i === s.story.stage ? ' now' : '') }, `${i < s.story.stage ? '✓' : i + 1}. ${st.title}`))));
  if (beaconDone()) body.append(h('div', { class: 'quest main' }, h('b', {}, 'The Great Sky Beacon shines!'), h('p', { class: 'small' }, 'The sky is calm. Keep exploring: endless islands, crops and mixes are still out there.')));
  else {
    const st = currentStage();
    const ok = canFulfill(st.needs);
    body.append(h('div', { class: 'quest main' }, h('b', {}, st.title), h('div', { class: 'small' }, st.desc),
      h('ul', { class: 'small' }, st.needs.map(n => h('li', {}, `${needText(n)} (${haveCount(n)}/${needQty(n)})`))),
      h('button', { class: 'btn gold', disabled: !ok, onclick: () => {
        if (repairBeacon()) { audio.chime(); toast('Beacon repaired a little more!'); showDialog('wendell', [st.say]); refreshPanel(); }
      } }, ok ? 'Send materials to the Beacon' : 'Gather what\'s needed')));
  }
  body.append(h('h3', {}, `Clues about the storm (${Object.keys(s.disc.clues).length}/${Object.keys(DATA.CLUES).length})`));
  if (!Object.keys(s.disc.clues).length) body.append(h('p', { class: 'empty' }, 'No clues yet. Chests, characters and strange events might know something.'));
  for (const id of Object.keys(s.disc.clues)) {
    const c = DATA.CLUES[id];
    body.append(h('div', { class: 'clue' }, h('b', {}, c.title), h('div', { class: 'small', html: esc(c.text) })));
  }
  if (truthKnown()) body.append(h('div', { class: 'quest main' }, h('b', {}, 'The truth'), h('p', { class: 'small' }, DATA.TRUTH)));
}
