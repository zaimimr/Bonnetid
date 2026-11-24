export const SCREENS = ['main', 'lobby', 'plakat', 'rad', 'iqamah', 'jumuah', 'dua', 'hvile'];

const INK = {
  page: '#F6F8F7',
  card: '#FFFFFF',
  line: '#DDE4E0',
  track: '#E4EAE7',
  mark: '#C3CEC8',
  text: '#182420',
  body: '#3E4C46',
  muted: '#5F6E67',
  white: '#FFFFFF',
  gold50: '#FAF3DE',
  gold100: '#F3E6BD',
  gold400: '#D9B84F',
  gold600: '#8F7112',
  gold700: '#6E570D',
  gold800: '#4F3F0A',
  night950: '#0F1714',
  night900: '#151F1B',
  night800: '#1C2823',
  night700: '#27362F',
  nightDot: '#3A4B43',
  mist100: '#EEF2F0',
  mist300: '#C6D0CB',
  mist500: '#8C9A93',
};

const BRANDS = ['#0C6B52', '#1F4E8C', '#7A2E3B', '#4A3F8C'];

function mix(hex, weight, to) {
  const n = parseInt(hex.slice(1), 16);
  return (
    '#' +
    [n >> 16, (n >> 8) & 255, n & 255]
      .map((v) => Math.round(v * (1 - weight) + to * weight))
      .map((v) => v.toString(16).padStart(2, '0'))
      .join('')
  );
}

function brandColors(hex) {
  return { b: hex, s: mix(hex, 0.9, 255), t: mix(hex, 0.8, 255), d: mix(hex, 0.3, 0), m: mix(hex, 0.45, 255) };
}

