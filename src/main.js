/* ===== main: kerangka halaman, navigasi, kamus, pemasangan ===== */
const LANGKAH = [
  { t: 'Modal awal', j: 'Modal awal', build: buildStep1, live: true },
  { t: 'HPP & harga', j: 'HPP dan harga jual', build: buildStep2, live: false },
  { t: 'Biaya tetap', j: 'Biaya tetap', build: buildStep3, live: true },
  { t: 'Target jual', j: 'Target penjualan', build: buildStep4, live: true },
  { t: 'BEP & laba rugi', j: 'BEP dan laba rugi', build: buildStep5, live: false, hasil: true },
  { t: 'Balik modal', j: 'Balik modal dan simulasi', build: buildStep6, live: false, hasil: true },
];

const KAMUS = [
  ['HPP (Harga Pokok Penjualan)', 'Semua biaya langsung untuk membuat satu produk sampai siap dijual: bahan baku, tenaga kerja langsung, dan overhead produksi. Gaji bulanan dan sewa tidak termasuk.', 'HPP = bahan baku + tenaga kerja langsung + overhead produksi'],
  ['Laba kotor dan margin kotor', 'Sisa dari harga jual setelah dikurangi HPP. Margin kotor adalah laba kotor dibagi harga jual.', 'Laba kotor = harga jual − HPP'],
  ['Biaya penjualan', 'Biaya yang muncul tiap ada penjualan, di luar HPP: komisi marketplace, fee QRIS, subsidi ongkir.', null],
  ['Biaya yang ikut omzet', 'Biaya yang besarnya persen dari omzet, bukan per unit: iklan berbayar, retur, diskon, komisi sales. Ikut mengurangi margin tiap produk.', null],
  ['Margin kontribusi', 'Uang yang tersisa dari satu penjualan setelah HPP dan biaya penjualan. Dipakai untuk menutup biaya tetap, sisanya menjadi laba.', 'Margin kontribusi = harga jual − HPP − biaya penjualan'],
  ['Biaya tetap dan biaya variabel', 'Biaya tetap harus dibayar tiap bulan walau tidak ada penjualan (gaji, sewa, listrik). Biaya variabel naik turun mengikuti jumlah produk terjual (bahan, kemasan, komisi).', null],
  ['Penyusutan', 'Pembagian nilai barang tahan lama (mesin, renovasi) ke beberapa tahun. Bukan uang keluar tiap bulan, tetapi dihitung sebagai biaya agar laba tidak terlalu besar.', 'Penyusutan per bulan = nilai ÷ (umur manfaat × 12)'],
  ['Modal kerja', 'Uang tunai cadangan untuk stok awal dan menutup biaya selama penjualan belum cukup. Termasuk uang yang tertahan di stok dan piutang, dikurangi hutang dagang.', 'Modal kerja bersih = stok + piutang − hutang dagang'],
  ['Stok, piutang, dan hutang dagang', 'Stok adalah barang atau bahan yang disimpan sebelum terjual. Piutang adalah penjualan yang belum dibayar pelanggan. Hutang dagang adalah pembelian yang belum Anda bayar ke pemasok. Ketiganya menentukan berapa uang tunai yang tertahan.', null],
  ['BEP (Break Even Point)', 'Titik impas: penjualan minimum agar usaha tidak rugi dan tidak untung. Di bawahnya rugi, di atasnya untung.', 'BEP (unit) = biaya tetap ÷ margin kontribusi per unit'],
  ['Jarak aman (margin of safety)', 'Seberapa jauh penjualan boleh turun dari target sebelum mencapai BEP.', 'Jarak aman = (target − BEP) ÷ target'],
  ['Bauran penjualan (sales mix)', 'Perbandingan jumlah tiap produk yang terjual. Dipakai untuk menghitung BEP bila produknya lebih dari satu.', null],
  ['Kapasitas', 'Jumlah unit paling banyak yang bisa dilayani atau dibuat sebulan, misalnya karena jumlah mesin atau kursi. Penjualan di proyeksi tidak melewati kapasitas.', null],
  ['Pola musiman', 'Naik turunnya penjualan mengikuti bulan kalender (puasa dan Lebaran, libur sekolah, akhir tahun). 100% sama dengan target, 150% satu setengah kali.', null],
  ['Laba operasional dan laba bersih', 'Laba operasional adalah margin kontribusi dikurangi biaya tetap dan penyusutan. Laba bersih adalah laba operasional setelah pajak.', null],
  ['Arus kas', 'Uang yang benar-benar masuk setelah semua biaya dan pajak. Penyusutan ditambahkan kembali karena bukan uang keluar; uang yang tertahan di stok dan piutang dikurangkan.', 'Arus kas = laba bersih + penyusutan − tambahan modal kerja'],
  ['Balik modal (payback)', 'Waktu yang dibutuhkan agar total arus kas menutup modal awal.', null],
  ['ROI', 'Total laba bersih selama periode proyeksi dibagi modal awal.', 'ROI = total laba bersih ÷ modal awal'],
  ['NPV (Net Present Value)', 'Nilai hari ini dari seluruh arus kas masa depan dikurangi modal awal. Uang yang datang lebih lambat dihargai lebih rendah. Positif berarti lebih menguntungkan dari imbal hasil harapan Anda.', null],
  ['IRR (Internal Rate of Return)', 'Imbal hasil tahunan usaha ini, yaitu tingkat yang membuat NPV tepat nol. Bandingkan dengan imbal hasil harapan Anda.', null],
  ['Masa awal (ramp-up)', 'Usaha baru butuh waktu untuk dikenal. Penjualan dimulai dari sebagian target lalu naik bertahap.', null],
  ['PPh final UMKM dan Pasal 31E', 'PPh final dibayar atas omzet dengan tarif tetap, bukan atas laba. Orang pribadi, PT perorangan, dan koperasi (koperasi dibatasi empat tahun pajak sejak terdaftar) bisa memakainya selama omzet sampai Rp4,8 miliar per tahun. Fasilitas Pasal 31E memberi pengurangan tarif 50% atas laba dari bagian omzet sampai Rp4,8 miliar bagi wajib pajak badan dengan peredaran bruto sampai Rp50 miliar. Aturan dan syaratnya bisa berubah; cek ke konsultan pajak atau KPP.', null],
];

