// The extra-activity log ("also did today") and the day view in Progress.
import { h, icon, toast, openSheet } from './ui.js';
import { EXTRA_PRESETS, EXTRA_ICONS, NOISE } from './data.js';
import { state, extrasOn, addExtra, removeExtra, addExtraType, dateFromKey, eveningKey } from './store.js';
import { minutesLabel } from './timer.js';
import { answerList } from './checkup.js';

export function dayLabel(key, long = false) {
  if (!long && key === eveningKey(Date.now())) return 'Today';
  return dateFromKey(key).toLocaleDateString('en-GB', long
    ? { weekday: 'long', day: 'numeric', month: 'long' }
    : { weekday: 'short', day: 'numeric', month: 'short' });
}

export function extraChip(x, onRemove) {
  return h('li', { class: 'extra-chip' },
    icon(x.icon),
    h('span', null, x.name),
    onRemove && h('button', { class: 'chip-x', 'aria-label': `Remove ${x.name}`, onclick: () => onRemove(x) }, icon('x')));
}

// One-tap logging. The sheet stays open so several things can go in at once.
export function logActivity(key, onChange) {
  return openSheet(close => {
    const body = h('div', { class: 'log' });
    let adding = false;
    let newIcon = 'gratitude';
    render();
    return body;

    function changed() {
      onChange?.();
      render();
    }

    function render() {
      const logged = extrasOn(key);
      body.replaceChildren(...[
        h('div', { class: 'log-head' },
          h('h2', null, 'Log an activity'),
          h('span', { class: 'muted' }, dayLabel(key))),
        h('p', { class: 'setting-hint' }, 'Anything you did outside the stack. One tap adds it.'),
        logged.length > 0 && h('ul', { class: 'extras-row' },
          logged.map(x => extraChip(x, item => { removeExtra(item.id); changed(); }))),
        h('div', { class: 'log-grid' },
          [...EXTRA_PRESETS, ...state.extraTypes].map(t => h('button', {
            class: 'log-item',
            onclick: () => { addExtra(key, t); toast(`Logged: ${t.name}`); changed(); },
          }, icon(t.icon), h('span', null, t.name))),
          !adding && h('button', { class: 'log-item add', onclick: () => { adding = true; render(); } },
            icon('plus'), h('span', null, 'Your own'))),
        adding && newTypeForm(),
        h('div', { class: 'sheet-actions single' },
          h('button', { class: 'btn primary', onclick: () => close() }, 'Done')),
      ].filter(Boolean));
      body.querySelector('#new-extra-name')?.focus();
    }

    function newTypeForm() {
      const input = h('input', { id: 'new-extra-name', type: 'text', maxlength: '30', autocomplete: 'off', placeholder: 'e.g. Swimming, Gallery, Gardening' });
      const add = () => {
        const name = input.value.trim();
        if (!name) return input.focus();
        const type = addExtraType(name, newIcon);
        addExtra(key, type);
        adding = false;
        toast(`Logged: ${name}`);
        changed();
      };
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); add(); }
      });
      const picks = EXTRA_ICONS.map(name => h('button', {
        class: 'icon-choice', role: 'radio', 'aria-label': name, 'aria-checked': name === newIcon ? 'true' : 'false',
        onclick: e => {
          newIcon = name;
          picks.forEach(btn => btn.setAttribute('aria-checked', btn === e.currentTarget ? 'true' : 'false'));
        },
      }, icon(name)));
      return h('div', { class: 'new-extra' },
        h('label', { class: 'field-label', for: 'new-extra-name' }, 'Name it'),
        input,
        h('div', { class: 'icon-pick', role: 'radiogroup', 'aria-label': 'Icon' }, picks),
        h('div', { class: 'row-actions wrap' },
          h('button', { class: 'btn ghost small', onclick: () => { adding = false; render(); } }, 'Cancel'),
          h('button', { class: 'btn primary small', onclick: add }, 'Save and log')));
    }
  }, { label: 'Log an activity', wide: true });
}

export function dayView(app, key) {
  const today = eveningKey(Date.now());
  const sessions = state.history.filter(e => e.date === key).sort((a, b) => a.startedAt - b.startedAt);
  const checkup = state.checkups[key];
  const extras = extrasOn(key);
  const future = key > today;

  return h('div', { class: 'view day' },
    h('button', { class: 'back', onclick: app.closeSub }, icon('back'), 'Progress'),
    h('header', { class: 'masthead' },
      h('p', { class: 'eyebrow' }, key === today ? 'Today' : 'Your day'),
      h('h1', { class: 'display lg' }, dayLabel(key, true))),

    h('section', { class: 'group day-group' },
      h('h2', { class: 'label' }, 'Brain stack'),
      sessions.length
        ? sessions.map(sessionSummary)
        : h('p', { class: 'setting-hint' }, future ? 'Still to come.' : 'No stack this evening, and that is okay.')),

    h('section', { class: 'group day-group' },
      h('h2', { class: 'label' }, 'Daily check-up'),
      checkup
        ? h('ul', { class: 'answers' }, answerList(checkup).map(({ q, label }) =>
            h('li', null, h('span', { class: 'answer-q' }, q.label), label)))
        : h('p', { class: 'setting-hint' }, 'Not filled in.'),
      !future && h('div', { class: 'row-actions wrap' },
        h('button', { class: 'btn ghost small', onclick: () => app.openCheckup(key) },
          icon('heart'), checkup ? 'Redo the check-up' : 'Do the check-up'))),

    h('section', { class: 'group day-group' },
      h('h2', { class: 'label' }, 'Also did'),
      extras.length
        ? h('ul', { class: 'extras-row' }, extras.map(x => extraChip(x, item => { removeExtra(item.id); app.render(); })))
        : h('p', { class: 'setting-hint' }, 'Nothing logged.'),
      !future && h('div', { class: 'row-actions wrap' },
        h('button', { class: 'btn ghost small', onclick: () => logActivity(key, app.render) }, icon('plus'), 'Log an activity'))),
  );
}

function sessionSummary(e) {
  const done = e.steps.filter(s => s.status === 'done').length;
  const time = new Date(e.startedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  return h('div', { class: 'day-session' },
    h('div', { class: 'history-main' },
      h('span', { class: 'row-name' }, e.routineName),
      h('span', { class: 'row-sub' }, `${time} · ${minutesLabel(e.minutes)} · ${done} of ${e.steps.length} steps`),
      e.before && e.after && h('span', { class: 'row-sub' }, `Mind: ${NOISE[e.before - 1]} → ${NOISE[e.after - 1]}`)),
    h('div', { class: 'history-dots', 'aria-hidden': 'true' },
      e.steps.map(st => h('span', { class: `mini-dot ${st.status === 'done' ? 'done' : ''}`, style: { '--hue': `var(--hue-${st.hue || 'custom'})` } }))));
}
