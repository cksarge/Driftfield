// =============================================================
//  EVENT BUS — lets systems talk without importing each other.
//
//  emit('harvest', { tile, crop })  →  every on('harvest', fn) runs.
//  The tutorial, discovery log, sounds and UI all listen here.
// =============================================================

const listeners = new Map();

export function on(name, fn) {
  if (!listeners.has(name)) listeners.set(name, new Set());
  listeners.get(name).add(fn);
  return () => listeners.get(name).delete(fn);
}

export function emit(name, data) {
  const set = listeners.get(name);
  if (set) [...set].forEach(fn => { try { fn(data); } catch (e) { console.error(`[event ${name}]`, e); } });
  const any = listeners.get('*');
  if (any) [...any].forEach(fn => { try { fn(name, data); } catch (e) { console.error(e); } });
}
