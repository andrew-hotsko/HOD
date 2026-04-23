import Anthropic from '@anthropic-ai/sdk';
import { INTENSITIES, STYLES, generateHOD } from '@/lib/generator';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are HOD (Hotsko of the Day) — a workout generator for a private garage gym.

AVAILABLE EQUIPMENT:
- Rogue Monster Lite squat rack
- Barbell with plate pairs: 10, 25, 35, 45 lb per side
- Incline/decline bench
- Rogue Assault Bike
- Revolt cable pulley
- Adjustable kettlebell: 8–40 lb
- Adjustable dumbbells: 2.5–52.5 lb pairs
- Pull-up bar
- 50 lb weighted vest

Generate a single workout as a JSON object with this exact structure:
{
  "main": {
    "label": string,
    "headline": string,
    "format": string,
    "minutes": number,
    "description": string,
    "items": [
      {
        "name": string,
        "unit": string,
        "reps": number,
        "schemeReps": number[],
        "load": string,
        "accessory": boolean
      }
    ]
  },
  "finisher": {
    "label": "FINISHER",
    "duration": 3,
    "note": string
  } | null
}

RULES:
- Only include fields relevant to each item (omit reps if using schemeReps, etc.)
- For AMRAP/EMOM: items have "reps" (number) + "unit"
- For FORTIME/CHIPPER: items have "schemeReps" ([21,15,9] or per-move reps) + "unit"
- For TABATA/STATIONS: items have "unit" = "20s" or "45s" (no reps)
- For SETS: first item has schemeReps:[5,5,5,5,5], accessories have reps
- Loads: realistic for an intermediate-to-advanced male athlete at given intensity
- Include a finisher ~50% of the time (null otherwise)
- Respond ONLY with the raw JSON — no markdown, no explanation`;

const EQUIPMENT_LABELS = {
  rack:    'Rogue Monster Lite squat rack',
  barbell: 'Barbell with plate pairs: 10, 25, 35, 45 lb per side',
  bench:   'Incline/decline bench',
  bike:    'Rogue Assault Bike',
  cable:   'Revolt cable pulley',
  kb:      'Adjustable kettlebell: 8–40 lb',
  db:      'Adjustable dumbbells: 2.5–52.5 lb pairs',
  pullup:  'Pull-up bar',
  vest:    '50 lb weighted vest',
};

function buildEquipmentList(eq) {
  if (!eq) return Object.values(EQUIPMENT_LABELS).map(l => `- ${l}`).join('\n');
  const kept = Object.entries(EQUIPMENT_LABELS)
    .filter(([k]) => eq[k])
    .map(([, l]) => `- ${l}`);
  if (kept.length === 0) return '- Bodyweight only';
  return kept.join('\n');
}

const ROLE_RULES = {
  adult: null, // no additional rules
  teen:
    `ATHLETE ROLE: teen (13–17).\n` +
    `- Keep loads conservative (roughly 60–75% of an adult athlete at the same intensity level)\n` +
    `- Rep ranges 5+; no max-effort singles, no 1RM attempts\n` +
    `- Barbell OK, but prioritize form-first compounds (no heavy Olympic singles)\n` +
    `- Cap intensity at HARD even if the user selected SAVAGE`,
  kid:
    `ATHLETE ROLE: kid (8–12).\n` +
    `- BODYWEIGHT and light-kettlebell only. NO barbell, NO heavy dumbbell, NO overhead loading, NO spinal loading under load.\n` +
    `- Keep movements fun, varied, and short. Prefer 3–4 movements.\n` +
    `- Use playful language in headline and description (e.g., "MISSION: 6 ROUNDS" instead of "6 MIN AMRAP", "challenge" instead of "workout").\n` +
    `- Rep ranges 6–12; no counting-to-failure; no BRUTAL-level intensity regardless of selection.`,
  postpartum:
    `ATHLETE ROLE: postpartum.\n` +
    `- NO high-impact (no jumping, running, burpees, box jumps, jump rope)\n` +
    `- NO heavy overhead loading; no heavy Olympic lifts\n` +
    `- Prioritize core rebuilding (diaphragmatic breathing, dead bugs, bird dogs, side planks) and pelvic-floor-safe movements\n` +
    `- Slower progressions, lighter absolute loads, more rest between sets\n` +
    `- Cap intensity at STEADY regardless of user selection`,
};

function formatProfile(profile) {
  if (!profile || typeof profile !== 'object') return null;
  const name = (profile.name || '').trim();
  const role = profile.role || 'adult';
  const notes = (profile.notes || '').trim();
  const roleRules = ROLE_RULES[role];
  const bits = [];
  if (name) bits.push(`Name: ${name}`);
  bits.push(`Role: ${role}`);
  if (notes) bits.push(`Limitations / notes: ${notes}`);
  return { summary: bits.join('\n'), roleRules };
}

function formatHistory(recent) {
  if (!Array.isArray(recent) || recent.length === 0) return null;
  const lines = recent.map((r) => {
    const moves = r.movements?.length ? ` · ${r.movements.join(' / ')}` : '';
    const rating = r.rating ? ` · felt ${String(r.rating).toUpperCase()}` : '';
    return `- ${r.daysAgo}d ago: ${r.headline} (${r.style} · ${r.intensity}${rating})${moves}`;
  });
  const consecutive = (() => {
    let n = 0;
    for (let i = 1; i <= recent.length; i++) {
      if (recent.some((r) => r.daysAgo === i)) n++;
      else break;
    }
    return n;
  })();
  const lastTwoBrutal = recent.slice(0, 2).every((r) => r.rating === 'brutal');
  return { lines: lines.join('\n'), consecutive, lastTwoBrutal };
}

const TWEAK_AVOID = {
  shoulder: 'overhead pressing, overhead squats, handstand work, heavy snatches, jerks, weighted pull-ups',
  knee:     'deep squats under load, heavy lunges, jumping lunges, box jumps, pistol squats',
  lowback:  'heavy deadlifts, bent-over rows, kettlebell swings at high reps, weighted sit-ups, heavy cleans',
  wrist:    'front rack holds, heavy push-ups, heavy presses, burpees to push-up, handstand work',
  hip:      'heavy hip hinge, deep squats, high-volume kettlebell swings, box jumps',
  neck:     'front squats (front rack), overhead loading, heavy rowing, burpees',
};

function formatTweaks(tweaks) {
  if (!Array.isArray(tweaks) || tweaks.length === 0) return null;
  const lines = tweaks.map((t) => `- ${t.toUpperCase()}: avoid ${TWEAK_AVOID[t] || 'movements that stress this area'}`);
  return `TODAY'S BODY SIGNALS (this session only — swap movements that would aggravate these):\n${lines.join('\n')}`;
}

