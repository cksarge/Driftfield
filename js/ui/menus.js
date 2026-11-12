// =============================================================
//  MENUS — title screen, settings, customisation, festivals,
//  and small interaction menus (animals, buildings, windmill).
// =============================================================

import { G } from '../state.js';
import { DATA } from '../../data/index.js';
import { itemInfo, count } from '../items.js';
import { slotSummaries, latestSlot, deleteSlot, exportSlot, exportSave, importSaveFile, saveGame, saveSettings, storageAvailable } from '../save.js';
import { unlocked, unlockText, palette } from '../customize.js';
import { todayFestival, attend, contestEntries, enterContest, festivalRecord, entryScore } from '../festivals.js';
import { feed, collect, isFood, collectHive } from '../animals.js';
import { repairWindmill, WINDMILL_REPAIR, cycleRoof } from '../buildings.js';
import { drawPlayer, drawFlag } from '../art.js';
import { openPanel, refreshPanel, closePanel, h, $, toast, pickItem, confirmBox, itemTile, showDialog } from './ui.js';
import { audio } from '../audio.js';

// Hooks set by main.js so menus can start/load games without circular imports.
export const hooks = { newGame: null, loadGame: null, toTitle: null, sleep: null };

// ---------------- title screen ----------------
export function showTitle() {
  const el = $('#title');
  el.hidden = false;
  document.body.classList.add('on-title');
  $('#hud').hidden = true; $('#toolbar').hidden = true; $('#sidebar').hidden = true;
  renderTitle();
}
export function hideTitle() {
  $('#title').hidden = true;
  document.body.classList.remove('on-title');
  $('#hud').hidden = false; $('#toolbar').hidden = false; $('#sidebar').hidden = false;
}

function renderTitle(view = 'main') {
  const box = $('#title-menu');
  box.innerHTML = '';
  const latest = latestSlot();
  if (view === 'main') {
    if (latest !== null) box.append(h('button', { class: 'btn big', onclick: () => { audio.unlock(); hooks.loadGame(latest); } }, '▶ Continue'));
    box.append(h('button', { class: 'btn big' + (latest === null ? '' : ' ghost'), onclick: () => renderTitle('new') }, '✦ New Game'));
    box.append(h('button', { class: 'btn ghost', onclick: () => renderTitle('slots') }, '📂 Save Slots'));
    box.append(h('button', { class: 'btn ghost', onclick: () => { audio.unlock(); openSettings(true); } }, '⚙️ Settings'));
    if (!storageAvailable()) box.append(h('p', { class: 'small warn' }, 'Browser storage is unavailable, so progress lasts only this session. Use Export Save to keep it!'));
  } else if (view === 'new') {
    const slots = slotSummaries();
    let chosen = (slots.find(s => s.empty) || slots[0]).slot;
    const name = h('input', { class: 'text', maxlength: 24, placeholder: 'Name your island', value: '' });
    const slotRow = h('div', { class: 'slotpick' }, slots.map(s => h('label', {},
      h('input', { type: 'radio', name: 'slot', value: s.slot, checked: s.slot === chosen, onchange: () => { chosen = s.slot; } }),
      ` Slot ${s.slot + 1}: ${s.empty ? 'empty' : s.name + ' (will be replaced)'}`)));
    const start = async (skip) => {
      audio.unlock();
      const sum = slots[chosen];
      if (!sum.empty && !(await confirmBox(`Replace "${sum.name}" in slot ${chosen + 1}? This can't be undone.`, 'Replace'))) return;
      hooks.newGame(chosen, name.value.trim() || 'Driftfield', skip);
    };
    box.append(h('h3', {}, 'A new island'), name, slotRow,
      h('button', { class: 'btn big', onclick: () => start(false) }, 'Begin (with the story)'),
      h('button', { class: 'btn ghost', onclick: () => start(true) }, 'Skip the tutorial'),
      h('button', { class: 'btn ghost small', onclick: () => renderTitle('main') }, '← Back'));
  } else if (view === 'slots') {
    const file = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
    let importSlot = 0;
    file.addEventListener('change', async () => {
      if (!file.files[0]) return;
      const ok = await importSaveFile(file.files[0], importSlot);
      toast(ok ? `Imported into slot ${importSlot + 1}!` : 'That file isn\'t a Driftfield save.', ok ? '' : 'warn');
      renderTitle('slots');
    });
    box.append(h('h3', {}, 'Save slots'), file);
    slotSummaries().forEach(s => box.append(h('div', { class: 'slot-card' },
      h('div', { class: 'grow' }, h('b', {}, `Slot ${s.slot + 1}: ${s.empty ? 'Empty' : s.name}`), s.empty ? null : h('div', { class: 'small muted' }, `${s.label} · ${s.coins} 🐚 · Beacon ${s.beacon}/${DATA.BEACON_STAGES.length}`)),
      s.empty ? null : h('button', { class: 'btn small', onclick: () => { audio.unlock(); hooks.loadGame(s.slot); } }, 'Play'),
      s.empty ? null : h('button', { class: 'btn small ghost', onclick: () => exportSlot(s.slot) }, 'Export'),
      h('button', { class: 'btn small ghost', onclick: async () => {
        if (!s.empty && !(await confirmBox(`Importing will replace "${s.name}". Continue?`, 'Choose file'))) return;
        importSlot = s.slot; file.click();
      } }, 'Import'),
      s.empty ? null : h('button', { class: 'btn small ghost danger', onclick: async () => { if (await confirmBox(`Delete "${s.name}" forever?`, 'Delete')) { deleteSlot(s.slot); renderTitle('slots'); } } }, '🗑'))));
    box.append(h('button', { class: 'btn ghost small', onclick: () => renderTitle('main') }, '← Back'));
  }
}

