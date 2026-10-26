// Draws finished steps as a cairn of stones: one stone per step, wider for
// longer steps, largest at the bottom like a real stack. Skipped steps are
// drawn as outlines.
import { hueOf } from './store.js';

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// stones: [{ minutes, hue, done }]
export function cairnSVG(stones, { width = 200, seed = 7 } = {}) {
  const rand = rng(seed);
  const sorted = [...stones].sort((a, b) => b.minutes - a.minutes);
  const maxW = width * 0.86;
  const shapes = [];
  let y = 0;
  const placed = sorted.map(s => {
    const w = Math.max(width * 0.3, Math.min(maxW, width * 0.26 + s.minutes * width * 0.035));
    const hgt = Math.max(width * 0.09, Math.min(width * 0.2, w * 0.32));
    const cy = y + hgt / 2;
    y += hgt * 0.86;
    return { ...s, w, hgt, cy, dx: (rand() - 0.5) * width * 0.08, rot: (rand() - 0.5) * 7 };
  });
  const last = placed[placed.length - 1];
  const total = (last ? last.cy + last.hgt / 2 : 0) + 4;
  for (const p of placed) {
    const cx = width / 2 + p.dx;
    const cy = total - 2 - p.cy;
    const color = `var(--hue-${p.hue})`;
    shapes.push(
      `<g transform="rotate(${p.rot.toFixed(2)} ${cx.toFixed(1)} ${cy.toFixed(1)})">` +
      (p.done
        ? `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(p.w / 2).toFixed(1)}" ry="${(p.hgt / 2).toFixed(1)}" fill="${color}"/>` +
          `<ellipse cx="${(cx - p.w * 0.12).toFixed(1)}" cy="${(cy - p.hgt * 0.17).toFixed(1)}" rx="${(p.w * 0.26).toFixed(1)}" ry="${(p.hgt * 0.16).toFixed(1)}" fill="var(--stone-shine)"/>`
        : `<ellipse cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" rx="${(p.w / 2 - 1).toFixed(1)}" ry="${(p.hgt / 2 - 1).toFixed(1)}" fill="none" stroke="${color}" stroke-width="1.5" stroke-dasharray="4 4"/>`) +
      `</g>`);
  }
  return `<svg class="cairn" viewBox="0 0 ${width} ${total.toFixed(1)}" width="${width}" height="${total.toFixed(0)}" role="img" aria-label="${stones.filter(s => s.done).length} of ${stones.length} steps done">${shapes.join('')}</svg>`;
}

// Steps never reached are left out of the cairn.
export function stonesFromResults(steps, results) {
  return steps.flatMap((step, i) => results[i] ? [{
    minutes: Math.max(2, Math.min(30, results[i].actualSec ? results[i].actualSec / 60 : step.minutes)),
    hue: hueOf(step),
    done: results[i].status === 'done',
  }] : []);
}
