/**
 * ============================================================
 * EVENT — Modul Event & Nomor Pertandingan (v1.6)
 * - Katalog event (TBL_EVENT): identitas, tingkat, waktu & tempat, teknis lomba,
 *   pendaftaran (jendela waktu, kuota atlet, biaya paket/per nomor, jumlah nomor per
 *   atlet, jenis akun), kelompok peserta (huruf A–F ↔ kelas), pembayaran, kontak,
 *   dan ketentuan lengkap (tampil di halaman publik "Info Lomba").
 * - Satu event AKTIF di web (= musim berjalan). Nomor tiap event disimpan di
 *   TBL_MASTER_NOMOR_LOMBA (kolom musim). Hanya nomor event aktif yang tampil.
 *   Kolom "dibuka" = pendaftaran nomor dibuka; is_active = nomor dipertandingkan.
 * - Nomor yang DIBUKA langsung muncul di akun peserta sesuai kelompok kelas & gender.
 * - Preset event dari pedoman, akun demo (sekolah, klub, mandiri).
 * Semua rute didaftarkan di Kode.gs memakai fungsi pembungkus (aman urutan berkas).
 * ============================================================
 */
const EV_TINGKAT = ['Kabupaten/Kota', 'Provinsi', 'Nasional', 'Internasional'];
const EV_TIPE = ['SEKOLAH', 'KLUB', 'MANDIRI'];
const EV_LABEL = ['KELAS', 'HURUF', 'KEDUANYA'];
const EV_INFO = { kontak_nama: 80, kontak_hp: 20, kontak_email: 120, wa_grup: 400, link_daftar: 300, bank_nama: 60, bank_norek: 40, bank_an: 80, konfirmasi: 200, rekening_lain: 500, tgl_buku_acara: 10, tm: 300, sistem: 200, start: 200, aturan: 200, nt: 80, uang_protes: 12, batas_protes: 60, syarat: 3000, lomba: 3000, bayar: 2000, penghargaan: 3000, terbaik: 2000, protes: 3000, kesehatan: 3000, lain: 3000 };
const EV_INFO_RAHASIA = ['bank_nama', 'bank_norek', 'bank_an', 'konfirmasi', 'rekening_lain'];
const EV_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const EV_BLN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const EV_GAYA_URUT = { 'Gaya Bebas': 1, 'Gaya Punggung': 2, 'Gaya Dada': 3, 'Gaya Kupu-kupu': 4, 'Gaya Ganti Perorangan': 5 };

// ── Util ──
function evDemo_(id) { return String(id || '').indexOf('DEMO-') === 0; }
function evAkunDemo_(id) { return id === 'DEMO-SEKOLAH' || id === 'DEMO-KLUB' || id === 'DEMO-MANDIRI'; } // akun uji coba (bukan data contoh isiDataContoh)
function evAdaSheet_() { if (_MEMO.__evAda !== undefined) return _MEMO.__evAda; try { _MEMO.__evAda = !!ss_().getSheetByName('TBL_EVENT'); } catch (e) { _MEMO.__evAda = false; } return _MEMO.__evAda; }
function evRows_(fresh) { return evAdaSheet_() ? readT_('TBL_EVENT', fresh) : []; }
function evSiap_() { // tanpa perlu setup ulang: buat sheet TBL_EVENT & perbarui judul kolom nomor
  if (_MEMO.__evSiap) return; const ss = ss_();
  if (!ss.getSheetByName('TBL_EVENT')) ensureSheet_(ss, 'TBL_EVENT');
  _MEMO.__evAda = true; ensureHdr_('TBL_MASTER_NOMOR_LOMBA'); _MEMO.__evSiap = 1;
}
function evInfo_(ev) { try { return JSON.parse((ev && ev.info_json) || '{}') || {}; } catch (e) { return {}; } }
function evKel_(ev) { try { return JSON.parse((ev && ev.kelompok_json) || '{}') || {}; } catch (e) { return {}; } }
function evByMusim_(m) { return evRows_(true).filter(function (r) { return r.musim === m; })[0] || null; }
function tglObj_(s) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null; }
function tglRentang_(a, b) {
  const x = tglObj_(a), y = tglObj_(b) || x; if (!x) return '';
  const H = EV_HARI, B = EV_BLN;
  if (y.getTime() <= x.getTime()) return H[x.getDay()] + ', ' + x.getDate() + ' ' + B[x.getMonth()] + ' ' + x.getFullYear();
  const hari = H[x.getDay()] + '–' + H[y.getDay()];
  if (x.getMonth() === y.getMonth() && x.getFullYear() === y.getFullYear()) return hari + ', ' + x.getDate() + '–' + y.getDate() + ' ' + B[x.getMonth()] + ' ' + x.getFullYear();
  if (x.getFullYear() === y.getFullYear()) return hari + ', ' + x.getDate() + ' ' + B[x.getMonth()] + ' – ' + y.getDate() + ' ' + B[y.getMonth()] + ' ' + y.getFullYear();
  return x.getDate() + ' ' + B[x.getMonth()] + ' ' + x.getFullYear() + ' – ' + y.getDate() + ' ' + B[y.getMonth()] + ' ' + y.getFullYear();
}
function evLokasi_(ev) { const v = String(ev.venue || '').trim(), k = String(ev.kota || '').trim(); return v && k && v.toLowerCase().indexOf(k.toLowerCase()) < 0 ? v + ', ' + k : (v || k); }
function evRekening_(inf) {
  const L = [];
  if (inf.bank_norek) L.push((inf.bank_nama ? inf.bank_nama + ' ' : '') + inf.bank_norek + (inf.bank_an ? ' a.n. ' + inf.bank_an : ''));
  if (inf.konfirmasi) L.push('Konfirmasi pembayaran: ' + inf.konfirmasi);
  if (inf.rekening_lain) L.push(inf.rekening_lain);
  return L.join('\n');
}
function evFeePaket_(ev) { const mx = Math.max(1, Number(ev.nomor_max) || 1); return Math.floor((Number(ev.biaya_paket) || 0) / mx); }
// Biaya entri ke-idx (0-based) seorang atlet. Mode paket: total per atlet = harga paket (sisa pembagian di entri awal).
function feeEntri_(ev, idx) {
  const c = cfg_(); if (c.biaya_mode !== 'PAKET') return Number(ev.fee_amount) || 0;
  const pk = Number(c.biaya_paket) || 0, mx = Math.max(1, Number(c.max_individu) || 1), base = Math.floor(pk / mx), rem = pk - base * mx;
  return idx >= mx ? 0 : base + (idx < rem ? 1 : 0);
}
// Hitung entri per musim (tanpa yang ditolak). Entri akun demo ikut dihitung agar uji coba kuota realistis;
// hapus akun demo sebelum pendaftaran ditutup (entri demo juga tidak pernah masuk start list).
function evHitung_() {
  if (_MEMO.__evH) return _MEMO.__evH; const o = {};
  readT_('TBL_REGISTRASI_ENTRI').forEach(function (e) {
    if (e.status_verifikasi === 'REJECTED') return;
    const x = o[e.musim] || (o[e.musim] = { a: {}, entri: 0, n: {} }); x.a[e.atlet_id] = 1; x.entri++; x.n[e.event_id] = (x.n[e.event_id] || 0) + 1;
  });
  _MEMO.__evH = o; return o;
}
// Cek kuota nomor & kuota atlet event aktif. baru = [{aid, ev}] (aid kosong = atlet baru)
function cekKuota_(baru) {
  const c = cfg_(), H = evHitung_()[c.musim] || { a: {}, n: {} }, add = {}, aBaru = {};
  baru.forEach(function (b) {
    const q = Number(b.ev.max_quota) || 0; add[b.ev.event_id] = (add[b.ev.event_id] || 0) + 1;
    if (q > 0 && (H.n[b.ev.event_id] || 0) + add[b.ev.event_id] > q) err_('Kuota nomor #' + b.ev.event_no + ' ' + b.ev.event_name + ' sudah penuh (' + q + ' peserta).');
    if (!b.aid || !H.a[b.aid]) aBaru[b.aid || ('baru' + Object.keys(aBaru).length)] = 1;
  });
  const kq = Number(c.kuota_atlet) || 0, isi = Object.keys(H.a).length, nb = Object.keys(aBaru).length;
  if (kq > 0 && nb && isi + nb > kq) err_('Kuota peserta event sudah penuh (' + isi + '/' + kq + ' atlet). Hubungi panitia.');
}
function evAturan_() { // ringkasan aturan pendaftaran event aktif untuk akun peserta
  const c = cfg_(), H = evHitung_()[c.musim] || { a: {}, n: {} }, n = {};
  readM_('TBL_MASTER_NOMOR_LOMBA').forEach(function (e) { if (e.is_active) n[e.event_id] = { n: H.n[e.event_id] || 0, q: Number(e.max_quota) || 0, b: e.dibuka !== '0' ? 1 : 0 }; });
  return { min: Math.max(1, Number(c.min_nomor) || 1), max: Number(c.max_individu) || 3, mode: c.biaya_mode === 'PAKET' ? 'PAKET' : 'NOMOR', paket: Number(c.biaya_paket) || 0, kuota: Number(c.kuota_atlet) || 0, terisi: Object.keys(H.a).length, nomor: n, wa: c.wa_grup || '', dl: c.registrasi_deadline || '', mulai: c.registrasi_mulai || '' };
}

// ── Status event ──
function evStatusOf_(ev, c, now) {
  const aktif = ev.musim === c.musim, a = waktuLokal_(ev.tgl_mulai, false), b = waktuLokal_(ev.tgl_selesai || ev.tgl_mulai, true);
  if (aktif) {
    if (c.fase === 'SELESAI' || toInt_(c._arsip_step) >= 1) return 'SELESAI';
    if (c.fase === 'PELAKSANAAN' || (!isNaN(a) && now >= a && now <= b)) return 'BERLANGSUNG';
    if (!isNaN(b) && now > b) return 'LEWAT';
    return 'AKAN_DATANG';
  }
  return ev.status === 'SELESAI' ? 'SELESAI' : ev.status === 'TERBIT' ? 'DIUMUMKAN' : 'DRAFT';
}
function evDaftarOf_(ev, c, now) {
  if (ev.musim !== c.musim) return ev.status === 'SELESAI' ? 'SELESAI' : 'BELUM_AKTIF';
  if (bukaDaftar_()) return 'DIBUKA';
  if (c.registrasi_dibuka === '1' && (c.fase || 'PENDAFTARAN') === 'PENDAFTARAN' && c.event_dikunci !== '1' && c.registrasi_mulai && now < waktuLokal_(c.registrasi_mulai, false)) return 'BELUM_DIBUKA';
  return 'DITUTUP';
}
function evOut_(ev, full) {
  const o = stripR_(ev); o.kelompok = evKel_(ev); delete o.kelompok_json;
  if (full) o.info = evInfo_(ev); delete o.info_json; delete o.fase_simpan; return o;
}

// ── Sinkron konfigurasi portal dari event aktif ──
function evCfg_(ev) {
  const inf = evInfo_(ev);
  return {
    app_name: ev.nama, lokasi: evLokasi_(ev), tanggal_teks: tglRentang_(ev.tgl_mulai, ev.tgl_selesai), tanggal_mulai: ev.tgl_mulai, tanggal_selesai: ev.tgl_selesai || ev.tgl_mulai,
    registrasi_mulai: ev.daftar_mulai || '', registrasi_deadline: ev.daftar_tutup || '', max_individu: String(ev.nomor_max), min_nomor: String(ev.nomor_min), min_peserta: String(ev.min_peserta), jumlah_lintasan: String(ev.lintasan),
    kuota_atlet: String(ev.kuota_atlet || 0), biaya_mode: ev.biaya_mode, biaya_paket: String(ev.biaya_paket || 0), tipe_akun: ev.tipe_akun, kelompok_json: ev.kelompok_json || '{}', label_kelompok: ev.label_kelompok || 'KELAS',
    tingkat_event: ev.tingkat || '', kolam: ev.kolam, wa_grup: inf.wa_grup || '', rekening: evRekening_(inf), kontak_telp: inf.kontak_hp || '', kontak_email: inf.kontak_email || ''
  };
}

