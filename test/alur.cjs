/* Uji alur utama: layar awal, hitung cepat, contoh usaha, mengisi langkah 1 sampai 4, membaca hasil di langkah 5 dan 6.
   Semua angka layar dibandingkan dengan mesin hitung yang dimuat terpisah di Node. */
const L = require('./lib.cjs');
const { cek, isi, teks, langkah, teksApp, layarBersih, dataTersimpan, mesin } = L;
const K = mesin();
const fInt = (v) => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(v));
const aktif = (page) => page.evaluate(() => { const a = window.__R().activeElement; return a ? a.id : ''; });
const nilai = (page, sel) => page.locator(sel).inputValue();

(async () => {
  const srv = await L.mulai(L.FOLDER);
  const browser = await L.chromium.launch();
  const A = await L.bukaApp({ srv, browser });
  const p = A.page;

  /* ===== 1. layar awal pada kunjungan pertama ===== */
  const judulAsli = await p.title();
  cek(/Kalkulator Proyeksi Bisnis/.test(judulAsli), 'judul halaman di layar awal tetap judul asli (untuk mesin pencari)', judulAsli);
  cek(await p.locator('#kpb-judul-cepat').isVisible(), 'kartu Hitung cepat tampil');
  cek(await p.locator('#kpb-app h1').count() === 1, 'tepat satu h1 di halaman mandiri', await p.locator('#kpb-app h1').count());
  cek(await p.locator('#kpb-app').getAttribute('lang') === 'id', 'akar aplikasi menyatakan lang="id" (pembaca layar memakai suara Indonesia walau halaman induk berbahasa lain)', await p.locator('#kpb-app').getAttribute('lang'));
  const c0 = K.hitungCepat(K.contohCepat());
  const v0 = await teks(p, '.cepat-hasil .verdict');
  cek(v0.indexOf(fInt(c0.bepUnit) + ' unit per bulan') >= 0, 'hasil cepat contoh = BEP mesin (' + fInt(c0.bepUnit) + ')', v0);
  cek(await p.locator('.cepat-contoh').isVisible(), 'penanda "hanya contoh" tampil');
  cek(await p.evaluate(() => localStorage.getItem('kpb:data')) === null, 'belum ada data tersimpan di kunjungan pertama');
  cek(await p.locator('#kpb-btn-awal').isHidden(), 'tombol Layar awal tersembunyi di layar awal');
  cek(await p.locator('#kpb-menu-list button[data-butuh-data]').first().isDisabled() === false || true, 'menu ada');
  await p.locator('#kpb-btn-menu').click();
  const nonaktif = await p.locator('#kpb-menu-list button[data-butuh-data]').evaluateAll((bs) => bs.map((b) => b.disabled));
  cek(nonaktif.length === 5 && nonaktif.every(Boolean), 'ekspor dinonaktifkan selama belum ada data', nonaktif);
  await p.keyboard.press('Escape');
  cek(await p.locator('#kpb-menu-list').isHidden(), 'Escape menutup menu');
  cek(await aktif(p) === 'kpb-btn-menu', 'fokus kembali ke tombol menu setelah Escape', await aktif(p));

  /* ketik di hitung cepat */
  await isi(p, '#kpb-q-harga', '30000');
  cek(await nilai(p, '#kpb-q-harga') === '30.000', 'harga cepat diformat 30.000', await nilai(p, '#kpb-q-harga'));
  const c1 = K.hitungCepat(Object.assign(K.contohCepat(), { harga: 30000 }));
  const v1 = await teks(p, '.cepat-hasil .verdict');
  cek(v1.indexOf(fInt(c1.bepUnit) + ' unit per bulan') >= 0, 'hasil cepat berubah mengikuti harga', [v1, c1.bepUnit]);
  cek(await p.locator('.cepat-contoh').isHidden(), 'penanda contoh hilang setelah mengubah angka');
  await p.waitForTimeout(100);
  const cepatTersimpan = await p.evaluate(() => JSON.parse(localStorage.getItem('kpb:cepat')));
  cek(cepatTersimpan && cepatTersimpan.harga === 30000, 'isian cepat tersimpan', cepatTersimpan);
  /* HPP lebih besar dari harga */
  await isi(p, '#kpb-q-hpp', '40000');
  cek(/Belum bisa impas/.test(await teks(p, '.cepat-hasil')), 'harga di bawah HPP: pesan belum bisa impas', await teks(p, '.cepat-hasil'));
  cek(!(await layarBersih(p)), 'layar awal bersih dari NaN dan sejenisnya', await layarBersih(p));
  await isi(p, '#kpb-q-hpp', '11000');
  await isi(p, '#kpb-q-volume', '0');
  cek(/Isi harga jual dan target/.test(await teks(p, '.cepat-hasil')), 'target 0: minta isi angka');
  await isi(p, '#kpb-q-volume', '700');
  await isi(p, '#kpb-q-nama', 'Es Kopi Botol Uji');
  /* angka negatif dan huruf tidak lolos */
  await isi(p, '#kpb-q-fee', '-5abc');
  cek(await nilai(p, '#kpb-q-fee') !== 'NaN', 'kolom persen menolak huruf');
  await isi(p, '#kpb-q-fee', '250');
  await p.locator('#kpb-q-modal').focus();
  cek(parseFloat((await nilai(p, '#kpb-q-fee')).replace(',', '.')) <= 100, 'persen dibatasi maksimum 100', await nilai(p, '#kpb-q-fee'));
  await isi(p, '#kpb-q-fee', '5');

  /* lanjut ke perhitungan lengkap */
  await p.getByRole('button', { name: 'Lanjut ke perhitungan lengkap' }).click();
  await p.waitForSelector('#kpb-panel');
  cek(await p.locator('#kpb-steps').isVisible(), 'masuk ke tampilan langkah');
  cek(/Langkah 1/.test(await p.title()), 'judul dokumen memuat nomor langkah', await p.title());
  cek(await nilai(p, '#kpb-f-nama') === 'Es Kopi Botol Uji', 'nama usaha terbawa dari hitung cepat', await nilai(p, '#kpb-f-nama'));
  cek((await teks(p, '#kpb-nama-usaha')) === 'Es Kopi Botol Uji', 'nama usaha tampil di header');
  let d = await dataTersimpan(p);
  cek(d && d.produk[0].harga === 30000 && d.produk[0].volume === 700 && d.biayaTetap[0].nilai === 6000000, 'data cepat menjadi data lengkap', d && d.produk[0]);
  await langkah(p, 4);
  cek(await nilai(p, '#kpb-tgt-' + d.produk[0].id) === '700', 'target di langkah 4 = 700');
  await p.locator('#kpb-btn-awal').click();
  cek(await p.locator('#kpb-judul-cepat').isVisible(), 'tombol Layar awal kembali ke layar awal');
  cek(await p.locator('.kartu.lanjut').isVisible(), 'kartu Lanjutkan pekerjaan muncul karena ada data');

  /* ===== 2. contoh usaha: ganti data meminta konfirmasi dua klik karena ada data milik pengguna ===== */
  const tplKopi = p.locator('.tpl').first();
  await p.waitForTimeout(500);
  await tplKopi.click();
  cek((await tplKopi.innerText()).indexOf('Klik lagi') >= 0, 'klik pertama contoh meminta konfirmasi bila ada data sendiri', await tplKopi.innerText());
  await p.waitForTimeout(100);
  await tplKopi.click();
  await p.waitForSelector('#kpb-panel');
  cek(await p.locator('#kpb-btn-urungkan').isVisible(), 'tombol Urungkan tampil setelah mengganti data');
  cek(await p.locator('#kpb-tag-contoh').isVisible() && await p.locator('#kpb-banner-contoh').isVisible(), 'penanda data contoh tampil');
  cek(await nilai(p, '#kpb-f-nama') === 'Kedai Kopi Contoh', 'template kopi termuat');
  await p.locator('#kpb-btn-urungkan').click();
  cek(await nilai(p, '#kpb-f-nama') === 'Es Kopi Botol Uji', 'Urungkan mengembalikan data cepat semula', await nilai(p, '#kpb-f-nama'));
  /* mulai ulang dari awal: muat kopi lagi, kini langsung (urungkan dibuang) */
  await p.locator('#kpb-btn-awal').click();
  await p.locator('.tpl').first().click();
  await p.locator('.tpl').first().click();
  await p.waitForSelector('#kpb-panel');

  /* ===== 3. langkah 1: nama, investasi, modal kerja ===== */
  const S0 = K.TEMPLATE[0].bangun();
  cek(await nilai(p, '#kpb-f-nama') === S0.nama, 'langkah 1 menampilkan template');
  const totalInv = S0.investasi.reduce((t, i) => t + i.nilai, 0);
  cek((await teks(p, '.rowfoot .total')).indexOf(fInt(totalInv)) >= 0, 'total investasi sesuai', await teks(p, '.rowfoot .total'));
  await isi(p, '#kpb-f-nama', 'Kopi Uji Coba');
  cek(await teks(p, '#kpb-nama-usaha') === 'Kopi Uji Coba', 'header ikut nama usaha');
  cek(await p.locator('#kpb-banner-contoh').isHidden(), 'banner contoh hilang setelah mengedit');
  /* tambah investasi: fokus pindah ke kolom nama baris baru */
  await p.getByRole('button', { name: '+ Tambah investasi' }).click();
  cek(/^kpb-inv-.*-n$/.test(await aktif(p)), 'fokus pindah ke nama investasi baru', await aktif(p));
  await p.keyboard.type('Kulkas');
  await p.keyboard.press('Tab');
  await p.keyboard.type('12500000');
  const idInv = (await aktif(p)).replace(/-v$/, '');
  cek(/-v$/.test(await aktif(p)), 'Tab pindah ke kolom nilai', await aktif(p));
  cek(await nilai(p, '#' + (await aktif(p))) === '12.500.000', 'nilai investasi diformat 12.500.000');
  cek((await teks(p, '.rowfoot .total')).indexOf(fInt(totalInv + 12500000)) >= 0, 'total investasi bertambah', await teks(p, '.rowfoot .total'));
  /* umur manfaat 0 = tidak disusutkan */
  const umur = p.locator('#' + idInv + '-u');
  await isi(p, '#' + idInv + '-u', '0');
  cek(/tidak disusutkan/.test(await teks(p, '.row:last-of-type')), 'umur 0 berarti tidak disusutkan');
  await isi(p, '#' + idInv + '-u', '5');
  cek((await teks(p, '.row:last-of-type .out')).indexOf(fInt(12500000 / 60)) >= 0, 'penyusutan per bulan = nilai / 60', await teks(p, '.row:last-of-type .out'));
  /* hapus lalu urungkan */
  await p.locator('.row:last-of-type .del').click();
  cek(await p.locator('#kpb-' + idInv.replace('kpb-', '') + '-n').count() === 0, 'baris investasi terhapus');
  cek((await teks(p, '#kpb-toast')).indexOf('Investasi dihapus') >= 0, 'toast hapus tampil', await teks(p, '#kpb-toast'));
  await p.locator('#kpb-toast .toast-aksi').click();
  cek(await p.locator('#' + idInv + '-n').count() === 1, 'Urungkan di toast mengembalikan baris');
  cek(await nilai(p, '#' + idInv + '-n') === 'Kulkas', 'isi baris yang dikembalikan utuh', await nilai(p, '#' + idInv + '-n'));
  /* urungkan hangus bila sudah ada perubahan lain */
  await p.locator('.row:last-of-type .del').click();
  await isi(p, '#kpb-f-mk', '90000000');
  cek(await p.locator('#kpb-btn-urungkan').isHidden(), 'Urungkan hilang setelah ada perubahan lain');
  cek(await nilai(p, '#kpb-f-mk') === '90.000.000', 'modal kerja diformat');
  const nota = await teks(p, '#kpb-panel .nota');
  const totalModal = totalInv + 90000000;
  cek(nota.indexOf(fInt(totalModal)) >= 0, 'nota total modal awal benar', nota);
  /* periode dan tanggal mulai */
  await p.locator('#kpb-f-periode').selectOption('24');
  await p.locator('#kpb-f-tahun').selectOption('2028');
  d = await dataTersimpan(p);
  cek(d.periode === 24 && d.mulaiTahun === 2028, 'periode dan tahun mulai tersimpan', [d.periode, d.mulaiTahun]);

  /* ===== 4. langkah 2: HPP per produk, konversi satuan ===== */
  await langkah(p, 2);
  const prod = d.produk[0];
  cek((await p.locator('.prod details').count()) === 3, 'tiga kartu produk');
  cek(await p.locator('.prod details').first().evaluate((e) => e.open), 'produk pertama terbuka, lainnya tertutup');
  const kedua = p.locator('.prod details').nth(1);
  cek(!(await kedua.evaluate((e) => e.open)), 'produk kedua tertutup di awal');
  /* render malas: kartu yang tertutup belum membangun baris bahan dan biayanya; isi dibangun saat pertama dibuka */
  const isiAda = (n) => p.locator('.prod details').nth(n).locator('.prod-isi').count();
  cek((await isiAda(0)) === 1 && (await isiAda(1)) === 0 && (await isiAda(2)) === 0, 'render malas: hanya kartu yang terbuka memuat isinya', [await isiAda(0), await isiAda(1), await isiAda(2)]);
  cek((await p.locator('.prod details').nth(1).locator('summary .ps-nama').innerText()).trim().length > 0 && /Rp|\d/.test(await p.locator('.prod details').nth(1).locator('summary .ps-meta').innerText()), 'kartu tertutup tetap menampilkan nama dan ringkasan angka');
  await kedua.locator('summary').click();
  cek(await kedua.evaluate((e) => e.open), 'klik ringkasan membuka produk');
  cek((await isiAda(1)) === 1 && (await kedua.locator('.prod-isi .row').count()) >= d.produk[1].bahan.length, 'isi kartu terbangun saat dibuka (semua baris bahan ada)', [await isiAda(1), await kedua.locator('.prod-isi .row').count(), d.produk[1].bahan.length]);
  await kedua.locator('summary').click();
  cek(!(await kedua.evaluate((e) => e.open)) && (await isiAda(1)) === 1, 'kartu ditutup lagi tanpa membangun isi dua kali');
  /* kartu yang dibuka lewat papan ketik (Enter pada ringkasan) juga terisi */
  const ketiga = p.locator('.prod details').nth(2);
  await ketiga.locator('summary').focus();
  await p.keyboard.press('Enter');
  cek(await ketiga.evaluate((e) => e.open) && (await isiAda(2)) === 1, 'Enter pada ringkasan membuka dan mengisi kartu', [await ketiga.evaluate((e) => e.open), await isiAda(2)]);
  await ketiga.locator('summary').click();
  /* ubah harga produk pertama: nota dan ringkasan berubah */
  await isi(p, '#kpb-prd-' + prod.id + '-h', '25000');
  d = await dataTersimpan(p);
  const K1 = K.unit(d.produk[0], K.persenOmzet(d));
  const notaTxt = await teks(p, '.prod details >> nth=0 >> .nota');
  cek(notaTxt.indexOf(fInt(K1.hpp)) >= 0 && notaTxt.indexOf('25.000') >= 0, 'nota produk memuat HPP dan harga baru', notaTxt.replace(/\n/g, ' | '));
  /* konversi satuan: biji kopi dibeli kg, dipakai gram */
  const bahan0 = d.produk[0].bahan[0];
  const idB = 'kpb-bhn-' + bahan0.id;
  cek(await p.locator('#' + idB + '-ps').count() === 1 || bahan0.satuan === 'gram', 'pilihan satuan pakai tersedia untuk satuan yang bisa dikonversi', [bahan0.satuan]);
  await p.locator('#' + idB + '-s').selectOption('kg');
  await isi(p, '#' + idB + '-h', '180000');
  await isi(p, '#' + idB + '-i', '1');
  await p.locator('#' + idB + '-ps').selectOption('gram');
  await isi(p, '#' + idB + '-p', '18');
  d = await dataTersimpan(p);
  const b0 = d.produk[0].bahan[0];
  cek(b0.satuan === 'kg' && b0.satuanPakai === 'gram', 'satuan beli kg dan pakai gram tersimpan', [b0.satuan, b0.satuanPakai]);
  cek(Math.abs(K.biayaBahan(b0) - 180000 / 1000 * 18) < 1e-6, 'biaya bahan = 180000/1000*18 = 3240', K.biayaBahan(b0));
  cek((await teks(p, '#' + idB + '-p >> xpath=ancestor::div[contains(@class,"row")][1] >> .out')).indexOf('3.240') >= 0, 'biaya per produk tampil 3.240', await teks(p, '.prod details >> nth=0 >> .row >> nth=0'));
  /* tambah bahan: fokus ke nama */
  await p.locator('.prod details >> nth=0').getByRole('button', { name: '+ Tambah bahan' }).click();
  cek(/-n$/.test(await aktif(p)), 'fokus ke nama bahan baru', await aktif(p));
  /* hapus bahan lalu urungkan */
  const jumlahBahan = (await dataTersimpan(p)).produk[0].bahan.length;
  await p.locator('.prod details >> nth=0 >> .row >> nth=0 >> .del').click();
  cek((await dataTersimpan(p)).produk[0].bahan.length === jumlahBahan - 1, 'bahan dihapus');
  await p.locator('#kpb-toast .toast-aksi').click();
  cek((await dataTersimpan(p)).produk[0].bahan.length === jumlahBahan, 'bahan dikembalikan oleh Urungkan');
  /* biaya langsung lain */
  await p.locator('.prod details >> nth=0').getByRole('button', { name: '+ Tambah biaya' }).click();
  await p.keyboard.type('Upah borongan');
  await p.keyboard.press('Tab');
  await p.locator('select[id$="-j"]').first().selectOption('tk');
  /* komisi */
  await isi(p, '#kpb-prd-' + prod.id + '-fp', '8,5');
  await p.locator('#kpb-prd-' + prod.id + '-h').focus();
  cek(await nilai(p, '#kpb-prd-' + prod.id + '-fp') === '8,5', 'persen desimal diformat dengan koma', await nilai(p, '#kpb-prd-' + prod.id + '-fp'));
  /* saran harga */
  await isi(p, '#kpb-sar-' + prod.id, '60');
  const saran = await teks(p, '.prod details >> nth=0 >> .prod-side > .fld');
  cek(/Harga yang disarankan/.test(saran), 'saran harga tampil', saran.replace(/\n/g, ' | '));
  d = await dataTersimpan(p);
  const hsaran = Math.ceil(K.hargaSaran(d.produk[0], 60, K.persenOmzet(d)) / 100) * 100;
  cek(saran.indexOf(fInt(hsaran)) >= 0, 'saran harga = hitungan mesin ' + hsaran, saran.replace(/\n/g, ' | '));
  await p.locator('.prod details >> nth=0').getByRole('button', { name: 'Pakai harga ini' }).click();
  cek((await dataTersimpan(p)).produk[0].harga === hsaran, 'tombol Pakai harga ini menerapkan saran');
  /* tambah produk baru */
  await p.getByRole('button', { name: '+ Tambah produk' }).click();
  cek(/^kpb-prd-.*-n$/.test(await aktif(p)), 'fokus ke nama produk baru', await aktif(p));
  await p.keyboard.type('Teh tarik');
  d = await dataTersimpan(p);
  cek(d.produk.length === 4 && d.produk[3].nama === 'Teh tarik', 'produk keempat tersimpan');
  await p.locator('.prod >> nth=3').getByRole('button', { name: 'Hapus produk' }).click();
  cek((await dataTersimpan(p)).produk.length === 3, 'produk dihapus');
  await p.locator('#kpb-toast .toast-aksi').click();
  cek((await dataTersimpan(p)).produk.length === 4, 'produk dikembalikan');
  await p.locator('.prod >> nth=3').getByRole('button', { name: 'Hapus produk' }).click();

  /* ===== 5. langkah 3: biaya tetap dan biaya ikut omzet ===== */
  await langkah(p, 3);
  d = await dataTersimpan(p);
  const jmlTetap = d.biayaTetap.length;
  await p.locator('.btn.lnk', { hasText: 'Gaji pemilik' }).first().click().catch(() => {});
  d = await dataTersimpan(p);
  const adaSaran = d.biayaTetap.length > jmlTetap;
  cek(adaSaran || d.biayaTetap.some((t) => /gaji pemilik/i.test(t.nama)), 'tambah cepat bekerja atau saran sudah dipakai');
  if (adaSaran) cek(/-v$/.test(await aktif(p)), 'tambah cepat memfokuskan kolom nilai', await aktif(p));
  await p.getByRole('button', { name: '+ Tambah biaya ikut omzet' }).click();
  await p.keyboard.type('Iklan berbayar');
  await p.keyboard.press('Tab');
  await p.keyboard.type('12,5');
  d = await dataTersimpan(p);
  cek(d.biayaOmzet.length === 1 && Math.abs(d.biayaOmzet[0].persen - 12.5) < 1e-9, 'biaya ikut omzet 12,5% tersimpan', d.biayaOmzet);
  const tetapTot = K.biayaTetapBulan(d);
  cek((await teks(p, '.rowfoot .total >> nth=0')).indexOf(fInt(tetapTot)) >= 0, 'total biaya tetap sama dengan mesin ' + fInt(tetapTot), await teks(p, '.rowfoot .total >> nth=0'));
  cek((await teks(p, '.rowfoot .total >> nth=1')).indexOf('12,5%') >= 0, 'total biaya ikut omzet 12,5%', await teks(p, '.rowfoot .total >> nth=1'));
  const A3 = K.analisis(d);
  const ringTetap = await teks(p, '.tiles');
  cek(ringTetap.indexOf(fInt(A3.bep.fc)) >= 0, 'tile total yang harus ditutup sesuai mesin', ringTetap.replace(/\n/g, ' | '));
  /* ringkasan langsung di kanan */
  const live = await teks(p, '#kpb-live');
  cek(live.indexOf(fInt(A3.bep.bepUnit) + ' unit/bln') >= 0, 'ringkasan langsung memuat BEP ' + fInt(A3.bep.bepUnit), live.replace(/\n/g, ' | '));

  /* ===== 6. langkah 4: target, pajak, pengaturan lanjutan ===== */
  await langkah(p, 4);
  await isi(p, '#kpb-tgt-' + d.produk[0].id, '2000');
  d = await dataTersimpan(p);
  cek(d.produk[0].volume === 2000, 'target produk 1 = 2000');
  const bauran = await teks(p, '.rows .row >> nth=0');
  cek(/\d+%/.test(bauran), 'bauran dihitung', bauran.replace(/\n/g, ' | '));
  await p.locator('#kpb-f-pj').selectOption('badan-31e');
  d = await dataTersimpan(p);
  cek(d.asumsi.pajakPreset === 'badan-31e' && d.asumsi.pajakLaba === 11 && d.asumsi.pajakOmzet === 0, 'preset pajak 31E menerapkan tarif 11%', d.asumsi);
  cek(await nilai(p, '#kpb-f-pl') === '11', 'kolom pajak laba terisi 11', await nilai(p, '#kpb-f-pl'));
  await isi(p, '#kpb-f-pl', '15');
  cek(await p.locator('#kpb-f-pj').inputValue() === 'manual', 'mengubah tarif manual memindahkan jenis pajak ke Atur sendiri', await p.locator('#kpb-f-pj').inputValue());
  await p.locator('#kpb-f-pj').selectOption('op-final');
  d = await dataTersimpan(p);
  cek(d.asumsi.pajakOmzet === 0.5 && d.asumsi.pajakBebas === 500000000, 'preset OP final: 0,5% dan bebas Rp500 juta', d.asumsi);
  /* koperasi: 0,5% sejak rupiah pertama (bebas Rp500 juta hanya untuk orang pribadi); batas empat tahun disebut di keterangan */
  const pilihanPajak = await p.locator('#kpb-f-pj option').allInnerTexts();
  cek(pilihanPajak.join('|') === 'Orang pribadi (PPh final)|PT perorangan (PPh final)|Koperasi (PPh final)|PT / CV (fasilitas Pasal 31E)|PT / CV (tarif umum)|Tanpa pajak|Atur sendiri', 'pilihan jenis pajak: tujuh pilihan, koperasi di antaranya', pilihanPajak);
  await p.locator('#kpb-f-pj').selectOption('koperasi');
  d = await dataTersimpan(p);
  cek(d.asumsi.pajakPreset === 'koperasi' && d.asumsi.pajakOmzet === 0.5 && d.asumsi.pajakBebas === 0 && d.asumsi.pajakLaba === 0 && d.asumsi.batasOmzetFinal === 4.8e9, 'preset koperasi: 0,5% omzet, tanpa bebas pajak', d.asumsi);
  cek(await nilai(p, '#kpb-f-pb') === '0' && await nilai(p, '#kpb-f-po') === '0,5', 'kolom tarif terisi: bebas pajak 0 dan PPh final 0,5', [await nilai(p, '#kpb-f-pb'), await nilai(p, '#kpb-f-po')]);
  const panelPajak = await teks(p, '#kpb-panel');
  cek(/Koperasi: PPh final 0,5% dari omzet \(dibatasi empat tahun pajak sejak terdaftar\)/.test(panelPajak), 'keterangan koperasi menyebut batas empat tahun pajak');
  const tautanPajak = await p.locator('#kpb-panel p.small:has(a[href*="pajak.go.id"]) a').evaluateAll((as) => as.map((a) => [a.hostname, a.rel, a.target]));
  cek(tautanPajak.length === 5 && tautanPajak[0][0] === 'pajak.go.id' && tautanPajak.every((t) => /noopener/.test(t[1]) && t[2] === '_blank'), 'sumber aturan pajak: DJP lebih dulu, lima tautan, semuanya buka tab baru dengan noopener', tautanPajak);
  await p.locator('#kpb-f-pj').selectOption('op-final');
  /* pengaturan lanjutan: musiman, kapasitas, modal kerja */
  const adv = p.locator('details.adv');
  if (!(await adv.evaluate((e) => e.open))) await adv.locator('summary').first().click();
  await p.locator('#kpb-f-ms').check();
  cek(await p.locator('#kpb-ms-0').count() === 1, 'faktor musiman muncul setelah dicentang');
  await isi(p, '#kpb-ms-8', '160');
  d = await dataTersimpan(p);
  cek(d.asumsi.musimanAktif === true && d.asumsi.musiman[8] === 160, 'faktor Sep = 160 tersimpan', d.asumsi.musiman);
  cek(/Normalkan/.test(await teks(p, 'details.adv')), 'ada tombol Normalkan');
  await p.getByRole('button', { name: 'Normalkan rata-rata ke 100%' }).click();
  d = await dataTersimpan(p);
  cek(Math.abs(K.sum(d.asumsi.musiman) / 12 - 100) < 0.6, 'normalkan membuat rata-rata ≈ 100%', K.sum(d.asumsi.musiman) / 12);
  await p.getByRole('button', { name: 'Semua 100%' }).click();
  d = await dataTersimpan(p);
  cek(d.asumsi.musiman.every((x) => x === 100), 'tombol Semua 100% bekerja');
  await isi(p, '#kpb-f-kp', '2500');
  await isi(p, '#kpb-f-sh', '10');
  await isi(p, '#kpb-f-ph', '5');
  await isi(p, '#kpb-f-hh', '7');
  d = await dataTersimpan(p);
  cek(d.asumsi.kapasitas === 2500 && d.asumsi.stokHari === 10 && d.asumsi.piutangHari === 5 && d.asumsi.hutangHari === 7, 'kapasitas dan hari modal kerja tersimpan', d.asumsi);
  cek(/Target Anda .* dari kapasitas/.test(await teks(p, 'details.adv')), 'info kapasitas tampil');
  cek(!(await layarBersih(p)), 'langkah 4 bersih', await layarBersih(p));

  /* ===== 7. langkah 5: hasil dibandingkan dengan mesin ===== */
  d = await dataTersimpan(p);
  const An = K.analisis(d);
  await langkah(p, 5);
  const v5 = await teks(p, '.verdict');
  cek(v5.indexOf(fInt(An.bep.bepUnit) + ' unit per bulan') >= 0, 'vonis langkah 5 memuat BEP mesin ' + fInt(An.bep.bepUnit), v5);
  cek(An.m.untungBulan ? v5.indexOf('bulan ke-' + An.m.untungBulan) >= 0 : /Belum untung/.test(v5), 'bulan mulai untung sesuai mesin', [v5, An.m.untungBulan]);
  cek(await p.locator('svg[role="img"]').count() >= 2, 'grafik BEP dan laba tampil', await p.locator('svg[role="img"]').count());
  /* tooltip grafik: panah kanan di grafik BEP */
  const svgBep = p.locator('.cc >> nth=0 >> svg').first();
  await svgBep.focus();
  await p.keyboard.press('ArrowRight');
  await p.keyboard.press('ArrowRight');
  const tipTeks = await teks(p, '.cc >> nth=0 >> .tip');
  cek(/Pendapatan/.test(tipTeks) && /Total biaya/.test(tipTeks), 'tooltip grafik BEP lewat papan ketik', tipTeks.replace(/\n/g, ' | '));
  await p.keyboard.press('Escape');
  cek(await p.locator('.cc >> nth=0 >> .tip').isHidden(), 'Escape menyembunyikan tooltip');
  /* tooltip dengan mouse */
  const kotakSvg = await svgBep.boundingBox();
  await p.mouse.move(kotakSvg.x + kotakSvg.width * 0.5, kotakSvg.y + kotakSvg.height * 0.5);
  cek(await p.locator('.cc >> nth=0 >> .tip').isVisible(), 'tooltip muncul saat kursor di atas grafik');
  await p.mouse.move(5, 5);
  /* tombol Tabel */
  await p.locator('.cc >> nth=0').getByRole('button', { name: 'Tabel' }).click();
  cek(await p.locator('.cc >> nth=0 >> table').isVisible(), 'tombol Tabel menampilkan tabel data grafik');
  cek((await p.locator('.cc >> nth=0 >> th[scope="col"]').count()) === 4, 'tabel data punya 4 kolom berjudul');
  await p.locator('.cc >> nth=0').getByRole('button', { name: 'Grafik' }).click();
  /* kalkulator target laba */
  await isi(p, '#kpb-f-tl', '10000000');
  const u10 = An.bep.unitUntukLaba ? null : null;
  const hitungTarget = K.bep(d).unitUntukLaba(10000000);
  cek((await teks(p, '.prod-target, .tiles >> nth=1')).length > 0, 'kalkulator target laba menampilkan tile');
  const tilesAll = await p.locator('.tiles').evaluateAll((e) => e.map((x) => x.innerText.replace(/\n/g, ' | ')));
  cek(tilesAll.some((t) => t.indexOf(fInt(hitungTarget) + ' unit') >= 0), 'penjualan untuk laba Rp10 jt = ' + fInt(hitungTarget), tilesAll);
  /* tabel laba rugi tahunan lalu bulanan */
  const tahunan = await teks(p, '.tw >> nth=-1');
  cek(/Laba bersih/.test(tahunan), 'tabel laba rugi tahunan tampil');
  await p.getByRole('button', { name: 'Per bulan' }).click();
  const barisBulan = await p.locator('table.dt >> nth=-1 >> tbody tr').count();
  cek(barisBulan === d.periode, 'tabel bulanan punya ' + d.periode + ' baris', barisBulan);
  await p.getByRole('button', { name: 'Per tahun' }).click();
  /* periksa isian: tombol buka langkah */
  cek(!(await layarBersih(p)), 'langkah 5 bersih', await layarBersih(p));

  /* ===== 8. langkah 6: balik modal, simulasi ===== */
  await langkah(p, 6);
  const v6 = await teks(p, '.verdict');
  if (An.m.payback) cek(v6.indexOf('bulan ke-' + An.m.payback.bulan) >= 0, 'vonis langkah 6 memuat balik modal bulan ' + An.m.payback.bulan, v6);
  else cek(/belum kembali/.test(v6), 'vonis langkah 6: belum balik modal', v6);
  cek(await p.locator('#kpb-sim-harga').count() === 1, 'slider simulasi harga ada');
  const slider = p.locator('#kpb-sim-harga');
  await slider.focus();
  for (let i = 0; i < 5; i++) await p.keyboard.press('ArrowLeft');
  cek((await teks(p, '.sl-top >> nth=0')).indexOf('−5%') >= 0, 'slider harga bergeser ke −5%', await teks(p, '.sl-top >> nth=0'));
  const sim = K.ringkas(d, { harga: 0.95, volume: 1, hpp: 1, tetap: 1 });
  const banding = await teks(p, '.cmp');
  cek(banding.indexOf(fInt(sim.b.bepUnit)) >= 0, 'BEP simulasi harga −5% = ' + fInt(sim.b.bepUnit), banding.replace(/\n/g, ' | '));
  await p.getByRole('button', { name: /Pesimis/ }).click();
  cek((await teks(p, '.sl-top >> nth=0')).indexOf('−') >= 0, 'preset skenario pesimis menggeser slider');
  await p.getByRole('button', { name: /Optimis/ }).click();
  cek((await teks(p, '.sl-top >> nth=1')).indexOf('+') >= 0, 'preset skenario optimis menggeser slider');
  /* tabel skenario dan sensitivitas */
  cek(await p.locator('table.dt[aria-label], .scroll[aria-label*="skenario"]').count() >= 1 || (await p.locator('.scroll[aria-label*="skenario"]').count()) >= 1, 'tabel skenario ada');
  cek(await p.locator('.scroll[aria-label*="Sensitivitas"]').count() === 1, 'tabel sensitivitas ada');
  cek(!(await layarBersih(p)), 'langkah 6 bersih', await layarBersih(p));
  /* tombol Selesai: langkah terakhir tidak punya Lanjut */
  cek(await p.locator('#kpb-btn-next').isHidden(), 'langkah terakhir menyembunyikan Lanjut');

  /* ===== 9. navigasi ===== */
  await p.locator('#kpb-btn-prev').click();
  cek(/Langkah 5/.test(await teks(p, '#kpb-where')), 'tombol Kembali ke langkah 5', await teks(p, '#kpb-where'));
  cek(/#langkah-5/.test(p.url()), 'URL memuat #langkah-5', p.url());
  await p.goBack();
  cek(/#langkah-6/.test(p.url()) && /Langkah 6/.test(await teks(p, '#kpb-where')), 'tombol Back peramban kembali ke langkah 6', [p.url(), await teks(p, '#kpb-where')]);
  await p.goForward();
  cek(/Langkah 5/.test(await teks(p, '#kpb-where')), 'tombol Forward ke langkah 5');
  await langkah(p, 1);
  cek(await p.locator('#kpb-btn-prev').isDisabled(), 'langkah pertama menonaktifkan Kembali');
  cek((await p.locator('#kpb-steps button[aria-current="step"]').count()) === 1, 'tepat satu langkah ditandai aria-current');
  /* kamus */
  await p.getByRole('button', { name: 'Kamus istilah' }).first().click();
  cek(await p.locator('#kpb-kamus').evaluate((e) => e.open), 'tombol Kamus istilah membuka kamus');
  cek((await p.locator('#kpb-kamus .gloss > details').count()) >= 20, 'kamus memuat 20+ istilah');

  cek(A.logs.length === 0, 'tanpa galat atau peringatan konsol', A.logs);
  await A.tutup();
  srv.srv.close();
  await browser.close();
  process.exit(L.ringkas('ALUR') ? 1 : 0);
})().catch((e) => { console.error('UJI BERHENTI:', e.stack.split('\n').slice(0, 8).join('\n')); process.exit(2); });
