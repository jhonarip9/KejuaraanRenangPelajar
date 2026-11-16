(function () {
'use strict';
/* ===== Event & Nomor Pertandingan (Super Admin) + Info Lomba (publik) ===== */
const { $, $$, E, S, V, ACT, SUBMIT, INP, G_L, TIPE_L, FASE_L, rp, swr, toast, busy, ph, card, alertx, field, inp, sel, form, go, modal, closeModal, ask, bustCache, rupiah, fdt, jn, empty } = KRP;
const main = h => { $('#main').innerHTML = h; };
const BLN3 = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const EVST = { DIUMUMKAN: ['k-info', 'Diumumkan'], DRAFT: ['k-neu', 'Draf'], AKAN_DATANG: ['k-info', 'Akan datang'], BERLANGSUNG: ['k-warn', 'Berlangsung'], LEWAT: ['k-warn', 'Lewat tanggal'], SELESAI: ['k-ok', 'Selesai'] };
const DFST = { DIBUKA: ['k-ok', 'Dibuka'], DITUTUP: ['k-err', 'Ditutup'], BELUM_DIBUKA: ['k-info', 'Belum dibuka'], BELUM_AKTIF: ['k-neu', 'Belum aktif'], SELESAI: ['k-neu', 'Selesai'] };
const pl = (m, k) => { const x = m[k] || ['k-neu', k || '-']; return `<span class="k-pill ${x[0]}">${E(x[1])}</span>`; };
const tglS = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null; };
function rentang(a, b) {
  const x = tglS(a), y = tglS(b) || x; if (!x) return '<span class="mut">—</span>';
  if (y.y === x.y && y.m === x.m && y.d === x.d) return `${x.d} ${BLN3[x.m]} ${x.y}`;
  if (x.y === y.y && x.m === y.m) return `${x.d}–${y.d} ${BLN3[x.m]} ${x.y}`;
  if (x.y === y.y) return `${x.d} ${BLN3[x.m]} – ${y.d} ${BLN3[y.m]} ${x.y}`;
  return `${x.d} ${BLN3[x.m]} ${x.y} – ${y.d} ${BLN3[y.m]} ${y.y}`;
}
const GAYA_L = ['Gaya Bebas', 'Gaya Punggung', 'Gaya Dada', 'Gaya Kupu-kupu', 'Gaya Ganti Perorangan'];
const GAYA_S = { 'Gaya Bebas': 'Bebas', 'Gaya Dada': 'Dada', 'Gaya Punggung': 'Punggung', 'Gaya Kupu-kupu': 'Kupu-kupu', 'Gaya Ganti Perorangan': 'Ganti perorangan' };
const JARAK_G = [25, 50, 100, 200, 400, 800];
const kelLbl = (huruf, nama) => huruf ? `Kel. ${huruf} · ${nama}` : nama;
const lines = t => String(t || '').split('\n').map(x => x.replace(/^\s*(?:\d+[.)]|[a-z][.)]|[-•])\s*/i, '').trim()).filter(Boolean);
const dtLocal = s => String(s || '').replace(' ', 'T').slice(0, 16);
const ib = (act, id, ic, t, cls) => `<button type="button" class="ev-ib ${cls || ''}" data-act="${act}" data-id="${E(id)}" title="${E(t)}" aria-label="${E(t)}"><i class="bi ${ic}"></i></button>`;
const sec = (ic, t, b) => `<section class="k-card ev-sec"><div class="k-card-h"><h3><i class="bi ${ic}"></i> ${t}</h3></div><div class="k-card-b">${b}</div></section>`;
const mini = (l, v, s) => `<div class="ev-mini"><small>${l}</small><div>${v}</div>${s ? `<small class="mut">${s}</small>` : ''}</div>`;
const head = () => ph('Event & Nomor Pertandingan', 'Atur event, kuota, biaya, kelompok, dan buka/tutup pendaftaran publik.');
const tabs = () => `<div class="k-seg ev-tabs">${[['ev', 'Event', 'bi-calendar-event'], ['nomor', 'Nomor pertandingan', 'bi-list-ol'], ['demo', 'Akun demo', 'bi-person-badge']].map(t => `<button class="${S.evTab === t[0] ? 'on' : ''}" data-act="ev-tab" data-v="${t[0]}"><i class="bi ${t[2]}"></i> ${t[1]}</button>`).join('')}</div>`;
const refreshEv = async () => { bustCache('evl'); bustCache('evg'); await S.refreshAll(); go('a-event', S.evTab); };

V['a-event'] = function (tab) {
  if (tab) S.evTab = tab; S.evTab = S.evTab || 'ev';
  if (S.evTab === 'nomor') return loadNomor();
  swr('evl', 'ev.list', {}, d => { S.EVL = d; if (S.route !== 'a-event') return; S.evTab === 'demo' ? drawDemo() : drawEv(); }, 2500);
};
ACT['ev-tab'] = a => { S.evTab = a.dataset.v; go('a-event', a.dataset.v); };