// ---------------- settings ----------------
export function openSettings(fromTitle = false) {
  openPanel({ id: 'settings', title: 'Settings', render: (body) => {
    const s = G.settings;
    const range = (label, key) => h('label', { class: 'setting' }, h('span', {}, label),
      h('input', { type: 'range', min: 0, max: 1, step: 0.05, value: s[key], oninput: (e) => { s[key] = Number(e.target.value); audio.applyVolume(); saveSettings(); } }));
    body.append(
      range('Music', 'music'), range('Sound effects', 'sfx'),
      h('label', { class: 'setting' }, h('span', {}, 'Mute everything'), h('input', { type: 'checkbox', checked: s.muted, onchange: (e) => { s.muted = e.target.checked; audio.applyVolume(); saveSettings(); } })),
      h('label', { class: 'setting' }, h('span', {}, 'Graphics'), select(['high', 'low'], s.quality, (v) => { s.quality = v; saveSettings(); window.dispatchEvent(new Event('resize')); }, { high: 'Pretty', low: 'Fast (fewer clouds & particles)' })),
      h('label', { class: 'setting' }, h('span', {}, 'Game speed'), select(['0.5', '1', '2', '3'], String(s.speed), (v) => { s.speed = Number(v); saveSettings(); }, { 0.5: 'Relaxed (½×)', 1: 'Normal', 2: 'Brisk (2×)', 3: 'Speedy (3×)' })),
      h('label', { class: 'setting' }, h('span', {}, 'Gentle hints from Wendell'), h('input', { type: 'checkbox', checked: s.hints, onchange: (e) => { s.hints = e.target.checked; saveSettings(); } })));
    if (!fromTitle && G.state && G.state.phase === 'main') {
      const file = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
      file.addEventListener('change', async () => {
        if (!file.files[0]) return;
        const slot = G.state.slot;
        const ok = await importSaveFile(file.files[0], slot);
        if (ok) { toast('Save imported!'); closePanel(); hooks.loadGame(slot); } else toast('That file isn\'t a Driftfield save.', 'warn');
      });
      body.append(h('h3', {}, 'Your save'), file,
        h('div', { class: 'row wrap' },
          h('button', { class: 'btn', onclick: () => { saveGame(); toast('Saved!'); } }, '💾 Save now'),
          h('button', { class: 'btn ghost', onclick: () => exportSave() }, '⬇️ Export Save'),
          h('button', { class: 'btn ghost', onclick: async () => { if (await confirmBox('Import a save file into this slot? Your current island here will be replaced.', 'Choose file')) file.click(); } }, '⬆️ Import Save')),
        h('p', { class: 'small muted' }, `Slot ${G.state.slot + 1} · saves automatically every morning and when you leave.`),
        h('button', { class: 'btn ghost', onclick: () => { saveGame(); closePanel(); hooks.toTitle(); } }, '🏠 Back to title screen'));
    }
    body.append(h('p', { class: 'small muted' }, 'Driftfield works offline once loaded. Install it from your browser menu ("Install app" / "Add to Home Screen").'));
  } });
}

function select(options, value, onchange, labels = {}) {
  const sel = h('select', { onchange: (e) => onchange(e.target.value) }, options.map(o => h('option', { value: o, selected: o === value }, labels[o] || o)));
  return sel;
}

