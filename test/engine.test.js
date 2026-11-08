/* Uji mesin hitung: dibandingkan dengan hitungan tangan dan dengan simulasi pembanding yang ditulis terpisah dari mesin */
const fs = require('fs'), path = require('path');
const src = ['engine-a.js', 'engine-b.js', 'sample.js', 'templates.js'].map((f) => fs.readFileSync(path.join(__dirname, '../src', f), 'utf8')).join('\n');
const KPB = new Function(src + '\nreturn KPB;')();
let lulus = 0, gagal = 0;
function cek(kondisi, pesan) { if (kondisi) lulus++; else { gagal++; console.log('GAGAL:', pesan); } }
function dekat(a, b, pesan, tol = 1e-9) {
  const d = Math.abs(a - b), batas = tol * Math.max(1, Math.abs(b));
  if (d <= batas) lulus++; else { gagal++; console.log('GAGAL:', pesan, '| didapat', a, '| seharusnya', b); }
}
const salinan = (x) => JSON.parse(JSON.stringify(x));

/* ---------- 1. HPP, margin, BEP pada data contoh (hitungan tangan) ---------- */
const S = KPB.contohState();
const hpp1 = 180000 / 1000 * 18 + 18500 / 1000 * 120 + 42000 / 1000 * 25 + 15000 / 10 * 0.2 + 1500 + 350;
const hpp2 = 180000 / 1000 * 18 + 20000 / 19000 * 200 + 15000 / 10 * 0.2 + 1500 + 350;
const hpp3 = 20000 / 8 * 2 + 56000 / 1000 * 30 + 90000 / 1000 * 20 + 75000 / 1000 * 10 + 900 + 300;
dekat(hpp1, 8660, 'hpp1 tangan');
dekat(KPB.unit(S.produk[0]).hpp, hpp1, 'HPP kopi susu');
dekat(KPB.unit(S.produk[1]).hpp, hpp2, 'HPP americano');
dekat(KPB.unit(S.produk[2]).hpp, hpp3, 'HPP roti bakar');
const cm = [22000 - hpp1 - 660, 18000 - hpp2 - 540, 22000 - hpp3 - 660];
cm.forEach((c, i) => dekat(KPB.unit(S.produk[i]).kontribusi, c, 'kontribusi produk ' + (i + 1)));
dekat(KPB.unit(S.produk[0]).margKotorPct, (22000 - hpp1) / 22000, 'margin kotor % produk 1');

const v = S.produk.map((p) => p.volume), vt = v[0] + v[1] + v[2], harga = [22000, 18000, 22000];
const avgCm = (v[0] * cm[0] + v[1] * cm[1] + v[2] * cm[2]) / vt;
const avgPrice = (v[0] * harga[0] + v[1] * harga[1] + v[2] * harga[2]) / vt;
const dep1 = 45e6 / 60 + 38e6 / 60 + 12e6 / 36 + 18e6 / 48 + 7e6 / 24;
const fc = 21.5e6 + dep1;
const B = KPB.bep(S);
dekat(B.avgCm, avgCm, 'rata-rata margin kontribusi');
dekat(B.avgPrice, avgPrice, 'harga rata-rata');
dekat(B.fc, fc, 'biaya tetap + penyusutan');
dekat(B.bepUnit, fc / avgCm, 'BEP unit');
dekat(B.bepRp, (fc / avgCm) * avgPrice, 'BEP rupiah');
dekat(B.rasio, fc / avgCm / vt, 'BEP / target');
dekat(B.produk.reduce((t, p) => t + p.bepUnit, 0), B.bepUnit, 'jumlah BEP per produk = BEP total');

/* ---------- 2. bulan pertama proyeksi (contoh memakai stok 7 hari) ---------- */
const rows = KPB.proyeksi(S);
const rev1 = v[0] * 0.5 * 22000 + v[1] * 0.5 * 18000 + v[2] * 0.5 * 22000;
const cogs1 = v[0] * 0.5 * hpp1 + v[1] * 0.5 * hpp2 + v[2] * 0.5 * hpp3;
const jual1 = rev1 * 0.03;
const ebit1 = rev1 - cogs1 - jual1 - 21.5e6 - dep1;
const nwc1 = (7 / 30) * cogs1;
dekat(rows[0].rev, rev1, 'omzet bulan 1');
dekat(rows[0].cogs, cogs1, 'HPP total bulan 1');
dekat(rows[0].ebit, ebit1, 'laba operasional bulan 1');
dekat(rows[0].net, ebit1, 'laba bersih bulan 1 (belum kena pajak)');
dekat(rows[0].nwc, nwc1, 'stok 7 hari menahan uang sebesar 7/30 HPP bulan 1');
dekat(rows[0].cf, ebit1 + dep1 - nwc1, 'arus kas bulan 1 = laba + penyusutan - tambahan modal kerja');
dekat(rows[0].cum, -(45e6 + 38e6 + 12e6 + 18e6 + 7e6 + 30e6) + ebit1 + dep1 - nwc1, 'kumulatif bulan 1');
cek(rows.length === 36, 'jumlah baris = periode');
cek(rows[12].rev > rows[11].rev, 'harga naik di tahun ke-2 menaikkan omzet');

/* ---------- 3. di titik BEP, laba operasional = 0 ---------- */
const polos = KPB.normalisasi(salinan(S));
Object.assign(polos.asumsi, { rampAwal: 100, rampBulan: 1, tumbuh: 0, naikHarga: 0, naikBiaya: 0, naikTetap: 0, pajakOmzet: 0, pajakLaba: 0 });
polos.periode = 12;
const bp = KPB.bep(polos);
const di = KPB.proyeksi(polos, { volume: bp.bepUnit / bp.targetUnit });
dekat(di[0].ebit, 0, 'laba operasional di titik BEP = 0', 1e-7);
cek(KPB.proyeksi(polos, { volume: 0.9 * bp.bepUnit / bp.targetUnit })[0].ebit < 0, 'di bawah BEP rugi');
cek(KPB.proyeksi(polos, { volume: 1.1 * bp.bepUnit / bp.targetUnit })[0].ebit > 0, 'di atas BEP untung');
dekat(bp.unitUntukLaba(5e6), (bp.fc + 5e6) / bp.avgCm, 'unit untuk target laba');

