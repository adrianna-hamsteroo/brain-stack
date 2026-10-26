// Everything lives in one localStorage record on this device. Export/import
// in Settings is how you back it up or move it between desktop and phone.
import { recommendedRoutines, TEMPLATES } from './data.js';

const KEY = 'brainstack';
const SCHEMA = 1;

export const DEFAULT_SETTINGS = {
  sound: true,
  volume: 0.6,
  vibrate: true,
  warn: true,          // soft chime before a timed step ends
  breathCues: true,    // soft tones on each breath phase
  autoAdvance: false,  // start the next step after a one-minute breather
  wakeLock: true,      // keep the screen on during a session
  checkin: true,       // ask "how busy is your mind?" before and after
  weeklyGoal: 5,       // evenings per week; the rest are planned rest nights
  theme: 'evening',    // 'evening' (always dark) | 'system' | 'light'
  reminder: '21:00',
  routine: 'standard', // last chosen routine on the Tonight screen
};

export const state = load();

function load() {
  let raw = null;
  try { raw = JSON.parse(localStorage.getItem(KEY)); } catch { /* storage blocked or corrupt */ }
  return normalize(raw);
}

export function normalize(raw) {
  const fresh = { schema: SCHEMA, settings: { ...DEFAULT_SETTINGS }, routines: recommendedRoutines(), history: [], session: null };
  if (!raw || typeof raw !== 'object') return fresh;
  return {
    schema: SCHEMA,
    settings: { ...DEFAULT_SETTINGS, ...(raw.settings || {}) },
    routines: validRoutines(raw.routines) || fresh.routines,
    history: Array.isArray(raw.history) ? raw.history.filter(h => h && h.date) : [],
    session: raw.session && Array.isArray(raw.session.steps) ? raw.session : null,
  };
}

function validRoutines(list) {
  if (!Array.isArray(list) || !list.length) return null;
  const ok = list.every(r => r && r.id && Array.isArray(r.steps) &&
    r.steps.every(s => s && s.name && ['timed', 'open', 'breath'].includes(s.mode) && s.minutes > 0));
  return ok ? list : null;
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
  return state.routines.find(r => r.id === id) || state.routines[0];
}

export function resetRoutine(id) {
  const fresh = recommendedRoutines().find(r => r.id === id);
  const i = state.routines.findIndex(r => r.id === id);
  if (fresh && i >= 0) state.routines[i] = fresh;
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
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function dateFromKey(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}
