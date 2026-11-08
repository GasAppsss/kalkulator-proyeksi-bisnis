/* ===== report: laporan ringkas untuk dicetak atau disimpan sebagai PDF ===== */
/* Laporan dibangun dari pembuat tabel dan grafik yang sama dengan layar, lalu dibungkus jadi satu berkas HTML mandiri
   (gaya di dalamnya, font sistem). Dicetak lewat iframe tersembunyi; bila peramban tidak mengizinkan, diunduh sebagai .html. */
const CSS_LAPORAN = `
.kpb.laporan { background: #fff; color: #151A3A; font: 400 12.5px/1.5 system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; --font: system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif; max-width: 190mm; margin: 0 auto; padding: 8mm 0; }
.laporan h1 { font: 700 24px/1.15 var(--font); letter-spacing: -.02em; margin: 6px 0 4px; }
.laporan .kicker { color: #444A6C; }
.laporan .lap-sec { margin-top: 18px; display: grid; gap: 10px; break-inside: auto; }
.laporan .lap-sec > h2 { font: 700 16px/1.2 var(--font); border-bottom: 2px solid #151A3A; padding-bottom: 4px; break-after: avoid; }
.laporan .h3 { break-after: avoid; }
.laporan .tiles { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px 14px; }
.laporan .tile { padding: 8px 0 0; break-inside: avoid; }
.laporan .tile.hero { grid-column: auto; }
.laporan .tile .n, .laporan .tile.hero .n { font-size: 17px; font-weight: 600; letter-spacing: -.01em; margin: 6px 0 4px; }
.laporan .tile .n .sat { font-size: 11px; font-weight: 400; letter-spacing: 0; }
.laporan .verdict { font-size: 17px; font-weight: 400; letter-spacing: -.01em; max-width: none; }
.laporan .chart { --halo: #fff; }
.laporan .scroll, .laporan .scroll.tall { overflow: visible; max-height: none; border: 0; }
.laporan .geser { display: none; }
.laporan .dt { font-size: 10.5px; }
.laporan .dt th, .laporan .dt td { padding: 5px 7px; position: static; }
.laporan .dt thead th { position: static; white-space: normal; vertical-align: bottom; }
.laporan .dt th:first-child, .laporan .dt td:first-child { max-width: 190px; min-width: 0; }
.laporan table, .laporan figure, .laporan .cekl li, .laporan .chart { break-inside: avoid; }
.laporan .chart svg { width: 100%; height: auto; }
.laporan .cekl li { grid-template-columns: 96px minmax(0, 1fr); }
.laporan .kv { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 3px 16px; margin: 0; }
.laporan .kv dt { color: #444A6C; }
.laporan .kv dd { margin: 0; font: 600 12px var(--font); font-variant-numeric: tabular-nums; text-align: right; }
.laporan .lap-foot { margin-top: 20px; padding-top: 8px; border-top: 1px solid #C9CDE0; font-size: 11px; color: #444A6C; }
.laporan button { display: none; }
.laporan a { color: inherit; }
@page { size: A4; margin: 12mm 11mm; }
@media print { html, body { background: #fff; } .kpb.laporan { padding: 0; max-width: none; } }
`;

