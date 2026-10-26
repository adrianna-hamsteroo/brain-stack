// The four tabs: Tonight, Routine, Progress and Settings. Each view is a
// function that returns a fresh DOM tree; app.render() swaps it in.
import { h, icon, svg, noiseWave, ask, toast, saveFile, isEmbedded, openSheet } from './ui.js';
import { TEMPLATES, TEMPLATE_ORDER, PICKABLE_ICONS, NOISE, CHECKUP, THEMES, checkupEase, stepFromTemplate, makeId } from './data.js';
import {
  state, save, replaceState, routineById, resetRoutine, routineMinutes, hueOf, eveningKey, dateFromKey, keyOf,
  tonightRoutine, plannedRoutine, pickRoutine, createRoutine, deleteRoutine, extrasOn, removeExtra,
} from './store.js';
import { minutesLabel } from './timer.js';
import { unlock, chime, canVibrate, SOUND_STYLES } from './sound.js';
import { cairnSVG } from './cairn.js';
import { PATTERN_NAMES } from './breath.js';
import { sortable } from './drag.js';
import { answerList } from './checkup.js';
import { logActivity, extraChip, dayLabel } from './tracker.js';

const DAY = 864e5;
const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const fmtTime = d => d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
const fmtDay = d => d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
const hueVar = step => ({ '--hue': `var(--hue-${hueOf(step)})` });

function masthead(eyebrow, title, size = 'lg') {
  return h('header', { class: 'masthead' },
    typeof eyebrow === 'string' ? h('p', { class: 'eyebrow' }, eyebrow) : eyebrow,
    h('h1', { class: `display ${size}` }, title));
}

