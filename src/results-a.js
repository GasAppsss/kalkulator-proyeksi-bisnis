/* ===== results-a: langkah 5 (BEP dan laba rugi) ===== */
Object.assign(App.ui, { targetLaba: 5000000, sim: { harga: 0, volume: 0, hpp: 0, tetap: 0 }, bulanan: false });
const cRpF = (v) => ({ t: fRp(v), neg: Math.round(v) < 0 });
const ttd = (v) => (Math.round(v) > 0 ? '+' : Math.round(v) < 0 ? '−' : '');
const bulanTeks = (p) => (p ? 'Bulan ke-' + p.bulan : 'Belum');

function teksSehat(x, A) {
  const s = A.s, b = A.bep, m = A.m;
  const pilih = (peta) => peta[x.level];
  switch (x.id) {
    case 'margin':
      return ['Margin kotor ' + fPct(x.nilai, 0), (x.nilai < 0 ? 'Dari tiap Rp100 penjualan, HPP lebih besar sekitar Rp' + fDec(-x.nilai * 100, 0) + '. ' : 'Dari tiap Rp100 penjualan, sekitar Rp' + fDec(x.nilai * 100, 0) + ' tersisa setelah HPP. ') + pilih({
        good: 'Ruangnya lebar untuk biaya tetap dan laba.', warn: 'Cukup, tetapi mudah tergerus kenaikan harga bahan.',
        serious: 'Tipis. Pertimbangkan menaikkan harga atau menekan HPP.', crit: 'Harga jual di bawah HPP, setiap penjualan menambah rugi.' })];
    case 'bep':
      if (!b.layak) return ['BEP tidak bisa dihitung', 'Margin per unit nol atau minus. Naikkan harga atau turunkan HPP di langkah 2.'];
      return ['BEP ' + fPct(x.nilai, 0) + ' dari target', pilih({
        good: 'Aman. Masih ada ruang bila penjualan meleset dari target.', warn: 'Cukup. Penjualan sebaiknya tidak turun jauh dari target.',
        serious: 'Tipis. Penjualan meleset sedikit saja bisa membuat rugi.', crit: 'Target penjualan belum menutup BEP. Usaha rugi walau sudah stabil.' })];
    case 'payback':
      if (x.nilai == null) return ['Belum balik modal', 'Dalam ' + s.periode + ' bulan modal belum kembali. Naikkan penjualan atau harga, atau kurangi investasi dan biaya tetap.'];
      return ['Balik modal ' + lama(x.nilai), pilih({ good: 'Cepat, kurang dari 2 tahun.', warn: 'Wajar untuk banyak usaha, tetapi uang terikat cukup lama.', serious: 'Lama. Risiko kondisi berubah sebelum modal kembali.' })];
    case 'kas': {
      const wc = s.asumsi.stokHari + s.asumsi.piutangHari + s.asumsi.hutangHari > 0;
      const catatan = wc ? ' Sudah termasuk uang yang tertahan di stok dan piutang.' : ' Stok dan piutang belum dihitung; isi di langkah 4 bila ada.';
      return x.level === 'good'
        ? ['Modal kerja cukup', (m.kasButuh > 0 ? 'Kas paling tipis sekitar ' + fRp(m.kasButuh) + ' di bulan ke-' + m.kasTerendahBulan + ', masih tertutup modal kerja Anda.' : 'Tidak ada bulan dengan kas minus.') + catatan]
        : ['Modal kerja kurang', 'Kas bisa habis sekitar bulan ke-' + m.kasTerendahBulan + '. Siapkan minimal ' + fRp(m.kasButuh) + ' (modal kerja Anda ' + fRp(s.modalKerja) + ').' + catatan];
    }
    case 'produk':
      return x.level === 'good' ? ['Semua produk untung per unit', 'Margin kontribusi tiap produk positif.'] : ['Ada produk dijual rugi', x.daftar.join(', ') + ': harga lebih kecil dari HPP dan biaya penjualan.'];
    case 'kapasitas':
      if (x.level === 'crit') return ['BEP di atas kapasitas', 'BEP ' + fInt(b.bepUnit) + ' unit per bulan melebihi kapasitas ' + fInt(s.asumsi.kapasitas) + ' unit. Naikkan kapasitas, turunkan biaya tetap, atau perbesar margin.'];
      return ['Kapasitas terpakai ' + fPct(x.nilai, 0) + ' dari target', pilih({ good: 'Masih ada ruang untuk tumbuh.', warn: 'Hampir penuh. Pertumbuhan berikutnya butuh tambahan kapasitas.', serious: 'Target melebihi kapasitas, jadi penjualan di proyeksi dibatasi dan laba lebih kecil dari yang Anda targetkan.' })];
    default: {
      const final = s.asumsi.pajakOmzet > 0;
      if (x.level === 'good') return final ? ['Omzet di bawah batas PPh final', 'Omzet tahunan masih di bawah Rp4,8 miliar.'] : ['Omzet di bawah batas fasilitas Pasal 31E', 'Omzet tahunan masih di bawah Rp4,8 miliar, jadi seluruh laba memakai tarif efektif.'];
      return final
        ? ['Omzet melewati batas PPh final', 'Di tahun ke-' + x.nilai + ' omzet melewati Rp4,8 miliar. Fasilitas 0,5% tidak berlaku di atas batas itu, hitung ulang dengan tarif umum.']
        : ['Omzet melewati Rp4,8 miliar', 'Di tahun ke-' + x.nilai + ' omzet melewati Rp4,8 miliar. Pengurangan tarif Pasal 31E hanya untuk bagian omzet sampai batas itu, jadi tarif efektif sebenarnya lebih tinggi dari yang dihitung.'];
    }
  }
}
function daftarSehat(A) {
  return h('ul', { class: 'cekl' }, A.sehat.map((x) => {
    const t = teksSehat(x, A);
    return h('li', null, h('div', null, chip(x.level)), h('div', { class: 't' }, h('b', null, t[0] + '. '), t[1]));
  }));
}

