// =============================================================
//  AUDIO — gentle procedural music and sound effects.
//
//  Everything is synthesised live with the Web Audio API, so there
//  are no audio files to download, license or cache. The music is a
//  slow generative pentatonic piece whose mood follows the game
//  (happy, calm, uneasy, storm, quiet, festival).
// =============================================================

import { G } from './state.js';

const MOODS = {
  happy:    { scale: [0, 2, 4, 7, 9], root: 60, tempo: 0.42, chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], pad: 0.05 },
  calm:     { scale: [0, 2, 4, 7, 9], root: 57, tempo: 0.55, chords: [[0, 4, 7], [-3, 0, 4], [5, 9, 12], [7, 11, 14]], pad: 0.05 },
  uneasy:   { scale: [0, 2, 3, 7, 8], root: 57, tempo: 0.6, chords: [[0, 3, 7], [-4, 0, 3], [-2, 2, 5], [0, 3, 7]], pad: 0.06 },
  storm:    { scale: [0, 1, 3, 6, 7], root: 50, tempo: 0.3, chords: [[0, 3, 6], [1, 4, 7]], pad: 0.08 },
  quiet:    { scale: [0, 4, 7], root: 60, tempo: 1.2, chords: [[0, 4, 7]], pad: 0.03 },
  night:    { scale: [0, 2, 4, 7, 11], root: 55, tempo: 0.8, chords: [[0, 4, 7, 11], [5, 9, 12, 16]], pad: 0.05 },
  festival: { scale: [0, 2, 4, 5, 7, 9], root: 62, tempo: 0.28, chords: [[0, 4, 7], [5, 9, 12], [7, 11, 14], [0, 4, 7]], pad: 0.05 },
};

class Audio {
  constructor() { this.ctx = null; this.mood = 'calm'; this.nextNote = 0; this.step = 0; this.rain = null; }

