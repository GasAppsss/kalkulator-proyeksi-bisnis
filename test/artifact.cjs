/* Uji versi artifact (halaman claude.ai): unduhan lewat claude.use('downloads'), pustaka Excel dari CDN, tanpa riwayat, tanpa service worker, tanpa pesan ke induk */
const L = require('./lib.cjs');
const { cek, langkah, path, fs } = L;
const DIST = path.join(L.KPB_DIR, 'dist');
const XLSX_LOKAL = fs.readFileSync(path.join(L.FOLDER, 'vendor/xlsx.mini.min.js'), 'utf8');

/* tiruan lingkungan artifact: claude.use('downloads') yang merekam berkas, dengan perilaku yang bisa diatur */
const TIRUAN = (mode) => {
  window.__tersimpan = [];
  window.__use = [];
  if (mode === 'tanpa') return;
  window.claude = {
    use: async (nama) => {
      window.__use.push(nama);
      if (nama !== 'downloads') return null;
      return {
        save: async (o) => {
          if (mode === 'tolak') { const e = new Error('ditolak'); e.code = 'declined'; throw e; }
          if (mode === 'gagal') throw new Error('gagal');
          const d = o.data;
          window.__tersimpan.push({ nama: o.filename, jenis: typeof d === 'string' ? 'teks' : (d && d.constructor && d.constructor.name), ukuran: d && (d.length != null ? d.length : d.byteLength), awal: typeof d === 'string' ? d.slice(0, 40) : null });
        },
      };
    },
  };
};

const toast = (p) => p.evaluate(() => window.__R().getElementById('kpb-toast').innerText);

