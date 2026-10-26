// Chimes synthesized with Web Audio, so the app ships no audio files and
// works offline. Browsers only allow sound after a tap, so unlock() is called
// from the Start buttons. play() takes any AudioContext, which lets the same
// sounds be rendered offline for testing.

let ctx = null;
let master = null;

export function unlock() {
  try {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  } catch { /* no audio available */ }
}

export const SOUND_STYLES = { chimes: 'Wind chime', musicbox: 'Music box', bowl: 'Singing bowl' };

// Partials as [ratio to the fundamental, relative level]. Chime bars ring at
// 1 : 2.76 : 5.40; the near-unison twin adds a slow shimmer.
const BAR = [[1, 1], [1.0016, 0.45], [2.756, 0.12], [5.404, 0.03]];
const PLUCK = [[1, 1], [2, 0.3], [3, 0.12], [4.2, 0.05]];
const BOWL = [[1, 1], [1.004, 1], [2.76, 0.42], [2.764, 0.42], [5.12, 0.18], [8.25, 0.07]];

// One struck note: fast attack, exponential ring-out, upper partials fade first.
function voice(ac, out, t0, freq, level, decay, partials) {
  const bus = ac.createGain();
  bus.gain.value = level;
  bus.connect(out);
  for (const [ratio, amp] of partials) {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    const end = t0 + decay / Math.max(1, ratio) ** 0.8;
    osc.type = 'sine';
    osc.frequency.value = freq * ratio;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(amp, t0 + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, end);
    osc.connect(g).connect(bus);
    osc.start(t0);
    osc.stop(end + 0.05);
  }
}

// A soft sliding tone for breathing cues: rising for in, falling for out.
function glide(ac, out, t0, from, to, level, length) {
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(from, t0);
  osc.frequency.exponentialRampToValueAtTime(to, t0 + length);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(level, t0 + length * 0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
  osc.connect(g).connect(out);
  osc.start(t0);
  osc.stop(t0 + length + 0.05);
}

const NOTE = { C6: 1046.5, E6: 1318.5, G6: 1568, C7: 2093 };

const STYLES = {
  // Rising C-major sparkle; heads-up is a gentle two-note fall.
  chimes: {
    end: (ac, out, t) => [NOTE.C6, NOTE.E6, NOTE.G6, NOTE.C7].forEach((f, i) => voice(ac, out, t + i * 0.13, f, 0.24, 2.4, BAR)),
    soft: (ac, out, t) => {
      voice(ac, out, t, NOTE.G6, 0.17, 1.6, BAR);
      voice(ac, out, t + 0.22, NOTE.E6, 0.14, 1.8, BAR);
    },
  },
  musicbox: {
    end: (ac, out, t) => [NOTE.C7, NOTE.G6, NOTE.E6, NOTE.G6, NOTE.C6].forEach((f, i) => voice(ac, out, t + i * 0.17, f, 0.22, 1.3, PLUCK)),
    soft: (ac, out, t) => {
      voice(ac, out, t, NOTE.E6, 0.16, 1.1, PLUCK);
      voice(ac, out, t + 0.17, NOTE.C6, 0.14, 1.2, PLUCK);
    },
  },
  bowl: {
    end: (ac, out, t) => {
      voice(ac, out, t, 294, 0.3, 6, BOWL);
      voice(ac, out, t + 1.8, 294, 0.22, 6, BOWL);
    },
    soft: (ac, out, t) => voice(ac, out, t, 440, 0.16, 3.5, BOWL),
  },
};

// kind: 'end' (step finished), 'soft' (heads-up or nudge), 'in' / 'out' (breath cues)
export function play(ac, out, kind, style = 'chimes', t = ac.currentTime) {
  if (kind === 'in') return glide(ac, out, t, 440, 554, 0.06, 1.1);
  if (kind === 'out') return glide(ac, out, t, 554, 415, 0.06, 1.6);
  (STYLES[style] || STYLES.chimes)[kind === 'end' ? 'end' : 'soft'](ac, out, t);
}

export function chime(kind, volume = 0.6, style = 'chimes') {
  if (!ctx || !master) return;
  try {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    master.gain.value = Math.max(0, Math.min(1, volume)) ** 2;
    play(ctx, master, kind, style, ctx.currentTime + 0.03);
  } catch { /* ignore audio glitches */ }
}

export function buzz(pattern) {
  try { navigator.vibrate?.(pattern); } catch { /* blocked in some frames */ }
}

export const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

// Screen wake lock: keeps the phone awake so the end-of-step chime can play.
let lock = null;
let wanted = false;
let pending = false;

export async function keepAwake(on) {
  wanted = on;
  try {
    if (on && !lock && !pending && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      pending = true;
      lock = await navigator.wakeLock.request('screen');
      lock.addEventListener?.('release', () => { lock = null; });
      if (!wanted) { await lock.release(); lock = null; }
    } else if (!on && lock) {
      await lock.release();
      lock = null;
    }
  } catch {
    lock = null;
  } finally {
    pending = false;
  }
}

document.addEventListener('visibilitychange', () => {
  if (wanted && document.visibilityState === 'visible') keepAwake(true);
});