/* ---------- 4. balik modal: kasus sederhana ---------- */
function sederhana(extra) {
  return KPB.normalisasi(Object.assign({
    nama: 'Uji', periode: 36, modalKerja: 0,
    investasi: [{ nama: 'Alat', nilai: 30e6, umur: 0 }],
    biayaTetap: [{ nama: 'Tetap', nilai: 4e6 }],
    produk: [{ nama: 'A', harga: 10000, volume: 1000, feePersen: 0, feeRp: 0, bahan: [{ nama: 'b', harga: 4000, isi: 1, pakai: 1 }], lain: [] }],
    asumsi: { pajakPreset: 'tanpa' },
  }, extra));
}
const sd = sederhana();
const rs = KPB.proyeksi(sd);
dekat(rs[0].net, 2e6, 'laba bulanan sederhana = 2 juta');
const ms = KPB.metrik(sd, rs);
cek(ms.payback && ms.payback.bulan === 15, 'balik modal bulan ke-15, didapat ' + (ms.payback && ms.payback.bulan));
dekat(ms.payback.tepat, 15, 'balik modal tepat 15,0 bulan');
dekat(ms.roi, (2e6 * 36) / 30e6, 'ROI = total laba / modal');
cek(ms.untungBulan === 1, 'untung sejak bulan 1');
dekat(ms.kasButuh, 0, 'tidak ada kas minus');

/* usaha yang tidak pernah balik modal */
const rugi = sederhana({ biayaTetap: [{ nama: 'Tetap', nilai: 7e6 }] });
cek(KPB.metrik(rugi, KPB.proyeksi(rugi)).payback === null, 'rugi terus: tidak balik modal');
dekat(KPB.metrik(rugi, KPB.proyeksi(rugi)).kasButuh, 36e6 * 1, 'kas dibutuhkan untuk menutup rugi 1 juta x 36', 1e-9);

/* ---------- 5. NPV dan IRR terhadap hitungan tertutup ---------- */
const rm = KPB.npvDari ? Math.pow(1.12, 1 / 12) - 1 : 0;
const arus = Array(11).fill(0).concat([1120]);
dekat(KPB.npvDari(rm, 1000, arus, 0), 0, 'NPV: 1120 setelah 12 bulan pada diskon 12%/tahun = 1000', 1e-9);
const arus2 = Array(23).fill(0).concat([1210]);
dekat(KPB.irrDari(1000, arus2, 0), 0.1, 'IRR: 1000 menjadi 1210 dalam 2 tahun = 10%/tahun', 1e-9);
const campur = [30, 40, 50, 60, 70, 20];
const irr = KPB.irrDari(100, campur, 0);
const rIrr = Math.pow(1 + irr, 1 / 12) - 1;
dekat(KPB.npvDari(rIrr, 100, campur, 0), 0, 'NPV pada tingkat IRR = 0', 1e-7);
cek(KPB.irrDari(100, [-5, -5, -5], 0) === null, 'IRR tidak ada bila arus selalu negatif');

/* ---------- 6. pajak final dengan batas bebas ---------- */
const pj = sederhana({
  periode: 24,
  produk: [{ nama: 'A', harga: 10000, volume: 10000, feePersen: 0, feeRp: 0, bahan: [{ nama: 'b', harga: 1, isi: 1, pakai: 1 }], lain: [] }],
  asumsi: { pajakPreset: 'op-final', pajakOmzet: 0.5, pajakBebas: 500e6 },
});
const rp = KPB.proyeksi(pj);
const sumTh = (r) => r.reduce((t, x) => t + x.pajakOmzet, 0);
dekat(rp[4].pajakOmzet, 0, 'bulan ke-5 (omzet kumulatif 500 jt) belum kena pajak');
dekat(rp[5].pajakOmzet, 0.5e6, 'bulan ke-6 kena 0,5% x 100 jt');
dekat(sumTh(rp.slice(0, 12)), 3.5e6, 'pajak tahun 1 = (1,2 M - 500 jt) x 0,5%');
dekat(sumTh(rp.slice(12, 24)), 3.5e6, 'batas bebas diulang di tahun 2');

/* preset koperasi: 0,5% dari omzet sejak rupiah pertama (tanpa bebas Rp500 juta yang hanya untuk orang pribadi), batas omzet Rp4,8 miliar */
const preKop = KPB.PAJAK.koperasi;
cek(!!preKop && preKop.pajakOmzet === 0.5 && preKop.pajakBebas === 0 && preKop.pajakLaba === 0 && preKop.batasOmzetFinal === 4.8e9, 'preset koperasi: 0,5% omzet, tanpa bebas, batas 4,8 miliar');
cek(/empat tahun/.test(preKop.nama), 'nama preset koperasi menyebut batas empat tahun pajak');
const kop = sederhana({
  periode: 24,
  produk: [{ nama: 'A', harga: 10000, volume: 10000, feePersen: 0, feeRp: 0, bahan: [{ nama: 'b', harga: 1, isi: 1, pakai: 1 }], lain: [] }],
  asumsi: Object.assign({ pajakPreset: 'koperasi' }, preKop, { nama: undefined }),
});
cek(kop.asumsi.pajakPreset === 'koperasi' && kop.asumsi.pajakOmzet === 0.5 && kop.asumsi.pajakBebas === 0, 'preset koperasi lolos normalisasi dan tersimpan', kop.asumsi);
const rkop = KPB.proyeksi(kop);
dekat(rkop[0].pajakOmzet, 0.5e6, 'koperasi: bulan pertama sudah kena 0,5% x 100 jt');
dekat(sumTh(rkop.slice(0, 12)), 6e6, 'koperasi: pajak tahun 1 = 0,5% x 1,2 M (tanpa batas bebas)');
cek(KPB.analisis(kop).sehat.some((x) => x.id === 'pajak' && x.level === 'good'), 'koperasi: omzet 1,2 M/tahun di bawah batas 4,8 M: aman');
const kopB = salinan(kop); kopB.produk[0].volume = 100000;
cek(KPB.analisis(KPB.normalisasi(kopB)).sehat.some((x) => x.id === 'pajak' && x.level === 'warn'), 'koperasi: omzet 12 M/tahun melewati batas 4,8 M memicu peringatan');
cek(Object.keys(KPB.PAJAK).join() === 'op-final,pt-perorangan,koperasi,badan-31e,badan,tanpa,manual', 'urutan pilihan pajak: PPh final dulu, lalu badan, tanpa pajak, atur sendiri: ' + Object.keys(KPB.PAJAK).join());

