/* Uji ekspor: Excel, JSON, ringkasan teks, laporan HTML/PDF, cetak. Angka berkas dibandingkan dengan mesin hitung di Node. */
const L = require('./lib.cjs');
const { cek, isi, teks, langkah, mesin, path, fs } = L;
const XLSX = require(path.join(L.KPB_DIR, 'node_modules/xlsx'));
const K = mesin();
const TMP = path.join(L.KPB_DIR, 'dist/_uji-ekspor');
fs.rmSync(TMP, { recursive: true, force: true });
fs.mkdirSync(TMP, { recursive: true });
const toast = (p) => p.locator('#kpb-toast').innerText();
const buka = async (p) => { await p.locator('#kpb-btn-menu').click(); };
/* pilih contoh usaha dari layar awal; bila diminta konfirmasi (ada data milik pengguna), klik sekali lagi */
async function pilihContoh(p, idx) {
  await p.locator('#kpb-btn-awal').click().catch(() => {});
  await p.waitForSelector('.tpl');
  await p.waitForTimeout(250);
  const t = p.locator('.tpl').nth(idx);
  await t.click();
  const langsung = await p.waitForSelector('#kpb-panel', { timeout: 1200 }).then(() => true, () => false);
  if (!langsung) { await t.click(); await p.waitForSelector('#kpb-panel'); }
  await p.waitForTimeout(250);
}
async function unduh(p, picu) {
  const [d] = await Promise.all([p.waitForEvent('download', { timeout: 20000 }), picu()]);
  const f = path.join(TMP, d.suggestedFilename());
  await d.saveAs(f);
  return { nama: d.suggestedFilename(), file: f };
}
const peta = (ws) => Object.fromEntries(XLSX.utils.sheet_to_json(ws, { header: 1 }).filter((r) => r.length >= 2 && typeof r[0] === 'string').map((r) => [r[0], r[1]]));

