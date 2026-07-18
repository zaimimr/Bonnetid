import { HIJRI_META, type HijriMeta } from '@/lib/hijriMeta';
import { supabase } from './supabase';
import type { ApiLocation, HijriDay, Mosque, MosqueJamat, MosqueJummah, PrayerDay } from './types';

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function hhmm(time: string | null): string | null {
  return time ? time.slice(0, 5) : null;
}

function jamatTime(time: string | null): string | null {
  const trimmed = hhmm(time);
  return trimmed === '00:00' ? null : trimmed;
}

function eidTime(time: string | null): string | null {
  const match = time?.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const normalized = `${match[1].padStart(2, '0')}:${match[2]}`;
  return normalized === '00:00' ? null : normalized;
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

function toLocationAsrMethod(value: string | number | null): ApiLocation['asr_method'] {
  const parsed = value == null ? null : Number(value);
  if (parsed === 1) return 'SHADOW_1X';
  if (parsed === 2) return 'SHADOW_2X';
  return null;
}

export async function fetchLocations(): Promise<ApiLocation[]> {
  const { data, error } = await supabase
    .from('location_t')
    .select(
      'location_iso, location_name, lat_n_s, long_e_w, fylke_name, kommune_name, location_info, asr_method',
    )
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
    asr_method: toLocationAsrMethod(row.asr_method),
  }));
}

export async function fetchPrayerTimes(
  locationIso: string,
  year: number,
  month: number,
  hijriDays: HijriDay[],
): Promise<PrayerDay[]> {
  const { start, end } = monthRange(year, month);
  const times = await supabase
    .from('prayertime')
    .select(
      'date, location_iso, kommune, fajr, fajr_endtime, shuruq_sunrise, istiwa_noon, duhr, asr, shadow_1x, shadow_2x, asr_endtime, ghrub_sunset, maghrib, isha, muntasafallayl_midnight',
    )
    .eq('location_iso', locationIso)
    .gte('date', start)
    .lte('date', end)
    .order('date')
    .order('prayer_method');
  if (times.error) throw times.error;

  const hijriByDate = new Map(
    hijriDays.map((day) => [day.gregorian_date, day.hijri_date.split('-').reverse().join('-')]),
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
  reg_hjemmeside: string | null;
  show_eid: boolean | null;
  eidprayer_time1: string | null;
  eidprayer_time2: string | null;
  eidprayer_time3: string | null;
};

const MOSQUE_COLUMNS =
  'organisasjonsnummer, reg_navn, org_name2, org_info, address, post_no, lat, lon, map_only, asr_method, contact_name, contact_phone, contact_email, reg_hjemmeside, show_eid, eidprayer_time1, eidprayer_time2, eidprayer_time3';

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
  fajr_offset: number | null;
  dhuhr_offset: number | null;
  asr_offset: number | null;
  maghrib_offset: number | null;
  isha_offset: number | null;
};

const JAMAT_COLUMNS =
  'id, mosque_id, start_date, end_date, fajr, dhuhr, asr, maghrib, isha, fajr_offset, dhuhr_offset, asr_offset, maghrib_offset, isha_offset';

function toHomepage(value: string | null): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

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
    fajr: jamatTime(row.fajr),
    duhr: jamatTime(row.dhuhr),
    asr: jamatTime(row.asr),
    maghrib: jamatTime(row.maghrib),
    isha: jamatTime(row.isha),
    fajr_offset: row.fajr_offset,
    duhr_offset: row.dhuhr_offset,
    asr_offset: row.asr_offset,
    maghrib_offset: row.maghrib_offset,
    isha_offset: row.isha_offset,
    jummah,
  };
}

type PostRow = { post_no: string; post_name: string; location_iso: string | null };

