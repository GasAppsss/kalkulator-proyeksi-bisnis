/* Uji penanaman di halaman lain: inline, iframe dengan tinggi otomatis, CSS induk yang nakal, CSP ketat, peramban lama, tema */
const L = require('./lib.cjs');
const { cek, isi, teks, langkah, path, fs } = L;
const ROOT = path.join(L.KPB_DIR, 'dist/_tanam');
const sed = (s, a, b) => s.split(a).join(b);

function siapkan() {
  fs.rmSync(ROOT, { recursive: true, force: true });
  fs.mkdirSync(ROOT, { recursive: true });
  fs.cpSync(L.FOLDER, path.join(ROOT, 'kalkulator'), { recursive: true });
  const css = 'body{font-family:Georgia,serif;color:#333;text-align:center;line-height:1.8;margin:0;padding:24px;background:#fff}h1{font-size:44px;letter-spacing:-1px}.hero{background:#123;color:#fff;padding:40px}';
  fs.writeFileSync(path.join(ROOT, 'inline.html'),
    '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Halaman SaaS Contoh</title><style>' + css + '</style></head><body>' +
    '<div class="hero"><h1>Produk SaaS Anda</h1><p>Kalimat pemasaran.</p></div><h2>Hitung dulu usaha Anda</h2>' +
    '<div id="kpb-root"></div><footer><p>Kaki halaman SaaS</p></footer>' +
    '<script>window.__events=[];window.KPB_CONFIG={mode:"tertanam",tema:"terang",merek:"Contoh SaaS",kunci:"situsA",' +
    'cta:{judul:"Siap menjalankan rencana ini?",isi:"Catat penjualan dalam satu aplikasi.",tombol:"Coba gratis",href:"https://contoh.com/daftar",target:"_blank"},' +
    'onEvent:function(e){window.__events.push(e)}};</script><script src="/kalkulator/kpb.js" defer></script></body></html>');
  /* CTA berbahaya */
  fs.writeFileSync(path.join(ROOT, 'cta-jahat.html'),
    '<!doctype html><html><head><meta charset="utf-8"><title>x</title></head><body><div id="kpb-root"></div>' +
    '<script>window.KPB_CONFIG={mode:"tertanam",cta:{judul:"Judul",isi:"Isi",tombol:"Klik",href:"javascript:window.__xss=1"}};</script><script src="/kalkulator/kpb.js" defer></script></body></html>');
  /* tema otomatis mengikuti halaman */
  fs.writeFileSync(path.join(ROOT, 'tema.html'),
    '<!doctype html><html data-theme="light"><head><meta charset="utf-8"><title>x</title></head><body><div id="kpb-root"></div>' +
    '<script>window.KPB_CONFIG={mode:"tertanam",tema:"auto"};</script><script src="/kalkulator/kpb.js" defer></script></body></html>');
  /* CSS induk yang nakal */
  const nakal = '*{box-sizing:content-box!important;font-family:"Comic Sans MS",cursive!important;letter-spacing:5px!important;text-transform:uppercase!important;word-spacing:9px!important}' +
    'div,section,main{color:red!important;font-size:40px!important;line-height:3!important;text-align:right!important;direction:rtl!important;font-weight:900!important;font-style:italic!important;text-shadow:2px 2px 0 #f0f!important;white-space:pre!important;cursor:wait!important}' +
    'button,input,select,textarea,a,p,h1,h2,h3,span,label,summary,li,table,td,th{margin:30px!important;padding:30px!important;background:yellow!important;border:6px dashed lime!important;color:red!important;font-size:40px!important}' +
    'svg,svg *{fill:red!important;stroke:blue!important}';
  fs.writeFileSync(path.join(ROOT, 'nakal.html'),
    '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Nakal</title><style>' + nakal + '</style></head><body><div id="kpb-root"></div>' +
    '<script>window.KPB_CONFIG={mode:"tertanam"};</script><script src="/kalkulator/kpb.js" defer></script></body></html>');
  /* kolom dengan lebar tetap di halaman yang lebar */
  const kolom = (w) => '<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Kolom</title><style>body{margin:0;padding:24px;font-family:Georgia,serif}.kolom{width:' + w + 'px;margin:0 auto;border:1px dashed #999}</style></head><body><div class="kolom"><div id="kpb-root"></div></div>' +
    '<script>window.KPB_CONFIG={mode:"tertanam"};</script><script src="/kalkulator/kpb.js" defer></script></body></html>';
  [360, 600, 780, 1000].forEach((w) => fs.writeFileSync(path.join(ROOT, 'kolom-' + w + '.html'), kolom(w)));
  /* iframe: halaman induk dan halaman isi */
  const iframeIsi = fs.readFileSync(path.join(ROOT, 'kalkulator/index.html'), 'utf8')
    .replace('<script src="config.js"></script>', '<script>window.KPB_CONFIG={mode:"tertanam",tinggiOtomatis:true,indukOrigin:location.origin};</script>');
  fs.writeFileSync(path.join(ROOT, 'kalkulator/iframe.html'), iframeIsi);
  fs.writeFileSync(path.join(ROOT, 'kalkulator/iframe-asing.html'), iframeIsi.replace('indukOrigin:location.origin', 'indukOrigin:"https://tidak-sama.example"'));
  const induk = (src, id) => '<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Induk</title></head><body style="margin:0;font-family:system-ui">' +
    '<section style="height:700px;background:#123;color:#fff;padding:40px">Hero halaman SaaS</section>' +
    '<iframe id="' + id + '" src="' + src + '" title="Kalkulator" style="width:100%;height:600px;border:0;display:block"></iframe>' +
    '<section style="height:1200px;padding:40px">Kaki halaman SaaS</section>' +
    '<script>window.__pesan=[];window.addEventListener("message",function(e){if(e.origin!==location.origin)return;var d=e.data;if(!d||d.kpb!==1)return;window.__pesan.push(d);' +
    'var f=document.getElementById("' + id + '");if(d.jenis==="tinggi")f.style.height=d.tinggi+"px";' +
    'if(d.jenis==="gulir")window.scrollTo({top:f.getBoundingClientRect().top+window.scrollY+d.y,behavior:"instant"});});</script></body></html>';
  fs.writeFileSync(path.join(ROOT, 'induk.html'), induk('/kalkulator/iframe.html', 'k'));
  fs.writeFileSync(path.join(ROOT, 'induk-asing.html'), induk('/kalkulator/iframe-asing.html', 'k'));
}