const ICON_PATHS = {
  "moon-stars": "M240,96a8,8,0,0,1-8,8H216v16a8,8,0,0,1-16,0V104H184a8,8,0,0,1,0-16h16V72a8,8,0,0,1,16,0V88h16A8,8,0,0,1,240,96ZM144,56h8v8a8,8,0,0,0,16,0V56h8a8,8,0,0,0,0-16h-8V32a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16Zm72.77,97a8,8,0,0,1,1.43,8A96,96,0,1,1,95.07,37.8a8,8,0,0,1,10.6,9.06A88.07,88.07,0,0,0,209.14,150.33,8,8,0,0,1,216.77,153Zm-19.39,14.88c-1.79.09-3.59.14-5.38.14A104.11,104.11,0,0,1,88,64c0-1.79,0-3.59.14-5.38A80,80,0,1,0,197.38,167.86Z",
  "sun": "M120,40V16a8,8,0,0,1,16,0V40a8,8,0,0,1-16,0Zm72,88a64,64,0,1,1-64-64A64.07,64.07,0,0,1,192,128Zm-16,0a48,48,0,1,0-48,48A48.05,48.05,0,0,0,176,128ZM58.34,69.66A8,8,0,0,0,69.66,58.34l-16-16A8,8,0,0,0,42.34,53.66Zm0,116.68-16,16a8,8,0,0,0,11.32,11.32l16-16a8,8,0,0,0-11.32-11.32ZM192,72a8,8,0,0,0,5.66-2.34l16-16a8,8,0,0,0-11.32-11.32l-16,16A8,8,0,0,0,192,72Zm5.66,114.34a8,8,0,0,0-11.32,11.32l16,16a8,8,0,0,0,11.32-11.32ZM48,128a8,8,0,0,0-8-8H16a8,8,0,0,0,0,16H40A8,8,0,0,0,48,128Zm80,80a8,8,0,0,0-8,8v24a8,8,0,0,0,16,0V216A8,8,0,0,0,128,208Zm112-88H216a8,8,0,0,0,0,16h24a8,8,0,0,0,0-16Z",
  "cloud-sun": "M164,72a76.2,76.2,0,0,0-20.26,2.73,55.63,55.63,0,0,0-9.41-11.54l9.51-13.57a8,8,0,1,0-13.11-9.18L121.22,54A55.9,55.9,0,0,0,96,48c-.58,0-1.16,0-1.74,0L91.37,31.71a8,8,0,1,0-15.75,2.77L78.5,50.82A56.1,56.1,0,0,0,55.23,65.67L41.61,56.14a8,8,0,1,0-9.17,13.11L46,78.77A55.55,55.55,0,0,0,40,104c0,.57,0,1.15,0,1.72L23.71,108.6a8,8,0,0,0,1.38,15.88,8.24,8.24,0,0,0,1.39-.12l16.32-2.88a55.74,55.74,0,0,0,5.86,12.42A52,52,0,0,0,84,224h80a76,76,0,0,0,0-152ZM56,104a40,40,0,0,1,72.54-23.24,76.26,76.26,0,0,0-35.62,40,52.14,52.14,0,0,0-31,4.17A40,40,0,0,1,56,104ZM164,208H84a36,36,0,1,1,4.78-71.69c-.37,2.37-.63,4.79-.77,7.23a8,8,0,0,0,16,.92,58.91,58.91,0,0,1,1.88-11.81c0-.16.09-.32.12-.48A60.06,60.06,0,1,1,164,208Z",
  "moon": "M233.54,142.23a8,8,0,0,0-8-2,88.08,88.08,0,0,1-109.8-109.8,8,8,0,0,0-10-10,104.84,104.84,0,0,0-52.91,37A104,104,0,0,0,136,224a103.09,103.09,0,0,0,62.52-20.88,104.84,104.84,0,0,0,37-52.91A8,8,0,0,0,233.54,142.23ZM188.9,190.34A88,88,0,0,1,65.66,67.11a89,89,0,0,1,31.4-26A106,106,0,0,0,96,56,104.11,104.11,0,0,0,200,160a106,106,0,0,0,14.92-1.06A89,89,0,0,1,188.9,190.34Z",
  "mosque": "M224,128a23.84,23.84,0,0,0-8,1.38V128c0-41.78-31.07-62.46-53.76-77.56C148.16,41.06,136,33,136,24a8,8,0,0,0-16,0c0,9-12.16,17.06-26.24,26.44C71.07,65.54,40,86.22,40,128v1.38A24,24,0,0,0,8,152v56a8,8,0,0,0,8,8H80a8,8,0,0,0,8-8V176a8,8,0,0,1,16,0v32a8,8,0,0,0,8,8h32a8,8,0,0,0,8-8V176a8,8,0,0,1,16,0v32a8,8,0,0,0,8,8h64a8,8,0,0,0,8-8V152A24,24,0,0,0,224,128ZM102.63,63.76c9.67-6.44,19-12.68,25.37-20,6.34,7.35,15.7,13.59,25.37,20,20,13.32,42.48,28.29,46.11,56.24h-143C60.15,92.05,82.6,77.08,102.63,63.76ZM24,152a8,8,0,0,1,16,0v48H24Zm136,0a24,24,0,0,0-24,24v24H120V176a24,24,0,0,0-48,0v24H56V136H200v64H184V176A24,24,0,0,0,160,152Zm72,48H216V152a8,8,0,0,1,16,0Z",
  "megaphone": "M248,120a48.05,48.05,0,0,0-48-48H160.2c-2.91-.17-53.62-3.74-101.91-44.24A16,16,0,0,0,32,40V200a16,16,0,0,0,26.29,12.25c37.77-31.68,77-40.76,93.71-43.3v31.72A16,16,0,0,0,159.12,214l11,7.33A16,16,0,0,0,194.5,212l11.77-44.36A48.07,48.07,0,0,0,248,120ZM48,199.93V40h0c42.81,35.91,86.63,45,104,47.24v65.48C134.65,155,90.84,164.07,48,199.93Zm131,8,0,.11-11-7.33V168h21.6ZM200,152H168V88h32a32,32,0,1,1,0,64Z",
  "star-and-crescent": "M155.64,199.28a80,80,0,0,1,0-142.56,8,8,0,0,0,0-14.25A94.93,94.93,0,0,0,112,32a96,96,0,0,0,0,192,94.93,94.93,0,0,0,43.64-10.47,8,8,0,0,0,0-14.25ZM112,208A80,80,0,1,1,134.4,51.16a96.08,96.08,0,0,0,0,153.68A79.82,79.82,0,0,1,112,208Zm139.17-87.35-26.5-11.43-2.31-29.84a8,8,0,0,0-14.14-4.47L189.63,97.42l-27.71-6.85a8,8,0,0,0-8.81,11.82L168.18,128l-15.07,25.61a8,8,0,0,0,8.81,11.82l27.71-6.85,18.59,22.51a8,8,0,0,0,14.14-4.47l2.31-29.84,26.5-11.43a8,8,0,0,0,0-14.7ZM213.89,134a8,8,0,0,0-4.8,6.73l-1.15,14.89-9.18-11.11a8,8,0,0,0-6.17-2.91,8.4,8.4,0,0,0-1.92.23l-14.12,3.5,7.81-13.27a8,8,0,0,0,0-8.12l-7.81-13.27,14.12,3.5a8,8,0,0,0,8.09-2.68l9.18-11.11,1.15,14.89a8,8,0,0,0,4.8,6.73l13.92,6Z",
  "device-mobile": "M176,16H80A24,24,0,0,0,56,40V216a24,24,0,0,0,24,24h96a24,24,0,0,0,24-24V40A24,24,0,0,0,176,16ZM72,64H184V192H72Zm8-32h96a8,8,0,0,1,8,8v8H72V40A8,8,0,0,1,80,32Zm96,192H80a8,8,0,0,1-8-8v-8H184v8A8,8,0,0,1,176,224Z",
  "users-three": "M244.8,150.4a8,8,0,0,1-11.2-1.6A51.6,51.6,0,0,0,192,128a8,8,0,0,1-7.37-4.89,8,8,0,0,1,0-6.22A8,8,0,0,1,192,112a24,24,0,1,0-23.24-30,8,8,0,1,1-15.5-4A40,40,0,1,1,219,117.51a67.94,67.94,0,0,1,27.43,21.68A8,8,0,0,1,244.8,150.4ZM190.92,212a8,8,0,1,1-13.84,8,57,57,0,0,0-98.16,0,8,8,0,1,1-13.84-8,72.06,72.06,0,0,1,33.74-29.92,48,48,0,1,1,58.36,0A72.06,72.06,0,0,1,190.92,212ZM128,176a32,32,0,1,0-32-32A32,32,0,0,0,128,176ZM72,120a8,8,0,0,0-8-8A24,24,0,1,1,87.24,82a8,8,0,1,0,15.5-4A40,40,0,1,0,37,117.51,67.94,67.94,0,0,0,9.6,139.19a8,8,0,1,0,12.8,9.61A51.6,51.6,0,0,1,64,128,8,8,0,0,0,72,120Z",
  "hand-palm": "M188,88a27.75,27.75,0,0,0-12,2.71V60a28,28,0,0,0-41.36-24.6A28,28,0,0,0,80,44v6.71A27.75,27.75,0,0,0,68,48,28,28,0,0,0,40,76v76a88,88,0,0,0,176,0V116A28,28,0,0,0,188,88Zm12,64a72,72,0,0,1-144,0V76a12,12,0,0,1,24,0v44a8,8,0,0,0,16,0V44a12,12,0,0,1,24,0v68a8,8,0,0,0,16,0V60a12,12,0,0,1,24,0v68.67A48.08,48.08,0,0,0,120,176a8,8,0,0,0,16,0,32,32,0,0,1,32-32,8,8,0,0,0,8-8V116a12,12,0,0,1,24,0Z",
  "book-open": "M232,48H160a40,40,0,0,0-32,16A40,40,0,0,0,96,48H24a8,8,0,0,0-8,8V200a8,8,0,0,0,8,8H96a24,24,0,0,1,24,24,8,8,0,0,0,16,0,24,24,0,0,1,24-24h72a8,8,0,0,0,8-8V56A8,8,0,0,0,232,48ZM96,192H32V64H96a24,24,0,0,1,24,24V200A39.81,39.81,0,0,0,96,192Zm128,0H160a39.81,39.81,0,0,0-24,8V88a24,24,0,0,1,24-24h64Z",
  "heart": "M178,40c-20.65,0-38.73,8.88-50,23.89C116.73,48.88,98.65,40,78,40a62.07,62.07,0,0,0-62,62c0,70,103.79,126.66,108.21,129a8,8,0,0,0,7.58,0C136.21,228.66,240,172,240,102A62.07,62.07,0,0,0,178,40ZM128,214.8C109.74,204.16,32,155.69,32,102A46.06,46.06,0,0,1,78,56c19.45,0,35.78,10.36,42.6,27a8,8,0,0,0,14.8,0c6.82-16.67,23.15-27,42.6-27a46.06,46.06,0,0,1,46,46C224,155.61,146.24,204.15,128,214.8Z",
  "map-pin": "M128,64a40,40,0,1,0,40,40A40,40,0,0,0,128,64Zm0,64a24,24,0,1,1,24-24A24,24,0,0,1,128,128Zm0-112a88.1,88.1,0,0,0-88,88c0,31.4,14.51,64.68,42,96.25a254.19,254.19,0,0,0,41.45,38.3,8,8,0,0,0,9.18,0A254.19,254.19,0,0,0,174,200.25c27.45-31.57,42-64.85,42-96.25A88.1,88.1,0,0,0,128,16Zm0,206c-16.53-13-72-60.75-72-118a72,72,0,0,1,144,0C200,161.23,144.53,209,128,222Z",
  "clock": "M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm64-88a8,8,0,0,1-8,8H128a8,8,0,0,1-8-8V72a8,8,0,0,1,16,0v48h48A8,8,0,0,1,192,128Z",
};

const HORIZON = ['M24 192H232', 'M72 192a56 56 0 0 1 112 0'];
const ARROWS = { sunrise: 'M128 76V24M100 52l28-28 28 28', sunset: 'M128 24V76M100 48l28 28 28-28' };

const PRAYER_GLYPH = {
  fajr: 'moon-stars',
  fajr_endtime: 'sunrise',
  duhr: 'sun',
  asr: 'cloud-sun',
  maghrib: 'sunset',
  isha: 'moon',
};

const PRAYER_LABEL = {
  fajr: 'Fajr',
  fajr_endtime: 'Fajr slutter',
  duhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
};

