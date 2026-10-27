// Everything lives in one localStorage record on this device. Export/import
// in Settings is how you back it up or move it between desktop and phone.
import { recommendedRoutines, TEMPLATES, CHECKUP, makeId } from './data.js';

const KEY = 'brainstack';
const SCHEMA = 2;

export const DEFAULT_SETTINGS = {
  sound: true,
  chime: 'chimes',     // 'chimes' | 'musicbox' | 'bowl'
  volume: 0.6,
  vibrate: true,
  warn: true,          // soft chime before a timed step ends
  breathCues: true,    // soft tones on each breath phase
  autoAdvance: false,  // start the next step after a one-minute breather
  wakeLock: true,      // keep the screen on during a session
  checkin: true,       // ask "how busy is your mind?" before and after
  checkup: true,       // daily check-up questions after the stack
  checkupQs: CHECKUP.filter(q => q.on).map(q => q.id),
  weeklyGoal: 5,       // evenings per week; the rest are planned rest nights
  theme: 'evening',    // 'evening' (always dark) | 'system' | 'light'
  accent: 'dusk',      // color theme, see THEMES
  motion: true,        // slowly drifting background
  name: '',            // shown in the greeting on Tonight
  reminder: '21:00',
  routine: 'standard', // last stack picked by hand
  pick: null,          // { date, id }: tonight's hand-picked stack
};

export const NO_SCHEDULE = { type: 'none', days: [], from: '', to: '' };

export const state = load();

function load() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY)); } catch { /* storage blocked or corrupt */ }
  return normalize(raw);
}

export function normalize(raw) {
  const fresh = {
    schema: SCHEMA, settings: { ...DEFAULT_SETTINGS }, routines: recommendedRoutines().map(upgradeRoutine),
    history: [], session: null, extras: [], extraTypes: [], checkups: {},
  };
  if (!raw || typeof raw !== 'object') return fresh;
  return {
    schema: SCHEMA,
    settings: { ...DEFAULT_SETTINGS, ...(raw.settings || {}) },
    routines: (validRoutines(raw.routines) || fresh.routines).map(upgradeRoutine),
    history: Array.isArray(raw.history) ? raw.history.filter(h => h && h.date) : [],
    session: raw.session && Array.isArray(raw.session.steps) ? raw.session : null,
    extras: Array.isArray(raw.extras) ? raw.extras.filter(x => x && x.date && x.name) : [],
    extraTypes: Array.isArray(raw.extraTypes) ? raw.extraTypes.filter(t => t && t.type && t.name) : [],
    checkups: raw.checkups && typeof raw.checkups === 'object' ? raw.checkups : {},
  };
}

function validRoutines(list) {
  if (!Array.isArray(list) || !list.length) return null;
  const ok = list.every(r => r && r.id && Array.isArray(r.steps) &&
    r.steps.every(s => s && s.name && ['timed', 'open', 'breath'].includes(s.mode) && s.minutes > 0));
  return ok ? list : null;
}

// Version 1 saved only the three recommended stacks, without these fields.
function upgradeRoutine(r) {
  return {
    ...r,
    preset: r.preset ?? ['full', 'standard', 'mini'].includes(r.id),
    label: r.label || r.name,
    schedule: { ...NO_SCHEDULE, ...(r.schedule || {}) },
  };
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: keep going in memory */ }
}

export function replaceState(next) {
  const clean = normalize(next);
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, clean);
  save();
}

export function routineById(id) {
  return state.routines.find(r => r.id === id) || state.routines.find(r => r.id === 'standard') || state.routines[0];
}

export function resetRoutine(id) {
  const fresh = recommendedRoutines().find(r => r.id === id);
  const i = state.routines.findIndex(r => r.id === id);
  if (fresh && i >= 0) state.routines[i] = upgradeRoutine({ ...fresh, schedule: state.routines[i].schedule });
  save();
}

export function createRoutine(name, fromId) {
  const source = fromId && state.routines.find(r => r.id === fromId);
  const routine = {
    id: makeId('r'), name, label: name, preset: false,
    blurb: 'Your own stack.',
    steps: source ? source.steps.map(s => ({ ...s, id: makeId() })) : [],
    schedule: { ...NO_SCHEDULE },
  };
  state.routines.push(routine);
  save();
  return routine;
}

export function deleteRoutine(id) {
  state.routines = state.routines.filter(r => r.id !== id || r.preset);
  if (state.settings.routine === id) state.settings.routine = 'standard';
  if (state.settings.pick?.id === id) state.settings.pick = null;
  save();
}

// Open-ended steps count at their nudge time when estimating the total.
export function routineMinutes(routine) {
  return routine.steps.reduce((sum, s) => sum + Number(s.minutes || 0), 0);
}

export function hueOf(step) {
  return step.hue || TEMPLATES[step.type]?.hue || 'custom';
}

// Sessions that start before 4am count for the previous evening.
export function eveningKey(ts) {
  const d = new Date(ts - 4 * 3600e3);
  return keyOf(d);
}

export function keyOf(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dateFromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

// Monday = 0 … Sunday = 6, matching how the week is shown.
export function weekdayOf(key) {
  return (dateFromKey(key).getDay() + 6) % 7;
}

// The stack planned for an evening: a date plan beats a weekly plan, and the
// shortest date range wins when plans overlap.
export function plannedRoutine(key) {
  const dated = state.routines
    .filter(r => r.schedule.type === 'dates' && r.schedule.from && r.schedule.to && r.schedule.from <= key && key <= r.schedule.to)
    .sort((a, b) => (dateFromKey(a.schedule.to) - dateFromKey(a.schedule.from)) - (dateFromKey(b.schedule.to) - dateFromKey(b.schedule.from)));
  if (dated.length) return dated[0];
  const day = weekdayOf(key);
  return state.routines.find(r => r.schedule.type === 'weekly' && r.schedule.days.includes(day)) || null;
}

// Tonight's stack: a hand-picked one for tonight, else the planned one, else
// the last stack picked by hand.
export function tonightRoutine(now = Date.now()) {
  const key = eveningKey(now);
  const pick = state.settings.pick;
  if (pick?.date === key && state.routines.some(r => r.id === pick.id)) return routineById(pick.id);
  return plannedRoutine(key) || routineById(state.settings.routine);
}

export function pickRoutine(id, now = Date.now()) {
  state.settings.pick = { date: eveningKey(now), id };
  state.settings.routine = id;
  save();
}

// ---- Extra activities and daily check-ups ----------------------------------

export function extrasOn(key) {
  return state.extras.filter(x => x.date === key).sort((a, b) => a.at - b.at);
}

export function addExtra(key, type) {
  const entry = { id: makeId('x'), date: key, type: type.type, name: type.name, icon: type.icon, at: Date.now() };
  state.extras.push(entry);
  save();
  return entry;
}

export function removeExtra(id) {
  state.extras = state.extras.filter(x => x.id !== id);
  save();
}

export function addExtraType(name, icon) {
  const type = { type: makeId('t'), name, icon };
  state.extraTypes.push(type);
  save();
  return type;
}

export function saveCheckup(key, answers) {
  if (!answers || !Object.keys(answers).length) return;
  state.checkups[key] = { ...(state.checkups[key] || {}), ...answers, at: Date.now() };
  save();
}