function toMosque(
  row: MosqueRow,
  post: PostRow | undefined,
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
    location_iso: post?.location_iso ?? null,
    lat: row.lat == null ? null : Number(row.lat),
    lon: row.lon == null ? null : Number(row.lon),
    contact_name: row.contact_name,
    contact_phone: row.contact_phone,
    contact_email: row.contact_email,
    homepage: toHomepage(row.reg_hjemmeside),
    asr_method: toAsrMethod(row.asr_method),
    show_eid: row.show_eid ?? false,
    eid_prayers: [row.eidprayer_time1, row.eidprayer_time2, row.eidprayer_time3]
      .map(eidTime)
      .filter((time): time is string => time != null),
    jamat,
    jummah,
  };
}

type JummahRow = { id: number; mosque_id: string | null; jummah: string };

type JamatEmbedRow = JamatPeriodRow & { mosque_jummah: JummahRow[] };

type MosqueEmbedRow = MosqueRow & {
  location_postnumber: PostRow | null;
  mosque_jamatperiode: JamatEmbedRow[];
};

const MOSQUE_EMBED_COLUMNS = `${MOSQUE_COLUMNS}, location_postnumber(post_no, post_name, location_iso), mosque_jamatperiode(${JAMAT_COLUMNS}, mosque_jummah(id, mosque_id, jummah))`;

function sortedJummah(rows: JummahRow[]): MosqueJummah[] {
  return [...rows].sort((a, b) => a.jummah.localeCompare(b.jummah)).map(toJummah);
}

function currentJamat(row: MosqueEmbedRow): MosqueJamat | null {
  const period = [...row.mosque_jamatperiode].sort((a, b) =>
    (b.start_date ?? '').localeCompare(a.start_date ?? ''),
  )[0];
  return period ? toJamat(period, sortedJummah(period.mosque_jummah)) : null;
}

function toEmbeddedMosque(row: MosqueEmbedRow): Mosque {
  const jamat = currentJamat(row);
  return toMosque(row, row.location_postnumber ?? undefined, jamat, jamat?.jummah ?? []);
}

export async function fetchMosques(): Promise<Mosque[]> {
  const today = todayIso();
  const { data, error } = await supabase
    .from('mosque_t')
    .select(MOSQUE_EMBED_COLUMNS)
    .lte('mosque_jamatperiode.start_date', today)
    .gte('mosque_jamatperiode.end_date', today)
    .order('reg_navn');
  if (error) throw error;

  return (data as unknown as MosqueEmbedRow[]).map(toEmbeddedMosque);
}

export async function fetchMosque(orgNr: string): Promise<Mosque> {
  const today = todayIso();
  const { data, error } = await supabase
    .from('mosque_t')
    .select(MOSQUE_EMBED_COLUMNS)
    .eq('organisasjonsnummer', orgNr)
    .lte('mosque_jamatperiode.start_date', today)
    .gte('mosque_jamatperiode.end_date', today)
    .single();
  if (error) throw error;

  return toEmbeddedMosque(data as unknown as MosqueEmbedRow);
}

export async function fetchMosqueJamatPeriods(orgNr: string): Promise<MosqueJamat[]> {
  const { data, error } = await supabase
    .from('mosque_jamatperiode')
    .select(`${JAMAT_COLUMNS}, mosque_jummah(id, mosque_id, jummah)`)
    .eq('mosque_id', orgNr)
    .order('start_date');
  if (error) throw error;

  return (data as JamatEmbedRow[]).map((row) => toJamat(row, sortedJummah(row.mosque_jummah)));
}

export async function fetchHijriYear(year: number): Promise<HijriDay[]> {
  const days = await supabase
    .from('hijri_dates')
    .select('gregorian_date, hijri_date_day, hijri_date_month, hijri_date_year, special_date_no')
    .gte('gregorian_date', `${year}-01-01`)
    .lte('gregorian_date', `${year}-12-31`)
    .order('gregorian_date');
  if (days.error) throw days.error;

  return days.data.map((row) => toHijriDay(row, HIJRI_META));
}
