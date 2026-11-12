// =============================================================
//  ART — every picture in the game is painted here with canvas
//  shapes, so the game has no image files to download.
//
//  World drawing uses pixel units where one tile = TILE pixels.
//  Most painters take (ctx, x, y, w, h, …) where x,y is the
//  top-left of the object's footprint on the ground.
// =============================================================

import { DATA } from '../data/index.js';
import { shade, hsl, hueToHex } from './utils.js';

export const TILE = 48;

// ---------------- primitives ----------------
export function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}
function fillRR(ctx, x, y, w, h, r, color, stroke) {
  rr(ctx, x, y, w, h, r); ctx.fillStyle = color; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}
function circle(ctx, x, y, r, color) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
function ellipse(ctx, x, y, rx, ry, color) { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
function poly(ctx, pts, color, stroke) {
  ctx.beginPath(); ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}
function line(ctx, x1, y1, x2, y2, color, w = 2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.stroke(); }
export function shadow(ctx, cx, cy, rx, ry = rx * 0.35) { ellipse(ctx, cx, cy, rx, ry, 'rgba(40,50,80,0.18)'); }

// ---------------- clouds ----------------
export function cloud(ctx, x, y, s, color = '#ffffff', alpha = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 18 * s, 0, Math.PI * 2); ctx.arc(x + 22 * s, y - 10 * s, 22 * s, 0, Math.PI * 2);
  ctx.arc(x + 48 * s, y - 2 * s, 18 * s, 0, Math.PI * 2); ctx.arc(x + 26 * s, y + 8 * s, 18 * s, 0, Math.PI * 2);
  ctx.arc(x + 62 * s, y + 6 * s, 12 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

// ---------------- roofs & house bodies ----------------
function roof(ctx, x, y, w, h, style, color) {
  const dark = shade(color, -0.25);
  if (style === 'round') {
    ctx.beginPath(); ctx.moveTo(x - 3, y + h); ctx.quadraticCurveTo(x + w / 2, y - h * 0.9, x + w + 3, y + h); ctx.closePath();
    ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = dark; ctx.lineWidth = 2; ctx.stroke();
  } else if (style === 'flat') {
    fillRR(ctx, x - 3, y + h * 0.35, w + 6, h * 0.65, 3, color, dark);
  } else if (style === 'spire') {
    poly(ctx, [x - 2, y + h, x + w / 2, y - h * 1.1, x + w + 2, y + h], color, dark);
  } else if (style === 'thatch') {
    ctx.beginPath(); ctx.moveTo(x - 5, y + h); ctx.quadraticCurveTo(x + w * 0.15, y - h * 0.2, x + w / 2, y - h * 0.3);
    ctx.quadraticCurveTo(x + w * 0.85, y - h * 0.2, x + w + 5, y + h); ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = dark; ctx.lineWidth = 1;
    for (let i = 1; i < 6; i++) line(ctx, x + (w * i) / 6, y + h * 0.1, x + (w * i) / 6 - 3, y + h, dark, 1);
  } else {
    poly(ctx, [x - 4, y + h, x + w / 2, y - h * 0.55, x + w + 4, y + h], color, dark);
  }
}

function windowPane(ctx, x, y, s, night) {
  fillRR(ctx, x, y, s, s, 2, night > 0.3 ? `rgba(255,214,120,${0.6 + night * 0.4})` : '#bfe3f5', '#6b4f3a');
  line(ctx, x + s / 2, y, x + s / 2, y + s, '#6b4f3a', 1); line(ctx, x, y + s / 2, x + s, y + s / 2, '#6b4f3a', 1);
}

/** A cosy box building with a roof: the basis for most buildings. */
function boxBuilding(ctx, x, y, w, h, o, opt = {}) {
  const wall = o.color, roofC = o.roofColor || '#c0584a';
  const bodyTop = y + h * 0.15, bodyH = h * 0.8;
  shadow(ctx, x + w / 2, y + h - 2, w * 0.55, 8);
  fillRR(ctx, x + 3, bodyTop, w - 6, bodyH, 4, wall, shade(wall, -0.3));
  if (opt.door !== false) fillRR(ctx, x + w / 2 - 7, y + h - 22, 14, 20, 3, shade(wall, -0.45));
  if (opt.windows !== false) {
    windowPane(ctx, x + 9, bodyTop + bodyH * 0.35, 11, opt.night || 0);
    if (w > 60) windowPane(ctx, x + w - 20, bodyTop + bodyH * 0.35, 11, opt.night || 0);
  }
  roof(ctx, x, y - h * 0.45, w, h * 0.65, o.roof || 'gable', roofC);
}

// ---------------- buildings ----------------
/** Draw a building object. t = seconds (for animation). */
export function drawBuilding(ctx, o, t, env) {
  const x = o.x * TILE, y = o.y * TILE, w = o.w * TILE, h = o.h * TILE;
  const def = DATA.BUILDINGS[o.ref];
  const night = env.night;
  const art = def.art;
  switch (art) {
    case 'cottage': {
      boxBuilding(ctx, x, y, w, h, o, { night });
      fillRR(ctx, x + w * 0.7, y - h * 0.35, 9, 18, 2, '#9a6a5a');
      if (o.ref === 'house') { const s = Math.sin(t) * 3; for (let i = 0; i < 3; i++) circle(ctx, x + w * 0.72 + 4 + s * i * 0.4, y - h * 0.4 - 10 - i * 9, 4 + i * 1.5, `rgba(240,240,250,${0.5 - i * 0.12})`); }
      if (o.ref === 'workshop') { circle(ctx, x + w / 2, y + h * 0.4, 7, '#b08a50'); circle(ctx, x + w / 2, y + h * 0.4, 3, shade(o.color, -0.3)); }
      break;
    }
    case 'barn': {
      boxBuilding(ctx, x, y, w, h, o, { door: false, night });
      const dw = 30, dx = x + w / 2 - dw / 2, dy = y + h - 34;
      fillRR(ctx, dx, dy, dw, 32, 2, shade(o.color, -0.25), '#f4ecdc');
      line(ctx, dx, dy, dx + dw, dy + 32, '#f4ecdc', 2); line(ctx, dx + dw, dy, dx, dy + 32, '#f4ecdc', 2);
      break;
    }
    case 'coop': {
      boxBuilding(ctx, x, y + 6, w, h - 6, o, { windows: false, night });
      line(ctx, x + w / 2 + 6, y + h - 4, x + w / 2 + 20, y + h + 4, '#a0683a', 3);
      break;
    }
    case 'windmill': {
      shadow(ctx, x + w / 2, y + h - 2, w * 0.45, 8);
      poly(ctx, [x + 12, y + h, x + 22, y - h * 0.3, x + w - 22, y - h * 0.3, x + w - 12, y + h], o.color, shade(o.color, -0.3));
      fillRR(ctx, x + w / 2 - 7, y + h - 20, 14, 18, 3, '#7a5a40');
      windowPane(ctx, x + w / 2 - 5, y + h * 0.15, 10, night);
      roof(ctx, x + 16, y - h * 0.58, w - 32, h * 0.32, o.roof || 'spire', o.roofColor);
      const cx = x + w / 2, cy = y - h * 0.32;
      const ang = o.broken ? 0.4 : t * (env.wind ? 2.2 : 0.9);
      for (let i = 0; i < 4; i++) {
        if (o.broken && i === 2) continue;
        const a = ang + (i * Math.PI) / 2 + (o.broken && i === 1 ? 0.5 : 0);
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(a);
        fillRR(ctx, -4, -h * 0.85, 8, h * 0.8, 2, o.broken ? '#bca88a' : '#f4ecdc', '#8a6a4a');
        line(ctx, 0, -h * 0.85, 0, 0, '#8a6a4a', 2);
        ctx.restore();
      }
      circle(ctx, cx, cy, 5, '#6b4f3a');
      if (o.broken) { line(ctx, x + 22, y + 5, x + 30, y + 25, '#5a4030', 1.5); line(ctx, x + 30, y + 25, x + 26, y + 40, '#5a4030', 1.5); }
      break;
    }
    case 'greenhouse': {
      shadow(ctx, x + w / 2, y + h - 2, w * 0.55, 8);
      fillRR(ctx, x + 3, y + 4, w - 6, h - 6, 6, 'rgba(210,240,255,0.55)', '#7ab0a0');
      for (let i = 1; i < o.w * 2; i++) line(ctx, x + 3 + ((w - 6) * i) / (o.w * 2), y + 4, x + 3 + ((w - 6) * i) / (o.w * 2), y + h - 2, 'rgba(120,170,160,0.7)', 1.2);
      for (let i = 0; i < 7; i++) circle(ctx, x + 12 + ((i * 37) % (w - 24)), y + h - 12 - (i % 3) * 8, 5, hsl(100 + i * 20, 55, 50));
      ctx.beginPath(); ctx.moveTo(x, y + 8); ctx.quadraticCurveTo(x + w / 2, y - h * 0.55, x + w, y + 8);
      ctx.fillStyle = 'rgba(200,240,250,0.6)'; ctx.fill(); ctx.strokeStyle = '#7ab0a0'; ctx.lineWidth = 2; ctx.stroke();
      if (o.roofColor) { ctx.globalAlpha = 0.25; ctx.fillStyle = o.roofColor; ctx.fill(); ctx.globalAlpha = 1; }
      break;
    }
    case 'mixer': {
      shadow(ctx, x + w / 2, y + h - 2, w * 0.5, 7);
      fillRR(ctx, x + 4, y + h * 0.35, w - 8, h * 0.55, 3, o.color, shade(o.color, -0.3));
      ellipse(ctx, x + w * 0.35, y + h * 0.3, 14, 6, '#5a5a6a');
      ellipse(ctx, x + w * 0.35, y + h * 0.28, 11, 4, hsl((t * 40) % 360, 70, 65));
      for (let i = 0; i < 3; i++) { fillRR(ctx, x + w * 0.62 + i * 9, y + h * 0.05, 7, 14, 2, hsl(i * 120 + 20, 60, 70), '#4a4a5a'); }
      for (let i = 0; i < 2; i++) circle(ctx, x + w * 0.35 + Math.sin(t * 2 + i) * 6, y + h * 0.1 - ((t * 15 + i * 10) % 20), 2.5, 'rgba(255,255,255,0.7)');
      break;
    }
    case 'bench': {
      shadow(ctx, x + w / 2, y + h - 4, w * 0.45, 6);
      fillRR(ctx, x + 4, y + h * 0.35, w - 8, 10, 2, o.color, shade(o.color, -0.35));
      line(ctx, x + 8, y + h * 0.35 + 10, x + 8, y + h - 6, shade(o.color, -0.35), 3);
      line(ctx, x + w - 8, y + h * 0.35 + 10, x + w - 8, y + h - 6, shade(o.color, -0.35), 3);
      line(ctx, x + 12, y + h * 0.3, x + 20, y + h * 0.12, '#8a8f99', 3); fillRR(ctx, x + 24, y + h * 0.18, 12, 6, 1, '#c0584a');
      break;
    }
    case 'hive': {
      shadow(ctx, x + w / 2, y + h - 4, w * 0.35, 5);
      for (let i = 0; i < 3; i++) fillRR(ctx, x + 10 + i * 1, y + h - 14 - i * 11, w - 20 - i * 2, 11, 3, shade(o.color, -i * 0.08), shade(o.color, -0.35));
      fillRR(ctx, x + 8, y + h - 44, w - 16, 6, 2, o.roofColor);
      if (o.data && o.data.bees) for (let i = 0; i < 4; i++) circle(ctx, x + w / 2 + Math.sin(t * 3 + i * 1.7) * 16, y + h * 0.3 + Math.cos(t * 4 + i) * 10, 2, '#3a3020');
      if (o.data && o.data.ready) circle(ctx, x + w - 8, y + 6, 6, '#f2b640');
      break;
    }
    case 'mill': {
      boxBuilding(ctx, x, y, w, h, o, { night });
      ctx.save(); ctx.translate(x + w - 8, y + h * 0.65); ctx.rotate(env.powered ? t : 0);
      for (let i = 0; i < 6; i++) { ctx.rotate(Math.PI / 3); fillRR(ctx, -2, -14, 4, 14, 1, '#7a5a40'); }
      ctx.restore(); circle(ctx, x + w - 8, y + h * 0.65, 4, '#5a4030');
      break;
    }
    case 'dock': {
      for (let i = 0; i < o.h * 3; i++) fillRR(ctx, x + 2, y + 2 + i * (h / (o.h * 3)), w - 4, h / (o.h * 3) - 2, 2, shade(o.color, (i % 2) * -0.08), shade(o.color, -0.35));
      [[x + 4, y + 2], [x + w - 8, y + 2], [x + 4, y + h - 10], [x + w - 8, y + h - 10]].forEach(([px, py]) => fillRR(ctx, px, py - 10, 5, 18, 2, shade(o.color, -0.4)));
      line(ctx, x + 6, y - 6, x + w - 6, y - 6, '#c9a86a', 2);
      break;
    }
    case 'stall': {
      shadow(ctx, x + w / 2, y + h - 2, w * 0.5, 6);
      fillRR(ctx, x + 4, y + h * 0.45, w - 8, h * 0.5, 3, o.color, shade(o.color, -0.3));
      for (let i = 0; i < 5; i++) circle(ctx, x + 14 + i * ((w - 28) / 4), y + h * 0.42, 5, hsl(i * 60 + 10, 65, 62));
      line(ctx, x + 6, y + h * 0.45, x + 6, y - h * 0.4, '#8a5a30', 3); line(ctx, x + w - 6, y + h * 0.45, x + w - 6, y - h * 0.4, '#8a5a30', 3);
      for (let i = 0; i < 6; i++) poly(ctx, [x + (w * i) / 6, y - h * 0.5, x + (w * (i + 1)) / 6, y - h * 0.5, x + (w * (i + 1)) / 6, y - h * 0.15, x + (w * (i + 0.5)) / 6, y - h * 0.05, x + (w * i) / 6, y - h * 0.15], i % 2 ? '#fff6e0' : o.roofColor);
      break;
    }
    case 'vane': {
      shadow(ctx, x + w / 2, y + h - 6, 10, 4);
      line(ctx, x + w / 2, y + h - 6, x + w / 2, y - h * 0.6, o.color, 3);
      ctx.save(); ctx.translate(x + w / 2, y - h * 0.5); ctx.rotate(Math.sin(t * 0.7) * 0.4 + (env.wind ? Math.sin(t * 3) * 0.3 : 0));
      line(ctx, -16, 0, 16, 0, o.roofColor, 3); poly(ctx, [16, -5, 24, 0, 16, 5], o.roofColor); poly(ctx, [-16, -7, -10, 0, -16, 7], o.roofColor);
      circle(ctx, 0, -8, 6, o.roofColor); poly(ctx, [4, -11, 10, -9, 4, -6], '#e05a5a');
      ctx.restore();
      break;
    }
    case 'sprinkler': {
      shadow(ctx, x + w / 2, y + h - 10, 9, 3);
      fillRR(ctx, x + w / 2 - 4, y + h * 0.35, 8, h * 0.45, 2, o.color, shade(o.color, -0.3));
      circle(ctx, x + w / 2, y + h * 0.33, 6, o.roofColor);
      if (env.morning) for (let i = 0; i < 6; i++) { const a = t * 3 + i; circle(ctx, x + w / 2 + Math.cos(a) * 16, y + h * 0.3 + Math.sin(a) * 6 - 4, 2, 'rgba(120,190,255,0.7)'); }
      break;
    }
    case 'scarecrow': {
      shadow(ctx, x + w / 2, y + h - 6, 10, 4);
      line(ctx, x + w / 2, y + h - 6, x + w / 2, y - h * 0.2, '#8a5a3a', 3);
      line(ctx, x + 8, y + h * 0.15, x + w - 8, y + h * 0.15, '#8a5a3a', 3);
      fillRR(ctx, x + w / 2 - 9, y + h * 0.1, 18, 22, 4, o.color);
      circle(ctx, x + w / 2, y - h * 0.15, 8, '#f0d8a0');
      poly(ctx, [x + w / 2 - 13, y - h * 0.22, x + w / 2 + 13, y - h * 0.22, x + w / 2, y - h * 0.5], o.roofColor);
      break;
    }
    case 'bin': {
      shadow(ctx, x + w / 2, y + h - 4, 16, 5);
      fillRR(ctx, x + 8, y + h * 0.25, w - 16, h * 0.68, 3, o.color, shade(o.color, -0.3));
      for (let i = 1; i < 4; i++) line(ctx, x + 8, y + h * 0.25 + i * 8, x + w - 8, y + h * 0.25 + i * 8, shade(o.color, -0.3), 1);
      ellipse(ctx, x + w / 2, y + h * 0.25, (w - 16) / 2, 5, o.roofColor);
      break;
    }
    case 'balloon': {
      const bob = Math.sin(t * 1.5 + o.x) * 4;
      shadow(ctx, x + w / 2, y + h - 6, 12, 4);
      line(ctx, x + w / 2 - 8, y + h - 8, x + w / 2 - 10, y - h * 0.3 + bob, '#8a6a4a', 1);
      line(ctx, x + w / 2 + 8, y + h - 8, x + w / 2 + 10, y - h * 0.3 + bob, '#8a6a4a', 1);
      fillRR(ctx, x + w / 2 - 9, y + h - 16, 18, 12, 2, '#a0683a');
      // Unpainted lift balloons use the island balloon colour from Customize.
      const bc = o.color === def.wall ? (env.balloon || o.color) : o.color;
      ellipse(ctx, x + w / 2, y - h * 0.65 + bob, 20, 24, bc);
      ellipse(ctx, x + w / 2 - 6, y - h * 0.75 + bob, 6, 9, 'rgba(255,255,255,0.4)');
      break;
    }
    case 'weight': {
      shadow(ctx, x + w / 2, y + h - 4, 18, 5);
      poly(ctx, [x + 8, y + h - 4, x + 14, y + h * 0.2, x + w - 14, y + h * 0.2, x + w - 8, y + h - 4], o.color, shade(o.color, -0.35));
      ctx.beginPath(); ctx.arc(x + w / 2, y + h * 0.2, 6, Math.PI, 0); ctx.strokeStyle = shade(o.color, -0.4); ctx.lineWidth = 3; ctx.stroke();
      break;
    }
    case 'rod': {
      line(ctx, x + w / 2, y + h - 6, x + w / 2, y - h * 0.9, o.color, 3);
      poly(ctx, [x + w / 2, y - h * 1.2, x + w / 2 + 7, y - h * 0.9, x + w / 2, y - h * 0.75, x + w / 2 - 7, y - h * 0.9], o.roofColor, '#ffffff');
      break;
    }
    case 'sails': {
      line(ctx, x + w / 2, y + h - 4, x + w / 2, y - h * 1.8, '#8a5a30', 4);
      const sail = env.sail || o.roofColor; const puff = env.wind ? 10 : 5 + Math.sin(t) * 2;
      ctx.beginPath(); ctx.moveTo(x + w / 2, y - h * 1.7); ctx.quadraticCurveTo(x + w / 2 + 30 + puff, y - h * 1.1, x + w / 2, y - h * 0.3);
      ctx.lineTo(x + 6, y - h * 0.3); ctx.quadraticCurveTo(x + 2 + puff * 0.5, y - h * 1.0, x + w / 2, y - h * 1.7);
      ctx.fillStyle = sail; ctx.fill(); ctx.strokeStyle = shade(sail, -0.3); ctx.lineWidth = 1.5; ctx.stroke();
      fillRR(ctx, x + 4, y + h * 0.4, w - 8, h * 0.5, 3, o.color);
      break;
    }
    case 'rudder': {
      ctx.save(); ctx.translate(x + w / 2, y + h * 0.35); ctx.rotate(Math.sin(t * 0.5) * 0.3);
      ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.strokeStyle = o.color; ctx.lineWidth = 4; ctx.stroke();
      for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; line(ctx, 0, 0, Math.cos(a) * 19, Math.sin(a) * 19, o.color, 2.5); }
      circle(ctx, 0, 0, 4, o.roofColor);
      ctx.restore();
      line(ctx, x + w / 2, y + h * 0.35, x + w / 2, y + h - 4, o.color, 4);
      break;
    }
    case 'flag': {
      line(ctx, x + 10, y + h - 6, x + 10, y - h * 1.1, '#8a6a4a', 3);
      drawFlag(ctx, x + 11, y - h * 1.1, 32, 22, env.flag, t);
      break;
    }
    default: boxBuilding(ctx, x, y, w, h, o, { night });
  }
  if (o.glow && night > 0.2) { ctx.globalAlpha = 0.3 * night; circle(ctx, x + w / 2, y + h / 2, w * 0.7, o.color); ctx.globalAlpha = 1; }
}

/** Island flag with a pattern; also used in the customiser. */
export function drawFlag(ctx, x, y, w, h, flag, t = 0) {
  const f = flag || { pattern: 'solid', c1: '#e05a5a', c2: '#ffffff' };
  ctx.save();
  ctx.beginPath();
  const wave = (i) => Math.sin(t * 3 + i * 0.3) * 2;
  ctx.moveTo(x, y);
  for (let i = 0; i <= 8; i++) ctx.lineTo(x + (w * i) / 8, y + wave(i));
  for (let i = 8; i >= 0; i--) ctx.lineTo(x + (w * i) / 8, y + h + wave(i));
  ctx.closePath(); ctx.clip();
  ctx.fillStyle = f.c1; ctx.fillRect(x - 2, y - 4, w + 4, h + 8);
  ctx.fillStyle = f.c2;
  switch (f.pattern) {
    case 'stripe': ctx.fillRect(x - 2, y + h / 3, w + 4, h / 3); break;
    case 'split': ctx.fillRect(x + w / 2, y - 4, w, h + 8); break;
    case 'cross': ctx.fillRect(x + w * 0.3, y - 4, w * 0.15, h + 8); ctx.fillRect(x - 2, y + h * 0.4, w + 4, h * 0.2); break;
    case 'star': star(ctx, x + w / 2, y + h / 2, h * 0.38, f.c2); break;
    case 'circle': circle(ctx, x + w / 2, y + h / 2, h * 0.3, f.c2); break;
    case 'chevron': poly(ctx, [x - 2, y - 4, x + w * 0.45, y + h / 2, x - 2, y + h + 4], f.c2); break;
    case 'checker': for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2) ctx.fillRect(x + (i * w) / 4, y + (j * h) / 3, w / 4 + 1, h / 3 + 1); break;
    default: break;
  }
  ctx.restore();
}