function bangunLaporan() {
  const A = App.A, s = A.s, B = A.bep, m = A.m, a = s.asumsi, y1 = A.tahun[0];
  const tgl = new Date();
  const tglTeks = tgl.getDate() + ' ' + KPB.BLN[tgl.getMonth()] + ' ' + tgl.getFullYear();
  const bagian = (judul, ...isi) => h('section', { class: 'lap-sec' }, h('h2', null, judul), isi);
  const kv = (baris) => h('dl', { class: 'kv' }, baris.filter(Boolean).map(([k, v]) => [h('dt', null, k), h('dd', null, v)]));
  const grafik = (kartu) => h('div', { class: 'chart' }, kartu.svg);
  const eks = KPB.persenOmzet(s);
  const pajakNama = (KPB.PAJAK[a.pajakPreset] || { nama: 'Manual' }).nama;

  const produk = tabel(['Produk', 'Harga jual', 'HPP', 'Biaya penjualan', 'Margin kontribusi', 'Target / bulan'],
    s.produk.map((p, i) => { const u = A.unitP[i]; return bariT([p.nama || 'Produk', fRp(u.harga), fRp(u.hpp), fRp(u.feeJual), cRpF(u.kontribusi), fInt(p.volume) + ' unit']); }), { label: 'Ringkasan produk' });

  const kota = [
    ['Modal awal (investasi + modal kerja)', fRp(m.modalAwal)],
    ['Biaya tetap per bulan', fRp(B.tetap)],
    ['Penyusutan per bulan', fRp(B.dep)],
    eks > 0 ? ['Biaya ikut omzet', fDec(eks, 1) + '% dari omzet'] : null,
    ['Penjualan bulan pertama', fDec(a.rampAwal, 0) + '% target; target tercapai bulan ke-' + a.rampBulan],
    ['Pertumbuhan setelah itu', fDec(a.tumbuh, 1) + '% per bulan, batas ' + fDec(a.batasTumbuh, 0) + '% target'],
    ['Kenaikan harga / HPP / biaya tetap', fDec(a.naikHarga, 1) + '% / ' + fDec(a.naikBiaya, 1) + '% / ' + fDec(a.naikTetap, 1) + '% per tahun'],
    ['Jenis pajak', pajakNama],
    a.stokHari + a.piutangHari + a.hutangHari > 0 ? ['Stok / piutang / hutang dagang', a.stokHari + ' / ' + a.piutangHari + ' / ' + a.hutangHari + ' hari'] : null,
    a.kapasitas > 0 ? ['Kapasitas maksimal', fInt(a.kapasitas) + ' unit per bulan'] : null,
    a.musimanAktif ? ['Pola musiman', 'dipakai (12 faktor bulanan)'] : null,
    ['Imbal hasil yang diharapkan', fDec(a.diskon, 1) + '% per tahun'],
  ];

  const ringkas = [
    h('p', { class: 'small' }, 'Periode ' + s.periode + ' bulan, mulai ' + KPB.labelBulan(s, 1) + '. Dibuat ' + tglTeks + '.'),
    vonis5(A),
    h('div', { class: 'tiles' },
      tile('Titik impas (BEP)', B.layak ? fInt(B.bepUnit) + ' unit' : 'Tidak ada', B.layak ? 'per bulan, omzet ' + fRp(B.bepRp) : 'Margin per unit nol atau minus.', 'hero'),
      tile('Jarak aman', B.mos != null ? fPct(B.mos, 0) : '-', 'dari target penjualan'),
      tile('Mulai untung', m.untungBulan ? 'Bulan ke-' + m.untungBulan : 'Belum', m.untungBulan ? A.rows[m.untungBulan - 1].label : 'Dalam ' + s.periode + ' bulan'),
      tile('Laba bersih tahun 1', fRpC(y1.net), 'Margin bersih ' + fPct(y1.margNet, 1))),
    tiles6(A),
  ];

  return h('div', { class: 'kpb laporan', 'data-theme': 'light' },
    h('header', null, h('div', { class: 'kicker' }, 'Laporan proyeksi bisnis'), h('h1', null, s.nama || 'Usaha')),
    bagian('Ringkasan', ringkas),
    bagian('Asumsi utama', produk, kv(kota)),
    bagian('Titik impas (BEP)', grafik(buatBEP(B, 700)), legenda(LEGENDA_BEP), h('h3', { class: 'h3' }, 'BEP per produk'), tabelBEPProduk(B)),
    bagian('Laba rugi', grafik(buatLaba(A, 700)), h('h3', { class: 'h3' }, 'Laba rugi per tahun'), tabelLabaRugi(A, false)),
    bagian('Arus kas dan balik modal', grafik(buatKas(A, 700)), legenda([{ warna: 'var(--neg)', label: 'Modal belum kembali' }, { warna: 'var(--pos)', label: 'Modal sudah kembali' }]), tabelArusKas(A)),
    bagian('Skenario dan sensitivitas', tabelSkenario(A), tabelSensitivitas(A)),
    bagian('Pemeriksaan', daftarPeriksa(A, { tanpaTombol: true }), h('h3', { class: 'h3' }, 'Kesehatan usaha'), daftarSehat(A)),
    h('footer', { class: 'lap-foot' },
      h('p', null, 'Laporan ini adalah proyeksi dari asumsi yang diisi sendiri oleh pengguna, bukan jaminan hasil dan bukan nasihat keuangan atau pajak. Pajak dihitung disederhanakan (satu tarif atas laba, tanpa koreksi fiskal); aturan terakhir diperiksa ' + TGL_ATURAN + '. Konsultasikan dengan akuntan atau konsultan pajak sebelum mengambil keputusan.'),
      h('p', null, 'Dibuat dengan ' + (CFG.merek || 'Proyeksi Bisnis') + ' versi ' + VERSI_APP + '.')));
}

