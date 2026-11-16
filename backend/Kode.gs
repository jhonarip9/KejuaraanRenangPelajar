/**
 * ============================================================
 * KEJUARAAN RENANG PELAJAR PRO — Backend logika bisnis (Kode.gs)
 * GAS sebagai REST API JSON murni (pintu masuk di Api.gs: doGet/doPost).
 * Google Sheets (DB) + Drive (berkas) + Gmail. Frontend statis di GitHub Pages.
 * Prinsip: satu pintu rpc(), cache berversi, operasi Sheets selalu batch,
 * rahasia hanya di Script Properties (tidak pernah dikirim ke browser).
 * ============================================================
 */
const FOLDER_NAME = 'KRP_Kejuaraan_Renang_Pelajar';
const SS_NAME = 'DB_KRP_Kejuaraan_Renang_Pelajar';
const TZ = 'Asia/Jakarta';
const SESI_JAM = 12;
const R = { SA: 'SUPER_ADMIN', VF: 'VERIFIKATOR', OP: 'OPERATOR_LAPANGAN', WS: 'WASIT_UTAMA', KT: 'KONTINGEN' };
const STAFF = [R.SA, R.VF, R.OP, R.WS];
const LANDING = { SUPER_ADMIN: 'a-dash', VERIFIKATOR: 'a-verif', OPERATOR_LAPANGAN: 'a-hasil', WASIT_UTAMA: 'a-wasit', KONTINGEN: 'm-dash' };

// Pintu masuk HTTP (doGet/doPost) ada di Api.gs. Tidak ada HtmlService: tampilan di GitHub Pages.
function b64_(str) { return Utilities.base64Encode(Utilities.newBlob(String(str), 'text/plain').getBytes()); }

// ── Script Properties: satu pintu (rahasia & ID resource) ──
const PROPS = PropertiesService.getScriptProperties();
let _PM = null;
function propMuat_() { const c = CacheService.getScriptCache(), raw = c.get('__props'); if (raw) { try { _PM = JSON.parse(raw); } catch (e) { _PM = null; } } if (!_PM) { _PM = PROPS.getProperties(); try { c.put('__props', JSON.stringify(_PM), 600); } catch (e) { } } }
function propBust_() { try { CacheService.getScriptCache().remove('__props'); } catch (e) { } }
function prop_(k, d) { if (!_PM) propMuat_(); const v = _PM[k]; return (v === undefined || v === null || v === '') ? (d === undefined ? '' : d) : v; }
function setProp_(k, v) { PROPS.setProperty(k, String(v)); if (_PM) _PM[k] = String(v); propBust_(); }
function setProps_(o) { PROPS.setProperties(o); propBust_(); if (_PM) Object.keys(o).forEach(function (k) { _PM[k] = String(o[k]); }); }
function delProp_(k) { PROPS.deleteProperty(k); if (_PM) delete _PM[k]; }

// ── Util umum ──
function ok_(data, message) { return { success: true, data: data === undefined ? null : data, message: message || 'OK' }; }
function fail_(message, extra) { const r = { success: false, data: null, message: message || 'Gagal' }; if (extra) Object.keys(extra).forEach(function (k) { r[k] = extra[k]; }); return r; }
function err_(m) { throw new Error(m); }
function nowIso_() { return Utilities.formatDate(new Date(), TZ, "yyyy-MM-dd'T'HH:mm:ss"); }
function uid_(p) { return p + Utilities.getUuid().replace(/-/g, '').slice(0, 10).toUpperCase(); }
function esc_(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function toInt_(v, d) { const n = parseInt(v, 10); return isNaN(n) ? (d || 0) : n; }
function idx_(arr, key) { const m = {}; arr.forEach(function (o) { m[o[key]] = o; }); return m; }
function stripR_(o) { const c = Object.assign({}, o); delete c._r; return c; }
// Tanggal 'YYYY-MM-DD' atau 'YYYY-MM-DDTHH:mm' → milidetik (zona waktu skrip, WIB). Tanggal tanpa jam: awal/akhir hari.
function waktuLokal_(s, akhir) { const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/.exec(String(s || '')); if (!m) return NaN; return m[4] !== undefined ? new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]).getTime() : new Date(+m[1], +m[2] - 1, +m[3], akhir ? 23 : 0, akhir ? 59 : 0, akhir ? 59 : 0).getTime(); }
function bukaDaftar_() { const c = cfg_(); if (c.registrasi_dibuka !== '1' || c.event_dikunci === '1' || (c.fase || 'PENDAFTARAN') !== 'PENDAFTARAN') return false; const now = Date.now(); if (c.registrasi_mulai) { const a = waktuLokal_(c.registrasi_mulai, false); if (!isNaN(a) && now < a) return false; } if (c.registrasi_deadline) { const b = waktuLokal_(c.registrasi_deadline, true); if (!isNaN(b) && now > b) return false; } return true; }
function tipeBoleh_(t) { return String(cfg_().tipe_akun || 'SEKOLAH,KLUB,MANDIRI').split(',').indexOf(t) >= 0; }
function usia_(tgl, ref) { if (!tgl) return 0; const b = new Date(tgl + 'T00:00:00'), r = ref ? new Date(ref) : new Date(); let a = r.getFullYear() - b.getFullYear(); const m = r.getMonth() - b.getMonth(); if (m < 0 || (m === 0 && r.getDate() < b.getDate())) a--; return a; }
function kelasLabel_(n) { n = Number(n); return n === 0 ? 'TK' : n <= 6 ? 'SD Kelas ' + n : n <= 9 ? 'SMP Kelas ' + n : 'SMA Kelas ' + n; }
function kuatSandi_(p) { return String(p || '').length >= 8 && /[A-Za-z]/.test(p) && /\d/.test(p); }
function emailValid_(e) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e || '')); }

// ── Keamanan: acak kuat, hash sandi, token sesi HMAC ──
function acak_(n, huruf) {
  huruf = huruf || 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  while (s.length < n) {
    Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid()).forEach(function (b) { if (s.length < n) s += huruf[(b & 0xff) % huruf.length]; });
  }
  return s;
}
function sandiAcak_(n) { const s = acak_(n || 12); return /\d/.test(s) && /[A-Za-z]/.test(s) ? s : sandiAcak_(n); }
function hashPass_(pass, salt) { let h = String(pass); for (let i = 0; i < 300; i++) h = Utilities.base64Encode(Utilities.computeHmacSha256Signature(h + salt, salt)); return h; }
function samaAman_(a, b) { a = String(a); b = String(b); if (a.length !== b.length) return false; let r = 0; for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i); return r === 0; }
function samarkan_(v) { v = String(v || ''); return !v ? '' : v.length <= 8 ? '••••••' : v.slice(0, 4) + '••••••' + v.slice(-3); }
function secret_() { let s = prop_('SESSION_SECRET'); if (!s) { s = acak_(64); setProp_('SESSION_SECRET', s); } return s; }
function hmac_(s) { return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(s, secret_())).replace(/=+$/, ''); }
function signToken_(p) { const body = Utilities.base64EncodeWebSafe(JSON.stringify(p)).replace(/=+$/, ''); return body + '.' + hmac_(body); }
function buatSesi_(id, role, nama, darurat) { const now = Date.now(); return signToken_({ u: id, r: role, n: nama || '', i: now, x: now + SESI_JAM * 3600e3, d: darurat ? 1 : 0 }); }
function verifyToken_(t) {
  try {
    const parts = String(t || '').split('.');
    if (parts.length !== 2 || !samaAman_(hmac_(parts[0]), parts[1])) return null;
    let b = parts[0]; while (b.length % 4) b += '=';
    const p = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(b)).getDataAsString());
    if (!p.x || p.x < Date.now()) return null;
    const rev = Number(CacheService.getScriptCache().get('rev_' + p.u) || prop_('REV_' + p.u) || 0);
    if (p.i < rev) return null;
    return { id: p.u, role: p.r, nama: p.n || '', exp: p.x, darurat: !!p.d };
  } catch (e) { return null; }
}
function revokeAll_(id) { const t = String(Date.now()); setProp_('REV_' + id, t); CacheService.getScriptCache().put('rev_' + id, t, 21600); }
function bindFile_(kid, fid, kind) { return hmac_(kid + '|' + fid + '|' + kind); }

// ── Cache berversi per domain (master, atlet, hasil, user, galeri) ──
function vers_(doms) { const c = CacheService.getScriptCache(); const ks = doms.map(function (d) { return 'v_' + d; }); const m = c.getAll(ks); return doms.map(function (d) { return m['v_' + d] || '0'; }).join('.'); }
function bust_() { const c = CacheService.getScriptCache(), o = {}, t = String(Date.now()) + Math.random().toString(36).slice(2, 6); /* unik walau dua perubahan di milidetik yang sama */ Array.prototype.slice.call(arguments).forEach(function (d) { o['v_' + d] = t; }); c.putAll(o, 21600); }
function cget_(k) {
  const c = CacheService.getScriptCache(); const m = c.get(k + '#n'); if (!m) return null;
  const n = Number(m), keys = []; for (let i = 0; i < n; i++) keys.push(k + '#' + i);
  const parts = c.getAll(keys); let s = '';
  for (let i = 0; i < n; i++) { const p = parts[k + '#' + i]; if (p === undefined) return null; s += p; }
  try { return JSON.parse(s); } catch (e) { return null; }
}
function cput_(k, v, ttl) {
  try {
    const s = JSON.stringify(v), CH = 30000, n = Math.ceil(s.length / CH) || 1, o = {};
    for (let i = 0; i < n; i++) o[k + '#' + i] = s.substr(i * CH, CH);
    o[k + '#n'] = String(n); CacheService.getScriptCache().putAll(o, ttl);
  } catch (e) { /* cache gagal bukan masalah fatal */ }
}
function cached_(doms, key, ttl, fn) {
  const k = (key + '_' + vers_(doms)).slice(0, 200), hit = cget_(k);
  if (hit !== null) return hit.v;
  const v = fn(); cput_(k, { v: v }, ttl); return v;
}

// Cache halaman publik (stale-while-revalidate): saat data berubah/kedaluwarsa, hanya SATU eksekusi
// yang membaca Sheets; pengunjung lain tetap dilayani salinan terakhir -> tidak ada serbuan baca Sheets.
function cachedPub_(doms, key, fresh, fn) {
  const ver = vers_(doms), k = ('P_' + key).slice(0, 200), hit = cget_(k), now = Date.now(), c = CacheService.getScriptCache();
  if (hit && hit.ver === ver && now - hit.t < fresh * 1000) return hit.v;
  if (hit) { if (c.get('rf_' + k)) return hit.v; c.put('rf_' + k, '1', 20); }
  const v = fn(); cput_(k, { ver: ver, t: Date.now(), v: v }, 21600); try { c.remove('rf_' + k); } catch (e) { } return v;
}

// ── Skema database (satu spreadsheet, banyak sheet) ──
// Semua kolom bertipe TEKS ('@') kecuali yang terdaftar di num → NISN/tanggal tidak berubah format.
const SKEMA = {
  TBL_USERS_ROLES: { cols: ['user_id', 'full_name', 'email', 'role', 'pass_hash', 'pass_salt', 'license_number', 'status', 'last_login', 'created_at'], num: [] },
  TBL_KONTINGEN: { cols: ['kontingen_id', 'tipe_lembaga', 'nama_lembaga', 'npsn_or_sk', 'provinsi', 'kota_kabupaten', 'alamat', 'jenjang_utama', 'pj_nama', 'pj_jabatan', 'pj_telepon', 'pj_email', 'pass_hash', 'pass_salt', 'drive_folder_id', 'mandat_file_id', 'status_akun', 'created_at'], num: [] },
  TBL_MASTER_JENJANG: { cols: ['jenjang_id', 'kode_jenjang', 'nama_jenjang', 'kelas_min', 'kelas_max', 'urutan'], num: ['kelas_min', 'kelas_max', 'urutan'] },
  TBL_MASTER_NOMOR_LOMBA: { cols: ['event_id', 'event_no', 'event_name', 'course_type', 'jenjang_kode', 'gender', 'distance_m', 'stroke_type', 'fee_amount', 'max_quota', 'hari', 'sesi', 'jam', 'is_active', 'musim', 'dibuka'], num: ['event_no', 'distance_m', 'fee_amount', 'max_quota', 'hari', 'is_active'] },
  TBL_ATLET: { cols: ['atlet_id', 'bib', 'nisn', 'nama_lengkap', 'jenis_kelamin', 'tempat_lahir', 'tanggal_lahir', 'kontingen_id', 'sekolah_nama', 'klub_nama', 'kelas_num', 'jenjang_kode', 'provinsi_asal', 'kota_asal', 'hp_kontak', 'foto_file_id', 'akta_file_id', 'surat_file_id', 'sosmed_file_id', 'status_atlet', 'created_at'], num: ['kelas_num'] },
  TBL_REGISTRASI_ENTRI: { cols: ['entry_id', 'musim', 'atlet_id', 'kontingen_id', 'event_id', 'seed_time_entry', 'seed_ms', 'nominal_biaya', 'status_verifikasi', 'status_bayar', 'bukti_bayar_file_id', 'verified_by', 'verified_at', 'catatan_revisi', 'created_at'], num: ['seed_ms', 'nominal_biaya'] },
  TBL_MUTASI_ATLET: { cols: ['pengajuan_id', 'musim', 'tipe', 'atlet_id', 'kontingen_id', 'field', 'event_id', 'nilai_lama', 'nilai_baru', 'kontingen_baru_id', 'alasan', 'bukti_file_id', 'status_approval', 'diajukan_at', 'diputuskan_oleh', 'diputuskan_at', 'catatan_admin'], num: [] },
  TBL_HEAT_SEEDS: { cols: ['seed_id', 'musim', 'event_id', 'heat_number', 'lane_number', 'atlet_id', 'entry_seed_time', 'seed_ms'], num: ['heat_number', 'lane_number', 'seed_ms'] },
  TBL_RACE_RESULTS: { cols: ['result_id', 'musim', 'event_id', 'heat_number', 'lane_number', 'atlet_id', 'final_time', 'final_ms', 'status_lomba', 'dq_code', 'catatan', 'rank_event', 'medal', 'is_new_record', 'input_by', 'input_at', 'status_pengesahan'], num: ['heat_number', 'lane_number', 'final_ms', 'rank_event', 'is_new_record'] },
  TBL_WASIT_SIGNOFF: { cols: ['signoff_id', 'musim', 'event_id', 'referee_user_id', 'referee_name', 'signoff_at', 'is_locked', 'signature_hash', 'catatan', 'revoke_history', 'ttd_file_id'], num: ['is_locked'] },
  TBL_REKOR_KEJUARAAN: { cols: ['rekor_id', 'rekor_key', 'event_name', 'jenjang_kode', 'gender', 'stroke_type', 'distance_m', 'atlet_id', 'pemegang_nama', 'kontingen_nama', 'rekor_ms', 'rekor_waktu', 'tahun', 'lokasi', 'result_id', 'riwayat', 'event_rekor', 'tanggal'], num: ['distance_m', 'rekor_ms', 'tahun'] },
  TBL_EVENT_ARCHIVE_LOG: { cols: ['archive_id', 'season_name', 'total_kontingen', 'total_atlet', 'total_pendapatan', 'backup_file_id', 'backup_url', 'integrity_hash', 'snapshot_json', 'closed_by', 'closed_at'], num: ['total_kontingen', 'total_atlet', 'total_pendapatan'] },
  TBL_PORTAL_CONFIG: { cols: ['config_key', 'config_value', 'updated_by', 'updated_at'], num: [] },
  TBL_AUDIT_LOG: { cols: ['log_id', 'ts', 'user', 'role', 'action', 'entity', 'detail'], num: [] },
  TBL_HASIL_JURNAL: { cols: ['jurnal_id', 'ts', 'user', 'role', 'aksi', 'event_id', 'versi', 'data_json'], num: [] },
  TBL_GALERI: { cols: ['galeri_id', 'file_id', 'caption', 'event_label', 'uploaded_by', 'created_at', 'tipe', 'url'], num: [] },
  TBL_HASIL_ARSIP: { cols: ['arsip_id', 'musim', 'event_label', 'jenjang_kode', 'gender', 'stroke_type', 'distance_m', 'nama_atlet', 'sekolah', 'klub', 'kota', 'waktu', 'waktu_ms', 'status', 'catatan', 'dibuat_oleh', 'dibuat_at', 'kelas', 'rank_resmi', 'no_acara', 'tanggal', 'entry_time', 'atlet_id', 'klaim_status', 'klaim_at', 'kolam'], num: ['distance_m', 'waktu_ms', 'rank_resmi', 'no_acara'] },
  TBL_DOKUMEN: { cols: ['dok_id', 'musim', 'jenis', 'nama_file', 'file_id', 'dibuat_oleh', 'created_at', 'is_publik'], num: ['is_publik'] },
  TBL_EVENT: { cols: ['ev_id', 'musim', 'nama', 'tingkat', 'wilayah', 'penyelenggara', 'tgl_mulai', 'tgl_selesai', 'venue', 'alamat', 'kota', 'maps_url', 'kolam', 'lintasan', 'daftar_mulai', 'daftar_tutup', 'kuota_atlet', 'biaya_mode', 'biaya_paket', 'biaya_nomor', 'nomor_min', 'nomor_max', 'min_peserta', 'tipe_akun', 'kelompok_json', 'label_kelompok', 'info_json', 'status', 'fase_simpan', 'dibuat_oleh', 'created_at', 'updated_at'], num: ['lintasan', 'kuota_atlet', 'biaya_paket', 'biaya_nomor', 'nomor_min', 'nomor_max', 'min_peserta'] }
};

// Konfigurasi biasa (Kelas C): aman dibaca publik, diedit Super Admin. Kunci berawalan "_" disembunyikan.
const CFG_DEFAULT = {
  app_name: 'Kejuaraan Renang Pelajar', tagline: 'Mewujudkan integritas olahraga prestasi pelajar menuju pentas akuatik tertinggi',
  judul_hero: 'Kejuaraan Renang Pelajar', subjudul: 'Pendaftaran, start list, hasil lomba, dan klasemen terintegrasi dalam satu portal resmi.',
  lokasi: 'Isi lokasi kolam renang', tanggal_teks: 'Isi tanggal pelaksanaan', tanggal_mulai: '', musim: String(new Date().getFullYear()),
  registrasi_dibuka: '1', registrasi_deadline: '', banner_teks: '', teks_berjalan: '',
  max_individu: '3', jumlah_lintasan: '8',
  poin_emas: '5', poin_perak: '3', poin_perunggu: '1', event_dikunci: '0',
  logo_url: '', kontak_email: '', kontak_telp: '', live_detik: '30', portal_url: '', cta1: 'Daftar Atlet Sekarang', cta2: 'Lihat Hasil Live', rekening: '',
  jadwal_json: '[]',
  kartu_json: '[{"j":"Syarat Keabsahan Siswa","d":"Surat keterangan sekolah, akte kelahiran, dan NISN aktif wajib diunggah."},{"j":"Pemisahan Jenjang","d":"SMP Kelas 7 dan SMP Kelas 8-9 dilombakan secara terpisah."},{"j":"Sistem Waktu","d":"Catatan waktu memakai touchpad elektronik dengan akurasi 1/100 detik."}]',
  persyaratan: 'Surat keterangan aktif dari sekolah (bercap basah)\nAkte kelahiran (validasi usia dan kelas)\nNISN aktif 10 digit\nFoto resmi atlet (latar biru/merah)\nBukti mengikuti akun media sosial panitia\nBukti transfer biaya pendaftaran',
  min_peserta: '5', fase: 'PENDAFTARAN', logo_buku_json: '[]', jadwal_manual_json: '{}', jadwal_mulai: '08:00', jadwal_jeda: '1', menit_heat_json: '{"25":2,"50":3,"100":4,"200":7,"400":14,"800":28}', buku_subjudul: '', buku_cover: '0', buku_isi: 'NORMAL', ig1: 'https://www.instagram.com/kejuaraanrenangpelajarbulanan', ig2: 'https://www.instagram.com/krp_jabodetabek', yt1: 'https://www.youtube.com/@renangbulananjakarta', yt2: 'https://www.youtube.com/@krpbdkijakarta8319', kop1: '', kop2: '', kop3: '', panitia_teks: '', ttd_ketua_nama: '', ttd_ketua_jabatan: 'Ketua Panitia Pelaksana',
  portal_nama: 'Kejuaraan Renang Pelajar', portal_sub: 'Portal resmi renang tingkat pelajar', hero_aksen: 'Tingkat Pelajar',
  registrasi_mulai: '', min_nomor: '1', kuota_atlet: '0', biaya_mode: 'NOMOR', biaya_paket: '0', tipe_akun: 'SEKOLAH,KLUB,MANDIRI', kelompok_json: '{}', label_kelompok: 'KELAS', tingkat_event: '', tanggal_selesai: '', wa_grup: '', kolam: '',
  _arsip_step: '0', rollover_tahun: ''
};
// Kunci yang dikelola modul Event & Nomor Lomba (tidak diubah dari Pengaturan Web)
const CFG_EVENT = ['app_name', 'lokasi', 'tanggal_teks', 'tanggal_mulai', 'tanggal_selesai', 'registrasi_dibuka', 'registrasi_mulai', 'registrasi_deadline', 'max_individu', 'min_nomor', 'min_peserta', 'jumlah_lintasan', 'rekening', 'kontak_email', 'kontak_telp', 'kuota_atlet', 'biaya_mode', 'biaya_paket', 'tipe_akun', 'kelompok_json', 'label_kelompok', 'tingkat_event', 'wa_grup', 'kolam', 'musim'];
const CFG_EDITABLE = Object.keys(CFG_DEFAULT).filter(function (k) { return k.charAt(0) !== '_' && ['rollover_tahun', 'fase', 'logo_buku_json', 'jadwal_manual_json'].indexOf(k) < 0 && CFG_EVENT.indexOf(k) < 0; });

// ── Akses Sheets: baca/tulis SELALU batch ──
let _SS = null, _MEMO = {};
function ss_() { if (!_SS) { const id = prop_('SPREADSHEET_ID'); if (!id) err_('Aplikasi belum disiapkan. Jalankan setupAppEnvironment() dari editor Apps Script.'); _SS = SpreadsheetApp.openById(id); } return _SS; }
function sh_(name) { const s = ss_().getSheetByName(name); if (!s) err_('Sheet ' + name + ' tidak ditemukan. Jalankan setupAppEnvironment().'); return s; }
function iso_(v) { return v instanceof Date ? Utilities.formatDate(v, TZ, "yyyy-MM-dd'T'HH:mm:ss") : v; }
function readT_(name, fresh) {
  if (!fresh && _MEMO[name]) return _MEMO[name];
  const sk = SKEMA[name], s = sh_(name), n = s.getLastRow();
  let out = [];
  if (n > 1) {
    const vals = s.getRange(2, 1, n - 1, sk.cols.length).getValues();
    out = vals.map(function (r, ri) {
      const o = { _r: ri + 2 };
      sk.cols.forEach(function (c, i) {
        let v = r[i]; if (v instanceof Date) v = iso_(v);
        o[c] = sk.num.indexOf(c) >= 0 ? (v === '' ? 0 : Number(v) || 0) : (v === null || v === undefined ? '' : String(v));
      });
      return o;
    });
  }
  _MEMO[name] = out; return out;
}
function readM_(name) {
  return cached_(['master'], 'M_' + name, 600, function () {
    const rows = readT_(name).map(stripR_);
    // Nomor lomba: hanya nomor milik event aktif (musim berjalan) yang dianggap aktif. Kolom musim kosong = data lama.
    if (name === 'TBL_MASTER_NOMOR_LOMBA') { const m = cfg_().musim; rows.forEach(function (r) { r.is_active = r.is_active && (!r.musim || r.musim === m) ? 1 : 0; }); }
    return rows;
  });
}
function rowsOf_(sk, objs) { return objs.map(function (o) { return sk.cols.map(function (c) { return sk.num.indexOf(c) >= 0 ? (Number(o[c]) || 0) : (o[c] == null ? '' : String(o[c])); }); }); }
function fmtOf_(sk, n) { const f = sk.cols.map(function (c) { return sk.num.indexOf(c) >= 0 ? '0' : '@'; }), a = []; for (let i = 0; i < n; i++) a.push(f); return a; }
function appendT_(name, objs) {
  if (!objs || !objs.length) return;
  const sk = SKEMA[name], s = sh_(name), n = objs.length, start = s.getLastRow() + 1;
  if (start + n - 1 > s.getMaxRows()) s.insertRowsAfter(s.getMaxRows(), Math.max(n, 500));
  const rg = s.getRange(start, 1, n, sk.cols.length);
  rg.setNumberFormats(fmtOf_(sk, n)); rg.setValues(rowsOf_(sk, objs)); delete _MEMO[name];
}
function saveRows_(name, objs) { // objs wajib punya _r (nomor baris sheet)
  if (!objs.length) return;
  const sk = SKEMA[name], s = sh_(name), nc = sk.cols.length;
  if (objs.length <= 15) { objs.forEach(function (o) { s.getRange(o._r, 1, 1, nc).setValues(rowsOf_(sk, [o])); }); }
  else {
    const n = s.getLastRow() - 1, rg = s.getRange(2, 1, n, nc), vals = rg.getValues();
    objs.forEach(function (o) { vals[o._r - 2] = rowsOf_(sk, [o])[0]; }); rg.setValues(vals);
  }
  delete _MEMO[name];
}
function rewriteT_(name, objs) { // ganti seluruh isi tabel (hapus/rekonstruksi massal)
  // Urutan aman: tulis data baru dulu (menimpa), baru bersihkan sisa baris lama di bawahnya.
  // Bila eksekusi terhenti di tengah, sheet tidak pernah kosong (paling buruk tersisa baris lama di bawah).
  const sk = SKEMA[name], s = sh_(name), nc = sk.cols.length, last = s.getLastRow(), n = objs.length;
  delete _MEMO[name];
  if (n) {
    if (1 + n > s.getMaxRows()) s.insertRowsAfter(s.getMaxRows(), n + 200);
    const rg = s.getRange(2, 1, n, nc); rg.setNumberFormats(fmtOf_(sk, n)); rg.setValues(rowsOf_(sk, objs));
  }
  if (last > n + 1) s.getRange(n + 2, 1, last - n - 1, nc).clearContent();
  delete _MEMO[name];
}

// ── Konfigurasi portal (Kelas C) ──
let _CFG = null;
function cfg_() {
  if (_CFG) return _CFG;
  _CFG = cached_(['master'], 'cfg', 300, function () { const m = Object.assign({}, CFG_DEFAULT); readT_('TBL_PORTAL_CONFIG').forEach(function (r) { m[r.config_key] = r.config_value; }); return m; });
  return _CFG;
}
function cfgSet_(me, obj) {
  const rows = readT_('TBL_PORTAL_CONFIG', true), by = idx_(rows, 'config_key'), upd = [], add = [], t = nowIso_(), who = me ? me.nama : '';
  Object.keys(obj).forEach(function (k) {
    const v = String(obj[k]);
    if (by[k]) { by[k].config_value = v; by[k].updated_by = who; by[k].updated_at = t; upd.push(by[k]); }
    else add.push({ config_key: k, config_value: v, updated_by: who, updated_at: t });
  });
  if (upd.length) saveRows_('TBL_PORTAL_CONFIG', upd);
  if (add.length) appendT_('TBL_PORTAL_CONFIG', add);
  _CFG = null; delete _MEMO.TBL_PORTAL_CONFIG; delete _MEMO.__jenA; delete _MEMO.__jd; bust_('master');
}

// ── Audit log (diantrikan, ditulis sekali per eksekusi) ──
let AUDIT_Q = [];
function audit_(me, aksi, entitas, detail) { AUDIT_Q.push({ log_id: uid_('LOG'), ts: nowIso_(), user: (me && (me.nama || me.id)) || '-', role: (me && me.role) || '', action: aksi, entity: entitas || '', detail: String(detail || '').slice(0, 300) }); }
function flushAudit_() { if (!AUDIT_Q.length) return; try { appendT_('TBL_AUDIT_LOG', AUDIT_Q); } catch (e) { console.error('audit: ' + e.message); } AUDIT_Q = []; }

// ── Waktu renang: parse & format (presisi 1/100 detik) ──
function parseWaktu_(s) {
  s = String(s == null ? '' : s).trim().replace(',', '.'); if (!s || s.toUpperCase() === 'NT') return -1;
  const p = s.split(':'); if (p.length > 3) return -1;
  const last = p.pop(); if (!/^\d{1,2}(\.\d{1,3})?$/.test(last)) return -1;
  const sec = parseFloat(last); let min = 0, hr = 0;
  if (p.length >= 1) { const m = p.pop(); if (!/^\d{1,2}$/.test(m)) return -1; min = parseInt(m, 10); }
  if (p.length >= 1) { if (!/^\d{1,2}$/.test(p[0])) return -1; hr = parseInt(p[0], 10); }
  if (sec >= 60 || min >= 60) return -1;
  return Math.round(((hr * 60 + min) * 60 + sec) * 1000);
}
function fmtWaktu_(ms) { if (!ms || ms <= 0) return 'NT'; const cs = Math.round(ms / 10), c = cs % 100, s = Math.floor(cs / 100) % 60, m = Math.floor(cs / 6000); return (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s + '.' + (c < 10 ? '0' : '') + c; }

// ── Dispatcher: satu pintu untuk semua panggilan klien ──
function rpc(action, token, data, reqId) {
  const r = ROUTES[action];
  try {
    if (!r) return fail_('Aksi tidak dikenal.');
    reqId = /^[A-Za-z0-9_-]{8,64}$/.test(String(reqId || '')) ? String(reqId) : '';
    let me = null;
    if (r.roles !== 'PUBLIC') {
      me = sesi_(token);
      if (!me) return fail_('Sesi berakhir. Silakan masuk kembali.', { code: 'AUTH' });
      if (r.roles !== 'ANY' && r.roles.indexOf(me.role) === -1) return fail_('Akses ditolak untuk peran Anda.', { code: 'FORBIDDEN' });
    }
    let res;
    if (r.write) {
      // Idempotensi: aksi tulis yang dikirim ulang (HP putus koneksi lalu mencoba lagi) memakai hasil pertama, tidak dobel.
      const idem = reqId ? 'idem_' + (me ? me.id : 'pub') + '_' + reqId : '';
      if (idem) { const h = cget_(idem); if (h) { h.v.ulang = true; return h.v; } }
      const lock = LockService.getScriptLock();
      if (!lock.tryLock(20000)) return fail_('Sistem sedang sibuk, coba lagi sebentar.', { code: 'SIBUK' });
      try {
        if (idem) { const h2 = cget_(idem); if (h2) { h2.v.ulang = true; return h2.v; } }
        res = r.fn(me, data || {}); flushAudit_();
        if (idem && res && res.success) { const s = JSON.stringify(res); if (s.length < 90000) cput_(idem, { v: /"(sandi|token|password|pass_hash|pass_salt|secret)"\s*:/i.test(s) ? { success: true, data: null, message: res.message + ' (sudah diproses sebelumnya)' } : res }, 21600); } // rahasia tidak pernah disimpan di cache idempotensi
      } finally { lock.releaseLock(); }
      jalankanSetelah_(); // email & tugas lambat dijalankan SETELAH kunci dilepas (pengguna lain tidak ikut menunggu)
    } else {
      res = r.fn(me, data || {});
      if (AUDIT_Q.length) { const lk = LockService.getScriptLock(); if (lk.tryLock(5000)) { try { flushAudit_(); } finally { lk.releaseLock(); } } }
    }
    return res;
  } catch (e) {
    console.error(action + ': ' + e.message); buangSetelah_(); // aksi gagal → email yang tertunda dibatalkan
    return fail_(e.message || 'Terjadi kesalahan.', e.kode ? { code: e.kode, info: e.info } : null);
  }
}
function aktifMap_() {
  return cached_(['user'], 'aktif', 300, function () {
    const m = {};
    readT_('TBL_USERS_ROLES').forEach(function (u) { m[u.user_id] = { role: u.role, status: u.status }; });
    readT_('TBL_KONTINGEN').forEach(function (k) { m[k.kontingen_id] = { role: R.KT, status: k.status_akun }; });
    return m;
  });
}
function sesi_(token) {
  const p = verifyToken_(token); if (!p) return null;
  if (p.darurat) return p;
  const a = aktifMap_()[p.id];
  if (!a || a.status !== 'ACTIVE' || a.role !== p.role) return null;
  return p;
}

// ============================================================
// BAGIAN PUBLIK (tanpa login) — semua di-cache berversi
// ============================================================
function jadwal_() {
  if (_MEMO.__jd) return _MEMO.__jd;
  const cfg = cfg_(), lanes = Number(cfg.jumlah_lintasan) || 8; let man = {}, mh = {};
  try { man = JSON.parse(cfg.jadwal_manual_json || '{}') || {}; } catch (e) { } try { mh = JSON.parse(cfg.menit_heat_json || '{}') || {}; } catch (e) { }
  const jeda = Number(cfg.jadwal_jeda) || 0, mulai0 = String(cfg.jadwal_mulai || '08:00').split(':'), cnt = {}, hs = {};
  readT_('TBL_REGISTRASI_ENTRI').forEach(function (e) { if (e.musim === cfg.musim && e.status_verifikasi !== 'REJECTED') cnt[e.event_id] = (cnt[e.event_id] || 0) + 1; });
  readT_('TBL_HEAT_SEEDS').forEach(function (s) { if (s.musim === cfg.musim) hs[s.event_id] = Math.max(hs[s.event_id] || 0, s.heat_number); });
  const fm = function (m) { m = Math.max(0, Math.round(m)); return ('0' + Math.floor(m / 60) % 24).slice(-2) + ':' + ('0' + m % 60).slice(-2); }, tm = function (t) { const q = String(t).split(':'); return Number(q[0]) * 60 + Number(q[1]); };
  const rows = readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (e) { return e.is_active; }).map(function (e) {
    const o = man[e.event_id] || {}, n = cnt[e.event_id] || 0, heats = hs[e.event_id] || Math.ceil(n / lanes), mn = Number(mh[e.distance_m]) || Math.max(2, Math.round(e.distance_m / 25) + 1);
    return { eid: e.event_id, no: e.event_no, nama: e.event_name, g: e.gender, jk: e.jenjang_kode, d: e.distance_m, hari: Number(o.hari) || e.hari || 1, urut: o.urut !== undefined && o.urut !== '' && o.urut !== null ? Number(o.urut) : e.event_no, n: n, heats: heats, mn: mn, jamManual: /^\d{2}:\d{2}$/.test(o.jam || '') ? o.jam : '', mulai: '', selesai: '', manual: !!(o.jam || o.hari || (o.urut !== undefined && o.urut !== '')), bentrok: false };
  }).sort(function (a, b) { return a.hari - b.hari || a.urut - b.urut || a.no - b.no; });
  const cur = {}; rows.forEach(function (r) {
    if (cur[r.hari] === undefined) cur[r.hari] = Number(mulai0[0]) * 60 + Number(mulai0[1] || 0);
    if (!r.n) return;
    let st = cur[r.hari]; if (r.jamManual) { const mm = tm(r.jamManual); if (mm < st) r.bentrok = true; st = mm; }
    r.mulai = fm(st); r.selesai = fm(st + r.heats * r.mn); cur[r.hari] = st + r.heats * r.mn + jeda;
  });
  _MEMO.__jd = rows; _MEMO.__jdm = idx_(rows, 'eid'); return rows;
}
function jdOf_(eid) { jadwal_(); return _MEMO.__jdm[eid] || null; }
function evPub_(e) { const j = jdOf_(e.event_id); return { id: e.event_id, no: e.event_no, nama: e.event_name, ct: e.course_type, jk: e.jenjang_kode, g: e.gender, d: e.distance_m, s: e.stroke_type, fee: e.fee_amount, hari: j ? j.hari : e.hari, jam: j && j.mulai ? j.mulai : '', jamS: j ? j.selesai : '', b: e.dibuka === '0' ? 0 : 1, q: Number(e.max_quota) || 0 }; }
function rekorKey_(e) { return [e.jenjang_kode, e.gender, e.stroke_type, e.distance_m, e.course_type].join('|'); }
function recOf_(ev) { const r = readT_('TBL_REKOR_KEJUARAAN').filter(function (x) { return x.rekor_key === rekorKey_(ev); })[0]; return r ? { waktu: r.rekor_waktu, ms: r.rekor_ms, nama: r.pemegang_nama, kont: r.kontingen_nama, tahun: r.tahun } : null; }
function aInfo_(a) { a = a || {}; return { id: a.atlet_id, nama: a.nama_lengkap, bib: a.bib, sk: a.sekolah_nama, kl: a.klub_nama, f: a.foto_file_id, kls: a.kelas_num, wl: a.kota_asal }; }
function laneOrder_(n) { const c = Math.ceil(n / 2), o = [c]; for (let k = 1; o.length < n; k++) { if (c + k <= n) o.push(c + k); if (o.length < n && c - k >= 1) o.push(c - k); } return o; }