const gayaAda = (p) => p.evaluate(() => { const b = window.__R().querySelector('.btn.pri') || window.__R().querySelector('.btn'); const cs = getComputedStyle(b); return { bg: cs.backgroundColor, font: cs.fontFamily, border: cs.borderTopColor }; });

(async () => {
  siapkan();
  const srv = await L.mulai(ROOT);
  const browser = await L.chromium.launch();

  /* ===== A. tanam inline ===== */
  {
    const A = await L.bukaApp({ srv, browser, path: '/inline.html' });
    const p = A.page;
    cek(await p.title() === 'Halaman SaaS Contoh', 'judul halaman induk tidak diubah');
    await p.locator('#kpb-judul-cepat').waitFor();
    cek(p.url().indexOf('#') < 0, 'tanpa hash di URL pada mode tertanam', p.url());
    cek(await p.evaluate(() => window.__R().querySelectorAll('h1').length) === 0, 'mode tertanam tidak membuat h1 kedua');
    cek(await p.evaluate(() => window.__R().querySelectorAll('main').length) === 0, 'mode tertanam tidak membuat landmark main kedua');
    cek(await p.evaluate(() => !!window.__R().querySelector('section.utama[aria-label]')), 'mode tertanam memakai region bernama');
    const h1induk = await p.evaluate(() => { const cs = getComputedStyle(document.querySelector('h1')); return cs.fontSize + '|' + cs.letterSpacing; });
    cek(h1induk === '44px|-1px', 'gaya halaman induk tidak terganggu', h1induk);
    cek(await p.evaluate(() => document.querySelectorAll('style').length) <= 2, 'tidak ada gaya global bocor ke halaman induk (hanya gaya induk dan font)', await p.evaluate(() => document.querySelectorAll('style').length));
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    cek(await p.title() === 'Halaman SaaS Contoh', 'judul induk tetap setelah pindah langkah');
    cek(p.url().indexOf('#') < 0, 'URL tetap tanpa hash setelah pindah langkah');
    await isi(p, '#kpb-f-nama', 'RAHASIA-PRIBADI-123');
    await langkah(p, 6);
    /* penyimpanan memakai kunci khusus */
    const kunci = await p.evaluate(() => Object.keys(localStorage));
    cek(kunci.some((k) => k === 'situsA:data') && !kunci.some((k) => k === 'kpb:data'), 'kunci penyimpanan khusus dipakai', kunci);
    /* CTA */
    const cta = p.locator('aside.cta');
    cek(await cta.isVisible(), 'kartu CTA tampil di langkah 6');
    const aCta = cta.locator('a');
    cek(await aCta.getAttribute('href') === 'https://contoh.com/daftar' && await aCta.getAttribute('rel') === 'noopener' && await aCta.getAttribute('target') === '_blank', 'tautan CTA aman');
    await p.evaluate(() => { window.__R().querySelector('aside.cta a').addEventListener('click', (e) => e.preventDefault()); });
    await aCta.click();
    /* ekspor memicu peristiwa */
    await p.getByRole('button', { name: 'Salin ringkasan', exact: true }).click().catch(() => {});
    await p.waitForTimeout(300);
    const ev = await p.evaluate(() => window.__events.map((e) => e.nama));
    ['app_dibuka', 'contoh_dimuat', 'langkah_dibuka', 'hasil_dilihat', 'cta_klik'].forEach((n) => cek(ev.indexOf(n) >= 0, 'peristiwa ' + n + ' diterima onEvent', ev));
    const semua = JSON.stringify(await p.evaluate(() => window.__events));
    cek(semua.indexOf('RAHASIA') < 0, 'peristiwa tidak memuat nama usaha pengguna');
    cek(!/\d{6,}/.test(semua.replace(/"t":\d+/g, '')), 'peristiwa tidak memuat angka usaha (tanpa angka 6+ digit selain cap waktu)', semua.slice(0, 200));
    /* peristiwa DOM juga keluar dari host */
    const dom = await p.evaluate(() => new Promise((ok) => {
      const batas = setTimeout(() => ok(null), 2000);
      document.getElementById('kpb-root').addEventListener('kpb:event', (e) => { clearTimeout(batas); ok(e.detail.nama); }, { once: true });
      window.KPBApp.bukaLangkah(2);
    }));
    cek(dom === 'langkah_dibuka', 'CustomEvent kpb:event keluar dari host', dom);
    /* API publik */
    cek(await p.evaluate(() => typeof window.KPBApp.versi) === 'string', 'KPBApp.versi tersedia');
    await p.evaluate(() => window.KPBApp.bukaLangkah(3));
    cek(/Langkah 3 dari 6/.test(await teks(p, '#kpb-where')), 'KPBApp.bukaLangkah(3) membuka langkah 3', await teks(p, '#kpb-where'));
    await p.evaluate(() => window.KPBApp.setTema('gelap'));
    cek(await p.evaluate(() => document.getElementById('kpb-root').getAttribute('data-theme')) === 'dark', 'KPBApp.setTema("gelap")');
    await p.evaluate(() => window.KPBApp.setTema('terang'));
    cek(A.logs.length === 0, 'tanam inline: tanpa galat konsol', A.logs);
    await A.tutup();
  }

  /* ===== A2. CTA dengan href berbahaya tidak menjadi tautan ===== */
  {
    const A = await L.bukaApp({ srv, browser, path: '/cta-jahat.html' });
    const p = A.page;
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    await langkah(p, 6);
    cek(await p.locator('aside.cta').count() === 1 && await p.locator('aside.cta a').count() === 0, 'href javascript: tidak dijadikan tautan');
    cek(await p.evaluate(() => window.__xss) === undefined, 'javascript: tidak dieksekusi');
    await A.tutup();
  }

  /* ===== A3. tema otomatis mengikuti halaman induk ===== */
  {
    const A = await L.bukaApp({ srv, browser, path: '/tema.html', context: { colorScheme: 'light' } });
    const p = A.page;
    const tema = () => p.evaluate(() => document.getElementById('kpb-root').getAttribute('data-theme'));
    cek(await tema() === 'light', 'data-theme="light" di halaman induk membuat kalkulator terang', await tema());
    await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await p.waitForTimeout(100);
    cek(await tema() === 'dark', 'halaman induk berganti gelap: kalkulator ikut', await tema());
    const bgGelap = await p.evaluate(() => getComputedStyle(document.getElementById('kpb-root')).backgroundColor);
    cek(bgGelap === 'rgb(12, 15, 30)', 'latar kalkulator gelap', bgGelap);
    await p.evaluate(() => { document.documentElement.removeAttribute('data-theme'); document.documentElement.className = 'dark'; });
    await p.waitForTimeout(100);
    cek(await tema() === 'dark', 'class="dark" di <html> juga dikenali', await tema());
    await p.evaluate(() => { document.documentElement.className = ''; });
    await p.waitForTimeout(100);
    cek(await tema() === null, 'tanpa penanda halaman: mengikuti setelan perangkat (tanpa atribut)', await tema());
    await A.tutup();
  }

  /* ===== B. CSS induk yang nakal ===== */
  {
    const A = await L.bukaApp({ srv, browser, path: '/nakal.html' });
    const p = A.page;
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    await langkah(p, 5);
    const g = await p.evaluate(() => {
      const r = window.__R(), app = r.getElementById('kpb-app'), cs = getComputedStyle(app);
      const tombol = getComputedStyle(r.querySelector('.btn.pri') || r.querySelector('.btn'));
      const isi = getComputedStyle(r.querySelector('.lede, .small, p'));
      return {
        color: cs.color, size: cs.fontSize, ls: cs.letterSpacing, ws: cs.wordSpacing, tt: cs.textTransform, dir: cs.direction, ta: cs.textAlign, lh: cs.lineHeight,
        fw: cs.fontWeight, fs: cs.fontStyle, sh: cs.textShadow, wsp: cs.whiteSpace, cur: cs.cursor,
        tbBg: tombol.backgroundColor, tbPad: tombol.paddingTop, tbBorder: tombol.borderTopStyle,
        pColor: isi.color, pSize: isi.fontSize, scroll: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      };
    });
    cek(g.color === 'rgb(21, 26, 58)', 'warna teks tidak bocor dari induk', g.color);
    cek(g.size === '16px' && g.lh === '26.4px', 'ukuran font dan tinggi baris tidak bocor', [g.size, g.lh]);
    cek(g.ls === 'normal' && (g.ws === 'normal' || g.ws === '0px') && g.tt === 'none', 'jarak huruf, jarak kata, dan huruf kapital tidak bocor', [g.ls, g.ws, g.tt]);
    cek(g.dir === 'ltr' && g.ta === 'start', 'arah dan perataan teks tidak bocor', [g.dir, g.ta]);
    cek(g.fw === '400' && g.fs === 'normal' && g.sh === 'none' && g.wsp === 'normal', 'berat huruf, miring, bayangan, dan white-space tidak bocor', [g.fw, g.fs, g.sh, g.wsp]);
    cek(g.tbBg !== 'rgb(255, 255, 0)' && g.tbBorder !== 'dashed', 'gaya tombol tidak terkena aturan "button" halaman induk', [g.tbBg, g.tbBorder]);
    cek(g.pColor !== 'rgb(255, 0, 0)' && g.pSize !== '40px', 'paragraf tidak terkena aturan "p" halaman induk', [g.pColor, g.pSize]);
    cek(g.scroll <= 0, 'tidak ada gulir samping akibat CSS induk', g.scroll);
    const adaMerah = await p.evaluate(() => [...window.__R().querySelectorAll('svg *')].some((e) => getComputedStyle(e).fill === 'rgb(255, 0, 0)' && e.tagName === 'path'));
    cek(!adaMerah, 'grafik tidak diwarnai ulang oleh CSS induk');
    await p.screenshot({ path: path.join(L.KPB_DIR, 'shots/nakal.png') });
    await A.tutup();
  }

  /* ===== C. iframe dengan tinggi otomatis ===== */
  {
    const A = await L.bukaApp({ srv, browser, path: '/induk.html', tunggu: false, context: { viewport: { width: 1280, height: 800 } } });
    const p = A.page;
    const fr = p.frameLocator('#k');
    await fr.locator('#kpb-judul-cepat').waitFor();
    await p.waitForTimeout(500);
    const h0 = await p.evaluate(() => document.getElementById('k').getBoundingClientRect().height);
    cek(h0 > 600, 'iframe membesar mengikuti isi layar awal (' + Math.round(h0) + ' px)', h0);
    await fr.locator('.tpl').first().click();
    await fr.locator('#kpb-panel').waitFor();
    await p.waitForTimeout(500);
    await p.evaluate(() => window.scrollTo(0, 500));
    await fr.locator('#kpb-steps li:nth-child(5) button').click();
    await p.waitForTimeout(700);
    const h5 = await p.evaluate(() => document.getElementById('k').getBoundingClientRect().height);
    cek(h5 > h0 && h5 > 2000, 'iframe makin tinggi di langkah hasil (' + Math.round(h5) + ' px)', [h0, h5]);
    const tampil = await fr.locator('body').evaluate(() => 0);
    const pesan = await p.evaluate(() => window.__pesan.map((m) => m.jenis));
    cek(pesan.indexOf('tinggi') >= 0 && pesan.indexOf('gulir') >= 0 && pesan.indexOf('event') >= 0, 'halaman induk menerima pesan tinggi, gulir, dan event', [...new Set(pesan)]);
    const y = await p.evaluate(() => window.scrollY);
    const topIframe = await p.evaluate(() => document.getElementById('k').getBoundingClientRect().top + window.scrollY);
    cek(y >= topIframe - 5 && y <= topIframe + 400, 'pindah langkah menggulir halaman induk ke awal kalkulator', [y, topIframe]);
    const gulirDalam = await fr.locator('body').evaluate(() => document.documentElement.scrollHeight - document.documentElement.clientHeight);
    cek(gulirDalam <= 2, 'iframe tidak punya bilah gulir sendiri', gulirDalam);
    await p.screenshot({ path: path.join(L.KPB_DIR, 'shots/iframe.png') });
    cek(A.logs.length === 0, 'iframe: tanpa galat konsol', A.logs);
    await A.tutup();
  }
  /* iframe dengan indukOrigin berbeda: pesan tidak sampai ke induk */
  {
    const A = await L.bukaApp({ srv, browser, path: '/induk-asing.html', tunggu: false });
    const p = A.page;
    await p.frameLocator('#k').locator('#kpb-judul-cepat').waitFor();
    await p.waitForTimeout(600);
    cek((await p.evaluate(() => window.__pesan.length)) === 0, 'indukOrigin yang berbeda: tidak ada pesan bocor ke halaman lain');
    await p.evaluate(() => document.getElementById('k').contentWindow.postMessage({ kpb: 1, jenis: 'tema', tema: 'gelap' }, '*'));
    await p.waitForTimeout(300);
    const temaAsing = await p.frames().find((f) => f !== p.mainFrame()).evaluate(() => document.getElementById('kpb-root').getAttribute('data-theme'));
    cek(temaAsing === null, 'indukOrigin yang berbeda: perintah tema dari induk ditolak', temaAsing);
    await A.tutup();
  }

  /* ===== D. CSP ketat ===== */
  {
    /* header persis seperti berkas _headers di paket (CSP ketat, frame-ancestors, nosniff, dan seterusnya), dengan domain contoh diganti asal uji */
    const srvC = await L.mulai(L.FOLDER, 0, { headersPer: L.headersPaket((v) => v.replace('https://situsanda.com', 'http://127.0.0.1:1')) });
    const A = await L.bukaApp({
      srv: srvC, browser, context: { acceptDownloads: true },
      init: () => { window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' | ' + e.blockedURI + ' | ' + (e.sample || '').slice(0, 40))); },
    });
    const p = A.page;
    const gaya = await gayaAda(p);
    cek(gaya.bg !== 'rgba(0, 0, 0, 0)' && gaya.border !== 'rgb(0, 0, 0)', 'CSP ketat: gaya aplikasi tetap terpasang', gaya);
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    for (let n = 1; n <= 4; n++) { await langkah(p, n); }
    await p.locator('#kpb-btn-menu').click();
    await p.keyboard.press('Escape');
    await p.getByRole('button', { name: 'Kamus istilah' }).first().click();
    await langkah(p, 3);
    await p.locator('.row >> nth=0 >> .del').click();
    await langkah(p, 5);
    await p.waitForTimeout(400);
    const fontOk = await p.evaluate(async () => { await document.fonts.ready; return document.fonts.check('600 15px "Plus Jakarta Sans"') && [...document.fonts].some((f) => f.status === 'loaded'); });
    cek(fontOk, 'CSP ketat: font lokal termuat lewat FontFace');
    cek(await p.locator('svg[role="img"]').count() >= 2, 'CSP ketat: grafik tampil');
    const teksHalo = await p.evaluate(() => { const t = window.__R().querySelector('svg text.halo'); return t ? getComputedStyle(t).paintOrder + '|' + getComputedStyle(t).strokeWidth : null; });
    cek(teksHalo && /stroke/.test(teksHalo), 'CSP ketat: label grafik berhalo lewat kelas CSS', teksHalo);
    await langkah(p, 6);
    const [dl] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Unduh Excel (.xlsx)' }).click()]);
    cek(/\.xlsx$/.test(dl.suggestedFilename()), 'CSP ketat: unduh Excel bekerja', dl.suggestedFilename());
    const [dj] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Simpan data (.json)' }).click()]);
    cek(/\.json$/.test(dj.suggestedFilename()), 'CSP ketat: unduh JSON bekerja');
    const [dh] = await Promise.all([p.waitForEvent('download'), p.getByRole('button', { name: 'Unduh laporan (.html)' }).click()]);
    cek(/\.html$/.test(dh.suggestedFilename()), 'CSP ketat: unduh laporan bekerja');
    await p.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('x')) }, configurable: true }); document.execCommand = () => false; });
    await p.getByRole('button', { name: 'Salin ringkasan', exact: true }).click();
    await p.waitForSelector('#kpb-kotak-salin[open]');
    await p.keyboard.press('Escape');
    const csp1 = await p.evaluate(() => window.__csp);
    cek(csp1.length === 0, 'CSP ketat: tidak ada pelanggaran CSP pada alur utama', csp1);
    /* cetak lewat iframe srcdoc: gaya laporan memang diblokir CSP ketat, tetapi aplikasi harus tetap berjalan dan tidak galat */
    await p.evaluate(() => { window.__csp.length = 0; });
    await p.getByRole('button', { name: 'Cetak atau simpan PDF' }).click();
    await p.waitForFunction(() => window.top.__cetak >= 1, null, { timeout: 8000 }).catch(() => {});
    const cetak = await p.evaluate(() => {
      const f = document.querySelector('iframe[title="Laporan untuk dicetak"]');
      if (!f) return null;
      const d = f.contentDocument, w = f.contentWindow, h1 = d.querySelector('h1');
      const sw = d.querySelector('.legend i, .tr i');
      return { ukuran: h1 && w.getComputedStyle(h1).fontSize, latar: w.getComputedStyle(d.body).backgroundColor, bagian: d.querySelectorAll('.lap-sec').length, adopsi: (d.adoptedStyleSheets || []).length, swatch: sw ? w.getComputedStyle(sw).backgroundColor : 'tidak ada' };
    });
    cek(cetak && cetak.ukuran === '24px' && cetak.bagian === 7 && cetak.adopsi === 1, 'CSP ketat: laporan cetak tetap bergaya lewat adoptedStyleSheets', cetak);
    const cspCetak = await p.evaluate(() => window.__csp);
    cek(cspCetak.length === 0, 'CSP ketat: cetak tidak memicu pelanggaran CSP', cspCetak);
    cek(await p.locator('#kpb-app').count() === 1, 'CSP ketat: aplikasi tetap hidup setelah mencetak');
    cek(A.logs.length === 0, 'CSP ketat: tanpa galat konsol', A.logs.slice(0, 3));
    await A.tutup();
    srvC.srv.close();
  }

  /* ===== D2. peramban tanpa lembar gaya konstruktabel (Safari sebelum 16.4, Firefox sebelum 101) di bawah CSP ketat bawaan paket =====
     <style> sebaris diblokir style-src 'self'; gaya harus datang dari kpb.css lewat <link> yang sama asal */
  {
    const srvL = await L.mulai(L.FOLDER, 0, { headersPer: L.headersPaket((v) => v.replace('https://situsanda.com', 'http://127.0.0.1:1')) });
    const A = await L.bukaApp({
      srv: srvL, browser,
      init: () => {
        try { delete CSSStyleSheet.prototype.replaceSync; } catch (e) { /* abaikan */ }
        window.__csp = [];
        document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' | ' + e.blockedURI));
      },
    });
    const p = A.page;
    await p.waitForTimeout(500);
    const ukur = () => p.evaluate(() => {
      const R = window.__R(), app = R.getElementById('kpb-app'), cs = getComputedStyle(app), b = R.querySelector('.btn.pri') || R.querySelector('.btn');
      return {
        adopsi: (R.adoptedStyleSheets || []).length, tautan: R.querySelectorAll('link[rel="stylesheet"]').length,
        font: cs.fontFamily, ink: cs.getPropertyValue('--ink').trim(), radiusTombol: b ? getComputedStyle(b).borderTopLeftRadius : null,
        diminta: performance.getEntriesByType('resource').map((r) => new URL(r.name).pathname),
      };
    });
    const g = await ukur();
    cek(g.adopsi === 0 && g.tautan === 1, 'peramban lama + CSP: gaya dipasang lewat <link>, bukan lembar konstruktabel', g);
    cek(g.diminta.indexOf('/kpb.css') >= 0, 'peramban lama + CSP: kpb.css diminta dari asal yang sama', g.diminta);
    cek(/Plus Jakarta Sans/.test(g.font) && /^#151a3a$/i.test(g.ink) && g.radiusTombol !== null && g.radiusTombol !== '0px', 'peramban lama + CSP: aplikasi bergaya penuh (huruf, warna, bentuk tombol)', g);
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    for (let n = 1; n <= 5; n++) { await langkah(p, n); }
    const ukuranSvg = await p.evaluate(() => { const s = window.__R().querySelector('svg[role="img"]'); if (!s) return null; const r = s.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
    cek(ukuranSvg && ukuranSvg[0] > 100 && ukuranSvg[0] < 1300 && ukuranSvg[1] > 60 && ukuranSvg[1] < 700, 'peramban lama + CSP: grafik berukuran wajar (tanpa gaya, SVG membengkak memenuhi layar)', ukuranSvg);
    await langkah(p, 6);
    cek(!(await L.layarBersih(p)), 'peramban lama + CSP: langkah 6 bersih', await L.layarBersih(p));
    const cspL = await p.evaluate(() => window.__csp);
    cek(cspL.length >= 1 && cspL.every((x) => /^style-src/.test(x)), 'peramban lama + CSP: satu-satunya penolakan CSP adalah <style> sebaris cadangan', cspL);
    cek(A.logs.length <= 1 && A.logs.every((x) => /Content Security Policy/.test(x)), 'peramban lama + CSP: konsol hanya memuat pesan penolakan <style> sebaris itu', A.logs.slice(0, 3));
    await A.tutup();
    await srvL.srv.berhenti();
  }

  /* ===== H. iframe di bawah header paket: frame-ancestors, CSP ketat, tema dari halaman induk ===== */
  {
    const dirP = path.join(ROOT, 'induk-host'), dirP2 = path.join(ROOT, 'induk-lain');
    fs.mkdirSync(dirP, { recursive: true }); fs.mkdirSync(dirP2, { recursive: true });
    const P = await L.mulai(dirP), P2 = await L.mulai(dirP2);
    const K = await L.mulai(L.FOLDER, 0, { headersPer: L.headersPaket((v) => v.replace('https://situsanda.com', P.url)) });
    const halaman = (src) => '<!doctype html><html><head><meta charset="utf-8"><title>Induk</title></head><body style="margin:0"><iframe id="k" src="' + K.url + src + '" title="Kalkulator" style="width:100%;height:600px;border:0"></iframe>' +
      '<script>window.__pesan=[];window.addEventListener("message",function(e){if(e.origin!=="' + K.url + '")return;var d=e.data;if(!d||d.kpb!==1)return;window.__pesan.push(d);' +
      'var f=document.getElementById("k");if(d.jenis==="tinggi")f.style.height=d.tinggi+"px";if(d.jenis==="siap")f.contentWindow.postMessage({kpb:1,jenis:"tema",tema:"gelap"},"' + K.url + '");});</script></body></html>';
    fs.writeFileSync(path.join(dirP, 'iframe.html'), halaman('/iframe.html'));
    fs.writeFileSync(path.join(dirP, 'mandiri.html'), halaman('/index.html'));
    fs.writeFileSync(path.join(dirP2, 'iframe.html'), halaman('/iframe.html'));

    /* induk yang diizinkan */
    const A = await L.bukaApp({ srv: P, browser, path: '/iframe.html', tunggu: false, init: () => { window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(e.violatedDirective + ' | ' + e.blockedURI)); } });
    const p = A.page;
    const fr = p.frameLocator('#k');
    await fr.locator('#kpb-judul-cepat').waitFor({ timeout: 10000 });
    await p.waitForTimeout(600);
    cek(await p.evaluate(() => window.__pesan.some((m) => m.jenis === 'siap')), 'iframe: pesan "siap" diterima induk yang diizinkan');
    const kerangka = p.frames().find((f) => f.url().indexOf('/iframe.html') >= 0 && f !== p.mainFrame());
    cek(!!kerangka, 'iframe: dimuat di bawah header paket (frame-ancestors mengizinkan induk)');
    const temaDi = () => kerangka.evaluate(() => document.getElementById('kpb-root').getAttribute('data-theme'));
    await p.waitForTimeout(300);
    cek(await temaDi() === 'dark', 'iframe: tema gelap dari halaman induk diterapkan setelah pesan "siap"', await temaDi());
    await p.evaluate((k) => document.getElementById('k').contentWindow.postMessage({ kpb: 1, jenis: 'tema', tema: 'terang' }, k), K.url);
    await p.waitForTimeout(250);
    cek(await temaDi() === 'light', 'iframe: pesan tema "terang" dari induk diterapkan', await temaDi());
    await p.evaluate((k) => document.getElementById('k').contentWindow.postMessage({ kpb: 1, jenis: 'tema', tema: 'javascript:alert(1)' }, k), K.url);
    await p.waitForTimeout(250);
    cek(await temaDi() === 'light', 'iframe: nilai tema yang tidak dikenal diabaikan', await temaDi());
    /* pesan dari jendela lain (bukan induk langsung) diabaikan, walau asalnya sama */
    await p.evaluate((k) => {
      const s = document.createElement('iframe'); document.body.append(s);
      s.contentWindow.Function('t', 'o', 't.postMessage({kpb:1,jenis:"tema",tema:"gelap"}, o)')(document.getElementById('k').contentWindow, k);
    }, K.url);
    await p.waitForTimeout(250);
    cek(await temaDi() === 'light', 'iframe: pesan tema dari jendela selain induk langsung diabaikan', await temaDi());
    await fr.locator('.tpl').first().click();
    await fr.locator('#kpb-panel').waitFor();
    await fr.locator('#kpb-steps li:nth-child(5) button').click();
    await p.waitForTimeout(500);
    cek(await p.evaluate(() => document.getElementById('k').getBoundingClientRect().height) > 1500, 'iframe: tinggi mengikuti isi di bawah CSP ketat');
    cek(A.logs.filter((x) => !/Failed to load resource/.test(x)).length === 0, 'iframe di bawah header paket: tanpa galat konsol', A.logs);
    cek((await p.evaluate(() => window.__csp)).length === 0, 'induk: tanpa pelanggaran CSP', await p.evaluate(() => window.__csp));
    await A.tutup();

    /* induk yang tidak diizinkan: iframe diblokir oleh frame-ancestors */
    {
      const B = await L.bukaApp({ srv: P2, browser, path: '/iframe.html', tunggu: false });
      await B.page.waitForTimeout(1500);
      const ada = await B.page.frames().find((f) => f !== B.page.mainFrame());
      const hidup = ada ? await ada.evaluate(() => !!document.getElementById('kpb-root')).catch(() => false) : false;
      cek(!hidup, 'frame-ancestors: situs lain tidak bisa menanam iframe.html', ada ? ada.url() : 'tanpa frame');
      cek(B.logs.some((x) => /frame-ancestors|Refused to (frame|display)/i.test(x)), 'frame-ancestors: peramban sendiri yang menolak membingkai (tercatat di konsol)', B.logs);
      await B.tutup();
    }
    /* halaman mandiri tidak boleh dibingkai oleh siapa pun, termasuk induk yang diizinkan */
    {
      const B = await L.bukaApp({ srv: P, browser, path: '/mandiri.html', tunggu: false });
      await B.page.waitForTimeout(1500);
      const ada = B.page.frames().find((f) => f !== B.page.mainFrame());
      const hidup = ada ? await ada.evaluate(() => !!document.getElementById('kpb-root')).catch(() => false) : false;
      cek(!hidup, 'frame-ancestors none: index.html tidak bisa dibingkai, bahkan oleh situs yang diizinkan untuk iframe.html', ada ? ada.url() : 'tanpa frame');
      cek(B.logs.some((x) => /frame-ancestors|X-Frame-Options|Refused to (frame|display)/i.test(x)), 'frame-ancestors none: penolakan tercatat di konsol peramban', B.logs);
      await B.tutup();
    }
    await P.srv.berhenti(); await P2.srv.berhenti(); await K.srv.berhenti();
  }

  /* ===== G. kalkulator di kolom sempit pada halaman lebar: titik putus mengikuti kolom, bukan layar ===== */
  for (const [w, le640, le900, kolomTunggal] of [[360, true, true, true], [600, true, true, true], [780, false, true, true], [1000, false, false, false]]) {
    const A = await L.bukaApp({ srv, browser, path: '/kolom-' + w + '.html', context: { viewport: { width: 1280, height: 900 } } });
    const p = A.page;
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    await langkah(p, 3);
    await p.waitForTimeout(250);
    const g = await p.evaluate(() => {
      const r = window.__R(), app = r.getElementById('kpb-app'), host = document.getElementById('kpb-root');
      const lay = r.querySelector('.layout'), kol = document.querySelector('.kolom').getBoundingClientRect();
      const panel = r.getElementById('kpb-panel').getBoundingClientRect();
      return {
        le640: app.classList.contains('le-640'), le900: app.classList.contains('le-900'),
        kolom: getComputedStyle(lay).gridTemplateColumns.split(' ').length,
        label: getComputedStyle(r.querySelector('.steps .t')).display,
        hostOver: host.scrollWidth - host.clientWidth, pageOver: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        panelKiri: Math.round(panel.left - kol.left), panelKanan: Math.round(kol.right - panel.right), lebarKolom: Math.round(kol.width),
        wide: lay.classList.contains('wide'),
      };
    });
    cek(g.le640 === le640 && g.le900 === le900, 'kolom ' + w + ' px: kelas titik putus sesuai lebar kolom', g);
    cek((g.kolom === 1) === kolomTunggal || g.wide, 'kolom ' + w + ' px: ' + (kolomTunggal ? 'satu kolom (panel di atas, ringkasan di bawah)' : 'dua kolom di kolom lebar'), g);
    cek(g.label === (le640 ? 'none' : 'block') || (!le640 && g.label !== 'none'), 'kolom ' + w + ' px: label tombol langkah ' + (le640 ? 'disembunyikan' : 'tampil'), g.label);
    cek(g.hostOver <= 0 && g.pageOver <= 0, 'kolom ' + w + ' px: tanpa gulir samping', g);
    cek(g.panelKiri >= 0 && g.panelKanan >= 0, 'kolom ' + w + ' px: panel tidak keluar dari kolom', g);
    if (le640) {
      await p.locator('#kpb-btn-menu').click();
      await p.waitForTimeout(150);
      const m = await p.evaluate(() => { const r = window.__R(); const b = r.querySelector('.menu-list').getBoundingClientRect(), k = document.querySelector('.kolom').getBoundingClientRect(); return { kiri: Math.round(b.left - k.left), kanan: Math.round(k.right - b.right) }; });
      cek(m.kiri >= 0 && m.kanan >= 0, 'kolom ' + w + ' px: menu data tidak keluar dari kolom', m);
      await p.keyboard.press('Escape');
    }
    if (w === 600) await p.screenshot({ path: path.join(L.KPB_DIR, 'shots/kolom-600.png') });
    cek(A.logs.length === 0, 'kolom ' + w + ' px: tanpa galat konsol', A.logs);
    await A.tutup();
  }
  /* mengubah ukuran kolom saat berjalan: kelas mengikuti, tanpa berkedip bolak-balik */
  {
    const A = await L.bukaApp({ srv, browser, path: '/kolom-1000.html', context: { viewport: { width: 1280, height: 900 } } });
    const p = A.page;
    const kelas = () => p.evaluate(() => [...window.__R().getElementById('kpb-app').classList].filter((c) => /^le-/.test(c)).sort().join(','));
    cek(await kelas() === '', 'kolom lebar: tanpa kelas titik putus');
    await p.evaluate(() => { document.querySelector('.kolom').style.width = '700px'; });
    await p.waitForTimeout(250);
    cek(await kelas() === 'le-900', 'kolom diperkecil ke 700 px: le-900', await kelas());
    await p.evaluate(() => { document.querySelector('.kolom').style.width = '500px'; });
    await p.waitForTimeout(250);
    cek(await kelas() === 'le-640,le-900', 'kolom diperkecil ke 500 px: le-640 dan le-900', await kelas());
    await p.evaluate(() => { document.querySelector('.kolom').style.width = '650px'; });
    await p.waitForTimeout(250);
    cek(await kelas() === 'le-640,le-900', 'kolom 650 px (dalam jeda 24 px): kelas tidak berkedip', await kelas());
    await p.evaluate(() => { document.querySelector('.kolom').style.width = '800px'; });
    await p.waitForTimeout(250);
    cek(await kelas() === 'le-900', 'kolom diperbesar ke 800 px: hanya le-900', await kelas());
    await p.evaluate(() => { document.querySelector('.kolom').style.width = '1000px'; });
    await p.waitForTimeout(250);
    cek(await kelas() === '', 'kolom diperbesar ke 1000 px: kelas dilepas', await kelas());
    await A.tutup();
  }

  /* ===== I. kotak salin di dalam halaman dengan CSS yang nakal ===== */
  {
    const A = await L.bukaApp({ srv, browser, path: '/nakal.html' });
    const p = A.page;
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    await langkah(p, 6);
    await p.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('x')) }, configurable: true }); document.execCommand = () => false; });
    await p.getByRole('button', { name: 'Salin ringkasan', exact: true }).click();
    await p.waitForSelector('#kpb-kotak-salin[open]');
    const d = await p.evaluate(() => {
      const r = window.__R(), dlg = r.getElementById('kpb-kotak-salin');
      const cs = (e) => getComputedStyle(e);
      const ta = dlg.querySelector('textarea'), pp = dlg.querySelector('p.small');
      return { dentro: !!dlg.closest('.app'), taWarna: cs(ta).color, taFont: cs(ta).fontSize, pWarna: cs(pp).color, pFont: cs(pp).fontSize, pLs: cs(pp).letterSpacing, dir: cs(dlg).direction, ta: cs(dlg).textAlign };
    });
    cek(d.dentro, 'kotak salin berada di dalam .app (gaya dasar berlaku)', d);
    cek(d.pFont !== '40px' && d.pWarna !== 'rgb(255, 0, 0)' && d.pLs === 'normal', 'kotak salin tidak terkena warna, ukuran, dan jarak huruf dari CSS induk', d);
    cek(d.taFont !== '40px' && d.taWarna !== 'rgb(255, 0, 0)' && d.dir === 'ltr' && d.ta !== 'right', 'kolom teks di kotak salin tidak terkena CSS induk', d);
    await p.screenshot({ path: path.join(L.KPB_DIR, 'shots/nakal-dialog.png') });
    await A.tutup();
  }

  /* ===== E. peramban lama dan lingkungan terbatas ===== */
  {
    const lama = () => {
      delete Element.prototype.replaceChildren;
      delete Array.prototype.flat;
      delete Array.prototype.includes;
      delete window.ResizeObserver;
      delete window.FontFace;
      try { delete CSSStyleSheet.prototype.replaceSync; } catch (e) { /* abaikan */ }
      try { Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true }); } catch (e) { /* abaikan */ }
      /* data bahasa Indonesia tidak ada: pemformat Inggris dipakai */
      const Asli = Intl.NumberFormat;
      Intl.NumberFormat = function (loc, o) { return new Asli('en-US', o); };
      Intl.NumberFormat.prototype = Asli.prototype;
    };
    const A = await L.bukaApp({ srv, browser, path: '/kalkulator/index.html', init: lama });
    const p = A.page;
    cek(await p.locator('#kpb-judul-cepat').isVisible(), 'peramban lama: layar awal tampil');
    await isi(p, '#kpb-q-harga', '1234567');
    cek(await p.locator('#kpb-q-harga').inputValue() === '1.234.567', 'format angka Indonesia dipakai walau Intl hanya punya data Inggris', await p.locator('#kpb-q-harga').inputValue());
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    await p.locator('#kpb-f-mk').focus();
    for (let n = 1; n <= 6; n++) { await langkah(p, n); }
    cek(!(await L.layarBersih(p)), 'peramban lama: langkah 6 bersih', await L.layarBersih(p));
    const sepuluhRibu = await p.evaluate(() => window.__R().getElementById('kpb-panel').innerText);
    cek(/\d\.\d{3}/.test(sepuluhRibu) && !/\d,\d{3}(?!\d)/.test(sepuluhRibu.replace(/\d+,\d(?!\d)/g, '')), 'peramban lama: titik sebagai pemisah ribuan', sepuluhRibu.slice(0, 80));
    /* tombol salin tanpa clipboard memakai kotak manual */
    await p.getByRole('button', { name: 'Salin ringkasan', exact: true }).click();
    await p.waitForTimeout(500);
    cek(await p.locator('#kpb-kotak-salin[open]').count() === 1 || /tersalin/.test(await teks(p, '#kpb-toast')), 'tanpa Clipboard API: kotak salin manual atau execCommand dipakai');
    cek(A.logs.length === 0, 'peramban lama: tanpa galat konsol', A.logs);
    await A.tutup();
  }
  {
    const A = await L.bukaApp({ srv, browser, path: '/kalkulator/index.html', tunggu: false, init: () => { Element.prototype.attachShadow = undefined; } });
    await A.page.waitForFunction(() => /terlalu lama/.test(document.getElementById('kpb-root').innerText), null, { timeout: 5000 }).catch(() => {});
    const t = await A.page.locator('#kpb-root').innerText();
    cek(/terlalu lama/.test(t), 'tanpa Shadow DOM: pesan agar memperbarui peramban', t);
    await A.tutup();
  }

  /* ===== F. cetak halaman aplikasi (Ctrl+P) ===== */
  {
    const A = await L.bukaApp({ srv, browser, path: '/kalkulator/index.html' });
    const p = A.page;
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    await langkah(p, 5);
    await p.emulateMedia({ media: 'print' });
    const v = await p.evaluate(() => { const r = window.__R(); const tampil = (s) => { const e = r.querySelector(s); return e ? getComputedStyle(e).display : 'tidak ada'; }; return { nav: tampil('.nav'), steps: tampil('.steps'), menu: tampil('.menu'), toast: tampil('.toast'), panel: tampil('#kpb-panel') }; });
    cek(v.nav === 'none' && v.steps === 'none' && v.menu === 'none' && v.panel !== 'none', 'cetak: navigasi disembunyikan, isi tampil', v);
    await p.pdf({ path: path.join(ROOT, 'app.pdf'), format: 'A4', printBackground: true });
    cek(fs.statSync(path.join(ROOT, 'app.pdf')).size > 5000, 'halaman aplikasi bisa dijadikan PDF');
    await A.tutup();
  }

  srv.srv.close();
  await browser.close();
  fs.rmSync(ROOT, { recursive: true, force: true });
  process.exit(L.ringkas('TANAM') ? 1 : 0);
})().catch((e) => { console.error('UJI BERHENTI:', e.stack.split('\n').slice(0, 8).join('\n')); process.exit(2); });
