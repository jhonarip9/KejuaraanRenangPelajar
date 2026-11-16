/**
 * ============================================================
 * KRP PRO — Migrasi database dari app lama (Migrasi.gs)
 * Prinsip:
 *  1. App lama TIDAK disentuh: spreadsheet lama hanya DIBACA (openById), tidak pernah ditulis.
 *  2. Akun Google yang sama: ID berkas Drive lama (foto, akta, bukti bayar, logo, dokumen) tetap valid → hanya ID yang disalin.
 *  3. Dibaca berdasarkan NAMA judul kolom, bukan posisi. Kolom yang tidak ada di sumber diisi kosong.
 *  4. Idempoten: upsert berdasarkan kunci (kolom ID). Dijalankan 2× hasilnya sama, tanpa baris dobel.
 *  5. Pindai (dry-run) dulu: menghitung ditambah / diperbarui / dilewati tanpa menulis.
 *  6. Delta sync: jalankan lagi tepat sebelum pindah untuk menangkap data baru di app lama.
 *  7. Batch: tiap sheet target dibaca 1× dan ditulis 1×.
 *  8. Keputusan di app baru tidak ditimpa, kecuali opsi "perbarui data yang berubah" dicentang.
 * ============================================================
 */
// Urutan: master dulu, lalu relasinya. 'log' = default tidak diimpor.
const MIG_GRUP = [
  { id: 'master', label: 'Pengaturan, event, kelompok & nomor lomba', tabel: ['TBL_PORTAL_CONFIG', 'TBL_MASTER_JENJANG', 'TBL_EVENT', 'TBL_MASTER_NOMOR_LOMBA'] },
  { id: 'akun', label: 'Akun panitia, akun pendaftar & atlet', tabel: ['TBL_USERS_ROLES', 'TBL_KONTINGEN', 'TBL_ATLET'] },
  { id: 'daftar', label: 'Pendaftaran nomor & pengajuan', tabel: ['TBL_REGISTRASI_ENTRI', 'TBL_MUTASI_ATLET'] },
  { id: 'hasil', label: 'Start list, hasil, pengesahan & rekor', tabel: ['TBL_HEAT_SEEDS', 'TBL_RACE_RESULTS', 'TBL_WASIT_SIGNOFF', 'TBL_REKOR_KEJUARAAN'] },
  { id: 'arsip', label: 'Arsip event, hasil lama, dokumen & galeri', tabel: ['TBL_EVENT_ARCHIVE_LOG', 'TBL_HASIL_ARSIP', 'TBL_DOKUMEN', 'TBL_GALERI'] },
  { id: 'log', label: 'Log audit & jurnal hasil (riwayat)', tabel: ['TBL_AUDIT_LOG', 'TBL_HASIL_JURNAL'], bawaanMati: true }
];
const MIG_KUNCI = { TBL_PORTAL_CONFIG: 'config_key' };          // selain ini: kolom pertama skema
const MIG_URUT = { TBL_AUDIT_LOG: 'ts', TBL_HASIL_JURNAL: 'ts' };  // log diurutkan ulang menurut waktu
const MIG_SEED = ['TBL_MASTER_JENJANG', 'TBL_MASTER_NOMOR_LOMBA', 'TBL_EVENT']; // isi bawaan setup → diganti utuh bila app baru masih kosong
const MIG_HP = ['hp_kontak', 'pj_telepon', 'hp_pendaftar'];