function evStatus_(musim) {
  const seeds = readT_('TBL_HEAT_SEEDS').filter(function (s) { return s.musim === musim; });
  const res = readT_('TBL_RACE_RESULTS').filter(function (r) { return r.musim === musim; });
  const rank = { NONE: 0, DRAFT: 1, SUBMITTED: 2, SAH: 3 }, m = {};
  const g = function (id) { return m[id] || (m[id] = { h: 0, a: 0, s: 'NONE' }); };
  seeds.forEach(function (s) { const x = g(s.event_id); x.a++; if (s.heat_number > x.h) x.h = s.heat_number; });
  res.forEach(function (r) { const x = g(r.event_id); if ((rank[r.status_pengesahan] || 0) > rank[x.s]) x.s = r.status_pengesahan; });
  return m;
}

function nk_(s) { return String(s || '').toLowerCase().replace(/\s+/g, ' ').trim(); }
function cmpKlas_(a, b) { return (b.poin - a.poin) || (b.e - a.e) || (b.p - a.p) || (b.b - a.b) || String(a.nama).localeCompare(String(b.nama)); }
function hitungKlasemen_(musim) {
  const cfg = cfg_(), P = { EMAS: Number(cfg.poin_emas) || 0, PERAK: Number(cfg.poin_perak) || 0, PERUNGGU: Number(cfg.poin_perunggu) || 0 };
  const atl = idx_(readT_('TBL_ATLET'), 'atlet_id'), evs = idx_(readM_('TBL_MASTER_NOMOR_LOMBA'), 'event_id'), kont = idx_(readT_('TBL_KONTINGEN'), 'kontingen_id');
  const res = readT_('TBL_RACE_RESULTS').filter(function (r) { return r.musim === musim && r.status_pengesahan === 'SAH' && r.medal; });
  const out = { sekolah: {}, klub: {}, jenjang: {} };
  const add = function (bucket, nama, kota, m) {
    if (!nama) return;
    const kk = nk_(nama), o = bucket[kk] || (bucket[kk] = { nama: nama, kota: kota || '', atlet: 0, e: 0, p: 0, b: 0, poin: 0 });
    if (m === 'EMAS') o.e++; else if (m === 'PERAK') o.p++; else o.b++;
    o.poin += P[m] || 0;
  };
  res.forEach(function (r) {
    const a = atl[r.atlet_id]; if (!a) return;
    const k = kont[a.kontingen_id], kota = k ? k.kota_kabupaten : '';
    add(out.sekolah, a.sekolah_nama, kota, r.medal); add(out.klub, a.klub_nama, kota, r.medal);
    const jk = (evs[r.event_id] || {}).jenjang_kode || '';
    const j = out.jenjang[jk] || (out.jenjang[jk] = { sekolah: {}, klub: {} });
    add(j.sekolah, a.sekolah_nama, kota, r.medal); add(j.klub, a.klub_nama, kota, r.medal);
  });
  const cnt = { sekolah: {}, klub: {} };
  readT_('TBL_ATLET').forEach(function (a) { if (a.status_atlet !== 'ACTIVE') return; if (a.sekolah_nama) cnt.sekolah[nk_(a.sekolah_nama)] = (cnt.sekolah[nk_(a.sekolah_nama)] || 0) + 1; if (a.klub_nama) cnt.klub[nk_(a.klub_nama)] = (cnt.klub[nk_(a.klub_nama)] || 0) + 1; });
  const fin = function (b, c, lim) { return Object.keys(b).map(function (k) { const o = b[k]; o.atlet = c ? (c[k] || 0) : 0; o.total = o.e + o.p + o.b; return o; }).sort(cmpKlas_).slice(0, lim || 200); };
  const jn = {};
  Object.keys(out.jenjang).forEach(function (k) { jn[k] = { sekolah: fin(out.jenjang[k].sekolah, cnt.sekolah, 30), klub: fin(out.jenjang[k].klub, cnt.klub, 30) }; });
  return { sekolah: fin(out.sekolah, cnt.sekolah), klub: fin(out.klub, cnt.klub), jenjang: jn };
}

function hPubBoot_() {
  return ok_(cachedPub_(['master', 'atlet', 'hasil', 'galeri'], 'boot', 120, function () {
    const cfg = cfg_(), musim = cfg.musim;
    const evs = readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (e) { return e.is_active; }).sort(function (a, b) { return a.event_no - b.event_no; });
    const jen = readM_('TBL_MASTER_JENJANG').sort(function (a, b) { return a.urutan - b.urutan; });
    const st = evStatus_(musim);
    const kont = readT_('TBL_KONTINGEN').filter(function (k) { return k.status_akun === 'ACTIVE'; }).length;
    const atl = readT_('TBL_ATLET').filter(function (a) { return a.status_atlet === 'ACTIVE'; }).length;
    const resBaru = readT_('TBL_RACE_RESULTS').filter(function (r) { return r.musim === musim && r.status_pengesahan === 'SAH' && r.is_new_record === 1; });
    const atlI = idx_(readT_('TBL_ATLET'), 'atlet_id'), evI = idx_(readM_('TBL_MASTER_NOMOR_LOMBA'), 'event_id');
    const klas = hitungKlasemen_(musim);
    const pub = {}; Object.keys(cfg).forEach(function (k) { if (k.charAt(0) !== '_' && ['rekening', 'logo_buku_json'].indexOf(k) < 0) pub[k] = cfg[k]; }); pub.buka = bukaDaftar_() ? '1' : '0';
    const dok = readT_('TBL_DOKUMEN').filter(function (d) { return d.is_publik === 1 && d.musim === musim; }).map(function (d) { return { did: d.dok_id, jenis: d.jenis, nama: d.nama_file, id: d.file_id, at: d.created_at }; });
    return {
      cfg: pub, events: evs.map(evPub_), jenjang: jenjangAktif_().map(function (j) { return { kode: j.kode_jenjang, nama: j.nama_jenjang, min: j.kelas_min, max: j.kelas_max, huruf: hurufKel_(j.kode_jenjang) }; }), st: st,
      agenda: agendaBeranda_(), ring: { medali: readT_('TBL_RACE_RESULTS').filter(function (r) { return r.musim === musim && r.status_pengesahan === 'SAH' && r.medal; }).length, atlet: atl, kontingen: kont, peserta: Object.keys((evHitung_()[musim] || { a: {} }).a).length, nomor: evs.length, sah: Object.keys(st).filter(function (k) { return st[k].s === 'SAH'; }).length, rekorBaru: resBaru.length },
      top: klas.sekolah.slice(0, 3), dok: dok, logos: logoList_().filter(function (x) { return x.web === 1; }).map(function (x) { return { id: x.id, nama: x.nama }; }),
      baru: resBaru.slice(-3).reverse().map(function (r) { const a = atlI[r.atlet_id] || {}, e = evI[r.event_id] || {}; return { event: e.event_name, g: e.gender, jk: e.jenjang_kode, waktu: r.final_time, nama: a.nama_lengkap, kont: a.sekolah_nama || a.klub_nama }; })
    };
  }));
}

function hPubStart_(me, d) {
  const id = String(d.id || '');
  return ok_(cachedPub_(['master', 'atlet', 'hasil'], 'sl_' + id, 60, function () {
    const cfg = cfg_(), ev = readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (e) { return e.event_id === id; })[0];
    if (!ev) err_('Nomor lomba tidak ditemukan.');
    const atl = idx_(readT_('TBL_ATLET'), 'atlet_id'), heats = {};
    readT_('TBL_HEAT_SEEDS').filter(function (s) { return s.musim === cfg.musim && s.event_id === id; }).forEach(function (s) {
      const a = aInfo_(atl[s.atlet_id]); a.lane = s.lane_number; a.seed = s.entry_seed_time || 'NT';
      (heats[s.heat_number] = heats[s.heat_number] || []).push(a);
    });
    const hs = Object.keys(heats).map(Number).sort(function (a, b) { return a - b; }).map(function (n) { return { n: n, rows: heats[n].sort(function (a, b) { return a.lane - b.lane; }) }; });
    return { event: evPub_(ev), heats: hs, rec: recOf_(ev), lanes: Number(cfg.jumlah_lintasan) || 8 };
  }));
}

// Perkiraan beban pengunjung (per menit, dari cache; sampel 1 dari 4 permintaan agar murah) → jeda polling yang disarankan ke browser.
function bebanLive_() {
  try {
    const c = CacheService.getScriptCache(), k = 'ld_' + Math.floor(Date.now() / 60000), n = Number(c.get(k) || 0);
    if (Math.random() < 0.25) c.put(k, String(n + 4), 180);
    const per = n, dasar = Math.max(15, Math.min(300, Number(cfg_().live_detik) || 30));
    return per > 2400 ? Math.max(dasar, 120) : per > 1500 ? Math.max(dasar, 90) : per > 800 ? Math.max(dasar, 60) : dasar; // >40/dtk, >25/dtk, >13/dtk
  } catch (e) { return 0; }
}
function hPubLive_(me, d) {
  const r = hPubLive0_(me, d); if (r && r.data) r.data = Object.assign({}, r.data, { jeda: bebanLive_() }); return r;
}
function hPubLive0_(me, d) {
  const id = String(d.id || '');
  return ok_(cachedPub_(['master', 'atlet', 'hasil'], 'lv_' + id, 15, function () {
    const cfg = cfg_(), ev = readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (e) { return e.event_id === id; })[0];
    if (!ev) err_('Nomor lomba tidak ditemukan.');
    const atl = idx_(readT_('TBL_ATLET'), 'atlet_id');
    const rs = readT_('TBL_RACE_RESULTS').filter(function (r) { return r.musim === cfg.musim && r.event_id === id && (r.status_pengesahan === 'SUBMITTED' || r.status_pengesahan === 'SAH'); });
    const rows = rs.map(function (r) { const a = aInfo_(atl[r.atlet_id]); a.rank = r.rank_event; a.lane = r.lane_number; a.heat = r.heat_number; a.waktu = r.final_time; a.st = r.status_lomba; a.dq = r.dq_code; a.sah = r.status_pengesahan === 'SAH'; a.baru = r.is_new_record === 1; a.medal = r.medal; return a; })
      .sort(function (a, b) { return (a.rank || 999) - (b.rank || 999) || a.lane - b.lane; });
    const so = readT_('TBL_WASIT_SIGNOFF').filter(function (s) { return s.musim === cfg.musim && s.event_id === id && s.is_locked === 1; })[0];
    return { event: evPub_(ev), rows: rows, so: so ? { oleh: so.referee_name, at: so.signoff_at } : null, rec: recOf_(ev), at: nowIso_() };
  }));
}

function hPubRekor_() {
  return ok_(cachedPub_(['master', 'hasil'], 'rekor', 300, function () {
    const cfg = cfg_(), baru = {};
    readT_('TBL_RACE_RESULTS').forEach(function (r) { if (r.musim === cfg.musim && r.is_new_record === 1 && r.status_pengesahan === 'SAH') baru[r.result_id] = 1; });
    const ju = {}, gu = { 'Gaya Bebas': 1, 'Gaya Punggung': 2, 'Gaya Dada': 3, 'Gaya Kupu-kupu': 4, 'Gaya Ganti Perorangan': 5 }; readM_('TBL_MASTER_JENJANG').forEach(function (j) { ju[j.kode_jenjang] = j.urutan; });
    return readT_('TBL_REKOR_KEJUARAAN').map(function (r) { let rw = []; try { rw = JSON.parse(r.riwayat || '[]'); } catch (e) { } return { id: r.rekor_id, ct: String(r.rekor_key || '').split('|')[4] || 'LCM', event: r.event_name, jk: r.jenjang_kode, g: r.gender, s: r.stroke_type, d: r.distance_m, nama: r.pemegang_nama, kont: r.kontingen_nama, waktu: r.rekor_waktu, tahun: r.tahun, lokasi: r.lokasi, ev: r.event_rekor || '', tgl: r.tanggal || '', baru: !!baru[r.result_id], aid: r.atlet_id, sebelum: rw.length ? { w: rw[rw.length - 1].w, n: rw[rw.length - 1].n, ev: rw[rw.length - 1].ev || '' } : null }; })
      .sort(function (a, b) { return (ju[a.jk] || 99) - (ju[b.jk] || 99) || (gu[a.s] || 9) - (gu[b.s] || 9) || a.d - b.d || String(a.g).localeCompare(String(b.g)); });
  }));
}

function hPubKlas_() {
  return ok_(cachedPub_(['master', 'atlet', 'hasil'], 'klas', 120, function () {
    const cfg = cfg_(), k = hitungKlasemen_(cfg.musim), st = evStatus_(cfg.musim);
    const tot = k.sekolah.reduce(function (s, x) { return s + x.total; }, 0);
    const arsip = readT_('TBL_EVENT_ARCHIVE_LOG').map(function (a) { let sn = {}; try { sn = JSON.parse(a.snapshot_json || '{}'); } catch (e) { } return { musim: a.season_name, atlet: a.total_atlet, kontingen: a.total_kontingen, at: a.closed_at, juara: sn.juara || '', top: sn.top || [], event: sn.event || '', tanggal: sn.tanggal || '', tglTeks: sn.tanggal ? tglID_(sn.tanggal) : '', lokasi: sn.lokasi || '' }; }).sort(function (a, b) { return String(a.tanggal || a.at).localeCompare(String(b.tanggal || b.at)); });
    return { sekolah: k.sekolah, klub: k.klub, jenjang: k.jenjang, ring: { medali: tot, sah: Object.keys(st).filter(function (x) { return st[x].s === 'SAH'; }).length, nomor: readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (e) { return e.is_aktif || e.is_active; }).length }, arsip: arsip };
  }));
}

// ── Klasemen tahunan: dihitung ulang dari 0 setiap tahun kalender (Januari–Desember) ──
// Menjumlahkan medali semua event KRP dengan tanggal di tahun itu: event di web (hasil yang disahkan) + arsip hasil lama yang sudah difinalkan.
// Tahun sebelumnya tetap bisa dibuka (arsip).
function tahunMusim_() {
  const m = {}, set = function (k, tg, nama) { if (!k) return; const y = Number(String(tg || '').slice(0, 4)) || 0; const o = m[k] || (m[k] = { musim: k, th: 0, tgl: '', nama: '' }); if (y && !o.th) { o.th = y; o.tgl = String(tg).slice(0, 10); } if (nama && !o.nama) o.nama = nama; };
  evRows_(true).forEach(function (e) { set(e.musim, e.tgl_mulai, e.nama); });
  const c = cfg_(); set(c.musim, c.tanggal_mulai, (c.app_name || '') + (c.buku_subjudul ? ' ' + c.buku_subjudul : ''));
  readT_('TBL_RACE_RESULTS').forEach(function (r) { if (!m[r.musim]) set(r.musim, String(r.input_at || '').slice(0, 10), ''); });
  const mt = arsipMeta_(); Object.keys(mt).forEach(function (k) { set(k, mt[k].tanggal, mt[k].event); });
  readT_('TBL_EVENT_ARCHIVE_LOG').forEach(function (a) { let sn = {}; try { sn = JSON.parse(a.snapshot_json || '{}'); } catch (e) { } set(a.season_name, sn.tanggal, sn.event); });
  Object.keys(m).forEach(function (k) { if (!m[k].th) { const x = /(20\d\d)/.exec(k); m[k].th = x ? Number(x[1]) : 0; } });
  return m;
}
function klasTahun_(th) {
  const tm = tahunMusim_(), fin = {}, imp = {}, web = {};
  readT_('TBL_EVENT_ARCHIVE_LOG').forEach(function (a) { fin[a.season_name] = 1; });
  readT_('TBL_HASIL_ARSIP').forEach(function (r) { imp[r.musim] = 1; });
  readT_('TBL_RACE_RESULTS').forEach(function (r) { if (r.status_pengesahan === 'SAH' && r.medal) web[r.musim] = 1; });
  const ada = {}, evs = [], rows = [];
  Object.keys(tm).forEach(function (k) { const o = tm[k]; if (!o.th) return; const pakai = imp[k] ? !!fin[k] : !!web[k]; if (!pakai) return; ada[o.th] = 1; if (o.th !== th) return;
    const R = arsipNormal_(k).filter(function (r) { return r.medal; }); if (!R.length) return; R.forEach(function (r) { rows.push(r); }); evs.push({ musim: k, nama: o.nama || k, tgl: o.tgl, medali: R.length, sumber: imp[k] ? 'ARSIP' : 'WEB' }); });
  evs.sort(function (a, b) { return String(a.tgl || '9999').localeCompare(String(b.tgl || '9999')); });
  const k = klasemenRows_(rows), jg = {};
  rows.forEach(function (r) { const jk = r.kelas !== '' && r.kelas != null && String(r.kelas) !== '' ? (jenjangOfAll_(Number(r.kelas)) || r.jk) : r.jk; (jg[jk || '-'] = jg[jk || '-'] || []).push(r); });
  const jn = {}; Object.keys(jg).forEach(function (x) { const q = klasemenRows_(jg[x]); jn[x] = { sekolah: q.sekolah.slice(0, 30), klub: q.klub.slice(0, 30) }; });
  const now = Number(Utilities.formatDate(new Date(), TZ, 'yyyy')); ada[now] = 1;
  return { tahun: th, tahunIni: now, daftar: Object.keys(ada).map(Number).sort(function (a, b) { return b - a; }), events: evs, sekolah: k.sekolah.slice(0, 200), klub: k.klub.slice(0, 200), jenjang: jn };
}
function hPubKlasTahun_(me, d) {
  const now = Number(Utilities.formatDate(new Date(), TZ, 'yyyy')), th = toInt_(d.tahun, now) || now;
  return ok_(cachedPub_(['master', 'atlet', 'hasil'], 'klt_' + th, 300, function () { return klasTahun_(th); }));
}

// ── Excel buku acara (start list) untuk Admin Input Data & Super Admin: cadangan pencatatan manual ──
function hBukuXls_(me, d) {
  const D = docData_(), hari = toInt_(d.hari, 0), out = [];
  D.evs.forEach(function (e) {
    if (hari && e.hari !== hari) return; const ss = D.seeds.filter(function (s) { return s.event_id === e.event_id; }); if (!ss.length) return;
    const hn = []; ss.forEach(function (s) { if (hn.indexOf(s.heat_number) < 0) hn.push(s.heat_number); }); hn.sort(function (a, b) { return a - b; });
    ss.sort(function (a, b) { return a.heat_number - b.heat_number || a.lane_number - b.lane_number; }).forEach(function (s) {
      const a = D.atl[s.atlet_id] || {};
      out.push({ hari: e.hari, jam: e.jam || '', jamHeat: e.jam ? jamPlus_(e.jam, (s.heat_number - hn[0]) * (e.mnHeat || 0)) : '', no: e.event_no, nomor: e.event_name, kel: jenLabel_(e.jenjang_kode, (D.jen[e.jenjang_kode] || {}).nama_jenjang), g: e.gender, heat: s.heat_number, lane: s.lane_number, bib: a.bib || '', nama: String(a.nama_lengkap || '').toUpperCase(), kls: a.kelas_num === 0 ? 'TK' : (a.kelas_num === '' || a.kelas_num == null ? '' : a.kelas_num), asal: String(a.sekolah_nama || '').toUpperCase(), kota: String(a.kota_asal || '').toUpperCase(), entry: s.entry_seed_time || 'NT' });
    });
  });
  return ok_({ judul: D.cfg.app_name, sub: D.cfg.buku_subjudul || '', tgl: D.cfg.tanggal_teks || '', lokasi: D.cfg.lokasi || '', musim: D.cfg.musim, rows: out });
}
function verifiedAtlet_() { const s = {}; readT_('TBL_REGISTRASI_ENTRI').forEach(function (e) { if (e.status_verifikasi === 'VERIFIED') s[e.atlet_id] = 1; }); return s; }

function hPubAtlet_() {
  return ok_(cached_(['atlet', 'hasil'], 'dir', 300, function () {
    const med = {}, rk = {}, ver = verifiedAtlet_();
    readT_('TBL_RACE_RESULTS').forEach(function (r) { if (r.status_pengesahan !== 'SAH' || !r.medal) return; const m = med[r.atlet_id] || (med[r.atlet_id] = { e: 0, p: 0, b: 0 }); if (r.medal === 'EMAS') m.e++; else if (r.medal === 'PERAK') m.p++; else m.b++; });
    readT_('TBL_REKOR_KEJUARAAN').forEach(function (x) { rk[x.atlet_id] = (rk[x.atlet_id] || 0) + 1; });
    return readT_('TBL_ATLET').filter(function (a) { return a.status_atlet === 'ACTIVE' && ver[a.atlet_id]; }).map(function (a) {
      const m = med[a.atlet_id] || { e: 0, p: 0, b: 0 };
      return { id: a.atlet_id, n: a.nama_lengkap, bib: a.bib, g: a.jenis_kelamin, sk: a.sekolah_nama, kl: a.klub_nama, jk: a.jenjang_kode, e: m.e, p: m.p, b: m.b, rk: rk[a.atlet_id] || 0, f: a.foto_file_id };
    });
  }));
}

function hPubProfil_(me, d) {
  const id = String(d.id || '');
  return ok_(cached_(['master', 'atlet', 'hasil'], 'pf_' + id, 300, function () {
    const a = readT_('TBL_ATLET').filter(function (x) { return x.atlet_id === id; })[0];
    if (!a || !verifiedAtlet_()[id]) err_('Profil atlet tidak ditemukan.');
    const evs = idx_(readM_('TBL_MASTER_NOMOR_LOMBA'), 'event_id'), cfg = cfg_();
    const seeds = readT_('TBL_HEAT_SEEDS').filter(function (s) { return s.atlet_id === id; });
    const sd = {}; seeds.forEach(function (s) { sd[s.musim + '|' + s.event_id] = s; });
    const res = readT_('TBL_RACE_RESULTS').filter(function (r) { return r.atlet_id === id && (r.status_pengesahan === 'SAH' || (r.musim === cfg.musim && r.status_pengesahan === 'SUBMITTED')); });
    const hasil = res.map(function (r) { const e = evs[r.event_id] || {}; return { musim: r.musim, event: e.event_name, no: e.event_no, jk: e.jenjang_kode, waktu: r.final_time, st: r.status_lomba, rank: r.rank_event, medal: r.medal, baru: r.is_new_record === 1, sah: r.status_pengesahan === 'SAH' }; });
    const nomor = readT_('TBL_REGISTRASI_ENTRI').filter(function (e) { return e.atlet_id === id && e.musim === cfg.musim && e.status_verifikasi === 'VERIFIED'; }).map(function (e) { const ev = evs[e.event_id] || {}, s = sd[e.musim + '|' + e.event_id]; return { event: ev.event_name, no: ev.event_no, jk: ev.jenjang_kode, g: ev.gender, hari: ev.hari, jam: ev.jam, seed: e.seed_time_entry || 'NT', heat: s ? s.heat_number : 0, lane: s ? s.lane_number : 0 }; });
    const mut = readT_('TBL_MUTASI_ATLET').filter(function (m) { return m.atlet_id === id && m.status_approval === 'APPROVED' && m.tipe === 'MUTASI'; }).map(function (m) { return { lama: m.nilai_lama, baru: m.nilai_baru, at: m.diputuskan_at }; });
    const med = { e: 0, p: 0, b: 0 }; hasil.forEach(function (h) { if (!h.sah) return; if (h.medal === 'EMAS') med.e++; else if (h.medal === 'PERAK') med.p++; else if (h.medal === 'PERUNGGU') med.b++; });
    const rk = readT_('TBL_REKOR_KEJUARAAN').filter(function (x) { return x.atlet_id === id; }).map(function (x) { return { event: x.event_name, waktu: x.rekor_waktu, tahun: x.tahun, ev: x.event_rekor || '' }; });
    let arsip = []; try { arsip = prestasiArsip_(id, true); } catch (e) { } arsip.forEach(function (h) { if (h.medal === 'EMAS') med.e++; else if (h.medal === 'PERAK') med.p++; else if (h.medal === 'PERUNGGU') med.b++; });
    return { id: a.atlet_id, nama: a.nama_lengkap, bib: a.bib, g: a.jenis_kelamin, sk: a.sekolah_nama, kl: a.klub_nama, jk: a.jenjang_kode, prov: a.provinsi_asal, f: a.foto_file_id, med: med, hasil: hasil, nomor: nomor, mut: mut, rekor: rk, arsip: arsip };
  }));
}

function hPubGaleri_() {
  return ok_(cached_(['galeri'], 'galeri', 600, function () { return readT_('TBL_GALERI').map(function (g) { return { id: g.galeri_id, f: g.file_id, cap: g.caption, ev: g.event_label, at: g.created_at, tipe: g.tipe || 'FOTO', url: g.url }; }).reverse(); }));
}

// ============================================================
// AUTENTIKASI, REGISTRASI LEMBAGA, AREA KONTINGEN
// ============================================================
function throttle_(key) { const n = Number(CacheService.getScriptCache().get('lg_' + key) || 0); if (n >= 5) err_('Terlalu banyak percobaan. Coba lagi dalam 15 menit.'); return n; }
function gagalLogin_(key, n) { CacheService.getScriptCache().put('lg_' + key, String(n + 1), 900); Utilities.sleep(500); }

function hLogin_(me, d) {
  const mode = d.mode === 'PANITIA' ? 'PANITIA' : 'KONTINGEN';
  const ident = String(d.id || '').trim().toLowerCase(), pw = String(d.password || '');
  if (!ident || !pw) err_('Isi identitas dan kata sandi.');
  const n = throttle_(ident);
  if (mode === 'PANITIA' && prop_('EMERGENCY_PASS_HASH') && ident === prop_('EMERGENCY_USER').toLowerCase()) {
    if (samaAman_(hashPass_(pw, prop_('EMERGENCY_SALT')), prop_('EMERGENCY_PASS_HASH'))) {
      const m = { id: 'darurat', role: R.SA, nama: 'Akses Darurat' }; audit_(m, 'LOGIN_DARURAT', 'Keamanan', '');
      return ok_({ token: buatSesi_('darurat', R.SA, m.nama, true), me: m, landing: LANDING[R.SA] });
    }
    gagalLogin_(ident, n); err_('Identitas atau kata sandi salah.');
  }
  let rec = null, role = '', id = '', nama = '';
  if (mode === 'PANITIA') {
    rec = readT_('TBL_USERS_ROLES', true).filter(function (u) { return u.email.toLowerCase() === ident && u.status === 'ACTIVE'; })[0];
    if (rec) { role = rec.role; id = rec.user_id; nama = rec.full_name; }
  } else {
    rec = readT_('TBL_KONTINGEN', true).filter(function (k) { return (k.npsn_or_sk.toLowerCase() === ident || k.pj_email.toLowerCase() === ident) && k.status_akun === 'ACTIVE'; })[0];
    if (rec) { role = R.KT; id = rec.kontingen_id; nama = rec.nama_lembaga; }
  }
  const okPw = samaAman_(hashPass_(pw, rec ? rec.pass_salt : 'x'), rec ? rec.pass_hash : '') && !!rec;
  if (!okPw) { gagalLogin_(ident, n); err_('Identitas atau kata sandi salah.'); }
  CacheService.getScriptCache().remove('lg_' + ident);
  audit_({ id: id, role: role, nama: nama }, 'LOGIN', 'Akses', mode);
  return ok_({ token: buatSesi_(id, role, nama, false), me: { id: id, role: role, nama: nama }, landing: LANDING[role] });
}

