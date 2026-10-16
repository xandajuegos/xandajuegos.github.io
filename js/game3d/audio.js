// Audio 100% sintetizado con Web Audio (sin archivos externos):
// efectos de interfaz/cartas/fichas y una música ambiental generativa.

let ctx = null;
let master, sfxGain, musicGain, comp;
let vols = { music: 0.5, sfx: 0.8 };
let musicOn = false;
let musicTimer = null;
let step = 0;
let mood = 'menu';

function ensure() {
  if (ctx) return ctx;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 4;
  master = ctx.createGain(); master.gain.value = 0.9;
  sfxGain = ctx.createGain(); sfxGain.gain.value = vols.sfx;
  musicGain = ctx.createGain(); musicGain.gain.value = vols.music * 0.35;
  sfxGain.connect(master); musicGain.connect(master);
  master.connect(comp); comp.connect(ctx.destination);
  return ctx;
}

export function unlockAudio() {
  const c = ensure();
  if (c && c.state === 'suspended') c.resume();
}

export function setVolumes({ music, sfx }) {
  if (music != null) vols.music = music;
  if (sfx != null) vols.sfx = sfx;
  if (ctx) {
    musicGain.gain.setTargetAtTime(vols.music * 0.35, ctx.currentTime, 0.05);
    sfxGain.gain.setTargetAtTime(vols.sfx, ctx.currentTime, 0.05);
  }
}

/* ---------- Bloques de síntesis ---------- */
function tone({ f = 440, f2 = null, type = 'sine', dur = 0.15, vol = 0.3, delay = 0, attack = 0.005, dest = null }) {
  const c = ensure(); if (!c) return;
  const t0 = c.currentTime + delay;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f, t0);
  if (f2) o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(dest || sfxGain);
  o.start(t0); o.stop(t0 + dur + 0.05);
}