export function star(ctx, cx, cy, r, color) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rad = i % 2 ? r * 0.45 : r; ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}

// ---------------- decorations ----------------
export function drawDeco(ctx, o, t, env) {
  const x = o.x * TILE, y = o.y * TILE, s = TILE, c = o.color;
  const def = DATA.DECOR[o.ref];
  const cx = x + s / 2, cy = y + s / 2, dark = shade(c, -0.35);
  switch (def.art) {
    case 'lantern': case 'lamppost': {
      const tall = def.art === 'lamppost';
      line(ctx, cx, y + s - 6, cx, y + (tall ? -s * 0.6 : s * 0.05), tall ? c : '#6b4f3a', 3);
      const ly = tall ? y - s * 0.6 : y + 2;
      if (!tall) line(ctx, cx, y + s * 0.05, cx + 10, y + s * 0.05, '#6b4f3a', 2);
      fillRR(ctx, (tall ? cx : cx + 4) - 7, ly, 14, 16, 5, tall ? '#ffe9a8' : c, dark);
      break;
    }
    case 'chime': line(ctx, cx, y + s - 6, cx, y, '#8a6a4a', 2); line(ctx, cx - 10, y + 4, cx + 10, y + 4, '#8a6a4a', 2);
      for (let i = 0; i < 4; i++) line(ctx, cx - 9 + i * 6, y + 5, cx - 9 + i * 6 + Math.sin(t * 2 + i) * 2, y + 18 + i * 2, c, 2.5); break;
    case 'flowers': fillRR(ctx, x + 5, y + s * 0.55, s - 10, s * 0.35, 3, '#8a5a3a');
      for (let i = 0; i < 7; i++) { const fx = x + 10 + ((i * 13) % (s - 18)), fy = y + s * 0.5 - (i % 2) * 6; line(ctx, fx, fy, fx, fy + 10, '#5a9a4a', 1.5); circle(ctx, fx, fy, 4, i % 3 === 0 ? '#fff3a0' : c); } break;
    case 'planter': fillRR(ctx, x + 10, y + s * 0.5, s - 20, s * 0.42, 4, c, dark);
      for (let i = 0; i < 5; i++) ellipse(ctx, x + 14 + i * 5, y + s * 0.45 - (i % 2) * 4, 4, 7, '#5fae5f'); break;
    case 'path': fillRR(ctx, x + 2, y + 2, s - 4, s - 4, 6, c); circle(ctx, x + 14, y + 16, 6, shade(c, -0.12)); circle(ctx, x + 32, y + 30, 7, shade(c, -0.12)); break;
    case 'boards': for (let i = 0; i < 4; i++) fillRR(ctx, x + 2, y + 2 + i * 11, s - 4, 10, 2, shade(c, (i % 2) * -0.08), dark); break;
    case 'bridge': ctx.beginPath(); ctx.moveTo(x, y + s * 0.75); ctx.quadraticCurveTo(cx, y + s * 0.1, x + s, y + s * 0.75); ctx.lineWidth = 9; ctx.strokeStyle = c; ctx.stroke();
      ctx.lineWidth = 2; ctx.strokeStyle = dark; ctx.stroke(); break;
    case 'picnic': ctx.save(); ctx.translate(cx, cy); ctx.rotate(0.15); fillRR(ctx, -18, -14, 36, 28, 3, '#ffffff');
      ctx.fillStyle = c; for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) if ((i + j) % 2) ctx.fillRect(-18 + i * 9, -14 + j * 9.33, 9, 9.33); ctx.restore(); break;
    case 'fence': line(ctx, x, y + s * 0.55, x + s, y + s * 0.55, c, 3); line(ctx, x, y + s * 0.75, x + s, y + s * 0.75, c, 3);
      for (let i = 0; i < 3; i++) poly(ctx, [x + 6 + i * 15, y + s - 4, x + 6 + i * 15, y + s * 0.35, x + 10 + i * 15, y + s * 0.25, x + 14 + i * 15, y + s * 0.35, x + 14 + i * 15, y + s - 4], c, dark); break;
    case 'bench': fillRR(ctx, x + 4, y + s * 0.45, s - 8, 8, 2, c, dark); fillRR(ctx, x + 4, y + s * 0.2, s - 8, 6, 2, c, dark);
      line(ctx, x + 8, y + s * 0.5, x + 8, y + s - 6, dark, 3); line(ctx, x + s - 8, y + s * 0.5, x + s - 8, y + s - 6, dark, 3); break;
    case 'hammock': line(ctx, x + 4, y + s - 4, x + 4, y + 2, '#8a6a4a', 3); line(ctx, x + s - 4, y + s - 4, x + s - 4, y + 2, '#8a6a4a', 3);
      ctx.beginPath(); ctx.moveTo(x + 4, y + 10); ctx.quadraticCurveTo(cx, y + s * 0.75 + Math.sin(t) * 3, x + s - 4, y + 10); ctx.lineWidth = 6; ctx.strokeStyle = c; ctx.stroke(); break;
    case 'kite': line(ctx, cx, y + s - 6, cx + 20 + Math.sin(t) * 6, y - s * 1.1, '#8a6a4a', 1);
      ctx.save(); ctx.translate(cx + 20 + Math.sin(t) * 6, y - s * 1.2 + Math.cos(t * 1.3) * 4); ctx.rotate(Math.sin(t) * 0.2);
      poly(ctx, [0, -14, 10, 0, 0, 18, -10, 0], c, dark); line(ctx, 0, 18, -6 + Math.sin(t * 3) * 4, 34, c, 2); ctx.restore();
      fillRR(ctx, cx - 3, y + s - 12, 6, 8, 2, '#8a6a4a'); break;
    case 'birdbath': fillRR(ctx, cx - 4, y + s * 0.4, 8, s * 0.5, 2, c); ellipse(ctx, cx, y + s * 0.4, 17, 6, c); ellipse(ctx, cx, y + s * 0.38, 13, 4, '#9fd8f5'); break;
    case 'sundial': ellipse(ctx, cx, y + s * 0.6, 16, 9, c); poly(ctx, [cx, y + s * 0.6, cx + 8, y + s * 0.3, cx + 8, y + s * 0.6], dark); break;
    case 'topiary': fillRR(ctx, cx - 6, y + s * 0.7, 12, 12, 2, '#c46a4a'); cloud(ctx, cx - 18, y + s * 0.4, 0.42, c); break;
    case 'bunting': line(ctx, x + 2, y + s - 4, x + 2, y + 2, '#8a6a4a', 2); line(ctx, x + s - 2, y + s - 4, x + s - 2, y + 2, '#8a6a4a', 2);
      for (let i = 0; i < 5; i++) poly(ctx, [x + 4 + i * 8, y + 6, x + 12 + i * 8, y + 6, x + 8 + i * 8, y + 16], i % 2 ? c : '#fff6e0'); break;
    case 'swing': line(ctx, x + 6, y + s - 4, x + 10, y - s * 0.3, '#6b4f3a', 4); line(ctx, x + 10, y - s * 0.3, x + s - 6, y - s * 0.3, '#6b4f3a', 4);
      ellipse(ctx, x + 14, y - s * 0.4, 12, 10, c);
      { const sw = Math.sin(t * 1.5) * 4; line(ctx, cx + 2, y - s * 0.3, cx + 2 + sw, y + s * 0.5, '#c9a86a', 1.5); line(ctx, cx + 12, y - s * 0.3, cx + 12 + sw, y + s * 0.5, '#c9a86a', 1.5); fillRR(ctx, cx + sw, y + s * 0.5, 14, 4, 1, '#a8784a'); }
      break;
    case 'arch': ctx.beginPath(); ctx.arc(cx, y + s * 0.6, s * 0.42, Math.PI, 0); ctx.lineWidth = 6; ctx.strokeStyle = '#7a5a40'; ctx.stroke();
      for (let i = 0; i < 9; i++) { const a = Math.PI + (i * Math.PI) / 8; circle(ctx, cx + Math.cos(a) * s * 0.42, y + s * 0.6 + Math.sin(a) * s * 0.42, 4, i % 2 ? c : '#ffffff'); } break;
    case 'telescope': line(ctx, cx - 8, y + s - 4, cx, y + s * 0.5, '#6b4f3a', 2); line(ctx, cx + 8, y + s - 4, cx, y + s * 0.5, '#6b4f3a', 2);
      ctx.save(); ctx.translate(cx, y + s * 0.45); ctx.rotate(-0.6); fillRR(ctx, -4, -6, 26, 10, 3, c, dark); ctx.restore(); break;
    case 'starlamp': line(ctx, cx, y + s - 6, cx, y, '#6b6b7b', 2); star(ctx, cx, y - 4, 9 + Math.sin(t * 2) * 1, c); break;
    case 'crystals': for (let i = 0; i < 4; i++) poly(ctx, [x + 10 + i * 8, y + s - 6, x + 13 + i * 8, y + s * 0.2 + (i % 2) * 10, x + 17 + i * 8, y + s - 6], i % 2 ? c : shade(c, 0.3), dark); break;
    case 'owl': fillRR(ctx, cx - 8, y + s - 10, 16, 8, 2, '#9a9aa0'); ellipse(ctx, cx, y + s * 0.5, 11, 15, c);
      circle(ctx, cx - 5, y + s * 0.4, 4, '#ffffff'); circle(ctx, cx + 5, y + s * 0.4, 4, '#ffffff'); circle(ctx, cx - 5, y + s * 0.4, 2, '#3a3a4a'); circle(ctx, cx + 5, y + s * 0.4, 2, '#3a3a4a');
      poly(ctx, [cx - 2, y + s * 0.47, cx + 2, y + s * 0.47, cx, y + s * 0.53], '#e0a040'); break;
    case 'chest': fillRR(ctx, x + 8, y + s * 0.4, s - 16, s * 0.48, 3, c, dark); ctx.beginPath(); ctx.ellipse(cx, y + s * 0.4, (s - 16) / 2, 8, 0, Math.PI, 0); ctx.fillStyle = shade(c, 0.1); ctx.fill();
      line(ctx, x + 8, y + s * 0.5, x + s - 8, y + s * 0.5, '#d8b040', 2); circle(ctx, cx, y + s * 0.55, 3, '#d8b040'); break;
    case 'socks': line(ctx, x + 2, y + 6, x + s - 2, y + 6, '#8a6a4a', 1.5); line(ctx, x + 2, y + s - 4, x + 2, y + 6, '#8a6a4a', 2); line(ctx, x + s - 2, y + s - 4, x + s - 2, y + 6, '#8a6a4a', 2);
      for (let i = 0; i < 4; i++) { const sx = x + 6 + i * 10, sy = y + 7; fillRR(ctx, sx, sy, 6, 12, 2, hsl(i * 80 + 300, 55, 65)); fillRR(ctx, sx, sy + 9, 9, 5, 2, hsl(i * 80 + 300, 55, 65)); } break;
    case 'well': ellipse(ctx, cx, y + s * 0.7, 18, 8, shade(c, -0.2)); fillRR(ctx, cx - 18, y + s * 0.45, 36, s * 0.27, 3, c, dark); ellipse(ctx, cx, y + s * 0.45, 18, 7, '#3a4a6a');
      line(ctx, cx - 16, y + s * 0.45, cx - 16, y, '#7a5a40', 3); line(ctx, cx + 16, y + s * 0.45, cx + 16, y, '#7a5a40', 3); poly(ctx, [cx - 22, y + 2, cx, y - 14, cx + 22, y + 2], '#c0584a'); break;
    case 'mushrooms': for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3, mx = cx + Math.cos(a) * 15, my = cy + Math.sin(a) * 9; fillRR(ctx, mx - 2, my - 2, 4, 7, 1, '#f4ecdc'); ellipse(ctx, mx, my - 3, 6, 4, c); circle(ctx, mx - 2, my - 4, 1.2, '#fff'); } break;
    case 'cloudbench': cloud(ctx, x + 4, y + s * 0.6, 0.45, c); break;
    case 'trophy': fillRR(ctx, cx - 8, y + s - 10, 16, 6, 1, '#6b4f3a'); poly(ctx, [cx - 12, y + s * 0.2, cx + 12, y + s * 0.2, cx + 6, y + s * 0.6, cx - 6, y + s * 0.6], c, dark); line(ctx, cx, y + s * 0.6, cx, y + s - 10, c, 4); break;
    case 'chair': line(ctx, x + 10, y + s * 0.85, x + s - 8, y + s * 0.85, dark, 3);
      fillRR(ctx, x + 12, y + s * 0.5, s - 24, 7, 2, c); fillRR(ctx, x + 12, y + s * 0.05, 7, s * 0.5, 2, c);
      line(ctx, x + 14, y + s * 0.55, x + 14, y + s * 0.85, c, 2.5); line(ctx, x + s - 14, y + s * 0.55, x + s - 14, y + s * 0.85, c, 2.5); break;
    case 'bell': line(ctx, x + 8, y + s - 4, x + 8, y + 2, '#6b4f3a', 3); line(ctx, x + s - 8, y + s - 4, x + s - 8, y + 2, '#6b4f3a', 3); line(ctx, x + 6, y + 4, x + s - 6, y + 4, '#6b4f3a', 3);
      ctx.save(); ctx.translate(cx, y + 6); ctx.rotate(Math.sin(t * 2) * 0.1); poly(ctx, [-6, 0, 6, 0, 11, 20, -11, 20], c, dark); circle(ctx, 0, 21, 3, dark); ctx.restore(); break;
    case 'sign': line(ctx, cx, y + s - 4, cx, y + s * 0.3, '#6b4f3a', 3); fillRR(ctx, x + 4, y + s * 0.1, s - 8, s * 0.32, 3, c, dark); line(ctx, x + 10, y + s * 0.22, x + s - 12, y + s * 0.22, dark, 1.5); line(ctx, x + 10, y + s * 0.32, x + s - 18, y + s * 0.32, dark, 1.5); break;
    case 'frame': line(ctx, cx - 6, y + s - 4, cx, y + s * 0.6, '#6b4f3a', 2); line(ctx, cx + 6, y + s - 4, cx, y + s * 0.6, '#6b4f3a', 2);
      fillRR(ctx, x + 8, y + s * 0.1, s - 16, s * 0.55, 2, c, dark); fillRR(ctx, x + 12, y + s * 0.15, s - 24, s * 0.45, 1, '#bfe3f5');
      for (let i = 0; i < 4; i++) circle(ctx, x + 16 + i * 6, y + s * 0.42, 3, hsl(20 + i * 30, 50, 70)); break;
    case 'scarecrowdeco': line(ctx, cx, y + s - 4, cx, y + 4, '#8a5a3a', 3); line(ctx, x + 8, y + s * 0.35, x + s - 8, y + s * 0.35, '#8a5a3a', 3);
      fillRR(ctx, cx - 8, y + s * 0.3, 16, 18, 4, c); circle(ctx, cx, y + 8, 7, '#f0d8a0'); circle(ctx, cx - 3, y + 7, 1.2, '#3a3a3a'); circle(ctx, cx + 3, y + 7, 1.2, '#3a3a3a'); break;
    default: circle(ctx, cx, cy, 10, c);
  }
}

