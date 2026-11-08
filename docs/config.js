/* Konfigurasi kalkulator proyeksi bisnis.
   Ubah nilai di bawah lalu simpan. Tidak perlu membangun ulang apa pun.
   Semua pengaturan bersifat opsional; yang dihapus kembali ke nilai bawaan. */
window.KPB_CONFIG = {
  /* 'auto' mengikuti situs/perangkat, atau 'terang' / 'gelap' */
  tema: 'auto',

  /* 'mandiri' bila dibuka sebagai halaman sendiri; 'tertanam' bila ditaruh di dalam halaman lain (tanpa judul h1, tanpa tombol Kembali peramban) */
  mode: 'mandiri',

  /* true = halaman ini bisa dipasang di layar utama ponsel dan dibuka tanpa internet setelah pernah dimuat (butuh HTTPS).
     Hanya berlaku untuk halaman mandiri; tidak aktif di mode 'tertanam' dan iframe. */
  pwa: true,

  /* Nama merek di kaki halaman dan di laporan, mis. 'Toko Contoh' */
  merek: '',

  /* Tautan kebijakan privasi Anda (opsional) */
  kebijakan: '',

  /* Ajakan bertindak di akhir hasil, mis. daftar ke produk SaaS Anda. Hapus tanda komentar untuk memakai.
  cta: {
    judul: 'Siap menjalankan rencana ini?',
    isi: 'Catat penjualan dan stok usaha Anda dalam satu aplikasi.',
    tombol: 'Coba gratis',
    href: 'https://contoh.com/daftar',
    target: '_blank'
  }, */

  /* Menerima setiap peristiwa pemakaian (tanpa angka usaha dan tanpa nama), mis. untuk Google Analytics atau Plausible.
  onEvent: function (e) { window.gtag && gtag('event', e.nama, e.props); }, */

  /* Hanya untuk iframe: kirim tinggi konten ke halaman induk, dan batasi tujuan pesan ke situs Anda.
  tinggiOtomatis: true,
  indukOrigin: 'https://situsanda.com', */

  /* Timpa tarif pajak bawaan bila aturan berubah (satuan persen), tanpa menunggu pembaruan aplikasi.
  pajak: { 'op-final': { pajakOmzet: 0.5, pajakBebas: 500000000 } },
  tglAturan: 'Januari 2027', */
};