function cekFile_(f, jenis) {
  if (!f || !f.b64) err_('Berkas ' + jenis + ' wajib diunggah.');
  const mime = String(f.mime || '').toLowerCase();
  if (['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].indexOf(mime) < 0) err_('Format ' + jenis + ' harus PDF, JPG, PNG, atau WEBP.');
  const bytes = Utilities.base64Decode(f.b64);
  if (bytes.length > 5 * 1024 * 1024) err_('Ukuran ' + jenis + ' maksimal 5 MB.');
  const h = bytes.slice(0, 4).map(function (b) { return (b < 0 ? b + 256 : b); });
  const sigOk = (mime === 'application/pdf' && h[0] === 0x25 && h[1] === 0x50) || (mime === 'image/jpeg' && h[0] === 0xFF && h[1] === 0xD8) || (mime === 'image/png' && h[0] === 0x89 && h[1] === 0x50) || (mime === 'image/webp' && h[0] === 0x52 && h[1] === 0x49);
  if (!sigOk) err_('Isi berkas ' + jenis + ' tidak sesuai formatnya.');
  return Utilities.newBlob(bytes, mime, String(f.name || 'berkas').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80));
}
function bagikan_(file) { try { file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (e) { /* kebijakan domain dapat memblokir */ } }
function kirimEmail_(to, subjek, html) {
  if (tundaSetelah_(function () { kirimEmail0_(to, subjek, html); })) return;
  kirimEmail0_(to, subjek, html);
}
function kirimEmail0_(to, subjek, html) {
  try { if (!emailValid_(to)) return; if (MailApp.getRemainingDailyQuota() < 3) return; MailApp.sendEmail({ to: to, subject: subjek, htmlBody: '<div style="font-family:Arial,sans-serif;color:#0B1F33;max-width:560px"><h3 style="color:#0A3D62;margin:0 0 8px">' + esc_(cfg_().app_name) + '</h3>' + html + (cfg_().portal_url ? '<p style="margin-top:14px"><a href="' + esc_(cfg_().portal_url) + '" style="background:#0A3D62;color:#fff;padding:9px 16px;border-radius:8px;text-decoration:none;font-weight:bold">Buka portal</a></p>' : '') + '<p style="color:#4A6072;font-size:12px;margin-top:16px">Email otomatis, mohon tidak membalas.</p></div>', name: cfg_().app_name }); } catch (e) { console.error('email: ' + e.message); }
}
function nextSeq_(key) { const n = Number(prop_(key, '0')) + 1; setProp_(key, n); return n; }

function hDaftarLembaga_(me, d) {
  const cfg = cfg_();
  if (d.website) err_('Permintaan ditolak.');
  if (!bukaDaftar_()) err_('Pendaftaran sedang ditutup.');
  const tipe = d.tipe === 'KLUB' ? 'KLUB' : d.tipe === 'MANDIRI' ? 'MANDIRI' : 'SEKOLAH', nama = String(d.nama || '').trim();
  if (!tipeBoleh_(tipe)) err_('Event ini tidak menerima pendaftaran akun ' + ({ SEKOLAH: 'sekolah', KLUB: 'klub', MANDIRI: 'pribadi/mandiri' })[tipe] + '.');
  const email = String(d.email || '').trim().toLowerCase(), tel = String(d.telepon || '').replace(/\D/g, ''), npsn = tipe === 'MANDIRI' ? email : String(d.npsn || '').trim();
  if (nama.length < 3) err_('Nama lembaga minimal 3 karakter.');
  if (tipe === 'SEKOLAH' && !/^\d{8}$/.test(npsn)) err_('NPSN harus 8 digit angka.');
  if (tipe === 'KLUB' && npsn.length < 3) err_('Isi nomor SK / kode klub.');
  if (!String(d.kota || '').trim()) err_('Kabupaten/kota wajib diisi.');
  if (tipe !== 'MANDIRI' && String(d.pj || '').trim().length < 3) err_('Nama penanggung jawab wajib diisi.');
  if (!emailValid_(email)) err_('Email tidak valid.');
  if (tel.length < 8 || tel.length > 15) err_('Nomor telepon/WhatsApp tidak valid.');
  if (!kuatSandi_(d.password)) err_('Kata sandi minimal 8 karakter dengan huruf dan angka.');
  const c = CacheService.getScriptCache(), rk = 'reg_' + email, rn = Number(c.get(rk) || 0);
  if (rn >= 3) err_('Terlalu banyak permintaan. Coba lagi nanti.'); c.put(rk, String(rn + 1), 3600);
  const ks = readT_('TBL_KONTINGEN', true);
  if (ks.some(function (k) { return k.npsn_or_sk.toLowerCase() === npsn.toLowerCase(); })) err_('NPSN/kode ini sudah terdaftar.');
  if (ks.some(function (k) { return k.pj_email.toLowerCase() === email; })) err_('Email ini sudah dipakai akun lain.');
  const blob = tipe === 'MANDIRI' ? null : cekFile_(d.mandat, 'surat mandat/SK');
  const id = uid_('K'), root = DriveApp.getFolderById(prop_('FOLDER_BERKAS'));
  const folder = root.createFolder(nama.slice(0, 60) + ' - ' + id);
  const mf = blob ? folder.createFile(blob) : null, salt = Utilities.getUuid();
  appendT_('TBL_KONTINGEN', [{ kontingen_id: id, tipe_lembaga: tipe, nama_lembaga: nama, npsn_or_sk: npsn, provinsi: String(d.provinsi || '').trim(), kota_kabupaten: String(d.kota).trim(), alamat: String(d.alamat || '').trim().slice(0, 250), jenjang_utama: String(d.jenjang || ''), pj_nama: tipe === 'MANDIRI' ? nama : String(d.pj).trim(), pj_jabatan: tipe === 'MANDIRI' ? 'Orang tua / Atlet' : String(d.jabatan || '').trim(), pj_telepon: tel, pj_email: email, pass_hash: hashPass_(d.password, salt), pass_salt: salt, drive_folder_id: folder.getId(), mandat_file_id: mf ? mf.getId() : '', status_akun: 'ACTIVE', created_at: nowIso_() }]);
  bust_('user', 'atlet'); audit_({ id: id, role: R.KT, nama: nama }, 'DAFTAR_LEMBAGA', 'Kontingen', id);
  kirimEmail_(email, 'Akun kontingen berhasil dibuat', '<p>Akun <b>' + esc_(nama) + '</b> telah aktif. Masuk memakai NPSN/kode atau email ini, lalu daftarkan atlet Anda.</p>');
  return ok_({ id: id }, 'Akun berhasil dibuat. Silakan masuk.');
}

function aggStatus_(ents) {
  if (!ents.length) return 'MENUNGGU';
  if (ents.some(function (e) { return e.status_verifikasi === 'REVISION_REQUIRED'; })) return 'REVISI';
  if (ents.some(function (e) { return e.status_verifikasi === 'REJECTED'; })) return 'DITOLAK';
  if (ents.every(function (e) { return e.status_verifikasi === 'VERIFIED' && e.status_bayar === 'PAID_VERIFIED'; })) return 'SAH';
  return 'MENUNGGU';
}

function hMBoot_(me) {
  const cfg = cfg_(), k = readT_('TBL_KONTINGEN').filter(function (x) { return x.kontingen_id === me.id; })[0];
  if (!k) err_('Kontingen tidak ditemukan.');
  const evs = idx_(readM_('TBL_MASTER_NOMOR_LOMBA'), 'event_id');
  const atl = readT_('TBL_ATLET').filter(function (a) { return a.kontingen_id === me.id && a.status_atlet === 'ACTIVE'; });
  const ents = readT_('TBL_REGISTRASI_ENTRI').filter(function (e) { return e.kontingen_id === me.id && e.musim === cfg.musim; });
  const by = {}; ents.forEach(function (e) { (by[e.atlet_id] = by[e.atlet_id] || []).push(e); });
  let total = 0, lunas = 0;
  const list = atl.map(function (a) {
    const es = by[a.atlet_id] || [];
    return {
      id: a.atlet_id, nama: a.nama_lengkap, nisn: a.nisn, bib: a.bib, g: a.jenis_kelamin, kelas: a.kelas_num, jk: jenjangOf_(a.kelas_num) || a.jenjang_kode, tgl: a.tanggal_lahir, f: a.foto_file_id, sk: a.sekolah_nama, kl: a.klub_nama, wl: a.kota_asal, st: aggStatus_(es),
      ent: es.map(function (e) { const ev = evs[e.event_id] || {}; total += e.nominal_biaya; if (e.status_bayar === 'PAID_VERIFIED') lunas += e.nominal_biaya; return { id: e.entry_id, eid: e.event_id, no: ev.event_no, nama: ev.event_name, seed: e.seed_time_entry, v: e.status_verifikasi, b: e.status_bayar, fee: e.nominal_biaya, cat: e.catatan_revisi }; })
    };
  });
  const png = readT_('TBL_MUTASI_ATLET').filter(function (m) { return m.kontingen_id === me.id; }).reverse().slice(0, 50).map(function (m) { const a = idx_(atl, 'atlet_id')[m.atlet_id]; return { id: m.pengajuan_id, tipe: m.tipe, atlet: a ? a.nama_lengkap : m.atlet_id, field: m.field, lama: m.nilai_lama, baru: m.nilai_baru, st: m.status_approval, at: m.diajukan_at, cat: m.catatan_admin }; });
  return ok_({
    kont: { id: k.kontingen_id, nama: k.nama_lembaga, tipe: k.tipe_lembaga, npsn: k.npsn_or_sk, kota: k.kota_kabupaten, provinsi: k.provinsi, pj: k.pj_nama, jabatan: k.pj_jabatan, email: k.pj_email, telp: k.pj_telepon },
    atlet: list, png: png, kuota: { pakai: list.length, maks: k.tipe_lembaga === 'MANDIRI' ? 1 : 0 }, maxEv: Number(cfg.max_individu) || 3, inv: { total: total, lunas: lunas, sisa: total - lunas }, rekening: cfg.rekening, buka: bukaDaftar_(), fix: cfg.event_dikunci !== '1' && ['PENDAFTARAN', 'VERIFIKASI'].indexOf(cfg.fase || 'PENDAFTARAN') >= 0, dl: cfg.registrasi_deadline, fase: cfg.fase, ev: evAturan_(), tipeOk: tipeBoleh_(k.tipe_lembaga)
  });
}

function hSekolahList_() { return ok_(cached_(['atlet'], 'sekolah', 300, function () { return readT_('TBL_KONTINGEN').filter(function (k) { return k.status_akun === 'ACTIVE' && k.tipe_lembaga === 'SEKOLAH'; }).map(function (k) { return k.nama_lembaga; }).sort(); })); }
function hKontList_(me) { return ok_(readT_('TBL_KONTINGEN').filter(function (k) { return k.status_akun === 'ACTIVE' && k.tipe_lembaga !== 'MANDIRI' && k.kontingen_id !== me.id; }).map(function (k) { return { id: k.kontingen_id, nama: k.nama_lembaga, tipe: k.tipe_lembaga }; })); }

function hUpload_(me, d) {
  const k = readT_('TBL_KONTINGEN').filter(function (x) { return x.kontingen_id === me.id; })[0];
  if (!k) err_('Kontingen tidak ditemukan.');
  const kind = String(d.kind || ''); if (['foto', 'akta', 'surat', 'sosmed', 'bayar', 'bukti'].indexOf(kind) < 0) err_('Jenis berkas tidak dikenal.');
  const blob = cekFile_(d, kind);
  const f = DriveApp.getFolderById(k.drive_folder_id).createFile(blob.setName(kind + '_' + Date.now() + '_' + blob.getName()));
  if (kind === 'foto') bagikan_(f);
  return ok_({ id: f.getId(), sig: bindFile_(me.id, f.getId(), kind), name: blob.getName() });
}
function ambilFile_(me, f, kind, wajib) {
  if (!f || !f.id) { if (wajib) err_('Berkas ' + kind + ' wajib diunggah.'); return ''; }
  if (!samaAman_(bindFile_(me.id, f.id, kind), String(f.sig || ''))) err_('Berkas ' + kind + ' tidak valid. Unggah ulang.');
  return f.id;
}

function hAtletSimpan_(me, d) {
  const cfg = cfg_();
  if (!bukaDaftar_()) err_('Pendaftaran sudah ditutup. Tidak ada pendaftaran atlet baru.');
  const k = readT_('TBL_KONTINGEN', true).filter(function (x) { return x.kontingen_id === me.id; })[0];
  const nama = String(d.nama || '').trim(), nisn = String(d.nisn || '').trim(), g = d.g === 'PUTRI' ? 'PUTRI' : 'PUTRA', kelas = toInt_(d.kelas, -1), tgl = String(d.tgl || '');
  if (nama.length < 3) err_('Nama atlet minimal 3 karakter.');
  if (!/^\d{10}$/.test(nisn)) err_('NISN harus 10 digit angka.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tgl)) err_('Tanggal lahir tidak valid.');
  const umur = usia_(tgl); if (umur < 3 || umur > 20) err_('Usia atlet di luar rentang yang diizinkan (3–20 tahun).');
  if (kelas < 0 || kelas > 12) err_('Kelas tidak valid.');
  if (!String(d.kota || '').trim()) err_('Wilayah sekolah atlet (kabupaten/kota) wajib diisi.');
  const atl = readT_('TBL_ATLET', true);
  if (atl.some(function (a) { return a.nisn === nisn && a.status_atlet === 'ACTIVE'; })) err_('NISN sudah terdaftar pada atlet lain.');
  if (k.tipe_lembaga === 'MANDIRI') {
    if (atl.some(function (a) { return a.kontingen_id === me.id && a.status_atlet === 'ACTIVE'; })) err_('Akun mandiri hanya dapat mendaftarkan satu atlet (nama sendiri). Untuk nomor tambahan, pilih nomor pada atlet yang sudah terdaftar.');
    if (nk_(nama) !== nk_(k.nama_lembaga)) err_('Akun mandiri hanya boleh mendaftarkan nama sendiri: ' + k.nama_lembaga + '.');
  }
  const jk = jenjangOf_(kelas); if (!jk) err_('Kelompok jenjang tidak ditemukan untuk kelas ini.');
  const sekolah = k.tipe_lembaga === 'SEKOLAH' ? k.nama_lembaga : String(d.sekolah || '').trim();
  const klub = k.tipe_lembaga === 'KLUB' ? k.nama_lembaga : String(d.klub || '').trim();
  if (!sekolah) err_('Nama sekolah asal wajib diisi.');
  if (!tipeBoleh_(k.tipe_lembaga)) err_('Event ini tidak menerima pendaftaran dari jenis akun Anda.');
  const pilih = Array.isArray(d.events) ? d.events : [];
  if (!pilih.length) err_('Pilih minimal satu nomor lomba.');
  const maks = Number(cfg.max_individu) || 3, mins = Math.max(1, Number(cfg.min_nomor) || 1); if (pilih.length > maks) err_('Maksimal ' + maks + ' nomor per atlet.'); if (pilih.length < mins) err_('Setiap atlet wajib mengikuti ' + mins + ' nomor' + (mins < maks ? ' (maksimal ' + maks + ')' : '') + '.');
  const evs = idx_(readM_('TBL_MASTER_NOMOR_LOMBA'), 'event_id'), seen = {}; let total = 0;
  const rows = pilih.map(function (p, pi) {
    const ev = evs[p.eid]; if (!ev || !ev.is_active) err_('Nomor lomba tidak tersedia.'); if (ev.dibuka === '0') err_('Pendaftaran nomor #' + ev.event_no + ' sudah ditutup.');
    if (seen[p.eid]) err_('Nomor lomba dipilih ganda.'); seen[p.eid] = 1;
    if (ev.gender !== g) err_('Nomor #' + ev.event_no + ' bukan untuk jenis kelamin atlet.');
    if (ev.jenjang_kode !== jk) err_('Nomor #' + ev.event_no + ' untuk ' + jenLabel_(ev.jenjang_kode) + ', bukan ' + jenLabel_(jk) + '.');
    let ms = 0, st = String(p.seed || '').trim();
    if (st) { ms = parseWaktu_(st); if (ms <= 0) err_('Format seed time #' + ev.event_no + ' tidak valid (contoh 00:57.94).'); st = fmtWaktu_(ms); }
    const fee = feeEntri_(ev, pi); total += fee; return { ev: ev, ms: ms, st: st, fee: fee };
  });
  cekKuota_(rows.map(function (r) { return { aid: '', ev: r.ev }; }));
  const foto = ambilFile_(me, d.foto, 'foto', true), akta = ambilFile_(me, d.akta, 'akta', true), surat = ambilFile_(me, d.surat, 'surat', true), sosmed = ambilFile_(me, d.sosmed, 'sosmed', true);
  const bayar = ambilFile_(me, d.bayar, 'bayar', total > 0);
  const aid = uid_('A'), bib = 'A-' + ('0000' + nextSeq_('SEQ_BIB')).slice(-4), t = nowIso_();
  appendT_('TBL_ATLET', [{ atlet_id: aid, bib: bib, nisn: nisn, nama_lengkap: nama, jenis_kelamin: g, tempat_lahir: String(d.tempat || '').trim(), tanggal_lahir: tgl, kontingen_id: me.id, sekolah_nama: sekolah, klub_nama: klub, kelas_num: kelas, jenjang_kode: jk, provinsi_asal: String(d.provinsi || '').trim(), kota_asal: String(d.kota).trim(), hp_kontak: String(d.hp || '').replace(/\D/g, ''), foto_file_id: foto, akta_file_id: akta, surat_file_id: surat, sosmed_file_id: sosmed, status_atlet: 'ACTIVE', created_at: t }]);
  appendT_('TBL_REGISTRASI_ENTRI', rows.map(function (r) { return { entry_id: uid_('EN'), musim: cfg.musim, atlet_id: aid, kontingen_id: me.id, event_id: r.ev.event_id, seed_time_entry: r.st, seed_ms: r.ms, nominal_biaya: r.fee, status_verifikasi: 'PENDING', status_bayar: bayar ? 'PENDING_CONFIRMATION' : 'UNPAID', bukti_bayar_file_id: bayar, verified_by: '', verified_at: '', catatan_revisi: '', created_at: t }; }));
  bust_('atlet'); audit_(me, 'ATLET_BARU', 'Atlet', aid + ' ' + nama);
  kirimEmail_(k.pj_email, 'Pendaftaran atlet diterima: ' + nama, '<p>Pendaftaran <b>' + esc_(nama) + '</b> (BIB ' + esc_(bib) + ') berstatus <b>menunggu verifikasi</b>. Total biaya: Rp ' + total.toLocaleString('id-ID') + '.</p>');
  return ok_({ id: aid, bib: bib }, 'Pendaftaran terkirim dan menunggu verifikasi panitia.');
}
function hDaftarNomor_(me, d) {
  const cfg = cfg_(); if (!bukaDaftar_()) err_('Pendaftaran sudah ditutup. Tidak ada pendaftaran nomor baru.');
  const k = readT_('TBL_KONTINGEN', true).filter(function (x) { return x.kontingen_id === me.id; })[0]; if (!k) err_('Akun tidak ditemukan.');
  if (!tipeBoleh_(k.tipe_lembaga)) err_('Event ini tidak menerima pendaftaran dari jenis akun Anda.');
  const items = Array.isArray(d.items) ? d.items : [], mins = Math.max(1, Number(cfg.min_nomor) || 1); if (!items.length) err_('Pilih minimal satu atlet.');
  const atl = idx_(readT_('TBL_ATLET', true), 'atlet_id'), evs = idx_(readM_('TBL_MASTER_NOMOR_LOMBA'), 'event_id'), sudah = {}, seenA = {}, maks = Number(cfg.max_individu) || 3, baru = []; let total = 0;
  readT_('TBL_REGISTRASI_ENTRI', true).forEach(function (e) { if (e.musim === cfg.musim && e.status_verifikasi !== 'REJECTED') (sudah[e.atlet_id] = sudah[e.atlet_id] || []).push(e.event_id); });
  items.forEach(function (it) {
    const a = atl[it.atletId]; if (!a || a.kontingen_id !== me.id || a.status_atlet !== 'ACTIVE') err_('Atlet tidak ditemukan pada akun Anda.');
    if (seenA[a.atlet_id]) err_('Atlet dipilih ganda.'); seenA[a.atlet_id] = 1;
    const pilih = Array.isArray(it.events) ? it.events : []; if (!pilih.length) err_('Pilih nomor lomba untuk ' + a.nama_lengkap + '.');
    const ada = sudah[a.atlet_id] || []; if (ada.length + pilih.length > maks) err_(a.nama_lengkap + ': maksimal ' + maks + ' nomor per atlet (sudah ' + ada.length + ').');
    if (ada.length + pilih.length < mins) err_(a.nama_lengkap + ': wajib ' + mins + ' nomor per atlet' + (ada.length ? ' (sudah ' + ada.length + ')' : '') + '.');
    const jk = jenjangOf_(a.kelas_num), dup = {};
    pilih.forEach(function (p, pj) {
      const ev = evs[p.eid]; if (!ev || !ev.is_active) err_('Nomor lomba tidak tersedia.'); if (ev.dibuka === '0') err_('Pendaftaran nomor #' + ev.event_no + ' sudah ditutup.');
      if (dup[p.eid] || ada.indexOf(p.eid) >= 0) err_(a.nama_lengkap + ' sudah terdaftar di nomor #' + ev.event_no + '.'); dup[p.eid] = 1;
      if (ev.gender !== a.jenis_kelamin) err_('Nomor #' + ev.event_no + ' bukan untuk jenis kelamin ' + a.nama_lengkap + '.');
      if (ev.jenjang_kode !== jk) err_('Nomor #' + ev.event_no + ' untuk ' + jenLabel_(ev.jenjang_kode) + ', sedangkan ' + a.nama_lengkap + ' ' + (jk ? jenLabel_(jk) : 'tidak masuk kelompok mana pun') + '.');
      let ms = 0, st = String(p.seed || '').trim(); if (st) { ms = parseWaktu_(st); if (ms <= 0) err_('Format seed time #' + ev.event_no + ' tidak valid (contoh 00:57.94).'); st = fmtWaktu_(ms); }
      const fee = feeEntri_(ev, ada.length + pj); total += fee; baru.push({ a: a, ev: ev, ms: ms, st: st, fee: fee });
    });
  });
  cekKuota_(baru.map(function (r) { return { aid: r.a.atlet_id, ev: r.ev }; }));
  const bayar = ambilFile_(me, d.bayar, 'bayar', total > 0), t = nowIso_();
  appendT_('TBL_REGISTRASI_ENTRI', baru.map(function (r) { return { entry_id: uid_('EN'), musim: cfg.musim, atlet_id: r.a.atlet_id, kontingen_id: me.id, event_id: r.ev.event_id, seed_time_entry: r.st, seed_ms: r.ms, nominal_biaya: r.fee, status_verifikasi: 'PENDING', status_bayar: bayar ? 'PENDING_CONFIRMATION' : 'UNPAID', bukti_bayar_file_id: bayar, verified_by: '', verified_at: '', catatan_revisi: '', created_at: t }; }));
  bust_('atlet'); audit_(me, 'DAFTAR_NOMOR', 'Registrasi', items.length + ' atlet, ' + baru.length + ' nomor');
  kirimEmail_(k.pj_email, 'Pendaftaran nomor lomba diterima', '<p>' + baru.length + ' nomor untuk ' + items.length + ' atlet diterima dan <b>menunggu verifikasi</b>. Total biaya: Rp ' + total.toLocaleString('id-ID') + '.</p>');
  return ok_({ n: baru.length, total: total }, 'Pendaftaran nomor terkirim dan menunggu verifikasi panitia.');
}
// Kelompok event aktif (kelompok_json) — dipakai pendaftaran. jenjangOfAll_: seluruh master (arsip & kenaikan kelas).
function jenjangAktif_() {
  if (_MEMO.__jenA) return _MEMO.__jenA; let k = {}; try { k = JSON.parse(cfg_().kelompok_json || '{}') || {}; } catch (e) { }
  const all = readM_('TBL_MASTER_JENJANG').slice().sort(function (a, b) { return a.urutan - b.urutan; }), ks = Object.keys(k);
  _MEMO.__jenA = ks.length ? all.filter(function (j) { return ks.indexOf(j.kode_jenjang) >= 0; }) : all; return _MEMO.__jenA;
}
function hurufKel_(kode) { try { return (JSON.parse(cfg_().kelompok_json || '{}') || {})[kode] || ''; } catch (e) { return ''; } }
function jenjangOf_(kelas) { const js = jenjangAktif_(); for (let i = 0; i < js.length; i++) { if (kelas >= js[i].kelas_min && kelas <= js[i].kelas_max) return js[i].kode_jenjang; } return ''; }
function jenjangOfAll_(kelas) { const js = readM_('TBL_MASTER_JENJANG').slice().sort(function (a, b) { return a.urutan - b.urutan; }); for (let i = 0; i < js.length; i++) { if (kelas >= js[i].kelas_min && kelas <= js[i].kelas_max) return js[i].kode_jenjang; } return ''; }

function hAtletPerbaiki_(me, d) {
  const cfg = cfg_();
  if (cfg.event_dikunci === '1' || ['PENDAFTARAN', 'VERIFIKASI'].indexOf(cfg.fase || 'PENDAFTARAN') < 0) err_('Perbaikan berkas sudah ditutup karena tahap verifikasi selesai.');
  const a = readT_('TBL_ATLET', true).filter(function (x) { return x.atlet_id === d.atletId && x.kontingen_id === me.id; })[0];
  if (!a) err_('Atlet tidak ditemukan.');
  const ents = readT_('TBL_REGISTRASI_ENTRI', true).filter(function (e) { return e.atlet_id === a.atlet_id && e.musim === cfg.musim; });
  if (['REVISI', 'DITOLAK'].indexOf(aggStatus_(ents)) < 0) err_('Hanya pendaftaran berstatus revisi/ditolak yang dapat diperbaiki.');
  const f = d.files || {};
  ['foto', 'akta', 'surat', 'sosmed'].forEach(function (kd) { const id = ambilFile_(me, f[kd], kd, false); if (id) a[kd + '_file_id'] = id; });
  const bayar = ambilFile_(me, f.bayar, 'bayar', false);
  ents.forEach(function (e) { e.status_verifikasi = 'PENDING'; e.catatan_revisi = ''; if (bayar) { e.bukti_bayar_file_id = bayar; e.status_bayar = 'PENDING_CONFIRMATION'; } else if (e.status_bayar !== 'PAID_VERIFIED') e.status_bayar = e.bukti_bayar_file_id ? 'PENDING_CONFIRMATION' : 'UNPAID'; });
  saveRows_('TBL_ATLET', [a]); saveRows_('TBL_REGISTRASI_ENTRI', ents); bust_('atlet'); audit_(me, 'ATLET_PERBAIKI', 'Atlet', a.atlet_id);
  return ok_(null, 'Perbaikan terkirim. Menunggu verifikasi ulang.');
}

const FIELD_REVISI = { nama_lengkap: 'Nama', nisn: 'NISN', tanggal_lahir: 'Tanggal lahir', tempat_lahir: 'Tempat lahir', kelas_num: 'Kelas', klub_nama: 'Klub', hp_kontak: 'No. HP', seed_time: 'Seed time' };
function hPengajuan_(me, d) {
  const cfg = cfg_();
  if (!bukaDaftar_()) err_('Pengajuan hanya dapat dilakukan sebelum pendaftaran ditutup.');
  const kk = readT_('TBL_KONTINGEN').filter(function (x) { return x.kontingen_id === me.id; })[0];
  if (d.tipe === 'MUTASI' && kk && kk.tipe_lembaga === 'MANDIRI') err_('Akun mandiri tidak dapat mengajukan mutasi. Hubungi panitia.');
  const a = readT_('TBL_ATLET', true).filter(function (x) { return x.atlet_id === d.atletId && x.kontingen_id === me.id; })[0];
  if (!a) err_('Atlet tidak ditemukan.');
  const all = readT_('TBL_MUTASI_ATLET', true);
  if (all.filter(function (m) { return m.atlet_id === a.atlet_id && m.status_approval === 'PENDING'; }).length >= 5) err_('Masih ada terlalu banyak pengajuan yang menunggu keputusan.');
  const tipe = d.tipe === 'MUTASI' ? 'MUTASI' : 'REVISI', alasan = String(d.alasan || '').trim();
  if (alasan.length < 5) err_('Alasan pengajuan wajib diisi.');
  const bukti = ambilFile_(me, d.bukti, 'bukti', true);
  const rec = { pengajuan_id: uid_('PG'), musim: cfg.musim, tipe: tipe, atlet_id: a.atlet_id, kontingen_id: me.id, field: '', event_id: '', nilai_lama: '', nilai_baru: '', kontingen_baru_id: '', alasan: alasan.slice(0, 300), bukti_file_id: bukti, status_approval: 'PENDING', diajukan_at: nowIso_(), diputuskan_oleh: '', diputuskan_at: '', catatan_admin: '' };
  if (tipe === 'MUTASI') {
    const tgt = readT_('TBL_KONTINGEN').filter(function (x) { return x.kontingen_id === d.kontBaru && x.status_akun === 'ACTIVE' && x.kontingen_id !== me.id; })[0];
    if (!tgt) err_('Pilih kontingen tujuan yang terdaftar.');
    rec.field = 'kontingen'; rec.nilai_lama = a.sekolah_nama; rec.nilai_baru = tgt.nama_lembaga; rec.kontingen_baru_id = tgt.kontingen_id;
  } else {
    const fld = String(d.field || ''); if (!FIELD_REVISI[fld]) err_('Jenis data yang diubah tidak valid.');
    const nv = String(d.nilai || '').trim(); if (!nv) err_('Nilai baru wajib diisi.');
    rec.field = fld; rec.nilai_baru = nv;
    if (fld === 'seed_time') {
      const en = readT_('TBL_REGISTRASI_ENTRI').filter(function (e) { return e.atlet_id === a.atlet_id && e.event_id === d.eventId && e.musim === cfg.musim; })[0];
      if (!en) err_('Nomor lomba atlet tidak ditemukan.'); if (parseWaktu_(nv) <= 0) err_('Format seed time tidak valid.');
      rec.event_id = en.event_id; rec.nilai_lama = en.seed_time_entry; rec.nilai_baru = fmtWaktu_(parseWaktu_(nv));
    } else {
      if (fld === 'nisn' && !/^\d{10}$/.test(nv)) err_('NISN harus 10 digit.');
      if (fld === 'tanggal_lahir' && !/^\d{4}-\d{2}-\d{2}$/.test(nv)) err_('Tanggal lahir tidak valid.');
      if (fld === 'kelas_num' && (toInt_(nv, -1) < 0 || toInt_(nv, -1) > 12)) err_('Kelas tidak valid.');
      rec.nilai_lama = String(a[fld]);
    }
  }
  appendT_('TBL_MUTASI_ATLET', [rec]); audit_(me, 'PENGAJUAN_' + tipe, 'Atlet', a.atlet_id);
  return ok_(null, 'Pengajuan terkirim. Menunggu keputusan panitia.');
}

function hFileData_(me, d) {
  const fid = String(d.id || ''); if (!fid) err_('Berkas tidak ditemukan.');
  const own = fileOwner_(fid);
  if (!own) err_('Berkas tidak dikenal.');
  if (me.role === R.KT && own !== me.id) err_('Akses berkas ditolak.');
  if (me.role !== R.KT && STAFF.indexOf(me.role) < 0) err_('Akses berkas ditolak.');
  const f = DriveApp.getFileById(fid), b = f.getBlob();
  if (b.getBytes().length > 6 * 1024 * 1024) err_('Berkas terlalu besar untuk dipratinjau.');
  return ok_({ name: f.getName(), mime: b.getContentType(), b64: Utilities.base64Encode(b.getBytes()) });
}
function fileOwner_(fid) {
  const a = readT_('TBL_ATLET').filter(function (x) { return [x.foto_file_id, x.akta_file_id, x.surat_file_id, x.sosmed_file_id].indexOf(fid) >= 0; })[0]; if (a) return a.kontingen_id;
  const e = readT_('TBL_REGISTRASI_ENTRI').filter(function (x) { return x.bukti_bayar_file_id === fid; })[0]; if (e) return e.kontingen_id;
  const m = readT_('TBL_MUTASI_ATLET').filter(function (x) { return x.bukti_file_id === fid; })[0]; if (m) return m.kontingen_id;
  const k = readT_('TBL_KONTINGEN').filter(function (x) { return x.mandat_file_id === fid; })[0]; if (k) return k.kontingen_id;
  if (readT_('TBL_WASIT_SIGNOFF').some(function (x) { return x.ttd_file_id === fid; })) return 'STAFF';
  try { if (JSON.parse(cfg_().logo_buku_json || '[]').some(function (x) { return x.id === fid; })) return 'STAFF'; } catch (e) { }
  return '';
}

function hGantiSandi_(me, d) {
  if (me.darurat) err_('Akun darurat dirotasi lewat editor (resetAksesDarurat).');
  if (!kuatSandi_(d.baru)) err_('Kata sandi baru minimal 8 karakter dengan huruf dan angka.');
  const tbl = me.role === R.KT ? 'TBL_KONTINGEN' : 'TBL_USERS_ROLES', idf = me.role === R.KT ? 'kontingen_id' : 'user_id';
  const rec = readT_(tbl, true).filter(function (x) { return x[idf] === me.id; })[0];
  if (!rec || !samaAman_(hashPass_(String(d.lama || ''), rec.pass_salt), rec.pass_hash)) err_('Kata sandi lama salah.');
  rec.pass_salt = Utilities.getUuid(); rec.pass_hash = hashPass_(d.baru, rec.pass_salt); saveRows_(tbl, [rec]);
  revokeAll_(me.id); Utilities.sleep(50);
  audit_(me, 'GANTI_SANDI', 'Akun', me.id);
  return ok_({ token: buatSesi_(me.id, me.role, me.nama, false) }, 'Kata sandi diperbarui.');
}

// ============================================================
// KONSOL PANITIA: dashboard, verifikasi, pengajuan, seeding,
// input hasil, sign-off wasit, master, konfigurasi, laporan,
// arsip, galeri, pengguna, audit
// ============================================================
function entsByAtlet_(musim) { const m = {}; readT_('TBL_REGISTRASI_ENTRI').forEach(function (e) { if (e.musim === musim) (m[e.atlet_id] = m[e.atlet_id] || []).push(e); }); return m; }

function hVList_() {
  const cfg = cfg_(), by = entsByAtlet_(cfg.musim), evs = idx_(readM_('TBL_MASTER_NOMOR_LOMBA'), 'event_id'), kont = idx_(readT_('TBL_KONTINGEN'), 'kontingen_id');
  const rows = readT_('TBL_ATLET').filter(function (a) { return a.status_atlet === 'ACTIVE' && by[a.atlet_id]; }).map(function (a) {
    const es = by[a.atlet_id]; let total = 0;
    const ev = es.map(function (e) { const x = evs[e.event_id] || {}; total += e.nominal_biaya; return { no: x.event_no, nama: x.event_name, fee: e.nominal_biaya, seed: e.seed_time_entry }; });
    return { id: a.atlet_id, nama: a.nama_lengkap, nisn: a.nisn, bib: a.bib, g: a.jenis_kelamin, usia: usia_(a.tanggal_lahir), kelas: a.kelas_num, jk: a.jenjang_kode, sk: a.sekolah_nama, kl: a.klub_nama, kont: (kont[a.kontingen_id] || {}).nama_lembaga || '', ev: ev, total: total, st: aggStatus_(es), bayar: es.every(function (e) { return e.bukti_bayar_file_id; }), at: a.created_at, cat: (es.filter(function (e) { return e.catatan_revisi; })[0] || {}).catatan_revisi || '' };
  });
  return ok_(rows.sort(function (a, b) { return String(b.at).localeCompare(String(a.at)); }));
}

function hVDetail_(me, d) {
  const cfg = cfg_(), a = readT_('TBL_ATLET').filter(function (x) { return x.atlet_id === d.id; })[0]; if (!a) err_('Atlet tidak ditemukan.');
  const es = readT_('TBL_REGISTRASI_ENTRI').filter(function (e) { return e.atlet_id === a.atlet_id && e.musim === cfg.musim; }), evs = idx_(readM_('TBL_MASTER_NOMOR_LOMBA'), 'event_id');
  const k = readT_('TBL_KONTINGEN').filter(function (x) { return x.kontingen_id === a.kontingen_id; })[0] || {};
  const bayar = (es.filter(function (e) { return e.bukti_bayar_file_id; })[0] || {}).bukti_bayar_file_id || '';
  const usia = usia_(a.tanggal_lahir), jkHitung = jenjangOf_(a.kelas_num);
  return ok_({
    id: a.atlet_id, nama: a.nama_lengkap, nisn: a.nisn, bib: a.bib, g: a.jenis_kelamin, tempat: a.tempat_lahir, tgl: a.tanggal_lahir, usia: usia, kelas: a.kelas_num, jk: a.jenjang_kode, sk: a.sekolah_nama, kl: a.klub_nama, kota: a.kota_asal, prov: a.provinsi_asal, hp: a.hp_kontak,
    kont: { nama: k.nama_lembaga, pj: k.pj_nama, email: k.pj_email, telp: k.pj_telepon }, st: aggStatus_(es),
    files: [{ k: 'surat', l: 'Surat Sekolah', id: a.surat_file_id }, { k: 'akta', l: 'Akte Kelahiran', id: a.akta_file_id }, { k: 'foto', l: 'Foto Resmi', id: a.foto_file_id }, { k: 'sosmed', l: 'Bukti Follow', id: a.sosmed_file_id }, { k: 'bayar', l: 'Bukti Bayar', id: bayar }],
    ent: es.map(function (e) { const x = evs[e.event_id] || {}; return { no: x.event_no, nama: x.event_name, g: x.gender, jk: x.jenjang_kode, seed: e.seed_time_entry, fee: e.nominal_biaya, v: e.status_verifikasi, cat: e.catatan_revisi }; }),
    cek: [{ l: 'Kelompok kelas sesuai kelas sekolah', ok: jkHitung === a.jenjang_kode }, { l: 'NISN 10 digit', ok: /^\d{10}$/.test(a.nisn) }, { l: 'Usia wajar untuk kelas (' + usia + ' th)', ok: usia >= 3 && usia <= 20 }, { l: 'Semua nomor sesuai kelompok & gender', ok: es.every(function (e) { const x = evs[e.event_id] || {}; return x.jenjang_kode === a.jenjang_kode && x.gender === a.jenis_kelamin; }) }]
  });
}

function hVAksi_(me, d) {
  const cfg = cfg_(), aksi = d.aksi, ids = Array.isArray(d.ids) ? d.ids : [];
  if (['SETUJU', 'REVISI', 'TOLAK'].indexOf(aksi) < 0) err_('Aksi tidak valid.');
  if (!ids.length) err_('Pilih minimal satu atlet.');
  const alasan = String(d.alasan || '').trim(); if (aksi !== 'SETUJU' && alasan.length < 5) err_('Alasan/catatan wajib diisi (min. 5 karakter).');
  const set = {}; ids.forEach(function (i) { set[i] = 1; });
  const ents = readT_('TBL_REGISTRASI_ENTRI', true), atl = idx_(readT_('TBL_ATLET'), 'atlet_id'), t = nowIso_(), chg = [], names = {};
  ents.forEach(function (e) {
    if (e.musim !== cfg.musim || !set[e.atlet_id]) return;
    if (aksi === 'SETUJU') { if (e.nominal_biaya > 0 && !e.bukti_bayar_file_id) err_('Bukti bayar ' + ((atl[e.atlet_id] || {}).nama_lengkap || '') + ' belum ada.'); e.status_verifikasi = 'VERIFIED'; e.status_bayar = 'PAID_VERIFIED'; e.catatan_revisi = ''; }
    else { e.status_verifikasi = aksi === 'REVISI' ? 'REVISION_REQUIRED' : 'REJECTED'; e.catatan_revisi = alasan.slice(0, 300); if (e.status_bayar === 'PAID_VERIFIED') e.status_bayar = 'PENDING_CONFIRMATION'; }
    e.verified_by = me.nama; e.verified_at = t; chg.push(e);
    const a = atl[e.atlet_id]; if (a) (names[a.kontingen_id] = names[a.kontingen_id] || {})[a.nama_lengkap] = 1;
  });
  if (!chg.length) err_('Tidak ada pendaftaran yang diproses.');
  saveRows_('TBL_REGISTRASI_ENTRI', chg); bust_('atlet', 'hasil'); audit_(me, 'VERIF_' + aksi, 'Atlet', ids.length + ' atlet');
  if (d.email !== false) {
    const kont = idx_(readT_('TBL_KONTINGEN'), 'kontingen_id'), lbl = { SETUJU: 'disetujui', REVISI: 'perlu revisi', TOLAK: 'ditolak' }[aksi];
    Object.keys(names).forEach(function (kid) { const k = kont[kid]; if (!k) return; kirimEmail_(k.pj_email, 'Status verifikasi pendaftaran: ' + lbl, '<p>Pendaftaran berikut <b>' + lbl + '</b>:</p><ul>' + Object.keys(names[kid]).map(function (n) { return '<li>' + esc_(n) + '</li>'; }).join('') + '</ul>' + (aksi === 'SETUJU' ? '<p>Kartu peserta dapat diunduh dari menu Status &amp; Berkas.</p>' : '<p>Catatan panitia: ' + esc_(alasan) + '</p>')); });
  }
  return ok_({ n: Object.keys(set).length }, 'Verifikasi tersimpan.');
}

function hPList_() {
  const atl = idx_(readT_('TBL_ATLET'), 'atlet_id'), kont = idx_(readT_('TBL_KONTINGEN'), 'kontingen_id'), evs = idx_(readM_('TBL_MASTER_NOMOR_LOMBA'), 'event_id');
  const all = readT_('TBL_MUTASI_ATLET').slice().reverse().slice(0, 150).map(function (m) {
    const a = atl[m.atlet_id] || {};
    return { id: m.pengajuan_id, tipe: m.tipe, field: m.field, ev: m.event_id ? (evs[m.event_id] || {}).event_name : '', lama: m.nilai_lama, baru: m.nilai_baru, alasan: m.alasan, bukti: m.bukti_file_id, st: m.status_approval, at: m.diajukan_at, cat: m.catatan_admin, oleh: m.diputuskan_oleh, atlet: { id: a.atlet_id, nama: a.nama_lengkap, nisn: a.nisn, jk: a.jenjang_kode, sk: a.sekolah_nama }, kont: (kont[m.kontingen_id] || {}).nama_lembaga || '' };
  });
  return ok_(all);
}

function terapkan_(p) {
  const cfg = cfg_(), a = readT_('TBL_ATLET', true).filter(function (x) { return x.atlet_id === p.atlet_id; })[0]; if (!a) err_('Atlet tidak ditemukan.');
  const ents = readT_('TBL_REGISTRASI_ENTRI', true).filter(function (e) { return e.atlet_id === a.atlet_id; });
  if (p.tipe === 'MUTASI') {
    const tgt = readT_('TBL_KONTINGEN').filter(function (k) { return k.kontingen_id === p.kontingen_baru_id; })[0]; if (!tgt) err_('Kontingen tujuan tidak ditemukan.');
    a.kontingen_id = tgt.kontingen_id; if (tgt.tipe_lembaga === 'SEKOLAH') a.sekolah_nama = tgt.nama_lembaga; else a.klub_nama = tgt.nama_lembaga;
    ents.forEach(function (e) { e.kontingen_id = tgt.kontingen_id; }); saveRows_('TBL_REGISTRASI_ENTRI', ents);
  } else if (p.field === 'seed_time') {
    ents.forEach(function (e) { if (e.event_id === p.event_id && e.musim === cfg.musim) { e.seed_time_entry = p.nilai_baru; e.seed_ms = parseWaktu_(p.nilai_baru); } }); saveRows_('TBL_REGISTRASI_ENTRI', ents);
  } else {
    if (p.field === 'nisn' && readT_('TBL_ATLET').some(function (x) { return x.nisn === p.nilai_baru && x.atlet_id !== a.atlet_id && x.status_atlet === 'ACTIVE'; })) err_('NISN sudah dipakai atlet lain.');
    a[p.field] = p.field === 'kelas_num' ? toInt_(p.nilai_baru) : p.nilai_baru;
    if (p.field === 'kelas_num') {
      const jk = jenjangOf_(a.kelas_num); if (jk && jk !== a.jenjang_kode) {
        a.jenjang_kode = jk; ents.forEach(function (e) { if (e.musim === cfg.musim) { e.status_verifikasi = 'REVISION_REQUIRED'; e.catatan_revisi = 'Kelompok kelas berubah; sesuaikan nomor lomba.'; } }); saveRows_('TBL_REGISTRASI_ENTRI', ents);
      }
    }
  }
  saveRows_('TBL_ATLET', [a]);
}

function hPAksi_(me, d) {
  const aksi = d.aksi; if (['SETUJU', 'TOLAK', 'KLARIFIKASI'].indexOf(aksi) < 0) err_('Aksi tidak valid.');
  const p = readT_('TBL_MUTASI_ATLET', true).filter(function (x) { return x.pengajuan_id === d.id; })[0];
  if (!p || p.status_approval !== 'PENDING') err_('Pengajuan tidak ditemukan atau sudah diputuskan.');
  const cat = String(d.catatan || '').trim(); if (aksi !== 'SETUJU' && cat.length < 5) err_('Catatan wajib diisi.');
  if (aksi === 'SETUJU') terapkan_(p);
  p.status_approval = aksi === 'SETUJU' ? 'APPROVED' : aksi === 'TOLAK' ? 'REJECTED' : 'PENDING'; p.catatan_admin = cat.slice(0, 300); p.diputuskan_oleh = me.nama; p.diputuskan_at = nowIso_();
  saveRows_('TBL_MUTASI_ATLET', [p]); bust_('atlet', 'hasil'); audit_(me, 'PENGAJUAN_' + aksi, 'Pengajuan', p.pengajuan_id);
  const k = readT_('TBL_KONTINGEN').filter(function (x) { return x.kontingen_id === p.kontingen_id; })[0];
  if (k) kirimEmail_(k.pj_email, 'Keputusan pengajuan ' + p.tipe.toLowerCase(), '<p>Pengajuan Anda <b>' + { SETUJU: 'disetujui', TOLAK: 'ditolak', KLARIFIKASI: 'memerlukan klarifikasi' }[aksi] + '</b>.</p>' + (cat ? '<p>Catatan: ' + esc_(cat) + '</p>' : ''));
  return ok_(null, 'Keputusan tersimpan.');
}

// ── Seeding otomatis (Spearhead / World Aquatics SW 3) ──
function spearhead_(sorted, lanes) {
  const n = sorted.length, L = lanes.length, nh = Math.ceil(n / L), per = []; let rem = n;
  for (let h = nh - 1; h >= 0; h--) { const c = Math.min(L, Math.ceil(rem / (h + 1))); per[h] = c; rem -= c; }
  const out = []; let i = 0;
  for (let h = nh - 1; h >= 0; h--) for (let k = 0; k < per[h]; k++) { const s = sorted[i++]; out.push({ heat: h + 1, lane: lanes[k], atlet_id: s.atlet_id, seed: s.seed, ms: s.ms }); }
  return out;
}
function hSeed_(me, d) {
  const cfg = cfg_(), lanes = laneOrder_(Number(cfg.jumlah_lintasan) || 8), BIG = 9e12;
  if (!me.sys) { if (bukaDaftar_()) err_('Tutup pendaftaran lebih dulu (menu Tahapan Event) sebelum menyusun start list.'); if (['PELAKSANAAN', 'SELESAI'].indexOf(cfg.fase) >= 0) err_('Pelaksanaan sudah dimulai; start list dikunci.'); }
  const ids = d.id === 'ALL' ? readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (e) { return e.is_active; }).map(function (e) { return e.event_id; }) : [String(d.id || '')];
  const ents = readT_('TBL_REGISTRASI_ENTRI', true).filter(function (e) { return e.musim === cfg.musim && e.status_verifikasi === 'VERIFIED' && e.status_bayar === 'PAID_VERIFIED' && !evAkunDemo_(e.kontingen_id); }); // akun demo (uji coba) tidak masuk start list
  const atl = idx_(readT_('TBL_ATLET'), 'atlet_id'), withRes = {};
  readT_('TBL_RACE_RESULTS', true).forEach(function (r) { if (r.musim === cfg.musim) withRes[r.event_id] = 1; });
  const target = {}; ids.forEach(function (i) { if (!withRes[i]) target[i] = 1; });
  const keep = readT_('TBL_HEAT_SEEDS', true).filter(function (s) { return !(s.musim === cfg.musim && target[s.event_id]); }), rows = []; let atletN = 0, evN = 0;
  Object.keys(target).forEach(function (eid) {
    const list = ents.filter(function (e) { return e.event_id === eid && atl[e.atlet_id] && atl[e.atlet_id].status_atlet === 'ACTIVE'; }).map(function (e) { return { atlet_id: e.atlet_id, seed: e.seed_time_entry || 'NT', ms: e.seed_ms > 0 ? e.seed_ms : BIG }; });
    if (!list.length) return; list.sort(function (a, b) { return a.ms - b.ms; }); evN++; atletN += list.length;
    spearhead_(list, lanes).forEach(function (r) { rows.push({ seed_id: uid_('SD'), musim: cfg.musim, event_id: eid, heat_number: r.heat, lane_number: r.lane, atlet_id: r.atlet_id, entry_seed_time: r.seed, seed_ms: r.ms >= BIG ? 0 : r.ms }); });
  });
  rewriteT_('TBL_HEAT_SEEDS', keep.concat(rows)); bust_('hasil'); audit_(me, 'SEEDING', 'Start list', evN + ' nomor, ' + atletN + ' atlet');
  return ok_({ nomor: evN, atlet: atletN, dilewati: ids.length - Object.keys(target).length }, 'Start list tersusun: ' + evN + ' nomor, ' + atletN + ' atlet.');
}

// ── Input hasil lapangan & sign-off wasit ──
function rankEvent_(rows) {
  const ok = rows.filter(function (r) { return r.status_lomba === 'OK' && r.final_ms > 0; }).sort(function (a, b) { return a.final_ms - b.final_ms; });
  let rank = 0, prev = -1, i = 0;
  ok.forEach(function (r) { i++; if (r.final_ms !== prev) { rank = i; prev = r.final_ms; } r.rank_event = rank; r.medal = rank === 1 ? 'EMAS' : rank === 2 ? 'PERAK' : rank === 3 ? 'PERUNGGU' : ''; });
  rows.forEach(function (r) { if (!(r.status_lomba === 'OK' && r.final_ms > 0)) { r.rank_event = 0; r.medal = ''; } });
}
function evStat1_(mine, so) { if (so) return 'SAH'; let s = 'NONE'; const rk = { NONE: 0, DRAFT: 1, SUBMITTED: 2, SAH: 3 }; mine.forEach(function (r) { if (rk[r.status_pengesahan] > rk[s]) s = r.status_pengesahan; }); return s; }

// ── Pengaman input hasil bersamaan (Admin Input Data, Super Admin, Wasit) ──
// Setiap nomor punya "versi" = sidik isi hasil + status. Simpan/kirim/sahkan wajib membawa versi yang dilihat di layar;
// bila data sudah diubah orang lain, server menolak (KONFLIK) dan tidak ada yang tertimpa diam-diam.
function verHasil_(mine, so) {
  const s = mine.slice().sort(function (a, b) { return String(a.atlet_id).localeCompare(String(b.atlet_id)); }).map(function (r) { return [r.atlet_id, r.status_lomba, r.final_ms, r.dq_code, r.status_pengesahan].join(':'); }).join('|') + '#' + (so ? 'L' + so.signoff_at : '');
  return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, s)).slice(0, 12);
}
function ubahHasil_(mine) { let o = null; mine.forEach(function (r) { if (r.input_at && (!o || r.input_at > o.at)) o = { oleh: r.input_by, at: r.input_at }; }); return o; }
function konflik_(mine, so, extra, akhir) {
  const u = ubahHasil_(mine) || {}, st = evStat1_(mine, so), jm = /(\d{1,2}:\d{2})(?::\d{2})?\s*$/.exec(String(u.at || '')), jam = jm ? jm[1] : '';
  const e = new Error((extra || 'Data nomor ini baru saja diubah') + (u.oleh ? ' oleh ' + u.oleh + (jam ? ' pukul ' + jam : '') : '') + ' (status sekarang: ' + ({ NONE: 'kosong', DRAFT: 'draf', SUBMITTED: 'dikirim ke wasit', SAH: 'sah' }[st] || st) + '). ' + (akhir || 'Isian Anda tidak disimpan agar tidak menimpa; muat data terbaru dulu.'));
  e.kode = 'KONFLIK'; e.info = { oleh: u.oleh || '', at: u.at || '', st: st, ver: verHasil_(mine, so) }; throw e;
}
function jurnalHasil_(me, aksi, id, mine, so) { // catatan permanen tiap perubahan hasil (hanya ditambah, tidak pernah ditimpa) untuk pemulihan
  try {
    if (!ss_().getSheetByName('TBL_HASIL_JURNAL')) { const sh = ss_().insertSheet('TBL_HASIL_JURNAL'); sh.getRange(1, 1, 1, SKEMA.TBL_HASIL_JURNAL.cols.length).setValues([SKEMA.TBL_HASIL_JURNAL.cols]); }
    appendT_('TBL_HASIL_JURNAL', [{ jurnal_id: uid_('HJ'), ts: nowIso_(), user: (me && (me.nama || me.id)) || '-', role: (me && me.role) || '', aksi: aksi, event_id: id, versi: verHasil_(mine, so), data_json: JSON.stringify(mine.map(function (r) { return [r.atlet_id, r.heat_number, r.lane_number, r.status_lomba, r.final_time, r.dq_code, r.status_pengesahan]; })) }]);
  } catch (e) { console.error('jurnal: ' + e.message); }
}
function hHVer_(me, d) {
  const cfg = cfg_(), id = String(d.id || ''), mine = readT_('TBL_RACE_RESULTS', true).filter(function (r) { return r.musim === cfg.musim && r.event_id === id; });
  const so = readT_('TBL_WASIT_SIGNOFF', true).filter(function (s) { return s.musim === cfg.musim && s.event_id === id && s.is_locked === 1; })[0];
  return ok_({ ver: verHasil_(mine, so), st: evStat1_(mine, so), ubah: ubahHasil_(mine) });
}
function hHEvents_() {
  const cfg = cfg_(), st = evStatus_(cfg.musim);
  return ok_(readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (e) { return e.is_active && st[e.event_id] && st[e.event_id].a > 0; }).sort(function (a, b) { return a.event_no - b.event_no; }).map(function (e) { const x = evPub_(e); x.h = st[e.event_id].h; x.a = st[e.event_id].a; x.st = st[e.event_id].s; return x; }));
}
function hHLoad_(me, d) {
  const cfg = cfg_(), id = String(d.id || ''), ev = readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (e) { return e.event_id === id; })[0]; if (!ev) err_('Nomor lomba tidak ditemukan.');
  const atl = idx_(readT_('TBL_ATLET'), 'atlet_id'), seeds = readT_('TBL_HEAT_SEEDS').filter(function (s) { return s.musim === cfg.musim && s.event_id === id; });
  const mine = readT_('TBL_RACE_RESULTS').filter(function (r) { return r.musim === cfg.musim && r.event_id === id; }), rb = idx_(mine, 'atlet_id');
  const so = readT_('TBL_WASIT_SIGNOFF').filter(function (s) { return s.musim === cfg.musim && s.event_id === id && s.is_locked === 1; })[0], heats = {};
  seeds.forEach(function (s) { const a = aInfo_(atl[s.atlet_id]), r = rb[s.atlet_id] || {}; a.lane = s.lane_number; a.seed = s.entry_seed_time || 'NT'; a.waktu = r.final_ms > 0 ? r.final_time : ''; a.st = r.status_lomba || 'OK'; a.dq = r.dq_code || ''; a.cat = r.catatan || ''; a.rank = r.rank_event || 0; a.medal = r.medal || ''; a.baru = r.is_new_record === 1; (heats[s.heat_number] = heats[s.heat_number] || []).push(a); });
  return ok_({ ver: verHasil_(mine, so), ubah: ubahHasil_(mine), event: evPub_(ev), rec: recOf_(ev), st: evStat1_(mine, so), so: so ? { oleh: so.referee_name, at: so.signoff_at, hash: so.signature_hash, ttd: so.ttd_file_id } : null, heats: Object.keys(heats).map(Number).sort(function (a, b) { return a - b; }).map(function (n) { return { n: n, rows: heats[n].sort(function (a, b) { return a.lane - b.lane; }) }; }) });
}
function hHSimpan_(me, d) {
  const cfg = cfg_(), id = String(d.id || '');
  if (!me.sys && me.role !== R.SA && cfg.fase !== 'PELAKSANAAN') err_('Input hasil dibuka setelah Super Admin memulai tahap Pelaksanaan.');
  const so0 = readT_('TBL_WASIT_SIGNOFF', true).filter(function (s) { return s.musim === cfg.musim && s.event_id === id && s.is_locked === 1; })[0];
  if (so0) err_('Hasil sudah disahkan Wasit. Tarik kembali terlebih dahulu untuk memperbaiki.');
  const seeds = readT_('TBL_HEAT_SEEDS', true).filter(function (s) { return s.musim === cfg.musim && s.event_id === id; }); if (!seeds.length) err_('Belum ada start list untuk nomor ini.');
  const sb = idx_(seeds, 'atlet_id'), all = readT_('TBL_RACE_RESULTS', true);
  const mine = all.filter(function (r) { return r.musim === cfg.musim && r.event_id === id; }), others = all.filter(function (r) { return !(r.musim === cfg.musim && r.event_id === id); }), ba = idx_(mine, 'atlet_id');
  const st0 = evStat1_(mine, null), ver0 = verHasil_(mine, null);
  // Kirim ulang yang sama (mis. koneksi putus setelah server menyimpan) → dianggap berhasil, tidak dobel.
  const sama = function () { return (Array.isArray(d.rows) ? d.rows : []).every(function (x) { const r = ba[x.id]; if (!r) return false; const st = ['OK', 'DQ', 'DNS', 'DNF'].indexOf(x.st) >= 0 ? x.st : 'OK'; const ms = st === 'OK' && String(x.waktu || '').trim() ? parseWaktu_(x.waktu) : 0; return r.status_lomba === st && r.final_ms === ms && (st !== 'DQ' || r.dq_code === String(x.dq || '').slice(0, 40)); }) && st0 === (d.kirim ? 'SUBMITTED' : 'DRAFT'); };
  if (d.ver && d.ver !== ver0) { if (mine.length && sama()) return ok_({ st: st0, ver: ver0, at: nowIso_() }, d.kirim ? 'Hasil sudah terkirim ke Wasit.' : 'Draf sudah tersimpan.'); konflik_(mine, null); }
  if (st0 === 'SUBMITTED') { if (sama()) return ok_({ st: st0, ver: ver0, at: nowIso_() }, 'Hasil sudah terkirim ke Wasit.'); err_('Hasil nomor ini sudah dikirim ke Wasit dan menunggu pengesahan. Tarik dulu bila perlu diperbaiki.'); }
  (Array.isArray(d.rows) ? d.rows : []).forEach(function (x) {
    const s = sb[x.id]; if (!s) err_('Atlet tidak ada pada start list.');
    const st = ['OK', 'DQ', 'DNS', 'DNF'].indexOf(x.st) >= 0 ? x.st : 'OK'; let ms = 0, wt = '';
    if (st === 'OK' && String(x.waktu || '').trim() !== '') { ms = parseWaktu_(x.waktu); if (ms <= 0) err_('Format waktu tidak valid (contoh 00:57.94).'); wt = fmtWaktu_(ms); }
    if (st === 'DQ' && !String(x.dq || '').trim()) err_('Kode/alasan DQ wajib diisi.');
    const cur = ba[x.id] || { result_id: uid_('RS'), musim: cfg.musim, event_id: id, atlet_id: x.id, is_new_record: 0 };
    Object.assign(cur, { heat_number: s.heat_number, lane_number: s.lane_number, final_time: wt, final_ms: ms, status_lomba: st, dq_code: st === 'DQ' ? String(x.dq).slice(0, 40) : '', catatan: String(x.cat || '').slice(0, 200), input_by: me.nama, input_at: nowIso_() });
    ba[x.id] = cur;
  });
  const merged = Object.keys(ba).map(function (k) { return ba[k]; });
  if (d.kirim) seeds.forEach(function (s) { const r = ba[s.atlet_id]; if (!r || (r.status_lomba === 'OK' && r.final_ms <= 0)) err_('Semua lintasan harus terisi (waktu / DNS / DNF / DQ) sebelum dikirim ke Wasit.'); });
  merged.forEach(function (r) { r.status_pengesahan = d.kirim ? 'SUBMITTED' : 'DRAFT'; r.is_new_record = 0; });
  rankEvent_(merged); rewriteT_('TBL_RACE_RESULTS', others.concat(merged)); bust_('hasil'); audit_(me, d.kirim ? 'HASIL_KIRIM' : 'HASIL_SIMPAN', 'Nomor', id); jurnalHasil_(me, d.kirim ? 'KIRIM' : 'SIMPAN', id, merged, null);
  return ok_({ st: d.kirim ? 'SUBMITTED' : 'DRAFT', ver: verHasil_(merged, null), at: nowIso_() }, d.kirim ? 'Hasil dikirim ke Wasit untuk disahkan.' : 'Draf tersimpan.');
}
function hTarik_(me, d) {
  const cfg = cfg_(), id = String(d.id || ''), alasan = String(d.alasan || '').trim(); if (alasan.length < 5) err_('Alasan wajib diisi (min. 5 karakter).');
  const all = readT_('TBL_RACE_RESULTS', true), mine = all.filter(function (r) { return r.musim === cfg.musim && r.event_id === id; }); if (!mine.length) err_('Belum ada hasil untuk nomor ini.');
  const so = readT_('TBL_WASIT_SIGNOFF', true).filter(function (s) { return s.musim === cfg.musim && s.event_id === id && s.is_locked === 1; })[0], st = evStat1_(mine, so);
  if (st === 'DRAFT') err_('Hasil masih berupa draf.');
  if (d.ver && d.ver !== verHasil_(mine, so)) konflik_(mine, so, 'Hasil nomor ini baru saja berubah', 'Penarikan dibatalkan; muat data terbaru dulu.');
  if (me.role === R.WS && st === 'SAH') err_('Wasit hanya dapat mengembalikan hasil yang belum disahkan. Hubungi Super Admin / Admin Input Data.');
  const rids = {}; mine.forEach(function (r) { rids[r.result_id] = 1; });
  const keep = [], recs = readT_('TBL_REKOR_KEJUARAAN', true); let chg = false;
  recs.forEach(function (x) {
    if (!rids[x.result_id]) { keep.push(x); return; }
    let rw = []; try { rw = JSON.parse(x.riwayat || '[]'); } catch (e) { }
    if (rw.length) { const p = rw.pop(); Object.assign(x, { rekor_ms: p.ms, rekor_waktu: p.w, pemegang_nama: p.n, kontingen_nama: p.k, tahun: p.t, result_id: p.rid, atlet_id: p.aid, riwayat: JSON.stringify(rw), event_rekor: p.ev || '', lokasi: p.l || x.lokasi, tanggal: p.tg || '' }); keep.push(x); } chg = true;
  });
  if (chg) rewriteT_('TBL_REKOR_KEJUARAAN', keep);
  mine.forEach(function (r) { r.status_pengesahan = 'DRAFT'; r.is_new_record = 0; });
  rewriteT_('TBL_RACE_RESULTS', all.filter(function (r) { return !(r.musim === cfg.musim && r.event_id === id); }).concat(mine));
  if (so) { so.is_locked = 0; so.revoke_history = (so.revoke_history ? so.revoke_history + ' | ' : '') + nowIso_() + ' ' + me.nama + ': ' + alasan.slice(0, 120); saveRows_('TBL_WASIT_SIGNOFF', [so]); }
  bust_('hasil'); audit_(me, 'HASIL_TARIK', 'Nomor', id + ' — ' + alasan); jurnalHasil_(me, 'TARIK', id, mine, null);
  return ok_(null, 'Hasil ditarik kembali untuk perbaikan lapangan.');
}
function hSahkan_(me, d) {
  const cfg = cfg_(), id = String(d.id || ''), ev = readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (e) { return e.event_id === id; })[0]; if (!ev) err_('Nomor lomba tidak ditemukan.');
  const all = readT_('TBL_RACE_RESULTS', true), mine = all.filter(function (r) { return r.musim === cfg.musim && r.event_id === id; });
  if (!mine.length) err_('Belum ada hasil untuk disahkan.');
  if (mine.some(function (r) { return r.status_pengesahan === 'SAH'; })) { const so1 = readT_('TBL_WASIT_SIGNOFF', true).filter(function (s) { return s.musim === cfg.musim && s.event_id === id && s.is_locked === 1; })[0]; if (so1 && so1.referee_user_id === me.id) return ok_({ at: so1.signoff_at, hash: so1.signature_hash }, 'Hasil sudah disahkan.'); err_('Hasil sudah disahkan' + (so1 ? ' oleh ' + so1.referee_name : '') + '.'); }
  if (mine.some(function (r) { return r.status_pengesahan !== 'SUBMITTED'; })) err_('Hasil belum dikirim oleh Admin Input Data.');
  if (d.ver && d.ver !== verHasil_(mine, null)) konflik_(mine, null, 'Hasil yang Anda periksa sudah diubah', 'Pengesahan dibatalkan; periksa hasil terbaru lalu tanda tangani lagi.');
  let ttdId = '';
  if (!me.sys) {
    const tt = d.ttd; if (!tt || !tt.b64) err_('Tanda tangan Wasit wajib diisi sebelum mengesahkan.');
    const by = Utilities.base64Decode(tt.b64); if (by.length > 400000) err_('Berkas tanda tangan terlalu besar.');
    const hh = by.slice(0, 4).map(function (b) { return b < 0 ? b + 256 : b; }); if (!(hh[0] === 0x89 && hh[1] === 0x50)) err_('Format tanda tangan tidak valid.');
    ttdId = DriveApp.getFolderById(prop_('FOLDER_DOKUMEN')).createFile(Utilities.newBlob(by, 'image/png', 'TTD_' + id + '_' + Date.now() + '.png')).getId();
  }
  const t = nowIso_(), atl = idx_(readT_('TBL_ATLET'), 'atlet_id'), key = rekorKey_(ev), recs = readT_('TBL_REKOR_KEJUARAAN', true), rec = recs.filter(function (x) { return x.rekor_key === key; })[0], tahun = Number(cfg.musim) || new Date().getFullYear();
  const evNow = String(cfg.app_name || '') + (cfg.buku_subjudul ? ' ' + cfg.buku_subjudul : '') + (cfg.tanggal_teks ? ' — ' + cfg.tanggal_teks : ''), tgNow = Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd');
  rankEvent_(mine); mine.forEach(function (r) { r.is_new_record = 0; });
  const okr = mine.filter(function (r) { return r.status_lomba === 'OK' && r.final_ms > 0; }).sort(function (a, b) { return a.final_ms - b.final_ms; });
  if (okr.length) {
    const best = okr[0], a = atl[best.atlet_id] || {}, kn = a.sekolah_nama || a.klub_nama || '';
    if (rec) {
      if (best.final_ms < rec.rekor_ms) {
        let rw = []; try { rw = JSON.parse(rec.riwayat || '[]'); } catch (e) { }
        rw.push({ ms: rec.rekor_ms, w: rec.rekor_waktu, n: rec.pemegang_nama, k: rec.kontingen_nama, t: rec.tahun, rid: rec.result_id, aid: rec.atlet_id, ev: rec.event_rekor, l: rec.lokasi, tg: rec.tanggal });
        Object.assign(rec, { rekor_ms: best.final_ms, rekor_waktu: best.final_time, atlet_id: best.atlet_id, pemegang_nama: a.nama_lengkap || '', kontingen_nama: kn, tahun: tahun, lokasi: cfg.lokasi, result_id: best.result_id, riwayat: JSON.stringify(rw.slice(-5)), event_rekor: evNow, tanggal: tgNow });
        best.is_new_record = 1; saveRows_('TBL_REKOR_KEJUARAAN', [rec]);
      }
    } else appendT_('TBL_REKOR_KEJUARAAN', [{ rekor_id: uid_('RK'), rekor_key: key, event_name: ev.event_name, jenjang_kode: ev.jenjang_kode, gender: ev.gender, stroke_type: ev.stroke_type, distance_m: ev.distance_m, atlet_id: best.atlet_id, pemegang_nama: a.nama_lengkap || '', kontingen_nama: kn, rekor_ms: best.final_ms, rekor_waktu: best.final_time, tahun: tahun, lokasi: cfg.lokasi, result_id: best.result_id, riwayat: '[]', event_rekor: evNow, tanggal: tgNow }]);
  }
  mine.forEach(function (r) { r.status_pengesahan = 'SAH'; });
  rewriteT_('TBL_RACE_RESULTS', all.filter(function (r) { return !(r.musim === cfg.musim && r.event_id === id); }).concat(mine));
  const str = mine.slice().sort(function (a, b) { return a.lane_number - b.lane_number; }).map(function (r) { return r.atlet_id + ':' + r.final_ms + ':' + r.status_lomba; }).join('|');
  const sig = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, cfg.musim + '|' + id + '|' + str + '|' + me.id + '|' + t));
  appendT_('TBL_WASIT_SIGNOFF', [{ signoff_id: uid_('SO'), musim: cfg.musim, event_id: id, referee_user_id: me.id, referee_name: me.nama, signoff_at: t, is_locked: 1, signature_hash: sig, catatan: String(d.catatan || '').slice(0, 300), revoke_history: '', ttd_file_id: ttdId }]);
  bust_('hasil', 'atlet'); audit_(me, 'HASIL_SAH', 'Nomor', id); jurnalHasil_(me, 'SAH', id, mine, { signoff_at: t });
  return ok_({ at: t, hash: sig }, 'Hasil disahkan, dikunci, dan masuk klasemen & rekor.');
}

