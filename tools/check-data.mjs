// =============================================================
//  CHECK-DATA — finds broken references in /data.
//
//      node tools/check-data.mjs
//
//  Checks that every item, seed, crop, character, quest, recipe,
//  blueprint, clue, animal, island and visual named anywhere in the
//  content actually exists. Prints each problem and exits with an
//  error code if there are any. Run it after editing /data.
// =============================================================

import { readFile } from 'node:fs/promises';
import { DATA } from '../data/index.js';

const problems = [];
const bad = (where, msg) => problems.push(`${where}: ${msg}`);
const has = (obj, k) => Object.prototype.hasOwnProperty.call(obj, k);

/** Is this reward/loot/stock key something the game can give? */
function keyOk(key) {
  if (key === 'coins' || key === 'seed:random_hybrid') return true;
  const [pre, rest] = key.includes(':') ? [key.slice(0, key.indexOf(':')), key.slice(key.indexOf(':') + 1)] : ['', key];
  switch (pre) {
    case '': return has(DATA.ITEMS, rest);
    case 'seed': case 'crop': return has(DATA.CROPS, rest) || has(DATA.LEGENDARIES, rest);
    case 'deco': return has(DATA.DECOR, rest);
    case 'bld': case 'bp': return has(DATA.BUILDINGS, rest);
    case 'land': return has(DATA.LAND, rest);
    case 'animal': return has(DATA.ANIMALS, rest);
    case 'recipe': return has(DATA.RECIPES, rest);
    case 'clue': return has(DATA.CLUES, rest);
    default: return false;
  }
}
const checkKey = (where, key) => { if (!keyOk(key)) bad(where, `unknown key "${key}"`); };
const checkKeys = (where, obj) => Object.keys(obj || {}).forEach(k => checkKey(where, k));

function checkNeeds(where, needs) {
  for (const n of needs || []) {
    if (n.item) checkKey(where, n.item);
    if (n.clue && !has(DATA.CLUES, n.clue)) bad(where, `unknown clue "${n.clue}"`);
    if (n.mix && n.mix.base && !has(DATA.BASES, n.mix.base)) bad(where, `unknown mix base "${n.mix.base}"`);
    (n.mix?.effects || []).forEach(e => { if (!has(DATA.EFFECTS, e)) bad(where, `unknown effect "${e}"`); });
    (n.crop?.rare || []).forEach(r => { if (!has(DATA.RARE_TRAITS, r)) bad(where, `unknown rare trait "${r}"`); });
  }
}

function checkMix(where, mix) {
  if (!mix) return;
  (mix.adds || []).forEach(e => { if (!has(DATA.EFFECTS, e)) bad(where, `mix adds unknown effect "${e}"`); });
  Object.entries(mix.transforms || {}).forEach(([a, b]) => [a, b].forEach(e => { if (!has(DATA.EFFECTS, e)) bad(where, `mix transform uses unknown effect "${e}"`); }));
}

// Painters that exist in js/art.js and visuals in js/render.js.
const art = await readFile(new URL('../js/art.js', import.meta.url), 'utf8');
const render = await readFile(new URL('../js/render.js', import.meta.url), 'utf8');
const portraitOk = (p) => art.includes(`case '${p}':`);
const visualOk = (v) => render.includes(`'${v}'`);

// ---- crops ----
for (const [id, c] of Object.entries({ ...DATA.CROPS, ...DATA.LEGENDARIES })) {
  const t = c.traits;
  if (!has(DATA.FLAVORS, t.flavor)) bad(`crop ${id}`, `unknown flavour "${t.flavor}"`);
  t.climates.forEach(cl => { if (!has(DATA.CLIMATES, cl)) bad(`crop ${id}`, `unknown climate "${cl}"`); });
  t.rare.forEach(r => { if (!has(DATA.RARE_TRAITS, r)) bad(`crop ${id}`, `unknown rare trait "${r}"`); });
  checkMix(`crop ${id}`, c.mix);
}
for (const [id, L] of Object.entries(DATA.LEGENDARIES)) {
  const r = L.requires;
  (r.rare || []).forEach(x => { if (!has(DATA.RARE_TRAITS, x)) bad(`legendary ${id}`, `requires unknown trait "${x}"`); });
  (r.lineage || []).forEach(x => { if (!has(DATA.CROPS, x)) bad(`legendary ${id}`, `lineage names unknown crop "${x}"`); });
  if (r.zone && !has(DATA.ZONES, r.zone)) bad(`legendary ${id}`, `unknown zone "${r.zone}"`);
  if (r.weather && !has(DATA.WEATHER, r.weather)) bad(`legendary ${id}`, `unknown weather "${r.weather}"`);
}
// Every buyable/findable base crop should have a source.
const seedSources = new Set();
Object.values(DATA.TRADERS).forEach(t => t.sells.forEach(s => s.key.startsWith('seed:') && seedSources.add(s.key.slice(5))));
Object.values(DATA.ISLANDS).forEach(I => I.spots.forEach(sp => (sp.pool || []).forEach(p => seedSources.add(p))));
Object.values(DATA.CHARACTERS).forEach(c => (c.shop || []).forEach(s => s.key.startsWith('seed:') && seedSources.add(s.key.slice(5))));
for (const id of Object.keys(DATA.CROPS)) if (!seedSources.has(id)) bad(`crop ${id}`, 'no trader, shop or island gives its seeds');

