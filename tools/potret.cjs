/* Alat bantu desain: memotret layar aplikasi di beberapa ukuran dan tema untuk ditinjau mata.
   Pemakaian (dari folder kpb/):
     node tools/potret.cjs <folder-keluaran> [--lebar 1280] [--tinggi 900] [--tema terang|gelap] [--langkah 0,2,5] [--ubin 1000] [--folder dist/paket] [--gerak] [--contoh 0]
   langkah 0 = layar awal; 1-6 = langkah setelah memuat contoh. --ubin memotong tangkapan halaman penuh menjadi potongan setinggi N px
   (gambar yang terlalu tinggi mengecil saat ditinjau). --gerak membiarkan animasi berjalan (bawaan: gerak dikurangi agar tangkapan stabil). */
const L = require('../test/lib.cjs');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i > 0 && process.argv[i + 1] && !/^--/.test(process.argv[i + 1]) ? process.argv[i + 1] : d; };
const ada = (n) => process.argv.indexOf('--' + n) > 0;
const keluar = L.path.resolve(process.argv[2] || 'shots/potret');
const W = +arg('lebar', 1280), H = +arg('tinggi', 900);
const gelap = arg('tema', 'terang') === 'gelap';
const langkahAda = arg('langkah', '0,1,2,3,4,5,6').split(',').map(Number);
const ubin = +arg('ubin', 0);
const folder = L.path.resolve(L.KPB_DIR, arg('folder', 'dist/paket'));
const contoh = +arg('contoh', 0);
const nama = (n) => (n === 0 ? 'awal' : 'l' + n) + '-' + W + (gelap ? '-gelap' : '');

(async () => {
  L.fs.mkdirSync(keluar, { recursive: true });
  const srv = await L.mulai(folder);
  const browser = await L.chromium.launch();
  try {
    const A = await L.bukaApp({ srv, browser, context: { viewport: { width: W, height: H }, colorScheme: gelap ? 'dark' : 'light', reducedMotion: ada('gerak') ? 'no-preference' : 'reduce', serviceWorkers: 'block' } });
    const p = A.page;
    const potret = async (n) => {
      await p.waitForTimeout(ada('gerak') ? 2500 : 350);
      const tinggi = await p.evaluate(() => document.documentElement.scrollHeight);
      if (!ubin || tinggi <= ubin + 80) { await p.screenshot({ path: L.path.join(keluar, nama(n) + '.png'), fullPage: true }); return; }
      for (let y = 0, i = 1; y < tinggi; y += ubin, i++) {
        await p.screenshot({ path: L.path.join(keluar, nama(n) + '-' + i + '.png'), fullPage: true, clip: { x: 0, y, width: W, height: Math.min(ubin, tinggi - y) } });
      }
    };
    if (langkahAda.indexOf(0) >= 0) await potret(0);
    if (langkahAda.some((n) => n > 0)) {
      await p.locator('.tpl').nth(contoh).click();
      await p.waitForSelector('#kpb-panel');
      for (const n of langkahAda.filter((x) => x > 0)) { await L.langkah(p, n); await potret(n); }
    }
    console.log('Tangkapan tersimpan di ' + keluar + ' (' + L.fs.readdirSync(keluar).length + ' berkas); galat konsol: ' + A.logs.length);
    await A.tutup();
  } finally { await browser.close(); srv.srv.close(); process.exit(0); }
})().catch((e) => { console.error(e.stack); process.exit(1); });