/* ---------- gaya, tema ---------- */
const BERKAS_FONT = [
  ['Plus Jakarta Sans', 300, 'plus-jakarta-sans-latin-300-normal.woff2'], ['Plus Jakarta Sans', 400, 'plus-jakarta-sans-latin-400-normal.woff2'],
  ['Plus Jakarta Sans', 500, 'plus-jakarta-sans-latin-500-normal.woff2'], ['Plus Jakarta Sans', 600, 'plus-jakarta-sans-latin-600-normal.woff2'],
];
function pasangGaya() {
  /* lembar gaya konstruktabel tidak terkena aturan CSP style-src; peramban lama memakai elemen <style> biasa */
  let terpasang = false;
  try {
    if (typeof CSSStyleSheet === 'function' && typeof CSSStyleSheet.prototype.replaceSync === 'function' && 'adoptedStyleSheets' in App.root) {
      const lembar = new CSSStyleSheet();
      lembar.replaceSync(KPB_CSS);
      App.root.adoptedStyleSheets = [lembar];
      terpasang = true;
    }
  } catch (e) { terpasang = false; }
  if (!terpasang) {
    /* CSP ketat (style-src 'self') memblokir <style> sebaris. Di peramban tanpa lembar gaya konstruktabel (Safari sebelum 16.4, Firefox sebelum 101)
       itu berarti tampilan polos, jadi gaya juga dipasang lewat <link> ke kpb.css yang sama asal dan diizinkan. <style> tetap dipasang untuk kasus
       kpb.css tidak ikut diunggah; bila CSP memblokirnya, yang tampak hanya satu pesan di konsol. */
    if (!SEBAGAI_ARTIFACT && ALAMAT_DASAR) {
      const tautan = document.createElement('link');
      tautan.rel = 'stylesheet';
      tautan.href = ALAMAT_DASAR + 'kpb.css';
      App.root.append(tautan);
    }
    const gaya = document.createElement('style');
    gaya.textContent = KPB_CSS;
    App.root.append(gaya);
  }
  /* font hanya bisa didaftarkan di dokumen (bukan di dalam shadow root); alamatnya relatif terhadap kpb.js.
     Lewat FontFace agar tidak butuh <style> sebaris; berkas baru diunduh saat font dipakai. */
  if (SEBAGAI_ARTIFACT || !ALAMAT_DASAR || window.__kpbFont) return;
  window.__kpbFont = true;
  let font = false;
  try {
    if (typeof FontFace === 'function' && document.fonts && typeof document.fonts.add === 'function') {
      BERKAS_FONT.forEach(([fam, w, berkas]) => document.fonts.add(new FontFace(fam, 'url("' + ALAMAT_DASAR + 'fonts/' + berkas + '") format("woff2")', { weight: String(w), style: 'normal', display: 'swap' })));
      font = true;
    }
  } catch (e) { font = false; }
  if (!font) {
    const f = document.createElement('style');
    f.id = 'kpb-font-face';
    f.textContent = BERKAS_FONT.map(([fam, w, berkas]) => '@font-face{font-family:"' + fam + '";font-style:normal;font-display:swap;font-weight:' + w + ';src:url("' + ALAMAT_DASAR + 'fonts/' + berkas + '") format("woff2")}').join('');
    document.head.append(f);
  }
}