/* ---------- 7. pajak laba dengan kompensasi rugi ---------- */
const kl = KPB.normalisasi({
  nama: 'Uji', periode: 12, modalKerja: 0, investasi: [], biayaTetap: [{ nama: 't', nilai: 60e6 }],
  produk: [{ nama: 'A', harga: 1000, volume: 100000, feePersen: 0, feeRp: 0, bahan: [], lain: [] }],
  asumsi: { pajakPreset: 'badan', pajakLaba: 22, rampAwal: 0, rampBulan: 4 },
});
const rk = KPB.proyeksi(kl);
dekat(rk[0].ebit, -60e6, 'bulan 1 rugi 60 jt');
dekat(rk[2].ebit, 100e6 * (2 / 3) - 60e6, 'bulan 3 laba kecil');
dekat(rk[4].pajakLaba, 0, 'bulan 5 masih habis untuk menutup rugi lama');
dekat(rk[5].pajakLaba, 40e6 * 0.22, 'bulan 6 kena 22% atas laba 40 jt');

/* preset PT/CV dengan fasilitas Pasal 31E: 22% x 50% = 11% atas laba */
const t31 = KPB.normalisasi({
  nama: 'Uji', periode: 12, modalKerja: 0, investasi: [], biayaTetap: [{ nama: 't', nilai: 50e6 }],
  produk: [{ nama: 'A', harga: 1000, volume: 100000, feePersen: 0, feeRp: 0, bahan: [], lain: [] }],
  asumsi: Object.assign({ pajakPreset: 'badan-31e' }, KPB.PAJAK['badan-31e'], { nama: undefined }),
});
cek(t31.asumsi.pajakPreset === 'badan-31e' && t31.asumsi.pajakLaba === 11 && t31.asumsi.batasOmzetFinal === 4.8e9, 'preset 31E tersimpan');
dekat(KPB.proyeksi(t31)[0].pajakLaba, 50e6 * 0.11, 'pajak 31E = 11% x laba 50 jt');
const a31 = KPB.analisis(t31);
cek(a31.sehat.some((x) => x.id === 'pajak' && x.level === 'good'), 'omzet 1,2 M/tahun di bawah batas 4,8 M: aman');
const t31b = salinan(t31); t31b.produk[0].volume = 1e6;
cek(KPB.analisis(KPB.normalisasi(t31b)).sehat.some((x) => x.id === 'pajak' && x.level === 'warn'), 'omzet di atas 4,8 M memicu peringatan 31E');
cek(!KPB.analisis(KPB.normalisasi(Object.assign(salinan(t31), { asumsi: Object.assign(salinan(t31.asumsi), { pajakPreset: 'badan', pajakLaba: 22, batasOmzetFinal: 0 }) }))).sehat.some((x) => x.id === 'pajak'), 'preset tarif umum tidak punya pemeriksaan batas omzet');

/* ---------- 8. skenario, sensitivitas, kesehatan, normalisasi ---------- */
const sen = KPB.sensitivitas(S);
cek(sen.out.length === 4, 'empat faktor sensitivitas');
cek(sen.out.every((o) => o.lo.delta * o.hi.delta <= 0), 'efek naik dan turun berlawanan arah');
const volRow = sen.out.find((o) => o.k === 'volume');
cek(volRow.hi.delta > 0 && volRow.lo.delta < 0, 'volume naik menaikkan laba');
const hppRow = sen.out.find((o) => o.k === 'hpp');
cek(hppRow.hi.delta < 0, 'HPP naik menurunkan laba');
const [pes, das, opt] = KPB.SKENARIO.map((k) => KPB.ringkas(S, k.mult).m.totalNet);
cek(pes < das && das < opt, 'urutan skenario pesimis < dasar < optimis');
const A = KPB.analisis(S);
const lv = Object.fromEntries(A.sehat.map((x) => [x.id, x.level]));
cek(lv.margin === 'good', 'margin kotor contoh sehat, ' + lv.margin);
cek(lv.bep === 'warn', 'BEP contoh ~80% dari target = cukup, ' + lv.bep);
cek(lv.produk === 'good', 'tidak ada produk rugi');
const kos = KPB.analisis(KPB.kosongState());
cek(kos.bep.bepUnit === null && kos.m.payback !== undefined, 'data kosong tidak error');
cek(Number.isFinite(kos.m.totalNet), 'data kosong menghasilkan angka terhingga');
const sampah = KPB.normalisasi({ produk: [{ harga: 'abc', bahan: 7 }], investasi: 'x', periode: 99 });
cek(sampah.periode === 36 && sampah.produk[0].harga === 0 && Array.isArray(sampah.produk[0].bahan), 'normalisasi memperbaiki data rusak');
const salin = KPB.normalisasi(salinan(S));
cek(JSON.stringify(salin) === JSON.stringify(S), 'normalisasi tidak mengubah data yang sudah benar');
const hs = KPB.hargaSaran(S.produk[0], 60);
dekat((hs - 8660 - hs * 0.03) / hs, 0.6, 'harga saran menghasilkan margin kontribusi 60%');

/* ---------- 9. konversi satuan ---------- */
const bhn = (harga, isi, satuan, pakai, satuanPakai) => ({ harga, isi, satuan, pakai, satuanPakai });
dekat(KPB.biayaBahan(bhn(180000, 1, 'kg', 18, 'gram')), 3240, 'kg dibeli, gram dipakai');
dekat(KPB.biayaBahan(bhn(38000, 5, 'liter', 30, 'ml')), 228, 'liter dibeli, ml dipakai');
dekat(KPB.biayaBahan(bhn(60000, 1, 'lusin', 3, 'pcs')), 15000, 'lusin dibeli, pcs dipakai');
dekat(KPB.biayaBahan(bhn(100, 1, 'meter', 150, 'cm')), 150, 'meter dibeli, cm dipakai');
dekat(KPB.biayaBahan(bhn(100, 1, 'gram', 2, 'kg')), 200000, 'satuan pakai lebih besar dari satuan beli');
dekat(KPB.biayaBahan(bhn(60000, 1, 'kg', 3, 'ml')), 180000, 'beda kelompok: tidak dikonversi');
dekat(KPB.biayaBahan(bhn(100, 1, 'gram', 2, '')), 200, 'satuan pakai kosong = sama dengan satuan beli');
dekat(KPB.biayaBahan(bhn(100, 1, 'gram', 2, undefined)), 200, 'data lama tanpa satuan pakai tetap benar');
dekat(KPB.biayaBahan(bhn(100, 1, 'constructor', 2, 'toString')), 200, 'nama satuan aneh tidak merusak');
dekat(KPB.biayaBahan(bhn(100, 1, '__proto__', 2, 'gram')), 200, '__proto__ sebagai satuan aman');
dekat(KPB.biayaBahan(bhn(100, 0, 'kg', 2, 'gram')), 0, 'isi 0 tidak menghasilkan Infinity');
cek(KPB.satuanSerupa('kg').join() === 'gram,kg' && KPB.satuanSerupa('porsi').length === 0, 'daftar satuan serupa');
cek(KPB.satuanSerupa('constructor').length === 0, 'satuan serupa untuk nama aneh kosong');