function listJoin(items) {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

// The row of stacks to choose from, on Tonight (radio buttons) and in the
// editor (tabs, plus a "New stack" button).
function stackChips({ selected, onPick, role = 'radio', planned = null, labelledBy, extra = null }) {
  const tab = role === 'tab';
  return h('div', { class: 'stack-chips', role: tab ? 'tablist' : 'radiogroup', 'aria-labelledby': labelledBy },
    state.routines.map(r => h('button', {
      class: 'stack-chip', role,
      [tab ? 'aria-selected' : 'aria-checked']: r.id === selected ? 'true' : 'false',
      onclick: () => onPick(r.id),
    },
      h('span', { class: 'chip-title' }, r.label || r.name),
      h('span', { class: 'chip-sub' }, `${routineMinutes(r)} min`),
      r.id === planned && h('span', { class: 'chip-tag' }, 'Planned'))),
    extra);
}

// ---- Tonight ---------------------------------------------------------------

function greeting(now = new Date()) {
  const hr = now.getHours();
  if (hr >= 5 && hr < 12) return 'Good morning';
  if (hr >= 12 && hr < 17) return 'Good afternoon';
  return 'Good evening';
}

// Moon phase from the mean synodic month; close enough for a label.
function moonPhase(now = Date.now()) {
  const p = (((now - Date.UTC(2000, 0, 6, 18, 14)) / DAY / 29.530588853) % 1 + 1) % 1;
  const names = ['New moon', 'Waxing crescent', 'First quarter', 'Waxing gibbous', 'Full moon', 'Waning gibbous', 'Last quarter', 'Waning crescent'];
  return { p, name: names[Math.floor(p * 8 + 0.5) % 8] };
}

function moonIcon(p) {
  const r = 9;
  const c = 12;
  const rx = Math.abs(Math.cos(2 * Math.PI * p)) * r;
  const waxing = p < 0.5;
  const crescent = p < 0.25 || p > 0.75;
  const term = waxing ? (crescent ? 0 : 1) : (crescent ? 1 : 0);
  const d = `M${c} ${c - r}A${r} ${r} 0 0 ${waxing ? 1 : 0} ${c} ${c + r}A${rx.toFixed(2)} ${r} 0 0 ${term} ${c} ${c - r}Z`;
  return svg(`<svg class="moon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="var(--dusk-2)"/><path d="${d}" fill="var(--moon)"/></svg>`);
}

function pebble(step) {
  const w = Math.min(104, 34 + step.minutes * 4.5);
  return h('span', { class: `pebble ${step.mode === 'open' ? 'open' : ''}`, style: { width: `${w}px` } }, icon(step.icon));
}

function timeLabel(step) {
  if (step.mode === 'open') return `~${step.minutes} min`;
  return `${step.minutes} min`;
}

export function tonightView(app) {
  const key = eveningKey(Date.now());
  const routine = tonightRoutine();
  const planned = plannedRoutine(key);
  const total = routineMinutes(routine);
  const moon = moonPhase();
  const s = state.session;
  const dateLine = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return h('div', { class: 'view tonight' },
    masthead(h('p', { class: 'eyebrow moonline' }, moonIcon(moon.p), `${dateLine} · ${moon.name}`), greeting(), 'xl'),

    h('section', { class: 'block' },
      h('h2', { class: 'label', id: 'stack-label' }, 'Tonight’s stack'),
      stackChips({ selected: routine.id, planned: planned?.id, labelledBy: 'stack-label', onPick: id => { pickRoutine(id); app.render(); } })),

    h('section', { class: 'stack-card', 'aria-label': `${routine.name} stack` },
      h('div', { class: 'stack-head' },
        h('h2', { class: 'display md' }, routine.name),
        h('p', { class: 'muted' }, planned?.id === routine.id ? h('span', { class: 'planned-pill' }, icon('calendar'), 'Planned for tonight') : routine.blurb)),
      routine.steps.length
        ? h('ol', { class: 'stack-list' },
            routine.steps.map(step => h('li', { class: 'stack-row', style: hueVar(step) },
              h('span', { class: 'pebble-slot' }, pebble(step)),
              h('span', { class: 'row-text' },
                h('span', { class: 'row-name' }, step.name),
                h('span', { class: 'row-sub' }, step.mode === 'open' ? 'open-ended' : step.mode === 'breath' ? 'with breathing guide' : `${TEMPLATES[step.type]?.detail || 'countdown'}${step.hardStop ? ', firm stop' : ''}`)),
              h('span', { class: 'row-time' }, timeLabel(step)))))
        : h('div', { class: 'empty-note' },
            h('p', null, 'This stack has no steps yet.'),
            h('button', { class: 'btn ghost small', onclick: () => { editingId = routine.id; adding = true; app.go('routine'); } }, icon('plus'), 'Add steps')),
      routine.steps.length > 0 && h('p', { class: 'stack-total' },
        `About ${minutesLabel(total)} · done by ${fmtTime(new Date(Date.now() + total * 60000))}`)),

    h('div', { class: 'cta' },
      s
        ? h('button', { class: 'btn primary big', onclick: app.resumeSession }, icon('play'), 'Resume tonight’s stack')
        : h('button', { class: 'btn primary big', disabled: !routine.steps.length, onclick: () => app.start(routine) }, icon('play'), 'Start tonight’s stack'),
      h('button', { class: 'btn quiet big', onclick: app.openCalm }, icon('breathe'), 'Quick calm')),

    alsoToday(app, key),
    weekStrip(),
  );
}

function alsoToday(app, key) {
  const extras = extrasOn(key);
  return h('section', { class: 'block also' },
    h('div', { class: 'week-head' },
      h('h2', { class: 'label' }, 'Also today'),
      h('button', { class: 'btn ghost small', onclick: () => logActivity(key, app.render) }, icon('plus'), 'Log activity')),
    extras.length
      ? h('ul', { class: 'extras-row' }, extras.map(x => extraChip(x)))
      : h('p', { class: 'muted small' }, 'A walk, a workout, coffee with a friend? Log it here. It counts too.'));
}

function weekDays(now = Date.now()) {
  const today = dateFromKey(eveningKey(now));
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function weekStrip() {
  const todayKey = eveningKey(Date.now());
  const done = new Set(state.history.map(e => e.date));
  const days = weekDays();
  const count = days.filter(d => done.has(keyOf(d))).length;
  const goal = state.settings.weeklyGoal || 5;
  const rest = 7 - goal;
  const note = count >= goal ? 'Goal reached. Anything extra is a bonus.'
    : count === 0 ? `A fresh week. Aim for ${goal} evenings${rest ? `, with ${rest} rest ${rest === 1 ? 'night' : 'nights'} built in` : ''}.`
    : `${goal - count} more to reach your goal.${rest ? ' Rest nights are part of the plan.' : ''}`;
  return h('section', { class: 'week' },
    h('div', { class: 'week-head' },
      h('h2', { class: 'label' }, 'This week'),
      h('span', { class: 'muted' }, `${count} of ${goal} evenings`)),
    h('ol', { class: 'week-days' },
      days.map(d => {
        const k = keyOf(d);
        return h('li', { class: [done.has(k) && 'done', k === todayKey && 'today', k > todayKey && 'future'].filter(Boolean).join(' ') },
          h('span', { class: 'day-dot' }),
          h('span', { class: 'day-name' }, d.toLocaleDateString('en-GB', { weekday: 'narrow' })));
      })),
    h('p', { class: 'muted small' }, note));
}

// ---- Routine editor ----------------------------------------------------------

let editingId = null;
let openStepId = null;
let adding = false;

function modeLabel(step) {
  if (step.mode === 'open') return `Open-ended, nudge at ${step.minutes} min`;
  if (step.mode === 'breath') return `${step.minutes} min, ${(PATTERN_NAMES[step.pattern] || PATTERN_NAMES.sigh).toLowerCase()}`;
  return `${step.minutes} min countdown${step.hardStop ? ', firm stop' : ''}`;
}

function stepper(id, value, onChange) {
  const down = v => (v > 10 ? (v % 5 ? v - (v % 5) : v - 5) : v - 1);
  const up = v => (v >= 10 ? v - (v % 5) + 5 : v + 1);
  return h('div', { class: 'stepper' },
    h('button', { class: 'icon-btn', 'aria-label': 'Fewer minutes', disabled: value <= 1, onclick: () => onChange(Math.max(1, down(value))) }, icon('minus')),
    h('output', { id, 'aria-live': 'polite' }, `${value} min`),
    h('button', { class: 'icon-btn', 'aria-label': 'More minutes', disabled: value >= 120, onclick: () => onChange(Math.min(120, up(value))) }, icon('plus')));
}

function counter(id, value, min, max, format, onChange) {
  return h('div', { class: 'stepper', role: 'group', 'aria-labelledby': `${id}-label` },
    h('button', { class: 'icon-btn', 'aria-label': 'Fewer', disabled: value <= min, onclick: () => onChange(value - 1) }, icon('minus')),
    h('output', { id, 'aria-live': 'polite' }, format(value)),
    h('button', { class: 'icon-btn', 'aria-label': 'More', disabled: value >= max, onclick: () => onChange(value + 1) }, icon('plus')));
}

function field(label, control, forId) {
  return h('div', { class: 'field' }, h('label', { class: 'field-label', for: forId }, label), control);
}

export function routineView(app) {
  const routine = routineById(editingId || tonightRoutine().id);
  editingId = routine.id;
  const list = h('ol', { class: 'edit-list' }, routine.steps.map((step, i) => editRow(app, routine, step, i)));
  sortable(list, {
    onMove: (from, to) => {
      const [moved] = routine.steps.splice(from, 1);
      routine.steps.splice(to, 0, moved);
      save();
      app.render();
      toast(`Moved ${moved.name}`);
    },
  });

  return h('div', { class: 'view routine' },
    masthead('Your stacks', 'Build your stack'),
    stackChips({
      selected: routine.id, role: 'tab',
      onPick: id => { editingId = id; openStepId = null; adding = false; app.render(); },
      extra: h('button', { class: 'stack-chip new', onclick: () => newStack(app, routine) },
        icon('plus'), h('span', { class: 'chip-title' }, 'New stack')),
    }),
    routine.preset
      ? h('p', { class: 'muted' }, `${routine.blurb} About ${minutesLabel(routineMinutes(routine))} in total.`)
      : field('Stack name', h('input', {
          id: `stack-name-${routine.id}`, type: 'text', value: routine.name, maxlength: '30', autocomplete: 'off',
          onchange: e => {
            const name = e.target.value.trim();
            if (!name) { e.target.value = routine.name; return; }
            routine.name = name;
            routine.label = name;
            save();
            app.render();
          },
        }), `stack-name-${routine.id}`),
    planEditor(app, routine),
    routine.steps.length > 1 && h('p', { class: 'sort-hint' }, icon('grip'), 'Hold a step, or grab its dots, and drag to change the order.'),
    routine.steps.length ? list : h('p', { class: 'empty-note' }, 'No steps yet. Add the first one below.'),
    adding
      ? picker(app, routine)
      : h('button', { class: 'btn ghost wide', onclick: () => { adding = true; app.render(); } }, icon('plus'), 'Add a step'),
    routine.preset
      ? h('button', {
          class: 'link',
          onclick: async () => {
            const ok = await ask({ title: `Reset “${routine.name}”?`, body: 'Your changes to this stack will be replaced by the recommended steps and timings. Its plan stays.', confirm: 'Reset', danger: true });
            if (!ok) return;
            resetRoutine(routine.id);
            openStepId = null;
            app.render();
            toast('Stack reset');
          },
        }, 'Reset to the recommended version')
      : h('button', {
          class: 'link danger-text',
          onclick: async () => {
            const ok = await ask({ title: `Delete “${routine.name}”?`, body: 'The stack and its plan will be removed. Evenings you already did stay in Progress.', confirm: 'Delete', danger: true });
            if (!ok) return;
            deleteRoutine(routine.id);
            editingId = null;
            app.render();
            toast('Stack deleted');
          },
        }, 'Delete this stack'),
  );
}

async function newStack(app, current) {
  const result = await openSheet(close => {
    const input = h('input', { id: 'new-stack-name', type: 'text', maxlength: '30', autocomplete: 'off', placeholder: 'e.g. Sunday reset, Exam week' });
    let copy = current.steps.length > 0;
    const choices = [
      [true, `Copy “${current.name}”`],
      [false, 'Start empty'],
    ].map(([value, label]) => h('button', {
      class: 'seg', role: 'radio', 'aria-checked': copy === value ? 'true' : 'false',
      onclick: e => {
        copy = value;
        choices.forEach(btn => btn.setAttribute('aria-checked', btn === e.currentTarget ? 'true' : 'false'));
      },
    }, label));
    const submit = () => {
      const name = input.value.trim();
      if (!name) return input.focus();
      close({ name, copy });
    };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
    setTimeout(() => input.focus(), 60);
    return [
      h('h2', null, 'New stack'),
      h('p', null, 'Make a stack for a theme, a weekday, a busy week or a whole month. You can plan when it shows up next.'),
      field('Name', input, 'new-stack-name'),
      h('div', { class: 'segmented small sheet-seg', role: 'radiogroup', 'aria-label': 'Start from' }, choices),
      h('div', { class: 'sheet-actions' },
        h('button', { class: 'btn ghost', onclick: () => close() }, 'Cancel'),
        h('button', { class: 'btn primary', onclick: submit }, 'Create')),
    ];
  }, { label: 'New stack' });
  if (!result) return;
  const routine = createRoutine(result.name, result.copy ? current.id : null);
  editingId = routine.id;
  openStepId = null;
  adding = routine.steps.length === 0;
  app.render();
  toast(`Created ${routine.name}`);
}

function planSummary(sc, today) {
  if (sc.type === 'weekly') {
    if (!sc.days.length) return 'Pick the nights below.';
    const days = [...sc.days].sort();
    if (days.length === 7) return 'Planned for every night.';
    if (days.join() === '0,1,2,3,4') return 'Planned for weeknights.';
    if (days.join() === '5,6') return 'Planned for weekends.';
    return `Planned for every ${listJoin(days.map(d => DAY_NAMES[d]))}.`;
  }
  if (sc.type === 'dates' && sc.from && sc.to) {
    const opts = { day: 'numeric', month: 'short' };
    const from = dateFromKey(sc.from);
    const text = sc.from === sc.to
      ? `Planned for ${from.toLocaleDateString('en-GB', { weekday: 'short', ...opts })}.`
      : `Planned from ${from.toLocaleDateString('en-GB', opts)} to ${dateFromKey(sc.to).toLocaleDateString('en-GB', opts)}.`;
    return sc.to < today ? `${text} This plan has ended.` : text;
  }
  return 'Not planned. Pick it any night.';
}

function planEditor(app, routine) {
  const sc = routine.schedule;
  const today = eveningKey(Date.now());
  const set = patch => { routine.schedule = { ...sc, ...patch }; save(); app.render(); };
  const week = weekDays().map(keyOf);
  const now = dateFromKey(today);
  const month = [keyOf(new Date(now.getFullYear(), now.getMonth(), 1)), keyOf(new Date(now.getFullYear(), now.getMonth() + 1, 0))];
  const labelId = `plan-${routine.id}`;

  return h('section', { class: 'plan' },
    h('div', { class: 'plan-head' },
      icon('calendar'),
      h('h2', { class: 'label', id: labelId }, 'Plan it'),
      h('span', { class: 'muted small' }, planSummary(sc, today))),
    h('div', { class: 'segmented small', role: 'radiogroup', 'aria-labelledby': labelId },
      [['none', 'Any night'], ['weekly', 'Weekly'], ['dates', 'Dates']].map(([type, label]) => h('button', {
        class: 'seg', role: 'radio', 'aria-checked': sc.type === type ? 'true' : 'false',
        onclick: () => set(type === 'dates' && !sc.from ? { type, from: today, to: today } : { type }),
      }, label))),
    sc.type === 'weekly' && h('div', { class: 'day-toggles', role: 'group', 'aria-label': 'Nights of the week' },
      DAY_NAMES.map((name, i) => h('button', {
        class: 'day-toggle', 'aria-pressed': sc.days.includes(i) ? 'true' : 'false', 'aria-label': name,
        onclick: () => set({ days: sc.days.includes(i) ? sc.days.filter(d => d !== i) : [...sc.days, i].sort() }),
      }, name.slice(0, 2)))),
    sc.type === 'dates' && h('div', { class: 'date-range' },
      h('div', { class: 'row-actions wrap' },
        [['Tonight', [today, today]], ['This week', [week[0], week[6]]], ['This month', month]].map(([label, [from, to]]) => h('button', {
          class: `btn ghost small ${sc.from === from && sc.to === to ? 'is-on' : ''}`,
          onclick: () => set({ from, to }),
        }, label))),
      h('div', { class: 'dates' },
        field('From', h('input', {
          id: `from-${routine.id}`, type: 'date', value: sc.from,
          onchange: e => { const from = e.target.value; if (from) set({ from, to: sc.to && sc.to >= from ? sc.to : from }); },
        }), `from-${routine.id}`),
        field('To', h('input', {
          id: `to-${routine.id}`, type: 'date', value: sc.to, min: sc.from,
          onchange: e => { const to = e.target.value; if (to) set({ to: to < sc.from ? sc.from : to }); },
        }), `to-${routine.id}`))),
    sc.type !== 'none' && h('p', { class: 'setting-hint' }, 'On planned nights, Tonight opens with this stack. You can still switch. If two plans overlap, dates win over weekly plans.'),
  );
}

function editRow(app, routine, step, i) {
  const open = openStepId === step.id;
  const tpl = TEMPLATES[step.type];
  const modes = ['timed', 'open', ...(step.type === 'breathe' || step.mode === 'breath' ? ['breath'] : [])];
  const modeNames = { timed: 'Countdown', open: 'Open-ended', breath: 'Breathing guide' };
  const move = dir => () => {
    const [moved] = routine.steps.splice(i, 1);
    routine.steps.splice(i + dir, 0, moved);
    save();
    app.render();
  };

  return h('li', { class: `edit-row ${open ? 'open' : ''}`, style: hueVar(step), 'data-sort': '' },
    h('button', {
      class: 'edit-head', 'aria-expanded': open ? 'true' : 'false',
      onclick: () => { openStepId = open ? null : step.id; app.render(); },
    },
      h('span', { class: 'grip', title: 'Drag to reorder' }, icon('grip')),
      h('span', { class: 'pebble-icon' }, icon(step.icon)),
      h('span', { class: 'row-text' }, h('span', { class: 'row-name' }, step.name), h('span', { class: 'row-sub' }, modeLabel(step))),
      icon(open ? 'up' : 'down', 'chev')),
    open && h('div', { class: 'edit-body' },
      field('Name', h('input', {
        id: `name-${step.id}`, type: 'text', value: step.name, maxlength: '40', autocomplete: 'off',
        oninput: e => { step.name = e.target.value.trim() || tpl?.name || 'Step'; save(); },
        onchange: () => app.render(),
      }), `name-${step.id}`),
      h('div', { class: 'field' },
        h('span', { class: 'field-label', id: `mode-${step.id}` }, 'Timer'),
        h('div', { class: 'segmented small', role: 'radiogroup', 'aria-labelledby': `mode-${step.id}` },
          modes.map(m => h('button', {
            class: 'seg', role: 'radio', 'aria-checked': step.mode === m ? 'true' : 'false',
            onclick: () => { step.mode = m; save(); app.render(); },
          }, modeNames[m])))),
      field(step.mode === 'open' ? 'Gentle nudge after' : 'Length',
        stepper(`min-${step.id}`, step.minutes, v => { step.minutes = v; save(); app.render(); }), `min-${step.id}`),
      step.mode === 'breath' && h('div', { class: 'field' },
        h('span', { class: 'field-label', id: `pattern-${step.id}` }, 'Breathing style'),
        h('div', { class: 'segmented small', role: 'radiogroup', 'aria-labelledby': `pattern-${step.id}` },
          Object.entries(PATTERN_NAMES).map(([key, label]) => h('button', {
            class: 'seg', role: 'radio', 'aria-checked': (step.pattern || 'sigh') === key ? 'true' : 'false',
            onclick: () => { step.pattern = key; save(); app.render(); },
          }, label)))),
      step.mode === 'timed' && h('div', { class: 'setting inline' },
        h('label', { class: 'setting-text', for: `hard-${step.id}` },
          h('span', { class: 'setting-label' }, 'Firm stop'),
          h('span', { class: 'setting-hint' }, 'No "+5 minutes" button. Handy for activities you tend to get lost in.')),
        h('input', {
          id: `hard-${step.id}`, type: 'checkbox', role: 'switch', class: 'switch', checked: !!step.hardStop,
          onchange: e => { step.hardStop = e.target.checked; save(); app.render(); },
        })),
      field('Your own prompt (optional)', h('textarea', {
        id: `tip-${step.id}`, rows: '2', placeholder: tpl?.tips?.[0] || 'A line to show during this step',
        value: step.tip || '',
        oninput: e => { step.tip = e.target.value.trim(); save(); },
      }), `tip-${step.id}`),
      h('div', { class: 'field' },
        h('span', { class: 'field-label', id: `icon-${step.id}` }, 'Icon'),
        h('div', { class: 'icon-pick', role: 'radiogroup', 'aria-labelledby': `icon-${step.id}` },
          PICKABLE_ICONS.map(name => h('button', {
            class: 'icon-choice', role: 'radio', 'aria-checked': step.icon === name ? 'true' : 'false', 'aria-label': name,
            onclick: () => { step.icon = name; save(); app.render(); },
          }, icon(name))))),
      tpl?.why && h('p', { class: 'why' }, icon('info'), h('span', null, tpl.why)),
      h('div', { class: 'row-actions' },
        h('button', { class: 'btn ghost small', disabled: i === 0, onclick: move(-1) }, icon('up'), 'Move up'),
        h('button', { class: 'btn ghost small', disabled: i === routine.steps.length - 1, onclick: move(1) }, icon('down'), 'Move down'),
        h('button', {
          class: 'btn ghost small danger-text',
          onclick: () => { routine.steps.splice(i, 1); openStepId = null; save(); app.render(); toast(`Removed ${step.name}`); },
        }, icon('trash'), 'Remove'))),
  );
}

function picker(app, routine) {
  const add = step => {
    routine.steps.push(step);
    adding = false;
    openStepId = step.type === 'custom' ? step.id : null;
    save();
    app.render();
    toast(`Added ${step.name}`);
  };
  return h('div', { class: 'picker' },
    h('div', { class: 'picker-head' },
      h('h2', { class: 'label' }, 'Add a step'),
      h('button', { class: 'link', onclick: () => { adding = false; app.render(); } }, 'Cancel')),
    h('div', { class: 'picker-grid' },
      TEMPLATE_ORDER.map(type => {
        const t = TEMPLATES[type];
        return h('button', { class: 'pick', style: { '--hue': `var(--hue-${t.hue})` }, onclick: () => add(stepFromTemplate(type)) },
          h('span', { class: 'pebble-icon' }, icon(t.icon)),
          h('span', { class: 'row-name' }, t.name),
          h('span', { class: 'row-sub' }, modeLabel(t)));
      }),
      h('button', {
        class: 'pick', style: { '--hue': 'var(--hue-custom)' },
        onclick: () => add({ id: makeId(), type: 'custom', name: 'My activity', icon: 'leaf', hue: 'custom', mode: 'timed', minutes: 10, tip: '' }),
      }, h('span', { class: 'pebble-icon' }, icon('leaf')), h('span', { class: 'row-name' }, 'Your own'), h('span', { class: 'row-sub' }, 'Name it yourself'))));
}

// ---- Progress ----------------------------------------------------------------

function avg(list) {
  return list.length ? list.reduce((a, b) => a + b, 0) / list.length : null;
}

export function progressView(app) {
  const history = [...state.history].sort((a, b) => b.startedAt - a.startedAt);
  const today = eveningKey(Date.now());
  const week = weekDays().map(keyOf);

  if (!history.length) {
    return h('div', { class: 'view progress' },
      masthead('Progress', 'Every evening counts'),
      todayCard(app, today),
      checkupTrends(app),
      extrasThisWeek(week),
      h('div', { class: 'empty' },
        svg(cairnSVG([{ minutes: 15, hue: 'read', done: false }, { minutes: 10, hue: 'color', done: false }, { minutes: 5, hue: 'breathe', done: false }], { width: 140, seed: 3 })),
        h('h2', { class: 'display md' }, 'Your evenings will appear here'),
        h('p', { class: 'muted' }, 'Finish your first stack and it becomes a little cairn of stones. You will also see how busy your mind was before and after.'),
        h('button', { class: 'btn primary', onclick: () => app.go('tonight') }, 'Go to tonight')));
  }

  const thisWeek = history.filter(e => week.includes(e.date));
  const evenings = new Set(thisWeek.map(e => e.date)).size;
  const weekMinutes = thisWeek.reduce((sum, e) => sum + e.minutes, 0);
  const checked = history.filter(e => e.before && e.after).slice(0, 14);
  const before = avg(checked.map(e => e.before));
  const after = avg(checked.map(e => e.after));

  return h('div', { class: 'view progress' },
    masthead('Progress', 'Every evening counts'),
    todayCard(app, today),
    h('div', { class: 'stats' },
      h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, 'This week'), h('span', { class: 'stat-value' }, String(evenings)), h('span', { class: 'stat-unit' }, `of ${state.settings.weeklyGoal || 5} evenings`)),
      h('div', { class: 'stat' }, h('span', { class: 'stat-label' }, 'Time this week'), h('span', { class: 'stat-value' }, String(Math.round(weekMinutes))), h('span', { class: 'stat-unit' }, 'minutes')),
      before != null && h('div', { class: 'stat wide' },
        h('span', { class: 'stat-label' }, `Mind before → after, last ${checked.length}`),
        h('span', { class: 'stat-value' }, before.toFixed(1), h('span', { class: 'arrow' }, ' → '), after.toFixed(1)),
        h('span', { class: 'stat-unit' }, `on a 1–5 scale, 1 = ${NOISE[0].toLowerCase()}, 5 = ${NOISE[4].toLowerCase()}`))),
    weekCairns(app, history, week),
    checkupTrends(app),
    extrasThisWeek(week),
    h('section', { class: 'block' },
      h('h2', { class: 'label' }, 'Last five weeks'),
      calendar(app, history)),
    h('section', { class: 'block' },
      h('h2', { class: 'label' }, 'Recent evenings'),
      h('ol', { class: 'history' }, history.slice(0, 30).map(e => historyRow(app, e)))),
    h('p', { class: 'muted small' }, 'Missing a day doesn’t reset anything here. Habits grow from coming back, not from perfect streaks. Tap any day to see it in full.'),
  );
}

