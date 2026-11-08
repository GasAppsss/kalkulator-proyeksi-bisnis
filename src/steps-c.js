/* ===== steps-c: langkah 4 (target penjualan dan asumsi) dan ringkasan langsung ===== */
const COLS_TGT = 'minmax(0,2fr) minmax(0,1.2fr) minmax(0,1.4fr) minmax(0,1fr) minmax(0,1.4fr) minmax(0,.8fr)';

function barisTarget(p) {
  const k = 'tgt-' + p.id;
  const tot = () => KPB.sum(App.s.produk.map((x) => x.volume));
  const c = (judul, el) => h('div', { class: 'c out' }, h('span', { class: 'cl' }, judul), el);
  return h('div', { class: 'row', style: '--cols:' + COLS_TGT },
    h('div', { class: 'c wide' }, h('span', { class: 'cl' }, 'Produk'), h('strong', null, out(() => p.nama || 'Produk tanpa nama'))),
    c('Harga jual', out(() => fRp(p.harga))),
    sel('Target per bulan', inNum(p, 'volume', k, { dec: 0, min: 0, label: 'Target unit per bulan ' + (p.nama || '') }), { suf: 'unit' }),
    c('Per hari', out(() => fDec(p.volume / 30, 1) + ' unit')),
    c('Omzet per bulan', out(() => fRp(p.volume * p.harga))),
    c('Bauran', out(() => fPct(tot() > 0 ? p.volume / tot() : 0, 1))));
}

function rampPreview() {
  const a = App.s.asumsi, N = Math.min(App.s.periode, 36);
  const vals = [];
  for (let m = 1; m <= N; m++) vals.push(KPB.faktorVolume(m, a) * 100);
  return [h('p', { class: 'hint' }, 'Pratinjau: penjualan tiap bulan sebagai persen dari target (bulan 1 sampai ' + N + ')'), sparkline(vals, { fmt: (v) => fDec(v, 0) + '%', base: 100 })];
}