/* ---------- 10. biaya yang ikut omzet (iklan, retur) ---------- */
const eks = KPB.normalisasi({
  nama: 'Uji', periode: 12, modalKerja: 0, investasi: [], biayaTetap: [{ nama: 't', nilai: 8.2e6 }],
  biayaOmzet: [{ nama: 'Iklan', persen: 10 }, { nama: 'Retur', persen: 3 }],
  produk: [{ nama: 'A', harga: 100000, volume: 500, feePersen: 5, feeRp: 1000, bahan: [], lain: [{ nama: 'HPP', jenis: 'lain', biaya: 40000 }] }],
  asumsi: { pajakPreset: 'tanpa' },
});
dekat(KPB.persenOmzet(eks), 13, 'total persen biaya ikut omzet');
const ue = KPB.unit(eks.produk[0], 13);
dekat(ue.feeSendiri, 6000, 'biaya penjualan sendiri = 5% + Rp1.000');
dekat(ue.feeOmzet, 13000, 'biaya ikut omzet = 13% x harga');
dekat(ue.kontribusi, 41000, 'kontribusi = 100.000 - 40.000 - 19.000');
const be = KPB.bep(eks);
dekat(be.bepUnit, 8.2e6 / 41000, 'BEP memakai biaya ikut omzet');
const re = KPB.proyeksi(eks)[0];
dekat(re.jual, 500 * 19000, 'biaya penjualan bulan 1 = 500 x 19.000');
dekat(re.ebit, 500 * 41000 - 8.2e6, 'laba operasional bulan 1');
const hse = KPB.hargaSaran(eks.produk[0], 50, 13);
dekat((hse * (1 - 0.18) - 41000) / hse, 0.5, 'harga saran memperhitungkan biaya ikut omzet');
cek(KPB.hargaSaran(eks.produk[0], 90, 13) === null, 'target margin mustahil menghasilkan null');
const AE = KPB.analisis(eks);
dekat(AE.unitP[0].kontribusi, 41000, 'analisis memakai biaya ikut omzet');

/* ---------- 11. pola musiman ---------- */
const mus = sederhana({
  periode: 12, mulaiBulan: 10,
  asumsi: { pajakPreset: 'tanpa', musimanAktif: true, musiman: [90, 80, 70, 100, 110, 120, 100, 100, 100, 100, 150, 200] },
});
const rmu = KPB.proyeksi(mus);
dekat(rmu[0].units, 1500, 'bulan pertama = November: faktor 150%');
dekat(rmu[1].units, 2000, 'bulan kedua = Desember: faktor 200%');
dekat(rmu[2].units, 900, 'bulan ketiga = Januari: faktor 90%');
dekat(rmu[11].units, 1000, 'bulan ke-12 = Oktober: faktor 100%');
const musOff = sederhana({ periode: 12, mulaiBulan: 10, asumsi: { pajakPreset: 'tanpa', musimanAktif: false, musiman: [90, 80, 70, 100, 110, 120, 100, 100, 100, 100, 150, 200] } });
dekat(KPB.proyeksi(musOff)[0].units, 1000, 'pola musiman nonaktif diabaikan');
dekat(KPB.faktorMusim({ musimanAktif: true, musiman: [50, 60] }, 11, 2), 0.5, 'faktorMusim melingkar: Desember dilanjutkan Januari');
dekat(KPB.faktorMusim({ musimanAktif: true, musiman: [50, 60] }, 11, 3), 0.6, 'faktorMusim bulan ketiga dari Desember = Februari');

/* ---------- 12. kapasitas ---------- */
const kap = sederhana({
  periode: 12,
  produk: [
    { nama: 'A', harga: 10000, volume: 1000, feePersen: 0, feeRp: 0, bahan: [{ nama: 'b', harga: 4000, isi: 1, pakai: 1 }], lain: [] },
    { nama: 'B', harga: 20000, volume: 500, feePersen: 0, feeRp: 0, bahan: [{ nama: 'b', harga: 8000, isi: 1, pakai: 1 }], lain: [] },
  ],
  asumsi: { pajakPreset: 'tanpa', kapasitas: 1200 },
});
const rkap = KPB.proyeksi(kap)[0];
dekat(rkap.units, 1200, 'unit dibatasi kapasitas');
dekat(rkap.rev, 0.8 * (1000 * 10000 + 500 * 20000), 'bauran produk tetap saat dibatasi');
cek(rkap.terbatas === true, 'bulan dibatasi kapasitas ditandai');
dekat(KPB.proyeksi(kap, { volume: 1.2 })[0].units, 1200, 'skenario optimis pun tidak melewati kapasitas');
dekat(KPB.proyeksi(kap, { volume: 0.5 })[0].units, 750, 'di bawah kapasitas tidak dibatasi');
cek(KPB.proyeksi(kap, { volume: 0.5 })[0].terbatas === false, 'tidak ditandai bila di bawah kapasitas');
const kapKecil = sederhana({ asumsi: { pajakPreset: 'tanpa', kapasitas: 300 } });
cek(KPB.bep(kapKecil).diAtasKapasitas === true, 'BEP di atas kapasitas terdeteksi');
cek(KPB.analisis(kapKecil).sehat.find((x) => x.id === 'kapasitas').level === 'crit', 'cek kesehatan kapasitas: BEP di atas kapasitas = bahaya');
cek(KPB.analisis(kap).sehat.find((x) => x.id === 'kapasitas').level === 'serious', 'cek kesehatan kapasitas: target melebihi kapasitas');
cek(!KPB.analisis(sd).sehat.some((x) => x.id === 'kapasitas'), 'tanpa kapasitas tidak ada pemeriksaan kapasitas');

