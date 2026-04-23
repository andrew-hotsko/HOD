import { getRedis } from '@/lib/kv';

function normalizeCode(raw) {
  return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
}

const MAX_ITEMS = 50;
const RETURN_LIMIT = 20;
const TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

export async function POST(request) {
  const redis = getRedis();
  if (!redis) return Response.json({ ok: false, reason: 'unconfigured' }, { status: 503 });

  let body;
  try { body = await request.json(); } catch { body = {}; }
  const code = normalizeCode(body.code);
  const item = body.item;
  if (!code || !item || typeof item !== 'object') {
    return Response.json({ ok: false, reason: 'bad-request' }, { status: 400 });
  }

  const record = {
    id: crypto.randomUUID?.() ?? String(Date.now()),
    ts: Date.now(),
    name: String(item.name || '').slice(0, 30),
    role: String(item.role || 'adult'),
    headline: String(item.headline || '').slice(0, 80),
    style: String(item.style || '').slice(0, 24),
    format: String(item.format || '').slice(0, 24),
    duration: Number(item.duration) || 0,
    elapsed: Number(item.elapsed) || 0,
    rating: item.rating === 'easy' || item.rating === 'solid' || item.rating === 'brutal' ? item.rating : null,
    isPR: !!item.isPR,
  };

  const key = `hod:feed:${code}`;
  try {
    await redis.lpush(key, JSON.stringify(record));
    await redis.ltrim(key, 0, MAX_ITEMS - 1);
    await redis.expire(key, TTL_SECONDS);
  } catch (err) {
    return Response.json({ ok: false, reason: 'store-error' }, { status: 500 });
  }
  return Response.json({ ok: true, id: record.id });
}

export async function GET(request) {
  const redis = getRedis();
  if (!redis) return Response.json({ ok: false, reason: 'unconfigured', items: [] }, { status: 503 });

  const url = new URL(request.url);
  const code = normalizeCode(url.searchParams.get('code'));
  if (!code) return Response.json({ ok: false, reason: 'bad-request', items: [] }, { status: 400 });

  try {
    const raw = await redis.lrange(`hod:feed:${code}`, 0, RETURN_LIMIT - 1);
    const items = (raw || [])
      .map((x) => {
        if (typeof x === 'object' && x) return x;
        try { return JSON.parse(x); } catch { return null; }
      })
      .filter(Boolean);
    return Response.json({ ok: true, items });
  } catch {
    return Response.json({ ok: false, reason: 'store-error', items: [] }, { status: 500 });
  }
}
