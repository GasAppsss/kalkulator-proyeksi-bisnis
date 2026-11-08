/* ===== start: layar awal (hitung cepat, contoh usaha, lanjutkan, buka berkas) ===== */
const adaDataPenting = () => !!(App.adaData && App.s && !App.s.contoh);
/* bila ada data milik pengguna yang akan tertimpa, minta satu klik konfirmasi lagi (selain itu, ada tombol Urungkan) */
function aksiGanti(btn, aksi) {
  if (adaDataPenting()) return duaKlik(btn, 'Ganti data tersimpan? Klik lagi', aksi);
  btn.addEventListener('click', aksi);
  return btn;
}

function hasilCepat(r) {
  const q = App.q;
  if (!r.siap) return [h('p', { class: 'small' }, 'Isi harga jual dan target penjualan per bulan, hasilnya muncul di sini.')];
  if (!r.layak) {
    return [h('p', { class: 'verdict' }, 'Belum bisa impas.'),
      h('p', { class: 'note-bad' }, 'Harga jual ' + fRp(q.harga) + ' tidak lebih besar dari HPP ditambah biaya penjualan, jadi tiap penjualan tidak menyisakan margin. Naikkan harga atau turunkan HPP.')];
  }
  const lv = r.A.sehat.find((x) => x.id === 'bep');
  const t = teksSehat(lv, r.A);
  return [
    h('p', { class: 'verdict' }, 'Impas di ', h('em', null, h('span', { class: 'nw' }, fInt(r.bepUnit) + ' unit'), ' per bulan'), ' (', h('span', { class: 'nw' }, 'omzet ' + fRpC(r.bepRp)), ').'),
    h('div', { class: 'tiles' },
      tile('Jarak aman', r.mos != null ? fPct(r.mos, 0) : '-', 'Penjualan boleh turun sejauh ini dari target sebelum rugi.'),
      tile('Laba per bulan', fRpC(r.laba), 'Bila target ' + fInt(q.volume) + ' unit tercapai, sebelum pajak.'),
      tile('Balik modal', r.payback ? (r.payback.bulan > 0 ? lama(r.payback.bulan) : 'Langsung') : 'Belum', r.payback ? (r.payback.bulan > 0 ? 'sekitar bulan ke-' + r.payback.bulan : 'Tidak ada modal awal') : 'Dalam 36 bulan')),
    h('div', { class: 'lv-' + lv.level + ' cepat-nilai' }, chip(lv.level), h('span', { class: 'small' }, t[0] + '. ' + t[1])),
  ];
}

function lanjutCepat(langkah) {
  const s = KPB.dariCepat(App.q);
  s.contoh = App.qContoh;
  emit('cepat_dilanjutkan');
  gantiData(s, 'Angka Anda sudah dibawa ke perhitungan lengkap. Rinci tiap bagian di langkah 1 sampai 4.', { langkah: langkah || 0 });
}

function kartuCepat() {
  const q = App.q;
  const hasil = h('div', { class: 'cepat-hasil', 'aria-live': 'polite' });
  const penanda = h('p', { class: 'small cepat-contoh', hidden: !App.qContoh }, 'Angka di bawah hanya contoh. Ganti dengan angka usaha Anda.');
  const segarkan = () => hasil.replaceChildren(...hasilCepat(KPB.hitungCepat(q)));
  const hitung = () => {
    if (App.qContoh) { App.qContoh = false; penanda.hidden = true; }
    simpanCepat();
    segarkan();
    emitSekali('cepat_dihitung');
  };
  segarkan();
  const aksi = h('div', { class: 'cepat-aksi' },
    aksiGanti(h('button', { type: 'button', class: 'btn pri' }, 'Lanjut ke perhitungan lengkap'), () => lanjutCepat(0)),
    aksiGanti(h('button', { type: 'button', class: 'btn' }, 'Langsung ke hasil lengkap'), () => lanjutCepat(4)));
  return h('section', { class: 'kartu utama', 'aria-labelledby': pref('judul-cepat') },
    h('h2', { class: 'h2', id: 'judul-cepat' }, 'Hitung cepat'),
    h('p', { class: 'lede' }, 'Tujuh angka cukup untuk tahu titik impas (BEP), laba per bulan, dan kapan modal kembali. Hasilnya dipakai lagi bila Anda lanjut ke perhitungan lengkap.'),
    penanda,
    h('div', { class: 'grid2' },
      fld('Nama produk atau usaha', inText(q, 'nama', 'q-nama', { ph: 'Contoh: Es kopi susu botol', onChg: hitung })),
      fld('Harga jual per unit', inRp(q, 'harga', 'q-harga', null, hitung), { pre: 'Rp', hint: 'Harga yang dibayar pelanggan untuk 1 unit.' }),
      fld('HPP per unit', inRp(q, 'hpp', 'q-hpp', null, hitung), { pre: 'Rp', hint: 'Biaya bahan dan produksi untuk membuat 1 unit.' }),
      fld('Biaya penjualan', inNum(q, 'feePersen', 'q-fee', { dec: 2, min: 0, max: 100, onChg: hitung }), { suf: '% dari harga', hint: 'Komisi marketplace atau QRIS. Isi 0 bila tidak ada.' }),
      fld('Biaya tetap per bulan', inRp(q, 'tetap', 'q-tetap', null, hitung), { pre: 'Rp', hint: 'Gaji, sewa, listrik, iklan. Jangan lupa gaji Anda sendiri.' }),
      fld('Modal awal', inRp(q, 'modal', 'q-modal', null, hitung), { pre: 'Rp', hint: 'Total investasi dan modal kerja.' }),
      fld('Target penjualan per bulan', inNum(q, 'volume', 'q-volume', { dec: 0, min: 0, onChg: hitung }), { suf: 'unit', hint: 'Jumlah unit yang realistis terjual tiap bulan.' })),
    h('div', { class: 'cepat-box' }, h('h3', { class: 'h3' }, 'Hasil'), hasil),
    aksi);
}

