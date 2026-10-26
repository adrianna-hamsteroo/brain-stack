// Wall-clock step timer. Elapsed time is always derived from timestamps, never
// from counting ticks, so it stays correct when a phone throttles a background
// tab or the app is closed and reopened mid-step. Timers are plain objects so
// the running session can be saved to storage as-is.

export function createTimer(durationMs, now = Date.now()) {
  return { startedAt: now, pausedAt: null, pausedMs: 0, durationMs, extraMs: 0 };
}

export function elapsed(t, now = Date.now()) {
  return (t.pausedAt ?? now) - t.startedAt - t.pausedMs;
}

export function remaining(t, now = Date.now()) {
  return t.durationMs + t.extraMs - elapsed(t, now);
}

export function isPaused(t) {
  return t.pausedAt != null;
}

export function pause(t, now = Date.now()) {
  if (t.pausedAt == null) t.pausedAt = now;
}

export function resume(t, now = Date.now()) {
  if (t.pausedAt != null) {
    t.pausedMs += now - t.pausedAt;
    t.pausedAt = null;
  }
}

export function extend(t, ms) {
  t.extraMs += ms;
}

// Freeze the timer at the exact moment it reached zero, so time spent on the
// "up next" screen is not counted if the person adds five more minutes.
export function stopAtZero(t, now = Date.now()) {
  if (t.pausedAt == null) t.pausedAt = Math.min(now, now + remaining(t, now));
}

// Countdowns round up (a fresh 10-minute step shows 10:00, the last second
// shows 0:01); count-ups round down.
export function clock(ms, countdown = true) {
  const total = Math.max(0, countdown ? Math.ceil(ms / 1000) : Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? h + ':' : ''}${mm}:${String(s).padStart(2, '0')}`;
}

export function minutesLabel(min) {
  min = Math.round(min);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
