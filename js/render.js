// =============================================================
//  RENDER — draws the sky, the island and all effects each frame.
//
//  Layers, back to front:
//    sky gradient → sun/moon/stars → the Great Sky Beacon →
//    far clouds → passing islands & airships → YOUR ISLAND
//    (underside, ground, then everything sorted by depth) →
//    near clouds → weather → night lighting → screen effects.
// =============================================================

import { G } from './state.js';
import { DATA } from '../data/index.js';
import { TILE, drawBuilding, drawDeco, drawCrop, drawAnimal, drawPlayer, drawAirship, drawUnderside, cloud, star, rr } from './art.js';
import { allTiles, bounds, balance, isLand, objectDef, shapeCells, canPlaceLand, areaFree, tileAt } from './island.js';
import { getCrop } from './items.js';
import { nightAmount, absMinutes } from './time.js';
import { beaconGlow } from './story.js';
import { traderHere } from './trading.js';
import { nearbyIslands } from './exploration.js';
import { tutorialDarkness, fragmentOffset } from './tutorial.js';
import { isStarfallNight } from './festivals.js';
import { hasBuff } from './mixing.js';
import { mixHex, shade, rand, clamp, lerp, hexToRgb } from './utils.js';

let canvas, ctx, lightCv, lightCtx, W = 0, H = 0, DPR = 1;
const clouds = [], particles = [], birds = [];

export function initRender(cv) {
  canvas = cv; ctx = cv.getContext('2d');
  lightCv = document.createElement('canvas'); lightCtx = lightCv.getContext('2d');
  resize();
  window.addEventListener('resize', resize);
  for (let i = 0; i < 26; i++) clouds.push(newCloud(true));
}

function resize() {
  DPR = Math.min(window.devicePixelRatio || 1, G.settings.quality === 'low' ? 1 : 2);
  W = window.innerWidth; H = window.innerHeight;
  canvas.width = W * DPR; canvas.height = H * DPR;
  canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
  lightCv.width = W; lightCv.height = H;
}
export const viewSize = () => ({ W, H });

function newCloud(anywhere) {
  const layer = Math.random() < 0.6 ? 0 : 1;          // 0 far, 1 near (below island)
  return { x: anywhere ? rand(-200, W + 200) : -260, y: layer ? rand(H * 0.78, H * 1.1) : rand(-20, H * 0.9), s: layer ? rand(0.9, 2.2) : rand(0.4, 1.1), layer, speed: rand(6, 16) * (layer ? 1.6 : 1) };
}

// ---------------- colours ----------------
function skyColors(env) {
  const z = DATA.ZONES[G.state.nav.zone];
  let [top, bot] = z.sky;
  const n = env.night;
  if (n > 0) { top = mixHex([top, ...Array(Math.round(n * 6)).fill('#141a3a')]); bot = mixHex([bot, ...Array(Math.round(n * 6)).fill('#3a3560')]); }
  const h = (G.state.time.min / 60) % 24;
  if ((h > 17 && h < 20) || (h > 5 && h < 7)) { bot = mixHex([bot, '#ffb38a']); }
  const storm = Math.max(env.dark, env.weather === 'storm' ? 0.45 : env.weather === 'rain' ? 0.25 : env.weather === 'cloudy' ? 0.12 : 0);
  if (storm > 0) { const k = Math.round(storm * 8); top = mixHex([top, ...Array(k).fill('#4a4a62')]); bot = mixHex([bot, ...Array(k).fill('#7a7a90')]); }
  return [top, bot];
}

// ---------------- camera / transforms ----------------
/** Where the island is on screen this frame (for input mapping). */
const view = { zoom: 1, camX: 0, camY: 0, bob: 0, tilt: 0, pivotX: 0, pivotY: 0 };

export function screenToWorld(sx, sy) {
  let x = (sx - W / 2) / view.zoom + view.camX;
  let y = (sy - H / 2) / view.zoom + view.camY - view.bob;
  const dx = x - view.pivotX, dy = y - view.pivotY, c = Math.cos(-view.tilt), s = Math.sin(-view.tilt);
  return { x: view.pivotX + dx * c - dy * s, y: view.pivotY + dx * s + dy * c };
}
export function worldToScreen(wx, wy) {
  const dx = wx - view.pivotX, dy = wy - view.pivotY, c = Math.cos(view.tilt), s = Math.sin(view.tilt);
  const x = view.pivotX + dx * c - dy * s, y = view.pivotY + dx * s + dy * c + view.bob;
  return { x: (x - view.camX) * view.zoom + W / 2, y: (y - view.camY) * view.zoom + H / 2 };
}

