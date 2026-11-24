import { renderScreen } from './screens.js';

const BASES = ['main', 'lobby', 'plakat', 'rad', 'app'];
const AUTO = ['iqamah', 'jumuah', 'dua', 'hvile'];
const NAMES = { main: 'Bønnesal', lobby: 'Inngang', plakat: 'Reklameskjerm', rad: 'Sal 2', app: 'Last ned appen', iqamah: 'Iqamah', jumuah: 'Jumuah', dua: 'Taraweeh-dua', hvile: 'Natt' };
const WHEN = { iqamah: 'Før hver iqamah', jumuah: 'Fredager', dua: 'I ramadan', hvile: 'Fra Isha til Fajr' };
const DEFAULTS = {
  rotation: ['main'],
  seconds: 20,
  iqamahLead: 10,
  hide: [],
  dim: false,
  brand: '#0C6B52',
  art: 'mosque',
  duaFont: 'Amiri',
  translation: true,
  texture: true,
  hall: 'Kvinneavdelingen',
};
const SECONDS = [10, 20, 30, 60];
const BRANDS = [['#0C6B52', 'Grønn'], ['#1F4E8C', 'Blå'], ['#7A2E3B', 'Vinrød'], ['#4A3F8C', 'Lilla']];
const ARTS = [['mosque', 'Moské'], ['kaaba', 'Kaaba'], ['lantern', 'Lykt'], ['moon', 'Måne og stjerner'], ['none', 'Ingen']];
const HALLS = ['Hovedsalen', 'Kvinneavdelingen', 'Sal 2', 'Ungdomssalen', 'Kafeen'].map((h) => [h, h]);
const FONTS = [
  ['Amiri', 'Amiri', 'Amiri'],
  ['ScheherazadeNew', 'Scheherazade', 'Scheherazade New'],
  ['NotoNaskhArabic', 'Naskh', 'Noto Naskh Arabic'],
  ['ReemKufi', 'Kufi', 'Reem Kufi'],
  ['ArefRuqaa', 'Ruqaa', 'Aref Ruqaa'],
  ['NotoNastaliqUrdu', 'Nastaliq', 'Noto Nastaliq Urdu'],
];
const LEADS = [[5, '5 min'], [10, '10 min'], [15, '15 min']];
const OPTIONS = {
  main: [['hide', 'main.fajrEnd', 'Fajr slutter'], ['hide', 'main.timeline', 'Tidslinje'], ['hide', 'main.note', 'Kunngjøring og Vipps'], ['hide', 'main.hijri', 'Hijri-dato'], ['hide', 'main.app', 'QR-kode for appen']],
  lobby: [['hide', 'lobby.times', 'Dagens tider'], ['hide', 'lobby.note', 'Kunngjøring'], ['hide', 'lobby.vipps', 'Vipps-kode']],
  plakat: [['hide', 'plakat.note', 'Kunngjøring'], ['hide', 'plakat.vipps', 'Vipps-kode']],
  rad: [['chips', 'hall', 'Rom', HALLS], ['chips', 'art', 'Tegning', ARTS], ['hide', 'rad.fajrEnd', 'Fajr slutter'], ['hide', 'rad.timeline', 'Tidslinje']],
  iqamah: [['chips', 'iqamahLead', 'Nedtelling starter', LEADS], ['hide', 'iqamah.tips', 'Påminnelser']],
  jumuah: [['hide', 'jumuah.vipps', 'Vipps-kode']],
  dua: [['fonts', 'duaFont', 'Arabisk skrift', FONTS], ['flag', 'translation', 'Norsk oversettelse']],
  hvile: [['flag', 'dim', 'Demp skjermen']],
};
const ICON = {
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  play: '<path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/>',
  stop: '<rect x="6.5" y="6.5" width="11" height="11" rx="1.5" fill="currentColor"/>',
  expand: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M16 16l4 4"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5.5M12 16.5v.01"/>',
};
const icon = (name, size = 20) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;

const [id, secret] = location.hash.slice(1).split('.');
const $ = (selector) => document.querySelector(selector);
const app = $('#app');
const sheet = $('#sheet');
const full = $('#full');

const state = {
  config: null,
  mosques: [],
  live: null,
  selected: 'main',
  query: '',
  save: 'idle',
  note: '',
  playing: false,
  playIndex: 0,
  playStarted: 0,
};
let saveTimer = null;
let playTimer = null;
let dirty = false;

