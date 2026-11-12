// =============================================================
//  UTILS — small helpers shared by every module.
// =============================================================

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const rand = (a, b) => a + Math.random() * (b - a);
export const randInt = (a, b) => Math.floor(rand(a, b + 1));
export const chance = (p) => Math.random() < p;
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/** Pick a key from { key: weight } */
export function weightedPick(weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [k, w] of entries) { r -= w; if (r <= 0) return k; }
  return entries.length ? entries[entries.length - 1][0] : null;
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/** Small, stable string hash (for generating ids from content). */
export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return (h >>> 0).toString(36);
}

export const deepClone = (o) => JSON.parse(JSON.stringify(o));
export const uid = () => Math.random().toString(36).slice(2, 9);

// ---------- colour helpers ----------
export function hsl(h, s, l, a = 1) { return `hsla(${Math.round(h)},${Math.round(s)}%,${Math.round(l)}%,${a})`; }

export function hexToRgb(hex) {
  const m = hex.replace('#', '');
  const n = parseInt(m.length === 3 ? m.split('').map(c => c + c).join('') : m, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}
/** Average several hex colours. */
export function mixHex(list) {
  if (!list.length) return '#ffffff';
  const sum = [0, 0, 0];
  list.forEach(h => { const c = hexToRgb(h); sum[0] += c[0]; sum[1] += c[1]; sum[2] += c[2]; });
  return rgbToHex(sum[0] / list.length, sum[1] / list.length, sum[2] / list.length);
}
export function shade(hex, amt) {
  const [r, g, b] = hexToRgb(hex);
  const f = amt < 0 ? 0 : 255, t = Math.abs(amt);
  return rgbToHex(r + (f - r) * t, g + (f - g) * t, b + (f - b) * t);
}
export function hexToHue(hex) {
  let [r, g, b] = hexToRgb(hex).map(v => v / 255);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  if (!d) return 0;
  let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}
export function hueToHex(h, s = 65, l = 60) {
  s /= 100; l /= 100;
  const k = n => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}
/** Average two hues on the colour wheel. */
export function mixHue(a, b) {
  const ra = a * Math.PI / 180, rb = b * Math.PI / 180;
  const x = Math.cos(ra) + Math.cos(rb), y = Math.sin(ra) + Math.sin(rb);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
/** A friendly name for a hue. */
export function hueName(h) {
  const names = [[10, 'Crimson'], [25, 'Coral'], [40, 'Amber'], [55, 'Golden'], [75, 'Lime'], [110, 'Clover'],
    [150, 'Jade'], [175, 'Seafoam'], [195, 'Sky'], [220, 'Azure'], [250, 'Indigo'], [280, 'Violet'],
    [310, 'Orchid'], [335, 'Rose'], [361, 'Crimson']];
  h = ((h % 360) + 360) % 360;
  for (const [max, n] of names) if (h < max) return n;
  return 'Crimson';
}
export function colorName(hex) {
  const [r, g, b] = hexToRgb(hex);
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  if (mx - mn < 25) return mx > 200 ? 'Cloud White' : mx > 110 ? 'Ash Grey' : 'Charcoal';
  return hueName(hexToHue(hex));
}

export function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

/** Escape text before putting it into innerHTML. */
export function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
