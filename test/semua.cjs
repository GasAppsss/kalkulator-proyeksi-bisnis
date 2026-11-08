/* Menjalankan seluruh rangkaian uji berurutan dan menampilkan satu ringkasan.
   Pemakaian (dari folder kpb/):  node build.js && node test/semua.cjs [nama ...]
   Tanpa nama = semua uji. Setiap uji berjalan sebagai proses sendiri; kode keluar bukan nol berarti ada yang gagal. */
const cp = require('child_process');
const path = require('path');

const DAFTAR = [
  ['mesin', 'engine.test.js', 'mesin hitung: HPP, BEP, arus kas, pajak, skenario, normalisasi data'],
  ['potong', 'potong.test.js', 'pembantu grafik (garis yang memotong titik nol)'],
  ['alur', 'alur.cjs', 'alur pemakaian dari layar awal sampai hasil, dibandingkan dengan mesin hitung independen'],
  ['simpan', 'simpan.cjs', 'penyimpanan otomatis, cadangan, impor, data rusak, penyimpanan penuh atau diblokir'],
  ['ekspor', 'ekspor.cjs', 'Excel, JSON, ringkasan, laporan HTML, cetak'],
  ['audit', 'audit.cjs', 'aksesibilitas (axe-core), papan ketik, layar kecil, lebar isian di 22 ukuran layar, kinerja'],
  ['gerak', 'gerak.cjs', 'animasi: perpindahan langkah, grafik tergambar sekali, pesan memudar, tema, mode kurangi gerak, tanpa geser samping'],
  ['kontras', 'kontras.cjs', 'rasio kontras warna tema terang dan gelap'],
  ['tanam', 'tanam.cjs', 'ditanam di situs lain: CSS tuan rumah yang nakal, CSP ketat, iframe, kolom sempit'],
  ['pwa', 'pwa.cjs', 'luring, pemasangan, pembaruan, pembatalan'],
  ['pages', 'pages.cjs', 'GitHub Pages: isi docs/, berjalan dari alamat berfolder, service worker dan offline di subfolder'],
  ['artifact', 'artifact.cjs', 'versi artifact (unduhan lewat claude.use, CDN, tanpa riwayat)'],
  ['paket', 'paket.cjs', 'isi paket, dokumentasi sesuai kode, header server, contoh berjalan'],
];

const pilih = process.argv.slice(2);
const jalan = pilih.length ? DAFTAR.filter((d) => pilih.indexOf(d[0]) >= 0) : DAFTAR;
if (!jalan.length) { console.error('Nama uji tidak dikenal. Pilihan: ' + DAFTAR.map((d) => d[0]).join(', ')); process.exit(2); }

let ada_gagal = 0, jumlahLulus = 0, jumlahGagal = 0;
const awalSemua = Date.now();
console.log('Menjalankan ' + jalan.length + ' rangkaian uji\n');
jalan.forEach(([nama, berkas, ket]) => {
  const t0 = Date.now();
  const r = cp.spawnSync(process.execPath, [path.join(__dirname, berkas)], { encoding: 'utf8', timeout: 600000, maxBuffer: 64 * 1024 * 1024 });
  const keluar = (r.stdout || '') + (r.stderr || '');
  const m = [...keluar.matchAll(/(\d+) lulus, (\d+) gagal/g)].pop();
  const lulus = m ? +m[1] : 0, gagal = m ? +m[2] : 0;
  const ok = r.status === 0 && (!m || gagal === 0);
  jumlahLulus += lulus; jumlahGagal += gagal;
  if (!ok) ada_gagal++;
  console.log((ok ? 'LULUS ' : 'GAGAL ') + nama.padEnd(9) + (m ? (lulus + ' lulus, ' + gagal + ' gagal').padEnd(22) : (r.status === 0 ? 'ok'.padEnd(22) : ('kode ' + r.status).padEnd(22))) + ((Date.now() - t0) / 1000).toFixed(0).padStart(4) + ' dtk  ' + ket);
  if (!ok) keluar.split('\n').filter((b) => /^(GAGAL|UJI BERHENTI|AUDIT BERHENTI)|Error|assert/i.test(b)).slice(0, 25).forEach((b) => console.log('      ' + b.slice(0, 240)));
});
console.log('\nTotal ' + jumlahLulus + ' pemeriksaan lulus, ' + jumlahGagal + ' gagal, dalam ' + ((Date.now() - awalSemua) / 1000).toFixed(0) + ' detik. ' + (ada_gagal ? ada_gagal + ' rangkaian bermasalah.' : 'Semua rangkaian lulus.'));
process.exit(ada_gagal ? 1 : 0);