// ---------------- customise ----------------
export function openCustomize() {
  openPanel({ id: 'customize', title: 'Customize', wide: true, render: (body) => {
    const p = G.state.player;
    const cv = h('canvas', { width: 120, height: 140, class: 'preview' });
    const ctx = cv.getContext('2d');
    ctx.save(); ctx.translate(60, 105); ctx.scale(2.6, 2.6); drawPlayer(ctx, { ...p, x: 0, y: 0 }, 0, false); ctx.restore();
    const flagCv = h('canvas', { width: 120, height: 80, class: 'preview' });
    drawFlag(flagCv.getContext('2d'), 10, 10, 100, 60, G.state.flag, 0);
    const pal = palette();
    const swatches = (cur, set) => h('div', { class: 'swatches' }, pal.map(c => h('button', { class: 'sw' + (c === cur ? ' on' : ''), style: `background:${c}`, title: c, onclick: () => { set(c); refreshPanel(); } })));
    const choice = (map, cur, set) => h('div', { class: 'choices' }, Object.entries(map).map(([id, o]) => {
      const ok = unlocked(o.unlock);
      return h('button', { class: 'chip-btn' + (id === cur ? ' on' : '') + (ok ? '' : ' locked'), title: ok ? o.name : 'Unlock: ' + unlockText(o.unlock), onclick: () => { if (!ok) { toast('Locked: ' + unlockText(o.unlock), 'warn'); return; } set(id); refreshPanel(); } }, (ok ? '' : '🔒 ') + o.name);
    }));
    body.append(h('div', { class: 'cust' },
      h('div', { class: 'col' }, cv,
        h('h4', {}, 'Outfit'), choice(DATA.OUTFITS, p.outfit, v => { p.outfit = v; }),
        h('h4', {}, 'Hat'), choice(DATA.HATS, p.hat, v => { p.hat = v; }),
        h('h4', {}, 'Top colour'), swatches(p.colors.top, c => { p.colors.top = c; }),
        h('h4', {}, 'Trousers'), swatches(p.colors.bottom, c => { p.colors.bottom = c; }),
        h('h4', {}, 'Hat colour'), swatches(p.colors.hat, c => { p.colors.hat = c; }),
        h('h4', {}, 'Skin'), h('div', { class: 'swatches' }, DATA.SKIN_TONES.map(c => h('button', { class: 'sw' + (c === p.colors.skin ? ' on' : ''), style: `background:${c}`, onclick: () => { p.colors.skin = c; refreshPanel(); } })))),
      h('div', { class: 'col' }, flagCv,
        h('h4', {}, 'Flag pattern'), h('div', { class: 'choices' }, DATA.FLAG_PATTERNS.map(pt => h('button', { class: 'chip-btn' + (G.state.flag.pattern === pt ? ' on' : ''), onclick: () => { G.state.flag.pattern = pt; refreshPanel(); } }, pt))),
        h('h4', {}, 'Flag colours'), swatches(G.state.flag.c1, c => { G.state.flag.c1 = c; }), swatches(G.state.flag.c2, c => { G.state.flag.c2 = c; }),
        h('h4', {}, 'Sail colour'), swatches(G.state.sail, c => { G.state.sail = c; }),
        h('h4', {}, 'Lift balloon colour'), swatches(G.state.balloon, c => { G.state.balloon = c; }),
        h('p', { class: 'small muted' }, 'Every dye you make adds a new colour here. Paint buildings with dyes from your bag.'))));
  } });
}

// ---------------- festivals ----------------
export function openFestival() {
  const id = todayFestival();
  if (!id) return;
  const f = DATA.FESTIVALS[id];
  audio.setMood('festival');
  openPanel({ id: 'festival', title: '🎉 ' + f.name, wide: true, onClose: () => audio.setMood('calm'), render: (body) => {
    const rec = festivalRecord(id);
    body.append(h('p', {}, f.desc));
    if (!rec.attended) body.append(h('button', { class: 'btn gold', onclick: () => { attend(id); audio.sfx('discover'); toast('You joined the festival! Gifts received.'); refreshPanel(); } }, 'Join the festival'));
    else body.append(h('p', { class: 'small ok' }, '✓ You\'re at the festival. Enjoy!'));
    if (f.contest) {
      body.append(h('h3', {}, `Contest: best ${f.contest}`));
      if (rec.entered) body.append(h('p', {}, rec.won ? '🏆 You won! Prizes are in your bag.' : 'The judges loved your entry, but someone else took the ribbon this year. Next year!'));
      else {
        const entries = contestEntries(id);
        if (!entries.length) body.append(h('p', { class: 'empty' }, `You have no ${f.contest} to enter. The more effects and rarer the traits, the better!`));
        body.append(h('div', { class: 'grid' }, entries.map(i => itemTile(i.key, { label: `★${entryScore(i.key)}`, onclick: async () => {
          if (!(await confirmBox(`Enter your ${i.name}? (Judges score it about ${entryScore(i.key)}.)`, 'Enter'))) return;
          const r = enterContest(id, i.key);
          if (r) { audio.sfx(r.won ? 'discover' : 'soft'); toast(r.won ? 'You won the contest!' : 'A fine effort!'); }
          refreshPanel();
        } }))));
      }
    } else if (f.special === 'starfall') body.append(h('p', { class: 'small' }, 'After 7 pm, tap the falling stars in the sky to catch them!'));
  } });
}