function migBuka_(idOrUrl) {
  const m = String(idOrUrl || '').match(/\/d\/([A-Za-z0-9_-]{20,})/), id = m ? m[1] : String(idOrUrl || '').trim();
  if (!/^[A-Za-z0-9_-]{20,}$/.test(id)) err_('Tempel URL atau ID spreadsheet database app lama.');
  if (id === ss_().getId()) err_('Itu spreadsheet app BARU. Tempel spreadsheet database app LAMA.');
  try { return SpreadsheetApp.openById(id); } catch (e) { err_('Spreadsheet tidak bisa dibuka. Pastikan ID benar dan milik akun Google yang sama dengan app ini.'); }
}
function migHp_(v) { let s = String(v == null ? '' : v).replace(/[^\d+]/g, ''); if (/^\+?62/.test(s)) s = '0' + s.replace(/^\+?62/, ''); else if (/^8\d{7,}/.test(s)) s = '0' + s; return s; }
// Baca sheet sumber berdasarkan nama judul kolom → objek bertipe sesuai skema target. null = sheet tidak ada.
function migBaca_(src, name) {
  const sh = src.getSheetByName(name); if (!sh) return null;
  const n = sh.getLastRow(), nc = sh.getLastColumn ? sh.getLastColumn() : SKEMA[name].cols.length + 10; if (n < 2) return [];
  const v = sh.getRange(1, 1, n, Math.max(1, nc)).getValues(), h = v[0].map(function (x) { return String(x || '').trim(); }), sk = SKEMA[name];
  return v.slice(1).filter(function (r) { return r.join('') !== ''; }).map(function (r) {
    const raw = {}; h.forEach(function (k, i) { if (k) raw[k] = r[i] instanceof Date ? iso_(r[i]) : r[i]; });
    const o = {}; sk.cols.forEach(function (c) { const x = raw[c]; o[c] = sk.num.indexOf(c) >= 0 ? (x === '' || x == null ? 0 : Number(x) || 0) : (x == null ? '' : String(x)); if (MIG_HP.indexOf(c) >= 0 && o[c]) o[c] = migHp_(o[c]); });
    return o;
  });
}
function migSama_(a, b, sk) { return sk.cols.every(function (c) { return String(a[c] == null ? '' : a[c]) === String(b[c] == null ? '' : b[c]); }); }