function noise({ dur = 0.1, vol = 0.2, delay = 0, hp = 1200, lp = 9000, dest = null }) {
  const c = ensure(); if (!c) return;
  const t0 = c.currentTime + delay;
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = c.createBufferSource(); s.buffer = buf;
  const f1 = c.createBiquadFilter(); f1.type = 'highpass'; f1.frequency.value = hp;
  const f2 = c.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = lp;
  const g = c.createGain();
  g.gain.setValueAtTime(vol, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  s.connect(f1); f1.connect(f2); f2.connect(g); g.connect(dest || sfxGain);
  s.start(t0);
}

const N = (semi, base = 440) => base * Math.pow(2, semi / 12);

/* ---------- Efectos ---------- */
const SFX = {
  slotpull: () => { tone({ f: 140, f2: 60, type: 'square', dur: 0.18, vol: 0.2 }); noise({ dur: 0.22, vol: 0.12, hp: 300, lp: 2500 }); tone({ f: 300, f2: 700, type: 'sine', dur: 0.3, vol: 0.06, delay: 0.1 }); },
  reelstop: () => { tone({ f: 220, f2: 90, type: 'triangle', dur: 0.12, vol: 0.28 }); noise({ dur: 0.05, vol: 0.14, hp: 1500 }); },
  peg:      () => { tone({ f: 1900, f2: 1300, type: 'square', dur: 0.035, vol: 0.07 }); noise({ dur: 0.02, vol: 0.05, hp: 4000 }); },
  jackpot:  () => { for (let i = 0; i < 14; i++) tone({ f: N(7 + (i % 7) * 2 + Math.floor(i / 7) * 12), type: 'square', dur: 0.12, vol: 0.12, delay: i * 0.07 }); for (let i = 0; i < 10; i++) tone({ f: 2400 + (i % 4) * 500, type: 'sine', dur: 0.1, vol: 0.07, delay: 0.3 + i * 0.09 }); noise({ dur: 0.6, vol: 0.08, hp: 3000, delay: 0.2 }); },
  coinrain: () => { for (let i = 0; i < 8; i++) tone({ f: 2200 + Math.random() * 1600, f2: 1800, type: 'sine', dur: 0.09, vol: 0.08, delay: i * 0.06 + Math.random() * 0.03 }); },
  click:   () => { tone({ f: 620, f2: 880, type: 'triangle', dur: 0.07, vol: 0.22 }); },
  hover:   () => { tone({ f: 900, type: 'sine', dur: 0.03, vol: 0.05 }); },
  back:    () => { tone({ f: 520, f2: 330, type: 'triangle', dur: 0.1, vol: 0.2 }); },
  open:    () => { tone({ f: 340, f2: 760, type: 'triangle', dur: 0.16, vol: 0.2 }); noise({ dur: 0.12, vol: 0.06, hp: 2500 }); },
  close:   () => { tone({ f: 700, f2: 300, type: 'triangle', dur: 0.14, vol: 0.18 }); },
  whoosh:  () => { noise({ dur: 0.32, vol: 0.16, hp: 400, lp: 4000 }); tone({ f: 200, f2: 900, type: 'sine', dur: 0.3, vol: 0.05 }); },
  deal:    () => { noise({ dur: 0.07, vol: 0.28, hp: 2200, lp: 8000 }); tone({ f: 180, f2: 90, type: 'sine', dur: 0.06, vol: 0.12 }); },
  flip:    () => { noise({ dur: 0.05, vol: 0.2, hp: 3000, lp: 9000 }); tone({ f: 520, f2: 760, type: 'triangle', dur: 0.05, vol: 0.08 }); },
  shuffle: () => { for (let i = 0; i < 7; i++) noise({ dur: 0.05, vol: 0.18, hp: 1800, delay: i * 0.055 }); },
  chip:    () => { tone({ f: 2100, f2: 1500, type: 'square', dur: 0.04, vol: 0.06 }); tone({ f: 3200, type: 'sine', dur: 0.08, vol: 0.09, delay: 0.015 }); },
  chips:   () => { for (let i = 0; i < 4; i++) { tone({ f: 2000 + i * 260, f2: 1600, type: 'square', dur: 0.04, vol: 0.05, delay: i * 0.045 }); tone({ f: 3000 + i * 200, type: 'sine', dur: 0.07, vol: 0.07, delay: i * 0.045 + 0.01 }); } },
  coin:    () => { tone({ f: N(14), type: 'square', dur: 0.07, vol: 0.12 }); tone({ f: N(19), type: 'square', dur: 0.22, vol: 0.12, delay: 0.07 }); },
  error:   () => { tone({ f: 160, f2: 110, type: 'sawtooth', dur: 0.2, vol: 0.14 }); },
  turn:    () => { tone({ f: N(7), type: 'sine', dur: 0.12, vol: 0.15 }); tone({ f: N(12), type: 'sine', dur: 0.18, vol: 0.15, delay: 0.09 }); },
  tick:    () => { tone({ f: 1400, type: 'square', dur: 0.025, vol: 0.05 }); },
  bust:    () => { tone({ f: 300, f2: 90, type: 'sawtooth', dur: 0.4, vol: 0.16 }); },
  meow:    () => {
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime;
    const o = c.createOscillator(); const g = c.createGain(); const f = c.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(520, t0);
    o.frequency.linearRampToValueAtTime(980, t0 + 0.16);
    o.frequency.linearRampToValueAtTime(560, t0 + 0.6);
    f.type = 'bandpass'; f.frequency.setValueAtTime(1200, t0); f.frequency.linearRampToValueAtTime(2200, t0 + 0.2); f.frequency.linearRampToValueAtTime(900, t0 + 0.6); f.Q.value = 2.2;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.06);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.65);
    o.connect(f); f.connect(g); g.connect(sfxGain);
    o.start(t0); o.stop(t0 + 0.7);
  },
  ability: () => {
    for (let i = 0; i < 6; i++) tone({ f: N(i * 2 - 12), type: 'sawtooth', dur: 0.16, vol: 0.12, delay: i * 0.07 });
    noise({ dur: 0.7, vol: 0.12, hp: 600, lp: 6000 });
    tone({ f: 200, f2: 1200, type: 'sine', dur: 0.7, vol: 0.08 });
  },
  impact:  () => {
    tone({ f: 160, f2: 38, type: 'sine', dur: 0.55, vol: 0.5 });
    tone({ f: 90, f2: 30, type: 'square', dur: 0.3, vol: 0.18 });
    noise({ dur: 0.35, vol: 0.3, hp: 200, lp: 5000 });
    for (let i = 0; i < 4; i++) tone({ f: N(7 + i * 5), type: 'triangle', dur: 0.35, vol: 0.1, delay: 0.08 + i * 0.05 });
  },
  reveal:  () => { tone({ f: N(0), type: 'triangle', dur: 0.12, vol: 0.18 }); tone({ f: N(7), type: 'triangle', dur: 0.12, vol: 0.18, delay: 0.09 }); tone({ f: N(14), type: 'triangle', dur: 0.3, vol: 0.2, delay: 0.18 }); },
  yip:     () => {
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime;
    for (const [d, f0] of [[0, 820], [0.17, 980]]) {
      const o = c.createOscillator(); const g = c.createGain(); const f = c.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(f0, t0 + d);
      o.frequency.exponentialRampToValueAtTime(f0 * 1.55, t0 + d + 0.07);
      o.frequency.exponentialRampToValueAtTime(f0 * 0.8, t0 + d + 0.16);
      f.type = 'bandpass'; f.frequency.value = 1700; f.Q.value = 2;
      g.gain.setValueAtTime(0.0001, t0 + d);
      g.gain.exponentialRampToValueAtTime(0.2, t0 + d + 0.025);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d + 0.2);
      o.connect(f); f.connect(g); g.connect(sfxGain);
      o.start(t0 + d); o.stop(t0 + d + 0.22);
    }
  },
  hum:     () => {
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime;
    const o = c.createOscillator(); const g = c.createGain(); const f = c.createBiquadFilter();
    o.type = 'triangle';
    o.frequency.setValueAtTime(240, t0);
    o.frequency.linearRampToValueAtTime(310, t0 + 0.18);
    o.frequency.linearRampToValueAtTime(220, t0 + 0.55);
    f.type = 'lowpass'; f.frequency.value = 900;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.6);
    o.connect(f); f.connect(g); g.connect(sfxGain);
    o.start(t0); o.stop(t0 + 0.65);
  },
  moo:     () => {
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime;
    const o = c.createOscillator(); const g = c.createGain(); const f = c.createBiquadFilter();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(130, t0);
    o.frequency.linearRampToValueAtTime(165, t0 + 0.25);
    o.frequency.linearRampToValueAtTime(105, t0 + 1.0);
    const vib = c.createOscillator(); const vg = c.createGain();
    vib.frequency.value = 7; vg.gain.value = 5; vib.connect(vg); vg.connect(o.frequency); vib.start(t0); vib.stop(t0 + 1.1);
    f.type = 'lowpass'; f.frequency.setValueAtTime(500, t0); f.frequency.linearRampToValueAtTime(900, t0 + 0.3); f.frequency.linearRampToValueAtTime(350, t0 + 1.0); f.Q.value = 3;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.05);
    o.connect(f); f.connect(g); g.connect(sfxGain);
    o.start(t0); o.stop(t0 + 1.1);
  },
  woof:    () => {
    const c = ensure(); if (!c) return;
    for (const d of [0, 0.2]) {
      const t0 = c.currentTime + d;
      const o = c.createOscillator(); const g = c.createGain(); const f = c.createBiquadFilter();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(380, t0);
      o.frequency.exponentialRampToValueAtTime(150, t0 + 0.14);
      f.type = 'bandpass'; f.frequency.value = 700; f.Q.value = 1.1;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(0.28, t0 + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
      o.connect(f); f.connect(g); g.connect(sfxGain);
      o.start(t0); o.stop(t0 + 0.2);
    }
  },
  baa:     () => {
    const c = ensure(); if (!c) return;
    const t0 = c.currentTime;
    for (const [ff, v] of [[420, 0.18], [840, 0.09], [1260, 0.05]]) {
      const o = c.createOscillator(); const g = c.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(ff * 0.8, t0);
      o.frequency.linearRampToValueAtTime(ff * 1.05, t0 + 0.12);
      o.frequency.linearRampToValueAtTime(ff * 0.85, t0 + 0.5);
      const vib = c.createOscillator(); const vg = c.createGain();
      vib.frequency.value = 24; vg.gain.value = ff * 0.06;
      vib.connect(vg); vg.connect(o.frequency); vib.start(t0); vib.stop(t0 + 0.6);
      const f = c.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 1.4;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(v, t0 + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.55);
      o.connect(f); f.connect(g); g.connect(sfxGain);
      o.start(t0); o.stop(t0 + 0.6);
    }
  },
  win: () => {
    [0, 4, 7, 12, 16].forEach((s, i) => tone({ f: N(s, 392), type: 'square', dur: 0.28, vol: 0.12, delay: i * 0.1 }));
    [0, 4, 7, 12].forEach((s, i) => tone({ f: N(s, 196), type: 'triangle', dur: 0.5, vol: 0.14, delay: i * 0.1 }));
    tone({ f: N(19, 392), type: 'triangle', dur: 0.9, vol: 0.16, delay: 0.55 });
    noise({ dur: 0.6, vol: 0.08, hp: 5000, delay: 0.5 });
  },
  lose: () => {
    [0, -2, -5, -9].forEach((s, i) => tone({ f: N(s, 330), type: 'triangle', dur: 0.4, vol: 0.16, delay: i * 0.2 }));
  },
  draw: () => { tone({ f: N(0, 330), type: 'triangle', dur: 0.25, vol: 0.15 }); tone({ f: N(0, 330), type: 'triangle', dur: 0.3, vol: 0.15, delay: 0.25 }); },
  levelup: () => {
    [0, 5, 9, 12, 17, 21, 24].forEach((s, i) => tone({ f: N(s, 330), type: 'square', dur: 0.14, vol: 0.1, delay: i * 0.07 }));
    tone({ f: N(24, 330), type: 'triangle', dur: 0.8, vol: 0.16, delay: 0.5 });
  },
  reward: () => {
    [0, 7, 12, 16, 19].forEach((s, i) => tone({ f: N(s, 523), type: 'triangle', dur: 0.3, vol: 0.14, delay: i * 0.08 }));
    noise({ dur: 0.5, vol: 0.1, hp: 6000, delay: 0.3 });
  },
  match: () => { tone({ f: 200, f2: 100, type: 'sawtooth', dur: 0.5, vol: 0.18 }); tone({ f: N(0, 220), type: 'square', dur: 0.2, vol: 0.12, delay: 0.5 }); tone({ f: N(7, 220), type: 'square', dur: 0.35, vol: 0.12, delay: 0.7 }); },
};

