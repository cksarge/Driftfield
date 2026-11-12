// =============================================================
//  ISLAND — land tiles, land chunks, placed objects and balance.
//
//  The island is a sparse grid: state.tiles['x,y'] exists only where
//  there is ground. Buildings and decorations live in state.objects,
//  each covering a rectangle of tiles.
// =============================================================

import { G } from './state.js';
import { DATA } from '../data/index.js';
import { uid, clamp } from './utils.js';
import { emit } from './events.js';

export const tkey = (x, y) => x + ',' + y;
export const tileAt = (x, y) => G.state.tiles[tkey(x, y)] || null;
export const isLand = (x, y) => !!G.state.tiles[tkey(x, y)];

export function newTile() { return { soil: 0, wet: false, q: 0, crop: null }; }

/** Every land tile as [x, y, tile]. */
export function allTiles() {
  return Object.entries(G.state.tiles).map(([k, t]) => { const [x, y] = k.split(',').map(Number); return [x, y, t]; });
}

/** Bounding box of the island in tiles. */
export function bounds() {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const k in G.state.tiles) {
    const [x, y] = k.split(',').map(Number);
    if (x < minX) minX = x; if (y < minY) minY = y; if (x > maxX) maxX = x; if (y > maxY) maxY = y;
  }
  if (minX === Infinity) return { minX: 0, minY: 0, maxX: 0, maxY: 0, cx: 0, cy: 0 };
  return { minX, minY, maxX, maxY, cx: (minX + maxX + 1) / 2, cy: (minY + maxY + 1) / 2 };
}

// ---------------- land chunks ----------------
/** Turn a shape (array of strings) into tile offsets, rotated `rot` quarter turns. */
export function shapeCells(shape, rot = 0) {
  let cells = [];
  shape.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') cells.push([x, y]); }));
  for (let r = 0; r < (rot % 4); r++) cells = cells.map(([x, y]) => [-y, x]);
  const mx = Math.min(...cells.map(c => c[0])), my = Math.min(...cells.map(c => c[1]));
  return cells.map(([x, y]) => [x - mx, y - my]);
}

/** Can a land piece be attached with its top-left at (ox, oy)? */
export function canPlaceLand(shapeId, ox, oy, rot) {
  const cells = shapeCells(DATA.LAND[shapeId].shape, rot);
  let touches = false;
  for (const [dx, dy] of cells) {
    const x = ox + dx, y = oy + dy;
    if (isLand(x, y)) return false;
    if (isLand(x + 1, y) || isLand(x - 1, y) || isLand(x, y + 1) || isLand(x, y - 1)) touches = true;
  }
  return touches;
}

export function placeLand(shapeId, ox, oy, rot) {
  const cells = shapeCells(DATA.LAND[shapeId].shape, rot);
  cells.forEach(([dx, dy]) => { G.state.tiles[tkey(ox + dx, oy + dy)] = newTile(); });
  emit('land:placed', { shapeId });
}

/** Stamp a shape directly (used to build the starting islands). */
export function stampShape(shape, ox, oy) {
  shape.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') G.state.tiles[tkey(ox + x, oy + y)] = newTile(); }));
}

// ---------------- objects (buildings & decorations) ----------------
export function objectAt(x, y) {
  for (const o of G.state.objects) {
    if (x >= o.x && x < o.x + o.w && y >= o.y && y < o.y + o.h) return o;
  }
  return null;
}

export function objectDef(o) { return o.type === 'building' ? DATA.BUILDINGS[o.ref] : DATA.DECOR[o.ref]; }

/** Are all tiles in the rectangle free land (no objects, no crops)? */
export function areaFree(x, y, w, h, ignore = null) {
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) {
    const t = tileAt(x + i, y + j);
    if (!t || t.crop) return false;
    const o = objectAt(x + i, y + j);
    if (o && o !== ignore) return false;
  }
  return true;
}

export function addObject(type, ref, x, y, extra = {}) {
  const def = type === 'building' ? DATA.BUILDINGS[ref] : DATA.DECOR[ref];
  const [w, h] = def.size || [1, 1];
  const o = {
    id: uid(), type, ref, x, y, w, h,
    color: def.wall || def.color, roof: (def.roofs && def.roofs[0]) || null, roofColor: def.roof || null,
    data: {}, ...extra,
  };
  // Clear soil underneath so buildings don't sit on tilled dirt.
  for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) { const t = tileAt(x + i, y + j); if (t) { t.soil = 0; t.wet = false; } }
  G.state.objects.push(o);
  emit('object:placed', o);
  return o;
}

export function removeObject(o) {
  G.state.objects = G.state.objects.filter(p => p !== o);
  emit('object:removed', o);
}

export const objectsOfType = (ref) => G.state.objects.filter(o => o.ref === ref);
export const hasBuilding = (ref) => G.state.objects.some(o => o.type === 'building' && o.ref === ref && !o.broken);

/** Distance (in tiles) from a tile to the nearest edge of an object. */
export function distToObject(x, y, o) {
  const dx = Math.max(o.x - x, 0, x - (o.x + o.w - 1));
  const dy = Math.max(o.y - y, 0, y - (o.y + o.h - 1));
  return Math.max(dx, dy);
}

/** Objects of a type within `r` tiles of (x, y). */
export function objectsNear(x, y, ref, r) {
  return G.state.objects.filter(o => o.ref === ref && !o.broken && distToObject(x, y, o) <= r);
}

/** Is this tile sheltered by a greenhouse (ignores weather & climate)? */
export const isSheltered = (x, y) => objectsNear(x, y, 'greenhouse', 2).length > 0;

// ---------------- weight & balance ----------------
/**
 * Island tilt. Each building's weight pulls on its side of the island
 * (left/right of the centre). Balloons have negative weight and lift.
 * Returns { angle (radians, for drawing), torque, tilted (bool) }.
 */
export function balance() {
  const b = bounds();
  const land = Object.keys(G.state.tiles).length || 1;
  let torque = 0;
  for (const o of G.state.objects) {
    const def = objectDef(o);
    if (!def) continue;
    const wgt = o.type === 'building' ? (def.weight || 1) : (def.weight || 0.3);
    const cx = o.x + o.w / 2;
    torque += wgt * (cx - b.cx);
  }
  const t = torque / Math.max(12, land * 0.6);
  return { angle: clamp(t * 0.05, -0.14, 0.14), torque: t, tilted: Math.abs(t) > 1.2 };
}