(async () => {
  const srv = await L.mulai(DIST);
  const browser = await L.chromium.launch();
  const routeLuar = async (ctx, cdn) => {
    await ctx.route('https://fonts.googleapis.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route('https://fonts.gstatic.com/**', (r) => r.abort());
    await ctx.route('https://cdnjs.cloudflare.com/**', (r) => { if (cdn) cdn.n++; return r.fulfill({ status: 200, contentType: 'application/javascript', body: XLSX_LOKAL }); });
  };

  /* ===== 1. alur utama dan semua jenis unduhan ===== */
  {
    const cdn = { n: 0 };
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'id-ID', timezoneId: 'Asia/Jakarta', reducedMotion: 'reduce' });
    await ctx.addInitScript(L.SKRIP_AWAL);
    await ctx.addInitScript(`(${TIRUAN.toString()})("ok");`);
    await routeLuar(ctx, cdn);
    const A = await L.bukaApp({ srv, browser, ctx, path: '/uji-artifact.html' });
    const p = A.page;
    /* judul artifact dijaga tetap sama di setiap penerbitan ulang agar galeri tidak berubah nama */
    cek(await p.title() === 'Plan Proyek Bisnis', 'artifact: judul dari fragmen', await p.title());
    cek(await p.evaluate(() => window.KPBApp && window.KPBApp.versi) === '2.0.0', 'artifact: versi aplikasi tersedia');
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    cek(await p.evaluate(() => location.hash) === '', 'artifact: tidak mengubah hash URL (tanpa riwayat)', await p.evaluate(() => location.hash));
    for (let n = 1; n <= 6; n++) await langkah(p, n);
    cek(!(await L.layarBersih(p)), 'artifact: langkah 6 bersih', await L.layarBersih(p));

    await p.getByRole('button', { name: 'Unduh Excel (.xlsx)' }).click();
    await p.waitForFunction(() => window.__tersimpan.length >= 1, null, { timeout: 15000 });
    const x = await p.evaluate(() => window.__tersimpan[0]);
    cek(/\.xlsx$/.test(x.nama) && x.ukuran > 5000, 'artifact: Excel disimpan lewat claude.use("downloads")', x);
    cek(cdn.n === 1, 'artifact: pustaka Excel dimuat dari CDN (satu kali)', cdn.n);
    await p.getByRole('button', { name: 'Simpan data (.json)' }).click();
    await p.waitForFunction(() => window.__tersimpan.length >= 2, null, { timeout: 8000 });
    const j = await p.evaluate(() => window.__tersimpan[1]);
    cek(/\.json$/.test(j.nama) && j.jenis === 'teks' && /^\{/.test(j.awal), 'artifact: JSON disimpan sebagai teks', j);
    await p.getByRole('button', { name: 'Unduh laporan (.html)' }).click();
    await p.waitForFunction(() => window.__tersimpan.length >= 3, null, { timeout: 8000 });
    const lp = await p.evaluate(() => window.__tersimpan[2]);
    cek(/^laporan-.*\.html$/.test(lp.nama) && /<!doctype html>/i.test(lp.awal) && lp.ukuran > 20000, 'artifact: laporan HTML mandiri disimpan', lp);
    await p.getByRole('button', { name: 'Cetak atau simpan PDF' }).click().catch(async () => { await p.locator('#kpb-btn-menu').click(); await p.getByRole('button', { name: 'Cetak atau simpan PDF' }).click(); });
    await p.waitForFunction(() => window.__tersimpan.length >= 4, null, { timeout: 8000 });
    const cetakSimpan = await p.evaluate(() => window.__tersimpan[3]);
    cek(/^laporan-.*\.html$/.test(cetakSimpan.nama), 'artifact: tombol cetak diganti unduh laporan .html', cetakSimpan);
    cek(await p.evaluate(() => window.__cetak) === 0, 'artifact: tidak memanggil print()', await p.evaluate(() => window.__cetak));
    cek(await p.evaluate(() => document.querySelectorAll('iframe').length) === 0, 'artifact: tidak membuat iframe cetak');
    cek((await p.evaluate(() => window.__use)).every((n) => n === 'downloads') && (await p.evaluate(() => window.__use.length)) >= 1, 'artifact: hanya meminta kemampuan "downloads"', await p.evaluate(() => window.__use));
    /* ringkasan: Clipboard di sandbox bisa ditolak, kotak manual harus muncul */
    await p.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('x')) }, configurable: true }); document.execCommand = () => false; });
    await p.getByRole('button', { name: 'Salin ringkasan', exact: true }).click();
    await p.waitForSelector('#kpb-kotak-salin[open]', { timeout: 5000 });
    cek(await p.locator('#kpb-kotak-salin[open] textarea').inputValue().then((v) => v.length > 200), 'artifact: kotak salin manual berisi ringkasan saat clipboard ditolak');
    await p.keyboard.press('Escape');
    /* tidak ada pesan ke induk dan tidak ada service worker */
    cek(await p.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length) === 0, 'artifact: tidak ada service worker');
    cek(A.logs.filter((m) => !/fonts\.g|ERR_FAILED|Failed to load resource/.test(m)).length === 0, 'artifact: tanpa galat konsol', A.logs);
    await ctx.close();
  }

  /* ===== 2. unduhan ditolak pengguna, gagal, dan tidak tersedia ===== */
  for (const [mode, pola, ket] of [['tolak', null, 'ditolak pengguna: tanpa pesan galat'], ['gagal', /tidak bisa diunduh/, 'gagal: pesan jelas'], ['tanpa', /Unduhan tidak tersedia di tampilan ini/, 'tanpa claude.use: pesan jelas']]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, locale: 'id-ID', reducedMotion: 'reduce' });
    await ctx.addInitScript(L.SKRIP_AWAL);
    await ctx.addInitScript(`(${TIRUAN.toString()})(${JSON.stringify(mode)});`);
    await routeLuar(ctx);
    const A = await L.bukaApp({ srv, browser, ctx, path: '/uji-artifact.html' });
    const p = A.page;
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    await langkah(p, 6);
    await p.getByRole('button', { name: 'Simpan data (.json)' }).click();
    await p.waitForTimeout(700);
    const t = await toast(p);
    if (pola) cek(pola.test(t), 'artifact, unduhan ' + ket, t);
    else cek(!/tidak bisa diunduh|tidak tersedia|siap disimpan/.test(t), 'artifact, unduhan ' + ket, t);
    cek(await p.locator('#kpb-app').count() === 1, 'artifact, unduhan ' + mode + ': aplikasi tetap hidup');
    await ctx.close();
  }

  /* ===== 3. konfigurasi pwa dan peristiwa tidak berlaku di artifact ===== */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, locale: 'id-ID', reducedMotion: 'reduce' });
    await ctx.addInitScript(L.SKRIP_AWAL);
    await ctx.addInitScript(`(${TIRUAN.toString()})("ok"); window.KPB_CONFIG = { pwa: true, indukOrigin: '*' }; window.__induk = []; `);
    await routeLuar(ctx);
    const A = await L.bukaApp({ srv, browser, ctx, path: '/uji-artifact.html' });
    const p = A.page;
    await p.waitForTimeout(800);
    cek(await p.evaluate(async () => (await navigator.serviceWorker.getRegistrations()).length) === 0, 'artifact: pwa:true diabaikan, tidak ada service worker');
    cek(!(await L.adaGulir(p)), 'artifact di HP 390 px: tanpa gulir samping');
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    cek(!(await L.adaGulir(p)), 'artifact di HP 390 px setelah memuat contoh: tanpa gulir samping');
    await ctx.close();
  }

  /* ===== 4. fragmen: struktur yang diminta Artifact ===== */
  {
    const frag = fs.readFileSync(path.join(DIST, 'artifact.html'), 'utf8');
    cek(/^<title>[^<]{3,60}<\/title>/.test(frag), 'fragmen dimulai dengan <title> yang singkat');
    cek((frag.match(/<script/g) || []).length === 1, 'fragmen memuat satu skrip inline');
    const skrip = frag.slice(frag.indexOf('<script>') + 8, frag.lastIndexOf('</script>'));
    cek(!/<\/script/i.test(skrip), 'skrip tidak mengandung penutup </script> di dalamnya');
    cek(!/\beval\s*\(|new Function\s*\(/.test(skrip), 'skrip tanpa eval atau new Function');
    cek(Buffer.byteLength(frag) < 400 * 1024, 'fragmen kurang dari 400 KB (' + Math.round(Buffer.byteLength(frag) / 1024) + ' KB)');
    const hosts = [...new Set((frag.match(/https?:\/\/[a-z0-9.-]+/gi) || []).map((u) => u.toLowerCase()))];
    /* pajak.go.id, news.ddtc.co.id, dan ikpi.or.id hanya tautan sumber aturan pajak (<a href>, dibuka pengguna dengan rel=noopener), bukan sumber daya yang dimuat otomatis */
    const diizinkan = ['http://www.w3.org', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com', 'https://cdnjs.cloudflare.com', 'https://pajak.go.id', 'https://news.ddtc.co.id', 'https://ikpi.or.id'];
    const tautanSaja = /href:"https:\/\/(pajak\.go\.id|news\.ddtc\.co\.id|ikpi\.or\.id)[^"]*",target:"_blank",rel:"noopener"/g;
    cek((frag.match(tautanSaja) || []).length === 5 && (frag.match(/pajak\.go\.id|ddtc\.co\.id|ikpi\.or\.id/g) || []).length === 5, 'tautan sumber pajak: lima <a> (DJP, DDTC dua, IKPI dua) dengan target=_blank dan rel=noopener, tanpa pemakaian lain', (frag.match(/pajak\.go\.id|ddtc\.co\.id|ikpi\.or\.id/g) || []).length);
    cek(hosts.every((h) => diizinkan.indexOf(h) >= 0), 'fragmen hanya menyebut host yang diizinkan artifact', hosts.filter((h) => diizinkan.indexOf(h) < 0));
  }

  await browser.close();
  srv.srv.close();
  process.exit(L.ringkas('ARTIFACT') ? 1 : 0);
})().catch((e) => { console.error('UJI BERHENTI:', e.stack.split('\n').slice(0, 8).join('\n')); process.exit(2); });
