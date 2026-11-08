/* ===== engine-a: perhitungan inti, tanpa DOM ===== */
const KPB = (() => {
  const NETRAL = { harga: 1, volume: 1, hpp: 1, tetap: 1 };
  const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  const n = (v, d = 0) => (typeof v === 'number' && isFinite(v) ? v : d);
  const sum = (a) => a.reduce((t, x) => t + n(x), 0);
  const ada = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  let _c = 0;
  const uid = () => 'k' + Date.now().toString(36).slice(-4) + (++_c).toString(36) + Math.random().toString(36).slice(2, 5);

  /* Preset pajak. Angka bawaan mengikuti ringkasan PP 20/2026 (PPh final UMKM 0,5%);
     semua bisa diubah pengguna. */
  const PAJAK = {
    'op-final': { nama: 'Orang pribadi: PPh final 0,5% dari omzet (omzet s.d. Rp500 juta/tahun bebas pajak)', pajakOmzet: 0.5, pajakBebas: 500e6, pajakLaba: 0, batasOmzetFinal: 4.8e9 },
    'pt-perorangan': { nama: 'PT perorangan: PPh final 0,5% dari omzet', pajakOmzet: 0.5, pajakBebas: 0, pajakLaba: 0, batasOmzetFinal: 4.8e9 },
    koperasi: { nama: 'Koperasi: PPh final 0,5% dari omzet (dibatasi empat tahun pajak sejak terdaftar)', pajakOmzet: 0.5, pajakBebas: 0, pajakLaba: 0, batasOmzetFinal: 4.8e9 },
    'badan-31e': { nama: 'PT / CV: PPh badan dengan fasilitas Pasal 31E (tarif efektif 11% untuk omzet s.d. Rp4,8 miliar)', pajakOmzet: 0, pajakBebas: 0, pajakLaba: 11, batasOmzetFinal: 4.8e9 },
    badan: { nama: 'PT / CV: PPh badan tarif umum 22% dari laba', pajakOmzet: 0, pajakBebas: 0, pajakLaba: 22, batasOmzetFinal: 0 },
    tanpa: { nama: 'Tanpa pajak (diabaikan)', pajakOmzet: 0, pajakBebas: 0, pajakLaba: 0, batasOmzetFinal: 0 },
    manual: { nama: 'Atur sendiri' },
  };

  /* Satuan yang bisa dikonversi otomatis. Angka = ukuran terhadap satuan dasar kelompoknya. */
  const KELOMPOK_SATUAN = {
    massa: { gram: 1, kg: 1000 },
    isi: { ml: 1, liter: 1000 },
    panjang: { cm: 1, meter: 100 },
    jumlah: { pcs: 1, lusin: 12, kodi: 20 },
  };
  const kelompokDari = (sat) => Object.keys(KELOMPOK_SATUAN).find((g) => ada(KELOMPOK_SATUAN[g], sat)) || null;
  /* daftar satuan pakai yang bisa dipilih untuk satuan beli tertentu (kosong bila tidak ada konversi) */
  function satuanSerupa(sat) {
    const g = kelompokDari(sat);
    return g ? Object.keys(KELOMPOK_SATUAN[g]) : [];
  }
  /* berapa satuan beli yang setara dengan 1 satuan pakai; 1 bila tidak diisi atau tidak bisa dikonversi */
  function faktorSatuan(beli, pakai) {
    const g = kelompokDari(beli);
    if (!g || !pakai || !ada(KELOMPOK_SATUAN[g], pakai)) return 1;
    return KELOMPOK_SATUAN[g][pakai] / KELOMPOK_SATUAN[g][beli];
  }

  /* biaya bahan untuk 1 produk = harga beli / isi per pembelian x pemakaian (dikonversi ke satuan beli) */
  function biayaBahan(b) {
    /* isi yang nyaris nol dibulatkan ke atas agar hasilnya tidak meledak menjadi tak hingga */
    return n(b.isi) > 0 ? (n(b.harga) / Math.max(n(b.isi), 1e-6)) * n(b.pakai) * faktorSatuan(b.satuan, b.satuanPakai) : 0;
  }

  /* total persen biaya yang ikut omzet (iklan berbayar, retur, komisi sales, dan sejenisnya) */
  const persenOmzet = (s) => sum((s.biayaOmzet || []).map((x) => x.persen));

  /* ekonomi satu produk pada harga hari ini; ekstra = persen biaya ikut omzet dari seluruh usaha */
  function unit(p, ekstra = 0) {
    const bahan = sum((p.bahan || []).map(biayaBahan));
    const lain = sum((p.lain || []).map((x) => x.biaya));
    const hpp = bahan + lain;
    const harga = n(p.harga);
    const feeSendiri = (harga * n(p.feePersen)) / 100 + n(p.feeRp);
    const feeOmzet = (harga * n(ekstra)) / 100;
    const feeJual = feeSendiri + feeOmzet;
    const kontribusi = harga - hpp - feeJual;
    return {
      bahan, lain, hpp, harga, feeSendiri, feeOmzet, feeJual, kontribusi,
      margKotor: harga - hpp,
      margKotorPct: harga > 0 ? (harga - hpp) / harga : 0,
      cmPct: harga > 0 ? kontribusi / harga : 0,
    };
  }

  /* harga jual agar margin kontribusi sama dengan targetCm (%) */
  function hargaSaran(p, targetCm, ekstra = 0) {
    const u = unit(p);
    const d = 1 - (n(p.feePersen) + n(ekstra)) / 100 - n(targetCm) / 100;
    return d > 0 ? (u.hpp + n(p.feeRp)) / d : null;
  }

  const biayaTetapBulan = (s) => sum(s.biayaTetap.map((x) => x.nilai));
  const modalAwal = (s) => sum(s.investasi.map((i) => i.nilai)) + n(s.modalKerja);
  const umurBulan = (i) => Math.max(0, Math.round(n(i.umur) * 12));

  /* penyusutan garis lurus tanpa nilai sisa, bulan ke-m (mulai 1) */
  function penyusutan(s, m) {
    return sum(s.investasi.map((i) => {
      const u = umurBulan(i);
      return u > 0 && m <= u ? n(i.nilai) / u : 0;
    }));
  }

  /* pengali volume bulan ke-m: naik bertahap sampai target, lalu tumbuh, dibatasi */
  function faktorVolume(m, a) {
    const R = Math.max(1, Math.round(n(a.rampBulan, 1)));
    const A = Math.min(1, Math.max(0, n(a.rampAwal, 100) / 100));
    const ramp = R > 1 && m < R ? A + ((1 - A) * (m - 1)) / (R - 1) : 1;
    const tumbuh = m > R ? Math.pow(1 + n(a.tumbuh) / 100, m - R) : 1;
    const batas = Math.max(1, n(a.batasTumbuh, 100) / 100);
    return Math.min(ramp * tumbuh, batas);
  }

  /* pengali musiman untuk bulan proyeksi ke-m (1 bila pola musiman tidak dipakai) */
  function faktorMusim(a, bulanMulai, m) {
    if (!a || !a.musimanAktif || !Array.isArray(a.musiman)) return 1;
    const i = (((Math.round(n(bulanMulai)) + m - 1) % 12) + 12) % 12;
    return Math.max(0, n(a.musiman[i], 100)) / 100;
  }

  function labelBulan(s, m) {
    const idx = n(s.mulaiBulan) + m - 1;
    return BLN[((idx % 12) + 12) % 12] + ' ' + (n(s.mulaiTahun, 2027) + Math.floor(idx / 12));
  }

  /* titik impas (BEP) berdasarkan bauran penjualan target; harga dan biaya hari ini */
  function bep(s, mult) {
    const k = Object.assign({}, NETRAL, mult);
    const ekstra = persenOmzet(s);
    const ps = s.produk.map((p) => {
      const u = unit(p, ekstra);
      const v = n(p.volume) * k.volume;
      const price = n(p.harga) * k.harga;
      const hpp = u.hpp * k.hpp;
      const fee = (price * (n(p.feePersen) + ekstra)) / 100 + n(p.feeRp);
      return { id: p.id, nama: p.nama, v, price, hpp, fee, cm: price - hpp - fee };
    });
    const tot = sum(ps.map((x) => x.v));
    ps.forEach((x) => { x.w = tot > 0 ? x.v / tot : ps.length ? 1 / ps.length : 0; });
    const avgPrice = sum(ps.map((x) => x.w * x.price));
    const avgHpp = sum(ps.map((x) => x.w * x.hpp));
    const avgVar = sum(ps.map((x) => x.w * (x.hpp + x.fee)));
    const avgCm = avgPrice - avgVar;
    const tetap = biayaTetapBulan(s) * k.tetap;
    const dep = penyusutan(s, 1);
    const fc = tetap + dep;
    const layak = avgCm > 0;
    const bepUnit = layak ? fc / avgCm : null;
    ps.forEach((x) => {
      x.bepUnit = layak ? bepUnit * x.w : null;
      x.bepRp = layak ? bepUnit * x.w * x.price : null;
    });
    const kapasitas = n((s.asumsi || {}).kapasitas);
    return {
      produk: ps, layak, targetUnit: tot, targetRp: sum(ps.map((x) => x.v * x.price)),
      avgPrice, avgHpp, avgVar, avgCm, cmRatio: avgPrice > 0 ? avgCm / avgPrice : 0,
      tetap, dep, fc, bepUnit, bepRp: layak ? bepUnit * avgPrice : null,
      bepKasUnit: layak ? tetap / avgCm : null,
      mos: layak && tot > 0 ? (tot - bepUnit) / tot : null,
      rasio: layak && tot > 0 ? bepUnit / tot : null,
      kapasitas,
      diAtasKapasitas: layak && kapasitas > 0 && bepUnit > kapasitas,
      unitUntukLaba: (target) => (layak ? (fc + n(target)) / avgCm : null),
    };
  }

  /* proyeksi bulanan: laba rugi dan arus kas */
  function proyeksi(s, mult) {
    const k = Object.assign({}, NETRAL, mult);
    const a = s.asumsi;
    const I0 = modalAwal(s);
    const bulanMulai = n(s.mulaiBulan);
    const ekstra = persenOmzet(s);
    const unitP = s.produk.map((p) => unit(p, ekstra));
    const tetap0 = biayaTetapBulan(s);
    const kap = n(a.kapasitas);
    /* modal kerja: stok dan piutang menahan uang, hutang dagang melepasnya */
    const dStok = n(a.stokHari) / 30, dPiut = n(a.piutangHari) / 30, dHut = n(a.hutangHari) / 30;
    const rows = [];
    let cum = -I0, rugiBawaan = 0, omzetTahunPajak = 0, nwcLalu = 0;
    for (let m = 1; m <= s.periode; m++) {
      const yi = Math.floor((m - 1) / 12);
      const fHarga = Math.pow(1 + n(a.naikHarga) / 100, yi) * k.harga;
      const fVar = Math.pow(1 + n(a.naikBiaya) / 100, yi);
      const fTetap = Math.pow(1 + n(a.naikTetap) / 100, yi) * k.tetap;
      const musim = faktorMusim(a, bulanMulai, m);
      const vf = faktorVolume(m, a) * musim * k.volume;
      const qs = s.produk.map((p) => n(p.volume) * vf);
      const qTotal = sum(qs);
      const batasKap = kap > 0 && qTotal > kap ? kap / qTotal : 1;
      let units = 0, rev = 0, cogs = 0, jual = 0;
      s.produk.forEach((p, i) => {
        const q = qs[i] * batasKap;
        const price = n(p.harga) * fHarga;
        const hpp = unitP[i].hpp * fVar * k.hpp;
        const fee = (price * (n(p.feePersen) + ekstra)) / 100 + n(p.feeRp) * fVar;
        units += q; rev += q * price; cogs += q * hpp; jual += q * fee;
      });
      const tetap = tetap0 * fTetap;
      const dep = penyusutan(s, m);
      const kotor = rev - cogs;
      const kontribusi = kotor - jual;
      const ebit = kontribusi - tetap - dep;

      /* pajak final atas omzet; tahun pajak = tahun kalender */
      if (m === 1 || (bulanMulai + m - 1) % 12 === 0) omzetTahunPajak = 0;
      const bebas = n(a.pajakBebas);
      const kenaSebelum = Math.max(0, omzetTahunPajak - bebas);
      omzetTahunPajak += rev;
      const kenaSesudah = Math.max(0, omzetTahunPajak - bebas);
      const pajakOmzet = ((kenaSesudah - kenaSebelum) * n(a.pajakOmzet)) / 100;

      /* pajak atas laba, rugi bulan sebelumnya dikompensasi */
      let pajakLaba = 0;
      if (ebit < 0) rugiBawaan += -ebit;
      else {
        const pakai = Math.min(rugiBawaan, ebit);
        rugiBawaan -= pakai;
        pajakLaba = ((ebit - pakai) * n(a.pajakLaba)) / 100;
      }
      const pajak = pajakOmzet + pajakLaba;
      const net = ebit - pajak;
      const nwc = dStok * cogs + dPiut * rev - dHut * cogs;
      const dnwc = nwc - nwcLalu;
      nwcLalu = nwc;
      const cf = net + dep - dnwc;
      cum += cf;
      rows.push({ m, tahun: yi + 1, label: labelBulan(s, m), units, rev, cogs, kotor, jual, kontribusi, tetap, dep, ebit, pajakOmzet, pajakLaba, pajak, net, nwc, dnwc, cf, cum, musim, terbatas: batasKap < 1 });
    }
    return rows;
  }

  return { NETRAL, BLN, PAJAK, KELOMPOK_SATUAN, n, sum, uid, satuanSerupa, faktorSatuan, biayaBahan, persenOmzet, unit, hargaSaran, biayaTetapBulan, modalAwal, umurBulan, penyusutan, faktorVolume, faktorMusim, labelBulan, bep, proyeksi };
})();