/* ---------- 13. modal kerja: stok, piutang, hutang dagang ---------- */
const wc = sederhana({ periode: 12, asumsi: { pajakPreset: 'tanpa', stokHari: 30, piutangHari: 15, hutangHari: 10 } });
const rw = KPB.proyeksi(wc);
const nwcHand = 4e6 + 5e6 - (10 / 30) * 4e6;
dekat(rw[0].nwc, nwcHand, 'NWC = stok 30 hari HPP + piutang 15 hari omzet - hutang 10 hari HPP');
dekat(rw[0].dnwc, nwcHand, 'tambahan NWC bulan 1');
dekat(rw[1].dnwc, 0, 'tidak ada tambahan NWC saat usaha stabil');
dekat(rw[0].cf, 2e6 - nwcHand, 'arus kas bulan 1 menanggung modal kerja');
dekat(rw[1].cf, 2e6, 'arus kas bulan 2 normal');
const mw = KPB.metrik(wc, rw);
dekat(mw.nwcAkhir, nwcHand, 'NWC akhir tercatat di metrik');
dekat(rw[11].cum, -30e6 + 12 * 2e6 - nwcHand, 'kumulatif akhir = laba - modal kerja yang tertahan');
const rbul = Math.pow(1.12, 1 / 12) - 1;
dekat(mw.npv, KPB.npvDari(rbul, 30e6, rw.map((r) => r.cf), nwcHand), 'NPV memasukkan pengembalian modal kerja di akhir periode');
const tanpaWc = KPB.metrik(sd, KPB.proyeksi(sd));
dekat(tanpaWc.nwcAkhir, 0, 'tanpa hari stok/piutang/hutang, NWC = 0');
const hut = sederhana({ periode: 12, asumsi: { pajakPreset: 'tanpa', hutangHari: 30 } });
dekat(KPB.proyeksi(hut)[0].cf, 2e6 + 4e6, 'hutang dagang melepas kas di bulan pertama');
const kasWc = KPB.metrik(wc, rw);
cek(kasWc.kasButuh >= nwcHand - 2e6 - 1, 'kas terendah memperhitungkan modal kerja yang tertahan');

/* ---------- 14. data versi lama tetap menghasilkan angka yang sama ---------- */
const v1 = salinan(KPB.contohState());
v1.asumsi.stokHari = 0;
['biayaOmzet'].forEach((k) => delete v1[k]);
['stokHari', 'piutangHari', 'hutangHari', 'kapasitas', 'musimanAktif', 'musiman'].forEach((k) => delete v1.asumsi[k]);
v1.produk.forEach((p) => p.bahan.forEach((b) => { delete b.satuanPakai; }));
delete v1.v;
const lama = KPB.analisis(KPB.normalisasi(v1));
dekat(lama.bep.bepUnit, B.bepUnit, 'BEP data lama sama');
cek(lama.m.untungBulan === 4 && lama.m.payback.bulan === 20, 'mulai untung bulan 4, balik modal bulan 20');
dekat(lama.m.payback.tepat, 19.5, 'balik modal tepat 19,5 bulan (hasil versi sebelumnya)', 1e-2);
dekat(Math.round(lama.m.npv), 173961937, 'NPV data lama tidak berubah (hasil versi sebelumnya)', 1e-9);
dekat(Math.round(lama.m.irr * 100), 74, 'IRR data lama 74%', 1e-9);
dekat(Math.round(lama.m.kasButuh), 10434774, 'kas dibutuhkan data lama tidak berubah', 1e-9);
cek(KPB.normalisasi(v1).v === KPB.VERSI_DATA, 'normalisasi menaikkan versi data');
cek(KPB.normalisasi(v1).asumsi.musiman.length === 12 && KPB.normalisasi(v1).asumsi.musiman.every((x) => x === 100), 'musiman bawaan 12 bulan x 100%');

/* ---------- 15. hitung cepat ---------- */
const hc = KPB.hitungCepat({ harga: 25000, hpp: 11000, feePersen: 5, tetap: 6e6, modal: 40e6, volume: 700 }, new Date(2026, 9, 1));
dekat(hc.unit.kontribusi, 12750, 'cepat: margin per unit');
dekat(hc.bepUnit, 6e6 / 12750, 'cepat: BEP unit');
dekat(hc.bepRp, (6e6 / 12750) * 25000, 'cepat: BEP rupiah');
dekat(hc.mos, (700 - 6e6 / 12750) / 700, 'cepat: jarak aman');
dekat(hc.laba, 700 * 12750 - 6e6, 'cepat: laba bulanan');
cek(hc.payback && hc.payback.bulan === 14, 'cepat: balik modal bulan ke-14, didapat ' + (hc.payback && hc.payback.bulan));
cek(hc.siap === true, 'cepat: siap dihitung');
cek(hc.s.periode === 36 && hc.s.produk.length === 1 && hc.s.contoh === false, 'cepat: data lengkap terbentuk');
cek(hc.s.mulaiBulan === 9 && hc.s.mulaiTahun === 2026, 'cepat: bulan mulai dari tanggal yang diberikan');
const hk = KPB.hitungCepat(KPB.kosongCepat());
cek(hk.siap === false && hk.bepUnit === null && Number.isFinite(hk.laba), 'cepat: isian kosong tidak error');
const hn = KPB.hitungCepat({ harga: 'abc', hpp: -5, feePersen: 500, tetap: null, modal: NaN, volume: Infinity });
cek(Number.isFinite(hn.laba) && hn.s.produk[0].feePersen === 100, 'cepat: isian sampah dirapikan');
const hrugi = KPB.hitungCepat({ harga: 10000, hpp: 12000, feePersen: 0, tetap: 1e6, modal: 5e6, volume: 100 });
cek(hrugi.layak === false && hrugi.bepUnit === null && hrugi.payback === null, 'cepat: margin negatif tidak punya BEP');

/* ---------- 16. pemeriksaan input ---------- */
const idp = (st) => KPB.periksaInput(st).map((x) => x.id);
const pk = idp(KPB.kosongState());
['harga0', 'tetap0', 'volume0', 'modal0', 'pajakTanpa'].forEach((i) => cek(pk.includes(i), 'data kosong memicu ' + i));
cek(idp(S).join() === 'gajiPemilik', 'contoh hanya memicu saran gaji pemilik, didapat ' + idp(S).join());
const gjp = salinan(S); gjp.biayaTetap.push({ id: 'x', nama: 'Gaji pemilik', nilai: 3e6 });
cek(!idp(KPB.normalisasi(gjp)).includes('gajiPemilik'), 'saran gaji pemilik hilang bila sudah diisi');
const isi0 = salinan(S); isi0.produk[0].bahan[0].isi = 0;
cek(idp(KPB.normalisasi(isi0)).includes('isi0'), 'isi per pembelian 0 terdeteksi');
const hmu = salinan(S); hmu.produk[0].harga = 20;
cek(idp(KPB.normalisasi(hmu)).includes('hargaKecil'), 'harga di bawah Rp100 dicurigai');
const hpp0 = salinan(S); hpp0.produk[0].bahan = []; hpp0.produk[0].lain = [];
cek(idp(KPB.normalisasi(hpp0)).includes('hpp0'), 'HPP nol terdeteksi');
const mar = salinan(S); mar.produk[0].bahan = []; mar.produk[0].lain = [{ nama: 'x', jenis: 'lain', biaya: 100 }];
cek(idp(KPB.normalisasi(mar)).includes('margin90'), 'margin kotor di atas 90% dicurigai');
const ms2 = salinan(S); ms2.asumsi.musimanAktif = true; ms2.asumsi.musiman = Array(12).fill(130);
cek(idp(KPB.normalisasi(ms2)).includes('musimRata'), 'rata-rata faktor musiman jauh dari 100% dicurigai');
const o100 = salinan(S); o100.biayaOmzet = [{ nama: 'a', persen: 60 }, { nama: 'b', persen: 50 }];
cek(idp(KPB.normalisasi(o100)).includes('omzet100'), 'biaya ikut omzet 100% atau lebih terdeteksi');
cek(KPB.analisis(S).periksa.every((x) => x.level === 'info'), 'contoh tidak memicu peringatan serius');

