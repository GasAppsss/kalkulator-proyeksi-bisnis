/* Uji gerak: animasi hanya menjawab tindakan pengguna, lambat tetapi tidak menghambat, tidak pernah berulang sendiri,
   tidak membuat halaman bergeser ke samping, dan mati total bila pengguna meminta gerak dikurangi.
   Perubahan kelas di dalam shadow root dicatat dengan MutationObserver (lengkap dengan gaya hitungan saat kelas dipasang),
   jadi pemeriksaan tidak bergantung pada ketepatan waktu klik. Empat skenario berjalan bersamaan di konteks terpisah. */
const L = require('./lib.cjs');
const { cek, langkah } = L;

/* dipasang di halaman: mencatat setiap kelas yang ditambah atau dilepas di dalam shadow root */
const PASANG_CATAT = () => {
  const R = window.__R();
  window.__lg = [];
  const t0 = performance.now();
  const PENTING = /^(masuk-|main$|pra$|keluar$|tema-ganti$)/;
  new MutationObserver((ms) => {
    /* satu panggilan bisa memuat beberapa perubahan pada elemen yang sama: nilai kelas sesudah tiap perubahan = nilai lama perubahan berikutnya */
    ms.forEach((m, i) => {
      let sesudah = m.target.getAttribute('class') || '';
      for (let j = i + 1; j < ms.length; j++) if (ms[j].target === m.target) { sesudah = ms[j].oldValue || ''; break; }
      const lama = new Set((m.oldValue || '').split(/\s+/).filter(Boolean));
      const baru = new Set(sesudah.split(/\s+/).filter(Boolean));
      const tambah = [...baru].filter((k) => !lama.has(k)), lepas = [...lama].filter((k) => !baru.has(k));
      if (!tambah.length && !lepas.length) return;
      const e = { t: Math.round(performance.now() - t0), el: m.target.id || (m.target.tagName.toLowerCase() + '.' + (m.target.getAttribute('class') || '').split(' ')[0]), tambah, lepas };
      if (tambah.some((k) => PENTING.test(k))) {
        const gs = getComputedStyle(m.target);
        e.an = gs.animationName; e.ad = gs.animationDuration;
        const anak = m.target.querySelector('.seri, .batang, .sapu');
        if (anak) { const g = getComputedStyle(anak); e.anakAn = g.animationName; e.anakAd = g.animationDuration; }
      }
      window.__lg.push(e);
    });
  }).observe(R, { attributes: true, attributeFilter: ['class'], attributeOldValue: true, subtree: true });
};
const detik = (s) => (s ? parseFloat(String(s).split(',')[0]) : 0);
const log = (p) => p.evaluate(() => window.__lg.slice());
const ada = (lg, el, kunci, jenis) => lg.find((e) => e.el === el && (jenis === 'lepas' ? e.lepas : e.tambah).some((k) => (kunci instanceof RegExp ? kunci.test(k) : k === kunci)));
const hentikan = (p) => p.evaluate(() => { window.__lg.length = 0; });

