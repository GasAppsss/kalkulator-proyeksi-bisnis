/* Uji isi paket penerapan: berkas lengkap, tanpa sumber luar, dokumentasi cocok dengan kode, header konsisten, contoh berjalan */
const L = require('./lib.cjs');
const { cek, langkah, path, fs } = L;
const zlib = require('zlib');
const cp = require('child_process');
const P = L.FOLDER;
const baca = (f) => fs.readFileSync(path.join(P, f), 'utf8');
const src = (f) => fs.readFileSync(path.join(L.KPB_DIR, 'src', f), 'utf8');
const semuaBerkas = (d, awal) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? semuaBerkas(path.join(d, e.name), (awal || '') + e.name + '/') : [(awal || '') + e.name]));

(async () => {
  const berkas = semuaBerkas(P);

  /* ===== 1. kelengkapan ===== */
  const wajib = ['index.html', 'iframe.html', 'config.js', 'config-iframe.js', 'kpb.js', 'awal.css', 'favicon.svg', 'manifest.webmanifest', 'sw.js', 'README.md', '_headers',
    'contoh-iframe.html', 'contoh-inline.html', 'LISENSI-PIHAK-KETIGA.txt', 'vendor/xlsx.mini.min.js', 'lisensi/sheetjs-Apache-2.0.txt', 'lisensi/plus-jakarta-sans-OFL-1.1.txt',
    'server/vercel.json', 'server/nginx.conf.contoh', 'server/htaccess.contoh', 'ikon-180.png', 'ikon-192.png', 'ikon-512.png', 'ikon-maskable-512.png', 'kpb.css', 'og-image.png'];
  wajib.forEach((f) => cek(berkas.indexOf(f) >= 0 && fs.statSync(path.join(P, f)).size > 50, 'ada: ' + f));
  cek(berkas.filter((f) => /^fonts\/.*\.woff2$/.test(f)).length === 4, 'empat berkas font woff2 (Plus Jakarta Sans 300, 400, 500, 600)', berkas.filter((f) => /^fonts\//.test(f)));
  cek(!berkas.some((f) => /node_modules|\.map$|\.cjs$|\.test\.|^test\/|^src\/|\.DS_Store|Thumbs\.db|~$/.test(f)), 'tidak ada berkas pengembangan atau sampah di paket', berkas.filter((f) => /node_modules|\.map$|\.cjs$|\.test\.|^test\/|^src\/|\.DS_Store/.test(f)));
  const total = berkas.reduce((a, f) => a + fs.statSync(path.join(P, f)).size, 0);
  const gz = zlib.gzipSync(fs.readFileSync(path.join(P, 'kpb.js'))).length;
  cek(fs.statSync(path.join(P, 'kpb.js')).size < 200 * 1024, 'kpb.js di bawah 200 KB (' + Math.round(fs.statSync(path.join(P, 'kpb.js')).size / 1024) + ' KB, ' + Math.round(gz / 1024) + ' KB setelah gzip)');
  cek(total < 1.2 * 1024 * 1024, 'seluruh paket di bawah 1,2 MB (' + Math.round(total / 1024) + ' KB)');
  console.log('   ukuran paket ' + Math.round(total / 1024) + ' KB, kpb.js ' + Math.round(fs.statSync(path.join(P, 'kpb.js')).size / 1024) + ' KB (gzip ' + Math.round(gz / 1024) + ' KB), ' + berkas.length + ' berkas');

  /* ===== 2. referensi di halaman mengarah ke berkas yang ada ===== */
  ['index.html', 'iframe.html', 'contoh-iframe.html', 'contoh-inline.html'].forEach((h) => {
    const t = baca(h).replace(/<pre[\s\S]*?<\/pre>/g, ''); /* contoh kode di dalam <pre> bukan rujukan sungguhan */
    const rujukan = [...t.matchAll(/(?:src|href)="([^"#?]+)"/g)].map((m) => m[1]).filter((u) => !/^(https?:|data:|mailto:)/.test(u));
    rujukan.forEach((u) => cek(berkas.indexOf(u) >= 0, h + ' merujuk ' + u + ' yang ada'));
    cek(/<html lang="id">/.test(t) && /<meta charset="utf-8">/i.test(t) && /name="viewport"/.test(t) && /<title>[^<]+<\/title>/.test(t), h + ': lang, charset, viewport, dan title lengkap');
  });
  cek(/<meta name="robots" content="noindex">/.test(baca('iframe.html')), 'iframe.html tidak diindeks mesin pencari');
  cek(!/<script>/.test(baca('index.html')) && !/<script>/.test(baca('iframe.html')) && !/\sstyle=|<style/.test(baca('index.html')) && !/\sstyle=|<style/.test(baca('iframe.html')), 'index.html dan iframe.html tanpa skrip atau gaya inline (siap CSP ketat)');
  const sw = baca('sw.js');
  const daftarSW = JSON.parse(/const PENDUKUNG = (\[.*?\]);/.exec(sw)[1]).concat((/const INTI = (\[.*?\]);/.exec(sw)[1].replace(/'/g, '"') && JSON.parse(/const INTI = (\[.*?\]);/.exec(sw)[1].replace(/'/g, '"'))).filter((u) => u !== './'));
  daftarSW.forEach((u) => cek(berkas.indexOf(u) >= 0, 'sw.js menyimpan ' + u + ' yang ada di paket'));

  /* ===== 3. tanpa sumber luar, tanpa eval ===== */
  const runtime = ['index.html', 'iframe.html', 'config.js', 'config-iframe.js', 'awal.css', 'kpb.css', 'sw.js', 'manifest.webmanifest', 'favicon.svg', 'kpb.js'];
  const diizinkan = /^https?:\/\/(www\.w3\.org|pajak\.go\.id|news\.ddtc\.co\.id|ikpi\.or\.id|situsanda\.com|contoh\.com|kalkulator\.situsanda\.com)/;
  runtime.forEach((f) => {
    const luar = (baca(f).match(/https?:\/\/[^\s"'`)<>\\]+/g) || []).filter((u) => !diizinkan.test(u));
    cek(luar.length === 0, f + ': tidak menyebut alamat luar yang tidak dikenal', luar.slice(0, 5));
  });
  const js = baca('kpb.js');
  cek(!/\beval\s*\(/.test(js) && !/new Function\s*\(/.test(js) && !/\bimportScripts\b/.test(js), 'kpb.js tanpa eval, new Function, importScripts');
  cek(!/XMLHttpRequest|\bfetch\s*\(|sendBeacon|WebSocket|EventSource/.test(js), 'kpb.js tidak melakukan permintaan jaringan sendiri (tanpa fetch, XHR, beacon, WebSocket)');
  cek(!/document\.cookie/.test(js), 'kpb.js tidak memakai cookie');
  cek(!/innerHTML\s*=|insertAdjacentHTML|outerHTML\s*=/.test(js.replace(/\.outerHTML(?!\s*=)/g, '')), 'kpb.js tidak menyisipkan HTML dari string (hanya DOM)');
  cek(!/googleapis|gstatic|cdnjs|unpkg|jsdelivr/.test(js), 'kpb.js tidak menyebut CDN');
  cek(/cdnjs\.cloudflare\.com/.test(fs.readFileSync(path.join(L.KPB_DIR, 'dist/artifact.html'), 'utf8')), 'pembanding: versi artifact memang memuat alamat CDN (kode khusus artifact terpisah dari paket)');

  /* ===== 4. dokumentasi cocok dengan kode ===== */
  const readme = baca('README.md');
  const cfgSrc = src('config.js');
  const blok = /const CFG = Object\.assign\(\{([\s\S]*?)\n\}, \(typeof window/.exec(cfgSrc)[1];
  const kunciCfg = [...blok.matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1]);
  cek(kunciCfg.length >= 14, 'kunci konfigurasi terbaca dari kode (' + kunciCfg.length + ')', kunciCfg);
  kunciCfg.forEach((k) => cek(new RegExp('\\| `' + k + '` \\|').test(readme), 'README mendokumentasikan opsi ' + k));
  const semuaSrc = fs.readdirSync(path.join(L.KPB_DIR, 'src')).filter((f) => /\.js$/.test(f)).map((f) => src(f)).join('\n');
  const peristiwa = [...new Set([...semuaSrc.matchAll(/\bemit(?:Sekali)?\('([a-z_]+)'/g)].map((m) => m[1]))];
  cek(peristiwa.length >= 14, 'peristiwa terbaca dari kode (' + peristiwa.length + ')', peristiwa);
  peristiwa.forEach((e) => cek(new RegExp('`' + e + '`').test(readme), 'README mendokumentasikan peristiwa ' + e));
  const pesanInduk = [...new Set([...semuaSrc.matchAll(/kePosInduk\('([a-z]+)'/g)].map((m) => m[1]).concat(['event']))];
  pesanInduk.forEach((j) => cek(new RegExp('\\| `' + j + '` \\|').test(readme), 'README mendokumentasikan pesan iframe ' + j));
  const pajak = Object.keys(L.mesin().PAJAK).filter((k) => k !== 'manual');
  pajak.forEach((k) => cek(readme.indexOf('`' + k + '`') >= 0, 'README menyebut pilihan pajak ' + k));
  cek(/Oktober 2026/.test(readme) && /TGL_ATURAN_BAWAAN = 'Oktober 2026'/.test(cfgSrc), 'tanggal pemeriksaan aturan pajak di README sama dengan di kode');
  const barisReadme = readme.split('\n');
  const tabelCfg = [];
  barisReadme.forEach((ln, i) => { const m = /^\| `(\w+)` \|/.exec(ln); if (m && !/^\|\s*:?-{2,}/.test(barisReadme[i + 1] || '')) tabelCfg.push(m[1]); });
  const dikenal = new Set([].concat(kunciCfg, peristiwa, pesanInduk, pajak, ['tema', 'manual']));
  tabelCfg.forEach((k) => cek(dikenal.has(k), 'README: `' + k + '` di tabel adalah opsi, peristiwa, pesan iframe, atau pilihan pajak yang dikenal kode'));
  ['KPBApp.setTema', 'KPBApp.bukaLangkah', 'KPBApp.layarAwal', 'KPBApp.versi'].forEach((a) => cek(readme.indexOf(a) >= 0, 'README menyebut ' + a));
  cek(/kpb:data/.test(readme) && /kpb:langkah/.test(readme) && /kpb:cepat/.test(readme), 'README menyebut kunci penyimpanan yang dipakai kode');
  cek(/3 MB/.test(readme) && /file\.size > 3e6/.test(semuaSrc), 'batas impor 3 MB di README sama dengan di kode');
  cek(/BATAS_TUNGGU = 4000/.test(sw) && /4 detik/.test(readme), 'batas tunggu jaringan 4 detik di README sama dengan di sw.js');
  /* semua tautan relatif di README mengarah ke berkas yang ada */
  [...readme.matchAll(/`([\w./-]+\.(?:html|js|json|css|txt|md|webmanifest))`/g)].map((m) => m[1]).filter((f) => !/^(config|iframe|index|sw|kpb)\.js$/.test(f) || true).forEach((f) => {
    const ada = berkas.indexOf(f) >= 0 || berkas.some((b) => b.endsWith('/' + f)) || /^(public\/|situs|\/kalkulator)/.test(f) || /^(sw|kpb|config|iframe|index)\./.test(f);
    if (!ada) cek(false, 'README menyebut berkas yang tidak ada di paket: ' + f);
  });

  /* ===== 5. potongan kode di README bisa dijalankan (sintaks) ===== */
  const potongan = [...readme.matchAll(/```(js|html)\n([\s\S]*?)```/g)].map((m) => ({ jenis: m[1], isi: m[2] }));
  cek(potongan.length >= 5, 'README memuat potongan kode (' + potongan.length + ')');
  const tmp = path.join(L.KPB_DIR, 'dist/_potongan');
  fs.mkdirSync(tmp, { recursive: true });
  potongan.forEach((c, i) => {
    let kode = c.isi;
    if (c.jenis === 'html') kode = [...c.isi.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
    if (!kode.trim()) return;
    const f = path.join(tmp, 'p' + i + '.js');
    fs.writeFileSync(f, kode);
    let r = cp.spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    if (r.status !== 0) { fs.writeFileSync(f, 'var __x = {' + kode.replace(/,\s*$/, '') + '\n};'); r = cp.spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' }); } /* potongan berupa isi objek konfigurasi */
    cek(r.status === 0, 'potongan kode README #' + (i + 1) + ' (' + c.jenis + ') sintaksnya benar', (r.stderr || '').split('\n').slice(0, 3).join(' | '));
  });
  fs.rmSync(tmp, { recursive: true, force: true });
  ['config.js', 'config-iframe.js', 'sw.js'].forEach((f) => { const r = cp.spawnSync(process.execPath, ['--check', path.join(P, f)], { encoding: 'utf8' }); cek(r.status === 0, f + ': sintaks benar', r.stderr); });

  /* ===== 6. konfigurasi bawaan hanya memakai opsi yang dikenal ===== */
  [['config.js', 'config.js'], ['config-iframe.js', 'config-iframe.js']].forEach(([f]) => {
    const w = {}; new Function('window', 'document', 'location', 'URLSearchParams', 'URL', baca(f))(w, { referrer: '' }, { origin: 'http://x', search: '' }, URLSearchParams, URL);
    const k = Object.keys(w.KPB_CONFIG || {});
    cek(k.length > 0 && k.every((x) => kunciCfg.indexOf(x) >= 0), f + ': hanya opsi yang dikenal', k.filter((x) => kunciCfg.indexOf(x) < 0));
  });
  cek(/pwa: true/.test(baca('config.js')) && !/pwa/.test(baca('config-iframe.js').replace(/\/\*[\s\S]*?\*\//g, '')), 'pwa aktif di halaman mandiri dan tidak di iframe');

  /* ===== 7. header konsisten di semua berkas konfigurasi server ===== */
  const csp = (t) => (/default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'/.exec(t) || [])[0];
  const utama = csp(baca('_headers'));
  cek(!!utama, '_headers memuat CSP utama');
  ['server/vercel.json', 'server/nginx.conf.contoh', 'server/htaccess.contoh'].forEach((f) => cek(csp(baca(f)) === utama, f + ': CSP utama sama dengan _headers'));
  /* kpb.css dikirim bersama kpb.js dan harus selalu dicek ke server; kalau tersimpan lama, peramban lama bisa memadukan gaya lama dengan skrip baru */
  ['_headers', 'server/vercel.json', 'server/nginx.conf.contoh', 'server/htaccess.contoh'].forEach((f) => cek(/kpb\\*\.css/.test(baca(f)), f + ': kpb.css masuk aturan no-cache seperti kpb.js'));
  ['_headers', 'server/vercel.json', 'server/nginx.conf.contoh', 'server/htaccess.contoh'].forEach((f) => {
    const t = baca(f);
    cek(/frame-ancestors 'none'/.test(t) && /frame-ancestors https:\/\/situsanda\.com/.test(t), f + ': frame-ancestors untuk halaman mandiri dan iframe');
    cek(/nosniff/.test(t) && /strict-origin-when-cross-origin/.test(t) && /Permissions-Policy/.test(t), f + ': nosniff, Referrer-Policy, dan Permissions-Policy');
    cek(!/unsafe-inline|unsafe-eval|\*\s*;/.test(t.replace(/Disallow: \*/g, '')), f + ': CSP tanpa unsafe-inline atau unsafe-eval');
  });
  JSON.parse(baca('server/vercel.json'));
  cek(true, 'server/vercel.json adalah JSON yang sah');
  const ada = (b) => cp.spawnSync('sh', ['-c', 'command -v ' + b], { encoding: 'utf8' }).status === 0;
  if (ada('nginx')) {
    const conf = path.join(L.KPB_DIR, 'dist/_nginx.conf');
    fs.writeFileSync(conf, 'events {}\nhttp {\n include /etc/nginx/mime.types;\n' + baca('server/nginx.conf.contoh').replace(/ssl_certificate[^\n]*\n/g, '').replace('listen 443 ssl http2;', 'listen 8999;') + '\n}\n');
    const r = cp.spawnSync('nginx', ['-t', '-c', conf], { encoding: 'utf8' });
    cek(r.status === 0, 'nginx -t menerima nginx.conf.contoh', r.stderr);
    fs.rmSync(conf, { force: true });
  } else console.log('   (nginx tidak terpasang di lingkungan uji; sintaks nginx.conf.contoh tidak diperiksa mesin)');
  if (ada('apachectl') || ada('httpd')) console.log('   (Apache terdeteksi, tetapi sintaks htaccess.contoh tidak diuji otomatis)');

  /* ===== 8. lisensi ===== */
  const lis = baca('LISENSI-PIHAK-KETIGA.txt');
  [...lis.matchAll(/lisensi\/[\w.-]+\.txt/g)].forEach((m) => cek(berkas.indexOf(m[0]) >= 0, 'LISENSI-PIHAK-KETIGA.txt merujuk ' + m[0] + ' yang ada'));
  cek(/Apache License\s+Version 2\.0/.test(baca('lisensi/sheetjs-Apache-2.0.txt')) && /SIL OPEN FONT LICENSE Version 1\.1/i.test(baca('lisensi/plus-jakarta-sans-OFL-1.1.txt')), 'teks lisensi lengkap ikut dalam paket');
  cek(/^\/\*! xlsx\.js/.test(baca('vendor/xlsx.mini.min.js')), 'pustaka Excel utuh dengan catatan hak ciptanya');

  /* ===== 9. contoh berjalan ===== */
  const srv = await L.mulai(P);
  const browser = await L.chromium.launch();
  {
    const A = await L.bukaApp({ srv, browser, path: '/contoh-iframe.html', tunggu: false });
    const p = A.page;
    const fr = p.frameLocator('iframe#kpb-frame');
    await fr.locator('#kpb-judul-cepat').waitFor({ timeout: 10000 });
    await p.waitForTimeout(500);
    cek((await p.locator('#log').innerText()).indexOf('app_dibuka') >= 0, 'contoh-iframe: peristiwa app_dibuka tampil di log halaman induk', await p.locator('#log').innerText());
    await fr.locator('.tpl').first().click();
    await fr.locator('#kpb-panel').waitFor();
    await fr.locator('#kpb-steps li:nth-child(5) button').click();
    await p.waitForTimeout(500);
    const log = await p.locator('#log').innerText();
    cek(/langkah_dibuka\s+\{"langkah":5\}/.test(log) && /hasil_dilihat/.test(log), 'contoh-iframe: peristiwa langkah dan hasil masuk ke log', log.split('\n').slice(0, 4));
    cek(!/\d{6,}/.test(log), 'contoh-iframe: log tanpa angka usaha');
    cek(await p.evaluate(() => document.getElementById('kpb-frame').getBoundingClientRect().height) > 1500, 'contoh-iframe: tinggi iframe mengikuti isi');
    await p.locator('#t-gelap').click();
    await p.waitForTimeout(300);
    const temaFrame = await p.frames().find((f) => f !== p.mainFrame()).evaluate(() => document.getElementById('kpb-root').getAttribute('data-theme'));
    cek(temaFrame === 'dark', 'contoh-iframe: tombol tema gelap di halaman induk mengubah tema kalkulator', temaFrame);
    await p.locator('#t-terang').click();
    await p.waitForTimeout(300);
    cek(await p.frames().find((f) => f !== p.mainFrame()).evaluate(() => document.getElementById('kpb-root').getAttribute('data-theme')) === 'light', 'contoh-iframe: kembali ke tema terang');
    cek(A.logs.length === 0, 'contoh-iframe: tanpa galat konsol', A.logs);
    await A.tutup();
  }
  {
    const A = await L.bukaApp({ srv, browser, path: '/contoh-inline.html', context: { viewport: { width: 1280, height: 900 } } });
    const p = A.page;
    await p.waitForTimeout(400);
    cek((await p.locator('#log').innerText()).indexOf('app_dibuka') >= 0, 'contoh-inline: onEvent menerima app_dibuka', await p.locator('#log').innerText());
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    await langkah(p, 6);
    cek(await p.locator('aside.cta').isVisible(), 'contoh-inline: kartu ajakan bertindak tampil di langkah 6');
    cek(/Nama Situs Anda/.test(await p.locator('.foot').innerText()), 'contoh-inline: merek tampil di kaki halaman');
    cek(await p.evaluate(() => Object.keys(localStorage).some((k) => k.indexOf('situs:') === 0) && !Object.keys(localStorage).some((k) => k.indexOf('kpb:') === 0)), 'contoh-inline: penyimpanan memakai awalan situs:');
    cek(!(await L.adaGulir(p)), 'contoh-inline: tanpa gulir samping');
    cek(A.logs.length === 0, 'contoh-inline: tanpa galat konsol', A.logs);
    await A.tutup();
  }
  {
    const A = await L.bukaApp({ srv, browser, path: '/' });
    const p = A.page;
    await p.waitForTimeout(1200);
    cek(await p.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length) === 1, 'index.html: service worker terdaftar (pwa aktif di paket)');
    cek(A.logs.length === 0, 'index.html: tanpa galat konsol', A.logs);
    await A.tutup();
  }
  await browser.close();
  srv.srv.close();
  process.exit(L.ringkas('PAKET') ? 1 : 0);
})().catch((e) => { console.error('UJI BERHENTI:', e.stack.split('\n').slice(0, 8).join('\n')); process.exit(2); });
