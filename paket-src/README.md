# Kalkulator Proyeksi Bisnis: HPP, BEP, dan Balik Modal

Kalkulator web berbahasa Indonesia untuk menghitung HPP per produk, harga jual, titik impas (BEP), laba rugi, arus kas, dan balik modal (payback, ROI, NPV, IRR), lengkap dengan skenario dan simulasi sensitivitas. Semua perhitungan berjalan di peramban pengguna. **Tidak ada server, tidak ada akun, tidak ada data yang dikirim ke mana pun.**

Paket ini berisi berkas statis. Cukup unggah foldernya ke hosting apa saja, tanpa build dan tanpa dependensi.

## Isi paket

| Berkas | Fungsi |
|---|---|
| `index.html` | Halaman mandiri (alamat sendiri, misalnya `situsanda.com/kalkulator/`) |
| `iframe.html` | Versi untuk dimasukkan ke halaman lain lewat iframe, tinggi menyesuaikan isi |
| `config.js` | Pengaturan halaman mandiri (tema, merek, ajakan bertindak, analitik, aturan pajak) |
| `config-iframe.js` | Pengaturan untuk `iframe.html` |
| `kpb.js` | Aplikasi (satu berkas, sekitar 175 KB atau 57 KB setelah gzip, tanpa dependensi) |
| `kpb.css` | Salinan gaya yang sama dengan yang tertanam di `kpb.js`. Hanya dibaca peramban lama (Safari sebelum 16.4, Firefox sebelum 101), tetapi unggah bersama `kpb.js` (lihat Kompatibilitas) |
| `awal.css`, `favicon.svg`, `ikon-*.png`, `manifest.webmanifest`, `sw.js` | Halaman pembuka, ikon, dan mode offline (opsional) |
| `og-image.png` | Gambar pratinjau 1200 x 630 untuk tautan yang dibagikan (lihat "Pratinjau saat tautan dibagikan") |
| `fonts/`, `vendor/xlsx.mini.min.js` | Font dan pustaka Excel, disajikan dari domain sendiri (tidak memakai CDN) |
| `contoh-iframe.html`, `contoh-inline.html` | Contoh pemasangan yang bisa langsung dibuka |
| `_headers`, `server/` | Header keamanan untuk Netlify, Cloudflare Pages, Vercel, Nginx, dan Apache |
| `lisensi/`, `LISENSI-PIHAK-KETIGA.txt` | Lisensi font dan pustaka yang disertakan |

Setelah memastikan semuanya berjalan, Anda boleh menghapus `README.md`, `contoh-*.html`, dan `server/` dari folder yang dipublikasikan.

## Pasang dalam 3 menit

1. **Unggah seluruh folder** ke hosting statis: Netlify (seret folder ke dashboard), Cloudflare Pages, Vercel (`vercel --prod` di dalam folder), GitHub Pages, atau server Anda sendiri. Semua alamat berkas bersifat relatif, jadi boleh diletakkan di akar domain atau di subfolder.
2. **Buka** `https://domainanda.com/kalkulator/`. Halaman langsung berjalan dengan data contoh.
3. **Ubah `config.js`** bila perlu (merek, tombol ajakan bertindak, analitik). Tidak perlu membangun ulang apa pun.
4. **Pasang header keamanan** dari `_headers` atau `server/` (lihat bagian Keamanan). Ini satu-satunya langkah yang bergantung pada hosting Anda.

### Pratinjau saat tautan dibagikan (opsional)

Agar tautan ke `index.html` tampil dengan judul dan gambar di WhatsApp, Facebook, atau X, buka `index.html`, hapus tanda komentar pada blok yang diawali "Pratinjau saat tautan dibagikan", lalu ganti `https://situsanda.com/kalkulator/` dengan alamat folder ini di domain Anda. Aplikasi pembaca tautan hanya menerima alamat lengkap, bukan alamat relatif, karena itu blok ini dimatikan sampai alamat Anda diketahui. Gambar `og-image.png` (1200 x 630) sudah ada di folder; gantilah dengan gambar merek Anda bila perlu, dengan ukuran yang sama. CSP tidak perlu diubah. Setelah diunggah, uji dengan mengirim tautan ke diri sendiri; aplikasi pembaca tautan menyimpan pratinjau lama beberapa hari, jadi tambahkan `?v=2` pada tautan bila gambar belum berubah. `iframe.html` sengaja tidak diindeks (`noindex`) dan tidak memerlukan blok ini.

## Tiga cara menampilkannya di situs Anda

### 1. Tautan ke halaman mandiri (paling mudah)