const ORDER = ['fajr', 'fajr_endtime', 'duhr', 'asr', 'maghrib', 'isha'];

const DEMO_PRAYERS = [
  { name: 'fajr', azan: '06:18', iqamah: '07:00' },
  { name: 'fajr_endtime', azan: '08:35', iqamah: null },
  { name: 'duhr', azan: '12:09', iqamah: '13:00' },
  { name: 'asr', azan: '13:40', iqamah: '13:50' },
  { name: 'maghrib', azan: '15:36', iqamah: '15:37' },
  { name: 'isha', azan: '17:42', iqamah: '18:15' },
];

const HIJRI_MONTHS = [
  'Muharram',
  'Safar',
  'Rabi al-Awal',
  'Rabi at-thani',
  'Jumadi al-Awwal',
  'Jumadi al-Thani',
  'Rajab',
  "Sha'ban",
  'Ramadan',
  'Shawwal',
  'Dhul Qa’da',
  'Dhul-hijja',
];

const WEEKDAYS = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
const MONTHS = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'];

const ARABIC = {
  Amiri: { family: "'Amiri'", size: 58, solo: 76, line: 1.75 },
  ScheherazadeNew: { family: "'Scheherazade New'", size: 62, solo: 80, line: 1.75 },
  NotoNaskhArabic: { family: "'Noto Naskh Arabic'", size: 50, solo: 66, line: 1.9 },
  ReemKufi: { family: "'Reem Kufi'", size: 52, solo: 68, line: 1.8 },
  ArefRuqaa: { family: "'Aref Ruqaa'", size: 56, solo: 72, line: 1.8 },
  NotoNastaliqUrdu: { family: "'Noto Nastaliq Urdu'", size: 42, solo: 54, line: 2.5 },
};

const DUA_AR =
  'سُبْحَانَ ذِي الْمُلْكِ وَالْمَلَكُوتِ، سُبْحَانَ ذِي الْعِزَّةِ وَالْعَظَمَةِ وَالْهَيْبَةِ وَالْقُدْرَةِ وَالْكِبْرِيَاءِ وَالْجَبَرُوتِ، سُبْحَانَ الْمَلِكِ الْحَيِّ الَّذِي لَا يَنَامُ وَلَا يَمُوتُ، سُبُّوحٌ قُدُّوسٌ رَبُّنَا وَرَبُّ الْمَلَائِكَةِ وَالرُّوحِ، اللَّهُمَّ أَجِرْنَا مِنَ النَّارِ، ';
const DUA_AR_END = 'يَا مُجِيرُ يَا مُجِيرُ يَا مُجِيرُ';
const DUA_NB =
  'Ære være Ham som eier riket og herredømmet. Ære være Ham som har makten, storheten, ærefrykten, kraften, høyheten og overmakten. Ære være Kongen, Den Levende, som verken sover eller dør. Høylovet og hellig er vår Herre, englenes og Åndens Herre. Å Allah, bevar oss fra Ilden. Du som verner, Du som verner, Du som verner.';

const PATH8 = 'M20 20H60V60H20Z M40 11.7L68.3 40L40 68.3L11.7 40Z M0 0L20 20M80 0L60 20M0 80L20 60M80 80L60 60';

const MOSQUE_ART = [
  'M20 388H580',
  'M150 388V244H450V388',
  'M184 244H416',
  'M204 244C204 168 252 132 300 104C348 132 396 168 396 244',
  'M300 104V74',
  'M306 50a14 14 0 1 0 0 22a11 11 0 1 1 0-22Z',
  'M206 388V318a30 30 0 0 1 60 0V388',
  'M270 388V304a30 30 0 0 1 60 0V388',
  'M334 388V318a30 30 0 0 1 60 0V388',
  'M78 388V172M122 388V172M68 212H132M78 172L100 116L122 172M100 116V90',
  'M478 388V172M522 388V172M468 212H532M478 172L500 116L522 172M500 116V90',
  'M184 290H150M416 290H450',
];

const ART = {
  mosque: MOSQUE_ART,
  kaaba: [
    'M60 388H540',
    'M140 130L300 92L460 130L300 168Z',
    'M140 130V330L300 372V168M460 130V330L300 372',
    'M140 178L300 218L460 178M140 202L300 242L460 202',
    'M384 330V262L424 252V320',
  ],
  lantern: [
    'M300 38V62',
    'M246 108C246 80 274 62 300 62C326 62 354 80 354 108',
    'M232 108H368',
    'M248 108L228 140V284L250 316H350L372 284V140L352 108',
    'M228 140H372M228 284H372',
    'M272 262V196a28 28 0 0 1 56 0V262Z',
    'M300 168V156',
    'M262 316L282 350H318L338 316',
    'M300 350V376',
  ],
  moon: [
    'M330 56A156 156 0 1 0 486 268A126 126 0 1 1 330 56Z',
    'M470 76Q476.48 105.52 506 112Q476.48 118.48 470 148Q463.52 118.48 434 112Q463.52 105.52 470 76Z',
    'M540 192Q543.96 210.04 562 214Q543.96 217.96 540 236Q536.04 217.96 518 214Q536.04 210.04 540 192Z',
    'M412 24Q414.88 37.12 428 40Q414.88 42.88 412 56Q409.12 42.88 396 40Q409.12 37.12 412 24Z',
  ],
};

const MINUTE = 60000;
const DAY = 86400000;
const TARAWEEH_RAKAT = 20;

let patternSeq = 0;

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const capital = (value) => value.charAt(0).toUpperCase() + value.slice(1);
const pad2 = (n) => String(n).padStart(2, '0');
const clockOf = (date) => (date && !Number.isNaN(date.getTime()) ? `${pad2(date.getHours())}:${pad2(date.getMinutes())}` : '');
const shortDate = (date) => `${date.getDate()}. ${MONTHS[date.getMonth()]}`;
const dateOf = (date) => `${capital(WEEKDAYS[date.getDay()])} ${shortDate(date)}`;
const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const dayDiff = (a, b) => Math.round((startOfDay(a) - startOfDay(b)) / DAY);

function durationShort(ms) {
  const total = Math.max(0, Math.round(ms / MINUTE));
  const hours = Math.floor(total / 60);
  return hours > 0 ? `${hours}t ${total % 60}m` : `${total % 60}m`;
}

const inText = (now, target) => `om ${durationShort(target.getTime() - now.getTime())}`;

function initialsOf(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => [...word][0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function tabularHijri(date) {
  const jd = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY) + 2440588;
  const l0 = jd - 1948440 + 10632;
  const n = Math.floor((l0 - 1) / 10631);
  const l1 = l0 - 10631 * n + 354;
  const j =
    Math.floor((10985 - l1) / 5316) * Math.floor((50 * l1) / 17719) +
    Math.floor(l1 / 5670) * Math.floor((43 * l1) / 15238);
  const l2 =
    l1 -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l2) / 709);
  return { day: l2 - Math.floor((709 * month) / 24), month, year: 30 * n + j - 30 };
}