/* ---------- 17. normalisasi dan ketahanan ---------- */
const acak = (() => { let x = 12345; return () => { x = (x * 1103515245 + 12345) & 0x7fffffff; return x / 0x7fffffff; }; })();
const pilih = (a) => a[Math.floor(acak() * a.length)];
const angka = () => pilih([0, 0, 1, 5, 100, 1500, 25000, 1e6, 1e9, -1, 'x', null, undefined, NaN, Infinity, 1e300, 0.001]);
const teks = () => pilih(['', 'a', 'x'.repeat(200), 'constructor', '__proto__', '<script>', null, 5]);
function sampahAcak(d = 0) {
  const o = {};
  ['nama', 'periode', 'mulaiBulan', 'mulaiTahun', 'modalKerja', 'contoh'].forEach((k) => { if (acak() < 0.8) o[k] = acak() < 0.5 ? angka() : teks(); });
  const daftar = (f) => (acak() < 0.1 ? pilih([5, 'x', null, {}]) : Array.from({ length: Math.floor(acak() * 4) }, f));
  o.investasi = daftar(() => ({ id: teks(), nama: teks(), nilai: angka(), umur: angka() }));
  o.biayaTetap = daftar(() => ({ id: teks(), nama: teks(), nilai: angka() }));
  o.biayaOmzet = daftar(() => ({ id: teks(), nama: teks(), persen: angka() }));
  o.produk = daftar(() => ({
    id: teks(), nama: teks(), harga: angka(), volume: angka(), feePersen: angka(), feeRp: angka(),
    bahan: daftar(() => ({ id: teks(), nama: teks(), harga: angka(), isi: angka(), pakai: angka(), satuan: pilih(['kg', 'gram', 'ml', 'liter', 'pcs', 'lusin', 'meter', 'cm', teks()]), satuanPakai: pilih(['kg', 'gram', 'ml', 'liter', 'pcs', 'lusin', 'meter', 'cm', teks()]) })),
    lain: daftar(() => ({ id: teks(), nama: teks(), jenis: teks(), biaya: angka() })),
  }));
  o.asumsi = {};
  ['rampAwal', 'rampBulan', 'tumbuh', 'batasTumbuh', 'naikHarga', 'naikBiaya', 'naikTetap', 'pajakOmzet', 'pajakBebas', 'pajakLaba', 'batasOmzetFinal', 'diskon', 'nilaiSisa', 'stokHari', 'piutangHari', 'hutangHari', 'kapasitas'].forEach((k) => { if (acak() < 0.7) o.asumsi[k] = angka(); });
  o.asumsi.pajakPreset = pilih(['op-final', 'badan', 'tanpa', 'manual', 'ngawur', 'constructor']);
  o.asumsi.musimanAktif = acak() < 0.5;
  o.asumsi.musiman = acak() < 0.3 ? pilih([5, 'x', null]) : Array.from({ length: Math.floor(acak() * 14) }, angka);
  return o;
}
/* semua angka di dalam objek harus terhingga (null yang sah hanya untuk payback, IRR, dan sejenisnya) */
function semuaTerhingga(x, jalur = '') {
  if (typeof x === 'number') return isFinite(x) ? null : jalur + '=' + x;
  if (x === undefined) return jalur + '=undefined';
  if (!x || typeof x !== 'object') return null;
  for (const k of Object.keys(x)) { const r = semuaTerhingga(x[k], jalur + '.' + k); if (r) return r; }
  return null;
}
let terhingga = 0, total = 0;
for (let i = 0; i < 400; i++) {
  const n0 = KPB.normalisasi(sampahAcak());
  let masalah = null;
  try {
    const an = KPB.analisis(n0);
    const sk = KPB.SKENARIO.map((k) => KPB.ringkas(n0, k.mult));
    const sn = KPB.sensitivitas(n0);
    const uh = KPB.hitungCepat({ harga: n0.produk[0] && n0.produk[0].harga, hpp: n0.modalKerja, tetap: n0.modalKerja, modal: 1e9, volume: 1e9, feePersen: 3 });
    masalah = semuaTerhingga([an.rows, an.m, an.tahun, an.sehat, an.periksa, an.bep.bepUnit, an.bep.bepRp, an.bep.mos, sk.map((x) => [x.m, x.rows]), sn.out, uh.laba]);
  } catch (e) { masalah = 'melempar ' + e.message; }
  total++;
  if (!masalah) terhingga++; else if (total - terhingga < 4) console.log('TIDAK TERHINGGA kasus', i, masalah);
  cek(JSON.stringify(KPB.normalisasi(salinan(n0))) === JSON.stringify(n0), 'normalisasi idempoten, kasus acak ' + i);
}
cek(terhingga === total, 'seluruh ' + total + ' data acak menghasilkan angka terhingga (' + terhingga + ')');
const ekstrem = KPB.normalisasi({ produk: [{ harga: 1e300, volume: 1e300, feePersen: 1e300, bahan: [{ harga: 1e300, isi: 1e-300, pakai: 1e300 }] }], investasi: [{ nilai: 1e300, umur: 1e300 }], biayaTetap: [{ nilai: 1e300 }], modalKerja: 1e300 });
cek(!semuaTerhingga([KPB.analisis(ekstrem).rows, KPB.analisis(ekstrem).m]), 'angka ekstrem 1e300 dibatasi dan tetap terhingga');

