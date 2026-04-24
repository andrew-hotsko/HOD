// HOD — deterministic JS workout generator (fallback when API is unavailable)

export const GARAGE = {
  rack: 'Rogue Monster Lite squat rack',
  barbell: { name: 'Barbell', plates: [10, 25, 35, 45] },
  bench: 'Incline/decline bench',
  bike: 'Rogue Assault Bike',
  cable: 'Revolt cable pulley',
  kb: { name: 'Adjustable kettlebell', min: 8, max: 40 },
  db: { name: 'Adjustable dumbbells', min: 2.5, max: 52.5, pair: true },
  pullup: 'Pull-up bar',
  vest: '50 lb weighted vest',
};

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromDate(d) {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

export const MOVES = [
  { name: 'Back Squat',        eq: 'bb',    pattern: 'squat',   unit: 'reps', heavy: true },
  { name: 'Front Squat',       eq: 'bb',    pattern: 'squat',   unit: 'reps', heavy: true },
  { name: 'Deadlift',          eq: 'bb',    pattern: 'hinge',   unit: 'reps', heavy: true },
  { name: 'Power Clean',       eq: 'bb',    pattern: 'oly',     unit: 'reps' },
  { name: 'Push Press',        eq: 'bb',    pattern: 'press',   unit: 'reps' },
  { name: 'Bench Press',       eq: 'bb',    pattern: 'press',   unit: 'reps', heavy: true },
  { name: 'Barbell Row',       eq: 'bb',    pattern: 'pull',    unit: 'reps' },
  { name: 'Thruster',          eq: 'bb',    pattern: 'combo',   unit: 'reps' },
  { name: 'DB Snatch',         eq: 'db',    pattern: 'oly',     unit: 'reps' },
  { name: 'DB Thruster',       eq: 'db',    pattern: 'combo',   unit: 'reps' },
  { name: 'DB Bench Press',    eq: 'db',    pattern: 'press',   unit: 'reps' },
  { name: 'DB Step-Up',        eq: 'db',    pattern: 'lunge',   unit: 'reps' },
  { name: 'Renegade Row',      eq: 'db',    pattern: 'pull',    unit: 'reps' },
  { name: 'KB Swing',          eq: 'kb',    pattern: 'hinge',   unit: 'reps' },
  { name: 'KB Goblet Squat',   eq: 'kb',    pattern: 'squat',   unit: 'reps' },
  { name: 'KB Clean & Press',  eq: 'kb',    pattern: 'combo',   unit: 'reps' },
  { name: 'Turkish Get-Up',    eq: 'kb',    pattern: 'core',    unit: 'reps/side' },
  { name: 'Pull-Up',           eq: 'pu',    pattern: 'pull',    unit: 'reps' },
  { name: 'Chin-Up',           eq: 'pu',    pattern: 'pull',    unit: 'reps' },
  { name: 'Toes-to-Bar',       eq: 'pu',    pattern: 'core',    unit: 'reps' },
  { name: 'Push-Up',           eq: 'bw',    pattern: 'press',   unit: 'reps' },
  { name: 'Burpee',            eq: 'bw',    pattern: 'combo',   unit: 'reps' },
  { name: 'Air Squat',         eq: 'bw',    pattern: 'squat',   unit: 'reps' },
  { name: 'Assault Bike',      eq: 'bike',  pattern: 'cardio',  unit: 'cal' },
  { name: 'Assault Bike',      eq: 'bike',  pattern: 'cardio',  unit: 'm' },
  { name: 'Cable Face Pull',   eq: 'cable', pattern: 'pull',    unit: 'reps' },
  { name: 'Cable Tricep Press',eq: 'cable', pattern: 'press',   unit: 'reps' },

  // ── Core / abs ─────────────────────────────────────
  { name: 'Plank',             eq: 'bw',    pattern: 'core',    unit: 'sec' },
  { name: 'Side Plank',        eq: 'bw',    pattern: 'core',    unit: 'sec/side' },
  { name: 'Hollow Hold',       eq: 'bw',    pattern: 'core',    unit: 'sec' },
  { name: 'Dead Bug',          eq: 'bw',    pattern: 'core',    unit: 'reps/side' },
  { name: 'Bird Dog',          eq: 'bw',    pattern: 'core',    unit: 'reps/side' },
  { name: 'V-Up',              eq: 'bw',    pattern: 'core',    unit: 'reps' },
  { name: 'Mountain Climber',  eq: 'bw',    pattern: 'core',    unit: 'reps' },
  { name: 'Russian Twist',     eq: 'bw',    pattern: 'core',    unit: 'reps' },
  { name: 'Flutter Kick',      eq: 'bw',    pattern: 'core',    unit: 'reps' },
  { name: 'Bicycle Crunch',    eq: 'bw',    pattern: 'core',    unit: 'reps' },
  { name: 'Hanging Knee Raise',eq: 'abs',   pattern: 'core',    unit: 'reps' },
  { name: 'Hanging Leg Raise', eq: 'abs',   pattern: 'core',    unit: 'reps' },
  { name: 'Strap L-Sit',       eq: 'abs',   pattern: 'core',    unit: 'sec' },
  { name: 'Cable Crunch',      eq: 'cable', pattern: 'core',    unit: 'reps' },
  { name: 'Cable Woodchop',    eq: 'cable', pattern: 'core',    unit: 'reps/side' },
];

export const STYLES = {
  CROSSFIT:    { label: 'CrossFit',     formats: ['AMRAP', 'FORTIME', 'EMOM', 'CHIPPER'] },
  HIIT:        { label: 'HIIT',         formats: ['TABATA', 'INTERVALS'] },
  F45:         { label: 'F45',          formats: ['STATIONS'] },
  ORANGETHEORY:{ label: 'OrangeTheory', formats: ['INTERVALS', 'BLOCKS'] },
  SEALFIT:     { label: 'SealFit',      formats: ['CHIPPER', 'EMOM'] },
  STRENGTH:    { label: 'Strength',     formats: ['SETS'] },
  CONDITIONING:{ label: 'Conditioning', formats: ['AMRAP', 'INTERVALS'] },
  CORE:        { label: 'Core',         formats: ['AMRAP', 'TABATA', 'EMOM'] },
};

export const INTENSITIES = [
  { key: 'EASY',   label: 'Easy',   tempoMult: 0.75, loadMult: 0.7 },
  { key: 'STEADY', label: 'Steady', tempoMult: 1.0,  loadMult: 0.85 },
  { key: 'HARD',   label: 'Hard',   tempoMult: 1.15, loadMult: 0.95 },
  { key: 'SAVAGE', label: 'Savage', tempoMult: 1.3,  loadMult: 1.05 },
];

export const DURATIONS = [15, 20, 30, 45, 60];

function pick(rand, arr) {
  return arr[Math.floor(rand() * arr.length)];
}

function pickN(rand, arr, n) {
  const c = [...arr];
  const out = [];
  while (out.length < n && c.length) {
    const i = Math.floor(rand() * c.length);
    out.push(c.splice(i, 1)[0]);
  }
  return out;
}

function suggestLoad(move, intensity, heavy = false) {
  const mult = intensity.loadMult;
  if (move.eq === 'bb') {
    const base = heavy ? 185 : 115;
    return `${Math.round((base * mult) / 5) * 5} lb`;
  }
  if (move.eq === 'db') return `${Math.round((35 * mult) / 2.5) * 2.5} lb each`;
  if (move.eq === 'kb') return `${Math.round((32 * mult) / 4) * 4} lb`;
  if (move.eq === 'bike') return move.unit === 'cal' ? `${Math.round(15 * mult)} cal` : `${Math.round(500 * mult)} m`;
  if (move.eq === 'cable') return `${Math.round((45 * mult) / 5) * 5} lb`;
  return '—';
}

// Map MOVES.eq to storage.equipment keys. 'bw' is always available.
const EQ_MAP = {
  bb: 'barbell', db: 'db', kb: 'kb', bike: 'bike',
  cable: 'cable', pu: 'pullup', abs: 'abstraps', bw: null,
};

function filterByEquipment(moves, equipment) {
  if (!equipment) return moves;
  return moves.filter(m => {
    const req = EQ_MAP[m.eq];
    if (req == null) return true; // bodyweight
    return equipment[req];
  });
}

// Smart fallback warmup — introspects today's main block and picks activation
// items for the patterns in it. Used only when the AI path didn't return a
// warmup (either fallback generation or a stale cached workout).
export function buildSmartWarmup(mainItems, equipment) {
  const names = (mainItems || []).map((i) => String(i?.name || '').toLowerCase());
  const any = (re) => names.some((n) => re.test(n));
  const hasSquat = any(/squat|thruster|lunge|step.?up|wall.?ball/);
  const hasHinge = any(/deadlift|swing|clean|snatch|get.?up|good.?morning/);
  const hasPull  = any(/pull|row|chin|face/);
  const hasPress = any(/press|push|thruster|jerk|dip/);
  const hasCore  = any(/plank|hollow|crunch|raise|twist|sit|bicycle|flutter|bird|dead.?bug|v-up/);
  const eq = equipment || {};

  const items = [];
  items.push(eq.bike ? 'Assault Bike — 2 min easy' : 'Jumping Jacks — 60 sec');
  items.push("World's Greatest Stretch ×6/side");
  if (hasSquat) items.push('Bodyweight Squats ×15');
  if (hasHinge) items.push('Good Mornings ×10');
  if (hasPull)  items.push(eq.pullup ? 'Scap Pull-ups ×10' : 'Band Pull-aparts ×15');
  if (hasPress) items.push('Push-ups ×10');
  if (hasCore)  items.push('Hollow Hold — 20 sec');
  if (items.length < 5) {
    if (eq.barbell) items.push('Empty Bar Warmup ×2 sets');
    else if (eq.db) items.push('Light DB Complex ×10');
    else items.push('Push-up + Reach ×10');
  }
  return items.slice(0, 6);
}

export function generateHOD({ date = new Date(), intensity = 'HARD', style = 'CROSSFIT', duration = 30, equipment = null } = {}) {
  const rand = mulberry32(seedFromDate(date) + intensity.length + style.length + duration);
  const intense = INTENSITIES.find(i => i.key === intensity);
  const styleDef = STYLES[style];
  const format = pick(rand, styleDef.formats);
  const allMoves = filterByEquipment(MOVES, equipment);

  // Warmup built after main is picked so it can reflect today's movements.
  let warmup = {
    label: 'WARMUP',
    duration: 5,
    note: 'Prime for today',
  };

  let main;

  // ── CORE STYLE (dedicated branch — only core-pattern moves) ─────
  if (style === 'CORE') {
    const corePool = allMoves.filter((m) => m.pattern === 'core');
    const pool = corePool.length >= 3 ? corePool : allMoves;
    const chosenFormat = format; // already picked from styleDef.formats (AMRAP/TABATA/EMOM)

    if (chosenFormat === 'AMRAP') {
      const mins = Math.max(8, duration - 8);
      const moves = pickN(rand, pool, 4);
      main = {
        label: 'CORE AMRAP',
        headline: `${mins} MIN CORE AMRAP`,
        format: 'AMRAP', minutes: mins, rounds: null,
        description: 'As many rounds as possible — strict form over speed',
        items: moves.map((m) => ({
          name: m.name,
          reps: m.unit === 'sec' ? pick(rand, [20, 30, 45]) : pick(rand, [10, 12, 15, 20]),
          unit: m.unit || 'reps',
          load: '—',
        })),
      };
    } else if (chosenFormat === 'TABATA') {
      const moves = pickN(rand, pool, 4);
      main = {
        label: 'CORE TABATA',
        headline: 'CORE TABATA ×4',
        format: 'TABATA', minutes: 16,
        description: '20s work / 10s rest × 8 rounds per movement',
        items: moves.map((m) => ({ name: m.name, unit: '20s', load: '—' })),
      };
    } else if (chosenFormat === 'EMOM') {
      const mins = Math.max(6, duration - 8);
      const moves = pickN(rand, pool, 3);
      main = {
        label: 'CORE EMOM',
        headline: `${mins} MIN CORE EMOM`,
        format: 'EMOM', minutes: mins,
        description: 'Every minute — rotate movements, rest in remaining time',
        items: moves.map((m) => ({
          name: m.name,
          reps: m.unit === 'sec' ? pick(rand, [20, 30, 40]) : pick(rand, [10, 12, 15]),
          unit: m.unit || 'reps',
          load: '—',
        })),
      };
    }
  } else if (format === 'AMRAP') {
    const mins = duration - 8;
    const moves = pickN(rand, allMoves.filter(m =>['squat','pull','press','combo','hinge'].includes(m.pattern)), 3);
    main = {
      label: 'AMRAP',
      headline: `${mins} MIN AMRAP`,
      format: 'AMRAP',
      minutes: mins,
      rounds: null,
      description: 'As many rounds + reps as possible',
      items: moves.map(m => ({
        name: m.name,
        reps: pick(rand, [8, 10, 12, 15]),
        unit: m.unit,
        load: suggestLoad(m, intense),
      })),
    };
  } else if (format === 'FORTIME') {
    const moves = pickN(rand, allMoves.filter(m =>m.pattern !== 'cardio'), 3);
    main = {
      label: 'FOR TIME',
      headline: '21–15–9 FOR TIME',
      format: 'FORTIME',
      minutes: duration - 8,
      description: 'Complete all reps as fast as possible',
      items: moves.map(m => ({
        name: m.name,
        unit: m.unit,
        schemeReps: [21, 15, 9],
        load: suggestLoad(m, intense),
      })),
    };
  } else if (format === 'EMOM') {
    const mins = duration - 8;
    const moves = pickN(rand, allMoves.filter(m =>m.pattern !== 'cardio'), 3);
    main = {
      label: 'EMOM',
      headline: `${mins} MIN EMOM`,
      format: 'EMOM',
      minutes: mins,
      description: 'Every minute on the minute — rotate through',
      items: moves.map(m => ({
        name: m.name,
        reps: pick(rand, [8, 10, 12]),
        unit: m.unit,
        load: suggestLoad(m, intense),
      })),
    };
  } else if (format === 'TABATA') {
    const moves = pickN(rand, allMoves.filter(m =>['combo','cardio','squat','press'].includes(m.pattern)), 4);
    main = {
      label: 'TABATA',
      headline: 'TABATA ×4',
      format: 'TABATA',
      minutes: 16,
      description: '20s work / 10s rest × 8 rounds per move',
      items: moves.map(m => ({ name: m.name, unit: '20s', load: suggestLoad(m, intense) })),
    };
  } else if (format === 'STATIONS') {
    const moves = pickN(rand, allMoves, 6);
    main = {
      label: 'STATIONS',
      headline: '6 STATIONS',
      format: 'STATIONS',
      minutes: duration - 8,
      description: '45s work / 15s transition — 3 rounds',
      items: moves.map(m => ({ name: m.name, unit: '45s', load: suggestLoad(m, intense) })),
    };
  } else if (format === 'INTERVALS' || format === 'BLOCKS') {
    const moves = pickN(rand, allMoves.filter(m =>m.pattern === 'cardio' || m.pattern === 'combo' || m.pattern === 'squat'), 3);
    main = {
      label: format,
      headline: format === 'BLOCKS' ? '3 BLOCKS' : '5 × 3 MIN',
      format,
      minutes: duration - 8,
      description: format === 'BLOCKS' ? 'Power / Endurance / All-out' : '3 min hard / 1 min rest',
      items: moves.map(m => ({ name: m.name, unit: m.unit, load: suggestLoad(m, intense) })),
    };
  } else if (format === 'CHIPPER') {
    const moves = pickN(rand, allMoves.filter(m =>m.pattern !== 'cardio'), 5);
    main = {
      label: 'CHIPPER',
      headline: 'CHIPPER',
      format: 'CHIPPER',
      minutes: duration - 8,
      description: 'Chip through — one movement at a time, no repeats',
      items: moves.map((m, i) => ({
        name: m.name,
        reps: [100, 80, 60, 40, 20][i],
        unit: m.unit,
        load: suggestLoad(m, intense),
      })),
    };
  } else if (format === 'SETS') {
    const lift = pick(rand, allMoves.filter(m =>m.heavy));
    const accessory = pickN(rand, allMoves.filter(m =>!m.heavy && m.pattern !== 'cardio'), 2);
    main = {
      label: 'STRENGTH',
      headline: lift.name.toUpperCase(),
      format: 'SETS',
      minutes: duration - 8,
      description: `5 × 5 @ ${Math.round(intense.loadMult * 100)}%`,
      items: [
        { name: lift.name, unit: 'reps', schemeReps: [5, 5, 5, 5, 5], load: suggestLoad(lift, intense, true) },
        ...accessory.map(m => ({ name: m.name, reps: pick(rand, [10, 12]), unit: m.unit, load: suggestLoad(m, intense), accessory: true })),
      ],
    };
  }

  const finisher = rand() > 0.5 ? {
    label: 'FINISHER',
    duration: 3,
    note: pick(rand, [
      '3 min Assault Bike — max cal',
      '50 burpees for time',
      '2 min plank accumulation',
      'Death by push-ups — 5 min cap',
    ]),
  } : null;

  // Attach a tailored warmup now that we know the main movements
  warmup = { ...warmup, items: buildSmartWarmup(main.items, equipment) };

  return {
    date,
    intensity: intense,
    style: { key: style, ...styleDef },
    format,
    duration,
    warmup,
    main,
    finisher,
  };
}
