/* ===== results-b: langkah 6 (balik modal, simulasi, simpan hasil) ===== */
const dRp = (v) => ({ t: ttd(v) + fRp(Math.abs(v)), neg: Math.round(v) < 0 });

function vonis6(A) {
  const m = A.m, s = A.s, k = [];
  if (m.payback && m.payback.bulan > 0) k.push('Modal awal ' + fRpC(m.modalAwal) + ' kembali di ', h('em', null, 'bulan ke-' + m.payback.bulan), ' (' + lama(m.payback.bulan) + ').');
  else if (m.payback) k.push(h('em', null, 'Tidak ada modal awal'), ' yang perlu dikembalikan.');
  else k.push('Dalam ' + s.periode + ' bulan, modal ' + fRpC(m.modalAwal) + ' ', h('em', null, 'belum kembali'), '.');
  k.push(' Total laba bersih ' + s.periode + ' bulan: ' + fRpC(m.totalNet) + '.');
  return h('p', { class: 'verdict' }, k);
}

function tiles6(A) {
  const m = A.m, a = A.s.asumsi, pb = m.payback;
  const irrBagus = m.irr != null && m.irr * 100 >= a.diskon;
  return h('div', { class: 'tiles' },
    tile('Balik modal (payback)', pb ? (pb.bulan > 0 ? 'Bulan ke-' + pb.bulan : 'Langsung') : 'Belum',
      pb && pb.bulan > 0 ? lama(pb.bulan) + ', tepatnya sekitar ' + fDec(pb.tepat, 1) + ' bulan' : 'Dalam ' + A.s.periode + ' bulan', 'hero'),
    tile('ROI', m.roi == null ? '-' : fPct(m.roi, 0), m.roi == null ? '' : 'Total laba bersih dibagi modal awal. Rata-rata ' + fPct(m.roiTahun, 0) + ' per tahun.'),
    tile('NPV', fRpC(m.npv), h('span', null, chip(m.npv >= 0 ? 'good' : 'crit', m.npv >= 0 ? 'Layak' : 'Belum layak'), ' Nilai hari ini dari seluruh arus kas dikurangi modal awal, imbal hasil ' + fDec(a.diskon, 1) + '% per tahun.')),
    tile('IRR', m.irr == null ? 'Tidak ada' : fPct(m.irr, 0) + ' / tahun',
      m.irr == null ? 'Arus kas tidak pernah menutup modal.' : h('span', null, chip(irrBagus ? 'good' : 'crit', irrBagus ? 'Di atas harapan' : 'Di bawah harapan'), ' Imbal hasil tahunan usaha ini. Pembandingnya ' + fDec(a.diskon, 1) + '% per tahun.')));
}

function tabelArusKas(A) {
  const T = A.tahun, I0 = A.m.modalAwal, kosong = '';
  const adaWc = T.some((y) => Math.abs(y.dnwc) > 0.5);
  const head = ['Rupiah', 'Awal'].concat(T.map((y) => 'Tahun ' + y.tahun + (y.bulan < 12 ? ' (' + y.bulan + ' bln)' : '')));
  return tabel(head, [
    bariT(['Modal awal (investasi + modal kerja)', cRp(-I0)].concat(T.map(() => kosong))),
    bariT(['Laba bersih', kosong].concat(T.map((y) => cRp(y.net)))),
    bariT(['+\u00A0Penyusutan (bukan uang keluar)', kosong].concat(T.map((y) => cRp(y.dep)))),
    adaWc ? bariT(['−\u00A0Tambahan modal kerja (stok, piutang, hutang)', kosong].concat(T.map((y) => cRp(-y.dnwc)))) : null,
    bariT(['Arus kas bersih', cRp(-I0)].concat(T.map((y) => cRp(y.cf))), true),
    bariT(['Kumulatif', cRp(-I0)].concat(T.map((y) => cRp(y.cum))), true)].filter(Boolean), { label: 'Arus kas per tahun' });
}

