/* pembantu pengujian peramban: membuka paket lewat server lokal, mencatat galat konsol, dan menyederhanakan akses shadow root */
/* Playwright dari node_modules proyek (npm install); bila tidak ada, dari lokasi alat bersama di lingkungan ini */
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/npm-tools/node_modules/playwright'); } })();
const { mulai } = require('./serve.cjs');
const path = require('path');
const fs = require('fs');
const FOLDER = path.join(__dirname, '../dist/paket');
const KPB_DIR = path.join(__dirname, '..');

let lulus = 0, gagal = 0;
const hasil = [];
function cek(kondisi, pesan, info) {
  if (kondisi) lulus++;
  else { gagal++; hasil.push(pesan); console.log('GAGAL:', pesan, info === undefined ? '' : '=> ' + (typeof info === 'string' ? info : JSON.stringify(info))); }
}
const ringkas = (nama) => { console.log('\n' + (nama ? nama + ': ' : '') + lulus + ' lulus, ' + gagal + ' gagal'); return gagal; };

/* mesin hitung yang sama dengan di peramban, dimuat di Node sebagai pembanding independen */
let _mesin = null;
function mesin() {
  if (_mesin) return _mesin;
  const src = ['engine-a.js', 'engine-b.js', 'sample.js', 'templates.js'].map((f) => fs.readFileSync(path.join(KPB_DIR, 'src', f), 'utf8')).join('\n');
  _mesin = new Function(src + '\nreturn KPB;')();
  return _mesin;
}

/* skrip awal: akses cepat ke shadow root, dan penghitung pemanggilan print */
const SKRIP_AWAL = () => {
  window.__R = () => { const h = document.getElementById('kpb-root'); return h && h.shadowRoot; };
  window.__cetak = 0;
  window.print = function () { try { window.top.__cetak = (window.top.__cetak || 0) + 1; } catch (e) { window.__cetak++; } };
};

async function bukaApp(o = {}) {
  const srv = o.srv || await mulai(o.folder || FOLDER);
  const browser = o.browser || await chromium.launch();
  const ctx = o.ctx || await browser.newContext(Object.assign({ viewport: { width: 1280, height: 900 }, locale: 'id-ID', timezoneId: 'Asia/Jakarta', reducedMotion: 'reduce' }, o.context || {}));
  if (!o.ctx) {
    await ctx.addInitScript(SKRIP_AWAL);
    if (o.init) await ctx.addInitScript(o.init);
  }
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') logs.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
  page.on('requestfailed', (r) => logs.push('requestfailed: ' + r.url()));
  if (o.path !== null) {
    await page.goto(srv.url + (o.path || '/'));
    if (o.tunggu !== false) await page.waitForSelector(o.tunggu || '#kpb-view', { timeout: 8000 });
  }
  const tutup = async () => { await ctx.close(); if (!o.browser) await browser.close(); if (!o.srv) srv.srv.close(); };
  return { page, srv, browser, ctx, logs, tutup };
}

/* isi kolom dengan ketikan sungguhan agar penanganan input dan format angka ikut teruji */
async function isi(page, sel, nilai) {
  const el = page.locator(sel);
  await el.click();
  await page.keyboard.press('Control+A');
  if (String(nilai) === '') await page.keyboard.press('Backspace'); else await page.keyboard.type(String(nilai));
}
const teks = (page, sel) => page.locator(sel).innerText();
const adaGulir = (page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);

/* seluruh teks yang terlihat di dalam aplikasi (shadow root) */
const teksApp = (page) => page.evaluate(() => { const r = window.__R(); const a = r && r.getElementById('kpb-app'); return a ? a.innerText : ''; });
/* data usaha yang tersimpan di localStorage (setelah jeda simpan otomatis) */
async function dataTersimpan(page, kunci) {
  await page.waitForTimeout(500);
  return page.evaluate((k) => { try { const o = JSON.parse(localStorage.getItem(k || 'kpb:data')); return o && o.data; } catch (e) { return null; } }, kunci);
}
/* kata-kata yang tidak boleh muncul di layar */
const KOTOR = /\bNaN\b|\bInfinity\b|\bundefined\b|\bnull\b|\[object|−?Rp\s*−?Rp|--|\bNaN%/;
async function layarBersih(page) {
  const t = await teksApp(page);
  const m = t.match(KOTOR);
  return m ? { kotor: m[0], konteks: t.slice(Math.max(0, t.indexOf(m[0]) - 60), t.indexOf(m[0]) + 60).replace(/\n/g, ' | ') } : null;
}
const gelap = (ms) => new Promise((r) => setTimeout(r, ms));
/* membaca _headers (format Netlify/Cloudflare Pages) dari paket dan menghasilkan fungsi (path) => header, seperti yang dilakukan hosting:
   semua aturan yang cocok berlaku, dan header bernama sama digabung dengan ", " */
function headersPaket(ganti) {
  const aturan = [];
  let kini = null;
  fs.readFileSync(path.join(FOLDER, '_headers'), 'utf8').split('\n').forEach((ln) => {
    if (!ln.trim() || /^\s*#/.test(ln)) return;
    if (/^\S/.test(ln)) { kini = { pola: ln.trim(), h: [] }; aturan.push(kini); return; }
    const m = /^\s+([^:]+):\s*(.*)$/.exec(ln);
    if (m && kini) kini.h.push([m[1].trim(), (ganti ? ganti(m[2].trim()) : m[2].trim())]);
  });
  const cocok = (pola, p) => (pola === '/*' ? true : pola.endsWith('/*') ? p.startsWith(pola.slice(0, -1)) : pola === p);
  return (p) => {
    const out = {};
    aturan.filter((a) => cocok(a.pola, p)).forEach((a) => a.h.forEach(([k, v]) => { out[k] = out[k] ? out[k] + ', ' + v : v; }));
    return out;
  };
}
/* buka langkah n (1-6) lewat stepper */
const langkah = async (page, n) => { await page.locator('#kpb-steps li:nth-child(' + n + ') button').click(); await page.waitForSelector('#kpb-panel > *'); await page.waitForTimeout(120); };

module.exports = { bukaApp, isi, teks, adaGulir, cek, ringkas, mulai, chromium, FOLDER, KPB_DIR, mesin, teksApp, dataTersimpan, layarBersih, KOTOR, gelap, langkah, SKRIP_AWAL, headersPaket, path, fs };
