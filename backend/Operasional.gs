/**
 * ============================================================
 * OPERASIONAL — Panduan event dinamis & pendaftaran manual oleh Super Admin
 * - pan.status : status setiap langkah event (dipakai halaman Panduan Event)
 * - man.cek / man.simpan : impor/isi pendaftar yang sudah ada di luar web
 *   (mis. formulir Google/Excel) langsung ke musim berjalan, lalu lanjut ke
 *   start list, buku acara, input hasil, pengesahan, dan buku hasil.
 * ============================================================
 */

// ── Status panduan event ──
function hPanduan_() {
  const c = cfg_(), musim = c.musim, evs = readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (e) { return e.is_active; });
  const ents = readT_('TBL_REGISTRASI_ENTRI').filter(function (e) { return e.musim === musim; });
  const cnt = function (f) { return ents.filter(f).length; };
  const seeds = {}; readT_('TBL_HEAT_SEEDS').forEach(function (s) { if (s.musim === musim) seeds[s.event_id] = 1; });
  const st = evStatus_(musim), sah = Object.keys(st).filter(function (k) { return st[k].s === 'SAH'; }).length, draf = Object.keys(st).filter(function (k) { return st[k].s === 'DRAFT' || st[k].s === 'SUBMITTED'; }).length;
  const dok = readT_('TBL_DOKUMEN').filter(function (d) { return d.musim === musim; }), pub = function (j) { return dok.some(function (d) { return d.jenis === j && d.is_publik === 1; }); };
  let man = {}; try { man = JSON.parse(c.jadwal_manual_json || '{}') || {}; } catch (e) { }
  const atl = {}; ents.forEach(function (e) { atl[e.atlet_id] = 1; });
  const users = readT_('TBL_USERS_ROLES').filter(function (u) { return u.status === 'ACTIVE'; }), role = function (r) { return users.filter(function (u) { return u.role === r; }).length; };
  return ok_({
    musim: musim, fase: c.fase || 'PENDAFTARAN', buka: bukaDaftar_(), dl: c.registrasi_deadline || '', dibuka: c.registrasi_dibuka === '1',
    identitas: { nama: !!c.app_name, tanggal: !!c.tanggal_teks, lokasi: !!c.lokasi, kontak: !!(c.kontak_email || c.kontak_telp), rekening: !!c.rekening },
    logo: logoList_().length, nomor: evs.length, jadwalManual: Object.keys(man).length, mulai: c.jadwal_mulai || '08:00',
    entri: { total: ents.length, verified: cnt(function (e) { return e.status_verifikasi === 'VERIFIED'; }), pending: cnt(function (e) { return e.status_verifikasi === 'PENDING'; }), revisi: cnt(function (e) { return e.status_verifikasi === 'REVISION_REQUIRED'; }), lunas: cnt(function (e) { return e.status_bayar === 'PAID_VERIFIED'; }), manual: cnt(function (e) { return /impor manual|input manual/i.test(e.verified_by || ''); }) },
    atlet: Object.keys(atl).length, seedNomor: Object.keys(seeds).length, sah: sah, draf: draf,
    bukuAcara: pub('BUKU_ACARA'), bukuHasil: pub('RESULT_BOOK'), sk: dok.some(function (d) { return d.jenis === 'SK_PEMENANG'; }), lpj: dok.some(function (d) { return d.jenis === 'LPJ'; }),
    petugas: { op: role(R.OP), ws: role(R.WS), vf: role(R.VF) }, arsipStep: toInt_(c._arsip_step), kurasi: !!c['_kurasi_' + musim]
  });
}