// ---------------- crops ----------------
/** Draw a crop growing on tile (tx,ty). progress 0..1, ripe bool. */
export function drawCrop(ctx, tx, ty, crop, progress, ripe, t, extra = {}) {
  const x = tx * TILE, y = ty * TILE, s = TILE;
  const cx = x + s / 2, base = y + s * 0.82;
  const T = crop.traits, hue = T.hue;
  const color = hueToHex(hue, 65, 58), leaf = '#5fae5f', leafDark = '#3f8a4a';
  const sway = Math.sin(t * 1.5 + tx * 0.7 + ty) * (extra.wind ? 3 : 1.2);
  const float = T.rare.includes('floating') ? Math.sin(t * 2 + tx) * 3 - 3 : 0;

  if (progress < 0.25 && !ripe) {                 // sprout
    line(ctx, cx, base, cx + sway * 0.3, base - 8, leafDark, 2);
    ellipse(ctx, cx - 4 + sway * 0.3, base - 9, 4, 2.5, leaf); ellipse(ctx, cx + 4 + sway * 0.3, base - 9, 4, 2.5, leaf);
    return;
  }
  const g = ripe ? 1 : 0.45 + progress * 0.5;
  const sz = (0.75 + T.size * 0.12) * g;
  ctx.save(); ctx.translate(cx, base + float); ctx.scale(sz, sz);
  const sh = crop.shape;
  if (sh === 'grain') {
    for (let i = -2; i <= 2; i++) {
      line(ctx, i * 4, 0, i * 4 + sway, -26, '#8fbf5a', 2);
      if (ripe || progress > 0.6) ellipse(ctx, i * 4 + sway, -28, 3, 7, ripe ? color : '#b8d880');
    }
  } else if (sh === 'flower') {
    line(ctx, 0, 0, sway, -22, leafDark, 2); ellipse(ctx, -5, -8, 5, 2.5, leaf); ellipse(ctx, 5, -12, 5, 2.5, leaf);
    if (ripe || progress > 0.6) {
      for (let i = 0; i < 6; i++) { const a = (i * Math.PI) / 3 + t * 0.2; ellipse(ctx, sway + Math.cos(a) * 6, -24 + Math.sin(a) * 6, 5, 5, ripe ? color : shade(color, 0.5)); }
      circle(ctx, sway, -24, 3.5, '#fff3a0');
    }
  } else if (sh === 'melon' || sh === 'round') {
    for (let i = 0; i < 3; i++) ellipse(ctx, -10 + i * 10, -6 - (i % 2) * 4, 7, 4, i % 2 ? leaf : leafDark);
    if (ripe || progress > 0.5) {
      const r = sh === 'melon' ? 11 : 7;
      const n = sh === 'melon' ? 1 : 2;
      for (let i = 0; i < n; i++) {
        const ox = n === 1 ? 0 : -6 + i * 12;
        circle(ctx, ox + sway * 0.3, -r - 3, ripe ? r : r * 0.6, ripe ? color : '#9fcf7a');
        if (sh === 'melon') { ctx.strokeStyle = shade(color, -0.25); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(ox, -r - 3, r * 0.4, r, 0, 0, Math.PI * 2); ctx.stroke(); }
        circle(ctx, ox - r * 0.35 + sway * 0.3, -r * 1.35 - 3, r * 0.25, 'rgba(255,255,255,0.4)');
      }
    }
  } else if (sh === 'long' || sh === 'pod') {
    line(ctx, 0, 0, sway, -24, leafDark, 2.5);
    ellipse(ctx, -6, -10, 6, 3, leaf); ellipse(ctx, 6, -16, 6, 3, leaf); ellipse(ctx, -5, -20, 5, 3, leaf);
    if (ripe || progress > 0.6) {
      for (let i = 0; i < 2; i++) {
        ctx.save(); ctx.translate(-5 + i * 10 + sway * 0.5, -14 + i * 4); ctx.rotate(sh === 'pod' ? 0.3 : 0.15 - i * 0.3);
        fillRR(ctx, -2.5, 0, 5, sh === 'pod' ? 14 : 12, 2.5, ripe ? color : '#9fcf7a'); ctx.restore();
      }
    }
  } else if (sh === 'bush') {
    ellipse(ctx, sway * 0.4, -10, 14, 11, leafDark); ellipse(ctx, sway * 0.4 - 4, -13, 10, 8, leaf);
    if (ripe || progress > 0.6) for (let i = 0; i < 6; i++) circle(ctx, -9 + (i * 7) % 18 + sway * 0.4, -16 + (i % 3) * 5, ripe ? (T.size > 2 ? 4 : 3) : 2, ripe ? color : '#cfe8a0');
  } else {                                          // leafy (root veg)
    if (ripe) { poly(ctx, [-5, -2, 5, -2, 0, 8], color); }
    for (let i = -1; i <= 1; i++) { ctx.save(); ctx.rotate(i * 0.4 + sway * 0.03); ellipse(ctx, 0, -12, 4, 11, i ? leaf : leafDark); ctx.restore(); }
  }
  ctx.restore();

  // Rare trait sparkles & glows.
  if (ripe && T.rare.includes('glowing')) { ctx.globalAlpha = 0.25 + Math.sin(t * 2) * 0.1; circle(ctx, cx, base - 14, 16, '#fff3a0'); ctx.globalAlpha = 1; }
  if (ripe && T.rare.includes('crystal')) star(ctx, cx + 10, base - 24, 3, '#c8f4ff');
  if (ripe && (T.rare.includes('starry') || T.rare.includes('shimmering'))) star(ctx, cx - 10, base - 26 + Math.sin(t * 3) * 2, 3, '#e8e0ff');
}