// ── Master data nomor lomba ──
const GAYA = ['Gaya Bebas', 'Gaya Dada', 'Gaya Punggung', 'Gaya Kupu-kupu', 'Gaya Ganti Perorangan'];
function hMstList_() { const m = cfg_().musim; return ok_({ events: readT_('TBL_MASTER_NOMOR_LOMBA', true).filter(function (e) { return !e.musim || e.musim === m; }).map(stripR_).sort(function (a, b) { return a.event_no - b.event_no; }), jenjang: readT_('TBL_MASTER_JENJANG').map(stripR_).sort(function (a, b) { return a.urutan - b.urutan; }), gaya: GAYA }); }
function hMstSimpan_(me, d) { const e = Object.assign({}, d.rec || {}); if (e.dibuka === undefined) e.dibuka = e.is_active ? '1' : '0'; if (Number(e.max_quota) === 64) e.max_quota = 0; return hEvNomorSimpan_(me, { musim: cfg_().musim, rec: e }); }
function hMstHapus_(me, d) { return hEvNomorHapus_(me, d); }
function defaultEvents_() {
  const plan = { TK: [[25, 0]], SD_1_2: [[25, 0], [25, 1]], SD_3_4: [[50, 0], [50, 1], [50, 3]], SD_5_6: [[50, 0], [100, 0], [50, 1], [50, 2], [50, 3]], SMP_7: [[50, 0], [100, 0], [50, 1], [50, 2], [50, 3], [200, 4]], SMP_8_9: [[50, 0], [100, 0], [50, 1], [50, 2], [50, 3], [200, 4]], SMA_10_12: [[50, 0], [100, 0], [200, 0], [50, 1], [100, 1], [50, 2], [50, 3], [200, 4]] };
  const hari = { TK: 1, SD_1_2: 1, SD_3_4: 2, SD_5_6: 2, SMP_7: 3, SMP_8_9: 3, SMA_10_12: 3 }, jam = {}, out = []; let no = 101;
  Object.keys(plan).forEach(function (jk) {
    plan[jk].forEach(function (p) {
      ['PUTRA', 'PUTRI'].forEach(function (g) {
        const h = hari[jk]; jam[h] = jam[h] === undefined ? 8 * 60 : jam[h] + 10; const hh = ('0' + Math.floor(jam[h] / 60)).slice(-2) + ':' + ('0' + jam[h] % 60).slice(-2);
        out.push({ event_id: 'E' + no, event_no: no, event_name: p[0] + 'm ' + GAYA[p[1]], course_type: 'LCM', jenjang_kode: jk, gender: g, distance_m: p[0], stroke_type: GAYA[p[1]], fee_amount: p[0] === 25 ? 50000 : p[0] === 200 ? 100000 : 75000, max_quota: 64, hari: h, sesi: jam[h] < 750 ? 'Pagi' : 'Sore', jam: hh, is_active: 1 }); no++;
      });
    });
  });
  return out;
}
function hMstDefault_(me) {
  const m = cfg_().musim; if (readT_('TBL_MASTER_NOMOR_LOMBA', true).some(function (e) { return !e.musim || e.musim === m; })) err_('Nomor lomba sudah ada. Hapus/ubah manual bila perlu.');
  appendT_('TBL_MASTER_NOMOR_LOMBA', defaultEvents_().map(function (e) { e.event_id = uid_('N'); e.musim = m; e.dibuka = '1'; e.max_quota = 0; return e; })); bust_('master'); audit_(me, 'MASTER_DEFAULT', 'Nomor', '');
  return ok_(null, 'Nomor lomba standar dibuat. Silakan sesuaikan jadwal dan biaya.');
}

