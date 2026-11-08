/* ===== steps-b: langkah 2 (HPP dan harga jual per produk) ===== */
/* lebar minimum kolom dijumlah 660 px, ditambah 6 celah 12 px = 732 px. Titik putus tabel ke kartu (LEBAR.rows di ui-core.js) harus di atas angka itu.
   Kolom satuan dan "Dipakai" diberi ruang untuk kotak pilih dan akhiran satuan; kolom yang terlalu sempit memotong angka atau nama satuan. */
const COLS_BHN = 'minmax(92px,1.3fr) minmax(120px,1.1fr) minmax(76px,.7fr) minmax(100px,.7fr) minmax(148px,1.5fr) 90px 34px';
const COLS_LAIN = 'minmax(0,2fr) minmax(0,1.5fr) minmax(0,1.3fr) 34px';
const SATUAN = ['gram', 'kg', 'ml', 'liter', 'pcs', 'lusin', 'kodi', 'butir', 'slice', 'lembar', 'porsi', 'set', 'bungkus', 'botol', 'kotak', 'cm', 'meter'];
const JENIS_LAIN = [['tk', 'Tenaga kerja langsung'], ['oh', 'Overhead produksi'], ['lain', 'Lainnya']];
App.targetCm = {};
App.ui = App.ui || {};
App.ui.terbuka = App.ui.terbuka || {};

function barisBahan(p, b) {
  const k = 'bhn-' + b.id;
  const ops = !b.satuan || SATUAN.includes(b.satuan) ? SATUAN : SATUAN.concat([b.satuan]);
  const satuan = h('select', { id: k + '-s', 'aria-label': 'Satuan beli' },
    [['', '-']].concat(ops.map((x) => [x, x])).map(([v, t]) => h('option', { value: v, selected: b.satuan === v }, t)));
  satuan.addEventListener('change', () => {
    b.satuan = satuan.value;
    if (b.satuanPakai && !KPB.satuanSerupa(b.satuan).includes(b.satuanPakai)) b.satuanPakai = '';
    strukturBerubah(k + '-s');
  });
  /* satuan pakai: bisa dipilih bila satuan beli punya padanan (kg dan gram, liter dan ml, meter dan cm, lusin dan pcs) */
  const serupa = KPB.satuanSerupa(b.satuan);
  let akhiran;
  if (serupa.length > 1) {
    const ps = h('select', { id: k + '-ps', 'aria-label': 'Satuan pemakaian' },
      serupa.map((x) => h('option', { value: x, selected: (b.satuanPakai || b.satuan) === x }, x)));
    ps.addEventListener('change', () => { b.satuanPakai = ps.value === b.satuan ? '' : ps.value; berubah(); });
    akhiran = h('span', { class: 'suf pilih' }, ps);
  } else akhiran = h('span', { class: 'suf' }, b.satuan || '');
  return h('div', { class: 'row', style: '--cols:' + COLS_BHN },
    sel('Nama bahan', inText(b, 'nama', k + '-n', { ph: 'Contoh: Biji kopi', label: 'Nama bahan' }), { cls: 'wide' }),
    sel('Harga beli', inRp(b, 'harga', k + '-h', 'Harga beli'), { pre: 'Rp', cls: 'w2' }),
    sel('Isi per pembelian', inNum(b, 'isi', k + '-i', { dec: 3, min: 0, label: 'Isi per pembelian' })),
    sel('Satuan beli', satuan),
    h('div', { class: 'c w2' }, h('label', { class: 'cl', for: k + '-p' }, 'Dipakai per 1 produk'),
      h('div', { class: 'in' }, inNum(b, 'pakai', k + '-p', { dec: 3, label: 'Dipakai per 1 produk' }), akhiran)),
    h('div', { class: 'c out' }, h('span', { class: 'cl' }, 'Biaya per produk'), out(() => fRp(KPB.biayaBahan(b)))),
    hapusBtn(() => denganUrungkan('Bahan dihapus', () => { p.bahan.splice(p.bahan.indexOf(b), 1); strukturBerubah(); })));
}

