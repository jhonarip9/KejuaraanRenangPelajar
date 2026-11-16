/**
 * ============================================================
 * KURASI PUSPRESNAS — Modul penyusun berkas pengajuan kurasi ajang talenta
 * Acuan: Pedoman Pengelolaan Ajang Talenta Peserta Didik (Puspresnas, 2023),
 *        FAQ Kurasi Prestasi (13 dokumen penyelenggara), prasyarat Instrumen 1A
 *        (dokumen standar operasional, struktur kepanitiaan, kualifikasi juri).
 * Data lomba (peserta, sebaran, pemenang, nomor lomba) diambil otomatis dari aplikasi;
 * Super Admin hanya melengkapi data penyelenggara, panitia, juri, dan pendukung.
 * ============================================================
 */
const KUR_MAX = { sc: 30, oc: 60, juri: 60, riwayat: 30, biaya: 15, hadiah: 15, mitra: 30, publikasi: 20, media: 40 };
const KUR_TUGAS = {
  'ketua': 'Memimpin, mengoordinasikan, dan bertanggung jawab atas seluruh penyelenggaraan ajang.',
  'wakil ketua': 'Membantu ketua dan mewakili ketua apabila berhalangan.',
  'sekretaris': 'Mengelola administrasi, persuratan, pendataan peserta, dan dokumentasi kepanitiaan.',
  'bendahara': 'Mengelola anggaran, penerimaan, pengeluaran, dan laporan keuangan secara akuntabel.',
  'koordinator lomba': 'Menyusun dan mengendalikan pelaksanaan teknis lomba, jadwal, serta start list.',
  'koordinator perlombaan': 'Menyusun dan mengendalikan pelaksanaan teknis lomba, jadwal, serta start list.',
  'seksi pendaftaran': 'Melayani pendaftaran, verifikasi berkas, dan pembayaran peserta.',
  'seksi acara': 'Menyusun rundown, upacara pembukaan/penutupan, dan penyerahan penghargaan.',
  'seksi publikasi': 'Menyebarluaskan informasi ajang dan hasil kejuaraan melalui media cetak/elektronik.',
  'seksi dokumentasi': 'Mendokumentasikan pelaksanaan ajang (foto/video) dan sarana prasarana.',
  'seksi perlengkapan': 'Menyiapkan sarana dan prasarana utama serta pendukung ajang.',
  'seksi kesehatan': 'Menyediakan layanan kesehatan dan pertolongan pertama selama ajang.',
  'seksi keamanan': 'Menjaga ketertiban dan keamanan lokasi selama ajang berlangsung.',
  'seksi it': 'Mengelola sistem informasi pendaftaran, start list, hasil live, dan publikasi daring.',
  'seksi konsumsi': 'Menyediakan konsumsi panitia, juri, dan petugas.'
};