```html
<a href="/kalkulator/">Hitung proyeksi bisnis Anda</a>
```

### 2. iframe (disarankan untuk landing page)

Tinggi iframe mengikuti isi, halaman tidak ikut tergulir ke atas saat pindah langkah, dan peristiwa pemakaian bisa diteruskan ke analitik Anda. Contoh lengkap yang bisa dicoba ada di `contoh-iframe.html`.

```html
<iframe id="kpb-frame" src="https://kalkulator.situsanda.com/iframe.html"
        title="Kalkulator proyeksi bisnis" style="width:100%;height:700px;border:0" loading="lazy"></iframe>
<script>
(function () {
  var f = document.getElementById('kpb-frame');
  var ASAL = new URL(f.src).origin;
  window.addEventListener('message', function (e) {
    if (e.origin !== ASAL || e.source !== f.contentWindow) return;
    var d = e.data;
    if (!d || d.kpb !== 1) return;
    if (d.jenis === 'tinggi') f.style.height = d.tinggi + 'px';
    if (d.jenis === 'gulir')  window.scrollTo({ top: f.getBoundingClientRect().top + window.scrollY + d.y - 12, behavior: 'smooth' });
    if (d.jenis === 'siap')   f.contentWindow.postMessage({ kpb: 1, jenis: 'tema', tema: 'terang' }, ASAL);
    if (d.jenis === 'event')  { /* kirim d.event.nama dan d.event.props ke analitik */ }
  });
})();
</script>
```

Pengaturan di `config-iframe.js`:

- Isi `INDUK` dengan alamat situs Anda (`'https://situsanda.com'`). Hanya situs itu yang menerima pesan dari iframe. Bila dibiarkan kosong, alamat induk diambil otomatis dari `document.referrer`; bila situs Anda memakai `Referrer-Policy: no-referrer`, isi `INDUK` secara eksplisit.
- Tema: `iframe.html?tema=gelap`, atau kirim pesan `{ kpb: 1, jenis: 'tema', tema: 'gelap' }` dari halaman induk saat pengunjung mengganti tema (nilai: `terang`, `gelap`, `auto`).
- Ubah header `frame-ancestors` di `_headers` atau `server/` agar hanya domain Anda yang boleh menanam `iframe.html`.

Pesan dari iframe ke halaman induk:

| `jenis` | Isi | Gunanya |
|---|---|---|
| `tinggi` | `tinggi` (piksel) | Mengatur tinggi iframe |
| `gulir` | `y` (posisi dalam iframe) | Menggulir halaman induk saat pindah langkah |
| `siap` | `versi` | Kalkulator sudah berjalan; kirim tema awal |
| `event` | `event` | Peristiwa pemakaian (lihat Analitik) |

### 3. Ditanam langsung tanpa iframe

Kalkulator memakai Shadow DOM: gayanya tidak bocor ke halaman Anda dan CSS halaman Anda tidak merusak tampilannya. Titik putus tata letak mengikuti lebar kolom tempatnya ditanam, bukan lebar layar. Contoh: `contoh-inline.html`.

```html
<div id="kpb-root"></div>
<script>
  window.KPB_CONFIG = { mode: 'tertanam', kunci: 'situs', merek: 'Nama Situs Anda' };
</script>
<script src="/kalkulator/kpb.js" defer></script>
```

Jangan memberi gaya langsung pada `#kpb-root` (misalnya `font-size` atau `color`); atur lebar dan margin lewat elemen pembungkusnya. Bila ada lebih dari satu halaman atau kalkulator di domain yang sama, beri nilai `kunci` yang berbeda agar penyimpanannya tidak bercampur.

**Kerangka seperti Next.js, Nuxt, atau Astro:** letakkan folder ini di `public/kalkulator/` dan tampilkan lewat iframe (cara 2). Alamat `/kalkulator/` perlu `rewrites` ke `/kalkulator/index.html` (Next.js). Menanam langsung di komponen React/Vue juga bisa, tetapi harus dilakukan di sisi klien saja setelah `window.KPB_CONFIG` terpasang. **WordPress, Webflow, Wix, Framer:** unggah folder ke hosting terpisah, lalu tempelkan iframe lewat blok HTML/embed.

## Pengaturan (`config.js`)

Semua opsional. Yang dihapus kembali ke nilai bawaan.