function muatTemplate(t) {
  const s = t.bangun();
  s.contoh = true;
  emit('contoh_dimuat', { id: t.id });
  gantiData(s, 'Contoh "' + t.nama + '" dimuat. Ganti angkanya dengan angka usaha Anda.', { langkah: 0 });
}

function kartuContoh() {
  return h('section', { class: 'kartu', 'aria-labelledby': pref('judul-contoh') },
    h('h2', { class: 'h3', id: 'judul-contoh' }, 'Pakai contoh usaha'),
    h('p', { class: 'small' }, 'Angka sudah terisi supaya Anda langsung melihat cara kerjanya. Hanya gambaran, bukan data pasar; ganti dengan angka usaha Anda.'),
    h('div', { class: 'tpl-grid' }, KPB.TEMPLATE.map((t) => aksiGanti(h('button', { type: 'button', class: 'tpl' }, h('b', null, t.nama), h('span', { class: 'small' }, t.ket)), () => muatTemplate(t)))));
}

function kartuLanjut() {
  if (!App.adaData || !App.s) return null;
  return h('section', { class: 'kartu lanjut', 'aria-labelledby': pref('judul-lanjut') },
    h('h2', { class: 'h3', id: 'judul-lanjut' }, 'Lanjutkan pekerjaan Anda'),
    h('p', { class: 'small' }, h('b', null, App.s.nama || 'Usaha tanpa nama'), App.tersimpan ? ' · tersimpan ' + fTanggal(App.tersimpan) : ''),
    h('div', { class: 'btnrow' }, h('button', { type: 'button', class: 'btn pri', onclick: () => goStep(App.step || 0) }, 'Lanjutkan dari langkah ' + ((App.step || 0) + 1))));
}

function kartuLain() {
  const fileIn = h('input', { type: 'file', id: 'f-impor-mulai', accept: '.json,application/json', hidden: true, 'aria-label': 'Pilih berkas data .json', onchange: (e) => { bukaJson(e.target.files[0]); e.target.value = ''; } });
  return h('section', { class: 'kartu', 'aria-labelledby': pref('judul-lain') },
    h('h2', { class: 'h3', id: 'judul-lain' }, 'Atau mulai dari awal'),
    h('p', { class: 'small' }, 'Isi semuanya sendiri langkah demi langkah, atau buka berkas cadangan (.json) yang pernah Anda simpan.'),
    h('div', { class: 'btnrow' },
      aksiGanti(h('button', { type: 'button', class: 'btn' }, 'Mulai dari kosong'), () => { emit('mulai_kosong'); gantiData(KPB.kosongState(), 'Siap diisi dengan data usaha Anda.', { langkah: 0 }); }),
      h('button', { type: 'button', class: 'btn', onclick: () => fileIn.click() }, 'Buka berkas data (.json)'), fileIn));
}

function buildMulai() {
  return h('div', { class: 'mulai' },
    h('div', { class: 'intro' },
      h('h2', { class: 'intro-judul' }, 'Hitung HPP, titik impas, dan balik modal usaha Anda'),
      h('p', { class: 'lede' }, 'Dari harga pokok per produk sampai laba rugi dan kapan modal kembali, dalam bahasa yang mudah dipahami. Gratis, tanpa daftar, dan angka Anda tidak dikirim ke mana pun.')),
    h('div', { class: 'mulai-grid' },
      kartuCepat(),
      h('div', { class: 'mulai-samping' }, kartuLanjut(), kartuContoh(), kartuLain())));
}

function renderMulai() {
  App.outs = []; App.liveEl = null; App.refresh = null;
  const v = $('view');
  if (!v) return;
  try { v.replaceChildren(buildMulai()); } catch (e) { tampilGalat(v, e); }
  segarkanKerangka();
}