function hMigrasi_(me, d) {
  const dry = d.jalankan !== true, timpa = !!d.timpa, src = migBuka_(d.sumber), pilih = Array.isArray(d.grup) ? d.grup : MIG_GRUP.filter(function (g) { return !g.bawaanMati; }).map(function (g) { return g.id; });
  const tabel = []; MIG_GRUP.forEach(function (g) { if (pilih.indexOf(g.id) >= 0) g.tabel.forEach(function (t) { tabel.push(t); }); });
  if (!tabel.length) err_('Pilih minimal satu kelompok data.');
  const baru = !readT_('TBL_KONTINGEN', true).length && !readT_('TBL_REGISTRASI_ENTRI', true).length; // app baru masih kosong (hanya isi bawaan setup)
  const lapor = {}, peringatan = [], cfgDef = CFG_DEFAULT;
  tabel.forEach(function (t) {
    const sk = SKEMA[t], rows = migBaca_(src, t);
    if (rows === null) { lapor[t] = { sumber: 0, tambah: 0, ubah: 0, lewat: 0, ket: 'sheet tidak ada di app lama' }; return; }
    ensureHdr_(t);
    const kunci = MIG_KUNCI[t] || sk.cols[0], target = readT_(t, true).map(stripR_), r = { sumber: rows.length, tambah: 0, ubah: 0, lewat: 0, ket: '' };
    // Isi bawaan setup diganti utuh oleh data app lama (hanya saat app baru belum dipakai).
    if (baru && MIG_SEED.indexOf(t) >= 0 && rows.length) { r.tambah = rows.length; r.ket = 'menggantikan isi bawaan setup (' + target.length + ' baris)'; lapor[t] = r; if (!dry) rewriteT_(t, rows); return; }
    const idx = {}; target.forEach(function (o, i) { if (o[kunci] !== '') idx[String(o[kunci])] = i; });
    const email = {}; if (t === 'TBL_USERS_ROLES') target.forEach(function (o, i) { email[String(o.email).toLowerCase()] = i; });
    const seen = {}, tambah = [];
    rows.forEach(function (s) {
      const k = String(s[kunci] || ''); if (!k || seen[k]) { r.lewat++; return; } seen[k] = 1;
      if (t === 'TBL_USERS_ROLES') {
        const em = String(s.email || '').toLowerCase(), j = email[em];
        if (j !== undefined && String(target[j].user_id) !== k) {
          if (baru) { target[j] = Object.assign({}, s, { user_id: target[j].user_id }); r.ubah++; peringatan.push('Akun panitia ' + em + ' memakai kata sandi dari app lama (sandi dari log setup baru tidak berlaku lagi). Sesi yang sedang berjalan tetap aktif.'); return; }
          r.lewat++; peringatan.push('Akun panitia ' + em + ' sudah ada di app baru dengan ID lain — dilewati.'); return;
        }
      }
      const i = idx[k];
      if (i === undefined) { tambah.push(s); r.tambah++; return; }
      if (t === 'TBL_PORTAL_CONFIG') { // pengaturan: ambil dari app lama bila app baru masih nilai bawaan / kosong
        const cur = target[i], def = cfgDef[k];
        if (String(cur.config_value) === String(s.config_value)) { r.lewat++; return; }
        if (timpa || baru || cur.config_value === '' || (def !== undefined && String(cur.config_value) === String(def))) { target[i] = s; r.ubah++; } else r.lewat++;
        return;
      }
      if (migSama_(target[i], s, sk)) { r.lewat++; return; }
      if (timpa) { target[i] = s; r.ubah++; } else r.lewat++;
    });
    lapor[t] = r;
    if (!dry && (r.tambah || r.ubah)) {
      let all = target.concat(tambah);
      if (MIG_URUT[t]) { const f = MIG_URUT[t]; all.sort(function (a, b) { return String(a[f]).localeCompare(String(b[f])); }); }
      rewriteT_(t, all);
    }
  });
  // Peringatan relasi yatim (atlet tanpa akun, pendaftaran tanpa atlet) di sumber
  try {
    const ks = {}, as = {}; (migBaca_(src, 'TBL_KONTINGEN') || []).forEach(function (k) { ks[k.kontingen_id] = 1; }); (migBaca_(src, 'TBL_ATLET') || []).forEach(function (a) { as[a.atlet_id] = 1; });
    const ya = (migBaca_(src, 'TBL_ATLET') || []).filter(function (a) { return a.kontingen_id && !ks[a.kontingen_id]; }).length, ye = (migBaca_(src, 'TBL_REGISTRASI_ENTRI') || []).filter(function (e) { return !as[e.atlet_id]; }).length;
    if (ya) peringatan.push(ya + ' atlet di app lama tidak punya akun pendaftar (yatim) — tetap disalin.');
    if (ye) peringatan.push(ye + ' pendaftaran nomor di app lama merujuk atlet yang sudah tidak ada — tetap disalin.');
  } catch (e) { }
  if (!dry) {
    // Nomor BIB berikutnya melanjutkan dari app lama (tidak bentrok)
    let maks = 0; readT_('TBL_ATLET', true).forEach(function (a) { const m = /(\d+)$/.exec(String(a.bib || '')); if (m) maks = Math.max(maks, Number(m[1])); });
    if (maks > Number(prop_('SEQ_BIB', '0'))) setProp_('SEQ_BIB', maks);
    _MEMO = {}; _CFG = null;
    bust_('master', 'atlet', 'hasil', 'user', 'galeri');
    audit_(me, 'MIGRASI', 'Database', src.getName() + ' · ' + Object.keys(lapor).map(function (t) { return t.replace('TBL_', '') + '+' + lapor[t].tambah + '/~' + lapor[t].ubah; }).join(' '));
  }
  const tot = Object.keys(lapor).reduce(function (a, t) { a.tambah += lapor[t].tambah; a.ubah += lapor[t].ubah; return a; }, { tambah: 0, ubah: 0 });
  return ok_({ sumber: { nama: src.getName(), id: src.getId() }, dryRun: dry, appBaru: baru, lapor: lapor, peringatan: peringatan, total: tot },
    dry ? 'Pindai selesai: ' + tot.tambah + ' baris akan ditambah, ' + tot.ubah + ' diperbarui. Belum ada yang ditulis.' : 'Migrasi selesai: ' + tot.tambah + ' baris ditambah, ' + tot.ubah + ' diperbarui.');
}
function hMigrasiGrup_() { return ok_(MIG_GRUP.map(function (g) { return { id: g.id, label: g.label, tabel: g.tabel, mati: !!g.bawaanMati }; })); }