// ---------------- animals ----------------
export function drawAnimal(ctx, a, t, sel) {
  const def = DATA.ANIMALS[a.species];
  const x = a.x * TILE, y = a.y * TILE;
  const s = a.baby ? 0.62 : 1;
  const body = hsl(a.hue, a.light > 90 ? 15 : 45, a.light);
  const dark = hsl(a.hue, 30, Math.max(20, a.light - 35));
  const bob = Math.sin(t * 4 + a.x * 3) * (a.tx !== a.x ? 1.5 : 0.5);
  const fl = a.facing || 1;
  shadow(ctx, x, y + 8, 14 * s, 4 * s);
  ctx.save(); ctx.translate(x, y + bob); ctx.scale(s * fl, s);
  switch (a.species) {
    case 'cloud_sheep': {
      line(ctx, -7, 2, -7, 10, '#5a5050', 3); line(ctx, 7, 2, 7, 10, '#5a5050', 3);
      cloud(ctx, -17, -2, 0.4, body);
      if (a.pattern === 'spotted') { circle(ctx, -6, -6, 3, dark); circle(ctx, 6, -2, 3, dark); }
      if (a.pattern === 'stormcloud') { line(ctx, -2, -10, 2, -4, '#ffe066', 2); }
      if (a.pattern === 'sunset') { ctx.globalAlpha = 0.5; cloud(ctx, -17, -2, 0.4, '#ffb38a'); ctx.globalAlpha = 1; }
      if (a.pattern === 'curly') for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(-10 + i * 7, -7, 2.5, 0, Math.PI * 1.5); ctx.strokeStyle = shade('#ffffff', -0.2); ctx.lineWidth = 1; ctx.stroke(); }
      ellipse(ctx, 14, -4, 6, 7, '#5a5050'); circle(ctx, 16, -6, 1.3, '#fff');
      break;
    }
    case 'float_goat': {
      ellipse(ctx, 0, -2, 14, 9, body);
      if (a.pattern === 'patched') ellipse(ctx, -4, -3, 6, 5, dark);
      if (a.pattern === 'starry') star(ctx, -3, -4, 4, '#fff3a0');
      for (const lx of [-8, -3, 4, 9]) line(ctx, lx, 4, lx, 9, dark, 2.5);
      ellipse(ctx, 14, -9, 6, 6, body); poly(ctx, [11, -15, 9, -22, 13, -15], '#d8c8a0'); poly(ctx, [16, -15, 18, -22, 18, -14], '#d8c8a0');
      if (a.pattern === 'bearded') poly(ctx, [15, -4, 19, -4, 17, 2], '#f4f0e8');
      circle(ctx, 16, -10, 1.3, '#333');
      ellipse(ctx, 0, 14, 10, 2, 'rgba(200,230,255,0.6)');
      break;
    }
    case 'puff_hen': {
      circle(ctx, 0, -4, 10, body);
      if (a.pattern === 'speckled') for (let i = 0; i < 5; i++) circle(ctx, -5 + i * 3, -5 + (i % 2) * 4, 1.2, dark);
      if (a.pattern === 'rainbow') for (let i = 0; i < 3; i++) ellipse(ctx, -6, -6 + i * 3, 4, 1.5, hsl(i * 120, 70, 60));
      circle(ctx, 8, -10, 5, body); poly(ctx, [12, -10, 16, -9, 12, -8], '#f0a040');
      ellipse(ctx, 7, -15, 3, 2, '#e05a5a'); circle(ctx, 9, -11, 1.1, '#333');
      if (a.pattern === 'crested') poly(ctx, [5, -14, 7, -20, 9, -14], dark);
      line(ctx, -2, 6, -2, 10, '#f0a040', 2); line(ctx, 3, 6, 3, 10, '#f0a040', 2);
      break;
    }
    case 'mist_moth': {
      const flap = Math.sin(t * 10) * 0.4;
      ctx.save(); ctx.rotate(-0.3 - flap); ellipse(ctx, -9, -10, 10, 7, hsl(a.hue, 40, a.light)); ctx.restore();
      ctx.save(); ctx.rotate(0.3 + flap); ellipse(ctx, 9, -10, 10, 7, hsl(a.hue, 40, a.light)); ctx.restore();
      ellipse(ctx, 0, -6, 4, 9, dark);
      if (a.pattern === 'mooneye') { circle(ctx, -9, -12, 3, '#fff3a0'); circle(ctx, 9, -12, 3, '#fff3a0'); }
      if (a.pattern === 'glow') { ctx.globalAlpha = 0.3; circle(ctx, 0, -6, 16, '#d0c0ff'); ctx.globalAlpha = 1; }
      break;
    }
    case 'breeze_pup': {
      ellipse(ctx, 0, -2, 12, 8, body);
      if (a.pattern === 'spotted') circle(ctx, -4, -4, 3.5, dark);
      for (const lx of [-7, -2, 4, 8]) line(ctx, lx, 3, lx, 9, dark, 2.5);
      circle(ctx, 12, -8, 7, body); ellipse(ctx, 10, -12, 3, a.pattern === 'floppy' ? 7 : 5, dark);
      circle(ctx, 18, -7, 1.6, '#333'); circle(ctx, 14, -9, 1.2, '#333');
      line(ctx, -12, -4, -17, -10 + Math.sin(t * 12) * 3, body, 3);
      break;
    }
    default: circle(ctx, 0, 0, 10, body);
  }
  if (a.glow || a.pattern === 'glow') { ctx.globalAlpha = 0.25; circle(ctx, 0, -4, 18, '#fff3a0'); ctx.globalAlpha = 1; }
  ctx.restore();
  // status bubbles
  if (a.ready) bubble(ctx, x, y - 26 * s, def.productIcon === 'puff' ? '#ffffff' : '#f2d27a', t);
  else if (!a.fed && !a.baby) { ctx.globalAlpha = 0.65; circle(ctx, x + 10, y - 22 * s, 5, '#ffffff'); ctx.fillStyle = '#c0584a'; ctx.font = 'bold 8px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('!', x + 10, y - 19 * s); ctx.globalAlpha = 1; }
  if (sel) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(x, y + 8, 16 * s, 6 * s, 0, 0, Math.PI * 2); ctx.stroke(); }
}

