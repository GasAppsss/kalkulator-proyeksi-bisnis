/* ===== charts: grafik SVG buatan sendiri, tabel data, kartu grafik ===== */
function niceNum(range, bulat) {
  const eksp = Math.floor(Math.log10(range)), f = range / Math.pow(10, eksp);
  const nf = bulat ? (f < 1.5 ? 1 : f < 3 ? 2 : f < 7 ? 5 : 10) : (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10);
  return nf * Math.pow(10, eksp);
}
function skala(min, max, jumlah = 5) {
  if (!(max > min)) max = min + 1;
  const step = niceNum(niceNum(max - min, false) / (jumlah - 1), true);
  const lo = Math.floor(min / step + 1e-9) * step, hi = Math.ceil(max / step - 1e-9) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step * 1e-6; v += step) ticks.push(Math.abs(v) < step * 1e-9 ? 0 : v);
  return { lo, hi, step, ticks };
}

/* pilih kelipatan bulan untuk label sumbu x agar jarak antarlabel minimal ~32px */
const langkahLabel = (lebarPerBulan, kandidat = [1, 3, 6, 12, 24]) => kandidat.find((k) => lebarPerBulan * k >= 32) || kandidat[kandidat.length - 1];

function responsive(wrap, gambarFn) {
  let w0 = -1;
  const go = () => {
    const w = Math.max(260, Math.floor(wrap.clientWidth || 0) || 560);
    if (Math.abs(w - w0) < 2) return;
    w0 = w;
    gambarFn(w);
  };
  go();
  if (typeof ResizeObserver === 'function') new ResizeObserver(go).observe(wrap);
}

/* membuat svg + pengait hover; buat(w) mengembalikan { svg, geo }.
   Gerak masuk (garis tergambar pelan) dimainkan satu kali, saat grafik pertama kali terlihat di layar; render ulang karena
   perubahan lebar tidak mengulanginya. Tanpa IntersectionObserver atau bila gerak dikurangi, grafik langsung tampil utuh (tanpa kelas tunggu). */
function gambar(wrap, buat) {
  let status = typeof IntersectionObserver === 'function' && gerakBoleh() ? 'tunggu' : 'selesai';
  responsive(wrap, (w) => {
    wrap.replaceChildren();
    const r = buat(w);
    wrap.append(r.svg);
    if (r.geo) {
      const tip = h('div', { class: 'tip', hidden: true });
      wrap.append(tip);
      pasangHover(wrap, r.svg, tip, r.geo);
    }
    if (status === 'tunggu') wrap.classList.add('pra');
    else if (status === 'main') { status = 'selesai'; wrap.classList.remove('main'); }
  });
  if (status !== 'tunggu') return;
  const io = new IntersectionObserver((es) => {
    if (!es.some((e) => e.isIntersecting)) return;
    io.disconnect();
    wrap.classList.remove('pra');
    if (!gerakBoleh()) { status = 'selesai'; return; }
    status = 'main';
    wrap.classList.add('main');
    setTimeout(() => { if (status === 'main') { status = 'selesai'; wrap.classList.remove('main'); } }, 6000);
  }, { threshold: 0.35 });
  io.observe(wrap);
}

/* pembantu gerak: kelas pada elemen SVG, dan jeda animasi (--d) yang dihitung dari posisi elemen pada garis yang sedang tergambar */
const kls = (el, k) => { el.classList.add(k); return el; };
const jeda = (el, ms) => { el.style.setProperty('--d', Math.round(ms) + 'ms'); return el; };
/* kebalikan dari kurva easeInOutCubic (cubic-bezier(.65,0,.35,1)): pada waktu keberapa garis sampai di pecahan f dari panjangnya */
const waktuPada = (f) => { f = Math.min(1, Math.max(0, f)); return f < 0.5 ? Math.cbrt(f / 4) : 1 - Math.cbrt(2 * (1 - f)) / 2; };

