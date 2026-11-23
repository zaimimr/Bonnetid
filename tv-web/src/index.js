const BASES = ['main', 'lobby', 'plakat', 'rad'];
const HIDE_KEYS = [
  'main.fajrEnd',
  'main.timeline',
  'main.note',
  'main.hijri',
  'lobby.times',
  'lobby.note',
  'lobby.vipps',
  'plakat.note',
  'plakat.vipps',
  'rad.fajrEnd',
  'rad.timeline',
  'iqamah.tips',
  'jumuah.vipps',
];
const CHOICES = {
  seconds: [10, 20, 30, 60],
  iqamahLead: [5, 10, 15],
  brand: ['#0C6B52', '#1F4E8C', '#7A2E3B', '#4A3F8C'],
  art: ['mosque', 'kaaba', 'lantern', 'moon', 'none'],
  duaFont: ['Amiri', 'ScheherazadeNew', 'NotoNaskhArabic', 'ReemKufi', 'ArefRuqaa', 'NotoNastaliqUrdu'],
  hall: ['Hovedsalen', 'Kvinneavdelingen', 'Sal 2', 'Ungdomssalen', 'Kafeen'],
};
const FLAGS = ['configured', 'dim', 'translation', 'texture'];
const ID = /^[a-z0-9]{12}$/;
const SECRET = /^[a-z0-9]{24,64}$/;

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });
}

async function sha256(text) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function clean(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const out = {};
  if (input.orgNr === null || (typeof input.orgNr === 'string' && /^\d{6,15}$/.test(input.orgNr))) out.orgNr = input.orgNr;
  if (Array.isArray(input.rotation)) {
    const rotation = [...new Set(input.rotation.filter((id) => BASES.includes(id)))];
    if (rotation.length > 0) out.rotation = rotation;
  }
  if (Array.isArray(input.hide)) out.hide = [...new Set(input.hide.filter((key) => HIDE_KEYS.includes(key)))];
  for (const [key, options] of Object.entries(CHOICES)) {
    if (options.includes(input[key])) out[key] = input[key];
  }
  for (const key of FLAGS) {
    if (typeof input[key] === 'boolean') out[key] = input[key];
  }
  return out;
}

async function authorize(env, body) {
  if (!body || !ID.test(body.id) || !SECRET.test(body.secret)) return { error: json({ error: 'bad-request' }, 400) };
  const row = await env.DB.prepare('select hash, config, source, updated from tv_screens where id = ?').bind(body.id).first();
  if (!row) return { error: json({ error: 'not-found' }, 404) };
  if (row.hash !== (await sha256(body.secret))) return { error: json({ error: 'forbidden' }, 403) };
  return { row };
}

async function api(request, env, path) {
  if (path === '/api/mosques' && request.method === 'GET') {
    const cache = caches.default;
    const hit = await cache.match(request);
    if (hit) return hit;
    const url = `${env.IRN_URL}/rest/v1/mosque_t?select=organisasjonsnummer,reg_navn,address,location_postnumber(post_no,post_name)&order=reg_navn`;
    const upstream = await fetch(url, { headers: { apikey: env.IRN_KEY, authorization: `Bearer ${env.IRN_KEY}` } });
    if (!upstream.ok) return json({ error: 'upstream' }, 502);
    const rows = await upstream.json();
    const mosques = rows.map((row) => ({
      orgNr: row.organisasjonsnummer,
      name: row.reg_navn,
      address: row.address,
      city: row.location_postnumber?.post_name ?? null,
    }));
    const response = new Response(JSON.stringify(mosques), {
      headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=3600' },
    });
    await cache.put(request, response.clone());
    return response;
  }
  if (request.method !== 'POST') return json({ error: 'method' }, 405);
  const text = await request.text();
  if (text.length > 8000) return json({ error: 'too-large' }, 413);
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ error: 'bad-json' }, 400);
  }

  if (path === '/api/register') {
    if (!ID.test(body?.id) || !SECRET.test(body?.secret)) return json({ error: 'bad-request' }, 400);
    const hash = await sha256(body.secret);
    const config = clean(body.config);
    await env.DB.prepare(
      'insert into tv_screens (id, hash, config, source, updated) values (?, ?, ?, ?, ?) on conflict(id) do nothing',
    )
      .bind(body.id, hash, config ? JSON.stringify(config) : null, 'tv', Date.now())
      .run();
    const row = await env.DB.prepare('select hash from tv_screens where id = ?').bind(body.id).first();
    return row?.hash === hash ? json({ ok: true }) : json({ error: 'forbidden' }, 403);
  }

  const { row, error } = await authorize(env, body);
  if (error) return error;

  if (path === '/api/load') {
    return json({ config: row.config ? JSON.parse(row.config) : null, source: row.source, updated: row.updated });
  }
  if (path === '/api/save') {
    const config = clean(body.config);
    if (!config) return json({ error: 'bad-config' }, 400);
    const merged = { ...(row.config ? JSON.parse(row.config) : {}), ...config };
    const source = body.source === 'tv' ? 'tv' : 'phone';
    const updated = Math.max(Date.now(), row.updated + 1);
    await env.DB.prepare('update tv_screens set config = ?, source = ?, updated = ? where id = ?')
      .bind(JSON.stringify(merged), source, updated, body.id)
      .run();
    return json({ config: merged, source, updated });
  }
  return json({ error: 'not-found' }, 404);
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path.startsWith('/api/')) return api(request, env, path);
    return env.ASSETS.fetch(request);
  },
};
