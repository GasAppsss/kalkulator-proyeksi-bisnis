/* Uji mode offline: service worker memasang salinan, halaman tetap terbuka saat server mati, versi baru menggantikan yang lama, dan tidak aktif di iframe atau mode tertanam */
const L = require('./lib.cjs');
const { cek, langkah, path, fs } = L;
const KERJA = path.join(L.KPB_DIR, 'dist/_pwa');
const salin = (nama) => { const d = path.join(KERJA, nama); fs.rmSync(d, { recursive: true, force: true }); fs.cpSync(L.FOLDER, d, { recursive: true }); return d; };
const namaCache = (p) => p.evaluate(() => caches.keys());
const jumlahSalinan = (p) => p.evaluate(async () => { const k = await caches.keys(); if (!k.length) return 0; return (await (await caches.open(k[0])).keys()).length; });
/* menunggu sampai fungsi async di halaman mengembalikan nilai benar (polling manual) */
async function tunggu(p, fn, ms, arg) {
  const batas = Date.now() + (ms || 20000);
  while (Date.now() < batas) { if (await p.evaluate(fn, arg)) return true; await p.waitForTimeout(250); }
  return false;
}
/* jumlah berkas yang harus tersimpan: halaman "/" + 6 berkas inti + semua font dan pustaka di paket + kpb.css + 4 ikon */
const NPAKET = 1 + 6 + fs.readdirSync(path.join(L.FOLDER, 'fonts')).length + fs.readdirSync(path.join(L.FOLDER, 'vendor')).length + 1 + 4;
const tungguAktif = (p) => p.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });

