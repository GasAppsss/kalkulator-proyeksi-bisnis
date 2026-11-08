/* ===== config: pengaturan penempatan, peristiwa untuk analitik, dan pembantu id ===== */
/* SEBAGAI_ARTIFACT adalah konstanta saat build (esbuild --define): true untuk halaman artifact, false untuk paket mandiri.
   Cabang yang tidak berlaku dibuang dari hasil build, jadi paket mandiri tidak memuat kode atau alamat khusus artifact. */
const VERSI_APP = '2.0.0';
const TGL_ATURAN_BAWAAN = 'Oktober 2026';
let TGL_ATURAN = TGL_ATURAN_BAWAAN;

/* Pengaturan bisa ditimpa lewat window.KPB_CONFIG sebelum skrip ini dimuat. Lihat README untuk contoh. */
const CFG = Object.assign({
  tema: 'auto',            /* 'auto' mengikuti perangkat, atau 'terang' / 'gelap' */
  mode: 'mandiri',         /* 'mandiri' = halaman sendiri, 'tertanam' = di dalam halaman lain */
  tinggiOtomatis: false,   /* kirim tinggi konten ke halaman induk (untuk iframe) */
  riwayat: null,           /* tombol Kembali per langkah; null = otomatis (aktif di halaman mandiri) */
  kunci: 'kpb',            /* awalan kunci penyimpanan peramban */
  merek: '',               /* nama merek di kaki halaman */
  cta: null,               /* { judul, isi, tombol, href, target } */
  kebijakan: '',           /* tautan kebijakan privasi (opsional) */
  onEvent: null,           /* fungsi (e) => void, menerima setiap peristiwa */
  indukOrigin: '*',        /* origin tujuan pesan ke halaman induk (iframe); isi dengan alamat situs Anda */
  xlsxSrc: '',             /* alamat pustaka Excel; kosong = berkas vendor/ di samping kpb.js, lalu CDN */
  pajak: null,             /* timpa tarif bawaan, mis. { 'op-final': { pajakOmzet: 0.5 } } */
  tglAturan: '',           /* tanggal pemeriksaan aturan pajak yang ditampilkan; kosong = bawaan */
  pwa: false,              /* true = daftarkan sw.js agar bisa dipasang di layar utama dan dibuka tanpa internet (hanya halaman mandiri) */
}, (typeof window !== 'undefined' && window.KPB_CONFIG && typeof window.KPB_CONFIG === 'object') ? window.KPB_CONFIG : {});

if (CFG.tglAturan) TGL_ATURAN = String(CFG.tglAturan).slice(0, 40);

/* alamat folder skrip ini, dipakai memuat pustaka Excel dari berkas sendiri */
const ALAMAT_DASAR = (() => {
  try { return document.currentScript && document.currentScript.src ? new URL('.', document.currentScript.src).href : ''; } catch (e) { return ''; }
})();

const PAKAI_RIWAYAT = !SEBAGAI_ARTIFACT && (CFG.riwayat != null ? !!CFG.riwayat : CFG.mode !== 'tertanam');

/* semua id dalam aplikasi diberi awalan agar tidak bertabrakan dengan halaman induk */
const pref = (id) => (String(id).indexOf('kpb-') === 0 ? String(id) : 'kpb-' + id);
const $ = (id) => (App.root || document).getElementById(pref(id));

/* ---------- peristiwa (tanpa angka usaha atau nama pengguna) ---------- */
const sekali = {};
function emit(nama, props) {
  const e = { sumber: 'proyeksi-bisnis', nama, props: props || {}, t: Date.now() };
  try { (App.host || document).dispatchEvent(new CustomEvent('kpb:event', { detail: e, bubbles: true, composed: true })); } catch (x) { /* abaikan */ }
  try { if (typeof CFG.onEvent === 'function') CFG.onEvent(e); } catch (x) { /* abaikan */ }
  try { if (!SEBAGAI_ARTIFACT && window.parent && window.parent !== window) window.parent.postMessage({ kpb: 1, jenis: 'event', event: e }, CFG.indukOrigin || '*'); } catch (x) { /* abaikan */ }
}
function emitSekali(nama, props) {
  if (sekali[nama]) return;
  sekali[nama] = true;
  emit(nama, props);
}

/* kirim pesan ke halaman induk (hanya bila ditanam dalam iframe dan diminta lewat konfigurasi) */
function kePosInduk(jenis, data) {
  try {
    if (!SEBAGAI_ARTIFACT && CFG.tinggiOtomatis && window.parent && window.parent !== window) window.parent.postMessage(Object.assign({ kpb: 1, jenis }, data || {}), CFG.indukOrigin || '*');
  } catch (x) { /* abaikan */ }
}