function shiftHijri(hijri, days) {
  let { day, month, year } = hijri;
  day += days;
  const length = (m) => (m % 2 === 1 ? 30 : 29);
  while (day > length(month)) {
    day -= length(month);
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  while (day < 1) {
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    day += length(month);
  }
  return { day, month, year };
}

const formatHijri = (h) => (h ? `${h.day}. ${HIJRI_MONTHS[h.month - 1] ?? ''} ${h.year}` : null);

function clockAt(base, offset, value) {
  if (typeof value !== 'string') return null;
  const [h, m] = value.split(':').map(Number);
  if ([h, m].some(Number.isNaN)) return null;
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset, h, m);
}

function buildModel(ctx, now) {
  const source = ctx.day && Array.isArray(ctx.day.prayers) && ctx.day.prayers.length ? ctx.day : null;
  const raw = source ? source.prayers : DEMO_PRAYERS;
  const base = ctx.now;
  const offset = dayDiff(now, base);
  const dayOf = (shift) => ({
    date: new Date(base.getFullYear(), base.getMonth(), base.getDate() + offset + shift, 12),
    prayers: ORDER.map((name) => raw.find((p) => p.name === name))
      .filter((p) => p && clockAt(base, 0, p.azan))
      .map((p) => {
        const iqamah = p.name === 'fajr_endtime' || p.iqamah === '00:00' ? null : clockAt(base, offset + shift, p.iqamah);
        return {
          name: p.name,
          label: PRAYER_LABEL[p.name],
          isPrayer: p.name !== 'fajr_endtime',
          azan: clockAt(base, offset + shift, p.azan),
          iqamah,
        };
      }),
  });
  const baseHijri = source ? source.hijri : tabularHijri(base);
  return {
    now,
    yesterday: dayOf(-1),
    today: dayOf(0),
    tomorrow: dayOf(1),
    hijri: baseHijri ? formatHijri(shiftHijri(baseHijri, offset)) : null,
    jumuah: source ? source.jumuah : '13:00',
  };
}

const find = (day, name) => day?.prayers.find((p) => p.name === name) ?? null;
const prayersOf = (day) => day.prayers.filter((p) => p.isPrayer);
const shown = (p) => p.iqamah ?? p.azan;
const withoutFajrEnd = (prayers) => prayers.filter((p) => p.name !== 'fajr_endtime');

function nowAndNext(m) {
  const now = m.now.getTime();
  const prayers = prayersOf(m.today);
  const next = prayers.find((p) => p.azan.getTime() > now) ?? null;
  const passed = prayers.filter((p) => p.azan.getTime() <= now);
  let current = passed[passed.length - 1] ?? find(m.yesterday, 'isha');
  const sunrise = find(m.today, 'fajr_endtime');
  if (current?.name === 'fajr' && sunrise && now >= sunrise.azan.getTime()) current = null;
  if (next) return { current, next, nextIsTomorrow: false };
  return { current, next: find(m.tomorrow, 'fajr'), nextIsTomorrow: true };
}

function heroOf(m) {
  const { now } = m;
  const { current, next } = nowAndNext(m);
  const timeLine = (p) => (p.iqamah ? `Iqamah ${clockOf(p.iqamah)} · azan ${clockOf(p.azan)}` : `Azan ${clockOf(p.azan)}`);
  if (current) {
    const waiting = current.iqamah && now < current.iqamah;
    return {
      label: 'Nåværende bønn',
      icon: PRAYER_GLYPH[current.name],
      name: current.label,
      line: timeLine(current),
      pill: waiting ? `Iqamah ${inText(now, current.iqamah)}` : next ? `${next.label} ${inText(now, next.azan)}` : '',
    };
  }
  return {
    label: 'Neste bønn',
    icon: next ? PRAYER_GLYPH[next.name] : 'clock',
    name: next?.label ?? '',
    line: next ? timeLine(next) : '',
    pill: next ? `Azan ${inText(now, next.azan)}` : '',
  };
}

function charWidth(c) {
  if (c === ' ') return 0.26;
  if ("iljI|!.,:;'’".includes(c)) return 0.27;
  if ('ftr()[]"-'.includes(c)) return 0.37;
  if ('mwMWÆæ'.includes(c)) return 0.86;
  if (c >= '0' && c <= '9') return 0.6;
  if (c !== c.toLowerCase()) return 0.68;
  return 0.55;
}

function textWidth(text, size, weight, spacing) {
  const chars = [...text];
  const factor = weight >= 800 ? 1.1 : weight >= 700 ? 1.07 : weight >= 600 ? 1.04 : 1;
  return chars.reduce((sum, c) => sum + charWidth(c), 0) * size * factor + spacing * chars.length;
}

function fitted({ text, size, line, weight = 400, spacing = 0, avail, lines }) {
  let scale = 1;
  for (; scale > 0.5; scale -= 0.02) {
    const width = textWidth(text, size * scale, weight, spacing);
    if (lines === 1 ? width <= avail : Math.ceil(width / (avail * 0.7)) <= lines) break;
  }
  scale = Math.max(scale, 0.5);
  const parts = [`font-size:${(size * scale).toFixed(1)}px`];
  if (line) parts.push(`line-height:${line}px`);
  if (spacing) parts.push(`letter-spacing:${spacing}px`);
  parts.push(lines === 1 ? 'white-space:nowrap' : `-webkit-line-clamp:${lines}`);
  return parts.join(';');
}