(async () => {
  fs.rmSync(KERJA, { recursive: true, force: true });
  fs.mkdirSync(KERJA, { recursive: true });
  const browser = await L.chromium.launch();

  /* ===== 1. manifest dan ikon ===== */
  {
    const m = JSON.parse(fs.readFileSync(path.join(L.FOLDER, 'manifest.webmanifest'), 'utf8'));
    cek(m.display === 'standalone' && m.start_url === './' && m.scope === './' && m.lang === 'id' && m.name && m.short_name, 'manifest: nama, bahasa, tampilan, dan lingkup terisi', m);
    const png = (f) => { const b = fs.readFileSync(path.join(L.FOLDER, f)); return b.readUInt32BE(16) + 'x' + b.readUInt32BE(20); };
    m.icons.forEach((i) => cek(fs.existsSync(path.join(L.FOLDER, i.src)) && png(i.src) === i.sizes, 'ikon ' + i.src + ' ada dan berukuran ' + i.sizes, png(i.src)));
    cek(m.icons.some((i) => i.purpose === 'maskable') && m.icons.some((i) => /192/.test(i.sizes)) && m.icons.some((i) => /512/.test(i.sizes)), 'manifest memuat ikon 192, 512, dan maskable');
    cek(png('ikon-180.png') === '180x180', 'ikon iOS 180x180', png('ikon-180.png'));
    const idx = fs.readFileSync(path.join(L.FOLDER, 'index.html'), 'utf8');
    cek(/rel="manifest" href="manifest\.webmanifest"/.test(idx) && /rel="apple-touch-icon" href="ikon-180\.png"/.test(idx), 'index.html menaut manifest dan ikon iOS');
    const sw = fs.readFileSync(path.join(L.FOLDER, 'sw.js'), 'utf8');
    cek(!/__VERSI__|__PENDUKUNG__/.test(sw) && /const VERSI = '2\.\d+\.\d+-[0-9a-f]{8}'/.test(sw), 'sw.js: versi dan daftar berkas terisi saat build', (sw.match(/const VERSI = [^;]+/) || [])[0]);
  }

  /* ===== 2. pemasangan, offline, dan pembaruan ===== */
  {
    const dir = salin('a');
    let S = await L.mulai(dir);
    const port = S.port;
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'id-ID', timezoneId: 'Asia/Jakarta', acceptDownloads: true, reducedMotion: 'reduce' });
    await ctx.addInitScript(L.SKRIP_AWAL);
    const p = await ctx.newPage();
    const logs = [];
    p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.text()); });
    p.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
    await p.goto(S.url + '/');
    await p.waitForSelector('#kpb-view');
    cek(await tungguAktif(p), 'service worker terdaftar dan aktif');
    await tunggu(p, async (n) => { const k = await caches.keys(); return k.length === 1 && (await (await caches.open(k[0])).keys()).length >= n; }, 20000, NPAKET);
    const ks = await namaCache(p);
    cek(ks.length === 1 && /^kpb-2\.\d+\.\d+-[0-9a-f]{8}$/.test(ks[0]), 'satu cache berversi dibuat', ks);
    const n = await jumlahSalinan(p);
    cek(n === NPAKET, 'semua ' + NPAKET + ' berkas inti dan pendukung tersimpan (halaman, skrip, font, pustaka Excel, ikon)', n);
    const daftarCache = await p.evaluate(async () => { const k = await caches.keys(); return (await (await caches.open(k[0])).keys()).map((r) => new URL(r.url).pathname); });
    ['/', '/index.html', '/kpb.js', '/kpb.css', '/config.js', '/vendor/xlsx.mini.min.js', '/fonts/plus-jakarta-sans-latin-400-normal.woff2', '/manifest.webmanifest', '/ikon-192.png'].forEach((u) => cek(daftarCache.indexOf(u) >= 0, 'tersimpan: ' + u, daftarCache));
    cek(daftarCache.indexOf('/sw.js') < 0 && daftarCache.indexOf('/README.md') < 0, 'sw.js dan dokumentasi tidak ikut disimpan');

    /* isi data supaya terlihat tetap ada saat offline */
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    await langkah(p, 5);
    await p.waitForTimeout(700);
    await p.reload();
    await p.waitForSelector('#kpb-view');
    cek(await p.evaluate(() => !!navigator.serviceWorker.controller), 'halaman dikendalikan service worker setelah dimuat ulang');

    /* server mati total */
    await S.srv.berhenti();
    await p.goto(S.url + '/?utm_source=uji');
    await p.waitForSelector('#kpb-view', { timeout: 15000 });
    cek(await p.locator('#kpb-panel').count() === 1 && /BEP|impas/i.test(await p.locator('#kpb-panel').innerText()), 'offline: halaman terbuka dengan data yang tersimpan (query string diabaikan)');
    const fontOff = await p.evaluate(async () => { await document.fonts.ready; return [...document.fonts].some((f) => f.family.indexOf('Plus Jakarta') >= 0 && f.status === 'loaded'); });
    cek(fontOff, 'offline: font tersedia dari salinan');
    await langkah(p, 6);
    const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 15000 }), p.getByRole('button', { name: 'Unduh Excel (.xlsx)' }).click()]);
    cek(/\.xlsx$/.test(dl.suggestedFilename()), 'offline: unduh Excel tetap berfungsi (pustaka dari salinan)', dl.suggestedFilename());
    const g = await p.evaluate(() => window.__R().querySelector('.btn') ? getComputedStyle(window.__R().querySelector('.btn')).borderTopColor : null);
    cek(g && g !== 'rgb(0, 0, 0)', 'offline: gaya aplikasi terpasang');
    const p2 = await ctx.newPage();
    const hasilTakAda = await p2.goto(S.url + '/tidak-ada.html').then(() => 'terbuka').catch(() => 'galat');
    cek(hasilTakAda === 'galat', 'offline: alamat yang tidak pernah disimpan gagal dibuka, tidak diganti dengan halaman utama', hasilTakAda);
    await p2.close();

    /* server hidup lagi dengan versi baru: jaringan lebih dulu */
    fs.appendFileSync(path.join(dir, 'kpb.js'), '\nwindow.__versiBaru = true;');
    fs.writeFileSync(path.join(dir, 'config.js'), fs.readFileSync(path.join(dir, 'config.js'), 'utf8').replace("merek: ''", "merek: 'Merek Baru'"));
    S = await L.mulai(dir, port);
    await p.goto(S.url + '/');
    await p.waitForSelector('#kpb-view');
    cek(await p.evaluate(() => window.__versiBaru === true), 'online: skrip terbaru dipakai (jaringan dulu, bukan salinan lama)');
    cek(/Merek Baru/.test(await p.locator('.foot').innerText()), 'online: config.js terbaru dipakai');

    /* pembaruan service worker: versi baru menggantikan cache lama */
    const swFile = path.join(dir, 'sw.js');
    fs.writeFileSync(swFile, fs.readFileSync(swFile, 'utf8').replace(/const VERSI = '([^']+)'/, "const VERSI = '$1-b'"));
    await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
    await tunggu(p, async () => { const k = await caches.keys(); return k.length === 1 && /-b$/.test(k[0]); });
    await p.waitForTimeout(800);
    const ks2 = await namaCache(p);
    cek(ks2.length === 1 && /-b$/.test(ks2[0]), 'versi baru: cache lama dibuang, hanya cache baru tersisa', ks2);
    cek(await jumlahSalinan(p) === NPAKET, 'versi baru: semua berkas tersimpan ulang');

    /* server lambat: setelah 4 detik dipakai salinan */
    await S.srv.berhenti();
    S = await L.mulai(dir, port, { tunda: (u) => (u === '/kpb.js' ? 9000 : 0) });
    const t0 = Date.now();
    await p.goto(S.url + '/', { waitUntil: 'commit' });
    await p.waitForSelector('#kpb-view', { timeout: 15000 });
    const waktu = Date.now() - t0;
    cek(waktu >= 3500 && waktu < 8500, 'server lambat: salinan dipakai setelah sekitar 4 detik, tidak menunggu 9 detik (' + waktu + ' ms)', waktu);

    /* sw.js pembatal dari README mencabut pendaftaran dan menghapus cache */
    await S.srv.berhenti();
    S = await L.mulai(dir, port);
    const readme = fs.readFileSync(path.join(L.KPB_DIR, 'paket-src/README.md'), 'utf8');
    const pembatal = (readme.match(/```js\nself\.addEventListener\('install'[\s\S]*?```/) || [''])[0].replace(/```js\n|```/g, '');
    cek(/unregister/.test(pembatal), 'README memuat skrip pembatal service worker');
    fs.writeFileSync(swFile, pembatal);
    await p.evaluate(async () => { const r = await navigator.serviceWorker.getRegistration(); await r.update(); });
    await tunggu(p, async () => (await navigator.serviceWorker.getRegistrations()).length === 0 && (await caches.keys()).length === 0);
    cek(await p.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length) === 0 && (await namaCache(p)).length === 0, 'skrip pembatal: pendaftaran dicabut dan cache dihapus');
    cek(logs.filter((x) => !/net::ERR|Failed to load resource|ERR_CONNECTION/.test(x)).length === 0, 'offline: tanpa galat konsol selain kegagalan jaringan yang disengaja', logs.slice(0, 4));
    await ctx.close();
    await S.srv.berhenti();
  }

  /* ===== 3. tidak aktif di iframe, mode tertanam, dan saat pwa dimatikan ===== */
  {
    const dir = salin('b');
    const S = await L.mulai(dir);
    const kasus = [
      ['iframe.html', '/iframe.html'],
      ['mode tertanam', '/tertanam.html'],
      ['pwa: false', '/mati.html'],
    ];
    const idx = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
    fs.writeFileSync(path.join(dir, 'tertanam.html'), idx.replace('<script src="config.js"></script>', '<script>window.KPB_CONFIG={pwa:true,mode:"tertanam"};</script>'));
    fs.writeFileSync(path.join(dir, 'mati.html'), idx.replace('<script src="config.js"></script>', '<script>window.KPB_CONFIG={pwa:false};</script>'));
    for (const [nama, url] of kasus) {
      const ctx = await browser.newContext({ reducedMotion: 'reduce' });
      const p = await ctx.newPage();
      await p.goto(S.url + url);
      await p.waitForSelector('#kpb-view');
      await p.waitForTimeout(1200);
      const r = await p.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length + '|' + (await caches.keys()).length);
      cek(r === '0|0', nama + ': tidak mendaftarkan service worker dan tidak menyimpan cache', r);
      await ctx.close();
    }
    await S.srv.berhenti();
  }

  await browser.close();
  fs.rmSync(KERJA, { recursive: true, force: true });
  process.exit(L.ringkas('PWA') ? 1 : 0);
})().catch((e) => { console.error('UJI BERHENTI:', e.stack.split('\n').slice(0, 8).join('\n')); process.exit(2); });