function pasangHover(wrap, svg, tip, g) {
  const lapis = sv('g', { 'pointer-events': 'none' });
  const garis = sv('line', { y1: g.t, y2: g.b, stroke: 'var(--ink-3)', 'stroke-width': 1, visibility: 'hidden' });
  const tanda = sv('g');
  if (!g.tanpaGaris) lapis.append(garis);
  lapis.append(tanda);
  const hit = sv('rect', { x: g.l, y: g.t - 6, width: g.r - g.l, height: g.b - g.t + 6, fill: 'transparent', class: 'hit' });
  svg.append(lapis, hit);
  svg.setAttribute('tabindex', '0');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', g.aria || 'Grafik');
  let aktif = -1;
  const tampil = (i) => {
    aktif = i;
    const x = g.xs[i];
    garis.setAttribute('x1', x); garis.setAttribute('x2', x); garis.setAttribute('visibility', 'visible');
    tanda.replaceChildren(...(g.tanda ? g.tanda(i) : []));
    const d = g.tip(i);
    tip.replaceChildren(h('div', { class: 'th' }, d.head),
      ...d.rows.map((r) => h('div', { class: 'tr' }, h('span', null, h('i', { class: 'ln', style: 'background:' + r.warna }), r.label), h('b', null, r.nilai))));
    tip.hidden = false;
    const tw = tip.offsetWidth, ww = wrap.clientWidth;
    let kiri = x + 14;
    if (kiri + tw > ww) kiri = x - tw - 14;
    tip.style.left = Math.max(0, kiri) + 'px';
    tip.style.top = Math.max(0, g.t) + 'px';
  };
  const sembunyi = () => { aktif = -1; garis.setAttribute('visibility', 'hidden'); tanda.replaceChildren(); tip.hidden = true; };
  const terdekat = (cx) => {
    const rc = svg.getBoundingClientRect();
    const x = (cx - rc.left) * (svg.viewBox.baseVal.width / (rc.width || 1));
    let best = 0, bd = Infinity;
    g.xs.forEach((px, i) => { const d = Math.abs(px - x); if (d < bd) { bd = d; best = i; } });
    return best;
  };
  hit.addEventListener('pointermove', (e) => tampil(terdekat(e.clientX)));
  hit.addEventListener('pointerdown', (e) => tampil(terdekat(e.clientX)));
  hit.addEventListener('pointerleave', sembunyi);
  svg.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { sembunyi(); return; }
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const n = g.xs.length, maju = e.key === 'ArrowRight';
    tampil(aktif < 0 ? (maju ? 0 : n - 1) : Math.min(n - 1, Math.max(0, aktif + (maju ? 1 : -1))));
  });
  svg.addEventListener('blur', sembunyi);
}

function sumbuY(svg, g, sk, fmt) {
  const y = (v) => g.b - ((v - sk.lo) / (sk.hi - sk.lo)) * (g.b - g.t);
  sk.ticks.forEach((v) => {
    svg.append(sv('line', { x1: g.l, x2: g.r, y1: y(v), y2: y(v), stroke: v === 0 ? 'var(--line-2)' : 'var(--line)', 'stroke-width': 1 }));
    svg.append(sv('text', { x: g.l - 8, y: y(v) + 4, 'text-anchor': 'end' }, fmt(v)));
  });
  return y;
}
const halo = (x, y, t, anchor, cls) => sv('text', { x, y, class: (cls || 'lab') + ' halo', 'text-anchor': anchor || 'start' }, t);
const titik = (cx, cy, warna) => sv('circle', { cx, cy, r: 4.5, fill: warna, stroke: 'var(--card)', 'stroke-width': 2 });

function jalur(pts) { return pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(''); }
function batang(x, w, y0, y1, r) {
  const t = Math.abs(y1 - y0);
  if (t < 0.5) return 'M' + x + ',' + y0 + 'h' + w + 'v-0.5h-' + w + 'z';
  r = Math.min(r, t, w / 2);
  if (y1 < y0) return 'M' + x + ',' + y0 + 'V' + (y1 + r) + 'Q' + x + ',' + y1 + ' ' + (x + r) + ',' + y1 + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y1 + ' ' + (x + w) + ',' + (y1 + r) + 'V' + y0 + 'Z';
  return 'M' + x + ',' + y0 + 'V' + (y1 - r) + 'Q' + x + ',' + y1 + ' ' + (x + r) + ',' + y1 + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y1 + ' ' + (x + w) + ',' + (y1 - r) + 'V' + y0 + 'Z';
}