// ── Penyimpanan per musim (kunci berawalan _ agar tidak ikut tampil di portal publik) ──
function kurKey_(musim) { return '_kurasi_' + String(musim || cfg_().musim); }
function kurRaw_(musim) { try { return JSON.parse(cfg_()[kurKey_(musim)] || '{}') || {}; } catch (e) { return {}; } }
function kurDefault_() {
  const c = cfg_(), wasit = readT_('TBL_USERS_ROLES').filter(function (u) { return u.role === R.WS && u.status === 'ACTIVE'; });
  let url = c.portal_url || ''; if (!url) { try { url = ScriptApp.getService().getUrl() || ''; } catch (e) { } }
  const pub = [{ judul: 'Portal resmi hasil & daftar juara', url: url }];
  ['ig1', 'ig2', 'yt1', 'yt2'].forEach(function (k) { if (c[k]) pub.push({ judul: (k.charAt(0) === 'i' ? 'Instagram ' : 'YouTube ') + (c[k].match(/[^\/]+\/?$/) || [''])[0].replace(/\/$/, ''), url: c[k] }); });
  return {
    org: { nama: '', jenis: 'Masyarakat', legal_akta: '', legal_sk: '', alamat: '', kota: 'Jakarta', telp: c.kontak_telp || '', email: c.kontak_email || '', web: url, pimpinan: c.ttd_ketua_nama || '', jabatan: c.ttd_ketua_jabatan || 'Ketua', nip: '', no_surat: '', tgl_surat: Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd'), no_sk_panitia: '', no_sk_juri: '', no_sk_pemenang: '', ttd_id: '', cap_id: '' },
    ajang: { nama: String(c.app_name || 'Kejuaraan Renang Pelajar'), subjudul: c.buku_subjudul || '', cabang: 'Renang', bidang: 'Olahraga', bentuk: 'Kompetisi', tingkat: ['Kabupaten/Kota', 'Provinsi', 'Nasional', 'Internasional'].indexOf(c.tingkat_event) >= 0 ? c.tingkat_event : 'Provinsi', metode: 'Luring', tgl_mulai: /^\d{4}-\d{2}-\d{2}$/.test(c.tanggal_mulai || '') ? c.tanggal_mulai : '', tgl_selesai: /^\d{4}-\d{2}-\d{2}$/.test(c.tanggal_selesai || '') ? c.tanggal_selesai : (/^\d{4}-\d{2}-\d{2}$/.test(c.tanggal_mulai || '') ? c.tanggal_mulai : ''), waktu_teks: c.tanggal_teks || '', tempat: c.lokasi || '', edisi: '', tahun_awal: '', frekuensi: 'Tahunan', tahapan: 'Seri penyisihan berdasarkan waktu (timed final): peringkat ditentukan dari catatan waktu seluruh seri pada setiap nomor lomba.', tujuan: 'Mewadahi dan mengembangkan bakat renang peserta didik; menjaring talenta unggul secara adil dan berjenjang; memberikan pengakuan prestasi untuk mendukung karier belajar dan karier profesional; serta menumbuhkan karakter Profil Pelajar Pancasila melalui sportivitas.', aturan: 'World Aquatics dan PB Akuatik Indonesia', catatan_kendala: '' },
    riwayat: [], sc: [], oc: [],
    juri: wasit.map(function (u) { return { nama: u.full_name, peran: 'Wasit Utama (Referee)', lisensi: u.license_number ? 'Lisensi Wasit Renang' : '', no_lisensi: u.license_number || '', instansi: '', wilayah: '', pengalaman: '' }; }),
    biaya: [{ sumber: 'Biaya pendaftaran peserta', ket: 'Dikelola transparan untuk operasional ajang (nirlaba).' }],
    nirlaba: 'Ajang diselenggarakan tidak berorientasi komersial (nirlaba). Seluruh dana digunakan untuk operasional, penghargaan, dan pengembangan ajang.',
    hadiah: [{ peringkat: 'Juara I', bentuk: 'Medali emas dan piagam penghargaan' }, { peringkat: 'Juara II', bentuk: 'Medali perak dan piagam penghargaan' }, { peringkat: 'Juara III', bentuk: 'Medali perunggu dan piagam penghargaan' }, { peringkat: 'Juara umum', bentuk: 'Trofi juara umum sekolah dan klub' }, { peringkat: 'Seluruh peserta', bentuk: 'Sertifikat peserta elektronik' }],
    mitra: [], publikasi: pub, media: [],
    dok: { album: '', link: '' },
    sert: { format: '{EV}.{R}/KRP/{TAHUN}' }
  };
}
function kurData_(musim) {
  const d = kurDefault_(), r = kurRaw_(musim);
  Object.keys(d).forEach(function (k) { if (r[k] === undefined) return; if (Array.isArray(d[k])) d[k] = Array.isArray(r[k]) ? r[k] : d[k]; else if (typeof d[k] === 'object') d[k] = Object.assign({}, d[k], r[k] || {}); else d[k] = r[k]; });
  return d;
}
function kurBersih_(d) { // batasi panjang & jumlah baris, hanya kolom teks
  const t = function (v, n) { return String(v == null ? '' : v).slice(0, n || 400); }, o = kurDefault_();
  ['org', 'ajang', 'dok', 'sert'].forEach(function (g) { Object.keys(o[g]).forEach(function (k) { o[g][k] = t((d[g] || {})[k], k === 'tujuan' || k === 'tahapan' || k === 'catatan_kendala' ? 2000 : 400); }); });
  Object.keys(KUR_MAX).forEach(function (k) {
    const L = Array.isArray(d[k]) ? d[k] : [];
    o[k] = L.slice(0, KUR_MAX[k]).map(function (row) { const r = {}; Object.keys(row || {}).forEach(function (f) { if (/^[a-z_]{1,20}$/.test(f)) r[f] = t(row[f], f === 'pengalaman' || f === 'tugas' ? 600 : 300); }); return r; })
      .filter(function (row) { return Object.keys(row).some(function (f) { return row[f]; }); });
  });
  o.nirlaba = t(d.nirlaba, 1500);
  ['ttd_id', 'cap_id'].forEach(function (k) { if (o.org[k] && !/^[\w-]{10,80}$/.test(o.org[k])) o.org[k] = ''; });
  return o;
}

// ── Statistik otomatis dari data lomba ──
function kurStat_(musim) {
  const cfg = cfg_(); musim = musim || cfg.musim;
  const atl = idx_(readT_('TBL_ATLET'), 'atlet_id'), kont = idx_(readT_('TBL_KONTINGEN'), 'kontingen_id'), evs = idx_(readM_('TBL_MASTER_NOMOR_LOMBA'), 'event_id'), jen = idx_(readM_('TBL_MASTER_JENJANG'), 'kode_jenjang');
  const ents = readT_('TBL_REGISTRASI_ENTRI').filter(function (e) { return e.musim === musim && e.status_verifikasi === 'VERIFIED'; });
  const res = readT_('TBL_RACE_RESULTS').filter(function (r) { return r.musim === musim && r.status_pengesahan === 'SAH'; });
  const S = { atlet: {}, sekolah: {}, klub: {}, kont: {}, kota: {}, prov: {}, jen: {}, nomor: {}, entri: ents.length, putra: 0, putri: 0 };
  ents.forEach(function (e) {
    const a = atl[e.atlet_id]; if (!a) return; const ev = evs[e.event_id] || {};
    const n = S.nomor[e.event_id] || (S.nomor[e.event_id] = { no: ev.event_no, nama: ev.event_name, g: ev.gender, jk: ev.jenjang_kode, peserta: 0, juara: 0 }); n.peserta++;
    if (S.atlet[a.atlet_id]) return; S.atlet[a.atlet_id] = 1; if (a.jenis_kelamin === 'PUTRA') S.putra++; else S.putri++;
    const kota = String(a.kota_asal || (kont[a.kontingen_id] || {}).kota_kabupaten || '-').trim() || '-', prov = String(a.provinsi_asal || (kont[a.kontingen_id] || {}).provinsi || '-').trim() || '-';
    const kk = kota.toUpperCase(); (S.kota[kk] = S.kota[kk] || { nama: kota, prov: prov, n: 0 }).n++;
    const pk = prov.toUpperCase(); (S.prov[pk] = S.prov[pk] || { nama: prov, n: 0, kota: {} }).n++; S.prov[pk].kota[kk] = 1;
    if (a.sekolah_nama) { const sk = nk_(a.sekolah_nama); (S.sekolah[sk] = S.sekolah[sk] || { nama: a.sekolah_nama, kota: kota, n: 0 }).n++; }
    if (a.klub_nama) { const kl = nk_(a.klub_nama); (S.klub[kl] = S.klub[kl] || { nama: a.klub_nama, n: 0 }).n++; }
    S.kont[a.kontingen_id] = 1;
    const j = S.jen[a.jenjang_kode] || (S.jen[a.jenjang_kode] = { nama: (jen[a.jenjang_kode] || {}).nama_jenjang || a.jenjang_kode, putra: 0, putri: 0 }); if (a.jenis_kelamin === 'PUTRA') j.putra++; else j.putri++;
  });
  const win = res.filter(function (r) { return r.medal && r.status_lomba === 'OK' && r.rank_event > 0 && r.rank_event <= 3; }).sort(function (a, b) { return ((evs[a.event_id] || {}).event_no - (evs[b.event_id] || {}).event_no) || a.rank_event - b.rank_event; });
  win.forEach(function (r) { const n = S.nomor[r.event_id]; if (n) n.juara++; });
  const nP = Object.keys(S.prov).length, nK = Object.keys(S.kota).length, tingkat = nP >= 4 ? 'Nasional' : nK >= 4 ? 'Provinsi' : 'Kabupaten/Kota';
  const nomorSah = {}; res.forEach(function (r) { nomorSah[r.event_id] = 1; });
  return {
    musim: musim, atlet: Object.keys(S.atlet).length, entri: S.entri, putra: S.putra, putri: S.putri, kontingen: Object.keys(S.kont).length,
    sekolah: Object.keys(S.sekolah).map(function (k) { return S.sekolah[k]; }).sort(function (a, b) { return b.n - a.n; }),
    klub: Object.keys(S.klub).map(function (k) { return S.klub[k]; }).sort(function (a, b) { return b.n - a.n; }),
    kota: Object.keys(S.kota).map(function (k) { return S.kota[k]; }).sort(function (a, b) { return b.n - a.n; }),
    prov: Object.keys(S.prov).map(function (k) { return { nama: S.prov[k].nama, n: S.prov[k].n, kota: Object.keys(S.prov[k].kota).length }; }).sort(function (a, b) { return b.n - a.n; }),
    jenjang: Object.keys(S.jen).map(function (k) { return Object.assign({ kode: k }, S.jen[k]); }).sort(function (a, b) { return ((jen[a.kode] || {}).urutan || 0) - ((jen[b.kode] || {}).urutan || 0); }),
    nomor: Object.keys(S.nomor).map(function (k) { return Object.assign({ id: k }, S.nomor[k]); }).sort(function (a, b) { return a.no - b.no; }),
    nomorAktif: readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (e) { return e.is_active; }).length, nomorSah: Object.keys(nomorSah).length,
    juara: win.length, tingkatSaran: tingkat, nProv: nP, nKota: nK,
    rasio: S.entri ? Math.round(win.length / S.entri * 1000) / 10 : 0,
    win: win.map(function (r) { const a = atl[r.atlet_id] || {}, ev = evs[r.event_id] || {}; return { eid: r.event_id, no: ev.event_no, nomor: evJudul_(ev, jen).replace(/^#\d+ /, ''), rank: r.rank_event, medal: r.medal, nama: a.nama_lengkap || '', sk: a.sekolah_nama || '', kl: a.klub_nama || '', kota: a.kota_asal || '', prov: a.provinsi_asal || '', waktu: r.final_time, baru: r.is_new_record === 1, aid: r.atlet_id, kelas: a.kelas_num, g: a.jenis_kelamin }; }),
    selesai: cfg.fase === 'SELESAI' || (Object.keys(nomorSah).length > 0 && Object.keys(nomorSah).length >= Object.keys(S.nomor).length)
  };
}

// ── Kesiapan 13 dokumen penyelenggara (FAQ Kurasi) + prasyarat Instrumen 1A ──
function kurSiap_(d, st) {
  const pan = d.oc.map(function (x) { return String(x.jabatan || '').toLowerCase(); }), ada = function (j) { return pan.some(function (p) { return p.indexOf(j) === 0; }); };
  const inti = ['ketua', 'sekretaris', 'bendahara'].every(ada) && pan.some(function (p) { return p.indexOf('lomba') >= 0 || p.indexOf('pertandingan') >= 0; });
  const ocN = {}; d.oc.forEach(function (x) { if (/^(ketua|sekretaris|bendahara)|lomba|pertandingan/i.test(x.jabatan || '')) ocN[nk_(x.nama)] = (ocN[nk_(x.nama)] || 0) + 1; });
  const rangkap = Object.keys(ocN).some(function (k) { return k && ocN[k] > 1; });
  const juriWil = {}; d.juri.forEach(function (j) { if (j.wilayah) juriWil[nk_(j.wilayah)] = 1; }); const juriInst = {}; d.juri.forEach(function (j) { if (j.instansi) juriInst[nk_(j.instansi)] = 1; });
  const juriOk = d.juri.length >= 3 && d.juri.every(function (j) { return j.nama && (j.lisensi || j.no_lisensi) && j.pengalaman; });
  const o = d.org, a = d.ajang, L = [];
  const add = function (no, nama, ok, info, berkas, wajib) { L.push({ no: no, nama: nama, st: ok === true ? 'ok' : ok === 'warn' ? 'warn' : 'no', info: info, berkas: berkas, wajib: !!wajib }); };
  add(1, 'Pedoman / Juknis penyelenggaraan', !!(a.nama && a.tujuan && st.nomorAktif) || 'warn', 'Dibuat otomatis dari data nomor lomba, persyaratan, dan aturan teknis.', '02 Juknis', true);
  add(2, 'Dokumen kepanitiaan (SK/Surat Tugas)', d.sc.length && inti && !rangkap ? true : (d.oc.length ? 'warn' : false), !d.sc.length ? 'Isi Panitia Pengarah (SC).' : !inti ? 'Panitia Penyelenggara wajib memuat Ketua, Sekretaris, Bendahara, dan Koordinator Lomba.' : rangkap ? 'Ketua, sekretaris, bendahara, dan koordinator lomba harus orang berbeda.' : 'SC & OC lengkap dengan uraian tugas.', '03 SK Panitia', true);
  add(3, 'Kualifikasi juri', juriOk && Object.keys(juriWil).length >= 2 ? true : d.juri.length ? 'warn' : false, !d.juri.length ? 'Isi daftar juri/wasit.' : !juriOk ? 'Minimal 3 juri, masing-masing dengan lisensi/sertifikat dan pengalaman.' : Object.keys(juriWil).length < 2 ? 'Keterwakilan: juri sebaiknya dari beberapa wilayah/instansi.' : d.juri.length + ' juri dari ' + Object.keys(juriWil).length + ' wilayah, ' + Object.keys(juriInst).length + ' instansi.', '04 SK & Kualifikasi Juri', true);
  add(4, 'Informasi tingkatan ajang', a.tingkat && levelOk_(a.tingkat, st) ? true : 'warn', 'Diklaim ' + (a.tingkat || '-') + '. Data peserta: ' + st.nProv + ' provinsi, ' + st.nKota + ' kab/kota → memenuhi tingkat ' + st.tingkatSaran + '.', '05 Laporan Kepesertaan');
  add(5, 'Data lengkap peserta & peta sebaran', st.atlet > 0 || false, st.atlet + ' peserta terverifikasi, ' + st.entri + ' entri, ' + st.sekolah.length + ' sekolah.', '05 Laporan Kepesertaan + Excel');
  add(6, 'Konsistensi frekuensi penyelenggaraan', d.riwayat.length >= 1 && a.frekuensi ? true : 'warn', d.riwayat.length ? d.riwayat.length + ' penyelenggaraan sebelumnya tercatat.' : 'Tambahkan riwayat penyelenggaraan (edisi sebelumnya) bila ada.', '07 Laporan Pelaksanaan');
  add(7, 'Bukti publikasi juara secara online', d.publikasi.some(function (p) { return /^https?:\/\//.test(p.url || ''); }) || false, 'Tautan portal hasil/daftar juara yang dapat diakses publik.', '06 SK Pemenang + 07');
  add(8, 'Dokumentasi pelaksanaan & sarana prasarana', d.dok.album || d.dok.link ? true : 'warn', d.dok.album ? 'Foto dari album "' + d.dok.album + '".' : d.dok.link ? 'Tautan album dokumentasi.' : 'Pilih album Dokumentasi atau isi tautan album Drive.', '07 Laporan Pelaksanaan');
  add(9, 'Sumber pembiayaan (keberlanjutan)', d.biaya.length ? true : false, d.biaya.length + ' sumber dana.', '07 Laporan Pelaksanaan');
  add(10, 'Penghargaan/apresiasi pemenang', d.hadiah.length ? true : false, d.hadiah.length + ' bentuk penghargaan.', '02 Juknis + 07');
  add(11, 'Bukti liputan media', d.media.length ? true : 'warn', d.media.length ? d.media.length + ' liputan.' : 'Tambahkan tautan liputan media (berita daring, TV, media sosial resmi).', '07 Laporan Pelaksanaan');
  add(12, 'Keterlibatan mitra', d.mitra.length ? true : 'warn', d.mitra.length ? d.mitra.length + ' mitra.' : 'Tambahkan mitra/pendukung (dinas, federasi, sponsor) bila ada.', '07 Laporan Pelaksanaan');
  add(13, 'Data pemenang & sertifikat juara', st.juara > 0 || false, st.juara + ' juara dari ' + st.nomorSah + ' nomor yang disahkan.', '06 SK Pemenang + 08 Rekap Sertifikat');
  const prasyarat = L.slice(0, 3).every(function (x) { return x.st === 'ok'; }), ident = !!(o.nama && o.pimpinan && o.alamat && (o.legal_akta || o.legal_sk || o.jenis !== 'Masyarakat'));
  return { list: L, prasyarat: prasyarat, identitas: ident, selesai: st.selesai, skor: Math.round(L.reduce(function (s, x) { return s + (x.st === 'ok' ? 1 : x.st === 'warn' ? 0.5 : 0); }, 0) / L.length * 100) };
}
function levelOk_(t, st) { const r = { 'Kabupaten/Kota': 0, 'Provinsi': 1, 'Nasional': 2, 'Internasional': 3 }; return (r[t] || 0) <= (r[st.tingkatSaran] || 0); }

// ── Rute ──
function hKurGet_(me, d) {
  const musim = String(d.musim || cfg_().musim), data = kurData_(musim), st = kurStat_(musim);
  const albums = {}; readT_('TBL_GALERI').forEach(function (g) { albums[g.event_label || 'Umum'] = (albums[g.event_label || 'Umum'] || 0) + (g.tipe === 'LINK' ? 0 : 1); });
  const arsip = readT_('TBL_EVENT_ARCHIVE_LOG').map(function (a) { return { tahun: a.season_name, peserta: a.total_atlet }; });
  return ok_({ musim: musim, data: data, stat: Object.assign({}, st, { win: undefined, sekolah: st.sekolah.slice(0, 10), kota: st.kota.slice(0, 15) }), siap: kurSiap_(data, st), albums: Object.keys(albums).map(function (k) { return { nama: k, n: albums[k] }; }), arsip: arsip, fase: cfg_().fase });
}
function hKurSimpan_(me, d) {
  const musim = String(d.musim || cfg_().musim), o = kurBersih_(d.data || {}), js = JSON.stringify(o);
  if (js.length > 45000) err_('Data kurasi terlalu panjang. Ringkas teks pengalaman/uraian.');
  cfgSet_(me, (function () { const x = {}; x[kurKey_(musim)] = js; return x; })());
  audit_(me, 'KURASI_SIMPAN', 'Kurasi', musim); const st = kurStat_(musim);
  return ok_({ siap: kurSiap_(o, st) }, 'Data kurasi tersimpan.');
}
function hKurImg_(me, d) {
  const f = d.file || {}, t = d.t === 'cap' ? 'cap' : 'ttd'; if (String(f.mime || '').indexOf('image/') !== 0) err_('Unggah gambar PNG/JPG (latar transparan lebih baik).');
  const file = DriveApp.getFolderById(prop_('FOLDER_DOKUMEN')).createFile(cekFile_(f, t === 'cap' ? 'cap/stempel' : 'tanda tangan').setName('KURASI_' + t.toUpperCase() + '_' + Date.now()));
  const musim = String(d.musim || cfg_().musim), data = kurBersih_(kurData_(musim)), old = data.org[t + '_id'];
  data.org[t + '_id'] = file.getId(); cfgSet_(me, (function () { const x = {}; x[kurKey_(musim)] = JSON.stringify(data); return x; })());
  if (old) { try { DriveApp.getFileById(old).setTrashed(true); } catch (e) { } }
  audit_(me, 'KURASI_GAMBAR', 'Kurasi', t); return ok_({ id: file.getId(), t: t }, t === 'cap' ? 'Cap/stempel tersimpan.' : 'Tanda tangan tersimpan.');
}
const KUR_DOK = {
  '00': ['Daftar_Periksa_Kesiapan', kurHtmlCek_], '01': ['Surat_Permohonan_Kurasi', kurHtmlSurat_], '02': ['Petunjuk_Teknis_Penyelenggaraan', kurHtmlJuknis_],
  '03': ['SK_Panitia_Penyelenggara', kurHtmlSKPanitia_], '04': ['SK_Juri_Kualifikasi_Pakta_Integritas', kurHtmlJuri_], '05': ['Laporan_Kepesertaan_Sebaran', kurHtmlPeserta_],
  '06': ['SK_Penetapan_Pemenang', kurHtmlPemenang_], '07': ['Laporan_Pelaksanaan', kurHtmlLaporan_], '08': ['Rekap_Sertifikat_Juara', kurHtmlRekapSert_]
};
function kurCtx_(musim) { const d = kurData_(musim), st = kurStat_(musim); return { d: d, st: st, c: cfg_(), musim: musim, img: {} }; }
function hKurBuat_(me, d) {
  const musim = String(d.musim || cfg_().musim), j = String(d.jenis || ''), X = kurCtx_(musim), nmA = String(X.d.ajang.nama || 'Ajang').replace(/[^\w]+/g, '_').slice(0, 40);
  if (j === 'ZIP') {
    const blobs = Object.keys(KUR_DOK).map(function (k) { return pdf_(KUR_DOK[k][1](X), k + '_' + KUR_DOK[k][0]); });
    const zip = Utilities.zip(blobs, 'Berkas_Kurasi_' + nmA + '_' + musim + '.zip');
    audit_(me, 'KURASI_ZIP', 'Kurasi', musim); return ok_({ name: zip.getName(), mime: 'application/zip', b64: Utilities.base64Encode(zip.getBytes()) }, 'Paket berkas kurasi siap diunduh.');
  }
  const k = KUR_DOK[j]; if (!k) err_('Jenis berkas tidak dikenal.');
  const blob = pdf_(k[1](X), j + '_' + k[0] + '_' + musim); audit_(me, 'KURASI_BERKAS', 'Kurasi', j);
  return ok_({ name: blob.getName(), mime: 'application/pdf', b64: Utilities.base64Encode(blob.getBytes()) });
}
function hKurSert_(me, d) { // sertifikat juara, dibagi per 25 lembar agar konversi PDF tidak terlalu berat
  const musim = String(d.musim || cfg_().musim), X = kurCtx_(musim), per = 25, bag = Math.max(0, toInt_(d.bag, 0)), W = X.st.win, tot = Math.ceil(W.length / per);
  if (!W.length) err_('Belum ada juara yang disahkan.'); if (bag >= tot) err_('Bagian sertifikat tidak ada.');
  const L = W.slice(bag * per, bag * per + per), html = kurPage_(X, L.map(function (w, i) { return (i ? '<div class="pb"></div>' : '') + kurSertHtml_(X, w); }).join(''), true);
  const blob = pdf_(html, 'Sertifikat_Juara_' + musim + '_bagian_' + (bag + 1)); audit_(me, 'KURASI_SERTIFIKAT', 'Kurasi', 'bagian ' + (bag + 1));
  return ok_({ name: blob.getName(), mime: 'application/pdf', b64: Utilities.base64Encode(blob.getBytes()), total: tot, n: L.length });
}
function hKurData_(me, d) { // data mentah untuk Excel lampiran kurasi
  const musim = String(d.musim || cfg_().musim), st = kurStat_(musim), X = { d: kurData_(musim), st: st, c: cfg_(), musim: musim };
  const atl = readT_('TBL_ATLET'), byA = idx_(atl, 'atlet_id'), evs = idx_(readM_('TBL_MASTER_NOMOR_LOMBA'), 'event_id'), jen = idx_(readM_('TBL_MASTER_JENJANG'), 'kode_jenjang'), kont = idx_(readT_('TBL_KONTINGEN'), 'kontingen_id');
  const ents = readT_('TBL_REGISTRASI_ENTRI').filter(function (e) { return e.musim === musim && e.status_verifikasi === 'VERIFIED'; }), by = {};
  ents.forEach(function (e) { (by[e.atlet_id] = by[e.atlet_id] || []).push(e); });
  const peserta = Object.keys(by).map(function (id, i) { const a = byA[id] || {}, k = kont[a.kontingen_id] || {}; return { 'No': i + 1, 'Nama Peserta': a.nama_lengkap, 'NISN': a.nisn, 'Jenis Kelamin': a.jenis_kelamin === 'PUTRA' ? 'Laki-laki' : 'Perempuan', 'Tempat Lahir': a.tempat_lahir, 'Tanggal Lahir': a.tanggal_lahir, 'Kelas': kelasLabel_(a.kelas_num), 'Kelompok': (jen[a.jenjang_kode] || {}).nama_jenjang || a.jenjang_kode, 'Sekolah': a.sekolah_nama, 'Klub': a.klub_nama, 'Kab/Kota': a.kota_asal || k.kota_kabupaten, 'Provinsi': a.provinsi_asal || k.provinsi, 'Nomor Lomba': by[id].map(function (e) { const ev = evs[e.event_id] || {}; return '#' + ev.event_no + ' ' + ev.event_name; }).join('; ') }; });
  const pemenang = st.win.map(function (w, i) { return { 'No': i + 1, 'Nomor Sertifikat': sertNo_(X, w), 'Nomor Lomba': '#' + w.no + ' ' + w.nomor, 'Peringkat': 'Juara ' + w.rank, 'Medali': w.medal, 'Nama': w.nama, 'Sekolah': w.sk, 'Klub': w.kl, 'Kab/Kota': w.kota, 'Provinsi': w.prov, 'Catatan Waktu': w.waktu, 'Rekor Baru': w.baru ? 'Ya' : '' }; });
  const sebaran = st.kota.map(function (k) { return { 'Kab/Kota': k.nama, 'Provinsi': k.prov, 'Jumlah Peserta': k.n }; });
  const juri = X.d.juri.map(function (j, i) { return { 'No': i + 1, 'Nama': j.nama, 'Peran': j.peran, 'Lisensi/Sertifikat': j.lisensi, 'No. Lisensi': j.no_lisensi, 'Instansi': j.instansi, 'Asal Wilayah': j.wilayah, 'Pengalaman': j.pengalaman }; });
  return ok_({ musim: musim, peserta: peserta, pemenang: pemenang, sebaran: sebaran, juri: juri });
}

// ============================================================
// TEMPLATE BERKAS (tabel + gaya inline agar rapi di konverter PDF Google)
// ============================================================
const KC = { navy: '#0A3D62', navy2: '#13507D', aqua: '#1B7F9E', gold: '#D4A017', ink: '#13202E', mut: '#5B6B7B', ln: '#C9D6E2', soft: '#EEF4F9', gold2: '#FFF6DB' };
function kurCss_() {
  return '<style>@page{margin:16mm 15mm}body{font-family:Arial,Helvetica,sans-serif;color:' + KC.ink + ';font-size:11px;line-height:1.5;margin:0}table{border-collapse:collapse;font-size:11px}' +
    '.pb{page-break-before:always}.c{text-align:center}.r{text-align:right}.j{text-align:justify}.mut{color:' + KC.mut + '}.b{font-weight:bold}' +
    '.t{width:100%;margin:6px 0 12px}.t th{background:' + KC.navy + ';color:#fff;font-size:10px;padding:6px 7px;text-align:left;border:1px solid ' + KC.navy + '}.t td{border:1px solid ' + KC.ln + ';padding:5px 7px;font-size:10.5px;vertical-align:top}.t tr.z td{background:' + KC.soft + '}' +
    '.kv{width:100%;margin:4px 0 12px}.kv td{padding:3px 6px;vertical-align:top;font-size:11px}.kv td.k{width:34%;color:' + KC.mut + '}' +
    'h1{font-size:20px;margin:0}h2{font-size:13.5px;color:' + KC.navy + ';margin:18px 0 6px;padding:4px 0 4px 9px;border-left:4px solid ' + KC.gold + '}h3{font-size:11.5px;margin:12px 0 4px;color:' + KC.navy2 + '}' +
    'ol,ul{margin:4px 0 8px 18px;padding:0}li{margin:2px 0}p{margin:5px 0}</style>';
}
function kurImg_(X, id, maxKB) { // gambar Drive → data URI (memakai thumbnail bila besar), dicache per dokumen
  if (!id) return ''; if (X.img[id] !== undefined) return X.img[id];
  let u = ''; try { const f = DriveApp.getFileById(id); let b = f.getBlob(); if (b.getBytes().length > (maxKB || 400) * 1024) { try { b = f.getThumbnail(); } catch (e) { } }
    if (b && b.getBytes().length < 1500000) u = 'data:' + (b.getContentType() || 'image/png') + ';base64,' + Utilities.base64Encode(b.getBytes()); } catch (e) { u = ''; }
  X.img[id] = u; return u;
}
function kurLogos_(X) { return logoList_().filter(function (x) { return x.acara === 1 || x.hasil === 1; }).slice(0, 6).map(function (x) { return kurImg_(X, x.id, 250); }).filter(Boolean); }
function kurPage_(X, body) { return '<!DOCTYPE html><html><head><meta charset="utf-8">' + kurCss_() + '</head><body>' + body + '</body></html>'; }
function kurKop_(X) { // kop surat penyelenggara
  const o = X.d.org, lg = kurLogos_(X);
  return '<table style="width:100%;margin:0 0 4px 0"><tr>' + (lg[0] ? '<td style="width:80px;vertical-align:middle"><img src="' + lg[0] + '" height="64"></td>' : '') +
    '<td style="text-align:center;vertical-align:middle"><div style="font-size:15px;font-weight:bold;color:' + KC.navy + ';letter-spacing:.4px">' + esc_(String(o.nama || X.d.ajang.nama).toUpperCase()) + '</div>' +
    (o.legal_akta || o.legal_sk ? '<div style="font-size:9px;color:' + KC.mut + '">' + esc_([o.legal_akta, o.legal_sk].filter(Boolean).join(' • ')) + '</div>' : '') +
    '<div style="font-size:9.5px">' + esc_(o.alamat) + '</div><div style="font-size:9.5px">' + esc_([o.telp ? 'Telp. ' + o.telp : '', o.email, o.web ? 'Laman: ' + String(o.web).slice(0, 60) : ''].filter(Boolean).join(' | ')) + '</div></td>' +
    (lg[1] ? '<td style="width:80px;vertical-align:middle;text-align:right"><img src="' + lg[1] + '" height="64"></td>' : '') + '</tr></table>' +
    '<div style="border-top:3px solid ' + KC.navy + ';margin:0"></div><div style="border-top:1px solid ' + KC.gold + ';margin:2px 0 12px 0"></div>';
}
function kurSampul_(X, no, judul, sub) { // halaman sampul berkas
  const a = X.d.ajang, o = X.d.org, lg = kurLogos_(X);
  return '<table style="width:100%;height:100%"><tr><td style="background:' + KC.navy + ';padding:26px 28px;color:#fff">' +
    '<div style="font-size:10px;letter-spacing:2px;color:' + KC.gold + ';font-weight:bold">BERKAS PENGAJUAN KURASI AJANG TALENTA • PUSAT PRESTASI NASIONAL</div>' +
    '<div style="font-size:12px;margin-top:4px;color:#CFE3F1">Dokumen ' + no + '</div></td></tr>' +
    '<tr><td style="padding:46px 28px 10px 28px">' + (lg.length ? '<div>' + lg.map(function (u) { return '<img src="' + u + '" height="54" style="margin-right:12px">'; }).join('') + '</div>' : '') +
    '<div style="font-size:30px;font-weight:bold;color:' + KC.navy + ';margin-top:34px;line-height:1.15">' + esc_(judul) + '</div>' +
    '<div style="width:90px;border-top:5px solid ' + KC.gold + ';margin:14px 0"></div>' +
    '<div style="font-size:17px;font-weight:bold">' + esc_(String(a.nama).toUpperCase()) + '</div>' + (a.subjudul ? '<div style="font-size:14px;color:' + KC.navy2 + ';font-weight:bold">' + esc_(String(a.subjudul).toUpperCase()) + '</div>' : '') +
    '<div style="font-size:12px;margin-top:8px;color:' + KC.mut + '">' + esc_(sub || '') + '</div>' +
    '<table class="kv" style="margin-top:40px;width:70%">' + [['Cabang / Bidang', a.cabang + ' / ' + a.bidang], ['Bentuk ajang', a.bentuk], ['Tingkat', a.tingkat], ['Waktu', kurWaktu_(X)], ['Tempat', a.tempat], ['Penyelenggara', o.nama]].map(function (r) { return '<tr><td class="k">' + r[0] + '</td><td><b>' + esc_(r[1]) + '</b></td></tr>'; }).join('') + '</table>' +
    '</td></tr><tr><td style="padding:40px 28px 0 28px;font-size:9.5px;color:' + KC.mut + '">Disusun ' + esc_(tglID_(o.tgl_surat)) + ' • Musim ' + esc_(X.musim) + '</td></tr></table>';
}
function kurWaktu_(X) { const a = X.d.ajang; if (a.tgl_mulai) return tglID_(a.tgl_mulai) + (a.tgl_selesai && a.tgl_selesai !== a.tgl_mulai ? ' s.d. ' + tglID_(a.tgl_selesai) : ''); return a.waktu_teks || X.c.tanggal_teks || '-'; }
function tglID_(s) { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(s || '')); if (!m) return String(s || ''); const B = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']; return Number(m[3]) + ' ' + B[Number(m[2]) - 1] + ' ' + m[1]; }
function kurTtd_(X, opts) { // blok tanda tangan pimpinan (gambar ttd & cap bila diunggah)
  opts = opts || {}; const o = X.d.org, ttd = kurImg_(X, o.ttd_id, 300), cap = kurImg_(X, o.cap_id, 300);
  return '<table style="width:100%;margin-top:22px"><tr><td style="width:52%"></td><td style="text-align:left;font-size:11px">' + esc_(o.kota || 'Jakarta') + ', ' + esc_(tglID_(o.tgl_surat)) + '<br>' + esc_(opts.jab || o.jabatan || 'Ketua') + (opts.lembaga === false ? '' : '<br>' + esc_(o.nama)) +
    '<table style="margin:4px 0"><tr>' + (cap ? '<td style="padding:0"><img src="' + cap + '" height="78"></td>' : '') + '<td style="padding:0;height:74px;vertical-align:middle">' + (ttd ? '<img src="' + ttd + '" height="62">' : '<br><br><br>') + '</td></tr></table>' +
    '<b><u>' + esc_(o.pimpinan || '..............................') + '</u></b>' + (o.nip ? '<br>' + esc_(o.nip) : '') + '</td></tr></table>';
}
function kurT_(head, rows, widths) {
  return '<table class="t"><tr>' + head.map(function (h, i) { return '<th' + (widths && widths[i] ? ' style="width:' + widths[i] + '"' : '') + '>' + h + '</th>'; }).join('') + '</tr>' +
    (rows.length ? rows.map(function (r, i) { return '<tr' + (i % 2 ? ' class="z"' : '') + '>' + r.map(function (c) { return '<td>' + (c == null ? '' : c) + '</td>'; }).join('') + '</tr>'; }).join('') : '<tr><td colspan="' + head.length + '" class="mut c">Belum ada data.</td></tr>') + '</table>';
}
function kurKV_(rows) { return '<table class="kv">' + rows.filter(function (r) { return r[1] !== undefined; }).map(function (r) { return '<tr><td class="k">' + r[0] + '</td><td>: ' + (r[2] ? r[1] : esc_(r[1] || '-')) + '</td></tr>'; }).join('') + '</table>'; }
function kurBar_(n, max, w) { const p = max ? Math.max(2, Math.round(n / max * (w || 100))) : 0; return '<table style="width:100%"><tr><td style="padding:0;width:' + p + '%;background:' + KC.aqua + ';height:9px"></td><td style="padding:0 0 0 5px;font-size:9.5px;width:' + (100 - p) + '%">' + n + '</td></tr></table>'; }
function kurKpi_(L) { return '<table style="width:100%;margin:8px 0 12px"><tr>' + L.map(function (x) { return '<td style="width:' + Math.floor(100 / L.length) + '%;padding:0 4px 0 0"><div style="border:1px solid ' + KC.ln + ';border-top:4px solid ' + (x[2] || KC.navy) + ';padding:8px 10px"><div style="font-size:9px;color:' + KC.mut + ';letter-spacing:.5px">' + x[0] + '</div><div style="font-size:19px;font-weight:bold;color:' + KC.navy + '">' + x[1] + '</div></div></td>'; }).join('') + '</tr></table>'; }
function kurLembaga_(X) { return esc_(X.d.org.nama || '[Nama Lembaga Penyelenggara]'); }
function kurAjang_(X) { const a = X.d.ajang; return esc_(a.nama + (a.subjudul ? ' ' + a.subjudul : '')); }
function kurDasar_(X) {
  const o = X.d.org, L = ['Undang-Undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;', 'Undang-Undang Nomor 11 Tahun 2022 tentang Keolahragaan;', 'Peraturan Pemerintah Nomor 17 Tahun 2010 tentang Pengelolaan dan Penyelenggaraan Pendidikan sebagaimana telah diubah dengan Peraturan Pemerintah Nomor 66 Tahun 2010;', 'Peraturan Menteri Pendidikan Nasional Nomor 34 Tahun 2006 tentang Pembinaan Prestasi Peserta Didik yang Memiliki Potensi Kecerdasan dan/atau Bakat Istimewa;', 'Peraturan Menteri Pendidikan Nasional Nomor 39 Tahun 2008 tentang Pembinaan Kesiswaan;', 'Pedoman Pengelolaan Ajang Talenta Peserta Didik, Pusat Prestasi Nasional (2023);'];
  if (o.legal_akta) L.push('Akta Pendirian ' + o.legal_akta + ';'); if (o.legal_sk) L.push(o.legal_sk + ';');
  return L;
}
function kurOl_(L) { return '<ol>' + L.map(function (x) { return '<li class="j">' + x + '</li>'; }).join('') + '</ol>'; }
function sertNo_(X, w) { const f = (X.d.sert && X.d.sert.format) || '{EV}.{R}/KRP/{TAHUN}'; return f.replace(/\{EV\}/g, ('00' + w.no).slice(-3)).replace(/\{R\}/g, w.rank).replace(/\{TAHUN\}/g, String(X.musim).replace(/[^\w]/g, '')).replace(/\{MUSIM\}/g, X.musim); }
function romawi_(n) { return ['', 'I', 'II', 'III'][n] || n; }

// ── 00 Daftar periksa kesiapan ──
function kurHtmlCek_(X) {
  const s = kurSiap_(X.d, X.st), ic = { ok: '<b style="color:#1E8E5A">✓ Siap</b>', warn: '<b style="color:#B26A00">! Lengkapi</b>', no: '<b style="color:#C0392B">✕ Belum</b>' };
  return kurPage_(X, kurKop_(X) + '<div class="c"><h1 style="color:' + KC.navy + '">DAFTAR PERIKSA KESIAPAN KURASI</h1><div class="mut">' + kurAjang_(X) + ' • Musim ' + esc_(X.musim) + '</div></div>' +
    kurKpi_([['KESIAPAN', s.skor + '%', KC.gold], ['PESERTA', X.st.atlet], ['PROVINSI / KAB-KOTA', X.st.nProv + ' / ' + X.st.nKota], ['TINGKAT TERPENUHI', X.st.tingkatSaran, KC.aqua]]) +
    (s.prasyarat ? '' : '<p style="background:#FDECEA;border-left:4px solid #C0392B;padding:8px 10px"><b>Prasyarat Instrumen 1A belum lengkap.</b> Pedoman/juknis, struktur kepanitiaan, dan kualifikasi juri wajib terpenuhi; jika tidak, ajang dinilai rendah dan tidak memperoleh predikat bintang.</p>') +
    (X.st.selesai ? '' : '<p style="background:#FFF4DB;border-left:4px solid #B26A00;padding:8px 10px">Kurasi diajukan <b>setelah ajang selesai seluruhnya</b>. Masih ada nomor lomba yang belum disahkan.</p>') +
    '<h2>Komponen dokumen penyelenggara (FAQ Kurasi Puspresnas)</h2>' + kurT_(['No', 'Komponen', 'Status', 'Keterangan', 'Berkas'], s.list.map(function (x) { return [x.no, esc_(x.nama) + (x.wajib ? ' <span style="color:' + KC.gold + '">★</span>' : ''), ic[x.st], esc_(x.info), esc_(x.berkas)]; }), ['5%', '27%', '11%', '39%', '18%']) +
    '<p class="mut" style="font-size:9.5px">★ Prasyarat Instrumen 1A. Aspek penilaian kurator: kebermanfaatan, tingkat persaingan, kepesertaan, orientasi penyelenggaraan (nirlaba), dan kewajaran. Predikat: Bintang 5 (85–100), 4 (70–<85), 3 (55–<70), 2 (40–<55), 1 (<40). Daftar periksa ini alat bantu internal dan bukan penilaian resmi Puspresnas.</p>' +
    '<h2>Langkah pengajuan</h2>' + kurOl_(['Pastikan seluruh nomor lomba telah disahkan dan daftar juara dipublikasikan secara daring.', 'Lengkapi berkas 01–08 di modul ini, cetak/tandatangani bila diperlukan, lalu pindai ulang yang bertanda tangan basah.', 'Masuk ke aplikasi Kurasi Prestasi Puspresnas sebagai operator pengusul (penyelenggara), pilih pengajuan kurasi ajang (Instrumen 1A), isi formulir, dan unggah berkas sesuai komponen.', 'Pantau status: Disetujui (lanjut ke kurator), Direvisi (perbaiki dalam 2×24 jam), atau Ditolak (ajukan ulang).', 'Hasil dan predikat bintang diumumkan di SIMT dan dikirim ke email pengusul. Setelah ajang terkurasi, sekolah peserta dapat mengklaim prestasi melalui operator sekolah.']));
}
// ── 01 Surat permohonan ──
function kurHtmlSurat_(X) {
  const o = X.d.org, a = X.d.ajang, st = X.st;
  return kurPage_(X, kurKop_(X) + '<table style="width:100%"><tr><td style="vertical-align:top">' + kurKV_([['Nomor', o.no_surat || '....../......./' + X.musim], ['Lampiran', '1 (satu) berkas'], ['Perihal', '<b>Permohonan Kurasi Ajang Talenta ' + kurAjang_(X) + '</b>', 1]]) + '</td><td class="r" style="vertical-align:top;width:35%">' + esc_(o.kota || 'Jakarta') + ', ' + esc_(tglID_(o.tgl_surat)) + '</td></tr></table>' +
    '<p>Yth.<br><b>Kepala Pusat Prestasi Nasional</b><br>Kementerian Pendidikan Dasar dan Menengah<br>di Jakarta</p>' +
    '<p class="j">Dengan hormat,<br>Dalam rangka mendukung Manajemen Talenta Nasional serta memberikan pengakuan atas prestasi peserta didik, ' + kurLembaga_(X) + ' telah menyelenggarakan <b>' + kurAjang_(X) + '</b> sebagai ajang talenta bidang ' + esc_(a.bidang.toLowerCase()) + ' cabang ' + esc_(a.cabang.toLowerCase()) + ' dengan rincian sebagai berikut:</p>' +
    kurKV_([['Nama ajang', kurAjang_(X), 1], ['Bidang / cabang', a.bidang + ' / ' + a.cabang], ['Bentuk ajang', a.bentuk], ['Tingkat', a.tingkat], ['Metode', a.metode], ['Waktu pelaksanaan', kurWaktu_(X)], ['Tempat', a.tempat], ['Penyelenggaraan ke-', a.edisi || '-'], ['Frekuensi', a.frekuensi], ['Jumlah peserta', st.atlet + ' peserta didik (' + st.entri + ' entri) dari ' + st.sekolah.length + ' satuan pendidikan'], ['Sebaran peserta', st.nKota + ' kabupaten/kota di ' + st.nProv + ' provinsi'], ['Jumlah nomor lomba', st.nomor.length + ' nomor (' + st.juara + ' juara ditetapkan)']]) +
    '<p class="j">Sehubungan dengan hal tersebut, kami mengajukan permohonan <b>kurasi ajang talenta</b> atas penyelenggaraan ajang dimaksud melalui aplikasi kurasi Pusat Prestasi Nasional, dengan melampirkan dokumen pendukung sebagai berikut:</p>' +
    kurOl_(['Petunjuk Teknis Penyelenggaraan;', 'Surat Keputusan Panitia Penyelenggara beserta uraian tugas;', 'Surat Keputusan Dewan Juri, daftar kualifikasi juri, dan pakta integritas juri;', 'Laporan kepesertaan dan peta sebaran asal peserta;', 'Surat Keputusan Penetapan Pemenang beserta daftar juara;', 'Laporan pelaksanaan (dokumentasi sarana prasarana, pembiayaan, penghargaan, publikasi, liputan media, kemitraan, dan keberlanjutan);', 'Rekapitulasi sertifikat juara.']) +
    '<p class="j">Kami menyatakan bahwa seluruh data dan dokumen yang disampaikan adalah benar dan dapat dipertanggungjawabkan. Atas perhatian dan kerja sama Bapak/Ibu, kami sampaikan terima kasih.</p>' + kurTtd_(X));
}
// ── 02 Juknis ──
function kurHtmlJuknis_(X) {
  const a = X.d.ajang, c = X.c, st = X.st, jen = readM_('TBL_MASTER_JENJANG').sort(function (x, y) { return x.urutan - y.urutan; }), evs = readM_('TBL_MASTER_NOMOR_LOMBA').filter(function (e) { return e.is_active; }).sort(function (x, y) { return x.event_no - y.event_no; });
  const fee = evs.map(function (e) { return e.fee_amount; }).filter(Boolean), feeTxt = fee.length ? (Math.min.apply(null, fee) === Math.max.apply(null, fee) ? 'Rp' + Number(fee[0]).toLocaleString('id-ID') : 'Rp' + Math.min.apply(null, fee).toLocaleString('id-ID') + '–Rp' + Math.max.apply(null, fee).toLocaleString('id-ID')) + ' per nomor' : '-';
  const byJ = {}; evs.forEach(function (e) { (byJ[e.jenjang_kode] = byJ[e.jenjang_kode] || []).push(e); });
  let b = kurSampul_(X, '02', 'PETUNJUK TEKNIS PENYELENGGARAAN', 'Acuan penyelenggaraan, kepesertaan, teknis lomba, penjurian, dan penghargaan') + '<div class="pb"></div>';
  b += '<h2>BAB I — PENDAHULUAN</h2><h3>A. Latar Belakang</h3><p class="j">' + kurAjang_(X) + ' merupakan wadah aktualisasi prestasi talenta peserta didik di bidang ' + esc_(a.bidang.toLowerCase()) + ', khususnya cabang ' + esc_(a.cabang.toLowerCase()) + '. Ajang ini diselenggarakan secara terbuka, berjenjang, dan terukur untuk menjaring talenta unggul, membangun sportivitas, serta memberikan pengakuan prestasi yang mendukung karier belajar dan karier profesional peserta didik, sejalan dengan Pedoman Pengelolaan Ajang Talenta Peserta Didik dari Pusat Prestasi Nasional.</p>' +
    '<h3>B. Dasar Hukum</h3>' + kurOl_(kurDasar_(X).map(esc_)) + '<h3>C. Tujuan</h3><p class="j">' + esc_(a.tujuan) + '</p>' +
    '<h3>D. Asas Penyelenggaraan</h3>' + kurOl_(['<b>Inklusi</b>: kesempatan setara bagi seluruh peserta didik tanpa membedakan suku, agama, ras, gender, dan kondisi fisik.', '<b>Bertumbuh</b>: memberi ruang tumbuh kembang peserta didik tanpa intervensi eksploitatif.', '<b>Partisipatif</b>: melibatkan sekolah, klub, orang tua, federasi, dan pemangku kepentingan.', '<b>Berkelanjutan</b>: direncanakan, dilaksanakan, dievaluasi, dan dijamin mutunya secara konsisten.']);
  b += '<h2>BAB II — KETENTUAN UMUM</h2>' + kurKV_([['Nama ajang', kurAjang_(X), 1], ['Penyelenggara', X.d.org.nama], ['Bidang / cabang', a.bidang + ' / ' + a.cabang], ['Bentuk', 'Ajang ' + a.bentuk], ['Tingkat', a.tingkat], ['Metode', a.metode + ' (peserta dan penyelenggara berada di lokasi)'], ['Waktu', kurWaktu_(X)], ['Tempat', a.tempat], ['Frekuensi', a.frekuensi + (a.edisi ? ' • penyelenggaraan ke-' + a.edisi : '')], ['Orientasi', 'Nirlaba (tidak berorientasi komersial)']]);
  b += '<h2>BAB III — KEPESERTAAN</h2><h3>A. Syarat Peserta</h3>' + kurOl_(['Peserta didik aktif jenjang TK, SD, SMP, dan SMA/sederajat yang dibuktikan dengan surat keterangan sekolah.', 'Didaftarkan melalui akun sekolah, akun klub, atau akun pribadi (mandiri) pada portal resmi.', 'Mengikuti kelompok sesuai kelas yang sedang ditempuh (tabel di bawah).', 'Setiap atlet dapat mengikuti maksimal ' + esc_(c.max_individu || 3) + ' nomor lomba perorangan.', 'Melengkapi berkas: ' + esc_(String(c.persyaratan || 'akta kelahiran, foto, dan surat keterangan sekolah').replace(/\n+/g, '; ')) + '.']) +
    kurT_(['Kelompok', 'Kelas', 'Kode'], jen.map(function (j) { return [esc_(j.nama_jenjang), j.kelas_min === j.kelas_max ? kelasLabel_(j.kelas_min) : kelasLabel_(j.kelas_min) + ' – ' + kelasLabel_(j.kelas_max).replace(/^\D+/, ''), esc_(j.kode_jenjang)]; }), ['45%', '35%', '20%']) +
    '<h3>B. Pendaftaran</h3>' + kurOl_(['Pendaftaran dilakukan secara daring melalui portal resmi' + (X.d.org.web ? ' (' + esc_(String(X.d.org.web).slice(0, 80)) + ')' : '') + '.', 'Biaya pendaftaran ' + esc_(feeTxt) + '; bukti bayar diunggah dan diverifikasi panitia.', 'Batas pendaftaran: ' + esc_(c.registrasi_deadline ? tglID_(c.registrasi_deadline) : 'sesuai pengumuman panitia') + '.', 'Peserta yang lolos verifikasi tercantum dalam start list dan buku acara resmi.']);
  b += '<h2>BAB IV — KETENTUAN TEKNIS LOMBA</h2>' + kurOl_(['Perlombaan mengacu pada peraturan renang ' + esc_(a.aturan || 'yang berlaku') + ' dengan penyesuaian kelompok umur pelajar.', 'Kolam ' + esc_(c.jumlah_lintasan || 8) + ' lintasan. Penempatan seri dan lintasan (seeding) berdasarkan catatan waktu terbaik saat pendaftaran; peserta tanpa catatan waktu (NT) ditempatkan pada seri awal.', esc_(a.tahapan), 'Pencatatan waktu hingga 1/100 detik. Peserta yang terlambat, tidak hadir (DNS), atau melakukan pelanggaran teknis didiskualifikasi (DQ) oleh juri.', 'Protes diajukan tertulis oleh pendamping paling lambat 30 menit setelah hasil nomor diumumkan, dan diputuskan oleh Referee (Wasit Utama).', 'Jadwal dan estimasi waktu tiap nomor diterbitkan dalam Buku Acara dan portal resmi.']) +
    '<h3>Nomor Lomba (' + evs.length + ' nomor)</h3>' + kurT_(['Kelompok', 'Nomor lomba'], Object.keys(byJ).map(function (k) { const jj = jen.filter(function (x) { return x.kode_jenjang === k; })[0] || {}; return [esc_(jj.nama_jenjang || k), byJ[k].map(function (e) { return '#' + e.event_no + ' ' + esc_(e.event_name) + ' ' + (e.gender === 'PUTRA' ? 'Pa' : 'Pi'); }).join(' • ')]; }), ['24%', '76%']);
  b += '<h2>BAB V — PENJURIAN</h2>' + kurOl_(['Penilaian dilakukan oleh dewan juri/wasit yang memiliki kompetensi (sertifikat/lisensi, rekam jejak), kualifikasi, dan keterwakilan wilayah/instansi, ditetapkan dengan surat keputusan dan menandatangani pakta integritas.', 'Juri tidak terlibat dalam penyusunan pedoman, petunjuk pelaksanaan, maupun petunjuk teknis ajang.', 'Penjurian berlandaskan prinsip kesetaraan, keadilan, integritas, dan objektivitas.', 'Peringkat ditentukan oleh catatan waktu tercepat pada setiap nomor; hasil disahkan Referee secara digital sebelum dipublikasikan.', 'Kriteria dan hasil penjurian dipublikasikan pada media elektronik yang dapat diakses publik.']);
  b += '<h2>BAB VI — PENGHARGAAN</h2>' + kurT_(['Peringkat', 'Bentuk penghargaan'], X.d.hadiah.map(function (h) { return [esc_(h.peringkat), esc_(h.bentuk)]; }), ['30%', '70%']) + '<p class="j">Perolehan medali dihitung untuk klasemen juara umum (emas ' + esc_(c.poin_emas) + ', perak ' + esc_(c.poin_perak) + ', perunggu ' + esc_(c.poin_perunggu) + ' poin).</p>';
  b += '<h2>BAB VII — PUBLIKASI, PENDATAAN, DAN EVALUASI</h2>' + kurOl_(['Daftar peserta, start list, hasil live, daftar juara, buku acara, dan buku hasil dipublikasikan pada portal resmi dan media sosial penyelenggara.', 'Data peserta, juri, penilaian, dan prestasi dikelola secara elektronik dengan memperhatikan regulasi perlindungan data.', 'Penyelenggara melakukan monitoring dan evaluasi sebagai dasar perbaikan penyelenggaraan berikutnya.']) +
    '<h2>BAB VIII — PENUTUP</h2><p class="j">Petunjuk teknis ini menjadi acuan seluruh pihak. Hal-hal yang belum diatur akan ditetapkan kemudian oleh panitia dan diumumkan secara resmi.</p>' + kurTtd_(X);
  return kurPage_(X, b);
}
// ── 03 SK Panitia ──
function kurSK_(X, no, tentang, menimbang, memutuskan) {
  const o = X.d.org;
  return kurKop_(X) + '<div class="c"><div class="b" style="font-size:13px">KEPUTUSAN ' + esc_(String(o.jabatan || 'KETUA').toUpperCase()) + ' ' + esc_(String(o.nama || '').toUpperCase()) + '</div><div>NOMOR: ' + esc_(no || '......./SK/' + X.musim) + '</div><div class="b" style="margin-top:6px">TENTANG<br>' + tentang + '</div></div>' +
    '<table class="kv" style="margin-top:12px"><tr><td class="k" style="width:18%">Menimbang</td><td>' + kurOl_(menimbang) + '</td></tr><tr><td class="k">Mengingat</td><td>' + kurOl_(kurDasar_(X).map(esc_)) + '</td></tr></table>' +
    '<div class="c b" style="margin:6px 0">MEMUTUSKAN:</div><table class="kv">' + memutuskan.map(function (m) { return '<tr><td class="k b" style="width:18%;color:' + KC.ink + '">' + m[0] + '</td><td class="j">' + m[1] + '</td></tr>'; }).join('') + '</table>' + kurTtd_(X);
}
function kurHtmlSKPanitia_(X) {
  const d = X.d, aj = kurAjang_(X), tugas = function (x) { return esc_(x.tugas || KUR_TUGAS[String(x.jabatan || '').toLowerCase().replace(/\s+/g, ' ').trim()] || KUR_TUGAS[String(x.jabatan || '').toLowerCase().split(' ')[0]] || 'Melaksanakan tugas sesuai bidangnya dan bertanggung jawab kepada Ketua Panitia.'); };
  return kurPage_(X, kurSK_(X, d.org.no_sk_panitia, 'PEMBENTUKAN PANITIA PENGARAH DAN PANITIA PENYELENGGARA<br>' + aj.toUpperCase() + ' TAHUN ' + esc_(X.musim),
    ['bahwa dalam rangka penyelenggaraan ' + aj + ' yang bermutu, kredibel, dan akuntabel diperlukan kepanitiaan yang terdiri atas panitia pengarah dan panitia penyelenggara;', 'bahwa nama-nama yang tercantum dalam lampiran keputusan ini dipandang cakap dan memenuhi syarat untuk melaksanakan tugas;', 'bahwa berdasarkan pertimbangan tersebut perlu menetapkan keputusan tentang pembentukan panitia.'],
    [['KESATU', 'Membentuk Panitia Pengarah (<i>Steering Committee</i>) dan Panitia Penyelenggara (<i>Organizing Committee</i>) ' + aj + ' dengan susunan sebagaimana tercantum dalam Lampiran keputusan ini.'], ['KEDUA', 'Panitia melaksanakan tugas sesuai uraian tugas dalam Lampiran dan bertanggung jawab kepada pimpinan penyelenggara. Setiap anggota tim pelaksana tidak berfungsi ganda.'], ['KETIGA', 'Segala biaya yang timbul akibat keputusan ini dibebankan pada anggaran penyelenggaraan ajang yang sah dan tidak mengikat.'], ['KEEMPAT', 'Keputusan ini berlaku sejak tanggal ditetapkan, dengan ketentuan akan diperbaiki apabila terdapat kekeliruan.']]) +
    '<div class="pb"></div><div class="b">LAMPIRAN I KEPUTUSAN NOMOR ' + esc_(d.org.no_sk_panitia || '......') + '</div><h2>Susunan Panitia Pengarah (Steering Committee)</h2>' + kurT_(['No', 'Nama', 'Jabatan dalam panitia', 'Instansi/unsur'], d.sc.map(function (x, i) { return [i + 1, '<b>' + esc_(x.nama) + '</b>', esc_(x.jabatan), esc_(x.instansi)]; }), ['6%', '34%', '28%', '32%']) +
    '<p class="j mut">Tugas Panitia Pengarah: memberikan arahan kebijakan, menjamin penyelenggaraan sesuai pedoman ajang talenta, serta melakukan pengawasan mutu dan integritas.</p>' +
    '<h2>Susunan Panitia Penyelenggara (Organizing Committee) dan Uraian Tugas</h2>' + kurT_(['No', 'Nama', 'Jabatan', 'Uraian tugas'], d.oc.map(function (x, i) { return [i + 1, '<b>' + esc_(x.nama) + '</b>', esc_(x.jabatan), tugas(x)]; }), ['6%', '26%', '20%', '48%']) + kurTtd_(X));
}
// ── 04 Juri ──
function kurHtmlJuri_(X) {
  const d = X.d, aj = kurAjang_(X), wil = {}; d.juri.forEach(function (j) { if (j.wilayah) wil[nk_(j.wilayah)] = j.wilayah; });
  let b = kurSK_(X, d.org.no_sk_juri, 'PENETAPAN DEWAN JURI DAN WASIT<br>' + aj.toUpperCase() + ' TAHUN ' + esc_(X.musim),
    ['bahwa penilaian pada ajang kompetisi dilakukan oleh juri yang memenuhi aspek kompetensi, kualifikasi, dan keterwakilan;', 'bahwa nama-nama dalam lampiran keputusan ini memiliki sertifikat/lisensi, rekam jejak, dan pengalaman yang sesuai dengan cabang renang;', 'bahwa juri wajib bekerja berdasarkan prinsip kesetaraan, keadilan, integritas, dan objektivitas serta menandatangani pakta integritas.'],
    [['KESATU', 'Menetapkan Dewan Juri dan Wasit ' + aj + ' sebagaimana tercantum dalam Lampiran keputusan ini.'], ['KEDUA', 'Dewan Juri bertugas menilai, mencatat waktu, memutuskan pelanggaran, menetapkan hasil setiap nomor lomba, serta mengesahkan hasil melalui Referee (Wasit Utama).'], ['KETIGA', 'Dewan Juri tidak terlibat dalam penyusunan pedoman, petunjuk pelaksanaan, dan petunjuk teknis ajang, serta wajib menandatangani pakta integritas.'], ['KEEMPAT', 'Keputusan ini berlaku sejak tanggal ditetapkan.']]);
  b += '<div class="pb"></div><div class="b">LAMPIRAN KEPUTUSAN NOMOR ' + esc_(d.org.no_sk_juri || '......') + '</div><h2>Daftar dan Kualifikasi Dewan Juri</h2>' +
    kurKpi_([['JUMLAH JURI', d.juri.length], ['SEBARAN WILAYAH', Object.keys(wil).length, KC.aqua], ['BERLISENSI', d.juri.filter(function (j) { return j.lisensi || j.no_lisensi; }).length, KC.gold]]) +
    kurT_(['No', 'Nama & peran', 'Lisensi / sertifikat', 'Instansi & asal wilayah', 'Pengalaman / rekam jejak'], d.juri.map(function (j, i) { return [i + 1, '<b>' + esc_(j.nama) + '</b><br><span class="mut">' + esc_(j.peran) + '</span>', esc_(j.lisensi) + (j.no_lisensi ? '<br><span class="mut">No. ' + esc_(j.no_lisensi) + '</span>' : ''), esc_(j.instansi) + (j.wilayah ? '<br><span class="mut">' + esc_(j.wilayah) + '</span>' : ''), esc_(j.pengalaman)]; }), ['5%', '24%', '22%', '21%', '28%']) +
    '<p class="mut" style="font-size:9.5px">Lampirkan salinan lisensi/sertifikat dan daftar riwayat hidup setiap juri pada aplikasi kurasi.</p>';
  d.juri.forEach(function (j) {
    b += '<div class="pb"></div>' + kurKop_(X) + '<div class="c b" style="font-size:14px;color:' + KC.navy + '">PAKTA INTEGRITAS JURI</div><div class="c mut">' + aj + ' • ' + esc_(X.musim) + '</div><p style="margin-top:14px">Saya yang bertanda tangan di bawah ini:</p>' +
      kurKV_([['Nama', j.nama], ['Peran', j.peran], ['Lisensi / sertifikat', [j.lisensi, j.no_lisensi].filter(Boolean).join(' No. ')], ['Instansi / asal', [j.instansi, j.wilayah].filter(Boolean).join(', ')]]) +
      '<p>dengan ini menyatakan bahwa dalam melaksanakan tugas sebagai juri/wasit, saya:</p>' + kurOl_(['akan bekerja secara profesional, jujur, objektif, transparan, dan akuntabel;', 'tidak akan meminta atau menerima pemberian dalam bentuk apa pun yang dapat memengaruhi keputusan penilaian;', 'tidak memiliki konflik kepentingan dengan peserta dan akan menyatakan diri tidak menilai apabila terdapat hubungan keluarga atau kepentingan;', 'tidak terlibat dalam penyusunan pedoman, petunjuk pelaksanaan, dan petunjuk teknis ajang;', 'menjaga kerahasiaan proses penilaian sebelum hasil diumumkan secara resmi;', 'bersedia menerima sanksi sesuai ketentuan apabila melanggar pakta integritas ini.']) +
      '<table style="width:100%;margin-top:22px"><tr><td style="width:52%"></td><td>' + esc_(d.org.kota || 'Jakarta') + ', ' + esc_(tglID_(d.ajang.tgl_mulai || d.org.tgl_surat)) + '<br>Yang menyatakan,<table style="margin:6px 0"><tr><td style="border:1px dashed ' + KC.ln + ';width:70px;height:52px;text-align:center;font-size:8px;color:' + KC.mut + '">Meterai<br>10.000</td></tr></table><b><u>' + esc_(j.nama) + '</u></b></td></tr></table>';
  });
  return kurPage_(X, b);
}
// ── 05 Kepesertaan & sebaran ──
function kurHtmlPeserta_(X) {
  const st = X.st, a = X.d.ajang, mx = st.prov.length ? st.prov[0].n : 0, mk = st.kota.length ? st.kota[0].n : 0, mj = Math.max.apply(null, [1].concat(st.jenjang.map(function (j) { return j.putra + j.putri; })));
  const syarat = { 'Kabupaten/Kota': 'minimal 4 kecamatan', 'Provinsi': 'minimal 4 kabupaten/kota', 'Nasional': 'minimal 4 provinsi', 'Internasional': 'minimal 5 negara' }[a.tingkat] || '-';
  let b = kurSampul_(X, '05', 'LAPORAN KEPESERTAAN DAN PETA SEBARAN', 'Data lengkap peserta dan sebaran asal peserta sebagai dasar tingkat ajang') + '<div class="pb"></div>';
  b += '<h2>A. Ringkasan Kepesertaan</h2>' + kurKpi_([['PESERTA DIDIK', st.atlet], ['ENTRI NOMOR', st.entri, KC.aqua], ['SATUAN PENDIDIKAN', st.sekolah.length, KC.gold], ['KAB/KOTA • PROVINSI', st.nKota + ' • ' + st.nProv, KC.navy2]]) +
    kurKV_([['Putra / putri', st.putra + ' / ' + st.putri], ['Akun pendaftar (sekolah/klub/mandiri)', st.kontingen], ['Klub', st.klub.length], ['Tingkat yang diajukan', a.tingkat + ' — syarat pedoman: ' + syarat], ['Tingkat yang terpenuhi data', st.tingkatSaran, 0]]) +
    '<p class="j">' + (levelOk_(a.tingkat, st) ? 'Sebaran peserta <b>memenuhi</b> syarat minimal kepesertaan tingkat ' + esc_(a.tingkat) + ' sesuai Pedoman Pengelolaan Ajang Talenta (Bab III huruf C).' : '<b>Perhatian:</b> sebaran peserta belum memenuhi syarat tingkat ' + esc_(a.tingkat) + '; menurut pedoman, kepesertaan akan dianggap berada di tingkat di bawahnya (' + esc_(st.tingkatSaran) + ').') + '</p>';
  b += '<h2>B. Peta Sebaran per Provinsi</h2>' + kurT_(['Provinsi', 'Kab/Kota', 'Peserta', 'Proporsi'], st.prov.map(function (p) { return [esc_(p.nama), p.kota, '<b>' + p.n + '</b>', kurBar_(p.n, mx)]; }), ['34%', '12%', '12%', '42%']) +
    '<h2>C. Peta Sebaran per Kabupaten/Kota</h2>' + kurT_(['No', 'Kabupaten/Kota', 'Provinsi', 'Peserta', 'Proporsi'], st.kota.map(function (k, i) { return [i + 1, esc_(k.nama), esc_(k.prov), '<b>' + k.n + '</b>', kurBar_(k.n, mk)]; }), ['6%', '30%', '24%', '10%', '30%']) +
    '<h2>D. Peserta per Kelompok dan Jenis Kelamin</h2>' + kurT_(['Kelompok', 'Putra', 'Putri', 'Total', 'Proporsi'], st.jenjang.map(function (j) { return [esc_(j.nama), j.putra, j.putri, '<b>' + (j.putra + j.putri) + '</b>', kurBar_(j.putra + j.putri, mj)]; }), ['30%', '12%', '12%', '12%', '34%']) +
    '<h2>E. Tingkat Persaingan per Nomor Lomba</h2>' + kurT_(['No', 'Nomor lomba', 'Peserta', 'Juara', 'Rasio juara : peserta'], st.nomor.map(function (n) { return ['#' + n.no, esc_(n.nama) + ' ' + (n.g === 'PUTRA' ? 'Putra' : 'Putri'), n.peserta, n.juara, n.peserta && n.juara ? '1 : ' + (Math.round(n.peserta / n.juara * 10) / 10) : '–']; }), ['8%', '50%', '12%', '10%', '20%']) +
    '<p class="mut">Rasio keseluruhan: ' + st.juara + ' juara dari ' + st.entri + ' entri (' + st.rasio + '%).</p>' +
    '<h2>F. Satuan Pendidikan Peserta (' + st.sekolah.length + ')</h2>' + kurT_(['No', 'Satuan pendidikan', 'Kab/Kota', 'Peserta'], st.sekolah.map(function (s, i) { return [i + 1, esc_(s.nama), esc_(s.kota), s.n]; }), ['6%', '54%', '28%', '12%']) +
    '<p class="mut" style="font-size:9.5px">Data lengkap per peserta (nama, NISN, jenis kelamin, kelas, sekolah, kab/kota, provinsi, nomor lomba) tersedia pada lampiran Excel "Data Kurasi" dari modul ini.</p>' + kurTtd_(X);
  return kurPage_(X, b);
}
// ── 06 SK Pemenang ──
function kurHtmlPemenang_(X) {
  const st = X.st, aj = kurAjang_(X), k = hitungKlasemen_(X.musim), g = {}; st.win.forEach(function (w) { (g[w.eid] = g[w.eid] || []).push(w); });
  let b = kurSK_(X, X.d.org.no_sk_pemenang, 'PENETAPAN PEMENANG<br>' + aj.toUpperCase() + ' TAHUN ' + esc_(X.musim),
    ['bahwa ' + aj + ' telah dilaksanakan pada ' + esc_(kurWaktu_(X)) + ' di ' + esc_(X.d.ajang.tempat) + ';', 'bahwa hasil setiap nomor lomba telah dinilai oleh Dewan Juri dan disahkan oleh Referee (Wasit Utama);', 'bahwa perlu menetapkan pemenang sebagai dasar pemberian penghargaan dan pengakuan prestasi peserta didik.'],
    [['KESATU', 'Menetapkan pemenang ' + aj + ' sebagaimana tercantum dalam Lampiran keputusan ini, sebanyak <b>' + st.juara + '</b> juara pada <b>' + Object.keys(g).length + '</b> nomor lomba.'], ['KEDUA', 'Pemenang berhak atas penghargaan sesuai Petunjuk Teknis Penyelenggaraan dan memperoleh sertifikat/piagam juara bernomor.'], ['KETIGA', 'Daftar pemenang dipublikasikan secara daring dan dapat diakses publik melalui: ' + X.d.publikasi.filter(function (p) { return p.url; }).slice(0, 3).map(function (p) { return esc_(p.url); }).join('; ') + '.'], ['KEEMPAT', 'Keputusan ini berlaku sejak tanggal ditetapkan.']]);
  b += '<div class="pb"></div><div class="b">LAMPIRAN KEPUTUSAN NOMOR ' + esc_(X.d.org.no_sk_pemenang || '......') + '</div><h2>Daftar Pemenang per Nomor Lomba</h2>';
  Object.keys(g).forEach(function (eid) { const L = g[eid]; b += '<h3>#' + L[0].no + ' ' + esc_(L[0].nomor) + '</h3>' + kurT_(['Juara', 'Nama', 'Satuan pendidikan / klub', 'Kab/Kota', 'Waktu', 'No. sertifikat'], L.map(function (w) { return ['<b>' + romawi_(w.rank) + '</b> ' + esc_(w.medal ? '(' + w.medal.charAt(0) + w.medal.slice(1).toLowerCase() + ')' : ''), '<b>' + esc_(w.nama) + '</b>' + (w.baru ? ' <span style="color:' + KC.gold + '">REKOR</span>' : ''), esc_([w.sk, w.kl].filter(Boolean).join(' / ')), esc_(w.kota), esc_(w.waktu), esc_(sertNo_(X, w))]; }), ['12%', '24%', '26%', '13%', '10%', '15%']); });
  const kt = function (L) { return kurT_(['#', 'Nama', 'Emas', 'Perak', 'Perunggu', 'Poin'], L.slice(0, 10).map(function (x, i) { return [i + 1, '<b>' + esc_(x.nama) + '</b>', x.e, x.p, x.b, '<b>' + x.poin + '</b>']; }), ['6%', '50%', '11%', '11%', '11%', '11%']); };
  b += '<h2>Klasemen Juara Umum Satuan Pendidikan</h2>' + kt(k.sekolah) + (k.klub.length ? '<h2>Klasemen Juara Umum Klub</h2>' + kt(k.klub) : '') + kurTtd_(X);
  return kurPage_(X, b);
}
// ── 07 Laporan pelaksanaan ──
function kurFoto_(X) {
  const al = X.d.dok.album; if (!al) return [];
  return readT_('TBL_GALERI').filter(function (g) { return g.event_label === al && g.tipe !== 'LINK' && g.file_id; }).slice(0, 8).map(function (g) { return { u: kurImg_(X, g.file_id, 180), cap: g.caption }; }).filter(function (x) { return x.u; });
}
function kurHtmlLaporan_(X) {
  const d = X.d, a = d.ajang, st = X.st, c = X.c, f = kurFoto_(X), aj = kurAjang_(X);
  let b = kurSampul_(X, '07', 'LAPORAN PELAKSANAAN AJANG', 'Gambaran penyelenggaraan, sarana prasarana, pembiayaan, penghargaan, publikasi, kemitraan, dan keberlanjutan') + '<div class="pb"></div>';
  b += '<h2>1. Gambaran Umum</h2><p class="j">' + aj + ' diselenggarakan oleh ' + kurLembaga_(X) + ' sebagai ajang ' + esc_(a.bentuk.toLowerCase()) + ' tingkat ' + esc_(a.tingkat.toLowerCase()) + ' pada ' + esc_(kurWaktu_(X)) + ' di ' + esc_(a.tempat) + '. Ajang diikuti <b>' + st.atlet + '</b> peserta didik dari <b>' + st.sekolah.length + '</b> satuan pendidikan di <b>' + st.nKota + '</b> kabupaten/kota (' + st.nProv + ' provinsi), mempertandingkan <b>' + st.nomor.length + '</b> nomor lomba dengan <b>' + st.juara + '</b> juara.</p>' +
    kurKpi_([['PESERTA', st.atlet], ['NOMOR LOMBA', st.nomor.length, KC.aqua], ['JURI/WASIT', d.juri.length, KC.gold], ['PANITIA', d.sc.length + d.oc.length, KC.navy2]]) + '<p class="j"><b>Tujuan:</b> ' + esc_(a.tujuan) + '</p>';
  b += '<h2>2. Pelaksanaan</h2>' + kurKV_([['Metode', a.metode], ['Tahapan', a.tahapan], ['Sistem informasi', 'Pendaftaran daring, verifikasi berkas, start list otomatis, hasil live, pengesahan digital Referee, buku acara & buku hasil'], ['Nomor yang disahkan', st.nomorSah + ' dari ' + st.nomor.length + ' nomor'], ['Rekor baru', st.win.filter(function (w) { return w.baru; }).length + ' rekor kejuaraan']]);
  b += '<h2>3. Sarana dan Prasarana</h2>' + kurOl_(['<b>Utama:</b> kolam renang ' + esc_(c.jumlah_lintasan || 8) + ' lintasan di ' + esc_(a.tempat) + ', perangkat start dan pencatat waktu, papan hasil, area juri.', '<b>Pendukung:</b> sistem informasi daring (pendaftaran, start list, hasil live), area pemanasan, ruang tunggu peserta, pos kesehatan, tata suara, area penyerahan penghargaan.']) +
    (f.length ? '<h3>Dokumentasi</h3><table style="width:100%">' + [0, 2, 4, 6].map(function (i) { return f[i] ? '<tr>' + [f[i], f[i + 1]].map(function (x) { return '<td style="width:50%;padding:4px;vertical-align:top">' + (x ? '<div style="text-align:center;background:#F4F7FA"><img src="' + x.u + '" height="180" style="max-width:100%"></div><div class="mut" style="font-size:9px">' + esc_(x.cap || '') + '</div>' : '') + '</td>'; }).join('') + '</tr>' : ''; }).join('') + '</table>' : '') +
    (d.dok.link ? '<p>Album dokumentasi lengkap: ' + esc_(d.dok.link) + '</p>' : '');
  b += '<h2>4. Pembiayaan dan Orientasi Penyelenggaraan</h2>' + kurT_(['No', 'Sumber dana', 'Keterangan'], d.biaya.map(function (x, i) { return [i + 1, '<b>' + esc_(x.sumber) + '</b>', esc_(x.ket)]; }), ['6%', '40%', '54%']) + '<p class="j">' + esc_(d.nirlaba) + '</p>';
  b += '<h2>5. Penghargaan</h2>' + kurT_(['Peringkat', 'Bentuk penghargaan'], d.hadiah.map(function (h) { return [esc_(h.peringkat), esc_(h.bentuk)]; }), ['30%', '70%']);
  b += '<h2>6. Publikasi Hasil (Akuntabilitas Publik)</h2>' + kurT_(['No', 'Publikasi', 'Tautan'], d.publikasi.map(function (p, i) { return [i + 1, esc_(p.judul), esc_(p.url)]; }), ['6%', '34%', '60%']);
  b += '<h2>7. Liputan Media</h2>' + kurT_(['No', 'Media', 'Judul liputan', 'Tanggal', 'Tautan'], d.media.map(function (m, i) { return [i + 1, '<b>' + esc_(m.media) + '</b>', esc_(m.judul), esc_(tglID_(m.tanggal)), esc_(m.url)]; }), ['5%', '17%', '33%', '13%', '32%']);
  b += '<h2>8. Kemitraan</h2>' + kurT_(['No', 'Mitra', 'Bentuk dukungan'], d.mitra.map(function (m, i) { return [i + 1, '<b>' + esc_(m.nama) + '</b>', esc_(m.bentuk)]; }), ['6%', '40%', '54%']);
  b += '<h2>9. Keberlanjutan dan Frekuensi Penyelenggaraan</h2>' + kurKV_([['Frekuensi', a.frekuensi], ['Tahun pertama', a.tahun_awal || '-'], ['Penyelenggaraan ke-', a.edisi || '-']]) +
    kurT_(['No', 'Tahun/edisi', 'Tempat', 'Jumlah peserta'], d.riwayat.concat([{ tahun: X.musim + ' (saat ini)', tempat: a.tempat, peserta: st.atlet }]).map(function (r, i) { return [i + 1, esc_(r.tahun) + (r.edisi ? ' • ke-' + esc_(r.edisi) : ''), esc_(r.tempat), esc_(r.peserta)]; }), ['6%', '30%', '40%', '24%']);
  b += '<h2>10. Monitoring dan Evaluasi</h2>' + kurOl_(['Data peserta, penilaian, dan prestasi dikumpulkan dan diolah secara elektronik melalui sistem informasi ajang.', 'Seluruh hasil disahkan Referee sebelum dipublikasikan; perubahan hasil tercatat dalam log audit.', esc_(a.catatan_kendala || 'Evaluasi pelaksanaan menjadi dasar perbaikan jadwal, layanan pendaftaran, dan kualitas penjurian pada penyelenggaraan berikutnya.')]) +
    '<h2>11. Penutup</h2><p class="j">Demikian laporan pelaksanaan ' + aj + ' ini disusun sebagai bentuk akuntabilitas penyelenggaraan dan kelengkapan pengajuan kurasi ajang talenta kepada Pusat Prestasi Nasional.</p>' + kurTtd_(X);
  return kurPage_(X, b);
}
// ── 08 Rekap sertifikat ──
function kurHtmlRekapSert_(X) {
  const st = X.st;
  return kurPage_(X, kurKop_(X) + '<div class="c"><h1 style="color:' + KC.navy + '">REKAPITULASI SERTIFIKAT JUARA</h1><div class="mut">' + kurAjang_(X) + ' • ' + esc_(kurWaktu_(X)) + '</div></div>' +
    kurKpi_([['SERTIFIKAT JUARA', st.juara], ['JUARA I', st.win.filter(function (w) { return w.rank === 1; }).length, KC.gold], ['JUARA II', st.win.filter(function (w) { return w.rank === 2; }).length, '#8C9AA8'], ['JUARA III', st.win.filter(function (w) { return w.rank === 3; }).length, '#B0703C']]) +
    kurT_(['No', 'Nomor sertifikat', 'Nama', 'Nomor lomba', 'Juara', 'Satuan pendidikan', 'Kab/Kota'], st.win.map(function (w, i) { return [i + 1, '<b>' + esc_(sertNo_(X, w)) + '</b>', esc_(w.nama), '#' + w.no + ' ' + esc_(w.nomor), romawi_(w.rank), esc_(w.sk || w.kl), esc_(w.kota)]; }), ['5%', '17%', '19%', '25%', '7%', '17%', '10%']) +
    '<p class="mut" style="font-size:9.5px">Setiap sertifikat memuat nomor unik, nama peserta, satuan pendidikan, nomor lomba, peringkat, nama ajang, tingkat, waktu dan tempat, serta tanda tangan pimpinan penyelenggara. Berkas sertifikat juara dapat diunduh per bagian dari modul Kurasi.</p>' + kurTtd_(X));
}
// ── Sertifikat juara (satu halaman) ──
function kurSertHtml_(X, w) {
  const a = X.d.ajang, o = X.d.org, lg = kurLogos_(X), ttd = kurImg_(X, o.ttd_id, 300), cap = kurImg_(X, o.cap_id, 300), md = { EMAS: ['MEDALI EMAS', '#C9A227'], PERAK: ['MEDALI PERAK', '#8C9AA8'], PERUNGGU: ['MEDALI PERUNGGU', '#B0703C'] }[w.medal] || ['', KC.gold];
  return '<table style="width:100%;border:8px solid ' + KC.navy + '"><tr><td style="border:2px solid ' + KC.gold + ';padding:56px 36px 44px 36px;text-align:center">' +
    (lg.length ? '<div>' + lg.map(function (u) { return '<img src="' + u + '" height="58" style="margin:0 8px">'; }).join('') + '</div>' : '') +
    '<div style="font-size:11px;letter-spacing:3px;color:' + KC.mut + ';margin-top:30px">' + esc_(String(o.nama || '').toUpperCase()) + '</div>' +
    '<div style="font-size:40px;font-weight:bold;color:' + KC.navy + ';letter-spacing:2px;margin-top:18px">PIAGAM PENGHARGAAN</div>' +
    '<div style="font-size:11px;color:' + KC.mut + '">Nomor: ' + esc_(sertNo_(X, w)) + '</div>' +
    '<div style="font-size:13px;margin-top:44px">diberikan kepada</div><div style="font-size:32px;font-weight:bold;margin-top:10px;color:' + KC.ink + '">' + esc_(w.nama) + '</div>' +
    '<div style="width:60%;margin:6px auto;border-top:2px solid ' + KC.gold + '"></div><div style="font-size:12px">' + esc_([w.sk, w.kl].filter(Boolean).join(' / ')) + (w.kota ? ' — ' + esc_(w.kota) : '') + '</div>' +
    '<div style="font-size:13px;margin-top:36px">atas prestasinya sebagai</div><div style="font-size:34px;font-weight:bold;color:' + md[1] + ';margin-top:4px">JUARA ' + romawi_(w.rank) + '</div><div style="font-size:11px;font-weight:bold;color:' + md[1] + '">' + md[0] + '</div>' +
    '<div style="font-size:14px;margin-top:26px">Nomor <b>' + esc_(w.nomor) + '</b> dengan catatan waktu <b>' + esc_(w.waktu) + '</b></div>' +
    '<div style="font-size:13px;margin-top:14px;line-height:1.6">pada <b>' + kurAjang_(X) + '</b> tingkat ' + esc_(a.tingkat) + '<br>' + esc_(kurWaktu_(X)) + ' • ' + esc_(a.tempat) + '</div>' +
    '<table style="width:100%;margin-top:70px"><tr><td style="width:50%;text-align:left;font-size:9px;color:' + KC.mut + ';vertical-align:bottom">Daftar juara resmi:<br>' + esc_(String((X.d.publikasi[0] || {}).url || '').slice(0, 70)) + '</td><td style="text-align:center;font-size:11px">' + esc_(o.jabatan || 'Ketua') + '<table style="margin:2px auto"><tr>' + (cap ? '<td style="padding:0"><img src="' + cap + '" height="70"></td>' : '') + '<td style="padding:0;height:64px">' + (ttd ? '<img src="' + ttd + '" height="56">' : '<br><br><br>') + '</td></tr></table><b><u>' + esc_(o.pimpinan || '..............................') + '</u></b></td></tr></table>' +
    '</td></tr></table>';
}
