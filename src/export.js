/* ===== export: simpan berkas, Excel, ringkasan teks, JSON ===== */
let _dlP = null;
/* hanya dipakai di halaman artifact claude.ai, yang tidak mengizinkan unduhan biasa */
function dapatkanUnduh() {
  if (_dlP) return _dlP;
  const c = window.claude;
  /* bila pembungkus belum siap, jangan simpan hasil kosong; coba lagi pada klik berikutnya */
  if (!c || typeof c.use !== 'function') return Promise.resolve(null);
  _dlP = Promise.resolve(c.use('downloads')).then((d) => d || null, () => null);
  return _dlP;
}
const slugNama = () => (App.s.nama || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'proyeksi-bisnis';

/* unduhan biasa lewat Blob dan tautan download (semua peramban modern, termasuk iOS 13+) */
function unduhBlob(nama, data, mime) {
  const blob = new Blob([data], { type: mime || 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: nama, style: 'display:none', rel: 'noopener' });
  (App.root || document.body).append(a);
  a.click();
  setTimeout(() => { a.remove(); URL.revokeObjectURL(url); }, 5000);
}

async function simpanBerkas(nama, data, mime) {
  if (SEBAGAI_ARTIFACT) {
    const dl = await dapatkanUnduh();
    if (!dl) { toast('Unduhan tidak tersedia di tampilan ini. Pakai Salin ringkasan.'); return false; }
    try {
      await dl.save({ filename: nama, data });
      toast('Berkas ' + nama + ' siap disimpan');
      return true;
    } catch (e) {
      if (!e || e.code !== 'declined') toast('Berkas tidak bisa diunduh. Coba lagi.');
      return false;
    }
  }
  try {
    unduhBlob(nama, data, mime);
    toast('Berkas ' + nama + ' diunduh');
    return true;
  } catch (e) {
    lapor(e);
    toast('Peramban ini tidak mengizinkan unduhan. Pakai Salin ringkasan.');
    return false;
  }
}

/* pustaka Excel dimuat saat dibutuhkan: dari konfigurasi, dari folder vendor/ di samping kpb.js, lalu dari CDN */
let _xlsxP = null;
function muatXLSX() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (_xlsxP) return _xlsxP;
  const urut = [];
  if (CFG.xlsxSrc) urut.push(CFG.xlsxSrc);
  if (!SEBAGAI_ARTIFACT && ALAMAT_DASAR) urut.push(ALAMAT_DASAR + 'vendor/xlsx.mini.min.js');
  /* CDN hanya untuk tampilan artifact, yang tidak punya folder vendor/; paket mandiri tidak pernah menghubungi pihak ketiga */
  if (SEBAGAI_ARTIFACT) urut.push('https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js');
  const coba = (i) => new Promise((ok, gagal) => {
    if (i >= urut.length) { gagal(new Error('xlsx')); return; }
    const sc = document.createElement('script');
    sc.src = urut[i];
    sc.onload = () => (window.XLSX ? ok(window.XLSX) : coba(i + 1).then(ok, gagal));
    sc.onerror = () => { sc.remove(); coba(i + 1).then(ok, gagal); };
    document.head.append(sc);
  });
  _xlsxP = coba(0).catch((e) => { _xlsxP = null; throw e; });
  return _xlsxP;
}