function esc(text) {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
function place(name) {
  return String(name ?? '')
    .toLowerCase()
    .replace(/(^|[\s-])(\p{L})/gu, (m, gap, letter) => gap + letter.toUpperCase())
    .replace(/ (I|Og|På) /g, (w) => w.toLowerCase());
}
function where(m) {
  return [m.address, place(m.city)].filter(Boolean).join(', ');
}
async function post(path, body) {
  const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) throw new Error(String(res.status));
  return res.json();
}

const cfg = () => ({ ...DEFAULTS, ...state.config });
const rotation = () => (state.config.rotation?.length ? state.config.rotation : DEFAULTS.rotation);
const shownScreen = () => (state.playing ? rotation()[state.playIndex % rotation().length] : state.selected);
const currentMosque = () => state.mosques.find((m) => m.orgNr === state.config.orgNr) ?? null;

function ctx() {
  const c = cfg();
  const mosque = currentMosque();
  return {
    now: new Date(),
    mosque: state.live?.mosque ?? { name: mosque?.name ?? 'Moskeen', announcement: null, vippsNumber: null },
    day: state.live?.day ?? null,
    config: {
      brand: c.brand,
      texture: c.texture,
      art: c.art,
      hall: c.hall,
      hide: c.hide,
      duaFont: c.duaFont,
      translation: c.translation,
      dim: c.dim,
      iqamahLead: c.iqamahLead,
    },
  };
}

function frame(screen, context, extra = '') {
  return `<div class="frame ${extra}" data-frame><div class="canvas">${renderScreen(screen, context)}</div></div>`;
}

const scaler = new ResizeObserver((entries) => {
  for (const entry of entries) entry.target.style.setProperty('--s', String(entry.contentRect.width / 1920));
});
function observeFrames(root) {
  root.querySelectorAll('[data-frame]').forEach((el) => scaler.observe(el));
}

async function save() {
  dirty = false;
  state.save = 'saving';
  renderStatus();
  try {
    const saved = await post('/api/save', { id, secret, source: 'phone', config: state.config });
    if (!dirty) {
      state.config = saved.config;
      state.save = 'saved';
    }
  } catch {
    state.save = 'error';
  }
  renderStatus();
}
function change(patch) {
  state.config = { ...state.config, ...patch };
  state.note = '';
  dirty = true;
  state.save = 'saving';
  clearTimeout(saveTimer);
  saveTimer = setTimeout(save, 500);
  render();
}

function stopPlay() {
  state.playing = false;
  clearTimeout(playTimer);
}
function startPlay() {
  state.playing = true;
  state.playIndex = Math.max(0, rotation().indexOf(state.selected));
  tick();
}
function tick() {
  clearTimeout(playTimer);
  state.playStarted = performance.now();
  renderStage();
  playTimer = setTimeout(() => {
    state.playIndex += 1;
    tick();
  }, cfg().seconds * 1000);
}

function statusHtml() {
  if (state.save === 'error') return `<button class="status err" data-act="retry">${icon('alert', 18)}Ikke lagret. Prøv igjen</button>`;
  if (state.save === 'saving') return '<span class="status">Lagrer</span>';
  if (state.save === 'saved') return `<span class="status ok">${icon('check', 18)}Lagret, vises på TV-en innen 30 sek</span>`;
  return '';
}
function renderStatus() {
  const el = $('#status');
  if (el) el.innerHTML = statusHtml();
}