/* isian yang sering terlewat; tiap butir mengarah ke langkah tempat memperbaikinya */
const PETA_PERIKSA = {
  harga0: [1, 'Harga jual belum diisi', (x) => x.daftar.join(', ') + ': harga jual masih 0, jadi margin dan BEP tidak bermakna.'],
  hargaKecil: [1, 'Harga jual di bawah Rp100', (x) => x.daftar.join(', ') + '. Pastikan satuannya benar dan bukan dalam ribuan.'],
  hpp0: [1, 'HPP masih nol', (x) => x.daftar.join(', ') + ': belum ada bahan atau biaya produksi, sehingga margin terlihat 100%.'],
  isi0: [1, 'Isi per pembelian bernilai 0', (x) => 'Biaya bahan dihitung 0 untuk: ' + x.daftar.join('; ') + '. Isi jumlah isi per pembelian.'],
  margin90: [1, 'Margin kotor di atas 90%', (x) => x.daftar.join(', ') + '. Periksa apakah semua bahan, kemasan, dan upah langsung sudah dimasukkan.'],
  omzet100: [2, 'Biaya ikut omzet 100% atau lebih', (x) => 'Totalnya ' + fDec(x.nilai, 0) + '% dari omzet, sehingga tiap penjualan pasti rugi. Periksa persennya.'],
  tetap0: [2, 'Biaya tetap belum diisi', () => 'Hampir semua usaha punya gaji, sewa, atau listrik. Tanpa itu BEP terlihat terlalu mudah.'],
  gajiPemilik: [2, 'Gaji Anda sendiri sudah dihitung?', () => 'Bila Anda bekerja penuh di usaha ini, masukkan gaji pemilik sebagai biaya tetap agar laba tidak terlihat lebih besar dari kenyataan.'],
  volume0: [3, 'Target penjualan belum diisi', () => 'Tanpa target penjualan, jarak aman, laba, dan balik modal tidak bisa dinilai.'],
  modal0: [0, 'Modal awal masih 0', () => 'ROI, NPV, dan balik modal tidak bermakna tanpa modal awal.'],
  pajakTanpa: [3, 'Pajak belum dihitung', () => 'Laba sebenarnya lebih kecil setelah pajak. Pilih jenis pajak di langkah 4.'],
  musimRata: [3, 'Rata-rata faktor musiman bukan 100%', (x) => 'Rata-ratanya ' + fDec(x.nilai, 0) + '%, jadi total penjualan setahun tidak sama dengan target. Gunakan Normalkan di langkah 4 bila tidak disengaja.'],
};
function daftarPeriksa(A, o) {
  o = o || {};
  const ada = A.periksa.filter((x) => PETA_PERIKSA[x.id]);
  if (!ada.length) return null;
  return [h('h3', { class: 'h3' }, 'Periksa isian Anda'),
    h('p', { class: 'small' }, 'Hal-hal ini sering terlewat. Hasil tetap dihitung, tetapi cek dulu sebelum mempercayai angkanya.'),
    h('ul', { class: 'cekl' }, ada.map((x) => {
      const [langkah, judul, uraian] = PETA_PERIKSA[x.id];
      return h('li', null,
        h('div', null, x.level === 'warn' ? chip('warn', 'Cek') : h('span', { class: 'tag' }, 'Saran')),
        h('div', { class: 't' }, h('b', null, judul + (/[?.!]$/.test(judul) ? ' ' : '. ')), uraian(x), ' ',
          o.tanpaTombol ? ('(langkah ' + (langkah + 1) + ')') : h('button', { type: 'button', class: 'btn sm lnk', onclick: () => goStep(langkah) }, 'Buka langkah ' + (langkah + 1))));
    }))];
}

