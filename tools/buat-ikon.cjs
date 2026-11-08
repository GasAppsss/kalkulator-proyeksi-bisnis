/* Membuat ikon PNG untuk manifest dan layar utama dari favicon.svg. Pakai: node tools/buat-ikon.cjs */
/* Playwright dari node_modules proyek (npm install); bila tidak ada, dari lokasi alat bersama di lingkungan ini */
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/npm-tools/node_modules/playwright'); } })();
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, '../paket-src');
const NILA = '#3340BF';
const GLYPH = '<path d="M12 46 52 18" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M12 30 52 38" stroke="#B9BFF0" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="29.8" cy="33.6" r="5.5" fill="#fff" stroke="' + NILA + '" stroke-width="3"/>';
/* jenis "bulat": sudut membulat seperti favicon; "penuh": persegi penuh tanpa transparansi (iOS dan ikon maskable memotongnya sendiri) */
const SPEK = [
  { berkas: 'ikon-192.png', ukuran: 192, jenis: 'bulat', skala: 1 },
  { berkas: 'ikon-512.png', ukuran: 512, jenis: 'bulat', skala: 1 },
  { berkas: 'ikon-180.png', ukuran: 180, jenis: 'penuh', skala: 0.82 },
  { berkas: 'ikon-maskable-512.png', ukuran: 512, jenis: 'penuh', skala: 0.62 },
];
const svg = (jenis, skala) => {
  const lat = jenis === 'bulat' ? '<rect width="64" height="64" rx="14" fill="' + NILA + '"/>' : '<rect width="64" height="64" fill="' + NILA + '"/>';
  const tf = skala === 1 ? '' : ' transform="translate(' + (32 - 32 * skala) + ' ' + (32 - 32 * skala) + ') scale(' + skala + ')"';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="100%" height="100%">' + lat + '<g' + tf + '>' + GLYPH + '</g></svg>';
};
(async () => {
  const b = await chromium.launch();
  for (const s of SPEK) {
    const p = await b.newPage({ viewport: { width: s.ukuran, height: s.ukuran }, deviceScaleFactor: 1 });
    await p.setContent('<!doctype html><html><body style="margin:0;background:transparent;width:' + s.ukuran + 'px;height:' + s.ukuran + 'px">' + svg(s.jenis, s.skala) + '</body></html>');
    await p.screenshot({ path: path.join(OUT, s.berkas), omitBackground: s.jenis === 'bulat' });
    await p.close();
    console.log(s.berkas, fs.statSync(path.join(OUT, s.berkas)).size, 'bita');
  }
  await b.close();
})();
