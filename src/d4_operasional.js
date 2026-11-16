(function () {
'use strict';
/* ===== Panduan Event (dinamis) & Pendaftaran Manual — Super Admin ===== */
const { $, $$, E, S, V, ACT, SUBMIT, INP, G_L, FASE, FASE_L, rp, toast, busy, ph, card, kpi, alertx, field, inp, sel, form, go, xlsx, loadScript, bustCache, evTitle, jn } = KRP;
const main = h => { $('#main').innerHTML = h; };
const fi = f => FASE.indexOf(f || 'PENDAFTARAN');

/* ---------- Panduan ---------- */
function langkah(P, jalur) {
  const f = fi(P.fase), en = P.entri, persen = (a, b) => b ? Math.round(a / b * 100) : 0;
  const L = [];
  const add = (grup, judul, st, info, todo, menu, tips) => L.push({ grup, judul, st, info, todo, menu, tips });
  add('Persiapan', 'Buat & aktifkan event', P.identitas.nama && P.identitas.tanggal && P.identitas.lokasi ? 'ok' : 'todo', `Musim ${E(P.musim)}${P.identitas.kontak ? '' : ' · kontak panitia belum diisi'}${P.identitas.rekening ? '' : ' · rekening belum diisi'}`,
    ['Di Event & Nomor Lomba: isi nama, tingkat, tanggal, tempat, kolam, jendela pendaftaran, kuota, biaya (paket/per nomor), dan jumlah nomor per atlet.', 'Pilih kelompok peserta (huruf A–F ↔ kelas), rekening, kontak, grup WhatsApp, dan ketentuan lengkap.', 'Aktifkan event: beranda, Info Lomba, dan akun peserta langsung beralih ke event ini.'], [['a-event', 'Event & Nomor Lomba'], ['info', 'Lihat Info Lomba']], 'Kode musim dipakai untuk arsip. Gunakan kode berbeda tiap event, misalnya “Seri 3 2027”.');
  add('Persiapan', 'Logo, kop & petugas', P.logo && P.petugas.op && P.petugas.ws ? 'ok' : (P.logo || P.petugas.op || P.petugas.ws ? 'run' : 'todo'), `${P.logo} logo · ${P.petugas.op} Admin Input Data · ${P.petugas.ws} Wasit · ${P.petugas.vf} Admin Pendaftaran`,
    ['Unggah logo dan tandai pemakaiannya (Buku Acara, Buku Hasil, Web).', 'Buat akun Admin Input Data (operator lapangan) dan Wasit Utama (pengesah hasil).', 'Bila perlu, buat Admin Pendaftaran untuk verifikasi berkas.'], [['a-dok', 'Dokumen & Logo'], ['a-usr', 'Pengguna']], 'Satu orang tidak sebaiknya merangkap operator dan wasit.');
  add('Persiapan', 'Nomor lomba & kelompok', P.nomor ? 'ok' : 'todo', `${P.nomor} nomor aktif`,
    ['Tab Nomor pertandingan: pakai Generator nomor (centang gaya × jarak per kelompok) atau tambah satu per satu.', 'Nomor yang Dibuka langsung tampil di akun peserta sesuai kelompok kelas & gender atlet; Tutup bila kuota penuh.', 'Atur kuota per nomor bila perlu; nomor dengan peserta di bawah minimal bisa Dibatalkan.'], [['a-event', 'Event & Nomor Lomba']]);
  add('Persiapan', 'Susunan acara & estimasi jam', P.nomor ? 'ok' : 'todo', `Mulai ${E(P.mulai)} · ${P.jadwalManual} nomor diatur manual`,
    ['Atur jam mulai, menit per seri tiap jarak, dan jeda antarnomor.', 'Urutan, hari, dan jam bisa diubah manual per nomor; sisanya dihitung otomatis.', 'Estimasi ikut berubah mengikuti jumlah peserta dan seri setelah start list tersusun.'], [['a-jadwal', 'Jadwal Acara']], 'Estimasi jam tampil di web dan di Buku Acara.');
  if (jalur === 'online') {
    add('Pendaftaran', 'Buka pendaftaran online', en.total || f > 0 ? 'ok' : P.buka ? 'run' : 'todo', P.buka ? `Dibuka${P.dl ? ' hingga ' + E(P.dl) : ''} · ${en.total} entri masuk` : f > 0 ? 'Tahap pendaftaran sudah lewat' : 'Belum dibuka',
      ['Pendaftaran terbuka otomatis sesuai jendela waktu event; buka/tutup cepat lewat tombol status di Event & Nomor Lomba.', 'Bagikan tautan halaman Info Lomba ke sekolah/klub; mereka membuat akun sekali, lalu mendaftarkan atlet dan nomor.', 'Coba dulu alurnya dengan Akun demo (sekolah, klub, mandiri), lalu hapus akun demo.', 'Pantau Dashboard: nomor dengan peserta di bawah minimal ditandai dan bisa dihubungi.'], [['a-event', 'Event & Nomor Lomba'], ['a-dash', 'Dashboard']]);
    add('Pendaftaran', 'Verifikasi berkas & pembayaran', en.total && !en.pending && !en.revisi ? 'ok' : en.total ? 'run' : 'todo', `${en.verified}/${en.total} terverifikasi (${persen(en.verified, en.total)}%) · ${en.pending} menunggu · ${en.revisi} revisi`,
      ['Periksa foto, akte, surat sekolah, dan bukti bayar; setujui atau minta revisi.', 'Gunakan aksi massal untuk mempercepat.', 'Pengajuan perubahan data dari peserta diproses di menu Pengajuan.'], [['a-verif', 'Verifikasi'], ['a-png', 'Pengajuan']]);
    add('Pendaftaran', 'Tutup pendaftaran', f >= 1 ? 'ok' : 'todo', f >= 1 ? 'Pendaftaran sudah ditutup' : 'Masih tahap Pendaftaran',
      ['Buka Tahapan Event, lanjut ke tahap Verifikasi (opsional kirim email ke semua akun).'], [['a-fase', 'Tahapan Event']]);
  } else {
    add('Pendaftaran', 'Masukkan data pendaftar yang sudah ada', en.total ? 'ok' : 'todo', `${en.total} entri · ${en.manual} dari input manual · ${P.atlet} atlet`,
      ['Unduh templat, salin data pendaftar dari formulir/Excel lama, lalu unggah di Pendaftaran Manual.', 'Nomor lomba bisa ditulis sebagai nomor acara (mis. 105) atau nama (mis. “50m Gaya Bebas”).', 'Data langsung terverifikasi & lunas. Sekolah/klub otomatis menjadi akun (tanpa sandi) yang bisa diberi sandi kemudian.', 'Peserta susulan bisa ditambah satu per satu di halaman yang sama.'], [['a-manual', 'Pendaftaran Manual']], 'Periksa dulu sebelum menyimpan; baris bermasalah ditunjukkan beserta alasannya.');
    add('Pendaftaran', 'Tutup pendaftaran online', f >= 1 || !P.dibuka ? 'ok' : 'todo', f >= 1 ? 'Sudah lewat tahap pendaftaran' : P.dibuka ? 'Pendaftaran online masih dibuka' : 'Pendaftaran online tidak dibuka',
      ['Agar tidak ada pendaftar ganda dari web, lanjutkan Tahapan Event ke Verifikasi.'], [['a-fase', 'Tahapan Event']]);
  }
  add('Menjelang hari H', 'Susun start list (seri & lintasan)', P.seedNomor && f >= 2 ? 'ok' : P.seedNomor ? 'run' : 'todo', `${P.seedNomor}/${P.nomor} nomor sudah punya start list`,
    ['Di Tahapan Event, lanjut ke Start List: seri & lintasan disusun otomatis (spearhead) dari entry time.', 'Peserta tanpa catatan waktu (NT) ditempatkan di seri awal.', 'Bila ada perubahan peserta, susun ulang sebelum Buku Acara terbit.'], [['a-fase', 'Tahapan Event'], ['startlist', 'Lihat Start List']]);
  add('Menjelang hari H', 'Terbitkan Buku Acara', P.bukuAcara ? 'ok' : 'todo', P.bukuAcara ? 'Buku Acara terbit & bisa diunduh di web' : 'Belum terbit',
    ['Di Tahapan Event, lanjut ke Buku Acara: PDF dibuat lengkap dengan logo, estimasi jam per event & heat.', 'Buku Acara langsung tersedia di Beranda, Jadwal, dan akun peserta.', 'Buat ulang di Dokumen & Logo bila ada revisi; versi terbaru otomatis menggantikan.'], [['a-fase', 'Tahapan Event'], ['a-dok', 'Dokumen & Logo']]);
  add('Menjelang hari H', 'Siapkan petugas lapangan', P.petugas.op && P.petugas.ws ? 'ok' : 'todo', `${P.petugas.op} operator · ${P.petugas.ws} wasit`,
    ['Bagikan akun Admin Input Data dan Wasit; uji masuk di tablet/HP.', 'Wasit menandatangani di layar saat pengesahan; siapkan tablet dengan baterai penuh.', 'Atur jeda pembaruan Hasil Live (30–60 detik) bila penonton banyak.'], [['a-usr', 'Pengguna'], ['a-cfg', 'Pengaturan Web']]);
  add('Hari H', 'Mulai pelaksanaan & input hasil', f >= 4 && (P.sah + P.draf) >= P.seedNomor && P.seedNomor ? 'ok' : f >= 4 ? 'run' : 'todo', `${P.draf} nomor terisi menunggu sah · ${P.sah} nomor sah`,
    ['Di Tahapan Event, lanjut ke Pelaksanaan agar operator bisa mengisi hasil.', 'Operator mengisi waktu per seri (tersimpan otomatis sebagai draf), status DNS/DQ, lalu kirim ke wasit.', 'Hasil tampil di Hasil Live untuk penonton.'], [['a-fase', 'Tahapan Event'], ['a-hasil', 'Input Hasil'], ['live', 'Hasil Live']]);
  add('Hari H', 'Pengesahan wasit', P.seedNomor && P.sah >= P.seedNomor ? 'ok' : P.sah ? 'run' : 'todo', `${P.sah}/${P.seedNomor} nomor disahkan`,
    ['Wasit memeriksa hasil per nomor dan menandatangani di layar.', 'Rekor baru tercatat otomatis beserta nama event tempat rekor dicetak.', 'Bila ada koreksi, hasil bisa ditarik kembali dengan alasan.'], [['a-wasit', 'Pengesahan Wasit'], ['rekor', 'Rekor']]);
  add('Setelah lomba', 'Terbitkan Buku Hasil, SK & sertifikat', P.bukuHasil ? 'ok' : P.sah ? 'run' : 'todo', P.bukuHasil ? 'Buku Hasil terbit & bisa diunduh' : 'Belum terbit',
    ['Buat Buku Hasil di Dokumen & Logo; langsung tersedia di web, akun peserta, dan arsip.', 'Buat SK Pemenang bila diperlukan.', 'Peserta mengunduh sertifikat dari akunnya.'], [['a-dok', 'Dokumen & Logo']]);
  add('Setelah lomba', 'Laporan, Excel & kurasi', P.lpj || P.kurasi ? 'ok' : 'opt', 'Opsional',
    ['Unduh rekap & Excel (peserta, pemenang, rekap kelompok/nomor).', 'Susun berkas pengajuan kurasi Puspresnas bila ajang akan dikurasi.'], [['a-lap', 'Laporan & Excel'], ['a-kurasi', 'Kurasi Puspresnas']]);
  add('Setelah lomba', 'Tutup event & arsipkan', P.arsipStep >= 3 ? 'ok' : P.arsipStep ? 'run' : 'todo', `Tahap arsip ${P.arsipStep}/4`,
    ['Jalankan 4 tahap: kunci data, cadangan database, arsip & Hall of Fame (buku acara/hasil tetap bisa diunduh di Arsip), mulai musim baru.', 'Musim baru memakai akun, atlet, dan rekor yang sama; peserta cukup memilih nomor lagi.'], [['a-ars', 'Tutup Event & Arsip']], 'Semua nomor harus sudah disahkan sebelum tahap 1.');
  return L;
}
V['a-panduan'] = function () {
  S.pjalur = S.pjalur || 'online';
  rp('pan.status', {}).then(r => { if (S.route !== 'a-panduan') return; S.P = r.data; if (r.data.entri.manual && !S._pjset) S.pjalur = 'manual'; S._pjset = 1; drawPanduan(); }).catch(e => KRP.errView(e.message, () => go('a-panduan')));
};
function drawPanduan() {
  const P = S.P, L = langkah(P, S.pjalur), wajib = L.filter(x => x.st !== 'opt'), ok = wajib.filter(x => x.st === 'ok').length, pct = Math.round(ok / wajib.length * 100), next = L.find(x => x.st === 'todo' || x.st === 'run');
  const pill = { ok: '<span class="k-pill k-ok">Selesai</span>', run: '<span class="k-pill k-warn">Berjalan</span>', todo: '<span class="k-pill k-neu">Belum</span>', opt: '<span class="k-pill k-info">Opsional</span>' };
  let grp = '';
  main(`<div class="k-wrap pad">${ph('Panduan Event', `Langkah dari persiapan hingga arsip untuk musim <b>${E(P.musim)}</b>. Status dihitung langsung dari data.`, `<button class="k-btn k-outline" data-act="pj-refresh"><i class="bi bi-arrow-clockwise"></i> Perbarui status</button>`)}
<div class="k-seg pj-seg">${[['online', 'Pendaftaran online lewat web'], ['manual', 'Data pendaftar sudah ada (input manual)']].map(x => `<button class="${S.pjalur === x[0] ? 'on' : ''}" data-act="pj-jalur" data-v="${x[0]}">${x[1]}</button>`).join('')}</div>
<div class="k-card"><div class="k-card-b"><div class="kur-prog-top"><div><b class="pj-pct">${pct}%</b> <span class="mut">langkah selesai (${ok}/${wajib.length})</span></div><div class="pj-fase">${FASE.map((x, i) => `<span class="${i < fi(P.fase) ? 'done' : i === fi(P.fase) ? 'now' : ''}">${E(FASE_L[x] || x)}</span>`).join('<i class="bi bi-chevron-right"></i>')}</div></div><div class="k-prog"><i style="width:${pct}%"></i></div>${next ? `<p style="margin:10px 0 0">Langkah berikutnya: <b>${E(next.judul)}</b> ${next.menu.slice(0, 1).map(m => `<button class="k-btn sm k-orange" data-go="${m[0]}">${E(m[1])} <i class="bi bi-arrow-right"></i></button>`).join('')}</p>` : '<p style="margin:10px 0 0"><b>Semua langkah selesai.</b> 🎉</p>'}</div></div>
<div class="pj-list">${L.map((x, i) => `${x.grup !== grp ? `<h3 class="pj-grup">${E(grp = x.grup)}</h3>` : ''}<div class="pj-step ${x.st}"><div class="pj-no">${x.st === 'ok' ? '<i class="bi bi-check-lg"></i>' : i + 1}</div><div class="pj-body"><div class="pj-head"><b>${E(x.judul)}</b>${pill[x.st]}</div><small class="mut">${x.info}</small><ul>${x.todo.map(t => `<li>${E(t)}</li>`).join('')}</ul>${x.tips ? `<p class="pj-tip"><i class="bi bi-lightbulb"></i> ${E(x.tips)}</p>` : ''}<div class="k-bar" style="justify-content:flex-start">${x.menu.map((m, j) => `<button class="k-btn sm ${j ? 'k-outline' : 'k-navy'}" data-go="${m[0]}">${E(m[1])}</button>`).join('')}</div></div></div>`).join('')}</div>
${card('Data event yang sudah lewat', `<p class="mut sm">Hasil event sebelum memakai web ini dimasukkan lewat <b>Impor Hasil Lama</b>: satu berkas Excel bisa berisi banyak event (kolom musim, event, tanggal, lokasi). Setelah difinalkan, hasil tampil di Arsip dan rekor tercatat lengkap dengan nama event.</p><button class="k-btn sm k-navy" data-go="a-impor">Impor Hasil Lama</button>`)}</div>`);
}
ACT['pj-jalur'] = a => { S.pjalur = a.dataset.v; drawPanduan(); };
ACT['pj-refresh'] = a => { busy(a, true); go('a-panduan'); };

/* ---------- Pendaftaran manual ---------- */
const MAN_COLS = ['nama', 'gender', 'kelas', 'kelompok', 'sekolah', 'klub', 'kota', 'provinsi', 'nomor', 'entry', 'nisn', 'tgl_lahir', 'tempat_lahir', 'hp', 'pendaftar', 'hp_pendaftar'];
// Kenali judul kolom formulir (Google Form/Excel): 'Nama Lengkap Peserta', 'Nomor Lomba 1', 'Waktu Terbaik 1', 'Nama Guru/Pelatih/Orang Tua', dll.
function manKol(h) {
  const t = String(h || '').toLowerCase().replace(/[^a-z0-9/]+/g, ' ').trim(), has = w => t.indexOf(w) >= 0, ix = (t.match(/(?:^|[^0-9])([1-5])(?:[^0-9]|$)/) || [])[1] || '';
  if (!t || t === 'no' || t === 'no urut' || /^(timestamp|cap waktu|stempel waktu|email|alamat email|nomor urut|bukti|upload|unggah|scan)/.test(t)) return '';
  const pend = has('pendaftar') || has('guru') || has('pelatih') || has('orang tua') || has('ortu') || has('pendamping') || has('wali');
  if (/(^|[^a-z])(hp|wa|whatsapp|telepon|telp|handphone|ponsel)([^a-z]|$)/.test(t)) return pend ? 'hp_pendaftar' : 'hp';
  if (has('nisn')) return 'nisn'; if (has('tempat lahir')) return 'tempat_lahir'; if (has('tanggal lahir') || has('tgl lahir')) return 'tgl_lahir';
  if (has('waktu') || has('entry') || has('seed') || has('best') || has('catatan')) return 'entry' + (ix ? '_' + ix : '');
  if ((has('nomor') || has('lomba') || has('acara') || has('gaya')) && !has('urut')) return 'nomor' + (ix ? '_' + ix : '');
  if (has('nama') && pend) return 'pendaftar'; if (has('sekolah') || has('instansi')) return 'sekolah'; if (has('klub') || has('club') || has('perkumpulan')) return 'klub';
  if (has('kelamin') || has('gender') || t === 'jk' || t === 'l/p' || has('putra')) return 'gender'; if (has('kelompok') || has('kategori')) return 'kelompok'; if (has('kelas')) return 'kelas';
  if (has('provinsi')) return 'provinsi'; if (has('kota') || has('kab') || has('domisili') || has('wilayah')) return 'kota'; if (has('nama') || has('peserta') || has('atlet')) return 'nama';
  return '';
}
const KELAS = [['', '— pilih —'], ['0', 'TK']].concat(Array.from({ length: 12 }, (_, i) => [String(i + 1), (i < 6 ? 'SD' : i < 9 ? 'SMP' : 'SMA') + ' Kelas ' + (i + 1)]));
V['a-manual'] = function () {
  S.man = S.man || { rows: [], cek: null, opsi: { buatNomor: false, biaya: true, paksa: false } }; S.manOne = { g: 'PUTRA', kelas: '' };
  const B = S.B || {}, fase = (B.cfg || {}).fase || 'PENDAFTARAN', o = S.man.opsi;
  main(`<div class="k-wrap pad">${ph('Pendaftaran Manual', 'Masukkan pendaftar yang sudah terdaftar di luar web (formulir, Excel, WhatsApp) agar bisa lanjut ke start list, buku acara, input hasil, dan buku hasil.')}
${fi(fase) >= 4 ? alertx('warn', 'Pelaksanaan sudah dimulai. Pendaftar baru tidak masuk start list yang terkunci.', 'bi-exclamation-triangle') : alertx('info', 'Entri yang dimasukkan di sini langsung <b>terverifikasi & lunas</b>. Sekolah/klub baru otomatis menjadi akun tanpa sandi (bisa diberi sandi di Akun & Berkas). Atlet yang sudah ada tidak digandakan; nomor yang sama tidak didaftarkan dua kali.', 'bi-info-circle')}
<div class="g-main"><div>${card('1. Impor massal dari Excel/CSV', `<p class="mut sm">Unggah ekspor formulir pendaftaran (Google Form/Excel) apa adanya: judul kolom seperti <i>Nama Peserta, Jenis Kelamin, Kelas/Kelompok, Asal Sekolah, Nomor Lomba 1–3, Waktu Terbaik 1–3, Nama & HP Pendaftar</i> dikenali otomatis. Nomor boleh ditulis <b>no. acara</b> (mis. <span class="mono">12</span>) atau nama (<span class="mono">50m Gaya Bebas</span>) — kelompok diambil dari kelas atlet. Unduh templat untuk daftar no. acara event aktif.</p>
<div class="k-qa"><button class="k-btn k-outline" data-act="man-tpl"><i class="bi bi-download"></i> Unduh templat</button><label class="k-btn k-navy"><i class="bi bi-file-earmark-excel"></i> Unggah Excel/CSV<input type="file" hidden accept=".xlsx,.xls,.csv" data-chg="man-file"></label></div>
<textarea class="k-in mono" id="man-paste" rows="4" placeholder="Atau tempel dari Excel (baris pertama judul kolom)"></textarea>
<div class="man-opsi"><label class="k-check1"><input type="checkbox" data-chg="man-op" data-k="buatNomor" ${o.buatNomor ? 'checked' : ''}> Buat nomor lomba otomatis bila belum ada (untuk nomor yang ditulis dengan nama)</label><label class="k-check1"><input type="checkbox" data-chg="man-op" data-k="biaya" ${o.biaya ? 'checked' : ''}> Catat biaya pendaftaran sesuai nomor (untuk laporan keuangan)</label><label class="k-check1"><input type="checkbox" data-chg="man-op" data-k="paksa" ${o.paksa ? 'checked' : ''}> Izinkan nomor di luar kelompok kelas atlet</label></div>
<div class="k-bar"><button class="k-btn k-navy" data-act="man-parse">Periksa data</button></div><div id="man-hasil"></div>`)}</div>
<div>${card('2. Tambah satu peserta', `<form data-submit="man-one">${field('Nama lengkap', inp('nama', '', { req: 1 }), 1)}<div class="k-grid2">${field('Jenis kelamin', sel('g', [['PUTRA', 'Putra'], ['PUTRI', 'Putri']], 'PUTRA', 'data-chg="man-one"'), 1)}${field('Kelas', sel('kelas', KELAS, '', 'data-chg="man-one"'), 1)}</div>${field('Sekolah', inp('sekolah', '', { req: 1 }), 1)}<div class="k-grid2">${field('Klub (opsional)', inp('klub', ''))}${field('Kab/Kota', inp('kota', ''))}</div><div id="man-ev"><p class="mut sm">Pilih jenis kelamin dan kelas untuk melihat nomor lomba.</p></div><div class="k-bar"><button class="k-btn k-orange">Simpan peserta</button></div></form>`)}
${card('Langkah berikutnya', `<ol class="sm" style="margin:0 0 10px 18px;padding:0"><li>Tutup pendaftaran online (Tahapan Event → Verifikasi).</li><li>Susun start list (Tahapan Event → Start List).</li><li>Periksa susunan acara, lalu terbitkan Buku Acara.</li><li>Hari H: input hasil, pengesahan wasit, Buku Hasil.</li></ol><div class="k-bar" style="justify-content:flex-start"><button class="k-btn sm k-navy" data-go="a-fase">Tahapan Event</button><button class="k-btn sm k-outline" data-go="a-jadwal">Jadwal Acara</button><button class="k-btn sm k-outline" data-go="a-panduan">Panduan</button></div>`)}</div></div></div>`);
  drawManHasil();
};
function manEvList() {
  const el = $('#man-ev'); if (!el) return; const g = S.manOne.g, k = S.manOne.kelas;
  if (k === '') { el.innerHTML = '<p class="mut sm">Pilih jenis kelamin dan kelas untuk melihat nomor lomba.</p>'; return; }
  const L = (S.B.events || []).filter(e => e.g === g).sort((a, b) => a.no - b.no);
  const kel = kelompokDariKelas(Number(k)), cocok = L.filter(e => e.jk === kel);
  el.innerHTML = field(`Nomor lomba ${kel ? `<small class="mut">· ${E(jn(kel))}</small>` : ''}`, cocok.length ? `<div class="man-evs">${cocok.map(e => `<label class="man-ev"><input type="checkbox" name="ev_${e.no}" value="${e.no}"> <span><b>#${e.no}</b> ${E(e.nama)}</span><input class="k-in" name="en_${e.no}" placeholder="Entry (00:42.15) / NT"></label>`).join('')}</div>` : '<p class="mut sm">Tidak ada nomor untuk kelompok ini. Tambahkan di menu Nomor Lomba.</p>', 1);
}
function kelompokDariKelas(k) { return ((S.B.jenjang || []).filter(j => k >= Number(j.min) && k <= Number(j.max))[0] || {}).kode || ''; }
INP['man-one'] = el => { S.manOne[el.name === 'g' ? 'g' : 'kelas'] = el.value; manEvList(); };
SUBMIT['man-one'] = async f => {
  const b = $('button.k-orange', f), d = form(f), nos = Object.keys(d).filter(k => /^ev_/.test(k) && d[k]).map(k => k.slice(3));
  if (!nos.length) return toast('Pilih minimal satu nomor lomba.', 'err');
  busy(b, true);
  try { const r = await rp('man.simpan', { rows: [{ nama: d.nama, gender: d.g, kelas: d.kelas, sekolah: d.sekolah, klub: d.klub, kota: d.kota, nomor: nos.join(';'), entry: nos.map(n => d['en_' + n] || 'NT').join(';') }], opsi: S.man.opsi }); toast(r.message); f.reset(); S.manOne = { g: 'PUTRA', kelas: '' }; manEvList(); bustCache('adash'); bustCache('akun'); }
  catch (e) { toast(e.message, 'err'); } busy(b, false);
};
INP['man-op'] = el => { S.man.opsi[el.dataset.k] = el.checked; if (S.man.rows.length) manCek(S.man.rows); };
function parseTxt(t) { const lines = String(t).replace(/\r/g, '').split('\n').filter(l => l.trim()); if (lines.length < 2) return []; const sep = lines[0].indexOf('\t') >= 0 ? '\t' : lines[0].indexOf(';') >= 0 && lines[0].indexOf(',') < 0 ? ';' : ','; const hd = lines[0].split(sep).map(h => h.trim()); return lines.slice(1).map(l => { const c = l.split(sep), o = {}; hd.forEach((h, i) => o[h] = (c[i] || '').trim()); return o; }); }
const tglIso = v => { const t = String(v || '').trim(), m = t.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/); return m ? `${m[3]}-${('0' + m[2]).slice(-2)}-${('0' + m[1]).slice(-2)}` : t; };
const normM = r => {
  const o = {}; Object.keys(r).forEach(k => { const kk = MAN_COLS.indexOf(String(k).trim().toLowerCase()) >= 0 ? String(k).trim().toLowerCase() : manKol(k); if (kk && (o[kk] == null || o[kk] === '')) o[kk] = r[k]; });
  const x = {}; MAN_COLS.forEach(k => x[k] = o[k] == null ? '' : String(o[k]).trim());
  const nl = [], el = []; if (x.nomor) { x.nomor.split(/\s*[;|]\s*|\s*,\s*(?=\d)/).filter(Boolean).forEach((n, i, a) => { nl.push(n); el.push((x.entry.split(/\s*[;|]\s*/)[a.length === 1 ? 0 : i] || '').trim() || 'NT'); }); }
  for (let i = 1; i <= 5; i++) { const n = String(o['nomor_' + i] || '').trim(); if (n) { nl.push(n); el.push(String(o['entry_' + i] || '').trim() || 'NT'); } }
  x.nomor = nl.join(';'); x.entry = el.join(';'); x.tgl_lahir = tglIso(x.tgl_lahir); return x;
};
// lewati baris kosong, baris keterangan templat, dan baris contoh
const barisData = r => r.nama && !/^(contoh atlet|nama lengkap atlet)/i.test(r.nama);
async function manCek(rows) {
  const acc = { ring: { baris: 0, entri: 0, dup: 0, atletBaru: 0, atletLama: 0, kontBaru: 0, nomorBaru: 0, err: 0, kurang: 0 }, errors: [], preview: [], nomorBaru: [], kurang: [], minN: 1 };
  try {
    for (let i = 0; i < rows.length; i += 400) {
      const r = (await rp('man.cek', { rows: rows.slice(i, i + 400), opsi: S.man.opsi })).data;
      Object.keys(acc.ring).forEach(k => acc.ring[k] += r.ring[k] || 0); r.errors.forEach(e => { if (acc.errors.length < 40) acc.errors.push(Object.assign({}, e, { i: e.i + i })); });
      if (acc.preview.length < 40) acc.preview = acc.preview.concat(r.preview).slice(0, 40); r.nomorBaru.forEach(n => { if (acc.nomorBaru.indexOf(n) < 0) acc.nomorBaru.push(n); }); (r.kurang || []).forEach(z => { if (acc.kurang.length < 40) acc.kurang.push(z); }); acc.minN = r.minN || 1;
    }
    S.man.rows = rows; S.man.cek = acc; drawManHasil(); toast(acc.ring.err ? 'Ada baris bermasalah.' : 'Data valid, siap disimpan.', acc.ring.err ? 'warn' : 'ok');
  } catch (e) { toast(e.message, 'err'); }
}
function drawManHasil() {
  const el = $('#man-hasil'); if (!el) return; const c = S.man.cek; if (!c) { el.innerHTML = ''; return; }
  const r = c.ring;
  el.innerHTML = `<div class="k-kpis" style="margin-top:12px">${kpi('Entri baru', r.entri, 'bi-list-check')}${kpi('Atlet baru', r.atletBaru, 'bi-person-plus', `${r.atletLama} atlet sudah ada`)}${kpi('Sekolah/klub baru', r.kontBaru, 'bi-building')}${kpi('Bermasalah', r.err, 'bi-exclamation-triangle', r.dup ? r.dup + ' entri ganda dilewati' : '')}</div>
${c.nomorBaru.length ? alertx('warn', `<b>${c.nomorBaru.length} nomor lomba baru</b> akan dibuat: ${c.nomorBaru.slice(0, 8).map(E).join(', ')}${c.nomorBaru.length > 8 ? '…' : ''}`, 'bi-plus-circle') : ''}
${c.kurang && c.kurang.length ? alertx('warn', `<b>${c.ring.kurang} atlet</b> kurang dari ${c.minN} nomor (aturan event): ${c.kurang.slice(0, 10).map(z => E(z.nama) + ' (' + z.n + ')').join(', ')}${c.kurang.length > 10 ? '…' : ''}. Tetap bisa disimpan; lengkapi nomornya bila perlu.`, 'bi-exclamation-triangle') : ''}
${c.errors.length ? `<div class="k-alert err"><i class="bi bi-x-octagon"></i><div><b>Perbaiki dulu (${r.err} baris):</b><ul style="margin:6px 0 0 16px">${c.errors.map(e => `<li>Baris ${e.i}${e.nama ? ' (' + E(e.nama) + ')' : ''}: ${E(e.msg)}</li>`).join('')}</ul></div></div>` : ''}
<div class="k-scroll" style="max-height:260px"><table class="k-table"><thead><tr><th>Nama</th><th>L/P</th><th>Kelas</th><th>Sekolah/Klub</th><th>Nomor</th><th>Entry</th><th></th></tr></thead><tbody>${c.preview.map(p => `<tr><td><b>${E(p.nama)}</b></td><td>${p.g === 'PUTRA' ? 'L' : 'P'}</td><td>${E(KRP.kls(p.kelas))}</td><td>${E(p.lembaga)}</td><td class="mono">${E(p.nomor)}</td><td class="mono sm">${E(p.entry)}</td><td>${p.baru ? '<span class="k-pill k-info">baru</span>' : '<span class="k-pill k-neu">sudah ada</span>'}</td></tr>`).join('')}</tbody></table></div>
${!r.err && r.entri ? `<div class="k-bar"><button class="k-btn lg k-orange" data-act="man-simpan"><i class="bi bi-cloud-arrow-up"></i> Simpan ${r.entri} entri</button></div>` : ''}`;
}
ACT['man-parse'] = () => { const rows = parseTxt($('#man-paste').value).map(normM).filter(barisData); if (!rows.length) return toast('Tempel data dengan baris judul kolom.', 'err'); manCek(rows); };
INP['man-file'] = async i => { const f = i.files[0]; if (!f) return; try { await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'); const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' }), js = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false }); const rows = js.map(normM).filter(barisData); if (!rows.length) throw new Error('File kosong.'); manCek(rows); } catch (e) { toast(e.message, 'err'); } i.value = ''; };
ACT['man-tpl'] = () => {
  const B = S.B, c = B.cfg, mx = Math.max(3, Number(c.max_individu) || 3), evs = (B.events || []).slice().sort((a, b) => a.no - b.no), jen = {}; (B.jenjang || []).forEach(j => jen[j.kode] = j);
  const contoh = (nama, g, kelas, sekolah, klub, kota, prov) => { const jk = KRP.jkDariKelas(kelas), L = evs.filter(e => e.jk === jk && e.g === g).slice(0, mx), o = { nama, gender: g === 'PUTRA' ? 'Putra' : 'Putri', kelas: String(kelas), kelompok: (jen[jk] || {}).huruf || '', sekolah, klub, kota, provinsi: prov }; for (let i = 1; i <= mx; i++) { o['nomor_' + i] = L[i - 1] ? String(L[i - 1].no) : ''; o['waktu_' + i] = L[i - 1] ? (i === 2 ? 'NT' : '00:4' + i + '.50') : ''; } Object.assign(o, { nisn: '', tgl_lahir: '2015-03-14', tempat_lahir: 'Jakarta', hp: '', pendaftar: 'Nama guru/pelatih/orang tua', hp_pendaftar: '08xxxxxxxxxx' }); return o; };
  const rows = [contoh('Contoh Atlet Satu', 'PUTRA', 3, 'SDN Contoh 01', '', 'Jakarta Selatan', 'DKI Jakarta'), contoh('Contoh Atlet Dua', 'PUTRI', 8, 'SMPN 1 Contoh', 'Klub Tirta', 'Kota Depok', 'Jawa Barat')];
  const daftar = evs.map(e => ({ 'No Acara': e.no, 'Nomor Lomba': e.nama, 'Kelompok': jn(e.jk), 'Gender': G_L[e.g], 'Hari': e.hari, 'Status': e.b === 0 ? 'Ditutup' : 'Dibuka' }));
  const petunjuk = [['Satu baris = satu atlet. Kolom nomor_1..nomor_' + mx + ' diisi NO ACARA dari sheet "Daftar Nomor" (atau nama nomor, mis. 50m Gaya Bebas).'], ['waktu_1..waktu_' + mx + ' = waktu terbaik untuk nomor di sebelahnya (format 00:42.15). Kosong atau NT bila tidak ada catatan waktu.'], ['kelas: angka 1–12 atau "2 SD", "7 SMP", "X SMA". Bila kelas tidak ada, isi kolom kelompok (A–F) — kelas diisi perkiraan terendah kelompok itu.'], ['gender: Putra/Putri atau L/P. sekolah wajib; klub opsional.'], ['pendaftar & hp_pendaftar: nama dan HP guru/pelatih/orang tua yang mendaftarkan (dicatat di akun sekolah/klub).'], ['Format kolom satu nomor per baris (kolom nomor & entry dipisah titik koma) tetap diterima.'], ['Hapus 2 baris contoh sebelum mengunggah.']].map(r => ({ Petunjuk: r[0] }));
  xlsx([{ name: 'Pendaftar', rows }, { name: 'Daftar Nomor', rows: daftar }, { name: 'Petunjuk', rows: petunjuk }], 'Templat-Pendaftar-' + String(c.musim || 'Event').replace(/[^A-Za-z0-9]+/g, '-') + '.xlsx').catch(e => toast(e.message, 'err'));
};
ACT['man-simpan'] = async a => {
  busy(a, true); const R = S.man.rows; let tot = { entri: 0, atletBaru: 0, kontBaru: 0, nomorBaru: 0, dup: 0 };
  try {
    for (let i = 0; i < R.length; i += 400) { const r = await rp('man.simpan', { rows: R.slice(i, i + 400), opsi: S.man.opsi }); Object.keys(tot).forEach(k => tot[k] += r.data[k] || 0); a.innerHTML = `<span class="k-spin"></span> Menyimpan ${Math.min(i + 400, R.length)}/${R.length}…`; }
    toast(`${tot.entri} entri tersimpan · ${tot.atletBaru} atlet baru · ${tot.kontBaru} sekolah/klub baru${tot.nomorBaru ? ' · ' + tot.nomorBaru + ' nomor baru' : ''}${tot.dup ? ' · ' + tot.dup + ' ganda dilewati' : ''}.`);
    S.man = { rows: [], cek: null, opsi: S.man.opsi }; bustCache('adash'); bustCache('akun'); bustCache('mst'); await S.refreshAll(); go('a-manual');
  } catch (e) { toast(e.message, 'err'); busy(a, false); }
};
})();