// ── Migrasi: pastikan event berjalan punya baris & nomor lama ber-musim ──
function evDariCfg_(c, nom) {
  const fees = {}; nom.forEach(function (n) { fees[n.fee_amount] = (fees[n.fee_amount] || 0) + 1; });
  const fee = Number(Object.keys(fees).sort(function (a, b) { return fees[b] - fees[a]; })[0] || 0);
  let kel = {}, k0 = {}; try { k0 = JSON.parse(c.kelompok_json || '{}') || {}; } catch (e) { }
  if (Object.keys(k0).length) kel = k0; else readT_('TBL_MASTER_JENJANG').forEach(function (j) { kel[j.kode_jenjang] = ''; });
  const t = nowIso_();
  return {
    ev_id: uid_('EV'), musim: c.musim, nama: c.app_name || 'Kejuaraan Renang Pelajar', tingkat: c.tingkat_event || 'Provinsi', wilayah: '', penyelenggara: '',
    tgl_mulai: /^\d{4}-\d{2}-\d{2}$/.test(c.tanggal_mulai || '') ? c.tanggal_mulai : '', tgl_selesai: /^\d{4}-\d{2}-\d{2}$/.test(c.tanggal_selesai || '') ? c.tanggal_selesai : '',
    venue: c.lokasi === CFG_DEFAULT.lokasi ? '' : (c.lokasi || ''), alamat: '', kota: '', maps_url: '', kolam: nom.some(function (n) { return n.course_type === 'SCM'; }) ? 'SCM' : 'LCM', lintasan: Number(c.jumlah_lintasan) || 8,
    daftar_mulai: c.registrasi_mulai || '', daftar_tutup: c.registrasi_deadline || '', kuota_atlet: Number(c.kuota_atlet) || 0, biaya_mode: c.biaya_mode === 'PAKET' ? 'PAKET' : 'NOMOR', biaya_paket: Number(c.biaya_paket) || 0, biaya_nomor: fee,
    nomor_min: Number(c.min_nomor) || 1, nomor_max: Number(c.max_individu) || 3, min_peserta: Number(c.min_peserta) || 0, tipe_akun: c.tipe_akun || EV_TIPE.join(','), kelompok_json: JSON.stringify(kel), label_kelompok: c.label_kelompok || 'KELAS',
    info_json: JSON.stringify({ kontak_hp: c.kontak_telp || '', kontak_email: c.kontak_email || '', rekening_lain: c.rekening || '', wa_grup: c.wa_grup || '' }), status: 'TERBIT', fase_simpan: '', dibuat_oleh: 'migrasi', created_at: t, updated_at: t
  };
}
function evMigrasi_() {
  evSiap_(); const c = cfg_(), rows = readT_('TBL_EVENT', true);
  const nom = readT_('TBL_MASTER_NOMOR_LOMBA', true), leg = nom.filter(function (n) { return !n.musim; });
  if (leg.length) { leg.forEach(function (n) { n.musim = c.musim; if (n.dibuka === '') n.dibuka = n.is_active ? '1' : '0'; if (n.max_quota === 64) n.max_quota = 0; }); saveRows_('TBL_MASTER_NOMOR_LOMBA', leg); bust_('master'); }
  let cur = rows.filter(function (r) { return r.musim === c.musim; })[0];
  if (!cur) { cur = evDariCfg_(c, nom.filter(function (n) { return !n.musim || n.musim === c.musim; })); appendT_('TBL_EVENT', [cur]); }
  return cur;
}

// ── Daftar & detail event ──
function hEvList_(me) {
  evMigrasi_(); const c = cfg_(), now = Date.now(), H = evHitung_(), nom = readT_('TBL_MASTER_NOMOR_LOMBA', true), nm = {};
  nom.forEach(function (n) { const x = nm[n.musim] || (nm[n.musim] = { t: 0, b: 0, batal: 0 }); if (n.is_active) { x.t++; if (n.dibuka !== '0') x.b++; } else x.batal++; });
  const rows = readT_('TBL_EVENT', true);
  const events = rows.map(function (ev) {
    const h = H[ev.musim] || { a: {}, entri: 0 }, n = nm[ev.musim] || { t: 0, b: 0, batal: 0 }, o = evOut_(ev, false);
    o.aktif = ev.musim === c.musim; o.st = evStatusOf_(ev, c, now); o.daftar = evDaftarOf_(ev, c, now); o.terisi = Object.keys(h.a).length; o.entri = h.entri; o.nomor = n.t; o.nomorBuka = n.b; o.nomorBatal = n.batal;
    return o;
  }).sort(function (a, b) { return (b.aktif ? 1 : 0) - (a.aktif ? 1 : 0) || String(b.tgl_mulai).localeCompare(String(a.tgl_mulai)); });
  const punya = {}; rows.forEach(function (r) { punya[r.musim] = 1; }); const lalu = [], meta = arsipMeta_();
  readT_('TBL_EVENT_ARCHIVE_LOG').forEach(function (a) { if (!punya[a.season_name]) { punya[a.season_name] = 1; lalu.push({ musim: a.season_name, nama: a.season_name, tanggal: String(a.closed_at || '').slice(0, 10), atlet: a.total_atlet, sumber: 'Arsip web' }); } });
  Object.keys(meta).forEach(function (m) { if (!punya[m]) { punya[m] = 1; lalu.push({ musim: m, nama: meta[m].event || m, tanggal: meta[m].tanggal || '', lokasi: meta[m].lokasi || '', sumber: 'Impor hasil lama' }); } });
  lalu.sort(function (a, b) { return String(b.tanggal).localeCompare(String(a.tanggal)); });
  return ok_({ events: events, aktif: c.musim, fase: c.fase || 'PENDAFTARAN', lalu: lalu, demo: evDemoInfo_(), preset: !rows.some(function (r) { return r.musim === EV_PRESET_MUSIM; }), presetMusim: EV_PRESET_MUSIM, presetNama: 'Kejuaraan Renang Pelajar Jabodetabek Short Course Series II 2026 (27–28 Nov)' });
}
function hEvGet_(me, d) {
  const cur = evMigrasi_(), c = cfg_(), all = readT_('TBL_EVENT', true);
  const ev = d.id ? all.filter(function (r) { return r.ev_id === String(d.id); })[0] : d.musim ? all.filter(function (r) { return r.musim === String(d.musim); })[0] : all.filter(function (r) { return r.musim === cur.musim; })[0];
  if (!ev) err_('Event tidak ditemukan.');
  const H = evHitung_()[ev.musim] || { a: {}, n: {}, entri: 0 }, res = {};
  readT_('TBL_RACE_RESULTS').forEach(function (r) { if (r.musim === ev.musim) res[r.event_id] = 1; });
  const nomor = readT_('TBL_MASTER_NOMOR_LOMBA', true).filter(function (n) { return n.musim === ev.musim; }).map(function (n) { const o = stripR_(n); o.n = H.n[n.event_id] || 0; o.hasil = !!res[n.event_id]; return o; }).sort(function (a, b) { return a.event_no - b.event_no; });
  const o = evOut_(ev, true); o.aktif = ev.musim === c.musim; o.st = evStatusOf_(ev, c, Date.now()); o.daftar = evDaftarOf_(ev, c, Date.now());
  return ok_({ ev: o, nomor: nomor, terisi: Object.keys(H.a).length, entri: H.entri, fase: c.fase || 'PENDAFTARAN', jenjang: readT_('TBL_MASTER_JENJANG').map(stripR_).sort(function (a, b) { return a.urutan - b.urutan; }), gaya: GAYA, tingkat: EV_TINGKAT, events: all.map(function (r) { return { id: r.ev_id, musim: r.musim, nama: r.nama, aktif: r.musim === c.musim }; }) });
}