function buildStep4() {
  const s = App.s, a = s.asumsi;
  /* nama pendek tanpa angka tarif, supaya muat di kolom sempit dan tidak pernah usang bila tarif ditimpa lewat konfigurasi;
     uraian lengkap (dengan tarif) tampil sebagai keterangan di bawah pilihan */
  const PENDEK = { 'op-final': 'Orang pribadi (PPh final)', 'pt-perorangan': 'PT perorangan (PPh final)', koperasi: 'Koperasi (PPh final)', 'badan-31e': 'PT / CV (fasilitas Pasal 31E)', badan: 'PT / CV (tarif umum)', tanpa: 'Tanpa pajak', manual: 'Atur sendiri' };
  const pj = inSelect(a, 'pajakPreset', Object.keys(KPB.PAJAK).map((k) => [k, PENDEK[k] || KPB.PAJAK[k].nama]), 'f-pj');
  const ketPajak = () => (a.pajakPreset === 'manual' || !KPB.PAJAK[a.pajakPreset] ? 'Tarif di bawah ini Anda atur sendiri.' : KPB.PAJAK[a.pajakPreset].nama);
  let hintPj = null;
  const segarHintPj = () => { if (hintPj) hintPj.textContent = ketPajak(); };
  pj.addEventListener('change', () => {
    if (a.pajakPreset !== 'manual') ['pajakOmzet', 'pajakBebas', 'pajakLaba', 'batasOmzetFinal'].forEach((k) => { a[k] = KPB.PAJAK[a.pajakPreset][k]; });
    segarHintPj();
    strukturBerubah();
  });
  const manual = (inp) => { inp.addEventListener('input', () => { if (a.pajakPreset !== 'manual') { a.pajakPreset = 'manual'; pj.value = 'manual'; segarHintPj(); } }); return inp; };
  const fldPj = fld('Jenis pajak', pj, { hint: ketPajak() });
  hintPj = fldPj.querySelector('.hint');
  const tarif = (judul, key, id, o) => fld(judul, manual(inNum(a, key, id, o.num)), o.fld);
  return [
    seksi('Target penjualan per bulan',
      cara(par('Isi berapa unit tiap produk bisa terjual per bulan saat usaha sudah stabil (setelah masa awal). Gunakan angka yang bisa dipertanggungjawabkan, misalnya dari jumlah pengunjung dikalikan persentase yang membeli.')),
      h('div', { class: 'rows' },
        thead(['Produk', 'Harga jual', 'Target per bulan', 'Per hari', 'Omzet per bulan', 'Bauran'], COLS_TGT, [1, 3, 4, 5]),
        s.produk.map(barisTarget)),
      h('div', { class: 'total' }, 'Total target: ', h('b', null, out(() => fInt(KPB.sum(s.produk.map((p) => p.volume))) + ' unit')), ' per bulan, omzet ', h('b', null, out(() => fRp(KPB.sum(s.produk.map((p) => p.volume * p.harga))))))),
    seksi('Masa awal dan pertumbuhan',
      h('p', { class: 'lede' }, 'Usaha baru jarang langsung ramai. Atur dari berapa persen target penjualan dimulai, kapan target tercapai, dan pertumbuhan setelah itu.'),
      h('div', { class: 'grid2' },
        fld('Penjualan bulan pertama', inNum(a, 'rampAwal', 'f-ra', { dec: 0, min: 0, max: 100 }), { suf: '% target', hint: 'Isi 100 bila langsung ramai sejak hari pertama.' }),
        fld('Target tercapai di bulan ke', inNum(a, 'rampBulan', 'f-rb', { dec: 0, min: 1, max: 36 }), { suf: 'bulan' }),
        fld('Pertumbuhan setelah itu', inNum(a, 'tumbuh', 'f-tm', { dec: 1, min: -20, max: 50 }), { suf: '% per bulan' }),
        fld('Batas pertumbuhan', inNum(a, 'batasTumbuh', 'f-bt', { dec: 0, min: 100, max: 1000 }), { suf: '% target', hint: 'Mencegah proyeksi naik tanpa batas.' })),
      slot(rampPreview)),
    seksi('Kenaikan harga dan biaya per tahun',
      h('p', { class: 'lede' }, 'Inflasi membuat bahan dan sewa naik. Harga jual juga biasanya disesuaikan. Kenaikan berlaku mulai tahun kedua.'),
      h('div', { class: 'grid2' },
        fld('Kenaikan harga jual', inNum(a, 'naikHarga', 'f-nh', { dec: 1, min: 0, max: 50 }), { suf: '% per tahun' }),
        fld('Kenaikan HPP', inNum(a, 'naikBiaya', 'f-nb', { dec: 1, min: 0, max: 50 }), { suf: '% per tahun' }),
        fld('Kenaikan biaya tetap', inNum(a, 'naikTetap', 'f-nt', { dec: 1, min: 0, max: 50 }), { suf: '% per tahun' }))),
    seksi('Pajak',
      h('p', { class: 'lede' }, 'Pilih jenis pajak yang sesuai. Tarif terisi otomatis dan masih bisa Anda ubah.'),
      fldPj,
      h('div', { class: 'grid2' },
        tarif('PPh final atas omzet', 'pajakOmzet', 'f-po', { num: { dec: 2, min: 0, max: 100 }, fld: { suf: '% omzet' } }),
        tarif('Omzet bebas pajak', 'pajakBebas', 'f-pb', { num: { dec: 0, min: 0 }, fld: { pre: 'Rp', suf: '/tahun' } }),
        tarif('Pajak atas laba', 'pajakLaba', 'f-pl', { num: { dec: 1, min: 0, max: 100 }, fld: { suf: '% laba' }, })),
      h('p', { class: 'small' }, 'Tarif bawaan mengikuti PP 20/2026 seperti dijelaskan ',
        h('a', { href: 'https://pajak.go.id/id/artikel/pp-202026-tarif-pph-05-bagi-umkm-orang-pribadi-berlaku-selamanya', target: '_blank', rel: 'noopener' }, 'Direktorat Jenderal Pajak'), ' dan dilaporkan ',
        h('a', { href: 'https://news.ddtc.co.id/berita/nasional/1819939/djp-sebut-ada-5-poin-penting-kebijakan-pph-final-umkm-pada-pp-202026', target: '_blank', rel: 'noopener' }, 'DDTCNews'), ' dan ',
        h('a', { href: 'https://ikpi.or.id/djp-umumkan-tarif-pajak-umkm-05-berlaku-selamanya-untuk-wp-op-dan-pt-perorangan/', target: '_blank', rel: 'noopener' }, 'IKPI'),
        ': PPh final 0,5% dari omzet untuk orang pribadi dan PT perorangan tanpa batas waktu, omzet sampai Rp4,8 miliar per tahun, dan omzet orang pribadi sampai Rp500 juta per tahun bebas pajak. Koperasi juga bisa memakai 0,5%, tetapi ',
        h('a', { href: 'https://ikpi.or.id/pemanfaatan-tarif-pph-final-koperasi-kini-dibatasi-maksimal-empat-tahun/', target: '_blank', rel: 'noopener' }, 'dibatasi empat tahun pajak sejak terdaftar'),
        ' (batas itu belum dimodelkan di sini). CV dan PT selain PT perorangan tidak lagi menjadi penerima baru fasilitas ini (yang sudah memakainya mendapat masa transisi), jadi dihitung dari laba: tarif umum 22%, atau tarif efektif 11% bila memenuhi ',
        h('a', { href: 'https://news.ddtc.co.id/berita/nasional/1810053/wp-badan-umkm-bisa-pakai-insentif-pasal-31e-tarif-pph-jadi-11-persen', target: '_blank', rel: 'noopener' }, 'fasilitas Pasal 31E'),
        ' (peredaran bruto sampai Rp50 miliar; pengurangan tarif 50% berlaku untuk bagian omzet sampai Rp4,8 miliar). Hitungan di sini disederhanakan: satu tarif atas laba, tanpa koreksi fiskal. Ringkasan aturan diperiksa terakhir ' + TGL_ATURAN + '. Pastikan ke konsultan pajak atau KPP sebelum mengambil keputusan.')),
    seksi('Penilaian investasi',
      h('div', { class: 'grid2' },
        fld('Imbal hasil yang diharapkan', inNum(a, 'diskon', 'f-dk', { dec: 1, min: 0, max: 100 }), { suf: '% per tahun', hint: 'Hasil bila uang yang sama ditaruh di tempat lain (deposito, reksa dana). Dipakai menghitung NPV.' }),
        fld('Nilai sisa di akhir periode', inNum(a, 'nilaiSisa', 'f-ns', { dec: 0, min: 0, max: 1000 }), { suf: '% modal awal', hint: 'Isi 0 untuk hitungan paling hati-hati.' }))),
    seksiLanjutan(),
  ];
}