// ── Konfigurasi portal ──
function hCfgGet_() { const c = cfg_(), o = {}; Object.keys(c).forEach(function (k) { if (k.charAt(0) !== '_') o[k] = c[k]; }); o._arsip_step = c._arsip_step; return ok_(o); }
function hCfgSimpan_(me, d) {
  const v = d.cfg || {}, o = {};
  Object.keys(v).forEach(function (k) {
    if (CFG_EDITABLE.indexOf(k) < 0) return; let val = String(v[k] == null ? '' : v[k]).slice(0, 4000);
    if (k === 'jadwal_json' || k === 'kartu_json') { try { if (!Array.isArray(JSON.parse(val))) throw 0; } catch (e) { err_('Format ' + k + ' tidak valid.'); } }
    if (['registrasi_dibuka', 'event_dikunci'].indexOf(k) >= 0) val = val === '1' ? '1' : '0';
    if (['jadwal_jeda', 'min_peserta', 'max_individu', 'jumlah_lintasan', 'poin_emas', 'poin_perak', 'poin_perunggu'].indexOf(k) >= 0) { if (!/^\d{1,4}$/.test(val)) err_('Nilai ' + k + ' harus angka.'); }
    if (k === 'jadwal_mulai' && !/^([01]\d|2[0-3]):[0-5]\d$/.test(val)) err_('Jam mulai harus format HH:MM.');
    if (k === 'menit_heat_json') { try { const j = JSON.parse(val); if (!j || typeof j !== 'object' || Array.isArray(j)) throw 0; } catch (e) { err_('Format menit per seri tidak valid.'); } }
    if (['ig1', 'ig2', 'yt1', 'yt2'].indexOf(k) >= 0 && val && !/^https:\/\//i.test(val)) err_('Tautan sosial media harus diawali https://');
    if (k === 'jumlah_lintasan' && (Number(val) < 2 || Number(val) > 10)) err_('Jumlah lintasan 2–10.');
    if (k === 'live_detik' && !(/^\d{1,3}$/.test(val) && Number(val) >= 15 && Number(val) <= 300)) err_('Jeda pembaruan live 15–300 detik.');
    o[k] = val;
  });
  cfgSet_(me, o); audit_(me, 'CONFIG_SIMPAN', 'Portal', Object.keys(o).join(','));
  return ok_(null, 'Pengaturan tersimpan dan dipublikasikan.');
}

// ── Laporan & rekapitulasi ──
function hLap_() {
  const cfg = cfg_(), by = entsByAtlet_(cfg.musim), kont = idx_(readT_('TBL_KONTINGEN'), 'kontingen_id'), evs = idx_(readM_('TBL_MASTER_NOMOR_LOMBA'), 'event_id'), jen = readM_('TBL_MASTER_JENJANG').sort(function (a, b) { return a.urutan - b.urutan; });
  const atl = readT_('TBL_ATLET').filter(function (a) { return a.status_atlet === 'ACTIVE' && by[a.atlet_id]; });
  const J = {}, N = {}, P = {}, K = {}, G = { PUTRA: 0, PUTRI: 0 }, sek = {}; let entri = 0, lunas = 0, pend = 0;
  jen.forEach(function (j) { J[j.kode_jenjang] = { kode: j.kode_jenjang, nama: j.nama_jenjang, atlet: 0, entri: 0, lunas: 0, pending: 0 }; });
  atl.forEach(function (a) {
    const es = by[a.atlet_id], j = J[a.jenjang_kode] || (J[a.jenjang_kode] = { kode: a.jenjang_kode, nama: a.jenjang_kode, atlet: 0, entri: 0, lunas: 0, pending: 0 });
    j.atlet++; G[a.jenis_kelamin] = (G[a.jenis_kelamin] || 0) + 1;
    const d = a.kota_asal || a.provinsi_asal || '-'; P[d] = (P[d] || 0) + 1;
    const k = kont[a.kontingen_id]; if (k) { const w = k.kota_kabupaten || '-'; K[w] = K[w] || { n: w, kontingen: {}, atlet: 0 }; K[w].kontingen[k.kontingen_id] = 1; K[w].atlet++; }
    sek[a.kontingen_id] = 1;
    es.forEach(function (e) { j.entri++; entri++; const x = evs[e.event_id] || {}; const n = N[e.event_id] || (N[e.event_id] = { no: x.event_no, nama: x.event_name, jk: x.jenjang_kode, g: x.gender, atlet: 0 }); n.atlet++; if (e.status_bayar === 'PAID_VERIFIED') { j.lunas += e.nominal_biaya; lunas += e.nominal_biaya; } else { j.pending += e.nominal_biaya; pend += e.nominal_biaya; } });
  });
  return ok_({ musim: cfg.musim, kpi: { kontingen: Object.keys(sek).length, atlet: atl.length, entri: entri, lunas: lunas, pending: pend }, jenjang: Object.keys(J).map(function (k) { return J[k]; }), nomor: Object.keys(N).map(function (k) { return N[k]; }).sort(function (a, b) { return a.no - b.no; }), daerah: Object.keys(P).map(function (k) { return { n: k, v: P[k] }; }).sort(function (a, b) { return b.v - a.v; }), wilayah: Object.keys(K).map(function (k) { return { n: K[k].n, kontingen: Object.keys(K[k].kontingen).length, atlet: K[k].atlet }; }).sort(function (a, b) { return b.atlet - a.atlet; }), gender: G });
}

// ── Penutupan event & arsip (4 tahap) ──
function hArsGet_() {
  const cfg = cfg_(), st = evStatus_(cfg.musim), ids = Object.keys(st), belum = ids.filter(function (k) { return st[k].s !== 'SAH'; }).length;
  let next = []; try { next = evRows_().filter(function (r) { return r.musim !== cfg.musim && r.status !== 'SELESAI'; }).map(function (r) { return { id: r.ev_id, nama: r.nama, musim: r.musim, tgl: r.tgl_mulai }; }); } catch (e) { }
  return ok_({ next: next, musim: cfg.musim, step: toInt_(cfg._arsip_step), konfirmasi: 'TUTUP-EVENT-' + cfg.musim, nomor: ids.length, belumSah: belum, arsip: readT_('TBL_EVENT_ARCHIVE_LOG').map(function (a) { return { id: a.archive_id, musim: a.season_name, atlet: a.total_atlet, kontingen: a.total_kontingen, uang: a.total_pendapatan, url: a.backup_url, hash: a.integrity_hash, at: a.closed_at, oleh: a.closed_by }; }).reverse() });
}
function hArsRun_(me, d) {
  const cfg = cfg_(), step = toInt_(cfg._arsip_step), lg = toInt_(d.langkah);
  if (lg !== step + 1) err_('Jalankan tahap secara berurutan. Tahap berikutnya: ' + (step + 1) + '.');
  if (lg === 1) {
    if (String(d.konfirmasi || '') !== 'TUTUP-EVENT-' + cfg.musim) err_('Teks konfirmasi tidak sesuai.');
    const st = evStatus_(cfg.musim); if (Object.keys(st).some(function (k) { return st[k].s !== 'SAH'; })) err_('Masih ada nomor lomba yang belum disahkan Wasit.');
    cfgSet_(me, { registrasi_dibuka: '0', event_dikunci: '1', fase: 'SELESAI', _arsip_step: '1' }); audit_(me, 'ARSIP_1', 'Event', cfg.musim); return ok_({ step: 1 }, 'Data dikunci (read-only).');
  }
  if (lg === 2) {
    const ents = readT_('TBL_REGISTRASI_ENTRI').filter(function (e) { return e.musim === cfg.musim; }), ring = { kont: {}, atlet: {}, uang: 0 };
    ents.forEach(function (e) { ring.kont[e.kontingen_id] = 1; ring.atlet[e.atlet_id] = 1; if (e.status_bayar === 'PAID_VERIFIED') ring.uang += e.nominal_biaya; });
    const nm = 'Snapshot_' + cfg.musim + '_' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd_HHmm'), cp = DriveApp.getFileById(prop_('SPREADSHEET_ID')).makeCopy(nm, DriveApp.getFolderById(prop_('FOLDER_ARSIP')));
    const hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, cfg.musim + '|' + Object.keys(ring.atlet).length + '|' + ring.uang + '|' + nowIso_()));
    const aid = uid_('AR'); appendT_('TBL_EVENT_ARCHIVE_LOG', [{ archive_id: aid, season_name: cfg.musim, total_kontingen: Object.keys(ring.kont).length, total_atlet: Object.keys(ring.atlet).length, total_pendapatan: ring.uang, backup_file_id: cp.getId(), backup_url: cp.getUrl(), integrity_hash: hash, snapshot_json: '', closed_by: me.nama, closed_at: nowIso_() }]);
    cfgSet_(me, { _arsip_step: '2', _arsip_id: aid }); audit_(me, 'ARSIP_2', 'Event', nm); return ok_({ step: 2, url: cp.getUrl() }, 'Cadangan database dibuat di Drive.');
  }
  if (lg === 3) {
    const k = hitungKlasemen_(cfg.musim), top = k.sekolah.slice(0, 5).map(function (x) { return { nama: x.nama, e: x.e, p: x.p, b: x.b, poin: x.poin }; });
    const arch = readT_('TBL_EVENT_ARCHIVE_LOG', true).filter(function (a) { return a.archive_id === cfg._arsip_id; })[0]; if (!arch) err_('Log arsip tidak ditemukan.');
    const sub = DriveApp.getFolderById(prop_('FOLDER_ARSIP')).createFolder('Arsip_' + cfg.musim + '_' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd'));
    pastikanBukuArsip_(me);
    readT_('TBL_DOKUMEN', true).filter(function (x) { return x.musim === cfg.musim; }).forEach(function (x) { try { DriveApp.getFileById(x.file_id).makeCopy(x.nama_file, sub); } catch (e) { } });
    arch.snapshot_json = JSON.stringify({ juara: top[0] ? top[0].nama : '', top: top, klub: k.klub.slice(0, 3).map(function (x) { return { nama: x.nama, poin: x.poin }; }) }).slice(0, 45000); saveRows_('TBL_EVENT_ARCHIVE_LOG', [arch]);
    cfgSet_(me, { _arsip_step: '3' }); bust_('hasil'); audit_(me, 'ARSIP_3', 'Event', cfg.musim); return ok_({ step: 3 }, 'Folder arsip dibuat dan Hall of Fame dipublikasikan.');
  }
  if (lg === 4) {
    if (d.evId) { evMigrasi_(); const all = readT_('TBL_EVENT', true), ev = all.filter(function (r) { return r.ev_id === String(d.evId); })[0]; if (!ev || ev.musim === cfg.musim) err_('Pilih event berikutnya dari daftar event.'); evAktifkan_(me, ev, all); audit_(me, 'ARSIP_4', 'Event', ev.musim); return ok_({ step: 0 }, 'Event "' + ev.nama + '" kini aktif. Pendaftaran mengikuti jadwal event.'); }
    try { const ro = evRows_(true).filter(function (r) { return r.musim === cfg.musim; })[0]; if (ro) { ro.status = 'SELESAI'; saveRows_('TBL_EVENT', [ro]); } } catch (e) { }
    const nama = String(d.namaBaru || '').trim(); if (!/^[\w\/ .-]{1,30}$/.test(nama)) err_('Nama musim baru 1–30 karakter.'); if (nama === cfg.musim) err_('Nama musim baru harus berbeda.');
    cfgSet_(me, { musim: nama, registrasi_dibuka: '0', event_dikunci: '0', fase: 'PENDAFTARAN', banner_teks: '', _arsip_step: '0' }); bust_('master', 'atlet', 'hasil'); audit_(me, 'ARSIP_4', 'Event', nama);
    return ok_({ step: 0 }, 'Musim ' + nama + ' siap. Buka pendaftaran dari menu Beranda & Konten.');
  }
  err_('Tahap tidak dikenal.');
}

// ── Galeri, pengguna panitia, audit ──
function hGalDel_(me, d) {
  const all = readT_('TBL_GALERI', true), g = all.filter(function (x) { return x.galeri_id === d.id; })[0]; if (!g) err_('Foto tidak ditemukan.');
  if (g.file_id) { try { DriveApp.getFileById(g.file_id).setTrashed(true); } catch (e) { } }
  rewriteT_('TBL_GALERI', all.filter(function (x) { return x.galeri_id !== d.id; })); bust_('galeri'); audit_(me, 'GALERI_HAPUS', 'Galeri', d.id); return ok_(null, 'Foto dihapus.');
}
function hUsrList_() { return ok_(readT_('TBL_USERS_ROLES', true).map(function (u) { return { id: u.user_id, nama: u.full_name, email: u.email, role: u.role, st: u.status, lis: u.license_number, at: u.created_at }; })); }
function hUsrSimpan_(me, d) {
  const nama = String(d.nama || '').trim(), email = String(d.email || '').trim().toLowerCase();
  if (nama.length < 3) err_('Nama minimal 3 karakter.'); if (!emailValid_(email)) err_('Email tidak valid.');
  if (STAFF.indexOf(d.role) < 0) err_('Peran tidak valid.'); const st = d.st === 'NONAKTIF' ? 'NONAKTIF' : 'ACTIVE';
  const all = readT_('TBL_USERS_ROLES', true); if (all.some(function (u) { return u.email.toLowerCase() === email && u.user_id !== d.id; })) err_('Email sudah dipakai.');
  const cur = d.id ? all.filter(function (u) { return u.user_id === d.id; })[0] : null;
  if (cur) {
    if (cur.user_id === me.id && (st !== 'ACTIVE' || d.role !== cur.role)) err_('Anda tidak dapat menonaktifkan/mengubah peran akun sendiri.');
    Object.assign(cur, { full_name: nama, email: email, role: d.role, status: st, license_number: String(d.lis || '').slice(0, 40) }); saveRows_('TBL_USERS_ROLES', [cur]); bust_('user'); audit_(me, 'USER_UBAH', 'Pengguna', cur.user_id); return ok_(null, 'Pengguna diperbarui.');
  }
  const pw = sandiAcak_(12), salt = Utilities.getUuid();
  appendT_('TBL_USERS_ROLES', [{ user_id: uid_('U'), full_name: nama, email: email, role: d.role, pass_hash: hashPass_(pw, salt), pass_salt: salt, license_number: String(d.lis || '').slice(0, 40), status: st, last_login: '', created_at: nowIso_() }]);
  bust_('user'); audit_(me, 'USER_BARU', 'Pengguna', email); return ok_({ sandi: pw }, 'Pengguna dibuat. Catat kata sandi awal — hanya tampil sekali.');
}
function hUsrReset_(me, d) {
  const all = readT_('TBL_USERS_ROLES', true), u = all.filter(function (x) { return x.user_id === d.id; })[0]; if (!u) err_('Pengguna tidak ditemukan.');
  const pw = sandiBaru_(d.sandi); u.pass_salt = Utilities.getUuid(); u.pass_hash = hashPass_(pw, u.pass_salt); saveRows_('TBL_USERS_ROLES', [u]); revokeAll_(u.user_id); audit_(me, 'USER_SANDI', 'Pengguna', u.email);
  return ok_({ sandi: pw }, 'Kata sandi diganti. Catat — hanya tampil sekali.');
}
function hAudList_() { return ok_(readT_('TBL_AUDIT_LOG', true).slice(-200).reverse().map(stripR_)); }

// ============================================================
// DOKUMEN PDF: Buku Acara, Start List, Result Book, SK Pemenang,
// Kartu Peserta (ID Card), Sertifikat
// ============================================================
function pdf_(html, nama) { return Utilities.newBlob(html, 'text/html', nama + '.html').getAs('application/pdf').setName(nama + '.pdf'); }
function docShell_(judul, sub, body) {
  const c = cfg_();
  return '<html><head><meta charset="utf-8"><style>body{font-family:Arial,Helvetica,sans-serif;color:#0B1F33;font-size:11px;margin:22px}h1{font-size:18px;margin:0;color:#0A3D62}h2{font-size:13px;margin:14px 0 4px;color:#0A3D62}table{border-collapse:collapse;width:100%;margin:4px 0 10px}th,td{border:1px solid #9fb3c3;padding:4px 6px;text-align:left}th{background:#EEF6FA}.kop{border-bottom:3px solid #0A3D62;padding-bottom:8px;margin-bottom:12px}.sm{color:#4A6072;font-size:10px}</style></head><body><div class="kop"><h1>' + esc_(c.app_name) + '</h1><div class="sm">' + esc_(sub) + '</div></div><div style="font-size:15px;font-weight:bold;margin-bottom:8px">' + esc_(judul) + '</div>' + body + '<p class="sm">Dokumen dihasilkan otomatis oleh sistem pada ' + nowIso_().replace('T', ' ') + ' WIB.</p></body></html>';
}
function docData_() {
  const cfg = cfg_(), jen = idx_(readM_('TBL_MASTER_JENJANG'), 'kode_jenjang');
  const em = idx_(readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (e) { return e.is_active; }), 'event_id'), evs = jadwal_().map(function (j) { return Object.assign({}, em[j.eid], { hari: j.hari, jam: j.mulai, jamS: j.selesai, mnHeat: j.mn }); });
  return { cfg: cfg, jen: jen, evs: evs, atl: idx_(readT_('TBL_ATLET'), 'atlet_id'), seeds: readT_('TBL_HEAT_SEEDS').filter(function (s) { return s.musim === cfg.musim; }), res: readT_('TBL_RACE_RESULTS').filter(function (r) { return r.musim === cfg.musim; }) };
}
function evJudul_(e, jen) { return '#' + e.event_no + ' ' + e.event_name + ' ' + (e.gender === 'PUTRA' ? 'Putra' : 'Putri') + ' — ' + ((jen[e.jenjang_kode] || {}).nama_jenjang || e.jenjang_kode); }

