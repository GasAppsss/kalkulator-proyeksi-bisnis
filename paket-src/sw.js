/* Service worker kalkulator proyeksi bisnis.
   Tujuan: setelah dibuka sekali, halaman tetap bisa dipakai tanpa internet (cocok untuk sinyal lemah).
   Strategi: jaringan dulu, supaya pengguna yang online selalu mendapat versi terbaru; bila jaringan gagal atau lebih lambat
   dari 4 detik, dipakai salinan tersimpan. Font dan pustaka Excel diambil dari salinan dulu karena isinya tidak berubah.
   Berkas ini hanya aktif bila config.js berisi pwa: true. VERSI dan daftar berkas diisi otomatis saat build;
   bila Anda mengganti berkas secara manual, ubah VERSI agar salinan lama dibuang. */
const VERSI = '__VERSI__';
const CACHE = 'kpb-' + VERSI;
const BASE = new URL('./', self.location).pathname;
const INTI = ['./', 'index.html', 'kpb.js', 'config.js', 'awal.css', 'favicon.svg', 'manifest.webmanifest'];
const PENDUKUNG = __PENDUKUNG__;
const BATAS_TUNGGU = 4000;

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    /* berkas inti wajib lengkap; bila satu gagal, pemasangan dibatalkan dan dicoba lagi lain kali */
    await Promise.all(INTI.map((u) => c.add(new Request(u, { cache: 'reload' }))));
    await Promise.all(PENDUKUNG.map((u) => c.add(new Request(u, { cache: 'reload' })).catch(() => {})));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const nama = await caches.keys();
    await Promise.all(nama.filter((n) => n.indexOf('kpb-') === 0 && n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

/* kunci salinan tanpa query string, supaya ?utm_source=... tidak membuat salinan ganda */
const kunciDari = (r) => { const u = new URL(r.url); return new Request(u.origin + u.pathname); };

async function simpan(r, res) {
  try {
    if (!res || !res.ok || res.status !== 200 || res.type === 'opaque') return;
    const salinan = res.clone(); /* harus disalin sebelum ada await: isi respons segera dibaca halaman */
    /* hanya menulis ke cache yang masih ada: service worker lama yang baru selesai mengambil berkas tidak boleh menghidupkan lagi cache yang sudah dibuang */
    if (!(await caches.has(CACHE))) return;
    const c = await caches.open(CACHE);
    await c.put(kunciDari(r), salinan);
  } catch (e) { /* ruang penyimpanan penuh atau diblokir: abaikan */ }
}

async function cadangan(r) {
  const c = await caches.match(kunciDari(r));
  if (c) return c;
  if (r.mode === 'navigate') {
    const p = new URL(r.url).pathname;
    if (p === BASE || p === BASE + 'index.html') return caches.match('index.html');
  }
  return null;
}

function jaringanDulu(r) {
  return new Promise((ok) => {
    let selesai = false;
    const kirim = (res) => { if (!selesai) { selesai = true; ok(res); } };
    const t = setTimeout(async () => { const c = await cadangan(r); if (c) kirim(c); }, BATAS_TUNGGU);
    fetch(r).then((res) => { clearTimeout(t); simpan(r, res); kirim(res); })
      .catch(async () => { clearTimeout(t); const c = await cadangan(r); kirim(c || Response.error()); });
  });
}

async function salinanDulu(r) {
  const c = await caches.match(kunciDari(r));
  if (c) return c;
  const res = await fetch(r);
  simpan(r, res);
  return res;
}

self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== self.location.origin || u.pathname.indexOf(BASE) !== 0) return;
  if (u.pathname === BASE + 'sw.js') return;
  e.respondWith(/\/(fonts|vendor)\//.test(u.pathname) ? salinanDulu(r) : jaringanDulu(r));
});
