'use client';

// localStorage-backed persistence for HOD.
// Everything is JSON-encoded under a stable key. Silent failures on SSR
// (typeof localStorage === 'undefined') and JSON parse errors.

const K = {
  history:    'hod.history',     // string[] — completion dates (YYYY-MM-DD), workouts + rest days
  workouts:   'hod.workouts',    // { [date]: WorkoutRecord }
  equipment:  'hod.equipment',   // { [key]: boolean }
  onboarded:  'hod.onboarded',   // '1' when user finished onboarding
  cache:      'hod.cache',       // { [cacheKey]: workout }
  prs:        'hod.prs',         // { [liftName]: { load, date, reps } }
  profile:    'hod.profile',     // { name, role, notes }
  family:     'hod.family',      // short family code (e.g. "HOTSKO")
  restDays:   'hod.restDays',    // string[] — intentional rest dates (YYYY-MM-DD)
  cues:       'hod.cues',        // { [movementName]: { cue, fetchedAt } }
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
  // Local-date ISO (YYYY-MM-DD). toISOString() would return UTC and
  // silently misfile late-evening workouts under tomorrow's key for
  // users west of UTC.
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
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

// ── Rest days (intentional, streak-preserving) ───────────
export function loadRestDays() {
  const v = safeGet(K.restDays, []);
  return Array.isArray(v) ? v : [];
}

export function addRestDay(iso = todayISO()) {
  const rest = loadRestDays();
  if (!rest.includes(iso)) {
    rest.push(iso);
    safeSet(K.restDays, rest);
  }
  // Rest day also joins history so streaks are preserved
  addHistoryDate(iso);
  return rest;
}

export function removeRestDay(iso = todayISO()) {
  const rest = loadRestDays().filter((d) => d !== iso);
  safeSet(K.restDays, rest);
  // Pull from history too if no workout recorded on this day
  if (!loadWorkoutRecord(iso)) {
    const hist = loadHistoryDates().filter((d) => d !== iso);
    safeSet(K.history, hist);
  }
  return rest;
}

// ── Workout records (full detail per completed workout) ───
export function saveWorkoutRecord(record) {
  if (!record?.date) return;
  // Trust YYYY-MM-DD strings. Re-parsing via `new Date(...)` on a
  // date-only ISO reads it as UTC midnight and shifts back a day locally.
  const iso = String(record.date).slice(0, 10);
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

// Returns compact per-workout summaries for the last N days, most recent
// first. Skips days with no workout. Shape is tuned for passing into the
// Claude prompt — small fields, no heavy nesting.
export function loadRecentWorkoutSummaries(days = 7) {
  const all = loadAllWorkoutRecords();
  const out = [];
  const today = new Date();
  for (let i = 1; i <= days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = todayISO(d);
    const rec = all[iso];
    if (!rec) continue;
    out.push({
      daysAgo: i,
      headline: rec.workout?.main?.headline ?? '',
      style: rec.workout?.style?.label ?? rec.params?.style ?? '',
      format: rec.workout?.main?.format ?? '',
      intensity: rec.workout?.intensity?.label ?? rec.params?.intensity ?? '',
      duration: rec.params?.duration ?? rec.workout?.duration ?? 0,
      rating: rec.rating ?? null,
      movements: (rec.workout?.main?.items ?? []).map((it) => it.name).filter(Boolean).slice(0, 6),
    });
  }
  return out;
}

export function updateWorkoutRating(iso, rating) {
  const all = safeGet(K.workouts, {});
  if (!all[iso]) return;
  all[iso] = { ...all[iso], rating };
  safeSet(K.workouts, all);
}

export function updateWorkoutNotes(iso, notes) {
  const all = safeGet(K.workouts, {});
  if (!all[iso]) return;
  all[iso] = { ...all[iso], notes: String(notes || '').slice(0, 500) };
  safeSet(K.workouts, all);
}

// Computed roll-up for the last 7 days (most recent = day 0).
export function weeklyStats() {
  const records = loadAllWorkoutRecords();
  const rests = loadRestDays();
  const restSet = new Set(rests);
  const today = new Date();
  let workouts = 0;
  let restCount = 0;
  let totalElapsed = 0;
  const ratings = { easy: 0, solid: 0, brutal: 0 };
  const formats = {};
  let newestPRDate = null;
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso = todayISO(d);
    const rec = records[iso];
    if (rec) {
      workouts++;
      totalElapsed += rec.stats?.elapsed || 0;
      if (rec.rating && ratings[rec.rating] != null) ratings[rec.rating]++;
      const fmt = rec.workout?.main?.format || 'OTHER';
      formats[fmt] = (formats[fmt] || 0) + 1;
    } else if (restSet.has(iso)) {
      restCount++;
    }
  }
  // PRs set in the last 7 days
  const prs = Object.values(loadPRs()).filter((p) => {
    if (!p?.date) return false;
    const [y, m, day] = p.date.split('-').map(Number);
    const prDate = new Date(y, m - 1, day);
    const diffDays = Math.floor((today - prDate) / 86400000);
    return diffDays >= 0 && diffDays < 7;
  }).length;
  // Dominant rating
  const sorted = Object.entries(ratings).sort((a, b) => b[1] - a[1]);
  const mostlyRating = sorted[0]?.[1] > 0 ? sorted[0][0] : null;
  // Dominant format
  const sortedFmt = Object.entries(formats).sort((a, b) => b[1] - a[1]);
  const topFormat = sortedFmt[0]?.[0] || null;
  return { workouts, restCount, totalElapsed, mostlyRating, topFormat, prs, newestPRDate };
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
  abstraps: true,
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

// ── Load history + weight progression ───────────────────
// Scans saved workout records for every appearance of `liftName` and returns
// { date, load, rating } entries most-recent-first. Loads are parsed out of
// strings like "185 lb" or "35 lb each".
export function getLoadHistory(liftName) {
  if (!liftName) return [];
  const records = loadAllWorkoutRecords();
  const out = [];
  Object.values(records).forEach((r) => {
    const items = r.workout?.main?.items || [];
    items.forEach((item) => {
      if (item.name !== liftName) return;
      const m = String(item.load || '').match(/(\d+)/);
      if (!m) return;
      out.push({ date: r.date, load: Number(m[1]), rating: r.rating || null });
    });
  });
  out.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  return out;
}

// Decides whether to nudge the AI's suggested load up or down based on
// recent ratings of this lift. Returns a delta in lb or null when there
// isn't enough signal to act.
//
// Rules:
//   · 2+ consecutive EASY at or above the top load → +10 lb
//   · 2+ consecutive SOLID/EASY at or above the top load → +5 lb
//   · most recent was BRUTAL → -5 lb
//   · otherwise → no change
export function suggestProgression(liftName) {
  const history = getLoadHistory(liftName);
  if (history.length < 2) return null;
  const recent = history.slice(0, 3);
  const topLoad = Math.max(...recent.map((h) => h.load));
  const latest = recent[0];

  if (latest.rating === 'brutal') {
    return { deltaLb: -5, reason: 'EASE UP' };
  }

  const soft = recent.every((h) => h.rating === 'easy');
  const solid = recent.every((h) => h.rating === 'solid' || h.rating === 'easy');
  const atOrAbove = recent.every((h) => h.load >= topLoad);

  if (soft && atOrAbove && recent.length >= 2) {
    return { deltaLb: 10, reason: 'STEP UP' };
  }
  if (solid && atOrAbove && recent.length >= 2) {
    return { deltaLb: 5, reason: 'STEP UP' };
  }
  return null;
}

// Applies suggestProgression to each item in a workout, rewriting the load
// string and tagging items with a `progression` field when an adjustment was
// made. Used by page.jsx right after the API responds.
export function applyProgressionToItems(items) {
  if (!Array.isArray(items)) return items;
  return items.map((item) => {
    if (!item?.load || item.load === '—') return item;
    const m = String(item.load).match(/^(\d+)\s*(\S+)?(.*)$/);
    if (!m) return item;
    const prog = suggestProgression(item.name);
    if (!prog) return item;
    const current = Number(m[1]);
    const next = Math.max(0, current + prog.deltaLb);
    if (next === current) return item;
    const unit = m[2] || 'lb';
    const suffix = m[3] || '';
    return {
      ...item,
      load: `${next} ${unit}${suffix}`,
      progression: { deltaLb: prog.deltaLb, reason: prog.reason, prevLoad: current },
    };
  });
}

// ── Profile (who's using this phone) ─────────────────────
export const DEFAULT_PROFILE = {
  name: '',
  role: 'adult',   // 'adult' | 'teen' | 'kid' | 'postpartum'
  notes: '',
};

export const ROLE_DEFS = {
  adult: {
    label: 'Adult',
    hint: 'Full intensity, all equipment, no scaling',
  },
  teen: {
    label: 'Teen',
    hint: '13–17 · lighter loads, form-first, no max-effort singles',
  },
  kid: {
    label: 'Kid',
    hint: '8–12 · bodyweight-biased, playful language, short sets',
  },
  postpartum: {
    label: 'Postpartum',
    hint: 'No high-impact, core rebuilding, pelvic-floor safe',
  },
};

export function loadProfile() {
  const saved = safeGet(K.profile, null);
  if (!saved || typeof saved !== 'object') return { ...DEFAULT_PROFILE };
  return { ...DEFAULT_PROFILE, ...saved };
}

export function saveProfile(profile) {
  safeSet(K.profile, profile);
}

// ── Family code (shared feed + WOD) ──────────────────────
// Stored uppercase, letters only, 3–10 chars. Empty string means no family
// link — feed/WOD are hidden.
export function normalizeFamilyCode(raw) {
  return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

export function loadFamilyCode() {
  if (typeof localStorage === 'undefined') return '';
  return normalizeFamilyCode(localStorage.getItem(K.family) || '');
}

export function saveFamilyCode(code) {
  const clean = normalizeFamilyCode(code);
  if (typeof localStorage === 'undefined') return clean;
  if (clean) localStorage.setItem(K.family, clean);
  else localStorage.removeItem(K.family);
  return clean;
}

// ── Movement form cues (AI-generated, cached) ────────────
export function loadCue(name) {
  if (!name) return null;
  const all = safeGet(K.cues, {});
  return all[name] || null;
}

export function saveCue(name, cue) {
  if (!name || !cue) return;
  const all = safeGet(K.cues, {});
  all[name] = { cue: String(cue).slice(0, 600), fetchedAt: Date.now() };
  safeSet(K.cues, all);
}

// ── PR tracker (heavy lifts) ─────────────────────────────
export function loadPRs() {
  return safeGet(K.prs, {});
}

export function loadPR(liftName) {
  return loadPRs()[liftName] || null;
}

export function savePR(liftName, entry) {
  const all = loadPRs();
  all[liftName] = { ...entry, date: entry.date || todayISO() };
  safeSet(K.prs, all);
  return all[liftName];
}

// ── 14-day history strip helper ──────────────────────────
export function buildHistory14(dates, restDays = []) {
  const today = new Date();
  const restSet = new Set(restDays);
  return Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    const iso = todayISO(d);
    const done = dates.includes(iso);
    const isRest = restSet.has(iso);
    return {
      iso,
      date: d,
      done,
      isRest: isRest && !loadWorkoutRecord(iso), // rest-only if no workout record
      isToday: i === 13,
    };
  });
}