function barisLain(p, x) {
  const k = 'lain-' + x.id;
  return h('div', { class: 'row', style: '--cols:' + COLS_LAIN },
    sel('Nama biaya', inText(x, 'nama', k + '-n', { ph: 'Contoh: Upah borongan', label: 'Nama biaya' }), { cls: 'wide' }),
    sel('Jenis', inSelect(x, 'jenis', JENIS_LAIN, k + '-j', { label: 'Jenis biaya' }), { cls: 'w2' }),
    sel('Per 1 produk', inRp(x, 'biaya', k + '-b', 'Biaya per produk'), { pre: 'Rp' }),
    hapusBtn(() => denganUrungkan('Biaya dihapus', () => { p.lain.splice(p.lain.indexOf(x), 1); strukturBerubah(); })));
}

function notaProduk(p) {
  const u = KPB.unit(p, KPB.persenOmzet(App.s));
  const baris = (warna, k, v, cls) => h('div', { class: 'nr ' + (cls || '') },
    h('span', { class: 'k' }, warna ? h('i', { class: 'key', style: 'background:var(--' + warna + ')' }) : null, k),
    h('span', { class: 'lead' }), h('span', { class: 'v' }, v));
  const total = Math.max(u.harga, u.hpp + u.feeJual);
  const lebar = (x) => (total > 0 ? (Math.max(0, x) / total) * 100 : 0);
  const bagian = [['s1', u.bahan], ['s2', u.lain], ['s3', u.feeJual], ['s4', u.kontribusi]];
  return h('div', { class: 'nota' },
    h('div', { class: 'cap' }, 'Nota HPP · ' + (p.nama || 'Produk')),
    baris('s1', 'Bahan baku dan kemasan', fRp(u.bahan)),
    baris('s2', 'Biaya langsung lain', fRp(u.lain)),
    h('hr', { class: 'dbl' }),
    baris(null, 'HPP per unit', fRp(u.hpp), 'tot'),
    baris(null, 'Harga jual', fRp(u.harga)),
    baris(null, 'Laba kotor (' + fPct(u.margKotorPct, 1) + ')', fRp(u.margKotor)),
    baris('s3', 'Biaya penjualan', fRp(u.feeSendiri)),
    u.feeOmzet > 0 ? baris('s3', 'Biaya ikut omzet', fRp(u.feeOmzet)) : null,
    h('hr', { class: 'dbl' }),
    baris('s4', 'Margin kontribusi (' + fPct(u.cmPct, 1) + ')', fRp(u.kontribusi), 'tot'),
    h('div', { class: 'sbar', role: 'img', 'aria-label': 'Susunan harga jual: bahan ' + fRp(u.bahan) + ', biaya lain ' + fRp(u.lain) + ', biaya penjualan ' + fRp(u.feeJual) + ', margin kontribusi ' + fRp(u.kontribusi) },
      bagian.map(([c, x]) => (x > 0 ? h('i', { style: 'width:' + lebar(x) + '%;background:var(--' + c + ')' }) : null))),
    u.kontribusi < 0
      ? h('p', { class: 'note-bad' }, 'Harga jual lebih kecil dari total biaya. Tiap produk terjual menambah rugi ' + fRp(-u.kontribusi) + '.')
      : h('p', { class: 'hint' }, 'Dari tiap Rp100 penjualan, sekitar Rp' + fDec(u.cmPct * 100, 0) + ' tersisa untuk menutup biaya tetap dan menjadi laba.'));
}

