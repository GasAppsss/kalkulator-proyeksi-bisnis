/* ===== steps-a: keluaran dinamis, langkah 1 (modal awal) dan langkah 3 (biaya tetap) ===== */
App.outs = [];
function out(fn, cls) {
  const el = h('span', { class: cls || '' });
  App.outs.push({ el, fn });
  el.textContent = fn();
  return el;
}
/* isi slot boleh berupa simpul, teks, atau larik bersarang yang memuat null; semuanya dirapikan di sini */
const isiSlot = (v) => [].concat(v).flat(Infinity).filter((x) => x != null && x !== false);
function slot(fn, cls) {
  const el = h('div', { class: cls || '' });
  App.outs.push({ el, fn, node: true });
  el.replaceChildren(...isiSlot(fn()));
  return el;
}
function runOuts() {
  App.outs.forEach((o) => {
    if (o.node) o.el.replaceChildren(...isiSlot(o.fn()));
    else { const t = o.fn(); if (o.el.textContent !== t) o.el.textContent = t; }
  });
}
const par = (...k) => h('p', null, k);
const eq = (t) => h('code', { class: 'eq' }, t);
const tambahBtn = (teks, fn) => h('button', { type: 'button', class: 'btn sm', onclick: fn }, teks);
/* angka besar dengan satuan kecil di belakangnya ("1.250 unit", "37% / tahun"): satuannya diperkecil agar angkanya yang menonjol */
const pisahSatuan = (t) => {
  if (typeof t !== 'string' || !/\d/.test(t)) return t;
  const kecil = (x) => h('span', { class: 'sat' }, x);
  const aw = /^(Bulan ke-)(\d+)$/.exec(t);
  if (aw) return [kecil(aw[1]), aw[2]];
  const bagian = t.split(/(\s(?:unit|bulan|hari|tahun|omzet)|\s\/\s\w+)/);
  return bagian.length < 3 ? t : bagian.map((b, i) => (i % 2 ? kecil(b) : b));
};
const tile = (l, n, s, cls) => h('div', { class: 'tile ' + (cls || '') }, h('div', { class: 'l' }, l), h('div', { class: 'n' }, pisahSatuan(n)), s ? h('div', { class: 's' }, s) : null);

/* ---------- Langkah 1: modal awal ---------- */
const COLS_INV = 'minmax(0,2.2fr) minmax(0,1.4fr) minmax(0,1fr) minmax(0,1.2fr) 34px';

function barisInvestasi(i) {
  const k = 'inv-' + i.id;
  return h('div', { class: 'row', style: '--cols:' + COLS_INV },
    sel('Nama investasi', inText(i, 'nama', k + '-n', { ph: 'Contoh: Mesin espresso', label: 'Nama investasi' }), { cls: 'wide' }),
    sel('Nilai', inRp(i, 'nilai', k + '-v', 'Nilai investasi'), { pre: 'Rp' }),
    sel('Umur manfaat', inNum(i, 'umur', k + '-u', { dec: 1, min: 0, max: 50, label: 'Umur manfaat dalam tahun' }), { suf: 'tahun' }),
    h('div', { class: 'c out' }, h('span', { class: 'cl' }, 'Penyusutan per bulan'),
      out(() => (KPB.umurBulan(i) > 0 ? fRp(i.nilai / KPB.umurBulan(i)) : 'tidak disusutkan'))),
    hapusBtn(() => denganUrungkan('Investasi dihapus', () => { App.s.investasi.splice(App.s.investasi.indexOf(i), 1); strukturBerubah(); })));
}