function vonis5(A) {
  const b = A.bep, m = A.m, s = A.s, k = [];
  if (b.layak) k.push('Usaha ini impas di ', h('em', null, h('span', { class: 'nw' }, fInt(b.bepUnit) + ' unit'), ' per bulan'), ' (', h('span', { class: 'nw' }, 'omzet ' + fRpC(b.bepRp)), '). ');
  else k.push(h('em', null, 'Usaha ini belum bisa impas'), ' karena margin per unit nol atau minus. ');
  if (m.untungBulan) k.push('Mulai untung di ', h('em', { class: 'nw' }, 'bulan ke-' + m.untungBulan), ' (', h('span', { class: 'nw' }, A.rows[m.untungBulan - 1].label), ').');
  else k.push('Belum untung dalam ' + s.periode + ' bulan.');
  return h('p', { class: 'verdict' }, k);
}

/* kartu=true di layar (kolom sempit jadi kartu per produk); laporan cetak memakai tabel biasa */
function tabelBEPProduk(B, kartu) {
  const rows = B.produk.map((p) => bariT([p.nama || 'Produk', fRp(p.price), cRpF(p.cm), fInt(p.v) + ' unit', B.layak ? fInt(p.bepUnit) + ' unit' : '-', B.layak ? fRp(p.bepRp) : '-']));
  rows.push(bariT(['Total', '', '', fInt(B.targetUnit) + ' unit', B.layak ? fInt(B.bepUnit) + ' unit' : '-', B.layak ? fRp(B.bepRp) : '-'], true));
  return tabel(['Produk', 'Harga jual', 'Margin kontribusi / unit', 'Target / bulan', 'BEP / bulan', 'Omzet BEP / bulan'], rows, { label: 'BEP per produk', kartu: !!kartu });
}

function kalkTarget(B) {
  const ui = App.ui, hasil = h('div', { class: 'tiles' });
  const hitung = () => {
    const u = B.unitUntukLaba(ui.targetLaba);
    hasil.replaceChildren(...(u == null
      ? [h('p', { class: 'note-bad' }, 'Tidak bisa dihitung: margin per unit nol atau minus.')]
      : [tile('Penjualan yang dibutuhkan', fInt(u) + ' unit', 'per bulan, sekitar ' + fInt(u / 30) + ' unit per hari'),
        tile('Omzet yang dibutuhkan', fRp(u * B.avgPrice), 'per bulan'),
        tile('Dibanding target Anda', B.targetUnit > 0 ? fPct(u / B.targetUnit, 0) : '-', B.targetUnit >= u ? 'Target penjualan Anda sudah cukup' : 'Target penjualan Anda belum cukup')]));
  };
  hitung();
  return [fld('Laba yang diinginkan per bulan (sebelum pajak)', inRp(ui, 'targetLaba', 'f-tl', null, hitung), { pre: 'Rp', hint: 'Dihitung dengan harga dan bauran produk hari ini.' }), hasil];
}

function tabelLabaRugi(A, bulanan) {
  if (bulanan) {
    return tabel(['Bulan', 'Unit', 'Pendapatan', 'HPP', 'Laba kotor', 'Biaya jual', 'Biaya tetap', 'Penyusutan', 'Laba operasional', 'Pajak', 'Laba bersih'],
      A.rows.map((r) => bariT([r.m + ' · ' + r.label, fInt(r.units), cRp(r.rev), cRp(r.cogs), cRp(r.kotor), cRp(r.jual), cRp(r.tetap), cRp(r.dep), cRp(r.ebit), cRp(r.pajak), cRp(r.net)])), { tall: true, label: 'Laba rugi per bulan' });
  }
  const T = A.tahun, tot = (k) => KPB.sum(T.map((y) => y[k]));
  const baris = (nama, k, kuat) => bariT([nama].concat(T.map((y) => cRp(y[k])), [cRp(tot(k))]), kuat);
  const head = ['Rupiah'].concat(T.map((y) => 'Tahun ' + y.tahun + (y.bulan < 12 ? ' (' + y.bulan + ' bln)' : '')), ['Total ' + A.rows.length + ' bln']);
  return tabel(head, [
    baris('Pendapatan', 'rev', true), baris('−\u00A0HPP', 'cogs'), baris('=\u00A0Laba kotor', 'kotor', true),
    baris('−\u00A0Biaya penjualan', 'jual'), baris('=\u00A0Margin kontribusi', 'kontribusi', true),
    baris('−\u00A0Biaya tetap', 'tetap'), baris('−\u00A0Penyusutan', 'dep'), baris('=\u00A0Laba operasional', 'ebit', true),
    baris('−\u00A0Pajak', 'pajak'), baris('=\u00A0Laba bersih', 'net', true),
    bariT(['Margin bersih'].concat(T.map((y) => fPct(y.margNet, 1)), [fPct(tot('rev') > 0 ? tot('net') / tot('rev') : 0, 1)]))], { label: 'Laba rugi per tahun' });
}