function glyph(name, size, color) {
  const box = `width="${size}" height="${size}" viewBox="0 0 256 256"`;
  if (name === 'sunrise' || name === 'sunset') {
    const d = [...HORIZON, ARROWS[name]].join(' ');
    return `<svg class="g" ${box}><path d="${d}" fill="none" stroke="${color}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  }
  return `<svg class="g" ${box}><path d="${ICON_PATHS[name]}" fill="${color}"/></svg>`;
}

function pattern(color, opacity, size, cls = '') {
  patternSeq += 1;
  const id = `tvp${patternSeq}`;
  const scale = size / 80;
  return `<svg class="pat ${cls}" width="100%" height="100%" aria-hidden="true"><defs><pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse"><path d="${PATH8}" transform="scale(${scale})" fill="none" stroke="${color}" stroke-width="${2 / scale}" opacity="${opacity}"/></pattern></defs><rect width="100%" height="100%" fill="url(#${id})"/></svg>`;
}

function art(kind, width, color) {
  if (!ART[kind]) return '';
  const stroke = `fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`;
  const circle = kind === 'lantern' ? `<circle cx="300" cy="26" r="12" ${stroke}/>` : '';
  const paths = ART[kind].map((d) => `<path d="${d}" ${stroke}/>`).join('');
  return `<svg width="${width}" height="${(width * 400) / 600}" viewBox="0 0 600 400">${circle}${paths}</svg>`;
}

function qr(value, size) {
  const count = 29;
  let seed = 2166136261;
  for (const c of String(value)) seed = Math.imul(seed ^ c.charCodeAt(0), 16777619);
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const finders = [
    [0, 0],
    [count - 7, 0],
    [0, count - 7],
  ];
  const inFinder = (r, c) => finders.some(([fr, fc]) => r >= fr - 1 && r <= fr + 7 && c >= fc - 1 && c <= fc + 7);
  const inAlign = (r, c) => r >= count - 9 && r <= count - 5 && c >= count - 9 && c <= count - 5;
  let d = '';
  for (const [fr, fc] of finders) {
    d += `M${fc} ${fr}h7v7h-7zM${fc + 1} ${fr + 1}v5h5v-5zM${fc + 2} ${fr + 2}h3v3h-3z`;
  }
  const a = count - 9;
  d += `M${a} ${a}h5v5h-5zM${a + 1} ${a + 1}v3h3v-3zM${a + 2} ${a + 2}h1v1h-1z`;
  for (let r = 0; r < count; r += 1) {
    for (let c = 0; c < count; c += 1) {
      if (inFinder(r, c) || inAlign(r, c)) continue;
      const on = r === 6 || c === 6 ? (r + c) % 2 === 0 : random() < 0.5;
      if (on) d += `M${c} ${r}h1v1h-1z`;
    }
  }
  return `<svg class="qr" width="${size}" height="${size}" viewBox="-2 -2 ${count + 4} ${count + 4}" shape-rendering="crispEdges"><rect x="-2" y="-2" width="${count + 4}" height="${count + 4}" fill="#FFFFFF"/><path d="${d}" fill="${INK.text}" fill-rule="evenodd"/></svg>`;
}

const t = (cls, html, style = '') => `<p class="${cls}"${style ? ` style="${style}"` : ''}>${html}</p>`;
const b = (color, html) => `<b style="color:${color}">${html}</b>`;

function header(c, { line, clock, dark, logoStyle = '', logoColor, nameStyle = '', lineStyle = '', clockStyle = '', logoSize = 96, nameSize = 44, clockSize = 112, avail = 1760 }) {
  const clockWidth = clock ? textWidth(clock, clockSize, 300, clockSize * -0.03) + 48 : 0;
  const nameAvail = avail - logoSize - 24 - clockWidth;
  const nameFit = fitted({ text: c.name, size: nameSize, line: nameSize + 6, weight: 700, spacing: -0.4, avail: nameAvail, lines: 1 });
  const nameColor = dark ? `color:${INK.mist100};` : '';
  const lineColor = dark ? `color:${INK.mist500};` : '';
  const clockColor = dark ? `color:${INK.mist100};` : '';
  return `<div class="hdr"><div class="lk"><div class="logo" style="background:${c.brand.b};${logoStyle}">${t('logo-t', esc(initialsOf(c.name)), logoColor ? `color:${logoColor}` : '')}</div><div class="shrink">${t('mn', esc(c.name), `${nameFit};${nameColor}${nameStyle}`)}${t('dt', line, `${lineColor}${lineStyle}`)}</div></div>${clock ? t('clk', clock, `${clockColor}${clockStyle}`) : ''}</div>`;
}

function label(icon, text, brand, { color, iconColor, size = 30, iconSize = 40 } = {}) {
  return `<div class="lbl">${glyph(icon, iconSize, iconColor ?? brand.b)}${t('lbl-t', esc(text), `font-size:${size}px;${color ? `color:${color}` : ''}`)}</div>`;
}

function pill(text, brand, { cls = '', textStyle = '', iconSize = 44 } = {}) {
  return `<div class="pill ${cls}" style="background:${brand.s}">${glyph('clock', iconSize, brand.d)}${t('pill-t', esc(text), `color:${brand.d};${textStyle}`)}</div>`;
}

function dateLine(c, m, dark = false, withHijri = true) {
  const hijri = withHijri ? m.hijri : null;
  return `${esc(dateOf(m.now))}${hijri ? ` · ${b(dark ? INK.gold400 : c.brand.d, esc(hijri))}` : ''}`;
}

function hijriFirst(m, color, rest) {
  return m.hijri ? `${b(color, esc(m.hijri))} · ${esc(rest)}` : esc(rest);
}

function prayerRows(prayers, current, brand) {
  const head = `<div class="ph">${t('ph-t grow', 'Bønn')}${t('ph-t col', 'Azan')}${t('ph-t col', 'Iqamah')}</div>`;
  const rows = prayers
    .map((p) => {
      const on = p.name === current;
      const onText = on ? `color:${brand.d}` : '';
      return `<div class="pr"${on ? ` style="background:${brand.s}"` : ''}><div class="grow pr-name">${glyph(PRAYER_GLYPH[p.name], 40, on ? brand.b : INK.muted)}${t('pr-t', p.label, on ? `font-weight:800;color:${brand.d}` : '')}</div>${t('pr-t col pr-muted', clockOf(p.azan), onText)}${t('pr-t col pr-bold', clockOf(p.iqamah), onText)}</div>`;
    })
    .join('');
  return `<div>${head}${rows}</div>`;
}

function timeline(prayers, now, brand) {
  const first = prayers[0]?.azan.getTime() ?? now.getTime();
  const last = prayers[prayers.length - 1]?.azan.getTime() ?? now.getTime();
  const lo = first - 65 * MINUTE;
  const hi = last + 70 * MINUTE;
  const at = (time) => Math.min(Math.max((time - lo) / (hi - lo), 0), 1) * 100;
  const nowX = at(now.getTime());
  const marks = prayers
    .map((p) => {
      const x = at(p.azan.getTime());
      const passed = x <= nowX;
      return `<div class="tlm" style="left:calc(${x}% - 12px);${passed ? `border-color:${brand.b};background:${brand.b}` : ''}"></div><div class="tlx" style="left:calc(${x}% - 110px)">${t('tlx-t', p.label)}${t('tlx-time', clockOf(p.azan))}</div>`;
    })
    .join('');
  return `<div class="tl"><div class="tlt"><div class="tlf" style="width:${nowX}%;background:${brand.b}"></div></div>${marks}<div class="tln" style="left:calc(${nowX}% - 24px);border-color:${brand.b}"></div></div>`;
}

function strip(items, brand) {
  return `<div class="strip">${items
    .map(
      (item) =>
        `<div class="strip-cell"${item.current ? ` style="background:${brand.s}"` : ''}>${glyph(item.icon, 44, item.current ? brand.b : INK.muted)}<div>${t('strip-l', item.label, item.current ? `color:${brand.d}` : '')}${t('strip-time', item.time, item.current ? `color:${brand.d}` : '')}</div></div>`,
    )
    .join('')}</div>`;
}

function stripOf(m, jumuah = false) {
  const current = nowAndNext(m).current;
  return prayersOf(m.today).map((p) => {
    if (jumuah && p.name === 'duhr') {
      const first = m.jumuahTimes?.[0];
      return { icon: 'mosque', label: 'Jumuah', time: clockOf(first ?? shown(p)), current: true };
    }
    return { icon: PRAYER_GLYPH[p.name], label: p.label, time: clockOf(shown(p)), current: !jumuah && p.name === current?.name };
  });
}

function vippsBox(c, size, text, cls = '') {
  if (!c.vipps) return '';
  return `<div class="vp ${cls}">${qr(c.vipps, size)}<div>${t('vp-l', esc(text))}${t('vp-n', esc(c.vipps), `color:${c.brand.b}`)}</div></div>`;
}

function root(id, inner, { style = '', pat = '' } = {}) {
  return `<div class="tv tv-${id}"${style ? ` style="${style}"` : ''}>${pat}${inner}</div>`;
}

function renderMain(c) {
  const m = buildModel(c, c.now);
  const brand = c.brand;
  const hero = heroOf(m);
  const current = nowAndNext(m).current;
  const note = !c.shows('main.note')
    ? null
    : c.announcement
      ? { title: c.announcement, sub: c.vipps ? `Vipps ${c.vipps}` : null }
      : c.vipps
        ? { title: 'Støtt moskeen', sub: `Vipps ${c.vipps}` }
        : null;
  const showTimeline = c.shows('main.timeline');
  const prayers = c.shows('main.fajrEnd') ? m.today.prayers : withoutFajrEnd(m.today.prayers);
  const heroCard = `<div class="card hero">${label(hero.icon, hero.label, brand)}${t('main-name', esc(hero.name), `color:${brand.b}`)}${t('main-line', esc(hero.line))}${hero.pill ? pill(hero.pill, brand, { cls: 'auto-top' }) : ''}</div>`;
  const rows = `<div class="card rows-card">${prayerRows(prayers, current?.name ?? null, brand)}</div>`;
  const tl = showTimeline ? `<div class="card tl-card">${timeline(prayersOf(m.today), m.now, brand)}</div>` : '';
  const annAvail = showTimeline ? 600 - 76 - 60 - 24 : 1760 - 76 - 60 - 24;
  const ann = note
    ? `<div class="ann${showTimeline ? '' : ' grow'}">${glyph('megaphone', 60, INK.gold600)}<div class="shrink">${t('ann-title', esc(note.title), fitted({ text: note.title, size: 28, line: 36, weight: 700, avail: annAvail, lines: 3 }))}${note.sub ? t('ann-sub', esc(note.sub)) : ''}</div></div>`
    : '';
  const bottom = tl || ann ? `<div class="bottom">${tl}${ann}</div>` : '';
  return root(
    'main',
    `${header(c, { line: dateLine(c, m, false, c.shows('main.hijri')), clock: clockOf(m.now) })}<div class="row">${heroCard}${rows}</div>${bottom}`,
    { pat: c.texture ? pattern(INK.mark, 0.45, 120) : '' },
  );
}

function renderLobby(c) {
  const m = buildModel(c, c.now);
  const brand = c.brand;
  const hero = heroOf(m);
  const current = nowAndNext(m).current;
  const announcement = c.shows('lobby.note') ? c.announcement : null;
  const nx = `<div class="card nx">${label(hero.icon, hero.label, brand)}${t('lobby-name', esc(hero.name), `color:${brand.b};${fitted({ text: hero.name, size: 132, line: 140, weight: 800, spacing: -5, avail: 516, lines: 1 })}`)}${hero.pill ? pill(hero.pill, brand, { textStyle: 'font-size:32px', iconSize: 36 }) : ''}</div>`;
  const mini = c.shows('lobby.times')
    ? `<div class="card mini">${prayersOf(m.today)
        .map((p) => {
          const on = p.name === current?.name;
          return `<div class="mr"${on ? ` style="background:${brand.s}"` : ''}>${glyph(PRAYER_GLYPH[p.name], 38, on ? brand.b : INK.muted)}${t('mr-t', p.label, on ? `font-weight:800;color:${brand.d}` : '')}${t('mr-t mr-time', clockOf(shown(p)), on ? `color:${brand.d}` : '')}</div>`;
        })
        .join('')}</div>`
    : '';
  const title = announcement || c.name;
  const post = `<div class="post" style="background:${brand.d}">${c.texture ? pattern(INK.white, 0.1, 120) : ''}<div class="tag" style="background:${brand.b}">${glyph(announcement ? 'megaphone' : 'star-and-crescent', 36, INK.white)}${t('tag-t', announcement ? 'Fra moskeen' : 'Velkommen')}</div>${t('post-title', esc(title), fitted({ text: title, size: 100, line: 104, weight: 800, spacing: -3, avail: 960, lines: 4 }))}<div class="post-foot">${c.shows('lobby.vipps') ? vippsBox(c, 160, 'Støtt med Vipps') : ''}</div></div>`;
  return root('lobby', `${header(c, { line: dateLine(c, m), clock: clockOf(m.now) })}<div class="row"><div class="side">${nx}${mini}</div>${post}</div>`);
}

function renderPlakat(c) {
  const m = buildModel(c, c.now);
  const brand = c.brand;
  const vipps = c.shows('plakat.vipps') ? c.vipps : null;
  const announcement = c.shows('plakat.note') ? c.announcement : null;
  const poster = announcement
    ? { kick: 'Kunngjøring', icon: 'megaphone', title: announcement }
    : vipps
      ? { kick: 'Støtt moskeen', icon: 'heart', title: 'Gi med Vipps' }
      : { kick: 'Velkommen', icon: 'star-and-crescent', title: c.name };
  const plWidth = 1920 - 192 - (vipps ? 520 + 72 : 0);
  const left = `<div class="pl"><div class="br"><div class="br-logo">${t('br-logo-t', esc(initialsOf(c.name)), `color:${brand.b}`)}</div>${t('br-name', esc(c.name), fitted({ text: c.name, size: 34, weight: 700, avail: plWidth - 92, lines: 1 }))}</div><div class="kick">${glyph(poster.icon, 44, brand.s)}${t('kick-t', poster.kick, `color:${brand.s}`)}</div>${t('pt1', esc(poster.title), fitted({ text: poster.title, size: 136, line: 134, weight: 800, spacing: -4.8, avail: plWidth, lines: 4 }))}</div>`;
  const qb = vipps ? `<div class="qb">${qr(vipps, 320)}${t('qb-title', 'Vipps')}${t('qb-n', esc(vipps), `color:${brand.b}`)}</div>` : '';
  const po = `<div class="po" style="background:${brand.b}">${c.texture ? pattern(INK.white, 0.14, 140, 'po-pat') : ''}${left}${qb}</div>`;
  const bar = `<div class="bar"><div class="grow">${strip(stripOf(m), brand)}</div>${t('bar-clock', clockOf(m.now))}</div>`;
  return `<div class="tv tv-plakat full">${po}${bar}</div>`;
}

function renderRad(c) {
  const m = buildModel(c, c.now);
  const brand = c.brand;
  const hero = heroOf(m);
  const current = nowAndNext(m).current;
  const top = `<div class="top2"><div class="art-bg">${art(c.art, 690, brand.t)}</div><div class="rad-text">${label(hero.icon, hero.label, brand)}${t('rad-name', esc(hero.name), `color:${brand.b};${fitted({ text: hero.name, size: 210, line: 200, weight: 800, spacing: -8.4, avail: 992, lines: 1 })}`)}${hero.pill ? pill(hero.pill, brand) : ''}</div><div class="big">${t('big-clock', clockOf(m.now))}${t('big-date', esc(dateOf(m.now)))}${m.hijri ? t('big-date bold', esc(m.hijri), `color:${brand.d}`) : ''}</div></div>`;
  const list = c.shows('rad.fajrEnd') ? m.today.prayers : withoutFajrEnd(m.today.prayers);
  const cards = `<div class="cards">${list
    .map((p) => {
      const on = p.name === current?.name;
      const fg = on ? brand.s : INK.muted;
      return `<div class="pc"${on ? ` style="background:${brand.b};border-color:${brand.b}"` : ''}>${glyph(PRAYER_GLYPH[p.name], 48, fg)}${t('pc-l', p.label, `color:${fg}`)}${t('pc-time', clockOf(shown(p)), on ? `color:${INK.white}` : '')}${t('pc-s', p.iqamah ? `Azan ${clockOf(p.azan)}` : '&nbsp;', `color:${fg}`)}</div>`;
    })
    .join('')}</div>`;
  const tl = c.shows('rad.timeline') ? `<div class="card rad-tl">${timeline(prayersOf(m.today), m.now, brand)}</div>` : '';
  return root('rad', `${header(c, { line: esc(c.hall) })}${top}${cards}${tl}`, {
    pat: c.texture ? pattern(INK.mark, 0.45, 120) : '',
  });
}

function iqamahTarget(c) {
  const probe = buildModel(c, c.now);
  const today = prayersOf(probe.today).find((p) => p.iqamah && p.iqamah > c.now);
  if (today) return { name: today.name, iqamah: today.iqamah };
  const tomorrow = prayersOf(probe.tomorrow).find((p) => p.iqamah);
  if (tomorrow) return { name: tomorrow.name, iqamah: tomorrow.iqamah };
  const fallback = find(probe.tomorrow, 'fajr') ?? prayersOf(probe.today)[0];
  return fallback ? { name: fallback.name, iqamah: new Date(fallback.azan.getTime() + 20 * MINUTE) } : null;
}

function renderIqamah(c) {
  const brand = c.brand;
  const lead = c.iqamahLead;
  const pick = iqamahTarget(c);
  const leftSeconds = lead * 60 - c.now.getSeconds();
  const now = pick ? new Date(pick.iqamah.getTime() - leftSeconds * 1000) : c.now;
  const m = buildModel(c, now);
  const target = pick ? find(m.today, pick.name) ?? { name: pick.name, label: PRAYER_LABEL[pick.name] } : null;
  const left = Math.max(0, leftSeconds * 1000);
  const seconds = Math.ceil(left / 1000);
  const countdown = `${pad2(Math.floor(seconds / 60))}:${pad2(seconds % 60)}`;
  const progress = 1 - Math.min(left / (lead * MINUTE), 1);
  const tips = [
    { icon: 'device-mobile', title: 'Skru av lyden på mobilen', sub: 'Takk for at du tar hensyn' },
    { icon: 'users-three', title: 'Rett radene', sub: 'Skulder mot skulder, fot mot fot' },
  ];
  const head = header(c, {
    line: esc(`${dateOf(now)}${target ? ` · ${target.label}` : ''}`),
    clock: clockOf(now),
    logoStyle: `background:${INK.white}`,
    logoColor: brand.b,
    nameStyle: `color:${INK.white}`,
    lineStyle: `color:${brand.t}`,
    clockStyle: `color:${INK.white}`,
  });
  const mid = `<div class="mid"><div class="lbl">${glyph(target ? PRAYER_GLYPH[target.name] : 'clock', 60, INK.white)}${t('iq-label', esc(`Iqamah ${target?.label ?? ''} om`), `color:${brand.s}`)}</div>${t('cd', countdown)}<div class="bar2" style="background:${brand.d}"><div class="bar2-fill" style="width:${progress * 100}%"></div></div></div>`;
  const tipRow = c.shows('iqamah.tips')
    ? `<div class="tips">${tips
        .map(
          (tip) =>
            `<div class="tip" style="background:${brand.d}"><div class="tip-icon">${glyph(tip.icon, 54, brand.b)}</div><div class="shrink">${t('tip-title', tip.title)}${t('tip-sub', tip.sub, `color:${brand.t}`)}</div></div>`,
        )
        .join('')}</div>`
    : '';
  return root('iqamah', `${head}${mid}${tipRow}`, {
    style: `background:${brand.b}`,
    pat: c.texture ? pattern(brand.d, 0.5, 160) : '',
  });
}

function renderJumuah(c) {
  const brand = c.brand;
  const probe = buildModel(c, c.now);
  const untilFriday = (5 - c.now.getDay() + 7) % 7;
  const friday = new Date(c.now.getFullYear(), c.now.getMonth(), c.now.getDate() + untilFriday);
  const jumuahTime = clockAt(friday, 0, probe.jumuah);
  const now = jumuahTime ? new Date(jumuahTime.getTime() - 45 * MINUTE) : new Date(friday.getFullYear(), friday.getMonth(), friday.getDate(), 12, 15);
  const m = buildModel(c, now);
  m.jumuahTimes = jumuahTime ? [jumuahTime] : [];
  const sessions = m.jumuahTimes;
  const upcoming = sessions.find((time) => time > now) ?? null;
  const vipps = c.shows('jumuah.vipps') ? c.vipps : null;
  const ses = sessions
    .map((time, index) => {
      const on = time === (upcoming ?? sessions[sessions.length - 1]);
      return `<div class="se"${on ? ` style="background:${brand.s};border-color:${brand.t}"` : ''}>${t('se-l', `${index + 1}. Jumuah`, on ? `color:${brand.d}` : '')}${t('se-time', clockOf(time), on ? `color:${brand.d}` : '')}</div>`;
    })
    .join('');
  const hero = `<div class="card hero" style="border-color:${brand.t}"><div class="jumuah-art">${art('mosque', 540, brand.t)}</div>${label('mosque', 'I dag', brand)}${t('jumuah-name', 'Jumuah', `color:${brand.b}`)}${t('main-line', upcoming ? `Khutbah ${inText(now, upcoming)}` : 'Jumuah mubarak')}<div class="ses">${ses}</div></div>`;
  const give = vipps
    ? `<div class="card give" style="background:${brand.b};border-color:${brand.b}">${t('give-title', 'Fredagsinnsamling')}<div class="give-qr">${qr(vipps, 280)}</div>${t('give-sub', 'Vipps til', `color:${brand.s}`)}${t('give-n', esc(vipps))}</div>`
    : '';
  return root(
    'jumuah',
    `${header(c, { line: dateLine(c, m), clock: clockOf(now) })}<div class="row">${hero}${give}</div><div class="card strip-card" style="border-color:${brand.t}">${strip(stripOf(m, true), brand)}</div>`,
    { style: `background:${brand.s}` },
  );
}

function renderDua(c) {
  const brand = c.brand;
  const probe = buildModel(c, c.now);
  const isha = find(probe.today, 'isha');
  const start = isha ? new Date(shown(isha).getTime() + 15 * MINUTE) : new Date(c.now.getFullYear(), c.now.getMonth(), c.now.getDate(), 20, 0);
  const now = new Date(start.getTime() + 18 * MINUTE);
  const m = buildModel(c, now);
  const pause = 1;
  const info = { pause, rakat: pause * 4, total: TARAWEEH_RAKAT };
  const font = ARABIC[c.duaFont] ?? ARABIC.Amiri;
  const fontSize = c.translation ? font.size : font.solo;
  const arabic = `font-family:${font.family},serif;font-size:${fontSize}px;line-height:${fontSize * font.line}px`;
  const next = info.rakat < info.total ? `rakat ${info.rakat + 1}-${info.rakat + 4}` : 'witr';
  const head = header(c, {
    line: hijriFirst(m, INK.gold400, 'Taraweeh'),
    clock: clockOf(now),
    dark: true,
    logoStyle: 'width:80px;height:80px;border-radius:24px',
    nameStyle: '',
    clockStyle: `font-size:88px;color:${INK.mist300}`,
    logoSize: 80,
    nameSize: 38,
    clockSize: 88,
  });
  const segs = Array.from({ length: info.total / 4 }, (_, index) => {
    const done = index < info.pause;
    const upcoming = index === info.pause;
    const color = done ? INK.mist300 : upcoming ? INK.gold400 : INK.mist500;
    const dots = [0, 1, 2, 3]
      .map(() => `<div class="dot" style="${done ? `background:${brand.m};border-color:${brand.m}` : upcoming ? `border-color:${INK.gold400}` : ''}"></div>`)
      .join('');
    return `<div class="sg" style="${done ? `background:${INK.night800};` : ''}${upcoming ? `border-color:${INK.gold400}` : ''}">${t('sg-t', `${index * 4 + 1}-${index * 4 + 4}`, `color:${color}`)}<div class="dots">${dots}</div></div>`;
  }).join('');
  const prog = `<div class="dua-prog"><div class="lbl">${glyph('hand-palm', 44, INK.gold400)}${t('dua-pause', `Pause etter ${info.rakat} av ${info.total} rakat`)}</div><div class="dua-segs">${segs}</div></div>`;
  const body = `<div class="dua">${c.texture ? pattern(INK.gold400, 0.07, 140) : ''}<p class="ar" dir="rtl" lang="ar" style="${arabic}">${DUA_AR}<span style="color:${INK.gold400}">${DUA_AR_END}</span></p>${c.translation ? t('no', DUA_NB) : ''}</div>`;
  const foot = `<div class="ft">${t('ft-t', `Neste: ${b(INK.mist100, next)}`)}</div>`;
  return root('dua', `${head}${prog}${body}${foot}`, { style: `background:${INK.night950}` });
}

function isNight(m) {
  const now = m.now.getTime();
  const fajr = find(m.today, 'fajr');
  if (fajr && now < fajr.azan.getTime()) return true;
  const isha = find(m.today, 'isha');
  if (!isha) return false;
  const after = isha.iqamah ? isha.iqamah.getTime() + 30 * MINUTE : isha.azan.getTime() + 60 * MINUTE;
  return now >= after;
}

function renderHvile(c) {
  const brand = c.brand;
  const probe = buildModel(c, c.now);
  let now = c.now;
  if (!isNight(probe)) {
    const fajr = find(probe.today, 'fajr');
    now = fajr ? new Date(fajr.azan.getTime() - 297 * MINUTE) : new Date(c.now.getFullYear(), c.now.getMonth(), c.now.getDate(), 1, 21);
  }
  const m = buildModel(c, now);
  const { current, next, nextIsTomorrow } = nowAndNext(m);
  const isha = current?.name === 'isha' ? current : find(m.today, 'isha');
  const nextDay = nextIsTomorrow ? m.tomorrow : m.today;
  const rows = nextDay?.prayers ?? [];
  const dayDate = nextDay ? nextDay.date : now;
  const ishaLabel = isha?.label ?? 'Isha';
  const head = header(c, {
    line: dateLine(c, m, true),
    dark: true,
    logoStyle: `background:${INK.night800};border:2px solid ${INK.night700}`,
    logoColor: INK.mist300,
    nameStyle: `color:${INK.mist300}`,
    avail: 1712,
  });
  const lft = `<div class="lft">${label('moon', `Nå · ${ishaLabel}`, brand, { color: INK.mist500, iconColor: brand.m })}${t('hvile-clock', clockOf(now))}${next ? t('hvile-next', esc(`${next.label} ${inText(now, next.azan)}`)) : ''}${next ? t('hvile-sub', esc(`${ishaLabel} varer til ${next.label} kl. ${clockOf(next.azan)}${next.iqamah ? ` · iqamah ${clockOf(next.iqamah)}` : ''}`)) : ''}</div>`;
  const nowRow = isha
    ? `<div class="hr" style="background:${brand.b}">${glyph('moon', 40, brand.s)}${t('hr-name', isha.label, `color:${INK.white}`)}${t('hr-small', next ? `til ${clockOf(next.azan)}` : '', `color:${brand.s}`)}${t('hr-time', clockOf(isha.azan), `color:${INK.white}`)}</div>`
    : '';
  const list = rows
    .map((p) => {
      const upcoming = p.name === 'fajr';
      return `<div class="hr"${upcoming ? ` style="background:${INK.night800};border-color:${brand.m}"` : ''}>${glyph(PRAYER_GLYPH[p.name], 40, upcoming ? brand.t : brand.m)}${t('hr-name', p.label)}${t('hr-small', p.iqamah ? clockOf(p.iqamah) : '')}${t('hr-time', clockOf(p.azan))}</div>`;
    })
    .join('');
  const lst = `<div class="card dark lst">${t('lh', 'Nå')}${nowRow}${t('lh lh-gap', esc(`${nextIsTomorrow ? 'I morgen' : 'I dag'}, ${WEEKDAYS[dayDate.getDay()]} ${shortDate(dayDate)}`))}${list}</div>`;
  return root('hvile', `${head}<div class="hvile-body">${lft}${lst}</div>${c.dim ? '<div class="dim"></div>' : ''}`, {
    style: `background:${INK.night950}`,
    pat: c.texture ? pattern(INK.mist100, 0.05, 120, 'hvile-pat') : '',
  });
}

const RENDER = {
  main: renderMain,
  lobby: renderLobby,
  plakat: renderPlakat,
  rad: renderRad,
  iqamah: renderIqamah,
  jumuah: renderJumuah,
  dua: renderDua,
  hvile: renderHvile,
};

function contextOf(ctx) {
  const config = ctx?.config ?? {};
  const mosque = ctx?.mosque ?? {};
  const now = ctx?.now instanceof Date && !Number.isNaN(ctx.now.getTime()) ? ctx.now : new Date();
  const hide = Array.isArray(config.hide) ? config.hide : [];
  const brandHex = BRANDS.includes(config.brand) ? config.brand : BRANDS[0];
  return {
    now,
    day: ctx?.day ?? null,
    name: String(mosque.name ?? '').trim() || 'Moskeen',
    announcement: String(mosque.announcement ?? '').trim() || null,
    vipps: String(mosque.vippsNumber ?? '').trim() || null,
    brand: brandColors(brandHex),
    texture: config.texture !== false,
    art: ART[config.art] || config.art === 'none' ? config.art : 'mosque',
    hall: String(config.hall ?? '').trim(),
    duaFont: ARABIC[config.duaFont] ? config.duaFont : 'Amiri',
    translation: config.translation !== false,
    dim: config.dim === true,
    iqamahLead: [5, 10, 15].includes(config.iqamahLead) ? config.iqamahLead : 10,
    shows: (key) => !hide.includes(key),
  };
}

export function renderScreen(id, ctx) {
  const render = RENDER[id] ?? RENDER.main;
  return render(contextOf(ctx));
}