/* pengaturan opsional: modal kerja (stok, piutang, hutang), kapasitas, pola musiman */
const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function infoModalKerja() {
  const m = App.A.m, a = App.s.asumsi;
  if (!(a.stokHari + a.piutangHari + a.hutangHari !== 0)) return [h('p', { class: 'small' }, 'Belum dihitung. Isi bila Anda menyimpan stok atau menjual dengan tempo, supaya kebutuhan kas lebih realistis.')];
  return [h('p', { class: 'small' }, 'Di akhir periode sekitar ', h('b', null, fRp(m.nwcAkhir)), m.nwcAkhir >= 0 ? ' tertahan di stok dan piutang.' : ' ditopang oleh hutang dagang.', ' Nilai ini dianggap kembali menjadi uang tunai saat menghitung NPV dan IRR. Kas terendah: ', h('b', null, fRp(m.kasButuh)), ' di bulan ke-' + m.kasTerendahBulan + '.')];
}
function infoKapasitas() {
  const b = App.A.bep, a = App.s.asumsi;
  if (!(a.kapasitas > 0)) return [h('p', { class: 'small' }, 'Tanpa batas: penjualan boleh naik tanpa dibatasi tempat, mesin, atau tenaga.')];
  const r = b.targetUnit / a.kapasitas;
  return [h('p', { class: 'small' }, 'Target Anda ' + fInt(b.targetUnit) + ' unit = ', h('b', null, fPct(r, 0)), ' dari kapasitas. ', r > 1 ? 'Proyeksi dibatasi pada kapasitas, selisihnya tidak dihitung sebagai penjualan.' : r > 0.85 ? 'Hampir penuh: pertumbuhan berikutnya akan terhambat.' : 'Masih ada ruang untuk tumbuh.'),
    b.diAtasKapasitas ? h('p', { class: 'note-bad' }, 'BEP ' + fInt(b.bepUnit) + ' unit lebih besar dari kapasitas: dengan kapasitas ini usaha tidak bisa impas.') : null];
}
function infoMusim() {
  const a = App.s.asumsi, rata = KPB.sum(a.musiman) / 12;
  return [h('p', { class: 'small' }, 'Rata-rata 12 bulan: ', h('b', null, fDec(rata, 1) + '%'), Math.abs(rata - 100) > 5 ? '. Idealnya 100% agar total setahun sama dengan target; tekan Normalkan untuk menyesuaikan.' : '. Total setahun sesuai target.'),
    sparkline(a.musiman, { fmt: (v) => fDec(v, 0) + '%', base: 100 })];
}
function seksiLanjutan() {
  const s = App.s, a = s.asumsi;
  const buka = a.stokHari > 0 || a.piutangHari > 0 || a.hutangHari > 0 || a.kapasitas > 0 || a.musimanAktif;
  const cb = h('input', { type: 'checkbox', id: 'f-ms', checked: !!a.musimanAktif });
  cb.addEventListener('change', () => { a.musimanAktif = cb.checked; strukturBerubah(); });
  const rataKe100 = () => { const r = KPB.sum(a.musiman) / 12; if (r > 0) a.musiman = a.musiman.map((x) => Math.round((x * 100 / r) * 10) / 10); strukturBerubah(); };
  const musim = a.musimanAktif ? [
    h('div', { class: 'musim' }, NAMA_BULAN.map((nm, i) => fld(nm, inNum(a.musiman, i, 'ms-' + i, { dec: 0, min: 0, max: 500, label: 'Faktor penjualan bulan ' + nm }), { suf: '%' }))),
    slot(infoMusim),
    h('div', { style: 'display:flex;flex-wrap:wrap;gap:8px' }, tambahBtn('Semua 100%', () => { a.musiman = Array(12).fill(100); strukturBerubah(); }), tambahBtn('Normalkan rata-rata ke 100%', rataKe100)),
  ] : null;
  return h('details', { class: 'how adv', open: buka },
    h('summary', null, 'Pengaturan lanjutan (opsional)'),
    h('div', { class: 'adv-isi' },
      h('div', { class: 'sec' },
        h('h3', { class: 'h3' }, 'Modal kerja: stok, piutang, dan hutang dagang'),
        h('p', { class: 'hint' }, 'Uang tidak langsung kembali ketika Anda membeli stok atau menjual dengan tempo. Isi berapa hari uang itu tertahan; hasilnya masuk ke arus kas dan kebutuhan modal kerja. Isi 0 bila semua dibayar tunai.'),
        h('div', { class: 'grid2' },
          fld('Stok yang disimpan', inNum(a, 'stokHari', 'f-sh', { dec: 0, min: 0, max: 365 }), { suf: 'hari', hint: 'Berapa hari kebutuhan bahan atau barang yang selalu ada di gudang.' }),
          fld('Piutang (pelanggan bayar tempo)', inNum(a, 'piutangHari', 'f-ph', { dec: 0, min: 0, max: 365 }), { suf: 'hari', hint: 'Jeda sampai uang masuk, misalnya pencairan marketplace atau pelanggan kantor.' }),
          fld('Hutang dagang (bayar pemasok tempo)', inNum(a, 'hutangHari', 'f-hh', { dec: 0, min: 0, max: 365 }), { suf: 'hari', hint: 'Lama Anda boleh membayar pemasok setelah barang datang.' })),
        slot(infoModalKerja)),
      h('div', { class: 'sec' },
        h('h3', { class: 'h3' }, 'Kapasitas'),
        fld('Kapasitas maksimal per bulan', inNum(a, 'kapasitas', 'f-kp', { dec: 0, min: 0 }), { suf: 'unit', cls: 'w-md', hint: 'Total unit semua produk yang paling banyak bisa dilayani atau dibuat sebulan (jumlah mesin, kursi, jam kerja). Isi 0 bila tidak dibatasi.' }),
        slot(infoKapasitas)),
      h('div', { class: 'sec' },
        h('h3', { class: 'h3' }, 'Pola musiman'),
        h('p', { class: 'hint' }, 'Penjualan sebagian usaha naik turun mengikuti bulan (puasa dan Lebaran, libur sekolah, akhir tahun). Isi faktor tiap bulan kalender: 100% = sama dengan target, 150% = 1,5 kali, 70% = lebih sepi.'),
        h('label', { class: 'cek', for: cb.id }, cb, 'Pakai pola musiman'),
        musim)));
}