function stageHtml() {
  const screen = shownScreen();
  const base = BASES.includes(screen);
  const off = base && !rotation().includes(screen);
  const multi = rotation().length > 1;
  const caption = state.playing
    ? `Rundgang ${(state.playIndex % rotation().length) + 1} av ${rotation().length}`
    : base
      ? off
        ? 'Ikke på rundgang'
        : multi
          ? `På rundgang, ${cfg().seconds} sek`
          : 'Vises hele tiden'
      : WHEN[screen];
  return `
    <div class="tv-shell ${off ? 'is-off' : ''}">
      ${frame(screen, ctx(), state.playing ? 'fade' : '')}
      ${state.playing ? `<div class="progress" style="--d:${cfg().seconds}s"><i></i></div>` : ''}
    </div>
    <div class="stage-bar">
      <div class="stage-title"><b>${NAMES[screen]}</b><span>${esc(caption)}</span></div>
      <div class="stage-actions">
        ${multi ? `<button class="tool ${state.playing ? 'on' : ''}" data-act="play" aria-pressed="${state.playing}">${icon(state.playing ? 'stop' : 'play', 18)}${state.playing ? 'Stopp' : 'Spill av'}</button>` : ''}
        <button class="tool icon-only" data-act="full" aria-label="Vis i fullskjerm">${icon('expand', 20)}</button>
      </div>
    </div>
    <div class="status-row" id="status" role="status" aria-live="polite">${statusHtml()}</div>`;
}
function renderStage() {
  const stage = $('#stage');
  if (!stage) return;
  stage.innerHTML = stageHtml();
  observeFrames(stage);
  if (full.open) renderFull();
}

function thumbHtml(screen, context) {
  const base = BASES.includes(screen);
  const on = base && rotation().includes(screen);
  const selected = state.selected === screen;
  return `<button class="thumb ${selected ? 'sel' : ''} ${base && !on ? 'off' : ''}" data-select="${screen}" aria-pressed="${selected}">
    <span class="thumb-img">${frame(screen, context)}${on ? `<span class="badge" aria-label="På rundgang">${icon('check', 14)}</span>` : ''}</span>
    <span class="thumb-name">${NAMES[screen]}</span>
  </button>`;
}
function stripHtml() {
  const context = ctx();
  return `
    <div class="strip" role="group" aria-label="Velg skjerm">
      <div class="group"><span class="group-label">Rundgang</span><div class="group-row">${BASES.map((s) => thumbHtml(s, context)).join('')}</div></div>
      <div class="group"><span class="group-label">Kommer av seg selv</span><div class="group-row">${AUTO.map((s) => thumbHtml(s, context)).join('')}</div></div>
    </div>`;
}

function switchHtml(attrs, on, label) {
  return `<button class="row" role="switch" aria-checked="${on}" ${attrs}><span class="row-label">${esc(label)}</span><span class="switch" aria-hidden="true"></span></button>`;
}
function chipsHtml(key, label, options, fonts = false) {
  const value = String(cfg()[key]);
  return `<div class="field"><span class="field-label" id="l-${key}">${esc(label)}</span>
    <div class="chips ${fonts ? 'fonts' : ''}" role="group" aria-labelledby="l-${key}">
      ${options
        .map(([v, name, family]) => {
          const on = String(v) === value;
          return fonts
            ? `<button class="chip font" data-chip="${key}" data-value="${esc(v)}" aria-pressed="${on}"><span class="ar" style="font-family:'${family}'" lang="ar">بسم الله</span><span>${esc(name)}</span></button>`
            : `<button class="chip" data-chip="${key}" data-value="${esc(v)}" aria-pressed="${on}">${esc(name)}</button>`;
        })
        .join('')}
    </div></div>`;
}
function panelHtml() {
  const screen = state.selected;
  const c = cfg();
  const base = BASES.includes(screen);
  const on = rotation().includes(screen);
  const opts = OPTIONS[screen];
  const fields = opts.filter(([kind]) => kind === 'chips' || kind === 'fonts');
  const toggles = opts.filter(([kind]) => kind === 'hide' || kind === 'flag');
  return `
    <section class="panel" aria-labelledby="panel-title">
      <header class="panel-head">
        <h2 id="panel-title">${NAMES[screen]}</h2>
        ${base ? '' : `<span class="when">${WHEN[screen]}</span>`}
      </header>
      ${base ? `<div class="list">${switchHtml(`data-rotate="${screen}"`, on, 'På rundgang')}</div>${state.note ? `<p class="note" role="alert">${icon('alert', 18)}${esc(state.note)}</p>` : ''}` : ''}
      ${fields.map(([kind, key, label, options]) => chipsHtml(key, label, options, kind === 'fonts')).join('')}
      ${toggles.length ? `<div class="field"><span class="field-label">${toggles.some(([k]) => k === 'hide') ? 'Vis på skjermen' : 'Valg'}</span><div class="list">
        ${toggles
          .map(([kind, key, label]) =>
            kind === 'hide' ? switchHtml(`data-hide="${key}"`, !c.hide.includes(key), label) : switchHtml(`data-flag="${key}"`, !!c[key], label),
          )
          .join('')}
      </div></div>` : ''}
    </section>`;
}
function globalHtml() {
  const c = cfg();
  return `
    <section class="panel" aria-labelledby="all-title">
      <header class="panel-head"><h2 id="all-title">Alle skjermer</h2></header>
      <div class="field"><span class="field-label" id="l-brand">Farge</span>
        <div class="swatches" role="group" aria-labelledby="l-brand">
          ${BRANDS.map(([hex, name]) => `<button class="swatch" data-brand="${hex}" aria-pressed="${c.brand === hex}"><span style="background:${hex}"></span>${name}</button>`).join('')}
        </div>
      </div>
      ${rotation().length > 1 ? `<div class="field"><span class="field-label" id="l-sec">Tid per skjerm på rundgang</span>
        <div class="seg" role="group" aria-labelledby="l-sec">${SECONDS.map((s) => `<button data-seconds="${s}" aria-pressed="${c.seconds === s}">${s} sek</button>`).join('')}</div>
      </div>` : ''}
      <div class="list">${switchHtml('data-flag="texture"', !!c.texture, 'Mønster i bakgrunnen')}</div>
    </section>`;
}
function headHtml() {
  const m = currentMosque();
  const name = state.live?.mosque?.name ?? m?.name ?? '';
  return `<div class="mosque">
      <div class="mosque-text"><span class="eyebrow">Skjermen i</span><b>${esc(name)}</b>${m ? `<span class="where">${icon('pin', 15)}${esc(where(m))}</span>` : ''}</div>
      <button class="tool" data-act="pick">Bytt moské</button>
    </div>`;
}

