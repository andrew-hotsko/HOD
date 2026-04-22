'use client';

// localStorage-backed persistence for HOD.
// Everything is JSON-encoded under a stable key. Silent failures on SSR
// (typeof localStorage === 'undefined') and JSON parse errors.

const K = {
  history:    'hod.history',     // string[] — completion dates (YYYY-MM-DD)
  workouts:   'hod.workouts',    // { [date]: WorkoutRecord }
  equipment:  'hod.equipment',   // { [key]: boolean }
  onboarded:  'hod.onboarded',   // '1' when user finished onboarding
  cache:      'hod.cache',       // { [cacheKey]: workout }
};

function safeGet(key, fallback) {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function safeSet(key, value) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Quota / private mode — silently drop
  }
}

export function todayISO(d = new Date()) {
  return d.toISOString().split('T')[0];
}

// ── History (completion dates) ────────────────────────────
export function loadHistoryDates() {
  const v = safeGet(K.history, []);
  return Array.isArray(v) ? v : [];
}

export function addHistoryDate(iso = todayISO()) {
  const dates = loadHistoryDates();
  if (!dates.includes(iso)) {
    dates.push(iso);
    safeSet(K.history, dates);
  }
  return dates;
}

// ── Workout records (full detail per completed workout) ───
export function saveWorkoutRecord(record) {
  if (!record?.date) return;
  const iso = todayISO(new Date(record.date));
  const all = safeGet(K.workouts, {});
  all[iso] = { ...record, date: iso };
  safeSet(K.workouts, all);
}

export function loadWorkoutRecord(iso) {
  const all = safeGet(K.workouts, {});
  return all[iso] || null;
}

export function loadAllWorkoutRecords() {
  return safeGet(K.workouts, {});
}

export function updateWorkoutRating(iso, rating) {
  const all = safeGet(K.workouts, {});
  if (!all[iso]) return;
  all[iso] = { ...all[iso], rating };
  safeSet(K.workouts, all);
}

// ── Equipment setup ──────────────────────────────────────
export const DEFAULT_EQUIPMENT = {
  barbell: true,
  rack: true,
  bench: true,
  bike: true,
  cable: true,
  kb: true,
  db: true,
  pullup: true,
  vest: true,
};

export function loadEquipment() {
  const saved = safeGet(K.equipment, null);
  if (!saved || typeof saved !== 'object') return { ...DEFAULT_EQUIPMENT };
  return { ...DEFAULT_EQUIPMENT, ...saved };
}

export function saveEquipment(eq) {
  safeSet(K.equipment, eq);
}

// ── Onboarding ───────────────────────────────────────────
export function isOnboarded() {
  if (typeof localStorage === 'undefined') return true;
  return localStorage.getItem(K.onboarded) === '1';
}

export function setOnboarded(done = true) {
  if (typeof localStorage === 'undefined') return;
  if (done) localStorage.setItem(K.onboarded, '1');
  else localStorage.removeItem(K.onboarded);
}

// ── Today's-workout cache (avoid re-hitting API for same params) ──
function cacheKey(params) {
  return `${todayISO()}:${params.intensity}:${params.style}:${params.duration}`;
}

export function getCachedWorkout(params) {
  const all = safeGet(K.cache, {});
  // Drop any stale entries (not from today) on read
  const today = todayISO();
  let dirty = false;
  for (const k of Object.keys(all)) {
    if (!k.startsWith(today + ':')) {
      delete all[k];
      dirty = true;
    }
  }
  if (dirty) safeSet(K.cache, all);
  return all[cacheKey(params)] || null;
}

export function setCachedWorkout(params, workout) {
  const all = safeGet(K.cache, {});
  all[cacheKey(params)] = workout;
  safeSet(K.cache, all);
}

// ── 14-day history strip helper ──────────────────────────
export function buildHistory14(dates) {
  const today = new Date();
  return Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    const iso = todayISO(d);
    return {
      iso,
      date: d,
      done: dates.includes(iso),
      isToday: i === 13,
    };
  });
}