function todayCard(app, key) {
  const sessions = state.history.filter(e => e.date === key);
  const minutes = sessions.reduce((sum, e) => sum + e.minutes, 0);
  const checkup = state.checkups[key];
  const extras = extrasOn(key);
  return h('section', { class: 'today-card' },
    h('div', { class: 'today-head' },
      h('h2', { class: 'display md' }, 'Today'),
      h('button', { class: 'link', onclick: () => app.openDay(key) }, 'Open the day')),
    h('div', { class: 'today-row' },
      icon('cairn'),
      h('span', { class: 'row-text' },
        h('span', { class: 'row-name' }, 'Brain stack'),
        h('span', { class: 'row-sub' }, !sessions.length ? 'Not yet tonight'
          : sessions.length === 1 ? `${sessions[0].routineName}, ${minutesLabel(minutes)}`
          : `${sessions.length} stacks, ${minutesLabel(minutes)} in total`))),
    h('div', { class: 'today-row' },
      icon('heart'),
      h('span', { class: 'row-text' },
        h('span', { class: 'row-name' }, 'Daily check-up'),
        h('span', { class: 'row-sub' }, checkup ? answerList(checkup).map(a => a.label).join(' · ') : 'A few taps about your day')),
      !checkup && h('button', { class: 'btn ghost small', onclick: () => app.openCheckup(key) }, 'Check in')),
    h('div', { class: 'today-row' },
      icon('walk'),
      h('span', { class: 'row-text' },
        h('span', { class: 'row-name' }, 'Also did'),
        extras.length
          ? h('ul', { class: 'extras-row' }, extras.map(x => extraChip(x, item => { removeExtra(item.id); app.render(); })))
          : h('span', { class: 'row-sub' }, 'Nothing logged yet')),
      h('button', { class: 'btn ghost small', onclick: () => logActivity(key, app.render) }, icon('plus'), 'Log')),
  );
}