/* tema: 'terang' atau 'gelap' dari konfigurasi; 'auto' mengikuti halaman (data-theme atau kelas dark) lalu setelan perangkat */
function temaHalaman() {
  const el = document.documentElement, dt = (el.getAttribute('data-theme') || el.getAttribute('data-bs-theme') || '').toLowerCase();
  if (dt.indexOf('dark') >= 0 || dt.indexOf('gelap') >= 0) return 'dark';
  if (dt.indexOf('light') >= 0 || dt.indexOf('terang') >= 0) return 'light';
  if (el.classList.contains('dark')) return 'dark';
  return '';
}
function terapkanTema() {
  if (!App.host) return;
  const c = String(CFG.tema || 'auto').toLowerCase();
  const t = c === 'terang' || c === 'light' ? 'light' : c === 'gelap' || c === 'dark' ? 'dark' : temaHalaman();
  const lama = App.host.getAttribute('data-theme') || '';
  if (t) App.host.setAttribute('data-theme', t); else App.host.removeAttribute('data-theme');
  if (lama !== t) peralihanTema();
  /* di halaman mandiri, latar halaman mengikuti tema yang dipaksa lewat konfigurasi (mode 'auto' diurus awal.css) */
  if (CFG.mode !== 'tertanam' && document.body && App.host.parentNode === document.body) {
    document.body.style.backgroundColor = c === 'terang' || c === 'light' ? '#F4F5FA' : c === 'gelap' || c === 'dark' ? '#0C0F1E' : '';
  }
}
/* warna berpindah pelan saat tema berganti; kelasnya dipasang hanya selama peralihan */
function peralihanTema() {
  const a = $('app');
  if (!a || !gerakBoleh()) return;
  a.classList.add('tema-ganti');
  clearTimeout(App.temaTimer);
  App.temaTimer = setTimeout(() => a.classList.remove('tema-ganti'), 900);
}

/* ---------- riwayat peramban: tombol Kembali berpindah langkah ---------- */
const bacaHash = () => {
  const m = /^#(mulai|langkah-([1-6]))$/.exec((window.location && window.location.hash) || '');
  return m ? (m[1] === 'mulai' ? { v: 'mulai' } : { v: 'langkah', i: Number(m[2]) - 1 }) : null;
};
function catatRiwayat(ganti) {
  if (!PAKAI_RIWAYAT) return;
  try {
    const st = App.view === 'mulai' ? { kpb: 1, v: 'mulai' } : { kpb: 1, v: 'langkah', i: App.step };
    const url = App.view === 'mulai' ? '#mulai' : '#langkah-' + (App.step + 1);
    const cur = window.history.state;
    if (!ganti && cur && cur.kpb && cur.v === st.v && cur.i === st.i) return;
    if (ganti) window.history.replaceState(st, '', url); else window.history.pushState(st, '', url);
  } catch (e) { /* abaikan: riwayat tidak wajib */ }
}
/* judul asli halaman dipertahankan di layar awal (penting untuk mesin pencari); di langkah ditambah nomor langkahnya */
const JUDUL_ASLI = (() => { try { return document.title || 'Proyeksi Bisnis'; } catch (e) { return 'Proyeksi Bisnis'; } })();
function judulDokumen() {
  if (!PAKAI_RIWAYAT) return;
  try { document.title = App.view === 'mulai' ? JUDUL_ASLI : 'Langkah ' + (App.step + 1) + ': ' + LANGKAH[App.step].j + ' · ' + JUDUL_ASLI; } catch (e) { /* abaikan */ }
}

/* ---------- perpindahan tampilan ---------- */
function gulirKeAtas() {
  const target = $('steps') || $('view') || App.host;
  if (!target) return;
  try {
    const y = Math.max(0, target.getBoundingClientRect().top + (window.pageYOffset || 0) - 8);
    kePosInduk('gulir', { y });
    if (typeof target.scrollIntoView === 'function') target.scrollIntoView({ block: 'start' }); else window.scrollTo(0, y);
  } catch (e) { /* abaikan */ }
}
function fokusIsi() {
  const el = App.view === 'mulai' ? $('view') : $('panel');
  if (el) el.focus({ preventScroll: true });
}