function htmlSK_() {
  const D = docData_(), k = hitungKlasemen_(D.cfg.musim); let body = '<p>Panitia Pelaksana menetapkan hasil resmi berikut berdasarkan hasil lomba yang telah disahkan Wasit Utama.</p><h2>PERTAMA — Juara Umum Sekolah</h2><table><tr><th>Peringkat</th><th>Sekolah</th><th>Emas</th><th>Perak</th><th>Perunggu</th><th>Poin</th></tr>' + k.sekolah.slice(0, 3).map(function (x, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc_(x.nama) + '</td><td>' + x.e + '</td><td>' + x.p + '</td><td>' + x.b + '</td><td>' + x.poin + '</td></tr>'; }).join('') + '</table>';
  body += '<h2>KEDUA — Juara Umum Klub</h2><table><tr><th>Peringkat</th><th>Klub</th><th>Emas</th><th>Perak</th><th>Perunggu</th><th>Poin</th></tr>' + k.klub.slice(0, 3).map(function (x, i) { return '<tr><td>' + (i + 1) + '</td><td>' + esc_(x.nama) + '</td><td>' + x.e + '</td><td>' + x.p + '</td><td>' + x.b + '</td><td>' + x.poin + '</td></tr>'; }).join('') + '</table>';
  body += '<h2>KETIGA — Juara Per Nomor Lomba</h2>';
  D.evs.forEach(function (e) {
    const w = D.res.filter(function (r) { return r.event_id === e.event_id && r.status_pengesahan === 'SAH' && r.medal; }).sort(function (a, b) { return a.rank_event - b.rank_event; }); if (!w.length) return;
    body += '<table><tr><th colspan="4">' + esc_(evJudul_(e, D.jen)) + '</th></tr>' + w.map(function (r) { const a = D.atl[r.atlet_id] || {}; return '<tr><td>' + esc_(r.medal) + '</td><td>' + esc_(a.nama_lengkap) + '</td><td>' + esc_(a.sekolah_nama || a.klub_nama) + '</td><td>' + esc_(r.final_time) + (r.is_new_record ? ' (REKOR BARU)' : '') + '</td></tr>'; }).join('') + '</table>';
  });
  return docShell_('Draf Surat Keputusan Penetapan Pemenang', 'Musim ' + D.cfg.musim + ' • DRAF — perlu ditandatangani Ketua Panitia & Meet Referee', body);
}
function htmlLPJ_() {
  const d = hLap_().data, k = d.kpi, tb = function (h, rows) { return '<table><tr>' + h.map(function (x) { return '<th>' + x + '</th>'; }).join('') + '</tr>' + rows.map(function (r) { return '<tr>' + r.map(function (c) { return '<td>' + esc_(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</table>'; };
  let body = '<h2>Ringkasan</h2>' + tb(['Kontingen', 'Peserta', 'Total entri', 'Nominal lunas (Rp)', 'Menunggu verifikasi (Rp)'], [[k.kontingen, k.atlet, k.entri, k.lunas.toLocaleString('id-ID'), k.pending.toLocaleString('id-ID')]]);
  body += '<h2>Rekap per Kelompok</h2>' + tb(['Kelompok', 'Atlet', 'Entri', 'Nominal lunas (Rp)', 'Menunggu (Rp)'], d.jenjang.map(function (j) { return [j.nama, j.atlet, j.entri, j.lunas.toLocaleString('id-ID'), j.pending.toLocaleString('id-ID')]; }));
  body += '<h2>Rekap per Nomor Lomba</h2>' + tb(['No', 'Nomor', 'Gender', 'Kelompok', 'Peserta'], d.nomor.map(function (n) { return ['#' + n.no, n.nama, n.g, n.jk, n.atlet]; }));
  body += '<h2>Rekap per Wilayah Sekolah/Klub</h2>' + tb(['Wilayah', 'Kontingen', 'Atlet'], d.wilayah.map(function (w) { return [w.n, w.kontingen, w.atlet]; }));
  body += '<h2>Rekap per Asal Daerah Atlet</h2>' + tb(['Daerah', 'Atlet'], d.daerah.map(function (w) { return [w.n, w.v]; }));
  body += '<p>Peserta putra: ' + (d.gender.PUTRA || 0) + ' • putri: ' + (d.gender.PUTRI || 0) + '</p>';
  return docShell_('Laporan Pertanggungjawaban & Rekapitulasi Pendaftar', 'Musim ' + d.musim + ' • data pendaftar terverifikasi', body);
}
function simpanDok_(me, jenis, blob, publik) {
  const cfg = cfg_(), f = DriveApp.getFolderById(prop_('FOLDER_DOKUMEN')).createFile(blob); if (publik) bagikan_(f);
  const rec = { dok_id: uid_('DK'), musim: cfg.musim, jenis: jenis, nama_file: blob.getName(), file_id: f.getId(), dibuat_oleh: me.nama, created_at: nowIso_(), is_publik: publik ? 1 : 0 };
  appendT_('TBL_DOKUMEN', [rec]); return rec;
}
function hDokBuat_(me, d) {
  const jenis = String(d.jenis || ''), hari = toInt_(d.hari, 0), cfg = cfg_();
  const mk = { BUKU_ACARA: function () { return htmlBukuAcara_(0); }, START_LIST: function () { return htmlBukuAcara_(hari); }, RESULT_BOOK: htmlResultBook_, SK_PEMENANG: htmlSK_, LPJ: htmlLPJ_ }[jenis];
  if (!mk) err_('Jenis dokumen tidak dikenal.');
  const pub = BUKU_WEB.indexOf(jenis) >= 0 && d.publik !== false;
  const blob = pdf_(mk(), jenis + '_' + cfg.musim + (hari ? '_Hari' + hari : '') + '_' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd_HHmm')), rec = simpanDok_(me, jenis, blob, pub);
  if (pub) satuTerbit_(rec);
  bust_('galeri', 'hasil'); audit_(me, 'DOK_BUAT', 'Dokumen', jenis);
  return ok_({ id: rec.dok_id, nama: rec.nama_file, mime: 'application/pdf', b64: Utilities.base64Encode(blob.getBytes()), pub: pub }, pub ? 'Dokumen dibuat dan langsung tersedia untuk diunduh di web.' : 'Dokumen dibuat dan disimpan di Drive.');
}
function hDokData_(me, d) { const x = readT_('TBL_DOKUMEN').filter(function (r) { return r.dok_id === d.id; })[0]; if (!x) err_('Dokumen tidak ditemukan.'); const b = DriveApp.getFileById(x.file_id).getBlob(); return ok_({ name: x.nama_file, mime: 'application/pdf', b64: Utilities.base64Encode(b.getBytes()) }); }
function hDokPublik_(me, d) {
  const all = readT_('TBL_DOKUMEN', true), x = all.filter(function (r) { return r.dok_id === d.id; })[0]; if (!x) err_('Dokumen tidak ditemukan.');
  x.is_publik = x.is_publik === 1 ? 0 : 1; const f = DriveApp.getFileById(x.file_id);
  if (x.is_publik) { f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); all.forEach(function (o) { if (o.jenis === x.jenis && o.dok_id !== x.dok_id && o.musim === x.musim && o.is_publik === 1) { o.is_publik = 0; saveRows_('TBL_DOKUMEN', [o]); } }); } else f.setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE);
  saveRows_('TBL_DOKUMEN', [x]); bust_('galeri', 'hasil'); audit_(me, x.is_publik ? 'DOK_PUBLIK' : 'DOK_PRIVAT', 'Dokumen', x.dok_id);
  return ok_({ pub: x.is_publik === 1 }, x.is_publik ? 'Dokumen dipublikasikan ke portal.' : 'Dokumen disembunyikan dari publik.');
}

function dataUri_(fid) { try { const b = DriveApp.getFileById(fid).getBlob(); if (b.getBytes().length > 1500000) return ''; return 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes()); } catch (e) { return ''; } }
function aksesAtlet_(me, id) {
  const a = readT_('TBL_ATLET').filter(function (x) { return x.atlet_id === id; })[0]; if (!a) err_('Atlet tidak ditemukan.');
  if (me.role === R.KT && a.kontingen_id !== me.id) err_('Akses ditolak.'); return a;
}
function hIdCard_(me, d) {
  const a = aksesAtlet_(me, d.atletId), cfg = cfg_(), es = readT_('TBL_REGISTRASI_ENTRI').filter(function (e) { return e.atlet_id === a.atlet_id && e.musim === cfg.musim; });
  if (aggStatus_(es) !== 'SAH') err_('Kartu peserta tersedia setelah pendaftaran disetujui panitia.');
  const evs = idx_(readM_('TBL_MASTER_NOMOR_LOMBA'), 'event_id'), jen = idx_(readM_('TBL_MASTER_JENJANG'), 'kode_jenjang'), foto = a.foto_file_id ? dataUri_(a.foto_file_id) : '';
  const body = '<table style="width:340px;border:2px solid #0A3D62"><tr><td colspan="2" style="background:#0A3D62;color:#fff;font-size:13px"><b>KARTU PESERTA ' + esc_(cfg.app_name.toUpperCase()) + '</b><br>Musim ' + esc_(cfg.musim) + '</td></tr><tr><td style="width:110px">' + (foto ? '<img src="' + foto + '" width="100" height="130">' : '') + '</td><td><div style="font-size:15px;font-weight:bold">' + esc_(a.nama_lengkap) + '</div><div>BIB: <b>' + esc_(a.bib) + '</b></div><div>' + esc_(a.jenis_kelamin === 'PUTRA' ? 'Putra' : 'Putri') + ' • ' + esc_((jen[a.jenjang_kode] || {}).nama_jenjang) + '</div><div>' + esc_(a.sekolah_nama) + (a.klub_nama ? '<br>' + esc_(a.klub_nama) : '') + '</div></td></tr><tr><td colspan="2"><b>Nomor lomba:</b><br>' + es.map(function (e) { const x = evs[e.event_id] || {}; return '#' + x.event_no + ' ' + esc_(x.event_name) + ' (seed ' + esc_(e.seed_time_entry || 'NT') + ')'; }).join('<br>') + '</td></tr></table>';
  const blob = pdf_(docShell_('Kartu Peserta', cfg.lokasi, body), 'KartuPeserta_' + a.bib); audit_(me, 'IDCARD', 'Atlet', a.atlet_id);
  return ok_({ name: blob.getName(), mime: 'application/pdf', b64: Utilities.base64Encode(blob.getBytes()) });
}
function hSertifikat_(me, d) {
  const a = aksesAtlet_(me, d.atletId), cfg = cfg_(), r = readT_('TBL_RACE_RESULTS').filter(function (x) { return x.atlet_id === a.atlet_id && x.event_id === d.eventId && x.musim === cfg.musim && x.status_pengesahan === 'SAH' && x.status_lomba === 'OK'; })[0];
  if (!r) err_('Sertifikat tersedia setelah hasil nomor ini disahkan.');
  const ev = idx_(readM_('TBL_MASTER_NOMOR_LOMBA'), 'event_id')[d.eventId] || {}, jen = idx_(readM_('TBL_MASTER_JENJANG'), 'kode_jenjang'), judul = r.medal ? 'PIAGAM JUARA ' + r.rank_event : 'SERTIFIKAT PESERTA';
  const body = '<div style="border:6px double #0A3D62;padding:40px 30px;text-align:center"><div style="font-size:26px;font-weight:bold;color:#0A3D62">' + judul + '</div><p>diberikan kepada</p><div style="font-size:22px;font-weight:bold">' + esc_(a.nama_lengkap) + '</div><p>' + esc_(a.sekolah_nama) + '</p><p>atas partisipasi pada nomor<br><b>' + esc_(evJudul_(ev, jen)) + '</b><br>dengan catatan waktu <b>' + esc_(r.final_time) + '</b>' + (r.medal ? ' (' + esc_(r.medal) + ')' : '') + '</p><p>' + esc_(cfg.app_name) + ' ' + esc_(cfg.musim) + ' — ' + esc_(cfg.lokasi) + '</p></div>';
  const blob = pdf_(docShell_(judul, 'Dokumen resmi', body), 'Sertifikat_' + a.bib + '_' + (ev.event_no || '')); audit_(me, 'SERTIFIKAT', 'Atlet', a.atlet_id);
  return ok_({ name: blob.getName(), mime: 'application/pdf', b64: Utilities.base64Encode(blob.getBytes()) });
}

// ============================================================
// FITUR TAMBAHAN: rekap dashboard, tahapan event, kontak pendaftar,
// impor hasil historis, galeri album/tautan, logo & kop dokumen,
// buku acara & buku hasil, ekspor Excel
// ============================================================
const FASE = ['PENDAFTARAN', 'VERIFIKASI', 'STARTLIST', 'BUKU_ACARA', 'PELAKSANAAN', 'SELESAI'];

function rekapPendaftar_(lengkap) {
  const cfg = cfg_(), by = entsByAtlet_(cfg.musim), min = Number(cfg.min_peserta) || 5;
  const jen = readM_('TBL_MASTER_JENJANG').sort(function (a, b) { return a.urutan - b.urutan; });
  const evs = readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (e) { return e.is_active; }).sort(function (a, b) { return a.event_no - b.event_no; });
  const kel = {}, evN = {}, wil = {}, tot = { putra: 0, putri: 0, total: 0, entri: 0 };
  const mk = function (kode, nama) { return { kode: kode, nama: nama, putra: 0, putri: 0, total: 0, entriPutra: 0, entriPutri: 0 }; };
  jen.forEach(function (j) { kel[j.kode_jenjang] = mk(j.kode_jenjang, j.nama_jenjang); });
  readT_('TBL_ATLET').forEach(function (a) {
    const es = (by[a.atlet_id] || []).filter(function (e) { return e.status_verifikasi !== 'REJECTED'; });
    if (a.status_atlet !== 'ACTIVE' || !es.length) return;
    const k = kel[a.jenjang_kode] || (kel[a.jenjang_kode] = mk(a.jenjang_kode, a.jenjang_kode)), put = a.jenis_kelamin === 'PUTRA';
    if (put) { k.putra++; tot.putra++; k.entriPutra += es.length; } else { k.putri++; tot.putri++; k.entriPutri += es.length; }
    k.total++; tot.total++; tot.entri += es.length;
    es.forEach(function (e) { evN[e.event_id] = (evN[e.event_id] || 0) + 1; });
    if (lengkap) { const w = a.kota_asal || '-', x = wil[w] || (wil[w] = { n: w, atlet: 0, putra: 0, putri: 0 }); x.atlet++; if (put) x.putra++; else x.putri++; }
  });
  return {
    kelompok: Object.keys(kel).map(function (k) { return kel[k]; }), total: tot, min: min,
    nomor: lengkap ? evs.map(function (e) { const n = evN[e.event_id] || 0; return { id: e.event_id, no: e.event_no, nama: e.event_name, g: e.gender, jk: e.jenjang_kode, n: n, kurang: n < min }; }) : [],
    wilayah: Object.keys(wil).map(function (k) { return wil[k]; }).sort(function (a, b) { return b.atlet - a.atlet; })
  };
}

function hADash_(me) {
  const cfg = cfg_(), atl = readT_('TBL_ATLET').filter(function (a) { return a.status_atlet === 'ACTIVE'; }), by = entsByAtlet_(cfg.musim), uang = me.role === R.SA || me.role === R.VF;
  const k = { atlet: 0, kontingen: readT_('TBL_KONTINGEN').filter(function (x) { return x.status_akun === 'ACTIVE'; }).length, menunggu: 0, revisi: 0, sah: 0, pengajuan: 0, evSah: 0, evTotal: 0 }, jen = {}, aksi = [], tr = {}; let nominal = 0;
  atl.forEach(function (a) {
    const es = by[a.atlet_id] || []; if (!es.length) return; k.atlet++;
    const st = aggStatus_(es); if (st === 'SAH') k.sah++; else if (st === 'REVISI' || st === 'DITOLAK') k.revisi++; else k.menunggu++;
    jen[a.jenjang_kode] = (jen[a.jenjang_kode] || 0) + 1;
    if (uang) es.forEach(function (e) { if (e.status_bayar === 'PAID_VERIFIED') nominal += e.nominal_biaya; });
    const day = String(a.created_at).slice(0, 10); tr[day] = (tr[day] || 0) + 1;
    if (st !== 'SAH' && aksi.length < 8) aksi.push({ id: a.atlet_id, nama: a.nama_lengkap, sk: a.sekolah_nama, jk: a.jenjang_kode, ev: es.length, st: st });
  });
  k.pengajuan = readT_('TBL_MUTASI_ATLET').filter(function (m) { return m.status_approval === 'PENDING'; }).length;
  const st = evStatus_(cfg.musim); k.evTotal = readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (e) { return e.is_active; }).length;
  k.evSah = Object.keys(st).filter(function (x) { return st[x].s === 'SAH'; }).length;
  const days = []; for (let i = 13; i >= 0; i--) { const d = Utilities.formatDate(new Date(Date.now() - i * 86400000), TZ, 'yyyy-MM-dd'); days.push({ d: d, n: tr[d] || 0 }); }
  const rk = rekapPendaftar_(me.role === R.SA);
  return ok_({ kpi: k, nominal: uang ? nominal : null, trend: days, jenjang: Object.keys(jen).map(function (x) { return { k: x, n: jen[x] }; }), aksi: aksi, rekap: rk, fase: cfg.fase, buka: bukaDaftar_(), deadline: cfg.registrasi_deadline, kurang: rk.nomor.filter(function (n) { return n.kurang; }).length });
}

// ── Pendaftar per nomor < batas minimum: tandai & hubungi ──
function hKurang_() {
  const cfg = cfg_(), min = Number(cfg.min_peserta) || 5, atl = idx_(readT_('TBL_ATLET'), 'atlet_id'), kont = idx_(readT_('TBL_KONTINGEN'), 'kontingen_id'), by = {};
  readT_('TBL_REGISTRASI_ENTRI').forEach(function (e) { if (e.musim === cfg.musim && e.status_verifikasi !== 'REJECTED') (by[e.event_id] = by[e.event_id] || []).push(e); });
  const out = [];
  readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (e) { return e.is_active; }).sort(function (a, b) { return a.event_no - b.event_no; }).forEach(function (ev) {
    const L = by[ev.event_id] || []; if (L.length >= min) return;
    out.push({ id: ev.event_id, no: ev.event_no, nama: ev.event_name, g: ev.gender, jk: ev.jenjang_kode, n: L.length, daftar: L.map(function (e) { const a = atl[e.atlet_id] || {}, k = kont[e.kontingen_id] || {}; return { atlet: a.nama_lengkap, kont: k.nama_lembaga, pj: k.pj_nama, email: k.pj_email, telp: k.pj_telepon }; }) });
  });
  return ok_({ min: min, fase: cfg.fase, list: out });
}
function hKontak_(me, d) {
  const id = String(d.id || ''), pesan = String(d.pesan || '').trim(), subjek = String(d.subjek || '').trim() || 'Informasi pendaftaran nomor lomba';
  if (pesan.length < 10) err_('Isi pesan minimal 10 karakter.');
  const cfg = cfg_(), ents = readT_('TBL_REGISTRASI_ENTRI').filter(function (e) { return e.musim === cfg.musim && e.event_id === id && e.status_verifikasi !== 'REJECTED'; }), kont = idx_(readT_('TBL_KONTINGEN'), 'kontingen_id'), seen = {}; let n = 0;
  if (MailApp.getRemainingDailyQuota() < 5) err_('Kuota email harian hampir habis.');
  ents.forEach(function (e) { const k = kont[e.kontingen_id]; if (!k || seen[k.pj_email]) return; seen[k.pj_email] = 1; kirimEmail_(k.pj_email, subjek, '<p>' + esc_(pesan).replace(/\n/g, '<br>') + '</p>'); n++; });
  audit_(me, 'KONTAK_PENDAFTAR', 'Nomor', id + ' → ' + n + ' email');
  return ok_({ n: n }, n ? 'Email terkirim ke ' + n + ' penanggung jawab.' : 'Tidak ada penerima.');
}

// ── Tahapan event: tutup pendaftaran → start list → buku acara → pelaksanaan ──
function emailSemuaKontingen_(subjek, html) { const seen = {}; let n = 0; readT_('TBL_KONTINGEN').forEach(function (k) { if (k.status_akun !== 'ACTIVE' || seen[k.pj_email] || n >= 80) return; seen[k.pj_email] = 1; n++; kirimEmail_(k.pj_email, subjek, html); }); return n; }
function hFaseGet_() {
  const cfg = cfg_(), by = entsByAtlet_(cfg.musim), st = evStatus_(cfg.musim); let total = 0, menunggu = 0;
  readT_('TBL_ATLET').forEach(function (a) { if (a.status_atlet !== 'ACTIVE' || !by[a.atlet_id]) return; total++; const s = aggStatus_(by[a.atlet_id]); if (s === 'MENUNGGU' || s === 'REVISI') menunggu++; });
  const dok = readT_('TBL_DOKUMEN').some(function (x) { return x.musim === cfg.musim && x.jenis === 'BUKU_ACARA' && x.is_publik === 1; });
  return ok_({ fase: cfg.fase, buka: bukaDaftar_(), deadline: cfg.registrasi_deadline, atlet: total, menunggu: menunggu, nomorStart: Object.keys(st).filter(function (k) { return st[k].a > 0; }).length, bukuAcara: dok, musim: cfg.musim });
}
function hFaseSet_(me, d) {
  const cfg = cfg_(), cur = cfg.fase || 'PENDAFTARAN', ke = String(d.ke || ''), i = FASE.indexOf(cur), j = FASE.indexOf(ke);
  if (j < 0 || ke === 'SELESAI') err_('Tahap tidak valid. Penutupan akhir dilakukan lewat menu Tutup Event & Arsip.');
  let msg = '';
  if (j === i + 1) {
    if (ke === 'VERIFIKASI') {
      cfgSet_(me, { registrasi_dibuka: '0', fase: 'VERIFIKASI' }); msg = 'Pendaftaran ditutup. Tidak ada pendaftar baru yang dapat masuk.';
      if (d.email) { const n = emailSemuaKontingen_('Pendaftaran ditutup', '<p>Pendaftaran atlet <b>' + esc_(cfg.app_name) + ' ' + esc_(cfg.musim) + '</b> telah ditutup. Panitia kini memverifikasi berkas; mohon pantau status dan perbaiki berkas bila diminta.</p>'); msg += ' Email dikirim ke ' + n + ' kontingen.'; }
    } else if (ke === 'STARTLIST') {
      const r = hSeed_(me, { id: 'ALL' }); if (!r.data.nomor) err_('Belum ada peserta terverifikasi dan lunas, start list belum dapat disusun.');
      cfgSet_(me, { fase: 'STARTLIST' }); msg = r.message;
    } else if (ke === 'BUKU_ACARA') {
      const blob = pdf_(htmlBukuAcara_(0), 'BukuAcara_' + cfg.musim + '_' + Utilities.formatDate(new Date(), TZ, 'yyyyMMdd_HHmm')), rec = simpanDok_(me, 'BUKU_ACARA', blob, true); unpublishOthers_(rec);
      cfgSet_(me, { fase: 'BUKU_ACARA' }); msg = 'Buku Acara dibuat dan dipublikasikan di portal.';
    } else if (ke === 'PELAKSANAAN') { cfgSet_(me, { fase: 'PELAKSANAAN' }); msg = 'Pelaksanaan dimulai. Admin Input Data kini dapat mengisi hasil.'; }
  } else if (ke === 'PENDAFTARAN' && cur === 'VERIFIKASI') {
    if (String(d.alasan || '').trim().length < 5) err_('Alasan membuka kembali pendaftaran wajib diisi.');
    if (Object.keys(evStatus_(cfg.musim)).some(function (k) { return evStatus_(cfg.musim)[k].a > 0; })) err_('Start list sudah tersusun, pendaftaran tidak dapat dibuka kembali.');
    cfgSet_(me, { registrasi_dibuka: '1', fase: 'PENDAFTARAN' }); msg = 'Pendaftaran dibuka kembali.';
  } else err_('Perpindahan tahap tidak diizinkan.');
  bust_('master', 'atlet', 'hasil', 'galeri'); audit_(me, 'FASE_' + ke, 'Event', cfg.musim);
  return ok_(null, msg);
}
function unpublishOthers_(rec) { readT_('TBL_DOKUMEN', true).forEach(function (o) { if (o.jenis === rec.jenis && o.musim === rec.musim && o.dok_id !== rec.dok_id && o.is_publik === 1) { o.is_publik = 0; saveRows_('TBL_DOKUMEN', [o]); try { DriveApp.getFileById(o.file_id).setSharing(DriveApp.Access.PRIVATE, DriveApp.Permission.NONE); } catch (e) { } } }); }

// ── Impor hasil kejuaraan yang sudah terlaksana (arsip) ──
const GAYA_KEY = [['bebas', 'Gaya Bebas'], ['dada', 'Gaya Dada'], ['punggung', 'Gaya Punggung'], ['kupu', 'Gaya Kupu-kupu'], ['ganti', 'Gaya Ganti Perorangan'], ['medley', 'Gaya Ganti Perorangan']];
function alnum_(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function normJenjang_(s) {
  const t = alnum_(s), t2 = t.replace('kelas', ''), js = readM_('TBL_MASTER_JENJANG');
  for (let i = 0; i < js.length; i++) { const a = alnum_(js[i].kode_jenjang), b = alnum_(js[i].nama_jenjang); if (t === a || t === b || t2 === b.replace('kelas', '') || t2 === a.replace('kelas', '')) return js[i].kode_jenjang; }
  const m = String(s || '').toUpperCase().match(/(TK|SD|SMP|SMA)[^0-9]*(\d{1,2})(?:\s*(?:-|–|_|S\.?D\.?|\/)\s*(\d{1,2}))?/); // kelompok gabungan event lain
  if (m) return m[1] + '_' + m[2] + (m[3] ? '_' + m[3] : '');
  return '';
}
function jenjangMaster_(k) { return readM_('TBL_MASTER_JENJANG').some(function (j) { return j.kode_jenjang === k; }); }
function kelasNum_(v) { // '2', '2 SD', '1 SMP', 'TK', 'Kelas 8' -> 0..12, atau -1
  const t = String(v == null ? '' : v).toUpperCase().trim(); if (!t) return -1; if (/^TK|PAUD|RA\b/.test(t)) return 0;
  const RM = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12 }, rm = t.match(/\b(XII|XI|IX|X|VIII|VII|VI|IV|V|III|II|I)\b/);
  const m = t.match(/(\d{1,2})/); if (!m && !rm) return -1; let n = m ? parseInt(m[1], 10) : RM[rm[1]];
  if (/SMP|MTS/.test(t) && n <= 3) n += 6; if (/SMA|SMK|MA\b/.test(t) && n <= 3) n += 9; return n >= 0 && n <= 12 ? n : -1;
}
function ensureHdr_(name) { try { const sk = SKEMA[name], sh = sh_(name), nc = sk.cols.length; if (sh.getMaxColumns() < nc) sh.insertColumnsAfter(sh.getMaxColumns(), nc - sh.getMaxColumns()); const h = sh.getRange(1, 1, 1, nc).getValues()[0]; if (h.join('|') !== sk.cols.join('|')) sh.getRange(1, 1, 1, nc).setValues([sk.cols]); } catch (e) { } }
function normGender_(s) { s = String(s || '').trim().toLowerCase(); if (/^(l|lk|laki|putra|pa|m|male|pria)/.test(s)) return 'PUTRA'; if (/^(p|pr|perempuan|putri|pi|f|female|wanita)/.test(s)) return 'PUTRI'; return ''; }
function parseNomor_(s) { s = String(s || '').toLowerCase(); const m = s.match(/(\d{2,4})\s*(m|meter)?/), d = m ? parseInt(m[1], 10) : 0; let st = ''; GAYA_KEY.forEach(function (k) { if (!st && s.indexOf(k[0]) >= 0) st = k[1]; }); return { d: d, st: st }; }
// Jenis kolam per baris arsip (SCM 25 m / LCM 50 m). Baris lama tanpa kolom kolam memakai pengaturan arsip, bawaan LCM.
function kolR_(r, meta) { return r.kolam === 'SCM' || r.kolam === 'LCM' ? r.kolam : (((meta || arsipMeta_())[r.musim] || {}).kolam === 'SCM' ? 'SCM' : 'LCM'); }
function kolamDari_(v) { const t = String(v || '').toLowerCase(); if (!t) return ''; if (/25|short|sc\b|scm|pendek/.test(t)) return 'SCM'; if (/50|long|lc\b|lcm|panjang/.test(t)) return 'LCM'; return ''; }
function normImpRows_(rows) {
  const out = [], errs = [];
  (Array.isArray(rows) ? rows : []).slice(0, 500).forEach(function (r, i) {
    const nama = String(r.nama || '').trim(), no = parseNomor_(r.nomor), g = normGender_(r.gender), kls = kelasNum_(r.kelas), jk = normJenjang_(r.kelompok) || (kls >= 0 ? jenjangOfAll_(kls) : ''), sts0 = String(r.status || 'OK').trim().toUpperCase(), sts = sts0 === 'NS' ? 'DNS' : sts0 === 'DSQ' ? 'DQ' : sts0;
    const st = ['OK', 'DQ', 'DNS', 'DNF'].indexOf(sts) >= 0 ? sts : 'OK'; let ms = 0, w = '';
    const musim = String(r.musim || '').trim(), tgl = String(r.tanggal || '').trim(), rk = toInt_(r.rank, 0), noA = toInt_(r.no_acara, 0);
    const e = []; if (nama.length < 2) e.push('nama kosong'); if (!no.d || !no.st) e.push('nomor tidak terbaca (mis. "50m Gaya Bebas")'); if (!g) e.push('gender tidak dikenali'); if (!jk) e.push('kelompok tidak dikenali');
    if (st === 'OK') { ms = parseWaktu_(r.waktu); if (ms <= 0) e.push('waktu tidak valid'); else w = fmtWaktu_(ms); }
    if (musim && !/^[\w\/ .-]{1,30}$/.test(musim)) e.push('nama musim/arsip maks 30 karakter (huruf, angka, spasi, - . /)'); if (tgl && !/^\d{4}-\d{2}-\d{2}$/.test(tgl)) e.push('tanggal harus format YYYY-MM-DD');
    if (e.length) errs.push({ i: i + 1, msg: e.join(', ') }); else out.push({ nomor: no.d + 'm ' + no.st, gender: g, kelompok: jk, nama: nama, sekolah: String(r.sekolah || '').trim(), klub: String(r.klub || '').trim(), kota: String(r.kota || '').trim(), waktu: w, status: st, catatan: String(r.catatan || '').slice(0, 150), musim: musim, event: String(r.event || '').trim().slice(0, 120), tanggal: tgl, lokasi: String(r.lokasi || '').trim().slice(0, 120), kelas: kls >= 0 ? kls : '', rank: rk > 0 ? rk : '', no_acara: noA > 0 ? noA : '', kolam: kolamDari_(r.kolam), label: String(r.label || '').trim().slice(0, 120), entry: String(r.entry || '').trim().slice(0, 12) });
  });
  return { rows: out, errors: errs };
}
function hImpCek_(me, d) { const r = normImpRows_(d.rows), at = {}, no = {}, ms = {}; r.rows.forEach(function (x) { at[x.musim + '|' + x.nama] = 1; no[x.musim + '|' + x.nomor + x.gender + x.kelompok] = 1; if (x.musim) { const o = ms[x.musim] || (ms[x.musim] = { musim: x.musim, event: x.event, tanggal: x.tanggal, lokasi: x.lokasi, n: 0, kol: {} }); o.n++; o.kol[x.kolam || '-'] = (o.kol[x.kolam || '-'] || 0) + 1; } }); const kol = {}; r.rows.forEach(function (x) { kol[x.kolam || '-'] = (kol[x.kolam || '-'] || 0) + 1; }); const mt = arsipMeta_(), ada = {}; readT_('TBL_HASIL_ARSIP', true).forEach(function (x) { const k = kolR_(x, mt), o = ada[x.musim] || (ada[x.musim] = { n: 0, kol: {} }); o.n++; o.kol[k] = (o.kol[k] || 0) + 1; });
  Object.keys(ms).forEach(function (k) { const o = ms[k]; if (!ada[k]) return; const m = mt[k] || {}, sm = arsipSama_(m, o); o.ada = { event: m.event || '', tanggal: m.tanggal || '', n: ada[k].n, kol: ada[k].kol, sama: sm.sama }; });
  const tm = r.rows.filter(function (x) { return !x.musim; })[0];
  return ok_({ arsip: Object.keys(ada).map(function (k) { const m = mt[k] || {}; return { musim: k, event: m.event || '', tanggal: m.tanggal || '', n: ada[k].n, kol: ada[k].kol }; }), tanpa: tm ? { event: tm.event, tanggal: tm.tanggal } : null, kol: kol, rows: r.rows.slice(0, 60), n: r.rows.length, errors: r.errors.slice(0, 30), nErr: r.errors.length, atlet: Object.keys(at).length, nomor: Object.keys(no).length, musim: Object.keys(ms).map(function (k) { return ms[k]; }) }); }
// Bandingkan info event arsip lama dengan baris baru. Sama bila minimal satu (nama event / tanggal) bisa dibandingkan dan semuanya cocok.
function evNorm_(v) { return String(v || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
function arsipSama_(m, x) { let n = 0, beda = false; if (m.event && x.event) { n++; if (evNorm_(m.event) !== evNorm_(x.event)) beda = true; } if (m.tanggal && x.tanggal) { n++; if (String(m.tanggal).slice(0, 10) !== String(x.tanggal).slice(0, 10)) beda = true; }
  const ket = function (o) { return (o.event ? '"' + o.event + '"' : 'event tanpa nama') + (o.tanggal ? ' (' + String(o.tanggal).slice(0, 10) + ')' : ''); };
  return { sama: n > 0 && !beda, lama: ket(m), baru: ket(x) }; }
function arsipMeta_() { try { return JSON.parse(cfg_()._arsip_meta || '{}') || {}; } catch (e) { return {}; } }
function hImpSimpan_(me, d) {
  const def = String(d.musim || '').trim(), cur = cfg_().musim, defKol = d.kolam === 'SCM' ? 'SCM' : d.kolam === 'LCM' ? 'LCM' : '';
  const r = normImpRows_(d.rows); if (r.errors.length) err_('Ada ' + r.errors.length + ' baris tidak valid (baris ' + r.errors[0].i + ': ' + r.errors[0].msg + ').'); if (!r.rows.length) err_('Tidak ada baris untuk disimpan.');
  r.rows.forEach(function (x) { x.musim = x.musim || def; if (!/^[\w\/ .-]{1,30}$/.test(x.musim)) err_('Nama/tahun musim (arsip) wajib diisi, maks 30 karakter.'); if (x.musim === cur) err_('Musim "' + cur + '" adalah musim berjalan. Gunakan nama arsip lain.'); x.kolam = x.kolam || defKol; if (!x.kolam) err_('Pilih jenis kolam data ini (50 m long course atau 25 m short course).'); });
  ensureHdr_('TBL_HASIL_ARSIP');
  const hapus = (Array.isArray(d.ganti) ? d.ganti : []).map(String); // impor ulang: ganti data lama musim yang sama (dikirim pada potongan pertama)
  const mt0 = arsipMeta_(), semua = readT_('TBL_HASIL_ARSIP', true), sisa = semua.filter(function (x) { return hapus.indexOf(x.musim + '|' + kolR_(x, mt0)) < 0; });
  const adaM = {}; sisa.forEach(function (x) { adaM[x.musim] = 1; });
  // Pengaman: nama arsip yang sudah dipakai event lain tidak boleh tergabung diam-diam.
  const gabung = (Array.isArray(d.gabung) ? d.gabung : []).map(String), cek = {};
  r.rows.forEach(function (x) { if (!adaM[x.musim] || gabung.indexOf(x.musim) >= 0 || cek[x.musim]) return; cek[x.musim] = 1; const s = arsipSama_(mt0[x.musim] || {}, x); if (!s.sama) err_('Nama arsip "' + x.musim + '" sudah dipakai untuk ' + s.lama + '. Data yang diunggah (' + s.baru + ') akan tergabung ke arsip itu. Beri nama arsip lain, atau centang "gabungkan" bila memang event yang sama.'); });
  if (sisa.length !== semua.length) rewriteT_('TBL_HASIL_ARSIP', sisa); // hanya arsip dengan nama & kolam yang sama
  const t = nowIso_(), meta = arsipMeta_(); let ubahMeta = false;
  Object.keys(meta).forEach(function (k) { if (!adaM[k] && (semua.some(function (x) { return x.musim === k; }) || r.rows.some(function (x) { return x.musim === k; }))) { delete meta[k]; ubahMeta = true; } }); // arsip yang diganti seluruhnya: info event lama dibuang
  appendT_('TBL_HASIL_ARSIP', r.rows.map(function (x) {
    const n = parseNomor_(x.nomor);
    if (x.event || x.tanggal || x.lokasi) { const m = meta[x.musim] || {}; if (x.event && !m.event) { m.event = x.event; ubahMeta = true; } if (x.tanggal && !m.tanggal) { m.tanggal = x.tanggal; ubahMeta = true; } if (x.lokasi && !m.lokasi) { m.lokasi = x.lokasi; ubahMeta = true; } meta[x.musim] = m; }
    return { arsip_id: uid_('HA'), musim: x.musim, event_label: x.label || x.nomor, jenjang_kode: x.kelompok, gender: x.gender, stroke_type: n.st, distance_m: n.d, nama_atlet: x.nama, sekolah: x.sekolah, klub: x.klub, kota: x.kota, waktu: x.waktu, waktu_ms: x.status === 'OK' ? parseWaktu_(x.waktu) : 0, status: x.status, catatan: x.catatan, dibuat_oleh: me.nama, dibuat_at: t, kelas: x.kelas, rank_resmi: x.rank || 0, no_acara: x.no_acara || 0, tanggal: x.tanggal, entry_time: x.entry, kolam: x.kolam };
  }));
  if (ubahMeta) cfgSet_(me, { _arsip_meta: JSON.stringify(meta) });
  const ms = {}; r.rows.forEach(function (x) { ms[x.musim] = 1; });
  bust_('hasil'); audit_(me, 'IMPOR_HASIL', 'Arsip', Object.keys(ms).join(', ') + ' +' + r.rows.length);
  return ok_({ n: r.rows.length, musim: Object.keys(ms) }, r.rows.length + ' baris tersimpan ke arsip ' + Object.keys(ms).join(', ') + '.');
}
function hImpList_() {
  const g = {}, mt0 = arsipMeta_(); readT_('TBL_HASIL_ARSIP', true).forEach(function (r) { const x = g[r.musim] || (g[r.musim] = { musim: r.musim, rows: 0, atlet: {}, nomor: {}, kol: {} }); x.rows++; const kk = kolR_(r, mt0); x.kol[kk] = (x.kol[kk] || 0) + 1; x.atlet[r.nama_atlet] = 1; x.nomor[r.jenjang_kode + r.gender + r.stroke_type + r.distance_m] = 1; });
  const fin = {}; readT_('TBL_EVENT_ARCHIVE_LOG', true).forEach(function (a) { fin[a.season_name] = 1; });
  const meta = arsipMeta_();
  return ok_(Object.keys(g).map(function (k) { const m = meta[k] || {}; return { musim: k, rows: g[k].rows, atlet: Object.keys(g[k].atlet).length, nomor: Object.keys(g[k].nomor).length, final: !!fin[k], event: m.event || '', tanggal: m.tanggal || '', lokasi: m.lokasi || '', kol: g[k].kol }; }).sort(function (a, b) { return String(a.tanggal || a.musim).localeCompare(String(b.tanggal || b.musim)); }));
}
function rankGrup_(L) { const ok = L.filter(function (r) { return r.st === 'OK' && r.ms > 0; }).sort(function (a, b) { return a.ms - b.ms; });
  if (ok.length && ok.every(function (r) { return r.rr > 0; })) { ok.forEach(function (r) { r.rank = r.rr; r.medal = r.rr === 1 ? 'EMAS' : r.rr === 2 ? 'PERAK' : r.rr === 3 ? 'PERUNGGU' : ''; }); L.forEach(function (r) { if (!(r.st === 'OK' && r.ms > 0)) { r.rank = 0; r.medal = ''; } }); return; } /* peringkat resmi dokumen sumber */
  let rank = 0, prev = -1, i = 0; ok.forEach(function (r) { i++; if (r.ms !== prev) { rank = i; prev = r.ms; } r.rank = rank; r.medal = rank === 1 ? 'EMAS' : rank === 2 ? 'PERAK' : rank === 3 ? 'PERUNGGU' : ''; }); L.forEach(function (r) { if (!(r.st === 'OK' && r.ms > 0)) { r.rank = 0; r.medal = ''; } }); }
function arsipNormal_(musim) {
  let rows = []; const imp = readT_('TBL_HASIL_ARSIP').filter(function (r) { return r.musim === musim; });
  const mt = arsipMeta_(); if (imp.length) rows = imp.map(function (r) { return { kol: kolR_(r, mt), id: r.arsip_id, jk: r.jenjang_kode, g: r.gender, s: r.stroke_type, d: r.distance_m, nama: r.nama_atlet, sk: r.sekolah, kl: r.klub, kota: r.kota, ms: r.waktu_ms, st: r.status, cat: r.catatan, waktu: r.waktu, baru: false, rr: r.rank_resmi, kelas: r.kelas, no: r.no_acara, label: r.event_label }; });
  else { const atl = idx_(readT_('TBL_ATLET'), 'atlet_id'), evs = idx_(readM_('TBL_MASTER_NOMOR_LOMBA'), 'event_id'); rows = readT_('TBL_RACE_RESULTS').filter(function (r) { return r.musim === musim && r.status_pengesahan === 'SAH'; }).map(function (r) { const a = atl[r.atlet_id] || {}, e = evs[r.event_id] || {}; return { kol: e.course_type === 'SCM' ? 'SCM' : 'LCM', jk: e.jenjang_kode, g: e.gender, s: e.stroke_type, d: e.distance_m, nama: a.nama_lengkap, sk: a.sekolah_nama, kl: a.klub_nama, kota: a.kota_asal, ms: r.final_ms, st: r.status_lomba, cat: r.dq_code || r.catatan, waktu: r.final_time, baru: r.is_new_record === 1, no: e.event_no }; }); }
  const grp = {}; rows.forEach(function (r) { r.key = [r.jk, r.g, r.s, r.d, r.kol].join('|'); (grp[r.key] = grp[r.key] || []).push(r); }); Object.keys(grp).forEach(function (k) { rankGrup_(grp[k]); });
  return rows;
}
function klasemenRows_(rows) {
  const cfg = cfg_(), P = { EMAS: Number(cfg.poin_emas) || 0, PERAK: Number(cfg.poin_perak) || 0, PERUNGGU: Number(cfg.poin_perunggu) || 0 }, sk = {}, kl = {};
  const add = function (b, nama, kota, r) { if (!nama) return; const k = nk_(nama), o = b[k] || (b[k] = { nama: nama, kota: kota || '', a: {}, e: 0, p: 0, b: 0, poin: 0 }); o.a[r.nama] = 1; if (r.medal) { if (r.medal === 'EMAS') o.e++; else if (r.medal === 'PERAK') o.p++; else o.b++; o.poin += P[r.medal] || 0; } };
  rows.forEach(function (r) { add(sk, r.sk, r.kota, r); add(kl, r.kl, r.kota, r); });
  const fin = function (b) { return Object.keys(b).map(function (k) { const o = b[k]; return { nama: o.nama, kota: o.kota, atlet: Object.keys(o.a).length, e: o.e, p: o.p, b: o.b, total: o.e + o.p + o.b, poin: o.poin }; }).filter(function (o) { return o.total > 0; }).sort(cmpKlas_); };
  return { sekolah: fin(sk), klub: fin(kl) };
}
// Rekor dari arsip impor. Kunci rekor memakai jenis kolam arsip (SCM 25 m / LCM 50 m) — rekor short course & long course terpisah.
function impRekor_(musim, rows, meta) {
  ensureHdr_('TBL_REKOR_KEJUARAAN'); let nr = 0;
  const recs = readT_('TBL_REKOR_KEJUARAAN', true), tahun = Number(String(meta.tanggal || '').slice(0, 4)) || Number(musim) || new Date().getFullYear(), grp = {};
  const evTxt = (meta.event || ('Arsip ' + musim)) + (meta.tanggal ? ' — ' + tglID_(meta.tanggal) : ''), lok = meta.lokasi || ('Arsip ' + musim);
  rows.forEach(function (r) {
    if (!(r.st === 'OK' && r.ms > 0) || /^periksa/i.test(r.cat || '')) return;
    const jk = r.kelas !== '' && r.kelas != null && String(r.kelas) !== '' ? jenjangOfAll_(Number(r.kelas)) : (jenjangMaster_(r.jk) ? r.jk : ''); if (!jk) return;
    const kk = [jk, r.g, r.s, r.d, r.kol || 'LCM'].join('|'); if (!grp[kk] || r.ms < grp[kk].ms) grp[kk] = Object.assign({}, r, { jkR: jk });
  });
  const add = [], upd = [];
  Object.keys(grp).forEach(function (kk) {
    const r = grp[kk], key = [r.jkR, r.g, r.s, r.d, r.kol || 'LCM'].join('|'), rec = recs.concat(add).filter(function (x) { return x.rekor_key === key; })[0], kont = r.sk || r.kl || '';
    if (!rec) { add.push({ rekor_id: uid_('RK'), rekor_key: key, event_name: r.d + 'm ' + r.s, jenjang_kode: r.jkR, gender: r.g, stroke_type: r.s, distance_m: r.d, atlet_id: '', pemegang_nama: r.nama, kontingen_nama: kont, rekor_ms: r.ms, rekor_waktu: r.waktu, tahun: tahun, lokasi: lok, result_id: 'IMP-' + musim + '-' + nr, riwayat: '[]', event_rekor: evTxt, tanggal: meta.tanggal || '' }); nr++; }
    else if (r.ms < rec.rekor_ms) { let rw = []; try { rw = JSON.parse(rec.riwayat || '[]'); } catch (e) { } rw.push({ ms: rec.rekor_ms, w: rec.rekor_waktu, n: rec.pemegang_nama, k: rec.kontingen_nama, t: rec.tahun, rid: rec.result_id, aid: rec.atlet_id, ev: rec.event_rekor, l: rec.lokasi, tg: rec.tanggal }); Object.assign(rec, { rekor_ms: r.ms, rekor_waktu: r.waktu, atlet_id: '', pemegang_nama: r.nama, kontingen_nama: kont, tahun: tahun, lokasi: lok, result_id: 'IMP-' + musim + '-' + nr, riwayat: JSON.stringify(rw.slice(-5)), event_rekor: evTxt, tanggal: meta.tanggal || '' }); if (rec._r && upd.indexOf(rec) < 0) upd.push(rec); nr++; }
  });
  if (upd.length) saveRows_('TBL_REKOR_KEJUARAAN', upd); if (add.length) appendT_('TBL_REKOR_KEJUARAAN', add);
  return nr;
}
// Ubah jenis kolam arsip impor, lalu hitung ulang semua rekor yang berasal dari arsip impor (urut tanggal event).
// Hitung ulang SEMUA rekor yang berasal dari arsip impor, dari data arsip saat ini (urut tanggal event).
// Rekor lama dari impor dibuang dulu, jadi arsip yang dihapus/diganti/dipindah kolam tidak meninggalkan rekor usang.
// Rekor dari hasil web tetap; riwayat impor di dalamnya dibuang lalu dibangun lagi.
function rekorImpUlang_() {
  ensureHdr_('TBL_REKOR_KEJUARAAN'); const meta = arsipMeta_(), fin = {}; readT_('TBL_EVENT_ARCHIVE_LOG', true).forEach(function (a) { fin[a.season_name] = 1; });
  const recs = readT_('TBL_REKOR_KEJUARAAN', true), keep = recs.filter(function (x) { return String(x.result_id).indexOf('IMP-') !== 0; }).map(function (x) { let rw = []; try { rw = JSON.parse(x.riwayat || '[]'); } catch (e) { } x.riwayat = JSON.stringify(rw.filter(function (h) { return String(h.rid || '').indexOf('IMP-') !== 0; })); return x; });
  rewriteT_('TBL_REKOR_KEJUARAAN', keep);
  const ada = {}; readT_('TBL_HASIL_ARSIP', true).forEach(function (r) { ada[r.musim] = 1; });
  const ms = Object.keys(fin).filter(function (m) { return ada[m]; }).sort(function (a, b) { return String((meta[a] || {}).tanggal || a).localeCompare(String((meta[b] || {}).tanggal || b)); });
  let n = 0; ms.forEach(function (m) { n += impRekor_(m, arsipNormal_(m), meta[m] || {}); });
  bust_('hasil', 'master'); return n;
}
function hImpRekorUlang_(me) { const n = rekorImpUlang_(); audit_(me, 'REKOR_ULANG', 'Rekor', 'arsip impor'); return ok_({ rekor: n }, 'Rekor dari arsip impor dihitung ulang dari data arsip saat ini (' + n + ' rekor).'); }
function hImpKolam_(me, d) {
  const musim = String(d.musim || ''), kolam = d.kolam === 'SCM' ? 'SCM' : 'LCM', dari = d.dari === 'SCM' || d.dari === 'LCM' ? d.dari : '', meta = arsipMeta_();
  ensureHdr_('TBL_HASIL_ARSIP'); const pindah = readT_('TBL_HASIL_ARSIP', true).filter(function (r) { return r.musim === musim && (!dari || kolR_(r, meta) === dari); });
  if (!pindah.length) err_('Arsip tidak ditemukan.'); pindah.forEach(function (r) { r.kolam = kolam; }); saveRows_('TBL_HASIL_ARSIP', pindah);
  const n = rekorImpUlang_();
  bust_('hasil', 'master'); audit_(me, 'ARSIP_KOLAM', 'Arsip', musim + ' → ' + kolam);
  return ok_({ rekor: n }, pindah.length + ' baris arsip ' + musim + ' ditandai kolam ' + (kolam === 'SCM' ? '25 m (short course)' : '50 m (long course)') + '. Rekor dari arsip dihitung ulang (' + n + ' rekor).');
}
function hImpFinal_(me, d) {
  const musim = String(d.musim || '').trim(), rows = arsipNormal_(musim); if (!rows.length) err_('Belum ada data impor untuk musim ini.');
  const k = klasemenRows_(rows), top = k.sekolah.slice(0, 5).map(function (x) { return { nama: x.nama, e: x.e, p: x.p, b: x.b, poin: x.poin }; });
  const at = {}, kn = {}; rows.forEach(function (r) { at[r.nama] = 1; if (r.sk) kn[nk_(r.sk)] = 1; if (r.kl) kn[nk_(r.kl)] = 1; });
  const meta = arsipMeta_()[musim] || {}, snap = JSON.stringify({ juara: top[0] ? top[0].nama : '', top: top, klub: k.klub.slice(0, 3).map(function (x) { return { nama: x.nama, poin: x.poin }; }), sumber: 'IMPOR', event: meta.event || '', tanggal: meta.tanggal || '', lokasi: meta.lokasi || '' }), logs = readT_('TBL_EVENT_ARCHIVE_LOG', true), cur = logs.filter(function (a) { return a.season_name === musim; })[0];
  const hash = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, musim + '|' + rows.length + '|' + nowIso_()));
  if (cur) { Object.assign(cur, { total_kontingen: Object.keys(kn).length, total_atlet: Object.keys(at).length, snapshot_json: snap, integrity_hash: hash, closed_by: me.nama, closed_at: nowIso_() }); saveRows_('TBL_EVENT_ARCHIVE_LOG', [cur]); }
  else appendT_('TBL_EVENT_ARCHIVE_LOG', [{ archive_id: uid_('AR'), season_name: musim, total_kontingen: Object.keys(kn).length, total_atlet: Object.keys(at).length, total_pendapatan: 0, backup_file_id: '', backup_url: '', integrity_hash: hash, snapshot_json: snap, closed_by: me.nama, closed_at: nowIso_() }]);
  const nr = d.rekor ? rekorImpUlang_() : 0;
  bust_('hasil', 'master'); audit_(me, 'IMPOR_FINAL', 'Arsip', musim);
  return ok_({ rekor: nr }, 'Arsip ' + musim + ' difinalkan dan tampil di Arsip publik' + (nr ? ' (' + nr + ' rekor baru/diperbarui).' : '.'));
}
function hImpHapus_(me, d) {
  const musim = String(d.musim || ''); if (musim === cfg_().musim) err_('Musim berjalan tidak dapat dihapus dari arsip impor.');
  const kol = d.kolam === 'SCM' || d.kolam === 'LCM' ? d.kolam : '', mt = arsipMeta_(), sisa = readT_('TBL_HASIL_ARSIP', true).filter(function (r) { return !(r.musim === musim && (!kol || kolR_(r, mt) === kol)); });
  rewriteT_('TBL_HASIL_ARSIP', sisa);
  if (!sisa.some(function (r) { return r.musim === musim; })) { if (mt[musim]) { delete mt[musim]; cfgSet_(me, { _arsip_meta: JSON.stringify(mt) }); } const logs = readT_('TBL_EVENT_ARCHIVE_LOG', true); rewriteT_('TBL_EVENT_ARCHIVE_LOG', logs.filter(function (a) { return !(a.season_name === musim && !a.backup_file_id); })); }
  const nr = rekorImpUlang_(); audit_(me, 'IMPOR_HAPUS', 'Arsip', musim + (kol ? ' ' + kol : '')); return ok_({ rekor: nr }, 'Data impor ' + musim + (kol ? ' kolam ' + (kol === 'SCM' ? '25 m' : '50 m') : '') + ' dihapus. Rekor dari arsip dihitung ulang (' + nr + ' rekor).');
}
function hPubArsip_(me, d) {
  const musim = String(d.musim || '');
  return ok_(cached_(['hasil', 'atlet'], 'ars_' + musim, 300, function () {
    const rows = arsipNormal_(musim), dok = dokPublik_(musim); if (!rows.length && !dok.length) err_('Arsip musim ini belum tersedia.');
    const grp = {}, imp = readT_('TBL_HASIL_ARSIP').some(function (r) { return r.musim === musim; }); rows.forEach(function (r) { (grp[r.key] = grp[r.key] || []).push(r); });
    const meta = arsipMeta_()[musim] || {}, ord = function (k) { return grp[k].reduce(function (m, r) { return Math.min(m, r.no || 9999); }, 9999); };
    return { musim: musim, dok: dok, sumber: imp ? 'IMPOR' : 'SISTEM', meta: { event: meta.event || '', tanggal: meta.tanggal || '', tglTeks: meta.tanggal ? tglID_(meta.tanggal) : '', lokasi: meta.lokasi || '' }, klas: klasemenRows_(rows), nomor: Object.keys(grp).sort(function (a, b) { return (grp[a][0].kol === grp[b][0].kol ? 0 : grp[a][0].kol === 'LCM' ? -1 : 1) || ord(a) - ord(b) || a.localeCompare(b); }).map(function (k) { const L = grp[k].slice().sort(function (a, b) { return (a.rank || 999) - (b.rank || 999); }); return { key: k, kol: L[0].kol, no: ord(k) < 9999 ? ord(k) : '', jk: L[0].jk, g: L[0].g, event: L[0].d + 'm ' + L[0].s, rows: L.map(function (r) { return { rank: r.rank, nama: r.nama, sk: r.sk, kl: r.kl, kelas: r.kelas, waktu: r.waktu, st: r.st, medal: r.medal, baru: r.baru, cat: r.cat }; }) }; }) };
  }));
}

// ── Galeri: foto per album + tautan Google Drive ──
function hGalUp_(me, d) {
  const f = d.file || {}; if (String(f.mime || '').indexOf('image/') !== 0) err_('Galeri hanya menerima gambar.');
  const blob = cekFile_(f, 'foto'), file = DriveApp.getFolderById(prop_('FOLDER_GALERI')).createFile(blob); bagikan_(file);
  appendT_('TBL_GALERI', [{ galeri_id: uid_('GL'), file_id: file.getId(), caption: String(d.caption || '').slice(0, 120), event_label: String(d.album || '').trim().slice(0, 60) || 'Umum', uploaded_by: me.nama, created_at: nowIso_(), tipe: 'FOTO', url: '' }]);
  bust_('galeri'); audit_(me, 'GALERI_UP', 'Galeri', file.getId()); return ok_(null, 'Foto diunggah.');
}
function hGalLink_(me, d) {
  const url = String(d.url || '').trim();
  if (!/^https:\/\/(drive\.google\.com|docs\.google\.com|photos\.app\.goo\.gl|photos\.google\.com|goo\.gl)\//i.test(url)) err_('Tautan harus berupa tautan Google Drive/Google Foto (https).');
  const cap = String(d.caption || '').trim(); if (cap.length < 3) err_('Judul tautan wajib diisi.');
  appendT_('TBL_GALERI', [{ galeri_id: uid_('GL'), file_id: '', caption: cap.slice(0, 120), event_label: String(d.album || '').trim().slice(0, 60) || 'Umum', uploaded_by: me.nama, created_at: nowIso_(), tipe: 'LINK', url: url.slice(0, 400) }]);
  bust_('galeri'); audit_(me, 'GALERI_LINK', 'Galeri', url); return ok_(null, 'Tautan album ditambahkan.');
}

// ── Logo & kop buku acara / buku hasil ──
function logoList_() { try { return JSON.parse(cfg_().logo_buku_json || '[]'); } catch (e) { return []; } }
function hLogoUp_(me, d) {
  const f = d.file || {}; if (String(f.mime || '').indexOf('image/') !== 0) err_('Logo harus berupa gambar (PNG/JPG).');
  const L = logoList_(); if (L.length >= 12) err_('Maksimal 12 logo.');
  const file = DriveApp.getFolderById(prop_('FOLDER_DOKUMEN')).createFile(cekFile_(f, 'logo'));
  bagikan_(file); L.push({ id: file.getId(), nama: String(d.nama || 'Logo ' + (L.length + 1)).slice(0, 40), acara: 1, hasil: 1, web: 0 }); cfgSet_(me, { logo_buku_json: JSON.stringify(L) }); audit_(me, 'LOGO_TAMBAH', 'Dokumen', file.getId());
  return ok_(L, 'Logo ditambahkan.');
}
function hLogoSet_(me, d) {
  const cur = idx_(logoList_(), 'id'), nl = (Array.isArray(d.list) ? d.list : []).filter(function (x) { return cur[x.id]; }).map(function (x) { return { id: x.id, nama: String(x.nama || cur[x.id].nama).slice(0, 40), acara: x.acara ? 1 : 0, hasil: x.hasil ? 1 : 0, web: x.web ? 1 : 0 }; }), keep = {};
  nl.forEach(function (x) { keep[x.id] = 1; if (x.web) { try { bagikan_(DriveApp.getFileById(x.id)); } catch (e) { } } }); Object.keys(cur).forEach(function (id) { if (!keep[id]) { try { DriveApp.getFileById(id).setTrashed(true); } catch (e) { } } });
  cfgSet_(me, { logo_buku_json: JSON.stringify(nl) }); audit_(me, 'LOGO_ATUR', 'Dokumen', nl.length + ' logo'); return ok_(nl, 'Pengaturan logo disimpan.');
}
function hDokList_() {
  const cfg = cfg_();
  return ok_({ docs: readT_('TBL_DOKUMEN', true).filter(function (x) { return x.musim === cfg.musim; }).reverse().slice(0, 60).map(function (x) { return { id: x.dok_id, jenis: x.jenis, nama: x.nama_file, by: x.dibuat_oleh, at: x.created_at, pub: x.is_publik === 1, fid: x.file_id }; }), logos: logoList_(), kop: { kop1: cfg.kop1, kop2: cfg.kop2, kop3: cfg.kop3, panitia_teks: cfg.panitia_teks, ttd_ketua_nama: cfg.ttd_ketua_nama, ttd_ketua_jabatan: cfg.ttd_ketua_jabatan } });
}
function logosHtml_(jenis) {
  const imgs = logoList_().filter(function (x) { return x[jenis] === 1; }).map(function (x) { return dataUri_(x.id); }).filter(Boolean);
  return imgs.length ? '<table style="width:100%;border:0;margin-bottom:6px"><tr>' + imgs.map(function (u) { return '<td style="border:0;text-align:center"><img src="' + u + '" height="64"></td>'; }).join('') + '</tr></table>' : '';
}
function kopHtml_(jenis) { const c = cfg_(); return logosHtml_(jenis) + '<div style="text-align:center">' + ['kop1', 'kop2', 'kop3'].map(function (k, i) { return c[k] ? '<div style="font-size:' + (i === 0 ? 15 : 11) + 'px;font-weight:' + (i === 0 ? 'bold' : 'normal') + '">' + esc_(c[k]) + '</div>' : ''; }).join('') + '</div><hr style="border:1.5px solid #0A3D62;margin:8px 0">'; }
function docCss_() { return '<style>body{font-family:Arial,Helvetica,sans-serif;color:#0B1F33;font-size:10.5px;margin:18px}.t{border-collapse:collapse;width:100%;margin:2px 0 10px}.t th,.t td{border:1px solid #8aa0b3;padding:3px 6px;text-align:left}.t th{background:#E6F0F7;font-size:9.5px}.ev{background:#0A3D62;color:#fff;padding:6px 10px;font-weight:bold;margin-top:12px}.sub{font-size:9.5px;color:#4A6072;margin:3px 0}.pb{page-break-before:always}.c{text-align:center}h1{font-size:28px;color:#0A3D62;margin:36px 0 6px;text-align:center}.r{text-align:right}</style>'; }
function coverHtml_(judul, jenis) { const c = cfg_(); return '<div class="c" style="padding-top:30px">' + kopHtml_(jenis) + '<h1>' + judul + '</h1><div style="font-size:17px;font-weight:bold">' + esc_(c.app_name) + ' ' + esc_(c.musim) + '</div><div style="margin-top:6px">' + esc_(c.lokasi) + ' • ' + esc_(c.tanggal_teks) + '</div>' + (c.panitia_teks ? '<div class="sub" style="margin-top:30px;white-space:pre-line">' + esc_(c.panitia_teks) + '</div>' : '') + '</div>'; }
function ttdBlok_() { const c = cfg_(); return '<table style="width:100%;border:0;margin-top:30px"><tr><td style="border:0;width:55%"></td><td style="border:0;text-align:center">' + esc_(c.lokasi.split(',')[0]) + ', ' + esc_(c.tanggal_teks) + '<br>' + esc_(c.ttd_ketua_jabatan || 'Ketua Panitia') + '<br><br><br><br><b><u>' + esc_(c.ttd_ketua_nama || '..............................') + '</u></b></td></tr></table>'; }

function logoStrip_(jenis) {
  const imgs = logoList_().filter(function (x) { return x[jenis] === 1; }).map(function (x) { return dataUri_(x.id); }).filter(Boolean);
  return imgs.map(function (u) { return '<img src="' + u + '" height="46" style="margin-left:9px;vertical-align:middle">'; }).join('');
}
// Gaya buku mengikuti contoh MEET PROGRAM / OFFICIAL RESULTS (tabel + gaya inline agar konsisten di konverter PDF Google).
const BK = { ink: '#111111', blue: '#1F3A93', navyPill: '#1C2536', resPill: '#22397F', head: '#EEF3FA', heat: '#EEF2F7', gold: '#FFF7DC', entry: '#4B5B71', line: '#D5DDE6', mono: "'Courier New',Courier,monospace" };
function bukuCss_() { return '<style>@page{size:A4;margin:12mm 10mm}body{font-family:Arial,Helvetica,sans-serif;color:' + BK.ink + ';font-size:10.5px;margin:0}table{border-collapse:collapse}.pb{page-break-before:always}.c{text-align:center}h1{font-size:28px;color:#0A3D62;margin:36px 0 6px;text-align:center}.sub{font-size:9.5px;color:#4A6072;margin:3px 0}.t{width:100%;margin:2px 0 10px}.t th,.t td{border:1px solid #8aa0b3;padding:3px 6px;text-align:left}.t th{background:#E6F0F7;font-size:9.5px}</style>'; }
function bukuHead_(label, jenis) {
  const c = cfg_();
  return '<table style="width:100%;margin:0 0 8px 0"><tr><td style="vertical-align:top;padding:0">' +
    '<span style="background:#EDF0F4;color:#4A5565;font-weight:bold;font-size:10.5px;letter-spacing:1px;padding:3px 9px">' + label + '</span>' +
    '<div style="font-size:17px;font-weight:bold;color:' + BK.ink + ';margin-top:7px;line-height:1.15">' + esc_(String(c.app_name).toUpperCase()) + '</div>' +
    (c.buku_subjudul ? '<div style="font-size:17px;font-weight:bold;color:' + BK.blue + ';line-height:1.15">' + esc_(String(c.buku_subjudul).toUpperCase()) + '</div>' : '') +
    '<div style="font-size:9.5px;font-weight:bold;color:' + BK.ink + ';margin-top:3px">Waktu: ' + esc_(c.tanggal_teks) + ' | Tempat: ' + esc_(c.lokasi) + '</div></td>' +
    '<td style="text-align:right;vertical-align:middle;padding:0;white-space:nowrap">' + logoStrip_(jenis) + '</td></tr></table>' +
    '<div style="border-top:2.5px solid ' + BK.ink + ';margin:0 0 4px 0;height:0"></div>';
}
function jenLabel_(kode, nama) { const h = hurufKel_(kode), md = cfg_().label_kelompok || 'KELAS'; nama = nama || (readM_('TBL_MASTER_JENJANG').filter(function (j) { return j.kode_jenjang === kode; })[0] || {}).nama_jenjang || kode || ''; if (!h || md === 'KELAS') return nama; return md === 'HURUF' ? 'Kelompok ' + h : 'Kelompok ' + h + ' (' + nama + ')'; }
function evJudulBuku_(e, jen) { return esc_([String(e.event_name || '').toUpperCase(), jenLabel_(e.jenjang_kode, (jen[e.jenjang_kode] || {}).nama_jenjang).toUpperCase(), e.gender || ''].filter(Boolean).join(' ')); }
function jamPlus_(hhmm, m) { const q = String(hhmm || '').split(':'); if (q.length < 2) return ''; const t = Number(q[0]) * 60 + Number(q[1]) + Math.round(m); return ('0' + Math.floor(t / 60) % 24).slice(-2) + ':' + ('0' + t % 60).slice(-2); }
function evBar_(e, jen, hasil, jamTxt) {
  return '<table style="width:100%;margin:14px 0 0 0"><tr>' + (e.event_no !== '' ? '<td style="width:1%;white-space:nowrap;padding:0 10px 4px 0;vertical-align:bottom"><span style="background:' + (hasil ? BK.resPill : BK.navyPill) + ';color:#fff;font-weight:bold;font-size:11px;padding:4px 10px;letter-spacing:.3px">EVENT ' + e.event_no + '</span></td>' : '') +
    '<td style="padding:0 0 4px 0;vertical-align:bottom;font-weight:bold;font-size:13.5px;color:' + BK.ink + '"><u>' + evJudulBuku_(e, jen) + '</u></td>' + (jamTxt ? '<td style="text-align:right;white-space:nowrap;padding:0 0 4px 8px;vertical-align:bottom;font-size:10px;font-weight:bold;color:' + BK.entry + '">' + jamTxt + '</td>' : '') + '</tr></table>';
}
function th_(t, w, al, bg) { return '<th style="' + (w ? 'width:' + w + ';' : '') + 'text-align:' + (al || 'left') + ';background:' + (bg || BK.head) + ';border-top:2px solid ' + BK.ink + ';border-bottom:1px solid ' + BK.line + ';padding:5px 6px;font-size:10.5px;font-weight:bold;color:' + BK.ink + '">' + t + '</th>'; }
function td_(t, st) { return '<td style="padding:4px 6px;line-height:1.3;vertical-align:middle;font-size:10.5px;' + (st || '') + '">' + t + '</td>'; }
function sekolahTxt_(a) { return esc_(String(a.sekolah_nama || '').toUpperCase()); } // buku: nama sekolah saja (antar pelajar); klub hanya di database
function asalTxt_(a) { return esc_([a.sekolah_nama, a.klub_nama].filter(Boolean).join(' / ').toUpperCase()); }
function klsTxt_(a) { return a.kelas_num === 0 ? 'TK' : esc_(a.kelas_num); }
function namaTxt_(a) { return esc_(String(a.nama_lengkap || '').toUpperCase()); }
// ── Halaman buku: kop di SETIAP halaman, halaman diisi penuh, satu heat tidak pernah terpisah halaman ──
// Konverter PDF Google memakai A4 dan menghormati @page margin; tinggi baris diperkirakan dari isi (teks panjang turun baris).
// Tiap halaman = satu tabel dengan <thead> berisi kop (cadangan bila perkiraan meleset: renderer tetap mengulang kop).
// Satuan yang tidak boleh terpisah: buku acara = satu heat (judul heat + semua lintasan); buku hasil = satu baris (baris terakhir menempel dengan tanda tangan wasit).
// Nomor yang berlanjut ke halaman berikutnya diberi judul "(LANJUTAN)" + judul kolom.
const BK_PG = { tinggi: 1020, kop: 86, bar: 34, kolom: 24, heat: 24, baris: 22, garis: 13, ttd: 64, lebar: 718 };
function bkTinggi_() { return { LONGGAR: 940, RAPAT: 1030 }[cfg_().buku_isi] || BK_PG.tinggi; }
function bkBarisH_(cells) { // cells: [[teks, lebarPersen], ...] → tinggi baris (teks panjang turun baris)
  let n = 1; cells.forEach(function (c) { const w = BK_PG.lebar * c[1] / 100 - 12, per = Math.max(4, Math.floor(w / 7.3)); n = Math.max(n, Math.ceil(String(c[0] || '').length / per) || 1); });
  return BK_PG.baris + (n - 1) * BK_PG.garis;
}
// bloks: [{ ev, head: [{h, html}], units: [{h, html}] }]
function bkHalaman_(bloks, o) {
  const pages = []; let cur = [], used = 0; const L = bkTinggi_() - BK_PG.kop;
  const baru = function () { if (cur.length) pages.push(cur); cur = []; used = 0; };
  const push = function (it) { cur.push(it.html); used += it.h; };
  bloks.forEach(function (bk) {
    const hh = bk.head.reduce(function (s, x) { return s + x.h; }, 0);
    if (used && used + hh + (bk.units[0] ? bk.units[0].h : 0) > L) baru(); // judul nomor tidak boleh sendirian di bawah halaman
    bk.head.forEach(push);
    bk.units.forEach(function (u, i) {
      if (used + u.h > L && i > 0) { baru(); push({ h: BK_PG.bar, html: o.lanjut(bk.ev) }); push({ h: BK_PG.kolom, html: o.kolom(bk.ev) }); }
      push(u);
    });
  });
  baru(); return pages;
}
function bkTabel_(kop, ncol, rows, pb) {
  return '<table style="width:100%;border-collapse:collapse' + (pb ? ';page-break-before:always' : '') + '"><thead style="display:table-header-group"><tr><td colspan="' + ncol + '" style="padding:0">' + kop + '</td></tr></thead>' + rows.join('') + '</table>';
}
function bkSel_(ncol, html) { return '<tr style="page-break-inside:avoid"><td colspan="' + ncol + '" style="padding:0">' + html + '</td></tr>'; }
function bkGrup_(rows) { return '<tbody style="page-break-inside:avoid">' + rows.join('') + '</tbody>'; } // satu satuan tak terpisah
function htmlBukuAcara_(hari) {
  const D = docData_(), c = D.cfg, ls = {}; let body = '', first = true;
  D.evs.forEach(function (e) { if (hari && e.hari !== hari) return; if (!D.seeds.some(function (s) { return s.event_id === e.event_id; })) return; (ls[e.hari] = ls[e.hari] || []).push(e); });
  if (!hari && c.buku_cover === '1') body += coverHtml_('BUKU ACARA', 'acara');
  const hk = Object.keys(ls).sort(function (a, b) { return a - b; }), W = [7, 33, 6, 30, 15, 9];
  const kolom = function () { return bkGrup_(['<tr>' + th_('LANE', W[0] + '%', 'center', '#FFFFFF') + th_('NAMA ATLET', W[1] + '%', '', '#FFFFFF') + th_('KLS', W[2] + '%', 'center', '#FFFFFF') + th_('ASAL SEKOLAH', W[3] + '%', '', '#FFFFFF') + th_('ASAL WILAYAH', W[4] + '%', '', '#FFFFFF') + th_('ENTRY', W[5] + '%', 'center', '#FFFFFF') + '</tr>']); };
  const heatTr = function (n, hj) { return '<tr><td colspan="5" style="background:' + BK.heat + ';font-weight:bold;font-size:10.5px;padding:4px 6px;border-bottom:1px solid ' + BK.line + '">HEAT ' + n + '</td><td style="background:' + BK.heat + ';text-align:center;font-weight:bold;font-size:9.5px;color:' + BK.entry + ';padding:4px 6px;border-bottom:1px solid ' + BK.line + '">' + (hj ? '± ' + hj : '') + '</td></tr>'; };
  hk.forEach(function (h) {
    const kop = bukuHead_('MEET PROGRAM' + (hk.length > 1 || hari ? ' — HARI ' + h : ''), 'acara');
    const bloks = ls[h].map(function (e) {
      const hs = {}; D.seeds.filter(function (s) { return s.event_id === e.event_id; }).forEach(function (s) { (hs[s.heat_number] = hs[s.heat_number] || []).push(s); });
      const hn = Object.keys(hs).map(Number).sort(function (a, b) { return a - b; }), jam = e.jam ? 'ESTIMASI ' + esc_(e.jam) + (e.jamS ? ' – ' + esc_(e.jamS) : '') + ' WIB' : '';
      const units = hn.map(function (n) {
        const hj = e.jam ? jamPlus_(e.jam, (n - hn[0]) * (e.mnHeat || 0)) : ''; let tg = BK_PG.heat; const tr = [heatTr(n, hj)];
        hs[n].sort(function (a, b) { return a.lane_number - b.lane_number; }).forEach(function (s) {
          const a = D.atl[s.atlet_id] || {}, nm = namaTxt_(a), sk = sekolahTxt_(a), kt = esc_(String(a.kota_asal || '').toUpperCase());
          tg += bkBarisH_([[nm, W[1]], [sk, W[3]], [kt, W[4]]]);
          tr.push('<tr>' + td_(s.lane_number, 'text-align:center;font-weight:bold') + td_(nm, 'font-weight:bold') + td_(klsTxt_(a), 'text-align:center') + td_(sk) + td_(kt) + td_(esc_(s.entry_seed_time || 'NT'), 'text-align:center;font-weight:bold;color:' + BK.entry + ';font-family:' + BK.mono) + '</tr>');
        });
        return { h: tg, html: bkGrup_(tr) };
      });
      return { ev: e, head: [{ h: BK_PG.bar, html: bkGrup_([bkSel_(6, evBar_(e, D.jen, false, jam))]) }, { h: BK_PG.kolom, html: kolom() }], units: units };
    });
    bkHalaman_(bloks, { lanjut: function (e) { return bkGrup_([bkSel_(6, evBar_(e, D.jen, false, '(LANJUTAN)'))]); }, kolom: kolom }).forEach(function (pg) {
      body += bkTabel_(kop, 6, pg, !(first && c.buku_cover !== '1')); first = false;
    });
  });
  if (!hk.length) body += bukuHead_('MEET PROGRAM', 'acara') + '<p>Belum ada start list.</p>';
  return '<html><head><meta charset="utf-8">' + bukuCss_() + '</head><body>' + body + '</body></html>';
}
function htmlResultBook_() {
  const D = docData_(), c = D.cfg, so = idx_(readT_('TBL_WASIT_SIGNOFF').filter(function (s) { return s.musim === c.musim && s.is_locked === 1; }), 'event_id'), k = hitungKlasemen_(c.musim);
  let body = c.buku_cover === '1' ? coverHtml_('BUKU HASIL', 'hasil') : '';
  const W = [6, 29, 5, 28, 16, 10, 6], kop = bukuHead_('OFFICIAL RESULTS', 'hasil');
  const kolom = function () { return bkGrup_(['<tr>' + th_('RANK', W[0] + '%', 'center') + th_('NAMA ATLET', W[1] + '%') + th_('KLS', W[2] + '%', 'center') + th_('ASAL SEKOLAH', W[3] + '%') + th_('ASAL WILAYAH', W[4] + '%') + th_('WAKTU', W[5] + '%', 'center') + th_('KET', W[6] + '%', 'center') + '</tr>']); };
  const bloks = [];
  D.evs.forEach(function (e) {
    const rs = D.res.filter(function (r) { return r.event_id === e.event_id && r.status_pengesahan === 'SAH'; }); if (!rs.length) return;
    rs.sort(function (a, b) { const ao = a.status_lomba === 'OK' && a.rank_event > 0, bo = b.status_lomba === 'OK' && b.rank_event > 0; return (bo - ao) || (a.rank_event || 999) - (b.rank_event || 999) || a.lane_number - b.lane_number; });
    const s = so[e.event_id], tt = s && s.ttd_file_id ? dataUri_(s.ttd_file_id) : '';
    const units = rs.map(function (r) {
      const a = D.atl[r.atlet_id] || {}, ok = r.status_lomba === 'OK' && r.rank_event > 0, top = ok && r.rank_event <= 3, bg = top ? 'background:' + BK.gold + ';' : '', nm = namaTxt_(a), sk = sekolahTxt_(a), kt = esc_(String(a.kota_asal || '').toUpperCase());
      return { h: bkBarisH_([[nm, W[1]], [sk, W[3]], [kt, W[4]]]), tr: '<tr>' + td_(ok ? r.rank_event : '-', bg + 'text-align:center;font-weight:bold') + td_(nm, bg + 'font-weight:bold') + td_(klsTxt_(a), bg + 'text-align:center') + td_(sk, bg) + td_(kt, bg) +
        td_(esc_(r.status_lomba === 'OK' ? r.final_time : r.status_lomba), bg + 'text-align:center;font-weight:bold;color:' + BK.blue + ';font-family:' + BK.mono) + td_(esc_((r.is_new_record ? 'REKOR' : '') + (r.dq_code ? ' ' + r.dq_code : '')), bg + 'text-align:center;font-size:9px') + '</tr>' };
    });
    if (s) { const u = units[units.length - 1]; u.h += BK_PG.ttd; u.tr += bkSel_(7, '<table style="width:100%;margin:2px 0 0 0"><tr><td style="padding:0"></td><td style="width:180px;padding:6px 0 2px 0;border-top:1.5px solid ' + BK.line + ';border-right:1px solid ' + BK.line + ';text-align:center;height:52px">' + (tt ? '<img src="' + tt + '" height="48">' : '') + '</td></tr></table>'); }
    bloks.push({ ev: e, head: [{ h: BK_PG.bar, html: bkGrup_([bkSel_(7, evBar_(e, D.jen, true))]) }, { h: BK_PG.kolom, html: kolom() }], units: units.map(function (u) { return { h: u.h, html: bkGrup_([u.tr]) }; }) });
  });
  if (bloks.length) bkHalaman_(bloks, { lanjut: function (e) { return bkGrup_([bkSel_(7, evBar_(e, D.jen, true, '(LANJUTAN)'))]); }, kolom: kolom }).forEach(function (pg, i) { body += bkTabel_(kop, 7, pg, i > 0 || c.buku_cover === '1'); });
  else body += bukuHead_('OFFICIAL RESULTS', 'hasil') + '<p>Belum ada hasil yang disahkan.</p>';
  const tb = function (L) { return '<table style="width:100%;margin:0 0 6px 0"><tr>' + th_('#', '7%', 'center') + th_('NAMA', '45%') + th_('EMAS', '12%', 'center') + th_('PERAK', '12%', 'center') + th_('PERUNGGU', '12%', 'center') + th_('POIN', '12%', 'center') + '</tr>' + L.slice(0, 15).map(function (x, i) { const bg = i < 3 ? 'background:' + BK.gold + ';' : ''; return '<tr>' + td_(i + 1, bg + 'text-align:center;font-weight:bold') + td_(esc_(String(x.nama).toUpperCase()), bg + 'font-weight:bold') + td_(x.e, bg + 'text-align:center') + td_(x.p, bg + 'text-align:center') + td_(x.b, bg + 'text-align:center') + td_(x.poin, bg + 'text-align:center;font-weight:bold;color:' + BK.blue) + '</tr>'; }).join('') + '</table>'; };
  if (k.sekolah.length) body += '<div class="pb">' + bukuHead_('KLASEMEN MEDALI', 'hasil') + evBar_({ event_no: '', event_name: 'KLASEMEN SEKOLAH' }, {}, true) + tb(k.sekolah) + ttdBlok_() + '</div>';
  return '<html><head><meta charset="utf-8">' + bukuCss_() + '</head><body>' + body + '</body></html>';
}

// ── Ekspor Excel: peserta, nomor diikuti, pemenang, rekap ──
function hExpData_(me, d) {
  const cfg = cfg_(), musim = String(d.musim || cfg.musim), link = function (id) { return id ? 'https://drive.google.com/file/d/' + id + '/view' : ''; };
  const atl = idx_(readT_('TBL_ATLET'), 'atlet_id'), kont = idx_(readT_('TBL_KONTINGEN'), 'kontingen_id'), evs = idx_(readM_('TBL_MASTER_NOMOR_LOMBA'), 'event_id'), jen = idx_(readM_('TBL_MASTER_JENJANG'), 'kode_jenjang');
  const ents = readT_('TBL_REGISTRASI_ENTRI').filter(function (e) { return e.musim === musim; }), by = {}; ents.forEach(function (e) { (by[e.atlet_id] = by[e.atlet_id] || []).push(e); });
  const peserta = [], nomor = [];
  Object.keys(by).forEach(function (id) {
    const a = atl[id]; if (!a) return; const k = kont[a.kontingen_id] || {}, es = by[id], bayar = (es.filter(function (e) { return e.bukti_bayar_file_id; })[0] || {}).bukti_bayar_file_id || '';
    peserta.push({ 'BIB': a.bib, 'Nama Lengkap': a.nama_lengkap, 'NISN': a.nisn, 'Jenis Kelamin': a.jenis_kelamin, 'Tempat Lahir': a.tempat_lahir, 'Tanggal Lahir': a.tanggal_lahir, 'Usia': usia_(a.tanggal_lahir), 'Kelas': kelasLabel_(a.kelas_num), 'Kelompok': (jen[a.jenjang_kode] || {}).nama_jenjang || a.jenjang_kode, 'Sekolah': a.sekolah_nama, 'Klub': a.klub_nama, 'Wilayah Sekolah (Kab/Kota)': a.kota_asal, 'Provinsi': a.provinsi_asal, 'No. HP': a.hp_kontak, 'Jenis Akun': k.tipe_lembaga, 'Akun Pendaftar': k.nama_lembaga, 'Penanggung Jawab': k.pj_nama, 'Email PJ': k.pj_email, 'Telp PJ': k.pj_telepon, 'Jumlah Nomor': es.length, 'Total Biaya': es.reduce(function (s, e) { return s + e.nominal_biaya; }, 0), 'Status': aggStatus_(es), 'Link Foto': link(a.foto_file_id), 'Link Akte': link(a.akta_file_id), 'Link Surat Sekolah': link(a.surat_file_id), 'Link Bukti Follow': link(a.sosmed_file_id), 'Link Bukti Bayar': link(bayar), 'Link Surat Mandat': link(k.mandat_file_id) });
    es.forEach(function (e) { const ev = evs[e.event_id] || {}; nomor.push({ 'BIB': a.bib, 'Nama': a.nama_lengkap, 'No. Acara': ev.event_no, 'Nomor': ev.event_name, 'Gender': ev.gender, 'Kelompok': (jen[ev.jenjang_kode] || {}).nama_jenjang || ev.jenjang_kode, 'Seed Time': e.seed_time_entry || 'NT', 'Verifikasi': e.status_verifikasi, 'Pembayaran': e.status_bayar, 'Biaya': e.nominal_biaya }); });
  });
  const pemenang = arsipNormal_(musim).filter(function (r) { return r.medal; }).sort(function (a, b) { return String(a.key).localeCompare(String(b.key)) || a.rank - b.rank; }).map(function (r) { return { 'Musim': musim, 'Nomor': r.d + 'm ' + r.s, 'Kelompok': (jen[r.jk] || {}).nama_jenjang || r.jk, 'Gender': r.g, 'Peringkat': r.rank, 'Medali': r.medal, 'Nama': r.nama, 'Sekolah': r.sk, 'Klub': r.kl, 'Waktu': r.waktu, 'Rekor Baru': r.baru ? 'YA' : '' }; });
  const rk = rekapPendaftar_(true);
  audit_(me, 'EKSPOR_DATA', 'Laporan', musim + ' • ' + peserta.length + ' peserta');
  const akun = hAkunList_().data.map(function (k) { return { 'Jenis Akun': k.tipe, 'Nama': k.nama, 'NPSN / Kode': k.kode, 'Kab/Kota': k.kota, 'Provinsi': k.prov, 'Alamat': k.alamat, 'Penanggung Jawab': k.pj, 'Jabatan': k.jab, 'Telepon': k.telp, 'Email': k.email, 'Jumlah Atlet': k.atlet, 'Link Surat Mandat': link(k.mandat), 'Terdaftar': k.at }; });
  return ok_({ musim: musim, akun: akun, peserta: peserta, nomor: nomor, pemenang: pemenang, rekapKelompok: rk.kelompok.map(function (k) { return { 'Kelompok': k.nama, 'Putra': k.putra, 'Putri': k.putri, 'Total Atlet': k.total, 'Entri Putra': k.entriPutra, 'Entri Putri': k.entriPutri }; }), rekapNomor: rk.nomor.map(function (n) { return { 'No. Acara': n.no, 'Nomor': n.nama, 'Gender': n.g, 'Kelompok': (jen[n.jk] || {}).nama_jenjang || n.jk, 'Pendaftar': n.n, 'Kurang dari minimum': n.kurang ? 'YA' : '' }; }) });
}

// ============================================================
// SETUP OTOMATIS, ROLLOVER JULI, DATA CONTOH, ROUTES
// ============================================================
function hAkunList_() {
  const cfg = cfg_(), nA = {}, nE = {};
  readT_('TBL_ATLET').forEach(function (a) { if (a.status_atlet === 'ACTIVE') nA[a.kontingen_id] = (nA[a.kontingen_id] || 0) + 1; });
  readT_('TBL_REGISTRASI_ENTRI').forEach(function (e) { if (e.musim === cfg.musim) nE[e.kontingen_id] = (nE[e.kontingen_id] || 0) + 1; });
  return ok_(readT_('TBL_KONTINGEN').map(function (k) { return { id: k.kontingen_id, tipe: k.tipe_lembaga, nama: k.nama_lembaga, kode: k.npsn_or_sk, kota: k.kota_kabupaten, prov: k.provinsi, alamat: k.alamat, pj: k.pj_nama, jab: k.pj_jabatan, telp: k.pj_telepon, email: k.pj_email, mandat: k.mandat_file_id, st: k.status_akun, at: k.created_at, atlet: nA[k.kontingen_id] || 0, entri: nE[k.kontingen_id] || 0 }; }).reverse());
}
function hAkunDetail_(me, d) {
  const cfg = cfg_(), k = readT_('TBL_KONTINGEN').filter(function (x) { return x.kontingen_id === String(d.id || ''); })[0]; if (!k) err_('Akun tidak ditemukan.');
  const evs = idx_(readM_('TBL_MASTER_NOMOR_LOMBA'), 'event_id'), by = entsByAtlet_(cfg.musim);
  const atlet = readT_('TBL_ATLET').filter(function (a) { return a.kontingen_id === k.kontingen_id && a.status_atlet === 'ACTIVE'; }).map(function (a) {
    const es = by[a.atlet_id] || [];
    return { id: a.atlet_id, nama: a.nama_lengkap, bib: a.bib, nisn: a.nisn, g: a.jenis_kelamin, tmp: a.tempat_lahir, tgl: a.tanggal_lahir, kelas: a.kelas_num, jk: a.jenjang_kode, sk: a.sekolah_nama, kl: a.klub_nama, wl: a.kota_asal, prov: a.provinsi_asal, hp: a.hp_kontak, foto: a.foto_file_id, akta: a.akta_file_id, surat: a.surat_file_id, sosmed: a.sosmed_file_id, st: aggStatus_(es),
      ent: es.map(function (e) { const ev = evs[e.event_id] || {}; return { id: e.entry_id, eid: e.event_id, no: ev.event_no, nama: ev.event_name, v: e.status_verifikasi, b: e.status_bayar, bukti: e.bukti_bayar_file_id, fee: e.nominal_biaya }; }) };
  });
  audit_(me, 'AKUN_LIHAT', 'Kontingen', k.kontingen_id);
  return ok_({ akun: { st: k.status_akun, id: k.kontingen_id, tipe: k.tipe_lembaga, nama: k.nama_lembaga, kode: k.npsn_or_sk, kota: k.kota_kabupaten, prov: k.provinsi, alamat: k.alamat, pj: k.pj_nama, jab: k.pj_jabatan, telp: k.pj_telepon, email: k.pj_email, mandat: k.mandat_file_id, at: k.created_at }, atlet: atlet });
}
function hJdGet_() { const c = cfg_(); let batal = []; try { batal = jdBatal_(); } catch (e) { } return ok_({ rows: jadwal_(), batal: batal, minp: Number(c.min_peserta) || 0, fase: c.fase || 'PENDAFTARAN', kunciNo: FASE.indexOf(c.fase || 'PENDAFTARAN') >= FASE.indexOf('BUKU_ACARA'), cfg: { mulai: c.jadwal_mulai, jeda: c.jadwal_jeda, menit: c.menit_heat_json, lintasan: c.jumlah_lintasan } }); }
function hJdSet_(me, d) {
  const c = cfg_(); let man = {}; try { man = JSON.parse(c.jadwal_manual_json || '{}') || {}; } catch (e) { }
  if (d.resetAll) man = {};
  else if (d.cfg) {
    const o = {}; if (d.cfg.mulai !== undefined) { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(d.cfg.mulai)) err_('Jam mulai harus format HH:MM.'); o.jadwal_mulai = d.cfg.mulai; }
    if (d.cfg.jeda !== undefined) { if (!/^\d{1,3}$/.test(String(d.cfg.jeda))) err_('Jeda harus angka menit.'); o.jadwal_jeda = String(d.cfg.jeda); }
    if (d.cfg.menit !== undefined) { try { const j = JSON.parse(d.cfg.menit); if (!j || Array.isArray(j) || typeof j !== 'object') throw 0; o.menit_heat_json = JSON.stringify(j); } catch (e) { err_('Format menit per seri tidak valid.'); } }
    cfgSet_(me, o);
  } else {
    const id = String(d.eid || ''); if (!id) err_('Nomor tidak dikenal.');
    if (d.reset) delete man[id];
    else { const x = man[id] || {}; if (d.jam !== undefined) { if (d.jam && !/^([01]\d|2[0-3]):[0-5]\d$/.test(d.jam)) err_('Jam harus format HH:MM.'); x.jam = d.jam || ''; } if (d.hari !== undefined) x.hari = Math.max(1, Math.min(9, toInt_(d.hari, 1))); if (d.urut !== undefined) x.urut = d.urut === '' ? '' : toInt_(d.urut, 0); man[id] = x; }
  }
  cfgSet_(me, { jadwal_manual_json: JSON.stringify(man) }); delete _MEMO.__jd; audit_(me, 'JADWAL_ATUR', 'Jadwal', d.eid || (d.cfg ? 'pengaturan' : 'reset')); bust_('master');
  return hJdGet_();
}
function ensureSheet_(ss, name) {
  const sk = SKEMA[name]; let s = ss.getSheetByName(name); if (!s) s = ss.insertSheet(name);
  const nc = sk.cols.length; if (s.getMaxColumns() < nc) s.insertColumnsAfter(s.getMaxColumns(), nc - s.getMaxColumns());
  s.getRange(1, 1, 1, nc).setValues([sk.cols]).setFontWeight('bold').setBackground('#0A3D62').setFontColor('#ffffff'); s.setFrozenRows(1);
  const mr = s.getMaxRows(); if (mr > 1) s.getRange(2, 1, mr - 1, nc).setNumberFormats(fmtOf_(sk, mr - 1));
  return s;
}
function setupRahasia_() {
  secret_();
  if (!prop_('EMERGENCY_PASS_HASH')) {
    const sandi = sandiAcak_(16), salt = Utilities.getUuid();
    setProps_({ EMERGENCY_USER: 'darurat', EMERGENCY_SALT: salt, EMERGENCY_PASS_HASH: hashPass_(sandi, salt) });
    Logger.log('🔐 AKSES DARURAT (catat sekarang — tampil sekali, rotasi setelah login pertama)\n   Tab "Panitia" → Email: darurat | Kata sandi: ' + sandi);
  }
}
function resetAksesDarurat() { const p = sandiAcak_(16), salt = Utilities.getUuid(); setProps_({ EMERGENCY_USER: 'darurat', EMERGENCY_SALT: salt, EMERGENCY_PASS_HASH: hashPass_(p, salt) }); revokeAll_('darurat'); Logger.log('🔐 Akses darurat baru → darurat / ' + p); }
function rotasiSecretSesi() { setProp_('SESSION_SECRET', acak_(64)); Logger.log('✅ SESSION_SECRET dirotasi — semua sesi berakhir.'); }

function setupAppEnvironment() {
  let root = null; const ex = prop_('DRIVE_ROOT_FOLDER_ID');
  if (ex) { try { root = DriveApp.getFolderById(ex); } catch (e) { root = null; } }
  if (!root) { const it = DriveApp.getFoldersByName(FOLDER_NAME); root = it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME); }
  const sub = function (n) { const it = root.getFoldersByName(n); return it.hasNext() ? it.next() : root.createFolder(n); };
  const fb = sub('Berkas_Kontingen'), fd = sub('Dokumen_Resmi'), fg = sub('Galeri'), fa = sub('Arsip');
  let ss = null; const sid = prop_('SPREADSHEET_ID');
  if (sid) { try { ss = SpreadsheetApp.openById(sid); } catch (e) { ss = null; } }
  if (!ss) { const it = root.getFilesByName(SS_NAME); if (it.hasNext()) ss = SpreadsheetApp.open(it.next()); else { ss = SpreadsheetApp.create(SS_NAME); DriveApp.getFileById(ss.getId()).moveTo(root); } }
  setProps_({ SPREADSHEET_ID: ss.getId(), DRIVE_ROOT_FOLDER_ID: root.getId(), FOLDER_BERKAS: fb.getId(), FOLDER_DOKUMEN: fd.getId(), FOLDER_GALERI: fg.getId(), FOLDER_ARSIP: fa.getId() });
  ss.setSpreadsheetTimeZone(TZ); Object.keys(SKEMA).forEach(function (n) { ensureSheet_(ss, n); });
  const d = ss.getSheetByName('Sheet1'); if (d && ss.getSheets().length > 1) ss.deleteSheet(d);
  _SS = ss; _MEMO = {};
  if (!readT_('TBL_MASTER_JENJANG', true).length) appendT_('TBL_MASTER_JENJANG', [['TK', 'TK', 0, 0], ['SD_1_2', 'SD Kelas 1-2', 1, 2], ['SD_3_4', 'SD Kelas 3-4', 3, 4], ['SD_5_6', 'SD Kelas 5-6', 5, 6], ['SMP_7', 'SMP Kelas 7', 7, 7], ['SMP_8_9', 'SMP Kelas 8-9', 8, 9], ['SMA_10_12', 'SMA Kelas 10-12', 10, 12]].map(function (j, i) { return { jenjang_id: 'J' + (i + 1), kode_jenjang: j[0], nama_jenjang: j[1], kelas_min: j[2], kelas_max: j[3], urutan: i + 1 }; }));
  if (!readT_('TBL_MASTER_NOMOR_LOMBA', true).length) appendT_('TBL_MASTER_NOMOR_LOMBA', defaultEvents_());
  if (!readT_('TBL_PORTAL_CONFIG', true).length) appendT_('TBL_PORTAL_CONFIG', Object.keys(CFG_DEFAULT).map(function (k) { return { config_key: k, config_value: CFG_DEFAULT[k], updated_by: 'setup', updated_at: nowIso_() }; }));
  const us = readT_('TBL_USERS_ROLES', true);
  if (!us.some(function (u) { return u.role === R.SA; })) {
    let em = ''; try { em = Session.getEffectiveUser().getEmail() || Session.getActiveUser().getEmail(); } catch (e) { }
    if (em) { const pw = sandiAcak_(12), salt = Utilities.getUuid(); appendT_('TBL_USERS_ROLES', [{ user_id: uid_('U'), full_name: 'Super Admin', email: em.toLowerCase(), role: R.SA, pass_hash: hashPass_(pw, salt), pass_salt: salt, license_number: '', status: 'ACTIVE', last_login: '', created_at: nowIso_() }]); Logger.log('👤 SUPER ADMIN (catat sekarang, ganti setelah login)\n   Tab "Panitia" → Email: ' + em + ' | Kata sandi: ' + pw); }
    else Logger.log('⚠️ Email pemilik tidak terbaca. Masuk memakai akses darurat lalu buat Super Admin di Pengaturan → Pengguna.');
  }
  setupRahasia_(); pasangTrigger(); bust_('master', 'atlet', 'hasil', 'user', 'galeri');
  Logger.log('✅ Setup selesai (KRP Pro v' + APP_VERSION + ').\n📊 Spreadsheet: ' + ss.getUrl() + '\n📁 Folder: ' + root.getUrl() + '\n➡️  Lanjut: Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone). Salin URL /exec ke js/config.js di frontend.');
  return ok_({ spreadsheet: ss.getUrl(), folder: root.getUrl() }, 'Setup selesai');
}

