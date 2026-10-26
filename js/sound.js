// Soft singing-bowl chimes synthesized with Web Audio, so the app ships no
// audio files and works offline. Browsers only allow sound after a tap, so
// unlock() is called from the Start buttons.

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

// Bowl partials (ratio to the fundamental, relative level). Each partial is a
// pair of slightly detuned sines, which gives the slow shimmer of a real bowl.
const PARTIALS = [[1, 1], [2.76, 0.42], [5.12, 0.18], [8.25, 0.07]];

function bowl(t0, f0, level, decay) {
  const out = ctx.createGain();
  out.gain.value = level;
  out.connect(master);
  for (const [ratio, amp] of PARTIALS) {
    for (const detune of [-1.2, 1.2]) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      const end = t0 + decay / Math.sqrt(ratio);
      osc.type = 'sine';
      osc.frequency.value = f0 * ratio + detune;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.exponentialRampToValueAtTime(amp / 2, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, end);
      osc.connect(g).connect(out);
      osc.start(t0);
      osc.stop(end + 0.05);
    }
  }
}

function tone(t0, freq, level, length) {
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(level, t0 + 0.08);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + length);
  osc.connect(g).connect(master);
  osc.start(t0);
  osc.stop(t0 + length + 0.05);
}

// kind: 'end' (step finished), 'soft' (heads-up or nudge), 'in' / 'out' (breath cues)
export function chime(kind, volume = 0.6) {
  if (!ctx || !master) return;
  try {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    master.gain.value = Math.max(0, Math.min(1, volume)) ** 2;
    const t = ctx.currentTime + 0.03;
    if (kind === 'end') {
      bowl(t, 294, 0.55, 6);
      bowl(t + 1.8, 294, 0.4, 6);
    } else if (kind === 'soft') {
      bowl(t, 440, 0.28, 3.5);
    } else if (kind === 'in') {
      tone(t, 392, 0.09, 1.1);
    } else if (kind === 'out') {
      tone(t, 262, 0.09, 1.6);
    }
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