// Last 14 evenings per check-up question. Each dot is filled by how easy the
// answer was, so fuller always reads as better, whichever way a question runs.
function checkupTrends(app) {
  const end = dateFromKey(eveningKey(Date.now()));
  const days = Array.from({ length: 14 }, (_, i) => keyOf(new Date(end.getFullYear(), end.getMonth(), end.getDate() - 13 + i)));
  const questions = CHECKUP.filter(q => days.some(k => state.checkups[k]?.[q.id] != null));
  if (!questions.length) return null;
  const week = days.slice(-7);
  const panicDays = week.filter(k => (state.checkups[k]?.panic ?? 0) >= 2).length;
  const hasPanic = questions.some(q => q.id === 'panic');

  return h('section', { class: 'block' },
    h('div', { class: 'week-head' },
      h('h2', { class: 'label' }, 'Daily check-ups'),
      h('span', { class: 'muted small' }, 'Last 14 days')),
    h('div', { class: 'trends' },
      questions.map(q => h('div', { class: 'trend-row' },
        h('span', { class: 'trend-label' }, q.label),
        h('div', { class: 'trend-cells' }, days.map(k => {
          const a = state.checkups[k]?.[q.id];
          const text = `${dayLabel(k)}, ${q.label.toLowerCase()}: ${a != null ? q.options[a] : 'no answer'}`;
          return h('button', {
            class: `trend-cell ${a == null ? 'empty' : ''}`,
            style: a != null ? { '--mix': `${Math.round(22 + checkupEase(q, a) * 78)}%`, '--s': (0.5 + checkupEase(q, a) * 0.5).toFixed(2) } : null,
            title: text, 'aria-label': text,
            onclick: () => app.openDay(k),
          });
        }))))),
    h('p', { class: 'muted small' },
      'Bigger, brighter dots mean an easier day. ',
      hasPanic ? (panicDays ? `Panicky moments on ${panicDays} of the last 7 days.` : 'No panicky moments in the last 7 days.') : ''));
}