// ---- items & effects ----
for (const [id, i] of Object.entries(DATA.ITEMS)) checkMix(`item ${id}`, i.mix);
for (const c of DATA.COMBOS) [c.a, c.b, c.result].forEach(e => { if (!has(DATA.EFFECTS, e)) bad('combo', `unknown effect "${e}"`); });

// ---- animals ----
for (const [id, a] of Object.entries(DATA.ANIMALS)) {
  if (!has(DATA.BUILDINGS, a.home)) bad(`animal ${id}`, `unknown home "${a.home}"`);
  a.productEffects.forEach(e => { if (!has(DATA.EFFECTS, e)) bad(`animal ${id}`, `unknown effect "${e}"`); });
  if (!a.hive && !art.includes(`case '${id}':`)) bad(`animal ${id}`, 'no painter in js/art.js drawAnimal');
}
for (const [id, t] of Object.entries(DATA.ANIMAL_TRAITS)) if (t.effect && !has(DATA.EFFECTS, t.effect)) bad(`animal trait ${id}`, `unknown effect "${t.effect}"`);

// ---- characters & quests ----
for (const [id, c] of Object.entries(DATA.CHARACTERS)) {
  if (!portraitOk(c.portrait)) bad(`character ${id}`, `no portrait painter "${c.portrait}" in js/art.js`);
  (c.quests || []).forEach(q => { if (!has(DATA.QUESTS, q)) bad(`character ${id}`, `unknown quest "${q}"`); });
  (c.shop || []).forEach(s => checkKey(`character ${id} shop`, s.key));
  (c.loves?.keys || []).forEach(k => checkKey(`character ${id} loves`, k));
}
for (const [id, q] of Object.entries(DATA.QUESTS)) {
  if (!has(DATA.CHARACTERS, q.giver)) bad(`quest ${id}`, `unknown giver "${q.giver}"`);
  else if (!(DATA.CHARACTERS[q.giver].quests || []).includes(id)) bad(`quest ${id}`, `not listed in ${q.giver}'s quests`);
  checkNeeds(`quest ${id}`, q.needs);
  const r = q.reward || {};
  checkKeys(`quest ${id} reward`, r.items);
  (r.unlock || []).forEach(k => checkKey(`quest ${id} unlock`, k));
  if (r.clue && !has(DATA.CLUES, r.clue)) bad(`quest ${id}`, `unknown clue "${r.clue}"`);
}
DATA.CHAPTER_TWO.quests.forEach(q => { if (!has(DATA.QUESTS, q)) bad('CHAPTER_TWO', `unknown quest "${q}"`); });

// ---- islands, traders, story, recipes ----
for (const [id, I] of Object.entries(DATA.ISLANDS)) {
  if (I.zones !== '*') I.zones.forEach(z => { if (z !== '*' && !has(DATA.ZONES, z)) bad(`island ${id}`, `unknown zone "${z}"`); });
  for (const sp of I.spots) {
    const w = `island ${id} "${sp.label}"`;
    if (sp.item) checkKey(w, sp.item);
    (sp.pool || []).forEach(p => { if (!has(DATA.CROPS, p)) bad(w, `unknown seed "${p}"`); });
    (sp.loot || []).forEach(l => checkKey(w, l.key));
    if (sp.character && !has(DATA.CHARACTERS, sp.character)) bad(w, `unknown character "${sp.character}"`);
    if (sp.piece && !has(DATA.PIECES, sp.piece)) bad(w, `unknown piece "${sp.piece}"`);
  }
}
for (const [id, t] of Object.entries(DATA.TRADERS)) t.sells.forEach(s => checkKey(`trader ${id}`, s.key));
DATA.BEACON_STAGES.forEach((st, i) => checkNeeds(`beacon stage ${i + 1}`, st.needs));
for (const [id, r] of Object.entries(DATA.RECIPES)) checkKeys(`recipe ${id} output`, r.output);

// ---- festivals & events ----
const CONTESTS = [null, 'crop', 'mix', 'dye', 'product', 'giant', 'hybrid'];
const days = {};
for (const [id, f] of Object.entries(DATA.FESTIVALS)) {
  if (!CONTESTS.includes(f.contest ?? null)) bad(`festival ${id}`, `unknown contest "${f.contest}"`);
  checkKeys(`festival ${id} enter prize`, f.prizes.enter);
  checkKeys(`festival ${id} win prize`, f.prizes.win);
  const d = `${f.season}-${f.day}`;
  if (days[d]) bad(`festival ${id}`, `same day as ${days[d]}`); else days[d] = id;
}
for (const [id, e] of Object.entries(DATA.EVENTS)) {
  checkKeys(`event ${id}`, e.give);
  if (e.zones !== '*') e.zones.forEach(z => { if (!has(DATA.ZONES, z)) bad(`event ${id}`, `unknown zone "${z}"`); });
  if (e.weather && !has(DATA.WEATHER, e.weather)) bad(`event ${id}`, `unknown weather "${e.weather}"`);
  if (e.visual && !visualOk(e.visual)) bad(`event ${id}`, `visual "${e.visual}" isn't drawn in js/render.js`);
}

if (problems.length) {
  console.log(`${problems.length} problem(s) found:\n` + problems.map(p => '  • ' + p).join('\n'));
  process.exit(1);
}
console.log('All content references check out.');
