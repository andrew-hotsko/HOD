// Thin wrapper around Upstash Redis so routes can call a single helper and
// degrade gracefully when the store isn't configured (e.g. local dev without
// env vars). Returns null for the client if env vars are missing.

let _client = null;
let _checked = false;

export function getRedis() {
  if (_checked) return _client;
  _checked = true;
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    // Lazy import so the build doesn't choke if the package isn't installed
    const { Redis } = require('@upstash/redis');
    _client = new Redis({ url, token });
  } catch {
    _client = null;
  }
  return _client;
}

export function isConfigured() {
  return !!getRedis();
}