function extrasThisWeek(week) {
  const tally = new Map();
  for (const x of state.extras.filter(e => week.includes(e.date))) {
    const item = tally.get(x.name) || { ...x, n: 0 };
    item.n += 1;
    tally.set(x.name, item);
  }
  if (!tally.size) return null;
  return h('section', { class: 'block' },
    h('h2', { class: 'label' }, 'Also did this week'),
    h('ul', { class: 'extras-row' }, [...tally.values()].sort((a, b) => b.n - a.n).map(x =>
      h('li', { class: 'extra-chip' }, icon(x.icon), h('span', null, x.name), x.n > 1 && h('span', { class: 'count' }, `×${x.n}`)))));
}

function weekCairns(app, history, week) {
  const todayKey = eveningKey(Date.now());
  return h('section', { class: 'block' },
    h('h2', { class: 'label' }, 'This week’s stacks'),
    h('ol', { class: 'week-cairns' },
      week.map((k, i) => {
        const stones = history.filter(e => e.date === k)
          .flatMap(e => e.steps.filter(st => st.status === 'done').map(st => ({ minutes: Math.max(2, Math.min(30, st.actualSec / 60)), hue: st.hue || 'custom', done: true })));
        const d = dateFromKey(k);
        return h('li', { class: k === todayKey ? 'today' : '' },
          h('button', { class: 'cairn-day', onclick: () => app.openDay(k), 'aria-label': `Open ${fmtDay(d)}` },
            stones.length ? svg(cairnSVG(stones.slice(0, 8), { width: 44, seed: i + 11 })) : h('span', { class: 'cairn-empty' }),
            h('span', { class: 'day-name' }, d.toLocaleDateString('en-GB', { weekday: 'short' }))));
      })));
}

