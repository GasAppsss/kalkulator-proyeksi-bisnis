/* ===== data contoh, data kosong, dan hitung cepat ===== */
(() => {
  const { PAJAK, normalisasi, analisis } = KPB;

  const bahan = (nama, harga, isi, satuan, pakai, satuanPakai) => ({ nama, harga, isi, satuan, pakai, satuanPakai: satuanPakai || '' });
  const lain = (nama, jenis, biaya) => ({ nama, jenis, biaya });
  const asumsiPajak = (kode) => Object.assign({ pajakPreset: kode }, PAJAK[kode], { nama: undefined });

  /* contoh utama: kedai kopi */
  function contohState() {
    return normalisasi({
      contoh: true,
      nama: 'Kedai Kopi Contoh',
      mulaiBulan: 0,
      mulaiTahun: 2027,
      periode: 36,
      modalKerja: 30000000,
      investasi: [
        { nama: 'Renovasi dan interior', nilai: 45000000, umur: 5 },
        { nama: 'Mesin espresso dan grinder', nilai: 38000000, umur: 5 },
        { nama: 'Peralatan bar dan dapur', nilai: 12000000, umur: 3 },
        { nama: 'Furnitur dan mesin kasir', nilai: 18000000, umur: 4 },
        { nama: 'Perizinan dan branding awal', nilai: 7000000, umur: 2 },
      ],
      biayaTetap: [
        { nama: 'Gaji barista dan kasir (3 orang)', nilai: 9600000 },
        { nama: 'Sewa tempat', nilai: 6000000 },
        { nama: 'Listrik, air, dan internet', nilai: 1800000 },
        { nama: 'Pemasaran dan promosi', nilai: 2500000 },
        { nama: 'Kebersihan dan perawatan', nilai: 1200000 },
        { nama: 'Langganan aplikasi kasir', nilai: 400000 },
      ],
      produk: [
        {
          nama: 'Kopi susu gula aren', harga: 22000, volume: 1600, feePersen: 3, feeRp: 0,
          bahan: [
            bahan('Biji kopi', 180000, 1000, 'gram', 18),
            bahan('Susu UHT', 18500, 1000, 'ml', 120),
            bahan('Gula aren cair', 42000, 1000, 'ml', 25),
            bahan('Es batu', 15000, 10, 'kg', 0.2),
            bahan('Cup, tutup, sedotan', 1500, 1, 'set', 1),
          ],
          lain: [lain('Listrik dan air produksi', 'oh', 350)],
        },
        {
          nama: 'Americano', harga: 18000, volume: 500, feePersen: 3, feeRp: 0,
          bahan: [
            bahan('Biji kopi', 180000, 1000, 'gram', 18),
            bahan('Air galon', 20000, 19000, 'ml', 200),
            bahan('Es batu', 15000, 10, 'kg', 0.2),
            bahan('Cup, tutup, sedotan', 1500, 1, 'set', 1),
          ],
          lain: [lain('Listrik dan air produksi', 'oh', 350)],
        },
        {
          nama: 'Roti bakar cokelat keju', harga: 22000, volume: 350, feePersen: 3, feeRp: 0,
          bahan: [
            bahan('Roti tawar tebal', 20000, 8, 'slice', 2),
            bahan('Selai cokelat', 56000, 1000, 'gram', 30),
            bahan('Keju cheddar', 90000, 1000, 'gram', 20),
            bahan('Mentega', 75000, 1000, 'gram', 10),
            bahan('Kotak kemasan', 900, 1, 'pcs', 1),
          ],
          lain: [lain('Gas dan listrik per porsi', 'oh', 300)],
        },
      ],
      asumsi: Object.assign({ rampAwal: 50, rampBulan: 6, tumbuh: 1, batasTumbuh: 130, naikHarga: 3, naikBiaya: 4, naikTetap: 5, diskon: 12, nilaiSisa: 0, stokHari: 7 }, asumsiPajak('op-final')),
    });
  }

  function kosongState() {
    const sekarang = new Date();
    return normalisasi({
      contoh: false,
      nama: 'Usaha Saya',
      mulaiBulan: sekarang.getMonth(),
      mulaiTahun: Math.max(2026, sekarang.getFullYear()),
      periode: 36,
      modalKerja: 0,
      investasi: [{ nama: '', nilai: 0, umur: 5 }],
      biayaTetap: [{ nama: '', nilai: 0 }],
      produk: [{ nama: '', harga: 0, volume: 0, feePersen: 0, feeRp: 0, bahan: [bahan('', 0, 1, '', 1)], lain: [] }],
      asumsi: { pajakPreset: 'tanpa', diskon: 12 },
    });
  }

  /* ---------- hitung cepat: 6 angka saja, memakai mesin yang sama dengan versi lengkap ---------- */
  function contohCepat() {
    return { nama: 'Es kopi susu botol', harga: 25000, hpp: 11000, feePersen: 5, tetap: 6000000, modal: 40000000, volume: 700 };
  }
  function kosongCepat() {
    return { nama: '', harga: 0, hpp: 0, feePersen: 0, tetap: 0, modal: 0, volume: 0 };
  }

  /* membentuk data lengkap dari isian cepat, agar bisa dilanjutkan ke versi lengkap tanpa mengetik ulang */
  function dariCepat(q, awal) {
    q = q && typeof q === 'object' ? q : {};
    const x = (v, hi = Infinity) => Math.min(hi, Math.max(0, KPB.n(v)));
    const sekarang = awal || new Date();
    return normalisasi({
      contoh: false,
      nama: typeof q.nama === 'string' && q.nama.trim() ? q.nama.trim() : 'Usaha Saya',
      mulaiBulan: sekarang.getMonth(),
      mulaiTahun: Math.max(2026, sekarang.getFullYear()),
      periode: 36,
      modalKerja: 0,
      investasi: x(q.modal) > 0 ? [{ nama: 'Modal awal (gabungan, rinci di langkah 1)', nilai: x(q.modal), umur: 0 }] : [],
      biayaTetap: [{ nama: 'Biaya tetap per bulan (gabungan, rinci di langkah 3)', nilai: x(q.tetap) }],
      produk: [{
        nama: typeof q.nama === 'string' && q.nama.trim() ? q.nama.trim() : 'Produk utama',
        harga: x(q.harga), volume: x(q.volume), feePersen: x(q.feePersen, 100), feeRp: 0,
        bahan: [],
        lain: [lain('HPP per unit (perkiraan, rinci di langkah 2)', 'lain', x(q.hpp))],
      }],
      asumsi: { pajakPreset: 'tanpa', diskon: 12, rampAwal: 100, rampBulan: 1 },
    });
  }

  function hitungCepat(q, awal) {
    const s = dariCepat(q, awal);
    const A = analisis(s);
    const u = A.unitP[0], b = A.bep;
    return {
      s, A, unit: u,
      layak: b.layak, bepUnit: b.bepUnit, bepRp: b.bepRp, mos: b.mos, rasio: b.rasio,
      laba: A.rows.length ? A.rows[0].net : 0,
      payback: A.m.payback,
      siap: u.harga > 0 && b.targetUnit > 0,
    };
  }

  Object.assign(KPB, { contohState, kosongState, contohCepat, kosongCepat, dariCepat, hitungCepat, bahanBaris: bahan, lainBaris: lain, asumsiPajak });
})();