function saranHarga(p) {
  const tg = App.targetCm;
  if (tg[p.id] == null) tg[p.id] = 50;
  return h('div', { class: 'fld' },
    h('h3', { class: 'h3' }, 'Saran harga jual'),
    fld('Target margin kontribusi', inNum(tg, p.id, 'sar-' + p.id, { dec: 1, min: 0, max: 95, label: 'Target margin kontribusi' }), { suf: '%', hint: 'Bagian dari harga yang ingin tersisa setelah HPP dan biaya penjualan.' }),
    slot(() => {
      const hs = KPB.hargaSaran(p, tg[p.id], KPB.persenOmzet(App.s));
      if (hs == null) return [h('p', { class: 'small' }, 'Target terlalu tinggi dibanding biaya penjualan.')];
      const bulat = Math.ceil(hs / 100) * 100;
      return [h('p', { class: 'small' }, 'Harga yang disarankan: ', h('b', null, fRp(bulat)), bulat === p.harga ? ' (sama dengan harga Anda)' : ''),
        bulat !== p.harga ? tambahBtn('Pakai harga ini', () => { p.harga = bulat; strukturBerubah(); }) : null];
    }));
}

function kartuProduk(p, i) {
  const k = 'prd-' + p.id;
  const tambahBahan = () => { const b = { id: KPB.uid(), nama: '', harga: 0, isi: 1, pakai: 1, satuan: '', satuanPakai: '' }; p.bahan.push(b); strukturBerubah('bhn-' + b.id + '-n'); };
  const tambahLain = () => { const x = { id: KPB.uid(), nama: '', jenis: 'oh', biaya: 0 }; p.lain.push(x); strukturBerubah('lain-' + x.id + '-n'); };
  const terbuka = App.ui.terbuka[p.id] != null ? App.ui.terbuka[p.id] : (App.s.produk.length === 1 || i === 0);
  const ringkas = () => 'HPP ' + fRp(KPB.unit(p, KPB.persenOmzet(App.s)).hpp) + ' · margin ' + fPct(KPB.unit(p, KPB.persenOmzet(App.s)).cmPct, 0);
  const ringkasan = h('summary', { class: 'prod-sum' },
    h('span', { class: 'ps-nama' }, out(() => p.nama || 'Produk ' + (i + 1))),
    h('span', { class: 'ps-meta' }, out(ringkas)));
  /* isi kartu dibangun saat pertama dibuka. Kartu tertutup hanya membawa ringkasan di judulnya, sehingga langkah ini tetap ringan di ponsel
     lambat walau produknya banyak (12 produk x 40 bahan: dari sekitar 26.000 menjadi sekitar 3.000 simpul) dan ketikan tidak ikut menyegarkan kartu yang tak terlihat */
  const bangunIsi = () =>
    h('div', { class: 'prod-isi' },
      h('div', { class: 'prod-head' },
        fld('Produk ' + (i + 1), inText(p, 'nama', k + '-n', { ph: 'Contoh: Kopi susu gula aren' })),
        App.s.produk.length > 1 ? h('button', { type: 'button', class: 'btn sm', onclick: () => denganUrungkan('Produk dihapus', () => { App.s.produk.splice(App.s.produk.indexOf(p), 1); strukturBerubah(); }) }, 'Hapus produk') : null),
      h('div', { class: 'prod-body' },
        h('div', { class: 'prod-form' },
          fld('Harga jual per unit', inRp(p, 'harga', k + '-h'), { pre: 'Rp', hint: 'Harga yang dibayar pelanggan untuk 1 produk.', cls: 'w-md' }),
          h('div', { class: 'sec' },
            h('h3', { class: 'h3' }, 'Bahan baku dan kemasan'),
            h('p', { class: 'hint' }, 'Isi harga beli, isi per pembelian, dan jumlah yang dipakai untuk 1 produk. Contoh: beli Rp180.000 per 1.000 gram, dipakai 18 gram. Dibeli per kg tetapi dipakai per gram? Pilih satuan pakai di sebelah jumlah, konversinya otomatis.'),
            h('div', { class: 'rows' }, thead(['Nama bahan', 'Harga beli', 'Isi per beli', 'Satuan beli', 'Dipakai per produk', 'Biaya', ''], COLS_BHN, [5]), p.bahan.map((b) => barisBahan(p, b))),
            h('div', { class: 'rowfoot' }, tambahBtn('+ Tambah bahan', tambahBahan), h('div', { class: 'total' }, 'Subtotal bahan: ', h('b', null, out(() => fRp(KPB.unit(p).bahan)))))),
          h('div', { class: 'sec' },
            h('h3', { class: 'h3' }, 'Biaya langsung lain per produk'),
            h('p', { class: 'hint' }, 'Upah borongan, listrik atau gas untuk membuat 1 produk. Gaji bulanan tetap dimasukkan di langkah 3.'),
            p.lain.length ? h('div', { class: 'rows' }, thead(['Nama biaya', 'Jenis', 'Per produk', ''], COLS_LAIN), p.lain.map((x) => barisLain(p, x))) : null,
            h('div', { class: 'rowfoot' }, tambahBtn('+ Tambah biaya', tambahLain), h('div', { class: 'total' }, 'Subtotal: ', h('b', null, out(() => fRp(KPB.unit(p).lain)))))),
          h('div', { class: 'sec' },
            h('h3', { class: 'h3' }, 'Biaya penjualan yang ikut penjualan'),
            h('div', { class: 'grid2' },
              fld('Komisi atau fee', inNum(p, 'feePersen', k + '-fp', { dec: 2, min: 0, max: 100, label: 'Komisi persen' }), { suf: '% dari harga', hint: 'Marketplace, QRIS, ojek online.' }),
              fld('Biaya tambahan per unit', inRp(p, 'feeRp', k + '-fr', 'Biaya tambahan per unit'), { pre: 'Rp', hint: 'Subsidi ongkir, biaya proses pesanan, bonus kasir per unit.' })))),
        h('div', { class: 'prod-side' }, slot(() => notaProduk(p)), saranHarga(p))));
  const det = h('details', { open: terbuka }, ringkasan);
  let terisi = false;
  const isiKartu = () => { if (terisi) return; terisi = true; det.append(bangunIsi()); };
  if (terbuka) isiKartu();
  /* klik pada judul membangun isinya sebelum peramban membuka kartu, jadi tidak ada kedipan kartu kosong; toggle menangani pembukaan lewat jalur lain (mis. pencarian di halaman) */
  ringkasan.addEventListener('click', isiKartu);
  det.addEventListener('toggle', () => { App.ui.terbuka[p.id] = det.open; if (det.open) isiKartu(); });
  return h('article', { class: 'prod' }, det);
}