export function sfx(name) {
  if (vols.sfx <= 0) return;
  try { ensure(); SFX[name]?.(); } catch { /* ignorar */ }
}

/* ---------- Música generativa ---------- */
const PROGS = {
  menu:  { root: 196, chords: [[0, 4, 7, 11], [5, 9, 12, 16], [7, 11, 14, 17], [2, 5, 9, 12]], bpm: 92 },
  game:  { root: 220, chords: [[0, 3, 7, 10], [8, 12, 15, 19], [5, 8, 12, 15], [7, 10, 14, 17]], bpm: 104 },
};

function playStep() {
  if (!musicOn || !ctx) return;
  const P = PROGS[mood] || PROGS.menu;
  const beat = 60 / P.bpm / 2;
  const bar = Math.floor(step / 8) % P.chords.length;
  const chord = P.chords[bar];
  const i = step % 8;
  const dest = musicGain;
  if (i === 0) {
    chord.forEach((s) => tone({ f: N(s, P.root), type: 'triangle', dur: beat * 8.2, vol: 0.05, attack: 0.25, dest }));
    tone({ f: N(chord[0], P.root / 2), type: 'sine', dur: beat * 4, vol: 0.12, attack: 0.02, dest });
  }
  if (i === 4) tone({ f: N(chord[0] + (mood === 'game' ? 7 : 0), P.root / 2), type: 'sine', dur: beat * 3, vol: 0.09, dest });
  const pat = [0, 2, 1, 3, 2, 1, 3, 2];
  if (i % 1 === 0 && (i % 2 === 0 || Math.random() > 0.4)) {
    const s = chord[pat[i] % chord.length] + 12;
    tone({ f: N(s, P.root), type: 'sine', dur: beat * 1.6, vol: 0.06, attack: 0.01, dest });
  }
  if (mood === 'game' && i % 2 === 0) noise({ dur: 0.03, vol: 0.02, hp: 7000, dest });
  step++;
  musicTimer = setTimeout(playStep, beat * 1000);
}

export function startMusic() {
  if (musicOn) return;
  if (!ensure()) return;
  musicOn = true;
  step = 0;
  playStep();
}
export function stopMusic() { musicOn = false; clearTimeout(musicTimer); }
export function setMood(m) { mood = PROGS[m] ? m : 'menu'; }
export const musicRunning = () => musicOn;