function goStep(i, o) {
  o = o || {};
  i = Math.max(0, Math.min(LANGKAH.length - 1, Number(i) || 0));
  const dariLuar = App.view !== 'langkah' || !$('panel');
  const dulu = dariLuar ? -1 : App.step;
  App.view = 'langkah';
  App.step = i;
  Gudang.tulis(KUNCI_LANGKAH, String(i));
  if (dariLuar) renderKerangkaLangkah();
  renderStep();
  if (!o.tanpaRiwayat) catatRiwayat(o.ganti);
  judulDokumen();
  if (!o.diam) {
    gulirKeAtas();
    fokusIsi();
    umumkan('Langkah ' + (i + 1) + ' dari ' + LANGKAH.length + ': ' + LANGKAH[i].j);
    /* isi langkah menggeser masuk dari arah tujuan; dari layar awal seluruh tampilan memudar masuk */
    if (dariLuar) animasiMasuk($('view'), 'masuk-naik');
    else if (i !== dulu) {
      const arah = i > dulu ? 'masuk-maju' : 'masuk-mundur';
      animasiMasuk($('panel'), arah);
      if (!$('live-slot').hidden) animasiMasuk($('live-slot'), arah);
    }
  }
  emit('langkah_dibuka', { langkah: i + 1 });
  if (LANGKAH[i].hasil) emitSekali('hasil_dilihat');
}

function tampilMulai(o) {
  o = o || {};
  App.view = 'mulai';
  renderMulai();
  if (!o.tanpaRiwayat) catatRiwayat(o.ganti);
  judulDokumen();
  if (!o.diam) { gulirKeAtas(); fokusIsi(); umumkan('Layar awal'); animasiMasuk($('view'), 'masuk-naik'); }
}

function renderUlang() {
  if (App.view === 'mulai') renderMulai();
  else { if (!$('panel')) renderKerangkaLangkah(); renderStep(); }
}

/* stepper, kolom kerja, dan tombol bawah; dibangun sekali setiap masuk ke tampilan langkah */
function renderKerangkaLangkah() {
  const stepper = h('nav', { class: 'stepnav', 'aria-label': 'Daftar langkah' }, h('ol', { class: 'steps', id: 'steps' }, LANGKAH.map((l, i) =>
    h('li', null, h('button', { type: 'button', class: l.hasil ? 'hasil' : '', 'aria-label': 'Langkah ' + (i + 1) + ': ' + l.j, onclick: () => goStep(i) }, h('span', { class: 'n', 'aria-hidden': 'true' }, i + 1), h('span', { class: 't', 'aria-hidden': 'true' }, l.t))))));
  $('view').replaceChildren(
    stepper,
    h('div', { class: 'layout', id: 'layout' }, h('section', { class: 'panel', id: 'panel', tabindex: '-1' }), h('div', { id: 'live-slot', class: 'slot' })),
    h('nav', { class: 'nav', 'aria-label': 'Pindah langkah' },
      h('button', { type: 'button', class: 'btn', id: 'btn-prev', onclick: () => goStep(App.step - 1) }, 'Kembali'),
      h('span', { class: 'where', id: 'where' }),
      h('button', { type: 'button', class: 'btn pri', id: 'btn-next', onclick: () => goStep(App.step + 1) }, 'Lanjut')));
}

function renderStep() {
  const L = LANGKAH[App.step], panel = $('panel');
  if (!panel) return;
  App.outs = [];
  App.liveEl = null;
  App.refresh = L.hasil ? null : runOuts;
  try { panel.replaceChildren(...isiSlot(L.build())); } catch (e) { tampilGalat(panel, e); }
  panel.setAttribute('aria-label', 'Langkah ' + (App.step + 1) + ': ' + L.j);
  $('layout').classList.toggle('wide', !L.live);
  const slotL = $('live-slot');
  slotL.replaceChildren();
  slotL.hidden = !L.live;
  if (L.live) { try { slotL.append(buildLive()); } catch (e) { lapor(e); } }
  App.root.querySelectorAll('#' + pref('steps') + ' button').forEach((b, i) => {
    if (i === App.step) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    b.parentNode.classList.toggle('lewat', i < App.step);
  });
  const n = LANGKAH.length, i = App.step;
  $('btn-prev').disabled = i === 0;
  $('btn-next').hidden = i === n - 1;
  $('where').replaceChildren(h('span', { class: 'wk' }, 'Langkah '), (i + 1) + ' dari ' + n, h('span', { class: 'wj' }, ': ' + L.j));
  segarkanKerangka();
}

function tampilGalat(el, e) {
  lapor(e);
  App.outs = [];
  App.refresh = null;
  el.replaceChildren(h('div', { class: 'galat', role: 'alert' },
    h('h2', { class: 'h2' }, 'Bagian ini gagal ditampilkan'),
    h('p', null, 'Data Anda tetap aman di peramban ini. Coba muat ulang bagian ini, atau simpan cadangan data lalu mulai lagi.'),
    h('div', { class: 'btnrow' },
      h('button', { class: 'btn pri', type: 'button', onclick: () => renderUlang() }, 'Coba lagi'),
      h('button', { class: 'btn', type: 'button', onclick: () => unduhJson() }, 'Simpan cadangan data (.json)'),
      h('button', { class: 'btn', type: 'button', onclick: () => tampilMulai() }, 'Ke layar awal'))));
}