function kebutuhanKas() {
  const m = App.A.m, a = App.s.asumsi, mk = App.s.modalKerja;
  const saran = Math.ceil((m.kasButuh * 1.25) / 1e6) * 1e6;
  const adaWc = a.stokHari + a.piutangHari + a.hutangHari > 0;
  if (m.kasButuh <= 0) return [h('p', { class: 'small' }, adaWc ? 'Menurut proyeksi, kas tidak pernah minus. Modal kerja tetap berguna sebagai cadangan bila penjualan meleset.' : 'Menurut proyeksi, usaha tidak mengalami kas minus. Modal kerja tetap dibutuhkan untuk stok awal; isi lama stok di langkah 4 agar ikut dihitung.')];
  return [
    h('p', { class: 'small' }, 'Kas terendah terjadi di bulan ke-' + m.kasTerendahBulan + ': butuh sekitar ', h('b', null, fRp(m.kasButuh)), adaWc ? ' untuk menutup kekurangan operasional, termasuk uang yang tertahan di stok dan piutang. ' : ' untuk menutup kekurangan operasional (belum termasuk stok awal; isi lama stok di langkah 4 bila perlu). ',
      m.kasButuh > mk ? h('b', { class: 'note-bad' }, 'Modal kerja Anda saat ini kurang.') : 'Modal kerja Anda sudah cukup.'),
    saran !== mk ? tambahBtn('Pakai saran ' + fRp(saran) + ' (cadangan 25%)', () => { App.s.modalKerja = saran; strukturBerubah(); }) : null,
  ];
}

function buildStep1() {
  const s = App.s;
  const bulan = KPB.BLN.map((b, i) => [i, b]);
  const tahun = [];
  for (let y = 2026; y <= 2033; y++) tahun.push([y, y]);
  if (!tahun.some(([y]) => y === s.mulaiTahun)) tahun.push([s.mulaiTahun, s.mulaiTahun]);
  return [
    seksi('Usaha dan periode proyeksi',
      cara(par('Mulai dari yang paling dasar: usaha apa, kapan buka, dan berapa lama Anda ingin melihat proyeksinya. Makin panjang periodenya, makin jelas kapan modal kembali, tetapi angkanya makin bergantung pada asumsi.')),
      h('div', { class: 'grid2' },
        fld('Nama usaha', inText(s, 'nama', 'f-nama', { ph: 'Contoh: Kedai Kopi Senja' })),
        h('div', { class: 'fld' }, h('label', { for: 'f-bulan' }, 'Mulai beroperasi'),
          h('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:8px' },
            kotak(inSelect(s, 'mulaiBulan', bulan, 'f-bulan', { angka: true })),
            kotak(inSelect(s, 'mulaiTahun', tahun, 'f-tahun', { angka: true, label: 'Tahun mulai' })))),
        fld('Lama proyeksi', inSelect(s, 'periode', [[12, '12 bulan (1 tahun)'], [24, '24 bulan (2 tahun)'], [36, '36 bulan (3 tahun)'], [48, '48 bulan (4 tahun)'], [60, '60 bulan (5 tahun)']], 'f-periode', { angka: true })))),
    seksi('Investasi awal',
      h('p', { class: 'lede' }, 'Barang dan biaya sekali bayar yang dipakai lama: renovasi, mesin, peralatan, perizinan. Nilainya dibagi rata selama umur manfaatnya (penyusutan), jadi tidak dianggap habis di bulan pertama. Isi umur 0 bila tidak perlu disusutkan.'),
      h('div', { class: 'rows' },
        thead(['Nama investasi', 'Nilai', 'Umur manfaat', 'Penyusutan per bulan', ''], COLS_INV, [3]),
        s.investasi.map(barisInvestasi)),
      h('div', { class: 'rowfoot' },
        tambahBtn('+ Tambah investasi', () => { const r = { id: KPB.uid(), nama: '', nilai: 0, umur: 5 }; s.investasi.push(r); strukturBerubah('inv-' + r.id + '-n'); }),
        h('div', { class: 'total' }, 'Total investasi: ', h('b', null, out(() => fRp(KPB.sum(s.investasi.map((i) => i.nilai)))))))),
    seksi('Modal kerja',
      h('p', { class: 'lede' }, 'Uang tunai cadangan untuk stok awal dan menutup biaya selama penjualan belum cukup. Bila terlalu kecil, kas bisa habis sebelum usaha mulai untung.'),
      h('div', { class: 'grid2' },
        fld('Modal kerja', inRp(s, 'modalKerja', 'f-mk'), { pre: 'Rp' }),
        h('div', { class: 'fld' }, h('span', { class: 'cl', style: 'font:600 12px var(--font);color:var(--ink-2)' }, 'Perkiraan kebutuhan menurut proyeksi'), slot(kebutuhanKas))),
      h('div', { class: 'nota' },
        h('div', { class: 'nr' }, h('span', { class: 'k' }, 'Investasi awal'), h('span', { class: 'lead' }), h('span', { class: 'v' }, out(() => fRp(KPB.sum(s.investasi.map((i) => i.nilai)))))),
        h('div', { class: 'nr' }, h('span', { class: 'k' }, 'Modal kerja'), h('span', { class: 'lead' }), h('span', { class: 'v' }, out(() => fRp(s.modalKerja)))),
        h('hr', { class: 'dbl' }),
        h('div', { class: 'nr tot' }, h('span', { class: 'k' }, 'Total modal awal'), h('span', { class: 'lead' }), h('span', { class: 'v' }, out(() => fRp(KPB.modalAwal(s))))))),
  ];
}

