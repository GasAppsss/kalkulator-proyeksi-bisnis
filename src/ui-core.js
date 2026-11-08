/* ===== ui-core: pembantu DOM, format angka, input, penyimpanan, status aplikasi ===== */
const App = {
  undo: null, undoTimer: 0,
  s: null, A: null, view: 'mulai', step: 0, refresh: null, simpanTimer: 0, toastTimer: 0,
  host: null, root: null, q: null, qContoh: false, adaData: false, tersimpan: 0, simpanGagal: false,
  kotor: false, belumDiunduh: false, tunda: false, outs: [], liveEl: null, targetCm: {}, ui: {},
};

/* ---------- lebar kontainer: tata letak baris dan kartu mengikuti lebar daftarnya, bukan lebar layar ---------- */
/* rows: kartu bila daftar selebar 738 px atau kurang (tabel bahan butuh 732 px), satu kolom penuh untuk isian yang berat (kelas w2) pada 479 px atau kurang, dan satu kolom untuk seluruh kartu pada 279 px atau kurang */
/* tkartu: tabel hasil yang berubah jadi kartu per baris (tiga kolom isi pada 738 px atau kurang, dua kolom pada 479 px atau kurang) */
const LEBAR = Object.assign(Object.create(null), { rows: [738, 479, 279], prod: [960, 520], cmp: [579], tkartu: [738, 479] });
const LEBAR_APP = [640, 900];
const _pantauLama = [];
/* kelas le-N dipasang bila lebar <= N dan baru dilepas setelah lebar melewati N + 24: tanpa jeda ini, munculnya bilah gulir halaman
   (yang menyempitkan lebar 15 px) bisa membuat tata letak bolak-balik tanpa henti tepat di dekat titik putus */
function pantauLebar(el, batas) {
  const terap = () => {
    const w = el.clientWidth;
    if (!w) return;
    batas.forEach((b) => el.classList.toggle('le-' + b, w <= (el.classList.contains('le-' + b) ? b + 24 : b)));
  };
  if (typeof ResizeObserver === 'function') new ResizeObserver(terap).observe(el);
  else { _pantauLama.push(terap); requestAnimationFrame(terap); }
  return el;
}
window.addEventListener('resize', () => _pantauLama.forEach((f) => f()));

/* ---------- gerak: lambat, hanya menjawab tindakan, dan mati bila pengguna meminta gerak dikurangi ---------- */
const gerakBoleh = () => { try { return !(typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches); } catch (e) { return true; } };
/* kelas animasi masuk dipasang lalu dilepas begitu selesai, jadi bisa dimainkan lagi pada perpindahan berikutnya */
function animasiMasuk(el, kelas) {
  if (!el) return;
  ['masuk-maju', 'masuk-mundur', 'masuk-naik'].forEach((k) => el.classList.remove(k));
  if (!gerakBoleh()) return;
  void el.offsetWidth; /* memaksa peramban menghitung gaya dulu agar animasi mulai dari awal */
  el.classList.add(kelas);
  const selesai = (e) => { if (e && e.target !== el) return; el.classList.remove(kelas); el.removeEventListener('animationend', selesai); };
  el.addEventListener('animationend', selesai);
  setTimeout(selesai, 1600);
}

/* ---------- DOM ---------- */
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const k of Object.keys(attrs)) {
      const v = attrs[k];
      if (v == null || v === false) continue;
      if (k === 'class') {
        el.className = v;
        const ks = String(v).split(' ');
        for (let j = 0; j < ks.length; j++) if (LEBAR[ks[j]]) pantauLebar(el, LEBAR[ks[j]]);
      } else if (k === 'id') el.id = pref(v);
      else if (k === 'for') el.setAttribute('for', pref(v));
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'text') el.textContent = v;
      else if (k in el && k !== 'list' && k !== 'form') el[k] = v;
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  kids.flat(Infinity).forEach((c) => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c))); });
  return el;
}
const SVGNS = 'http://www.w3.org/2000/svg';
function sv(tag, attrs, ...kids) {
  const el = document.createElementNS(SVGNS, tag);
  if (attrs) for (const k of Object.keys(attrs)) { if (attrs[k] != null && attrs[k] !== false) el.setAttribute(k, attrs[k]); }
  kids.flat(Infinity).forEach((c) => { if (c != null && c !== false) el.append(c.nodeType ? c : document.createTextNode(String(c))); });
  return el;
}

