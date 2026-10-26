// Runs one evening session: check-in, each step with its timer, the "up next"
// screen between steps, check-out, the daily check-up and the finished cairn. The session object
// lives in state.session and is saved on every change, so closing the app
// mid-step loses nothing.
import { h, icon, svg, noiseWave, ask, toast } from './ui.js';
import { TEMPLATES, NOISE, tipFor, makeId } from './data.js';
import { state, save, eveningKey, hueOf, saveCheckup } from './store.js';
import { createTimer, elapsed, remaining, isPaused, pause, resume, extend, stopAtZero, clock, minutesLabel } from './timer.js';
import { unlock, chime, buzz, keepAwake } from './sound.js';
import { pacer, PATTERN_NAMES } from './breath.js';
import { cairnSVG, stonesFromResults } from './cairn.js';
import { checkupFlow, enabledQuestions, answerList } from './checkup.js';

// Testing aid: ?speed=60 makes every minute last one second.
const SPEED = Math.max(1, Number(new URLSearchParams(location.search).get('speed')) || 1);
const MIN = 60000 / SPEED;
const BREATHER_MS = MIN;
const STALE_MS = 12 * 3600e3;
const DIM_MS = 20000;
const fmtTime = ms => new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export function stepLabel(step) {
  if (step.mode === 'open') return `open-ended, nudge at ${step.minutes} min`;
  return `${minutesLabel(step.minutes)}${step.hardStop && step.mode === 'timed' ? ', firm stop' : ''}`;
}

export function startSession(routine) {
  unlock();
  const s = {
    id: makeId('n'),
    routineId: routine.id,
    routineName: routine.name,
    startedAt: Date.now(),
    steps: routine.steps.map(step => ({ ...step })),
    index: 0,
    phase: 'checkin',
    timer: null,
    flags: {},
    results: [],
    before: null,
    after: null,
    breatherAt: null,
    ended: false,
  };
  if (!state.settings.checkin) beginStep(s, 0);
  state.session = s;
  save();
}

function beginStep(s, i, now = Date.now()) {
  s.index = i;
  s.phase = 'step';
  s.timer = createTimer(s.steps[i].minutes * MIN, now);
  s.flags = {};
  s.breatherAt = null;
}

function record(s, status, now = Date.now()) {
  s.results[s.index] = { status, actualSec: Math.round((elapsed(s.timer, now) * SPEED) / 1000) };
}

function buildEntry(s, now = Date.now()) {
  const seconds = s.results.reduce((sum, r) => sum + (r?.actualSec || 0), 0);
  return {
    id: s.id,
    date: eveningKey(s.startedAt),
    startedAt: s.startedAt,
    endedAt: now,
    routineId: s.routineId,
    routineName: s.routineName,
    minutes: Math.round(seconds / 6) / 10,
    steps: s.steps.map((step, i) => ({
      type: step.type, name: step.name, hue: hueOf(step), planned: step.minutes,
      actualSec: s.results[i]?.actualSec || 0, status: s.results[i]?.status || 'not reached',
    })),
    before: s.before,
    after: s.after,
    ended: s.ended,
  };
}

function storeEntry(s, now) {
  const entry = buildEntry(s, now);
  state.history = state.history.filter(e => e.id !== s.id);
  if (entry.steps.some(step => step.status === 'done')) state.history.push(entry);
  return entry;
}

// On launch: a session left on its summary screen, or abandoned overnight,
// is filed away quietly instead of chiming at breakfast.
export function closeStaleSession() {
  const s = state.session;
  if (!s) return;
  if (s.phase === 'summary') {
    state.session = null;
  } else if (Date.now() - s.startedAt > STALE_MS) {
    if (s.phase === 'step' && s.timer && !s.results[s.index]) {
      pause(s.timer, Math.min(Date.now(), s.timer.startedAt + s.timer.pausedMs + s.timer.durationMs + s.timer.extraMs));
      record(s, 'done', s.timer.pausedAt);
    }
    s.ended = true;
    storeEntry(s, s.startedAt);
    state.session = null;
  }
  save();
}