function focusKey() {
  const el = document.activeElement;
  if (!el || el === document.body || !app.contains(el)) return null;
  const attrs = [...el.attributes].filter((a) => a.name.startsWith('data-'));
  return attrs.length ? attrs.map((a) => `[${a.name}="${CSS.escape(a.value)}"]`).join('') : null;
}
function render() {
  if (!state.config) return;
  if (!state.config.orgNr) return renderPicker(app, true);
  const key = focusKey();
  const strip = $('.strip-wrap');
  const scroll = strip?.scrollLeft ?? 0;
  app.innerHTML = `
    <header class="top">${headHtml()}</header>
    <div class="layout">
      <div class="stage" id="stage">${stageHtml()}</div>
      <div class="controls">
        <div class="strip-wrap">${stripHtml()}</div>
        ${panelHtml()}
        ${globalHtml()}
      </div>
    </div>`;
  observeFrames(app);
  $('.strip-wrap').scrollLeft = scroll;
  if (key) app.querySelector(key)?.focus({ preventScroll: true });
}

function hitsFor(query) {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (!words.length) return [];
  return state.mosques.filter((m) => words.every((w) => `${m.name} ${m.city ?? ''} ${m.address ?? ''}`.toLowerCase().includes(w))).slice(0, 40);
}
function resultsHtml() {
  const hits = hitsFor(state.query);
  if (!state.query.trim()) return '';
  if (!hits.length) return '<p class="hint">Fant ingen moské. Prøv et sted eller en del av navnet.</p>';
  return `<ul class="results" role="list">${hits
    .map((m) => `<li><button data-org="${esc(m.orgNr)}" ${m.orgNr === state.config.orgNr ? 'aria-current="true"' : ''}><b>${esc(m.name)}</b><span>${esc(where(m))}</span>${m.orgNr === state.config.orgNr ? icon('check', 20) : ''}</button></li>`)
    .join('')}</ul>`;
}
function renderPicker(root, first) {
  root.innerHTML = `
    <div class="picker ${first ? 'first' : ''}">
      ${first ? '<h1>Hvilken moské står skjermen i?</h1>' : '<div class="sheet-head"><h2>Bytt moské</h2><button class="tool icon-only" data-act="close-sheet" aria-label="Lukk">' + icon('close', 20) + '</button></div>'}
      <label class="search">${icon('search', 20)}<input type="search" id="search" ${first ? '' : 'autofocus'} placeholder="Navn eller sted" value="${esc(state.query)}" autocomplete="off" enterkeyhint="search" aria-label="Søk etter moské"></label>
      <div id="results">${resultsHtml()}</div>
    </div>`;
  const input = root.querySelector('#search');
  input.addEventListener('input', () => {
    state.query = input.value;
    root.querySelector('#results').innerHTML = resultsHtml();
  });
  if (!first || matchMedia('(pointer: fine)').matches) input.focus();
}

