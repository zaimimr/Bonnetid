export type ApiLocation = {
  iso: string;
  name: string;
  lat: number;
  lon: number;
  fylke: string;
  kommune: string;
  info: string | null;
};

export type PrayerDay = {
  location: string;
  date: string;
  kommune: string | null;
  hijri_date: string;
  fajr: string | null;
  fajr_endtime: string | null;
  shuruq_sunrise: string | null;
  istiwa_noon: string | null;
  duhr: string | null;
  asr: string | null;
  shadow_1x: string | null;
  shadow_2x: string | null;
  asr_endtime: string | null;
  ghrub_sunset: string | null;
  maghrib: string | null;
  isha: string | null;
  muntasafallayl_midnight: string | null;
};

export type MosqueJummah = {
  id: number;
  mosque: string | null;
  jummah: string;
};

export type MosqueJamat = {
  pk?: number;
  mosque: string | null;
  start_date: string | null;
  end_date: string | null;
  fajr: string | null;
  duhr: string | null;
  asr: string | null;
  maghrib: string | null;
  isha: string | null;
  jummah?: MosqueJummah[];
};

export type MosquePost = {
  code: string;
  city: string;
};

export type Mosque = {
  org_nr: string;
  name: string;
  info: string | null;
  map_only: boolean;
  address: string | null;
  post: MosquePost | null;
  lat: number | null;
  lon: number | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  asr_method: 'MIXED' | 'SHADOW_1X' | 'SHADOW_2X' | 'NONE' | string;
  jamat: MosqueJamat | null;
  jummah: MosqueJummah[];
};

export type HijriDay = {
  gregorian_date: string;
  hijri_month_text: string;
  hijri_date: string;
  special_date_name: string | null;
};