| Opsi | Bawaan | Keterangan |
|---|---|---|
| `tema` | `'auto'` | `'auto'` mengikuti halaman (atribut `data-theme` atau `data-bs-theme` pada `<html>`, kelas `dark`) lalu perangkat; atau `'terang'` / `'gelap'` |
| `mode` | `'mandiri'` | `'tertanam'` untuk di dalam halaman lain: tanpa judul `h1`, tanpa perubahan judul tab, tanpa tombol Kembali peramban |
| `merek` | `''` | Nama merek di kaki halaman dan laporan |
| `kebijakan` | `''` | Alamat halaman kebijakan privasi Anda (ditampilkan sebagai tautan) |
| `cta` | `null` | Kartu ajakan di akhir hasil: `{ judul, isi, tombol, href, target }`. Hanya alamat `http`, `https`, atau relatif yang diterima |
| `onEvent` | `null` | Fungsi `(e) => {}` untuk analitik (lihat bawah) |
| `tinggiOtomatis` | `false` | Kirim tinggi isi ke halaman induk (khusus iframe) |
| `indukOrigin` | `'*'` | Asal yang boleh menerima pesan dari iframe. Isi dengan alamat situs Anda |
| `riwayat` | otomatis | Tombol Kembali peramban berpindah langkah. Aktif di halaman mandiri, mati di mode tertanam |
| `kunci` | `'kpb'` | Awalan kunci penyimpanan peramban |
| `xlsxSrc` | `''` | Alamat pustaka Excel; kosong memakai `vendor/xlsx.mini.min.js` di samping `kpb.js` |
| `pajak` | `null` | Timpa tarif pajak tanpa membangun ulang (lihat Aturan pajak) |
| `tglAturan` | `''` | Tanggal pemeriksaan aturan pajak yang ditampilkan di kaki halaman dan laporan |
| `pwa` | `false` (di `config.js` paket: `true`) | Daftarkan `sw.js`: bisa dipasang di layar utama dan dibuka tanpa internet. Hanya halaman mandiri, butuh HTTPS |

Fungsi yang tersedia di halaman: `window.KPBApp.versi`, `KPBApp.setTema('terang' | 'gelap' | 'auto')`, `KPBApp.bukaLangkah(1..6)`, dan `KPBApp.layarAwal()`.

## Analitik

Setiap peristiwa dikirim tiga jalur sekaligus: fungsi `onEvent`, `CustomEvent` bernama `kpb:event` pada `#kpb-root` (bisa didengar dari mana saja di halaman), dan pesan ke halaman induk bila berada di iframe. Bentuknya `{ sumber: 'proyeksi-bisnis', nama, props, t }`. **Peristiwa tidak pernah memuat angka usaha, nama usaha, atau data pengguna.**

```js
onEvent: function (e) { window.gtag && gtag('event', e.nama, e.props); }
```

| `nama` | Kapan | `props` |
|---|---|---|
| `app_dibuka` | Kalkulator tampil | `mode`, `versi` |
| `contoh_dimuat` | Pengguna memilih contoh usaha | `id` contoh |
| `mulai_kosong` | Pengguna memulai dari kosong | |
| `cepat_dihitung` | Perkiraan cepat pertama kali terisi | |
| `cepat_dilanjutkan` | Perkiraan cepat dilanjutkan ke langkah rinci | |
| `langkah_dibuka` | Pindah langkah | `langkah` (1 sampai 6) |
| `hasil_dilihat` | Pertama kali membuka halaman hasil | |
| `unduh_excel`, `unduh_json`, `unduh_laporan`, `cetak_laporan`, `salin_ringkasan`, `data_dibuka` | Ekspor dan impor | |
| `cta_klik` | Klik tombol ajakan | `teks` tombol |
| `galat` | Kesalahan tak terduga | `pesan` (maks. 120 karakter) |

## Keamanan

- **Skrip dan gaya hanya dari domain sendiri.** Tidak ada skrip, gaya, font, atau gambar dari pihak ketiga, dan tidak ada `eval`. Kalkulator berjalan di bawah CSP ketat tanpa `'unsafe-inline'` (diuji): `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; base-uri 'none'; form-action 'none'`. File `_headers` dan `server/` sudah memuatnya, ditambah `frame-ancestors`, `nosniff`, `Referrer-Policy`, dan `Permissions-Policy`.
- **Pasang `frame-ancestors`.** Halaman mandiri: `'none'`. `iframe.html`: hanya domain Anda. Ganti `situsanda.com` di berkas konfigurasi server. GitHub Pages tidak bisa mengatur header; pakai Netlify, Cloudflare Pages, Vercel, atau server sendiri bila Anda memerlukannya.
- **Data pengguna dirender sebagai teks**, bukan HTML, termasuk nama usaha, nama produk, dan isi berkas JSON yang diimpor. Tautan ajakan bertindak yang diawali `javascript:` ditolak.
- **Pesan antar-jendela** dibatasi: iframe hanya mengirim ke `indukOrigin` dan hanya menerima perintah tema dari induk langsungnya (dan dari asal yang diatur).
- **Berkas JSON impor** diperiksa dan dinormalkan (maksimal 3 MB); data rusak tidak membuat aplikasi macet, dan salinan data lama tetap disimpan.

