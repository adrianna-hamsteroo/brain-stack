// Daily check-up: a few tap-only questions, one per screen, so there is
// nothing to type and only one small decision at a time.
import { h, icon } from './ui.js';
import { CHECKUP } from './data.js';
import { state, saveCheckup, dateFromKey, eveningKey } from './store.js';

export function enabledQuestions() {
  return CHECKUP.filter(q => state.settings.checkupQs.includes(q.id));
}

// Answer labels for a saved check-up, in question order.
export function answerList(answers) {
  return CHECKUP.filter(q => answers?.[q.id] != null && q.options[answers[q.id]])
    .map(q => ({ q, label: q.options[answers[q.id]] }));
}

// Renders the questions into `container`. onDone(answers) gets
// { questionId: optionIndex } for whatever was answered. An optional
// back = { label, onClick } adds a way back on the first question.
export function checkupFlow(container, { onDone, back = null }) {
  const questions = enabledQuestions();
  const answers = {};
  let i = 0;
  show();

  function show() {
    if (i >= questions.length) return onDone(answers);
    const q = questions[i];
    container.replaceChildren(h('section', { class: 'session-body centered checkup' },
      h('p', { class: 'eyebrow' }, `Daily check-up · ${i + 1} of ${questions.length}`),
      h('h1', { class: 'display' }, q.q),
      h('div', { class: 'choices', role: 'group', 'aria-label': q.q },
        q.options.map((label, n) => h('button', {
          class: 'choice',
          onclick: () => { answers[q.id] = n; i += 1; show(); },
        }, label))),
      h('div', { class: 'row-actions' },
        h('button', { class: 'link', onclick: () => { i += 1; show(); } }, 'Skip this one'),
        h('button', { class: 'link', onclick: () => onDone(answers) }, i === 0 ? 'Skip the check-up' : 'Stop here')),
      i === 0 && back && h('button', { class: 'link', onclick: back.onClick }, back.label),
    ));
  }
}

// A check-up on its own, for evenings without a stack or to redo one.
export function mountCheckup(host, { date = eveningKey(Date.now()), onExit }) {
  const body = h('div', { class: 'session-main' });
  const isToday = date === eveningKey(Date.now());
  const label = isToday ? 'Today' : dateFromKey(date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
  host.replaceChildren(h('div', { class: 'session' },
    h('header', { class: 'session-top' },
      h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: onExit }, icon('x')),
      h('span', null),
      h('span', { class: 'session-count' }, label)),
    body));

  checkupFlow(body, {
    onDone: answers => {
      if (!Object.keys(answers).length) return onExit();
      saveCheckup(date, answers);
      body.replaceChildren(h('section', { class: 'session-body centered' },
        h('p', { class: 'eyebrow' }, 'Daily check-up'),
        h('h1', { class: 'display' }, 'Saved. Thanks for checking in.'),
        h('ul', { class: 'answers' }, answerList(answers).map(({ q, label: text }) =>
          h('li', null, h('span', { class: 'answer-q' }, q.label), text))),
        h('button', { class: 'btn primary big', onclick: onExit }, 'Done')));
    },
  });

  return { destroy() {}, askEnd: onExit };
}
