// =============================================================
//  INPUT — mouse, touch and keyboard.
//
//  • Tap / click         use the current tool on a tile
//  • Drag                pan the camera
//  • Pinch / wheel       zoom
//  • Keys 1-6            choose tools; Esc closes panels
// =============================================================

import { G } from './state.js';
import { screenToWorld } from './render.js';
import { TILE } from './art.js';
import { clamp } from './utils.js';
import { onWorldTap, onSkyTap } from './interact.js';
import { closePanel, closeAllPanels, panelOpen, dialogOpen, advanceDialog, updateToolbar } from './ui/ui.js';

const pointers = new Map();
let drag = null, pinch = null;

export function initInput(canvas) {
  canvas.addEventListener('pointerdown', (e) => {
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* not capturable; fine */ }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) drag = { x: e.clientX, y: e.clientY, cx: G.rt.camera.x, cy: G.rt.camera.y, moved: false };
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), zoom: G.rt.camera.zoom };
      drag = null;
    }
  });
  canvas.addEventListener('pointermove', (e) => {
    if (e.pointerType === 'mouse') updateHover(e.clientX, e.clientY);
    if (!pointers.has(e.pointerId)) return;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      G.rt.camera.zoom = clamp(pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y) / pinch.d, 0.4, 2.4);
      return;
    }
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.hypot(dx, dy) > 8) drag.moved = true;
      if (drag.moved) { G.rt.camera.x = drag.cx - dx / G.rt.camera.zoom; G.rt.camera.y = drag.cy - dy / G.rt.camera.zoom; }
    }
  });
  const end = (e) => {
    pointers.delete(e.pointerId);
    if (pinch && pointers.size < 2) { pinch = null; drag = null; return; }
    if (drag && !drag.moved && e.type === 'pointerup') tap(e.clientX, e.clientY);
    drag = null;
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);
  // Touch pointers "leave" right after every tap, so only clear hover for mice
  // (otherwise the tap-to-preview, tap-to-confirm placement could never confirm).
  canvas.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') G.rt.hover = null; });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    G.rt.camera.zoom = clamp(G.rt.camera.zoom * (e.deltaY < 0 ? 1.1 : 0.9), 0.4, 2.4);
  }, { passive: false });

  window.addEventListener('keydown', (e) => {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT')) return;
    if (dialogOpen() && (e.key === ' ' || e.key === 'Enter')) { advanceDialog(); e.preventDefault(); return; }
    if (e.key === 'Escape') {
      if (panelOpen()) closePanel(); else { closeAllPanels(); G.rt.placing = null; G.rt.tool = 'hand'; updateToolbar(); }
      return;
    }
    if (panelOpen() || !G.state) return;
    const tools = { 1: 'hand', 2: 'hoe', 3: 'water', 4: 'seed', 5: 'fert', 6: 'paint' };
    if (tools[e.key]) { document.getElementById('tool-' + tools[e.key])?.click(); }
    if ((e.key === 'r' || e.key === 'R') && G.rt.placing) { G.rt.placing.rot = (G.rt.placing.rot + 1) % 4; }
    const pan = 40 / G.rt.camera.zoom;
    if (e.key === 'ArrowLeft' || e.key === 'a') G.rt.camera.x -= pan;
    if (e.key === 'ArrowRight' || e.key === 'd') G.rt.camera.x += pan;
    if (e.key === 'ArrowUp' || e.key === 'w') G.rt.camera.y -= pan;
    if (e.key === 'ArrowDown' || e.key === 's') G.rt.camera.y += pan;
  });
}

function updateHover(sx, sy) {
  if (!G.state) return;
  const w = screenToWorld(sx, sy);
  G.rt.hover = { x: Math.floor(w.x / TILE), y: Math.floor(w.y / TILE) };
}

function tap(sx, sy) {
  if (!G.state || G.rt.storm || G.rt.whiteHold) return;
  if (dialogOpen()) { advanceDialog(); return; }
  // Sky first: falling stars and passing islands.
  if (onSkyTap(sx, sy)) return;
  const w = screenToWorld(sx, sy);
  const tx = Math.floor(w.x / TILE), ty = Math.floor(w.y / TILE);
  onWorldTap(tx, ty, w.x / TILE, w.y / TILE);
}