// ---------------- animals ----------------
export function openAnimalMenu(a) {
  const def = DATA.ANIMALS[a.species];
  if (a.ready) {
    const key = collect(a);
    audio.sfx('harvest'); toast(`Collected ${itemInfo(key).name}!`);
    return;
  }
  openPanel({ id: 'animal', title: `${a.name} the ${def.name}`, render: (body) => {
    const hearts = '♥'.repeat(a.happy) + '♡'.repeat(5 - a.happy);
    body.append(h('p', { class: 'small' }, def.desc),
      h('div', { class: 'small' }, `Happiness: ${hearts} · Coat: ${a.pattern}${a.baby ? ` · Baby (grows up in ${a.baby} days)` : ''}`),
      h('div', { class: 'small muted' }, a.fed ? `Ate ${a.fed.name} today. Makes ${def.product.toLowerCase()} every ${def.every} day(s).` : `Hungry! What it eats changes its ${def.product.toLowerCase()}.`));
    if (!a.fed && !a.baby) body.append(h('button', { class: 'btn', onclick: async () => {
      const key = await pickItem(`Feed ${a.name}`, i => isFood(i.key), 'No food! Crops, mixes and foraged goods all work.');
      if (!key) return;
      const err = feed(a, key);
      if (err) toast(err, 'warn'); else { audio.sfx(a.species === 'cloud_sheep' ? 'baa' : 'soft'); toast(`${a.name} munches happily.`); }
      closePanel();
    } }, '🥕 Feed'));
    body.append(h('button', { class: 'btn ghost small', onclick: () => {
      showDialog('wendell', [`${a.name} looks ${a.happy >= 4 ? 'very content' : a.happy >= 2 ? 'alright' : 'a bit glum'}. ${a.happy < 3 ? 'Feeding every day keeps animals happy, and happy animals have babies.' : 'Happy animals sometimes have babies with surprising coats!'}`]);
    } }, 'How are they?'));
  } });
}

// ---------------- buildings ----------------
export function openBuildingMenu(o, actions) {
  const def = DATA.BUILDINGS[o.ref];
  if (o.ref === 'windmill' && o.broken) {
    openPanel({ id: 'windmill', title: 'The Old Windmill', render: (body) => {
      body.append(h('p', {}, 'It survived the storm with you. Cracked, missing a sail, but still standing.'),
        h('p', { class: 'small' }, 'Repair needs: ' + Object.entries(WINDMILL_REPAIR).map(([k, n]) => `${n} ${itemInfo(k).name} (${count(k)})`).join(', ')),
        h('p', { class: 'small muted' }, 'Once repaired it powers machines: sprinklers reach farther and the mill makes compost.'),
        h('button', { class: 'btn gold', onclick: () => {
          const err = repairWindmill(o);
          if (err) { toast(err, 'warn'); audio.sfx('error'); return; }
          audio.chime(); closePanel(); showDialog('wendell', ['Listen… it\'s turning! It\'s TURNING! Oh, I\'m spinning too. This is wonderful.']);
        } }, 'Repair the windmill'));
    } });
    return;
  }
  if (o.ref === 'beehive' && o.data.ready) { const k = collectHive(o); audio.sfx('harvest'); toast(`Collected ${itemInfo(k).name}!`); return; }
  openPanel({ id: 'building', title: def.name, render: (body) => {
    body.append(h('p', { class: 'small' }, def.desc));
    if (o.ref === 'beehive') body.append(h('p', { class: 'small muted' }, o.data.bees ? 'Busy bees! Honey every 2 days, flavoured by flowers within 3 tiles.' : 'No bees yet. Buy sky bees from the Humblebee airship and tap this hive while placing them.'));
    body.append(h('div', { class: 'row wrap' }, actions.map(([label, fn]) => h('button', { class: 'btn', onclick: () => { closePanel(); fn(); } }, label)),
      def.roofs && def.roofs.length > 1 ? h('button', { class: 'btn ghost', onclick: () => { cycleRoof(o); refreshPanel(); toast('Roof: ' + DATA.ROOF_STYLES[o.roof].name); } }, '🏠 Change roof') : null));
  } });
}

