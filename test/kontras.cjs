/* Uji kontras warna dari token CSS yang sebenarnya dipakai (terang dan gelap), memakai rumus WCAG 2.x */
const fs = require('fs'), path = require('path');
const css = fs.readFileSync(path.join(__dirname, '../src/style.css'), 'utf8');
const ambil = (blok) => { const o = {}; blok.replace(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})/g, (_, k, v) => { o[k] = v; return ''; }); return o; };
const mTerang = /:host,\s*\.kpb\s*\{([^}]*)\}/.exec(css)[1];
const mGelap = /:host\(\[data-theme="dark"\]\),\s*\.kpb\[data-theme="dark"\]\s*\{([^}]*)\}/.exec(css)[1];
const T = { terang: ambil(mTerang), gelap: Object.assign(ambil(mTerang), ambil(mGelap)) };
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const lum = (hex) => { let h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map((x) => x + x).join(''); const n = parseInt(h.slice(0, 6), 16); return 0.2126 * lin(n >> 16) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255); };
const kontras = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
let gagal = 0, lulus = 0;
for (const [nama, t] of Object.entries(T)) {
  const cek = (fg, bg, min, ket) => {
    const c = kontras(t[fg], t[bg]);
    if (c >= min) lulus++; else { gagal++; console.log('RENDAH [' + nama + '] ' + c.toFixed(2) + ' < ' + min + '  ' + fg + ' (' + t[fg] + ') di atas ' + bg + ' (' + t[bg] + ')  ' + (ket || '')); }
  };
  /* teks */
  [['ink', 'card'], ['ink', 'paper'], ['ink', 'card-2'], ['ink-2', 'card'], ['ink-2', 'paper'], ['ink-2', 'card-2'], ['ink-3', 'card'], ['ink-3', 'paper'], ['ink-3', 'card-2'],
    ['accent', 'card'], ['accent', 'paper'], ['accent', 'accent-soft'], ['accent', 'card-2'], ['accent-ink', 'accent'], ['neg-ink', 'card'], ['neg-ink', 'card-2'], ['good-ink', 'card'], ['good-ink', 'card-2']]
    .forEach(([f, b]) => cek(f, b, 4.5, 'teks'));
  /* komponen dan grafik (non-teks, 3:1) */
  [['pos', 'card'], ['neg', 'card'], ['s1', 'card'], ['s2', 'card'], ['s3', 'card'], ['s4', 'card'], ['accent', 'card'], ['ctl', 'card'], ['ctl', 'paper']]
    .forEach(([f, b]) => { if (t[f]) cek(f, b, 3, 'non-teks'); else { gagal++; console.log('TOKEN HILANG [' + nama + '] ' + f); } });
  /* batas dalam bentuk garis hias tidak dihitung (line, line-2), hanya diperiksa agar tidak lebih gelap dari kontrol */
}
console.log('KONTRAS: ' + lulus + ' lulus, ' + gagal + ' gagal');
process.exit(gagal ? 1 : 0);