function calendar(app, history) {
  const done = new Map();
  for (const e of history) done.set(e.date, (done.get(e.date) || 0) + e.minutes);
  const todayKey = eveningKey(Date.now());
  const start = weekDays()[0];
  start.setDate(start.getDate() - 28);
  const cells = Array.from({ length: 35 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const k = keyOf(d);
    const mins = done.get(k) || 0;
    const level = mins >= 40 ? 3 : mins >= 20 ? 2 : mins > 0 ? 1 : 0;
    const label = `${fmtDay(d)}${mins ? `: ${Math.round(mins)} min` : ''}`;
    return h('li', null, h('button', {
      class: ['cal-cell', `lvl-${level}`, k === todayKey && 'today', k > todayKey && 'future'].filter(Boolean).join(' '),
      title: label, 'aria-label': label, disabled: k > todayKey,
      onclick: () => app.openDay(k),
    }));
  });
  return h('div', { class: 'cal-wrap' },
    h('ol', { class: 'cal-head', 'aria-hidden': 'true' }, ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(l => h('li', null, l))),
    h('ol', { class: 'cal', 'aria-label': 'Evenings practiced in the last five weeks' }, cells));
}

function historyRow(app, e) {
  const done = e.steps.filter(st => st.status === 'done');
  return h('li', null, h('button', { class: 'history-row', onclick: () => app.openDay(e.date) },
    h('div', { class: 'history-main' },
      h('span', { class: 'row-name' }, fmtDay(dateFromKey(e.date))),
      h('span', { class: 'row-sub' }, `${e.routineName} · ${minutesLabel(e.minutes)} · ${done.length}/${e.steps.length} steps`)),
    h('div', { class: 'history-dots', 'aria-hidden': 'true' },
      e.steps.map(st => h('span', { class: `mini-dot ${st.status === 'done' ? 'done' : ''}`, style: { '--hue': `var(--hue-${st.hue || 'custom'})` } }))),
    e.before && e.after
      ? h('div', { class: 'history-noise', 'aria-label': `Mind ${NOISE[e.before - 1]} to ${NOISE[e.after - 1]}` },
          h('span', { style: { color: `var(--noise-${e.before})` } }, noiseWave(e.before, 28, 14)),
          h('span', { class: 'arrow' }, '→'),
          h('span', { style: { color: `var(--noise-${e.after})` } }, noiseWave(e.after, 28, 14)))
      : h('div', { class: 'history-noise' })));
}

