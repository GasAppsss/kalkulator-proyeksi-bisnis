/* Merakit src/ menjadi:
   - dist/paket/            paket siap unggah (index.html, kpb.js, config.js, fonts/, vendor/, dokumentasi)
   - dist/artifact.html     fragmen untuk halaman artifact claude.ai
   - dist/uji-artifact.html fragmen yang sama dengan kerangka dokumen penuh, untuk pengujian
   Pemakaian: node build.js [--tanpa-min] */
const fs = require('fs'), path = require('path');
const esbuild = require('esbuild');
const dir = (...p) => path.join(__dirname, ...p);
const baca = (p) => fs.readFileSync(dir(p), 'utf8');
const tulis = (p, isi) => { fs.mkdirSync(path.dirname(dir(p)), { recursive: true }); fs.writeFileSync(dir(p), isi); };
const salin = (dari, ke) => { fs.mkdirSync(path.dirname(dir(ke)), { recursive: true }); fs.copyFileSync(dari.startsWith('/') ? dari : dir(dari), dir(ke)); };
const minify = !process.argv.includes('--tanpa-min');
const TARGET = ['chrome80', 'safari13.1', 'firefox78', 'edge80'];

/* urutan penting: konfigurasi dan polyfill dulu, mesin, lalu antarmuka; main.js terakhir karena langsung menjalankan aplikasi */
const URUT = ['polyfill', 'config', 'engine-a', 'engine-b', 'sample', 'templates', 'ui-core', 'charts', 'steps-a', 'steps-b', 'steps-c', 'results-a', 'results-b', 'export', 'report', 'start', 'main'];
const sumber = URUT.map((n) => '/* --- ' + n + ' --- */\n' + baca('src/' + n + '.js')).join('\n');

const css = esbuild.transformSync(baca('src/style.css'), { loader: 'css', minify, target: TARGET }).code;

function bundel(artifact) {
  const isi = '(function(){"use strict";\nconst KPB_CSS=' + JSON.stringify(css) + ';\n' + sumber + '\n})();\n';
  /* SEBAGAI_ARTIFACT menjadi konstanta: cabang artifact (alamat CDN, claude.use) tidak ikut ke paket mandiri, dan sebaliknya */
  return esbuild.transformSync(isi, { minify, target: TARGET, legalComments: 'none', define: { SEBAGAI_ARTIFACT: artifact ? 'true' : 'false' } }).code;
}

/* ---- paket mandiri ---- */
/* keluaran selalu dibangun dari nol: berkas lama (font yang sudah tidak dipakai, sisa uji) tidak boleh ikut terbawa ke paket */
fs.rmSync(dir('dist'), { recursive: true, force: true });
const jsPaket = bundel(false);
tulis('dist/paket/kpb.js', jsPaket);
fs.cpSync(dir('paket-src'), dir('dist/paket'), { recursive: true });
/* gaya yang sama dengan yang tertanam di kpb.js. Dipakai lewat <link> oleh peramban tanpa lembar gaya konstruktabel
   (Safari sebelum 16.4, Firefox sebelum 101) di situs ber-CSP ketat, yang memblokir <style> sebaris */
tulis('dist/paket/kpb.css', css);
const FONT = dir('node_modules/@fontsource');
['plus-jakarta-sans-latin-300-normal', 'plus-jakarta-sans-latin-400-normal', 'plus-jakarta-sans-latin-500-normal', 'plus-jakarta-sans-latin-600-normal']
  .forEach((f) => salin(FONT + '/plus-jakarta-sans/files/' + f + '.woff2', 'dist/paket/fonts/' + f + '.woff2'));
salin(dir('node_modules/xlsx/dist/xlsx.mini.min.js'), 'dist/paket/vendor/xlsx.mini.min.js');
/* teks lisensi pihak ketiga ikut dalam paket */
salin(dir('node_modules/xlsx/LICENSE'), 'dist/paket/lisensi/sheetjs-Apache-2.0.txt');
salin(FONT + '/plus-jakarta-sans/LICENSE', 'dist/paket/lisensi/plus-jakarta-sans-OFL-1.1.txt');

/* service worker: versi dan daftar berkas diisi otomatis. Versi memuat sidik jari isi semua berkas yang disimpan,
   sehingga berkas sw.js berubah (dan peramban memasang versi baru) setiap kali salah satunya berubah */
const VERSI_APP = /const VERSI_APP = '([^']+)'/.exec(baca('src/config.js'))[1];
const daftarBerkas = (sub) => fs.readdirSync(dir('dist/paket/' + sub)).sort().map((f) => sub + '/' + f);
const PENDUKUNG = [...daftarBerkas('fonts'), ...daftarBerkas('vendor'), 'kpb.css', 'ikon-180.png', 'ikon-192.png', 'ikon-512.png', 'ikon-maskable-512.png'];
const INTI = ['index.html', 'kpb.js', 'config.js', 'awal.css', 'favicon.svg', 'manifest.webmanifest'];
const sidik = require('crypto').createHash('sha1');
[...INTI, ...PENDUKUNG].forEach((f) => sidik.update(f).update(fs.readFileSync(dir('dist/paket/' + f))));
tulis('dist/paket/sw.js', baca('paket-src/sw.js').replace('__VERSI__', VERSI_APP + '-' + sidik.digest('hex').slice(0, 8)).replace('__PENDUKUNG__', JSON.stringify(PENDUKUNG)));

/* ---- artifact ---- */
const frag = baca('src/artifact.src.html').replace('/*__JS__*/', () => bundel(true).replace(/<\/script/gi, '<\\/script'));
tulis('dist/artifact.html', frag);
const kerangka = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' + frag + '</body></html>';
tulis('dist/uji-artifact.html', kerangka);

const kb = (p) => (fs.statSync(dir(p)).size / 1024).toFixed(0) + ' KB';
console.log('dist/paket/kpb.js', kb('dist/paket/kpb.js'), '| css', (css.length / 1024).toFixed(0) + ' KB | artifact.html', kb('dist/artifact.html'));
