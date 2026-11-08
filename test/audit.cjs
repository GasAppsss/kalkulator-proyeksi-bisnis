/* Audit: aksesibilitas (axe-core menembus shadow DOM), tata letak di banyak lebar, dan kinerja pada data terbesar */
const L = require('./lib.cjs');
const { cek, isi, teks, langkah, mesin, path, fs } = L;
const K = mesin();
const AXE = fs.readFileSync(path.join(L.KPB_DIR, 'node_modules/axe-core/axe.min.js'), 'utf8');
const TAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const URUT_DAMPAK = ['critical', 'serious', 'moderate', 'minor'];

async function jalankanAxe(p, label, himpun, tanpa) {
  const hasil = await p.evaluate(async ([tag, tanpa]) => {
    const rules = {};
    (tanpa || []).forEach((id) => { rules[id] = { enabled: false }; });
    const r = await axe.run(document, { runOnly: { type: 'tag', values: tag }, rules });
    return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, contoh: v.nodes.slice(0, 2).map((x) => x.target.join(' ') + ' :: ' + (x.failureSummary || '').split('\n').slice(1, 3).join(' / ').slice(0, 200)) }));
  }, [TAG, tanpa]);
  hasil.forEach((v) => {
    const e = himpun.get(v.id) || { id: v.id, impact: v.impact, help: v.help, kasus: [], contoh: v.contoh };
    e.kasus.push(label + ' x' + v.n);
    himpun.set(v.id, e);
  });
  return hasil.length;
}

