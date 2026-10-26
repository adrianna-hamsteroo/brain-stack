// Boot, tab navigation, overlays (session, quick calm, check-up), sub-pages
// (research, day view), theme, offline support and the install prompt.
import { h, icon, isEmbedded } from './ui.js';
import { state, save } from './store.js';
import { startSession, mountSession, closeStaleSession } from './session.js';
import { mountCalm } from './calm.js';
import { tonightView, routineView, progressView, settingsView } from './views.js';
import { scienceView } from './science.js';
import { dayView } from './tracker.js';
import { mountCheckup } from './checkup.js';

const root = document.getElementById('app');
const TABS = [
  { id: 'tonight', label: 'Tonight', icon: 'moon', view: tonightView },
  { id: 'routine', label: 'Routine', icon: 'cairn', view: routineView },
  { id: 'progress', label: 'Progress', icon: 'progress', view: progressView },
  { id: 'settings', label: 'Settings', icon: 'sliders', view: settingsView },
];

let tab = 'tonight';
let sub = null;      // 'science' over Settings, 'day' over Progress
let dayKey = null;   // the day shown when sub is 'day'
let overlay = null;  // { kind: 'session' | 'calm' | 'checkup', api }
let ignorePop = false;

// When the app is embedded in a preview, "Match device" hands the theme back
// to whatever the host page set.
const hostTheme = isEmbedded() ? document.documentElement.getAttribute('data-theme') : null;

const app = {
  installPrompt: null,
  render,
  go(id) {
    tab = id;
    sub = null;
    render();
    window.scrollTo(0, 0);
  },
  start(routine) {
    startSession(routine);
    openSession();
  },
  resumeSession() {
    if (state.session) openSession();
  },
  openCalm() {
    openOverlay('calm', host => mountCalm(host, { onExit: closeOverlay }));
  },
  openCheckup(date) {
    openOverlay('checkup', host => mountCheckup(host, { date, onExit: closeOverlay }));
  },
  openScience() {
    openSub('science');
  },
  openDay(key) {
    dayKey = key;
    openSub('day');
  },
  closeSub() {
    sub = null;
    popEntry();
    render();
  },
  applyTheme,
  async install() {
    const prompt = app.installPrompt;
    if (!prompt) return;
    app.installPrompt = null;
    prompt.prompt();
    await prompt.userChoice.catch(() => {});
    render();
  },
};

function openSub(name) {
  if (sub) history.replaceState({ sub: name }, '');
  else history.pushState({ sub: name }, '');
  sub = name;
  render();
  window.scrollTo(0, 0);
}

function render() {
  if (overlay) return;
  const current = TABS.find(t => t.id === tab);
  const content = sub === 'science' ? scienceView(app) : sub === 'day' ? dayView(app, dayKey) : current.view(app);
  root.replaceChildren(
    h('main', { class: 'page', id: 'main' }, content),
    h('nav', { class: 'tabbar', 'aria-label': 'Main' },
      h('div', { class: 'tabbar-inner' },
        TABS.map(t => h('button', {
          class: 'tab', 'aria-current': t.id === tab ? 'page' : null,
          onclick: () => app.go(t.id),
        }, icon(t.icon), h('span', null, t.label))))),
  );
}

function openOverlay(kind, mount) {
  overlay = { kind };
  const host = h('div', { class: 'overlay' });
  root.replaceChildren(host);
  history.pushState({ overlay: kind }, '');
  overlay.api = mount(host);
}

function openSession() {
  openOverlay('session', host => mountSession(host, {
    onExit: () => {
      tab = 'tonight';
      closeOverlay();
    },
  }));
}

function closeOverlay() {
  overlay = null;
  popEntry();
  render();
  window.scrollTo(0, 0);
}

// Drop the history entry we pushed for an overlay or sub-page, so the
// Android back button keeps working as expected afterwards.
function popEntry() {
  if (history.state && (history.state.overlay || history.state.sub)) {
    ignorePop = true;
    history.back();
  }
}

window.addEventListener('popstate', () => {
  if (ignorePop) {
    ignorePop = false;
    return;
  }
  if (overlay?.kind === 'session' && state.session && state.session.phase !== 'summary') {
    history.pushState({ overlay: 'session' }, '');
    overlay.api.askEnd();
    return;
  }
  if (overlay) {
    const { kind, api } = overlay;
    overlay = null;
    api?.destroy();
    if (kind === 'session' && state.session?.phase === 'summary') {
      state.session = null;
      save();
    }
    render();
    return;
  }
  if (sub) {
    sub = null;
    render();
  }
});

function applyTheme() {
  const r = document.documentElement;
  const t = state.settings.theme;
  if (t === 'light') r.setAttribute('data-theme', 'light');
  else if (t === 'system') {
    if (hostTheme) r.setAttribute('data-theme', hostTheme);
    else r.removeAttribute('data-theme');
  } else r.setAttribute('data-theme', 'dark');
  r.setAttribute('data-accent', state.settings.accent || 'dusk');
  r.setAttribute('data-motion', state.settings.motion ? 'on' : 'off');
  const bg = getComputedStyle(r).getPropertyValue('--ink').trim();
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg || '#14162a');
}

matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', applyTheme);

window.addEventListener('beforeinstallprompt', e => {
  e.preventDefault();
  app.installPrompt = e;
  if (tab === 'settings' && !overlay) render();
});

// Offline support. Skipped on localhost during development (add ?sw to test it)
// and inside embedded previews, where service workers are unavailable.
const local = ['localhost', '127.0.0.1'].includes(location.hostname) && !new URLSearchParams(location.search).has('sw');
if ('serviceWorker' in navigator && !isEmbedded() && !local && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

closeStaleSession();
applyTheme();
render();
if (state.session) openSession();
save();