// ---- Settings ----------------------------------------------------------------

function toggle(key, label, hint, after) {
  const id = `set-${key}`;
  return h('div', { class: 'setting' },
    h('label', { class: 'setting-text', for: id },
      h('span', { class: 'setting-label' }, label),
      hint && h('span', { class: 'setting-hint' }, hint)),
    h('input', {
      id, type: 'checkbox', role: 'switch', class: 'switch', checked: !!state.settings[key],
      onchange: e => { state.settings[key] = e.target.checked; save(); after?.(); },
    }));
}

function reminderICS(time) {
  const [hh, mm] = time.split(':');
  const pad = n => String(n).padStart(2, '0');
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
  return [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Brain Stack//Evening routine//EN', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:brain-stack-evening-${stamp}@brainstack.app`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}T${hh}${mm}00`,
    'DURATION:PT45M',
    'RRULE:FREQ=DAILY',
    'SUMMARY:Brain Stack',
    'DESCRIPTION:Time to wind down. Open Brain Stack and pick tonight\'s stack.',
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Brain Stack time', 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR', '',
  ].join('\r\n');
}

export function settingsView(app) {
  const st = state.settings;
  const embedded = isEmbedded();
  const modes = [['evening', 'Evening'], ['system', 'Match device'], ['light', 'Light']];

  return h('div', { class: 'view settings' },
    masthead('Settings', 'Make it yours'),

    h('section', { class: 'group' },
      h('h2', { class: 'label' }, 'Sound and feel'),
      toggle('sound', 'Chimes', 'A light chime when a step ends.'),
      h('div', { class: 'setting column' },
        h('span', { class: 'setting-label', id: 'chime-label' }, 'Chime sound'),
        h('div', { class: 'segmented small', role: 'radiogroup', 'aria-labelledby': 'chime-label' },
          Object.entries(SOUND_STYLES).map(([id, label]) => h('button', {
            class: 'seg', role: 'radio', 'aria-checked': st.chime === id ? 'true' : 'false',
            onclick: () => { st.chime = id; save(); unlock(); chime('end', st.volume, id); app.render(); },
          }, label)))),
      h('div', { class: 'setting' },
        h('label', { class: 'setting-text', for: 'set-volume' }, h('span', { class: 'setting-label' }, 'Volume')),
        h('div', { class: 'volume' },
          h('input', {
            id: 'set-volume', type: 'range', min: '0.1', max: '1', step: '0.05', value: String(st.volume),
            oninput: e => { st.volume = Number(e.target.value); save(); },
          }),
          h('button', { class: 'btn ghost small', onclick: () => { unlock(); chime('end', st.volume, st.chime); } }, icon('sound'), 'Test'))),
      toggle('breathCues', 'Breathing tones', 'Soft rising and falling tones for breathing in and out, so you can close your eyes.'),
      toggle('warn', 'Heads-up before a step ends', 'A gentler chime two minutes before longer steps end (one minute for short ones), with a peek at what is next.'),
      canVibrate && toggle('vibrate', 'Vibration', 'Buzz with each chime, for when the phone is face down.')),

    h('section', { class: 'group' },
      h('h2', { class: 'label', id: 'theme-label' }, 'Look'),
      h('div', { class: 'setting column' },
        h('span', { class: 'setting-label', id: 'accent-label' }, 'Color'),
        h('div', { class: 'swatches', role: 'radiogroup', 'aria-labelledby': 'accent-label' },
          THEMES.map(t => h('button', {
            class: 'swatch-btn', role: 'radio', 'aria-checked': st.accent === t.id ? 'true' : 'false',
            onclick: () => { st.accent = t.id; save(); app.applyTheme(); app.render(); },
          }, h('span', { class: 'swatch', 'data-swatch': t.id }), h('span', { class: 'swatch-name' }, t.name))))),
      h('div', { class: 'setting column' },
        h('span', { class: 'setting-label', id: 'mode-label' }, 'Light or dark'),
        h('div', { class: 'segmented small', role: 'radiogroup', 'aria-labelledby': 'mode-label' },
          modes.map(([id, label]) => h('button', {
            class: 'seg', role: 'radio', 'aria-checked': st.theme === id ? 'true' : 'false',
            onclick: () => { st.theme = id; save(); app.applyTheme(); app.render(); },
          }, label))),
        h('p', { class: 'setting-hint' }, 'Evening keeps the dark look at any hour, which is easier on your eyes before bed.')),
      toggle('motion', 'Gently moving background', 'The colors drift very slowly. Turn off for a still background.', app.applyTheme)),

    h('section', { class: 'group' },
      h('h2', { class: 'label' }, 'Sessions'),
      h('div', { class: 'setting' },
        h('div', { class: 'setting-text' },
          h('span', { class: 'setting-label', id: 'goal-label' }, 'Weekly goal'),
          h('span', { class: 'setting-hint' }, 'Evenings per week. A couple of planned rest nights makes it easier to keep going.')),
        counter('goal', st.weeklyGoal || 5, 3, 7, n => `${n} nights`, v => { st.weeklyGoal = v; save(); app.render(); })),
      toggle('checkin', 'Check in before and after', 'Rate how busy your mind is, so you can see the routine working.'),
      toggle('autoAdvance', 'Start the next step by itself', 'After a one-minute breather. Off means you tap when ready.'),
      toggle('wakeLock', 'Keep the screen on', 'Needed for chimes on a phone. The screen dims while you are away from it.')),

    h('section', { class: 'group' },
      h('h2', { class: 'label' }, 'Daily check-up'),
      toggle('checkup', 'Ask after each stack', 'A few questions about your day with answers to tap, one at a time. Skip any of them.'),
      h('div', { class: 'setting column' },
        h('span', { class: 'setting-label' }, 'Questions to ask'),
        h('div', { class: 'q-list' },
          CHECKUP.map(q => {
            const id = `q-${q.id}`;
            return h('label', { class: 'q-item', for: id },
              h('input', {
                id, type: 'checkbox', checked: st.checkupQs.includes(q.id),
                onchange: e => {
                  const on = new Set(st.checkupQs);
                  if (e.target.checked) on.add(q.id); else on.delete(q.id);
                  st.checkupQs = CHECKUP.filter(x => on.has(x.id)).map(x => x.id);
                  save();
                },
              }),
              h('span', null, q.q));
          })))),

    h('section', { class: 'group' },
      h('h2', { class: 'label' }, 'Evening reminder'),
      h('div', { class: 'setting' },
        h('label', { class: 'setting-text', for: 'set-reminder' },
          h('span', { class: 'setting-label' }, 'Reminder time'),
          h('span', { class: 'setting-hint' }, 'Optional. A cue you already have works even better: after I brush my teeth, I open Brain Stack.')),
        h('input', { id: 'set-reminder', type: 'time', value: st.reminder, onchange: e => { st.reminder = e.target.value || '21:00'; save(); } })),
      h('div', { class: 'setting column' },
        h('button', {
          class: 'btn ghost', disabled: embedded,
          onclick: async () => {
            const result = await saveFile('brain-stack-reminder.ics', reminderICS(st.reminder), 'text/calendar');
            toast(result === 'downloaded' ? 'Open the file to add the daily reminder to your calendar' : 'Could not create the reminder file');
          },
        }, icon('bell'), 'Add to my calendar'),
        h('p', { class: 'setting-hint' }, embedded
          ? 'Available in the installed app.'
          : 'Downloads a calendar event that repeats every day at your reminder time.'))),

    h('section', { class: 'group' },
      h('h2', { class: 'label' }, 'Your data'),
      h('p', { class: 'setting-hint' }, 'Everything stays on this device. Use a backup to keep it safe or to copy your stacks between computer and phone.'),
      h('div', { class: 'row-actions wrap' },
        h('button', {
          class: 'btn ghost small',
          onclick: async () => {
            const data = JSON.stringify({ app: 'brain-stack', exportedAt: new Date().toISOString(), ...state, session: null }, null, 2);
            const result = await saveFile(`brain-stack-backup-${eveningKey(Date.now())}.json`, data, 'application/json');
            toast(result === 'downloaded' ? 'Backup saved' : result === 'copied' ? 'Backup copied to the clipboard' : 'Could not save the backup');
          },
        }, icon('download'), 'Save a backup'),
        h('label', { class: 'btn ghost small', for: 'import-file' }, icon('upload'), 'Restore a backup'),
        h('input', {
          id: 'import-file', type: 'file', accept: 'application/json,.json', class: 'visually-hidden',
          onchange: async e => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (!file) return;
            let data;
            try { data = JSON.parse(await file.text()); } catch { data = null; }
            if (!data || !Array.isArray(data.routines)) return toast('That file is not a Brain Stack backup.');
            const ok = await ask({ title: 'Restore this backup?', body: `Your stacks, ${data.history?.length || 0} saved evenings, check-ups and activities from the file will replace what is on this device.`, confirm: 'Restore' });
            if (!ok) return;
            replaceState(data);
            app.applyTheme();
            app.render();
            toast('Backup restored');
          },
        }),
        h('button', {
          class: 'btn ghost small danger-text',
          onclick: async () => {
            const ok = await ask({ title: 'Erase everything?', body: 'This removes your stacks, settings, history, check-ups and activities from this device. It cannot be undone.', confirm: 'Erase', danger: true });
            if (!ok) return;
            replaceState(null);
            app.applyTheme();
            app.render();
            toast('Everything erased');
          },
        }, icon('trash'), 'Erase all'))),

    h('section', { class: 'group' },
      h('h2', { class: 'label' }, 'About'),
      h('button', { class: 'setting link-row', onclick: app.openScience },
        h('span', { class: 'setting-text' },
          h('span', { class: 'setting-label' }, 'Why these timings?'),
          h('span', { class: 'setting-hint' }, 'The research behind each step, in plain words.')),
        icon('info')),
      app.installPrompt && h('button', { class: 'setting link-row', onclick: app.install },
        h('span', { class: 'setting-text' },
          h('span', { class: 'setting-label' }, 'Install Brain Stack'),
          h('span', { class: 'setting-hint' }, 'Adds it to your home screen or dock and works offline.')),
        icon('download')),
      h('p', { class: 'setting-hint about' }, 'Brain Stack is a self-care tool, not treatment. The check-up helps you notice patterns; it is not a diagnosis. If racing thoughts or panic are getting in the way of daily life, a doctor or therapist can help; CBT has good evidence for both.')),
  );
}
