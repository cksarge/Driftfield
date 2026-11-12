// =============================================================
//  BUILD PANEL — buildings, decorations, land chunks, animals,
//  and the move / pick-up / paint tools.
// =============================================================

import { G } from '../state.js';
import { DATA } from '../../data/index.js';
import { itemInfo, sortedInventory } from '../items.js';
import { buildList } from '../buildings.js';
import { capacityFor, usedFor } from '../animals.js';
import { balance } from '../island.js';
import { openPanel, refreshPanel, closePanel, h, itemTile, toast, updateToolbar } from './ui.js';
import { startPlacing } from './bag.js';

let tab = 'buildings';

export function openBuild(startTab) {
  if (startTab) tab = startTab;
  openPanel({ id: 'build', title: 'Build & Decorate', wide: true, render });
}

function render(body) {
  const tabs = [['buildings', '🏠 Buildings'], ['decor', '🏮 Decor'], ['land', '🧩 Land'], ['animals', '🐑 Animals'], ['tools', '🖌️ Tools']];
  body.append(h('div', { class: 'tabs' }, tabs.map(([id, l]) => h('button', { class: 'tab' + (tab === id ? ' on' : ''), onclick: () => { tab = id; refreshPanel(); } }, l))));
  const bal = balance();
  if (bal.tilted) body.append(h('div', { class: 'note warn' }, '⚖️ Your island is tilting! Crops grow at half speed. Add a Lift Balloon on the heavy side or a Counterweight on the light side.'));

  if (tab === 'buildings') {
    body.append(h('div', { class: 'cards' }, buildList().map(({ id, def, unlocked, free, affordable }) => {
      const costText = free ? 'Free! (recovered)' : Object.entries(def.cost).map(([k, n]) => `${n} ${itemInfo(k).name}`).join(', ');
      return h('button', { class: 'card' + (unlocked || free ? '' : ' locked') + (affordable ? '' : ' dim'), onclick: () => {
        if (!unlocked && !free) { toast('Blueprint needed. Explore, help folks, and recover lost pieces!', 'warn'); return; }
        if (!affordable) { toast('Not enough materials yet.', 'warn'); return; }
        startPlacing('building', id, free);
      } },
      h('b', {}, (unlocked || free) ? def.name : '🔒 ' + def.name),
      h('div', { class: 'small' }, def.desc),
      h('div', { class: 'small muted' }, `${def.size[0]}×${def.size[1]} · ${costText}`),
      def.weight < 0 ? h('div', { class: 'small' }, '⬆️ Lifts the island') : null);
    })));
  } else if (tab === 'decor') {
    const owned = sortedInventory(i => i.kind === 'deco');
    body.append(h('p', { class: 'small muted' }, 'Decorations come from crafting, exploring, festivals and helping friends. Paint them with dyes in the Tools tab.'));
    body.append(owned.length ? h('div', { class: 'grid' }, owned.map(i => itemTile(i.key, { onclick: () => startPlacing('deco', i.key.slice(5)) })))
      : h('p', { class: 'empty' }, 'No decorations yet. Try crafting a fence or a path!'));
    const total = Object.keys(DATA.DECOR).length, seen = Object.keys(G.state.disc.decor).length;
    body.append(h('p', { class: 'small muted' }, `Decorations collected: ${seen}/${total}`));
  } else if (tab === 'land') {
    const owned = sortedInventory(i => i.kind === 'land');
    body.append(h('p', { class: 'small muted' }, 'Attach land chunks like puzzle pieces. They must touch your island. Press ⟳ while placing to rotate.'));
    body.append(owned.length ? h('div', { class: 'grid' }, owned.map(i => itemTile(i.key, { onclick: () => startPlacing('land', i.key.slice(5)) })))
      : h('p', { class: 'empty' }, 'No land chunks. Craft them from stone, clay and compost, or find them while exploring.'));
  } else if (tab === 'animals') {
    const owned = sortedInventory(i => i.kind === 'animal');
    body.append(h('div', { class: 'small' }, Object.entries(DATA.ANIMALS).filter(([id]) => id !== 'sky_bee').map(([id, a]) => `${a.name}: ${G.state.animals.filter(x => x.species === id).length}`).join(' · ')));
    body.append(h('div', { class: 'small muted' }, `Barn space ${usedFor('cloud_sheep')}/${capacityFor('cloud_sheep')} · Coop space ${usedFor('puff_hen')}/${capacityFor('puff_hen')} · Hives with bees ${G.state.objects.filter(o => o.ref === 'beehive' && o.data.bees).length}`));
    body.append(owned.length ? h('div', { class: 'grid' }, owned.map(i => itemTile(i.key, { onclick: () => startPlacing('animal', i.key.slice(7)) })))
      : h('p', { class: 'empty' }, 'No animals waiting. The Woolly Wagon airship sells them, and some lost animals are still out there…'));
  } else {
    const tool = (id, label, desc) => h('button', { class: 'card' + (G.rt.tool === id ? ' on' : ''), onclick: () => { G.rt.tool = id; G.rt.placing = null; closePanel(); updateToolbar(); } }, h('b', {}, label), h('div', { class: 'small' }, desc));
    body.append(h('div', { class: 'cards' },
      tool('move', '✋ Move', 'Pick up a building or decoration and put it somewhere else.'),
      tool('remove', '📦 Pick up', 'Decorations go back to your bag. Buildings refund half their materials.'),
      tool('roof', '🏠 Roof style', 'Tap a building to cycle its roof style.'),
      h('button', { class: 'card', onclick: () => { closePanel(); import('./bag.js').then(m => m.openBag('mix')); } }, h('b', {}, '🎨 Paint'), h('div', { class: 'small' }, 'Choose a dye in your bag, then tap things to colour them. Tap a roof to paint the roof.'))));
  }
}