/* ---------- Langkah 3: biaya tetap ---------- */
const COLS_TTP = 'minmax(0,2.4fr) minmax(0,1.5fr) minmax(0,1fr) 34px';
const SARAN_TETAP = ['Gaji karyawan', 'Sewa tempat', 'Listrik, air, internet', 'Pemasaran dan iklan', 'Gaji pemilik', 'Perawatan dan kebersihan', 'Cicilan atau bunga', 'Izin dan asuransi', 'Langganan aplikasi'];

function barisTetap(t) {
  const k = 'ttp-' + t.id;
  const total = () => KPB.biayaTetapBulan(App.s);
  return h('div', { class: 'row', style: '--cols:' + COLS_TTP },
    sel('Nama biaya', inText(t, 'nama', k + '-n', { ph: 'Contoh: Sewa tempat', label: 'Nama biaya' }), { cls: 'wide' }),
    sel('Per bulan', inRp(t, 'nilai', k + '-v', 'Biaya per bulan'), { pre: 'Rp' }),
    h('div', { class: 'c' }, h('span', { class: 'cl' }, 'Porsi dari total'),
      slot(() => { const r = total() > 0 ? t.nilai / total() : 0; return [h('span', { class: 'total' }, fPct(r, 0)), h('div', { class: 'bar' }, h('i', { style: 'width:' + Math.round(r * 100) + '%' }))]; })),
    hapusBtn(() => denganUrungkan('Biaya tetap dihapus', () => { App.s.biayaTetap.splice(App.s.biayaTetap.indexOf(t), 1); strukturBerubah(); })));
}

/* biaya yang naik turun mengikuti omzet: iklan berbayar, retur, diskon, komisi sales */
const COLS_OMZ = 'minmax(0,2.4fr) minmax(0,1.2fr) minmax(0,1.4fr) 34px';
const SARAN_OMZET = ['Iklan berbayar', 'Retur dan komplain', 'Diskon dan promo', 'Komisi sales'];
function barisOmzet(x) {
  const k = 'omz-' + x.id;
  return h('div', { class: 'row', style: '--cols:' + COLS_OMZ },
    sel('Nama biaya', inText(x, 'nama', k + '-n', { ph: 'Contoh: Iklan berbayar', label: 'Nama biaya yang ikut omzet' }), { cls: 'wide' }),
    sel('Persen dari omzet', inNum(x, 'persen', k + '-p', { dec: 2, min: 0, max: 100, label: 'Persen dari omzet' }), { suf: '%' }),
    h('div', { class: 'c out' }, h('span', { class: 'cl' }, 'Perkiraan per bulan (di target)'), out(() => fRp((App.A.bep.targetRp * x.persen) / 100))),
    hapusBtn(() => denganUrungkan('Biaya dihapus', () => { App.s.biayaOmzet.splice(App.s.biayaOmzet.indexOf(x), 1); strukturBerubah(); })));
}