function bukuKerja(XLSX) {
  const A = App.A, s = A.s, b = A.bep, m = A.m, a = s.asumsi, wb = XLSX.utils.book_new();
  const r0 = (v) => Math.round(v);
  const N = (v, z) => ({ t: 'n', v, z: z || '#,##0' });
  const P = (v) => (v == null ? '-' : { t: 'n', v, z: '0.0%' });
  const lembar = (nama, aoa, lebar) => {
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = lebar.map((w) => ({ wch: w }));
    /* angka polos diberi format ribuan; angka desimal tetap terbaca */
    Object.keys(ws).forEach((k) => {
      const c = ws[k];
      if (k[0] !== '!' && c && c.t === 'n' && !c.z) c.z = Number.isInteger(c.v) ? '#,##0' : '#,##0.00';
    });
    XLSX.utils.book_append_sheet(wb, ws, nama);
  };
  const tglBuat = new Date();

  lembar('Ringkasan', [
    [s.nama || 'Proyeksi bisnis'],
    ['Proyeksi ' + s.periode + ' bulan, mulai ' + KPB.labelBulan(s, 1)],
    [],
    ['Ukuran', 'Nilai'],
    ['Modal awal (Rp)', N(r0(m.modalAwal))],
    ['Harga jual rata-rata (Rp)', N(r0(b.avgPrice))],
    ['HPP rata-rata per unit (Rp)', N(r0(b.avgHpp))],
    ['Biaya tetap per bulan (Rp)', N(r0(b.tetap))],
    ['Penyusutan per bulan (Rp)', N(r0(b.dep))],
    ['Biaya ikut omzet (% omzet)', N(KPB.persenOmzet(s), '0.0')],
    ['Target penjualan (unit per bulan)', N(r0(b.targetUnit))],
    ['BEP (unit per bulan)', b.layak ? N(r0(b.bepUnit)) : 'tidak ada'],
    ['BEP (omzet per bulan, Rp)', b.layak ? N(r0(b.bepRp)) : 'tidak ada'],
    ['Jarak aman dari target', b.layak ? P(b.mos) : '-'],
    ['Mulai untung (bulan ke-)', m.untungBulan || 'belum'],
    ['Balik modal (bulan ke-)', m.payback ? m.payback.bulan : 'belum'],
    ['Total laba bersih (Rp)', N(r0(m.totalNet))],
    ['ROI (total laba / modal awal)', P(m.roi)],
    ['NPV (Rp)', N(r0(m.npv))],
    ['IRR per tahun', P(m.irr)],
    ['Kebutuhan kas terdalam (Rp)', N(r0(m.kasButuh))],
    [],
    ['Catatan'],
    ['Hasil adalah proyeksi dari asumsi yang diisi pengguna, bukan jaminan. Pajak disederhanakan: satu tarif atas laba, tanpa koreksi fiskal.'],
    ['Dibuat ' + tglBuat.getDate() + ' ' + KPB.BLN[tglBuat.getMonth()] + ' ' + tglBuat.getFullYear() + ' dengan ' + (CFG.merek || 'Proyeksi Bisnis') + ' versi ' + VERSI_APP + '.'],
  ], [42, 24]);

  const asum = [['Investasi awal', 'Nilai (Rp)', 'Umur manfaat (tahun)']];
  s.investasi.forEach((i) => asum.push([i.nama, N(r0(i.nilai)), i.umur]));
  asum.push(['Modal kerja', N(r0(s.modalKerja))], [], ['Biaya tetap per bulan', 'Nilai (Rp)']);
  s.biayaTetap.forEach((t) => asum.push([t.nama, N(r0(t.nilai))]));
  if (s.biayaOmzet.length) { asum.push([], ['Biaya yang ikut omzet', '% omzet']); s.biayaOmzet.forEach((x) => asum.push([x.nama, N(x.persen, '0.0')])); }
  asum.push([], ['Asumsi', 'Nilai'],
    ['Penjualan bulan pertama (% target)', a.rampAwal], ['Target tercapai di bulan ke-', a.rampBulan], ['Pertumbuhan setelah itu (% per bulan)', a.tumbuh], ['Batas pertumbuhan (% target)', a.batasTumbuh],
    ['Kenaikan harga jual (% per tahun)', a.naikHarga], ['Kenaikan HPP (% per tahun)', a.naikBiaya], ['Kenaikan biaya tetap (% per tahun)', a.naikTetap],
    ['Jenis pajak', (KPB.PAJAK[a.pajakPreset] || { nama: 'Manual' }).nama], ['PPh final atas omzet (%)', a.pajakOmzet], ['Omzet bebas pajak (Rp per tahun)', N(r0(a.pajakBebas))], ['Pajak atas laba (%)', a.pajakLaba],
    ['Imbal hasil yang diharapkan (% per tahun)', a.diskon], ['Nilai sisa (% modal awal)', a.nilaiSisa],
    ['Stok (hari)', a.stokHari], ['Piutang (hari)', a.piutangHari], ['Hutang dagang (hari)', a.hutangHari],
    ['Kapasitas maksimal (unit per bulan)', a.kapasitas > 0 ? N(r0(a.kapasitas)) : 'tanpa batas'],
    ['Pola musiman', a.musimanAktif ? a.musiman.map((x, i) => KPB.BLN[i] + ' ' + x + '%').join(', ') : 'tidak dipakai']);
  lembar('Asumsi', asum, [44, 22, 22]);

  lembar('HPP per Produk', [['Produk', 'Harga jual', 'Bahan baku', 'Biaya langsung lain', 'HPP', 'Biaya penjualan', 'Biaya ikut omzet', 'Margin kotor', 'Margin kotor %', 'Margin kontribusi', 'Margin kontribusi %', 'Target unit/bulan']]
    .concat(s.produk.map((p, i) => { const u = A.unitP[i]; return [p.nama, N(r0(u.harga)), N(r0(u.bahan)), N(r0(u.lain)), N(r0(u.hpp)), N(r0(u.feeSendiri)), N(r0(u.feeOmzet)), N(r0(u.margKotor)), P(u.margKotorPct), N(r0(u.kontribusi)), P(u.cmPct), N(p.volume)]; })),
  [28, 12, 12, 18, 12, 16, 16, 14, 14, 18, 20, 16]);

  const bahan = [['Produk', 'Bahan', 'Harga beli', 'Isi per pembelian', 'Satuan beli', 'Dipakai per produk', 'Satuan pakai', 'Biaya per produk']];
  s.produk.forEach((p) => p.bahan.forEach((x) => bahan.push([p.nama, x.nama, N(x.harga), N(x.isi, '#,##0.###'), x.satuan, N(x.pakai, '#,##0.###'), x.satuanPakai || x.satuan, N(r0(KPB.biayaBahan(x)))])));
  lembar('Rincian Bahan', bahan, [26, 26, 14, 16, 12, 18, 14, 16]);

  const tahunBaris = [['Pendapatan', 'rev'], ['HPP', 'cogs'], ['Laba kotor', 'kotor'], ['Biaya penjualan', 'jual'], ['Margin kontribusi', 'kontribusi'],
    ['Biaya tetap', 'tetap'], ['Penyusutan', 'dep'], ['Laba operasional', 'ebit'], ['Pajak', 'pajak'], ['Laba bersih', 'net'], ['Tambahan modal kerja', 'dnwc'], ['Arus kas', 'cf'], ['Kumulatif (setelah modal awal)', 'cum']];
  lembar('Laba Rugi Tahunan', [['Rupiah'].concat(A.tahun.map((y) => 'Tahun ' + y.tahun + (y.bulan < 12 ? ' (' + y.bulan + ' bln)' : '')))]
    .concat(tahunBaris.map(([n, k]) => [n].concat(A.tahun.map((y) => N(r0(y[k])))))), [30, 18, 18, 18, 18, 18]);

  lembar('Laba Rugi Bulanan', [['Bulan ke-', 'Periode', 'Unit', 'Pendapatan', 'HPP', 'Laba kotor', 'Biaya penjualan', 'Biaya tetap', 'Penyusutan', 'Laba operasional', 'Pajak', 'Laba bersih', 'Tambahan modal kerja', 'Arus kas', 'Kumulatif', 'Dibatasi kapasitas']]
    .concat(A.rows.map((r) => [r.m, r.label, N(r0(r.units)), N(r0(r.rev)), N(r0(r.cogs)), N(r0(r.kotor)), N(r0(r.jual)), N(r0(r.tetap)), N(r0(r.dep)), N(r0(r.ebit)), N(r0(r.pajak)), N(r0(r.net)), N(r0(r.dnwc)), N(r0(r.cf)), N(r0(r.cum)), r.terbatas ? 'ya' : ''])),
  [10, 12, 10, 16, 16, 16, 16, 16, 14, 16, 12, 16, 18, 16, 16, 16]);

  const sken = [['Skenario', 'BEP (unit/bulan)', 'Laba bersih bulan ke-12', 'Total laba bersih', 'Balik modal (bulan ke-)', 'NPV']];
  KPB.SKENARIO.forEach((k) => { const r = KPB.ringkas(s, k.mult); sken.push([k.nama + ' (' + k.ket + ')', r.b.bepUnit == null ? '-' : N(r0(r.b.bepUnit)), N(r0(r.m.labaBulan12)), N(r0(r.m.totalNet)), r.m.payback ? r.m.payback.bulan : 'belum', N(r0(r.m.npv))]); });
  const sens = KPB.sensitivitas(s);
  sken.push([], ['Sensitivitas: tiap faktor diubah ' + Math.round(sens.d * 100) + '% sendirian', 'Turun: perubahan laba total', 'Turun: balik modal', 'Naik: perubahan laba total', 'Naik: balik modal']);
  sens.out.forEach((o) => sken.push([o.nama, N(r0(o.lo.delta)), o.lo.payback ? o.lo.payback.bulan : 'belum', N(r0(o.hi.delta)), o.hi.payback ? o.hi.payback.bulan : 'belum']));
  lembar('Skenario', sken, [52, 22, 24, 22, 24, 18]);

  const cek = [['Pemeriksaan', 'Status', 'Keterangan']];
  A.sehat.forEach((x) => { const t = teksSehat(x, A); cek.push([t[0], LEVEL_TEKS[x.level], t[1]]); });
  A.periksa.filter((x) => PETA_PERIKSA[x.id]).forEach((x) => { const pt = PETA_PERIKSA[x.id]; cek.push([pt[1], x.level === 'warn' ? 'Cek' : 'Saran', pt[2](x)]); });
  lembar('Pemeriksaan', cek, [40, 12, 110]);

  wb.Props = { Title: 'Proyeksi Bisnis - ' + (s.nama || ''), Author: CFG.merek || 'Proyeksi Bisnis', CreatedDate: tglBuat };
  return wb;
}

