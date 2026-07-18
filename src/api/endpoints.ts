import { supabase } from './supabase';
import type { ApiLocation, HijriDay, Mosque, MosqueJamat, MosqueJummah, PrayerDay } from './types';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function hhmm(time: string | null): string | null {
  return time ? time.slice(0, 5) : null;
}

function monthRange(year: number, month: number): { start: string; end: string } {
  const lastDay = new Date(year, month, 0).getDate();
  return {
    start: `${year}-${pad2(month)}-01`,
    end: `${year}-${pad2(month)}-${pad2(lastDay)}`,
  };
}

function toDayKey(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}-${month}-${year}`;
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`;
}

type HijriDateRow = {
  gregorian_date: string;
  hijri_date_day: number;
  hijri_date_month: number;
  hijri_date_year: number;
  special_date_no: string | null;
};

type HijriMeta = {
  monthNames: Map<number, string>;
  monthStartNames: Map<number, string>;
  yearlyEvents: Map<string, string>;
};

let hijriMetaPromise: Promise<HijriMeta> | null = null;

function getHijriMeta(): Promise<HijriMeta> {
  hijriMetaPromise ??= loadHijriMeta().catch((error) => {
    hijriMetaPromise = null;
    throw error;
  });
  return hijriMetaPromise;
}

async function loadHijriMeta(): Promise<HijriMeta> {
  const [months, events] = await Promise.all([
    supabase.from('hijri_month').select('hijri_date_month, name_long, no'),
    supabase.from('hijri_yearly_events').select('hijri_date_month, hijri_date_day, no'),
  ]);
  if (months.error) throw months.error;
  if (events.error) throw events.error;

  return {
    monthNames: new Map(months.data.map((row) => [row.hijri_date_month, row.name_long])),
    monthStartNames: new Map(months.data.map((row) => [row.hijri_date_month, row.no])),
    yearlyEvents: new Map(
      events.data.map((row) => [`${row.hijri_date_month}-${row.hijri_date_day}`, row.no]),
    ),
  };
}

function toHijriDay(row: HijriDateRow, meta: HijriMeta): HijriDay {
  return {
    gregorian_date: row.gregorian_date,
    hijri_month_text: meta.monthNames.get(row.hijri_date_month) ?? '',
    hijri_date: `${row.hijri_date_year}-${row.hijri_date_month}-${row.hijri_date_day}`,
    special_date_name:
      row.special_date_no ??
      meta.yearlyEvents.get(`${row.hijri_date_month}-${row.hijri_date_day}`) ??
      (row.hijri_date_day === 1 ? (meta.monthStartNames.get(row.hijri_date_month) ?? null) : null),
  };
}

export async function fetchLocations(): Promise<ApiLocation[]> {
  const { data, error } = await supabase
    .from('location_t')
    .select('location_iso, location_name, lat_n_s, long_e_w, fylke_name, kommune_name, location_info')
    .order('location_name');
  if (error) throw error;

  return data.map((row) => ({
    iso: row.location_iso,
    name: row.location_name,
    lat: Number(row.lat_n_s),
    lon: Number(row.long_e_w),
    fylke: row.fylke_name ?? '',
    kommune: row.kommune_name ?? '',
    info: row.location_info,
  }));
}

export async function fetchPrayerTimes(
  locationIso: string,
  year: number,
  month: number,
): Promise<PrayerDay[]> {
  const { start, end } = monthRange(year, month);
  const [times, hijri] = await Promise.all([
    supabase
      .from('prayertime')
      .select(
        'date, location_iso, kommune, fajr, fajr_endtime, shuruq_sunrise, istiwa_noon, duhr, asr, shadow_1x, shadow_2x, asr_endtime, ghrub_sunset, maghrib, isha, muntasafallayl_midnight',
      )
      .eq('location_iso', locationIso)
      .gte('date', start)
      .lte('date', end)
      .order('date')
      .order('prayer_method'),
    supabase
      .from('hijri_dates')
      .select('gregorian_date, hijri_date_day, hijri_date_month, hijri_date_year')
      .gte('gregorian_date', start)
      .lte('gregorian_date', end),
  ]);
  if (times.error) throw times.error;
  if (hijri.error) throw hijri.error;

  const hijriByDate = new Map(
    hijri.data.map((row) => [
      row.gregorian_date,
      `${row.hijri_date_day}-${row.hijri_date_month}-${row.hijri_date_year}`,
    ]),
  );

  const days: PrayerDay[] = [];
  let lastDate: string | null = null;
  for (const row of times.data) {
    if (row.date === lastDate) continue;
    lastDate = row.date;
    days.push({
      location: row.location_iso,
      date: toDayKey(row.date),
      kommune: row.kommune,
      hijri_date: hijriByDate.get(row.date) ?? '',
      fajr: hhmm(row.fajr),
      fajr_endtime: hhmm(row.fajr_endtime),
      shuruq_sunrise: hhmm(row.shuruq_sunrise),
      istiwa_noon: hhmm(row.istiwa_noon),
      duhr: hhmm(row.duhr),
      asr: hhmm(row.asr),
      shadow_1x: hhmm(row.shadow_1x),
      shadow_2x: hhmm(row.shadow_2x),
      asr_endtime: hhmm(row.asr_endtime),
      ghrub_sunset: hhmm(row.ghrub_sunset),
      maghrib: hhmm(row.maghrib),
      isha: hhmm(row.isha),
      muntasafallayl_midnight: hhmm(row.muntasafallayl_midnight),
    });
  }
  return days;
}