(async () => {
  const srv = await L.mulai(L.FOLDER);
  const browser = await L.chromium.launch();

  /* ===== 1. axe: layar awal, enam langkah, menu, kamus, kotak salin; terang dan gelap; desktop dan HP ===== */
  const himpun = new Map();
  const konfig = [['desktop-terang', { width: 1280, height: 900 }, 'light'], ['desktop-gelap', { width: 1280, height: 900 }, 'dark'], ['hp-terang', { width: 390, height: 844 }, 'light'], ['hp-gelap', { width: 390, height: 844 }, 'dark']];
  for (const [nama, vp, skema] of konfig) {
    const A = await L.bukaApp({ srv, browser, context: { viewport: vp, colorScheme: skema } });
    const p = A.page;
    await p.addScriptTag({ content: AXE });
    await jalankanAxe(p, nama + ' awal', himpun);
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    await p.waitForTimeout(300);
    for (let n = 1; n <= 6; n++) {
      await langkah(p, n);
      await p.waitForTimeout(250);
      await jalankanAxe(p, nama + ' L' + n, himpun);
    }
    /* keadaan tambahan */
    await langkah(p, 4);
    await p.locator('#kpb-f-ms').check();
    await jalankanAxe(p, nama + ' L4+musiman', himpun);
    await p.locator('#kpb-btn-menu').click();
    await jalankanAxe(p, nama + ' menu', himpun);
    await p.keyboard.press('Escape');
    await p.getByRole('button', { name: 'Kamus istilah' }).first().click();
    await jalankanAxe(p, nama + ' kamus', himpun);
    await langkah(p, 6);
    await p.evaluate(() => { Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new Error('x')) }, configurable: true }); document.execCommand = () => false; });
    await p.getByRole('button', { name: 'Salin ringkasan', exact: true }).click();
    await p.waitForSelector('#kpb-kotak-salin[open]');
    await jalankanAxe(p, nama + ' kotak-salin', himpun);
    await p.keyboard.press('Escape');
    await p.locator('.row').first().evaluate(() => {}).catch(() => {});
    await langkah(p, 3);
    await p.locator('.row >> nth=0 >> .del').click();
    /* toast sengaja menutupi sebagian halaman selama beberapa detik, jadi aturan ukuran sasaran dilewati pada keadaan ini saja */
    await jalankanAxe(p, nama + ' toast-urungkan', himpun, ['target-size']);
    await A.tutup();
  }
  const urut = [...himpun.values()].sort((a, b) => URUT_DAMPAK.indexOf(a.impact) - URUT_DAMPAK.indexOf(b.impact));
  console.log('== AXE: ' + urut.length + ' jenis pelanggaran dari 4 konfigurasi x 17 keadaan');
  urut.forEach((e) => {
    console.log('- [' + e.impact + '] ' + e.id + ': ' + e.help + ' | ' + e.kasus.length + ' kasus, mis. ' + e.kasus.slice(0, 4).join('; '));
    e.contoh.forEach((c) => console.log('    ' + c));
  });
  cek(urut.filter((e) => e.impact === 'critical' || e.impact === 'serious').length === 0, 'axe: tanpa pelanggaran kritis atau serius', urut.filter((e) => e.impact === 'critical' || e.impact === 'serious').map((e) => e.id));
  cek(urut.length === 0, 'axe: tanpa pelanggaran apa pun', urut.map((e) => e.id + ' (' + e.impact + ')'));

  /* ===== 2. tata letak: tanpa gulir samping di 7 lebar, terang dan gelap, semua langkah ===== */
  const lebarList = [320, 360, 390, 600, 768, 1024, 1280, 1920];
  for (const w of lebarList) {
    for (const skema of ['light', 'dark']) {
      const A = await L.bukaApp({ srv, browser, context: { viewport: { width: w, height: 900 }, colorScheme: skema } });
      const p = A.page;
      const melebar = [];
      if (await L.adaGulir(p)) melebar.push('awal');
      await p.locator('.tpl').first().click();
      await p.waitForSelector('#kpb-panel');
      for (let n = 1; n <= 6; n++) {
        await langkah(p, n);
        await p.waitForTimeout(150);
        if (await L.adaGulir(p)) melebar.push('L' + n);
      }
      await langkah(p, 4);
      await p.locator('#kpb-f-ms').check();
      await p.waitForTimeout(150);
      if (await L.adaGulir(p)) melebar.push('L4+musiman');
      cek(melebar.length === 0, 'tanpa gulir samping di ' + w + 'px (' + skema + ')', melebar);
      /* tidak ada isi yang terpotong di sisi kanan oleh overflow tersembunyi: setiap kartu tidak lebih lebar dari viewport */
      const keluar = await p.evaluate(() => {
        const r = window.__R(), vw = document.documentElement.clientWidth, buruk = [];
        r.querySelectorAll('.sec, .kartu, .cc, .nota, .tiles, .row, .tw, .live, header.top, .nav').forEach((e) => {
          const b = e.getBoundingClientRect();
          if (b.width > 0 && (b.right > vw + 1 || b.left < -1)) buruk.push((e.className || e.tagName) + ':' + Math.round(b.left) + '..' + Math.round(b.right));
        });
        return buruk.slice(0, 4);
      });
      cek(keluar.length === 0, 'tidak ada blok melewati tepi layar di ' + w + 'px (' + skema + ')', keluar);
      await A.tutup();
    }
  }

  /* ===== 3. ukuran sasaran sentuh dan fokus terlihat di HP ===== */
  {
    const A = await L.bukaApp({ srv, browser, context: { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true } });
    const p = A.page;
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    for (const n of [1, 2, 3, 4, 5, 6]) {
      await langkah(p, n);
      const kecil = await p.evaluate(() => {
        const r = window.__R(), buruk = [];
        r.querySelectorAll('button, a[href], input:not([type="hidden"]), select, summary').forEach((e) => {
          const b = e.getBoundingClientRect();
          if (b.width === 0 || b.height === 0) return;
          const cs = getComputedStyle(e);
          if (cs.visibility === 'hidden') return;
          /* isi produk yang tertutup (<details>) tidak tampak dan tidak bisa disentuh; tata letaknya baru dihitung begitu dibuka */
          if (typeof e.checkVisibility === 'function' ? !e.checkVisibility() : (e.closest('details:not([open])') && e.tagName !== 'SUMMARY')) return;
          /* kotak centang diperbolehkan lebih kecil karena label di sampingnya ikut menjadi sasaran */
          if (e.type === 'checkbox') return;
          /* tautan di dalam kalimat dikecualikan oleh WCAG 2.2 (sasaran sebaris) */
          if (e.tagName === 'A' && e.closest('p, li, .small, .hint')) return;
          if (b.height < 24 || b.width < 24) buruk.push((e.id || e.className || e.tagName) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height));
        });
        return buruk.slice(0, 6);
      });
      cek(kecil.length === 0, 'langkah ' + n + ': semua kontrol minimal 24x24 px (WCAG 2.2)', kecil);
    }
    await A.tutup();
  }

  /* ===== 3b. isian bahan cukup lebar di setiap lebar layar (tabel maupun kartu) dan tidak ada baris yang melewati wadahnya ===== */
  {
    const lebarIsian = [320, 360, 390, 430, 480, 520, 600, 700, 760, 800, 840, 870, 900, 960, 1024, 1100, 1180, 1230, 1260, 1280, 1440, 1920];
    const bermasalah = [];
    for (const w of lebarIsian) {
      const A = await L.bukaApp({ srv, browser, context: { viewport: { width: w, height: 900 }, serviceWorkers: 'block' } });
      const p = A.page;
      await p.locator('.tpl').first().click();
      await p.waitForSelector('#kpb-panel');
      await langkah(p, 2);
      await p.waitForTimeout(250);
      const temuan = await p.evaluate(() => {
        const r = window.__R(), buruk = [];
        const lebar = (e) => (e ? Math.round(e.getBoundingClientRect().width) : 0);
        r.querySelectorAll('.rows').forEach((rows) => {
          if (!rows.checkVisibility()) return;
          const ujung = rows.getBoundingClientRect().right;
          rows.querySelectorAll('.row').forEach((row) => { if (row.getBoundingClientRect().right > ujung + 1) buruk.push('baris melewati wadah: ' + rows.className); });
        });
        const bahan = r.querySelector('.rows .row'), lain = r.querySelectorAll('.rows')[1];
        const minimal = (akar, akhiran, batas, nama) => {
          const e = akar && akar.querySelector('[id$="' + akhiran + '"]');
          if (!e) { buruk.push(nama + ' tidak ditemukan'); return; }
          if (lebar(e) < batas) buruk.push(nama + ' ' + lebar(e) + 'px < ' + batas);
        };
        minimal(bahan, '-n', 80, 'nama bahan');
        minimal(bahan, '-h', 70, 'harga beli');
        minimal(bahan, '-i', 44, 'isi per pembelian');
        minimal(bahan, '-s', 70, 'satuan beli');
        minimal(bahan, '-p', 48, 'dipakai per produk');
        if (lain) minimal(lain.querySelector('.row'), '-b', 60, 'biaya lain');
        r.querySelectorAll('button, input:not([type="hidden"]), select, summary').forEach((e) => {
          if (!e.checkVisibility() || e.type === 'checkbox') return;
          const b = e.getBoundingClientRect();
          if (b.width < 24 || b.height < 24) buruk.push('kontrol kecil ' + (e.id || e.className) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height));
        });
        return buruk.slice(0, 4);
      });
      if (temuan.length) bermasalah.push(w + 'px: ' + temuan.join('; '));
      await A.tutup();
    }
    cek(bermasalah.length === 0, 'isian bahan cukup lebar dan baris muat di wadahnya pada ' + lebarIsian.length + ' lebar layar', bermasalah);
  }

  /* ===== 3c. perbaikan hasil tinjauan visual: pesan tidak menyempit, tabel BEP per produk jadi kartu di kolom sempit,
     nominal tidak terpotong di tengah, label tengah bilah bawah tidak bergeser di langkah terakhir ===== */
  {
    const bermasalah = [];
    for (const w of [320, 390, 700, 760, 1280]) {
      const A = await L.bukaApp({ srv, browser, context: { viewport: { width: w, height: 900 }, serviceWorkers: 'block' } });
      const p = A.page;
      await p.locator('.tpl').first().click();
      await p.waitForSelector('#kpb-panel');
      /* pesan (toast): selebar isinya sampai batas 520 px atau lebar layar dikurangi 32 px, bukan separuh lebar yang tersedia */
      const toast = await p.evaluate(() => { const t = window.__R().querySelector('.toast'); return t && !t.hidden ? { w: t.getBoundingClientRect().width, h: t.getBoundingClientRect().height } : null; });
      const batas = Math.min(520, w - 32);
      if (!toast) bermasalah.push(w + 'px: pesan contoh tidak muncul');
      else if (toast.w < batas * 0.9) bermasalah.push(w + 'px: pesan menyempit ' + Math.round(toast.w) + 'px (seharusnya sekitar ' + batas + ')');
      /* pilihan "Jenis" biaya langsung terbaca penuh */
      await langkah(p, 2);
      await p.waitForTimeout(200);
      const jenis = await p.evaluate(() => { const rows = window.__R().querySelectorAll('.rows')[1]; const e = rows && rows.querySelector('[id$="-j"]'); return e ? Math.round(e.getBoundingClientRect().width) : 0; });
      if (jenis < 110) bermasalah.push(w + 'px: pilihan Jenis biaya hanya ' + jenis + 'px');
      /* label tengah bilah bawah tetap di tengah pada setiap langkah, termasuk langkah terakhir yang tanpa tombol Lanjut */
      const pos = [];
      for (let n = 1; n <= 6; n++) {
        await langkah(p, n);
        pos.push(await p.evaluate(() => { const R = window.__R(), e = R.getElementById('kpb-where').getBoundingClientRect(), nav = R.querySelector('.nav').getBoundingClientRect(); return Math.round((e.left + e.width / 2) - (nav.left + nav.width / 2)); }));
        if (n === 5 || n === 6) {
          const kotor = (await L.teksApp(p)).match(/Rp [\d−]/);
          if (kotor) bermasalah.push(w + 'px langkah ' + n + ': ada "Rp" yang bisa terpisah dari angkanya');
        }
        if (n === 5) {
          const t = await p.evaluate((vw) => {
            const R = window.__R();
            const tw = [...R.querySelectorAll('.tw')].find((x) => /BEP per produk/.test(x.querySelector('.scroll').getAttribute('aria-label')));
            const sc = tw.querySelector('.scroll'), sel = [...tw.querySelectorAll('td[data-label="BEP / bulan"]')];
            return { kartu: /\ble-738\b/.test(tw.className), lebar: tw.clientWidth, meluap: sc.scrollWidth > sc.clientWidth + 1, n: sel.length, peran: tw.querySelector('table').getAttribute('role') + '/' + tw.querySelector('td').getAttribute('role'), terlihat: sel.every((c) => { const b = c.getBoundingClientRect(); return b.width > 0 && b.left >= -1 && b.right <= vw + 1; }) };
          }, w);
          if (t.kartu !== (t.lebar <= 738)) bermasalah.push(w + 'px: mode kartu BEP per produk salah (kelas ' + t.kartu + ', lebar ' + t.lebar + ')');
          if (t.kartu && t.meluap) bermasalah.push(w + 'px: kartu BEP per produk masih meluap ke samping');
          if (t.kartu && !t.terlihat) bermasalah.push(w + 'px: kolom BEP per produk tidak terlihat penuh di layar');
          if (t.n < 1 || t.peran !== 'table/cell') bermasalah.push(w + 'px: peran ARIA tabel BEP per produk ' + t.peran);
        }
      }
      if (Math.max.apply(null, pos) - Math.min.apply(null, pos) > 1 || Math.abs(pos[0]) > 1) bermasalah.push(w + 'px: label tengah bilah bawah bergeser antar langkah ' + pos.join(','));
      await A.tutup();
    }
    cek(bermasalah.length === 0, 'tata letak hasil tinjauan visual benar di 5 lebar (pesan, kartu BEP, nominal, bilah bawah)', bermasalah);
  }

  /* ===== 4. kinerja pada data terbesar (12 produk x 40 bahan, 60 bulan) ===== */
  {
    const S = K.TEMPLATE[0].bangun();
    S.periode = 60;
    S.contoh = false;
    const dasar = S.produk[0];
    S.produk = [];
    for (let i = 0; i < 12; i++) {
      const pr = JSON.parse(JSON.stringify(dasar));
      pr.id = 'p' + i; pr.nama = 'Produk ' + (i + 1);
      pr.bahan = Array.from({ length: 40 }, (_, j) => ({ id: 'b' + i + '_' + j, nama: 'Bahan ' + j, harga: 10000 + j * 500, isi: 1000, pakai: 10 + j, satuan: 'gram', satuanPakai: '' }));
      S.produk.push(pr);
    }
    S.biayaTetap = Array.from({ length: 60 }, (_, i) => ({ id: 't' + i, nama: 'Biaya ' + i, nilai: 500000 }));
    S.investasi = Array.from({ length: 40 }, (_, i) => ({ id: 'i' + i, nama: 'Inv ' + i, nilai: 2000000, umur: 5 }));
    const state = K.normalisasi(S);
    const A = await L.bukaApp({
      srv, browser, context: { viewport: { width: 1280, height: 900 } },
      init: () => {
        window.__tugasPanjang = [];
        try { new PerformanceObserver((l) => l.getEntries().forEach((e) => window.__tugasPanjang.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: true }); } catch (e) { /* abaikan */ }
      },
    });
    const p = A.page;
    await p.evaluate((s) => localStorage.setItem('kpb:data', JSON.stringify({ v: 2, ts: Date.now(), data: s })), state);
    await p.goto(srv.url + '/');
    await p.waitForSelector('#kpb-panel');
    const waktu = {};
    for (let n = 1; n <= 6; n++) {
      const t0 = Date.now();
      await langkah(p, n);
      await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      waktu['L' + n] = Date.now() - t0;
    }
    console.log('== KINERJA data terbesar: waktu pindah langkah (ms, termasuk sistem uji)', JSON.stringify(waktu));
    cek(Object.values(waktu).every((v) => v < 2500), 'pindah langkah di bawah 2,5 detik pada data terbesar', waktu);
    /* render malas: di langkah 2 hanya kartu produk yang terbuka yang membangun baris bahannya */
    await langkah(p, 2);
    const dom2 = await p.evaluate(() => { const r = window.__R(); return { semua: r.querySelectorAll('*').length, isi: r.querySelectorAll('.prod-isi').length, kartu: r.querySelectorAll('.prod').length }; });
    console.log('== DOM langkah 2 pada data terbesar:', JSON.stringify(dom2));
    cek(dom2.kartu === 12 && dom2.isi === 1 && dom2.semua < 8000, 'langkah 2 di data terbesar: 12 kartu, hanya 1 membangun isinya, elemen DOM di bawah 8.000 (sebelumnya sekitar 26.000)', dom2);
    const t2 = Date.now();
    await p.locator('.prod details >> nth=5 >> summary').click();
    await p.locator('.prod details >> nth=5 >> .prod-isi .row').first().waitFor();
    const bukaMs = Date.now() - t2;
    console.log('== membuka satu kartu produk (40 bahan) pada data terbesar:', bukaMs + ' ms (termasuk sistem uji)');
    cek(bukaMs < 1500, 'membuka kartu produk dengan 40 bahan di bawah 1,5 detik', bukaMs);
    cek((await p.locator('.prod details >> nth=5 >> .prod-isi .row').count()) >= 40, 'kartu yang dibuka memuat semua 40 baris bahan', await p.locator('.prod details >> nth=5 >> .prod-isi .row').count());
    await p.locator('.prod details >> nth=5 >> summary').click();
    /* latensi mengetik: harga produk 1 di langkah 2 dengan data terbesar */
    await p.evaluate(() => { window.__tugasPanjang.length = 0; });
    const sel = '#kpb-prd-p0-h';
    await p.locator(sel).click();
    await p.keyboard.press('Control+A');
    const t1 = Date.now();
    await p.keyboard.type('2500000', { delay: 20 });
    const ms = Date.now() - t1;
    await p.waitForTimeout(300);
    const tugas = await p.evaluate(() => window.__tugasPanjang.slice());
    const maks = tugas.length ? Math.max(...tugas) : 0;
    console.log('== KINERJA mengetik 7 digit di data terbesar:', ms + ' ms total,', tugas.length + ' tugas panjang, terpanjang ' + maks + ' ms');
    cek(maks < 250, 'tidak ada tugas panjang > 250 ms saat mengetik pada data terbesar', tugas);
    /* hasil tetap benar */
    await langkah(p, 5);
    const aT = K.analisis(K.normalisasi(Object.assign({}, state, { produk: state.produk.map((x, i) => (i === 0 ? Object.assign({}, x, { harga: 2500000 }) : x)) })));
    const ver = await teks(p, '.verdict');
    cek(ver.indexOf(new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(Math.round(aT.bep.bepUnit))) >= 0, 'hasil di data terbesar sama dengan mesin (BEP ' + Math.round(aT.bep.bepUnit) + ')', ver);
    cek(!(await L.layarBersih(p)), 'data terbesar: layar bersih');
    cek(A.logs.length === 0, 'kinerja: tanpa galat konsol', A.logs);
    await A.tutup();
  }

  srv.srv.close();
  await browser.close();
  process.exit(L.ringkas('AUDIT') ? 1 : 0);
})().catch((e) => { console.error('AUDIT BERHENTI:', e.stack.split('\n').slice(0, 8).join('\n')); process.exit(2); });
