/* Uji GitHub Pages: docs/ harus siap dilayani dari alamat berfolder (https://akun.github.io/nama-repo/), bukan dari akar domain.
   Bagian 1 memeriksa isi docs/ terhadap dist/paket. Bagian 2 melayani salinan docs/ di bawah /kalkulator-proyeksi-bisnis/ dengan
   Cache-Control seperti milik Pages (max-age=600), tanpa CSP dan tanpa header kustom, lalu memakai aplikasinya dari sana. */
const L = require('./lib.cjs');
const { cek, langkah, path, fs } = L;
const DOCS = path.join(L.KPB_DIR, 'docs');
const KERJA = path.join(L.KPB_DIR, 'dist/_pages');
const NAMA_REPO = 'kalkulator-proyeksi-bisnis';
const SUB = '/' + NAMA_REPO + '/';
const PAGES_URL = (process.env.PAGES_URL || 'https://gasappsss.github.io/' + NAMA_REPO + '/').replace(/\/*$/, '/');

const daftar = (d) => {
  const o = [];
  const j = (r) => fs.readdirSync(path.join(d, r), { withFileTypes: true }).forEach((e) => (e.isDirectory() ? j(path.join(r, e.name)) : o.push(path.join(r, e.name).split(path.sep).join('/'))));
  j('');
  return o.sort();
};
async function tunggu(p, fn, ms, arg) {
  const batas = Date.now() + (ms || 20000);
  while (Date.now() < batas) { if (await p.evaluate(fn, arg)) return true; await p.waitForTimeout(250); }
  return false;
}

(async () => {
  /* ===== 1. isi docs/ ===== */
  cek(fs.existsSync(DOCS), 'folder docs/ ada (dibuat oleh node build.js)');
  const paket = daftar(L.FOLDER), docs = daftar(DOCS);
  cek(docs.indexOf('.nojekyll') >= 0 && fs.statSync(path.join(DOCS, '.nojekyll')).size === 0, 'docs/.nojekyll ada dan kosong, supaya Jekyll tidak membuang berkas berawalan garis bawah seperti _headers');
  const lebih = docs.filter((f) => paket.indexOf(f) < 0 && f !== '.nojekyll'), kurang = paket.filter((f) => docs.indexOf(f) < 0);
  cek(!lebih.length && !kurang.length, 'docs/ memuat persis berkas yang sama dengan dist/paket (ditambah .nojekyll)', { lebih, kurang });
  const beda = paket.filter((f) => docs.indexOf(f) >= 0 && !fs.readFileSync(path.join(L.FOLDER, f)).equals(fs.readFileSync(path.join(DOCS, f))));
  cek(beda.length === 1 && beda[0] === 'index.html', 'satu-satunya berkas yang berbeda dari dist/paket adalah index.html (pratinjau tautan diaktifkan)', beda);
  const idx = fs.readFileSync(path.join(DOCS, 'index.html'), 'utf8');
  cek(idx.indexOf('<link rel="canonical" href="' + PAGES_URL + '">') >= 0, 'docs/index.html: canonical memakai alamat Pages', PAGES_URL);
  cek(idx.indexOf('<meta property="og:url" content="' + PAGES_URL + '">') >= 0 && idx.indexOf('<meta property="og:image" content="' + PAGES_URL + 'og-image.png">') >= 0, 'docs/index.html: og:url dan og:image memakai alamat Pages');
  cek(idx.indexOf('<meta name="twitter:card" content="summary_large_image">') >= 0 && idx.indexOf('<meta property="og:image:width" content="1200">') >= 0, 'docs/index.html: twitter:card dan ukuran gambar pratinjau terisi');
  cek(!/situsanda\.com/.test(idx) && idx.indexOf('<!--') < 0, 'docs/index.html: tanpa sisa alamat contoh dan tanpa blok komentar');
  const dasar = fs.readFileSync(path.join(L.FOLDER, 'index.html'), 'utf8');
  cek(dasar.indexOf('<!-- Pratinjau saat tautan dibagikan') >= 0 && dasar.indexOf('<link rel="canonical"') > dasar.indexOf('<!--'), 'dist/paket/index.html tetap memuat blok pratinjau yang dimatikan (untuk situs lain)');
  const png = fs.readFileSync(path.join(DOCS, 'og-image.png'));
  cek(png.readUInt32BE(16) === 1200 && png.readUInt32BE(20) === 630 && png.length < 200 * 1024, 'docs/og-image.png berukuran 1200x630 dan kurang dari 200 KB', png.length);
  cek(/^[0-9a-f]{8}$/.test((/const VERSI = '[^']*-([0-9a-f]{8})'/.exec(fs.readFileSync(path.join(DOCS, 'sw.js'), 'utf8')) || [])[1] || ''), 'docs/sw.js berversi (sidik jari terisi)');

  /* ===== 2. dilayani dari subfolder, seperti https://akun.github.io/nama-repo/ ===== */
  fs.rmSync(KERJA, { recursive: true, force: true });
  const akar = path.join(KERJA, 'situs');
  fs.mkdirSync(akar, { recursive: true });
  fs.cpSync(DOCS, path.join(akar, NAMA_REPO), { recursive: true });
  const S = await L.mulai(akar, 0, { headers: { 'Cache-Control': 'max-age=600', 'Access-Control-Allow-Origin': '*' } });
  const alamat = S.url + SUB;
  const browser = await L.chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'id-ID', timezoneId: 'Asia/Jakarta', reducedMotion: 'reduce' });
  await ctx.addInitScript(L.SKRIP_AWAL);
  const p = await ctx.newPage();
  const logs = [], gagalMuat = [], diminta = [];
  p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.text()); });
  p.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
  p.on('requestfailed', (r) => gagalMuat.push('gagal ' + r.url()));
  p.on('response', (r) => { if (r.status() >= 400) gagalMuat.push(r.status() + ' ' + r.url()); });
  p.on('request', (r) => { const u = new URL(r.url()); if (u.origin === S.url) diminta.push(u.pathname); });

  await p.goto(alamat);
  await p.waitForSelector('#kpb-view');
  cek((await p.title()) === 'Kalkulator Proyeksi Bisnis: HPP, BEP, dan Balik Modal', 'subfolder: judul halaman benar', await p.title());
  cek((await p.evaluate(() => (document.querySelector('link[rel="canonical"]') || {}).href)) === PAGES_URL, 'subfolder: tautan canonical terbaca di halaman');
  cek((await p.evaluate(() => (document.querySelector('meta[property="og:image"]') || {}).content)) === PAGES_URL + 'og-image.png', 'subfolder: og:image terbaca di halaman');
  cek((await p.locator('#kpb-app h1').count()) === 1 && (await p.locator('.tpl').count()) >= 3, 'subfolder: aplikasi tampil lengkap dengan pilihan template');

  /* pakai aplikasinya sampai hasil */
  await p.locator('.tpl').first().click();
  await p.waitForSelector('#kpb-panel');
  for (let n = 1; n <= 5; n++) await langkah(p, n);
  cek(!(await L.layarBersih(p)), 'subfolder: langkah 5 (hasil) bersih dari teks rusak', await L.layarBersih(p));
  cek((await p.locator('svg[role="img"]').count()) >= 2, 'subfolder: grafik tampil');
  const font = await p.evaluate(async () => { await document.fonts.ready; return [...document.fonts].filter((f) => f.status === 'loaded' && /Plus Jakarta Sans/.test(f.family)).length; });
  cek(font >= 2, 'subfolder: font Plus Jakarta Sans termuat dari folder yang sama', font);

  /* service worker dan manifest di subfolder */
  cek(await p.evaluate(async () => !!(await navigator.serviceWorker.ready).active), 'subfolder: service worker aktif');
  const NPAKET = 1 + 6 + fs.readdirSync(path.join(DOCS, 'fonts')).length + fs.readdirSync(path.join(DOCS, 'vendor')).length + 1 + 4;
  await tunggu(p, async (n) => { const k = await caches.keys(); return k.length === 1 && (await (await caches.open(k[0])).keys()).length >= n; }, 20000, NPAKET);
  const sw = await p.evaluate(async () => { const r = await navigator.serviceWorker.ready; return { scope: new URL(r.scope).pathname, skrip: new URL(r.active.scriptURL).pathname }; });
  cek(sw.scope === SUB && sw.skrip === SUB + 'sw.js', 'subfolder: service worker memakai cakupan folder repositori', sw);
  const simpanan = await p.evaluate(async () => { const k = await caches.keys(); return (await (await caches.open(k[0])).keys()).map((r) => new URL(r.url).pathname); });
  cek(simpanan.length === NPAKET && simpanan.every((u) => u.indexOf(SUB) === 0), 'subfolder: ' + NPAKET + ' berkas tersimpan, semuanya di bawah folder repositori', simpanan);
  cek(simpanan.indexOf(SUB) >= 0 && simpanan.indexOf(SUB + 'kpb.js') >= 0 && simpanan.indexOf(SUB + 'kpb.css') >= 0, 'subfolder: halaman, skrip, dan gaya cadangan ikut tersimpan');
  const manifest = await p.evaluate(async () => { const a = document.querySelector('link[rel="manifest"]').href; const m = await (await fetch(a)).json(); return { alamat: a, start: new URL(m.start_url, a).pathname, scope: new URL(m.scope, a).pathname, ikon: m.icons.map((i) => new URL(i.src, a).pathname) }; });
  cek(manifest.start === SUB && manifest.scope === SUB && manifest.ikon.every((u) => u.indexOf(SUB) === 0), 'subfolder: start_url, scope, dan ikon manifest menunjuk ke folder repositori', manifest);
  const keluarFolder = diminta.filter((u) => u.indexOf(SUB) !== 0);
  cek(!keluarFolder.length, 'subfolder: tidak ada permintaan ke luar folder repositori (tidak ada alamat absolut dari akar domain)', keluarFolder);
  cek(!logs.length && !gagalMuat.length, 'subfolder: tanpa galat konsol dan tanpa sumber daya yang gagal dimuat', { logs, gagalMuat });

  /* offline: server mati, halaman tetap terbuka dari salinan */
  await S.srv.berhenti();
  await p.reload();
  await p.waitForSelector('#kpb-view', { timeout: 15000 });
  cek((await p.locator('#kpb-app h1').count()) === 1 && (await p.locator('.tpl, #kpb-panel').count()) >= 1, 'subfolder offline: halaman tetap terbuka dari salinan tersimpan');
  cek(!logs.some((x) => /^pageerror/.test(x)), 'subfolder offline: tanpa galat skrip', logs);

  await browser.close();
  fs.rmSync(KERJA, { recursive: true, force: true });
  process.exit(L.ringkas('PAGES') ? 1 : 0);
})().catch((e) => { console.error('UJI BERHENTI:', e.stack.split('\n').slice(0, 8).join('\n')); process.exit(2); });