type MosqueRow = {
  organisasjonsnummer: string;
  reg_navn: string | null;
  org_name2: string | null;
  org_info: string | null;
  address: string | null;
  post_no: string | null;
  lat: number | null;
  lon: number | null;
  map_only: boolean | null;
  asr_method: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
};

const MOSQUE_COLUMNS =
  'organisasjonsnummer, reg_navn, org_name2, org_info, address, post_no, lat, lon, map_only, asr_method, contact_name, contact_phone, contact_email';

type JamatPeriodRow = {
  id: number;
  mosque_id: string | null;
  start_date: string | null;
  end_date: string | null;
  fajr: string | null;
  dhuhr: string | null;
  asr: string | null;
  maghrib: string | null;
  isha: string | null;
};

const JAMAT_COLUMNS = 'id, mosque_id, start_date, end_date, fajr, dhuhr, asr, maghrib, isha';

function toAsrMethod(value: number | null): Mosque['asr_method'] {
  if (value === 1) return 'SHADOW_1X';
  if (value === 2) return 'SHADOW_2X';
  if (value === 0) return 'NONE';
  return 'MIXED';
}

function toJummah(row: { id: number; mosque_id: string | null; jummah: string }): MosqueJummah {
  return {
    id: row.id,
    mosque: row.mosque_id,
    jummah: hhmm(row.jummah) ?? row.jummah,
  };
}

function toJamat(row: JamatPeriodRow, jummah: MosqueJummah[]): MosqueJamat {
  return {
    pk: row.id,
    mosque: row.mosque_id,
    start_date: row.start_date,
    end_date: row.end_date,
    fajr: hhmm(row.fajr),
    duhr: hhmm(row.dhuhr),
    asr: hhmm(row.asr),
    maghrib: hhmm(row.maghrib),
    isha: hhmm(row.isha),
    jummah,
  };
}

function toMosque(
  row: MosqueRow,
  post: { post_no: string; post_name: string } | undefined,
  jamat: MosqueJamat | null,
  jummah: MosqueJummah[],
): Mosque {
  return {
    org_nr: row.organisasjonsnummer,
    name: row.org_name2?.trim() || row.reg_navn || row.organisasjonsnummer,
    info: row.org_info?.trim() || null,
    map_only: row.map_only ?? false,
    address: row.address,
    post: post ? { code: post.post_no, city: post.post_name } : null,
    lat: row.lat == null ? null : Number(row.lat),
    lon: row.lon == null ? null : Number(row.lon),
    contact_name: row.contact_name,
    contact_phone: row.contact_phone,
    contact_email: row.contact_email,
    asr_method: toAsrMethod(row.asr_method),
    jamat,
    jummah,
  };
}

async function fetchPosts(postNos: string[]): Promise<Map<string, { post_no: string; post_name: string }>> {
  const unique = [...new Set(postNos.filter(Boolean))];
  if (unique.length === 0) return new Map();
  const { data, error } = await supabase
    .from('location_postnumber')
    .select('post_no, post_name')
    .in('post_no', unique);
  if (error) throw error;
  return new Map(data.map((row) => [row.post_no, row]));
}