function bubble(ctx, x, y, color, t) {
  const b = Math.sin(t * 3) * 2;
  circle(ctx, x, y + b, 8, '#ffffff'); circle(ctx, x, y + b, 5, color);
  poly(ctx, [x - 3, y + 6 + b, x + 3, y + 6 + b, x, y + 11 + b], '#ffffff');
}

// ---------------- player ----------------
export function drawPlayer(ctx, p, t, moving) {
  const x = p.x * TILE, y = p.y * TILE, c = p.colors;
  const step = moving ? Math.sin(t * 12) * 2 : 0;
  shadow(ctx, x, y + 10, 10, 3.5);
  line(ctx, x - 4, y + 2, x - 4 - step * 0.5, y + 10, c.bottom, 4);
  line(ctx, x + 4, y + 2, x + 4 + step * 0.5, y + 10, c.bottom, 4);
  const top = c.top;
  if (p.outfit === 'overalls') { fillRR(ctx, x - 8, y - 14, 16, 18, 5, top); fillRR(ctx, x - 6, y - 8, 12, 12, 3, c.bottom); }
  else if (p.outfit === 'raincoat') { poly(ctx, [x - 9, y + 4, x - 6, y - 14, x + 6, y - 14, x + 9, y + 4], top); }
  else if (p.outfit === 'captain') { fillRR(ctx, x - 9, y - 14, 18, 20, 4, top); line(ctx, x, y - 13, x, y + 5, '#d8b040', 1.5); }
  else if (p.outfit === 'keeper') { poly(ctx, [x - 10, y + 6, x - 6, y - 14, x + 6, y - 14, x + 10, y + 6], top); star(ctx, x, y - 4, 4, '#fff3a0'); }
  else if (p.outfit === 'apron') { fillRR(ctx, x - 8, y - 14, 16, 18, 5, top); fillRR(ctx, x - 5, y - 9, 10, 13, 2, '#f4ecdc'); }
  else if (p.outfit === 'pilot') { fillRR(ctx, x - 8, y - 14, 16, 18, 5, top); line(ctx, x - 8, y - 12, x + 8, y - 12, '#e8d8b0', 3); }
  else { fillRR(ctx, x - 8, y - 14, 16, 18, 6, top); for (let i = 0; i < 3; i++) line(ctx, x - 7, y - 10 + i * 5, x + 7, y - 10 + i * 5, shade(top, -0.15), 1); }
  circle(ctx, x, y - 21, 8, c.skin);
  circle(ctx, x - 3, y - 21, 1.2, '#3a2a2a'); circle(ctx, x + 3, y - 21, 1.2, '#3a2a2a');
  ellipse(ctx, x - 5, y - 18, 2, 1.2, 'rgba(240,120,120,0.4)'); ellipse(ctx, x + 5, y - 18, 2, 1.2, 'rgba(240,120,120,0.4)');
  drawHat(ctx, x, y - 27, p.hat, c.hat);
}

