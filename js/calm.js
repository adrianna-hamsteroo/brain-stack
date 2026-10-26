// Quick calm: gentle slow breathing for anxious moments, reachable from the
// Tonight screen at any time of day. Breathing exercises make some people
// more tense, so there is always a 5-4-3-2-1 grounding alternative.
import { h, icon } from './ui.js';
import { CALM_LINES, GROUNDING } from './data.js';
import { state } from './store.js';
import { clock } from './timer.js';
import { unlock, chime, keepAwake } from './sound.js';
import { pacer } from './breath.js';

const LINE_MS = 20000;

export function mountCalm(host, { onExit }) {
  unlock();
  keepAwake(state.settings.wakeLock);
  const started = Date.now();
  const digits = h('div', { class: 'digits small', role: 'timer' }, '0:00');
  const line = h('p', { class: 'calm-line' }, CALM_LINES[0]);
  let pace = null;
  let closed = false;

  const body = h('section', { class: 'session-body centered' });
  host.replaceChildren(h('div', { class: 'session calm', style: { '--hue': 'var(--hue-breathe)' } },
    h('header', { class: 'session-top' },
      h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: exit }, icon('x')),
      h('span', null),
      h('span', { class: 'session-count' }, 'Quick calm')),
    body));
  showBreathing();

  const timer = setInterval(() => {
    const ms = Date.now() - started;
    digits.textContent = clock(ms, false);
    const next = CALM_LINES[Math.floor(ms / LINE_MS) % CALM_LINES.length];
    if (line.textContent !== next) line.textContent = next;
  }, 500);

  function showBreathing() {
    pace = pacer({
      pattern: 'slow',
      getElapsed: () => Date.now() - started,
      onPhase: key => {
        if (state.settings.sound && state.settings.breathCues) chime(key, state.settings.volume);
      },
    });
    body.replaceChildren(
      h('p', { class: 'eyebrow' }, 'Slow breathing'),
      pace.el,
      digits,
      line,
      h('button', { class: 'btn primary big', onclick: exit, 'data-autofocus': '' }, 'I feel calmer'),
      h('button', { class: 'link', onclick: showGrounding }, 'Breathing makes it worse'),
    );
    body.querySelector('[data-autofocus]')?.focus({ preventScroll: true });
  }

  function showGrounding() {
    pace?.stop();
    pace = null;
    body.replaceChildren(
      h('p', { class: 'eyebrow' }, 'Grounding'),
      h('h1', { class: 'display' }, 'Breathe however feels normal. Look around you and find:'),
      h('ol', { class: 'grounding' },
        GROUNDING.map(text => h('li', null,
          h('button', {
            class: 'ground', 'aria-pressed': 'false',
            onclick: e => {
              const btn = e.currentTarget;
              btn.setAttribute('aria-pressed', btn.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
            },
          }, icon('check'), h('span', null, text))))),
      digits,
      h('button', { class: 'btn primary big', onclick: exit }, 'I feel calmer'),
      h('button', { class: 'link', onclick: showBreathing }, 'Back to breathing'),
    );
  }

  function exit() {
    if (closed) return;
    closed = true;
    clearInterval(timer);
    pace?.stop();
    keepAwake(false);
    onExit();
  }

  return { destroy: exit, askEnd: exit };
}