/* ---------- 18. simulasi pembanding independen (ditulis terpisah dari mesin) ---------- */
const FAM = { gram: ['m', 1], kg: ['m', 1000], ml: ['v', 1], liter: ['v', 1000], cm: ['p', 1], meter: ['p', 100], pcs: ['c', 1], lusin: ['c', 12], kodi: ['c', 20] };
const adaF = (k) => Object.prototype.hasOwnProperty.call(FAM, k);
function acuan(s, mult) {
  const k = Object.assign({ harga: 1, volume: 1, hpp: 1, tetap: 1 }, mult);
  const as = s.asumsi;
  const eks = s.biayaOmzet.reduce((t, x) => t + x.persen, 0);
  const konv = (beli, pakai) => (adaF(beli) && adaF(pakai) && FAM[beli][0] === FAM[pakai][0] ? FAM[pakai][1] / FAM[beli][1] : 1);
  const hppProduk = s.produk.map((p) => {
    let t = 0;
    p.bahan.forEach((b) => { if (b.isi > 0) t += (b.harga / b.isi) * b.pakai * konv(b.satuan, b.satuanPakai); });
    p.lain.forEach((x) => { t += x.biaya; });
    return t;
  });
  const modal = s.investasi.reduce((t, i) => t + i.nilai, 0) + s.modalKerja;
  const tetapDasar = s.biayaTetap.reduce((t, x) => t + x.nilai, 0);
  const hasil = [];
  let kum = -modal, rugiLalu = 0, omzetTh = 0, thnKal = null, nwcLalu = 0;
  for (let m = 1; m <= s.periode; m++) {
    const th = Math.floor((m - 1) / 12);
    const rb = as.rampBulan, ra = as.rampAwal / 100;
    const ramp = rb > 1 && m < rb ? ra + ((1 - ra) * (m - 1)) / (rb - 1) : 1;
    const tumbuh = m > rb ? (1 + as.tumbuh / 100) ** (m - rb) : 1;
    let vf = Math.min(ramp * tumbuh, Math.max(1, as.batasTumbuh / 100));
    if (as.musimanAktif) vf *= as.musiman[(s.mulaiBulan + m - 1) % 12] / 100;
    vf *= k.volume;
    let q = s.produk.map((p) => p.volume * vf);
    const tq = q.reduce((a, b) => a + b, 0);
    if (as.kapasitas > 0 && tq > as.kapasitas) q = q.map((x) => (x * as.kapasitas) / tq);
    let units = 0, rev = 0, cogs = 0, jual = 0;
    s.produk.forEach((p, i) => {
      const harga = p.harga * (1 + as.naikHarga / 100) ** th * k.harga;
      const hpp = hppProduk[i] * (1 + as.naikBiaya / 100) ** th * k.hpp;
      units += q[i]; rev += q[i] * harga; cogs += q[i] * hpp;
      jual += q[i] * (harga * ((p.feePersen + eks) / 100) + p.feeRp * (1 + as.naikBiaya / 100) ** th);
    });
    const tetap = tetapDasar * (1 + as.naikTetap / 100) ** th * k.tetap;
    let dep = 0;
    s.investasi.forEach((i) => { const u = Math.round(i.umur * 12); if (u > 0 && m <= u) dep += i.nilai / u; });
    const ebit = rev - cogs - jual - tetap - dep;
    const kal = Math.floor((s.mulaiBulan + m - 1) / 12);
    if (kal !== thnKal) { omzetTh = 0; thnKal = kal; }
    const sebelum = Math.max(0, omzetTh - as.pajakBebas);
    omzetTh += rev;
    const pOmzet = (Math.max(0, omzetTh - as.pajakBebas) - sebelum) * (as.pajakOmzet / 100);
    let pLaba = 0;
    if (ebit < 0) rugiLalu -= ebit;
    else { const dipakai = Math.min(rugiLalu, ebit); rugiLalu -= dipakai; pLaba = (ebit - dipakai) * (as.pajakLaba / 100); }
    const net = ebit - pOmzet - pLaba;
    const nwc = (as.stokHari * cogs + as.piutangHari * rev - as.hutangHari * cogs) / 30;
    const cf = net + dep - (nwc - nwcLalu);
    nwcLalu = nwc;
    kum += cf;
    hasil.push({ units, rev, cogs, jual, tetap, dep, ebit, pajak: pOmzet + pLaba, net, nwc, cf, cum: kum });
  }
  return hasil;
}
function stateAcakWajar() {
  const bil = (lo, hi) => lo + acak() * (hi - lo);
  const bulat = (lo, hi) => Math.floor(bil(lo, hi + 1));
  return KPB.normalisasi({
    periode: pilih([12, 24, 36, 48, 60]), mulaiBulan: bulat(0, 11), mulaiTahun: 2027, modalKerja: pilih([0, bil(0, 5e7)]),
    investasi: Array.from({ length: bulat(0, 4) }, () => ({ nilai: bil(0, 6e7), umur: pilih([0, 1, 2.5, 3, 5, 10]) })),
    biayaTetap: Array.from({ length: bulat(0, 4) }, () => ({ nama: 'x', nilai: bil(0, 1.5e7) })),
    biayaOmzet: Array.from({ length: bulat(0, 3) }, () => ({ nama: 'y', persen: bil(0, 12) })),
    produk: Array.from({ length: bulat(1, 4) }, () => ({
      nama: 'p', harga: bil(5000, 250000), volume: bil(0, 1500), feePersen: bil(0, 12), feeRp: pilih([0, 1000]),
      bahan: Array.from({ length: bulat(0, 3) }, () => ({ nama: 'b', harga: bil(1000, 90000), isi: pilih([1, 10, 1000, 0]), pakai: bil(0, 300), satuan: pilih(['kg', 'gram', 'liter', 'ml', 'pcs', 'meter']), satuanPakai: pilih(['', 'gram', 'kg', 'ml', 'liter', 'cm', 'lusin']) })),
      lain: Array.from({ length: bulat(0, 2) }, () => ({ nama: 'l', jenis: 'oh', biaya: bil(0, 8000) })),
    })),
    asumsi: {
      rampAwal: bil(0, 100), rampBulan: bulat(1, 12), tumbuh: bil(-3, 6), batasTumbuh: bil(100, 300),
      naikHarga: bil(0, 8), naikBiaya: bil(0, 10), naikTetap: bil(0, 10),
      pajakOmzet: pilih([0, 0.5]), pajakBebas: pilih([0, 5e8]), pajakLaba: pilih([0, 22]),
      stokHari: pilih([0, 7, 30, 60]), piutangHari: pilih([0, 14]), hutangHari: pilih([0, 10, 45]),
      kapasitas: pilih([0, 0, 800, 3000]), musimanAktif: acak() < 0.5, musiman: Array.from({ length: 12 }, () => bil(50, 180)),
    },
  });
}
let beda = 0, bandingan = 0;
const sama = (a, b) => Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
for (let i = 0; i < 300; i++) {
  const st = stateAcakWajar();
  const mult = pilih([undefined, { harga: 0.95, volume: 0.75, hpp: 1.1, tetap: 1.05 }, { volume: 1.2 }]);
  const a1 = KPB.proyeksi(st, mult), a2 = acuan(st, mult);
  cek(a1.length === a2.length, 'jumlah bulan sama, kasus ' + i);
  for (let j = 0; j < a1.length; j++) {
    ['units', 'rev', 'cogs', 'jual', 'tetap', 'dep', 'ebit', 'pajak', 'net', 'nwc', 'cf', 'cum'].forEach((f) => {
      bandingan++;
      if (!sama(a1[j][f], a2[j][f])) { beda++; if (beda < 6) console.log('BEDA kasus', i, 'bulan', j + 1, f, a1[j][f], a2[j][f]); }
    });
  }
  const rk2 = KPB.metrik(st, a1);
  const kum = a1.reduce((t, r) => t + r.cf, 0) - KPB.modalAwal(st);
  if (!sama(kum, a1[a1.length - 1].cum)) { beda++; console.log('BEDA kumulatif kasus', i); }
  if (!sama(rk2.totalNet, a1.reduce((t, r) => t + r.net, 0))) { beda++; console.log('BEDA total laba kasus', i); }
}
cek(beda === 0, 'mesin sama dengan simulasi pembanding pada ' + bandingan + ' angka (' + beda + ' beda)');