// ── Kenaikan kelas otomatis tiap 1 Juli ──
function pasangTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (['rolloverOtomatis_', 'pemanasan_'].indexOf(t.getHandlerFunction()) >= 0) ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('rolloverOtomatis_').timeBased().onMonthDay(1).atHour(2).create();
  ScriptApp.newTrigger('pemanasan_').timeBased().everyMinutes(10).create(); // cache publik selalu hangat (lihat Api.gs)
}
function rolloverCore_(force) {
  const cfg = cfg_(), th = String(new Date().getFullYear());
  if (!force && cfg.rollover_tahun === th) return { skip: true, n: 0 };
  const atl = readT_('TBL_ATLET', true).filter(function (a) { return a.status_atlet === 'ACTIVE'; });
  atl.forEach(function (a) { if (a.kelas_num >= 12) a.status_atlet = 'ALUMNI'; else { a.kelas_num++; const jk = jenjangOfAll_(a.kelas_num); if (jk) a.jenjang_kode = jk; } });
  saveRows_('TBL_ATLET', atl); cfgSet_(null, { rollover_tahun: th }); bust_('atlet', 'hasil'); return { skip: false, n: atl.length };
}
function rolloverOtomatis_() {
  if (new Date().getMonth() !== 6) return;
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try { const r = rolloverCore_(false); console.log('Rollover kelas: ' + JSON.stringify(r)); } finally { lock.releaseLock(); }
}
function hRollover_(me) { const r = rolloverCore_(false); audit_(me, 'ROLLOVER', 'Atlet', r.n + ' atlet'); return ok_(r, r.skip ? 'Rollover tahun ini sudah dijalankan.' : 'Kenaikan kelas selesai untuk ' + r.n + ' atlet.'); }