/* ---------- tabel data ---------- */
const cRp = (v) => ({ t: (Math.round(v) < 0 ? '−' : '') + fInt(Math.abs(v)), neg: Math.round(v) < 0 });
const bariT = (cells, strong) => ({ cells, strong });
/* o.kartu: di kolom sempit (kelas le-N dari LEBAR.tkartu) tiap baris berubah menjadi kartu; judul kolom ikut lewat data-label
   dan peran ARIA ditulis eksplisit supaya pembaca layar tetap mengenali tabel walau tampilannya bukan tabel lagi */
function tabel(head, rows, o = {}) {
  const k = !!o.kartu, peran = (r) => (k ? { role: r } : null);
  const nama = o.label || 'Tabel data';
  const sc = h('div', { class: 'scroll' + (o.tall ? ' tall' : ''), role: 'region', 'aria-label': nama },
    h('table', Object.assign({ class: 'dt' + (o.txt ? ' txt' : '') }, peran('table')),
      h('thead', peran('rowgroup'), h('tr', peran('row'), head.map((x) => h('th', Object.assign({ scope: 'col' }, peran('columnheader')), x)))),
      h('tbody', peran('rowgroup'), rows.map((r) => h('tr', Object.assign({ class: r.strong ? 'strong' : '' }, peran('row')),
        r.cells.map((c, i) => {
          if (i === 0) return h('th', Object.assign({ scope: 'row' }, peran('rowheader')), c);
          const obj = typeof c === 'object' && c, teks = obj ? c.t : c;
          return h('td', Object.assign({ class: ((obj && c.neg ? 'neg' : '') + (teks === '' ? ' kosong' : '')).trim() }, k ? { role: 'cell', 'data-label': head[i] } : null), teks);
        }))))));
  /* petunjuk geser hanya muncul bila tabel memang lebih lebar dari layarnya */
  const petunjuk = h('p', { class: 'small geser', hidden: true }, 'Geser tabel ke samping untuk melihat kolom lainnya.');
  const cek = () => {
    const lebar = sc.scrollWidth > sc.clientWidth + 2;
    petunjuk.hidden = !lebar;
    sc.setAttribute('aria-label', nama + (lebar ? ' (dapat digeser)' : ''));
    /* tabel yang bisa digeser harus bisa difokuskan agar pengguna papan ketik dapat menggulirnya */
    if (lebar || sc.scrollHeight > sc.clientHeight + 2) sc.setAttribute('tabindex', '0'); else sc.removeAttribute('tabindex');
  };
  if (typeof ResizeObserver === 'function') new ResizeObserver(cek).observe(sc);
  requestAnimationFrame(cek);
  return h('div', { class: 'tw' + (k ? ' tkartu' : '') }, sc, petunjuk);
}
const legenda = (items) => h('div', { class: 'legend' }, items.map((i) => h('span', null, h('i', { class: i.sq ? 'sq' : '', style: 'background:' + i.warna }), i.label)));

/* kartu: judul, tombol Grafik/Tabel, isi */
function chartCard(o) {
  const body = h('div', { class: 'chart' });
  const tbl = h('div', { hidden: true });
  const bG = h('button', { type: 'button', 'aria-pressed': 'true' }, 'Grafik');
  const bT = h('button', { type: 'button', 'aria-pressed': 'false' }, 'Tabel');
  const mode = (t) => {
    body.hidden = t; tbl.hidden = !t;
    if (t && !tbl.firstChild) tbl.append(o.tabel());
    bG.setAttribute('aria-pressed', String(!t)); bT.setAttribute('aria-pressed', String(t));
  };
  bG.onclick = () => mode(false);
  bT.onclick = () => mode(true);
  gambar(body, o.buat);
  return h('div', { class: 'cc' },
    h('div', { class: 'cc-head' }, h('div', null, h('h3', { class: 'h3' }, o.judul), o.sub ? h('p', { class: 'small' }, o.sub) : null),
      h('div', { class: 'seg', role: 'group', 'aria-label': 'Tampilan ' + o.judul }, bG, bT)),
    body, o.legenda || null, tbl);
}