## Privasi dan penyimpanan

Data usaha disimpan otomatis di `localStorage` peramban pengguna (kunci `kpb:data`, `kpb:langkah`, `kpb:cepat`, `kpb:rusak`; awalannya mengikuti opsi `kunci`). Tidak ada cookie dan tidak ada permintaan ke pihak ketiga; yang dimuat hanya berkas dari folder ini (termasuk pustaka Excel dari `vendor/` saat pengguna mengunduh Excel). Pengguna diingatkan untuk mencadangkan lewat menu **Data dan ekspor** karena penyimpanan peramban bisa terhapus (membersihkan data situs, mode pribadi, ganti perangkat). Bila peramban menolak menyimpan, status simpan berubah menjadi peringatan "Belum tersimpan di peramban. Unduh cadangan." dan peramban menahan penutupan tab sampai data dicadangkan.

Analitik yang Anda sambungkan sendiri lewat `onEvent` menjadi tanggung jawab Anda, termasuk persetujuan pengguna bila diwajibkan di wilayah Anda.

## Aturan pajak

Pajak dihitung **disederhanakan** (satu tarif atas omzet atau laba, tanpa koreksi fiskal, tanpa PPN, dan tanpa kompensasi kerugian). Setelan bawaan, diperiksa terakhir **Oktober 2026**:

| Pilihan | Dasar |
|---|---|
| Orang pribadi (`op-final`) | PPh final 0,5% dari omzet, omzet sampai Rp500 juta per tahun bebas pajak, batas omzet Rp4,8 miliar (PP 20/2026) |
| PT perorangan (`pt-perorangan`) | PPh final 0,5% dari omzet tanpa batas waktu, batas omzet Rp4,8 miliar |
| Koperasi (`koperasi`) | PPh final 0,5% dari omzet, batas omzet Rp4,8 miliar. Koperasi dibatasi empat tahun pajak sejak terdaftar; batas waktu itu belum dimodelkan, jadi 0,5% dihitung sepanjang periode proyeksi |
| PT/CV Pasal 31E (`badan-31e`) | Tarif efektif 11% atas laba untuk omzet sampai Rp4,8 miliar |
| PT/CV tarif umum (`badan`) | 22% atas laba |
| `tanpa`, `manual` | Tanpa pajak, atau diatur sendiri oleh pengguna |

CV dan PT selain PT perorangan tidak lagi menjadi penerima baru PPh final 0,5% (yang sudah memakainya mendapat masa transisi), karena itu keduanya dihitung dari laba. Tautan sumber (Direktorat Jenderal Pajak, DDTCNews, IKPI) tampil di Langkah 4 aplikasi.

Bila aturan berubah, Anda tidak perlu menunggu pembaruan aplikasi. Cukup ubah `config.js`:

```js
pajak: { 'op-final': { pajakOmzet: 0.5, pajakBebas: 500000000, batasOmzetFinal: 4800000000 } },
tglAturan: 'Januari 2027',
```

Satuan: `pajakOmzet` dan `pajakLaba` dalam persen; `pajakBebas` dan `batasOmzetFinal` dalam rupiah. Hasil kalkulator adalah proyeksi dari angka yang diisi pengguna, bukan nasihat keuangan atau pajak; pengguna disarankan berkonsultasi dengan akuntan.

## Mode offline dan pasang di layar utama (opsional)

Dengan `pwa: true` di `config.js` (sudah aktif di paket ini), halaman mandiri mendaftarkan `sw.js`. Setelah dibuka sekali lewat HTTPS, kalkulator tetap bisa dipakai tanpa internet, termasuk ekspor Excel, dan bisa dipasang di layar utama ponsel. Strategi: jaringan dulu supaya pengguna online selalu mendapat versi terbaru, salinan tersimpan dipakai bila jaringan gagal atau lebih lambat dari 4 detik. Salinan lama dibuang otomatis saat versi baru dipasang. Tidak aktif di mode tertanam dan iframe. Untuk mematikannya, ubah `pwa: false` dan ganti isi `sw.js` dengan skrip pembatal berikut supaya pengguna yang sudah terdaftar ikut berhenti memakai salinan lama:

```js
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (k) { return Promise.all(k.map(function (n) { return caches.delete(n); })); })
    .then(function () { return self.registration.unregister(); }));
});
```