function seksiLabaRugi(A) {
  const kont = h('div');
  const bT = h('button', { type: 'button', 'aria-pressed': 'true' }, 'Per tahun');
  const bB = h('button', { type: 'button', 'aria-pressed': 'false' }, 'Per bulan');
  const tampil = (bulanan) => {
    App.ui.bulanan = bulanan;
    bT.setAttribute('aria-pressed', String(!bulanan)); bB.setAttribute('aria-pressed', String(bulanan));
    kont.replaceChildren(tabelLabaRugi(A, bulanan));
  };
  bT.onclick = () => tampil(false);
  bB.onclick = () => tampil(true);
  tampil(App.ui.bulanan);
  return seksi('Laba rugi',
    cara(par('Laba rugi menunjukkan apakah usaha untung selama periode tertentu. Dibaca dari atas ke bawah: pendapatan dikurangi HPP menjadi laba kotor, lalu dikurangi biaya lain sampai tersisa laba bersih.'),
      h('p', null, eq('Laba bersih = pendapatan − HPP − biaya penjualan − biaya tetap − penyusutan − pajak'))),
    chartLaba(A),
    h('div', { class: 'cc-head' }, h('h3', { class: 'h3' }, 'Tabel laba rugi'), h('div', { class: 'seg', role: 'group', 'aria-label': 'Periode tabel' }, bT, bB)),
    kont,
    h('p', { class: 'small' }, 'Penyusutan bukan uang keluar, tetapi tetap dihitung sebagai biaya agar laba tidak terlihat lebih besar dari kenyataan. Angka dalam Rupiah.'));
}

function buildStep5() {
  const A = App.A, B = A.bep, m = A.m, y1 = A.tahun[0];
  return [
    seksi('Apakah usaha ini sehat?',
      vonis5(A),
      h('div', { class: 'tiles' },
        tile('Titik impas (BEP)', B.layak ? fInt(B.bepUnit) + ' unit' : 'Tidak ada', B.layak ? 'per bulan, sekitar ' + fInt(B.bepUnit / 30) + ' unit per hari. Omzet ' + fRp(B.bepRp) + '.' : 'Margin per unit nol atau minus.', 'hero'),
        tile('Jarak aman', B.mos != null ? fPct(B.mos, 0) : '-', 'Penjualan boleh turun sebesar ini dari target sebelum mulai rugi.'),
        tile('Mulai untung', m.untungBulan ? 'Bulan ke-' + m.untungBulan : 'Belum', m.untungBulan ? A.rows[m.untungBulan - 1].label : 'Dalam ' + A.s.periode + ' bulan'),
        tile('Laba bersih tahun 1', fRpC(y1.net), 'Margin bersih ' + fPct(y1.margNet, 1) + ' dari omzet ' + fRpC(y1.rev))),
      daftarPeriksa(A),
      h('h3', { class: 'h3' }, 'Pemeriksaan kesehatan usaha'),
      daftarSehat(A)),
    seksi('Titik impas (BEP)',
      cara(par('BEP adalah penjualan minimum agar tidak rugi: seluruh biaya tetap tertutup oleh margin kontribusi.'),
        h('p', null, eq('BEP (unit) = (biaya tetap + penyusutan) ÷ margin kontribusi rata-rata per unit')),
        h('p', null, eq('BEP (rupiah) = BEP unit × harga rata-rata')),
        par('BEP dihitung sebelum pajak, memakai harga dan biaya hari ini (tanpa kenaikan) dan bauran penjualan sesuai target.')),
      chartBEP(B),
      h('h3', { class: 'h3' }, 'BEP per produk'),
      tabelBEPProduk(B, true),
      h('h3', { class: 'h3' }, 'Berapa penjualan untuk laba yang diinginkan?'),
      kalkTarget(B)),
    seksiLabaRugi(A),
  ];
}
