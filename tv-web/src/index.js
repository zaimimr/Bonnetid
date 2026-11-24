const BASES = ['main', 'lobby', 'plakat', 'rad', 'app'];
const HIDE_KEYS = [
  'main.fajrEnd',
  'main.timeline',
  'main.note',
  'main.hijri',
  'main.app',
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

function osloDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Oslo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function hhmm(value) {
  return typeof value === 'string' && /^\d{2}:\d{2}/.test(value) && !value.startsWith('00:00') ? value.slice(0, 5) : null;
}

function plusMinutes(time, minutes) {
  const [h, m] = time.split(':').map(Number);
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

async function irn(env, query) {
  const res = await fetch(`${env.IRN_URL}/rest/v1/${query}`, { headers: { apikey: env.IRN_KEY, authorization: `Bearer ${env.IRN_KEY}` } });
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  return res.json();
}

async function preview(env, orgNr) {
  const date = osloDate();
  const [mosque] = await irn(
    env,
    `mosque_t?select=reg_navn,org_name2,announcement,vipps_nr,location_postnumber(location_iso),mosque_jamatperiode(start_date,end_date,fajr,dhuhr,asr,maghrib,isha,fajr_offset,dhuhr_offset,asr_offset,maghrib_offset,isha_offset,mosque_jummah(jummah)),mosque_jummah(jummah)&organisasjonsnummer=eq.${orgNr}`,
  );
  if (!mosque) return null;
  const iso = mosque.location_postnumber?.location_iso;
  const [times, hijri] = await Promise.all([
    iso ? irn(env, `prayertime?select=fajr,fajr_endtime,duhr,asr,maghrib,isha&location_iso=eq.${iso}&date=eq.${date}&order=prayer_method&limit=1`) : [],
    irn(env, `hijri_dates?select=hijri_date_day,hijri_date_month,hijri_date_year&gregorian_date=eq.${date}`),
  ]);
  const period = (mosque.mosque_jamatperiode ?? []).find((p) => p.start_date <= date && date <= p.end_date) ?? null;
  const row = times[0];
  const jamatOf = (azan, column) => {
    if (!period || !azan) return null;
    const fixed = hhmm(period[column]);
    if (fixed) return fixed;
    const offset = period[`${column}_offset`];
    return typeof offset === 'number' ? plusMinutes(azan, offset) : null;
  };
  const columns = { fajr: 'fajr', duhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha' };
  const prayers = row
    ? ['fajr', 'fajr_endtime', 'duhr', 'asr', 'maghrib', 'isha']
        .map((name) => ({ name, azan: hhmm(row[name]), iqamah: columns[name] ? jamatOf(hhmm(row[name]), columns[name]) : null }))
        .filter((p) => p.azan)
    : null;
  const jumuah = hhmm((period?.mosque_jummah?.[0] ?? mosque.mosque_jummah?.[0])?.jummah);
  const h = hijri[0];
  return {
    mosque: { name: mosque.org_name2?.trim() || mosque.reg_navn, announcement: mosque.announcement?.trim() || null, vippsNumber: mosque.vipps_nr?.trim() || null },
    day: prayers?.length
      ? { prayers, jumuah, hijri: h ? { day: h.hijri_date_day, month: h.hijri_date_month, year: h.hijri_date_year } : null }
      : null,
  };
}

async function api(request, env, path) {
  if (path === '/api/preview' && request.method === 'GET') {
    const orgNr = new URL(request.url).searchParams.get('org');
    if (!/^\d{6,15}$/.test(orgNr ?? '')) return json({ error: 'bad-request' }, 400);
    const cache = caches.default;
    const key = new Request(`${new URL(request.url).origin}/api/preview?org=${orgNr}&d=${osloDate()}`);
    const hit = await cache.match(key);
    if (hit) return hit;
    let body;
    try {
      body = await preview(env, orgNr);
    } catch {
      return json({ error: 'upstream' }, 502);
    }
    if (!body) return json({ error: 'not-found' }, 404);
    const response = new Response(JSON.stringify(body), {
      headers: { 'content-type': 'application/json', 'cache-control': 'public, max-age=900' },
    });
    await cache.put(key, response.clone());
    return response;
  }
  if (path === '/api/mosques' && request.method === 'GET') {
    const cache = caches.default;
    const hit = await cache.match(request);
    if (hit) return hit;
    const url = `${env.IRN_URL}/rest/v1/mosque_t?select=organisasjonsnummer,reg_navn,org_name2,address,location_postnumber(post_no,post_name)&order=reg_navn`;
    const upstream = await fetch(url, { headers: { apikey: env.IRN_KEY, authorization: `Bearer ${env.IRN_KEY}` } });
    if (!upstream.ok) return json({ error: 'upstream' }, 502);
    const rows = await upstream.json();
    const mosques = rows.map((row) => ({
      orgNr: row.organisasjonsnummer,
      name: row.org_name2?.trim() || row.reg_navn,
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

const APP_STORE = 'https://apps.apple.com/no/app/id6792056685';
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=no.irn.bonnetid';

function appLink(request) {
  const agent = request.headers.get('user-agent') ?? '';
  if (/iPhone|iPad|iPod/i.test(agent)) return Response.redirect(APP_STORE, 302);
  if (/Android/i.test(agent)) return Response.redirect(PLAY_STORE, 302);
  const html = `<!doctype html><html lang="nb"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bønnetid</title><body style="font-family:system-ui;margin:0;padding:48px 16px;text-align:center;background:#F6F8F7;color:#14201B"><h1>Bønnetid</h1><p><a href="${APP_STORE}">App Store</a></p><p><a href="${PLAY_STORE}">Google Play</a></p></body></html>`;
  return new Response(html, { headers: { 'content-type': 'text/html; charset=utf-8' } });
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/app') return appLink(request);
    if (path.startsWith('/api/')) return api(request, env, path);
    return env.ASSETS.fetch(request);
  },
};