export async function POST(request) {
  const { intensity, style, duration, equipment, recentHistory, profile, tweaks } = await request.json();

  const intense = INTENSITIES.find(i => i.key === intensity);
  const styleDef = STYLES[style];

  const intensityDescs = {
    EASY:   '70% effort — light loads, perfect form, no redlining',
    STEADY: '80% effort — working weight, steady pace throughout',
    HARD:   '90% effort — challenging loads, push hard, high output',
    SAVAGE: '100% effort — PR-level loads, maximum output, brutal',
  };

  const formatsByStyle = {
    CROSSFIT:     ['AMRAP', 'FORTIME', 'EMOM', 'CHIPPER'],
    HIIT:         ['TABATA', 'INTERVALS'],
    F45:          ['STATIONS'],
    ORANGETHEORY: ['INTERVALS', 'BLOCKS'],
    SEALFIT:      ['CHIPPER', 'EMOM'],
    STRENGTH:     ['SETS'],
    CONDITIONING: ['AMRAP', 'INTERVALS'],
  };

  const validFormats = formatsByStyle[style] || ['AMRAP'];
  const mainMinutes = duration - 8;

  const prof = formatProfile(profile);
  const profileBlock = prof
    ? `\nATHLETE PROFILE:\n${prof.summary}\n${prof.roleRules ? `\n${prof.roleRules}\n` : ''}`
    : '';

  const tweaksBlock = (() => {
    const t = formatTweaks(tweaks);
    return t ? `\n${t}\n` : '';
  })();

  const history = formatHistory(recentHistory);
  const historyBlock = history
    ? `\nRECENT TRAINING (last 7 days, most recent first):\n${history.lines}\n\nUse this context when choosing format and movement patterns:\n- Avoid repeating yesterday's dominant pattern (e.g. if yesterday was heavy squats, don't program heavy squats again today).\n- If the last two workouts were rated BRUTAL, ease intensity or choose a format with more built-in rest, even if the user selected ${intensity}.\n- If yesterday was a SETS/strength day, bias today toward conditioning or upper-body-biased work.${history.consecutive >= 4 ? `\n- The user has trained ${history.consecutive} consecutive days — lean toward a lighter/shorter stimulus unless they explicitly chose SAVAGE.` : ''}${history.lastTwoBrutal ? '\n- Two straight BRUTAL ratings is a real signal — prioritize recovery-biased work today.' : ''}\n- Still honor the user's selected intensity (${intensity}) as the primary guide; history nudges the choice of format and movements, not the overall effort level.\n`
    : '';

  const userPrompt = `Generate a ${duration}-minute ${styleDef.label} workout.

Intensity: ${intensity} — ${intensityDescs[intensity]}
Style: ${styleDef.label}
Main block duration: ${mainMinutes} minutes (8 min reserved for warmup/cooldown)
Valid formats for ${style}: ${validFormats.join(', ')}

Available equipment (prescribe ONLY movements that use this kit + bodyweight):
${buildEquipmentList(equipment)}
${profileBlock}${tweaksBlock}${historyBlock}
Pick one format from the valid list. Design a workout appropriate for ${mainMinutes} minutes at ${intensity} intensity (respecting any role rules and body signals above). Choose 3–6 movements.`;

  try {
    const response = await client.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1024,
      thinking: { type: 'adaptive' },
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textBlock = response.content.find(b => b.type === 'text');
    if (!textBlock) throw new Error('No text in response');

    let text = textBlock.text.trim();
    // Strip markdown code fences if the model adds them despite instructions
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();

    const { main, finisher } = JSON.parse(text);

    // Build full workout object with the same shape as generateHOD()
    const workout = {
      date: new Date().toISOString(),
      intensity: intense,
      style: { key: style, ...styleDef },
      format: main.format,
      duration,
      warmup: { label: 'WARMUP', duration: 5, note: '5 min — bike easy + dynamic mobility' },
      main,
      finisher,
    };

    return Response.json({ workout });
  } catch (err) {
    console.error('API generation failed, using JS fallback:', err);
    // Fallback to deterministic JS generator
    const workout = generateHOD({ intensity, style, duration, equipment });
    return Response.json({ workout, fallback: true });
  }
}
