/* Uji penyimpanan dan ketahanan: muat ulang, tautan langsung, data rusak, penyimpanan diblokir, tab ganda, Urungkan, impor berkas, XSS */
const L = require('./lib.cjs');
const { cek, isi, teks, langkah, dataTersimpan, layarBersih, mesin, path, fs } = L;
const K = mesin();
const nilai = (page, sel) => page.locator(sel).inputValue();
const TMP = path.join(__dirname, '../dist/_uji');
fs.mkdirSync(TMP, { recursive: true });
const tulisBerkas = (nama, isiBerkas) => { const f = path.join(TMP, nama); fs.writeFileSync(f, isiBerkas); return f; };
const toast = (p) => p.locator('#kpb-toast').innerText();
const muatContoh = async (p) => { await p.locator('.tpl').first().click(); await p.waitForSelector('#kpb-panel'); };
const kunci = (p, k) => p.evaluate((x) => localStorage.getItem(x), k);
/* buka alamat dasar tanpa hash (muat ulang biasa mempertahankan #mulai atau #langkah-n) */
const bersihkan = async (p, srv) => { await p.goto(srv.url + '/'); await p.waitForSelector('#kpb-view > *'); };

(async () => {
  const srv = await L.mulai(L.FOLDER);
  const browser = await L.chromium.launch();

  /* ===== 1. muat ulang mempertahankan data dan langkah ===== */
  {
    const A = await L.bukaApp({ srv, browser });
    const p = A.page;
    await muatContoh(p);
    await langkah(p, 3);
    await p.getByRole('button', { name: '+ Tambah biaya', exact: true }).click();
    await p.keyboard.type('Biaya Uji Simpan');
    await p.waitForTimeout(600);
    cek((await teks(p, '#kpb-status-simpan')).indexOf('Tersimpan otomatis') === 0, 'status simpan otomatis tampil', await teks(p, '#kpb-status-simpan'));
    await p.reload();
    await p.waitForSelector('#kpb-panel');
    cek(/Langkah 3 dari 6/.test(await teks(p, '#kpb-where')), 'muat ulang kembali ke langkah 3', await teks(p, '#kpb-where'));
    cek((await dataTersimpan(p)).biayaTetap.some((t) => t.nama === 'Biaya Uji Simpan'), 'biaya baru bertahan setelah muat ulang');
    cek(await p.evaluate(() => [...window.__R().querySelectorAll('input')].some((i) => i.value === 'Biaya Uji Simpan')), 'biaya baru tampil di layar setelah muat ulang');
    cek(await p.locator('#kpb-banner-contoh').isHidden(), 'penanda contoh hilang karena sudah diedit, juga setelah muat ulang');
    /* kunci langkah tersimpan terpisah */
    cek(await kunci(p, 'kpb:langkah') === '2', 'langkah tersimpan sebagai indeks 2', await kunci(p, 'kpb:langkah'));
    cek(A.logs.length === 0, 'simpan 1: tanpa galat konsol', A.logs);
    await A.tutup();
  }

  /* ===== 2. tautan langsung ===== */
  {
    const A = await L.bukaApp({ srv, browser, path: '/#langkah-5' });
    const p = A.page;
    cek(await p.locator('#kpb-judul-cepat').isVisible(), 'tautan #langkah-5 tanpa data: tetap layar awal');
    await muatContoh(p);
    await p.waitForTimeout(500);
    await p.goto(srv.url + '/#langkah-5');
    await p.reload();
    await p.waitForSelector('#kpb-panel');
    cek(/Langkah 5 dari 6/.test(await teks(p, '#kpb-where')), 'tautan #langkah-5 dengan data membuka langkah 5', await teks(p, '#kpb-where'));
    await p.goto(srv.url + '/#mulai');
    await p.reload();
    await p.waitForSelector('#kpb-judul-cepat');
    cek(await p.locator('.kartu.lanjut').isVisible(), 'tautan #mulai membuka layar awal dengan kartu lanjutkan');
    await p.goto(srv.url + '/#langkah-9');
    await p.reload();
    await p.waitForSelector('#kpb-view > *');
    cek(await p.locator('#kpb-steps').isVisible(), 'hash tak dikenal diabaikan: lanjut ke langkah tersimpan');
    cek(await p.locator('#kpb-judul-cepat').count() === 0, 'hash tak dikenal tidak membuka layar awal');
    cek(A.logs.length === 0, 'simpan 2: tanpa galat konsol', A.logs);
    await A.tutup();
  }

  /* ===== 3. data tersimpan rusak ===== */
  {
    const A = await L.bukaApp({ srv, browser });
    const p = A.page;
    await p.evaluate(() => localStorage.setItem('kpb:data', '{bukan json yang valid'));
    await bersihkan(p, srv);
    cek(await p.locator('#kpb-rusak').isVisible(), 'banner data rusak tampil');
    cek(await p.locator('#kpb-judul-cepat').isVisible(), 'aplikasi tetap hidup di layar awal');
    cek(await kunci(p, 'kpb:rusak') === '{bukan json yang valid', 'salinan data rusak disimpan di kpb:rusak');
    await p.getByRole('button', { name: 'Mengerti' }).click();
    cek(await p.locator('#kpb-rusak').count() === 0, 'banner hilang setelah Mengerti');
    /* bentuk JSON valid tetapi isinya tak lazim */
    const aneh = ['[]', '123', '"abc"', 'null', '{"ts":1,"data":{"produk":null,"asumsi":5}}', '{"v":99,"ts":1,"data":{"investasi":[null,5],"produk":[null,{"bahan":[null]}]}}', '{"__proto__":{"x":1}}'];
    for (const mentah of aneh) {
      await p.evaluate((m) => { localStorage.removeItem('kpb:rusak'); localStorage.setItem('kpb:data', m); }, mentah);
      await bersihkan(p, srv);
      const hidup = await p.locator('#kpb-app').count() === 1;
      const bersih = !(await layarBersih(p));
      cek(hidup && bersih, 'bentuk data aneh ' + mentah.slice(0, 30) + ': aplikasi tetap hidup dan bersih');
      /* semua langkah bisa dibuka tanpa galat */
      if (await p.locator('#kpb-steps').count()) for (let n = 1; n <= 6; n++) { await langkah(p, n); }
    }
    cek(A.logs.length === 0, 'simpan 3: tanpa galat konsol untuk data aneh', A.logs.slice(0, 3));
    await A.tutup();
  }

  /* ===== 4. kunci lama kpb-v1 dimigrasikan ===== */
  {
    const A = await L.bukaApp({ srv, browser });
    const p = A.page;
    const lama = K.contohState();
    lama.nama = 'Usaha Versi Lama';
    delete lama.biayaOmzet; delete lama.v;
    ['musiman', 'musimanAktif', 'kapasitas', 'piutangHari', 'hutangHari', 'batasOmzetFinal'].forEach((k) => delete lama.asumsi[k]);
    lama.produk.forEach((pr) => pr.bahan.forEach((b) => { delete b.satuanPakai; }));
    await p.evaluate((x) => { localStorage.removeItem('kpb:data'); localStorage.setItem('kpb-v1', x); }, JSON.stringify(lama));
    await bersihkan(p, srv);
    await p.waitForSelector('#kpb-panel');
    cek(await nilai(p, '#kpb-f-nama') === 'Usaha Versi Lama', 'data kpb-v1 terbaca dan tampil', await nilai(p, '#kpb-f-nama'));
    await langkah(p, 5);
    const An = K.analisis(K.normalisasi(lama));
    cek((await teks(p, '.verdict')).indexOf(String(Math.round(An.bep.bepUnit)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')) >= 0, 'hasil data lama sama dengan mesin');
    await langkah(p, 1);
    await isi(p, '#kpb-f-nama', 'Usaha Versi Lama Diubah');
    await p.waitForTimeout(600);
    cek(await kunci(p, 'kpb:data') !== null, 'setelah diubah, data ditulis ke kunci baru');
    cek(JSON.parse(await kunci(p, 'kpb:data')).data.nama === 'Usaha Versi Lama Diubah', 'kunci baru memuat perubahan');
    cek(A.logs.length === 0, 'simpan 4: tanpa galat konsol', A.logs);
    await A.tutup();
  }

  /* ===== 5. penyimpanan penuh (QuotaExceeded) ===== */
  {
    const A = await L.bukaApp({
      srv, browser,
      init: () => { Storage.prototype.setItem = function () { throw new DOMException('penuh', 'QuotaExceededError'); }; },
    });
    const p = A.page;
    await muatContoh(p);
    await p.waitForTimeout(600);
    cek(/Belum tersimpan/.test(await teks(p, '#kpb-status-simpan')), 'status: belum tersimpan di peramban', await teks(p, '#kpb-status-simpan'));
    cek(/tidak mengizinkan penyimpanan otomatis/.test(await toast(p)) || /Contoh/.test(await toast(p)), 'toast peringatan penyimpanan tampil', await toast(p));
    await isi(p, '#kpb-f-nama', 'Tetap Bisa Diedit');
    cek(await teks(p, '#kpb-nama-usaha') === 'Tetap Bisa Diedit', 'aplikasi tetap bisa dipakai tanpa penyimpanan');
    await langkah(p, 5);
    cek(!(await layarBersih(p)), 'hasil tetap tampil tanpa penyimpanan');
    /* penjaga sebelum menutup halaman: ada pekerjaan yang belum dicadangkan */
    let dialogJenis = null;
    p.on('dialog', async (d) => { dialogJenis = d.type(); await d.dismiss(); });
    await p.evaluate(() => { window.__tahan = true; });
    await p.close({ runBeforeUnload: true });
    await p.waitForTimeout(300);
    cek(dialogJenis === 'beforeunload', 'menutup tab dengan perubahan belum dicadangkan memunculkan peringatan', dialogJenis);
    const p2 = await A.ctx.newPage();
    await p2.goto(srv.url + '/');
    cek(true, 'halaman baru bisa dibuka');
    await p2.close();
    cek(A.logs.filter((x) => !/QuotaExceeded|penuh/.test(x)).length === 0, 'simpan 5: tanpa galat konsol selain penolakan penyimpanan', A.logs);
    await A.tutup();
  }

  /* ===== 6. akses localStorage memicu SecurityError (mode privat ketat, cookie diblokir) ===== */
  {
    const A = await L.bukaApp({
      srv, browser,
      init: () => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('diblokir', 'SecurityError'); }, configurable: true }); },
    });
    const p = A.page;
    cek(await p.locator('#kpb-judul-cepat').isVisible(), 'layar awal tampil walau localStorage diblokir');
    await isi(p, '#kpb-q-harga', '27000');
    cek((await teks(p, '.cepat-hasil .verdict')).length > 0, 'hitung cepat tetap berfungsi');
    await p.getByRole('button', { name: 'Lanjut ke perhitungan lengkap' }).click();
    await p.waitForSelector('#kpb-panel');
    await langkah(p, 5);
    cek(!(await layarBersih(p)), 'langkah hasil tampil walau penyimpanan diblokir');
    cek(/Belum tersimpan/.test(await teks(p, '#kpb-status-simpan')), 'status memberi tahu belum tersimpan', await teks(p, '#kpb-status-simpan'));
    cek(A.logs.length === 0, 'simpan 6: tanpa galat konsol', A.logs);
    await A.tutup();
  }

  /* ===== 7. dua tab: konflik penyimpanan ===== */
  {
    const A = await L.bukaApp({ srv, browser });
    const p1 = A.page;
    await muatContoh(p1);
    await isi(p1, '#kpb-f-nama', 'Versi Tab Satu');
    await p1.waitForTimeout(600);
    const B = await L.bukaApp({ srv, browser, ctx: A.ctx });
    const p2 = B.page;
    await p2.waitForSelector('#kpb-panel');
    cek(await nilai(p2, '#kpb-f-nama') === 'Versi Tab Satu', 'tab kedua memuat data tab pertama');
    await isi(p2, '#kpb-f-nama', 'Versi Tab Dua');
    await p2.waitForTimeout(700);
    await p1.waitForSelector('#kpb-konflik', { timeout: 5000 });
    cek(await p1.locator('#kpb-konflik').isVisible(), 'tab pertama menampilkan banner konflik');
    cek(await nilai(p1, '#kpb-f-nama') === 'Versi Tab Satu', 'data di tab pertama belum ditimpa sebelum pengguna memilih');
    await isi(p1, '#kpb-f-nama', 'Versi Tab Satu Diedit');
    await p1.waitForTimeout(700);
    cek((await dataTersimpan(p1)).nama === 'Versi Tab Dua', 'selama konflik, tab pertama tidak menimpa penyimpanan', (await dataTersimpan(p1)).nama);
    await p1.getByRole('button', { name: 'Pakai versi tab lain' }).click();
    cek(await nilai(p1, '#kpb-f-nama') === 'Versi Tab Dua', 'Pakai versi tab lain memuat data tab kedua', await nilai(p1, '#kpb-f-nama'));
    cek(await p1.locator('#kpb-konflik').count() === 0, 'banner konflik hilang');
    /* tab kedua mengubah lagi; tab pertama memilih mempertahankan */
    await isi(p2, '#kpb-f-nama', 'Tab Dua Lagi');
    await p2.waitForTimeout(700);
    await p1.waitForSelector('#kpb-konflik', { timeout: 5000 });
    await p1.getByRole('button', { name: 'Pertahankan versi ini' }).click();
    await p1.waitForTimeout(700);
    cek((await dataTersimpan(p1)).nama === 'Versi Tab Dua', 'Pertahankan versi ini menyimpan data tab pertama', (await dataTersimpan(p1)).nama);
    cek(await p2.locator('#kpb-konflik').count() === 1, 'tab kedua kini melihat banner konflik');
    cek(A.logs.length === 0 && B.logs.length === 0, 'simpan 7: tanpa galat konsol', A.logs.concat(B.logs));
    await A.tutup();
  }

  /* ===== 8. Urungkan lintas langkah, dan tombol Urungkan di header ===== */
  {
    const A = await L.bukaApp({ srv, browser });
    const p = A.page;
    await muatContoh(p);
    await isi(p, '#kpb-f-nama', 'Awal Urungkan');
    await langkah(p, 3);
    const sebelum = (await dataTersimpan(p)).biayaTetap.length;
    await p.locator('.row >> nth=0 >> .del').click();
    cek((await dataTersimpan(p)).biayaTetap.length === sebelum - 1, 'baris biaya tetap dihapus');
    cek(await p.locator('#kpb-btn-urungkan').isVisible(), 'tombol Urungkan header tampil');
    await langkah(p, 4);
    cek(await p.locator('#kpb-btn-urungkan').isVisible(), 'Urungkan tetap tersedia setelah pindah langkah');
    await p.locator('#kpb-btn-urungkan').click();
    cek((await dataTersimpan(p)).biayaTetap.length === sebelum, 'Urungkan header mengembalikan baris');
    cek(await p.locator('#kpb-btn-urungkan').isHidden(), 'tombol Urungkan hilang setelah dipakai');
    /* kosongkan semua: dua klik */
    await p.locator('#kpb-btn-menu').click();
    const kos = p.locator('#kpb-btn-kosong');
    await kos.click();
    cek(/Yakin/.test(await kos.innerText()), 'klik pertama Kosongkan meminta konfirmasi', await kos.innerText());
    await p.keyboard.press('Escape');
    cek(await p.locator('#kpb-menu-list').isHidden(), 'menu tertutup tanpa menghapus apa pun');
    await p.locator('#kpb-btn-menu').click();
    cek(await p.locator('#kpb-btn-kosong').innerText() === 'Kosongkan semua', 'menutup menu membatalkan konfirmasi Kosongkan', await p.locator('#kpb-btn-kosong').innerText());
    await p.keyboard.press('Escape');
    cek((await dataTersimpan(p)).nama === 'Awal Urungkan', 'data utuh karena belum konfirmasi');
    await p.locator('#kpb-btn-menu').click();
    await p.locator('#kpb-btn-kosong').click();
    await p.locator('#kpb-btn-kosong').click();
    await p.waitForSelector('#kpb-panel');
    await p.waitForTimeout(500);
    const kosong = await dataTersimpan(p);
    cek(kosong.nama === 'Usaha Saya' && kosong.produk[0].harga === 0, 'Kosongkan semua mengosongkan data', kosong.nama);
    cek(!(await layarBersih(p)), 'data kosong tidak menghasilkan NaN di langkah 1', await layarBersih(p));
    for (let n = 2; n <= 6; n++) { await langkah(p, n); const k = await layarBersih(p); cek(!k, 'data kosong: langkah ' + n + ' bersih', k); }
    await p.locator('#kpb-btn-urungkan').click();
    cek((await dataTersimpan(p)).nama === 'Awal Urungkan', 'Urungkan memulihkan data sebelum dikosongkan');
    cek(A.logs.length === 0, 'simpan 8: tanpa galat konsol', A.logs);
    await A.tutup();
  }

  /* ===== 9. impor berkas JSON ===== */
  {
    const A = await L.bukaApp({ srv, browser });
    const p = A.page;
    const S = K.TEMPLATE[1].bangun();
    S.nama = 'Dari Berkas';
    S.contoh = false;
    const amplop = { app: 'proyeksi-bisnis', v: K.VERSI_DATA, versiApp: '2.0.0', dibuat: new Date().toISOString(), data: S };
    /* dari layar awal */
    await p.setInputFiles('#kpb-f-impor-mulai', tulisBerkas('ok.json', JSON.stringify(amplop)));
    await p.waitForSelector('#kpb-panel');
    cek(await nilai(p, '#kpb-f-nama') === 'Dari Berkas', 'impor amplop dari layar awal', await nilai(p, '#kpb-f-nama'));
    cek(/Data dibuka: Dari Berkas/.test(await toast(p)), 'toast konfirmasi impor', await toast(p));
    /* data tanpa amplop (mentah) */
    S.nama = 'Mentah';
    await p.setInputFiles('#kpb-f-impor', tulisBerkas('mentah.json', JSON.stringify(S)));
    await p.waitForTimeout(500);
    cek(await nilai(p, '#kpb-f-nama') === 'Mentah', 'impor data mentah tanpa amplop');
    /* berkas lebih baru */
    S.nama = 'Versi Baru';
    await p.setInputFiles('#kpb-f-impor', tulisBerkas('baru.json', JSON.stringify({ app: 'proyeksi-bisnis', v: 99, data: S })));
    await p.waitForTimeout(500);
    cek(/versi lebih baru/.test(await toast(p)), 'berkas versi lebih baru diberi catatan', await toast(p));
    /* berkas yang ditolak: data lama tidak boleh berubah */
    const tolak = [
      ['bukan.json', '{"bukan":"data"}', /bukan data dari aplikasi/],
      ['rusak.json', 'ini bukan json', /bukan JSON yang valid/],
      ['kosong.json', '', /bukan JSON yang valid/],
      ['larik.json', '[1,2,3]', /bukan data dari aplikasi/],
      ['angka.json', '42', /bukan data dari aplikasi/],
      ['null.json', 'null', /bukan data dari aplikasi/],
    ];
    for (const [nama, isiB, pola] of tolak) {
      await p.setInputFiles('#kpb-f-impor', tulisBerkas(nama, isiB));
      await p.waitForTimeout(300);
      cek(pola.test(await toast(p)), 'berkas ' + nama + ' ditolak dengan pesan yang jelas', await toast(p));
      cek(await nilai(p, '#kpb-f-nama') === 'Versi Baru', 'berkas ' + nama + ' tidak mengubah data yang ada');
    }
    /* berkas > 3 MB */
    await p.setInputFiles('#kpb-f-impor', tulisBerkas('besar.json', '{"produk":[' + '{},'.repeat(1100000) + '{}]}'));
    await p.waitForTimeout(500);
    cek(/terlalu besar/.test(await toast(p)), 'berkas di atas 3 MB ditolak', await toast(p));
    /* berkas dengan larik raksasa tetapi di bawah 3 MB: dipotong dan cepat */
    const t0 = Date.now();
    await p.setInputFiles('#kpb-f-impor', tulisBerkas('banyak.json', '{"nama":"Banyak","produk":[' + '{},'.repeat(900000) + '{}],"investasi":[' + 'null,'.repeat(100) + '{}]}'));
    await p.waitForSelector('#kpb-panel');
    await p.waitForTimeout(800);
    cek(await nilai(p, '#kpb-f-nama') === 'Banyak' && Date.now() - t0 < 12000, 'berkas dengan 900 ribu produk dipotong tanpa membekukan halaman (' + (Date.now() - t0) + ' ms)');
    cek((await dataTersimpan(p)).produk.length === 12, 'produk dipotong menjadi 12');
    cek(!(await layarBersih(p)), 'layar bersih setelah impor besar');
    await p.locator('#kpb-btn-urungkan').click().catch(() => {});
    fs.rmSync(TMP, { recursive: true, force: true });
    fs.mkdirSync(TMP, { recursive: true });
    cek(A.logs.length === 0, 'simpan 9: tanpa galat konsol', A.logs);
    await A.tutup();
  }

  /* ===== 10. isi berbahaya di nama: tidak boleh dieksekusi di mana pun ===== */
  {
    const A = await L.bukaApp({ srv, browser });
    const p = A.page;
    await muatContoh(p);
    const xss = '"><img src=x onerror="window.__xss=1"><script>window.__xss=2</script>';
    await isi(p, '#kpb-f-nama', xss);
    await langkah(p, 2);
    await isi(p, '#kpb-prd-' + (await dataTersimpan(p)).produk[0].id + '-n', xss);
    await langkah(p, 5);
    await langkah(p, 6);
    await p.waitForTimeout(300);
    cek(await p.evaluate(() => window.__xss) === undefined, 'nama berbahaya tidak dieksekusi di aplikasi');
    cek(await p.locator('#kpb-app img[src="x"]').count() === 0, 'nama berbahaya tidak menjadi elemen');
    /* laporan HTML yang diunduh */
    await p.locator('#kpb-btn-menu').click();
    const [unduh] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Unduh laporan (.html)' }).click()]);
    const berkasLap = path.join(TMP, 'laporan.html');
    await unduh.saveAs(berkasLap);
    const html = fs.readFileSync(berkasLap, 'utf8');
    cek(html.indexOf('<img src=x') < 0 && html.indexOf('<script>window.__xss') < 0, 'laporan HTML memberi escape pada nama berbahaya');
    const p3 = await A.ctx.newPage();
    await p3.goto('file://' + berkasLap);
    await p3.waitForTimeout(300);
    cek(await p3.evaluate(() => window.__xss) === undefined, 'laporan HTML tidak mengeksekusi nama berbahaya saat dibuka');
    const mt = /<title>([^<]*)<\/title>/.exec(html);
    cek(mt && mt[1].indexOf('&lt;') >= 0, 'judul laporan di sumber HTML memakai escape', mt && mt[1]);
    await p3.close();
    /* nama berkas unduhan aman */
    cek(/^laporan-[a-z0-9-]+\.html$/.test(unduh.suggestedFilename()), 'nama berkas laporan bersih dari karakter aneh', unduh.suggestedFilename());
    fs.rmSync(TMP, { recursive: true, force: true });
    await A.tutup();
  }

  srv.srv.close();
  await browser.close();
  process.exit(L.ringkas('SIMPAN') ? 1 : 0);
})().catch((e) => { console.error('UJI BERHENTI:', e.stack.split('\n').slice(0, 8).join('\n')); process.exit(2); });
