/* ===== template usaha: angka contoh untuk gambaran awal, bukan data pasar ===== */
(() => {
  const { normalisasi, contohState, bahanBaris: bahan, lainBaris: lain, asumsiPajak } = KPB;

  function tokoOnline() {
    return normalisasi({
      contoh: true, nama: 'Toko Online Contoh', mulaiBulan: 0, mulaiTahun: 2027, periode: 36, modalKerja: 55000000,
      investasi: [
        { nama: 'Laptop, printer label, dan rak packing', nilai: 11000000, umur: 4 },
        { nama: 'Foto produk dan setup toko awal', nilai: 3000000, umur: 2 },
      ],
      biayaTetap: [
        { nama: 'Gaji admin dan packing (1 orang)', nilai: 3500000 },
        { nama: 'Gaji pemilik', nilai: 3000000 },
        { nama: 'Sewa gudang kecil', nilai: 1500000 },
        { nama: 'Internet dan listrik', nilai: 700000 },
        { nama: 'Langganan aplikasi stok dan resi', nilai: 400000 },
        { nama: 'Konten dan live streaming (kreator)', nilai: 2000000 },
      ],
      biayaOmzet: [{ nama: 'Iklan marketplace', persen: 10 }, { nama: 'Retur dan komplain', persen: 3 }],
      produk: [
        {
          nama: 'Kaos polos premium', harga: 79000, volume: 450, feePersen: 8, feeRp: 1250,
          bahan: [bahan('Kaos dari supplier', 38000, 1, 'pcs', 1), bahan('Polybag dan stiker', 1500, 1, 'pcs', 1), bahan('Kartu ucapan', 300, 1, 'pcs', 1)],
          lain: [],
        },
        {
          nama: 'Hoodie polos', harga: 169000, volume: 150, feePersen: 8, feeRp: 1250,
          bahan: [bahan('Hoodie dari supplier', 82000, 1, 'pcs', 1), bahan('Polybag dan stiker', 2000, 1, 'pcs', 1), bahan('Kartu ucapan', 300, 1, 'pcs', 1)],
          lain: [],
        },
      ],
      asumsi: Object.assign({ rampAwal: 25, rampBulan: 8, tumbuh: 1.5, batasTumbuh: 150, naikHarga: 2, naikBiaya: 3, naikTetap: 4, diskon: 12, nilaiSisa: 0, stokHari: 30, piutangHari: 7, hutangHari: 0 }, asumsiPajak('op-final')),
    });
  }

  function katering() {
    return normalisasi({
      contoh: true, nama: 'Katering Nasi Kotak Contoh', mulaiBulan: 0, mulaiTahun: 2027, periode: 36, modalKerja: 32000000,
      investasi: [
        { nama: 'Peralatan masak (kompor, panci besar, rice cooker)', nilai: 14000000, umur: 4 },
        { nama: 'Freezer dan wadah penyimpanan', nilai: 7000000, umur: 5 },
        { nama: 'Motor dan box pengantaran', nilai: 6000000, umur: 4 },
        { nama: 'Perizinan (PIRT, halal) dan branding', nilai: 5000000, umur: 3 },
      ],
      biayaTetap: [
        { nama: 'Sewa dapur', nilai: 3000000 },
        { nama: 'Gaji juru masak dan 2 asisten', nilai: 8500000 },
        { nama: 'Gaji pemilik', nilai: 3000000 },
        { nama: 'Bensin dan servis motor pengantaran', nilai: 1500000 },
        { nama: 'Listrik dan air dasar', nilai: 1000000 },
        { nama: 'Promosi (brosur, siaran WhatsApp)', nilai: 1000000 },
      ],
      produk: [
        {
          nama: 'Nasi kotak ayam bakar', harga: 28000, volume: 1400, feePersen: 0, feeRp: 0,
          bahan: [
            bahan('Beras', 14000, 1, 'kg', 130, 'gram'), bahan('Ayam (per potong)', 38000, 1, 'kg', 140, 'gram'),
            bahan('Bumbu dan minyak goreng', 1800, 1, 'porsi', 1), bahan('Sayur dan lalapan', 1500, 1, 'porsi', 1), bahan('Sambal', 700, 1, 'porsi', 1),
            bahan('Kotak nasi, sendok, tisu', 1700, 1, 'pcs', 1), bahan('Air mineral gelas', 600, 1, 'pcs', 1),
          ],
          lain: [lain('Gas LPG per porsi', 'oh', 700)],
        },
        {
          nama: 'Nasi kotak ikan goreng', harga: 26000, volume: 600, feePersen: 0, feeRp: 0,
          bahan: [
            bahan('Beras', 14000, 1, 'kg', 130, 'gram'), bahan('Ikan nila', 36000, 1, 'kg', 150, 'gram'),
            bahan('Bumbu dan minyak goreng', 1800, 1, 'porsi', 1), bahan('Sayur dan lalapan', 1500, 1, 'porsi', 1), bahan('Sambal', 700, 1, 'porsi', 1),
            bahan('Kotak nasi, sendok, tisu', 1700, 1, 'pcs', 1), bahan('Air mineral gelas', 600, 1, 'pcs', 1),
          ],
          lain: [lain('Gas LPG per porsi', 'oh', 700)],
        },
      ],
      asumsi: Object.assign({ rampAwal: 40, rampBulan: 5, tumbuh: 1.5, batasTumbuh: 140, naikHarga: 3, naikBiaya: 4, naikTetap: 4, diskon: 12, nilaiSisa: 0, stokHari: 3, piutangHari: 14, hutangHari: 0, kapasitas: 2800 }, asumsiPajak('op-final')),
    });
  }

  function laundry() {
    return normalisasi({
      contoh: true, nama: 'Laundry Kiloan Contoh', mulaiBulan: 0, mulaiTahun: 2027, periode: 36, modalKerja: 14000000,
      investasi: [
        { nama: 'Mesin cuci (2 unit)', nilai: 14000000, umur: 5 },
        { nama: 'Mesin pengering (2 unit)', nilai: 16000000, umur: 5 },
        { nama: 'Setrika uap, meja, dan rak', nilai: 5000000, umur: 4 },
        { nama: 'Renovasi, etalase, dan papan nama', nilai: 9000000, umur: 5 },
        { nama: 'Perizinan dan promosi pembukaan', nilai: 2000000, umur: 2 },
      ],
      biayaTetap: [
        { nama: 'Sewa tempat', nilai: 3500000 },
        { nama: 'Gaji 2 karyawan', nilai: 5200000 },
        { nama: 'Gaji pemilik', nilai: 2500000 },
        { nama: 'Listrik dasar dan internet', nilai: 800000 },
        { nama: 'Perawatan mesin', nilai: 500000 },
        { nama: 'Promosi (Google Maps, brosur)', nilai: 600000 },
      ],
      produk: [
        {
          nama: 'Cuci setrika kiloan', harga: 8000, volume: 2300, feePersen: 0, feeRp: 0,
          bahan: [bahan('Deterjen cair', 38000, 5, 'liter', 30, 'ml'), bahan('Pelembut dan pewangi', 45000, 5, 'liter', 20, 'ml'), bahan('Plastik pembungkus', 300, 1, 'pcs', 1)],
          lain: [lain('Listrik, air, dan gas per kg', 'oh', 1100)],
        },
        {
          nama: 'Cuci lipat (tanpa setrika)', harga: 6000, volume: 700, feePersen: 0, feeRp: 0,
          bahan: [bahan('Deterjen cair', 38000, 5, 'liter', 30, 'ml'), bahan('Pelembut dan pewangi', 45000, 5, 'liter', 20, 'ml'), bahan('Plastik pembungkus', 300, 1, 'pcs', 1)],
          lain: [lain('Listrik, air, dan gas per kg', 'oh', 800)],
        },
        {
          nama: 'Bed cover dan selimut (per pcs)', harga: 35000, volume: 50, feePersen: 0, feeRp: 0,
          bahan: [bahan('Deterjen cair', 38000, 5, 'liter', 90, 'ml'), bahan('Plastik pembungkus', 1500, 1, 'pcs', 1)],
          lain: [lain('Listrik, air, dan pengeringan', 'oh', 3500)],
        },
      ],
      asumsi: Object.assign({ rampAwal: 35, rampBulan: 6, tumbuh: 1, batasTumbuh: 140, naikHarga: 3, naikBiaya: 3, naikTetap: 4, diskon: 12, nilaiSisa: 0, stokHari: 14, kapasitas: 4200 }, asumsiPajak('op-final')),
    });
  }

  function konveksi() {
    return normalisasi({
      contoh: true, nama: 'Konveksi Kaos Sablon Contoh', mulaiBulan: 0, mulaiTahun: 2027, periode: 36, modalKerja: 45000000,
      investasi: [
        { nama: 'Mesin jahit (6 unit)', nilai: 21000000, umur: 5 },
        { nama: 'Mesin obras dan overdeck', nilai: 14000000, umur: 5 },
        { nama: 'Meja potong, setrika, dan rak', nilai: 6000000, umur: 5 },
        { nama: 'Perlengkapan sablon', nilai: 7000000, umur: 4 },
        { nama: 'Renovasi bengkel dan instalasi listrik', nilai: 8000000, umur: 5 },
      ],
      biayaTetap: [
        { nama: 'Sewa bengkel', nilai: 3000000 },
        { nama: 'Gaji admin dan QC', nilai: 4500000 },
        { nama: 'Gaji pemilik', nilai: 3000000 },
        { nama: 'Listrik dan air', nilai: 1200000 },
        { nama: 'Promosi dan katalog', nilai: 1500000 },
        { nama: 'Perawatan mesin', nilai: 800000 },
      ],
      produk: [
        {
          nama: 'Kaos sablon custom (cotton combed 30s)', harga: 68000, volume: 520, feePersen: 2, feeRp: 0,
          bahan: [
            bahan('Kain cotton combed 30s', 95000, 1, 'kg', 240, 'gram'), bahan('Benang dan aksesoris jahit', 700, 1, 'pcs', 1),
            bahan('Tinta sablon', 120000, 1, 'kg', 25, 'gram'), bahan('Label dan polybag', 1200, 1, 'pcs', 1),
          ],
          lain: [lain('Upah jahit borongan', 'tk', 8500), lain('Upah sablon', 'tk', 3000), lain('Listrik produksi', 'oh', 500)],
        },
        {
          nama: 'Polo shirt bordir', harga: 95000, volume: 150, feePersen: 2, feeRp: 0,
          bahan: [
            bahan('Kain lacoste', 105000, 1, 'kg', 280, 'gram'), bahan('Kerah dan kancing', 4500, 1, 'set', 1),
            bahan('Label dan polybag', 1200, 1, 'pcs', 1),
          ],
          lain: [lain('Upah jahit borongan', 'tk', 12000), lain('Upah bordir', 'tk', 6000), lain('Listrik produksi', 'oh', 600)],
        },
      ],
      asumsi: Object.assign({ rampAwal: 30, rampBulan: 6, tumbuh: 1, batasTumbuh: 140, naikHarga: 3, naikBiaya: 4, naikTetap: 4, diskon: 12, nilaiSisa: 0, stokHari: 21, piutangHari: 14, hutangHari: 7, kapasitas: 1400 }, asumsiPajak('op-final')),
    });
  }

  const TEMPLATE = [
    { id: 'kopi', nama: 'Kedai kopi', ket: 'Minuman dan roti bakar, dengan sewa tempat dan barista', bangun: contohState },
    { id: 'online', nama: 'Toko online', ket: 'Jual kaos dan hoodie di marketplace, ada iklan dan retur', bangun: tokoOnline },
    { id: 'katering', nama: 'Katering nasi kotak', ket: 'Produksi harian, bahan cepat habis, pelanggan kantor bayar tempo', bangun: katering },
    { id: 'laundry', nama: 'Laundry kiloan', ket: 'Jasa per kilo, kapasitas dibatasi jumlah mesin', bangun: laundry },
    { id: 'konveksi', nama: 'Konveksi kaos sablon', ket: 'Kain dibeli per kilo, dipakai per gram, stok dan piutang besar', bangun: konveksi },
  ];

  Object.assign(KPB, { TEMPLATE });
})();