// ── Pendaftaran manual (Super Admin) ──
// Kolom: nama, gender, kelas (atau kelompok A–F), sekolah, klub, kota, provinsi, nomor (no. acara atau "50m Gaya Bebas"; boleh banyak dipisah ; ),
//        entry (catatan waktu; boleh banyak dipisah ; ), nisn, tgl_lahir, tempat_lahir, hp, pendaftar, hp_pendaftar
// Format formulir (nomor_1..nomor_5 + waktu_1..waktu_5) digabung di sisi klien menjadi nomor/entry.
function kelDariTeks_(v) { // 'A', 'Kelompok A', 'SD_1_2', 'SD Kelas 1-2' → kode kelompok event aktif
  const t = String(v || '').trim(); if (!t) return ''; let k = {}; try { k = JSON.parse(cfg_().kelompok_json || '{}') || {}; } catch (e) { }
  const m = t.toUpperCase().match(/^(?:KEL(?:OMPOK)?\.?\s*)?([A-Z])$/); if (m) { const kode = Object.keys(k).filter(function (x) { return k[x] === m[1]; })[0]; if (kode) return kode; }
  return normJenjang_(t) || '';
}
function manProses_(rows, o, simpan, me) {
  o = o || {}; const cfg = cfg_(), musim = cfg.musim, evAll = readT_('TBL_MASTER_NOMOR_LOMBA', true).filter(function (e) { return !e.musim || e.musim === musim; }), evAktif = evAll.filter(function (e) { return e.is_active; });
  const byNo = {}; evAll.forEach(function (e) { if (!byNo[e.event_no] || e.is_active) byNo[e.event_no] = e; });
  const jenM = idx_(readM_('TBL_MASTER_JENJANG'), 'kode_jenjang'), cntA = {}, minN = Math.max(1, Number(cfg.min_nomor) || 1), kurang = [], newCnt = {};
  const konts = readT_('TBL_KONTINGEN', true), kByNama = {}; konts.forEach(function (k) { kByNama[nk_(k.nama_lembaga)] = k; });
  const atl = readT_('TBL_ATLET', true), aKey = {}; atl.forEach(function (a) { if (a.status_atlet === 'ACTIVE') aKey[a.kontingen_id + '|' + nk_(a.nama_lengkap)] = a; });
  const ents = readT_('TBL_REGISTRASI_ENTRI', true), eKey = {}; ents.forEach(function (e) { if (e.musim === musim && e.status_verifikasi !== 'REJECTED') { eKey[e.atlet_id + '|' + e.event_id] = 1; cntA[e.atlet_id] = (cntA[e.atlet_id] || 0) + 1; } });
  const errs = [], plan = [], evBaru = {}, kBaru = {}, aBaru = {}, prev = []; let maxNo = evAll.reduce(function (m, e) { return Math.max(m, e.event_no); }, 0), dup = 0, aLama = {};
  (Array.isArray(rows) ? rows : []).slice(0, 400).forEach(function (r, i) {
    const e = [], nama = String(r.nama || '').replace(/\s+/g, ' ').trim(), g = normGender_(r.gender), kelK = kelDariTeks_(r.kelompok), kelas0 = kelasNum_(r.kelas), kelas = kelas0 >= 0 ? kelas0 : (kelK && jenM[kelK] ? jenM[kelK].kelas_min : -1), sekolah = String(r.sekolah || '').replace(/\s+/g, ' ').trim(), klub = String(r.klub || '').replace(/\s+/g, ' ').trim();
    if (nama.length < 3) e.push('nama minimal 3 huruf'); if (!g) e.push('gender tidak dikenali (Putra/Putri, L/P)'); if (kelas < 0) e.push(String(r.kelompok || '').trim() ? 'kelompok "' + r.kelompok + '" tidak dikenali' : 'kelas tidak dikenali (mis. 2, "2 SD", "7 SMP", TK) — atau isi kolom kelompok (A–F)'); if (!sekolah && !klub) e.push('sekolah atau klub wajib diisi');
    const jk = kelas >= 0 ? jenjangOf_(kelas) : ''; if (kelas >= 0 && !jk) e.push('kelas ' + kelas + ' tidak masuk kelompok mana pun');
    if (kelK && jk && kelK !== jk && kelas0 >= 0) e.push('kelas ' + kelas0 + ' bukan ' + (String(r.kelompok).trim().length <= 2 ? 'kelompok ' + String(r.kelompok).trim().toUpperCase() : r.kelompok));
    const nomorL = String(r.nomor || '').split(/\s*[;|]\s*|\s*,\s*(?=\d)/).map(function (x) { return x.trim(); }).filter(Boolean), entL = String(r.entry || '').split(/\s*[;|]\s*/);
    if (!nomorL.length) e.push('nomor lomba kosong');
    const evs = [];
    nomorL.forEach(function (nm, j) {
      let ev = null;
      if (/^#?\d{1,4}$/.test(nm)) { ev = byNo[toInt_(nm.replace('#', ''))]; if (!ev) { e.push('nomor acara #' + nm.replace('#', '') + ' tidak ada'); return; } if (!ev.is_active) { e.push('nomor acara #' + ev.event_no + ' nonaktif'); return; } }
      else {
        const p = parseNomor_(nm); if (!p.d || !p.st) { e.push('nomor "' + nm + '" tidak terbaca (contoh: 50m Gaya Bebas atau 105)'); return; }
        ev = evAktif.filter(function (x) { return x.distance_m === p.d && x.stroke_type === p.st && x.gender === g && x.jenjang_kode === jk; })[0];
        if (!ev) { const kk = [p.d, p.st, g, jk].join('|'); if (o.buatNomor && g && jk) { ev = evBaru[kk] || (evBaru[kk] = { event_id: '', event_no: 0, event_name: p.d + 'm ' + p.st, course_type: cfg.kolam === 'SCM' ? 'SCM' : 'LCM', jenjang_kode: jk, gender: g, distance_m: p.d, stroke_type: p.st, fee_amount: cfg.biaya_mode === 'PAKET' ? Math.floor((Number(cfg.biaya_paket) || 0) / Math.max(1, Number(cfg.max_individu) || 1)) : 0, max_quota: 0, hari: 1, sesi: 'Pagi', jam: '', is_active: 1, musim: musim, dibuka: '1', _baru: true }); } else { e.push('nomor ' + p.d + 'm ' + p.st + ' ' + (g === 'PUTRA' ? 'putra' : 'putri') + ' kelompok ' + jk + ' belum ada (centang "buat nomor otomatis")'); return; } }
      }
      if (ev.gender && g && ev.gender !== g) { e.push('#' + (ev.event_no || ev.event_name) + ' untuk ' + (ev.gender === 'PUTRA' ? 'putra' : 'putri')); return; }
      if (jk && ev.jenjang_kode !== jk && !o.paksa) { e.push('#' + (ev.event_no || ev.event_name) + ' kelompok ' + ev.jenjang_kode + ', atlet kelas ' + kelas + ' (' + jk + ')'); return; }
      let ms = 0, wt = String(entL.length === nomorL.length ? entL[j] : nomorL.length === 1 ? entL[0] : '').trim(); if (/^nt$/i.test(wt)) wt = '';
      if (wt) { ms = parseWaktu_(wt.replace(/^(\d{1,2})\.(\d{2})\.(\d{1,2})$/, '$1:$2.$3')); if (ms <= 0) { e.push('waktu entry "' + wt + '" tidak valid (contoh 00:42.15)'); return; } }
      evs.push({ ev: ev, ms: ms });
    });
    if (e.length) { errs.push({ i: i + 1, nama: nama, msg: e.join('; ') }); return; }
    const lembaga = sekolah || klub, kk = nk_(lembaga), kont = kByNama[kk] || kBaru[kk] || (kBaru[kk] = { _baru: true, kontingen_id: '', tipe_lembaga: sekolah ? 'SEKOLAH' : 'KLUB', nama_lembaga: lembaga, kota: String(r.kota || '').trim(), prov: String(r.provinsi || '').trim(), pj: String(r.pendaftar || '').trim().slice(0, 80), pjhp: String(r.hp_pendaftar || '').replace(/[^\d+]/g, '').slice(0, 16) });
    if (kont._baru && !kont.pj && r.pendaftar) { kont.pj = String(r.pendaftar).trim().slice(0, 80); kont.pjhp = String(r.hp_pendaftar || '').replace(/[^\d+]/g, '').slice(0, 16); }
    const ak = (kont.kontingen_id || ('N:' + kk)) + '|' + nk_(nama), a = aKey[ak] || aBaru[ak] || (aBaru[ak] = { _baru: true, nama: nama, g: g, kelas: kelas, jk: jk, sekolah: sekolah, klub: klub, kota: String(r.kota || '').trim(), prov: String(r.provinsi || '').trim(), nisn: String(r.nisn || '').replace(/\D/g, '').slice(0, 10), tgl: /^\d{4}-\d{2}-\d{2}$/.test(String(r.tgl_lahir || '')) ? r.tgl_lahir : '', tempat: String(r.tempat_lahir || '').trim(), hp: String(r.hp || r.hp_pendaftar || '').trim(), kk: kk });
    if (!a._baru) aLama[a.atlet_id] = 1;
    evs.forEach(function (x) {
      const key = (a.atlet_id || ak) + '|' + (x.ev.event_id || x.ev.event_name + x.ev.jenjang_kode + x.ev.gender);
      if (eKey[key]) { dup++; return; } eKey[key] = 1; const ka = a.atlet_id || ak; newCnt[ka] = (newCnt[ka] || 0) + 1; plan.push({ a: a, ak: ak, ev: x.ev, ms: x.ms, idx: (a.atlet_id ? cntA[a.atlet_id] || 0 : 0) + newCnt[ka] - 1 });
    });
    const tot = (a.atlet_id ? cntA[a.atlet_id] || 0 : 0) + (newCnt[a.atlet_id || ak] || 0); if (tot < minN && kurang.length < 40 && !kurang.some(function (z) { return z.ak === ak; })) kurang.push({ ak: ak, nama: nama, n: tot });
    if (prev.length < 40) prev.push({ nama: nama, g: g, kelas: kelas, jk: jk, lembaga: lembaga, nomor: evs.map(function (x) { return x.ev.event_no ? '#' + x.ev.event_no : x.ev.event_name + ' (baru)'; }).join(', '), entry: evs.map(function (x) { return x.ms ? fmtWaktu_(x.ms) : 'NT'; }).join(', '), baru: !!a._baru });
  });
  const nAkhir = function (z) { const ka = (aKey[z.ak] || {}).atlet_id || z.ak; return (aKey[z.ak] ? cntA[aKey[z.ak].atlet_id] || 0 : 0) + (newCnt[ka] || 0); };
  const kur = kurang.map(function (z) { return { ak: z.ak, nama: z.nama, n: nAkhir(z) }; }).filter(function (z) { return z.n < minN; });
  const ring = { baris: Math.min((rows || []).length, 400), entri: plan.length, dup: dup, atletBaru: Object.keys(aBaru).length, atletLama: Object.keys(aLama).length, kontBaru: Object.keys(kBaru).length, nomorBaru: Object.keys(evBaru).length, err: errs.length, kurang: kur.length };
  if (!simpan) return { ring: ring, errors: errs.slice(0, 40), preview: prev, kurang: kur.map(function (z) { return { nama: z.nama, n: z.n }; }), minN: minN, nomorBaru: Object.keys(evBaru).map(function (k) { const x = evBaru[k]; return x.event_name + ' ' + (x.gender === 'PUTRA' ? 'Putra' : 'Putri') + ' · ' + x.jenjang_kode; }) };
  if (errs.length) err_('Masih ada ' + errs.length + ' baris bermasalah (baris ' + errs[0].i + ': ' + errs[0].msg + ').');
  if (!plan.length) return { ring: ring };
  ensureHdr_('TBL_REGISTRASI_ENTRI');
  const t = nowIso_(), oleh = me.nama + ' (impor manual)';
  // 1) nomor lomba baru (bila diizinkan)
  const evNew = Object.keys(evBaru).map(function (k) { const x = evBaru[k]; maxNo++; x.event_no = maxNo; x.event_id = uid_('N'); return x; });
  if (evNew.length) { appendT_('TBL_MASTER_NOMOR_LOMBA', evNew.map(function (x) { const y = Object.assign({}, x); delete y._baru; return y; })); bust_('master'); }
  // 2) akun lembaga untuk sekolah/klub baru (tanpa sandi; Super Admin dapat menetapkan sandi agar sekolah bisa masuk)
  const kNew = Object.keys(kBaru); let seqK = Number(prop_('SEQ_MNL', '0'));
  const kRows = kNew.map(function (k) { const x = kBaru[k]; seqK++; x.kontingen_id = uid_('K'); return { kontingen_id: x.kontingen_id, tipe_lembaga: x.tipe_lembaga, nama_lembaga: x.nama_lembaga, npsn_or_sk: 'MNL' + ('00000' + seqK).slice(-5), provinsi: x.prov, kota_kabupaten: x.kota, alamat: '(didaftarkan panitia)', jenjang_utama: '', pj_nama: x.pj || '', pj_jabatan: x.pj ? 'Pendaftar' : '', pj_telepon: x.pjhp || '', pj_email: '', pass_hash: '', pass_salt: '', drive_folder_id: '', mandat_file_id: '', status_akun: 'ACTIVE', created_at: t }; });
  if (kRows.length) { appendT_('TBL_KONTINGEN', kRows); setProp_('SEQ_MNL', seqK); }
  // 3) atlet baru (BIB dialokasikan sekaligus agar cepat)
  const aNew = Object.keys(aBaru); let seqB = Number(prop_('SEQ_BIB', '0'));
  const aRows = aNew.map(function (k) { const x = aBaru[k], kont = kByNama[x.kk] || kBaru[x.kk]; seqB++; x.atlet_id = uid_('A'); return { atlet_id: x.atlet_id, bib: 'A-' + ('0000' + seqB).slice(-4), nisn: x.nisn, nama_lengkap: x.nama, jenis_kelamin: x.g, tempat_lahir: x.tempat, tanggal_lahir: x.tgl, kontingen_id: kont.kontingen_id, sekolah_nama: x.sekolah, klub_nama: x.klub, kelas_num: x.kelas, jenjang_kode: x.jk, provinsi_asal: x.prov, kota_asal: x.kota, hp_kontak: x.hp, foto_file_id: '', akta_file_id: '', surat_file_id: '', sosmed_file_id: '', status_atlet: 'ACTIVE', created_at: t }; });
  if (aRows.length) { appendT_('TBL_ATLET', aRows); setProp_('SEQ_BIB', seqB); }
  // 4) entri nomor: langsung terverifikasi & lunas (data dari panitia)
  appendT_('TBL_REGISTRASI_ENTRI', plan.map(function (p) { const a = p.a, kont = a._baru ? (kByNama[a.kk] || kBaru[a.kk]) : { kontingen_id: a.kontingen_id }; return { entry_id: uid_('EN'), musim: musim, atlet_id: a.atlet_id, kontingen_id: kont.kontingen_id, event_id: p.ev.event_id, seed_time_entry: p.ms ? fmtWaktu_(p.ms) : '', seed_ms: p.ms, nominal_biaya: o.biaya ? (cfg.biaya_mode === 'PAKET' ? feeEntri_(p.ev, p.idx) : (p.ev.fee_amount || 0)) : 0, status_verifikasi: 'VERIFIED', status_bayar: 'PAID_VERIFIED', bukti_bayar_file_id: '', verified_by: oleh, verified_at: t, catatan_revisi: '', created_at: t }; }));
  delete _MEMO.__jd; bust_('user', 'atlet', 'hasil', 'master');
  audit_(me, 'DAFTAR_MANUAL', 'Entri', plan.length + ' entri, ' + aRows.length + ' atlet baru, ' + kRows.length + ' lembaga baru');
  return { ring: ring };
}
function hManCek_(me, d) { return ok_(manProses_(d.rows, d.opsi, false, me)); }
function hManSimpan_(me, d) {
  const c = cfg_(); if (['PELAKSANAAN', 'SELESAI'].indexOf(c.fase) >= 0 && !(d.opsi || {}).paksaFase) err_('Pelaksanaan sudah dimulai. Pendaftar baru tidak akan masuk start list yang terkunci.');
  const r = manProses_(d.rows, d.opsi, true, me), x = r.ring;
  return ok_(x, x.entri + ' entri tersimpan (' + x.atletBaru + ' atlet baru' + (x.kontBaru ? ', ' + x.kontBaru + ' akun sekolah/klub baru' : '') + (x.nomorBaru ? ', ' + x.nomorBaru + ' nomor lomba baru' : '') + ')' + (x.dup ? '; ' + x.dup + ' entri ganda dilewati' : '') + '.');
}