/* ---------- ringkasan langsung (kolom kanan) ---------- */
function buildLive() {
  const el = h('aside', { class: 'live', id: 'live', 'aria-label': 'Ringkasan langsung' });
  App.liveEl = el;
  updateLive();
  return el;
}
function updateLive() {
  const el = App.liveEl;
  if (!el || !App.A) return;
  const { bep: b, m } = App.A;
  const rd = (k, v, cls) => h('div', { class: 'nr ' + (cls || '') }, h('span', { class: 'k' }, k), h('span', { class: 'lead' }), h('span', { class: 'v' }, v));
  const lv = App.A.sehat.find((x) => x.id === 'bep');
  const mk = b.avgPrice > 0 ? (b.avgPrice - b.avgHpp) / b.avgPrice : 0;
  el.replaceChildren(
    h('div', { class: 'kicker' }, 'Ringkasan langsung'),
    h('div', { class: 'nota' },
      rd('Modal awal', fRpC(m.modalAwal)),
      rd('Harga rata-rata', fRp(b.avgPrice)),
      rd('HPP rata-rata', fRp(b.avgHpp)),
      rd('Margin kotor', fPct(mk, 1)),
      rd('Biaya tetap', fRpC(b.tetap) + '/bln'),
      rd('Penyusutan', fRpC(b.dep) + '/bln'),
      h('hr', { class: 'dbl' }),
      rd('BEP', b.layak ? fInt(b.bepUnit) + ' unit/bln' : 'tidak ada', 'tot'),
      rd('Target', fInt(b.targetUnit) + ' unit/bln'),
      rd('Mulai untung', m.untungBulan ? 'bulan ke-' + m.untungBulan : 'belum'),
      rd('Balik modal', m.payback ? 'bulan ke-' + m.payback.bulan : 'belum', 'tot')),
    b.layak && b.targetUnit > 0
      ? h('div', { class: 'lv-' + lv.level, style: 'display:grid;gap:7px' },
        h('div', { class: 'meter', role: 'img', 'aria-label': 'BEP ' + fPct(b.rasio, 0) + ' dari target penjualan' }, h('i', { style: 'width:' + Math.min(100, b.rasio * 100) + '%' })),
        h('div', { style: 'display:flex;flex-wrap:wrap;gap:6px 10px;align-items:center' }, chip(lv.level), h('span', { class: 'small' }, 'BEP = ' + fPct(b.rasio, 0) + ' dari target penjualan')))
      : h('p', { class: 'note-bad' }, b.layak ? 'Isi target penjualan di langkah 4.' : 'Margin per unit nol atau minus, BEP tidak bisa dihitung. Periksa harga dan HPP di langkah 2.'),
    h('button', { type: 'button', class: 'btn pri', onclick: () => goStep(4) }, 'Lihat hasil lengkap'));
}