function renderFull() {
  full.innerHTML = `<div class="full-wrap"><div class="full-tv">${frame(shownScreen(), ctx())}</div><button class="tool full-close" data-act="close-full">${icon('close', 20)}Lukk</button></div>`;
  observeFrames(full);
}

async function loadLive() {
  const org = state.config.orgNr;
  if (!org) return;
  try {
    const res = await fetch(`/api/preview?org=${encodeURIComponent(org)}`);
    if (res.ok && state.config.orgNr === org) {
      state.live = await res.json();
      render();
    }
  } catch {}
}

function pick(orgNr) {
  const first = !state.config.orgNr;
  state.query = '';
  state.live = null;
  if (sheet.open) sheet.close();
  change({ orgNr, configured: true });
  loadLive();
  if (first) window.scrollTo({ top: 0 });
}

function rotate(screen) {
  const rot = rotation();
  const on = rot.includes(screen);
  if (on && rot.length === 1) {
    state.note = 'Minst én skjerm må være på rundgang.';
    render();
    return;
  }
  stopPlay();
  change({ rotation: BASES.filter((b) => (b === screen ? !on : rot.includes(b))) });
}

document.addEventListener('click', (event) => {
  const b = event.target.closest('button');
  if (event.target === sheet) return sheet.close();
  if (!b) return;
  const act = b.dataset.act;
  if (act === 'retry') save();
  else if (act === 'pick') {
    state.query = '';
    renderPicker(sheet, false);
    sheet.showModal();
  } else if (act === 'close-sheet') sheet.close();
  else if (act === 'play') {
    if (state.playing) {
      stopPlay();
      renderStage();
    } else startPlay();
  } else if (act === 'full') {
    renderFull();
    full.showModal();
    full.requestFullscreen?.().then(() => screen.orientation?.lock?.('landscape')).catch(() => {});
  } else if (act === 'close-full') {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    full.close();
  } else if (b.dataset.org) pick(b.dataset.org);
  else if (b.dataset.select) {
    stopPlay();
    state.selected = b.dataset.select;
    state.note = '';
    render();
    b.blur();
    app.querySelector(`[data-select="${b.dataset.select}"]`)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  } else if (b.dataset.rotate) rotate(b.dataset.rotate);
  else if (b.dataset.hide) {
    const hide = new Set(cfg().hide);
    if (hide.has(b.dataset.hide)) hide.delete(b.dataset.hide);
    else hide.add(b.dataset.hide);
    change({ hide: [...hide] });
  } else if (b.dataset.flag) change({ [b.dataset.flag]: !cfg()[b.dataset.flag] });
  else if (b.dataset.chip) {
    const key = b.dataset.chip;
    change({ [key]: key === 'iqamahLead' ? Number(b.dataset.value) : b.dataset.value });
  } else if (b.dataset.seconds) {
    change({ seconds: Number(b.dataset.seconds) });
    if (state.playing) tick();
  } else if (b.dataset.brand) change({ brand: b.dataset.brand });
});
full.addEventListener('close', () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
});
document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement && full.open) full.close();
});
setInterval(() => {
  if (!state.playing) renderStage();
}, 30000);

function empty(title, text) {
  app.innerHTML = `<div class="empty"><h1>${esc(title)}</h1><p>${esc(text)}</p></div>`;
}
async function start() {
  if (!id || !secret) return empty('Skann koden på TV-en', 'Åpne innstillingene på TV-en og pek kameraet mot koden.');
  try {
    const [loaded, list] = await Promise.all([post('/api/load', { id, secret }), fetch('/api/mosques').then((r) => (r.ok ? r.json() : []))]);
    state.mosques = list.filter((m) => m.name);
    state.config = loaded.config ?? {};
    render();
    loadLive();
  } catch (error) {
    const gone = error.message === '403' || error.message === '404';
    empty(gone ? 'Koden virker ikke lenger' : 'Fikk ikke kontakt', gone ? 'Skann den nye koden på TV-en.' : 'Sjekk nettet og last siden på nytt.');
  }
}
start();