/* ---------- format angka (Indonesia) ---------- */
/* Peramban tertentu tidak membawa data bahasa Indonesia dan memakai pemisah Inggris; bila begitu pakai pemformat sendiri. */
const FORMAT_OK = (() => { try { return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(1234.5) === '1.234,5'; } catch (e) { return false; } })();
function formatManual(v, d) {
  const neg = v < 0;
  const p = Math.abs(v).toFixed(d).split('.');
  const pecah = (p[1] || '').replace(/0+$/, '');
  return (neg ? '-' : '') + p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (pecah ? ',' + pecah : '');
}
const nfCache = {};
function fDec(v, d = 1) {
  let t;
  if (FORMAT_OK) {
    const f = nfCache[d] || (nfCache[d] = new Intl.NumberFormat('id-ID', { maximumFractionDigits: d }));
    t = f.format(v);
  } else t = formatManual(v, d);
  return t.replace(/^-/, '−');
}
const fInt = (v) => fDec(Math.round(v), 0);
/* spasi tak terputus (U+00A0) antara "Rp" dan angka, dan antara angka dan satuannya, agar nominal tidak terpotong ke dua baris di kartu sempit */
const NB = '\u00A0';
const fRp = (v) => (Math.round(v) < 0 ? '−' : '') + 'Rp' + NB + fInt(Math.abs(v));
const fPct = (r, d = 1) => fDec(r * 100, d) + '%';
function fAx(v) {
  const a = Math.abs(v), sg = v < 0 ? '−' : '';
  if (a >= 1e12) return sg + fDec(a / 1e12, 1) + NB + 'T';
  if (a >= 1e9) return sg + fDec(a / 1e9, 1) + NB + 'M';
  if (a >= 1e6) return sg + fDec(a / 1e6, a >= 1e8 ? 0 : 1) + NB + 'jt';
  if (a >= 1e3) return sg + fDec(a / 1e3, 0) + NB + 'rb';
  return sg + fInt(a);
}
const fRpC = (v) => (v < 0 ? '−' : '') + 'Rp' + NB + fAx(Math.abs(v)).replace(/^−/, '');
function lama(m) {
  const t = Math.floor(m / 12), b = m % 12;
  if (t === 0) return b + NB + 'bulan';
  return t + NB + 'tahun' + (b ? ' ' + b + NB + 'bulan' : '');
}
function parseNum(str) {
  let t = String(str).trim().replace(/−/g, '-').replace(/[^\d.,-]/g, '');
  if (!t) return 0;
  const neg = t.startsWith('-');
  t = t.replace(/-/g, '');
  if (t.includes(',')) t = t.replace(/\./g, '').replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(t)) t = t.replace(/\./g, '');
  const v = parseFloat(t);
  return isFinite(v) ? (neg ? -v : v) : 0;
}
const css = (v) => 'var(--' + v + ')';
const pad2 = (x) => (x < 10 ? '0' : '') + x;
function fJam(ts) { const d = new Date(ts); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
function fTanggal(ts) {
  const d = new Date(ts);
  return d.getDate() + ' ' + KPB.BLN[d.getMonth()] + ' ' + d.getFullYear() + ', ' + fJam(ts);
}

/* ---------- status & ikon ---------- */
const IKON = {
  good: [['circle', { class: 'fill', cx: 7, cy: 7, r: 6.5 }], ['path', { d: 'M4 7.2l2.2 2.2L10.2 5', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }]],
  warn: [['path', { class: 'fill', d: 'M7 1.2L13.2 12.2H.8z' }], ['path', { d: 'M7 5v3.4M7 10.3v.1', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round' }]],
  serious: [['path', { class: 'fill', d: 'M7 .8L13.2 7 7 13.2.8 7z' }], ['path', { d: 'M7 4.2v3.2M7 9.3v.1', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.8, 'stroke-linecap': 'round' }]],
  crit: [['circle', { class: 'fill', cx: 7, cy: 7, r: 6.5 }], ['path', { d: 'M4.7 4.7l4.6 4.6M9.3 4.7l-4.6 4.6', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.7, 'stroke-linecap': 'round' }]],
};
const LEVEL_TEKS = { good: 'Sehat', warn: 'Cukup', serious: 'Tipis', crit: 'Bahaya' };
function chip(level, teks) {
  const ik = sv('svg', { viewBox: '0 0 14 14', 'aria-hidden': 'true' }, IKON[level].map((n) => sv(n[0], n[1])));
  return h('span', { class: 'chip lv-' + level }, ik, teks || LEVEL_TEKS[level]);
}

/* ---------- penyimpanan peramban (semua akses dibungkus agar aplikasi tetap jalan tanpa penyimpanan) ---------- */
const KUNCI = CFG.kunci + ':data';
const KUNCI_LAMA = 'kpb-v1';
const KUNCI_LANGKAH = CFG.kunci + ':langkah';
const KUNCI_CEPAT = CFG.kunci + ':cepat';
const KUNCI_RUSAK = CFG.kunci + ':rusak';
const Gudang = {
  ok: true,
  baca(k) { try { return localStorage.getItem(k); } catch (e) { Gudang.ok = false; return null; } },
  tulis(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { Gudang.ok = false; return false; } },
  hapus(k) { try { localStorage.removeItem(k); } catch (e) { /* abaikan */ } },
};

function simpan() {
  App.kotor = true;
  App.belumDiunduh = true;
  clearTimeout(App.simpanTimer);
  App.simpanTimer = setTimeout(tulisSimpan, 350);
}
function tulisSimpan() {
  clearTimeout(App.simpanTimer);
  App.simpanTimer = 0;
  if (!App.s || !App.kotor || App.tunda) return;
  const ts = Date.now();
  const ok = Gudang.tulis(KUNCI, JSON.stringify({ v: KPB.VERSI_DATA, ts, data: App.s }));
  App.simpanGagal = !ok;
  if (ok) { App.tersimpan = ts; App.adaData = true; App.kotor = false; }
  perbaruiStatusSimpan();
  if (!ok && !App.peringatSimpan) {
    App.peringatSimpan = true;
    toast('Peramban tidak mengizinkan penyimpanan otomatis. Unduh cadangan data (.json) agar pekerjaan tidak hilang.', { lama: 8000 });
  }
}
function perbaruiStatusSimpan() {
  const el = $('status-simpan');
  if (!el) return;
  el.classList.toggle('gagal', App.simpanGagal);
  if (App.simpanGagal) el.textContent = 'Belum tersimpan di peramban. Unduh cadangan.';
  else if (App.tersimpan) el.textContent = 'Tersimpan otomatis ' + fJam(App.tersimpan);
  else el.textContent = '';
}
/* hasil: null (belum ada data), { rusak: true }, atau { s, ts } */
function muatTersimpan() {
  let mentah = Gudang.baca(KUNCI), lama = false;
  if (mentah == null && CFG.kunci === 'kpb') { mentah = Gudang.baca(KUNCI_LAMA); lama = mentah != null; }
  if (mentah == null) return null;
  try {
    const o = JSON.parse(mentah);
    const amplop = !lama && o && typeof o === 'object' && o.data && typeof o.data === 'object' && 'ts' in o;
    return { s: KPB.normalisasi(amplop ? o.data : o), ts: amplop ? Number(o.ts) || 0 : 0 };
  } catch (e) {
    Gudang.tulis(KUNCI_RUSAK, mentah);
    return { rusak: true };
  }
}
function muatCepat() {
  const m = Gudang.baca(KUNCI_CEPAT);
  if (!m) return null;
  try {
    const o = JSON.parse(m), k = KPB.kosongCepat();
    Object.keys(k).forEach((x) => { k[x] = typeof k[x] === 'string' ? (typeof o[x] === 'string' ? o[x].slice(0, 80) : '') : Math.min(1e13, Math.max(0, KPB.n(o[x]))); });
    k.feePersen = Math.min(100, k.feePersen);
    return k;
  } catch (e) { return null; }
}
function simpanCepat() { Gudang.tulis(KUNCI_CEPAT, JSON.stringify(App.q)); }
function hitungUlang() { App.A = KPB.analisis(App.s); }

/* nilai berubah, struktur halaman tetap: segarkan angka turunan saja */
function lapor(e) {
  try { console.error(e); } catch (x) { /* abaikan */ }
  emit('galat', { pesan: String((e && e.message) || e).slice(0, 120) });
}
function berubah() {
  if (App.undo) clearUndo();
  if (App.s.contoh) { App.s.contoh = false; const b = $('banner-contoh'); if (b) b.hidden = true; const t = $('tag-contoh'); if (t) t.hidden = true; }
  try { hitungUlang(); } catch (e) { lapor(e); toast('Angka ini tidak bisa dihitung. Periksa isian terakhir Anda.'); return; }
  simpan();
  const nm = $('nama-usaha');
  if (nm && App.view === 'langkah') nm.textContent = App.s.nama || 'Usaha tanpa nama';
  try {
    if (App.refresh) App.refresh();
    updateLive();
  } catch (e) { lapor(e); }
}
/* baris ditambah/dihapus: bangun ulang langkah aktif, lalu fokus ke elemen baru */
function strukturBerubah(fokusId) {
  if (App.undo) clearUndo();
  const panel = $('panel');
  const punyaFokus = !!(panel && App.root && App.root.activeElement && panel.contains(App.root.activeElement));
  hitungUlang();
  if (App.s.contoh) App.s.contoh = false;
  simpan();
  renderStep();
  const el = fokusId ? $(fokusId) : null;
  if (el) { el.focus(); if (el.scrollIntoView) el.scrollIntoView({ block: 'nearest' }); }
  else if (punyaFokus && $('panel')) $('panel').focus({ preventScroll: true });
}

/* pengumuman untuk pembaca layar, tidak terlihat */
function umumkan(teks) {
  const el = $('aria');
  if (!el) return;
  el.textContent = '';
  setTimeout(() => { el.textContent = teks; }, 30);
}

/* pesan singkat; bisa memuat satu tombol aksi, misalnya Urungkan */
function toast(pesan, o) {
  o = o || {};
  const t = $('toast');
  if (!t) return;
  t.replaceChildren(h('span', null, pesan));
  umumkan(pesan);
  if (o.aksi) t.append(h('button', { type: 'button', class: 'toast-aksi', onclick: () => { t.hidden = true; t.classList.remove('keluar'); clearTimeout(App.toastTimer); o.fn(); } }, o.aksi));
  t.classList.remove('keluar');
  t.hidden = false;
  clearTimeout(App.toastTimer);
  App.toastTimer = setTimeout(() => sembunyiToast(t), o.lama || 2600);
}
/* pesan memudar pelan sebelum disembunyikan; tanpa gerak langsung hilang */
function sembunyiToast(t) {
  if (!gerakBoleh()) { t.hidden = true; return; }
  t.classList.add('keluar');
  App.toastTimer = setTimeout(() => { t.hidden = true; t.classList.remove('keluar'); }, 560);
}

/* jalankan perubahan yang merusak data, lalu tawarkan Urungkan selama beberapa detik */
function denganUrungkan(pesan, aksi) {
  const snap = JSON.stringify(App.s);
  aksi();
  setUndo(snap);
  toast(pesan, { aksi: 'Urungkan', lama: 7000, fn: () => pulihkan(snap) });
}
/* Urungkan hanya berlaku selama belum ada perubahan lain, supaya tidak ikut membatalkan isian setelahnya */
function pulihkan(snap) {
  if (!App.undo || App.undo.snap !== snap) { toast('Sudah ada perubahan baru, jadi tidak bisa diurungkan lagi.'); return; }
  clearUndo();
  App.s = KPB.normalisasi(JSON.parse(snap));
  App.targetCm = {};
  hitungUlang(); simpan(); tulisSimpan();
  renderUlang();
  toast('Perubahan dibatalkan');
}

async function salin(teks, pesan) {
  let ok = false;
  try {
    await navigator.clipboard.writeText(teks);
    ok = true;
  } catch (e) {
    const ta = h('textarea', { style: 'position:fixed;top:0;left:0;opacity:0', value: teks, 'aria-hidden': 'true', tabindex: '-1' });
    (App.root || document.body).append(ta);
    ta.select();
    try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
    ta.remove();
  }
  if (ok) toast(pesan || 'Tersalin');
  return ok;
}
/* bila peramban menolak menyalin, tampilkan teksnya agar bisa disalin dengan tangan */
function kotakSalin(teks) {
  let d = $('kotak-salin');
  if (!d) {
    d = h('dialog', { id: 'kotak-salin', class: 'dlg', 'aria-label': 'Salin ringkasan' },
      h('p', { class: 'h3' }, 'Salin ringkasan'),
      h('p', { class: 'small' }, 'Peramban tidak mengizinkan penyalinan otomatis. Tekan lama pada teks di bawah, pilih semua, lalu salin.'),
      h('textarea', { id: 'kotak-salin-isi', readonly: true, rows: 12, 'aria-label': 'Teks ringkasan' }),
      h('div', { style: 'display:flex;justify-content:flex-end' }, h('button', { type: 'button', class: 'btn pri', onclick: () => d.close() }, 'Tutup')));
    /* di dalam .app, bukan langsung di shadow root: baru di sana gaya dasar dan titik putus kontainer berlaku */
    ($('app') || App.root || document.body).append(d);
  }
  const ta = d.querySelector('textarea');
  ta.value = teks;
  if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', '');
  ta.focus(); ta.select();
}

/* ---------- kontrol formulir ---------- */
function inRp(obj, key, id, label, onChg) {
  const inp = h('input', { id, type: 'text', inputMode: 'numeric', autocomplete: 'off', class: 'num', value: obj[key] ? fInt(obj[key]) : '', 'aria-label': label || null, placeholder: '0' });
  inp.addEventListener('input', () => {
    const pos = inp.selectionStart == null ? inp.value.length : inp.selectionStart;
    const sebelum = inp.value.slice(0, pos).replace(/\D/g, '').length;
    const digit = inp.value.replace(/\D/g, '').slice(0, 13);
    const v = digit ? parseInt(digit, 10) : 0;
    obj[key] = v;
    const teks = digit ? fInt(v) : '';
    inp.value = teks;
    let c = 0, lihat = 0;
    while (c < teks.length && lihat < sebelum) { if (/\d/.test(teks[c])) lihat++; c++; }
    try { inp.setSelectionRange(c, c); } catch (e) { /* abaikan */ }
    (onChg || berubah)();
  });
  return inp;
}
function inNum(obj, key, id, o = {}) {
  const fmt = (v) => (v === 0 && o.kosong0 ? '' : fDec(v, o.dec == null ? 2 : o.dec));
  const inp = h('input', { id, type: 'text', inputMode: 'decimal', autocomplete: 'off', class: 'num', value: fmt(obj[key]), 'aria-label': o.label || null, placeholder: o.ph || '0' });
  const baca = () => {
    let v = parseNum(inp.value);
    if (o.min != null) v = Math.max(o.min, v);
    v = Math.min(o.max == null ? 1e12 : o.max, v);
    return v;
  };
  inp.addEventListener('input', () => { obj[key] = baca(); (o.onChg || berubah)(); });
  inp.addEventListener('blur', () => { obj[key] = baca(); inp.value = fmt(obj[key]); });
  return inp;
}
function inText(obj, key, id, o = {}) {
  const inp = h('input', { id, type: 'text', value: obj[key] || '', placeholder: o.ph || '', autocomplete: 'off', maxLength: 80, 'aria-label': o.label || null });
  inp.addEventListener('input', () => { obj[key] = inp.value; (o.onChg || berubah)(); });
  return inp;
}
function inSelect(obj, key, opsi, id, o = {}) {
  const sel = h('select', { id, 'aria-label': o.label || null },
    opsi.map(([v, t]) => h('option', { value: String(v), selected: String(obj[key]) === String(v) }, t)));
  sel.addEventListener('change', () => { obj[key] = o.angka ? Number(sel.value) : sel.value; if (o.struktur) strukturBerubah(); else berubah(); });
  return sel;
}
const kotak = (ctl, o = {}) => h('div', { class: 'in' }, o.pre ? h('span', { class: 'pre' }, o.pre) : null, ctl, o.suf ? h('span', { class: 'suf' }, o.suf) : null);
function fld(label, ctl, o = {}) {
  const hid = o.hint && ctl.id ? ctl.id + '-h' : null;
  if (hid) ctl.setAttribute('aria-describedby', hid);
  return h('div', { class: 'fld ' + (o.cls || '') }, h('label', { for: ctl.id }, label), kotak(ctl, o), o.hint ? h('p', { class: 'hint', id: hid }, o.hint) : null);
}
/* sel dalam baris tabel isian: keterangan kecil tampil di ponsel saja */
function sel(label, ctl, o = {}) {
  return h('div', { class: 'c ' + (o.cls || '') }, h('label', { class: 'cl', for: ctl.id }, label), kotak(ctl, o));
}
function hapusBtn(onClick, label) {
  return h('button', { type: 'button', class: 'del', 'aria-label': label || 'Hapus baris', onclick: onClick }, h('span', { 'aria-hidden': 'true' }, '×'), h('span', { class: 'txt' }, 'Hapus'));
}
function thead(kolom, cols, kanan = []) {
  return h('div', { class: 'thead', style: '--cols:' + cols, 'aria-hidden': 'true' }, kolom.map((k, i) => h('span', { class: kanan.includes(i) ? 'r' : '' }, k)));
}
function cara(...isi) {
  return h('details', { class: 'how', open: true }, h('summary', null, 'Cara kerja langkah ini'), isi);
}
function seksi(judul, ...kids) {
  return h('section', { class: 'sec' }, judul ? h('h2', { class: 'h2' }, judul) : null, kids);
}
