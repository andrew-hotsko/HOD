import { getRedis } from '@/lib/kv';

function normalizeCode(raw) {
  return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

function normalizeDate(raw) {
  const s = String(raw || '');
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

const TTL_SECONDS = 60 * 60 * 48; // 48 hours

// POST: publish the day's family WOD. First-writer-wins (SETNX semantics)
// so the first family member to generate a workout seeds the day's block.
// Subsequent calls are no-ops.
export async function POST(request) {
  const redis = getRedis();
  if (!redis) return Response.json({ ok: false, reason: 'unconfigured' }, { status: 503 });

  let body;
  try { body = await request.json(); } catch { body = {}; }
  const code = normalizeCode(body.code);
  const date = normalizeDate(body.date);
  const author = String(body.author || '').slice(0, 30);
  const params = body.params || {};
  const headline = String(body.headline || '').slice(0, 80);
  const partnered = !!body.partnered;
  if (!code || !date || !params.intensity || !params.style || !params.duration) {
    return Response.json({ ok: false, reason: 'bad-request' }, { status: 400 });
  }

  const record = {
    author,
    ts: Date.now(),
    date,
    params: {
      intensity: String(params.intensity).slice(0, 20),
      style: String(params.style).slice(0, 20),
      duration: Number(params.duration) || 30,
    },
    headline,
    partnered,
  };

  const key = `hod:wod:${code}:${date}`;
  try {
    // SETNX: only set if the key doesn't exist
    const ok = await redis.set(key, JSON.stringify(record), { nx: true, ex: TTL_SECONDS });
    // Upstash returns "OK" when the key was set, null if it already existed
    const set = ok === 'OK' || ok === true;
    return Response.json({ ok: true, set });
  } catch {
    return Response.json({ ok: false, reason: 'store-error' }, { status: 500 });
  }
}

export async function GET(request) {
  const redis = getRedis();
  if (!redis) return Response.json({ ok: false, reason: 'unconfigured', wod: null }, { status: 503 });

  const url = new URL(request.url);
  const code = normalizeCode(url.searchParams.get('code'));
  const date = normalizeDate(url.searchParams.get('date'));
  if (!code || !date) return Response.json({ ok: false, reason: 'bad-request', wod: null }, { status: 400 });

  try {
    const raw = await redis.get(`hod:wod:${code}:${date}`);
    if (!raw) return Response.json({ ok: true, wod: null });
    const wod = typeof raw === 'object' ? raw : JSON.parse(raw);
    return Response.json({ ok: true, wod });
  } catch {
    return Response.json({ ok: false, reason: 'store-error', wod: null }, { status: 500 });
  }
}