// ── Data contoh (opsional) — semua ID berawalan DEMO- agar mudah dihapus ──
function isiDataContoh() {
  _SS = null; _MEMO = {}; const cfg = cfg_(), t = nowIso_(), pw = sandiAcak_(12), salt = Utilities.getUuid(), hash = hashPass_(pw, salt);
  if (readT_('TBL_KONTINGEN', true).some(function (k) { return k.kontingen_id.indexOf('DEMO-') === 0; })) { Logger.log('Data contoh sudah ada. Jalankan hapusDataContoh() dulu.'); return; }
  const ko = [['SEKOLAH', 'SMPN 1 Contoh', '90000001', 'Kota Semarang'], ['SEKOLAH', 'SMA Bangsa Contoh', '90000002', 'Kota Surakarta'], ['KLUB', 'Klub Tirta Jaya', 'SK-DEMO-01', 'Kota Semarang'], ['SEKOLAH', 'SDN Harapan 3', '90000003', 'Kab. Kudus']];
  appendT_('TBL_KONTINGEN', ko.map(function (k, i) { return { kontingen_id: 'DEMO-K' + (i + 1), tipe_lembaga: k[0], nama_lembaga: k[1], npsn_or_sk: k[2], provinsi: 'Jawa Tengah', kota_kabupaten: k[3], alamat: 'Alamat contoh', jenjang_utama: '', pj_nama: 'Pelatih Contoh ' + (i + 1), pj_jabatan: 'Guru PJOK', pj_telepon: '0812000000' + i, pj_email: 'demo' + (i + 1) + '@contoh.test', pass_hash: hash, pass_salt: salt, drive_folder_id: '', mandat_file_id: '', status_akun: 'ACTIVE', created_at: t }; }));
  const depan = ['Dimas', 'Farhan', 'Kenzo', 'Raditya', 'Bagas', 'Nayla', 'Annisa', 'Keisha', 'Salsabila', 'Tiara', 'Rizky', 'Naufal', 'Zahra', 'Aqila'], belakang = ['Pratama', 'Wicaksono', 'Santoso', 'Putri', 'Rahman', 'Lestari', 'Nugroho', 'Hidayat'], kelasP = [0, 1, 3, 5, 6, 7, 8, 10, 11], evs = readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (e) { return e.is_active; });
  const A = [], E = [], rnd = function (i, k) { return ((i * 9301 + k * 49297) % 233280) / 233280; };
  for (let i = 0; i < 56; i++) {
    const k = ko[i % 4], kid = 'DEMO-K' + (i % 4 + 1), g = i % 2 ? 'PUTRI' : 'PUTRA', kelas = kelasP[i % kelasP.length], jk = jenjangOf_(kelas), aid = 'DEMO-A' + (i + 1);
    A.push({ atlet_id: aid, bib: 'D-' + ('000' + (i + 1)).slice(-4), nisn: '90' + ('00000000' + (i + 1)).slice(-8), nama_lengkap: depan[i % depan.length] + ' ' + belakang[(i * 3) % belakang.length], jenis_kelamin: g, tempat_lahir: 'Semarang', tanggal_lahir: (cfg.musim.length === 4 ? Number(cfg.musim) : 2025) - (kelas + 6) + '-05-14', kontingen_id: kid, sekolah_nama: k[0] === 'SEKOLAH' ? k[1] : 'SDN Contoh ' + (i % 3 + 1), klub_nama: k[0] === 'KLUB' ? k[1] : (i % 2 ? 'Klub Tirta Jaya' : ''), kelas_num: kelas, jenjang_kode: jk, provinsi_asal: 'Jawa Tengah', kota_asal: k[3], hp_kontak: '08120000000', foto_file_id: '', akta_file_id: '', surat_file_id: '', sosmed_file_id: '', status_atlet: 'ACTIVE', created_at: t });
    const cand = evs.filter(function (e) { return e.jenjang_kode === jk && e.gender === g; });
    cand.slice(i % 2, (i % 2) + 2).forEach(function (e, j) { const base = e.distance_m === 25 ? 24000 : e.distance_m === 50 ? 34000 : e.distance_m === 100 ? 78000 : 175000, ms = Math.round(base * (0.92 + rnd(i, j) * 0.3) / 10) * 10; E.push({ entry_id: 'DEMO-E' + i + '-' + j, musim: cfg.musim, atlet_id: aid, kontingen_id: kid, event_id: e.event_id, seed_time_entry: fmtWaktu_(ms), seed_ms: ms, nominal_biaya: e.fee_amount, status_verifikasi: 'VERIFIED', status_bayar: 'PAID_VERIFIED', bukti_bayar_file_id: '', verified_by: 'Demo', verified_at: t, catatan_revisi: '', created_at: t }); });
  }
  appendT_('TBL_ATLET', A); appendT_('TBL_REGISTRASI_ENTRI', E); bust_('user', 'atlet', 'hasil');
  const dm = { id: 'demo', nama: 'Wasit Demo', role: R.WS, sys: true }; hSeed_(dm, { id: 'ALL' });
  const seeds = readT_('TBL_HEAT_SEEDS', true), ids = {}; seeds.forEach(function (s) { ids[s.event_id] = 1; });
  Object.keys(ids).slice(0, 8).forEach(function (eid, n) {
    const ss = seeds.filter(function (s) { return s.event_id === eid; }), ev = evs.filter(function (e) { return e.event_id === eid; })[0], fast = Math.min.apply(null, ss.map(function (s) { return s.seed_ms || 999999; }));
    if (n < 4) appendT_('TBL_REKOR_KEJUARAAN', [{ rekor_id: 'DEMO-RK' + n, rekor_key: rekorKey_(ev), event_name: ev.event_name, jenjang_kode: ev.jenjang_kode, gender: ev.gender, stroke_type: ev.stroke_type, distance_m: ev.distance_m, atlet_id: 'DEMO-P', pemegang_nama: 'Pemegang Rekor Lama', kontingen_nama: 'SMPN Contoh Lama', rekor_ms: Math.round(fast * 1.04 / 10) * 10, rekor_waktu: fmtWaktu_(Math.round(fast * 1.04 / 10) * 10), tahun: (Number(cfg.musim) || 2025) - 2, lokasi: 'Kejuaraan sebelumnya', result_id: 'DEMO-OLD' + n, riwayat: '[]' }]);
    hHSimpan_(dm, { id: eid, kirim: true, rows: ss.map(function (s, i) { return { id: s.atlet_id, st: 'OK', waktu: fmtWaktu_(Math.round((s.seed_ms || fast) * (0.97 + rnd(n, i) * 0.07) / 10) * 10) }; }) });
    hSahkan_(dm, { id: eid, catatan: 'Data contoh' });
  });
  flushAudit_(); bust_('master', 'atlet', 'hasil');
  Logger.log('✅ Data contoh dibuat: 4 kontingen, 56 atlet, 8 nomor berhasil disahkan.\n   Login kontingen contoh: NPSN 90000001 | kata sandi: ' + pw + '\n   Hapus sebelum pemakaian nyata: hapusDataContoh()');
}
function hapusDataContoh() {
  _SS = null; _MEMO = {}; const demo = function (v) { return String(v).indexOf('DEMO-') === 0; };
  rewriteT_('TBL_KONTINGEN', readT_('TBL_KONTINGEN', true).filter(function (r) { return !demo(r.kontingen_id); }));
  rewriteT_('TBL_ATLET', readT_('TBL_ATLET', true).filter(function (r) { return !demo(r.atlet_id); }));
  rewriteT_('TBL_REGISTRASI_ENTRI', readT_('TBL_REGISTRASI_ENTRI', true).filter(function (r) { return !demo(r.atlet_id); }));
  rewriteT_('TBL_HEAT_SEEDS', readT_('TBL_HEAT_SEEDS', true).filter(function (r) { return !demo(r.atlet_id); }));
  rewriteT_('TBL_RACE_RESULTS', readT_('TBL_RACE_RESULTS', true).filter(function (r) { return !demo(r.atlet_id); }));
  rewriteT_('TBL_WASIT_SIGNOFF', readT_('TBL_WASIT_SIGNOFF', true).filter(function (r) { return r.referee_user_id !== 'demo'; }));
  rewriteT_('TBL_REKOR_KEJUARAAN', readT_('TBL_REKOR_KEJUARAAN', true).filter(function (r) { return !demo(r.atlet_id) && !demo(r.result_id); }));
  bust_('master', 'user', 'atlet', 'hasil'); Logger.log('🧹 Data contoh dihapus.');
}


// ============================================================
// v1.3 — Kelola entri, sandi & hapus akun, unduhan buku publik
// ============================================================
const BUKU_WEB = ['BUKU_ACARA', 'RESULT_BOOK'];
function sandiBaru_(v) { v = String(v || '').trim(); if (!v) return sandiAcak_(12); if (!kuatSandi_(v)) err_('Kata sandi minimal 8 karakter dengan huruf dan angka.'); return v; }
function dokPublik_(musim) { return readT_('TBL_DOKUMEN').filter(function (d) { return d.is_publik === 1 && d.musim === musim; }).map(function (d) { return { did: d.dok_id, jenis: d.jenis, nama: d.nama_file, id: d.file_id, at: d.created_at }; }); }
function satuTerbit_(rec) { // hanya satu versi terbit per jenis per musim
  const all = readT_('TBL_DOKUMEN', true), up = all.filter(function (o) { return o.jenis === rec.jenis && o.musim === rec.musim && o.dok_id !== rec.dok_id && o.is_publik === 1; });
  up.forEach(function (o) { o.is_publik = 0; }); if (up.length) saveRows_('TBL_DOKUMEN', up);
}
function pastikanBukuArsip_(me) {
  const cfg = cfg_(), docs = readT_('TBL_DOKUMEN', true).filter(function (x) { return x.musim === cfg.musim; });
  BUKU_WEB.forEach(function (j) {
    if (docs.some(function (x) { return x.jenis === j && x.is_publik === 1; })) return;
    const last = docs.filter(function (x) { return x.jenis === j; }).pop();
    if (last) { last.is_publik = 1; saveRows_('TBL_DOKUMEN', [last]); try { bagikan_(DriveApp.getFileById(last.file_id)); } catch (e) { } return; }
    try { const blob = pdf_(j === 'BUKU_ACARA' ? htmlBukuAcara_(0) : htmlResultBook_(), j + '_' + cfg.musim + '_LENGKAP'); simpanDok_(me, j, blob, true); } catch (e) { console.error('buku arsip ' + j + ': ' + e.message); }
  });
  bust_('galeri', 'hasil');
}
function hPubDok_(me, d) {
  const x = readT_('TBL_DOKUMEN').filter(function (r) { return r.dok_id === String(d.id || '') && r.is_publik === 1; })[0]; if (!x) err_('Dokumen tidak tersedia.');
  const b = DriveApp.getFileById(x.file_id).getBlob(); return ok_({ name: x.nama_file, mime: 'application/pdf', b64: Utilities.base64Encode(b.getBytes()) });
}
function entriCek_(id) {
  const all = readT_('TBL_REGISTRASI_ENTRI', true), e = all.filter(function (x) { return x.entry_id === String(id || ''); })[0]; if (!e) err_('Pendaftaran nomor tidak ditemukan.');
  if (readT_('TBL_RACE_RESULTS').some(function (r) { return r.musim === e.musim && r.atlet_id === e.atlet_id && r.event_id === e.event_id; })) err_('Atlet sudah punya hasil lomba di nomor ini. Tarik hasilnya dulu di menu Input Hasil.');
  return { all: all, e: e };
}
function keluarStart_(e) { // keluarkan atlet dari start list nomor lama
  const seeds = readT_('TBL_HEAT_SEEDS', true), keep = seeds.filter(function (s) { return !(s.musim === e.musim && s.event_id === e.event_id && s.atlet_id === e.atlet_id); });
  if (keep.length === seeds.length) return false; rewriteT_('TBL_HEAT_SEEDS', keep); return true;
}
function hEntriUbah_(me, d) {
  const c = entriCek_(d.id), e = c.e, ev = readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (x) { return x.event_id === String(d.eid || '') && x.is_active; })[0];
  if (!ev) err_('Nomor lomba tujuan tidak ditemukan atau nonaktif.'); if (ev.event_id === e.event_id) err_('Nomor tujuan sama dengan nomor sekarang.');
  const a = readT_('TBL_ATLET').filter(function (x) { return x.atlet_id === e.atlet_id; })[0]; if (!a) err_('Atlet tidak ditemukan.');
  if (ev.gender !== a.jenis_kelamin) err_('Nomor tujuan untuk ' + (ev.gender === 'PUTRA' ? 'putra' : 'putri') + ', atlet ini ' + (a.jenis_kelamin === 'PUTRA' ? 'putra' : 'putri') + '.');
  if (ev.jenjang_kode !== (jenjangOf_(a.kelas_num) || a.jenjang_kode) && !d.paksa) err_('Kelompok nomor tujuan berbeda dengan kelompok atlet. Centang "Izinkan beda kelompok" bila memang disengaja.');
  if (c.all.some(function (x) { return x.musim === e.musim && x.atlet_id === e.atlet_id && x.event_id === ev.event_id && x.status_verifikasi !== 'REJECTED'; })) err_('Atlet sudah terdaftar di nomor tujuan.');
  const lama = (readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (x) { return x.event_id === e.event_id; })[0] || {}).event_no, keluar = keluarStart_(e);
  e.event_id = ev.event_id; if (cfg_().biaya_mode !== 'PAKET') e.nominal_biaya = ev.fee_amount; saveRows_('TBL_REGISTRASI_ENTRI', [e]); delete _MEMO.__jd;
  bust_('atlet', 'hasil'); audit_(me, 'ENTRI_UBAH', 'Entri', a.nama_lengkap + ': #' + lama + ' → #' + ev.event_no);
  return ok_({ keluar: keluar }, 'Nomor lomba ' + a.nama_lengkap + ' diubah ke #' + ev.event_no + '.' + (keluar ? ' Atlet dikeluarkan dari start list nomor lama — jalankan ulang Susun Start List agar masuk ke nomor baru.' : ''));
}
function hEntriHapus_(me, d) {
  const c = entriCek_(d.id), e = c.e, keluar = keluarStart_(e), a = readT_('TBL_ATLET').filter(function (x) { return x.atlet_id === e.atlet_id; })[0] || {};
  rewriteT_('TBL_REGISTRASI_ENTRI', c.all.filter(function (x) { return x.entry_id !== e.entry_id; })); delete _MEMO.__jd;
  bust_('atlet', 'hasil'); audit_(me, 'ENTRI_HAPUS', 'Entri', (a.nama_lengkap || e.atlet_id) + ' · ' + e.event_id);
  return ok_({ keluar: keluar }, 'Nomor lomba dihapus dari pendaftaran atlet.' + (keluar ? ' Start list nomor tersebut ikut diperbarui.' : ''));
}
function hAkunSandi_(me, d) {
  const all = readT_('TBL_KONTINGEN', true), k = all.filter(function (x) { return x.kontingen_id === String(d.id || ''); })[0]; if (!k) err_('Akun tidak ditemukan.');
  const pw = sandiBaru_(d.sandi); k.pass_salt = Utilities.getUuid(); k.pass_hash = hashPass_(pw, k.pass_salt); saveRows_('TBL_KONTINGEN', [k]); revokeAll_(k.kontingen_id);
  audit_(me, 'AKUN_SANDI', 'Kontingen', k.nama_lembaga); return ok_({ sandi: pw, login: k.npsn_or_sk || k.pj_email }, 'Kata sandi akun diganti. Catat — hanya tampil sekali.');
}
function hAkunStatus_(me, d) {
  const all = readT_('TBL_KONTINGEN', true), k = all.filter(function (x) { return x.kontingen_id === String(d.id || ''); })[0]; if (!k) err_('Akun tidak ditemukan.');
  k.status_akun = k.status_akun === 'ACTIVE' ? 'NONAKTIF' : 'ACTIVE'; saveRows_('TBL_KONTINGEN', [k]); if (k.status_akun !== 'ACTIVE') revokeAll_(k.kontingen_id);
  bust_('user'); audit_(me, 'AKUN_STATUS', 'Kontingen', k.nama_lembaga + ' → ' + k.status_akun); return ok_({ st: k.status_akun }, k.status_akun === 'ACTIVE' ? 'Akun diaktifkan.' : 'Akun dinonaktifkan (tidak bisa masuk).');
}
function hAkunHapus_(me, d) {
  const ids = (Array.isArray(d.ids) ? d.ids : [d.id]).map(String).filter(Boolean); if (!ids.length) err_('Pilih akun yang akan dihapus.');
  if (String(d.konfirmasi || '') !== 'HAPUS') err_('Ketik HAPUS untuk konfirmasi.');
  const del = {}; ids.forEach(function (i) { del[i] = 1; });
  const konts = readT_('TBL_KONTINGEN', true), target = konts.filter(function (k) { return del[k.kontingen_id]; }); if (!target.length) err_('Akun tidak ditemukan.');
  const sah = {}; readT_('TBL_RACE_RESULTS').forEach(function (r) { if (r.status_pengesahan === 'SAH') sah[r.atlet_id] = 1; }); readT_('TBL_REKOR_KEJUARAAN').forEach(function (r) { sah[r.atlet_id] = 1; });
  const atl = readT_('TBL_ATLET', true), hapusA = {}, simpanA = []; let nHapus = 0, nSimpan = 0;
  atl.forEach(function (a) {
    if (!del[a.kontingen_id]) return;
    if (sah[a.atlet_id]) { if (a.status_atlet !== 'ARSIP') { a.status_atlet = 'ARSIP'; simpanA.push(a); } nSimpan++; return; } // riwayat hasil resmi tetap utuh
    hapusA[a.atlet_id] = 1; nHapus++; [a.foto_file_id, a.akta_file_id, a.surat_file_id, a.sosmed_file_id].forEach(function (f) { if (f) { try { DriveApp.getFileById(f).setTrashed(true); } catch (e) { } } });
  });
  const ents = readT_('TBL_REGISTRASI_ENTRI', true), keepE = ents.filter(function (e) { return !hapusA[e.atlet_id]; });
  ents.forEach(function (e) { if (hapusA[e.atlet_id] && e.bukti_bayar_file_id) { try { DriveApp.getFileById(e.bukti_bayar_file_id).setTrashed(true); } catch (x) { } } });
  if (keepE.length !== ents.length) rewriteT_('TBL_REGISTRASI_ENTRI', keepE);
  const seeds = readT_('TBL_HEAT_SEEDS', true), keepS = seeds.filter(function (s) { return !hapusA[s.atlet_id]; }); if (keepS.length !== seeds.length) rewriteT_('TBL_HEAT_SEEDS', keepS);
  const png = readT_('TBL_MUTASI_ATLET', true), keepP = png.filter(function (p) { return !hapusA[p.atlet_id]; }); if (keepP.length !== png.length) rewriteT_('TBL_MUTASI_ATLET', keepP);
  if (Object.keys(hapusA).length) rewriteT_('TBL_ATLET', atl.filter(function (a) { return !hapusA[a.atlet_id]; }));
  else if (simpanA.length) saveRows_('TBL_ATLET', simpanA);
  target.forEach(function (k) { if (k.mandat_file_id) { try { DriveApp.getFileById(k.mandat_file_id).setTrashed(true); } catch (e) { } } revokeAll_(k.kontingen_id); });
  rewriteT_('TBL_KONTINGEN', readT_('TBL_KONTINGEN', true).filter(function (k) { return !del[k.kontingen_id]; }));
  delete _MEMO.__jd; bust_('user', 'atlet', 'hasil'); audit_(me, 'AKUN_HAPUS', 'Kontingen', target.map(function (k) { return k.nama_lembaga; }).join(', ').slice(0, 280));
  return ok_({ akun: target.length, atlet: nHapus, arsip: nSimpan }, target.length + ' akun dihapus beserta ' + nHapus + ' atlet.' + (nSimpan ? ' ' + nSimpan + ' atlet yang punya hasil resmi disimpan sebagai arsip agar riwayat hasil tetap utuh.' : ''));
}
function hUsrHapus_(me, d) {
  const all = readT_('TBL_USERS_ROLES', true), u = all.filter(function (x) { return x.user_id === String(d.id || ''); })[0]; if (!u) err_('Pengguna tidak ditemukan.');
  if (u.user_id === me.id) err_('Anda tidak dapat menghapus akun sendiri.');
  if (u.role === R.SA && all.filter(function (x) { return x.role === R.SA && x.status === 'ACTIVE'; }).length <= 1) err_('Minimal harus ada satu Super Admin aktif.');
  rewriteT_('TBL_USERS_ROLES', all.filter(function (x) { return x.user_id !== u.user_id; })); revokeAll_(u.user_id); bust_('user');
  audit_(me, 'USER_HAPUS', 'Pengguna', u.email); return ok_(null, 'Pengguna ' + u.full_name + ' dihapus.');
}

// ── Peta rute RPC ──
const ROUTES = {
  'sys.ping': { roles: 'PUBLIC', fn: hSysPing_ },
  'mig.grup': { roles: [R.SA], fn: hMigrasiGrup_ }, 'mig.run': { roles: [R.SA], fn: function (me, d) { return hMigrasi_(me, d); }, write: true },
  'pub.boot': { roles: 'PUBLIC', fn: hPubBoot_ }, 'pub.start': { roles: 'PUBLIC', fn: hPubStart_ }, 'pub.live': { roles: 'PUBLIC', fn: hPubLive_ }, 'pub.rekor': { roles: 'PUBLIC', fn: hPubRekor_ },
  'pub.klas': { roles: 'PUBLIC', fn: hPubKlas_ }, 'pub.atlet': { roles: 'PUBLIC', fn: hPubAtlet_ }, 'pub.profil': { roles: 'PUBLIC', fn: hPubProfil_ }, 'pub.galeri': { roles: 'PUBLIC', fn: hPubGaleri_ },
  'auth.login': { roles: 'PUBLIC', fn: hLogin_ }, 'auth.daftar': { roles: 'PUBLIC', fn: hDaftarLembaga_, write: true },
  'me.sandi': { roles: 'ANY', fn: hGantiSandi_, write: true }, 'file.data': { roles: 'ANY', fn: hFileData_ },
  'm.boot': { roles: [R.KT], fn: hMBoot_ }, 'm.kont': { roles: [R.KT], fn: hKontList_ }, 'm.upload': { roles: [R.KT], fn: hUpload_ }, 'm.atlet': { roles: [R.KT], fn: hAtletSimpan_, write: true },
  'm.perbaiki': { roles: [R.KT], fn: hAtletPerbaiki_, write: true }, 'm.pengajuan': { roles: [R.KT], fn: hPengajuan_, write: true },
  'm.idcard': { roles: [R.KT, R.SA, R.VF], fn: hIdCard_ }, 'm.sertifikat': { roles: [R.KT, R.SA], fn: hSertifikat_ },
  'a.dash': { roles: STAFF, fn: hADash_ }, 'v.list': { roles: [R.SA, R.VF], fn: hVList_ }, 'v.detail': { roles: [R.SA, R.VF], fn: hVDetail_ }, 'v.aksi': { roles: [R.SA, R.VF], fn: hVAksi_, write: true },
  'p.list': { roles: [R.SA, R.VF], fn: hPList_ }, 'p.aksi': { roles: [R.SA, R.VF], fn: hPAksi_, write: true }, 's.run': { roles: [R.SA], fn: hSeed_, write: true },
  'h.events': { roles: [R.SA, R.OP, R.WS], fn: hHEvents_ }, 'h.load': { roles: [R.SA, R.OP, R.WS], fn: hHLoad_ }, 'h.ver': { roles: [R.SA, R.OP, R.WS], fn: hHVer_ }, 'h.simpan': { roles: [R.SA, R.OP], fn: hHSimpan_, write: true },
  'h.tarik': { roles: [R.SA, R.OP, R.WS], fn: hTarik_, write: true }, 'h.sahkan': { roles: [R.SA, R.WS], fn: hSahkan_, write: true },
  'mst.list': { roles: [R.SA], fn: hMstList_ }, 'mst.simpan': { roles: [R.SA], fn: hMstSimpan_, write: true }, 'mst.hapus': { roles: [R.SA], fn: hMstHapus_, write: true }, 'mst.default': { roles: [R.SA], fn: hMstDefault_, write: true },
  'cfg.get': { roles: [R.SA], fn: hCfgGet_ }, 'cfg.simpan': { roles: [R.SA], fn: hCfgSimpan_, write: true },
  'dok.list': { roles: [R.SA], fn: hDokList_ }, 'dok.buat': { roles: [R.SA], fn: hDokBuat_, write: true }, 'dok.data': { roles: [R.SA], fn: hDokData_ }, 'dok.publik': { roles: [R.SA], fn: hDokPublik_, write: true },
  'lap.get': { roles: [R.SA, R.VF], fn: hLap_ }, 'ars.get': { roles: [R.SA], fn: hArsGet_ }, 'ars.run': { roles: [R.SA], fn: hArsRun_, write: true },
  'gal.up': { roles: [R.SA, R.OP], fn: hGalUp_, write: true }, 'gal.del': { roles: [R.SA], fn: hGalDel_, write: true },
  'usr.list': { roles: [R.SA], fn: hUsrList_ }, 'usr.simpan': { roles: [R.SA], fn: hUsrSimpan_, write: true }, 'usr.reset': { roles: [R.SA], fn: hUsrReset_, write: true },
  'aud.list': { roles: [R.SA], fn: hAudList_ },
  'm.sekolah': { roles: [R.KT], fn: hSekolahList_ }, 'a.kurang': { roles: [R.SA], fn: hKurang_ }, 'a.kontak': { roles: [R.SA], fn: hKontak_, write: true },
  'fase.get': { roles: [R.SA], fn: hFaseGet_ }, 'fase.set': { roles: [R.SA], fn: hFaseSet_, write: true },
  'imp.cek': { roles: [R.SA], fn: hImpCek_ }, 'imp.simpan': { roles: [R.SA], fn: hImpSimpan_, write: true }, 'imp.list': { roles: [R.SA], fn: hImpList_ }, 'imp.final': { roles: [R.SA], fn: hImpFinal_, write: true }, 'imp.hapus': { roles: [R.SA], fn: hImpHapus_, write: true },
  'pub.arsip': { roles: 'PUBLIC', fn: hPubArsip_ }, 'pub.dok': { roles: 'PUBLIC', fn: hPubDok_ },
  // Panduan event & pendaftaran manual (Operasional.gs)
  'pan.status': { roles: [R.SA], fn: function (me, d) { return hPanduan_(me, d); } }, 'man.cek': { roles: [R.SA], fn: function (me, d) { return hManCek_(me, d); } }, 'man.simpan': { roles: [R.SA], fn: function (me, d) { return hManSimpan_(me, d); }, write: true },
  // Modul Kurasi Puspresnas (Kurasi.gs) — dibungkus agar aman terhadap urutan pemuatan berkas .gs
  'kur.get': { roles: [R.SA], fn: function (me, d) { return hKurGet_(me, d); } }, 'kur.simpan': { roles: [R.SA], fn: function (me, d) { return hKurSimpan_(me, d); }, write: true },
  'kur.img': { roles: [R.SA], fn: function (me, d) { return hKurImg_(me, d); }, write: true }, 'kur.buat': { roles: [R.SA], fn: function (me, d) { return hKurBuat_(me, d); } },
  'kur.sert': { roles: [R.SA], fn: function (me, d) { return hKurSert_(me, d); } }, 'kur.data': { roles: [R.SA], fn: function (me, d) { return hKurData_(me, d); } },
  'sa.entri.ubah': { roles: [R.SA], fn: hEntriUbah_, write: true }, 'sa.entri.hapus': { roles: [R.SA], fn: hEntriHapus_, write: true },
  'sa.akun.sandi': { roles: [R.SA], fn: hAkunSandi_, write: true }, 'sa.akun.status': { roles: [R.SA], fn: hAkunStatus_, write: true }, 'sa.akun.hapus': { roles: [R.SA], fn: hAkunHapus_, write: true }, 'usr.hapus': { roles: [R.SA], fn: hUsrHapus_, write: true }, 'gal.link': { roles: [R.SA, R.OP], fn: hGalLink_, write: true },
  'm.daftarnomor': { roles: [R.KT], fn: hDaftarNomor_, write: true }, 'sa.akun': { roles: [R.SA], fn: hAkunList_ }, 'sa.akun.detail': { roles: [R.SA], fn: hAkunDetail_ },
  // v1.6 — Event & Nomor Pertandingan (Event.gs)
  'ev.list': { roles: [R.SA], fn: function (me, d) { return hEvList_(me, d); } }, 'ev.get': { roles: [R.SA], fn: function (me, d) { return hEvGet_(me, d); } },
  'ev.simpan': { roles: [R.SA], fn: function (me, d) { return hEvSimpan_(me, d); }, write: true }, 'ev.aktifkan': { roles: [R.SA], fn: function (me, d) { return hEvAktifkan_(me, d); }, write: true },
  'ev.hapus': { roles: [R.SA], fn: function (me, d) { return hEvHapus_(me, d); }, write: true }, 'ev.status': { roles: [R.SA], fn: function (me, d) { return hEvStatus_(me, d); }, write: true },
  'ev.daftar': { roles: [R.SA], fn: function (me, d) { return hEvDaftar_(me, d); }, write: true }, 'ev.kel': { roles: [R.SA], fn: function (me, d) { return hEvKelTambah_(me, d); }, write: true },
  'ev.nomor.simpan': { roles: [R.SA], fn: function (me, d) { return hEvNomorSimpan_(me, d); }, write: true }, 'ev.nomor.hapus': { roles: [R.SA], fn: function (me, d) { return hEvNomorHapus_(me, d); }, write: true },
  'ev.nomor.massal': { roles: [R.SA], fn: function (me, d) { return hEvNomorMassal_(me, d); }, write: true }, 'ev.nomor.gen': { roles: [R.SA], fn: function (me, d) { return hEvNomorGen_(me, d); }, write: true },
  'ev.nomor.rapikan': { roles: [R.SA], fn: function (me, d) { return hEvNomorRapikan_(me, d); }, write: true }, 'ev.preset': { roles: [R.SA], fn: function (me, d) { return hEvPreset_(me, d); }, write: true },
  'ev.demo': { roles: [R.SA], fn: function (me, d) { return hEvDemo_(me, d); }, write: true }, 'ev.demo.hapus': { roles: [R.SA], fn: function (me, d) { return hEvDemoHapus_(me, d); }, write: true },
  'imp.kolam': { roles: [R.SA], fn: hImpKolam_, write: true },
  'imp.rekor': { roles: [R.SA], fn: hImpRekorUlang_, write: true },
  'ev.reset': { roles: [R.SA], fn: function (me, d) { return hEvReset_(me, d); }, write: true },
  'ev.reset.pedoman': { roles: [R.SA], fn: function (me, d) { return hEvResetPedoman_(me, d); }, write: true },
  'pub.klas.tahun': { roles: 'PUBLIC', fn: hPubKlasTahun_ },
  'buku.xls': { roles: [R.SA, R.OP], fn: hBukuXls_ },
  'm.klaim.cari': { roles: [R.KT], fn: function (me, d) { return hKlaimCari_(me, d); } }, 'm.klaim': { roles: [R.KT], fn: function (me, d) { return hKlaim_(me, d); }, write: true }, 'm.klaim.batal': { roles: [R.KT], fn: function (me, d) { return hKlaimBatal_(me, d); }, write: true },
  'sa.klaim.list': { roles: [R.SA, R.VF], fn: function (me, d) { return hKlaimList_(me, d); } }, 'sa.klaim.aksi': { roles: [R.SA, R.VF], fn: function (me, d) { return hKlaimAksi_(me, d); }, write: true },
  'pub.event': { roles: 'PUBLIC', fn: function (me, d) { return hPubEvent_(me, d); } },
  'jd.get': { roles: [R.SA, R.VF, R.OP, R.WS], fn: hJdGet_ }, 'jd.susun': { roles: [R.SA], fn: function (me, d) { return hJdSusun_(me, d); }, write: true }, 'jd.set': { roles: [R.SA], fn: hJdSet_, write: true },
  'dok.logo.up': { roles: [R.SA], fn: hLogoUp_, write: true }, 'dok.logo.set': { roles: [R.SA], fn: hLogoSet_, write: true }, 'exp.data': { roles: [R.SA], fn: hExpData_ }, 'sys.rollover': { roles: [R.SA], fn: hRollover_, write: true }
};
