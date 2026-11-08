/* Konfigurasi untuk iframe.html (kalkulator di dalam iframe pada situs Anda).
   Ubah nilai di bawah lalu simpan. Tidak perlu membangun ulang apa pun. */
(function () {
  /* Alamat situs yang menanam kalkulator ini, mis. 'https://situsanda.com' (tanpa garis miring di akhir).
     Hanya situs ini yang menerima pesan tinggi, gulir, dan peristiwa dari iframe.
     Kosong = otomatis memakai asal halaman yang menanam (dari document.referrer); bila tidak terbaca, hanya halaman satu asal yang menerima. */
  var INDUK = '';
  if (!INDUK) { try { INDUK = new URL(document.referrer).origin; } catch (e) { INDUK = ''; } }

  var cfg = {
    mode: 'tertanam',
    tinggiOtomatis: true,
    indukOrigin: INDUK || location.origin,
    /* 'auto' mengikuti perangkat; bisa juga diatur lewat alamat iframe (iframe.html?tema=gelap) atau lewat pesan dari halaman induk (lihat README) */
    tema: 'auto',
    merek: '',
    kebijakan: ''
    /* cta: { judul: 'Siap menjalankan rencana ini?', isi: 'Catat penjualan dan stok usaha Anda dalam satu aplikasi.', tombol: 'Coba gratis', href: 'https://contoh.com/daftar', target: '_blank' }, */
    /* pajak: { 'op-final': { pajakOmzet: 0.5, pajakBebas: 500000000 } }, tglAturan: 'Januari 2027', */
  };
  try { var t = new URLSearchParams(location.search).get('tema'); if (/^(terang|gelap|auto)$/.test(t)) cfg.tema = t; } catch (e) { /* abaikan */ }
  window.KPB_CONFIG = cfg;
})();