function hash(str) {
  let x = 2166136261;
  for (let i = 0; i < str.length; i++) x = Math.imul(x ^ str.charCodeAt(i), 16777619);
  return x >>> 0;
}

function warnLead(t) {
  return t.durationMs + t.extraMs >= 10 * MIN ? 2 * MIN : MIN;
}

function wedgePath(frac, r = 92, c = 120) {
  if (frac <= 0.0005) return '';
  if (frac >= 0.9995) return `M${c} ${c - r}A${r} ${r} 0 1 1 ${c - 0.01} ${c - r}Z`;
  const a = frac * Math.PI * 2;
  const x = c + r * Math.sin(a);
  const y = c - r * Math.cos(a);
  return `M${c} ${c}L${c} ${c - r}A${r} ${r} 0 ${a > Math.PI ? 1 : 0} 1 ${x.toFixed(2)} ${y.toFixed(2)}Z`;
}

export function mountSession(host, { onExit }) {
  const s = state.session;
  const ui = {};
  let tickId = 0;
  let wakeups = [];
  let pace = null;
  let idleTimer = 0;

  keepAwake(state.settings.wakeLock);
  document.addEventListener('visibilitychange', onVisibility);
  document.addEventListener('keydown', onKey);
  document.addEventListener('pointerdown', wake, { passive: true });
  render();

  // The screen is a light source too: during a timed step the display fades
  // after 20 seconds without a touch. Any tap or key brings it back.
  function wake() {
    clearTimeout(idleTimer);
    host.classList.remove('dimmed');
    if (s.phase === 'step' && s.steps[s.index].mode !== 'breath') {
      idleTimer = setTimeout(() => host.classList.add('dimmed'), DIM_MS);
    }
  }

  // Desktop shortcuts: Space pauses, right arrow moves on.
  function onKey(e) {
    wake();
    if (s.phase !== 'step' || e.altKey || e.ctrlKey || e.metaKey || document.querySelector('dialog[open]')) return;
    if (e.key === ' ' && e.target === document.body) {
      e.preventDefault();
      togglePause();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      finish();
    }
  }

  // ---- rendering -------------------------------------------------------

  function render() {
    pace?.stop();
    pace = null;
    stopTicking();
    host.replaceChildren(h('div', { class: 'session', 'data-phase': s.phase }, topbar(), screen()));
    if (needsTicking()) {
      tick();
      startTicking();
    }
    host.querySelector('[data-autofocus]')?.focus({ preventScroll: true });
    wake();
  }

  function screen() {
    switch (s.phase) {
      case 'checkin': return checkinScreen('before');
      case 'step': return stepScreen();
      case 'transition': return transitionScreen();
      case 'checkout': return checkinScreen('after');
      case 'checkup': return checkupScreen();
      default: return summaryScreen();
    }
  }

  function topbar() {
    const current = s.phase === 'step' ? s.index : s.phase === 'transition' ? s.index + 1 : -1;
    return h('header', { class: 'session-top' },
      h('button', { class: 'icon-btn', 'aria-label': s.phase === 'summary' ? 'Close' : 'End session', onclick: askEnd }, icon('x')),
      h('ol', { class: 'dots', 'aria-hidden': 'true' },
        s.steps.map((step, i) => h('li', {
          class: [s.results[i]?.status === 'done' && 'done', s.results[i]?.status === 'skipped' && 'skipped', i === current && 'current'].filter(Boolean).join(' '),
          style: { '--hue': `var(--hue-${hueOf(step)})` },
        }))),
      h('span', { class: 'session-count' },
        s.phase === 'checkin' || s.phase === 'checkout' ? 'Check-in' :
        s.phase === 'checkup' ? 'Check-up' :
        s.phase === 'summary' ? s.routineName : `Step ${current + 1} of ${s.steps.length}`),
    );
  }

  function checkinScreen(which) {
    const before = which === 'before';
    const question = before ? 'How busy is your mind right now?' : 'And how busy is it now?';
    const first = s.steps[0];
    return h('section', { class: 'session-body centered' },
      h('p', { class: 'eyebrow' }, before ? 'Before you start' : 'Before you finish'),
      h('h1', { class: 'display' }, question),
      h('div', { class: 'noise-scale', role: 'group', 'aria-label': question },
        [1, 2, 3, 4, 5].map(n => h('button', {
          class: 'noise',
          style: { '--wave': `var(--noise-${n})` },
          onclick: () => pick(n),
        }, noiseWave(n), h('span', null, NOISE[n - 1])))),
      h('button', { class: 'btn ghost', onclick: () => pick(null) }, 'Skip'),
      before && first && h('p', { class: 'up-next' }, `First up: ${first.name}, ${stepLabel(first)}`),
    );

    function pick(n) {
      if (before) {
        s.before = n;
        go(0);
      } else {
        s.after = n;
        afterStack();
      }
    }
  }

  function stepScreen() {
    const step = s.steps[s.index];
    const tpl = TEMPLATES[step.type];
    const next = s.steps[s.index + 1];
    const paused = isPaused(s.timer);
    ui.digits = h('div', { class: 'digits', role: 'timer', 'aria-live': 'off' });
    ui.caption = h('p', { class: 'caption' });

    let visual;
    if (step.mode === 'breath') {
      pace = pacer({
        pattern: step.pattern || 'sigh',
        getElapsed: () => elapsed(s.timer),
        isPaused: () => isPaused(s.timer),
        onPhase: key => {
          if (state.settings.sound && state.settings.breathCues) chime(key, state.settings.volume);
        },
      });
      visual = pace.el;
    } else {
      visual = dial(step);
    }

    const showNudge = step.mode === 'open' && s.flags.nudged && !s.flags.nudgeDismissed;
    return h('section', { class: `session-body step mode-${step.mode} ${paused ? 'paused' : ''} ${showNudge ? 'has-nudge' : ''}`, style: { '--hue': `var(--hue-${hueOf(step)})` } },
      h('div', { class: 'step-head' },
        icon(step.icon, 'step-icon'),
        h('div', null,
          h('h1', { class: 'display' }, step.name),
          h('p', { class: 'step-detail' }, step.mode === 'breath' ? PATTERN_NAMES[step.pattern] || PATTERN_NAMES.sigh : tpl?.detail || stepLabel(step))),
      ),
      !showNudge && h('p', { class: 'tip' }, tipFor(step)),
      visual,
      h('div', { class: 'readout' }, ui.digits, ui.caption),
      showNudge && h('div', { class: 'nudge', role: 'status' },
        h('p', null, `${step.minutes} minutes in. ${tpl?.nudge || 'Wrap up whenever you are ready.'}`),
        h('div', { class: 'row-actions' },
          h('button', { class: 'btn ghost small', onclick: () => { s.flags.nudgeDismissed = true; save(); render(); } }, 'Keep going'),
          h('button', { class: 'btn primary small', onclick: finish }, 'Park it'))),
      h('div', { class: 'controls' },
        h('button', { class: 'ctrl', onclick: togglePause, 'aria-pressed': paused ? 'true' : 'false', 'data-autofocus': '' },
          icon(paused ? 'play' : 'pause'), h('span', null, paused ? 'Resume' : 'Pause')),
        step.mode !== 'open' && !step.hardStop && h('button', { class: 'ctrl', onclick: addFive }, icon('plus'), h('span', null, '5 min')),
        h('button', { class: 'ctrl primary', onclick: finish },
          icon(next ? 'next' : 'check'), h('span', null, next ? 'Next' : 'Finish')),
      ),
      next && h('p', { class: 'up-next' }, `Up next: ${next.name}, ${stepLabel(next)}`),
    );
  }

  function dial(step) {
    const total = (s.timer.durationMs + s.timer.extraMs) * SPEED / 60000;
    const perTick = total > 30 ? 5 : 1;
    const count = Math.max(1, Math.round(total / perTick));
    let ticks = '';
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const major = perTick === 1 ? i % 5 === 0 : true;
      const r1 = 108;
      const r2 = major ? 98 : 102;
      ticks += `<line class="${major ? 'major' : ''}" x1="${(120 + r1 * Math.sin(a)).toFixed(2)}" y1="${(120 - r1 * Math.cos(a)).toFixed(2)}" x2="${(120 + r2 * Math.sin(a)).toFixed(2)}" y2="${(120 - r2 * Math.cos(a)).toFixed(2)}"/>`;
    }
    const el = svg(`<svg class="dial" viewBox="0 0 240 240" aria-hidden="true">
      <circle class="dial-face" cx="120" cy="120" r="114"/>
      <g class="dial-ticks">${ticks}</g>
      <path class="dial-wedge" d=""/>
      <circle class="dial-hub" cx="120" cy="120" r="6"/>
    </svg>`);
    ui.wedge = el.querySelector('.dial-wedge');
    return h('div', { class: `dial-wrap ${step.mode === 'open' ? 'count-up' : ''}` }, el);
  }

  function transitionScreen() {
    const prev = s.steps[s.index];
    const next = s.steps[s.index + 1];
    const prevResult = s.results[s.index];
    const timeUp = s.flags.ended;
    const status = prevResult?.status === 'skipped' ? 'skipped' : timeUp ? 'time’s up' : 'done';
    ui.breather = h('div', { class: 'breather', hidden: !s.breatherAt },
      h('span', { class: 'breather-text' }),
      h('button', { class: 'link', onclick: () => { s.breatherAt = null; save(); render(); } }, 'Stay here'));
    return h('section', { class: 'session-body centered transition', style: { '--hue': `var(--hue-${hueOf(next)})` } },
      h('p', { class: 'eyebrow' }, `${prev.name}: ${status}`),
      h('p', { class: 'muted' }, 'Up next'),
      icon(next.icon, 'step-icon big'),
      h('h1', { class: 'display' }, next.name),
      h('p', { class: 'step-detail' }, stepLabel(next)),
      h('p', { class: 'tip' }, TEMPLATES[next.type]?.prep || tipFor(next)),
      h('button', { class: 'btn primary big', 'data-autofocus': '', onclick: () => go(s.index + 1) }, `Start ${next.name.toLowerCase()}`),
      ui.breather,
      h('div', { class: 'row-actions' },
        timeUp && prev.mode !== 'open' && !prev.hardStop && h('button', { class: 'btn ghost', onclick: moreTime, 'aria-label': `Add 5 more minutes to ${prev.name}` }, '5 more minutes'),
        h('button', { class: 'btn ghost', onclick: skipNext }, `Skip ${next.name.toLowerCase()}`)),
    );
  }

  function summaryScreen() {
    const entry = state.history.find(e => e.id === s.id) || buildEntry(s);
    const done = s.results.filter(r => r?.status === 'done').length;
    const stones = stonesFromResults(s.steps, s.results);
    let note;
    if (!done) note = 'Nothing done tonight, and that is okay. Tomorrow is another evening.';
    else if (s.before && s.after && s.after < s.before) note = 'Your mind got quieter. Remember this feeling on nights when starting is hard.';
    else if (s.before && s.after && s.after === s.before) note = 'About the same as when you started, and you still showed up. That counts.';
    else if (s.before && s.after) note = 'Some evenings are like that. You showed up anyway.';
    else if (s.ended) note = 'Stopping early still counts. Small stacks build the habit too.';
    else note = 'One more evening of practice for your brain.';
    return h('section', { class: 'session-body centered summary' },
      stones.length ? svg(cairnSVG(stones, { width: 220, seed: hash(s.id) })) : null,
      h('h1', { class: 'display' }, !done ? 'Maybe tomorrow' : s.ended ? 'Stack saved' : 'Stack complete'),
      h('p', { class: 'muted' }, `${minutesLabel(entry.minutes)} · ${done} of ${s.steps.length} steps`),
      s.before && s.after && h('div', { class: 'noise-delta', 'aria-label': `Mind went from ${NOISE[s.before - 1]} to ${NOISE[s.after - 1]}` },
        h('span', { class: 'noise-chip', style: { '--wave': `var(--noise-${s.before})` } }, noiseWave(s.before), NOISE[s.before - 1]),
        h('span', { class: 'arrow', 'aria-hidden': 'true' }, '→'),
        h('span', { class: 'noise-chip', style: { '--wave': `var(--noise-${s.after})` } }, noiseWave(s.after), NOISE[s.after - 1])),
      h('p', { class: 'note' }, note),
      answerList(s.checkup).length > 0 && h('ul', { class: 'answers compact', 'aria-label': 'Your check-up' },
        answerList(s.checkup).map(({ q, label }) => h('li', null, h('span', { class: 'answer-q' }, q.label), label))),
      h('button', { class: 'btn primary big', 'data-autofocus': '', onclick: exit }, 'Done'),
    );
  }

  // ---- live updates ----------------------------------------------------

  function updateStep(now = Date.now()) {
    const step = s.steps[s.index];
    const t = s.timer;
    const paused = isPaused(t);
    if (step.mode === 'open') {
      const ms = elapsed(t, now);
      ui.digits.textContent = clock(ms * SPEED, false);
      ui.wedge?.setAttribute('d', wedgePath(Math.min(1, ms / t.durationMs)));
      ui.caption.textContent = paused ? 'Paused' :
        ms >= t.durationMs ? 'Past the nudge. Take the time you need.' : `Open-ended. Gentle nudge at ${step.minutes} min.`;
    } else {
      const left = remaining(t, now);
      ui.digits.textContent = clock(left * SPEED, true);
      ui.wedge?.setAttribute('d', wedgePath(Math.max(0, left / (t.durationMs + t.extraMs))));
      ui.caption.textContent = paused ? 'Paused'
        : `of ${minutesLabel(((t.durationMs + t.extraMs) * SPEED) / 60000)} \u00b7 ends ${fmtTime(now + left)}`;
    }
  }

  function tick() {
    const now = Date.now();
    if (s.phase === 'transition') {
      if (!s.breatherAt) return;
      const left = s.breatherAt - now;
      if (left <= 0) return go(s.index + 1);
      ui.breather.querySelector('.breather-text').textContent = `Starting in ${Math.ceil((left * SPEED) / 1000)} s.`;
      return;
    }
    if (s.phase !== 'step') return;
    const step = s.steps[s.index];
    const t = s.timer;
    if (!isPaused(t)) {
      if (step.mode === 'open') {
        if (!s.flags.nudged && elapsed(t, now) >= t.durationMs) {
          s.flags.nudged = true;
          save();
          signal('soft');
          return render();
        }
      } else {
        const left = remaining(t, now);
        if (left <= 0) return timeUp(now);
        const lead = warnLead(t);
        if (!s.flags.warned && state.settings.warn && t.durationMs + t.extraMs >= 3 * MIN && left <= lead) {
          const next = s.steps[s.index + 1];
          s.flags.warned = true;
          save();
          signal('soft');
          toast(`${lead > MIN ? 'Two minutes' : 'One minute'} left${next ? `. Next: ${next.name}` : ''}`);
        }
      }
    }
    updateStep(now);
  }

  function needsTicking() {
    return s.phase === 'step' || (s.phase === 'transition' && !!s.breatherAt);
  }

  function startTicking() {
    stopTicking();
    if (!needsTicking()) return;
    if (document.visibilityState === 'hidden') scheduleWakeups();
    else tickId = setInterval(tick, 250);
  }

  function stopTicking() {
    clearInterval(tickId);
    tickId = 0;
    wakeups.forEach(clearTimeout);
    wakeups = [];
  }

  // Hidden tabs throttle repeating timers hard; single timeouts aimed at the
  // next event fire much closer to on time.
  function scheduleWakeups() {
    const now = Date.now();
    const at = ms => { if (ms > 0) wakeups.push(setTimeout(tick, ms + 40)); };
    if (s.phase === 'step' && !isPaused(s.timer)) {
      const step = s.steps[s.index];
      if (step.mode === 'open') {
        at(s.timer.durationMs - elapsed(s.timer, now));
      } else {
        at(remaining(s.timer, now));
        if (state.settings.warn) at(remaining(s.timer, now) - warnLead(s.timer));
      }
    } else if (s.phase === 'transition' && s.breatherAt) {
      at(Math.max(1, s.breatherAt - now));
    }
  }

  function onVisibility() {
    if (document.visibilityState === 'hidden') {
      stopTicking();
      scheduleWakeups();
    } else if (needsTicking()) {
      tick();
      startTicking();
    }
  }

  function signal(kind) {
    if (state.settings.sound) chime(kind, state.settings.volume, state.settings.chime);
    if (state.settings.vibrate) buzz(kind === 'end' ? [240, 140, 240] : [90]);
  }

  // ---- actions ---------------------------------------------------------

  function go(i) {
    unlock();
    beginStep(s, i);
    save();
    render();
  }

  function timeUp(now) {
    stopAtZero(s.timer, now);
    s.flags.ended = true;
    record(s, 'done', now);
    signal('end');
    advance();
  }

  // Moving on within the first 30 seconds counts as skipping the step.
  function finish() {
    const now = Date.now();
    pause(s.timer, now);
    record(s, elapsed(s.timer, now) * SPEED < 30000 ? 'skipped' : 'done', now);
    advance();
  }

  function advance() {
    if (s.index + 1 < s.steps.length) {
      s.phase = 'transition';
      s.breatherAt = state.settings.autoAdvance ? Date.now() + BREATHER_MS : null;
      save();
      render();
    } else if (state.settings.checkin && s.before != null) {
      s.phase = 'checkout';
      save();
      render();
    } else {
      afterStack();
    }
  }

  // The daily check-up comes once per evening, after the last step.
  function afterStack() {
    const wanted = state.settings.checkup && enabledQuestions().length && !state.checkups[eveningKey(s.startedAt)];
    if (!wanted) return finalize();
    s.phase = 'checkup';
    save();
    render();
  }

  function checkupScreen() {
    const box = h('div', { class: 'session-main' });
    checkupFlow(box, { onDone: answers => { s.checkup = answers; finalize(); } });
    return box;
  }

  function togglePause() {
    unlock();
    if (isPaused(s.timer)) resume(s.timer);
    else pause(s.timer);
    save();
    render();
  }

  function addFive() {
    extend(s.timer, 5 * MIN);
    if (remaining(s.timer) > warnLead(s.timer)) s.flags.warned = false;
    save();
    render();
    toast('Added 5 minutes');
  }

  function moreTime() {
    unlock();
    delete s.results[s.index];
    extend(s.timer, 5 * MIN);
    resume(s.timer);
    s.flags.ended = false;
    s.flags.warned = false;
    s.phase = 'step';
    s.breatherAt = null;
    save();
    render();
  }

  function skipNext() {
    s.index += 1;
    s.timer = null;
    s.flags = {};
    s.results[s.index] = { status: 'skipped', actualSec: 0 };
    advance();
  }

  function finalize() {
    stopTicking();
    storeEntry(s, Date.now());
    saveCheckup(eveningKey(s.startedAt), s.checkup);
    s.phase = 'summary';
    keepAwake(false);
    save();
    render();
  }

  async function askEnd() {
    if (s.phase === 'summary') return exit();
    if (s.phase === 'checkout' || s.phase === 'checkup') return finalize();
    const partial = s.phase === 'step' && elapsed(s.timer) * SPEED >= 30000;
    const hasProgress = partial || s.results.some(r => r?.status === 'done');
    const ok = await ask({
      title: 'End tonight’s stack?',
      body: hasProgress ? 'What you have done so far will be saved.' : 'Nothing has been saved yet.',
      confirm: hasProgress ? 'End and save' : 'End',
      cancel: 'Keep going',
    });
    if (!ok || state.session !== s) return;
    if (!hasProgress) return exit();
    if (partial) {
      pause(s.timer);
      record(s, 'done');
    }
    s.ended = true;
    finalize();
  }

  function exit() {
    destroy();
    state.session = null;
    save();
    onExit();
  }

  function destroy() {
    stopTicking();
    pace?.stop();
    keepAwake(false);
    document.removeEventListener('visibilitychange', onVisibility);
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('pointerdown', wake);
    clearTimeout(idleTimer);
  }

  return { destroy, askEnd };
}