/* perbandingan input vs simulasi: tabel di layar lebar, kartu tiga kolom di layar sempit (rupiah diringkas agar muat) */
function tabelBanding(A, r) {
  const a = A.m, b = r.m;
  const dua = (f, k) => (v) => [h('span', { class: 'f' }, f(v)), h('span', { class: 'k' }, k(v))];
  const RP = dua(fRp, fRpC), BIASA = (f) => dua(f, f);
  const bar = (nama, x, y, fmt, rendahBaik, kosong) => {
    const d = x == null || y == null ? null : y - x;
    const ada = d != null && Math.abs(d) > 1e-9;
    const buruk = ada && (rendahBaik ? d > 0 : d < 0);
    const sel = d == null ? '-' : ada ? [ttd(d), fmt(Math.abs(d))] : 'sama';
    return h('div', { class: 'cmp-row' },
      h('div', { class: 'cmp-name' }, nama),
      h('div', { class: 'cmp-c' }, h('span', { class: 'cl2' }, 'Sesuai input'), h('b', null, x == null ? kosong : fmt(x))),
      h('div', { class: 'cmp-c' }, h('span', { class: 'cl2' }, 'Simulasi'), h('b', null, y == null ? kosong : fmt(y))),
      h('div', { class: 'cmp-c' + (buruk ? ' neg' : '') }, h('span', { class: 'cl2' }, 'Selisih'), h('b', null, sel)));
  };
  return h('div', { class: 'cmp' },
    h('div', { class: 'cmp-row cmp-head', 'aria-hidden': 'true' }, ['Ukuran', 'Sesuai input', 'Simulasi', 'Selisih'].map((x, i) => h('div', { class: i ? 'cmp-c' : 'cmp-name' }, x))),
    bar('BEP (unit per bulan)', A.bep.bepUnit, r.b.bepUnit, BIASA((v) => fInt(v) + ' unit'), true, '-'),
    bar('Laba bersih bulan ke-12', a.labaBulan12, b.labaBulan12, RP, false, '-'),
    bar('Total laba bersih', a.totalNet, b.totalNet, RP, false, '-'),
    bar('Balik modal', a.payback ? a.payback.bulan : null, b.payback ? b.payback.bulan : null, BIASA((v) => v + ' bulan'), true, 'Belum'),
    bar('NPV', a.npv, b.npv, RP, false, '-'));
}

function seksiSimulasi(A) {
  const ui = App.ui, s = A.s, hasil = h('div'), ctr = h('div', { class: 'grid2' });
  const fs = (v) => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v) + '%';
  const hitung = () => {
    const mult = { harga: 1 + ui.sim.harga / 100, volume: 1 + ui.sim.volume / 100, hpp: 1 + ui.sim.hpp / 100, tetap: 1 + ui.sim.tetap / 100 };
    hasil.replaceChildren(tabelBanding(A, KPB.ringkas(s, mult)));
  };
  const SL = [['harga', 'Harga jual', -20, 20], ['volume', 'Volume penjualan', -50, 50], ['hpp', 'HPP (biaya produksi)', -20, 30], ['tetap', 'Biaya tetap', -30, 30]];
  const slider = ([k, label, min, max]) => {
    const id = 'sim-' + k, nilai = h('b', null, fs(ui.sim[k]));
    const inp = h('input', { type: 'range', id, min: String(min), max: String(max), step: '1', value: String(ui.sim[k]) });
    inp.addEventListener('input', () => { ui.sim[k] = +inp.value; nilai.textContent = fs(ui.sim[k]); hitung(); });
    return h('div', { class: 'sl' }, h('div', { class: 'sl-top' }, h('label', { for: id }, label), nilai), inp);
  };
  const bangun = () => ctr.replaceChildren(...SL.map(slider));
  const preset = (m) => {
    ui.sim = { harga: Math.round((m.harga - 1) * 100), volume: Math.round((m.volume - 1) * 100), hpp: Math.round((m.hpp - 1) * 100), tetap: Math.round((m.tetap - 1) * 100) };
    bangun(); hitung();
  };
  bangun(); hitung();
  return [
    h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px;align-items:center' }, h('span', { class: 'small' }, 'Atur cepat:'), KPB.SKENARIO.map((k) => tambahBtn(k.nama, () => preset(k.mult)))),
    ctr, hasil];
}

function tabelSkenario(A) {
  const rows = KPB.SKENARIO.map((k) => {
    const r = KPB.ringkas(A.s, k.mult);
    return bariT([k.nama, r.b.bepUnit == null ? '-' : fInt(r.b.bepUnit) + ' unit', cRpF(r.m.labaBulan12), cRpF(r.m.totalNet), r.m.payback ? 'Bulan ke-' + r.m.payback.bulan : 'Belum', cRpF(r.m.npv)], k.id === 'dasar');
  });
  return [tabel(['Skenario', 'BEP', 'Laba bersih bln 12', 'Total laba bersih', 'Balik modal', 'NPV'], rows, { label: 'Perbandingan tiga skenario' }),
    h('p', { class: 'small' }, KPB.SKENARIO.filter((k) => k.id !== 'dasar').map((k) => k.nama + ': ' + k.ket + '. ').join(''))];
}