export function drawHat(ctx, x, y, hat, color) {
  switch (hat) {
    case 'straw': ellipse(ctx, x, y + 2, 13, 3.5, color); fillRR(ctx, x - 6, y - 5, 12, 7, 3, color); line(ctx, x - 6, y, x + 6, y, '#c0584a', 1.5); break;
    case 'beanie': ctx.beginPath(); ctx.arc(x, y + 3, 8.5, Math.PI, 0); ctx.fillStyle = color; ctx.fill(); circle(ctx, x, y - 6, 2.5, shade(color, 0.4)); break;
    case 'goggles': circle(ctx, x - 4, y + 3, 3.5, '#bfe3f5'); circle(ctx, x + 4, y + 3, 3.5, '#bfe3f5'); line(ctx, x - 9, y + 3, x + 9, y + 3, color, 1.5); break;
    case 'flower': for (let i = 0; i < 5; i++) circle(ctx, x - 8 + i * 4, y + 2 - (i % 2), 2.5, hsl(i * 70, 70, 70)); break;
    case 'tricorn': poly(ctx, [x - 12, y + 3, x, y - 7, x + 12, y + 3, x, y], color); break;
    case 'sock': fillRR(ctx, x - 6, y - 8, 12, 12, 3, color); fillRR(ctx, x + 2, y - 12, 9, 6, 3, color); break;
    case 'owl': poly(ctx, [x - 8, y + 2, x - 6, y - 7, x - 2, y + 1], color); poly(ctx, [x + 8, y + 2, x + 6, y - 7, x + 2, y + 1], color); break;
    case 'crown': star(ctx, x, y - 1, 7, color); break;
    default: break;
  }
}