## Kompatibilitas

Kode dikompilasi untuk target Chrome dan Edge 80+, Firefox 78+, dan Safari 13.1+ (serta peramban ponsel yang setara); fitur yang lebih baru dipakai dengan cadangan otomatis. Tata letak penuh membutuhkan Safari 14.1+ (properti `gap` pada flexbox); di versi yang lebih lama jarak antarelemen tertentu hilang dan tampilan lebih rapat. Peramban tanpa lembar gaya konstruktabel (Safari sebelum 16.4, Firefox sebelum 101) memasang gaya dari `kpb.css`, jadi **`kpb.css` wajib ikut diunggah di samping `kpb.js`**. Di situs ber-CSP ketat itulah satu-satunya jalur gaya sampai ke peramban tersebut, karena `<style>` sebaris diblokir (konsol menampilkan satu pesan penolakan; tampilan tetap utuh). Peramban yang terlalu lama (tanpa Shadow DOM) menampilkan pesan agar diperbarui. Tema gelap, layar sentuh, dan lebar 320 sampai 1920 piksel didukung. Animasi dibuat pelan dan hanya menjawab tindakan pengguna (pindah langkah, grafik pertama kali terlihat, pesan, ganti tema); semuanya mati bila perangkat meminta gerak dikurangi (`prefers-reduced-motion`). Cetak atau simpan PDF memakai jendela cetak peramban; di Safari laporan dibuka di tab baru lebih dulu.

**Yang sudah diuji:** uji otomatis di Chromium (Playwright) untuk alur penuh lima contoh usaha, penyimpanan dan data rusak, ekspor Excel/JSON/laporan, aksesibilitas (axe-core: 0 pelanggaran, WCAG 2.2 AA termasuk ukuran sasaran sentuh dan kontras), tata letak pada 8 lebar dan kecukupan lebar isian pada 22 lebar layar (320 sampai 1920 piksel), animasi (termasuk mode kurangi gerak dan tidak ada geser samping), CSP ketat (termasuk peramban tanpa lembar gaya konstruktabel, yang memakai `kpb.css`), CSS halaman induk yang agresif, iframe, kolom sempit, dan mode offline; serta 900+ pemeriksaan mesin hitung yang dibandingkan dengan perhitungan independen.
**Belum diuji:** perangkat nyata (iPhone, Android, tablet), Safari dan Firefox, serta pembaca layar sungguhan (NVDA, VoiceOver, TalkBack). Uji di perangkat dan peramban yang dipakai pelanggan Anda sebelum rilis besar.

## Batasan yang perlu diketahui

- Proyeksi bergantung pada asumsi yang diisi pengguna; kalkulator memberi peringatan untuk isian yang tidak wajar tetapi tidak bisa menilai kewajarannya.
- Data tersimpan per peramban dan per perangkat; tidak ada sinkronisasi antarperangkat. Ekspor JSON adalah cara memindahkan data.
- Pajak disederhanakan (lihat di atas); batas empat tahun pajak untuk koperasi dan masa transisi untuk CV belum dimodelkan.
- Di iPhone dan iPad, Safari dapat menghapus data situs (termasuk `localStorage`) bila pengguna tidak berinteraksi dengan situs itu selama tujuh hari pemakaian Safari. Kalkulator yang dipasang ke layar utama dihitung terpisah menurut pemakaiannya sendiri, jadi lebih aman. Sarankan pengguna iPhone memasangnya ke layar utama dan rutin mencadangkan lewat menu **Data dan ekspor**.
- Tombol **Cetak** tetap bergaya di situs ber-CSP ketat karena laporan dipasang lewat DOM dan `adoptedStyleSheets`. Peramban yang belum mendukungnya (Safari sebelum 16.4, Firefox sebelum 101) memakai elemen `<style>`, yang diblokir CSP ketat; di sana pengguna bisa memakai **Unduh laporan (.html)** lalu mencetaknya.

## Memperbarui versi

Ganti `kpb.js`, `kpb.css`, `sw.js`, `awal.css`, dan folder `fonts/` serta `vendor/` dengan versi baru; biarkan `config.js` dan `config-iframe.js` Anda. Pengguna yang online langsung mendapat versi baru. Data pengguna tetap karena format penyimpanan berversi dan data lama dimigrasikan otomatis.

## Lisensi

Font Plus Jakarta Sans (SIL OFL 1.1) serta pustaka SheetJS Community Edition (Apache 2.0) disertakan dengan lisensinya masing-masing di `lisensi/`. Lisensi kode kalkulator ditentukan oleh pemilik proyek.
