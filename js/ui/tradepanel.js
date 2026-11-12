// =============================================================
//  TRADE PANEL — sell to and buy from docked airships, and
//  hand in delivery requests.
// =============================================================

import { G } from '../state.js';
import { DATA } from '../../data/index.js';
import { itemInfo, sortedInventory } from '../items.js';
import { traderHere, sellPrice, sell, buy, canSellNow, fulfillDelivery } from '../trading.js';
import { hasBuilding } from '../island.js';
import { canFulfill, needText, haveCount, needQty } from '../needs.js';
import { iconURL, drawPortrait } from '../art.js';
import { openPanel, refreshPanel, h, itemTile, toast } from './ui.js';
import { audio } from '../audio.js';

let tab = 'sell';

export function openTrade() {
  if (!canSellNow() && !G.state.deliveries.length) {
    toast(hasBuilding('dock') ? 'No airship is docked right now. Check back tomorrow!' : 'No airship is docked. Building a Dock or Market Stall brings more traders.', 'warn');
    return;
  }
  const t = traderHere();
  openPanel({ id: 'trade', title: t ? DATA.TRADERS[t.id].ship : 'Market Stall', wide: true, render });
}

function render(body) {
  const t = traderHere();
  const def = t ? DATA.TRADERS[t.id] : null;
  if (def) {
    const cv = h('canvas', { width: 64, height: 64, class: 'portrait' });
    const ctx = cv.getContext('2d');
    // Traders share one portrait style tinted with their balloon colour.
    drawPortrait(ctx, null, 64, { name: def.name, color: def.balloon, portrait: 'trader' });
    body.append(h('div', { class: 'speaker' }, cv, h('div', {}, h('b', {}, def.name), h('div', { class: 'small' }, `"${def.greeting}"`))));
  } else if (canSellNow()) {
    body.append(h('p', { class: 'muted small' }, 'No airship docked. Your market stall sells at 70% of the usual price.'));
  }
  const tabs = [['sell', 'Sell'], def ? ['buy', 'Buy'] : null, ['deliver', `Deliveries (${G.state.deliveries.length})`]].filter(Boolean);
  body.append(h('div', { class: 'tabs' }, tabs.map(([id, l]) => h('button', { class: 'tab' + (tab === id ? ' on' : ''), onclick: () => { tab = id; refreshPanel(); } }, l))));
  if (tab === 'buy' && !def) tab = 'sell';

  if (tab === 'sell') {
    if (!canSellNow()) { body.append(h('p', { class: 'empty' }, 'Nobody to sell to right now.')); return; }
    const list = sortedInventory(i => !i.noSell && i.value > 0 && !['building'].includes(i.kind));
    body.append(h('p', { class: 'small muted' }, 'Prices drop if you sell lots of the same thing. Traders pay extra for what they love.'));
    body.append(h('div', { class: 'rows' }, list.map(i => {
      const p = sellPrice(i.key), base = i.value;
      const mood = p > base * 1.15 ? '💖' : p < base * 0.8 ? '😐' : '';
      return h('div', { class: 'trow' }, itemTile(i.key), h('div', { class: 'grow' }, h('b', {}, i.name), h('div', { class: 'small' }, `${p} 🐚 each ${mood}`)),
        h('button', { class: 'btn small gold', onclick: () => doSell(i.key, 1) }, 'Sell 1'),
        G.state.inv[i.key] > 1 ? h('button', { class: 'btn small ghost', onclick: () => doSell(i.key, G.state.inv[i.key]) }, 'All') : null);
    })));
  } else if (tab === 'buy') {
    body.append(h('div', { class: 'rows' }, t.stock.map(e => {
      const info = itemInfo(e.key);
      return h('div', { class: 'trow' + (e.stock ? '' : ' dim') },
        h('div', { class: 'item' }, h('img', { src: iconURL(info, 40), alt: '' })),
        h('div', { class: 'grow' }, h('b', {}, info.name), h('div', { class: 'small' }, `${e.price} 🐚 · ${e.stock} left`)),
        h('button', { class: 'btn small', disabled: !e.stock || G.state.coins < e.price, onclick: () => { if (buy(e)) { audio.sfx('coin'); toast(`Bought ${info.name}`); } refreshPanel(); } }, 'Buy'));
    })));
  } else {
    if (!G.state.deliveries.length) body.append(h('p', { class: 'empty' }, 'No delivery requests right now. Airships often bring them.'));
    body.append(h('div', { class: 'rows' }, G.state.deliveries.map(d => {
      const left = d.due - G.state.time.total;
      const ok = canFulfill([d.need]);
      return h('div', { class: 'trow' },
        h('div', { class: 'grow' }, h('b', {}, `"${d.text}"`),
          h('div', { class: 'small' }, `${DATA.TRADERS[d.trader].name} · ${needText(d.need)} (have ${haveCount(d.need)}/${needQty(d.need)}) · ${left <= 0 ? 'due today!' : left + ' days left'} · reward ${d.reward} 🐚`)),
        h('button', { class: 'btn small gold', disabled: !ok, onclick: () => { if (fulfillDelivery(d)) { audio.sfx('coin'); toast(`Delivered! +${d.reward} Shells`); } refreshPanel(); } }, 'Deliver'));
    })));
  }
}

function doSell(key, n) {
  const got = sell(key, n);
  if (got) { audio.sfx('coin'); toast(`+${got} Shells`); }
  refreshPanel();
}