(async () => {
  const srv = await L.mulai(L.FOLDER);
  const browser = await L.chromium.launch();
  const A = await L.bukaApp({ srv, browser, context: { permissions: ['clipboard-read', 'clipboard-write'], acceptDownloads: true } });
  const p = A.page;
  await p.locator('.tpl').first().click();
  await p.waitForSelector('#kpb-panel');
  const S = K.TEMPLATE[0].bangun();
  const An = K.analisis(S);
  await langkah(p, 6);

  /* ===== Excel ===== */
  const x = await unduh(p, () => p.getByRole('button', { name: 'Unduh Excel (.xlsx)' }).click());
  cek(x.nama === 'proyeksi-kedai-kopi-contoh.xlsx', 'nama berkas Excel', x.nama);
  const wb = XLSX.readFile(x.file);
  cek(JSON.stringify(wb.SheetNames) === JSON.stringify(['Ringkasan', 'Asumsi', 'HPP per Produk', 'Rincian Bahan', 'Laba Rugi Tahunan', 'Laba Rugi Bulanan', 'Skenario', 'Pemeriksaan']), 'delapan lembar bernama benar', wb.SheetNames);
  const R = peta(wb.Sheets['Ringkasan']);
  cek(R['BEP (unit per bulan)'] === Math.round(An.bep.bepUnit), 'Excel: BEP = mesin ' + Math.round(An.bep.bepUnit), R['BEP (unit per bulan)']);
  cek(R['BEP (omzet per bulan, Rp)'] === Math.round(An.bep.bepRp), 'Excel: omzet BEP = mesin');
  cek(R['Balik modal (bulan ke-)'] === An.m.payback.bulan, 'Excel: balik modal bulan ' + An.m.payback.bulan, R['Balik modal (bulan ke-)']);
  cek(R['Modal awal (Rp)'] === Math.round(An.m.modalAwal), 'Excel: modal awal');
  cek(R['Total laba bersih (Rp)'] === Math.round(An.m.totalNet), 'Excel: total laba bersih', [R['Total laba bersih (Rp)'], An.m.totalNet]);
  cek(R['NPV (Rp)'] === Math.round(An.m.npv), 'Excel: NPV');
  cek(Math.abs(R['IRR per tahun'] - An.m.irr) < 1e-9, 'Excel: IRR', R['IRR per tahun']);
  cek(R['Mulai untung (bulan ke-)'] === An.m.untungBulan, 'Excel: bulan mulai untung');
  cek(R['Harga jual rata-rata (Rp)'] === Math.round(An.bep.avgPrice), 'Excel: harga rata-rata');
  const bln = XLSX.utils.sheet_to_json(wb.Sheets['Laba Rugi Bulanan'], { header: 1 });
  cek(bln.length === S.periode + 1, 'Excel: lembar bulanan ' + (S.periode + 1) + ' baris', bln.length);
  cek(bln[S.periode][11] === Math.round(An.rows[S.periode - 1].net), 'Excel: laba bersih bulan terakhir sama dengan mesin');
  const tah = XLSX.utils.sheet_to_json(wb.Sheets['Laba Rugi Tahunan'], { header: 1 });
  cek(tah.length === 14 && tah[0].length === 1 + An.tahun.length, 'Excel: lembar tahunan 13 baris data', [tah.length, tah[0].length]);
  cek(tah.find((r) => r[0] === 'Laba bersih')[1] === Math.round(An.tahun[0].net), 'Excel: laba bersih tahun 1');
  const hpp = XLSX.utils.sheet_to_json(wb.Sheets['HPP per Produk'], { header: 1 });
  cek(hpp.length === 1 + S.produk.length, 'Excel: baris per produk', hpp.length);
  S.produk.forEach((pr, i) => cek(hpp[i + 1][4] === Math.round(An.unitP[i].hpp), 'Excel: HPP ' + pr.nama + ' = ' + Math.round(An.unitP[i].hpp), hpp[i + 1][4]));
  const bhn = XLSX.utils.sheet_to_json(wb.Sheets['Rincian Bahan'], { header: 1 });
  cek(bhn.length === 1 + S.produk.reduce((t, pr) => t + pr.bahan.length, 0), 'Excel: rincian bahan lengkap', bhn.length);
  const ck = XLSX.utils.sheet_to_json(wb.Sheets['Pemeriksaan'], { header: 1 });
  cek(ck.length >= 1 + An.sehat.length, 'Excel: lembar pemeriksaan terisi', ck.length);
  /* tidak ada sel berisi NaN, undefined, atau Infinity */
  let sel = 0, kotor = [];
  wb.SheetNames.forEach((n) => Object.keys(wb.Sheets[n]).forEach((k) => {
    if (k[0] === '!') return;
    const c = wb.Sheets[n][k]; sel++;
    if (c.t === 'n' && !isFinite(c.v)) kotor.push(n + '!' + k);
    if (c.t === 's' && /NaN|undefined|Infinity|\[object/.test(String(c.v))) kotor.push(n + '!' + k + '=' + c.v);
  }));
  cek(sel > 500 && kotor.length === 0, 'Excel: ' + sel + ' sel tanpa NaN/undefined/Infinity', kotor.slice(0, 5));
  cek(wb.Sheets['Ringkasan'].B5 && /^150,000,000$/.test(wb.Sheets['Ringkasan'].B5.w), 'Excel: angka berformat ribuan', wb.Sheets['Ringkasan'].B5);
  cek(/Kedai Kopi Contoh/.test(wb.Props.Title || ''), 'Excel: properti judul berkas', wb.Props);

  /* Excel untuk semua template: angka kunci cocok dengan mesin */
  for (const t of K.TEMPLATE) {
    await pilihContoh(p, K.TEMPLATE.indexOf(t));
    await langkah(p, 6);
    const f = await unduh(p, () => p.getByRole('button', { name: 'Unduh Excel (.xlsx)' }).click());
    const w = XLSX.readFile(f.file);
    const a = K.analisis(t.bangun());
    const r = peta(w.Sheets['Ringkasan']);
    cek(r['BEP (unit per bulan)'] === Math.round(a.bep.bepUnit) && r['Total laba bersih (Rp)'] === Math.round(a.m.totalNet) && r['Balik modal (bulan ke-)'] === (a.m.payback ? a.m.payback.bulan : 'belum'),
      'Excel template ' + t.id + ' cocok dengan mesin', [r['BEP (unit per bulan)'], Math.round(a.bep.bepUnit), r['Total laba bersih (Rp)'], Math.round(a.m.totalNet)]);
  }

  /* pustaka Excel gagal dimuat, lalu berhasil setelah jaringan pulih */
  await pilihContoh(p, 0);
  await langkah(p, 6);
  /* service worker diblokir di sini: bila aktif, ia menyajikan pustaka dari cache (fitur luring) sehingga pemblokiran jaringan tidak terlihat oleh halaman */
  const B = await L.bukaApp({ srv, browser, context: { serviceWorkers: 'block' }, path: null });
  await B.page.route('**/vendor/xlsx.mini.min.js', (r) => r.abort());
  await B.page.route('**/cdnjs.cloudflare.com/**', (r) => r.abort());
  await B.page.goto(srv.url + '/');
  await B.page.waitForSelector('#kpb-view');
  await B.page.locator('.tpl').first().click();
  await B.page.waitForSelector('#kpb-panel');
  await langkah(B.page, 6);
  await B.page.getByRole('button', { name: 'Unduh Excel (.xlsx)' }).click();
  await B.page.waitForFunction(() => /gagal dimuat/.test(window.__R().getElementById('kpb-toast').innerText), null, { timeout: 15000 });
  cek(/gagal dimuat/.test(await toast(B.page)), 'pustaka Excel gagal dimuat: pesan jelas, aplikasi tetap hidup', await toast(B.page));
  await B.page.unroute('**/vendor/xlsx.mini.min.js');
  await B.page.unroute('**/cdnjs.cloudflare.com/**');
  const ulang = await unduh(B.page, () => B.page.getByRole('button', { name: 'Unduh Excel (.xlsx)' }).click());
  cek(/\.xlsx$/.test(ulang.nama), 'setelah jaringan pulih, unduhan Excel berhasil tanpa memuat ulang halaman', ulang.nama);
  await B.ctx.close();

  /* ===== JSON ===== */
  await langkah(p, 6);
  const j = await unduh(p, () => p.getByRole('button', { name: 'Simpan data (.json)' }).click());
  cek(/^data-.*\.json$/.test(j.nama), 'nama berkas JSON', j.nama);
  const parsed = JSON.parse(fs.readFileSync(j.file, 'utf8'));
  cek(parsed.app === 'proyeksi-bisnis' && parsed.v === K.VERSI_DATA && parsed.data && Array.isArray(parsed.data.produk), 'JSON berisi amplop dan data', Object.keys(parsed));
  cek(typeof parsed.dibuat === 'string' && !isNaN(Date.parse(parsed.dibuat)), 'JSON memuat tanggal pembuatan');
  const A2 = K.analisis(K.normalisasi(parsed.data));
  const A1 = K.analisis(parsed.data);
  cek(Math.abs(A2.m.totalNet - A1.m.totalNet) < 1e-6, 'JSON dibaca ulang menghasilkan analisis yang sama');
  /* ubah, impor kembali ke aplikasi, hasil sama dengan mesin */
  parsed.data.produk[0].harga = 30000;
  parsed.data.nama = 'Impor Ulang';
  const fImp = path.join(TMP, 'impor.json');
  fs.writeFileSync(fImp, JSON.stringify(parsed));
  await p.setInputFiles('#kpb-f-impor', fImp);
  await p.waitForSelector('#kpb-panel');
  await p.waitForTimeout(500);
  await langkah(p, 5);
  const aI = K.analisis(K.normalisasi(parsed.data));
  cek((await teks(p, '.verdict')).indexOf(new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(aI.bep.bepUnit))) >= 0, 'data hasil impor menghasilkan BEP ' + Math.round(aI.bep.bepUnit), await teks(p, '.verdict'));

  /* ===== ringkasan teks ===== */
  await langkah(p, 6);
  await p.getByRole('button', { name: 'Salin ringkasan', exact: true }).click();
  await p.waitForTimeout(400);
  const klip = await p.evaluate(() => navigator.clipboard.readText());
  cek(/^PROYEKSI BISNIS: IMPOR ULANG/.test(klip) && /BEP: \d/.test(klip) && /Balik modal:/.test(klip) && /bukan jaminan/.test(klip), 'ringkasan tersalin ke papan klip', klip.slice(0, 160));
  cek(new RegExp('BEP: ' + new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(aI.bep.bepUnit)) + ' unit').test(klip), 'ringkasan memuat BEP sama dengan mesin');
  /* tampilan memakai spasi tak terputus agar nominal tidak terpotong; teks polos untuk papan klip harus kembali ke spasi biasa */
  cek(klip.indexOf(' ') < 0 && /Modal awal: Rp \d/.test(klip), 'ringkasan di papan klip memakai spasi biasa, bukan spasi tak terputus', JSON.stringify(klip.slice(0, 120)));
  cek((await toast(p)).indexOf('tersalin') >= 0, 'toast Ringkasan tersalin', await toast(p));
  /* papan klip ditolak: kotak salin manual */
  await p.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('ditolak')) }, configurable: true }); document.execCommand = () => false; });
  await p.getByRole('button', { name: 'Salin ringkasan', exact: true }).click();
  await p.waitForSelector('#kpb-kotak-salin[open]');
  const isiKotak = await p.locator('#kpb-kotak-salin-isi').inputValue();
  cek(/PROYEKSI BISNIS/.test(isiKotak) && /Balik modal/.test(isiKotak), 'kotak salin manual berisi ringkasan');
  cek(await p.evaluate(() => window.__R().activeElement && window.__R().activeElement.id) === 'kpb-kotak-salin-isi', 'fokus ada di teks kotak salin');
  await p.keyboard.press('Escape');
  cek(await p.locator('#kpb-kotak-salin[open]').count() === 0, 'Escape menutup kotak salin');

  /* ===== laporan HTML ===== */
  const lap = await unduh(p, () => p.getByRole('button', { name: 'Unduh laporan (.html)' }).click());
  cek(/^laporan-impor-ulang\.html$/.test(lap.nama), 'nama berkas laporan', lap.nama);
  const html = fs.readFileSync(lap.file, 'utf8');
  cek(html.indexOf('<script') < 0, 'laporan tanpa skrip');
  cek(!/https?:\/\/(?!www\.w3\.org)/.test(html.replace(/xmlns="[^"]*"/g, '')), 'laporan mandiri: tidak memuat sumber dari luar', (html.match(/https?:\/\/[^"' )]+/g) || []).slice(0, 4));
  const pl = await A.ctx.newPage();
  const logsL = [];
  pl.on('console', (m) => { if (m.type() === 'error') logsL.push(m.text()); });
  pl.on('pageerror', (e) => logsL.push(e.message));
  await pl.setViewportSize({ width: 794, height: 1123 });
  await pl.goto('file://' + lap.file);
  const judulH = await pl.locator('h1').innerText();
  cek(judulH === 'Impor Ulang', 'laporan: judul usaha', judulH);
  const bagian = await pl.locator('.lap-sec > h2').allInnerTexts();
  cek(JSON.stringify(bagian) === JSON.stringify(['Ringkasan', 'Asumsi utama', 'Titik impas (BEP)', 'Laba rugi', 'Arus kas dan balik modal', 'Skenario dan sensitivitas', 'Pemeriksaan']), 'laporan: tujuh bagian', bagian);
  cek(await pl.locator('svg').count() >= 3, 'laporan: tiga grafik', await pl.locator('svg').count());
  cek(await pl.locator('table').count() >= 6, 'laporan: enam tabel', await pl.locator('table').count());
  const tl = await pl.locator('body').innerText();
  cek(!L.KOTOR.test(tl), 'laporan bersih dari NaN dan sejenisnya', tl.match(L.KOTOR));
  cek(tl.indexOf(new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(aI.bep.bepUnit)) + ' unit') >= 0, 'laporan memuat BEP mesin');
  cek(/bukan nasihat keuangan atau pajak/.test(tl), 'laporan memuat catatan bukan nasihat');
  cek(await pl.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1), 'laporan tidak meluap ke samping di lebar A4');
  await pl.emulateMedia({ media: 'print', colorScheme: 'dark' });
  const bg = await pl.evaluate(() => getComputedStyle(document.body).backgroundColor + '|' + getComputedStyle(document.querySelector('.kpb.laporan')).backgroundColor);
  cek(/255, 255, 255/.test(bg.split('|')[1]), 'laporan tetap berlatar putih saat mode gelap', bg);
  await pl.screenshot({ path: path.join(L.KPB_DIR, 'shots/laporan-atas.png'), clip: { x: 0, y: 0, width: 794, height: 1123 } });
  const pdf = path.join(TMP, 'laporan.pdf');
  await pl.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true });
  const ukuranPdf = fs.statSync(pdf).size;
  const halaman = (fs.readFileSync(pdf, 'latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  cek(halaman >= 3 && halaman <= 12, 'PDF laporan ' + halaman + ' halaman (wajar 3-12), ' + Math.round(ukuranPdf / 1024) + ' KB', halaman);
  cek(logsL.length === 0, 'laporan: tanpa galat konsol', logsL);
  await pl.close();

  /* ===== cetak lewat iframe ===== */
  await p.getByRole('button', { name: 'Cetak atau simpan PDF' }).click().catch(async () => { await buka(p); await p.getByRole('button', { name: 'Cetak atau simpan PDF' }).click(); });
  await p.waitForFunction(() => window.__cetak >= 1, null, { timeout: 8000 }).catch(() => {});
  cek(await p.evaluate(() => window.__cetak) === 1, 'cetak memanggil print() tepat sekali', await p.evaluate(() => window.__cetak));
  cek(await p.evaluate(() => document.querySelectorAll('iframe[title="Laporan untuk dicetak"]').length) <= 1, 'iframe cetak tunggal');
  const ifr = await p.evaluate(() => {
    const f = document.querySelector('iframe[title="Laporan untuk dicetak"]');
    if (!f) return null;
    const d = f.contentDocument, w = f.contentWindow, h1 = d.querySelector('h1');
    return { judul: h1 && h1.textContent, ukuran: h1 && w.getComputedStyle(h1).fontSize, latar: w.getComputedStyle(d.body).backgroundColor, gaya: (d.adoptedStyleSheets || []).length + d.querySelectorAll('style').length,
      bagian: d.querySelectorAll('.lap-sec').length, tabel: d.querySelectorAll('table').length, grafik: d.querySelectorAll('svg').length, judulDok: d.title, teks: d.body.innerText.length };
  });
  cek(ifr && ifr.judul === 'Impor Ulang' && ifr.ukuran === '24px' && ifr.gaya >= 1, 'iframe cetak: laporan terisi dan bergaya', ifr);
  cek(ifr && ifr.bagian === 7 && ifr.tabel >= 6 && ifr.grafik >= 3 && ifr.teks > 1500, 'iframe cetak: tujuh bagian, tabel, dan grafik lengkap', ifr);
  cek(ifr && /^Laporan proyeksi bisnis: Impor Ulang$/.test(ifr.judulDok), 'iframe cetak: judul dokumen untuk nama berkas PDF', ifr && ifr.judulDok);
  /* dari menu juga bisa */
  await buka(p);
  cek(await p.getByRole('button', { name: 'Cetak atau simpan PDF' }).first().isEnabled(), 'menu: cetak aktif saat ada data');
  await p.keyboard.press('Escape');

  /* nama usaha aneh: nama berkas tetap aman */
  await langkah(p, 1);
  await isi(p, '#kpb-f-nama', '  Kafé / "Es" <Teh> ?*:|  ');
  await langkah(p, 6);
  const j2 = await unduh(p, () => p.getByRole('button', { name: 'Simpan data (.json)' }).click());
  cek(/^data-[a-z0-9-]+\.json$/.test(j2.nama), 'nama berkas aman untuk nama usaha beraksara aneh', j2.nama);
  await langkah(p, 1);
  await isi(p, '#kpb-f-nama', '');
  await langkah(p, 6);
  const j3 = await unduh(p, () => p.getByRole('button', { name: 'Simpan data (.json)' }).click());
  cek(j3.nama === 'data-proyeksi-bisnis.json', 'nama kosong memakai nama bawaan', j3.nama);

  cek(A.logs.length === 0, 'ekspor: tanpa galat atau peringatan konsol', A.logs);
  fs.rmSync(TMP, { recursive: true, force: true });
  await A.tutup();
  srv.srv.close();
  await browser.close();
  process.exit(L.ringkas('EKSPOR') ? 1 : 0);
})().catch((e) => { console.error('UJI BERHENTI:', e.stack.split('\n').slice(0, 8).join('\n')); process.exit(2); });