function buildStep2() {
  const s = App.s;
  return [
    seksi('HPP dan harga jual per produk',
      cara(par('HPP (Harga Pokok Penjualan) adalah semua biaya untuk membuat 1 produk sampai siap dijual. Isi bahan baku dan kemasan dari harga beli dan pemakaian, lalu biaya langsung lain. Nota di sisi kanan langsung menghitung HPP dan margin Anda.'),
        h('p', null, eq('Biaya bahan = harga beli ÷ isi per pembelian × jumlah dipakai')),
        h('p', null, eq('HPP = bahan baku + tenaga kerja langsung + overhead produksi')),
        h('p', null, eq('Margin kontribusi = harga jual − HPP − biaya penjualan'))),
      s.produk.map(kartuProduk),
      h('div', { class: 'rowfoot' },
        tambahBtn('+ Tambah produk', () => { const p = { id: KPB.uid(), nama: '', harga: 0, volume: 0, feePersen: 0, feeRp: 0, bahan: [{ id: KPB.uid(), nama: '', harga: 0, isi: 1, pakai: 1, satuan: '', satuanPakai: '' }], lain: [] }; s.produk.push(p); App.ui.terbuka[p.id] = true; strukturBerubah('prd-' + p.id + '-n'); }),
        h('span', { class: 'small' }, 'Biaya tetap seperti gaji dan sewa diisi di langkah 3, bukan di sini.'))),
  ];
}