// ── Validasi & simpan event ──
function musimDipakai_(m) {
  if (!m) return false;
  return readT_('TBL_REGISTRASI_ENTRI').some(function (e) { return e.musim === m; }) || readT_('TBL_HEAT_SEEDS').some(function (e) { return e.musim === m; }) || readT_('TBL_RACE_RESULTS').some(function (e) { return e.musim === m; });
}
function evDtValid_(s, wajib, label) { s = String(s || '').trim().replace(' ', 'T'); if (!s) { if (wajib) err_(label + ' wajib diisi.'); return ''; } if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(s)) err_(label + ' tidak valid (format tanggal/jam).'); return s; }
function evBersih_(x, cur, all) {
  const t = function (v, n) { return String(v == null ? '' : v).replace(/\s+$/, '').slice(0, n || 200); }, num = function (v, a, b, label) { const n = toInt_(v, -1); if (n < a || n > b) err_(label + ' harus ' + a + '–' + b + '.'); return n; };
  const nama = t(x.nama, 160).trim(); if (nama.length < 5) err_('Nama event minimal 5 karakter.');
  const musim = t(x.musim, 30).trim(); if (!/^[\w\/ .-]{1,30}$/.test(musim)) err_('Kode musim 1–30 karakter (huruf, angka, spasi, . / -).');
  if (all.some(function (r) { return r.musim.toLowerCase() === musim.toLowerCase() && (!cur || r.ev_id !== cur.ev_id); })) err_('Kode musim "' + musim + '" sudah dipakai event lain.');
  if ((!cur || cur.musim !== musim)) {
    const lama = {}; readT_('TBL_EVENT_ARCHIVE_LOG').forEach(function (a) { lama[String(a.season_name).toLowerCase()] = 1; }); Object.keys(arsipMeta_()).forEach(function (m) { lama[m.toLowerCase()] = 1; });
    if (lama[musim.toLowerCase()] || musimDipakai_(musim)) err_('Kode musim "' + musim + '" sudah dipakai data/arsip lama. Pilih nama lain.');
  }
  const tgl1 = evDtValid_(x.tgl_mulai, true, 'Tanggal mulai').slice(0, 10), tgl2 = evDtValid_(x.tgl_selesai, false, 'Tanggal selesai').slice(0, 10) || tgl1;
  if (tgl2 < tgl1) err_('Tanggal selesai tidak boleh sebelum tanggal mulai.');
  const dm = evDtValid_(x.daftar_mulai, false, 'Pendaftaran dibuka'), dt = evDtValid_(x.daftar_tutup, true, 'Pendaftaran ditutup');
  if (dm && waktuLokal_(dm, false) >= waktuLokal_(dt, true)) err_('Waktu buka pendaftaran harus sebelum waktu tutup.');
  if (waktuLokal_(dt, true) > waktuLokal_(tgl2, true)) err_('Pendaftaran harus ditutup paling lambat pada hari terakhir lomba.');
  const venue = t(x.venue, 160).trim(); if (venue.length < 3) err_('Tempat / kolam renang wajib diisi.');
  const tingkat = EV_TINGKAT.indexOf(x.tingkat) >= 0 ? x.tingkat : 'Provinsi', kolam = x.kolam === 'SCM' ? 'SCM' : 'LCM';
  const nmin = num(x.nomor_min, 1, 10, 'Minimal nomor per atlet'), nmax = num(x.nomor_max, 1, 10, 'Maksimal nomor per atlet'); if (nmin > nmax) err_('Minimal nomor per atlet tidak boleh melebihi maksimal.');
  const mode = x.biaya_mode === 'PAKET' ? 'PAKET' : 'NOMOR', paket = mode === 'PAKET' ? num(x.biaya_paket, 0, 100000000, 'Biaya paket') : toInt_(x.biaya_paket, 0), bn = toInt_(x.biaya_nomor, 0); if (bn < 0) err_('Biaya per nomor tidak valid.');
  const tipe = (Array.isArray(x.tipe_akun) ? x.tipe_akun : String(x.tipe_akun || '').split(',')).map(function (s) { return String(s).trim().toUpperCase(); }).filter(function (s) { return EV_TIPE.indexOf(s) >= 0; });
  if (!tipe.length) err_('Pilih minimal satu jenis akun yang boleh mendaftar.');
  const master = idx_(readT_('TBL_MASTER_JENJANG'), 'kode_jenjang'), kel = {}, kx = x.kelompok || {};
  Object.keys(kx).forEach(function (k) { if (!master[k]) err_('Kelompok ' + k + ' tidak ada di master kelompok.'); const h = String(kx[k] || '').trim().toUpperCase().slice(0, 3); if (h && !/^[A-Z0-9]{1,3}$/.test(h)) err_('Huruf kelompok hanya huruf/angka (mis. A).'); kel[k] = h; });
  const ks = Object.keys(kel); if (!ks.length) err_('Pilih minimal satu kelompok peserta.');
  ks.forEach(function (a, i) { ks.slice(i + 1).forEach(function (b) { const A = master[a], Bm = master[b]; if (A.kelas_min <= Bm.kelas_max && Bm.kelas_min <= A.kelas_max) err_('Rentang kelas ' + A.nama_jenjang + ' dan ' + Bm.nama_jenjang + ' bertumpuk. Pilih salah satu.'); }); });
  const hs = ks.map(function (k) { return kel[k]; }).filter(Boolean); if (hs.length !== Object.keys(hs.reduce(function (o, h) { o[h] = 1; return o; }, {})).length) err_('Huruf kelompok tidak boleh kembar.');
  const ix = x.info || {}, info = {}; Object.keys(EV_INFO).forEach(function (k) { const v = t(ix[k], EV_INFO[k]); if (v) info[k] = v; });
  ['wa_grup', 'link_daftar'].forEach(function (k) { if (info[k] && !/^https?:\/\//i.test(info[k])) err_('Tautan ' + (k === 'wa_grup' ? 'grup WhatsApp' : 'pendaftaran') + ' harus diawali https://'); });
  if (info.kontak_email && !emailValid_(info.kontak_email)) err_('Email kontak tidak valid.');
  if (info.tgl_buku_acara && !/^\d{4}-\d{2}-\d{2}$/.test(info.tgl_buku_acara)) err_('Tanggal buku acara tidak valid.');
  const maps = t(x.maps_url, 400).trim(); if (maps && !/^https?:\/\//i.test(maps)) err_('Tautan peta harus diawali https://');
  const now = nowIso_();
  return {
    ev_id: cur ? cur.ev_id : uid_('EV'), musim: musim, nama: nama, tingkat: tingkat, wilayah: t(x.wilayah, 160).trim(), penyelenggara: t(x.penyelenggara, 160).trim(), tgl_mulai: tgl1, tgl_selesai: tgl2,
    venue: venue, alamat: t(x.alamat, 250).trim(), kota: t(x.kota, 80).trim(), maps_url: maps, kolam: kolam, lintasan: num(x.lintasan, 2, 10, 'Jumlah lintasan'), daftar_mulai: dm, daftar_tutup: dt,
    kuota_atlet: num(x.kuota_atlet || 0, 0, 100000, 'Kuota atlet'), biaya_mode: mode, biaya_paket: paket, biaya_nomor: bn, nomor_min: nmin, nomor_max: nmax, min_peserta: num(x.min_peserta || 0, 0, 50, 'Minimal peserta per nomor'),
    tipe_akun: tipe.join(','), kelompok_json: JSON.stringify(kel), label_kelompok: EV_LABEL.indexOf(x.label_kelompok) >= 0 ? x.label_kelompok : 'KEDUANYA', info_json: JSON.stringify(info),
    status: cur ? cur.status : 'DRAFT', fase_simpan: cur ? cur.fase_simpan : '', dibuat_oleh: cur ? cur.dibuat_oleh : '', created_at: cur ? cur.created_at : now, updated_at: now
  };
}
function hEvSimpan_(me, d) {
  evMigrasi_(); const c = cfg_(), all = readT_('TBL_EVENT', true), x = d.ev || {}, id = String(x.ev_id || ''), cur = id ? all.filter(function (r) { return r.ev_id === id; })[0] : null;
  if (id && !cur) err_('Event tidak ditemukan.');
  const ev = evBersih_(x, cur, all); if (!cur) ev.dibuat_oleh = me.nama;
  const nom = readT_('TBL_MASTER_NOMOR_LOMBA', true), mine = nom.filter(function (n) { return n.musim === (cur ? cur.musim : ev.musim); }), kel = evKel_(ev), upd = [];
  if (cur) {
    if (cur.musim !== ev.musim && musimDipakai_(cur.musim)) err_('Kode musim tidak bisa diubah karena sudah ada pendaftaran/hasil.');
    const lepas = {}; mine.forEach(function (n) { if (kel[n.jenjang_kode] === undefined) lepas[n.jenjang_kode] = (lepas[n.jenjang_kode] || 0) + 1; });
    const lk = Object.keys(lepas); if (lk.length) err_('Kelompok ' + lk.join(', ') + ' masih punya nomor lomba (' + lk.map(function (k) { return lepas[k]; }).join(', ') + '). Hapus nomornya dulu di tab Nomor pertandingan.');
    if (cur.kolam !== ev.kolam) { const res = {}; readT_('TBL_RACE_RESULTS').forEach(function (r) { if (r.musim === cur.musim) res[r.event_id] = 1; }); if (mine.some(function (n) { return res[n.event_id]; })) err_('Jenis kolam tidak bisa diubah karena sudah ada hasil lomba.'); }
  }
  const feeP = evFeePaket_(ev), ganti = !!d.terapkanBiaya || (cur && cur.biaya_mode === 'PAKET' && ev.biaya_mode === 'NOMOR');
  mine.forEach(function (n) {
    let ch = false;
    if (cur && cur.musim !== ev.musim) { n.musim = ev.musim; ch = true; }
    if (n.course_type !== ev.kolam) { n.course_type = ev.kolam; ch = true; }
    const f = ev.biaya_mode === 'PAKET' ? feeP : (ganti ? ev.biaya_nomor : n.fee_amount); if (n.fee_amount !== f) { n.fee_amount = f; ch = true; }
    if (ch) upd.push(n);
  });
  if (upd.length) saveRows_('TBL_MASTER_NOMOR_LOMBA', upd);
  if (cur) { ev._r = cur._r; saveRows_('TBL_EVENT', [ev]); } else appendT_('TBL_EVENT', [ev]);
  let salin = 0;
  if (!cur && d.salinDari) { // salin susunan nomor dari event lain (seri berikutnya), hanya kelompok yang ikut
    const rows = nom.filter(function (n) { return n.musim === String(d.salinDari) && n.is_active && kel[n.jenjang_kode] !== undefined; }).sort(function (a, b) { return a.event_no - b.event_no; }).map(function (n) {
      const o = stripR_(n); o.event_id = uid_('N'); o.musim = ev.musim; o.dibuka = '1'; o.course_type = ev.kolam; o.fee_amount = ev.biaya_mode === 'PAKET' ? feeP : ev.biaya_nomor; return o; });
    if (rows.length) { appendT_('TBL_MASTER_NOMOR_LOMBA', rows); salin = rows.length; }
  }
  const aktif = cur && cur.musim === c.musim;
  if (aktif) { const o = evCfg_(ev); if (cur.musim !== ev.musim) o.musim = ev.musim; if (!c.judul_hero || c.judul_hero === cur.nama) o.judul_hero = ev.nama; cfgSet_(me, o); }
  delete _MEMO.__jd; bust_('master', 'atlet', 'hasil'); audit_(me, cur ? 'EVENT_UBAH' : 'EVENT_BARU', 'Event', ev.musim + ' · ' + ev.nama);
  return ok_({ id: ev.ev_id, musim: ev.musim, aktif: !!aktif, nomorDiubah: upd.length, salin: salin }, cur ? 'Event tersimpan' + (aktif ? ' dan langsung berlaku di web.' : '.') : 'Event dibuat' + (salin ? ' dengan ' + salin + ' nomor hasil salinan' : '') + '. ' + (salin ? 'Periksa nomornya, lalu aktifkan agar tampil di web.' : 'Tambahkan nomor lomba, lalu aktifkan agar tampil di web.'));
}
function hEvAktifkan_(me, d) {
  evMigrasi_(); const c = cfg_(), all = readT_('TBL_EVENT', true), ev = all.filter(function (r) { return r.ev_id === String(d.id || ''); })[0];
  if (!ev) err_('Event tidak ditemukan.'); if (ev.musim === c.musim) err_('Event ini sudah aktif di web.');
  if (c.fase === 'PELAKSANAAN' && !d.paksa) err_('Event yang aktif sedang dalam tahap Pelaksanaan. Selesaikan atau arsipkan dulu (atau centang "paksa").');
  if (!readT_('TBL_MASTER_NOMOR_LOMBA', true).some(function (n) { return n.musim === ev.musim && n.is_active; }) && !d.paksa) err_('Event ini belum punya nomor lomba. Tambahkan nomor dulu di tab Nomor pertandingan.');
  evAktifkan_(me, ev, all);
  return ok_({ musim: ev.musim }, 'Event "' + ev.nama + '" kini aktif di web. Nomor yang dibuka langsung tampil di akun peserta sesuai kelompok.');
}
function evAktifkan_(me, ev, all) {
  const c = cfg_(), lama = all.filter(function (r) { return r.musim === c.musim; })[0], t = nowIso_();
  if (lama) { lama.fase_simpan = JSON.stringify({ fase: c.fase || 'PENDAFTARAN', arsip: c._arsip_step || '0', arsip_id: c._arsip_id || '', kunci: c.event_dikunci || '0', buka: c.registrasi_dibuka || '0' }); lama.status = toInt_(c._arsip_step) >= 1 || c.fase === 'SELESAI' ? 'SELESAI' : 'DRAFT'; lama.updated_at = t; }
  let fs = {}; try { fs = JSON.parse(ev.fase_simpan || '{}') || {}; } catch (e) { }
  if (ev.status !== 'SELESAI') ev.status = 'TERBIT'; ev.updated_at = t;
  saveRows_('TBL_EVENT', [lama, ev].filter(Boolean));
  const o = evCfg_(ev);
  Object.assign(o, { musim: ev.musim, fase: fs.fase || 'PENDAFTARAN', _arsip_step: String(fs.arsip || '0'), _arsip_id: fs.arsip_id || '', event_dikunci: fs.kunci || '0', registrasi_dibuka: fs.buka !== undefined ? String(fs.buka) : '1', judul_hero: ev.nama });
  cfgSet_(me, o); delete _MEMO.__jd; delete _MEMO.__evH; bust_('master', 'atlet', 'hasil', 'galeri', 'user');
  audit_(me, 'EVENT_AKTIF', 'Event', ev.musim);
}
function hEvHapus_(me, d) {
  evMigrasi_(); const c = cfg_(), all = readT_('TBL_EVENT', true), ev = all.filter(function (r) { return r.ev_id === String(d.id || ''); })[0];
  if (!ev) err_('Event tidak ditemukan.'); if (ev.musim === c.musim) err_('Event yang sedang aktif tidak bisa dihapus. Aktifkan event lain lebih dulu.');
  const pakai = {}; ['TBL_REGISTRASI_ENTRI', 'TBL_HEAT_SEEDS', 'TBL_RACE_RESULTS'].forEach(function (tb) { readT_(tb).forEach(function (r) { pakai[r.event_id] = 1; }); });
  const nom = readT_('TBL_MASTER_NOMOR_LOMBA', true), sisa = nom.filter(function (n) { return n.musim !== ev.musim || pakai[n.event_id]; }), dibiar = nom.filter(function (n) { return n.musim === ev.musim && pakai[n.event_id]; }).length;
  if (sisa.length !== nom.length) rewriteT_('TBL_MASTER_NOMOR_LOMBA', sisa);
  rewriteT_('TBL_EVENT', all.filter(function (r) { return r.ev_id !== ev.ev_id; })); bust_('master'); audit_(me, 'EVENT_HAPUS', 'Event', ev.musim + ' · ' + ev.nama);
  return ok_(null, 'Event dihapus.' + (dibiar ? ' ' + dibiar + ' nomor yang sudah punya pendaftar disimpan untuk riwayat.' : '') + ' Pendaftaran terkait tidak ikut terhapus.');
}
function hEvStatus_(me, d) {
  evMigrasi_(); const c = cfg_(), all = readT_('TBL_EVENT', true), ev = all.filter(function (r) { return r.ev_id === String(d.id || ''); })[0];
  if (!ev) err_('Event tidak ditemukan.'); if (ev.musim === c.musim) err_('Status event aktif mengikuti Tahapan Event & menu Tutup Event & Arsip.');
  ev.status = ['SELESAI', 'TERBIT'].indexOf(d.status) >= 0 ? d.status : 'DRAFT'; ev.updated_at = nowIso_(); saveRows_('TBL_EVENT', [ev]); bust_('master'); audit_(me, 'EVENT_STATUS', 'Event', ev.musim + ' → ' + ev.status);
  return ok_(null, ev.status === 'SELESAI' ? 'Event ditandai selesai (arsip).' : ev.status === 'TERBIT' ? 'Event diumumkan di kalender beranda (pendaftaran belum dibuka).' : 'Event dikembalikan ke draf (tidak tampil di beranda).');
}
function hEvDaftar_(me, d) { // buka/tutup cepat pendaftaran event aktif
  evMigrasi_(); const c = cfg_(), buka = !!d.buka;
  if ((c.fase || 'PENDAFTARAN') !== 'PENDAFTARAN') err_('Tahap event sudah ' + c.fase + '. Atur lewat menu Tahapan Event.');
  if (buka && c.registrasi_deadline && Date.now() > waktuLokal_(c.registrasi_deadline, true)) err_('Batas pendaftaran sudah lewat. Ubah waktu tutup pendaftaran di pengaturan event dulu.');
  cfgSet_(me, { registrasi_dibuka: buka ? '1' : '0' }); bust_('master', 'atlet'); audit_(me, buka ? 'DAFTAR_BUKA' : 'DAFTAR_TUTUP', 'Event', c.musim);
  return ok_({ buka: bukaDaftar_() }, buka ? (bukaDaftar_() ? 'Pendaftaran dibuka.' : 'Pendaftaran diaktifkan dan akan terbuka otomatis pada waktu buka.') : 'Pendaftaran ditutup sementara.');
}
function hEvKelTambah_(me, d) { // kelompok kustom, mis. SMP Kelas 7-9 gabungan
  const mn = toInt_(d.min, -1), mx = toInt_(d.max, -1); if (mn < 0 || mx > 12 || mx < mn) err_('Rentang kelas tidak valid (0–12).');
  const pre = function (k) { return k === 0 ? 'TK' : k <= 6 ? 'SD' : k <= 9 ? 'SMP' : 'SMA'; };
  if (pre(mn) !== pre(mx)) err_('Satu kelompok hanya untuk satu jenjang (TK/SD/SMP/SMA).');
  const kode = pre(mn) + (mn === 0 ? '' : '_' + mn + (mx > mn ? '_' + mx : '')), all = readT_('TBL_MASTER_JENJANG', true);
  if (all.some(function (j) { return j.kode_jenjang === kode; })) return ok_({ kode: kode }, 'Kelompok sudah ada.');
  const nama = String(d.nama || '').trim().slice(0, 60) || (pre(mn) + (mn === 0 ? '' : ' Kelas ' + mn + (mx > mn ? '-' + mx : '')));
  appendT_('TBL_MASTER_JENJANG', [{ jenjang_id: uid_('J'), kode_jenjang: kode, nama_jenjang: nama, kelas_min: mn, kelas_max: mx, urutan: all.reduce(function (m, j) { return Math.max(m, j.urutan); }, 0) + 1 }]);
  bust_('master'); audit_(me, 'KELOMPOK_BARU', 'Master', kode); return ok_({ kode: kode }, 'Kelompok ' + nama + ' ditambahkan.');
}

// ── Nomor lomba per event ──
function nomorDipakai_(eid) { return ['TBL_REGISTRASI_ENTRI', 'TBL_HEAT_SEEDS', 'TBL_RACE_RESULTS'].some(function (tb) { return readT_(tb).some(function (r) { return r.event_id === eid; }); }); }
function evNomorId_() { return uid_('N'); } // ID unik lintas event (nomor acara boleh sama di event berbeda)
function hEvNomorSimpan_(me, d) {
  evMigrasi_(); const c = cfg_(), ev = evByMusim_(String(d.musim || c.musim)); if (!ev) err_('Event tidak ditemukan.');
  const e = d.rec || {}, all = readT_('TBL_MASTER_NOMOR_LOMBA', true), mine = all.filter(function (n) { return n.musim === ev.musim; }), kel = evKel_(ev);
  const no = toInt_(e.event_no), dist = toInt_(e.distance_m), gs = e.gender === 'KEDUANYA' ? ['PUTRA', 'PUTRI'] : [e.gender];
  if (no <= 0 || no > 9999) err_('Nomor acara harus angka 1–9999.'); if (dist <= 0 || dist > 1500) err_('Jarak tidak valid.');
  if (GAYA.indexOf(e.stroke_type) < 0) err_('Gaya tidak valid.'); if (gs.some(function (g) { return ['PUTRA', 'PUTRI'].indexOf(g) < 0; })) err_('Gender tidak valid.');
  if (kel[e.jenjang_kode] === undefined) err_('Kelompok tidak termasuk dalam event ini. Atur kelompok di pengaturan event.');
  const fee = ev.biaya_mode === 'PAKET' ? evFeePaket_(ev) : toInt_(e.fee_amount, ev.biaya_nomor); if (fee < 0) err_('Biaya tidak valid.');
  const q = toInt_(e.max_quota, 0); if (q < 0 || q > 10000) err_('Kuota per nomor 0–10000 (0 = tanpa batas).');
  const hari = Math.min(9, Math.max(1, toInt_(e.hari, 1))), buka = e.dibuka === false || e.dibuka === '0' || e.dibuka === 0 ? '0' : '1', main = e.is_active === false || e.is_active === '0' || e.is_active === 0 ? 0 : 1;
  const dupKombo = function (g, skip) { return mine.some(function (n) { return n.event_id !== skip && n.distance_m === dist && n.stroke_type === e.stroke_type && n.gender === g && n.jenjang_kode === e.jenjang_kode; }); };
  const cur = e.event_id ? all.filter(function (n) { return n.event_id === String(e.event_id); })[0] : null;
  if (e.event_id && !cur) err_('Nomor tidak ditemukan.');
  if (cur) {
    if (cur.musim !== ev.musim) err_('Nomor bukan milik event ini.');
    if (mine.some(function (n) { return n.event_no === no && n.event_id !== cur.event_id; })) err_('Nomor acara #' + no + ' sudah dipakai di event ini.');
    const ubahInti = cur.distance_m !== dist || cur.stroke_type !== e.stroke_type || cur.gender !== gs[0] || cur.jenjang_kode !== e.jenjang_kode;
    if (ubahInti && nomorDipakai_(cur.event_id)) err_('Nomor ini sudah punya pendaftar/hasil: jarak, gaya, gender, dan kelompok tidak bisa diubah.');
    if (ubahInti && dupKombo(gs[0], cur.event_id)) err_('Kombinasi nomor ini sudah ada di event.');
    Object.assign(cur, { event_no: no, event_name: dist + 'm ' + e.stroke_type, course_type: ev.kolam, jenjang_kode: e.jenjang_kode, gender: gs[0], distance_m: dist, stroke_type: e.stroke_type, fee_amount: fee, max_quota: q, hari: hari, is_active: main, dibuka: buka });
    saveRows_('TBL_MASTER_NOMOR_LOMBA', [cur]);
  } else {
    const rows = gs.map(function (g, i) {
      const n = no + i; if (mine.some(function (x) { return x.event_no === n; })) err_('Nomor acara #' + n + ' sudah dipakai di event ini.'); if (dupKombo(g)) err_('Nomor ' + dist + 'm ' + e.stroke_type + ' ' + g + ' untuk kelompok ini sudah ada.');
      return { event_id: evNomorId_(all, n), event_no: n, event_name: dist + 'm ' + e.stroke_type, course_type: ev.kolam, jenjang_kode: e.jenjang_kode, gender: g, distance_m: dist, stroke_type: e.stroke_type, fee_amount: fee, max_quota: q, hari: hari, sesi: 'Pagi', jam: '', is_active: main, musim: ev.musim, dibuka: buka };
    });
    rows.forEach(function (r) { all.push(r); }); appendT_('TBL_MASTER_NOMOR_LOMBA', rows);
  }
  delete _MEMO.__jd; bust_('master', 'hasil'); audit_(me, 'NOMOR_SIMPAN', 'Nomor', ev.musim + ' #' + no);
  return ok_(null, cur ? 'Nomor lomba tersimpan.' : (gs.length > 1 ? 'Nomor putra & putri ditambahkan.' : 'Nomor lomba ditambahkan.'));
}
function hEvNomorHapus_(me, d) {
  const id = String(d.id || ''), all = readT_('TBL_MASTER_NOMOR_LOMBA', true), cur = all.filter(function (x) { return x.event_id === id; })[0]; if (!cur) err_('Nomor tidak ditemukan.');
  if (nomorDipakai_(id)) { cur.is_active = 0; cur.dibuka = '0'; saveRows_('TBL_MASTER_NOMOR_LOMBA', [cur]); bust_('master', 'hasil'); audit_(me, 'NOMOR_BATAL', 'Nomor', id); return ok_(null, 'Nomor sudah punya pendaftar, jadi dibatalkan (tidak dihapus). Pindahkan pesertanya lewat Akun & Berkas.'); }
  rewriteT_('TBL_MASTER_NOMOR_LOMBA', all.filter(function (x) { return x.event_id !== id; })); delete _MEMO.__jd; bust_('master', 'hasil'); audit_(me, 'NOMOR_HAPUS', 'Nomor', id);
  return ok_(null, 'Nomor dihapus.');
}
function hEvNomorMassal_(me, d) {
  const c = cfg_(), musim = String(d.musim || c.musim), aksi = String(d.aksi || ''), ids = {}; (Array.isArray(d.ids) ? d.ids : []).forEach(function (i) { ids[String(i)] = 1; });
  if (['buka', 'tutup', 'batal', 'pulih', 'hari', 'kuota', 'hapus'].indexOf(aksi) < 0) err_('Aksi tidak dikenal.');
  const all = readT_('TBL_MASTER_NOMOR_LOMBA', true), sel = all.filter(function (n) { return n.musim === musim && ids[n.event_id]; }); if (!sel.length) err_('Pilih nomor terlebih dahulu.');
  if (aksi === 'hapus') {
    const pakai = {}; ['TBL_REGISTRASI_ENTRI', 'TBL_HEAT_SEEDS', 'TBL_RACE_RESULTS'].forEach(function (tb) { readT_(tb).forEach(function (r) { pakai[r.event_id] = 1; }); });
    const batal = sel.filter(function (n) { return pakai[n.event_id]; }); batal.forEach(function (n) { n.is_active = 0; n.dibuka = '0'; });
    const keep = all.filter(function (n) { return !(n.musim === musim && ids[n.event_id] && !pakai[n.event_id]); }); rewriteT_('TBL_MASTER_NOMOR_LOMBA', keep);
    delete _MEMO.__jd; bust_('master', 'hasil'); audit_(me, 'NOMOR_HAPUS_MASSAL', 'Nomor', musim + ' ' + sel.length);
    return ok_(null, (sel.length - batal.length) + ' nomor dihapus' + (batal.length ? ', ' + batal.length + ' nomor yang punya pendaftar dibatalkan' : '') + '.');
  }
  const hari = Math.min(9, Math.max(1, toInt_(d.hari, 1))), q = toInt_(d.kuota, 0); if (aksi === 'kuota' && (q < 0 || q > 10000)) err_('Kuota 0–10000.');
  sel.forEach(function (n) { if (aksi === 'buka') n.dibuka = '1'; else if (aksi === 'tutup') n.dibuka = '0'; else if (aksi === 'batal') { n.is_active = 0; n.dibuka = '0'; } else if (aksi === 'pulih') n.is_active = 1; else if (aksi === 'hari') n.hari = hari; else if (aksi === 'kuota') n.max_quota = q; });
  saveRows_('TBL_MASTER_NOMOR_LOMBA', sel); delete _MEMO.__jd; bust_('master', 'hasil'); audit_(me, 'NOMOR_' + aksi.toUpperCase(), 'Nomor', musim + ' ' + sel.length);
  const L = { buka: 'dibuka untuk pendaftaran', tutup: 'ditutup untuk pendaftaran', batal: 'dibatalkan', pulih: 'dipertandingkan kembali', hari: 'dipindah ke hari ' + hari, kuota: 'diberi kuota ' + (q || 'tanpa batas') };
  return ok_(null, sel.length + ' nomor ' + L[aksi] + '.');
}
// Generator: plan = [{jk, s (gaya), d (jarak)}], urut GAYA|KELOMPOK, mulai = no acara awal
function evUrutPlan_(plan, urut, jUrut) {
  return plan.slice().sort(function (a, b) {
    const g = (EV_GAYA_URUT[a.s] || 9) - (EV_GAYA_URUT[b.s] || 9), dd = a.d - b.d, k = (jUrut[a.jk] || 99) - (jUrut[b.jk] || 99);
    return urut === 'KELOMPOK' ? (k || g || dd) : (g || dd || k);
  });
}
function hEvNomorGen_(me, d) {
  evMigrasi_(); const c = cfg_(), ev = evByMusim_(String(d.musim || c.musim)); if (!ev) err_('Event tidak ditemukan.');
  const kel = evKel_(ev), jUrut = {}; readT_('TBL_MASTER_JENJANG').forEach(function (j) { jUrut[j.kode_jenjang] = j.urutan; });
  const plan = (Array.isArray(d.plan) ? d.plan : []).map(function (p) { return { jk: String(p.jk || ''), s: String(p.s || ''), d: toInt_(p.d), h: Math.min(9, Math.max(1, toInt_(p.h, 1))) }; }).filter(function (p) { return kel[p.jk] !== undefined && GAYA.indexOf(p.s) >= 0 && p.d > 0 && p.d <= 1500; });
  if (!plan.length) err_('Centang minimal satu jarak pada kelompok event.');
  const all = readT_('TBL_MASTER_NOMOR_LOMBA', true), mine = all.filter(function (n) { return n.musim === ev.musim; }), ada = {}, pakaiNo = {};
  mine.forEach(function (n) { ada[[n.jenjang_kode, n.stroke_type, n.distance_m, n.gender].join('|')] = 1; pakaiNo[n.event_no] = 1; });
  let no = toInt_(d.mulai, 0) || (mine.reduce(function (m, n) { return Math.max(m, n.event_no); }, 0) + 1);
  const fee = ev.biaya_mode === 'PAKET' ? evFeePaket_(ev) : ev.biaya_nomor, rows = []; let lewat = 0;
  evUrutPlan_(plan, d.urut, jUrut).forEach(function (p) {
    ['PUTRA', 'PUTRI'].forEach(function (g) {
      if (ada[[p.jk, p.s, p.d, g].join('|')]) { lewat++; return; }
      while (pakaiNo[no]) no++; pakaiNo[no] = 1;
      const r = { event_id: evNomorId_(all.concat(rows), no), event_no: no, event_name: p.d + 'm ' + p.s, course_type: ev.kolam, jenjang_kode: p.jk, gender: g, distance_m: p.d, stroke_type: p.s, fee_amount: fee, max_quota: 0, hari: p.h, sesi: 'Pagi', jam: '', is_active: 1, musim: ev.musim, dibuka: '1' };
      rows.push(r); no++;
    });
  });
  if (rows.length) appendT_('TBL_MASTER_NOMOR_LOMBA', rows);
  delete _MEMO.__jd; bust_('master', 'hasil'); audit_(me, 'NOMOR_GENERATOR', 'Nomor', ev.musim + ' ' + rows.length);
  return ok_({ n: rows.length, lewat: lewat }, rows.length + ' nomor dibuat' + (lewat ? ', ' + lewat + ' sudah ada dilewati' : '') + '.');
}
function hEvNomorRapikan_(me, d) {
  const c = cfg_(), musim = String(d.musim || c.musim), mulai = Math.max(1, toInt_(d.mulai, 1));
  if (musim === c.musim && FASE.indexOf(c.fase || 'PENDAFTARAN') >= FASE.indexOf('BUKU_ACARA')) err_('Buku Acara sudah terbit; nomor acara tidak diubah agar sama dengan dokumen.');
  const all = readT_('TBL_MASTER_NOMOR_LOMBA', true), mine = all.filter(function (n) { return n.musim === musim && n.is_active; }).sort(function (a, b) { return a.hari - b.hari || a.event_no - b.event_no; });
  const lain = all.filter(function (n) { return n.musim === musim && !n.is_active; }); let no = mulai;
  mine.forEach(function (n) { n.event_no = no++; }); lain.forEach(function (n) { n.event_no = no++; });
  saveRows_('TBL_MASTER_NOMOR_LOMBA', mine.concat(lain)); delete _MEMO.__jd; bust_('master', 'hasil'); audit_(me, 'NOMOR_RAPIKAN', 'Nomor', musim);
  return ok_(null, 'Nomor acara dirapikan: #' + mulai + '–#' + (no - 1) + ' (urut hari lalu nomor lama).');
}

// ── Kalender beranda: event aktif + event lain yang diumumkan & belum lewat ──
function agendaBeranda_() {
  const c = cfg_(), now = Date.now(), H = evHitung_();
  return evRows_().filter(function (r) { return r.musim === c.musim || (r.status === 'TERBIT' && r.tgl_mulai && !(waktuLokal_(r.tgl_selesai || r.tgl_mulai, true) < now)); }).map(function (r) {
    const aktif = r.musim === c.musim;
    return { musim: r.musim, nama: r.nama, tingkat: r.tingkat, mulai: r.tgl_mulai, selesai: r.tgl_selesai, venue: r.venue, kota: r.kota, kuota: Number(r.kuota_atlet) || 0, terisi: Object.keys((H[r.musim] || { a: {} }).a).length, aktif: aktif, st: evStatusOf_(r, c, now), daftar: evDaftarOf_(r, c, now), tutup: r.daftar_tutup, buka: r.daftar_mulai };
  }).sort(function (a, b) { return (b.aktif ? 1 : 0) - (a.aktif ? 1 : 0) || String(a.mulai).localeCompare(String(b.mulai)); }).slice(0, 6);
}

// ── Info lomba publik ──
function hPubEvent_() {
  return ok_(cachedPub_(['master', 'atlet'], 'event', 120, function () {
    const c = cfg_(), ev = evRows_().filter(function (r) { return r.musim === c.musim; })[0] || null, H = evHitung_()[c.musim] || { a: {}, n: {} };
    const info = ev ? evInfo_(ev) : {}; EV_INFO_RAHASIA.forEach(function (k) { delete info[k]; });
    const kel = ev ? evKel_(ev) : {}, evs = readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (e) { return e.is_active; }).sort(function (a, b) { return a.event_no - b.event_no; });
    const E = ev || { nama: c.app_name, musim: c.musim, tingkat: c.tingkat_event, tgl_mulai: c.tanggal_mulai, tgl_selesai: c.tanggal_selesai, venue: c.lokasi, kolam: c.kolam || '', lintasan: Number(c.jumlah_lintasan) || 8, daftar_mulai: c.registrasi_mulai, daftar_tutup: c.registrasi_deadline, kuota_atlet: Number(c.kuota_atlet) || 0, biaya_mode: c.biaya_mode, biaya_paket: Number(c.biaya_paket) || 0, nomor_min: Number(c.min_nomor) || 1, nomor_max: Number(c.max_individu) || 3, min_peserta: Number(c.min_peserta) || 0, tipe_akun: c.tipe_akun };
    return {
      ev: { nama: E.nama, musim: E.musim, tingkat: E.tingkat || '', wilayah: E.wilayah || '', penyelenggara: E.penyelenggara || '', tgl_mulai: E.tgl_mulai || '', tgl_selesai: E.tgl_selesai || '', tanggal_teks: c.tanggal_teks, venue: E.venue || '', alamat: E.alamat || '', kota: E.kota || '', maps: E.maps_url || '', kolam: E.kolam || '', lintasan: E.lintasan, daftar_mulai: E.daftar_mulai || '', daftar_tutup: E.daftar_tutup || '', kuota: E.kuota_atlet || 0, mode: E.biaya_mode === 'PAKET' ? 'PAKET' : 'NOMOR', paket: E.biaya_paket || 0, biaya_nomor: E.biaya_nomor || 0, nmin: E.nomor_min || 1, nmax: E.nomor_max || 3, minp: E.min_peserta || 0, tipe: String(E.tipe_akun || EV_TIPE.join(',')).split(','), info: info },
      buka: bukaDaftar_(), terisi: Object.keys(H.a).length, fase: c.fase || 'PENDAFTARAN',
      kel: jenjangAktif_().map(function (j) { return { kode: j.kode_jenjang, huruf: kel[j.kode_jenjang] || '', nama: j.nama_jenjang, min: j.kelas_min, max: j.kelas_max, nomor: evs.filter(function (e) { return e.jenjang_kode === j.kode_jenjang; }).map(function (e) { return { id: e.event_id, no: e.event_no, d: e.distance_m, s: e.stroke_type, g: e.gender, b: e.dibuka !== '0' ? 1 : 0, q: Number(e.max_quota) || 0, n: H.n[e.event_id] || 0, hari: e.hari }; }) }; })
    };
  }));
}

// ── Akun demo (sekolah, klub, mandiri) ──
const EV_DEMO = [
  { id: 'DEMO-SEKOLAH', tipe: 'SEKOLAH', nama: 'SMP Demo Tirta Pelajar', login: '99990001', email: 'demo.sekolah@krp.test', kota: 'Jakarta Selatan', atlet: [[7, 'PUTRA', 'Demo Raka Pratama'], [7, 'PUTRI', 'Demo Salsa Anindya'], [8, 'PUTRA', 'Demo Bima Santoso'], [9, 'PUTRI', 'Demo Nayla Lestari']] },
  { id: 'DEMO-KLUB', tipe: 'KLUB', nama: 'Klub Renang Demo Bahari', login: 'DEMO-KLUB', email: 'demo.klub@krp.test', kota: 'Kota Depok', atlet: [[1, 'PUTRI', 'Demo Alya Kirana', 'SD Demo Harapan'], [2, 'PUTRA', 'Demo Rafa Aditya', 'SD Demo Harapan'], [3, 'PUTRA', 'Demo Kenzo Wijaya', 'SD Demo Harapan'], [4, 'PUTRI', 'Demo Keisha Ramadhani', 'SD Demo Harapan'], [5, 'PUTRA', 'Demo Farhan Hidayat', 'SD Demo Harapan'], [6, 'PUTRI', 'Demo Tiara Maharani', 'SD Demo Harapan'], [10, 'PUTRA', 'Demo Dimas Saputra', 'SMA Demo Nusantara'], [11, 'PUTRI', 'Demo Zahra Aulia', 'SMA Demo Nusantara']] },
  { id: 'DEMO-MANDIRI', tipe: 'MANDIRI', nama: 'Demo Atlet Mandiri', login: 'demo.mandiri@krp.test', email: 'demo.mandiri@krp.test', kota: 'Kota Bekasi', atlet: [[4, 'PUTRA', 'Demo Atlet Mandiri', 'SD Demo Harapan']] }
];
function evDemoInfo_() {
  const ks = readT_('TBL_KONTINGEN').filter(function (k) { return EV_DEMO.some(function (x) { return x.id === k.kontingen_id; }); });
  if (!ks.length) return { ada: false, akun: [] };
  const atl = readT_('TBL_ATLET').filter(function (a) { return evAkunDemo_(a.kontingen_id) && a.status_atlet === 'ACTIVE'; }), c = cfg_();
  const ent = readT_('TBL_REGISTRASI_ENTRI').filter(function (e) { return evAkunDemo_(e.kontingen_id) && e.musim === c.musim; });
  return { ada: true, akun: ks.map(function (k) { const as = atl.filter(function (a) { return a.kontingen_id === k.kontingen_id; }); return { id: k.kontingen_id, tipe: k.tipe_lembaga, nama: k.nama_lembaga, login: k.npsn_or_sk, st: k.status_akun, atlet: as.map(function (a) { return { nama: a.nama_lengkap, g: a.jenis_kelamin, kelas: a.kelas_num, jk: jenjangOf_(a.kelas_num) || a.jenjang_kode }; }), entri: ent.filter(function (e) { return e.kontingen_id === k.kontingen_id; }).length }; }) };
}
function hEvDemo_(me, d) {
  evMigrasi_(); const pw = sandiBaru_(d.sandi), salt = Utilities.getUuid(), hash = hashPass_(pw, salt), t = nowIso_(), ks = readT_('TBL_KONTINGEN', true);
  const ada = ks.filter(function (k) { return EV_DEMO.some(function (x) { return x.id === k.kontingen_id; }); });
  if (ada.length) {
    ada.forEach(function (k) { k.pass_salt = salt; k.pass_hash = hash; k.status_akun = 'ACTIVE'; revokeAll_(k.kontingen_id); }); saveRows_('TBL_KONTINGEN', ada); bust_('user');
    audit_(me, 'DEMO_SANDI', 'Kontingen', ada.length + ' akun'); return ok_({ sandi: pw, info: evDemoInfo_() }, 'Kata sandi akun demo diperbarui.');
  }
  EV_DEMO.forEach(function (x) { if (ks.some(function (k) { return k.npsn_or_sk.toLowerCase() === x.login.toLowerCase() || k.pj_email.toLowerCase() === x.email; })) err_('Identitas login demo ' + x.login + ' sudah dipakai akun lain.'); });
  let fid = ''; try { fid = DriveApp.getFolderById(prop_('FOLDER_BERKAS')).createFolder('DEMO - Akun Uji Coba').getId(); } catch (e) { }
  const th = new Date().getFullYear(), A = [];
  appendT_('TBL_KONTINGEN', EV_DEMO.map(function (x) { return { kontingen_id: x.id, tipe_lembaga: x.tipe, nama_lembaga: x.nama, npsn_or_sk: x.login, provinsi: x.kota === 'Kota Depok' || x.kota === 'Kota Bekasi' ? 'Jawa Barat' : 'DKI Jakarta', kota_kabupaten: x.kota, alamat: 'Akun uji coba (demo)', jenjang_utama: '', pj_nama: x.tipe === 'MANDIRI' ? x.nama : 'Pendamping Demo', pj_jabatan: x.tipe === 'MANDIRI' ? 'Orang tua / Atlet' : x.tipe === 'SEKOLAH' ? 'Guru PJOK' : 'Pelatih', pj_telepon: '081200000000', pj_email: x.email, pass_hash: hash, pass_salt: salt, drive_folder_id: fid, mandat_file_id: '', status_akun: 'ACTIVE', created_at: t }; }));
  let n = 0;
  EV_DEMO.forEach(function (x) {
    x.atlet.forEach(function (a) {
      n++; const kelas = a[0];
      A.push({ atlet_id: 'DEMO-A' + ('0' + n).slice(-2), bib: 'DM-' + ('00' + n).slice(-3), nisn: '99990' + ('0000' + n).slice(-5), nama_lengkap: a[2], jenis_kelamin: a[1], tempat_lahir: 'Jakarta', tanggal_lahir: (th - kelas - 6) + '-03-' + ('0' + (n % 27 + 1)).slice(-2), kontingen_id: x.id, sekolah_nama: x.tipe === 'SEKOLAH' ? x.nama : (a[3] || 'SD Demo Harapan'), klub_nama: x.tipe === 'KLUB' ? x.nama : '', kelas_num: kelas, jenjang_kode: jenjangOf_(kelas) || jenjangOfAll_(kelas), provinsi_asal: 'DKI Jakarta', kota_asal: x.kota, hp_kontak: '081200000000', foto_file_id: '', akta_file_id: '', surat_file_id: '', sosmed_file_id: '', status_atlet: 'ACTIVE', created_at: t });
    });
  });
  appendT_('TBL_ATLET', A); bust_('user', 'atlet'); audit_(me, 'DEMO_BUAT', 'Kontingen', EV_DEMO.length + ' akun, ' + A.length + ' atlet');
  return ok_({ sandi: pw, info: evDemoInfo_() }, 'Akun demo dibuat. Catat kata sandinya — hanya tampil sekali.');
}
function hEvDemoHapus_(me) { // hanya akun uji coba; data contoh isiDataContoh dihapus lewat hapusDataContoh()
  const del = function (tb, f) { const all = readT_(tb, true), keep = all.filter(function (r) { return !f(r); }); if (keep.length !== all.length) rewriteT_(tb, keep); return all.length - keep.length; };
  const ks = readT_('TBL_KONTINGEN', true).filter(function (k) { return evAkunDemo_(k.kontingen_id); }), dirs = {}, aid = {};
  ks.forEach(function (k) { if (k.drive_folder_id) dirs[k.drive_folder_id] = 1; revokeAll_(k.kontingen_id); });
  readT_('TBL_ATLET', true).forEach(function (a) { if (evAkunDemo_(a.kontingen_id)) aid[a.atlet_id] = 1; });
  const nK = del('TBL_KONTINGEN', function (r) { return evAkunDemo_(r.kontingen_id); }), nA = del('TBL_ATLET', function (r) { return evAkunDemo_(r.kontingen_id); });
  const nE = del('TBL_REGISTRASI_ENTRI', function (r) { return evAkunDemo_(r.kontingen_id) || aid[r.atlet_id]; });
  del('TBL_HEAT_SEEDS', function (r) { return aid[r.atlet_id]; }); del('TBL_RACE_RESULTS', function (r) { return aid[r.atlet_id]; }); del('TBL_MUTASI_ATLET', function (r) { return evAkunDemo_(r.kontingen_id); });
  Object.keys(dirs).forEach(function (id) { try { DriveApp.getFolderById(id).setTrashed(true); } catch (e) { } });
  delete _MEMO.__jd; delete _MEMO.__evH; bust_('user', 'atlet', 'hasil'); audit_(me, 'DEMO_HAPUS', 'Kontingen', nK + ' akun, ' + nA + ' atlet, ' + nE + ' entri');
  return ok_({ akun: nK, atlet: nA, entri: nE }, 'Data demo dihapus: ' + nK + ' akun, ' + nA + ' atlet, ' + nE + ' entri.');
}

// ── Preset dari pedoman: KRP Jabodetabek Short Course Series II 2026 (27–28 Nov 2026) ──
const EV_PRESET_MUSIM = 'Short Course Seri II 2026';
function evPresetKRP_() {
  const K = { A: 'SD_1_2', B: 'SD_3_4', C: 'SD_5_6', D: 'SMP_7', E: 'SMP_8_9', F: 'SMA_10_12' }, BB = 'Gaya Bebas', DD = 'Gaya Dada', PG = 'Gaya Punggung', KP = 'Gaya Kupu-kupu', IM = 'Gaya Ganti Perorangan';
  // Susunan acara: blok [hari, jarak, gaya, kelompok]; tiap kelompok putra lalu putri (gaya penomoran panitia KRP).
  const P = [[1, 200, IM, 'CDEF'], [1, 50, BB, 'ABCDEF'], [1, 25, DD, 'A'], [1, 100, PG, 'BCDEF'], [1, 50, KP, 'ABCDEF'], [1, 200, BB, 'CDEF'], [1, 100, DD, 'BCDEF'], [1, 25, PG, 'A'], [1, 25, BB, 'A'], [1, 400, BB, 'F'],
    [2, 100, IM, 'AB'], [2, 50, DD, 'ABCDEF'], [2, 100, BB, 'BCDEF'], [2, 25, KP, 'A'], [2, 50, PG, 'ABCDEF'], [2, 200, DD, 'DEF'], [2, 100, KP, 'BCDEF'], [2, 200, PG, 'DEF'], [2, 200, KP, 'DEF']];
  const nomor = []; let no = 1;
  P.forEach(function (b) { b[3].split('').forEach(function (h) { ['PUTRA', 'PUTRI'].forEach(function (g) { nomor.push({ no: no++, hari: b[0], d: b[1], s: b[2], jk: K[h], g: g }); }); }); });
  const L = function (a) { return a.join('\n'); };
  const ev = {
    musim: EV_PRESET_MUSIM, nama: 'Kejuaraan Renang Pelajar Jabodetabek Short Course Series II 2026', tingkat: 'Provinsi', wilayah: 'Jabodetabek (Jakarta, Bogor, Depok, Tangerang, Bekasi)', penyelenggara: '',
    tgl_mulai: '2026-11-27', tgl_selesai: '2026-11-28', venue: 'Kolam Renang Gelanggang Remaja Jakarta Selatan', alamat: 'Jl. Bulungan No. 1 Blok C', kota: 'Jakarta Selatan', maps_url: '', kolam: 'SCM', lintasan: Number(cfg_().jumlah_lintasan) || 8,
    daftar_mulai: '', daftar_tutup: '2026-11-20T12:00', kuota_atlet: 0, biaya_mode: 'PAKET', biaya_paket: 300000, biaya_nomor: 100000, nomor_min: 3, nomor_max: 3, min_peserta: 5, tipe_akun: 'SEKOLAH,KLUB,MANDIRI',
    kelompok: { SD_1_2: 'A', SD_3_4: 'B', SD_5_6: 'C', SMP_7: 'D', SMP_8_9: 'E', SMA_10_12: 'F' }, label_kelompok: 'KEDUANYA',
    info: {
      kontak_nama: 'Nadila', kontak_hp: '082327874782', wa_grup: 'https://chat.whatsapp.com/BAEsZgpzgoY2J8Q6p8YUEx?s=cl&p=a&mlu=4&ilr=4&iam=1', link_daftar: 'https://bit.ly/KRP_SHORT_COURSE',
      bank_nama: 'BCA', bank_norek: '0941677842', bank_an: 'Nadila', konfirmasi: 'Nadila — 082327874782', tgl_buku_acara: '2026-11-26',
      sistem: 'Semua nomor langsung final (timed final)', start: 'Peraturan 1 (satu) kali start', aturan: 'Peraturan Perlombaan World Aquatics', nt: '99:99.99 atau NT (non-seeded)',
      syarat: L(['Seluruh siswa/siswi SD, SMP, dan SMA atau sederajat di wilayah Jabodetabek (Jakarta, Bogor, Depok, Tangerang, Bekasi).', 'Melakukan pengisian data secara mandiri melalui tautan yang disampaikan panitia pelaksana.', 'Seluruh peserta/sekolah melampirkan scan rapor atau identitas pada tautan yang disiapkan, atau membawa fotokopi rapor terakhir dan/atau data diri masing-masing 1 lembar untuk diserahkan ke meja sekretariat pada hari penyelenggaraan.', 'Guru/pelatih/orang tua yang mendaftarkan bertanggung jawab penuh atas keabsahan data setiap peserta. Kecurangan persyaratan peserta berakibat perenang dinyatakan diskualifikasi.']),
      lomba: L(['Setiap peserta harus mengikuti 3 nomor perlombaan.', 'Menggunakan Peraturan Perlombaan World Aquatics.', 'Menggunakan peraturan 1 (satu) kali start dan semua nomor dilaksanakan langsung final (timed final).', 'Berenang melebar pada jarak 25 meter.', 'Jika peserta suatu nomor kurang dari 5, nomor perlombaan dibatalkan dan diinformasikan kepada peserta setelah periode pendaftaran berakhir.', 'Peserta hanya boleh didaftarkan dan berlomba pada nomor yang sesuai dengan Kelompok Pelajarnya.', 'Peserta wajib mencantumkan waktu terbaik terakhir; bila tidak mempunyai catatan waktu, dipakai waktu maksimal 99.99.99 atau NT (non-seeded).', 'Pendaftaran peserta ditutup pada 20 November 2026 pukul 12.00 WIB.', 'Buku Acara disampaikan pada 26 November 2026.', 'Guru/pelatih/orang tua yang mendaftarkan wajib mencantumkan nama pendaftar yang jelas dan nomor HP yang dapat dihubungi setiap saat.', 'Seluruh informasi perlombaan disampaikan melalui grup WhatsApp.']),
      bayar: L(['Biaya pendaftaran Rp 300.000 per peserta untuk 3 nomor (Kelompok A s/d F).', 'Pembayaran melalui transfer bank. Nomor rekening tampil di akun pendaftar setelah masuk.', 'Peserta yang telah mendaftar namun tidak dapat hadir pada hari pelaksanaan, biaya pendaftaran tidak dapat dikembalikan.', 'Konfirmasi pembayaran pendaftaran kepada saudari Nadila.']),
      penghargaan: L(['Juara I memperoleh medali emas dan piagam penghargaan.', 'Peringkat II memperoleh medali perak dan piagam penghargaan.', 'Peringkat III memperoleh medali perunggu dan piagam penghargaan.', 'Pemecah rekor KRP Jabodetabek Short Course Series II mendapatkan voucher belanja perlengkapan renang senilai Rp 250.000 dari sponsor.', 'Perenang terbaik masing-masing kelompok kelas mendapatkan trofi perenang terbaik.', 'Perenang terbaik masing-masing kelompok kelas mendapatkan voucher belanja perlengkapan renang senilai Rp 500.000 dari sponsor.', 'Seluruh peserta mendapatkan sertifikat partisipasi kegiatan.', 'Kegiatan didaftarkan kurasi ke Puspresnas.']),
      terbaik: L(['Perenang terbaik setiap kelompok ditentukan berdasarkan perolehan medali emas terbanyak.', 'Jika jumlah medali emas sama, ditentukan dari jumlah medali perak terbanyak.', 'Jika medali perak masih sama, ditentukan dari jumlah medali perunggu terbanyak.', 'Jika perolehan medali (emas, perak, perunggu) tetap sama, ditentukan dari poin FINA (FINA Point Scoring) tertinggi dari nomor yang diikuti.']),
      protes: L(['Panitia pelaksana merupakan institusi terakhir yang menentukan setiap persoalan yang belum/tidak tercantum dalam peraturan perlombaan; dimusyawarahkan oleh Ketua Perlombaan sebagai keputusan terakhir.', 'Protes disampaikan tertulis dan ditandatangani oleh manajer/pelatih/pihak sekolah.', 'Protes diajukan selambat-lambatnya 30 (tiga puluh) menit setelah acara/nomor perlombaan berakhir atau diumumkan, disertai uang jaminan Rp 2.000.000 sesuai peraturan World Aquatics.', 'Apabila protes ditolak, uang protes tidak dikembalikan.', 'Video rekaman atau foto dari orang tua/pelatih/guru tidak dapat dijadikan bukti untuk protes.', 'Hal-hal lain yang belum diatur akan disampaikan kemudian.', 'Setiap calon peserta dianggap telah membaca dan menyetujui seluruh panduan teknis perlombaan.']),
      kesehatan: L(['Seluruh peserta (termasuk peserta di bawah umur yang diwakili wali) wajib telah menjalani pemeriksaan medis, dinyatakan sehat, dan tidak memiliki riwayat atau kondisi penyakit yang membahayakan diri sendiri maupun pihak lain selama perlombaan.', 'Segala risiko kesehatan maupun insiden selama perlombaan sepenuhnya menjadi tanggung jawab peserta dan/atau wali peserta.', 'Panitia menyiapkan tim medis untuk pertolongan pertama.', 'Panitia menyiapkan lifeguard selama kegiatan berlangsung.', 'Penyelenggara dibebaskan dari segala tuntutan hukum, ganti rugi, maupun pertanggungjawaban atas kondisi medis atau kejadian yang tidak diinginkan di luar batas penanganan medis darurat standar yang disediakan panitia.']),
      lain: 'Series 1 Kejuaraan Renang Pelajar Jabodetabek Short Course 2026 mendapatkan kurasi Puspresnas dengan predikat Bintang 4.',
      uang_protes: '2000000', batas_protes: '30 menit'
    }
  };
  return { ev: ev, nomor: nomor };
}
function evPasangPreset_(me, aktifkan, ganti) {
  evMigrasi_(); const P = evPresetKRP_(); let all = readT_('TBL_EVENT', true);
  if (ganti) { // reset ulang: buang event & nomor lama dengan musim yang sama, lalu pasang dari pedoman
    rewriteT_('TBL_MASTER_NOMOR_LOMBA', readT_('TBL_MASTER_NOMOR_LOMBA', true).filter(function (x) { return x.musim !== P.ev.musim; }));
    all = all.filter(function (e) { return e.musim !== P.ev.musim; }); rewriteT_('TBL_EVENT', all);
  }
  if (all.some(function (r) { return r.musim === P.ev.musim; })) err_('Event "' + P.ev.musim + '" sudah ada di daftar event.');
  // pastikan kelompok A–F ada di master dengan rentang kelas yang benar
  const mj = readT_('TBL_MASTER_JENJANG', true), need = [['SD_1_2', 'SD Kelas 1-2', 1, 2], ['SD_3_4', 'SD Kelas 3-4', 3, 4], ['SD_5_6', 'SD Kelas 5-6', 5, 6], ['SMP_7', 'SMP Kelas 7', 7, 7], ['SMP_8_9', 'SMP Kelas 8-9', 8, 9], ['SMA_10_12', 'SMA Kelas 10-12', 10, 12]];
  let ur = mj.reduce(function (m, j) { return Math.max(m, j.urutan); }, 0); const addJ = [];
  need.forEach(function (n) { if (!mj.some(function (j) { return j.kode_jenjang === n[0]; })) addJ.push({ jenjang_id: uid_('J'), kode_jenjang: n[0], nama_jenjang: n[1], kelas_min: n[2], kelas_max: n[3], urutan: ++ur }); });
  if (addJ.length) { appendT_('TBL_MASTER_JENJANG', addJ); bust_('master'); }
  const ev = evBersih_(P.ev, null, all); ev.dibuat_oleh = me.nama + ' (preset pedoman)'; appendT_('TBL_EVENT', [ev]);
  const nomAll = readT_('TBL_MASTER_NOMOR_LOMBA', true), fee = evFeePaket_(ev), rows = [];
  P.nomor.forEach(function (n) { const r = { event_id: evNomorId_(nomAll.concat(rows), n.no), event_no: n.no, event_name: n.d + 'm ' + n.s, course_type: ev.kolam, jenjang_kode: n.jk, gender: n.g, distance_m: n.d, stroke_type: n.s, fee_amount: fee, max_quota: 0, hari: n.hari, sesi: 'Pagi', jam: '', is_active: 1, musim: ev.musim, dibuka: '1' }; rows.push(r); });
  appendT_('TBL_MASTER_NOMOR_LOMBA', rows); bust_('master'); audit_(me, 'EVENT_PRESET', 'Event', ev.musim + ' · ' + rows.length + ' nomor');
  if (aktifkan) { const all2 = readT_('TBL_EVENT', true); evAktifkan_(me, all2.filter(function (r) { return r.ev_id === ev.ev_id; })[0], all2); }
  return { id: ev.ev_id, musim: ev.musim, nomor: rows.length, aktif: !!aktifkan };
}
function hEvPreset_(me, d) { const r = evPasangPreset_(me, !!d.aktifkan); return ok_(r, 'Event dari pedoman dipasang: ' + r.nomor + ' nomor (Kelompok A–F)' + (r.aktif ? ' dan langsung aktif di web.' : '. Aktifkan bila sudah siap.')); }
/** Jalankan dari editor Apps Script bila ingin memasang event pedoman tanpa membuka web. */
function pasangEventPedomanKRP() {
  _SS = null; _MEMO = {}; const me = { id: 'editor', nama: 'Editor Apps Script', role: R.SA };
  const r = evPasangPreset_(me, true); flushAudit_(); Logger.log('✅ Event "' + r.musim + '" dipasang (' + r.nomor + ' nomor) dan aktif di web.');
}

// ── Susun acara dinamis (papan seret & lepas di menu Jadwal Acara) ──
function jdBatal_() { // nomor event aktif yang dibatalkan (tidak dipertandingkan)
  const m = cfg_().musim, H = evHitung_()[m] || { n: {} };
  return readT_('TBL_MASTER_NOMOR_LOMBA').filter(function (n) { return (!n.musim || n.musim === m) && !n.is_active; }).sort(function (a, b) { return a.event_no - b.event_no; })
    .map(function (n) { return { eid: n.event_id, no: n.event_no, nama: n.event_name, g: n.gender, jk: n.jenjang_kode, d: n.distance_m, hari: n.hari || 1, n: H.n[n.event_id] || 0 }; });
}
function hJdSusun_(me, d) {
  evMigrasi_(); const c = cfg_(), m = c.musim, all = readT_('TBL_MASTER_NOMOR_LOMBA', true), mine = all.filter(function (n) { return !n.musim || n.musim === m; }), by = idx_(mine, 'event_id');
  const urut = Array.isArray(d.urutan) ? d.urutan : [], batal = Array.isArray(d.batal) ? d.batal.map(String) : [], seen = {};
  urut.map(function (x) { return String(x.eid); }).concat(batal).forEach(function (id) { if (!by[id]) err_('Nomor tidak dikenal. Muat ulang halaman.'); if (seen[id]) err_('Nomor muncul dua kali di susunan.'); seen[id] = 1; });
  if (Object.keys(seen).length !== mine.length) err_('Susunan tidak lengkap (ada nomor baru/terhapus). Muat ulang halaman lalu susun lagi.');
  if (!urut.length) err_('Minimal satu nomor harus dipertandingkan.');
  const renum = !!d.renomor; if (renum && FASE.indexOf(c.fase || 'PENDAFTARAN') >= FASE.indexOf('BUKU_ACARA')) err_('Buku Acara sudah terbit: nomor acara tidak diubah. Simpan tanpa mengurutkan ulang nomor.');
  let man = {}; try { man = JSON.parse(c.jadwal_manual_json || '{}') || {}; } catch (e) { }
  const H = evHitung_()[m] || { n: {} }, upd = []; let no = Math.max(1, toInt_(d.mulai, 1)), pesertaBatal = 0, nBatalBaru = 0;
  const bersih = function (id, o) { if (Object.keys(o).length) man[id] = o; else delete man[id]; };
  urut.forEach(function (x, i) {
    const n = by[String(x.eid)], o = man[n.event_id] || {}; n.hari = Math.min(9, Math.max(1, toInt_(x.hari, 1))); if (!n.is_active) { n.is_active = 1; n.dibuka = '1'; }
    delete o.hari; if (renum) { n.event_no = no++; delete o.urut; } else o.urut = i + 1; bersih(n.event_id, o); upd.push(n);
  });
  batal.forEach(function (id) { const n = by[id]; if (n.is_active) { nBatalBaru++; pesertaBatal += H.n[n.event_id] || 0; } n.is_active = 0; n.dibuka = '0'; if (renum) n.event_no = no++; delete man[n.event_id]; upd.push(n); });
  saveRows_('TBL_MASTER_NOMOR_LOMBA', upd); cfgSet_(me, { jadwal_manual_json: JSON.stringify(man) }); delete _MEMO.__jd; bust_('master', 'hasil');
  audit_(me, 'SUSUN_ACARA', 'Jadwal', urut.length + ' nomor, ' + batal.length + ' batal' + (renum ? ', renomor' : ''));
  return ok_({ pesertaBatal: pesertaBatal, batalBaru: nBatalBaru }, 'Susunan acara disimpan: ' + urut.length + ' nomor dipertandingkan' + (batal.length ? ', ' + batal.length + ' dibatalkan' : '') + (renum ? '; nomor acara kini #' + Math.max(1, toInt_(d.mulai, 1)) + '–#' + (Math.max(1, toInt_(d.mulai, 1)) + urut.length - 1) : '') + '.' + (pesertaBatal ? ' Perhatian: ' + pesertaBatal + ' entri ada di nomor yang baru dibatalkan — pindahkan pesertanya lewat Akun & Berkas.' : ''));
}

// ============================================================
// KLAIM PRESTASI — hasil kejuaraan lama (impor Super Admin) diklaim akun sekolah/klub/mandiri
// untuk atletnya bila nama & identitas cocok. Cocok kuat (nama sama + sekolah/klub sama + kelas wajar)
// langsung sah; selain itu menunggu persetujuan panitia (menu Klaim Prestasi).
// ============================================================
function nmN_(s) { let t = String(s || '').toLowerCase(); try { t = t.normalize('NFD').replace(/[̀-ͯ]/g, ''); } catch (e) { } return t.replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
function skN_(s) { return nmN_(s).replace(/\b(sd|smp|sma|smk) negeri\b/g, '$1n').replace(/\bsekolah dasar\b/g, 'sd').replace(/\bnegeri\b/g, 'n').replace(/\b0+(\d)/g, '$1').replace(/\s+/g, ''); }
function cocokNama_(a, b) {
  a = nmN_(a); b = nmN_(b); if (!a || !b) return 0; if (a === b) return 2;
  const A = a.split(' '), B = b.split(' '); if (A.slice().sort().join(' ') === B.slice().sort().join(' ')) return 2;
  const k = A.length <= B.length ? A : B, g = A.length <= B.length ? B : A; return k.length >= 2 && k.every(function (w) { return g.indexOf(w) >= 0; }) ? 1 : 0;
}
function cocokLembaga_(a, b) { a = skN_(a); b = skN_(b); return !!(a && b && (a === b || (a.length >= 5 && b.indexOf(a) >= 0) || (b.length >= 5 && a.indexOf(b) >= 0))); }
function thAjar_(t) { const m = /^(\d{4})-(\d{2})/.exec(String(t || '')); return m ? (+m[2] >= 7 ? +m[1] : +m[1] - 1) : null; }
function kelasCocok_(a, r) { // kelas di arsip + selisih tahun ajaran ≈ kelas atlet sekarang (toleransi 1)
  if (r.kelas === '' || r.kelas == null || String(r.kelas) === '') return null; const t0 = thAjar_(r.tanggal); if (t0 === null) return null;
  const n = new Date(), t1 = n.getMonth() >= 6 ? n.getFullYear() : n.getFullYear() - 1; return Math.abs(Number(a.kelas_num) - (Number(r.kelas) + (t1 - t0))) <= 1;
}
function rankArsip_(musims) { const m = {}; musims.forEach(function (ms) { arsipNormal_(ms).forEach(function (r) { if (r.id) m[r.id] = { rank: r.rank || 0, medal: r.medal || '' }; }); }); return m; }
function barisArsip_(r, rk, meta) { const x = rk[r.arsip_id] || {}, mt = meta[r.musim] || {}; return { id: r.arsip_id, musim: r.musim, event: mt.event || ('Arsip ' + r.musim), tanggal: r.tanggal || mt.tanggal || '', kolam: kolR_(r, meta), nomor: r.distance_m + 'm ' + r.stroke_type, label: r.event_label, no: r.no_acara, jk: r.jenjang_kode, g: r.gender, nama: r.nama_atlet, sk: r.sekolah, kl: r.klub, kelas: r.kelas, waktu: r.status === 'OK' ? r.waktu : r.status, rank: x.rank || 0, medal: x.medal || '', klaim: r.klaim_status || '' }; }
function prestasiArsip_(aid, sahSaja) {
  const rows = readT_('TBL_HASIL_ARSIP').filter(function (r) { return r.atlet_id === aid && (r.klaim_status === 'SAH' || (!sahSaja && r.klaim_status === 'MENUNGGU')); }); if (!rows.length) return [];
  const rk = rankArsip_(Object.keys(rows.reduce(function (o, r) { o[r.musim] = 1; return o; }, {}))), meta = arsipMeta_();
  return rows.map(function (r) { return barisArsip_(r, rk, meta); }).sort(function (a, b) { return String(b.tanggal).localeCompare(String(a.tanggal)) || a.no - b.no; });
}
function atletMilik_(me, id) { const a = readT_('TBL_ATLET').filter(function (x) { return x.atlet_id === String(id || '') && x.kontingen_id === me.id && x.status_atlet === 'ACTIVE'; })[0]; if (!a) err_('Atlet tidak ditemukan pada akun Anda.'); return a; }
function kandidatKlaim_(a, rows) {
  return rows.filter(function (r) { return r.gender === a.jenis_kelamin && (!r.atlet_id || (r.klaim_status === 'DITOLAK' && r.atlet_id !== a.atlet_id)) && cocokNama_(r.nama_atlet, a.nama_lengkap) > 0; }).map(function (r) {
    const n = cocokNama_(r.nama_atlet, a.nama_lengkap), l = cocokLembaga_(r.sekolah, a.sekolah_nama) || cocokLembaga_(r.klub, a.klub_nama) || cocokLembaga_(r.sekolah, a.klub_nama) || cocokLembaga_(r.klub, a.sekolah_nama), k = kelasCocok_(a, r);
    return { r: r, nama: n, lembaga: l, kelas: k, auto: n === 2 && l && k !== false };
  });
}
function hKlaimCari_(me, d) {
  const all = readT_('TBL_HASIL_ARSIP');
  if (!d.atletId) { // ringkasan per atlet untuk beranda akun
    const per = {}; readT_('TBL_ATLET').filter(function (a) { return a.kontingen_id === me.id && a.status_atlet === 'ACTIVE'; }).forEach(function (a) { const n = kandidatKlaim_(a, all).length; if (n) per[a.atlet_id] = n; }); return ok_({ per: per });
  }
  const a = atletMilik_(me, d.atletId), kd = kandidatKlaim_(a, all).slice(0, 200), meta = arsipMeta_(), rk = rankArsip_(Object.keys(kd.reduce(function (o, x) { o[x.r.musim] = 1; return o; }, {})));
  return ok_({ atlet: { id: a.atlet_id, nama: a.nama_lengkap, sk: a.sekolah_nama, kl: a.klub_nama, kelas: a.kelas_num }, sudah: prestasiArsip_(a.atlet_id, false), kandidat: kd.map(function (x) { const o = barisArsip_(x.r, rk, meta); o.cn = x.nama; o.cl = x.lembaga; o.ck = x.kelas; o.auto = x.auto; return o; }).sort(function (p, q) { return (q.auto ? 1 : 0) - (p.auto ? 1 : 0) || String(q.tanggal).localeCompare(String(p.tanggal)); }) });
}
function hKlaim_(me, d) {
  const a = atletMilik_(me, d.atletId), ids = (Array.isArray(d.ids) ? d.ids : []).map(String); if (!ids.length) err_('Pilih hasil yang akan diklaim.');
  ensureHdr_('TBL_HASIL_ARSIP'); const all = readT_('TBL_HASIL_ARSIP', true), kd = idx_(kandidatKlaim_(a, all).map(function (x) { x.id = x.r.arsip_id; return x; }), 'id'), t = nowIso_(), upd = []; let sah = 0;
  const punya = {}; all.forEach(function (r) { if (r.atlet_id === a.atlet_id && ['SAH', 'MENUNGGU'].indexOf(r.klaim_status) >= 0) punya[[r.musim, r.gender, r.stroke_type, r.distance_m].join('|')] = 1; });
  ids.forEach(function (id) {
    const x = kd[id]; if (!x) err_('Ada hasil yang tidak cocok atau sudah diklaim atlet lain. Muat ulang halaman.');
    const k = [x.r.musim, x.r.gender, x.r.stroke_type, x.r.distance_m].join('|'); if (punya[k]) err_('Nomor ' + x.r.distance_m + 'm ' + x.r.stroke_type + ' di arsip ' + x.r.musim + ' sudah diklaim untuk atlet ini.'); punya[k] = 1;
    x.r.atlet_id = a.atlet_id; x.r.klaim_status = x.auto ? 'SAH' : 'MENUNGGU'; x.r.klaim_at = t; if (x.auto) sah++; upd.push(x.r);
  });
  saveRows_('TBL_HASIL_ARSIP', upd); bust_('hasil', 'atlet'); audit_(me, 'KLAIM_PRESTASI', 'Arsip', a.nama_lengkap + ': ' + upd.length + ' hasil (' + sah + ' langsung sah)');
  return ok_({ sah: sah, menunggu: upd.length - sah }, upd.length + ' hasil diklaim untuk ' + a.nama_lengkap + ': ' + sah + ' langsung tercatat' + (upd.length - sah ? ', ' + (upd.length - sah) + ' menunggu pemeriksaan panitia' : '') + '.');
}
function hKlaimBatal_(me, d) {
  const ids = (Array.isArray(d.ids) ? d.ids : []).map(String), mine = {}; readT_('TBL_ATLET').forEach(function (a) { if (a.kontingen_id === me.id) mine[a.atlet_id] = 1; });
  const all = readT_('TBL_HASIL_ARSIP', true), upd = all.filter(function (r) { return ids.indexOf(r.arsip_id) >= 0 && mine[r.atlet_id] && r.klaim_status !== 'DITOLAK'; });
  if (!upd.length) err_('Klaim tidak ditemukan.'); upd.forEach(function (r) { r.atlet_id = ''; r.klaim_status = ''; r.klaim_at = ''; });
  saveRows_('TBL_HASIL_ARSIP', upd); bust_('hasil', 'atlet'); audit_(me, 'KLAIM_BATAL', 'Arsip', upd.length + ' hasil'); return ok_(null, upd.length + ' klaim dibatalkan.');
}
function hKlaimList_() {
  const rows = readT_('TBL_HASIL_ARSIP').filter(function (r) { return r.klaim_status === 'MENUNGGU' || (r.klaim_status === 'SAH' && r.atlet_id); }), atl = idx_(readT_('TBL_ATLET'), 'atlet_id'), kont = idx_(readT_('TBL_KONTINGEN'), 'kontingen_id');
  const rk = rankArsip_(Object.keys(rows.reduce(function (o, r) { o[r.musim] = 1; return o; }, {}))), meta = arsipMeta_();
  const map = function (r) { const a = atl[r.atlet_id] || {}, o = barisArsip_(r, rk, meta); o.at = r.klaim_at; o.atlet = { id: a.atlet_id, nama: a.nama_lengkap, sk: a.sekolah_nama, kl: a.klub_nama, kelas: a.kelas_num, akun: (kont[a.kontingen_id] || {}).nama_lembaga || '' }; o.cn = cocokNama_(r.nama_atlet, a.nama_lengkap); o.cl = cocokLembaga_(r.sekolah, a.sekolah_nama) || cocokLembaga_(r.klub, a.klub_nama); o.ck = kelasCocok_(a, r); return o; };
  return ok_({ menunggu: rows.filter(function (r) { return r.klaim_status === 'MENUNGGU'; }).map(map), sah: rows.filter(function (r) { return r.klaim_status === 'SAH'; }).length });
}
function hKlaimAksi_(me, d) {
  const ids = (Array.isArray(d.ids) ? d.ids : []).map(String), all = readT_('TBL_HASIL_ARSIP', true), upd = all.filter(function (r) { return ids.indexOf(r.arsip_id) >= 0 && r.klaim_status === 'MENUNGGU'; });
  if (!upd.length) err_('Pilih klaim yang menunggu.'); upd.forEach(function (r) { r.klaim_status = d.ok ? 'SAH' : 'DITOLAK'; r.klaim_at = nowIso_(); });
  saveRows_('TBL_HASIL_ARSIP', upd); bust_('hasil', 'atlet'); audit_(me, d.ok ? 'KLAIM_SAH' : 'KLAIM_TOLAK', 'Arsip', upd.length + ' hasil');
  return ok_(null, upd.length + ' klaim ' + (d.ok ? 'disahkan dan tampil di riwayat prestasi atlet.' : 'ditolak.'));
}

// ── Bersihkan data percobaan (Super Admin) ──
// Menghapus data event yang dipilih: pendaftaran, start list, hasil, pengesahan, jurnal, dokumen, log arsip, rekor dari hasil web.
// Event tidak aktif + nomornya ikut dihapus (opsional). Event aktif dikosongkan dan dikembalikan ke tahap Pendaftaran (ditutup).
// Akun peserta: tidak disentuh / akun uji coba (DEMO-) / semua akun & atlet. Arsip hasil lama (impor) & akun panitia tidak disentuh.
// Sebelum menghapus, salinan spreadsheet dibuat di Drive sebagai cadangan.
function hEvReset_(me, d) {
  if (String(d.konfirmasi || '').trim().toUpperCase() !== 'HAPUS') err_('Ketik HAPUS untuk konfirmasi.');
  const r = evBersihkan_(me, d.musims, !!d.hapusEvent, d.akun, true); return ok_({ n: r.n, cadangan: r.cad }, r.pesan);
}
function evCadangan_(label) {
  try { const f = DriveApp.getFileById(ss_().getId()), nm = 'CADANGAN KRP sebelum ' + label + ' ' + nowIso_().replace('T', ' ').slice(0, 16); let fo = null; try { fo = DriveApp.getFolderById(prop_('FOLDER_DOKUMEN')); } catch (e) { } return (fo ? f.makeCopy(nm, fo) : f.makeCopy(nm)).getUrl(); } catch (e) { return ''; }
}
function evBersihkan_(me, musims, hapusEvent, akunOpt, cadangan) {
  evMigrasi_(); const c = cfg_(), M = {}, d = { hapusEvent: hapusEvent }; (Array.isArray(musims) ? musims : []).forEach(function (m) { if (m) M[String(m)] = 1; });
  const akun = ['DEMO', 'SEMUA'].indexOf(akunOpt) >= 0 ? akunOpt : 'TIDAK';
  if (!Object.keys(M).length && akun === 'TIDAK') err_('Pilih minimal satu event atau jenis akun yang dibersihkan.');
  const hasilLain = readT_('TBL_RACE_RESULTS', true).some(function (r) { return !M[r.musim]; });
  if (akun === 'SEMUA' && hasilLain) err_('Menghapus semua akun hanya bisa bila semua event yang punya hasil ikut dibersihkan (agar hasil tidak kehilangan nama atlet).');
  const cad = cadangan ? evCadangan_('bersihkan') : '';
  const n = {}, del = function (tb, f) { if (!ss_().getSheetByName(tb)) return 0; const all = readT_(tb, true), keep = all.filter(function (r) { return !f(r); }); if (keep.length !== all.length) rewriteT_(tb, keep); n[tb] = all.length - keep.length; return n[tb]; };
  const nomM = {}; readT_('TBL_MASTER_NOMOR_LOMBA', true).forEach(function (x) { if (M[x.musim]) nomM[x.event_id] = 1; });
  const rid = {}; readT_('TBL_RACE_RESULTS', true).forEach(function (r) { if (M[r.musim]) rid[r.result_id] = 1; });
  // rekor dari hasil web event ini: kembalikan pemegang sebelumnya, atau hapus bila tidak ada
  if (Object.keys(rid).length) {
    const recs = readT_('TBL_REKOR_KEJUARAAN', true), keep = []; let ub = false;
    recs.forEach(function (x) { let rw = []; try { rw = JSON.parse(x.riwayat || '[]'); } catch (e) { } const rw2 = rw.filter(function (h) { return !rid[h.rid]; }); if (rw2.length !== rw.length) ub = true;
      if (!rid[x.result_id]) { x.riwayat = JSON.stringify(rw2); keep.push(x); return; } ub = true; if (!rw2.length) return; const p = rw2.pop(); Object.assign(x, { rekor_ms: p.ms, rekor_waktu: p.w, pemegang_nama: p.n, kontingen_nama: p.k, tahun: p.t, result_id: p.rid, atlet_id: p.aid || '', riwayat: JSON.stringify(rw2), event_rekor: p.ev || '', lokasi: p.l || x.lokasi, tanggal: p.tg || '' }); keep.push(x); });
    if (ub) { rewriteT_('TBL_REKOR_KEJUARAAN', keep); n.TBL_REKOR_KEJUARAAN = recs.length - keep.length; }
  }
  del('TBL_RACE_RESULTS', function (r) { return M[r.musim]; }); del('TBL_WASIT_SIGNOFF', function (r) { return M[r.musim]; }); del('TBL_HEAT_SEEDS', function (r) { return M[r.musim]; });
  del('TBL_REGISTRASI_ENTRI', function (r) { return M[r.musim]; }); del('TBL_MUTASI_ATLET', function (r) { return M[r.musim]; }); del('TBL_DOKUMEN', function (r) { return M[r.musim]; });
  del('TBL_EVENT_ARCHIVE_LOG', function (r) { return M[r.season_name] && !readT_('TBL_HASIL_ARSIP').some(function (h) { return h.musim === r.season_name; }); });
  del('TBL_HASIL_JURNAL', function (r) { return nomM[r.event_id]; });
  let evDel = 0, aktifReset = false;
  if (d.hapusEvent) {
    del('TBL_MASTER_NOMOR_LOMBA', function (x) { return M[x.musim] && x.musim !== c.musim; });
    evDel = del('TBL_EVENT', function (e) { return M[e.musim] && e.musim !== c.musim; });
  }
  if (M[c.musim]) { aktifReset = true; cfgSet_(me, { fase: 'PENDAFTARAN', registrasi_dibuka: '0', event_dikunci: '0', _arsip_step: '0', _arsip_id: '' }); const ea = readT_('TBL_EVENT', true).filter(function (e) { return e.musim === c.musim; })[0]; if (ea) { ea.fase_simpan = ''; ea.status = 'DRAFT'; ea.updated_at = nowIso_(); saveRows_('TBL_EVENT', [ea]); } }
  // akun peserta
  if (akun !== 'TIDAK') {
    const kenaK = function (k) { return akun === 'SEMUA' || String(k.kontingen_id).indexOf('DEMO-') === 0; }, kid = {}, aid = {};
    readT_('TBL_KONTINGEN', true).forEach(function (k) { if (kenaK(k)) { kid[k.kontingen_id] = 1; try { revokeAll_(k.kontingen_id); } catch (e) { } } });
    readT_('TBL_ATLET', true).forEach(function (a) { if (kid[a.kontingen_id]) aid[a.atlet_id] = 1; });
    del('TBL_REGISTRASI_ENTRI', function (r) { return aid[r.atlet_id] || kid[r.kontingen_id]; }); del('TBL_MUTASI_ATLET', function (r) { return aid[r.atlet_id] || kid[r.kontingen_id]; });
    n.akun = del('TBL_KONTINGEN', function (k) { return kid[k.kontingen_id]; }); n.atlet = del('TBL_ATLET', function (a) { return aid[a.atlet_id]; });
    const ha = readT_('TBL_HASIL_ARSIP', true).filter(function (h) { return aid[h.atlet_id]; }); ha.forEach(function (h) { h.atlet_id = ''; h.klaim_status = ''; h.klaim_at = ''; }); if (ha.length) saveRows_('TBL_HASIL_ARSIP', ha);
  }
  try { rekorImpUlang_(); } catch (e) { }
  delete _MEMO.__jd; delete _MEMO.__evH; bust_('master', 'atlet', 'hasil', 'galeri', 'user');
  audit_(me, 'BERSIHKAN_DATA', 'Event', Object.keys(M).join(', ') + ' · akun ' + akun + ' · ' + JSON.stringify(n));
  const t = function (k) { return n[k] || 0; };
  return { n: n, cad: cad, pesan: 'Data dibersihkan: ' + [evDel ? evDel + ' event' : '', t('TBL_REGISTRASI_ENTRI') + ' pendaftaran nomor', t('TBL_HEAT_SEEDS') + ' baris start list', t('TBL_RACE_RESULTS') + ' hasil', n.akun !== undefined ? n.akun + ' akun & ' + n.atlet + ' atlet' : ''].filter(Boolean).join(', ') + '.' + (aktifReset ? ' Event aktif dikosongkan dan kembali ke tahap Pendaftaran (pendaftaran ditutup).' : '') + (cad ? ' Cadangan spreadsheet sudah dibuat di Drive.' : '') };
}
// ── Reset ulang event pedoman (Short Course Seri II 2026) ke kondisi awal ──
// Data event dihapus (pendaftaran, start list, hasil, dokumen, jadwal susunan), lalu event + 136 nomor dipasang ulang dari pedoman.
// Bila event ini yang aktif di web, langsung diaktifkan lagi (tahap Pendaftaran). Akun peserta mengikuti pilihan.
function evResetPedoman_(me, akun) {
  evMigrasi_(); const c = cfg_(), m = EV_PRESET_MUSIM, aktif = c.musim === m, cad = evCadangan_('reset ' + m);
  const r = evBersihkan_(me, [m], false, akun, false);
  if (aktif) cfgSet_(me, { jadwal_manual_json: '{}', fase: 'PENDAFTARAN', _arsip_step: '0', _arsip_id: '', event_dikunci: '0', registrasi_dibuka: '1' });
  delete _MEMO.__jd; delete _MEMO.__evH; bust_('master');
  const p = evPasangPreset_(me, aktif, true);
  audit_(me, 'EVENT_RESET_PEDOMAN', 'Event', m + ' · akun ' + (akun || 'TIDAK'));
  return { cad: cad, nomor: p.nomor, aktif: p.aktif, pesan: 'Event "' + m + '" direset ke pengaturan pedoman: ' + p.nomor + ' nomor dipasang ulang' + (p.aktif ? ' dan aktif di web (tahap Pendaftaran).' : '.') + ' ' + r.pesan.split(' Event aktif dikosongkan')[0] + (cad ? ' Cadangan spreadsheet dibuat di Drive.' : '') };
}
function hEvResetPedoman_(me, d) {
  if (String(d.konfirmasi || '').trim().toUpperCase() !== 'RESET') err_('Ketik RESET untuk konfirmasi.');
  const r = evResetPedoman_(me, d.akun); return ok_({ cadangan: r.cad, nomor: r.nomor }, r.pesan);
}
/** Jalankan dari editor Apps Script: reset event Short Course Seri II 2026 ke kondisi awal (akun peserta tidak dihapus). */
function resetEventSeriII() {
  _SS = null; _MEMO = {}; const me = { id: 'editor', nama: 'Editor Apps Script', role: R.SA };
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try { const r = evResetPedoman_(me, 'TIDAK'); flushAudit_(); Logger.log('✅ ' + r.pesan + (r.cad ? '\nCadangan: ' + r.cad : '')); } finally { lock.releaseLock(); }
}