  /** Must be called from a user gesture (browsers block autoplay). */
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.music = this.ctx.createGain(); this.sfxBus = this.ctx.createGain(); this.amb = this.ctx.createGain();
      const conv = this.ctx.createConvolver(), wet = this.ctx.createGain();
      conv.buffer = this.makeImpulse(); wet.gain.value = 0.35;
      this.music.connect(conv); conv.connect(wet); wet.connect(this.ctx.destination);
      this.music.connect(this.ctx.destination);
      this.sfxBus.connect(this.ctx.destination); this.amb.connect(this.ctx.destination);
      this.applyVolume();
      this.noise = this.makeNoise();
    } catch (e) { this.ctx = null; }
  }

  applyVolume() {
    if (!this.ctx) return;
    const s = G.settings, m = s.muted ? 0 : 1;
    this.music.gain.value = s.music * 0.5 * m;
    this.sfxBus.gain.value = s.sfx * 0.6 * m;
    this.amb.gain.value = s.sfx * 0.35 * m;
  }

  setMood(m) { if (MOODS[m]) this.mood = m; }

  /** A soft, decaying noise burst used as a reverb impulse. */
  makeImpulse() {
    const len = this.ctx.sampleRate * 2.2, buf = this.ctx.createBuffer(2, len, this.ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    return buf;
  }

  makeNoise() {
    const len = this.ctx.sampleRate * 2, buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const d = buf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  tone(freq, start, dur, { type = 'sine', vol = 0.15, bus = 'music', attack = 0.02, detune = 0 } = {}) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.value = freq; o.detune.value = detune;
    g.gain.setValueAtTime(0, start);
    g.gain.linearRampToValueAtTime(vol, start + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    o.connect(g); g.connect(bus === 'music' ? this.music : this.sfxBus);
    o.start(start); o.stop(start + dur + 0.05);
  }

  /** Called every frame: schedules the next notes of the music. */
  update(weather) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const M = MOODS[this.mood];
    const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
    while (this.nextNote < now + 0.3) {
      const t = Math.max(this.nextNote, now);
      const bar = Math.floor(this.step / 8), beat = this.step % 8;
      const chord = M.chords[bar % M.chords.length];
      if (beat === 0) chord.forEach((n, i) => this.tone(midi(M.root - 12 + n), t + i * 0.03, M.tempo * 8, { type: 'triangle', vol: M.pad, attack: 0.8 }));
      if (Math.random() < 0.55) {
        const deg = M.scale[Math.floor(Math.random() * M.scale.length)] + (Math.random() < 0.3 ? 12 : 0);
        this.tone(midi(M.root + deg), t, M.tempo * 3, { type: 'sine', vol: 0.07 + Math.random() * 0.04, attack: 0.01 });
      }
      this.step++;
      this.nextNote = t + M.tempo;
    }
    this.ambience(weather);
  }

  /** Looping rain/wind noise depending on weather. */
  ambience(weather) {
    const want = ['rain', 'storm', 'snow', 'wind', 'mist'].includes(weather) ? weather : null;
    if (want === (this.rain && this.rain.kind)) return;
    if (this.rain) { const r = this.rain; r.g.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1); setTimeout(() => { try { r.src.stop(); } catch (e) { /* already stopped */ } }, 1200); this.rain = null; }
    if (!want) return;
    const src = this.ctx.createBufferSource(); src.buffer = this.noise; src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = want === 'wind' || want === 'mist' ? 'bandpass' : 'lowpass';
    f.frequency.value = want === 'storm' ? 900 : want === 'rain' ? 1400 : want === 'snow' ? 500 : 400;
    const g = this.ctx.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(want === 'storm' ? 0.35 : want === 'snow' || want === 'mist' ? 0.08 : 0.2, this.ctx.currentTime + 2);
    src.connect(f); f.connect(g); g.connect(this.amb); src.start();
    this.rain = { src, g, kind: want };
  }

  // ---------------- sound effects ----------------
  sfx(name) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime, b = { bus: 'sfx' };
    const S = {
      click:   () => this.tone(880, t, 0.08, { ...b, type: 'triangle', vol: 0.12 }),
      soft:    () => this.tone(660, t, 0.1, { ...b, type: 'sine', vol: 0.1 }),
      till:    () => this.thud(180, 0.12),
      plant:   () => { this.tone(520, t, 0.12, { ...b, vol: 0.12 }); this.tone(780, t + 0.06, 0.12, { ...b, vol: 0.1 }); },
      water:   () => this.splash(),
      harvest: () => [660, 880, 1100].forEach((f, i) => this.tone(f, t + i * 0.06, 0.18, { ...b, type: 'triangle', vol: 0.12 })),
      coin:    () => { this.tone(1320, t, 0.1, { ...b, type: 'square', vol: 0.05 }); this.tone(1760, t + 0.07, 0.2, { ...b, type: 'square', vol: 0.05 }); },
      mix:     () => [440, 550, 660, 880].forEach((f, i) => this.tone(f + Math.random() * 30, t + i * 0.05, 0.25, { ...b, type: 'sine', vol: 0.09 })),
      discover:() => [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, t + i * 0.08, 0.5, { ...b, type: 'triangle', vol: 0.1 })),
      build:   () => { this.thud(140, 0.15); setTimeout(() => this.thud(160, 0.12), 120); },
      error:   () => this.tone(200, t, 0.2, { ...b, type: 'sawtooth', vol: 0.04 }),
      baa:     () => { this.tone(330, t, 0.35, { ...b, type: 'sawtooth', vol: 0.04, detune: 30 }); },
      whoosh:  () => this.splash(0.5, 2000),
      page:    () => this.splash(0.12, 3000),
    };
    (S[name] || S.click)();
  }
  chime() { if (!this.ctx) return; const t = this.ctx.currentTime; [1047, 1319, 1568, 2093].forEach((f, i) => this.tone(f, t + i * 0.12, 1.2, { bus: 'sfx', type: 'sine', vol: 0.08 })); }

  thud(freq, dur) {
    const c = this.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.frequency.setValueAtTime(freq, t); o.frequency.exponentialRampToValueAtTime(freq * 0.5, t + dur);
    g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(this.sfxBus); o.start(t); o.stop(t + dur);
  }
  splash(dur = 0.25, freq = 1800) {
    const c = this.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime;
    src.buffer = this.noise; f.type = 'bandpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(0.25, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(f); f.connect(g); g.connect(this.sfxBus); src.start(t); src.stop(t + dur);
  }
  thunder(big = false) {
    if (!this.ctx) return;
    const c = this.ctx, src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime;
    src.buffer = this.noise; f.type = 'lowpass'; f.frequency.value = big ? 300 : 180;
    g.gain.setValueAtTime(big ? 0.9 : 0.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + (big ? 3 : 2));
    src.connect(f); f.connect(g); g.connect(this.sfxBus); src.start(t); src.stop(t + 3);
  }
}

export const audio = new Audio();