function tabelSensitivitas(A) {
  const S = KPB.sensitivitas(A.s), d = Math.round(S.d * 100);
  const pb = (p) => (p ? 'Bulan ke-' + p.bulan : 'Belum');
  const rows = S.out.map((o) => bariT([o.nama, dRp(o.lo.delta), pb(o.lo.payback), dRp(o.hi.delta), pb(o.hi.payback)]));
  return [h('p', { class: 'small' }, 'Tiap faktor diubah ' + d + '% sendirian, faktor lain tetap. Yang paling berpengaruh pada total laba bersih: ', h('b', null, S.out[0].nama), '.'),
    tabel(['Faktor', 'Turun ' + d + '%: laba total', 'Turun ' + d + '%: balik modal', 'Naik ' + d + '%: laba total', 'Naik ' + d + '%: balik modal'], rows, { label: 'Sensitivitas faktor' })];
}

/* ajakan bertindak dari pemilik situs (opsional, lewat konfigurasi); hanya tautan http, https, atau mailto */
function hrefAman(href) {
  try {
    const u = new URL(String(href), window.location.href);
    return /^(https?:|mailto:|tel:)$/.test(u.protocol) ? u.href : null;
  } catch (e) { return null; }
}
function kartuCta() {
  const c = CFG.cta;
  if (!c || typeof c !== 'object') return null;
  const href = c.href ? hrefAman(c.href) : null;
  if (!c.judul && !c.isi && !(c.tombol && href)) return null;
  return h('aside', { class: 'cta', 'aria-label': c.judul || 'Langkah berikutnya' },
    h('div', null,
      c.judul ? h('h3', { class: 'h3' }, c.judul) : null,
      c.isi ? h('p', { class: 'small' }, c.isi) : null),
    c.tombol && href ? h('a', { class: 'btn pri', href, target: c.target === '_self' ? '_self' : '_blank', rel: 'noopener', onclick: () => emit('cta_klik', { teks: String(c.tombol).slice(0, 40) }) }, c.tombol) : null);
}

function buildStep6() {
  const A = App.A;
  return [
    seksi('Kapan modal kembali?', vonis6(A), tiles6(A)),
    seksi('Arus kas dan balik modal',
      cara(par('Arus kas adalah uang yang benar-benar masuk setelah semua biaya dan pajak. Modal dianggap kembali saat total arus kas sudah menutup modal awal.'),
        h('p', null, eq('Arus kas = laba bersih + penyusutan − tambahan modal kerja')),
        h('p', null, eq('NPV = jumlah (arus kas ÷ (1 + imbal hasil) ^ waktu) − modal awal')),
        par('IRR adalah imbal hasil tahunan yang membuat NPV tepat nol. Makin jauh di atas imbal hasil harapan Anda, makin menarik usahanya.')),
      chartKas(A),
      h('h3', { class: 'h3' }, 'Arus kas per tahun'),
      tabelArusKas(A)),
    seksi('Simulasi: bagaimana kalau meleset?',
      h('p', { class: 'lede' }, 'Geser untuk melihat dampaknya ke BEP, laba, dan balik modal. Angka input Anda tidak berubah.'),
      seksiSimulasi(A),
      h('h3', { class: 'h3' }, 'Tiga skenario sekaligus'),
      tabelSkenario(A),
      h('h3', { class: 'h3' }, 'Faktor mana yang paling berpengaruh?'),
      tabelSensitivitas(A)),
    seksi('Simpan dan bagikan hasil',
      h('p', { class: 'lede' }, 'Unduh sebagai Excel untuk dibahas bersama tim, cetak laporan ringkas sebagai PDF, atau salin ringkasan untuk dikirim lewat WhatsApp atau email.'),
      h('div', { style: 'display:flex;flex-wrap:wrap;gap:10px' },
        h('button', { class: 'btn pri', type: 'button', onclick: () => unduhExcel() }, 'Unduh Excel (.xlsx)'),
        h('button', { class: 'btn', type: 'button', onclick: () => cetakLaporan() }, 'Cetak atau simpan PDF'),
        h('button', { class: 'btn', type: 'button', onclick: () => salinRingkasan() }, 'Salin ringkasan'),
        h('button', { class: 'btn', type: 'button', onclick: () => unduhLaporan() }, 'Unduh laporan (.html)'),
        h('button', { class: 'btn', type: 'button', onclick: () => unduhJson() }, 'Simpan data (.json)')),
      h('p', { class: 'small' }, 'Data usaha hanya tersimpan di peramban ini. Simpan berkas .json sebagai cadangan atau untuk membukanya di perangkat lain.')),
    kartuCta(),
  ];
}