/* ---------- grafik titik impas ---------- */
/* buatBEP, buatLaba, dan buatKas murni menghasilkan { svg, geo } dari data dan lebar; dipakai layar dan laporan cetak */
function buatBEP(B, w) {
  const xmax = Math.max(B.layak ? B.bepUnit * 1.8 : 0, B.targetUnit * 1.15, 10);
  const rev = (x) => x * B.avgPrice, biaya = (x) => B.fc + x * B.avgVar;
  const jml = 48, xv = Array.from({ length: jml + 1 }, (_, i) => (xmax * i) / jml);
  const ymax = Math.max(rev(xmax), biaya(xmax), 1);
  const H = w < 480 ? 250 : 320, g = { l: 62, r: w - 14, t: 16, b: H - 46 };
  const sempit = w < 480, sy = skala(0, ymax, 5), sx = skala(0, xmax, sempit ? 5 : 6);
  const svg = sv('svg', { viewBox: '0 0 ' + w + ' ' + H, width: w, height: H });
  const X = (v) => g.l + (v / xmax) * (g.r - g.l);
  const Y = sumbuY(svg, g, sy, fAx);
  sx.ticks.filter((v) => v <= xmax).forEach((v) => svg.append(sv('text', { x: X(v), y: g.b + 18, 'text-anchor': 'middle' }, fInt(v))));
  svg.append(sv('text', { x: (g.l + g.r) / 2, y: H - 6, 'text-anchor': 'middle' }, 'Unit terjual per bulan'));
  const bx = B.layak ? X(B.bepUnit) : null, zona = [];
  const tx = X(B.targetUnit), adaTarget = B.targetUnit > 0 && tx < g.r;
  /* letak label zona di wilayah [a, b]: bila garis target melintasi wilayah itu, pakai sisi yang lebih lega agar label tidak tertimpa garis */
  const tempat = (a, b) => {
    if (adaTarget && tx > a && tx < b) { if (tx - a >= b - tx) b = tx - 6; else a = tx + 6; }
    return b - a > 84 ? (a + b) / 2 : null;
  };
  if (bx != null) {
    /* warna zona digambar paling akhir (di atas garis dan label): halo label berwarna kertas jadi ikut tersapu warna zona dan tidak tampak sebagai bercak terang */
    zona.push(sv('rect', { class: 'zona', x: g.l, y: g.t, width: bx - g.l, height: g.b - g.t, fill: 'var(--neg)', 'fill-opacity': 0.07, 'pointer-events': 'none' }),
      sv('rect', { class: 'zona', x: bx, y: g.t, width: g.r - bx, height: g.b - g.t, fill: 'var(--pos)', 'fill-opacity': 0.07, 'pointer-events': 'none' }));
    const xr = tempat(g.l, bx), xu = tempat(bx, g.r);
    if (xr != null) svg.append(sv('text', { x: xr, y: g.t + 14, class: 'lab zona', 'text-anchor': 'middle' }, 'Zona rugi'));
    if (xu != null) svg.append(sv('text', { x: xu, y: g.t + 14, class: 'lab zona', 'text-anchor': 'middle' }, 'Zona untung'));
  }
  if (adaTarget) {
    svg.append(sv('line', { class: 'zona', x1: tx, x2: tx, y1: g.t, y2: g.b, stroke: 'var(--ink-3)', 'stroke-width': 1 }));
    svg.append(halo(tx - 6, g.b - 8, 'Target ' + fInt(B.targetUnit), 'end', 'lab zona'));
  }
  /* tiga garis tergambar berurutan dari kiri; pathLength=1 menyamakan panjang semua garis agar animasinya seragam */
  const garisS = (f, warna, k) => sv('path', { class: 'seri ' + k, pathLength: 1, d: jalur(xv.map((x) => [X(x), Y(f(x))])), fill: 'none', stroke: warna, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
  svg.append(garisS(() => B.fc, 'var(--s3)', 'd0'), garisS(biaya, 'var(--s2)', 'd1'), garisS(rev, 'var(--s1)', 'd2'));
  /* label langsung pada garis hanya bila lebar cukup; di layar sempit keterangannya ada di legenda */
  if (!sempit) svg.append(halo(g.r - 4, Y(rev(xmax)) - 9, 'Pendapatan', 'end', 'lab penanda'), halo(g.r - 4, Y(biaya(xmax)) + 16, 'Total biaya', 'end', 'lab penanda'), halo(g.l + 6, Y(B.fc) + 16, 'Biaya tetap', 'start', 'lab penanda'));
  if (bx != null) {
    const by = Y(rev(B.bepUnit)), kiri = bx - g.l > 100;
    /* titik impas muncul tepat saat garis pendapatan yang sedang tergambar bertemu garis biaya (garis ini mulai 400 md, lama 2400 md) */
    const tunda = 400 + 2400 * waktuPada(B.bepUnit / xmax);
    svg.append(
      jeda(sv('circle', { class: 'cincin', cx: bx, cy: by, r: 4.5, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.5 }), tunda),
      jeda(kls(titik(bx, by, 'var(--ink)'), 'penanda'), tunda),
      jeda(halo(kiri ? bx - 10 : bx + 10, kiri ? by - 12 : by + 24, 'BEP ' + fInt(B.bepUnit) + ' unit', kiri ? 'end' : 'start', 'lab penanda'), tunda));
  }
  svg.append(...zona);
  return {
    svg,
    geo: {
      l: g.l, r: g.r, t: g.t, b: g.b, xs: xv.map(X),
      aria: 'Grafik titik impas. Impas di ' + (B.layak ? fInt(B.bepUnit) + ' unit per bulan' : 'tidak ada') + '. Gunakan panah kiri dan kanan untuk membaca nilai.',
      tanda: (i) => [titik(X(xv[i]), Y(rev(xv[i])), 'var(--s1)'), titik(X(xv[i]), Y(biaya(xv[i])), 'var(--s2)')],
      tip: (i) => {
        const x = xv[i], lb = rev(x) - biaya(x);
        return { head: fInt(x) + ' unit per bulan', rows: [
          { warna: 'var(--s1)', label: 'Pendapatan', nilai: fRp(rev(x)) },
          { warna: 'var(--s2)', label: 'Total biaya', nilai: fRp(biaya(x)) },
          { warna: 'var(--s3)', label: 'Biaya tetap', nilai: fRp(B.fc) },
          { warna: 'var(--ink-3)', label: lb >= 0 ? 'Laba' : 'Rugi', nilai: fRp(lb) }] };
      },
    },
  };
}
const LEGENDA_BEP = [{ warna: 'var(--s1)', label: 'Pendapatan' }, { warna: 'var(--s2)', label: 'Total biaya (tetap + variabel)' }, { warna: 'var(--s3)', label: 'Biaya tetap + penyusutan' }];
function tabelDataBEP(B) {
  const rev = (x) => x * B.avgPrice, biaya = (x) => B.fc + x * B.avgVar;
  const xs = [0, B.layak ? B.bepUnit * 0.5 : null, B.layak ? B.bepUnit : null, B.targetUnit * 0.75, B.targetUnit, B.targetUnit * 1.25].filter((v) => v != null).sort((a, b) => a - b);
  return tabel(['Unit per bulan', 'Pendapatan', 'Total biaya', 'Laba / rugi'], xs.map((x) => bariT([fInt(x) + (B.layak && Math.abs(x - B.bepUnit) < 1e-6 ? ' (BEP)' : Math.abs(x - B.targetUnit) < 1e-6 ? ' (target)' : ''), cRp(rev(x)), cRp(biaya(x)), cRp(rev(x) - biaya(x))], B.layak && Math.abs(x - B.bepUnit) < 1e-6)), { label: 'Data grafik titik impas' });
}
function chartBEP(B) {
  return chartCard({
    judul: 'Titik impas (BEP)', sub: 'Pendapatan menyalip total biaya di titik impas. Bauran produk dianggap tetap seperti target.', buat: (w) => buatBEP(B, w),
    legenda: legenda(LEGENDA_BEP), tabel: () => tabelDataBEP(B),
  });
}

/* ---------- grafik laba bersih per bulan ---------- */
function buatLaba(A, w) {
  const rows = A.rows, N = rows.length;
  const nets = rows.map((r) => r.net);
  const sy = skala(Math.min(0, ...nets), Math.max(0, ...nets), 5);
  const H = w < 480 ? 250 : 300, g = { l: 62, r: w - 10, t: 26, b: H - 44 };
  const svg = sv('svg', { viewBox: '0 0 ' + w + ' ' + H, width: w, height: H });
  const Y = sumbuY(svg, g, sy, fAx), band = (g.r - g.l) / N, xs = rows.map((_, i) => g.l + band * (i + 0.5));
  const lang = langkahLabel(band);
  rows.forEach((r, i) => { if (lang === 1 || r.m % lang === 0 || (r.m === 1 && (lang - 1) * band >= 26)) svg.append(sv('text', { x: xs[i], y: g.b + 18, 'text-anchor': 'middle' }, r.m)); });
  svg.append(sv('text', { x: (g.l + g.r) / 2, y: H - 6, 'text-anchor': 'middle' }, 'Bulan ke-'));
  const bw = Math.max(2, Math.min(24, band - 2)), y0 = Y(0);
  /* batang tumbuh dari garis nol satu per satu; untuk periode panjang jeda antarbatang dirapatkan agar seluruhnya selesai dalam ~3 detik */
  const rapat = N > 40 ? 40 / N : 1;
  rows.forEach((r, i) => {
    const b = sv('path', { class: 'batang' + (r.net < 0 ? ' neg' : ''), d: batang(xs[i] - bw / 2, bw, y0, Y(r.net), 4), fill: r.net >= 0 ? 'var(--pos)' : 'var(--neg)' });
    b.style.setProperty('--i', (i * rapat).toFixed(2)); /* lewat CSSOM, bukan atribut style, agar aman di bawah CSP yang ketat */
    svg.append(b);
  });
  const u = rows.findIndex((r) => r.net > 0);
  if (u >= 0) {
    const kanan = xs[u] > g.l + (g.r - g.l) * 0.62, tunda = u * rapat * 30 + 1100;
    svg.append(jeda(sv('line', { class: 'penanda', x1: xs[u], x2: xs[u], y1: g.t - 8, y2: Y(rows[u].net) - 5, stroke: 'var(--ink-3)', 'stroke-width': 1 }), tunda),
      jeda(sv('text', { x: xs[u] + (kanan ? -5 : 5), y: g.t - 11, class: 'lab penanda', 'text-anchor': kanan ? 'end' : 'start' }, 'Mulai untung: bulan ke-' + rows[u].m), tunda));
  }
  return {
    svg,
    geo: {
      l: g.l, r: g.r, t: g.t, b: g.b, xs, tanpaGaris: true,
      aria: 'Grafik laba bersih per bulan selama ' + N + ' bulan. Gunakan panah kiri dan kanan untuk membaca tiap bulan.',
      tanda: (i) => [sv('rect', { x: xs[i] - band / 2, y: g.t, width: band, height: g.b - g.t, fill: 'var(--ink)', opacity: 0.08 })],
      tip: (i) => ({ head: 'Bulan ke-' + rows[i].m + ' · ' + rows[i].label, rows: [
        { warna: 'var(--ink-3)', label: 'Penjualan', nilai: fInt(rows[i].units) + ' unit' },
        { warna: 'var(--s1)', label: 'Pendapatan', nilai: fRp(rows[i].rev) },
        { warna: rows[i].net >= 0 ? 'var(--pos)' : 'var(--neg)', label: rows[i].net >= 0 ? 'Laba bersih' : 'Rugi bersih', nilai: fRp(rows[i].net) }] }),
    },
  };
}
function chartLaba(A) {
  const rows = A.rows;
  return chartCard({
    judul: 'Laba bersih tiap bulan', sub: 'Batang biru di atas garis nol berarti untung, batang merah di bawahnya berarti rugi.', buat: (w) => buatLaba(A, w),
    legenda: legenda([{ warna: 'var(--pos)', label: 'Untung', sq: true }, { warna: 'var(--neg)', label: 'Rugi', sq: true }]),
    tabel: () => tabel(['Bulan', 'Pendapatan', 'Laba operasional', 'Pajak', 'Laba bersih'], rows.map((r) => bariT([r.m + ' · ' + r.label, cRp(r.rev), cRp(r.ebit), cRp(r.pajak), cRp(r.net)])), { tall: true, label: 'Data laba bersih per bulan' }),
  });
}

/* ---------- grafik arus kas kumulatif dan balik modal ---------- */
/* garis dipotong tepat di titik nol: bagian di bawah nol berwarna merah, di atasnya biru (tanpa clipPath, agar aman di mana pun SVG ditempatkan) */
function potongNol(pts, y0) {
  const sisi = (p) => (Math.abs(p[1] - y0) < 0.01 ? 0 : p[1] < y0 ? 1 : -1); /* 1 = di atas garis nol (sudah untung) */
  const runs = [];
  let cur = null;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], s = sisi(p);
    if (!cur) { cur = { neg: s < 0, pts: [p] }; runs.push(cur); continue; }
    if (s === 0 || (s < 0) === cur.neg) { cur.pts.push(p); continue; }
    const q = pts[i - 1];
    if (sisi(q) === 0) { cur = { neg: s < 0, pts: [q, p] }; runs.push(cur); continue; }
    const f = (y0 - q[1]) / (p[1] - q[1]);
    const c = [q[0] + (p[0] - q[0]) * f, y0];
    cur.pts.push(c);
    cur = { neg: s < 0, pts: [c, p] };
    runs.push(cur);
  }
  return runs;
}
function buatKas(A, w) {
  const rows = A.rows, N = rows.length, I0 = A.m.modalAwal, pb = A.m.payback;
  const cum = [-I0].concat(rows.map((r) => r.cum));
  const sy = skala(Math.min(0, ...cum), Math.max(0, ...cum), 5);
  const H = w < 480 ? 260 : 320, g = { l: 66, r: w - 18, t: 18, b: H - 44 };
  const svg = sv('svg', { viewBox: '0 0 ' + w + ' ' + H, width: w, height: H });
  const Y = sumbuY(svg, g, sy, fAx), X = (m) => g.l + (m / N) * (g.r - g.l), y0 = Y(0);
  const lang = langkahLabel((g.r - g.l) / N);
  for (let m = 0; m <= N; m += lang) svg.append(sv('text', { x: X(m), y: g.b + 18, 'text-anchor': 'middle' }, m));
  svg.append(sv('text', { x: (g.l + g.r) / 2, y: H - 6, 'text-anchor': 'middle' }, 'Bulan ke-'));
  const pts = cum.map((v, m) => [X(m), Y(v)]);
  /* seluruh garis dan bidangnya dalam satu kelompok yang tersingkap dari kiri ke kanan (animasi "sapu") */
  const kel = sv('g', { class: 'sapu' });
  potongNol(pts, y0).forEach((r) => {
    if (r.pts.length < 2) return;
    const warna = r.neg ? 'var(--neg)' : 'var(--pos)', a = r.pts[0], z = r.pts[r.pts.length - 1];
    kel.append(sv('path', { d: jalur(r.pts) + 'L' + z[0].toFixed(1) + ',' + y0.toFixed(1) + 'L' + a[0].toFixed(1) + ',' + y0.toFixed(1) + 'Z', fill: warna, 'fill-opacity': 0.1 }),
      sv('path', { d: jalur(r.pts), fill: 'none', stroke: warna, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
  });
  svg.append(kel);
  svg.append(jeda(halo(g.l + 8, Math.min(g.b - 6, pts[0][1] - 10), fRpC(-I0) + ' (modal awal)', 'start', 'lab penanda'), 500));
  const akhir = pts[N];
  svg.append(jeda(kls(titik(akhir[0], akhir[1], cum[N] >= 0 ? 'var(--pos)' : 'var(--neg)'), 'penanda'), 2700), jeda(halo(akhir[0] - 8, akhir[1] - 12, fRpC(cum[N]), 'end', 'lab penanda'), 2700));
  if (pb && pb.tepat > 0) {
    const px = X(pb.tepat), kiri = px - g.l > 170, sempit = w < 480;
    /* titik balik modal muncul saat sapuan (2600 md) melewatinya */
    const tunda = 2600 * waktuPada((px - g.l) / (g.r - g.l));
    svg.append(jeda(sv('circle', { class: 'cincin', cx: px, cy: y0, r: 4.5, fill: 'none', stroke: 'var(--ink)', 'stroke-width': 1.5 }), tunda), jeda(kls(titik(px, y0, 'var(--ink)'), 'penanda'), tunda));
    const lb = (x, y, t, a) => jeda(halo(x, y, t, a, 'lab penanda'), tunda);
    if (kiri) svg.append(lb(px - 10, y0 - 12, 'Balik modal: bulan ke-' + pb.bulan, 'end'));
    else if (sempit && px - g.l > 80) svg.append(lb(px - 10, y0 - 26, 'Balik modal', 'end'), lb(px - 10, y0 - 12, 'bulan ke-' + pb.bulan, 'end'));
    else svg.append(lb(px + 10, y0 + 20, 'Balik modal: bulan ke-' + pb.bulan, 'start'));
  }
  return {
    svg,
    geo: {
      l: g.l, r: g.r, t: g.t, b: g.b, xs: pts.map((p) => p[0]),
      aria: 'Grafik arus kas kumulatif. ' + (pb ? 'Modal kembali di bulan ke-' + pb.bulan + '.' : 'Modal belum kembali.') + ' Gunakan panah kiri dan kanan untuk membaca tiap bulan.',
      tanda: (i) => [titik(pts[i][0], pts[i][1], cum[i] >= 0 ? 'var(--pos)' : 'var(--neg)')],
      tip: (i) => (i === 0
        ? { head: 'Sebelum buka', rows: [{ warna: 'var(--neg)', label: 'Modal awal', nilai: fRp(-I0) }] }
        : { head: 'Bulan ke-' + i + ' · ' + rows[i - 1].label, rows: [
          { warna: 'var(--s1)', label: 'Arus kas bulan ini', nilai: fRp(rows[i - 1].cf) },
          { warna: cum[i] >= 0 ? 'var(--pos)' : 'var(--neg)', label: 'Kumulatif', nilai: fRp(cum[i]) }] }),
    },
  };
}
function chartKas(A) {
  const rows = A.rows, I0 = A.m.modalAwal;
  return chartCard({
    judul: 'Arus kas kumulatif', sub: 'Garis merah berarti modal belum kembali. Saat garis memotong nol dan berubah biru, modal sudah balik.', buat: (w) => buatKas(A, w),
    legenda: legenda([{ warna: 'var(--neg)', label: 'Modal belum kembali' }, { warna: 'var(--pos)', label: 'Modal sudah kembali' }]),
    tabel: () => tabel(['Bulan', 'Arus kas bulan ini', 'Kumulatif'], [bariT(['0 · sebelum buka', cRp(-I0), cRp(-I0)])].concat(rows.map((r) => bariT([r.m + ' · ' + r.label, cRp(r.cf), cRp(r.cum)]))), { tall: true, label: 'Data arus kas kumulatif' }),
  });
}

/* ---------- sparkline kecil ---------- */
function sparkline(vals, o = {}) {
  const wrap = h('div', { class: 'chart' });
  responsive(wrap, (w) => {
    wrap.replaceChildren();
    const H = 76, l = 8, r = 52, t = 12, b = 20, n = vals.length;
    const mx = Math.max(1, ...vals, o.base || 0) * 1.08;
    const X = (i) => l + (i * (w - l - r)) / Math.max(1, n - 1), Y = (v) => H - b - (v / mx) * (H - b - t);
    const svg = sv('svg', { viewBox: '0 0 ' + w + ' ' + H, width: w, height: H, role: 'img', 'aria-label': 'Pratinjau pertumbuhan penjualan, akhir ' + o.fmt(vals[n - 1]) });
    if (o.base) svg.append(sv('line', { x1: l, x2: w - r, y1: Y(o.base), y2: Y(o.base), stroke: 'var(--line-2)', 'stroke-width': 1 }), sv('text', { x: w - r + 6, y: Y(o.base) + 4 }, 'target'));
    svg.append(sv('path', { d: jalur(vals.map((v, i) => [X(i), Y(v)])), fill: 'none', stroke: 'var(--s1)', 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }),
      titik(X(n - 1), Y(vals[n - 1]), 'var(--s1)'),
      sv('text', { x: X(n - 1) + 8, y: Y(vals[n - 1]) + (Math.abs(Y(vals[n - 1]) - Y(o.base || 0)) < 12 ? -10 : 4), class: 'lab' }, o.fmt(vals[n - 1])),
      sv('text', { x: l, y: H - 4 }, 'Bln 1'), sv('text', { x: X(n - 1), y: H - 4, 'text-anchor': 'middle' }, 'Bln ' + n));
    wrap.append(svg);
  });
  return wrap;
}
