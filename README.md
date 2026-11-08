# Kalkulator Proyeksi Bisnis

Aplikasi web berbahasa Indonesia untuk menghitung proyeksi bisnis dari HPP per produk, harga jual, biaya tetap, target penjualan, titik impas (BEP), laba rugi, arus kas, sampai balik modal (payback, ROI, NPV, IRR). Dilengkapi skenario pesimis, dasar, dan optimis, simulasi sensitivitas, kamus istilah, serta ekspor ke Excel, JSON, dan laporan cetak.

Tanpa peladen dan tanpa akun: seluruh perhitungan berjalan di peramban pengguna, dan data usaha hanya tersimpan di peramban itu. Hasil build berupa satu berkas JavaScript (`kpb.js`) plus berkas statis, tanpa dependensi saat dijalankan.

## Memasang di situs

Folder `dist/paket/` (hasil `npm run build`, sudah disertakan di repositori Git) berisi berkas yang siap diunggah ke hosting statis apa saja (Netlify, Cloudflare Pages, Vercel, GitHub Pages, atau server sendiri). Panduan lengkapnya, termasuk cara menampilkan di landing page lewat iframe atau ditanam langsung, header keamanan (CSP), mode offline, dan aturan pajak yang bisa diubah dari `config.js`, ada di [`dist/paket/README.md`](dist/paket/README.md).

## Isi repositori

| Folder atau berkas | Fungsi |
|---|---|
| `src/` | Kode sumber: mesin hitung (`engine-a.js`, `engine-b.js`), antarmuka (`ui-core.js`, `steps-*.js`, `results-*.js`, `main.js`), grafik (`charts.js`), ekspor dan laporan (`export.js`, `report.js`), gaya (`style.css`) |
| `paket-src/` | Berkas statis yang disalin ke paket: `index.html`, `config.js`, `iframe.html`, `sw.js`, `_headers`, README penerapan, ikon, gambar pratinjau tautan |
| `build.js` | Membangun `dist/paket/` (siap deploy) dan `dist/artifact.html` (versi satu halaman) |
| `dist/paket/` | Hasil build yang siap diunggah (dibuat ulang oleh `npm run build`) |
| `test/` | 12 rangkaian uji: mesin hitung, alur pemakaian, penyimpanan, ekspor, aksesibilitas, kontras, gerak, ditanam di situs lain, luring (PWA), isi paket |
| `tools/` | Alat bantu: `potret.cjs` (tangkapan layar di berbagai ukuran dan tema), `buat-ikon.cjs` |

## Memulai pengembangan

Butuh Node.js 18 atau lebih baru.

```
npm install
npx playwright install chromium
npm run build
npm test
```

- `npm run build` menghasilkan `dist/paket/` dan `dist/artifact.html`.
- `npm test` membangun ulang lalu menjalankan semua rangkaian uji (sekitar 6 menit). Satu rangkaian saja: `node test/semua.cjs alur`.
- Tangkapan layar untuk meninjau tampilan: `npm run potret -- shots/hp --lebar 390 --tinggi 844 --langkah 2,5 --ubin 1500`.

## Catatan untuk pengembang

- Mesin hitung (`engine-*.js`) tidak menyentuh DOM, jadi bisa diuji langsung di Node (`test/engine.test.js`).
- Aplikasi berjalan di dalam Shadow DOM supaya CSS situs tuan rumah tidak merusak tampilan. Semua id diberi awalan `kpb-`.
- Gaya dipasang lewat lembar gaya konstruktabel (`adoptedStyleSheets`), yang tidak terkena CSP `style-src`. Peramban tanpa fitur itu (Safari sebelum 16.4, Firefox sebelum 101) memakai `kpb.css`, salinan gaya yang sama, lewat `<link>`; karena itu `kpb.css` harus ikut diunggah bersama `kpb.js`.
- Token desain (warna, huruf, radius, gerak) ada di dua blok pertama `src/style.css` (terang dan gelap). Format blok itu dibaca oleh uji kontras, jadi ubah nilainya, jangan strukturnya.
- Semua animasi berada di dalam `@media (prefers-reduced-motion: no-preference)` atau dipasang lewat kelas yang hanya muncul bila gerak diizinkan.
- Kartu produk di Langkah 2 membangun isinya saat pertama dibuka (render malas), supaya data besar (12 produk dengan 40 bahan) tetap ringan.
- Uji peramban memakai Chromium lewat Playwright. Safari, Firefox, perangkat sungguhan, dan pembaca layar belum diuji.
- Perhitungan pajak disederhanakan (satu tarif atas laba atau omzet) dan hasilnya adalah proyeksi dari angka yang diisi pengguna, bukan nasihat keuangan atau pajak. Tarif bawaan dan tanggal pemeriksaannya ada di `src/engine-a.js` dan `src/config.js`.

## Lisensi

Belum ditentukan (`UNLICENSED` di `package.json`). Tambahkan berkas `LICENSE` sebelum repositori ini dibuka untuk umum. Font Plus Jakarta Sans (SIL OFL 1.1) dan pustaka SheetJS Community Edition (Apache 2.0) disertakan dengan lisensinya di `dist/paket/lisensi/`.