/* nama usaha, penanda data contoh, tombol yang bergantung pada tampilan */
function segarkanKerangka() {
  const nama = $('nama-usaha');
  if (nama) nama.textContent = App.s && (App.view === 'langkah' || App.adaData) ? App.s.nama || 'Usaha tanpa nama' : '';
  const contoh = !!(App.s && App.s.contoh && App.view === 'langkah');
  ['banner-contoh', 'tag-contoh'].forEach((id) => { const e = $(id); if (e) e.hidden = !contoh; });
  const awal = $('btn-awal');
  if (awal) awal.hidden = App.view === 'mulai';
  const bisaEkspor = App.view === 'langkah' || App.adaData;
  App.root.querySelectorAll('[data-butuh-data]').forEach((b) => { b.disabled = !bisaEkspor; });
  perbaruiStatusSimpan();
}

/* ---------- undo, ganti data ---------- */
function setUndo(snap) {
  App.undo = { snap };
  clearTimeout(App.undoTimer);
  App.undoTimer = setTimeout(clearUndo, 90000);
  const b = $('btn-urungkan');
  if (b) b.hidden = false;
}
function clearUndo() {
  App.undo = null;
  clearTimeout(App.undoTimer);
  const b = $('btn-urungkan');
  if (b) b.hidden = true;
}

/* tombol dua klik sebagai pengganti dialog konfirmasi */
function duaKlik(btn, teksYakin, aksi) {
  const awal = btn.textContent;
  let timer = 0;
  const reset = () => { clearTimeout(timer); btn.dataset.siap = ''; btn.textContent = awal; };
  btn.addEventListener('click', (e) => {
    if (btn.dataset.siap === '1') { reset(); aksi(); return; }
    e.stopPropagation();
    btn.dataset.siap = '1'; btn.textContent = teksYakin;
    timer = setTimeout(reset, 4000);
  });
  btn.addEventListener('blur', () => { if (btn.dataset.siap === '1') setTimeout(() => { if (App.root && App.root.activeElement !== btn) reset(); }, 150); });
  btn.kembalikan = reset;
  return btn;
}

function gantiData(baru, pesan, o) {
  o = o || {};
  const snap = App.s && !App.s.contoh && (App.adaData || App.kotor) ? JSON.stringify(App.s) : null;
  App.s = baru;
  App.targetCm = {};
  App.ui.terbuka = {};
  clearUndo();
  hitungUlang();
  simpan();
  tulisSimpan();
  goStep(o.langkah == null ? 0 : o.langkah);
  if (snap) { setUndo(snap); toast(pesan, { aksi: 'Urungkan', lama: o.lama || 7000, fn: () => pulihkan(snap) }); } else toast(pesan, { lama: o.lama });
}

/* ---------- kerangka halaman ---------- */
function setBanner(id, node) {
  const kotak = $('info');
  if (!kotak) return;
  const lama = $(id);
  if (lama) lama.remove();
  if (node) { node.id = pref(id); kotak.append(node); }
}

/* tanda merek: garis pendapatan dan garis biaya bertemu di titik impas; warnanya dari token tema (style.css: .glif) */
function glif() {
  return sv('svg', { class: 'glif', viewBox: '0 0 64 64', 'aria-hidden': 'true', focusable: 'false' },
    sv('rect', { class: 'g0', width: 64, height: 64, rx: 14 }),
    sv('path', { class: 'g1', d: 'M12 30 52 38', fill: 'none', 'stroke-width': 5, 'stroke-linecap': 'round' }),
    sv('path', { class: 'g2', d: 'M12 46 52 18', fill: 'none', 'stroke-width': 5, 'stroke-linecap': 'round' }),
    sv('circle', { class: 'g3', cx: 29.8, cy: 33.6, r: 5.5, 'stroke-width': 3 }));
}