function buildStep3() {
  const s = App.s;
  const tambah = (nama) => { const r = { id: KPB.uid(), nama: nama || '', nilai: 0 }; s.biayaTetap.push(r); strukturBerubah('ttp-' + r.id + (nama ? '-v' : '-n')); };
  const belum = SARAN_TETAP.filter((n) => !s.biayaTetap.some((t) => t.nama.toLowerCase() === n.toLowerCase()));
  const tambahOmz = (nama) => { const r = { id: KPB.uid(), nama: nama || '', persen: 0 }; s.biayaOmzet.push(r); strukturBerubah('omz-' + r.id + (nama ? '-p' : '-n')); };
  const sisaOmz = SARAN_OMZET.filter((n) => !s.biayaOmzet.some((t) => t.nama.toLowerCase() === n.toLowerCase()));
  return [
    seksi('Biaya tetap per bulan',
      cara(par('Biaya tetap adalah biaya yang tetap harus dibayar tiap bulan, laku atau tidak laku: gaji, sewa, listrik, iklan dengan anggaran tetap. Berbeda dengan HPP yang naik turun mengikuti jumlah produk terjual.'),
        eq('BEP = biaya tetap ÷ margin kontribusi per unit')),
      h('div', { class: 'rows' },
        thead(['Nama biaya', 'Per bulan', 'Porsi dari total', ''], COLS_TTP),
        s.biayaTetap.map(barisTetap)),
      h('div', { class: 'rowfoot' },
        h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;align-items:center' },
          tambahBtn('+ Tambah biaya', () => tambah('')),
          belum.length ? h('span', { class: 'small' }, 'Tambah cepat:') : null,
          belum.slice(0, 6).map((n) => h('button', { type: 'button', class: 'btn sm lnk', onclick: () => tambah(n) }, n))),
        h('div', { class: 'total' }, 'Total: ', h('b', null, out(() => fRp(KPB.biayaTetapBulan(s)))), ' per bulan')),
      h('p', { class: 'hint' }, 'Jangan lupa gaji Anda sendiri bila ikut bekerja penuh di usaha ini. Jika tidak dihitung, laba terlihat lebih besar dari kenyataan.')),
    seksi('Biaya yang ikut omzet (opsional)',
      h('p', { class: 'lede' }, 'Biaya yang naik turun mengikuti penjualan, bukan jumlah unit: iklan berbayar, retur dan komplain, diskon, komisi sales. Isi sebagai persen dari omzet; berlaku untuk semua produk dan ikut mengurangi margin tiap produk. Komisi marketplace per produk tetap diisi di langkah 2.'),
      s.biayaOmzet.length ? h('div', { class: 'rows' }, thead(['Nama biaya', '% dari omzet', 'Perkiraan per bulan', ''], COLS_OMZ, [2]), s.biayaOmzet.map(barisOmzet)) : null,
      h('div', { class: 'rowfoot' },
        h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;align-items:center' },
          tambahBtn('+ Tambah biaya ikut omzet', () => tambahOmz('')),
          sisaOmz.length ? h('span', { class: 'small' }, 'Tambah cepat:') : null,
          sisaOmz.map((n) => h('button', { type: 'button', class: 'btn sm lnk', onclick: () => tambahOmz(n) }, n))),
        s.biayaOmzet.length ? h('div', { class: 'total' }, 'Total: ', h('b', null, out(() => fDec(KPB.persenOmzet(s), 2) + '%')), ' dari omzet') : null)),
    seksi('Total biaya tetap yang harus ditutup',
      slot(() => {
        const b = App.A.bep, eks = KPB.persenOmzet(s);
        return h('div', { class: 'tiles' },
          tile('Biaya tetap per bulan', fRp(b.tetap), 'Gaji, sewa, listrik, dan sejenisnya'),
          tile('Penyusutan per bulan', fRp(b.dep), 'Dari investasi awal di langkah 1'),
          eks > 0 ? tile('Biaya ikut omzet', fDec(eks, 1) + '% omzet', 'Sudah dikurangkan dari margin tiap produk') : null,
          tile('Total yang harus ditutup', fRp(b.fc), 'Sekitar ' + fRp(b.fc / 30) + ' per hari', 'hero'));
      })),
  ];
}