/* ---------- 19. template ---------- */
cek(KPB.TEMPLATE.length >= 5, 'ada minimal lima template usaha');
KPB.TEMPLATE.forEach((t) => {
  const st = t.bangun();
  const an = KPB.analisis(st);
  cek(st.contoh === true, 'template ' + t.id + ' bertanda contoh');
  cek(an.bep.layak && an.bep.rasio > 0.4 && an.bep.rasio < 0.9, 'template ' + t.id + ': BEP wajar (40-90% target), didapat ' + (an.bep.rasio * 100).toFixed(0) + '%');
  cek(an.m.payback && an.m.payback.bulan >= 8 && an.m.payback.bulan <= 36, 'template ' + t.id + ': balik modal dalam proyeksi');
  cek(an.sehat.every((x) => x.level !== 'crit'), 'template ' + t.id + ': tidak ada status bahaya');
  cek(an.periksa.every((x) => x.level === 'info'), 'template ' + t.id + ': tidak ada peringatan serius, ' + an.periksa.map((x) => x.id).join());
  cek(an.sehat.find((x) => x.id === 'kas').level === 'good', 'template ' + t.id + ': modal kerja cukup');
  cek(JSON.stringify(KPB.normalisasi(salinan(st))) === JSON.stringify(st), 'template ' + t.id + ' stabil terhadap normalisasi');
  const ids = new Set();
  [st.investasi, st.biayaTetap, st.biayaOmzet].forEach((l) => l.forEach((x) => ids.add(x.id)));
  cek(ids.size === st.investasi.length + st.biayaTetap.length + st.biayaOmzet.length, 'template ' + t.id + ': id unik');
});

/* ---------- 20. data rusak dari berkas atau penyimpanan ---------- */
{
  const rusak = [
    { investasi: [null, 5, 'x', [1]], biayaTetap: [undefined, { nilai: 'abc' }], produk: [null, { bahan: [null, {}], lain: [undefined] }] },
    { produk: [{ id: 'a' }, { id: 'a' }], investasi: [{ id: 'a' }], biayaTetap: [{ id: '' }, { id: '' }] },
    { asumsi: 5, produk: 'x', investasi: { 0: {} } }, [], 123, 'abc', null, undefined, true,
  ];
  rusak.forEach((r, i) => {
    let st = null, an = null;
    try { st = KPB.normalisasi(r); an = KPB.analisis(st); } catch (e) { st = null; }
    cek(st && an, 'data rusak #' + i + ' tidak menjatuhkan normalisasi dan analisis');
    if (st) {
      cek(Number.isFinite(an.m.totalNet) && Number.isFinite(an.bep.fc), 'data rusak #' + i + ' menghasilkan angka terhingga');
      const semua = [].concat(st.investasi, st.biayaTetap, st.biayaOmzet, st.produk, st.produk.flatMap((p) => [].concat(p.bahan, p.lain))).map((x) => x.id);
      cek(new Set(semua).size === semua.length, 'data rusak #' + i + ': semua id unik (' + semua.length + ' baris)');
    }
  });
  /* larik sangat besar dipotong, tidak membuat aplikasi macet */
  const besar = { produk: Array.from({ length: 200000 }, () => ({})), investasi: Array.from({ length: 200000 }, () => ({})) };
  const t0 = Date.now();
  const sb = KPB.normalisasi(besar);
  cek(sb.produk.length === 12 && sb.investasi.length === 40 && Date.now() - t0 < 1500, 'larik raksasa dipotong cepat (' + (Date.now() - t0) + ' ms)');
  /* kunci aneh tidak mencemari prototipe */
  const aneh = JSON.parse('{"__proto__":{"dicemari":1},"produk":[{"__proto__":{"dicemari":2},"nama":"x"}],"constructor":{"prototype":{"dicemari":3}}}');
  KPB.normalisasi(aneh);
  cek(({}).dicemari === undefined, 'prototipe Object tidak tercemar oleh kunci __proto__');
}

console.log('\nRingkas data contoh:');
console.log('  HPP: ' + [hpp1, hpp2, hpp3].map(Math.round).join(' / ') + '  | BEP ' + B.bepUnit.toFixed(0) + ' unit = Rp' + Math.round(B.bepRp).toLocaleString('id-ID') + ' (' + (B.rasio * 100).toFixed(1) + '% dari target)');
const m = A.m;
console.log('  mulai untung bln', m.untungBulan, '| balik modal bln', m.payback && m.payback.bulan, '(tepat ' + (m.payback && m.payback.tepat.toFixed(1)) + ')',
  '| ROI', (m.roi * 100).toFixed(0) + '%', '| NPV Rp' + Math.round(m.npv).toLocaleString('id-ID'), '| IRR', m.irr && (m.irr * 100).toFixed(0) + '%',
  '| kas dibutuhkan Rp' + Math.round(m.kasButuh).toLocaleString('id-ID'));
console.log('\n' + lulus + ' lulus, ' + gagal + ' gagal');
process.exit(gagal ? 1 : 0);
