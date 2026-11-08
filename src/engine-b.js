/* ===== engine-b: metrik, skenario, sensitivitas, kesehatan, pemeriksaan input, normalisasi ===== */
(() => {
  const { n, sum, uid, NETRAL, PAJAK, unit, persenOmzet, biayaTetapBulan, modalAwal, bep, proyeksi } = KPB;
  const VERSI_DATA = 2;

  function tahunan(rows) {
    const out = [];
    const kunci = ['units', 'rev', 'cogs', 'kotor', 'jual', 'kontribusi', 'tetap', 'dep', 'ebit', 'pajak', 'net', 'dnwc', 'cf'];
    rows.forEach((r) => {
      let y = out[r.tahun - 1];
      if (!y) {
        y = out[r.tahun - 1] = { tahun: r.tahun, bulan: 0, cum: 0, nwc: 0 };
        kunci.forEach((k) => { y[k] = 0; });
      }
      y.bulan++;
      kunci.forEach((k) => { y[k] += r[k]; });
      y.cum = r.cum;
      y.nwc = r.nwc;
    });
    out.forEach((y) => {
      y.margKotor = y.rev > 0 ? y.kotor / y.rev : 0;
      y.margNet = y.rev > 0 ? y.net / y.rev : 0;
      y.omzetSetahun = y.bulan >= 12 ? y.rev : (y.rev * 12) / y.bulan;
    });
    return out;
  }

  const bulananDari = (tahunanPersen) => Math.pow(1 + tahunanPersen / 100, 1 / 12) - 1;

  function npvDari(rm, I0, cfs, T) {
    let v = -I0;
    cfs.forEach((c, i) => { v += c / Math.pow(1 + rm, i + 1); });
    return v + T / Math.pow(1 + rm, cfs.length);
  }

  /* IRR dicari dengan bagi dua pada tingkat bulanan, hasil dikonversi ke tahunan */
  function irrDari(I0, cfs, T) {
    if (!(I0 > 0) || !cfs.length) return null;
    const f = (r) => npvDari(r, I0, cfs, T);
    let lo = -0.99, hi = 5, flo = f(lo);
    const fhi = f(hi);
    if (!isFinite(flo) || !isFinite(fhi) || flo * fhi > 0) return null;
    for (let i = 0; i < 200; i++) {
      const mid = (lo + hi) / 2, fm = f(mid);
      if (flo * fm <= 0) hi = mid;
      else { lo = mid; flo = fm; }
    }
    return Math.pow(1 + (lo + hi) / 2, 12) - 1;
  }

  function metrik(s, rows) {
    const I0 = modalAwal(s);
    const a = s.asumsi;
    /* di akhir periode stok dan piutang dianggap kembali menjadi uang tunai (hutang dagang dilunasi) */
    const nwcAkhir = rows.length ? n(rows[rows.length - 1].nwc) : 0;
    const T = (n(a.nilaiSisa) / 100) * I0 + nwcAkhir;
    const cfs = rows.map((r) => r.cf);
    const idx = rows.findIndex((r) => r.cum >= 0);
    let payback = null;
    if (I0 <= 0) payback = { bulan: 0, tepat: 0 };
    else if (idx >= 0) {
      const prev = idx === 0 ? -I0 : rows[idx - 1].cum;
      const cf = rows[idx].cf;
      payback = { bulan: idx + 1, tepat: idx + (cf > 0 ? -prev / cf : 1) };
    }
    const untung = rows.findIndex((r) => r.net > 0);
    const totalNet = sum(rows.map((r) => r.net));
    let kum = 0, minOp = 0, minBulan = 0;
    rows.forEach((r) => {
      kum += r.cf;
      if (kum < minOp) { minOp = kum; minBulan = r.m; }
    });
    const bln = rows.length;
    return {
      modalAwal: I0,
      totalNet,
      totalRev: sum(rows.map((r) => r.rev)),
      roi: I0 > 0 ? totalNet / I0 : null,
      roiTahun: I0 > 0 && bln ? totalNet / I0 / (bln / 12) : null,
      npv: npvDari(bulananDari(n(a.diskon)), I0, cfs, T),
      irr: irrDari(I0, cfs, T),
      payback,
      untungBulan: untung >= 0 ? untung + 1 : null,
      kasButuh: -minOp,
      kasTerendahBulan: minBulan,
      labaBulan12: (rows[Math.min(11, bln - 1)] || {}).net || 0,
      nwcAkhir,
      bulanTerbatas: rows.filter((r) => r.terbatas).length,
    };
  }

  function ringkas(s, mult) {
    const rows = proyeksi(s, mult);
    return { rows, m: metrik(s, rows), b: bep(s, mult) };
  }

  const SKENARIO = [
    { id: 'pesimis', nama: 'Pesimis', ket: 'Harga -5%, penjualan -25%, HPP +10%, biaya tetap +5%', mult: { harga: 0.95, volume: 0.75, hpp: 1.1, tetap: 1.05 } },
    { id: 'dasar', nama: 'Sesuai input', ket: 'Angka persis seperti yang Anda isi', mult: NETRAL },
    { id: 'optimis', nama: 'Optimis', ket: 'Harga +5%, penjualan +20%, HPP -5%', mult: { harga: 1.05, volume: 1.2, hpp: 0.95, tetap: 1 } },
  ];

  function sensitivitas(s, d = 0.1) {
    const base = ringkas(s, NETRAL);
    const faktor = [['harga', 'Harga jual'], ['volume', 'Volume penjualan'], ['hpp', 'HPP (biaya produksi)'], ['tetap', 'Biaya tetap']];
    const sisi = (k, v) => {
      const r = ringkas(s, { [k]: v });
      return { net: r.m.totalNet, delta: r.m.totalNet - base.m.totalNet, payback: r.m.payback, bepUnit: r.b.bepUnit };
    };
    const out = faktor.map(([k, nama]) => {
      const lo = sisi(k, 1 - d), hi = sisi(k, 1 + d);
      return { k, nama, lo, hi, dampak: Math.max(Math.abs(lo.delta), Math.abs(hi.delta)) };
    });
    out.sort((x, y) => y.dampak - x.dampak);
    return { base, out, d };
  }

  /* pemeriksaan "kesehatan usaha": level good | warn | serious | crit */
  function cekKesehatan(s, unitP, b, thn, m) {
    const out = [];
    const mk = b.avgPrice > 0 ? (b.avgPrice - b.avgHpp) / b.avgPrice : 0;
    out.push({ id: 'margin', nilai: mk, level: mk < 0 ? 'crit' : mk < 0.3 ? 'serious' : mk < 0.5 ? 'warn' : 'good' });
    if (!b.layak) out.push({ id: 'bep', nilai: null, level: 'crit' });
    else out.push({ id: 'bep', nilai: b.rasio, level: b.rasio > 1 ? 'crit' : b.rasio > 0.85 ? 'serious' : b.rasio > 0.6 ? 'warn' : 'good' });
    const pb = m.payback;
    out.push({ id: 'payback', nilai: pb ? pb.bulan : null, level: !pb ? 'crit' : pb.bulan <= 24 ? 'good' : pb.bulan <= 48 ? 'warn' : 'serious' });
    out.push({ id: 'kas', nilai: m.kasButuh, level: m.kasButuh > n(s.modalKerja) ? 'serious' : 'good' });
    const rugi = s.produk.filter((p, i) => unitP[i].kontribusi < 0).map((p) => p.nama || 'Produk tanpa nama');
    out.push({ id: 'produk', nilai: rugi.length, level: rugi.length ? 'crit' : 'good', daftar: rugi });
    const a = s.asumsi;
    if ((n(a.pajakOmzet) > 0 || n(a.pajakLaba) > 0) && n(a.batasOmzetFinal) > 0) {
      const lewat = thn.find((y) => y.omzetSetahun > n(a.batasOmzetFinal));
      out.push({ id: 'pajak', nilai: lewat ? lewat.tahun : null, level: lewat ? 'warn' : 'good' });
    }
    const kap = n(a.kapasitas);
    if (kap > 0) {
      if (b.diAtasKapasitas) out.push({ id: 'kapasitas', nilai: b.bepUnit / kap, level: 'crit' });
      else {
        const r = b.targetUnit / kap;
        out.push({ id: 'kapasitas', nilai: r, level: r > 1 ? 'serious' : r > 0.85 ? 'warn' : 'good' });
      }
    }
    return out;
  }

  /* hal-hal yang patut dicek pada isian sebelum angkanya dipercaya; tidak menghalangi hitungan */
  function periksaInput(s) {
    const out = [];
    const eks = persenOmzet(s), a = s.asumsi;
    const namaP = (p) => p.nama || 'Produk tanpa nama';
    const unitP = s.produk.map((p) => unit(p, eks));
    const tambah = (id, level, daftar, nilai) => out.push({ id, level, daftar: daftar || [], nilai: nilai == null ? null : nilai });
    const tanpaHarga = s.produk.filter((p) => n(p.harga) <= 0).map(namaP);
    if (tanpaHarga.length) tambah('harga0', 'warn', tanpaHarga);
    const kecil = s.produk.filter((p) => n(p.harga) > 0 && n(p.harga) < 100).map(namaP);
    if (kecil.length) tambah('hargaKecil', 'info', kecil);
    const tanpaHpp = s.produk.filter((p, i) => n(p.harga) > 0 && unitP[i].hpp <= 0).map(namaP);
    if (tanpaHpp.length) tambah('hpp0', 'warn', tanpaHpp);
    const isiNol = [];
    s.produk.forEach((p) => (p.bahan || []).forEach((b) => { if (n(b.harga) > 0 && !(n(b.isi) > 0)) isiNol.push(namaP(p) + ': ' + (b.nama || 'bahan tanpa nama')); }));
    if (isiNol.length) tambah('isi0', 'warn', isiNol);
    const tinggi = s.produk.filter((p, i) => n(p.harga) > 0 && unitP[i].hpp > 0 && unitP[i].margKotorPct > 0.9).map(namaP);
    if (tinggi.length) tambah('margin90', 'info', tinggi);
    if (eks >= 100) tambah('omzet100', 'warn', [], eks);
    const tetap = biayaTetapBulan(s);
    if (!(tetap > 0)) tambah('tetap0', 'warn');
    else if (!s.biayaTetap.some((t) => /pemilik|owner|sendiri|prive|pribadi/i.test(t.nama || ''))) tambah('gajiPemilik', 'info');
    if (!(sum(s.produk.map((p) => p.volume)) > 0)) tambah('volume0', 'warn');
    if (!(modalAwal(s) > 0)) tambah('modal0', 'info');
    if (a.pajakPreset === 'tanpa') tambah('pajakTanpa', 'info');
    if (a.musimanAktif) {
      const rata = sum(a.musiman) / 12;
      if (Math.abs(rata - 100) > 5) tambah('musimRata', 'info', [], rata);
    }
    return out;
  }

  function analisis(s) {
    const eks = persenOmzet(s);
    const unitP = s.produk.map((p) => unit(p, eks));
    const r = ringkas(s, NETRAL);
    const thn = tahunan(r.rows);
    return { s, unitP, bep: r.b, rows: r.rows, tahun: thn, m: r.m, sehat: cekKesehatan(s, unitP, r.b, thn, r.m), periksa: periksaInput(s) };
  }

  /* merapikan data dari penyimpanan atau berkas impor (semua versi lama diterima) */
  function normalisasi(r) {
    r = r && typeof r === 'object' ? r : {};
    const arr = (x) => (Array.isArray(x) ? x : []);
    /* daftar baris: hanya objek yang dipakai, supaya isian rusak seperti null atau angka di dalam larik tidak menjatuhkan aplikasi */
    const baris = (x) => arr(x).filter((e) => e && typeof e === 'object' && !Array.isArray(e));
    const st = (v, d = '') => (typeof v === 'string' ? v.slice(0, 80) : d);
    const nu = (v, d = 0, lo = -Infinity, hi = Infinity) => Math.min(hi, Math.max(lo, n(v, d)));
    /* id harus unik di seluruh data (dipakai sebagai id elemen); id kembar atau kosong diganti baru */
    const dilihat = new Set();
    const id = (v) => {
      let x = typeof v === 'string' ? v.slice(0, 24) : '';
      if (!x || dilihat.has(x)) x = uid();
      dilihat.add(x);
      return x;
    };
    const A = r.asumsi && typeof r.asumsi === 'object' ? r.asumsi : {};
    const musim = arr(A.musiman);
    /* batas atas yang masih masuk akal; mencegah angka ekstrem meledak menjadi tak hingga */
    const UANG = 1e13, JUMLAH = 1e12;
    return {
      v: VERSI_DATA,
      contoh: !!r.contoh,
      nama: st(r.nama, 'Usaha Saya'),
      mulaiBulan: Math.round(nu(r.mulaiBulan, 0, 0, 11)),
      mulaiTahun: Math.round(nu(r.mulaiTahun, 2027, 2020, 2100)),
      periode: [12, 24, 36, 48, 60].includes(r.periode) ? r.periode : 36,
      modalKerja: nu(r.modalKerja, 0, 0, UANG),
      investasi: baris(r.investasi).slice(0, 40).map((i) => ({ id: id(i.id), nama: st(i.nama), nilai: nu(i.nilai, 0, 0, UANG), umur: nu(i.umur, 0, 0, 50) })),
      biayaTetap: baris(r.biayaTetap).slice(0, 60).map((i) => ({ id: id(i.id), nama: st(i.nama), nilai: nu(i.nilai, 0, 0, UANG) })),
      biayaOmzet: baris(r.biayaOmzet).slice(0, 12).map((i) => ({ id: id(i.id), nama: st(i.nama), persen: nu(i.persen, 0, 0, 100) })),
      produk: baris(r.produk).slice(0, 12).map((p) => ({
        id: id(p.id), nama: st(p.nama), harga: nu(p.harga, 0, 0, UANG), volume: nu(p.volume, 0, 0, JUMLAH),
        feePersen: nu(p.feePersen, 0, 0, 100), feeRp: nu(p.feeRp, 0, 0, UANG),
        bahan: baris(p.bahan).slice(0, 40).map((b) => ({ id: id(b.id), nama: st(b.nama), harga: nu(b.harga, 0, 0, UANG), isi: nu(b.isi, 1, 0, JUMLAH), pakai: nu(b.pakai, 0, 0, JUMLAH), satuan: st(b.satuan), satuanPakai: st(b.satuanPakai) })),
        lain: baris(p.lain).slice(0, 20).map((b) => ({ id: id(b.id), nama: st(b.nama), jenis: ['tk', 'oh', 'lain'].includes(b.jenis) ? b.jenis : 'oh', biaya: nu(b.biaya, 0, 0, UANG) })),
      })),
      asumsi: {
        rampAwal: nu(A.rampAwal, 100, 0, 100), rampBulan: Math.round(nu(A.rampBulan, 1, 1, 36)),
        tumbuh: nu(A.tumbuh, 0, -20, 50), batasTumbuh: nu(A.batasTumbuh, 200, 100, 1000),
        naikHarga: nu(A.naikHarga, 0, 0, 50), naikBiaya: nu(A.naikBiaya, 0, 0, 50), naikTetap: nu(A.naikTetap, 0, 0, 50),
        pajakPreset: PAJAK[A.pajakPreset] ? A.pajakPreset : 'tanpa',
        pajakOmzet: nu(A.pajakOmzet, 0, 0, 100), pajakBebas: nu(A.pajakBebas, 0, 0, UANG), pajakLaba: nu(A.pajakLaba, 0, 0, 100),
        batasOmzetFinal: nu(A.batasOmzetFinal, 0, 0, UANG),
        diskon: nu(A.diskon, 12, 0, 100), nilaiSisa: nu(A.nilaiSisa, 0, 0, 1000),
        stokHari: nu(A.stokHari, 0, 0, 365), piutangHari: nu(A.piutangHari, 0, 0, 365), hutangHari: nu(A.hutangHari, 0, 0, 365),
        kapasitas: nu(A.kapasitas, 0, 0, JUMLAH),
        musimanAktif: !!A.musimanAktif,
        musiman: Array.from({ length: 12 }, (_, i) => nu(musim[i], 100, 0, 500)),
      },
    };
  }

  Object.assign(KPB, { VERSI_DATA, tahunan, npvDari, irrDari, metrik, ringkas, SKENARIO, sensitivitas, cekKesehatan, periksaInput, analisis, normalisasi });
})();