/** Center the camera on the island (on load, after building). */
export function centerCamera() {
  const b = bounds();
  const cam = G.rt.camera;
  cam.x = b.cx * TILE; cam.y = b.cy * TILE + TILE * 0.5;
  const fit = Math.min(W / ((b.maxX - b.minX + 4) * TILE), H / ((b.maxY - b.minY + 6) * TILE));
  cam.zoom = clamp(fit, 0.45, W < 720 ? 1.1 : 1.4);
  if (W < 720) cam.y += 70 / cam.zoom;      // leave room for the phone toolbars
}

// ---------------- floating text & sparkles ----------------
export function floatText(wx, wy, text, color = '#ffffff') {
  G.rt.fx.push({ kind: 'text', x: wx, y: wy, text, color, t: 0, life: 1.6 });
}
export function sparkle(wx, wy, color = '#fff3a0', n = 10) {
  for (let i = 0; i < n; i++) G.rt.fx.push({ kind: 'spark', x: wx, y: wy, vx: rand(-40, 40), vy: rand(-70, -10), color, t: 0, life: rand(0.5, 1.1) });
}
export function triggerVisual(type) { G.rt.visual = { type, t: 0 }; }

// ---------------- main draw ----------------
export function render(dt, t) {
  const s = G.state;
  if (!s) return;
  const env = {
    night: nightAmount(), weather: s.weather.today, dark: tutorialDarkness(),
    wind: ['wind', 'storm'].includes(s.weather.today), morning: s.time.min < 8 * 60,
    flag: s.flag, sail: s.sail, balloon: s.balloon, powered: s.windmillFixed,
  };
  if (G.rt.storm) env.wind = true;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  // Sky
  const [top, bot] = skyColors(env);
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  drawSkyBodies(env, t);
  if (s.weather.today === 'aurora' || s.nav.zone === 'aurora') drawAurora(t, env);
  drawBeacon(t, env);

  // Far clouds
  const windMul = env.wind ? 2.5 : 1;
  for (const c of clouds) {
    c.x += c.speed * dt * windMul * (G.rt.storm ? 4 : 1);
    if (c.x > W + 300) Object.assign(c, newCloud(false));
    if (c.layer === 0 && (G.settings.quality !== 'low' || clouds.indexOf(c) % 2)) cloud(ctx, c.x, c.y, c.s, shade('#ffffff', -(env.night * 0.55 + env.dark * 0.4)), 0.55);
  }
  drawVisualEvent(dt, t, env, 'back');
  drawPassingIslands(t, env);

  // ---- the island ----
  drawIsland(dt, t, env);

  // Near clouds
  for (const c of clouds) if (c.layer === 1 && (G.settings.quality !== 'low' || clouds.indexOf(c) % 2)) cloud(ctx, c.x, c.y, c.s, shade('#ffffff', -(env.night * 0.5 + env.dark * 0.4)), 0.6);

  drawWeather(dt, t, env);
  drawVisualEvent(dt, t, env, 'front');
  drawLighting(env, t);
  drawStarfall(dt, t);

  // Tutorial dread, lightning flash, fade to white.
  if (env.dark > 0) { ctx.fillStyle = `rgba(30,30,60,${env.dark * 0.3})`; ctx.fillRect(0, 0, W, H); }
  if (G.rt.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${G.rt.flash})`; ctx.fillRect(0, 0, W, H); G.rt.flash = Math.max(0, G.rt.flash - dt * 2.5); }
  const white = G.rt.storm ? G.rt.storm.white : 0;
  if (G.rt.whiteHold) {
    G.rt.whiteAlpha = G.rt.whiteFade ? Math.max(0, (G.rt.whiteAlpha ?? 1) - dt * 0.35) : 1;
    ctx.fillStyle = `rgba(255,255,255,${G.rt.whiteAlpha})`; ctx.fillRect(0, 0, W, H);
  } else if (white > 0) { ctx.fillStyle = `rgba(255,255,255,${white})`; ctx.fillRect(0, 0, W, H); }
  else { G.rt.whiteAlpha = null; G.rt.whiteFade = false; }
}

function drawSkyBodies(env, t) {
  const h = (G.state.time.min / 60) % 24;
  if (env.night > 0.2) {
    ctx.globalAlpha = env.night * (1 - env.dark);
    for (let i = 0; i < 80; i++) {
      const x = (i * 137.5) % W, y = (i * 71.3) % (H * 0.7);
      ctx.fillStyle = '#fff'; ctx.globalAlpha = env.night * (0.4 + 0.6 * Math.abs(Math.sin(t * 0.7 + i)));
      ctx.fillRect(x, y, 1.6, 1.6);
    }
    ctx.globalAlpha = 1;
    const mp = ((h + 6) % 24) / 12;
    const mx = W * (0.1 + mp * 0.8), my = H * 0.45 - Math.sin(mp * Math.PI) * H * 0.35;
    const mg = ctx.createRadialGradient(mx, my, 10, mx, my, 60);
    mg.addColorStop(0, 'rgba(244,240,220,0.35)'); mg.addColorStop(1, 'rgba(244,240,220,0)');
    ctx.fillStyle = mg; ctx.fillRect(mx - 60, my - 60, 120, 120);
    ctx.fillStyle = '#f4f0dc'; ctx.beginPath(); ctx.arc(mx, my, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(200,196,180,0.6)'; ctx.beginPath(); ctx.arc(mx - 6, my - 4, 4, 0, Math.PI * 2); ctx.arc(mx + 7, my + 6, 3, 0, Math.PI * 2); ctx.fill();
  } else if (env.weather !== 'storm' && env.weather !== 'rain') {
    const p = clamp((h - 6) / 13, 0, 1);
    const sx = W * (0.1 + p * 0.8), sy = H * 0.5 - Math.sin(p * Math.PI) * H * 0.4;
    const sg = ctx.createRadialGradient(sx, sy, 5, sx, sy, 90);
    sg.addColorStop(0, 'rgba(255,250,220,0.95)'); sg.addColorStop(0.25, 'rgba(255,240,180,0.6)'); sg.addColorStop(1, 'rgba(255,240,180,0)');
    ctx.fillStyle = sg; ctx.fillRect(sx - 90, sy - 90, 180, 180);
  }
}

function drawAurora(t, env) {
  ctx.globalAlpha = 0.25 + env.night * 0.35;
  for (let b = 0; b < 3; b++) {
    ctx.beginPath(); ctx.moveTo(0, H * 0.2);
    for (let x = 0; x <= W; x += 20) ctx.lineTo(x, H * (0.15 + b * 0.06) + Math.sin(x * 0.01 + t * 0.5 + b) * 30);
    ctx.lineTo(W, 0); ctx.lineTo(0, 0); ctx.closePath();
    ctx.fillStyle = ['#6af0b0', '#9a7af0', '#6ad0f0'][b]; ctx.fill();
  }
  ctx.globalAlpha = 1;
}

/** The Great Sky Beacon, far away on the horizon. */
function drawBeacon(t, env) {
  const glow = beaconGlow();
  const x = W * 0.86, y = H * 0.3;
  ctx.save(); ctx.globalAlpha = 0.75;
  ctx.fillStyle = shade('#8a8aa8', -env.night * 0.4);
  ctx.beginPath(); ctx.ellipse(x, y + 32, 30, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 25, y + 32); ctx.lineTo(x, y + 70); ctx.lineTo(x + 25, y + 32); ctx.fill();
  ctx.fillRect(x - 5, y - 18, 10, 50);
  ctx.beginPath(); ctx.moveTo(x - 9, y - 18); ctx.lineTo(x, y - 30); ctx.lineTo(x + 9, y - 18); ctx.fill();
  ctx.restore();
  if (glow > 0.02) {
    const pulse = glow * (0.85 + Math.sin(t * 2) * 0.15);
    const bg = ctx.createRadialGradient(x, y - 20, 2, x, y - 20, 70 * pulse + 10);
    bg.addColorStop(0, `rgba(255,248,200,${pulse})`); bg.addColorStop(1, 'rgba(255,240,160,0)');
    ctx.fillStyle = bg; ctx.fillRect(x - 90, y - 110, 180, 180);
    if (glow >= 1) {
      ctx.save(); ctx.translate(x, y - 20); ctx.rotate(t * 0.3);
      ctx.fillStyle = `rgba(255,248,200,${0.12 + env.night * 0.15})`;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, W, -0.08, 0.08); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, W, Math.PI - 0.08, Math.PI + 0.08); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }
}

function drawPassingIslands(t, env) {
  G.rt.islandHits = [];
  const now = absMinutes();
  for (const n of nearbyIslands()) {
    const I = DATA.ISLANDS[n.id];
    const p = (now - n.arrive) / (n.leave - n.arrive);
    const x = n.side > 0 ? lerp(W * 0.9, W * 0.1, p) : lerp(W * 0.1, W * 0.9, p);
    const y = H * (0.12 + n.lane * 0.5) + Math.sin(t * 0.8 + n.lane * 10) * 6;
    const sc = 0.55 + n.lane * 0.3;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc);
    ctx.globalAlpha = 0.92 - env.dark * 0.3;
    ctx.fillStyle = shade(I.colors[1], -env.night * 0.4);
    ctx.beginPath(); ctx.moveTo(-60, 0); ctx.lineTo(60, 0); ctx.lineTo(25, 40); ctx.lineTo(0, 70); ctx.lineTo(-30, 35); ctx.closePath(); ctx.fill();
    ctx.fillStyle = shade(I.colors[0], -env.night * 0.4);
    rr(ctx, -64, -10, 128, 16, 8); ctx.fill();
    ctx.fillStyle = shade('#6fa86a', -env.night * 0.4);
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-40 + i * 26, -16 - (i % 2) * 6, 11, 0, Math.PI * 2); ctx.fill(); }
    if (I.spots.some(sp => sp.type === 'npc')) { ctx.fillStyle = '#f3e2c3'; ctx.fillRect(14, -30, 18, 16); ctx.fillStyle = '#c0584a'; ctx.beginPath(); ctx.moveTo(11, -30); ctx.lineTo(23, -42); ctx.lineTo(35, -30); ctx.fill(); }
    ctx.restore();
    ctx.font = '600 12px system-ui, sans-serif'; ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(30,40,70,0.55)'; const tw = ctx.measureText(I.name).width + 14;
    rr(ctx, x - tw / 2, y - 64 * sc - 12, tw, 18, 9); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillText(I.name, x, y - 64 * sc + 1);
    G.rt.islandHits.push({ n, x: x - 70 * sc, y: y - 70 * sc, w: 140 * sc, h: 140 * sc });
  }
}

// ---------------- the island ----------------
function drawIsland(dt, t, env) {
  const s = G.state, cam = G.rt.camera;
  const b = bounds();
  const bal = balance();
  view.zoom = cam.zoom; view.camX = cam.x; view.camY = cam.y;
  view.bob = Math.sin(t * 0.6) * 5 + (G.rt.storm ? Math.sin(t * 9) * 4 : 0);
  view.tilt = lerp(view.tilt, s.phase === 'tutorial' ? 0 : bal.angle, Math.min(1, dt * 2));
  view.pivotX = b.cx * TILE; view.pivotY = b.cy * TILE;

  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(view.zoom, view.zoom); ctx.translate(-view.camX, -view.camY + view.bob);
  ctx.translate(view.pivotX, view.pivotY); ctx.rotate(view.tilt); ctx.translate(-view.pivotX, -view.pivotY);

  const tiles = allTiles();
  const zone = DATA.ZONES[s.nav.zone];
  const grass = shade(zone.climate === 'cold' ? '#cfe8e8' : zone.climate === 'warm' ? '#9fd27a' : zone.climate === 'misty' ? '#9ccf9a' : zone.climate === 'stormy' ? '#7fb08a' : '#94d184', -env.night * 0.45);
  const rock = shade('#9a8f84', -env.night * 0.45);

  const withFrag = (x, y, fn) => {
    const f = fragmentOffset(x, y);
    if (!f) { fn(); return; }
    ctx.save();
    const px = (Math.floor(x / 4) * 4 + 2) * TILE, py = (Math.floor(y / 4) * 4 + 2) * TILE;
    ctx.translate(px + f.dx * TILE, py + f.dy * TILE); ctx.rotate(f.rot); ctx.translate(-px, -py);
    fn(); ctx.restore();
  };

  // Underside
  for (const [x, y] of tiles) if (!isLand(x, y + 1)) withFrag(x, y, () => drawUnderside(ctx, x, y, (y - b.minY) / Math.max(1, b.maxY - b.minY), rock));
  // Ground
  for (const [x, y, tl] of tiles) withFrag(x, y, () => {
    const px = x * TILE, py = y * TILE;
    ctx.fillStyle = grass; ctx.fillRect(px - 0.5, py - 0.5, TILE + 1, TILE + 1);
    if ((x + y) % 2 === 0) { ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(px, py, TILE, TILE); }
    if (!isLand(x, y - 1)) { ctx.fillStyle = shade(grass, 0.2); ctx.fillRect(px, py, TILE, 4); }
    if (!isLand(x, y + 1)) { ctx.fillStyle = shade(grass, -0.2); ctx.fillRect(px, py + TILE - 5, TILE, 5); }
    if (tl.soil) {
      ctx.fillStyle = shade(tl.wet ? '#6b4a32' : '#9a7350', -env.night * 0.4 + tl.q * -0.04);
      rr(ctx, px + 3, py + 3, TILE - 6, TILE - 6, 6); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1.5;
      for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(px + 7, py + i * 11 + 2); ctx.lineTo(px + TILE - 7, py + i * 11 + 2); ctx.stroke(); }
      if (tl.q >= 2) { ctx.fillStyle = 'rgba(255,230,140,0.5)'; ctx.fillRect(px + 6, py + 6, 3, 3); }
      if (tl.fert || (tl.crop && tl.crop.fert)) { ctx.fillStyle = 'rgba(180,255,180,0.35)'; ctx.fillRect(px + TILE - 10, py + 6, 4, 4); }
    } else {
      // little grass tufts
      const sd = (x * 31 + y * 17) % 7;
      if (sd < 2) { ctx.strokeStyle = shade(grass, -0.15); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(px + 12 + sd * 9, py + 30); ctx.lineTo(px + 14 + sd * 9, py + 24); ctx.moveTo(px + 16 + sd * 9, py + 30); ctx.lineTo(px + 17 + sd * 9, py + 25); ctx.stroke(); }
    }
  });

  // Flat decorations (paths) under everything else.
  for (const o of s.objects) if (o.type === 'deco' && objectDef(o).walk) withFrag(o.x, o.y, () => drawDeco(ctx, o, t, env));

  // Everything else, sorted by depth (bottom edge).
  const items = [];
  for (const o of s.objects) if (!(o.type === 'deco' && objectDef(o).walk)) items.push({ y: o.y + o.h, draw: () => withFrag(o.x, o.y, () => (o.type === 'building' ? drawBuilding(ctx, o, t, env) : drawDeco(ctx, o, t, env))) });
  for (const [x, y, tl] of tiles) if (tl.crop) {
    const c = tl.crop, def = getCrop(c.id);
    if (!def) continue;
    items.push({ y: y + 0.9, draw: () => withFrag(x, y, () => {
      drawCrop(ctx, x, y, def, Math.min(1, c.age / def.traits.growth), c.ripe, t, env);
      if (c.poll && c.ripe) for (let i = 0; i < 3; i++) star(ctx, x * TILE + 10 + i * 14, y * TILE + 8 + Math.sin(t * 4 + i) * 4, 3, '#fff3a0');
      if (c.dormant && !c.ripe) { ctx.fillStyle = 'rgba(80,90,140,0.8)'; ctx.font = 'bold 11px system-ui'; ctx.fillText('z', x * TILE + 36, y * TILE + 14 + Math.sin(t * 2) * 2); }
    }) });
  }
  for (const a of s.animals) items.push({ y: a.y + 0.2, draw: () => withFrag(Math.floor(a.x), Math.floor(a.y), () => drawAnimal(ctx, a, t, G.rt.selectedAnimal === a)) });
  if (!G.rt.storm || !G.rt.storm.breakAt) items.push({ y: s.player.y + 0.3, draw: () => drawPlayer(ctx, s.player, t, G.rt.playerMoving) });
  items.sort((a, b2) => a.y - b2.y).forEach(i => i.draw());

  // Docked airship next to the dock (or the island edge).
  const tr = traderHere();
  if (tr) {
    const def = DATA.TRADERS[tr.id];
    const dock = s.objects.find(o => o.ref === 'dock');
    const ax = dock ? (dock.x + dock.w + 1.6) * TILE : (b.maxX + 2.6) * TILE;
    const ay = dock ? (dock.y + 0.5) * TILE : (b.minY + 1.5) * TILE;
    drawAirship(ctx, ax, ay, 0.9, def.hull, def.balloon, t);
  }

  drawGhost(t);
  drawFx(dt);
  ctx.restore();
}

/** Placement preview for building / decorating / attaching land. */
function drawGhost(t) {
  const p = G.rt.placing, h = G.rt.hover;
  if (h && !p) {
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2;
    rr(ctx, h.x * TILE + 2, h.y * TILE + 2, TILE - 4, TILE - 4, 6); ctx.stroke();
  }
  if (!p || !h) return;
  let cells, ok;
  if (p.kind === 'land') {
    cells = shapeCells(DATA.LAND[p.ref].shape, p.rot).map(([dx, dy]) => [h.x + dx, h.y + dy]);
    ok = canPlaceLand(p.ref, h.x, h.y, p.rot);
  } else {
    const [w, hh] = p.kind === 'building' ? DATA.BUILDINGS[p.ref].size : [1, 1];
    cells = []; for (let i = 0; i < w; i++) for (let j = 0; j < hh; j++) cells.push([h.x + i, h.y + j]);
    ok = p.kind === 'animal' ? !!tileAt(h.x, h.y) : areaFree(h.x, h.y, w, hh, p.moving || null);
  }
  ctx.fillStyle = ok ? 'rgba(140,255,160,0.35)' : 'rgba(255,120,120,0.35)';
  ctx.strokeStyle = ok ? 'rgba(80,200,110,0.9)' : 'rgba(220,80,80,0.9)';
  ctx.lineWidth = 2;
  for (const [x, y] of cells) { rr(ctx, x * TILE + 2, y * TILE + 2, TILE - 4, TILE - 4, 5 + Math.sin(t * 4)); ctx.fill(); ctx.stroke(); }
}

function drawFx(dt) {
  const fx = G.rt.fx;
  for (let i = fx.length - 1; i >= 0; i--) {
    const f = fx[i]; f.t += dt;
    if (f.t > f.life) { fx.splice(i, 1); continue; }
    const a = 1 - f.t / f.life;
    if (f.kind === 'text') {
      ctx.globalAlpha = a; ctx.font = '700 15px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(40,40,70,0.6)'; ctx.strokeText(f.text, f.x, f.y - f.t * 30);
      ctx.fillStyle = f.color; ctx.fillText(f.text, f.x, f.y - f.t * 30);
    } else {
      f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 80 * dt;
      ctx.globalAlpha = a; star(ctx, f.x, f.y, 3, f.color);
    }
  }
  ctx.globalAlpha = 1;
}

// ---------------- weather ----------------
function drawWeather(dt, t, env) {
  const w = G.rt.storm ? 'storm' : env.weather;
  const low = G.settings.quality === 'low';
  const want = { rain: low ? 60 : 160, storm: low ? 90 : 240, snow: low ? 40 : 110, wind: low ? 10 : 24 }[w] || 0;
  while (particles.length < want) particles.push({ x: rand(0, W), y: rand(-H, H), v: rand(0.7, 1.3), r: rand(0, 6.28) });
  if (particles.length > want) particles.length = want;
  if (w === 'rain' || w === 'storm') {
    ctx.strokeStyle = 'rgba(200,220,255,0.55)'; ctx.lineWidth = 1.2; ctx.beginPath();
    for (const p of particles) {
      p.y += 700 * p.v * dt; p.x += (w === 'storm' ? 220 : 60) * dt;
      if (p.y > H) { p.y = rand(-40, 0); p.x = rand(-100, W); }
      ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + (w === 'storm' ? 6 : 2), p.y + 14);
    }
    ctx.stroke();
  } else if (w === 'snow') {
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const p of particles) {
      p.y += 50 * p.v * dt; p.x += Math.sin(t + p.r) * 20 * dt;
      if (p.y > H) { p.y = -5; p.x = rand(0, W); }
      ctx.beginPath(); ctx.arc(p.x, p.y, 2 * p.v, 0, 6.28); ctx.fill();
    }
  } else if (w === 'wind') {
    for (const p of particles) {
      p.x += 260 * p.v * dt; p.y += Math.sin(t * 2 + p.r) * 40 * dt;
      if (p.x > W + 20) { p.x = -20; p.y = rand(0, H); }
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(t * 3 + p.r);
      ctx.fillStyle = ['#8fbf5a', '#e0a040', '#c0584a'][Math.floor(p.r) % 3]; ctx.beginPath(); ctx.ellipse(0, 0, 5, 2.5, 0, 0, 6.28); ctx.fill();
      ctx.restore();
    }
  }
  if (w === 'mist') { ctx.fillStyle = `rgba(235,235,250,${0.28 + Math.sin(t * 0.3) * 0.05})`; ctx.fillRect(0, 0, W, H); }
  if (w === 'storm') {
    G.rt.lightningT = (G.rt.lightningT || 0) - dt;
    if (G.rt.lightningT <= 0) {
      G.rt.lightningT = rand(G.rt.storm ? 0.8 : 3, G.rt.storm ? 2 : 9);
      G.rt.bolt = { x: rand(W * 0.1, W * 0.9), t: 0.25 };
      G.rt.flash = Math.max(G.rt.flash || 0, 0.35);
      G.rt.thunderSoon = 0.4;
    }
    if (G.rt.bolt && G.rt.bolt.t > 0) {
      const bt = G.rt.bolt; bt.t -= dt;
      ctx.strokeStyle = 'rgba(255,255,230,0.9)'; ctx.lineWidth = 3; ctx.beginPath();
      let x = bt.x, y = 0; ctx.moveTo(x, y);
      for (let i = 0; i < 8; i++) { x += Math.sin(i * 7.3 + bt.x) * 30; y += H * 0.06; ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }
}

// ---------------- night lighting ----------------
function drawLighting(env, t) {
  const n = Math.max(env.night * 0.62, env.dark * 0.35);
  if (n < 0.03) return;
  const lc = lightCtx;
  lc.globalCompositeOperation = 'source-over';
  lc.clearRect(0, 0, W, H);
  lc.fillStyle = `rgba(14,18,48,${n})`; lc.fillRect(0, 0, W, H);
  lc.globalCompositeOperation = 'destination-out';
  const boost = hasBuff('glowing') ? 1.4 : 1;
  const light = (wx, wy, r) => {
    const p = worldToScreen(wx, wy), rad = r * TILE * view.zoom * boost * (1 + Math.sin(t * 3 + wx) * 0.03);
    const gr = lc.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
    gr.addColorStop(0, 'rgba(0,0,0,0.95)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    lc.fillStyle = gr; lc.fillRect(p.x - rad, p.y - rad, rad * 2, rad * 2);
  };
  for (const o of G.state.objects) {
    const d = objectDef(o);
    if (d && d.light) light((o.x + o.w / 2) * TILE, (o.y + o.h / 2) * TILE, d.light);
    else if (o.glow) light((o.x + o.w / 2) * TILE, (o.y + o.h / 2) * TILE, 1.5);
  }
  for (const [x, y, tl] of allTiles()) if (tl.crop && tl.crop.ripe) { const c = getCrop(tl.crop.id); if (c && c.traits.rare.includes('glowing')) light((x + 0.5) * TILE, (y + 0.5) * TILE, 1.2); }
  light(G.state.player.x * TILE, G.state.player.y * TILE, 1.4);
  ctx.drawImage(lightCv, 0, 0, W, H);
  // warm tint around lights
  ctx.globalCompositeOperation = 'lighter';
  for (const o of G.state.objects) {
    const d = objectDef(o);
    if (!d || !d.light) continue;
    const p = worldToScreen((o.x + o.w / 2) * TILE, (o.y + o.h / 2) * TILE), rad = d.light * TILE * view.zoom * 0.8;
    const gr = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad);
    const [r, g, b] = hexToRgb(o.type === 'deco' ? o.color : '#ffb36b');
    gr.addColorStop(0, `rgba(${r},${g},${b},${0.25 * n})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gr; ctx.fillRect(p.x - rad, p.y - rad, rad * 2, rad * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
}

// ---------------- special visuals ----------------
function drawVisualEvent(dt, t, env, layer) {
  // Birds flying away during the tutorial's foreshadowing.
  if (layer === 'back' && env.dark > 0.2 && birds.length < 12 && Math.random() < dt * 2) birds.push({ x: W * 0.3 + rand(0, W * 0.4), y: H * 0.5 + rand(-50, 50), v: rand(120, 200) });
  for (let i = birds.length - 1; i >= 0; i--) {
    if (layer !== 'back') break;
    const b = birds[i]; b.x -= b.v * dt; b.y -= b.v * 0.4 * dt;
    ctx.strokeStyle = 'rgba(40,40,60,0.7)'; ctx.lineWidth = 2; ctx.beginPath();
    const f = Math.sin(t * 12 + i) * 4;
    ctx.moveTo(b.x - 7, b.y - f); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x + 7, b.y - f); ctx.stroke();
    if (b.x < -20 || b.y < -20) birds.splice(i, 1);
  }
  const v = G.rt.visual;
  if (!v) return;
  if (layer === 'back') v.t += dt;
  if (v.t > 12) { G.rt.visual = null; return; }
  const a = Math.min(1, v.t, (12 - v.t) / 2);
  if (v.type === 'rainbow' && layer === 'back') {
    ['#ff6a6a', '#ffb36a', '#fff06a', '#7fe07f', '#6ab0ff', '#a07aff'].forEach((c, i) => {
      ctx.strokeStyle = c; ctx.globalAlpha = a * 0.35; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(W / 2, H * 0.95, W * 0.45 - i * 10, Math.PI, 0); ctx.stroke();
    });
    ctx.globalAlpha = 1;
  } else if (v.type === 'whales' && layer === 'back') {
    for (let i = 0; i < 3; i++) {
      const x = -200 + v.t * 90 - i * 160, y = H * 0.7 + i * 40 + Math.sin(t + i) * 10;
      ctx.globalAlpha = a * 0.5; ctx.fillStyle = '#6a7aa8';
      ctx.beginPath(); ctx.ellipse(x, y, 80 - i * 15, 22 - i * 4, 0, 0, 6.28); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x - 70 + i * 12, y); ctx.lineTo(x - 110 + i * 15, y - 20); ctx.lineTo(x - 105 + i * 15, y + 18); ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if ((v.type === 'birds' || v.type === 'socks' || v.type === 'crystals' || v.type === 'embers') && layer === 'front') {
    for (let i = 0; i < 18; i++) {
      const x = (i * 97 + v.t * (v.type === 'birds' ? 160 : 30)) % (W + 100) - 50;
      const y = v.type === 'birds' ? H * 0.2 + Math.sin(i) * 60 : ((i * 53 + v.t * 80) % (H + 50)) - 25;
      ctx.globalAlpha = a;
      if (v.type === 'birds') { ctx.strokeStyle = '#3a3a5a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 6, y - 3); ctx.lineTo(x, y); ctx.lineTo(x + 6, y - 3); ctx.stroke(); }
      else if (v.type === 'socks') { ctx.fillStyle = `hsl(${i * 40},60%,65%)`; ctx.fillRect(x, y, 6, 12); ctx.fillRect(x, y + 9, 10, 4); }
      else { star(ctx, x, y, 3, v.type === 'embers' ? '#ff9a4a' : '#c8f0ff'); }
    }
    ctx.globalAlpha = 1;
  } else if (v.type === 'meteor' && layer === 'front' && v.t < 2) {
    const x = W * 0.9 - v.t * W * 0.4, y = H * 0.05 + v.t * H * 0.25;
    ctx.strokeStyle = 'rgba(255,255,220,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 80, y - 40); ctx.stroke();
    star(ctx, x, y, 6, '#fff');
  } else if (v.type === 'balloon' && layer === 'back') {
    const x = W * 0.2 + v.t * 40, y = H * 0.6 - v.t * 30;
    ctx.fillStyle = '#ff8a9a'; ctx.beginPath(); ctx.ellipse(x, y, 14, 18, 0, 0, 6.28); ctx.fill();
    ctx.strokeStyle = '#777'; ctx.beginPath(); ctx.moveTo(x, y + 18); ctx.lineTo(x + 3, y + 45); ctx.stroke();
  }
}

/** Starfall festival: falling stars you can tap. */
function drawStarfall(dt, t) {
  const fs = G.rt.fallingStars || (G.rt.fallingStars = []);
  if (isStarfallNight() && fs.length < 6 && Math.random() < dt * 1.2) fs.push({ x: rand(W * 0.1, W * 0.9), y: -20, v: rand(40, 80) });
  for (let i = fs.length - 1; i >= 0; i--) {
    const s = fs[i]; s.y += s.v * dt;
    if (s.y > H + 20) { fs.splice(i, 1); continue; }
    ctx.strokeStyle = 'rgba(255,255,220,0.4)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - 12, s.y - 30); ctx.stroke();
    star(ctx, s.x, s.y, 9 + Math.sin(t * 6 + i) * 2, '#fff6b0');
  }
}