// ---------------- airship ----------------
export function drawAirship(ctx, x, y, s, hull, balloon, t) {
  ctx.save(); ctx.translate(x, y + Math.sin(t * 1.2) * 4); ctx.scale(s, s);
  ellipse(ctx, 0, -44, 52, 24, balloon);
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(0, -44, Math.abs(i) * 12 + 2, 24, 0, 0, Math.PI * 2); ctx.strokeStyle = shade(balloon, -0.15); ctx.lineWidth = 1; ctx.stroke(); }
  line(ctx, -30, -24, -24, 0, '#6b4f3a', 1.5); line(ctx, 30, -24, 24, 0, '#6b4f3a', 1.5);
  poly(ctx, [-38, 0, 38, 0, 28, 16, -28, 16], hull, shade(hull, -0.35));
  for (let i = -2; i <= 2; i++) circle(ctx, i * 11, 7, 3, '#ffe9a8');
  poly(ctx, [38, 2, 48, -6, 46, 10], shade(hull, -0.2));
  const prop = Math.sin(t * 20) * 8; line(ctx, -42, 8 - prop, -42, 8 + prop, '#ddd', 2);
  ctx.restore();
}

// ---------------- portraits (dialogue) ----------------
export function drawPortrait(ctx, charId, size, override = null) {
  const c = override || DATA.CHARACTERS[charId] || { color: '#999', portrait: 'none' };
  const s = size, cx = s / 2, cy = s / 2;
  ctx.clearRect(0, 0, s, s);
  circle(ctx, cx, cy, s / 2, shade(c.color, 0.6));
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s / 100, s / 100);
  const face = (skin) => { circle(ctx, 0, 6, 24, skin); circle(ctx, -8, 4, 3, '#3a2a2a'); circle(ctx, 8, 4, 3, '#3a2a2a'); ctx.beginPath(); ctx.arc(0, 12, 7, 0.2, Math.PI - 0.2); ctx.strokeStyle = '#3a2a2a'; ctx.lineWidth = 2; ctx.stroke(); };
  switch (c.portrait) {
    case 'vane':
      line(ctx, 0, 45, 0, -10, '#8a6a4a', 5); ctx.save(); ctx.rotate(Math.sin(Date.now() / 600) * 0.1);
      line(ctx, -32, -10, 32, -10, c.color, 6); poly(ctx, [32, -20, 46, -10, 32, 0], c.color); poly(ctx, [-32, -24, -20, -10, -32, 4], c.color);
      circle(ctx, 0, -26, 14, c.color); poly(ctx, [6, -32, 18, -28, 6, -22], '#e05a5a'); circle(ctx, 4, -28, 2.5, '#3a2a2a');
      ctx.restore(); break;
    case 'botanist': face('#f2c6a0'); ellipse(ctx, 0, -18, 28, 10, '#7fbf6a'); circle(ctx, 14, -22, 6, '#f39ac0'); break;
    case 'hermit': face('#e0b090'); poly(ctx, [-20, 14, 20, 14, 0, 46], '#d8d8d0'); fillRR(ctx, -22, -28, 44, 14, 6, '#8a9a6a'); break;
    case 'kid': face('#d9a37a'); ctx.beginPath(); ctx.arc(0, -10, 24, Math.PI, 0); ctx.fillStyle = '#ff8a8a'; ctx.fill(); circle(ctx, 0, -32, 5, '#fff3a0'); break;
    case 'owls':
      [[-22, '#b8a080'], [22, '#9a8a70']].forEach(([ox, col]) => { ellipse(ctx, ox, 10, 20, 26, col); circle(ctx, ox - 7, 2, 7, '#fff'); circle(ctx, ox + 7, 2, 7, '#fff'); circle(ctx, ox - 7, 2, 3, '#3a3a4a'); circle(ctx, ox + 7, 2, 3, '#3a3a4a'); poly(ctx, [ox - 3, 10, ox + 3, 10, ox, 16], '#e0a040'); });
      break;
    case 'pirate': face('#d9a37a'); poly(ctx, [-34, -14, 0, -36, 34, -14, 0, -20], '#3a2a2a'); circle(ctx, 8, 4, 6, '#3a2a2a'); line(ctx, -20, -6, 24, 10, '#3a2a2a', 2); poly(ctx, [-12, 20, 12, 20, 0, 40], '#8a5a4a'); break;
    case 'trader': face('#f2c6a0'); fillRR(ctx, -26, -28, 52, 12, 4, c.color); break;
    default: face('#f2c6a0');
  }
  ctx.restore();
}

// ---------------- item icons (for the UI) ----------------
const iconCache = new Map();
/** Returns a data URL picture for an item description from itemInfo(). */
export function iconURL(info, size = 40) {
  const k = info.key + '|' + (info.icon && info.icon.color) + '|' + size;
  if (iconCache.has(k)) return iconCache.get(k);
  const cv = document.createElement('canvas'); cv.width = cv.height = size;
  const ctx = cv.getContext('2d');
  drawIcon(ctx, info, size);
  const url = cv.toDataURL();
  iconCache.set(k, url);
  return url;
}