function header() {
  const fileIn =h('input', { type: 'file', id: 'f-impor', accept: '.json,application/json', hidden: true, 'aria-label': 'Pilih berkas data .json', onchange: (e) => { bukaJson(e.target.files[0]); e.target.value = ''; } });
  const butuh = (b) => { b.dataset.butuhData = '1'; return b; };
  const item = (teks, fn, perlu) => { const b = h('button', { type: 'button', class: 'btn', onclick: () => { tutupMenu(); fn(); } }, teks); return perlu ? butuh(b) : b; };
  const kosongkan = duaKlik(h('button', { type: 'button', class: 'btn', id: 'btn-kosong' }, 'Kosongkan semua'), 'Yakin? Klik lagi untuk mengosongkan', () => { tutupMenu(); gantiData(KPB.kosongState(), 'Semua data dikosongkan.', { langkah: 0 }); });
  const daftar = h('div', { class: 'menu-list', id: 'menu-list', hidden: true },
    item('Unduh Excel (.xlsx)', () => unduhExcel(), true),
    item('Cetak atau simpan PDF', () => cetakLaporan(), true),
    item('Salin ringkasan teks', () => salinRingkasan(), true),
    item('Simpan data (.json)', () => unduhJson(), true),
    item('Buka data (.json)', () => fileIn.click(), false),
    butuh(kosongkan));
  const tombol = h('button', { type: 'button', class: 'btn', id: 'btn-menu', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-controls': pref('menu-list') }, 'Data dan ekspor');
  function tutupMenu(fokus) {
    if (daftar.hidden) return;
    if (kosongkan.kembalikan) kosongkan.kembalikan();
    daftar.hidden = true;
    tombol.setAttribute('aria-expanded', 'false');
    if (fokus) tombol.focus();
  }
  tombol.addEventListener('click', (e) => {
    e.stopPropagation();
    const buka = daftar.hidden;
    daftar.hidden = !buka;
    tombol.setAttribute('aria-expanded', String(buka));
    if (buka) { const p = daftar.querySelector('button:not([disabled])'); if (p) p.focus(); }
  });
  daftar.addEventListener('keydown', (e) => {
    const btns = Array.prototype.slice.call(daftar.querySelectorAll('button:not([disabled])'));
    const i = btns.indexOf(App.root.activeElement);
    if (e.key === 'ArrowDown') { e.preventDefault(); btns[(i + 1) % btns.length].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); btns[(i - 1 + btns.length) % btns.length].focus(); }
    else if (e.key === 'Home') { e.preventDefault(); btns[0].focus(); }
    else if (e.key === 'End') { e.preventDefault(); btns[btns.length - 1].focus(); }
    else if (e.key === 'Escape') { e.stopPropagation(); tutupMenu(true); }
    else if (e.key === 'Tab') tutupMenu();
  });
  document.addEventListener('click', (e) => {
    const jalur = typeof e.composedPath === 'function' ? e.composedPath() : [];
    if (!daftar.hidden && jalur.indexOf(daftar) < 0) tutupMenu();
  });
  const judul = CFG.mode === 'tertanam' ? h('div', { class: 'judul-app', role: 'heading', 'aria-level': '2' }, 'Proyeksi Bisnis') : h('h1', { class: 'judul-app' }, 'Proyeksi Bisnis');
  return h('header', { class: 'top' },
    h('button', { type: 'button', class: 'skip', onclick: () => fokusIsi() }, 'Lewati ke isi'),
    h('div', { class: 'brand' }, glif(), h('div', { class: 'brand-teks' }, judul, h('p', { class: 'small', id: 'nama-usaha' }, ''))),
    h('div', { class: 'tools' },
      h('span', { class: 'small status-simpan', id: 'status-simpan' }),
      h('span', { class: 'tag', id: 'tag-contoh', hidden: true }, 'Data contoh'),
      h('button', { type: 'button', class: 'btn', id: 'btn-urungkan', hidden: true, onclick: () => { if (App.undo) pulihkan(App.undo.snap); } }, 'Urungkan'),
      h('button', { type: 'button', class: 'btn', id: 'btn-awal', hidden: true, onclick: () => tampilMulai() }, 'Layar awal'),
      h('button', { type: 'button', class: 'btn', onclick: () => bukaKamus() }, 'Kamus istilah'),
      h('div', { class: 'menu' }, tombol, daftar), fileIn));
}

function bukaKamus() {
  const g = $('kamus');
  if (!g) return;
  g.open = true;
  g.scrollIntoView({ block: 'start' });
  const s = g.querySelector('summary');
  if (s) s.focus({ preventScroll: true });
}

function footer() {
  const kamus = h('details', { id: 'kamus', class: 'how' }, h('summary', null, 'Kamus istilah'),
    h('div', { class: 'gloss' }, KAMUS.map(([t, d, r]) => h('details', null, h('summary', null, t), h('p', null, d), r ? eq(r) : null))));
  const link = CFG.kebijakan && hrefAman(CFG.kebijakan);
  return h('footer', { class: 'foot' }, kamus,
    h('p', { class: 'small disc' }, 'Hasil adalah proyeksi dari angka yang Anda isi, bukan jaminan dan bukan nasihat keuangan atau pajak. Aturan pajak bisa berubah, konsultasikan dengan akuntan atau konsultan pajak. Perhitungan berjalan di peramban ini dan data tidak dikirim ke server; data tersimpan otomatis di perangkat ini saja, jadi gunakan menu Data dan ekspor untuk membuat cadangan.'),
    h('p', { class: 'small meta' }, 'Versi ' + VERSI_APP + ' · aturan pajak diperiksa ' + TGL_ATURAN,
      CFG.merek ? ' · ' + CFG.merek : null,
      link ? [' · ', h('a', { href: link, target: '_blank', rel: 'noopener' }, 'Kebijakan privasi')] : null));
}

function renderKerangka() {
  const mode = CFG.tinggiOtomatis ? 'auto' : CFG.mode === 'tertanam' ? 'tertanam' : 'mandiri';
  const banner = h('div', { class: 'banner', id: 'banner-contoh', hidden: true },
    h('span', null, 'Ini data contoh supaya Anda bisa langsung melihat hasilnya. Ganti dengan angka usaha Anda, atau'),
    aksiGanti(h('button', { type: 'button', class: 'btn sm' }, 'Mulai dari kosong'), () => gantiData(KPB.kosongState(), 'Siap diisi dengan data usaha Anda.', { langkah: 0 })));
  /* satu landmark utama: di halaman mandiri <main>, di halaman tertanam sebuah region bernama agar tidak bentrok dengan <main> milik halaman induk */
  const utama = CFG.mode === 'tertanam'
    ? h('section', { class: 'utama', id: 'utama', 'aria-label': 'Kalkulator proyeksi bisnis' })
    : h('main', { class: 'utama', id: 'utama' });
  utama.append(
    h('div', { id: 'info' }, banner),
    h('div', { id: 'view', tabindex: '-1' }),
    h('div', { id: 'toast', class: 'toast', hidden: true }),
    h('div', { id: 'aria', class: 'sr', role: 'status', 'aria-live': 'polite' }));
  /* bahasa dinyatakan di akar aplikasi sendiri: saat ditanam di halaman yang tidak ber-lang="id", pembaca layar tetap memakai suara Indonesia */
  App.root.append(h('div', { class: 'app ' + mode, id: 'app', lang: 'id' },
    h('div', { class: 'wrap' }, header(), utama, footer())));
  /* titik putus tata letak mengikuti lebar kontainer, bukan lebar layar: kalkulator yang ditanam di kolom sempit tetap rapi */
  pantauLebar($('app'), LEBAR_APP);
}

/* ---------- penyimpanan: tab lain, tab ditutup ---------- */
function pasangPenjaga() {
  window.addEventListener('storage', (e) => {
    if (e.key !== KUNCI || !e.newValue || !App.s) return;
    let o;
    try { o = JSON.parse(e.newValue); } catch (x) { return; }
    if (!o || !o.data) return;
    App.tunda = true;
    clearTimeout(App.simpanTimer);
    const pakai = () => {
      App.s = KPB.normalisasi(o.data);
      App.tersimpan = Number(o.ts) || Date.now(); App.adaData = true; App.kotor = false; App.tunda = false;
      hitungUlang(); setBanner('konflik', null); renderUlang();
      toast('Data dari tab lain dimuat.');
    };
    const tetap = () => { App.tunda = false; App.kotor = true; setBanner('konflik', null); simpan(); toast('Versi di tab ini dipertahankan.'); };
    setBanner('konflik', h('div', { class: 'banner warn', role: 'alert' },
      h('span', null, 'Data usaha ini baru saja diubah di tab lain. Pilih versi yang dipakai:'),
      h('button', { type: 'button', class: 'btn sm', onclick: pakai }, 'Pakai versi tab lain'),
      h('button', { type: 'button', class: 'btn sm', onclick: tetap }, 'Pertahankan versi ini')));
  });
  const simpanSekarang = () => { try { tulisSimpan(); } catch (e) { /* abaikan */ } };
  window.addEventListener('pagehide', simpanSekarang);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') simpanSekarang(); });
  window.addEventListener('beforeunload', (e) => {
    simpanSekarang();
    /* hanya bila peramban tidak bisa menyimpan dan ada perubahan yang belum dicadangkan */
    if (App.simpanGagal && App.belumDiunduh) { e.preventDefault(); e.returnValue = ''; }
  });
  window.addEventListener('popstate', (e) => {
    if (!PAKAI_RIWAYAT) return;
    const st = e.state && e.state.kpb ? e.state : bacaHash();
    if (!st) return;
    if (st.v === 'mulai') tampilMulai({ tanpaRiwayat: true });
    else goStep(st.i, { tanpaRiwayat: true });
  });
}

/* ---------- bisa dibuka tanpa internet: service worker hanya untuk halaman mandiri yang memintanya lewat konfigurasi ---------- */
function daftarkanPWA() {
  if (!CFG.pwa || SEBAGAI_ARTIFACT || CFG.mode === 'tertanam' || !ALAMAT_DASAR || !('serviceWorker' in navigator)) return;
  const daftar = () => { try { navigator.serviceWorker.register(ALAMAT_DASAR + 'sw.js').catch(() => { /* tanpa HTTPS atau diblokir: aplikasi tetap jalan seperti biasa */ }); } catch (e) { /* abaikan */ } };
  if (document.readyState === 'complete') daftar(); else window.addEventListener('load', daftar, { once: true });
}

/* ---------- pemasangan ---------- */
function mulaiAplikasi() {
  let host = document.getElementById('kpb-root');
  if (!host) {
    host = document.createElement('div');
    host.id = 'kpb-root';
    document.body.append(host);
  }
  if (typeof host.attachShadow !== 'function') {
    host.textContent = 'Peramban Anda terlalu lama untuk menjalankan kalkulator ini. Perbarui peramban, atau buka di Chrome, Edge, Firefox, atau Safari versi terbaru.';
    return;
  }
  App.host = host;
  App.root = host.shadowRoot || host.attachShadow({ mode: 'open' });
  App.root.replaceChildren();

  /* tarif pajak bawaan boleh ditimpa lewat konfigurasi tanpa membangun ulang */
  if (CFG.pajak && typeof CFG.pajak === 'object') {
    Object.keys(CFG.pajak).forEach((k) => { if (KPB.PAJAK[k] && CFG.pajak[k] && typeof CFG.pajak[k] === 'object') Object.assign(KPB.PAJAK[k], CFG.pajak[k]); });
  }

  terapkanTema();
  if (String(CFG.tema || 'auto').toLowerCase() === 'auto' && typeof MutationObserver === 'function') {
    new MutationObserver(terapkanTema).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-bs-theme', 'class'] });
  }
  pasangGaya();

  const simpananData = muatTersimpan();
  App.q = muatCepat();
  if (!App.q) { App.q = KPB.contohCepat(); App.qContoh = true; }
  const ada = !!(simpananData && simpananData.s);
  if (ada) { App.s = simpananData.s; App.tersimpan = simpananData.ts; App.adaData = true; } else { App.s = KPB.kosongState(); }
  hitungUlang();
  renderKerangka();
  pasangPenjaga();
  if (simpananData && simpananData.rusak) {
    setBanner('rusak', h('div', { class: 'banner warn', role: 'alert' },
      h('span', null, 'Data tersimpan sebelumnya tidak bisa dibaca, jadi Anda mulai dari awal. Salinannya masih disimpan di peramban ini dan tidak terhapus sampai Anda menyimpan data baru.'),
      h('button', { type: 'button', class: 'btn sm', onclick: () => setBanner('rusak', null) }, 'Mengerti')));
  }
  if (CFG.tinggiOtomatis && typeof ResizeObserver === 'function') {
    let t0 = 0;
    new ResizeObserver(() => { const t = Math.ceil(host.getBoundingClientRect().height); if (t !== t0) { t0 = t; kePosInduk('tinggi', { tinggi: t }); } }).observe(host);
  }

  /* iframe: halaman induk boleh mengganti tema lewat pesan; hanya dari induk langsung dan, bila diatur, hanya dari asal yang ditentukan */
  if (CFG.tinggiOtomatis && !SEBAGAI_ARTIFACT && window.parent && window.parent !== window) {
    window.addEventListener('message', (e) => {
      if (e.source !== window.parent) return;
      if (CFG.indukOrigin && CFG.indukOrigin !== '*' && e.origin !== CFG.indukOrigin) return;
      const d = e.data;
      if (!d || d.kpb !== 1 || d.jenis !== 'tema') return;
      const t = String(d.tema || '').toLowerCase();
      if (['terang', 'light', 'gelap', 'dark', 'auto'].indexOf(t) >= 0) { CFG.tema = t; terapkanTema(); }
    });
    kePosInduk('siap', { versi: VERSI_APP });
  }

  const hash = bacaHash();
  let tampil = ada ? 'langkah' : 'mulai', langkah = 0;
  if (ada) { const st = parseInt(Gudang.baca(KUNCI_LANGKAH), 10); if (st >= 0 && st < LANGKAH.length) langkah = st; }
  if (hash) { if (hash.v === 'mulai') tampil = 'mulai'; else if (ada) { tampil = 'langkah'; langkah = hash.i; } }
  if (tampil === 'langkah') goStep(langkah, { diam: true, ganti: true }); else tampilMulai({ diam: true, ganti: true });
  emit('app_dibuka', { mode: CFG.mode, versi: VERSI_APP });
  daftarkanPWA();

  window.KPBApp = {
    versi: VERSI_APP,
    setTema(t) { CFG.tema = t; terapkanTema(); },
    bukaLangkah(i) { if (adaDataPenting() || App.view === 'langkah') goStep((Number(i) || 1) - 1); },
    layarAwal() { tampilMulai(); },
  };
}

mulaiAplikasi();
