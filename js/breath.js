// Breathing pacers. Cyclic sighing (deep inhale, short top-up inhale, long
// exhale) is the routine's breathing step. Slow breathing (gentle 4 s in,
// 6 s out, no holds) is used for Quick calm, where deep breaths can make
// panic worse. Both run at six breaths a minute.
import { h } from './ui.js';

export const PATTERNS = {
  sigh: [
    { key: 'in', label: 'Breathe in through your nose', secs: 3, from: 0.52, to: 0.86 },
    { key: 'top', label: 'Top up with a little more air', secs: 1, from: 0.86, to: 1 },
    { key: 'out', label: 'Long, slow breath out through your mouth', secs: 6, from: 1, to: 0.52 },
  ],
  slow: [
    { key: 'in', label: 'Breathe in gently through your nose', secs: 4, from: 0.52, to: 1 },
    { key: 'out', label: 'Breathe out slowly, a little longer', secs: 6, from: 1, to: 0.52 },
  ],
};

export const PATTERN_NAMES = { sigh: 'Cyclic sighing', slow: 'Slow breathing' };

const ease = k => 0.5 - Math.cos(Math.PI * k) / 2;

export function phaseAt(ms, pattern = 'sigh') {
  const phases = PATTERNS[pattern] || PATTERNS.sigh;
  const cycle = phases.reduce((sum, p) => sum + p.secs, 0);
  let t = (Math.max(0, ms) / 1000) % cycle;
  for (const p of phases) {
    if (t < p.secs) {
      const k = t / p.secs;
      return { ...p, progress: k, scale: p.from + (p.to - p.from) * ease(k) };
    }
    t -= p.secs;
  }
  return { ...phases[0], progress: 0, scale: phases[0].from };
}

// Renders a pacer and animates it from getElapsed() (milliseconds).
// onPhase(key) fires whenever an inhale or exhale begins, for sound cues.
export function pacer({ getElapsed, isPaused = () => false, onPhase, pattern = 'sigh' }) {
  const first = (PATTERNS[pattern] || PATTERNS.sigh)[0];
  const orb = h('div', { class: 'orb' });
  const label = h('p', { class: 'pacer-label', 'aria-live': 'polite' }, first.label);
  const el = h('div', { class: 'pacer' }, h('div', { class: 'orb-wrap' }, h('div', { class: 'orb-ring' }), orb), label);
  let last = null;
  let raf = 0;
  // With reduced motion the orb barely grows and the cue is carried by brightness.
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function frame() {
    const p = phaseAt(getElapsed(), pattern);
    const fill = (p.scale - 0.52) / 0.48;
    orb.style.transform = `scale(${(reduce ? 0.86 + 0.14 * fill : p.scale).toFixed(4)})`;
    orb.style.opacity = (0.45 + 0.55 * fill).toFixed(3);
    if (p.key !== last) {
      label.textContent = isPaused() ? 'Paused' : p.label;
      // On a fresh mount only cue a phase that is just beginning.
      if (!isPaused() && p.key !== 'top' && (last !== null || p.progress < 0.15)) onPhase?.(p.key);
      last = p.key;
    }
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);

  return {
    el,
    stop() { cancelAnimationFrame(raf); },
  };
}