(async () => {
  const srv = await L.mulai(L.FOLDER);
  const browser = await L.chromium.launch();
  const konteks = (w, h, gerak, hp) => ({ viewport: { width: w, height: h }, reducedMotion: gerak, ...(hp ? { hasTouch: true, isMobile: true } : {}) });

  /* ===== A. perpindahan langkah, pesan, dan tema di desktop (gerak boleh) ===== */
  const skenarioA = async () => {
    const A = await L.bukaApp({ srv, browser, context: konteks(1280, 900, 'no-preference') });
    const p = A.page;
    await p.evaluate(PASANG_CATAT);
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    await p.waitForTimeout(2300);
    let lg = await log(p);
    const masuk = ada(lg, 'kpb-view', 'masuk-naik');
    cek(!!masuk, 'A gerak: dari layar awal ke langkah, tampilan masuk pelan (masuk-naik)', lg.slice(0, 6));
    cek(!!masuk && masuk.an === 'muncul' && detik(masuk.ad) >= 0.6 && detik(masuk.ad) <= 1.4, 'A gerak: masuk-naik memakai animasi muncul berdurasi 0,6 sampai 1,4 detik', masuk && [masuk.an, masuk.ad]);
    cek(!!ada(lg, 'kpb-view', 'masuk-naik', 'lepas'), 'A gerak: kelas masuk-naik dilepas setelah selesai (bisa dimainkan lagi)');

    for (const [ke, arah] of [[2, 'masuk-maju'], [1, 'masuk-mundur'], [4, 'masuk-maju'], [3, 'masuk-mundur']]) {
      await hentikan(p);
      await langkah(p, ke);
      await p.waitForTimeout(2300);
      lg = await log(p);
      /* langkah 2 dan 5 tanpa ringkasan langsung (tata letak "wide"): hanya panel yang bergerak */
      const adaLive = !(await p.evaluate(() => window.__R().getElementById('kpb-layout').classList.contains('wide')));
      const pn = ada(lg, 'kpb-panel', arah), sl = ada(lg, 'kpb-live-slot', arah);
      cek(!!pn, 'A gerak: pindah ke langkah ' + ke + ' memasang ' + arah + ' pada panel', lg.slice(0, 6));
      cek(!!pn && /^(maju|mundur)$/.test(pn.an) && detik(pn.ad) >= 0.6 && detik(pn.ad) <= 1.4, 'A gerak: langkah ' + ke + ': animasi panel ' + (pn && pn.an) + ' berdurasi 0,6 sampai 1,4 detik', pn && [pn.an, pn.ad]);
      cek(adaLive ? !!sl : !sl, 'A gerak: langkah ' + ke + (adaLive ? ': ringkasan langsung ikut masuk (' + arah + ')' : ': tanpa ringkasan langsung, tidak ada gerak yang tersisa'), lg.slice(0, 6));
      if (sl) cek(sl.an === 'muncul' && detik(sl.ad) >= 0.8 && detik(sl.ad) <= 1.6, 'A gerak: langkah ' + ke + ': ringkasan langsung memudar masuk 0,8 sampai 1,6 detik', [sl.an, sl.ad]);
      cek(!!ada(lg, 'kpb-panel', arah, 'lepas') && (!adaLive || !!ada(lg, 'kpb-live-slot', arah, 'lepas')), 'A gerak: langkah ' + ke + ': kelas animasi dilepas setelah selesai');
    }

    /* diam: tidak ada animasi yang berjalan terus, dan semuanya berhingga */
    await p.waitForTimeout(1200);
    const anim = await p.evaluate(() => window.__R().getAnimations().filter((a) => a.playState === 'running').map((a) => ({ n: a.animationName || a.transitionProperty || '?', it: a.effect && a.effect.getComputedTiming().iterations })));
    cek(anim.length === 0, 'A gerak: setelah diam tidak ada animasi yang masih berjalan', anim.slice(0, 5));
    cek(anim.every((a) => a.it !== Infinity), 'A gerak: tidak ada animasi yang berulang tanpa henti');

    /* pesan Urungkan: tampil, lalu memudar pelan sebelum hilang */
    await langkah(p, 2);
    await p.waitForTimeout(1500);
    await hentikan(p);
    await p.locator('.del').first().click();
    cek(await p.locator('#kpb-toast').isVisible(), 'A gerak: pesan "Bahan dihapus" tampil');
    await p.waitForFunction(() => window.__lg.some((e) => e.el === 'kpb-toast' && e.tambah.includes('keluar')), null, { timeout: 9500, polling: 100 }).catch(() => {});
    lg = await log(p);
    const kel = ada(lg, 'kpb-toast', 'keluar');
    cek(!!kel, 'A gerak: pesan memudar (kelas keluar) sebelum hilang', lg.filter((e) => e.el === 'kpb-toast'));
    cek(!!kel && kel.an === 'toastKeluar' && detik(kel.ad) >= 0.3 && detik(kel.ad) <= 1, 'A gerak: pudar pesan berdurasi 0,3 sampai 1 detik', kel && [kel.an, kel.ad]);
    await p.waitForTimeout(900);
    cek(await p.locator('#kpb-toast').isHidden(), 'A gerak: pesan tersembunyi setelah memudar');

    /* tema: warna berpindah pelan, kelasnya hanya selama peralihan */
    await hentikan(p);
    await p.evaluate(() => window.KPBApp.setTema('gelap'));
    await p.waitForTimeout(1300);
    lg = await log(p);
    cek(!!ada(lg, 'kpb-app', 'tema-ganti') && !!ada(lg, 'kpb-app', 'tema-ganti', 'lepas'), 'A gerak: ganti tema memasang lalu melepas tema-ganti', lg.slice(0, 4));
    cek((await p.evaluate(() => document.getElementById('kpb-root').getAttribute('data-theme'))) === 'dark', 'A gerak: tema gelap terpasang');
    await p.evaluate(() => window.KPBApp.setTema('terang'));
    await p.waitForTimeout(1100);
    cek(A.logs.length === 0, 'A gerak: tanpa galat konsol', A.logs);
    await A.tutup();
  };

  /* ===== B. grafik: menunggu terlihat, tergambar sekali, tidak mengulang saat ukuran berubah, tampil utuh saat dicetak ===== */
  const skenarioB = async () => {
    const A = await L.bukaApp({ srv, browser, context: konteks(1280, 700, 'no-preference') });
    const p = A.page;
    await p.evaluate(PASANG_CATAT);
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    await langkah(p, 5);
    await p.waitForTimeout(500);
    const awal = await p.evaluate(() => [...window.__R().querySelectorAll('.chart')].map((c) => ({ kls: c.className, top: Math.round(c.getBoundingClientRect().top) })));
    cek(awal.length >= 2, 'B gerak: langkah 5 punya grafik titik impas dan grafik laba', awal);
    cek(awal.every((c) => c.top < 700 || /\bpra\b/.test(c.kls)), 'B gerak: grafik di luar layar menunggu (kelas pra), belum tergambar', awal);
    const op = await p.evaluate(() => { const c = window.__R().querySelector('.chart.pra'); const e = c && c.querySelector('.penanda, .batang, .zona'); return e ? getComputedStyle(e).opacity : 'tanpa'; });
    cek(op === '0', 'B gerak: unsur grafik tersembunyi selama menunggu (pra)', op);

    /* grafik titik impas: garis tergambar pelan, lalu tampil utuh tanpa sisa gaya animasi */
    await hentikan(p);
    await p.evaluate(() => window.__R().querySelectorAll('.chart')[0].scrollIntoView({ block: 'center' }));
    await p.waitForFunction(() => window.__lg.some((e) => e.tambah.includes('main')), null, { timeout: 4000, polling: 100 }).catch(() => {});
    let lg = await log(p);
    const m1 = lg.find((e) => e.tambah.includes('main'));
    cek(!!m1, 'B gerak: grafik yang terlihat mulai tergambar (kelas main)', lg.slice(0, 5));
    cek(!!m1 && /gambarGaris/.test(m1.anakAn || '') && detik(m1.anakAd) >= 1.5 && detik(m1.anakAd) <= 3.5, 'B gerak: garis tergambar selama 1,5 sampai 3,5 detik (pelan)', m1 && [m1.anakAn, m1.anakAd]);
    cek(lg.filter((e) => e.tambah.includes('main')).length === 1, 'B gerak: hanya satu grafik yang bergerak (yang terlihat)');
    await p.waitForFunction(() => !window.__R().querySelector('.chart.main'), null, { timeout: 8000, polling: 200 }).catch(() => {});
    const sisa = await p.evaluate(() => {
      const c = window.__R().querySelectorAll('.chart')[0];
      const garis = [...c.querySelectorAll('.seri')].map((s) => getComputedStyle(s).strokeDasharray);
      const buram = [...c.querySelectorAll('.zona, .penanda')].map((s) => getComputedStyle(s).opacity);
      return { kls: c.className, garis, buram, anim: c.getAnimations({ subtree: true }).length };
    });
    cek(!/\b(pra|main)\b/.test(sisa.kls) && sisa.garis.every((g) => g === 'none') && sisa.buram.every((b) => b === '1') && sisa.anim === 0, 'B gerak: sesudah selesai, grafik tampil utuh tanpa sisa gaya animasi', sisa);

    /* grafik laba: batang tumbuh dari dasar */
    await hentikan(p);
    await p.evaluate(() => window.__R().querySelectorAll('.chart')[1].scrollIntoView({ block: 'center' }));
    await p.waitForFunction(() => window.__lg.some((e) => e.tambah.includes('main')), null, { timeout: 4000, polling: 100 }).catch(() => {});
    lg = await log(p);
    const m2 = lg.find((e) => e.tambah.includes('main'));
    cek(!!m2 && /tumbuhY/.test(m2.anakAn || ''), 'B gerak: batang grafik laba tumbuh pelan (tumbuhY)', m2 && [m2.anakAn, m2.anakAd]);
    await p.waitForFunction(() => !window.__R().querySelector('.chart.main'), null, { timeout: 8000, polling: 200 }).catch(() => {});

    /* ukuran jendela berubah: grafik digambar ulang sebagai gambar diam, tidak mengulang gerak */
    await hentikan(p);
    const lebarSebelum = await p.evaluate(() => window.__R().querySelector('.chart svg').getBoundingClientRect().width);
    await p.setViewportSize({ width: 1000, height: 700 });
    await p.waitForTimeout(900);
    lg = await log(p);
    const lebarSesudah = await p.evaluate(() => window.__R().querySelector('.chart svg').getBoundingClientRect().width);
    cek(lebarSesudah !== lebarSebelum, 'B gerak: grafik menyesuaikan lebar baru', [lebarSebelum, lebarSesudah]);
    cek(!lg.some((e) => e.tambah.includes('main') || e.tambah.includes('pra')), 'B gerak: ukuran berubah tidak memutar ulang gerak grafik', lg.slice(0, 5));

    /* langkah 6: grafik arus kas, garis disapu dari kiri */
    await hentikan(p);
    await langkah(p, 6);
    await p.evaluate(() => window.__R().querySelector('.chart').scrollIntoView({ block: 'center' }));
    await p.waitForFunction(() => window.__lg.some((e) => e.tambah.includes('main')), null, { timeout: 4000, polling: 100 }).catch(() => {});
    lg = await log(p);
    const m3 = lg.find((e) => e.tambah.includes('main'));
    cek(!!m3 && /sapuKanan/.test(m3.anakAn || ''), 'B gerak: grafik arus kas disapu pelan dari kiri (sapuKanan)', m3 && [m3.anakAn, m3.anakAd]);

    /* mengetik di langkah 4 tidak memutar ulang gerak apa pun */
    await langkah(p, 4);
    await p.waitForTimeout(1800);
    await hentikan(p);
    const id = await p.evaluate(() => window.__R().querySelector('input[id^="kpb-tgt-"]').id);
    await p.locator('#' + id).click();
    await p.keyboard.press('Control+A');
    await p.keyboard.type('250', { delay: 60 });
    await p.waitForTimeout(500);
    lg = await log(p);
    cek(!lg.some((e) => /^(masuk-|main$|pra$)/.test(e.tambah.join(' '))), 'B gerak: mengetik angka tidak memicu animasi masuk atau gambar ulang', lg.slice(0, 5));
    cek(A.logs.length === 0, 'B gerak: tanpa galat konsol', A.logs);
    await A.tutup();

    /* cetak: grafik yang belum pernah terlihat tetap tampil utuh di kertas */
    const C = await L.bukaApp({ srv, browser, context: konteks(1280, 700, 'no-preference') });
    const q = C.page;
    await q.locator('.tpl').first().click();
    await q.waitForSelector('#kpb-panel');
    await langkah(q, 5);
    await q.waitForTimeout(400);
    const layar = await q.evaluate(() => { const e = window.__R().querySelector('.chart.pra .penanda, .chart.pra .batang'); return e ? getComputedStyle(e).opacity : 'tanpa'; });
    await q.emulateMedia({ media: 'print' });
    const cetak = await q.evaluate(() => [...window.__R().querySelectorAll('.chart.pra')].map((c) => { const e = c.querySelector('.penanda, .batang'); return e ? getComputedStyle(e).opacity : 'tanpa'; }));
    cek(layar === '0' && cetak.length >= 1 && cetak.every((o) => o === '1'), 'B gerak: grafik yang belum terlihat tetap tampil utuh saat dicetak', { layar, cetak });
    await C.tutup();
  };

  /* ===== C. gerak dikurangi: tidak ada animasi, tidak ada unsur tersembunyi menunggu ===== */
  const skenarioC = async () => {
    const A = await L.bukaApp({ srv, browser, context: konteks(1280, 700, 'reduce') });
    const p = A.page;
    await p.evaluate(PASANG_CATAT);
    await p.locator('.tpl').first().click();
    await p.waitForSelector('#kpb-panel');
    for (const n of [2, 1, 5, 6, 3]) {
      await langkah(p, n);
      const sekarang = await p.evaluate(() => window.__R().getAnimations().filter((a) => a.playState === 'running').map((a) => (a.animationName || a.transitionProperty) + '@' + (a.effect.target.id || a.effect.target.tagName) + (a.effect.pseudoElement || '')));
      cek(sekarang.length === 0, 'C kurangi gerak: langkah ' + n + ' tanpa animasi berjalan', sekarang);
    }
    await langkah(p, 5);
    await p.waitForTimeout(400);
    const grafik = await p.evaluate(() => [...window.__R().querySelectorAll('.chart')].map((c) => ({ kls: c.className, o: [...c.querySelectorAll('.zona, .penanda, .batang, .sapu')].map((e) => getComputedStyle(e).opacity).filter((x) => x !== '1').length })));
    cek(grafik.length >= 2 && grafik.every((c) => !/\b(pra|main)\b/.test(c.kls) && c.o === 0), 'C kurangi gerak: grafik langsung tampil utuh, tanpa kelas tunggu', grafik);
    const gaya = await p.evaluate(() => { const b = window.__R().querySelector('.btn'); const g = getComputedStyle(b); return { t: g.transitionDuration, a: g.animationName }; });
    cek(/^0s(, 0s)*$/.test(gaya.t) && gaya.a === 'none', 'C kurangi gerak: transisi dan animasi dimatikan pada tombol', gaya);
    let lg = await log(p);
    cek(!lg.some((e) => e.tambah.some((k) => /^(masuk-|main$|pra$|tema-ganti$)/.test(k))), 'C kurangi gerak: tidak ada kelas animasi yang pernah dipasang', lg.filter((e) => e.tambah.some((k) => /^(masuk-|main$|pra$)/.test(k))).slice(0, 4));
    await langkah(p, 2);
    await p.locator('.del').first().click();
    const awalToast = await p.locator('#kpb-toast').isVisible();
    await p.evaluate(() => window.KPBApp.setTema('gelap'));
    await p.waitForTimeout(300);
    lg = await log(p);
    cek(awalToast, 'C kurangi gerak: pesan tampil');
    cek(!lg.some((e) => e.tambah.includes('tema-ganti')), 'C kurangi gerak: ganti tema langsung, tanpa peralihan warna');
    await p.waitForFunction(() => window.__R().getElementById('kpb-toast').hidden, null, { timeout: 9500, polling: 200 }).catch(() => {});
    lg = await log(p);
    cek(await p.locator('#kpb-toast').isHidden() && !lg.some((e) => e.el === 'kpb-toast' && e.tambah.includes('keluar')), 'C kurangi gerak: pesan hilang langsung tanpa memudar', lg.filter((e) => e.el === 'kpb-toast'));
    cek(A.logs.length === 0, 'C kurangi gerak: tanpa galat konsol', A.logs);
    await A.tutup();
  };

  /* ===== D. HP: perpindahan langkah tidak pernah membuat halaman bergeser ke samping ===== */
  const skenarioD = async () => {
    for (const [w, h] of [[390, 844], [320, 640]]) {
      const A = await L.bukaApp({ srv, browser, context: konteks(w, h, 'no-preference', true) });
      const p = A.page;
      await p.evaluate(PASANG_CATAT);
      await p.evaluate(() => {
        window.__lebih = 0;
        window.__pantau = setInterval(() => { const d = document.documentElement; window.__lebih = Math.max(window.__lebih, d.scrollWidth - d.clientWidth); }, 25);
      });
      await p.locator('.tpl').first().click();
      await p.waitForSelector('#kpb-panel');
      for (const n of [2, 3, 4, 5, 6, 1]) { await langkah(p, n); await p.waitForTimeout(1100); }
      const r = await p.evaluate(() => {
        clearInterval(window.__pantau);
        const pn = window.__R().getElementById('kpb-panel').getBoundingClientRect();
        return { lebih: window.__lebih, kiri: Math.round(pn.left), kanan: Math.round(pn.right), vw: document.documentElement.clientWidth };
      });
      cek(r.lebih <= 1, 'D HP ' + w + 'px: tidak ada gulir ke samping selama perpindahan langkah', r);
      cek(r.kiri >= 0 && r.kanan <= r.vw + 1, 'D HP ' + w + 'px: panel kembali ke tempatnya setelah animasi', r);
      const lg = await log(p);
      cek(!!ada(lg, 'kpb-panel', 'masuk-mundur') && !!ada(lg, 'kpb-panel', 'masuk-maju'), 'D HP ' + w + 'px: animasi masuk tetap berjalan di layar kecil', lg.slice(0, 4));
      cek(A.logs.length === 0, 'D HP ' + w + 'px: tanpa galat konsol', A.logs);
      await A.tutup();
    }
  };

  await Promise.all([skenarioA(), skenarioB(), skenarioC(), skenarioD()]);
  srv.srv.close();
  await browser.close();
  process.exit(L.ringkas('GERAK') ? 1 : 0);
})().catch((e) => { console.error('UJI BERHENTI:', e.stack.split('\n').slice(0, 8).join('\n')); process.exit(2); });