async function unduhExcel() {
  emit('unduh_excel');
  toast('Menyiapkan Excel...');
  let XLSX;
  try { XLSX = await muatXLSX(); } catch (e) {
    toast('Pustaka Excel gagal dimuat. Periksa koneksi lalu coba lagi, atau pakai Salin ringkasan.', { lama: 6000 });
    return;
  }
  try {
    const buf = XLSX.write(bukuKerja(XLSX), { type: 'array', bookType: 'xlsx' });
    await simpanBerkas('proyeksi-' + slugNama() + '.xlsx', buf, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  } catch (e) {
    lapor(e);
    toast('Excel gagal dibuat. Coba lagi atau pakai Salin ringkasan.');
  }
}

function ringkasanTeks() {
  const A = App.A, s = A.s, b = A.bep, m = A.m, a = s.asumsi, L = [];
  L.push('PROYEKSI BISNIS: ' + (s.nama || 'Usaha').toUpperCase());
  L.push('Periode ' + s.periode + ' bulan, mulai ' + KPB.labelBulan(s, 1), '');
  L.push('Modal awal: ' + fRp(m.modalAwal));
  s.produk.forEach((p, i) => {
    const u = A.unitP[i];
    L.push('- ' + (p.nama || 'Produk') + ': harga ' + fRp(u.harga) + ', HPP ' + fRp(u.hpp) + ', margin kotor ' + fPct(u.margKotorPct, 0) + ', kontribusi ' + fRp(u.kontribusi) + ' per unit');
  });
  L.push('Biaya tetap + penyusutan: ' + fRp(b.fc) + ' per bulan');
  const eks = KPB.persenOmzet(s);
  if (eks > 0) L.push('Biaya ikut omzet: ' + fDec(eks, 1) + '% dari omzet');
  L.push(b.layak ? 'BEP: ' + fInt(b.bepUnit) + ' unit per bulan (omzet ' + fRp(b.bepRp) + '), ' + fPct(b.rasio, 0) + ' dari target ' + fInt(b.targetUnit) + ' unit' : 'BEP: tidak ada (margin per unit nol atau minus)');
  L.push('Mulai untung: ' + (m.untungBulan ? 'bulan ke-' + m.untungBulan : 'belum dalam ' + s.periode + ' bulan'));
  L.push('Balik modal: ' + (m.payback ? 'bulan ke-' + m.payback.bulan + ' (' + lama(m.payback.bulan) + ')' : 'belum dalam ' + s.periode + ' bulan'));
  L.push('Total laba bersih ' + s.periode + ' bulan: ' + fRp(m.totalNet));
  L.push('ROI ' + (m.roi == null ? '-' : fPct(m.roi, 0)) + ', NPV ' + fRp(m.npv) + ', IRR ' + (m.irr == null ? '-' : fPct(m.irr, 0) + ' per tahun'));
  L.push('Pajak: ' + (KPB.PAJAK[a.pajakPreset] || { nama: 'manual' }).nama);
  L.push('', 'Proyeksi dari asumsi yang diisi sendiri, bukan jaminan hasil.');
  /* teks polos untuk papan klip: spasi tak terputus dari tampilan diganti spasi biasa */
  return L.join('\n').replace(/\u00A0/g, ' ');
}
async function salinRingkasan() {
  emit('salin_ringkasan');
  const teks = ringkasanTeks();
  if (!(await salin(teks, 'Ringkasan tersalin'))) kotakSalin(teks);
}

function unduhJson() {
  emit('unduh_json');
  const isi = JSON.stringify({ app: 'proyeksi-bisnis', v: KPB.VERSI_DATA, versiApp: VERSI_APP, dibuat: new Date().toISOString(), data: App.s }, null, 2);
  simpanBerkas('data-' + slugNama() + '.json', isi, 'application/json').then((ok) => { if (ok) App.belumDiunduh = false; });
}

/* membuka berkas cadangan: mengganti data yang sedang dikerjakan, dengan pilihan Urungkan */
function bukaJson(file) {
  if (!file) return;
  if (file.size > 3e6) { toast('Berkas terlalu besar untuk data proyeksi (maksimal 3 MB).'); return; }
  const fr = new FileReader();
  fr.onerror = () => toast('Berkas tidak bisa dibaca. Coba pilih ulang.');
  fr.onload = () => {
    let o;
    try { o = JSON.parse(String(fr.result)); } catch (e) { toast('Isi berkas bukan JSON yang valid. Pilih berkas .json yang disimpan dari aplikasi ini.', { lama: 5000 }); return; }
    const amplop = o && typeof o === 'object' && o.app === 'proyeksi-bisnis' && o.data && typeof o.data === 'object';
    const data = amplop ? o.data : o;
    if (!data || typeof data !== 'object' || (!Array.isArray(data.produk) && !data.asumsi)) { toast('Berkas ini bukan data dari aplikasi ini.', { lama: 5000 }); return; }
    const versi = Number(amplop ? o.v : data.v) || 1;
    let baru;
    try { baru = KPB.normalisasi(data); } catch (e) { lapor(e); toast('Data di dalam berkas tidak bisa dibaca.'); return; }
    baru.contoh = false;
    gantiData(baru, 'Data dibuka: ' + (baru.nama || 'tanpa nama') + (versi > KPB.VERSI_DATA ? '. Berkas dibuat versi lebih baru, sebagian isian mungkin diabaikan.' : ''), { langkah: 0, lama: versi > KPB.VERSI_DATA ? 9000 : 7000 });
    emit('data_dibuka');
  };
  fr.readAsText(file);
}