export function drawIcon(ctx, info, s) {
  const ic = info.icon || { shape: 'rock', color: '#999' };
  const c = ic.color || '#999', d = shade(c, -0.35);
  ctx.save(); ctx.scale(s / 40, s / 40);
  switch (ic.shape) {
    case 'crop': {
      const crop = info.crop;
      ctx.translate(1, 2); ctx.scale(0.8, 0.8);
      if (crop) drawCrop(ctx, 0, 0, crop, 1, true, 0); // a ripe plant at tile (0,0), scaled down
      break;
    }
    case 'seedbag': fillRR(ctx, 9, 10, 22, 24, 5, '#e8d8b0', '#a08a60'); poly(ctx, [9, 14, 20, 6, 31, 14], '#d8c8a0', '#a08a60'); circle(ctx, 20, 23, 6, c); line(ctx, 20, 17, 20, 13, '#5fae5f', 2); break;
    case 'log': fillRR(ctx, 6, 14, 28, 14, 7, c, d); ellipse(ctx, 30, 21, 5, 7, shade(c, 0.3)); break;
    case 'rock': poly(ctx, [6, 30, 10, 14, 22, 9, 33, 16, 35, 30], c, d); break;
    case 'gem': poly(ctx, [20, 5, 32, 16, 20, 35, 8, 16], c, d); poly(ctx, [20, 5, 26, 16, 20, 35, 14, 16], shade(c, 0.35)); break;
    case 'bundle': for (let i = 0; i < 5; i++) line(ctx, 12 + i * 4, 34, 16 + i * 2, 6, c, 2.5); line(ctx, 10, 22, 30, 22, '#a07a4a', 3); break;
    case 'jar': fillRR(ctx, 11, 10, 18, 24, 5, c, '#7a8a9a'); fillRR(ctx, 13, 6, 14, 6, 2, '#b08a60'); ellipse(ctx, 16, 18, 2.5, 5, 'rgba(255,255,255,0.5)'); break;
    case 'bottle': fillRR(ctx, 12, 16, 16, 18, 7, c, '#6a6a8a'); fillRR(ctx, 17, 6, 6, 12, 2, c, '#6a6a8a'); fillRR(ctx, 16, 4, 8, 4, 1, '#b08a60'); break;
    case 'sack': poly(ctx, [10, 34, 8, 16, 14, 10, 26, 10, 32, 16, 30, 34], c, d); line(ctx, 13, 13, 27, 13, '#a07a4a', 2); break;
    case 'dye': ctx.beginPath(); ctx.moveTo(20, 4); ctx.quadraticCurveTo(34, 22, 20, 34); ctx.quadraticCurveTo(6, 22, 20, 4); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = d; ctx.lineWidth = 1.5; ctx.stroke(); circle(ctx, 16, 22, 3, 'rgba(255,255,255,0.5)'); break;
    case 'puff': cloud(ctx, 6, 22, 0.38, c); break;
    case 'shard': poly(ctx, [14, 34, 18, 6, 22, 34], c, d); poly(ctx, [22, 34, 28, 12, 30, 34], shade(c, 0.2), d); break;
    case 'coal': circle(ctx, 20, 22, 11, '#3a3030'); circle(ctx, 17, 19, 4, c); circle(ctx, 24, 25, 3, shade(c, 0.3)); break;
    case 'dust': for (let i = 0; i < 9; i++) star(ctx, 8 + (i * 11) % 24, 10 + (i * 7) % 22, 3 + (i % 2), c); break;
    case 'feather': ctx.save(); ctx.translate(20, 20); ctx.rotate(-0.6); ellipse(ctx, 0, 0, 6, 15, c); line(ctx, 0, -15, 0, 18, d, 1.5); ctx.restore(); break;
    case 'gear': ctx.save(); ctx.translate(20, 20); for (let i = 0; i < 8; i++) { ctx.rotate(Math.PI / 4); fillRR(ctx, -3, -14, 6, 6, 1, c); } circle(ctx, 0, 0, 10, c); circle(ctx, 0, 0, 4, '#fff8e8'); ctx.restore(); break;
    case 'sock': fillRR(ctx, 14, 6, 10, 20, 3, c, d); fillRR(ctx, 14, 20, 18, 9, 4, c, d); line(ctx, 14, 10, 24, 10, '#ffffff', 2); break;
    case 'plank': fillRR(ctx, 5, 15, 30, 10, 2, c, d); line(ctx, 9, 20, 30, 20, d, 1); break;
    case 'brick': fillRR(ctx, 6, 13, 28, 14, 2, c, d); line(ctx, 6, 20, 34, 20, shade(c, 0.3), 1); line(ctx, 20, 13, 20, 20, shade(c, 0.3), 1); break;
    case 'rope': ctx.beginPath(); ctx.arc(20, 20, 11, 0, Math.PI * 2); ctx.strokeStyle = c; ctx.lineWidth = 5; ctx.stroke(); ctx.beginPath(); ctx.arc(20, 20, 5, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.stroke(); break;
    case 'cloth': poly(ctx, [6, 10, 34, 8, 32, 30, 8, 32], c, '#aab'); line(ctx, 8, 18, 32, 17, 'rgba(0,0,0,0.08)', 1); break;
    case 'compost': ellipse(ctx, 20, 26, 14, 8, c); circle(ctx, 14, 22, 3, '#5fae5f'); circle(ctx, 24, 21, 2.5, '#8a6a3a'); break;
    case 'honey': fillRR(ctx, 10, 12, 20, 22, 6, c, d); fillRR(ctx, 9, 8, 22, 6, 2, '#c08a40'); ellipse(ctx, 16, 20, 2.5, 5, 'rgba(255,255,255,0.4)'); break;
    case 'egg': ellipse(ctx, 20, 21, 10, 13, c); ellipse(ctx, 17, 16, 3, 4, 'rgba(255,255,255,0.4)'); break;
    case 'scroll': fillRR(ctx, 8, 9, 24, 22, 3, c, '#a08a60'); for (let i = 0; i < 3; i++) line(ctx, 12, 15 + i * 5, 28, 15 + i * 5, '#a08a60', 1.5); break;
    case 'star': star(ctx, 20, 20, 14, c); break;
    case 'lens': circle(ctx, 20, 20, 13, c); ctx.beginPath(); ctx.arc(20, 20, 13, 0, Math.PI * 2); ctx.strokeStyle = '#b08a50'; ctx.lineWidth = 3; ctx.stroke(); ellipse(ctx, 15, 15, 3, 5, 'rgba(255,255,255,0.6)'); break;
    case 'key': circle(ctx, 13, 20, 7, c); circle(ctx, 13, 20, 3, '#fff8e8'); line(ctx, 19, 20, 34, 20, c, 4); line(ctx, 30, 20, 30, 27, c, 3); break;
    case 'shell': ctx.beginPath(); ctx.moveTo(20, 8); ctx.lineTo(34, 30); ctx.quadraticCurveTo(20, 36, 6, 30); ctx.closePath(); ctx.fillStyle = c; ctx.fill(); for (let i = 0; i < 4; i++) line(ctx, 20, 9, 9 + i * 7, 31, d, 1); break;
    case 'leaf': ctx.save(); ctx.translate(20, 20); ctx.rotate(-0.7); ellipse(ctx, 0, 0, 8, 15, c); line(ctx, 0, -14, 0, 16, d, 1.5); ctx.restore(); break;
    case 'glass': poly(ctx, [10, 30, 14, 8, 26, 8, 30, 30], c, '#fff'); line(ctx, 16, 12, 14, 26, 'rgba(255,255,255,0.6)', 2); break;
    case 'deco': ctx.translate(1, 6); ctx.scale(0.8, 0.8); drawDeco(ctx, { x: 0, y: 0, ref: info.key.slice(5), color: c }, 0, { night: 0 }); break;
    case 'building': fillRR(ctx, 8, 18, 24, 16, 2, '#f3e2c3', '#8a6a4a'); poly(ctx, [5, 19, 20, 6, 35, 19], c); break;
    case 'land': poly(ctx, [4, 18, 36, 18, 30, 34, 10, 34], '#9a8f84'); fillRR(ctx, 4, 12, 32, 8, 3, c); break;
    case 'animal': ctx.translate(18, 26); ctx.scale(0.8, 0.8);
      drawAnimal(ctx, { species: info.key.slice(7), x: 0, y: 0, tx: 0, hue: DATA.ANIMALS[info.key.slice(7)].baseHue, light: DATA.ANIMALS[info.key.slice(7)].baseLight, pattern: 'plain', fed: true }, 0); break;
    default: circle(ctx, 20, 20, 12, c);
  }
  ctx.restore();
}

// ---------------- island underside ----------------
/** Rocky underside below the bottom edge of a land tile. */
export function drawUnderside(ctx, tx, ty, depth, rockColor) {
  const x = tx * TILE, y = (ty + 1) * TILE;
  const seed = Math.abs(Math.sin(tx * 12.9898 + ty * 78.233) * 43758.5453) % 1;
  const d = TILE * (0.6 + depth * 0.35 + seed * 0.5);
  ctx.beginPath();
  ctx.moveTo(x - 1, y - 4);
  ctx.lineTo(x + TILE + 1, y - 4);
  ctx.lineTo(x + TILE * 0.85, y + d * 0.5);
  ctx.lineTo(x + TILE * (0.45 + seed * 0.2), y + d);
  ctx.lineTo(x + TILE * 0.15, y + d * 0.55);
  ctx.closePath();
  const g = ctx.createLinearGradient(0, y, 0, y + d);
  g.addColorStop(0, rockColor); g.addColorStop(1, shade(rockColor, -0.35));
  ctx.fillStyle = g; ctx.fill();
}