async function fetchJummahByJamatIds(jamatIds: number[]): Promise<Map<number, MosqueJummah[]>> {
  if (jamatIds.length === 0) return new Map();
  const { data, error } = await supabase
    .from('mosque_jummah')
    .select('id, mosque_id, jummah, jamat_id')
    .in('jamat_id', jamatIds)
    .order('jummah');
  if (error) throw error;

  const byJamat = new Map<number, MosqueJummah[]>();
  for (const row of data) {
    const list = byJamat.get(row.jamat_id) ?? [];
    list.push(toJummah(row));
    byJamat.set(row.jamat_id, list);
  }
  return byJamat;
}

async function fetchCurrentJamatPeriods(mosqueIds: string[]): Promise<Map<string, MosqueJamat>> {
  if (mosqueIds.length === 0) return new Map();
  const today = todayIso();
  const { data, error } = await supabase
    .from('mosque_jamatperiode')
    .select(JAMAT_COLUMNS)
    .in('mosque_id', mosqueIds)
    .lte('start_date', today)
    .gte('end_date', today)
    .order('start_date', { ascending: false });
  if (error) throw error;

  const jummahByJamat = await fetchJummahByJamatIds(data.map((row) => row.id));
  const byMosque = new Map<string, MosqueJamat>();
  for (const row of data) {
    if (!row.mosque_id || byMosque.has(row.mosque_id)) continue;
    byMosque.set(row.mosque_id, toJamat(row, jummahByJamat.get(row.id) ?? []));
  }
  return byMosque;
}

export async function fetchMosquesNearby(_lat: number, _lon: number): Promise<Mosque[]> {
  const { data, error } = await supabase.from('mosque_t').select(MOSQUE_COLUMNS).order('reg_navn');
  if (error) throw error;

  const [posts, jamatByMosque] = await Promise.all([
    fetchPosts(data.map((row) => row.post_no ?? '')),
    fetchCurrentJamatPeriods(data.map((row) => row.organisasjonsnummer)),
  ]);

  return data.map((row) => {
    const jamat = jamatByMosque.get(row.organisasjonsnummer) ?? null;
    return toMosque(
      row,
      row.post_no ? posts.get(row.post_no) : undefined,
      jamat,
      jamat?.jummah ?? [],
    );
  });
}

export async function fetchMosque(orgNr: string): Promise<Mosque> {
  const { data, error } = await supabase
    .from('mosque_t')
    .select(MOSQUE_COLUMNS)
    .eq('organisasjonsnummer', orgNr)
    .single();
  if (error) throw error;

  const [posts, jamatByMosque] = await Promise.all([
    fetchPosts(data.post_no ? [data.post_no] : []),
    fetchCurrentJamatPeriods([orgNr]),
  ]);

  const jamat = jamatByMosque.get(orgNr) ?? null;
  return toMosque(
    data,
    data.post_no ? posts.get(data.post_no) : undefined,
    jamat,
    jamat?.jummah ?? [],
  );
}

export async function fetchMosqueJamatPeriods(orgNr: string): Promise<MosqueJamat[]> {
  const { data, error } = await supabase
    .from('mosque_jamatperiode')
    .select(JAMAT_COLUMNS)
    .eq('mosque_id', orgNr)
    .order('start_date');
  if (error) throw error;

  const jummahByJamat = await fetchJummahByJamatIds(data.map((row) => row.id));
  return data.map((row) => toJamat(row, jummahByJamat.get(row.id) ?? []));
}

export async function fetchHijriMonth(year: number, month: number): Promise<HijriDay[]> {
  const { start, end } = monthRange(year, month);
  const [meta, days] = await Promise.all([
    getHijriMeta(),
    supabase
      .from('hijri_dates')
      .select('gregorian_date, hijri_date_day, hijri_date_month, hijri_date_year, special_date_no')
      .gte('gregorian_date', start)
      .lte('gregorian_date', end)
      .order('gregorian_date'),
  ]);
  if (days.error) throw days.error;

  return days.data.map((row) => toHijriDay(row, meta));
}

export async function fetchSpecialDates(year: number): Promise<HijriDay[]> {
  const [meta, days] = await Promise.all([
    getHijriMeta(),
    supabase
      .from('hijri_dates')
      .select('gregorian_date, hijri_date_day, hijri_date_month, hijri_date_year, special_date_no')
      .gte('gregorian_date', `${year}-01-01`)
      .lte('gregorian_date', `${year}-12-31`)
      .order('gregorian_date'),
  ]);
  if (days.error) throw days.error;

  return days.data
    .map((row) => toHijriDay(row, meta))
    .filter((day) => day.special_date_name != null);
}