/* ---------- Bersihkan data percobaan ---------- */
ACT['ev-reset'] = () => {
  const L = (S.EVL && S.EVL.events) || [];
  modal('Bersihkan data percobaan', `<form data-submit="ev-reset"><p class="sm">Pilih event yang datanya dihapus. Yang dihapus: <b>pendaftaran nomor, start list, hasil lomba, pengesahan wasit, dokumen, dan rekor dari hasil event tersebut</b>. Arsip hasil lama (menu Impor Hasil Lama) dan akun panitia tidak disentuh.</p>
<div class="rs-ev">${L.length ? L.map(e => `<label class="rs-row"><input type="checkbox" name="m_${E(e.musim)}" checked> <span><b>${E(e.nama)}</b>${e.aktif ? ' <span class="k-pill k-navy">AKTIF</span>' : ''}<br><small class="mut">${E(e.musim)} · ${e.terisi} atlet · ${e.entri || 0} pendaftaran nomor</small></span></label>`).join('') : '<p class="mut">Belum ada event.</p>'}</div>
<label class="k-check1"><input type="checkbox" name="hapusEvent" checked> Hapus juga event & nomor pertandingannya (event aktif hanya dikosongkan dan kembali ke tahap Pendaftaran dengan pendaftaran ditutup)</label>
${field('Akun peserta (sekolah/klub/mandiri) & data atlet', `<div class="rs-akun">${[['TIDAK', 'Jangan hapus akun'], ['DEMO', 'Hapus akun uji coba (DEMO-…) saja'], ['SEMUA', 'Hapus SEMUA akun peserta & atlet']].map((x, i) => `<label><input type="radio" name="akun" value="${x[0]}"${i === 1 ? ' checked' : ''}> ${x[1]}</label>`).join('')}</div>`, 0, 'Pilih "SEMUA" bila akun yang ada juga hanya percobaan. Akun yang dihapus tidak bisa masuk lagi.')}
<div class="k-alert warn"><i class="bi bi-exclamation-triangle"></i><div>Tindakan ini tidak bisa dibatalkan dari aplikasi. Sebelum menghapus, sistem membuat <b>salinan spreadsheet</b> di Drive sebagai cadangan.</div></div>
${field('Ketik HAPUS untuk konfirmasi', inp('konfirmasi', '', { req: 1, ph: 'HAPUS', max: 10 }), 1)}
<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-red"><i class="bi bi-eraser"></i> Bersihkan</button></div></form>`);
};
SUBMIT['ev-reset'] = async f => {
  const d = form(f), b = $('button.k-red', f), musims = Object.keys(d).filter(k => k.indexOf('m_') === 0 && d[k]).map(k => k.slice(2));
  if (String(d.konfirmasi || '').trim().toUpperCase() !== 'HAPUS') return toast('Ketik HAPUS untuk konfirmasi.', 'err');
  busy(b, true);
  try { const r = await rp('ev.reset', { musims, hapusEvent: !!d.hapusEvent, akun: d.akun, konfirmasi: d.konfirmasi }); closeModal(); KRP.bustCache(); await S.refreshAll(); go('a-event', 'ev'); await new Promise(r => setTimeout(r, 300)); modal('Data dibersihkan', `<p>${E(r.message)}</p>${r.data.cadangan ? `<p><a class="k-btn k-outline" href="${E(r.data.cadangan)}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i> Buka salinan cadangan</a></p>` : ''}<div class="k-bar"><button type="button" class="k-btn k-navy" data-act="mx">Tutup</button></div>`); }
  catch (e) { toast(e.message, 'err'); busy(b, false); }
};

ACT['ev-rp'] = () => modal('Reset ulang event Short Course Seri II 2026', `<form data-submit="ev-rp"><p class="sm">Event dikembalikan ke kondisi awal sesuai pedoman: <b>pengaturan event dan 136 nomor dipasang ulang</b>; pendaftaran nomor, start list, susunan acara, hasil, pengesahan, dan dokumen event ini dihapus. Bila event ini yang aktif, langsung aktif lagi di tahap Pendaftaran.</p>
${field('Akun peserta (sekolah/klub/mandiri)', `<div class="rs-akun">${[['TIDAK', 'Tetap simpan semua akun & atlet'], ['DEMO', 'Hapus akun uji coba (DEMO-…) saja'], ['SEMUA', 'Hapus SEMUA akun peserta & atlet']].map((x, i) => `<label><input type="radio" name="akun" value="${x[0]}"${i === 0 ? ' checked' : ''}> ${x[1]}</label>`).join('')}</div>`)}
<div class="k-alert warn"><i class="bi bi-exclamation-triangle"></i><div>Sebelum mereset, sistem membuat <b>salinan spreadsheet</b> di Drive sebagai cadangan. Arsip hasil lama dan akun panitia tidak disentuh.</div></div>
${field('Ketik RESET untuk konfirmasi', inp('konfirmasi', '', { req: 1, ph: 'RESET', max: 10 }), 1)}
<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-red"><i class="bi bi-arrow-repeat"></i> Reset ulang</button></div></form>`);
SUBMIT['ev-rp'] = async f => {
  const d = form(f), b = $('button.k-red', f); if (String(d.konfirmasi || '').trim().toUpperCase() !== 'RESET') return toast('Ketik RESET untuk konfirmasi.', 'err');
  busy(b, true);
  try { const r = await rp('ev.reset.pedoman', { akun: d.akun, konfirmasi: d.konfirmasi }); closeModal(); KRP.bustCache(); await S.refreshAll(); go('a-event', 'ev'); await new Promise(z => setTimeout(z, 300)); modal('Event direset', `<p>${E(r.message)}</p>${r.data.cadangan ? `<p><a class="k-btn k-outline" href="${E(r.data.cadangan)}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i> Buka salinan cadangan</a></p>` : ''}<div class="k-bar"><button type="button" class="k-btn k-navy" data-act="mx">Tutup</button></div>`); }
  catch (e) { toast(e.message, 'err'); busy(b, false); }
};

/* ---------- Tab Event ---------- */
const evMatch = (e, q) => !q || [e.nama, e.musim, e.venue, e.kota, e.tingkat].join(' ').toLowerCase().indexOf(q) >= 0;
function evRows(L) {
  const fase = S.EVL.fase;
  return L.length ? L.map(e => `<tr class="${e.aktif ? 'hl' : ''}"><td><div class="ev-nm"><b>${E(e.nama)}</b>${e.aktif ? ' <span class="k-pill k-navy">AKTIF DI WEB</span>' : ''}<small class="mut">${E(e.musim)} • ${E([e.venue, e.kota].filter(Boolean).join(', ') || '—')}</small></div></td><td class="nw">${rentang(e.tgl_mulai, e.tgl_selesai)}</td><td>${pl(EVST, e.st)}</td><td class="mono nw">${e.terisi} / ${e.kuota_atlet ? e.kuota_atlet : '∞'}</td>
<td>${e.aktif && fase === 'PENDAFTARAN' ? `<button type="button" class="ev-pb" data-act="ev-daftar" data-v="${e.daftar === 'DITUTUP' ? 1 : 0}" title="Klik untuk ${e.daftar === 'DITUTUP' ? 'membuka' : 'menutup'} pendaftaran">${pl(DFST, e.daftar)}</button>` : pl(DFST, e.daftar)}</td>
<td class="r nw"><div class="ev-act">${e.musim === S.EVL.presetMusim ? ib('ev-rp', e.ev_id, 'bi-arrow-repeat', 'Reset ulang event ke pengaturan pedoman') : ''}${ib('ev-edit', e.ev_id, 'bi-pencil-square', 'Ubah event')}${ib('ev-nomor', e.musim, 'bi-list-ol', 'Nomor pertandingan')}${e.aktif ? '' : ib('ev-aktif', e.ev_id, 'bi-broadcast', 'Aktifkan di web') + (e.st === 'SELESAI' ? '' : ib('ev-umum', e.ev_id, e.st === 'DIUMUMKAN' ? 'bi-eye-slash' : 'bi-megaphone', e.st === 'DIUMUMKAN' ? 'Sembunyikan dari kalender beranda' : 'Umumkan di kalender beranda')) + ib('ev-st', e.ev_id, e.st === 'SELESAI' ? 'bi-arrow-counterclockwise' : 'bi-archive', e.st === 'SELESAI' ? 'Kembalikan ke draf' : 'Tandai selesai (arsip)') + ib('ev-hapus', e.ev_id, 'bi-trash', 'Hapus event', 'del')}</div></td></tr>`).join('') : `<tr><td colspan="6">${empty('bi-calendar-x', 'Tidak ada event yang cocok.')}</td></tr>`;
}
function aktifStrip(e) {
  return `<div class="k-card ev-aktif"><div class="k-card-b"><div class="ev-ak-l"><span class="ev-live"><i class="bi bi-broadcast"></i> Aktif di web</span><h3>${E(e.nama)}</h3><p class="mut sm"><i class="bi bi-calendar-event"></i> ${rentang(e.tgl_mulai, e.tgl_selesai)} · <i class="bi bi-geo-alt"></i> ${E([e.venue, e.kota].filter(Boolean).join(', '))} · Tahap <b>${E(FASE_L[S.EVL.fase] || S.EVL.fase)}</b></p></div>
<div class="ev-ak-k">${mini('Pendaftaran', pl(DFST, e.daftar), e.daftar_tutup ? 'tutup ' + fdt(e.daftar_tutup) : '')}${mini('Peserta', `<b>${e.terisi}</b> / ${e.kuota_atlet || '∞'}`, e.entri + ' entri')}${mini('Nomor dibuka', `<b>${e.nomorBuka}</b> / ${e.nomor}`, e.nomorBatal ? e.nomorBatal + ' dibatalkan' : 'dipertandingkan')}${mini('Biaya', `<b>${rupiah(e.biaya_mode === 'PAKET' ? e.biaya_paket : e.biaya_nomor)}</b>`, e.biaya_mode === 'PAKET' ? `paket ${e.nomor_max} nomor / atlet` : 'per nomor')}</div>
<div class="ev-ak-b"><button class="k-btn sm k-navy" data-act="ev-edit" data-id="${E(e.ev_id)}"><i class="bi bi-pencil-square"></i> Ubah pengaturan</button><button class="k-btn sm k-outline" data-act="ev-nomor" data-id="${E(e.musim)}"><i class="bi bi-list-ol"></i> Nomor lomba</button><button class="k-btn sm k-outline" data-go="info"><i class="bi bi-box-arrow-up-right"></i> Lihat Info Lomba</button></div></div></div>`;
}
function drawEv() {
  const d = S.EVL, q = (S.evQ || '').toLowerCase(), act = d.events.filter(e => e.aktif)[0];
  main(`<div class="k-wrap pad">${head()}${tabs()}
${act ? aktifStrip(act) : ''}
${d.preset ? `<div class="k-alert info ev-preset"><i class="bi bi-magic"></i><div><b>Event dari pedoman siap dipasang</b><br><span class="sm">${E(d.presetNama)} · 136 nomor Kelompok A–F · paket Rp 300.000 untuk 3 nomor · tutup 20 Nov 2026 12.00 WIB · lengkap dengan ketentuan, penghargaan, protes, dan klausul kesehatan.</span></div><button class="k-btn k-orange sm" data-act="ev-preset"><i class="bi bi-download"></i> Pasang event ini</button></div>` : ''}
<div class="ev-tool"><input class="k-in ev-q" data-in="ev-q" placeholder="Cari event..." value="${E(S.evQ || '')}"><button class="k-btn k-ghostw" data-act="ev-reset" title="Hapus data event percobaan"><i class="bi bi-eraser"></i> Bersihkan data percobaan</button><button class="k-btn k-red" data-go="a-evform"><i class="bi bi-plus-lg"></i> Tambah event</button></div>
<div class="k-card"><div class="k-scroll"><table class="k-table ev-tbl"><thead><tr><th>Event</th><th>Tanggal</th><th>Status</th><th>Kuota</th><th>Pendaftaran</th><th class="r">Aksi</th></tr></thead><tbody id="ev-rows">${evRows(d.events.filter(e => evMatch(e, q)))}</tbody></table></div></div>
<p class="ev-foot"><i class="bi bi-info-circle"></i> Menghapus event/nomor tidak menghapus pendaftaran terkait. Gunakan status "Selesai" untuk mengarsipkan.</p>
${d.lalu.length ? card('Event yang sudah lewat (arsip)', `<div class="k-scroll"><table class="k-table"><thead><tr><th>Event</th><th>Tanggal</th><th>Sumber</th><th></th></tr></thead><tbody>${d.lalu.map(x => `<tr><td><b>${E(x.nama)}</b><br><small class="mut">${E(x.musim)}${x.lokasi ? ' · ' + E(x.lokasi) : ''}</small></td><td class="nw">${x.tanggal ? rentang(x.tanggal) : '—'}</td><td><span class="k-pill k-neu">${E(x.sumber)}</span></td><td class="r"><button class="k-btn sm k-outline" data-go="arsip" data-p="${E(x.musim)}">Lihat arsip</button></td></tr>`).join('')}</tbody></table></div>`, '', true) : ''}</div>`);
}
INP['ev-q'] = i => { S.evQ = i.value; const t = $('#ev-rows'), q = i.value.toLowerCase(); if (t && S.EVL) t.innerHTML = evRows(S.EVL.events.filter(e => evMatch(e, q))); };
const evOf = id => (S.EVL.events || []).filter(x => x.ev_id === id)[0] || {};
ACT['ev-edit'] = a => go('a-evform', a.dataset.id);
ACT['ev-nomor'] = a => { S.evMusim = a.dataset.id; S.nsel = {}; S.nf = null; S.evTab = 'nomor'; go('a-event', 'nomor'); };
ACT['ev-daftar'] = async a => {
  const buka = a.dataset.v === '1';
  if (!(await ask(buka ? 'Buka pendaftaran publik untuk event aktif?' : 'Tutup sementara pendaftaran publik? Akun peserta tidak bisa mendaftar sampai dibuka lagi.', buka ? 'Buka pendaftaran' : 'Tutup pendaftaran', !buka))) return;
  try { const r = await rp('ev.daftar', { buka }); toast(r.message); await refreshEv(); } catch (e) { toast(e.message, 'err'); }
};
ACT['ev-aktif'] = a => {
  const e = evOf(a.dataset.id), cur = S.EVL.events.filter(x => x.aktif)[0];
  modal('Aktifkan event di web', `<p>Jadikan <b>${E(e.nama)}</b> sebagai event aktif?</p><ul class="sm ev-ol"><li>Beranda, Info Lomba, jadwal, dan akun peserta beralih ke event ini.</li><li>Nomor yang dibuka langsung tampil di akun peserta sesuai kelompok kelas & gender atlet.</li>${cur ? `<li>Data <b>${E(cur.nama)}</b> tetap tersimpan (musim ${E(cur.musim)}) dan bisa diaktifkan lagi kapan saja.</li>` : ''}</ul>${e.nomor ? '' : alertx('warn', 'Event ini belum punya nomor lomba.', 'bi-exclamation-triangle')}${S.EVL.fase === 'PELAKSANAAN' ? `<label class="k-check1"><input type="checkbox" id="ev-paksa"> Event aktif sedang tahap Pelaksanaan — tetap pindahkan</label>` : ''}`,
    `<button class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange" data-act="ev-aktif-go" data-id="${E(e.ev_id)}"><i class="bi bi-broadcast"></i> Aktifkan</button>`);
};
ACT['ev-aktif-go'] = async a => { busy(a, true); try { const p = $('#ev-paksa'); const r = await rp('ev.aktifkan', { id: a.dataset.id, paksa: !!(p && p.checked) }); closeModal(); toast(r.message); await refreshEv(); } catch (e) { toast(e.message, 'err'); busy(a, false); } };
ACT['ev-st'] = async a => { const e = evOf(a.dataset.id); try { const r = await rp('ev.status', { id: e.ev_id, status: e.st === 'SELESAI' ? 'DRAFT' : 'SELESAI' }); toast(r.message); await refreshEv(); } catch (er) { toast(er.message, 'err'); } };
ACT['ev-umum'] = async a => { const e = evOf(a.dataset.id); try { const r = await rp('ev.status', { id: e.ev_id, status: e.st === 'DIUMUMKAN' ? 'DRAFT' : 'TERBIT' }); toast(r.message); await refreshEv(); } catch (er) { toast(er.message, 'err'); } };
ACT['ev-hapus'] = async a => {
  const e = evOf(a.dataset.id);
  if (!(await ask(`Hapus event <b>${E(e.nama)}</b>? Nomor yang belum punya pendaftar ikut terhapus. Pendaftaran terkait tidak ikut terhapus.`, 'Hapus event', true))) return;
  try { const r = await rp('ev.hapus', { id: e.ev_id }); toast(r.message); await refreshEv(); } catch (er) { toast(er.message, 'err'); }
};
ACT['ev-preset'] = () => modal('Pasang event dari pedoman', `<p><b>${E(S.EVL.presetNama)}</b></p><ul class="sm ev-ol"><li>Jumat–Sabtu, 27–28 November 2026 · Kolam Renang Gelanggang Remaja Jakarta Selatan, Jl. Bulungan No. 1 Blok C</li><li>Kelompok A (SD 1–2), B (SD 3–4), C (SD 5–6), D (SMP 7), E (SMP 8–9), F (SMA 10–12)</li><li>136 nomor kolam 25 m, timed final, 1 kali start · hari 1: #1–68, hari 2: #69–136</li><li>Wajib 3 nomor per atlet · paket Rp 300.000 · minimal 5 peserta per nomor</li><li>Pendaftaran ditutup 20 November 2026 pukul 12.00 WIB · Buku Acara 26 November 2026</li><li>Rekening BCA a.n. Nadila (tampil di akun peserta), grup WhatsApp, ketentuan, penghargaan, protes & klausul kesehatan</li></ul>${(() => { const c = S.EVL.events.filter(x => x.aktif)[0]; return c && c.entri ? alertx('warn', `Event aktif sekarang (<b>${E(c.nama)}</b>) sudah punya <b>${c.entri} entri</b>. Entri itu tetap tersimpan di musim ${E(c.musim)} dan <b>tidak ikut pindah</b> ke event baru. Bila entri itu sebenarnya untuk event 27–28 November ini, hapus centang aktifkan otomatis dan periksa datanya dulu.`, 'bi-exclamation-triangle') : ''; })()}<label class="k-check1"><input type="checkbox" id="pr-akt" checked> Langsung aktifkan di web (event yang aktif sekarang tetap tersimpan)</label><p class="mut sm">Urutan nomor acara mengikuti gaya penomoran KRP sebelumnya dan bisa diubah di tab Nomor pertandingan atau menu Jadwal Acara.</p>`,
  `<button class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange" data-act="ev-preset-go"><i class="bi bi-download"></i> Pasang event</button>`);
ACT['ev-preset-go'] = async a => { busy(a, true); try { const r = await rp('ev.preset', { aktifkan: $('#pr-akt').checked }); closeModal(); toast(r.message); await refreshEv(); } catch (e) { toast(e.message, 'err'); busy(a, false); } };

/* ---------- Form event ---------- */
function blankEv(G) {
  const kel = {}, pakai = []; let h = 65;
  G.jenjang.slice().sort((a, b) => a.urutan - b.urutan).forEach(j => { if (j.kelas_min < 1) return; if (pakai.some(p => j.kelas_min <= p[1] && p[0] <= j.kelas_max)) return; pakai.push([j.kelas_min, j.kelas_max]); kel[j.kode_jenjang] = String.fromCharCode(h++); });
  return { ev_id: '', nama: '', musim: '', tingkat: 'Provinsi', wilayah: '', penyelenggara: '', tgl_mulai: '', tgl_selesai: '', venue: '', alamat: '', kota: '', maps_url: '', kolam: 'LCM', lintasan: 8, daftar_mulai: '', daftar_tutup: '', kuota_atlet: 0, biaya_mode: 'PAKET', biaya_paket: 0, biaya_nomor: 0, nomor_min: 1, nomor_max: 3, min_peserta: 5, tipe_akun: 'SEKOLAH,KLUB,MANDIRI', kelompok: kel, label_kelompok: 'KEDUANYA', info: { sistem: 'Semua nomor langsung final (timed final)', start: 'Peraturan 1 (satu) kali start', aturan: 'Peraturan Perlombaan World Aquatics', nt: '99:99.99 atau NT (non-seeded)' } };
}
V['a-evform'] = function (id) {
  const t = S.rt;
  Promise.all([rp('ev.get', id ? { id } : {}), rp('ev.list')]).then(([g, l]) => {
    if (t !== S.rt) return; S.EVL = l.data; const G = g.data;
    S.EVF = { G, id: id || '', ev: id ? JSON.parse(JSON.stringify(G.ev)) : blankEv(G), salin: '' };
    drawEvForm();
  }).catch(e => KRP.errView(e.message, () => go('a-evform', id)));
};
function nextHuruf(kel) { const used = Object.keys(kel).map(k => kel[k]); for (let c = 65; c < 91; c++) { const h = String.fromCharCode(c); if (used.indexOf(h) < 0) return h; } return ''; }
function kelBlok() {
  const F = S.EVF, e = F.ev, kel = e.kelompok || {};
  return `<div class="k-scroll"><table class="k-table ev-kel"><thead><tr><th>Ikut</th><th>Kelompok</th><th>Kelas</th><th>Huruf</th></tr></thead><tbody>${F.G.jenjang.map(j => { const on = kel[j.kode_jenjang] !== undefined; return `<tr class="${on ? '' : 'dim'}"><td><input type="checkbox" data-chg="evf-kel" data-k="${E(j.kode_jenjang)}" ${on ? 'checked' : ''} aria-label="Ikutkan ${E(j.nama_jenjang)}"></td><td><b>${E(j.nama_jenjang)}</b><br><small class="mut mono">${E(j.kode_jenjang)}</small></td><td>${j.kelas_min === j.kelas_max ? (j.kelas_min === 0 ? 'TK' : j.kelas_min) : j.kelas_min + '–' + j.kelas_max}</td><td><input class="k-in ev-huruf" maxlength="3" data-in="evf-huruf" data-k="${E(j.kode_jenjang)}" value="${E(kel[j.kode_jenjang] || '')}" ${on ? '' : 'disabled'} placeholder="A" aria-label="Huruf kelompok"></td></tr>`; }).join('')}</tbody></table></div>
<div class="ev-grid" style="margin-top:12px">${field('Label kelompok di web & buku acara', sel('label_kelompok', [['KEDUANYA', 'Kelompok A (SD Kelas 1-2)'], ['HURUF', 'Kelompok A'], ['KELAS', 'SD Kelas 1-2']], e.label_kelompok, 'data-chg="evf-lbl"'))}</div>
<details class="ev-det"><summary>Tambah kelompok baru (mis. SMP Kelas 7–9 gabungan)</summary><div class="ev-grid" style="margin-top:8px">${field('Nama (opsional)', '<input class="k-in" id="kb-nama" placeholder="SMP Kelas 7-9">')}${field('Kelas dari', '<input class="k-in" id="kb-min" type="number" min="0" max="12" value="7">')}${field('Kelas sampai', '<input class="k-in" id="kb-max" type="number" min="0" max="12" value="9">')}</div><button type="button" class="k-btn sm k-navy" data-act="evf-kelbaru">Tambah ke master kelompok</button><p class="mut sm">Rentang kelas kelompok yang dipilih dalam satu event tidak boleh bertumpuk.</p></details>`;
}
function drawEvForm() {
  const F = S.EVF, e = F.ev, G = F.G, inf = e.info || {}, baru = !F.id, tipe = String(e.tipe_akun || '').split(',');
  const ta = (k, rows, p) => `<textarea class="k-in" name="i_${k}" rows="${rows || 4}" placeholder="${E(p === undefined ? 'Satu baris satu poin' : p)}">${E(inf[k] || '')}</textarea>`;
  const ii = (k, p, type) => inp('i_' + k, inf[k] || '', { ph: p, type });
  main(`<div class="k-wrap pad"><div class="ev-form">${ph(baru ? 'Tambah Event' : 'Ubah Event', baru ? 'Lengkapi info perlombaan. Setelah disimpan, tambahkan nomor lomba lalu aktifkan agar tampil di web.' : (e.aktif ? '<span class="k-pill k-navy">AKTIF DI WEB</span> Perubahan langsung berlaku di web dan akun peserta.' : 'Event belum aktif di web.'), `<button class="k-btn k-ghostw" data-go="a-event"><i class="bi bi-arrow-left"></i> Kembali</button>`)}
<form data-submit="evf" autocomplete="off" novalidate>
${baru && S.EVL.events.length ? sec('bi-files', 'Salin dari event lain (opsional)', `<div class="ev-grid">${field('Salin pengaturan & nomor dari', sel('salin', [['', '— tidak menyalin —']].concat(S.EVL.events.map(x => [x.musim, x.nama + ' (' + x.musim + ')'])), F.salin, 'data-chg="evf-salin"'), 0, 'Untuk seri berikutnya: biaya, kelompok, ketentuan, dan susunan nomor ikut disalin. Nama, kode musim, dan tanggal diisi baru.')}</div>`) : ''}
${sec('bi-trophy', '1. Identitas event', `<div class="ev-grid"><div class="ev-wide">${field('Nama event', inp('nama', e.nama, { req: 1, max: 160, ph: 'mis. Kejuaraan Renang Pelajar Jabodetabek Seri 3 2027' }), 1)}</div>${field('Kode musim', inp('musim', e.musim, { req: 1, max: 30, ph: 'mis. Seri 3 2027' }), 1, 'Unik dan singkat. Dipakai untuk arsip, rekor, dan kurasi.')}${field('Tingkat event', sel('tingkat', G.tingkat, e.tingkat), 1, 'Mengikuti tingkatan kurasi Puspresnas.')}${field('Wilayah peserta', inp('wilayah', e.wilayah, { ph: 'mis. Jabodetabek' }))}${field('Penyelenggara', inp('penyelenggara', e.penyelenggara, { ph: 'Nama panitia / lembaga' }))}</div>`)}
${sec('bi-geo-alt', '2. Waktu & tempat', `<div class="ev-grid">${field('Tanggal mulai', inp('tgl_mulai', e.tgl_mulai, { type: 'date', req: 1 }), 1)}${field('Tanggal selesai', inp('tgl_selesai', e.tgl_selesai === e.tgl_mulai ? '' : e.tgl_selesai, { type: 'date' }), 0, 'Kosongkan bila satu hari.')}<div class="ev-wide">${field('Tempat / kolam renang', inp('venue', e.venue, { req: 1, max: 160 }), 1)}</div>${field('Alamat', inp('alamat', e.alamat, { max: 250 }))}${field('Kab/Kota', inp('kota', e.kota, { max: 80 }))}${field('Tautan Google Maps (opsional)', inp('maps_url', e.maps_url, { type: 'url', ph: 'https://maps.app.goo.gl/…' }), 0, 'Kosong = peta dicari otomatis dari nama tempat.')}</div>`)}
${sec('bi-water', '3. Teknis perlombaan', `<div class="ev-grid">${field('Kolam', sel('kolam', [['SCM', 'Short course — 25 m'], ['LCM', 'Long course — 50 m']], e.kolam), 1, 'Rekor kolam 25 m dan 50 m dicatat terpisah.')}${field('Jumlah lintasan', inp('lintasan', e.lintasan, { type: 'number', req: 1, attr: 'min="2" max="10"' }), 1)}${field('Minimal peserta per nomor', inp('min_peserta', e.min_peserta, { type: 'number', attr: 'min="0" max="50"' }), 0, 'Nomor di bawah angka ini ditandai untuk dibatalkan.')}${field('Sistem lomba', ii('sistem', 'Semua nomor langsung final (timed final)'))}${field('Aturan start', ii('start', 'Peraturan 1 (satu) kali start'))}${field('Peraturan', ii('aturan', 'Peraturan Perlombaan World Aquatics'))}${field('Waktu tanpa catatan (NT)', ii('nt', '99:99.99 atau NT'))}</div>`)}
${sec('bi-door-open', '4. Pendaftaran', `<div class="ev-grid">${field('Dibuka mulai', inp('daftar_mulai', dtLocal(e.daftar_mulai), { type: 'datetime-local' }), 0, 'Kosongkan bila langsung dibuka saat event aktif.')}${field('Ditutup', inp('daftar_tutup', dtLocal(e.daftar_tutup), { type: 'datetime-local', req: 1 }), 1, 'Waktu WIB. Setelah ini pendaftaran tertutup otomatis.')}${field('Kuota peserta (atlet)', inp('kuota_atlet', e.kuota_atlet, { type: 'number', attr: 'min="0"' }), 0, '0 = tanpa batas. Kuota per nomor diatur di tab Nomor.')}${field('Nomor per atlet (minimal – maksimal)', `<div class="ev-2"><input class="k-in" name="nomor_min" type="number" min="1" max="10" value="${E(e.nomor_min)}" aria-label="Minimal nomor"><span>s/d</span><input class="k-in" name="nomor_max" type="number" min="1" max="10" value="${E(e.nomor_max)}" aria-label="Maksimal nomor"></div>`, 1, 'Angka sama = wajib, mis. 3 s/d 3 berarti wajib 3 nomor.')}${field('Buku acara terbit', ii('tgl_buku_acara', '', 'date'))}${field('Technical meeting (opsional)', ii('tm', 'mis. Kamis, 26 Nov 2026 pukul 15.00'))}</div>
<div class="ev-sub">Jenis akun yang boleh mendaftar</div><div class="k-chips">${[['SEKOLAH', 'Sekolah'], ['KLUB', 'Klub'], ['MANDIRI', 'Mandiri (pribadi)']].map(t => `<label class="k-check1 ev-cb"><input type="checkbox" name="tp_${t[0]}" ${tipe.indexOf(t[0]) >= 0 ? 'checked' : ''}> ${t[1]}</label>`).join('')}</div>
<div class="ev-sub">Biaya pendaftaran</div><div class="k-seg ev-mode">${[['PAKET', 'Paket per atlet'], ['NOMOR', 'Per nomor']].map(m => `<label class="${e.biaya_mode === m[0] ? 'on' : ''}"><input type="radio" name="biaya_mode" value="${m[0]}" ${e.biaya_mode === m[0] ? 'checked' : ''} data-chg="evf-mode">${m[1]}</label>`).join('')}</div>
<div class="ev-grid" style="margin-top:10px"><div id="evf-paket" ${e.biaya_mode === 'PAKET' ? '' : 'hidden'}>${field('Harga paket per atlet (Rp)', inp('biaya_paket', e.biaya_paket, { type: 'number', attr: 'min="0" step="1000"' }), 0, 'Untuk maksimal nomor per atlet di atas.')}</div><div id="evf-nomor" ${e.biaya_mode === 'NOMOR' ? '' : 'hidden'}>${field('Biaya per nomor (Rp)', inp('biaya_nomor', e.biaya_nomor, { type: 'number', attr: 'min="0" step="1000"' }))}${baru ? '' : '<label class="k-check1"><input type="checkbox" name="terapkanBiaya"> Terapkan ke semua nomor event ini</label>'}</div></div>`)}
${sec('bi-people', '5. Kelompok peserta', `<p class="mut sm">Centang kelompok yang dipertandingkan dan beri huruf sesuai pedoman. Atlet otomatis masuk kelompok berdasarkan kelasnya, dan hanya melihat nomor kelompoknya.</p><div id="evf-kel">${kelBlok()}</div>`)}
${sec('bi-bank', '6. Pembayaran & kontak', `<div class="ev-grid">${field('Bank', ii('bank_nama', 'mis. BCA'))}${field('Nomor rekening', ii('bank_norek', ''))}${field('Atas nama', ii('bank_an', ''))}${field('Konfirmasi pembayaran', ii('konfirmasi', 'Nama — nomor WhatsApp'))}${field('Kontak panitia (nama)', ii('kontak_nama', ''))}${field('Kontak panitia (HP/WA)', ii('kontak_hp', '08…'))}${field('Email panitia', ii('kontak_email', '', 'email'))}${field('Grup WhatsApp peserta', ii('wa_grup', 'https://chat.whatsapp.com/…', 'url'))}${field('Tautan pendaftaran lain (opsional)', ii('link_daftar', 'https://…', 'url'), 0, 'Mis. formulir lama. Pendaftaran di web ini tetap utama.')}</div>${field('Catatan rekening lain (opsional)', ta('rekening_lain', 2, ''))}<p class="mut sm"><i class="bi bi-shield-lock"></i> Rekening hanya tampil di akun pendaftar, tidak di halaman publik.</p>`)}
${sec('bi-journal-text', '7. Ketentuan (tampil di halaman Info Lomba)', `<p class="mut sm">Satu baris = satu poin. Kosongkan bagian yang tidak diperlukan.</p><div class="ev-grid2">${field('Persyaratan peserta', ta('syarat', 5))}${field('Ketentuan perlombaan', ta('lomba', 5))}${field('Biaya & pembayaran', ta('bayar', 4))}${field('Penghargaan', ta('penghargaan', 5))}${field('Penentuan perenang terbaik', ta('terbaik', 4))}${field('Protes', ta('protes', 5))}${field('Kesehatan & tanggung jawab', ta('kesehatan', 5))}${field('Lain-lain', ta('lain', 3))}</div><div class="ev-grid">${field('Uang jaminan protes (Rp)', ii('uang_protes', '', 'number'))}${field('Batas waktu protes', ii('batas_protes', 'mis. 30 menit'))}</div>`)}
<div class="k-bar sticky"><button type="button" class="k-btn k-ghostw" data-go="a-event">Batal</button><button class="k-btn lg k-orange">${baru ? 'Simpan event' : 'Simpan perubahan'}</button></div></form></div></div>`);
}
INP['evf-kel'] = i => { const kel = S.EVF.ev.kelompok; if (i.checked) kel[i.dataset.k] = nextHuruf(kel); else delete kel[i.dataset.k]; $('#evf-kel').innerHTML = kelBlok(); };
INP['evf-huruf'] = i => { S.EVF.ev.kelompok[i.dataset.k] = i.value.toUpperCase(); };
INP['evf-lbl'] = i => { S.EVF.ev.label_kelompok = i.value; };
INP['evf-mode'] = i => { const p = i.value === 'PAKET'; $('#evf-paket').hidden = !p; $('#evf-nomor').hidden = p; $$('.ev-mode label').forEach(l => l.classList.toggle('on', $('input', l).checked)); };
ACT['evf-kelbaru'] = async a => {
  const mn = Number($('#kb-min').value), mx = Number($('#kb-max').value), nama = $('#kb-nama').value.trim(); busy(a, true);
  try { const r = await rp('ev.kel', { nama, min: mn, max: mx }); const G = S.EVF.G; if (!G.jenjang.some(j => j.kode_jenjang === r.data.kode)) G.jenjang.push({ kode_jenjang: r.data.kode, nama_jenjang: nama || r.data.kode.replace(/_/, ' Kelas ').replace(/_/, '-'), kelas_min: mn, kelas_max: mx, urutan: 99 }); toast(r.message); $('#evf-kel').innerHTML = kelBlok(); }
  catch (e) { toast(e.message, 'err'); busy(a, false); }
};
INP['evf-salin'] = async i => {
  const f = i.closest('form'), cur = form(f), F = S.EVF; F.salin = i.value; if (!i.value) return;
  try {
    const g = (await rp('ev.get', { musim: i.value })).data.ev, keep = ['nama', 'musim', 'tgl_mulai', 'tgl_selesai', 'daftar_mulai', 'daftar_tutup'];
    const n = JSON.parse(JSON.stringify(g)); n.ev_id = ''; keep.forEach(k => n[k] = cur[k] || ''); n.info = Object.assign({}, g.info, { tgl_buku_acara: '' }); F.ev = n; drawEvForm(); toast('Pengaturan disalin. Lengkapi nama, kode musim, dan tanggal.');
  } catch (e) { toast(e.message, 'err'); }
};
SUBMIT.evf = async f => {
  const b = $('button.k-orange', f), d = form(f), F = S.EVF, info = {}, kel = {};
  Object.keys(d).forEach(k => { if (k.indexOf('i_') === 0) info[k.slice(2)] = d[k]; });
  Object.keys(F.ev.kelompok || {}).forEach(k => { kel[k] = String(F.ev.kelompok[k] || '').toUpperCase(); });
  const ev = { ev_id: F.id, nama: d.nama, musim: d.musim, tingkat: d.tingkat, wilayah: d.wilayah, penyelenggara: d.penyelenggara, tgl_mulai: d.tgl_mulai, tgl_selesai: d.tgl_selesai, venue: d.venue, alamat: d.alamat, kota: d.kota, maps_url: d.maps_url, kolam: d.kolam, lintasan: d.lintasan, min_peserta: d.min_peserta, daftar_mulai: d.daftar_mulai, daftar_tutup: d.daftar_tutup, kuota_atlet: d.kuota_atlet || 0, nomor_min: d.nomor_min, nomor_max: d.nomor_max, biaya_mode: d.biaya_mode, biaya_paket: d.biaya_paket || 0, biaya_nomor: d.biaya_nomor || 0, tipe_akun: ['SEKOLAH', 'KLUB', 'MANDIRI'].filter(t => d['tp_' + t]), kelompok: kel, label_kelompok: d.label_kelompok || F.ev.label_kelompok, info };
  busy(b, true);
  try {
    const r = await rp('ev.simpan', { ev, terapkanBiaya: !!d.terapkanBiaya, salinDari: F.id ? '' : (d.salin || '') }); toast(r.message); bustCache('evl'); bustCache('evg');
    if (r.data.aktif) await S.refreshAll();
    if (!F.id) { S.evMusim = r.data.musim; S.nsel = {}; S.nf = null; S.evTab = 'nomor'; go('a-event', 'nomor'); } else { S.evTab = 'ev'; go('a-event', 'ev'); }
  } catch (e) { toast(e.message, 'err'); busy(b, false); }
};

/* ---------- Tab Nomor pertandingan ---------- */
function loadNomor() {
  const t = S.rt, m = S.evMusim || '';
  swr('evg_' + (m || 'aktif'), 'ev.get', m ? { musim: m } : {}, d => { if (t !== S.rt) return; S.EVG = d; if (S.evMusim !== d.ev.musim) { S.evMusim = d.ev.musim; S.nsel = {}; } drawNomor(); }, 1500);
}
const reloadN = async msg => { if (msg) toast(msg); bustCache('evg'); bustCache('evl'); if (S.EVG && S.EVG.ev.aktif) await S.refreshAll(); if (S.route === 'a-event') loadNomor(); };
function drawNomor() {
  const G = S.EVG, e = G.ev, kel = e.kelompok, f = S.nf = S.nf || { jk: '', g: '', st: '', q: '' }; S.nsel = S.nsel || {};
  const jen = G.jenjang.filter(j => kel[j.kode_jenjang] !== undefined), cnt = {};
  G.nomor.forEach(n => { const c = cnt[n.jenjang_kode] || (cnt[n.jenjang_kode] = 0); if (n.is_active) cnt[n.jenjang_kode] = c + 1; });
  main(`<div class="k-wrap pad">${head()}${tabs()}
<div class="ev-ntop"><label class="k-f ev-pick"><span>Event</span><select class="k-in" data-chg="evn-pick">${G.events.map(x => `<option value="${E(x.musim)}"${x.musim === e.musim ? ' selected' : ''}>${E(x.nama)}${x.aktif ? ' — AKTIF' : ''}</option>`).join('')}</select></label>
<div class="ev-nsum">${e.aktif ? '<span class="k-pill k-navy">AKTIF DI WEB</span>' : '<span class="k-pill k-neu">Belum aktif</span>'}<span class="k-chip sm">${e.kolam === 'SCM' ? 'Kolam 25 m' : 'Kolam 50 m'}</span><span class="k-chip sm">${e.biaya_mode === 'PAKET' ? 'Paket ' + rupiah(e.biaya_paket) + ' / ' + e.nomor_max + ' nomor' : rupiah(e.biaya_nomor) + ' per nomor'}</span><span class="k-chip sm">${e.nomor_min === e.nomor_max ? 'Wajib ' + e.nomor_min : e.nomor_min + '–' + e.nomor_max} nomor/atlet</span><span class="k-chip sm">Min. ${e.min_peserta} peserta/nomor</span><button class="k-btn sm k-ghostw" data-act="ev-edit" data-id="${E(e.ev_id)}"><i class="bi bi-gear"></i> Pengaturan event</button></div></div>
${G.nomor.length ? '' : alertx('info', 'Event ini belum punya nomor. Pakai <b>Generator nomor</b> untuk membuat banyak nomor sekaligus per kelompok, atau <b>Tambah nomor</b> satu per satu.', 'bi-lightbulb')}
<div class="k-chips ev-kchips"><button class="k-chip${!f.jk ? ' on' : ''}" data-act="evn-jk" data-v="">Semua kelompok · ${G.nomor.filter(n => n.is_active).length}</button>${jen.map(j => `<button class="k-chip${f.jk === j.kode_jenjang ? ' on' : ''}" data-act="evn-jk" data-v="${E(j.kode_jenjang)}">${E(kelLbl(kel[j.kode_jenjang], j.nama_jenjang))} · ${cnt[j.kode_jenjang] || 0}</button>`).join('')}</div>
<div class="ev-tool"><div class="ev-tool-l"><input class="k-in ev-q" data-in="evn-q" placeholder="Cari nomor (mis. 50m bebas, 12)" value="${E(f.q)}"><div class="k-seg sm">${[['', 'Semua'], ['PUTRA', 'Putra'], ['PUTRI', 'Putri']].map(x => `<button class="${f.g === x[0] ? 'on' : ''}" data-act="evn-g" data-v="${x[0]}">${x[1]}</button>`).join('')}</div>${sel('evn-st', [['', 'Semua status'], ['BUKA', 'Dibuka'], ['TUTUP', 'Ditutup'], ['BATAL', 'Dibatalkan'], ['KURANG', 'Peserta < minimal'], ['PENUH', 'Kuota penuh']], f.st, 'data-chg="evn-st" aria-label="Filter status"')}</div>
<div class="ev-tool-r"><button class="k-btn k-outline" data-act="evn-rapi"><i class="bi bi-sort-numeric-down"></i> Rapikan nomor</button><button class="k-btn k-navy" data-act="evn-gen"><i class="bi bi-grid-3x3-gap"></i> Generator nomor</button><button class="k-btn k-red" data-act="evn-edit" data-id=""><i class="bi bi-plus-lg"></i> Tambah nomor</button></div></div>
<div id="evn-bulk"></div>
<div class="k-card"><div class="k-scroll"><table class="k-table ev-ntbl"><thead><tr><th><input type="checkbox" data-chg="evn-all" aria-label="Pilih semua"></th><th>No</th><th>Nomor</th><th>Kelompok</th><th>Gender</th><th>Hari</th><th>Peserta</th><th>Kuota</th>${e.biaya_mode === 'PAKET' ? '' : '<th>Biaya</th>'}<th>Pendaftaran</th><th class="r">Aksi</th></tr></thead><tbody id="evn-rows"></tbody></table></div></div>
<p class="ev-foot"><i class="bi bi-info-circle"></i> <b>Dibuka</b> = peserta bisa memilih nomor ini di akunnya (sesuai kelompok & gender). <b>Ditutup</b> = tetap dipertandingkan, tanpa pendaftar baru. <b>Dibatalkan</b> = tidak dipertandingkan (mis. peserta kurang dari minimal); pindahkan pesertanya lewat Akun & Berkas.</p></div>`);
  drawNRows();
}
function nFilt() {
  const G = S.EVG, f = S.nf, q = f.q.toLowerCase().replace('#', '').trim(), min = G.ev.min_peserta;
  return G.nomor.filter(n => (!f.jk || n.jenjang_kode === f.jk) && (!f.g || n.gender === f.g)
    && (!f.st || (f.st === 'BUKA' && n.is_active && n.dibuka !== '0') || (f.st === 'TUTUP' && n.is_active && n.dibuka === '0') || (f.st === 'BATAL' && !n.is_active) || (f.st === 'KURANG' && n.is_active && n.n < min) || (f.st === 'PENUH' && n.max_quota > 0 && n.n >= n.max_quota))
    && (!q || String(n.event_no) === q || (n.distance_m + 'm ' + n.stroke_type).toLowerCase().indexOf(q) >= 0 || (n.distance_m + 'm ' + n.stroke_type.replace('Gaya ', '')).toLowerCase().indexOf(q) >= 0));
}
function drawNRows() {
  const G = S.EVG, e = G.ev, kel = e.kelompok, jen = {}, el = $('#evn-rows'); if (!el) return; G.jenjang.forEach(j => jen[j.kode_jenjang] = j);
  const L = nFilt();
  el.innerHTML = L.length ? L.map(n => {
    const j = jen[n.jenjang_kode] || {}, kurang = n.is_active && e.aktif && G.fase !== 'PENDAFTARAN' && e.min_peserta && n.n < e.min_peserta, penuh = n.max_quota > 0 && n.n >= n.max_quota;
    return `<tr class="${n.is_active ? '' : 'dim'}"><td><input type="checkbox" data-chg="evn-sel" value="${E(n.event_id)}" ${S.nsel[n.event_id] ? 'checked' : ''} aria-label="Pilih nomor ${n.event_no}"></td><td class="mono"><b>#${n.event_no}</b></td><td><b>${E(n.event_name)}</b></td><td>${E(kelLbl(kel[n.jenjang_kode], j.nama_jenjang || n.jenjang_kode))}</td><td>${G_L[n.gender]}</td><td>${n.hari}</td>
<td class="mono${kurang ? ' ev-warn' : ''}" title="${kurang ? 'Kurang dari minimal ' + e.min_peserta + ' peserta' : ''}">${n.n}${kurang ? ' <i class="bi bi-exclamation-triangle"></i>' : ''}</td><td class="mono">${n.max_quota ? (penuh ? `<span class="k-pill k-err">Penuh · ${n.max_quota}</span>` : n.max_quota) : '<span class="mut">∞</span>'}</td>${e.biaya_mode === 'PAKET' ? '' : `<td class="mono">${rupiah(n.fee_amount)}</td>`}
<td>${!n.is_active ? '<span class="k-pill k-neu">Dibatalkan</span>' : `<button type="button" class="ev-pb" data-act="evn-tog" data-id="${E(n.event_id)}" title="Klik untuk ${n.dibuka === '0' ? 'membuka' : 'menutup'} pendaftaran nomor ini">${n.dibuka === '0' ? '<span class="k-pill k-err">Ditutup</span>' : '<span class="k-pill k-ok">Dibuka</span>'}</button>`}</td>
<td class="r nw"><div class="ev-act">${ib('evn-edit', n.event_id, 'bi-pencil-square', 'Ubah nomor')}${ib('evn-del', n.event_id, 'bi-trash', 'Hapus nomor', 'del')}</div></td></tr>`;
  }).join('') : '<tr><td colspan="11" class="mut" style="text-align:center;padding:24px">Tidak ada nomor yang cocok.</td></tr>';
  drawBulk();
}
function drawBulk() {
  const n = Object.keys(S.nsel).length, el = $('#evn-bulk'); if (!el) return;
  el.innerHTML = n ? `<div class="k-bulk ev-bulk"><b>${n} nomor dipilih</b>${[['buka', 'Buka'], ['tutup', 'Tutup'], ['batal', 'Batalkan'], ['pulih', 'Pulihkan']].map(x => `<button class="k-btn sm k-outline" data-act="evn-mas" data-v="${x[0]}">${x[1]}</button>`).join('')}<span class="ev-bk-f"><select class="k-in" id="bk-hari" aria-label="Hari">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(h => `<option value="${h}">Hari ${h}</option>`).join('')}</select><button class="k-btn sm k-outline" data-act="evn-mas" data-v="hari">Pindah hari</button></span><span class="ev-bk-f"><input class="k-in" id="bk-kuota" type="number" min="0" placeholder="Kuota" aria-label="Kuota"><button class="k-btn sm k-outline" data-act="evn-mas" data-v="kuota">Set kuota</button></span><button class="k-btn sm k-danger" data-act="evn-mas" data-v="hapus"><i class="bi bi-trash"></i> Hapus</button><button class="k-btn sm k-ghostw" data-act="evn-unsel">Batal pilih</button></div>` : '';
}
INP['evn-pick'] = i => { S.evMusim = i.value; S.nsel = {}; S.nf = null; go('a-event', 'nomor'); };
ACT['evn-jk'] = a => { S.nf.jk = a.dataset.v; S.nsel = {}; drawNomor(); };
ACT['evn-g'] = a => { S.nf.g = a.dataset.v; drawNomor(); };
INP['evn-st'] = i => { S.nf.st = i.value; drawNRows(); };
INP['evn-q'] = i => { S.nf.q = i.value; clearTimeout(S._nq); S._nq = setTimeout(drawNRows, 120); };
INP['evn-sel'] = i => { if (i.checked) S.nsel[i.value] = 1; else delete S.nsel[i.value]; drawBulk(); };
INP['evn-all'] = i => { nFilt().forEach(n => { if (i.checked) S.nsel[n.event_id] = 1; else delete S.nsel[n.event_id]; }); drawNRows(); };
ACT['evn-unsel'] = () => { S.nsel = {}; drawNRows(); };
const nOf = id => S.EVG.nomor.filter(x => x.event_id === id)[0];
ACT['evn-tog'] = async a => {
  const n = nOf(a.dataset.id); a.disabled = true;
  try { const r = await rp('ev.nomor.massal', { musim: S.EVG.ev.musim, ids: [n.event_id], aksi: n.dibuka === '0' ? 'buka' : 'tutup' }); n.dibuka = n.dibuka === '0' ? '1' : '0'; drawNRows(); toast(r.message); bustCache('evg'); bustCache('evl'); if (S.EVG.ev.aktif) S.refreshAll(); }
  catch (e) { toast(e.message, 'err'); a.disabled = false; }
};
ACT['evn-mas'] = async a => {
  const v = a.dataset.v, ids = Object.keys(S.nsel);
  if (v === 'hapus' && !(await ask(`Hapus ${ids.length} nomor? Nomor yang sudah punya pendaftar akan dibatalkan, bukan dihapus.`, 'Hapus', true))) return;
  if (v === 'batal' && !(await ask(`Batalkan ${ids.length} nomor? Nomor tidak dipertandingkan dan tidak tampil di web. Pendaftarnya perlu dipindahkan lewat Akun & Berkas.`, 'Batalkan', true))) return;
  busy(a, true);
  try { const r = await rp('ev.nomor.massal', { musim: S.EVG.ev.musim, ids, aksi: v, hari: ($('#bk-hari') || {}).value, kuota: ($('#bk-kuota') || {}).value }); S.nsel = {}; await reloadN(r.message); }
  catch (e) { toast(e.message, 'err'); busy(a, false); }
};
ACT['evn-edit'] = a => {
  const G = S.EVG, e = G.ev, kel = e.kelompok, n = nOf(a.dataset.id), baru = !n, jen = G.jenjang.filter(j => kel[j.kode_jenjang] !== undefined);
  if (!jen.length) return toast('Atur kelompok peserta di pengaturan event dulu.', 'err');
  const x = n || { event_no: Math.max(0, ...G.nomor.map(z => z.event_no)) + 1, distance_m: 50, stroke_type: 'Gaya Bebas', gender: 'KEDUANYA', jenjang_kode: S.nf.jk || jen[0].kode_jenjang, hari: 1, max_quota: 0, fee_amount: e.biaya_nomor, dibuka: '1', is_active: 1 };
  const kunci = n && n.n > 0, dis = kunci ? 'disabled' : '';
  modal(baru ? 'Tambah nomor lomba' : `Ubah nomor #${n.event_no}`, `<form data-submit="evn" data-id="${E(n ? n.event_id : '')}">${kunci ? alertx('info', `Nomor ini sudah punya <b>${n.n}</b> pendaftar: jarak, gaya, gender, dan kelompok dikunci.`, 'bi-lock') : ''}
<div class="g2">${field('Nomor acara', inp('event_no', x.event_no, { type: 'number', req: 1, attr: 'min="1" max="9999"' }), 1, baru ? 'Putra & putri memakai dua nomor berurutan.' : '')}${field('Kelompok', sel('jenjang_kode', jen.map(j => [j.kode_jenjang, kelLbl(kel[j.kode_jenjang], j.nama_jenjang)]), x.jenjang_kode, dis), 1)}${field('Jarak (m)', sel('distance_m', JARAK_G, x.distance_m, dis), 1)}${field('Gaya', sel('stroke_type', GAYA_L, x.stroke_type, dis), 1)}${field('Gender', sel('gender', (baru ? [['KEDUANYA', 'Putra & Putri (2 nomor)']] : []).concat([['PUTRA', 'Putra'], ['PUTRI', 'Putri']]), x.gender, dis), 1)}${field('Hari', sel('hari', [1, 2, 3, 4, 5, 6, 7, 8, 9].map(h => [h, 'Hari ' + h]), x.hari))}${field('Kuota peserta', inp('max_quota', x.max_quota, { type: 'number', attr: 'min="0"' }), 0, '0 = tanpa batas')}${e.biaya_mode === 'PAKET' ? field('Biaya', `<input class="k-in" value="Paket ${E(rupiah(e.biaya_paket))} / atlet" readonly>`) : field('Biaya (Rp)', inp('fee_amount', x.fee_amount, { type: 'number', attr: 'min="0" step="1000"' }))}</div>
<label class="k-check1"><input type="checkbox" name="dibuka" ${x.dibuka !== '0' ? 'checked' : ''}> Pendaftaran nomor dibuka</label><label class="k-check1"><input type="checkbox" name="is_active" ${x.is_active ? 'checked' : ''}> Dipertandingkan (hapus centang = dibatalkan)</label>
<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">Simpan</button></div></form>`);
};
SUBMIT.evn = async f => {
  const b = $('button.k-orange', f), d = form(f), n = nOf(f.dataset.id), rec = Object.assign({}, d, { event_id: f.dataset.id });
  if (n && n.n > 0) Object.assign(rec, { jenjang_kode: n.jenjang_kode, distance_m: n.distance_m, stroke_type: n.stroke_type, gender: n.gender });
  busy(b, true);
  try { const r = await rp('ev.nomor.simpan', { musim: S.EVG.ev.musim, rec }); closeModal(); await reloadN(r.message); } catch (e) { toast(e.message, 'err'); busy(b, false); }
};
ACT['evn-del'] = async a => {
  const n = nOf(a.dataset.id); if (!(await ask(`Hapus nomor #${n.event_no} ${E(n.event_name)} ${G_L[n.gender]}?${n.n ? ' Nomor ini punya pendaftar, jadi akan <b>dibatalkan</b> (tidak dihapus).' : ''}`, 'Hapus', true))) return;
  try { const r = await rp('ev.nomor.hapus', { id: n.event_id }); await reloadN(r.message); } catch (e) { toast(e.message, 'err'); }
};
ACT['evn-gen'] = () => {
  const G = S.EVG, e = G.ev, kel = e.kelompok, jen = G.jenjang.filter(j => kel[j.kode_jenjang] !== undefined), ada = {};
  if (!jen.length) return toast('Atur kelompok peserta di pengaturan event dulu.', 'err');
  G.nomor.forEach(n => { ada[[n.jenjang_kode, n.stroke_type, n.distance_m].join('|')] = 1; });
  modal('Generator nomor lomba', `<form data-submit="evn-gen"><p class="mut sm">Centang jarak tiap gaya per kelompok. Setiap centang membuat <b>2 nomor (putra & putri)</b>. Kombinasi yang sudah ada ditandai dan dilewati.</p>
${jen.map(j => `<div class="ev-gen"><div class="ev-gen-h"><b>${E(kelLbl(kel[j.kode_jenjang], j.nama_jenjang))}</b><label>Hari ${sel('h_' + j.kode_jenjang, [1, 2, 3, 4, 5, 6, 7, 8, 9], 1)}</label></div><div class="k-scroll"><table class="ev-gen-t"><thead><tr><th>Gaya \\ Jarak</th>${JARAK_G.map(d => `<th>${d} m</th>`).join('')}</tr></thead><tbody>${GAYA_L.map(g => `<tr><td>${E(GAYA_S[g])}</td>${JARAK_G.map(d => { const k = [j.kode_jenjang, g, d].join('|'), on = ada[k]; return `<td><input type="checkbox" class="gen-cb" data-k="${E(k)}" ${on ? 'checked disabled title="Sudah ada"' : ''} aria-label="${E(g)} ${d} m"></td>`; }).join('')}</tr>`).join('')}</tbody></table></div></div>`).join('')}
<div class="g2">${field('Urutan penomoran', sel('urut', [['GAYA', 'Per gaya & jarak, lalu kelompok (gaya KRP)'], ['KELOMPOK', 'Per kelompok, lalu gaya & jarak']], 'GAYA'))}${field('Mulai dari nomor acara', inp('mulai', Math.max(0, ...G.nomor.map(n => n.event_no)) + 1, { type: 'number', attr: 'min="1"' }))}</div>
<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">Buat nomor</button></div></form>`, '', true);
};
SUBMIT['evn-gen'] = async f => {
  const d = form(f), plan = $$('.gen-cb:checked:not(:disabled)', f).map(c => { const p = c.dataset.k.split('|'); return { jk: p[0], s: p[1], d: Number(p[2]), h: Number(d['h_' + p[0]] || 1) }; });
  if (!plan.length) return toast('Centang minimal satu jarak.', 'err');
  const b = $('button.k-orange', f); busy(b, true);
  try { const r = await rp('ev.nomor.gen', { musim: S.EVG.ev.musim, plan, urut: d.urut, mulai: d.mulai }); closeModal(); await reloadN(r.message); } catch (e) { toast(e.message, 'err'); busy(b, false); }
};
ACT['evn-rapi'] = () => modal('Rapikan nomor acara', `<form data-submit="evn-rapi"><p>Nomor acara diurutkan ulang tanpa celah sesuai <b>hari</b> lalu <b>nomor lama</b>. Nomor yang dibatalkan ditaruh paling akhir.</p>${field('Mulai dari', inp('mulai', 1, { type: 'number', attr: 'min="1"' }))}${alertx('warn', 'Lakukan sebelum Buku Acara terbit agar nomor di web dan dokumen sama.', 'bi-exclamation-triangle')}<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">Rapikan</button></div></form>`);
SUBMIT['evn-rapi'] = async f => { const b = $('button.k-orange', f), d = form(f); busy(b, true); try { const r = await rp('ev.nomor.rapikan', { musim: S.EVG.ev.musim, mulai: d.mulai }); closeModal(); await reloadN(r.message); } catch (e) { toast(e.message, 'err'); busy(b, false); } };

/* ---------- Tab Akun demo ---------- */
function drawDemo() {
  const d = S.EVL.demo;
  main(`<div class="k-wrap pad">${head()}${tabs()}
${alertx('info', 'Akun demo untuk mencoba alur peserta: masuk sebagai <b>sekolah, klub, atau mandiri</b>, melihat nomor yang dibuka sesuai kelompok atlet, lalu mendaftar. Entri akun demo <b>tidak pernah masuk start list</b>, tetapi ikut terhitung kuota selama akunnya ada. Hapus akun demo sebelum pendaftaran ditutup.', 'bi-person-badge')}
${d.ada ? card('Akun demo aktif', `<div class="k-scroll"><table class="k-table"><thead><tr><th>Jenis</th><th>Nama akun</th><th>Login (tab Sekolah / Klub / Pribadi)</th><th>Atlet siap didaftarkan</th><th>Entri</th></tr></thead><tbody>${d.akun.map(k => `<tr><td><span class="k-pill k-info">${E(TIPE_L[k.tipe] || k.tipe)}</span></td><td><b>${E(k.nama)}</b></td><td class="mono" style="user-select:all">${E(k.login)}</td><td class="sm">${k.atlet.map(a => `${E(a.nama)} <span class="mut">· ${G_L[a.g]} kls ${a.kelas} · ${E(jn(a.jk))}</span>`).join('<br>')}</td><td class="mono">${k.entri}</td></tr>`).join('')}</tbody></table></div>`, '', true)
    + `<div class="g2">${card('Atur ulang kata sandi demo', `<form data-submit="ev-demo">${field('Kata sandi baru', inp('sandi', '', { ph: 'Kosongkan untuk dibuat otomatis' }), 0, 'Minimal 8 karakter, huruf dan angka. Satu sandi untuk ketiga akun.')}<button class="k-btn k-navy"><i class="bi bi-key"></i> Simpan sandi demo</button></form>`)}${card('Hapus akun demo', `<p class="sm">Menghapus 3 akun demo beserta atlet, entri, dan berkas uji cobanya. Data peserta asli tidak tersentuh.</p><button class="k-btn k-danger" data-act="ev-demo-hapus"><i class="bi bi-trash"></i> Hapus semua akun demo</button>`)}</div>`
    : card('Buat akun demo', `<p class="sm">Dibuat 3 akun dengan atlet contoh di semua kelompok A–F:</p><ul class="sm ev-ol"><li><b>Sekolah</b> — SMP Demo Tirta Pelajar · 4 atlet SMP kelas 7–9</li><li><b>Klub</b> — Klub Renang Demo Bahari · 8 atlet SD kelas 1–6 dan SMA kelas 10–11</li><li><b>Mandiri</b> — Demo Atlet Mandiri · 1 atlet SD kelas 4</li></ul><form data-submit="ev-demo">${field('Kata sandi (opsional)', inp('sandi', '', { ph: 'Kosongkan untuk dibuat otomatis' }), 0, 'Minimal 8 karakter, huruf dan angka. Satu sandi untuk ketiga akun.')}<button class="k-btn k-orange"><i class="bi bi-person-plus"></i> Buat 3 akun demo</button></form>`)}
${card('Cara uji coba', `<ol class="sm ev-ol"><li>Buka web di jendela penyamaran (atau keluar dulu), klik <b>Masuk</b> → tab <b>Sekolah / Klub / Pribadi</b>.</li><li>Masuk memakai login di atas dan kata sandi demo.</li><li>Di <b>Beranda Akun</b> tampil kartu <b>Nomor lomba dibuka untuk atlet Anda</b>, dikelompokkan per kelompok & gender.</li><li>Buka <b>Daftar Nomor Lomba</b> dan pilih atlet: hanya nomor kelompok & gender atlet itu yang muncul. Pilih sesuai aturan (mis. wajib 3 nomor).</li><li>Unggah bukti bayar (gambar apa saja untuk uji coba), kirim, lalu cek di menu <b>Verifikasi</b>.</li><li>Selesai mencoba, hapus akun demo di halaman ini.</li></ol>`)}</div>`);
}
SUBMIT['ev-demo'] = async f => { const b = $('button', f), d = form(f); busy(b, true); try { const r = await rp('ev.demo', { sandi: d.sandi }); bustCache('evl'); demoBox(r.data); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
function demoBox(x) { modal('Akun demo siap', `<p>Catat kata sandi ini — <b>hanya tampil sekali</b>.</p><div class="k-scroll"><table class="k-table"><thead><tr><th>Jenis</th><th>Login</th><th>Kata sandi</th></tr></thead><tbody>${x.info.akun.map(k => `<tr><td>${E(TIPE_L[k.tipe] || k.tipe)}</td><td class="mono" style="user-select:all">${E(k.login)}</td><td class="mono" style="user-select:all">${E(x.sandi)}</td></tr>`).join('')}</tbody></table></div><p class="mut sm">Masuk lewat tombol Masuk → tab Sekolah / Klub / Pribadi.</p>`, '<button class="k-btn k-navy" data-act="ev-demo-ok">Sudah dicatat</button>'); }
ACT['ev-demo-ok'] = () => { closeModal(); S.evTab = 'demo'; go('a-event', 'demo'); };
ACT['ev-demo-hapus'] = async a => { if (!(await ask('Hapus 3 akun demo beserta atlet & entrinya?', 'Hapus', true))) return; busy(a, true); try { const r = await rp('ev.demo.hapus'); toast(r.message); bustCache('evl'); go('a-event', 'demo'); } catch (e) { toast(e.message, 'err'); busy(a, false); } };

/* ---------- Klaim prestasi (panitia) ---------- */
V['a-klaim'] = function () { const t = S.rt; rp('sa.klaim.list', {}).then(r => { if (t !== S.rt) return; S.KL = r.data; S.klSel = {}; gambarKlaim(); }).catch(e => KRP.errView(e.message, () => go('a-klaim'))); };
function gambarKlaim() {
  const d = S.KL, L = d.menunggu, cek = (ok, t) => ok === null || ok === undefined ? '<span class="pr-c">? ' + t + '</span>' : `<span class="pr-c ${ok ? 'ok' : 'no'}"><i class="bi ${ok ? 'bi-check-lg' : 'bi-x-lg'}"></i> ${t}</span>`;
  main(`<div class="k-wrap pad">${ph('Klaim Prestasi', 'Akun sekolah, klub, dan mandiri mengklaim hasil kejuaraan sebelumnya (data impor) sebagai riwayat prestasi atletnya. Klaim yang cocok kuat (nama, sekolah/klub, dan kelas sesuai) langsung tercatat; sisanya diperiksa di sini.')}
<div class="sa-kpi" style="margin-bottom:12px"><span><b>${L.length}</b> menunggu</span><span><b>${d.sah}</b> sudah tercatat</span></div>
${L.length ? `<div class="k-card"><div class="k-scroll"><table class="k-table"><thead><tr><th><input type="checkbox" data-chg="kl-all" aria-label="Pilih semua"></th><th>Atlet (akun)</th><th>Data di arsip</th><th>Event & nomor</th><th>Hasil</th><th>Kecocokan</th></tr></thead><tbody>${L.map(h => `<tr><td><input type="checkbox" data-chg="kl-sel" value="${E(h.id)}" ${S.klSel[h.id] ? 'checked' : ''}></td><td><b>${E(h.atlet.nama)}</b><br><small class="mut">${E([h.atlet.sk, h.atlet.kl].filter(Boolean).join(' / '))} · kls ${E(h.atlet.kelas)}<br>Akun: ${E(h.atlet.akun)}</small></td><td><b>${E(h.nama)}</b><br><small class="mut">${E([h.sk, h.kl].filter(Boolean).join(' / '))}${h.kelas !== '' ? ' · kls ' + E(h.kelas) : ''}</small></td><td>${E(h.event)}<br><small class="mut">${E(fdt(h.tanggal))} · ${E(h.nomor)}</small></td><td class="mono">${E(h.waktu)} ${h.rank ? '#' + h.rank : ''} ${h.medal ? `<span class="k-pill k-warn">${E(h.medal)}</span>` : ''}</td><td>${cek(h.cn === 2, h.cn === 2 ? 'Nama sama' : 'Nama mirip')}${cek(h.cl, 'Sekolah/klub')}${cek(h.ck, 'Kelas')}</td></tr>`).join('')}</tbody></table></div></div>
<div class="k-bar sticky"><button class="k-btn k-ghostw" data-act="kl-aksi" data-ok="0"><i class="bi bi-x-circle"></i> Tolak terpilih</button><button class="k-btn k-orange" data-act="kl-aksi" data-ok="1"><i class="bi bi-check2-circle"></i> Sahkan terpilih</button></div>` : empty('bi-award', 'Tidak ada klaim yang menunggu pemeriksaan.')}</div>`);
}
INP['kl-sel'] = i => { if (i.checked) S.klSel[i.value] = 1; else delete S.klSel[i.value]; };
INP['kl-all'] = i => { S.KL.menunggu.forEach(h => { if (i.checked) S.klSel[h.id] = 1; else delete S.klSel[h.id]; }); gambarKlaim(); };
ACT['kl-aksi'] = async a => { const ids = Object.keys(S.klSel); if (!ids.length) return toast('Pilih klaim dulu.', 'err'); busy(a, true); try { const r = await rp('sa.klaim.aksi', { ids, ok: a.dataset.ok === '1' }); toast(r.message); go('a-klaim'); } catch (e) { toast(e.message, 'err'); busy(a, false); } };
})();