function dokumenLaporan() {
  const isi = bangunLaporan();
  const judul = 'Laporan proyeksi bisnis: ' + (App.s.nama || 'Usaha');
  return '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'
    + judul.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c])) + '</title><style>' + KPB_CSS + CSS_LAPORAN
    + '</style></head><body style="margin:0;background:#fff">' + isi.outerHTML + '</body></html>';
}

/* Mengisi jendela (iframe atau tab) dengan laporan dari DOM, bukan dari teks HTML: gaya dipasang lewat adoptedStyleSheets, yang tetap
   berlaku di situs ber-CSP ketat (style-src 'self'); elemen <style> dari teks HTML akan diblokir di sana. Peramban lama memakai <style>. */
const DOK_KOSONG = '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Laporan</title></head><body></body></html>';
function pasangLaporan(w) {
  const isi = bangunLaporan();
  const d = w.document;
  d.title = 'Laporan proyeksi bisnis: ' + (App.s.nama || 'Usaha');
  const css = KPB_CSS + CSS_LAPORAN;
  let terpasang = false;
  try {
    if ('adoptedStyleSheets' in d && w.CSSStyleSheet && typeof w.CSSStyleSheet.prototype.replaceSync === 'function') {
      const lembar = new w.CSSStyleSheet();
      lembar.replaceSync(css);
      d.adoptedStyleSheets = [lembar];
      terpasang = true;
    }
  } catch (e) { terpasang = false; }
  if (!terpasang) { const st = d.createElement('style'); st.textContent = css; d.head.append(st); }
  d.body.style.margin = '0';
  d.body.style.background = '#fff';
  d.body.append(d.importNode(isi, true));
}

function unduhLaporan() {
  emit('unduh_laporan');
  let dok;
  try { dok = dokumenLaporan(); } catch (e) { lapor(e); toast('Laporan gagal dibuat. Coba Unduh Excel atau Salin ringkasan.'); return Promise.resolve(false); }
  return simpanBerkas('laporan-' + slugNama() + '.html', dok, 'text/html');
}

const adalahSafari = () => /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent || '');

function cetakLaporan() {
  emit('cetak_laporan');
  if (SEBAGAI_ARTIFACT) {
    toast('Mencetak langsung tidak tersedia di tampilan ini. Laporan diunduh sebagai .html; buka lalu cetak atau simpan sebagai PDF.', { lama: 7000 });
    unduhLaporan();
    return;
  }
  try { bangunLaporan(); } catch (e) { lapor(e); toast('Laporan gagal dibuat. Coba Unduh Excel atau Salin ringkasan.'); return; }
  const tabBaru = () => {
    const w = window.open('', '_blank');
    if (!w) { toast('Peramban memblokir jendela baru. Laporan diunduh sebagai .html; buka lalu cetak.', { lama: 7000 }); unduhLaporan(); return; }
    try {
      w.document.open(); w.document.write(DOK_KOSONG); w.document.close();
      pasangLaporan(w);
    } catch (e) { lapor(e); try { w.close(); } catch (x) { /* abaikan */ } toast('Laporan gagal dibuka di tab baru. Laporan diunduh sebagai .html; buka lalu cetak.', { lama: 7000 }); unduhLaporan(); return; }
    setTimeout(() => { try { w.focus(); w.print(); } catch (e) { /* pengguna bisa mencetak dari tab itu */ } }, 500);
  };
  /* Safari kadang mencetak halaman induk, bukan isi iframe; di sana pakai tab baru */
  if (adalahSafari()) { tabBaru(); return; }
  try {
    const f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true');
    f.title = 'Laporan untuk dicetak';
    f.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;height:1123px;border:0;visibility:hidden';
    f.srcdoc = DOK_KOSONG;
    f.onload = () => {
      let siap = true;
      try { pasangLaporan(f.contentWindow); } catch (e) { siap = false; lapor(e); }
      if (!siap) { f.remove(); tabBaru(); return; }
      setTimeout(() => {
        try {
          const w = f.contentWindow;
          w.addEventListener('afterprint', () => setTimeout(() => f.remove(), 500));
          w.focus(); w.print();
        } catch (e) { f.remove(); tabBaru(); }
      }, 350);
    };
    document.body.append(f);
    setTimeout(() => { if (f.parentNode) f.remove(); }, 180000);
  } catch (e) { tabBaru(); }
}
