/* KRP Pro v2.3.4 — modul panitia (dimuat saat dibutuhkan). Dibuat otomatis oleh tools/build.js dari folder src/. Jangan diedit langsung. */
(function () {
'use strict';
const { $, $$, E, S, V, ACT, SUBMIT, INP, G_L, TIPE_L, FASE, FASE_L, pill, rupiah, fdt, jn, kls, evTitle, thumb, initials, rp, swr, bustCache, toast, modal, closeModal, ask, busy, ph, card, empty, kpi, alertx, field, inp, sel, form, viewFile, go, chart } = KRP;
const main = h => { $('#main').innerHTML = h; };
const isSA = () => S.me && S.me.role === 'SUPER_ADMIN';
const wa = t => { t = String(t || '').replace(/\D/g, ''); if (!t) return ''; if (t[0] === '0') t = '62' + t.slice(1); return `https://wa.me/${t}`; };

/* ===== Rekap pendaftar per kelompok (dipakai Dashboard, Input Data, Wasit) ===== */
function rekapKelompok(rk) {
  const t = rk.total;
  return `<div class="k-scroll"><table class="k-table"><thead><tr><th>Kelompok</th><th>Putra</th><th>Putri</th><th>Total atlet</th><th>Entri putra</th><th>Entri putri</th></tr></thead><tbody>${rk.kelompok.map(k => `<tr><td><b>${E(k.nama)}</b></td><td>${k.putra}</td><td>${k.putri}</td><td><b>${k.total}</b></td><td>${k.entriPutra}</td><td>${k.entriPutri}</td></tr>`).join('')}<tr class="sub"><td>Total</td><td>${t.putra}</td><td>${t.putri}</td><td>${t.total}</td><td colspan="2">${t.entri} entri nomor</td></tr></tbody></table></div>`;
}
function rekapBox(host) { swr('adash', 'a.dash', {}, d => { const el = $(host); if (el) el.innerHTML = card('Rekap pendaftar per kelompok', rekapKelompok(d.rekap), '', true); }); }
S.rekapBox = rekapBox;

/* ===== Dashboard ===== */
V['a-dash'] = function () {
  swr('adash', 'a.dash', {}, d => {
    const k = d.kpi, rk = d.rekap, sa = isSA();
    main(`<div class="k-wrap pad">${ph('Dashboard', `Musim ${E(S.B.cfg.musim)} · tahap <b>${E(FASE_L[d.fase] || d.fase)}</b>`, sa ? `<button class="k-btn k-navy" data-go="a-fase"><i class="bi bi-signpost-split"></i> Tahapan Event</button>` : '')}
${d.buka ? alertx('ok', `Pendaftaran <b>dibuka</b>${d.deadline ? ` — batas ${fdt(d.deadline)}` : ''}.`, 'bi-door-open') : alertx('warn', 'Pendaftaran <b>ditutup</b>. Tidak ada pendaftar baru.', 'bi-door-closed')}
${d.kurang && sa ? `<div class="k-alert warn"><i class="bi bi-exclamation-triangle"></i><div><b>${d.kurang} nomor lomba</b> kurang dari ${rk.min} pendaftar. <a href="#" data-act="kurang"><b>Tandai & hubungi pendaftar →</b></a></div></div>` : ''}
<div class="k-kpis">${kpi('Atlet terdaftar', k.atlet, 'bi-people')}${kpi('Akun pendaftar', k.kontingen, 'bi-building')}${kpi('Menunggu verifikasi', k.menunggu, 'bi-hourglass-split')}${kpi('Perlu revisi', k.revisi, 'bi-tools')}${kpi('Terverifikasi sah', k.sah, 'bi-patch-check')}${kpi('Pengajuan', k.pengajuan, 'bi-arrow-left-right')}${d.nominal !== null ? kpi('Pendapatan terverifikasi', rupiah(d.nominal), 'bi-cash-coin') : ''}</div>
${card('Rekap pendaftar per kelompok (putra / putri / total)', rekapKelompok(rk), '', true)}
${sa ? card(`Atlet per nomor lomba <small class="mut">· minimal ${rk.min} pendaftar</small>`, `<div class="k-scroll"><table class="k-table"><thead><tr><th>No</th><th>Nomor</th><th>Kelompok</th><th>Pendaftar</th><th></th></tr></thead><tbody>${rk.nomor.map(n => `<tr><td class="mono">#${n.no}</td><td>${E(n.nama)} ${G_L[n.g]}</td><td>${E(jn(n.jk))}</td><td><b>${n.n}</b></td><td>${n.kurang ? '<span class="k-pill k-warn">Kurang dari minimum</span>' : '<span class="k-pill k-ok">Cukup</span>'}</td></tr>`).join('')}</tbody></table></div>`, `<button class="k-btn sm k-outline" data-act="kurang">Hubungi pendaftar</button>`, true) : ''}
${sa ? `<div class="g2">${card('Sebaran wilayah sekolah (kab/kota)', rk.wilayah.length ? `<canvas id="ch-wil" height="${Math.max(140, rk.wilayah.length * 26)}"></canvas>` : '<p class="mut">Belum ada data.</p>')}${card('Rincian wilayah', `<div class="k-scroll"><table class="k-table"><thead><tr><th>Kab/Kota</th><th>Putra</th><th>Putri</th><th>Atlet</th></tr></thead><tbody>${rk.wilayah.map(w => `<tr><td>${E(w.n)}</td><td>${w.putra}</td><td>${w.putri}</td><td><b>${w.atlet}</b></td></tr>`).join('')}</tbody></table></div>`, '', true)}</div>` : ''}
<div class="g2">${card('Pendaftar 14 hari terakhir', '<canvas id="ch-trend" height="150"></canvas>')}${card('Atlet per kelompok', '<canvas id="ch-jen" height="150"></canvas>')}</div>
${d.aksi.length ? card('Perlu tindakan', `<ul class="k-list">${d.aksi.map(a => `<li><span><b>${E(a.nama)}</b><br><small class="mut">${E(a.sk)} · ${E(jn(a.jk))} · ${a.ev} nomor</small></span>${pill(a.st)}</li>`).join('')}</ul>`, `<button class="k-btn sm k-navy" data-go="a-verif">Buka verifikasi</button>`) : ''}</div>`);
    setTimeout(() => {
      chart('ch-trend', { type: 'line', data: { labels: d.trend.map(x => x.d.slice(5)), datasets: [{ label: 'Atlet baru', data: d.trend.map(x => x.n), borderColor: '#1B7F9E', backgroundColor: 'rgba(27,127,158,.15)', fill: true, tension: .3 }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });
      chart('ch-jen', { type: 'bar', data: { labels: d.jenjang.map(x => jn(x.k)), datasets: [{ data: d.jenjang.map(x => x.n), backgroundColor: '#0A3D62' }] }, options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });
      if (sa && rk.wilayah.length) chart('ch-wil', { type: 'bar', data: { labels: rk.wilayah.map(x => x.n), datasets: [{ label: 'Putra', data: rk.wilayah.map(x => x.putra), backgroundColor: '#1B7F9E' }, { label: 'Putri', data: rk.wilayah.map(x => x.putri), backgroundColor: '#F28C28' }] }, options: { indexAxis: 'y', scales: { x: { stacked: true, ticks: { precision: 0 } }, y: { stacked: true } } } });
    }, 60);
  }, 10000);
};
ACT.kurang = async (a, e) => {
  if (e) e.preventDefault(); modal('Nomor kurang dari batas minimum', '<div class="k-skel"></div>', '', true);
  try {
    const r = await rp('a.kurang'), d = r.data, mb = $('#modal .k-mb'); if (!mb) return; S.kurang = d;
    mb.innerHTML = d.list.length ? `<p class="mut">Nomor dengan pendaftar kurang dari <b>${d.min}</b>. Hubungi penanggung jawab lewat email, atau buka WhatsApp secara manual untuk mengajak menambah peserta.</p>${d.list.map((n, i) => `<div class="k-card"><div class="k-card-h"><h3>#${n.no} ${E(n.nama)} ${G_L[n.g]} · ${E(jn(n.jk))}</h3><span class="k-pill ${n.n ? 'k-warn' : 'k-err'}">${n.n} pendaftar</span></div><div class="k-card-b">${n.daftar.length ? `<ul class="k-list">${n.daftar.map(x => `<li><span><b>${E(x.atlet)}</b> · ${E(x.kont)}<br><small class="mut">${E(x.pj)} · ${E(x.email)} · ${E(x.telp)}</small></span>${wa(x.telp) ? `<a class="k-btn sm k-outline" target="_blank" rel="noopener" href="${wa(x.telp)}"><i class="bi bi-whatsapp"></i></a>` : ''}</li>`).join('')}</ul>` : '<p class="mut">Belum ada pendaftar.</p>'}<div class="k-bar" style="padding:8px 0 0">${n.daftar.length ? `<button class="k-btn sm k-orange" data-act="kontak" data-i="${i}"><i class="bi bi-envelope"></i> Kirim email ke ${n.daftar.length} pendaftar</button>` : ''}</div></div></div>`).join('')}` : empty('bi-check-circle', 'Semua nomor sudah memenuhi batas minimum pendaftar.');
  } catch (x) { const mb = $('#modal .k-mb'); if (mb) mb.innerHTML = alertx('err', E(x.message)); }
};
ACT.kontak = a => {
  const n = S.kurang.list[a.dataset.i];
  modal('Hubungi pendaftar', `<form data-submit="kontak" data-id="${n.id}"><p class="mut sm">Penerima: ${n.daftar.map(x => E(x.kont)).join(', ')}</p>${field('Subjek', inp('subjek', `Info nomor #${n.no} ${n.nama} ${G_L[n.g]}`, { req: 1 }), 1)}${field('Pesan', `<textarea class="k-in" name="pesan" rows="6" required minlength="10">Yth. Bapak/Ibu,\n\nNomor #${E(n.no)} ${E(n.nama)} ${G_L[n.g]} (${E(jn(n.jk))}) saat ini baru memiliki ${n.n} pendaftar, di bawah batas minimum ${S.kurang.min}. Mohon pertimbangkan untuk menambah peserta sebelum pendaftaran ditutup.\n\nTerima kasih.</textarea>`, 1)}<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">Kirim Email</button></div></form>`);
};
SUBMIT.kontak = async f => { const b = $('button.k-orange', f), d = form(f); busy(b, true); try { const r = await rp('a.kontak', { id: f.dataset.id, subjek: d.subjek, pesan: d.pesan }); toast(r.message); closeModal(); } catch (e) { toast(e.message, 'err'); busy(b, false); } };

/* ===== Tahapan event ===== */
V['a-fase'] = function () {
  swr('afase', 'fase.get', {}, d => {
    S.jdOto = d.oto || S.jdOto; S.faseTarik = !!d.tarik; S.faseNow = d.fase;
    const i = FASE.indexOf(d.fase), nm = d.nomorStart;
    const step = (k, t, ds) => { const j = FASE.indexOf(k), cls = j < i ? 'done' : j === i ? 'cur' : ''; return `<li class="${cls}"><span>${j < i ? '<i class="bi bi-check-lg"></i>' : j + 1}</span><div><h4>${t}</h4><p class="mut sm">${ds}</p></div></li>`; };
    main(`<div class="k-wrap pad">${ph('Tahapan Event', `Musim ${E(d.musim)} — kendalikan alur dari pendaftaran sampai pelaksanaan`)}
<div class="k-kpis">${kpi('Tahap saat ini', E(FASE_L[d.fase]), 'bi-signpost-split')}${kpi('Atlet terdaftar', d.atlet, 'bi-people')}${kpi('Perlu diproses', d.menunggu, 'bi-hourglass-split', 'menunggu / revisi')}${kpi('Nomor bersusun', nm, 'bi-list-ol')}</div>
<ol class="k-stepper">${step('PENDAFTARAN', 'Pendaftaran', d.buka ? 'Dibuka' + (d.deadline ? ' sampai ' + fdt(d.deadline) : '') + '. Akun dapat mendaftarkan atlet & nomor.' : 'Ditutup — tidak ada pendaftar baru.')}${step('VERIFIKASI', 'Verifikasi', 'Admin Pendaftaran memeriksa berkas dan pembayaran.')}${step('STARTLIST', 'Start list', (d.tarik ? '<b>Sedang ditarik untuk revisi.</b> ' : '') + 'Seeding otomatis dari peserta sah dan lunas: tercepat di seri terakhir & lintasan tengah, seri terakhir penuh, seri 1 berisi sisa (minimal 3 perenang). Nomor acara final diterapkan dari susunan acara (lihat Simulasi program).')}${step('BUKU_ACARA', 'Buku acara', 'Buku acara terbit di portal dengan estimasi jam tiap nomor.')}${step('PELAKSANAAN', 'Pelaksanaan', 'Admin Input Data mengisi hasil, Wasit mengesahkan dengan tanda tangan.')}${step('SELESAI', 'Selesai & arsip', 'Tutup event dan arsipkan musim.')}</ol>
<div class="k-card"><div class="k-card-h"><h3>Tindakan</h3></div><div class="k-card-b" id="fase-act">${faseAct(d)}</div></div></div>`);
  }, 3000);
};
function faseAct(d) {
  const f = d.fase, btn = (ke, label, cls, ic) => `<button class="k-btn lg ${cls}" data-act="fase" data-ke="${ke}"><i class="bi ${ic}"></i> ${label}</button>`;
  const tarikBtn = d.hasil ? '' : `<button class="k-btn lg k-ghostw" data-act="tarik"><i class="bi bi-arrow-counterclockwise"></i> Tarik ulang untuk revisi</button>`, t = d.tarik;
  if (f === 'STARTLIST' && t) return `${alertx('warn', `<b>Start list ditarik untuk revisi</b> sejak ${fdt(t.at)} oleh ${E(t.oleh || '')}.<br>Alasan: ${E(t.alasan || '')}<br>Portal dan profil atlet tidak menampilkan seri &amp; lintasan${t.dari !== 'STARTLIST' ? ', PDF Buku Acara disembunyikan, dan nomor acara bisa disusun ulang' : ''}. Akun peserta tetap tidak bisa mengubah data.`, 'bi-arrow-counterclockwise')}
<ol class="np-langkah"><li>Revisi data atlet, seed time, dan nomor di <b>Nomor Peserta</b>${t.dari !== 'STARTLIST' ? '; susunan &amp; nomor acara di <b>Jadwal Acara</b>' : ''}.</li><li>Klik <b>Terbitkan ulang start list</b> (bisa sekaligus menyusun ulang semua seri dengan aturan terbaru).</li><li>${t.dari !== 'STARTLIST' ? 'Klik <b>Terbitkan Buku Acara</b> untuk membuat PDF baru.' : 'Bila PDF Start List pernah dibagikan, buat ulang di Dokumen &amp; Logo.'}</li></ol>
<div class="k-qa"><button class="k-btn lg k-orange" data-act="terbit"><i class="bi bi-megaphone"></i> Terbitkan ulang start list</button>${btn('BUKU_ACARA', 'Terbitkan Buku Acara', 'k-navy', 'bi-journal-text')}<button class="k-btn lg k-outline" data-go="a-nomor">Nomor Peserta</button><button class="k-btn lg k-ghostw" data-go="a-jadwal">Jadwal acara</button><button class="k-btn lg k-ghostw" data-go="a-dok">Dokumen & logo</button></div>`;
  if (f === 'PENDAFTARAN') return `<p>Tutup pendaftaran pada batas waktu yang ditetapkan. Setelah ditutup, <b>tidak ada lagi peserta yang dapat mendaftar</b>.</p><label class="k-ev" style="display:block"><label><input type="checkbox" id="fase-email"> <span>Kirim email pemberitahuan ke semua akun pendaftar</span></label></label><div class="k-qa">${btn('VERIFIKASI', 'Tutup Pendaftaran', 'k-orange', 'bi-door-closed')}<button class="k-btn lg k-outline" data-act="kurang">Periksa nomor kurang peserta</button><button class="k-btn lg k-ghostw" data-go="a-cfg">Atur batas waktu</button></div>`;
  if (f === 'VERIFIKASI') return `${d.menunggu ? alertx('warn', `Masih ada <b>${d.menunggu}</b> atlet menunggu/perlu revisi. Hanya yang sah dan lunas masuk start list.`) : alertx('ok', 'Seluruh pendaftar sudah diproses.')}<div class="k-qa">${btn('STARTLIST', 'Susun Start List', 'k-orange', 'bi-list-ol')}<button class="k-btn lg k-outline" data-go="a-verif">Buka verifikasi</button><button class="k-btn lg k-ghostw" data-act="fase-buka">Buka kembali pendaftaran</button></div>`;
  if (f === 'STARTLIST') return `<p>Start list tersusun untuk <b>${d.nomorStart}</b> nomor. Periksa jadwal estimasi, lalu terbitkan buku acara.</p><div class="k-qa">${btn('BUKU_ACARA', 'Terbitkan Buku Acara', 'k-orange', 'bi-journal-text')}<button class="k-btn lg k-outline" data-act="seed">Susun ulang start list</button><button class="k-btn lg k-ghostw" data-go="a-jadwal">Atur jadwal</button><button class="k-btn lg k-ghostw" data-go="a-dok">Dokumen & logo</button>${tarikBtn}</div>`;
  if (f === 'BUKU_ACARA') return `${alertx('ok', d.bukuAcara ? 'Buku acara sudah dipublikasikan di portal.' : 'Buku acara dibuat.')}<div class="k-qa">${btn('PELAKSANAAN', 'Mulai Pelaksanaan', 'k-orange', 'bi-play-circle')}<button class="k-btn lg k-outline" data-go="a-dok">Kelola dokumen</button>${tarikBtn}</div>`;
  if (f === 'PELAKSANAAN') return `<p>Pelaksanaan berlangsung. Input hasil dibuka untuk Admin Input Data.</p><div class="k-qa"><button class="k-btn lg k-navy" data-go="a-hasil">Input hasil</button><button class="k-btn lg k-outline" data-go="a-wasit">Pengesahan wasit</button><button class="k-btn lg k-ghostw" data-go="a-ars">Tutup event & arsip</button>${tarikBtn}</div>${d.hasil ? '' : `<p class="mut sm">Belum ada hasil lomba: start list dan Buku Acara masih bisa ditarik untuk revisi.</p>`}`;
  return '<p>Event telah diselesaikan dan diarsipkan.</p>';
}
ACT.fase = async a => {
  const ke = a.dataset.ke, em = $('#fase-email') && $('#fase-email').checked, T = { VERIFIKASI: 'Tutup pendaftaran sekarang? Setelah ditutup tidak ada peserta yang bisa mendaftar lagi.', STARTLIST: 'Susun start list dari peserta sah dan lunas?' + ({ KOSONG: ' Nomor acara final ikut diterapkan: nomor tanpa peserta dilewati dan acara dinomori #1, #2, … sesuai susunan acara.', MINIMAL: ' Nomor acara final ikut diterapkan: nomor dengan peserta kurang dari minimal dilewati dan acara dinomori #1, #2, … sesuai susunan acara.' }[(S.jdOto || 'KOSONG')] || '') + ' Cek dulu di Jadwal Acara → Simulasi program.', BUKU_ACARA: S.faseTarik ? 'Terbitkan buku acara ke portal publik? Start list ikut terbit kembali apa adanya; bila ingin menyusun ulang seri, pakai Terbitkan ulang start list dulu.' : 'Terbitkan buku acara ke portal publik?', PELAKSANAAN: 'Mulai pelaksanaan? Input hasil akan dibuka.' };
  if (!(await ask(T[ke] || 'Lanjutkan?', 'Ya, lanjutkan'))) return; busy(a, true);
  try { const r = await rp('fase.set', { ke, email: em }); toast(r.message); await refreshAll(); go('a-fase'); } catch (e) { toast(e.message, 'err'); busy(a, false); }
};
ACT['fase-buka'] = () => modal('Buka kembali pendaftaran', `<form data-submit="fasebuka">${field('Alasan', '<textarea class="k-in" name="alasan" rows="3" required minlength="5"></textarea>', 1)}<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">Buka kembali</button></div></form>`);
SUBMIT.fasebuka = async f => { const b = $('button.k-orange', f); busy(b, true); try { const r = await rp('fase.set', { ke: 'PENDAFTARAN', alasan: form(f).alasan }); toast(r.message); closeModal(); await refreshAll(); go('a-fase'); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
ACT.seed = async a => { if (!(await ask('Susun ulang start list? Nomor yang sudah punya hasil tidak diubah.'))) return; busy(a, true); try { const r = await rp('s.run', { id: 'ALL' }); toast(r.message); bustCache(); go('a-fase'); } catch (e) { toast(e.message, 'err'); busy(a, false); } };
ACT.tarik = () => modal('Tarik ulang start list & Buku Acara', `<form data-submit="tarik"><p>Start list${S.faseNow === 'STARTLIST' ? '' : ' dan Buku Acara'} ditarik dari portal agar bisa direvisi:</p>
<ul class="np-langkah"><li>Portal, Jadwal, dan profil atlet tidak menampilkan seri &amp; lintasan; PDF Buku Acara/Start List disembunyikan.</li><li>Tahap kembali ke <b>Start List</b>; nomor acara bisa disusun ulang.</li><li>Data start list tetap tersimpan. Revisi di Nomor Peserta, lalu terbitkan ulang.</li><li>Akun peserta tetap tidak bisa mengubah data.</li></ul>
${field('Alasan penarikan', '<textarea class="k-in" name="alasan" rows="3" required minlength="5" placeholder="Contoh: revisi nama dan seed time dari 3 sekolah"></textarea>', 1)}${field('Ketik TARIK untuk konfirmasi', '<input class="k-in" name="konfirmasi" required autocomplete="off">', 1)}
<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">Tarik ulang</button></div></form>`);
SUBMIT.tarik = async f => { const b = $('button.k-orange', f); busy(b, true); try { const r = await rp('fase.tarik', form(f)); toast(r.message); closeModal(); bustCache(); await refreshAll(); go('a-fase'); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
ACT.terbit = () => modal('Terbitkan ulang start list', `<form data-submit="terbit"><label class="sa-op"><input type="checkbox" name="susun" checked><span><b>Susun ulang seri &amp; lintasan semua nomor</b><small>Dari data terbaru dengan aturan seri: tercepat di seri terakhir, seri terakhir penuh, seri 1 minimal 3 perenang. Hapus centang bila start list sudah Anda rapikan sendiri (mis. sisip ke lintasan kosong) dan ingin diterbitkan apa adanya.</small></span></label>
<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">Terbitkan ulang</button></div></form>`);
SUBMIT.terbit = async f => { const b = $('button.k-orange', f); busy(b, true); try { const r = await rp('fase.terbit', { susun: !!$('[name=susun]', f).checked }); toast(r.message); closeModal(); bustCache(); await refreshAll(); go('a-fase'); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
const refreshAll = () => S.refreshAll();

/* ===== Verifikasi ===== */
const VST = [['', 'Semua'], ['MENUNGGU', 'Menunggu'], ['REVISI', 'Revisi'], ['DITOLAK', 'Ditolak'], ['SAH', 'Sah']];
V['a-verif'] = function () {
  swr('vlist', 'v.list', {}, d => {
    S.vl = d; if ($('#v-list')) { drawV(); return; }
    S.vf = S.vf || { st: 'MENUNGGU', jk: '', q: '' }; S.vsel = S.vsel || {};
    main(`<div class="k-wrap pad">${ph('Verifikasi Pendaftaran', 'Periksa berkas dan pembayaran, lalu setujui, minta revisi, atau tolak.')}
<div class="k-filter"><div class="k-chips" id="v-st"></div><div class="g2"><input class="k-in" data-in="v-q" placeholder="Cari nama / NISN / sekolah…" value="${E(S.vf.q)}">${sel('jk', [['', 'Semua kelompok']].concat(S.B.jenjang.map(j => [j.kode, j.nama])), S.vf.jk, 'data-chg="v-jk"')}</div></div><div id="v-bulk"></div>
<div class="vsplit"><div id="v-list"></div><div class="k-card" id="v-det"><div class="k-card-b">${empty('bi-hand-index', 'Pilih atlet di kiri untuk memeriksa berkas.')}</div></div></div></div>`);
    drawV();
  }, 5000);
};
function drawV() {
  const f = S.vf, q = f.q.toLowerCase(), cnt = {}; S.vl.forEach(a => cnt[a.st] = (cnt[a.st] || 0) + 1);
  $('#v-st').innerHTML = VST.map(s => `<button class="k-chip${f.st === s[0] ? ' on' : ''}" data-act="v-st" data-v="${s[0]}">${s[1]}${s[0] ? ` (${cnt[s[0]] || 0})` : ''}</button>`).join('');
  const L = S.vl.filter(a => (!f.st || a.st === f.st) && (!f.jk || a.jk === f.jk) && (!q || (a.nama + ' ' + a.nisn + ' ' + a.sk + ' ' + a.kl + ' ' + a.kont).toLowerCase().indexOf(q) >= 0));
  $('#v-list').innerHTML = L.length ? L.slice(0, 150).map(a => `<div class="k-li${S.vcur === a.id ? ' on' : ''}" data-act="v-open" data-id="${a.id}" role="button" tabindex="0"><span style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-chg="v-chk" value="${a.id}" ${S.vsel[a.id] ? 'checked' : ''} onclick="event.stopPropagation()"><b>${E(a.nama)}</b></span><small>${E(a.sk || a.kl)} · ${E(a.kont)} · ${E(jn(a.jk))} ${G_L[a.g]}</small><span>${pill(a.st)}${a.bayar ? '' : ' <span class="k-pill k-err">Tanpa bukti bayar</span>'} <small>${a.ev.length} nomor · ${rupiah(a.total)}</small></span></div>`).join('') : empty('bi-inbox', 'Tidak ada data pada filter ini.');
  const n = Object.keys(S.vsel).filter(k => S.vsel[k]).length;
  $('#v-bulk').innerHTML = n ? `<div class="k-bulk"><b>${n} terpilih</b><button class="k-btn sm k-orange" data-act="v-bulk" data-a="SETUJU"><i class="bi bi-check2-all"></i> Setujui semua</button><button class="k-btn sm k-ghostw" data-act="v-bulk" data-a="REVISI">Minta revisi</button><button class="k-btn sm k-ghostw" data-act="v-bulk" data-a="TOLAK">Tolak</button><button class="k-btn sm k-ghostw" data-act="v-clr">Batal pilih</button></div>` : '';
}
ACT['v-st'] = a => { S.vf.st = a.dataset.v; drawV(); };
INP['v-q'] = i => { S.vf.q = i.value; clearTimeout(S._vq); S._vq = setTimeout(drawV, 120); }; INP['v-jk'] = i => { S.vf.jk = i.value; drawV(); };
INP['v-chk'] = i => { S.vsel[i.value] = i.checked; drawV(); }; ACT['v-clr'] = () => { S.vsel = {}; drawV(); };
ACT['v-open'] = async a => {
  const id = a.dataset.id; S.vcur = id; drawV(); const el = $('#v-det'); el.innerHTML = '<div class="k-card-b"><div class="k-skel"></div></div>';
  try {
    const d = (await rp('v.detail', { id })).data; if (S.vcur !== id) return; S.vd = d;
    el.innerHTML = `<div class="k-card-h"><h3>${E(d.nama)}</h3>${pill(d.st)}</div><div class="k-card-b"><dl class="k-dl"><dt>BIB / NISN</dt><dd class="mono">${E(d.bib)} / ${E(d.nisn)}</dd><dt>Lahir</dt><dd>${E(d.tempat)}, ${fdt(d.tgl)} (${d.usia} th)</dd><dt>Kelas</dt><dd>${kls(d.kelas)} · ${E(jn(d.jk))} · ${G_L[d.g]}</dd><dt>Sekolah / klub</dt><dd>${E(d.sk)}${d.kl ? ' / ' + E(d.kl) : ''}</dd><dt>Wilayah sekolah</dt><dd>${E(d.kota)}, ${E(d.prov)}</dd><dt>Akun</dt><dd>${E(d.kont.nama)}<br><small class="mut">${E(d.kont.pj)} · ${E(d.kont.email)} · ${E(d.kont.telp)}</small></dd></dl>
<div class="k-chips" style="margin:8px 0">${d.files.map(f => `<button class="k-chip${f.id ? '' : ' sm'}" ${f.id ? `data-act="v-file" data-id="${E(f.id)}" data-l="${E(f.l)}"` : 'disabled style="opacity:.5"'}><i class="bi bi-paperclip"></i> ${E(f.l)}</button>`).join('')}</div><div class="vview" id="v-view"><div class="k-empty"><i class="bi bi-file-earmark-image"></i><p>Pilih berkas untuk pratinjau</p></div></div>
<h4 style="margin:14px 0 6px">Nomor lomba</h4><ul class="k-list">${d.ent.map(e => `<li><b>#${e.no}</b><span>${E(e.nama)} ${G_L[e.g]}<br><small class="mut">Seed ${E(e.seed || 'NT')} · ${rupiah(e.fee)}${e.cat ? ' · ' + E(e.cat) : ''}</small></span>${pill(e.v)}</li>`).join('')}</ul>
<h4 style="margin:14px 0 6px">Pemeriksaan otomatis</h4><ul class="k-check">${d.cek.map(c => `<li class="${c.ok ? '' : 'bad'}"><i class="bi ${c.ok ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}"></i><span>${E(c.l)}</span></li>`).join('')}</ul>
<form data-submit="vaksi" data-id="${d.id}" style="margin-top:12px">${field('Catatan / alasan (wajib untuk revisi atau tolak)', '<textarea class="k-in" name="alasan" rows="2"></textarea>')}<div class="k-qa"><button type="button" class="k-btn k-orange" data-act="v-do" data-a="SETUJU"><i class="bi bi-check-lg"></i> Setujui</button><button type="button" class="k-btn k-outline" data-act="v-do" data-a="REVISI">Minta revisi</button><button type="button" class="k-btn k-danger" data-act="v-do" data-a="TOLAK">Tolak</button></div></form></div>`;
  } catch (e) { el.innerHTML = `<div class="k-card-b">${alertx('err', E(e.message))}</div>`; }
};
ACT['v-file'] = async a => {
  const el = $('#v-view'); el.innerHTML = '<div class="k-skel"></div>';
  try { const d = (await rp('file.data', { id: a.dataset.id })).data, bin = atob(d.b64), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); const u = URL.createObjectURL(new Blob([u8], { type: d.mime })); el.innerHTML = d.mime === 'application/pdf' ? `<iframe class="k-fv" src="${u}"></iframe>` : `<img class="k-fv" style="object-fit:contain" src="${u}" alt="">`; }
  catch (e) { el.innerHTML = alertx('err', E(e.message)); }
};
async function doVerif(ids, aksi, alasan, btn) {
  if (aksi !== 'SETUJU' && String(alasan || '').trim().length < 5) { toast('Isi catatan/alasan minimal 5 karakter.', 'err'); return false; }
  busy(btn, true);
  const old = {}; S.vl.forEach(a => { if (ids.indexOf(a.id) >= 0) { old[a.id] = a.st; a.st = { SETUJU: 'SAH', REVISI: 'REVISI', TOLAK: 'DITOLAK' }[aksi]; } }); drawV();
  try { const r = await rp('v.aksi', { ids, aksi, alasan, email: true }); toast(r.message); bustCache('vlist'); bustCache('adash'); S.vsel = {}; drawV(); return true; }
  catch (e) { S.vl.forEach(a => { if (old[a.id]) a.st = old[a.id]; }); drawV(); toast(e.message, 'err'); busy(btn, false); return false; }
}
ACT['v-do'] = async a => { const f = a.closest('form'), id = f.dataset.id; if (!(await ask(`${{ SETUJU: 'Setujui', REVISI: 'Minta revisi untuk', TOLAK: 'Tolak' }[a.dataset.a]} pendaftaran ini? Email pemberitahuan dikirim ke akun pendaftar.`))) return; if (await doVerif([id], a.dataset.a, form(f).alasan, a)) { $('#v-det').innerHTML = `<div class="k-card-b">${empty('bi-check-circle', 'Keputusan tersimpan. Pilih atlet berikutnya.')}</div>`; S.vcur = null; } };
ACT['v-bulk'] = async a => { const ids = Object.keys(S.vsel).filter(k => S.vsel[k]), ak = a.dataset.a; if (ak === 'SETUJU') { if (!(await ask(`Setujui ${ids.length} atlet sekaligus? Email dikirim ke akun pendaftar.`))) return; await doVerif(ids, ak, '', a); return; } modal(ak === 'REVISI' ? 'Minta revisi' : 'Tolak pendaftaran', `<form data-submit="vbulk" data-a="${ak}"><p class="mut">${ids.length} atlet terpilih.</p>${field('Catatan / alasan', '<textarea class="k-in" name="alasan" rows="3" required minlength="5"></textarea>', 1)}<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-navy">Kirim</button></div></form>`); };
SUBMIT.vbulk = async f => { const ids = Object.keys(S.vsel).filter(k => S.vsel[k]); if (await doVerif(ids, f.dataset.a, form(f).alasan, $('button.k-navy', f))) closeModal(); };

/* ===== Pengajuan ===== */
V['a-png'] = function () {
  swr('plist', 'p.list', {}, d => {
    const f = S.pf || 'PENDING', L = d.filter(p => !f || p.st === f), cnt = d.filter(p => p.st === 'PENDING').length;
    main(`<div class="k-wrap pad">${ph('Pengajuan Revisi & Mutasi', `${cnt} menunggu keputusan`)}<div class="k-chips" style="margin-bottom:14px">${[['PENDING', 'Menunggu'], ['APPROVED', 'Disetujui'], ['REJECTED', 'Ditolak'], ['', 'Semua']].map(x => `<button class="k-chip${f === x[0] ? ' on' : ''}" data-act="p-f" data-v="${x[0]}">${x[1]}</button>`).join('')}</div>
${L.length ? L.map(p => `<div class="k-card"><div class="k-card-h"><h3>${E(p.atlet.nama)} <small class="mut">· ${E(p.kont)}</small></h3>${pill(p.st)}</div><div class="k-card-b"><p><span class="k-pill k-info">${E(p.tipe)}</span> <b>${E(p.field)}</b>${p.ev ? ' (' + E(p.ev) + ')' : ''}: <span class="mut">${E(p.lama)}</span> → <b>${E(p.baru)}</b></p><p class="mut">Alasan: ${E(p.alasan)}</p><p class="sm mut">${fdt(p.at)}${p.oleh ? ' · diputuskan ' + E(p.oleh) : ''}${p.cat ? ' · catatan: ' + E(p.cat) : ''}</p><div class="k-qa">${p.bukti ? `<button class="k-btn sm k-outline" data-act="p-bukti" data-id="${E(p.bukti)}"><i class="bi bi-paperclip"></i> Bukti</button>` : ''}${p.st === 'PENDING' ? `<button class="k-btn sm k-orange" data-act="p-do" data-id="${p.id}" data-a="SETUJU">Setujui</button><button class="k-btn sm k-ghostw" data-act="p-do" data-id="${p.id}" data-a="KLARIFIKASI">Minta klarifikasi</button><button class="k-btn sm k-danger" data-act="p-do" data-id="${p.id}" data-a="TOLAK">Tolak</button>` : ''}</div></div></div>`).join('') : empty('bi-inbox', 'Tidak ada pengajuan.')}</div>`);
  }, 5000);
};
ACT['p-f'] = a => { S.pf = a.dataset.v; go('a-png'); }; ACT['p-bukti'] = a => viewFile(a.dataset.id, 'Bukti pengajuan');
ACT['p-do'] = a => { const ak = a.dataset.a; if (ak === 'SETUJU') { ask('Setujui pengajuan ini? Perubahan langsung diterapkan.').then(y => y && sendP(a.dataset.id, ak, '', a)); return; } modal(ak === 'TOLAK' ? 'Tolak pengajuan' : 'Minta klarifikasi', `<form data-submit="pdo" data-id="${a.dataset.id}" data-a="${ak}">${field('Catatan', '<textarea class="k-in" name="cat" rows="3" required minlength="5"></textarea>', 1)}<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-navy">Kirim</button></div></form>`); };
SUBMIT.pdo = f => sendP(f.dataset.id, f.dataset.a, form(f).cat, $('button.k-navy', f));
async function sendP(id, aksi, catatan, btn) { busy(btn, true); try { const r = await rp('p.aksi', { id, aksi, catatan }); toast(r.message); closeModal(); bustCache(); go('a-png'); } catch (e) { toast(e.message, 'err'); busy(btn, false); } }

/* ===== Akun & berkas (Super Admin) ===== */
V['a-akun'] = function () {
  swr('akun', 'sa.akun', {}, d => {
    S.akunAll = d; if ($('#akun-list')) { drawAkun(); return; }
    S.akunF = S.akunF || { t: '', q: '' }; const c = t => d.filter(a => !t || a.tipe === t).length;
    main(`<div class="k-wrap pad">${ph('Akun & Berkas Pendaftar', 'Data pendaftar mandiri, klub, dan sekolah lengkap dengan biodata dan berkas.')}<div class="k-filter"><div class="k-seg" id="akun-tabs">${[['', 'Semua'], ['MANDIRI', 'Mandiri'], ['KLUB', 'Klub'], ['SEKOLAH', 'Sekolah']].map(x => `<button class="${S.akunF.t === x[0] ? 'on' : ''}" data-act="akun-t" data-v="${x[0]}">${x[1]} (${c(x[0])})</button>`).join('')}</div><input class="k-in" data-in="akun-q" placeholder="Cari nama, kode, kota, email…" value="${E(S.akunF.q)}"></div><br><div id="akun-list"></div></div>`);
    drawAkun();
  }, 8000);
};
function drawAkun() {
  const f = S.akunF, q = f.q.toLowerCase(), L = S.akunAll.filter(a => (!f.t || a.tipe === f.t) && (!q || (a.nama + a.kode + a.kota + a.email + a.pj).toLowerCase().indexOf(q) >= 0));
  S.akSel = S.akSel || {}; const nSel = Object.keys(S.akSel).length;
  $('#akun-list').innerHTML = card(`${L.length} akun`, L.length ? `<div class="k-scroll"><table class="k-table"><thead><tr><th style="width:28px"><input type="checkbox" data-chg="ak-all" aria-label="Pilih semua" ${L.length && L.every(a => S.akSel[a.id]) ? 'checked' : ''}></th><th>Nama</th><th>Jenis</th><th>NPSN / Kode</th><th>Kab/Kota</th><th>Penanggung jawab</th><th>Atlet</th><th>Status</th><th>Berkas</th><th style="text-align:right">Aksi</th></tr></thead><tbody>${L.map(a => `<tr><td><input type="checkbox" data-chg="ak-pick" value="${a.id}" ${S.akSel[a.id] ? 'checked' : ''} aria-label="Pilih ${E(a.nama)}"></td><td><b>${E(a.nama)}</b><br><small class="mut">${E(a.email)}</small></td><td><span class="k-pill ${a.tipe === 'SEKOLAH' ? 'k-info' : a.tipe === 'KLUB' ? 'k-warn' : 'k-neu'}">${TIPE_L[a.tipe]}</span></td><td class="mono">${E(a.kode)}</td><td>${E(a.kota)}</td><td>${E(a.pj)}<br><small class="mut">${E(a.telp)}</small></td><td>${a.atlet}</td><td>${a.st === 'ACTIVE' ? '<span class="k-pill k-ok">Aktif</span>' : '<span class="k-pill k-neu">Nonaktif</span>'}</td><td>${a.mandat ? `<button class="k-btn sm k-outline" data-act="akun-file" data-id="${E(a.mandat)}">Mandat</button>` : '<span class="mut sm">—</span>'}</td><td style="text-align:right;white-space:nowrap"><button class="k-btn sm k-navy" data-act="akun-open" data-id="${a.id}" title="Biodata & berkas">Detail</button> <button class="k-btn sm k-outline" data-act="ak-sandi" data-id="${a.id}" title="Tetapkan kata sandi baru"><i class="bi bi-key"></i> Sandi</button> <button class="k-btn sm k-ghostw" data-act="ak-status" data-id="${a.id}" title="${a.st === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'}"><i class="bi ${a.st === 'ACTIVE' ? 'bi-pause-circle' : 'bi-play-circle'}"></i></button> <button class="k-btn sm k-ghostw" data-act="ak-hapus" data-id="${a.id}" title="Hapus akun" style="color:var(--er)"><i class="bi bi-trash"></i></button></td></tr>`).join('')}</tbody></table></div>` : empty('bi-search', 'Tidak ada akun.'), `<button class="k-btn sm k-ghostw" data-act="ak-hapus-sel" style="color:var(--er)" ${nSel ? '' : 'disabled'}><i class="bi bi-trash"></i> Hapus terpilih (${nSel})</button>`, true);
}
ACT['akun-t'] = a => { S.akunF.t = a.dataset.v; $$('#akun-tabs button').forEach(b => b.classList.toggle('on', b === a)); drawAkun(); };
INP['akun-q'] = i => { S.akunF.q = i.value; clearTimeout(S._aq2); S._aq2 = setTimeout(drawAkun, 120); };
ACT['akun-file'] = a => viewFile(a.dataset.id, 'Surat mandat / SK');
ACT['akun-open'] = async a => {
  S.akOpen = a.dataset.id; modal('Biodata & berkas', '<div class="k-skel"></div>', '', true);
  try {
    const d = (await rp('sa.akun.detail', { id: a.dataset.id })).data, k = d.akun, mb = $('#modal .k-mb'); if (!mb) return;
    mb.innerHTML = `<div class="k-card"><div class="k-card-h"><h3>${E(k.nama)}</h3><span><span class="k-pill k-info">${TIPE_L[k.tipe]}</span> <button class="k-btn sm k-orange" data-act="ak-sandi" data-id="${E(k.id)}" data-n="${E(k.nama)}"><i class="bi bi-key"></i> Ganti kata sandi</button></span></div><div class="k-card-b"><dl class="k-dl"><dt>${k.tipe === 'SEKOLAH' ? 'NPSN' : 'Kode / SK / email'}</dt><dd class="mono">${E(k.kode)}</dd><dt>Kab/Kota, provinsi</dt><dd>${E(k.kota)}, ${E(k.prov)}</dd><dt>Alamat</dt><dd>${E(k.alamat)}</dd><dt>Penanggung jawab</dt><dd>${E(k.pj)} ${k.jab ? '(' + E(k.jab) + ')' : ''}</dd><dt>Kontak</dt><dd>${E(k.email)} · ${E(k.telp)} ${wa(k.telp) ? `<a target="_blank" rel="noopener" href="${wa(k.telp)}"><i class="bi bi-whatsapp"></i></a>` : ''}</dd><dt>Terdaftar</dt><dd>${fdt(k.at)}</dd></dl>${k.mandat ? `<button class="k-btn sm k-outline" data-act="akun-file" data-id="${E(k.mandat)}"><i class="bi bi-paperclip"></i> Surat mandat / SK</button>` : ''}</div></div>
<h4 style="margin:6px 0 10px;display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">Atlet (${d.atlet.length})<button class="k-btn sm k-ghostw" data-go="a-nomor"><i class="bi bi-list-check"></i> Semua nomor peserta</button></h4>${d.atlet.map(t => `<div class="k-card"><div class="k-card-b"><div class="who"><div><b>${E(t.nama)}</b> <span class="mono mut">${E(t.bib)}</span> ${pill(t.st)}<br><small class="mut">NISN ${E(t.nisn)} · ${G_L[t.g]} · ${E(t.tmp)}, ${fdt(t.tgl)} · Kelas ${kls(t.kelas)} · ${E(jn(t.jk))}<br>${E(t.sk)}${t.kl ? ' / ' + E(t.kl) : ''} · ${E(t.wl)} · HP ${E(t.hp)}</small></div></div><div class="k-chips" style="margin:8px 0">${[['foto', 'Foto'], ['akta', 'Akte'], ['surat', 'Surat sekolah'], ['sosmed', 'Bukti follow']].map(x => t[x[0]] ? `<button class="k-chip" data-act="akun-file" data-id="${E(t[x[0]])}"><i class="bi bi-paperclip"></i> ${x[1]}</button>` : '').join('')}${t.ent.filter(e => e.bukti).slice(0, 1).map(e => `<button class="k-chip" data-act="akun-file" data-id="${E(e.bukti)}"><i class="bi bi-receipt"></i> Bukti bayar</button>`).join('')}</div><div class="ent-l">${t.ent.map(e => `<div class="ent-r"><span><b>#${e.no}</b> ${E(e.nama)} ${pill(e.v)}</span><span><button class="k-btn sm k-outline" data-act="ent-ubah" data-id="${E(e.id)}" data-a="${E(t.id)}"><i class="bi bi-arrow-left-right"></i> Ubah nomor</button> <button class="k-btn sm k-ghostw" data-act="ent-hapus" data-id="${E(e.id)}" title="Hapus nomor" style="color:var(--er)"><i class="bi bi-x-lg"></i></button></span></div><div id="eu-${E(e.id)}"></div>`).join('') || '<span class="mut sm">Belum ada nomor musim ini</span>'}</div><div class="k-bar" style="margin-top:8px"><button class="k-btn sm k-orange" data-act="np-tambah" data-a="${E(t.id)}"><i class="bi bi-plus-lg"></i> Tambah nomor</button></div><div class="np-fh" id="np-t-${E(t.id)}"></div></div></div>`).join('') || '<p class="mut">Belum ada atlet.</p>'}`;
    S.akDet = d;
  } catch (e) { const mb = $('#modal .k-mb'); if (mb) mb.innerHTML = alertx('err', E(e.message)); }
};


/* ===== v1.3: kelola akun (sandi, status, hapus) & ubah nomor lomba ===== */
INP['ak-pick'] = c => { S.akSel = S.akSel || {}; if (c.checked) S.akSel[c.value] = 1; else delete S.akSel[c.value]; drawAkun(); };
INP['ak-all'] = c => { const f = S.akunF, q = f.q.toLowerCase(); S.akSel = {}; if (c.checked) S.akunAll.filter(a => (!f.t || a.tipe === f.t) && (!q || (a.nama + a.kode + a.kota + a.email + a.pj).toLowerCase().indexOf(q) >= 0)).forEach(a => { S.akSel[a.id] = 1; }); drawAkun(); };
const akBy = id => (S.akunAll || []).filter(x => x.id === id)[0] || {};
const sandiTampil = (judul, d) => modal(judul, `<p>Catat kata sandi ini, <b>hanya tampil sekali</b>.</p>${d.login ? `<p class="sm mut">Masuk dengan: <b class="mono">${E(d.login)}</b></p>` : ''}<div class="mono" style="font-size:18px;padding:14px;background:var(--surf);border-radius:8px;text-align:center;user-select:all">${E(d.sandi)}</div>`, '<button class="k-btn k-navy" data-act="mx">Sudah dicatat</button>');
const sandiForm = (sub, id, nama) => modal('Ganti kata sandi', `<form data-submit="${sub}" data-id="${E(id)}"><p class="sm">Akun: <b>${E(nama)}</b></p>${alertx('info', 'Kata sandi lama tidak bisa dilihat siapa pun karena disimpan terenkripsi. Tetapkan kata sandi baru di sini, lalu berikan ke pemilik akun.', 'bi-shield-lock')}${field('Kata sandi baru', inp('sandi', '', { attr: 'autocomplete="new-password" placeholder="Kosongkan untuk dibuat otomatis"' }))}<p class="mut sm">Minimal 8 karakter berisi huruf dan angka. Pemilik akun akan keluar dari semua perangkat.</p><div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">Simpan sandi baru</button></div></form>`);
ACT['ak-sandi'] = a => { const k = akBy(a.dataset.id); sandiForm('ak-sandi', a.dataset.id, k.nama || a.dataset.n || ''); };
SUBMIT['ak-sandi'] = async f => { const b = $('button.k-orange', f), d = form(f); busy(b, true); try { const r = await rp('sa.akun.sandi', { id: f.dataset.id, sandi: d.sandi }); sandiTampil('Kata sandi baru', r.data); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
ACT['ak-status'] = async a => { const k = akBy(a.dataset.id); if (!(await ask(k.st === 'ACTIVE' ? `Nonaktifkan akun ${k.nama}? Akun tidak bisa masuk sampai diaktifkan lagi.` : `Aktifkan kembali akun ${k.nama}?`, k.st === 'ACTIVE' ? 'Nonaktifkan' : 'Aktifkan'))) return; try { const r = await rp('sa.akun.status', { id: a.dataset.id }); toast(r.message); bustCache('akun'); go('a-akun'); } catch (e) { toast(e.message, 'err'); } };
function hapusForm(ids) {
  const L = ids.map(akBy), nA = L.reduce((s, k) => s + (k.atlet || 0), 0);
  modal(`Hapus ${ids.length} akun`, `<form data-submit="ak-hapus" data-ids="${E(ids.join(','))}">${alertx('err', `Akun, data atlet (${nA}), pendaftaran nomor, dan berkasnya akan <b>dihapus permanen</b>. Atlet yang sudah punya hasil resmi tetap disimpan sebagai arsip agar riwayat hasil tidak rusak.`, 'bi-exclamation-octagon')}<ul class="k-list">${L.slice(0, 8).map(k => `<li><b>${E(k.nama)}</b><span class="mut sm">${E(TIPE_L[k.tipe] || '')} · ${k.atlet || 0} atlet</span></li>`).join('')}${L.length > 8 ? `<li class="mut sm">dan ${L.length - 8} akun lainnya</li>` : ''}</ul>${field('Ketik HAPUS untuk konfirmasi', inp('konfirmasi', '', { req: 1, attr: 'autocomplete="off"' }), 1)}<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-red">Hapus permanen</button></div></form>`);
}
ACT['ak-hapus'] = a => hapusForm([a.dataset.id]);
ACT['ak-hapus-sel'] = () => { const ids = Object.keys(S.akSel || {}); if (ids.length) hapusForm(ids); };
SUBMIT['ak-hapus'] = async f => { const b = $('button.k-red', f), d = form(f); busy(b, true); try { const r = await rp('sa.akun.hapus', { ids: f.dataset.ids.split(','), konfirmasi: String(d.konfirmasi || '').trim().toUpperCase() }); closeModal(); toast(r.message); S.akSel = {}; bustCache('akun'); bustCache('adash'); go('a-akun'); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
function euOpts(t, all) { return (S.B.events || []).filter(e => e.g === t.g && (all || e.jk === t.jk)).sort((a, b) => a.no - b.no).map(e => `<option value="${e.id}">#${e.no} · ${E(evTitle(e))}</option>`).join(''); }
ACT['ent-ubah'] = a => {
  const host = $('#eu-' + a.dataset.id); if (!host) return; if (host.innerHTML) { host.innerHTML = ''; return; }
  const t = ((S.akDet || {}).atlet || []).filter(x => x.id === a.dataset.a)[0]; if (!t) return; S.euT = t;
  const cur = t.ent.filter(e => e.id === a.dataset.id)[0] || {};
  host.innerHTML = `<form class="eu-f" data-submit="ent-ubah" data-id="${E(a.dataset.id)}"><div class="sm mut">Pindahkan dari <b>#${cur.no} ${E(cur.nama)}</b> ke:</div><select class="k-in" name="eid" required>${euOpts(t, false) || '<option value="">Tidak ada nomor lain di kelompok ini</option>'}</select><label class="sm"><input type="checkbox" name="paksa" data-chg="eu-paksa" data-id="${E(a.dataset.id)}"> Izinkan beda kelompok</label><div class="k-bar"><button class="k-btn sm k-orange">Simpan perubahan</button></div></form>`;
};
INP['eu-paksa'] = c => { const f = c.closest('form'), s = f && f.querySelector('select[name=eid]'); if (s && S.euT) s.innerHTML = euOpts(S.euT, c.checked) || '<option value="">Tidak ada nomor</option>'; };
const akReopen = () => { bustCache('akun'); if (S.akOpen) ACT['akun-open']({ dataset: { id: S.akOpen } }); };
SUBMIT['ent-ubah'] = async f => { const b = $('button.k-orange', f), d = form(f); if (!d.eid) return toast('Pilih nomor tujuan.', 'err'); busy(b, true); try { const r = await rp('sa.entri.ubah', { id: f.dataset.id, eid: d.eid, paksa: !!d.paksa }); toast(r.message, r.data && r.data.keluar ? 'warn' : 'ok'); bustCache('adash'); akReopen(); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
ACT['ent-hapus'] = async a => { if (!(await ask('Hapus nomor lomba ini dari pendaftaran atlet? Biaya nomor ini tidak lagi dihitung.', 'Hapus'))) return; try { const r = await rp('sa.entri.hapus', { id: a.dataset.id }); toast(r.message); bustCache('adash'); akReopen(); } catch (e) { toast(e.message, 'err'); } };

/* ===== Nomor lomba ===== */
const JARAK = [25, 50, 100, 200, 400, 800];
V['a-master'] = function () { S.evTab = 'nomor'; return go('a-event', 'nomor'); }; // v1.6: dipindah ke Event & Nomor Lomba
V['a-master-lama'] = function () {
  swr('mst', 'mst.list', {}, d => {
    S.mst = d;
    main(`<div class="k-wrap pad">${ph('Nomor Lomba', `${d.events.length} nomor · nomor individu (tanpa estafet)`, `<button class="k-btn k-orange" data-act="mst-edit" data-id=""><i class="bi bi-plus-lg"></i> Tambah nomor</button>${d.events.length ? '' : '<button class="k-btn k-navy" data-act="mst-def">Buat nomor standar</button>'}`)}
${d.events.length ? card('Daftar nomor', `<div class="k-scroll"><table class="k-table"><thead><tr><th>No</th><th>Nomor</th><th>Kelompok</th><th>Gender</th><th>Biaya</th><th>Hari</th><th>Aktif</th><th></th></tr></thead><tbody>${d.events.map(e => `<tr><td class="mono">#${e.event_no}</td><td><b>${E(e.event_name)}</b> <small class="mut">${E(e.course_type)}</small></td><td>${E(jn(e.jenjang_kode))}</td><td>${G_L[e.gender]}</td><td>${rupiah(e.fee_amount)}</td><td>${e.hari}</td><td>${e.is_active ? '<span class="k-pill k-ok">Aktif</span>' : '<span class="k-pill k-neu">Nonaktif</span>'}</td><td style="text-align:right"><button class="k-btn sm k-outline" data-act="mst-edit" data-id="${E(e.event_id)}">Ubah</button> <button class="k-btn sm k-ghostw" data-act="mst-del" data-id="${E(e.event_id)}"><i class="bi bi-trash"></i></button></td></tr>`).join('')}</tbody></table></div>`, '', true) : empty('bi-list-ol', 'Belum ada nomor lomba.')}</div>`);
  }, 3000);
};
ACT['mst-def'] = async a => { if (!(await ask('Buat nomor lomba standar untuk semua kelompok?'))) return; busy(a, true); try { const r = await rp('mst.default'); toast(r.message); await refreshAll(); go('a-master'); } catch (e) { toast(e.message, 'err'); busy(a, false); } };
ACT['mst-edit'] = a => {
  const e = S.mst.events.filter(x => x.event_id === a.dataset.id)[0] || { event_no: Math.max(0, ...S.mst.events.map(x => x.event_no)) + 1, distance_m: 50, stroke_type: S.mst.gaya[0], gender: 'PUTRA', jenjang_kode: S.mst.jenjang[0].kode_jenjang, course_type: 'LCM', fee_amount: 0, hari: 1, sesi: 'Pagi', jam: '08:00', is_active: 1 };
  modal(e.event_id ? 'Ubah nomor lomba' : 'Tambah nomor lomba', `<form data-submit="mst" data-id="${E(e.event_id || '')}" data-sesi="${E(e.sesi)}" data-jam="${E(e.jam)}"><div class="g2">${field('Nomor acara', inp('event_no', e.event_no, { type: 'number', req: 1 }), 1)}${field('Jarak (m)', sel('distance_m', JARAK, e.distance_m), 1)}${field('Gaya', sel('stroke_type', S.mst.gaya, e.stroke_type), 1)}${field('Gender', sel('gender', [['PUTRA', 'Putra'], ['PUTRI', 'Putri']], e.gender), 1)}${field('Kelompok', sel('jenjang_kode', S.mst.jenjang.map(j => [j.kode_jenjang, j.nama_jenjang]), e.jenjang_kode), 1)}${field('Kolam', sel('course_type', [['LCM', 'LCM (50 m)'], ['SCM', 'SCM (25 m)']], e.course_type))}${field('Biaya (Rp)', inp('fee_amount', e.fee_amount, { type: 'number', req: 1 }), 1)}${field('Hari pelaksanaan', inp('hari', e.hari, { type: 'number', attr: 'min="1" max="9"' }))}</div><label class="k-ev"><label><input type="checkbox" name="is_active" ${e.is_active ? 'checked' : ''}> <span>Nomor aktif (dibuka pendaftarannya)</span></label></label><p class="mut sm">Jam pelaksanaan dihitung otomatis dari jumlah pendaftar dan seri — atur manual di menu Jadwal Acara.</p><div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">Simpan</button></div></form>`);
};
SUBMIT.mst = async f => { const b = $('button.k-orange', f), d = form(f); busy(b, true); try { const r = await rp('mst.simpan', { rec: Object.assign({}, d, { event_id: f.dataset.id, sesi: f.dataset.sesi || 'Pagi', jam: f.dataset.jam || '08:00', max_quota: 64 }) }); toast(r.message); closeModal(); await refreshAll(); go('a-master'); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
ACT['mst-del'] = async a => { if (!(await ask('Hapus nomor lomba ini?', 'Hapus', true))) return; try { const r = await rp('mst.hapus', { id: a.dataset.id }); toast(r.message); await refreshAll(); go('a-master'); } catch (e) { toast(e.message, 'err'); } };

/* ===== Jadwal acara (otomatis + manual) ===== */
V['a-jadwal'] = function () {
  swr('jd', 'jd.get', {}, d => {
    S.jd = d; const rows = d.rows, byDay = {}; rows.forEach(r => (byDay[r.hari] = byDay[r.hari] || []).push(r));
    let menit = {}; try { menit = JSON.parse(d.cfg.menit || '{}'); } catch (e) { }
    const jarak = Array.from(new Set(JARAK.concat(Object.keys(menit).map(Number)))).sort((a, b) => a - b);
    main(`<div class="k-wrap pad">${ph('Jadwal Acara', 'Estimasi jam otomatis dari jumlah pendaftar × seri. Isi jam/hari/urutan manual bila perlu — nomor berikutnya mengikuti.', `<button class="k-btn k-ghostw" data-act="jd-reset">Reset semua manual</button>`)}${S.jdTabBar ? S.jdTabBar() : ''}
${isSA() ? card('Pengaturan perhitungan otomatis', `<form data-submit="jdcfg"><div class="g3">${field('Jam mulai tiap hari', inp('mulai', d.cfg.mulai, { type: 'time', req: 1 }), 1)}${field('Jeda antar nomor (menit)', inp('jeda', d.cfg.jeda, { type: 'number', attr: 'min="0" max="60"' }))}${field('Jumlah lintasan', inp('lin', d.cfg.lintasan, { ro: 1 }), 0, 'Ubah di Pengaturan Web')}</div><p class="mut sm" style="margin-bottom:6px">Durasi tiap seri (menit) per jarak, termasuk pengumuman & pergantian atlet:</p><div class="g3" style="grid-template-columns:repeat(auto-fit,minmax(110px,1fr))">${jarak.map(j => field(j + ' m', inp('m' + j, menit[j] || '', { type: 'number', attr: 'min="1" max="90" step="0.5"' }))).join('')}</div><div class="k-bar"><button class="k-btn k-navy">Simpan & hitung ulang</button></div></form>`) : ''}
${rows.some(r => r.n) ? '' : alertx('info', 'Belum ada pendaftar, jadi belum ada estimasi jam. Jadwal akan terisi seiring pendaftaran masuk.')}
${Object.keys(byDay).sort((a, b) => a - b).map(h => card(`Hari ${h}`, `<div class="k-scroll"><table class="k-table"><thead><tr><th>No</th><th>Nomor</th><th>Peserta</th><th>Seri</th><th>Hari</th><th>Urut</th><th>Jam manual</th><th>Estimasi</th><th>Istirahat</th><th></th></tr></thead><tbody>${byDay[h].map(r => `<tr><td class="mono">#${r.no}</td><td><b>${E(r.nama)}</b><br><small class="mut">${E(jn(r.jk))} ${G_L[r.g]}</small></td><td>${r.n}</td><td>${r.heats} × ${r.mn}′</td><td><input class="k-in sm" style="width:64px" type="number" min="1" max="9" value="${r.hari}" data-chg="jd-f" data-f="hari" data-id="${E(r.eid)}"></td><td><input class="k-in sm" style="width:72px" type="number" value="${r.urut}" data-chg="jd-f" data-f="urut" data-id="${E(r.eid)}"></td><td><input class="k-in sm" style="width:110px" type="time" value="${E(r.jamManual)}" data-chg="jd-f" data-f="jam" data-id="${E(r.eid)}"></td><td class="mono">${r.n ? `<b>${E(r.mulai)}</b> – ${E(r.selesai)}` : '<span class="mut">—</span>'}${r.bentrok ? ' <span class="k-pill k-warn" title="Jam manual lebih awal dari selesainya nomor sebelumnya">bentrok</span>' : ''}</td><td>${r.istSet ? `<span class="k-pill ${r.istSet.aktif ? 'k-warn' : 'k-neu'}" ${r.istSet.aktif ? '' : 'title="Belum berlaku: belum ada nomor berpeserta sebelum nomor ini di hari yang sama"'}>${E(r.istSet.label)} ${r.istSet.menit}′</span> <button class="k-ibtn" data-act="jd-ist" data-id="${E(r.eid)}" aria-label="Ubah istirahat"><i class="bi bi-pencil"></i></button>` : `<button class="k-btn sm k-outline" data-act="jd-ist" data-id="${E(r.eid)}" title="Sisipkan jeda istirahat setelah nomor ini">+ Istirahat</button>`}</td><td>${r.manual ? `<button class="k-btn sm k-ghostw" data-act="jd-r" data-id="${E(r.eid)}">Auto</button>` : '<span class="k-pill k-neu">auto</span>'}</td></tr>${(r.ist || []).map(b => `<tr style="background:var(--gold,#FFF7DC)"><td colspan="10"><i class="bi bi-cup-hot"></i> <b>${E(b.label)}</b> — ${b.menit} menit · <span class="mono">${E(b.mulai)} – ${E(b.selesai)}</span></td></tr>`).join('')}`).join('')}</tbody></table></div>`, '', true)).join('')}</div>`);
  }, 2000);
};
INP['jd-f'] = async i => { const o = { eid: i.dataset.id }; o[i.dataset.f] = i.value; try { const r = await rp('jd.set', o); S.cache = {}; bustCache('jd'); toast('Jadwal diperbarui.'); await refreshAll(); go('a-jadwal'); } catch (e) { toast(e.message, 'err'); } };
ACT['jd-r'] = async a => { try { await rp('jd.set', { eid: a.dataset.id, reset: true }); await refreshAll(); toast('Kembali ke otomatis.'); go('a-jadwal'); } catch (e) { toast(e.message, 'err'); } };
ACT['jd-ist'] = a => {
  const r = (S.jd.rows || []).filter(x => x.eid === a.dataset.id)[0]; if (!r) return; const b = r.istSet;
  modal('Jeda istirahat setelah nomor #' + r.no, `<form data-submit="jdist" data-id="${E(r.eid)}"><p class="mut sm">Istirahat disisipkan <b>setelah</b> nomor ini selesai. Jam nomor berikutnya (di hari yang sama) otomatis bergeser. Tampil di Jadwal web dan Buku Acara.</p><div class="g2">${field('Lama istirahat (menit)', inp('menit', b ? b.menit : 30, { type: 'number', req: 1, attr: 'min="1" max="240"' }), 1)}${field('Keterangan', inp('label', b ? b.label : 'Istirahat', { attr: 'maxlength="40" placeholder="mis. Istirahat / Ishoma"' }))}</div><div class="k-bar">${b ? '<button type="button" class="k-btn k-ghostw" data-act="jd-ist-del" data-id="' + E(r.eid) + '">Hapus istirahat</button>' : ''}<button class="k-btn k-navy">Simpan</button></div></form>`);
};
ACT['jd-ist-del'] = async a => { try { await rp('jd.set', { eid: a.dataset.id, ist: null }); S.cache = {}; bustCache('jd'); closeModal(); await refreshAll(); toast('Istirahat dihapus.'); go('a-jadwal'); } catch (e) { toast(e.message, 'err'); } };
SUBMIT.jdist = async f => { const b = $('button.k-navy', f), d = form(f); busy(b, true); try { await rp('jd.set', { eid: f.dataset.id, ist: { menit: d.menit, label: d.label } }); S.cache = {}; bustCache('jd'); closeModal(); await refreshAll(); toast('Istirahat tersimpan. Jam nomor berikutnya dihitung ulang.'); go('a-jadwal'); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
ACT['jd-reset'] = async () => { if (!(await ask('Hapus semua pengaturan manual (hari, urutan, jam)?', 'Reset', true))) return; try { await rp('jd.set', { resetAll: true }); await refreshAll(); toast('Semua jadwal kembali otomatis.'); go('a-jadwal'); } catch (e) { toast(e.message, 'err'); } };
SUBMIT.jdcfg = async f => { const b = $('button.k-navy', f), d = form(f); busy(b, true); const m = {}; Object.keys(d).forEach(k => { if (/^m\d+$/.test(k) && Number(d[k]) > 0) m[k.slice(1)] = Number(d[k]); }); try { await rp('jd.set', { cfg: { mulai: d.mulai, jeda: d.jeda || '0', menit: JSON.stringify(m) } }); await refreshAll(); toast('Pengaturan jadwal tersimpan.'); go('a-jadwal'); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
})();

(function () {
'use strict';
/* ===== Modul Kurasi Puspresnas (Super Admin) ===== */
const { $, $$, E, S, V, ACT, INP, rp, toast, busy, ph, card, kpi, alertx, field, sel, go, dlB64, readFile, xlsx, fdt } = KRP;
const main = h => { $('#main').innerHTML = h; };
const TABS = [['siap', 'Kesiapan', 'bi-clipboard-check'], ['org', 'Penyelenggara & Ajang', 'bi-building'], ['pan', 'Panitia', 'bi-people'], ['juri', 'Juri', 'bi-person-badge'], ['dukung', 'Pendukung', 'bi-stars'], ['unduh', 'Unduh Berkas', 'bi-download']];
const DOKS = [
  ['00', 'Daftar Periksa Kesiapan', 'Status 13 komponen dan langkah pengajuan. Untuk pegangan internal.', 'bi-list-check'],
  ['01', 'Surat Permohonan Kurasi', 'Ditujukan ke Kepala Pusat Prestasi Nasional, memuat ringkasan ajang dan daftar lampiran.', 'bi-envelope-paper'],
  ['02', 'Petunjuk Teknis Penyelenggaraan', 'Pedoman/juknis: dasar hukum, asas, kepesertaan, nomor lomba, penjurian, penghargaan. Prasyarat Instrumen 1A.', 'bi-journal-text'],
  ['03', 'SK Panitia Penyelenggara', 'SK pembentukan Panitia Pengarah (SC) dan Penyelenggara (OC) beserta uraian tugas. Prasyarat Instrumen 1A.', 'bi-diagram-3'],
  ['04', 'SK Juri, Kualifikasi & Pakta Integritas', 'SK dewan juri, tabel kompetensi/kualifikasi/keterwakilan, dan pakta integritas per juri. Prasyarat Instrumen 1A.', 'bi-person-badge'],
  ['05', 'Laporan Kepesertaan & Peta Sebaran', 'Sebaran provinsi, kab/kota, kelompok, sekolah, dan tingkat persaingan per nomor.', 'bi-geo-alt'],
  ['06', 'SK Penetapan Pemenang', 'SK pemenang, daftar juara per nomor dengan nomor sertifikat, dan klasemen juara umum.', 'bi-trophy'],
  ['07', 'Laporan Pelaksanaan', 'Sarana prasarana & foto, pembiayaan, penghargaan, publikasi, liputan media, mitra, keberlanjutan, monev.', 'bi-file-earmark-richtext'],
  ['08', 'Rekap Sertifikat Juara', 'Daftar nomor sertifikat seluruh juara.', 'bi-patch-check']
];
const set = (o, path, v) => { const k = path.split('.'); let t = o; for (let i = 0; i < k.length - 1; i++) t = t[/^\d+$/.test(k[i]) ? Number(k[i]) : k[i]]; t[k[k.length - 1]] = v; };
const get = (o, path) => path.split('.').reduce((t, k) => t == null ? '' : t[/^\d+$/.test(k) ? Number(k) : k], o);
const kin = (path, label, o) => { o = o || {}; const v = get(S.KUR, path); return field(label, `<input class="k-in" data-in="kur" data-k="${path}" value="${E(v == null ? '' : v)}"${o.type ? ` type="${o.type}"` : ''}${o.ph ? ` placeholder="${E(o.ph)}"` : ''}${o.list ? ` list="${o.list}"` : ''}>`, o.req, o.hint); };
const kta = (path, label, o) => { o = o || {}; return field(label, `<textarea class="k-in" rows="${o.rows || 3}" data-in="kur" data-k="${path}"${o.ph ? ` placeholder="${E(o.ph)}"` : ''}>${E(get(S.KUR, path) || '')}</textarea>`, o.req, o.hint); };
const ksel = (path, label, opts, o) => { o = o || {}; return field(label, sel('x', opts, get(S.KUR, path), `data-chg="kur" data-k="${path}"`), o.req, o.hint); };
function rows(key, cols, empty) {
  const L = S.KUR[key] || [];
  return `<div class="k-scroll"><table class="k-table kur-rows"><thead><tr><th style="width:34px">#</th>${cols.map(c => `<th${c[2] ? ` style="min-width:${c[2]}"` : ''}>${c[1]}</th>`).join('')}<th style="width:44px"></th></tr></thead><tbody>${L.length ? L.map((r, i) => `<tr><td class="mut">${i + 1}</td>${cols.map(c => `<td>${c[3] === 'ta' ? `<textarea class="k-in" rows="2" data-in="kur" data-k="${key}.${i}.${c[0]}" placeholder="${E(c[4] || '')}">${E(r[c[0]] || '')}</textarea>` : `<input class="k-in" data-in="kur" data-k="${key}.${i}.${c[0]}" value="${E(r[c[0]] || '')}"${c[3] ? ` type="${c[3]}"` : ''}${c[4] ? ` placeholder="${E(c[4])}"` : ''}${c[5] ? ` list="${c[5]}"` : ''}>`}</td>`).join('')}<td><button type="button" class="k-btn sm k-ghostw" data-act="kur-del" data-key="${key}" data-i="${i}" title="Hapus baris" aria-label="Hapus baris"><i class="bi bi-trash"></i></button></td></tr>`).join('') : `<tr><td colspan="${cols.length + 2}" class="mut" style="text-align:center">${empty || 'Belum ada data.'}</td></tr>`}</tbody></table></div><div class="k-bar" style="justify-content:flex-start;margin-top:8px"><button type="button" class="k-btn sm k-outline" data-act="kur-add" data-key="${key}"><i class="bi bi-plus-lg"></i> Tambah baris</button></div>`;
}
const stIc = { ok: '<span class="kur-st ok"><i class="bi bi-check-circle-fill"></i> Siap</span>', warn: '<span class="kur-st warn"><i class="bi bi-exclamation-circle-fill"></i> Lengkapi</span>', no: '<span class="kur-st no"><i class="bi bi-x-circle-fill"></i> Belum</span>' };
const TAB_OF = { 1: 'org', 2: 'pan', 3: 'juri', 4: 'org', 5: 'siap', 6: 'org', 7: 'dukung', 8: 'dukung', 9: 'dukung', 10: 'dukung', 11: 'dukung', 12: 'dukung', 13: 'unduh' };

V['a-kurasi'] = function () {
  S.ktab = S.ktab || 'siap';
  rp('kur.get', {}).then(r => { if (S.route !== 'a-kurasi') return; S.KUR = r.data.data; S.KS = r.data; draw(); }).catch(e => KRP.errView(e.message, () => go('a-kurasi')));
};
function head() {
  const s = S.KS.siap, st = S.KS.stat;
  return `${ph('Kurasi Puspresnas', `Susun berkas pengajuan kurasi ajang talenta musim ${E(S.KS.musim)}. Data lomba terisi otomatis; lengkapi data penyelenggara lalu unduh berkasnya.`, `<span class="kur-save mut sm" id="kur-sv">Tersimpan otomatis</span><button class="k-btn k-orange" data-act="kur-dl" data-j="ZIP"><i class="bi bi-file-earmark-zip"></i> Unduh paket berkas</button>`)}
<div class="kur-prog k-card"><div class="k-card-b"><div class="kur-prog-top"><div><b id="kur-skor">${s.skor}%</b> <span class="mut">kesiapan berkas</span></div><div class="k-chips">${s.prasyarat ? '<span class="k-pill k-ok">Prasyarat Instrumen 1A terpenuhi</span>' : '<span class="k-pill k-err">Prasyarat Instrumen 1A belum lengkap</span>'}${s.selesai ? '<span class="k-pill k-ok">Ajang selesai</span>' : '<span class="k-pill k-warn">Ajang belum selesai/disahkan</span>'}<span class="k-pill k-info">Data memenuhi tingkat ${E(st.tingkatSaran)}</span></div></div><div class="k-prog"><i id="kur-bar" style="width:${s.skor}%"></i></div></div></div>
<div class="k-seg kur-tabs" id="kur-tabs">${TABS.map(t => `<button class="${S.ktab === t[0] ? 'on' : ''}" data-act="kur-tab" data-v="${t[0]}"><i class="bi ${t[2]}"></i> ${t[1]}</button>`).join('')}</div><br>`;
}
function draw() { const y = window.scrollY; main(`<div class="k-wrap pad">${head()}<div id="kur-body">${body()}</div></div>${datalists()}`); window.scrollTo(0, y); }
function redrawBody() { const b = $('#kur-body'); if (b) b.innerHTML = body(); }
function datalists() { return `<datalist id="kur-peran">${['Referee (Wasit Utama)', 'Starter', 'Chief Timekeeper', 'Timekeeper', 'Chief Finish Judge', 'Judge of Stroke', 'Inspector of Turns', 'Recorder', 'Clerk of Course', 'Announcer'].map(x => `<option value="${x}">`).join('')}</datalist><datalist id="kur-jab">${['Ketua', 'Wakil Ketua', 'Sekretaris', 'Bendahara', 'Koordinator Lomba', 'Seksi Pendaftaran', 'Seksi Acara', 'Seksi Publikasi', 'Seksi Dokumentasi', 'Seksi Perlengkapan', 'Seksi Kesehatan', 'Seksi Keamanan', 'Seksi IT', 'Seksi Konsumsi'].map(x => `<option value="${x}">`).join('')}</datalist>`; }
function body() { return ({ siap: tSiap, org: tOrg, pan: tPan, juri: tJuri, dukung: tDukung, unduh: tUnduh }[S.ktab] || tSiap)(); }

function tSiap() {
  const s = S.KS.siap, st = S.KS.stat;
  return `<div class="k-kpis">${kpi('Peserta didik', st.atlet, 'bi-people', `${st.entri} entri · ${st.putra} putra / ${st.putri} putri`)}${kpi('Sebaran', `${st.nKota} kab/kota`, 'bi-geo-alt', `${st.nProv} provinsi`)}${kpi('Nomor lomba', st.nomor.length, 'bi-list-ol', `${st.nomorSah} disahkan · ${st.juara} juara`)}${kpi('Rasio juara', st.rasio + '%', 'bi-graph-up', 'juara dibanding entri')}</div>
${s.selesai ? '' : alertx('warn', 'Kurasi diajukan <b>setelah ajang selesai seluruhnya</b>. Selesaikan pengesahan semua nomor lomba sebelum mengunggah berkas ke aplikasi kurasi.', 'bi-hourglass-split')}
${s.prasyarat ? '' : alertx('err', '<b>Tiga prasyarat Instrumen 1A</b> (juknis, struktur kepanitiaan, kualifikasi juri) wajib lengkap. Tanpa itu ajang dinilai rendah dan <b>tidak diberi predikat bintang</b>.', 'bi-shield-exclamation')}
<div class="g-main"><div>${card('13 komponen dokumen penyelenggara', `<ul class="kur-cek">${s.list.map(x => `<li><div>${stIc[x.st]}</div><div><b>${x.no}. ${E(x.nama)}</b>${x.wajib ? ' <span class="k-pill k-warn">Prasyarat</span>' : ''}<br><small class="mut">${E(x.info)}</small><br><small>Berkas: ${E(x.berkas)}</small></div><div>${x.st !== 'ok' && TAB_OF[x.no] !== 'siap' ? `<button class="k-btn sm k-outline" data-act="kur-tab" data-v="${TAB_OF[x.no]}">Lengkapi</button>` : ''}</div></li>`).join('')}</ul>`, '', true)}</div>
<div>${card('Tentang kurasi ajang', `<ul class="k-list kur-info"><li><span><b>Siapa:</b> penyelenggara ajang (bukan BPTI/Puspresnas) melalui operator pengusul di aplikasi Kurasi Prestasi, memakai <b>Instrumen 1A</b>.</span></li><li><span><b>Syarat ajang:</b> kompetisi/nonkompetisi/nonajang, bertingkat minimal kabupaten/kota, diajukan setelah ajang selesai.</span></li><li><span><b>Kepesertaan minimal:</b> kab/kota ≥4 kecamatan · provinsi ≥4 kab/kota · nasional ≥4 provinsi · internasional ≥5 negara.</span></li><li><span><b>Aspek nilai:</b> kebermanfaatan, tingkat persaingan, kepesertaan, orientasi (nirlaba), kewajaran.</span></li><li><span><b>Predikat:</b> ★5 (85–100) · ★4 (70–&lt;85) · ★3 (55–&lt;70) · ★2 (40–&lt;55) · ★1 (&lt;40).</span></li><li><span><b>Alur reguler:</b> ajukan minggu ke-1 → verifikasi minggu ke-2 → kurator minggu ke-3 → hasil minggu ke-4 (diumumkan di SIMT &amp; email). Status <i>Direvisi</i> wajib diperbaiki dalam 2×24 jam.</span></li><li><span><b>Setelah terkurasi:</b> sekolah mengklaim prestasi siswa lewat operator sekolah dengan SK pemenang, publikasi resmi, tautan daftar pemenang, dan dokumentasi penerimaan.</span></li><li><span><b>Bantuan:</b> kurasi.prestasi@kemendikdasmen.go.id (hari kerja 08.00–15.00 WIB).</span></li></ul><div class="k-bar" style="justify-content:flex-start"><a class="k-btn sm k-navy" target="_blank" rel="noopener" href="https://kurasi-prestasi.kemendikdasmen.go.id/"><i class="bi bi-box-arrow-up-right"></i> Aplikasi Kurasi Prestasi</a><a class="k-btn sm k-outline" target="_blank" rel="noopener" href="https://kurasi-prestasi.kemendikdasmen.go.id/faq">FAQ resmi</a></div>`)}
${card('Sebaran teratas', `<ul class="k-list">${st.kota.slice(0, 8).map(k => `<li><span>${E(k.nama)} <small class="mut">${E(k.prov)}</small></span><b>${k.n}</b></li>`).join('') || '<li class="mut">Belum ada peserta terverifikasi.</li>'}</ul>`)}</div></div>`;
}
function tOrg() {
  const o = S.KUR.org, st = S.KS.stat;
  return `<div class="g2"><div>${card('Identitas penyelenggara', `<div class="k-grid2">${kin('org.nama', 'Nama lembaga penyelenggara', { req: 1, ph: 'contoh: Perkumpulan ...' })}${ksel('org.jenis', 'Jenis penyelenggara', ['Masyarakat', 'Satuan Pendidikan', 'Pemerintah Daerah', 'Pemerintah Pusat'])}${kin('org.legal_akta', 'Akta pendirian', { ph: 'No. & tanggal akta notaris', hint: 'Wajib bagi penyelenggara masyarakat' })}${kin('org.legal_sk', 'SK Kemenkumham / izin', { ph: 'AHU-...' })}</div>${kin('org.alamat', 'Alamat lengkap', { req: 1 })}<div class="k-grid2">${kin('org.kota', 'Kota (tempat surat)')}${kin('org.telp', 'Telepon')}${kin('org.email', 'Email', { type: 'email' })}${kin('org.web', 'Laman / portal')}</div>`)}
${card('Penandatangan & nomor surat', `<div class="k-grid2">${kin('org.pimpinan', 'Nama pimpinan (penanda tangan)', { req: 1 })}${kin('org.jabatan', 'Jabatan', { ph: 'Ketua Umum' })}${kin('org.nip', 'NIP / NIK (opsional)')}${kin('org.tgl_surat', 'Tanggal surat', { type: 'date' })}${kin('org.no_surat', 'Nomor surat permohonan')}${kin('org.no_sk_panitia', 'Nomor SK panitia')}${kin('org.no_sk_juri', 'Nomor SK juri')}${kin('org.no_sk_pemenang', 'Nomor SK pemenang')}</div>
<div class="kur-up">${['ttd', 'cap'].map(t => `<div class="kur-up-i"><b>${t === 'ttd' ? 'Tanda tangan pimpinan' : 'Cap / stempel lembaga'}</b><small class="mut">PNG latar transparan, maks 5 MB</small><span>${o[t + '_id'] ? '<span class="k-pill k-ok">Terunggah</span>' : '<span class="k-pill k-neu">Belum ada</span>'}</span><label class="k-btn sm k-outline"><i class="bi bi-upload"></i> ${o[t + '_id'] ? 'Ganti' : 'Unggah'}<input type="file" hidden accept="image/png,image/jpeg" data-chg="kur-img" data-t="${t}"></label>${o[t + '_id'] ? `<button type="button" class="k-btn sm k-ghostw" data-act="kur-img-del" data-t="${t}">Lepas</button>` : ''}</div>`).join('')}</div><p class="mut sm">Gambar dipakai di surat, SK, dan sertifikat. Tanpa gambar, berkas tetap bisa dicetak lalu ditandatangani basah dan dipindai.</p>`)}</div>
<div>${card('Identitas ajang', `${kin('ajang.nama', 'Nama ajang', { req: 1 })}${kin('ajang.subjudul', 'Subjudul / edisi tema')}<div class="k-grid2">${kin('ajang.cabang', 'Cabang ajang')}${ksel('ajang.bidang', 'Bidang', ['Olahraga', 'Seni Budaya', 'Riset dan Inovasi'])}${ksel('ajang.bentuk', 'Bentuk', ['Kompetisi', 'Nonkompetisi'])}${ksel('ajang.tingkat', 'Tingkat yang diajukan', ['Kabupaten/Kota', 'Provinsi', 'Nasional', 'Internasional'], { hint: `Data peserta memenuhi tingkat <b>${E(st.tingkatSaran)}</b> (${st.nProv} provinsi, ${st.nKota} kab/kota).` })}${ksel('ajang.metode', 'Metode', ['Luring', 'Daring', 'Bauran'])}${ksel('ajang.frekuensi', 'Frekuensi', ['Tahunan', 'Semesteran', 'Triwulanan', 'Bulanan', 'Lainnya'])}${kin('ajang.tgl_mulai', 'Tanggal mulai', { type: 'date' })}${kin('ajang.tgl_selesai', 'Tanggal selesai', { type: 'date' })}${kin('ajang.edisi', 'Penyelenggaraan ke-', { type: 'number' })}${kin('ajang.tahun_awal', 'Tahun pertama digelar', { type: 'number' })}</div>${kin('ajang.tempat', 'Tempat pelaksanaan')}${kin('ajang.aturan', 'Acuan peraturan teknis')}${kta('ajang.tujuan', 'Tujuan ajang', { rows: 3 })}${kta('ajang.tahapan', 'Tahapan / sistem lomba', { rows: 2 })}`)}
${card('Riwayat penyelenggaraan (keberlanjutan)', `<p class="mut sm">Edisi sebelumnya membuktikan konsistensi frekuensi. Musim berjalan ditambahkan otomatis.</p>${rows('riwayat', [['tahun', 'Tahun', '80px'], ['edisi', 'Ke-', '50px'], ['tempat', 'Tempat', '160px'], ['peserta', 'Peserta', '80px']], 'Belum ada riwayat.')}${(S.KS.arsip || []).length ? `<button type="button" class="k-btn sm k-ghostw" data-act="kur-arsip"><i class="bi bi-archive"></i> Isi dari arsip aplikasi (${S.KS.arsip.length})</button>` : ''}`)}</div></div>`;
}
function tPan() {
  return `${alertx('info', 'Prasyarat Instrumen 1A: ada <b>Panitia Pengarah</b> dan <b>Panitia Penyelenggara</b> dengan <b>Ketua, Sekretaris, Bendahara, dan Koordinator Lomba</b> yang dijabat <b>orang berbeda</b>, masing-masing dengan uraian tugas. Uraian tugas jabatan baku terisi otomatis bila dikosongkan.', 'bi-diagram-3')}
${card('Panitia Pengarah (Steering Committee)', rows('sc', [['nama', 'Nama', '180px'], ['jabatan', 'Jabatan dalam panitia', '150px', '', 'Pengarah / Penasihat'], ['instansi', 'Instansi / unsur', '180px']], 'Contoh: perwakilan dinas, federasi, atau tokoh pembina.'))}
${card('Panitia Penyelenggara (Organizing Committee)', `${rows('oc', [['nama', 'Nama', '170px'], ['jabatan', 'Jabatan', '150px', '', '', 'kur-jab'], ['tugas', 'Uraian tugas (opsional)', '260px', 'ta', 'Otomatis untuk jabatan baku']])}<button type="button" class="k-btn sm k-ghostw" data-act="kur-oc-baku"><i class="bi bi-magic"></i> Tambahkan susunan baku</button>`)}`;
}
function tJuri() {
  const J = S.KUR.juri || [], wil = new Set(J.map(j => (j.wilayah || '').toLowerCase()).filter(Boolean));
  return `${alertx('info', 'Juri wajib memenuhi <b>kompetensi</b> (sertifikat/lisensi, rekam jejak), <b>kualifikasi</b> (lisensi sesuai cabang), dan <b>keterwakilan</b> (sebaran wilayah dan instansi). Juri ditetapkan dengan SK, menandatangani pakta integritas, dan tidak ikut menyusun juknis. Pakta integritas tiap juri dibuat otomatis di berkas 04.', 'bi-person-badge')}
<div class="k-kpis">${kpi('Juri', J.length, 'bi-people')}${kpi('Berlisensi', J.filter(j => j.lisensi || j.no_lisensi).length, 'bi-award')}${kpi('Sebaran wilayah', wil.size, 'bi-geo-alt')}${kpi('Dengan rekam jejak', J.filter(j => j.pengalaman).length, 'bi-clock-history')}</div>
${card('Dewan juri dan wasit', rows('juri', [['nama', 'Nama', '160px'], ['peran', 'Peran', '150px', '', '', 'kur-peran'], ['lisensi', 'Lisensi / sertifikat', '170px'], ['no_lisensi', 'No. lisensi', '100px'], ['instansi', 'Instansi', '150px'], ['wilayah', 'Asal wilayah', '120px'], ['pengalaman', 'Pengalaman / rekam jejak', '220px', 'ta', 'Event yang pernah dijuri']], 'Tambahkan minimal 3 juri.'))}`;
}
function tDukung() {
  const al = S.KS.albums || [], f = (S.KUR.sert || {}).format || '';
  return `<div class="g2"><div>${card('Pembiayaan & orientasi nirlaba', `${rows('biaya', [['sumber', 'Sumber dana', '160px'], ['ket', 'Keterangan', '200px']])}${kta('nirlaba', 'Pernyataan orientasi penyelenggaraan', { rows: 3 })}`)}
${card('Penghargaan untuk pemenang', rows('hadiah', [['peringkat', 'Peringkat', '120px'], ['bentuk', 'Bentuk penghargaan', '240px']]))}
${card('Mitra penyelenggaraan', rows('mitra', [['nama', 'Mitra', '170px'], ['bentuk', 'Bentuk dukungan', '200px']], 'Dinas, federasi, sponsor, media partner…'))}</div>
<div>${card('Publikasi juara secara online', `<p class="mut sm">Wajib ada bukti publikasi juara yang dapat diakses publik.</p>${rows('publikasi', [['judul', 'Keterangan', '160px'], ['url', 'Tautan', '220px', 'url', 'https://']])}`)}
${card('Liputan media', rows('media', [['media', 'Media', '120px'], ['judul', 'Judul', '170px'], ['tanggal', 'Tanggal', '120px', 'date'], ['url', 'Tautan', '180px', 'url', 'https://']], 'Berita daring, TV, radio, atau kanal resmi.'))}
${card('Dokumentasi & sertifikat', `${field('Album foto dari menu Dokumentasi', sel('x', [['', '— pilih album —']].concat(al.map(a => [a.nama, `${a.nama} (${a.n} foto)`])), S.KUR.dok.album, 'data-chg="kur" data-k="dok.album"'), 0, 'Hingga 8 foto masuk Laporan Pelaksanaan sebagai bukti sarana prasarana.')}${kin('dok.link', 'Tautan album lengkap (Google Drive)', { type: 'url', ph: 'https://drive.google.com/...' })}${kin('sert.format', 'Format nomor sertifikat', { hint: `Kode: {EV} nomor acara, {R} peringkat, {TAHUN} musim. Contoh: <b class="mono">${E(f.replace(/\{EV\}/g, '101').replace(/\{R\}/g, '1').replace(/\{TAHUN\}/g, S.KS.musim))}</b>` })}${kta('ajang.catatan_kendala', 'Catatan monitoring & evaluasi (opsional)', { rows: 2, ph: 'Kendala dan rencana perbaikan untuk edisi berikutnya' })}`)}</div></div>`;
}
function tUnduh() {
  const st = S.KS.stat, nb = Math.ceil(st.juara / 25);
  return `${alertx('info', 'Berkas dibuat dari data terbaru. Surat dan SK tanpa gambar tanda tangan dapat dicetak, ditandatangani basah, lalu dipindai. Unggah berkas ke aplikasi Kurasi Prestasi sesuai komponennya.', 'bi-info-circle')}
<div class="kur-docs">${DOKS.map(d => `<div class="k-tile kur-doc"><span class="ti"><i class="bi ${d[3]}"></i></span><div><small class="mono mut">BERKAS ${d[0]}</small><b>${d[1]}</b><p class="mut sm">${d[2]}</p></div><button class="k-btn sm k-navy" data-act="kur-dl" data-j="${d[0]}"><i class="bi bi-file-earmark-pdf"></i> Unduh PDF</button></div>`).join('')}</div>
<div class="g2" style="margin-top:16px">${card('Paket lengkap', `<p class="mut sm">Berkas 00–08 dalam satu ZIP. Proses bisa memakan 30–90 detik.</p><button class="k-btn k-orange" data-act="kur-dl" data-j="ZIP"><i class="bi bi-file-earmark-zip"></i> Unduh paket ZIP</button> <button class="k-btn k-outline" data-act="kur-xls"><i class="bi bi-file-earmark-spreadsheet"></i> Data Excel (peserta, pemenang, sebaran, juri)</button>`)}
${card('Sertifikat juara', st.juara ? `<p class="mut sm">${st.juara} piagam juara bernomor, dibagi per 25 lembar.</p><div class="k-chips">${Array.from({ length: nb }, (_, i) => `<button class="k-btn sm k-outline" data-act="kur-sert" data-b="${i}"><i class="bi bi-award"></i> Bagian ${i + 1} (${i * 25 + 1}–${Math.min(st.juara, i * 25 + 25)})</button>`).join('')}</div>` : '<p class="mut">Belum ada juara yang disahkan.</p>')}</div>`;
}

/* ===== Interaksi ===== */
ACT['kur-tab'] = a => { S.ktab = a.dataset.v; $$('#kur-tabs button').forEach(b => b.classList.toggle('on', b.dataset.v === S.ktab)); redrawBody(); window.scrollTo(0, ($('#kur-tabs') || {}).offsetTop - 70 || 0); };
INP.kur = el => { set(S.KUR, el.dataset.k, el.value); jadwalSimpan(); };
const BARU = { riwayat: { tahun: '', edisi: '', tempat: '', peserta: '' }, sc: { nama: '', jabatan: 'Pengarah', instansi: '' }, oc: { nama: '', jabatan: '', tugas: '' }, juri: { nama: '', peran: '', lisensi: '', no_lisensi: '', instansi: '', wilayah: '', pengalaman: '' }, biaya: { sumber: '', ket: '' }, hadiah: { peringkat: '', bentuk: '' }, mitra: { nama: '', bentuk: '' }, publikasi: { judul: '', url: '' }, media: { media: '', judul: '', tanggal: '', url: '' } };
ACT['kur-add'] = a => { const k = a.dataset.key; (S.KUR[k] = S.KUR[k] || []).push(Object.assign({}, BARU[k])); redrawBody(); const L = $$(`[data-k^="${k}.${S.KUR[k].length - 1}."]`); if (L[0]) L[0].focus(); };
ACT['kur-del'] = a => { S.KUR[a.dataset.key].splice(Number(a.dataset.i), 1); redrawBody(); jadwalSimpan(0); };
ACT['kur-oc-baku'] = () => { const ada = new Set((S.KUR.oc || []).map(x => (x.jabatan || '').toLowerCase())); ['Ketua', 'Sekretaris', 'Bendahara', 'Koordinator Lomba', 'Seksi Pendaftaran', 'Seksi Acara', 'Seksi Publikasi', 'Seksi Dokumentasi', 'Seksi Perlengkapan', 'Seksi Kesehatan', 'Seksi IT'].forEach(j => { if (!ada.has(j.toLowerCase())) S.KUR.oc.push({ nama: '', jabatan: j, tugas: '' }); }); redrawBody(); toast('Susunan baku ditambahkan. Isi nama tiap jabatan.'); };
ACT['kur-arsip'] = () => { const ada = new Set((S.KUR.riwayat || []).map(r => String(r.tahun))); S.KS.arsip.forEach(x => { if (!ada.has(String(x.tahun)) && String(x.tahun) !== String(S.KS.musim)) S.KUR.riwayat.push({ tahun: x.tahun, edisi: '', tempat: '', peserta: String(x.peserta || '') }); }); redrawBody(); jadwalSimpan(0); };
function jadwalSimpan(ms) { clearTimeout(S._kurT); const sv = $('#kur-sv'); if (sv) sv.textContent = 'Menyimpan…'; S._kurP = new Promise(res => { S._kurT = setTimeout(() => simpan().then(res, res), ms == null ? 1200 : ms); }); }
async function simpan() {
  try { const r = await rp('kur.simpan', { musim: S.KS.musim, data: S.KUR }); S.KS.siap = r.data.siap; const sv = $('#kur-sv'); if (sv) sv.textContent = 'Tersimpan ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }); const k = $('#kur-skor'), b = $('#kur-bar'); if (k) k.textContent = r.data.siap.skor + '%'; if (b) b.style.width = r.data.siap.skor + '%'; if (S.ktab === 'siap') redrawBody(); }
  catch (e) { const sv = $('#kur-sv'); if (sv) sv.textContent = 'Gagal menyimpan'; toast(e.message, 'err'); }
}
const flush = async () => { if (S._kurT) { clearTimeout(S._kurT); S._kurT = null; await simpan(); } else if (S._kurP) await S._kurP; };
ACT['kur-dl'] = async a => { busy(a, true); try { await flush(); const r = await rp('kur.buat', { musim: S.KS.musim, jenis: a.dataset.j }); dlB64(r.data.name.replace(/\.(pdf|zip)?$/, '') + (r.data.mime === 'application/zip' ? '.zip' : '.pdf'), r.data.mime, r.data.b64); toast(r.data.mime === 'application/zip' ? 'Paket berkas kurasi diunduh.' : 'Berkas diunduh.'); } catch (e) { toast(e.message, 'err'); } busy(a, false); };
ACT['kur-sert'] = async a => { busy(a, true); try { await flush(); const r = await rp('kur.sert', { musim: S.KS.musim, bag: Number(a.dataset.b) }); dlB64(/\.pdf$/i.test(r.data.name) ? r.data.name : r.data.name + '.pdf', r.data.mime, r.data.b64); } catch (e) { toast(e.message, 'err'); } busy(a, false); };
ACT['kur-xls'] = async a => { busy(a, true); try { await flush(); const d = (await rp('kur.data', { musim: S.KS.musim })).data; await xlsx([{ name: 'Peserta', rows: d.peserta }, { name: 'Pemenang', rows: d.pemenang }, { name: 'Sebaran Kab-Kota', rows: d.sebaran }, { name: 'Juri', rows: d.juri }], `Data_Kurasi_${d.musim}.xlsx`); } catch (e) { toast(e.message, 'err'); } busy(a, false); };
INP['kur-img'] = async i => { const f = i.files[0]; if (!f) return; try { await flush(); const x = await readFile(f, true); const r = await rp('kur.img', { musim: S.KS.musim, t: i.dataset.t, file: x }); S.KUR.org[r.data.t + '_id'] = r.data.id; toast(r.message); redrawBody(); } catch (e) { toast(e.message, 'err'); } };
ACT['kur-img-del'] = a => { S.KUR.org[a.dataset.t + '_id'] = ''; redrawBody(); jadwalSimpan(0); };
})();

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
    ['Atur jam mulai, menit per seri tiap jarak, dan jeda antarnomor.', 'Urutan, hari, dan jam bisa diubah manual per nomor; sisanya dihitung otomatis.', 'Estimasi ikut berubah mengikuti jumlah peserta dan seri setelah start list tersusun.', 'Untuk jeda istirahat/Ishoma: klik “+ Istirahat” pada nomor yang diikuti istirahat, isi lama (menit). Jam nomor berikutnya bergeser otomatis.'], [['a-jadwal', 'Jadwal Acara']], 'Estimasi jam tampil di web dan di Buku Acara.');
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
    ['Di Tahapan Event, lanjut ke Start List: seri & lintasan disusun otomatis dari entry time. Perenang tercepat di seri terakhir dan lintasan tengah; seri terakhir diisi penuh, seri 1 berisi sisanya dengan minimal 3 perenang (contoh 8 lintasan: 14 peserta → 6 + 8, 18 peserta → 3 + 7 + 8).', 'Peserta tanpa catatan waktu (NT) ditempatkan di seri awal.', 'Bila ada perubahan peserta, susun ulang sebelum Buku Acara terbit.'], [['a-fase', 'Tahapan Event'], ['startlist', 'Lihat Start List']]);
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

(function () {
'use strict';
/* ===== Susun Acara dinamis: seret & lepas, pindah hari, batalkan/pulihkan nomor, estimasi jam langsung ===== */
const { $, $$, E, S, V, ACT, INP, SUBMIT, G_L, FASE_L, rp, toast, busy, ph, alertx, go, ask, bustCache, jn, card, xlsx, form, fdt } = KRP;
const main = h => { $('#main').innerHTML = h; };
const tabelLama = V['a-jadwal']; // tampilan tabel & jam manual (versi sebelumnya)
const GU = { 'Gaya Bebas': 1, 'Gaya Punggung': 2, 'Gaya Dada': 3, 'Gaya Kupu-kupu': 4, 'Gaya Ganti Perorangan': 5 };
const gaya = nama => String(nama || '').replace(/^\d+m\s*/, '');
const jamF = m => { m = Math.max(0, Math.round(m)); return ('0' + Math.floor(m / 60) % 24).slice(-2) + ':' + ('0' + m % 60).slice(-2); };
const jamM = t => { const q = String(t || '08:00').split(':'); return Number(q[0]) * 60 + Number(q[1] || 0); };

V['a-jadwal'] = function () {
  S.jdTab = S.jdTab || 'susun';
  if (S.jdTab === 'tabel') return tabelLama();
  const tampil = () => (S.jdTab === 'sim' ? gambarSim() : gambar());
  if (S.SA && S.SA.dirty) return tampil(); // susunan yang belum disimpan tetap dipakai (pindah tab Susun ↔ Simulasi tanpa kehilangan perubahan)
  const t = S.rt, c = KRP.cacheSegar('jd', 120000); let js = '';
  if (c) { js = JSON.stringify(c.d); muat(c.d); tampil(); } // salinan terakhir langsung tampil
  rp('jd.get', {}).then(r => { if (t !== S.rt) return; KRP.simpanCache('jd', r.data); if (c && (JSON.stringify(r.data) === js || (S.SA && S.SA.dirty))) return; muat(r.data); tampil(); })
    .catch(e => { if (!c) KRP.errView(e.message, () => go('a-jadwal')); else toast(e.message, 'err'); });
};
const tabJd = () => `<div class="k-seg ev-tabs">${[['susun', 'Susun acara', 'bi-arrows-move'], ['sim', 'Simulasi program', 'bi-play-btn'], ['tabel', 'Tabel & jam manual', 'bi-table']].map(x => `<button class="${S.jdTab === x[0] ? 'on' : ''}" data-act="jd-tab" data-v="${x[0]}"><i class="bi ${x[2]}"></i> ${x[1]}</button>`).join('')}</div>`;
ACT['jd-tab'] = a => { if (S.SA && S.SA.dirty && a.dataset.v === 'tabel') { toast('Simpan atau batalkan perubahan susunan dulu.', 'warn'); return; } S.jdTab = a.dataset.v; go('a-jadwal'); };
// Sisipkan tab ke tampilan tabel lama
S.jdTabBar = tabJd;

function muat(d) {
  const rows = {}, hari = {};
  d.rows.forEach(r => { rows[r.eid] = Object.assign({}, r, { aktif: 1 }); (hari[r.hari] = hari[r.hari] || []).push(r.eid); });
  d.batal.forEach(r => { rows[r.eid] = Object.assign({ heats: Math.max(1, Math.ceil(r.n / (Number(d.cfg.lintasan) || 8))), mn: 3, jamManual: '' }, r, { aktif: 0 }); });
  let menit = {}; try { menit = JSON.parse(d.cfg.menit || '{}'); } catch (e) { }
  d.batal.forEach(r => { rows[r.eid].mn = Number(menit[r.d]) || Math.max(2, Math.round(r.d / 25) + 1); });
  if (!Object.keys(hari).length) hari[1] = [];
  d.sah = d.sah || {}; d.fin = d.fin || {}; d.cfg.otomatis = d.cfg.otomatis || 'KOSONG'; S.jdOto = d.cfg.otomatis;
  // Selama pendaftaran dibuka dengan nomor final otomatis, simpan urutan saja: nomor acara yang dilihat pendaftar tidak berubah;
  // nomor acara final diberikan saat start list disusun. Setelah pendaftaran ditutup, menyimpan langsung menomori ulang seperti biasa.
  // Setelah pendaftaran ditutup (fase apa pun sebelum Buku Acara), "Simpan susunan" langsung menerapkan nomor final:
  // nomor kosong dilewati & acara dinomori #1… mengikuti papan. Susunan induk (semua nomor) disimpan server agar bisa disusun ulang dari awal.
  const otoNanti = d.cfg.otomatis !== 'OFF' && d.buka, bisaFinal = !d.buka && d.cfg.otomatis !== 'OFF' && !d.kunciNo;
  S.SA = { d, rows, hari, batal: d.batal.map(r => r.eid), dirty: false, renomor: !d.kunciNo && !otoNanti, final: bisaFinal, bisaFinal, induk: false, resetJam: false, mulaiNo: 1, sel: null };
}
function hitung() { // estimasi jam per hari, sama dengan perhitungan server
  const A = S.SA, c = A.d.cfg, jeda = Number(c.jeda) || 0, out = {}; let no = A.final ? 1 : A.mulaiNo, pos = 1;
  Object.keys(A.hari).sort((a, b) => a - b).forEach(h => {
    let cur = jamM(c.mulai); out[h] = { mulai: jamF(cur), selesai: '', n: A.hari[h].length };
    A.hari[h].forEach(id => { const r = A.rows[id]; r._pos = pos++; r._no = A.final ? (akanLewat(r) ? 0 : no++) : A.renomor ? no++ : r.no; if (!r.n) { r._jam = ''; return; } let st = cur; if (r.jamManual) st = Math.max(jamM(r.jamManual), 0); r._jam = jamF(st); cur = st + r.heats * r.mn + jeda; r._sel = jamF(cur - jeda); });
    out[h].selesai = A.hari[h].some(id => A.rows[id].n) ? jamF(cur - jeda) : '';
  });
  A.batal.forEach(id => { A.rows[id]._no = A.renomor && !A.final ? no++ : A.rows[id].no; });
  return out;
}
const akanLewat = r => { const A = S.SA, d = A.d, n = d.fin[r.eid] != null ? d.fin[r.eid] : r.n; if (d.kunciNo || d.cfg.otomatis === 'OFF') return ''; return d.cfg.otomatis === 'KOSONG' ? (n === 0 ? 'kosong' : '') : (n < Math.max(1, d.minp || 1) ? 'kurang' : ''); };
function kartu(id, i, n) {
  const A = S.SA, r = A.rows[id], kurang = !A.d.buka && A.d.minp && r.n < A.d.minp, lw = akanLewat(r);
  return `<li class="sa-it${kurang ? ' warn' : ''}${lw ? ' skip' : ''}${A.sel === id ? ' sel' : ''}" draggable="true" data-id="${E(id)}"><span class="sa-h" aria-hidden="true"><i class="bi bi-grip-vertical"></i></span><label class="sa-no" title="Urutan ke- (ketik angka lalu Enter untuk memindahkan)"><input class="k-in sa-pos mono" type="number" min="1" value="${r._pos}" data-chg="sa-pos" data-id="${E(id)}" aria-label="Urutan ke-">${A.final ? (r._no ? `<small class="mono sa-fin" title="Nomor acara final setelah disimpan">#${r._no}</small>` : '<small class="mut">lewat</small>') : A.renomor ? '' : `<small class="mut mono">#${r.no}</small>`}</label>
<div class="sa-b"><b>${E(r.nama)}</b><small>${E(jn(r.jk))} · ${G_L[r.g] || r.g}${lw ? ` · <span class="sa-skip">${lw === 'kosong' ? 'kosong · akan dilewati' : 'peserta &lt; ' + (A.d.minp || 1) + ' · akan dilewati'}</span>` : ''}</small></div>
<div class="sa-m"><span class="sa-pes${kurang ? ' warn' : ''}" title="Peserta${kurang ? ' (kurang dari minimal ' + A.d.minp + ')' : ''}"><i class="bi bi-people"></i> ${r.n}</span><span class="mono sa-jam">${r._jam || '—'}</span></div>
<div class="sa-a"><button type="button" class="ev-ib" data-act="sa-up" data-id="${E(id)}" ${i === 0 ? 'disabled' : ''} title="Naik" aria-label="Naik"><i class="bi bi-arrow-up"></i></button><button type="button" class="ev-ib" data-act="sa-down" data-id="${E(id)}" ${i === n - 1 ? 'disabled' : ''} title="Turun" aria-label="Turun"><i class="bi bi-arrow-down"></i></button><select class="k-in sa-hr" data-chg="sa-hari" data-id="${E(id)}" aria-label="Pindah hari">${Object.keys(A.hari).concat([String(Object.keys(A.hari).length + 1)]).filter((v, j, a) => a.indexOf(v) === j).map(h => `<option value="${h}"${String(r.hari) === String(h) ? ' selected' : ''}>H${h}</option>`).join('')}</select><button type="button" class="ev-ib del" data-act="sa-batal" data-id="${E(id)}" title="Batalkan nomor (tidak dilaksanakan)" aria-label="Batalkan"><i class="bi bi-x-circle"></i></button></div></li>`;
}
function gambar() {
  const A = S.SA, d = A.d, est = hitung(), hs = Object.keys(A.hari).sort((a, b) => a - b), aktif = hs.reduce((s, h) => s + A.hari[h].length, 0);
  const kurang = hs.reduce((s, h) => s + A.hari[h].filter(id => d.minp && A.rows[id].n < d.minp).length, 0);
  main(`<div class="k-wrap pad">${ph('Jadwal & Susun Acara', 'Seret nomor untuk mengubah urutan atau memindahkan hari. Batalkan nomor yang tidak bisa dilaksanakan; estimasi jam langsung dihitung ulang.')}${tabJd()}
${A.bisaFinal ? alertx(A.induk ? 'warn' : 'info', `<b>Pendaftaran sudah ditutup.</b> Susun urutan seluruh nomor dari awal sampai akhir seperti biasa. Saat <b>Simpan susunan</b>, nomor ${d.cfg.otomatis === 'KOSONG' ? 'tanpa peserta' : 'dengan peserta kurang dari ' + (d.minp || 1)} otomatis dilewati dan acara dinomori #1, #2, … mengikuti papan (angka oranye di kartu). Ingin mulai dari nol? Klik <b>Susun ulang dari awal</b>.${d.induk ? ` <span class="sm">Susunan sebelum nomor final tersimpan (${E(fdt(d.induk.t))}).</span>` : ''}`, 'bi-signpost-split') : ''}
${!d.kunciNo && d.cfg.otomatis !== 'OFF' && d.buka ? alertx('info', `<b>Susunan induk.</b> Atur urutan seluruh nomor dari awal sampai akhir kapan saja, walau pendaftaran masih dibuka. Ketik angka di kotak urutan untuk memindahkan nomor. Saat pendaftaran ditutup dan start list disusun, nomor ${d.cfg.otomatis === 'KOSONG' ? 'tanpa peserta' : 'dengan peserta kurang dari ' + (d.minp || 1)} dilewati dan acara otomatis dinomori #1, #2, … mengikuti susunan ini. Lihat hasilnya di tab <b>Simulasi program</b>.`, 'bi-signpost-split') : ''}
${d.kunciNo ? alertx('warn', `Buku Acara sudah terbit (tahap ${E(FASE_L[d.fase] || d.fase)}). Urutan & hari masih bisa diubah, tetapi <b>nomor acara tidak diurutkan ulang</b> agar sama dengan dokumen. Terbitkan ulang Buku Acara setelah menyimpan.${d.bukaKunci ? ' Perlu menyusun ulang nomor acara dari awal? <button class="k-btn sm k-navy" data-act="sa-bukakunci"><i class="bi bi-unlock"></i> Buka kunci nomor acara</button>' : ''}`, 'bi-lock') : ''}
<div class="sa-top"><div class="sa-kpi"><span><b>${aktif}</b> dipertandingkan</span><span><b>${A.batal.length}</b> dibatalkan</span><span class="${kurang ? 'warn' : ''}"><b>${kurang}</b> peserta &lt; ${d.minp || '-'}</span>${hs.map(h => `<span>Hari ${h}: <b>${est[h].mulai}–${est[h].selesai || '?'}</b></span>`).join('')}</div>
<div class="sa-tool"><button class="k-btn k-navy sm" data-act="sa-ulang" title="Mulai susunan dari nol: kembalikan susunan sebelum nomor final atau susun otomatis dengan pola"><i class="bi bi-arrow-repeat"></i> Susun ulang dari awal</button><button class="k-btn k-outline sm" data-act="sa-kurang" ${kurang && !d.buka ? '' : 'disabled'} title="${d.buka ? 'Aktif setelah pendaftaran ditutup' : ''}"><i class="bi bi-x-octagon"></i> Batalkan semua &lt; ${d.minp || '-'} peserta</button><select class="k-in sa-sort" data-chg="sa-sort" aria-label="Urutkan otomatis"><option value="">Urutkan otomatis tiap hari…</option><option value="no">Nomor acara lama</option><option value="gaya">Per gaya & jarak, lalu kelompok</option><option value="kel">Per kelompok, lalu gaya & jarak</option><option value="jarak">Jarak pendek dulu</option></select><button class="k-btn k-outline sm" data-act="sa-bagi" title="Bagi urutan menjadi beberapa hari dengan durasi seimbang"><i class="bi bi-distribute-vertical"></i> Bagi hari seimbang</button><button class="k-btn k-outline sm" data-act="sa-hari-baru"><i class="bi bi-plus-lg"></i> Tambah hari</button></div></div>
<div class="sa-board" id="sa-board">${hs.map(h => `<section class="sa-day" data-hari="${h}"><header><div><b>Hari ${h}</b><small class="mut">${A.hari[h].length} nomor · mulai ${est[h].mulai}${est[h].selesai ? ' · selesai ±' + est[h].selesai : ''}</small></div></header><ol class="sa-list" data-hari="${h}">${A.hari[h].map((id, i) => kartu(id, i, A.hari[h].length)).join('') || '<li class="sa-empty">Seret nomor ke sini</li>'}</ol></section>`).join('')}</div>
<section class="sa-tray"><header><b><i class="bi bi-slash-circle"></i> Dibatalkan / tidak dilaksanakan (${A.batal.length})</b><small class="mut">Tidak tampil di jadwal, start list, dan Buku Acara. Pendaftarnya perlu dipindah lewat Akun & Berkas.</small></header><div class="sa-tl">${A.batal.map(id => { const r = A.rows[id]; return `<span class="sa-bt"><span class="mono">#${r._no}</span> ${E(r.nama)} · ${E(jn(r.jk))} · ${G_L[r.g] || ''} <small>(${r.n} peserta)</small><button type="button" class="k-btn sm k-outline" data-act="sa-pulih" data-id="${E(id)}">Pulihkan</button></span>`; }).join('') || '<span class="mut sm">Belum ada nomor yang dibatalkan.</span>'}</div></section>
<div class="k-bar sticky sa-save">${A.bisaFinal ? `<label class="k-check1"><input type="checkbox" data-chg="sa-final" ${A.final ? 'checked' : ''}> Terapkan nomor final saat menyimpan <small class="mut">(${E(ATURAN_P[d.cfg.otomatis] || '')}, acara #1…)</small></label>` : ''}${A.final ? '' : `<label class="k-check1"><input type="checkbox" data-chg="sa-renomor" ${A.renomor ? 'checked' : ''} ${d.kunciNo ? 'disabled' : ''}> Urutkan ulang nomor acara mulai #<input class="k-in sa-mno" type="number" min="1" value="${A.mulaiNo}" data-chg="sa-mno" ${d.kunciNo ? 'disabled' : ''} aria-label="Nomor awal"> sesuai susunan</label>`}<span class="sa-dirty">${A.dirty ? `<i class="bi bi-circle-fill"></i> ${A.induk ? 'Susunan baru dari awal belum disimpan' : 'Ada perubahan belum disimpan'}` : ''}</span><button class="k-btn k-ghostw" data-act="sa-reset" ${A.dirty ? '' : 'disabled'}>Batalkan perubahan</button><button class="k-btn lg k-orange" data-act="sa-simpan" ${A.dirty || A.renomor || A.final ? '' : 'disabled'}><i class="bi bi-check2-circle"></i> ${A.final ? 'Simpan & terapkan nomor final' : 'Simpan susunan'}</button></div></div>`);
  pasangDnD();
}
const ubah = () => { S.SA.dirty = true; gambar(); };
function cari(id) { const A = S.SA; for (const h of Object.keys(A.hari)) { const i = A.hari[h].indexOf(id); if (i >= 0) return [h, i]; } return null; }
function pindah(id, keHari, keIdx) {
  const A = S.SA, p = cari(id); if (p) A.hari[p[0]].splice(p[1], 1); else A.batal = A.batal.filter(x => x !== id);
  const L = A.hari[keHari] = A.hari[keHari] || []; L.splice(keIdx == null ? L.length : Math.min(keIdx, L.length), 0, id);
  A.rows[id].hari = Number(keHari); Object.keys(A.hari).forEach(h => { if (!A.hari[h].length && Object.keys(A.hari).length > 1 && h !== String(keHari)) delete A.hari[h]; });
}
ACT['sa-up'] = a => { const p = cari(a.dataset.id); if (!p || !p[1]) return; const L = S.SA.hari[p[0]]; [L[p[1] - 1], L[p[1]]] = [L[p[1]], L[p[1] - 1]]; S.SA.sel = a.dataset.id; ubah(); };
ACT['sa-down'] = a => { const p = cari(a.dataset.id), L = p && S.SA.hari[p[0]]; if (!p || p[1] >= L.length - 1) return; [L[p[1] + 1], L[p[1]]] = [L[p[1]], L[p[1] + 1]]; S.SA.sel = a.dataset.id; ubah(); };
INP['sa-hari'] = i => { pindah(i.dataset.id, i.value); S.SA.sel = i.dataset.id; ubah(); };
ACT['sa-batal'] = a => { const A = S.SA, id = a.dataset.id, p = cari(id); if (!p) return; A.hari[p[0]].splice(p[1], 1); A.batal.push(id); const r = A.rows[id]; if (r.n) toast(`#${r._no} punya ${r.n} peserta — setelah disimpan, pindahkan pesertanya lewat Akun & Berkas.`, 'warn'); ubah(); };
ACT['sa-pulih'] = a => { const id = a.dataset.id, h = S.SA.rows[id].hari || Object.keys(S.SA.hari)[0]; pindah(id, S.SA.hari[h] ? h : Object.keys(S.SA.hari)[0]); S.SA.sel = id; ubah(); };
ACT['sa-hari-baru'] = () => { const A = S.SA, n = Math.max(...Object.keys(A.hari).map(Number)) + 1; A.hari[n] = []; ubah(); };
ACT['sa-kurang'] = async () => {
  const A = S.SA, L = []; Object.keys(A.hari).forEach(h => A.hari[h].forEach(id => { if (A.rows[id].n < A.d.minp) L.push(id); }));
  if (!L.length) return; const ada = L.filter(id => A.rows[id].n).length;
  if (!(await ask(`Batalkan <b>${L.length} nomor</b> dengan peserta kurang dari ${A.d.minp}?${ada ? ` ${ada} di antaranya punya pendaftar yang nanti perlu dipindahkan.` : ''} Belum tersimpan sampai Anda klik Simpan susunan.`, 'Batalkan nomor', true))) return;
  L.forEach(id => { const p = cari(id); A.hari[p[0]].splice(p[1], 1); A.batal.push(id); }); ubah();
};
const POLA = { gaya: 'Per gaya & jarak, lalu kelompok', kel: 'Per kelompok, lalu gaya & jarak', jarak: 'Jarak pendek dulu', no: 'Nomor acara saat ini' };
function pembanding(k) {
  const jen = {}; (S.B.jenjang || []).forEach((j, n) => { jen[j.kode] = n; });
  return { no: (a, b) => a.no - b.no, gaya: (a, b) => (GU[gaya(a.nama)] || 9) - (GU[gaya(b.nama)] || 9) || a.d - b.d || (jen[a.jk] || 0) - (jen[b.jk] || 0) || a.g.localeCompare(b.g), kel: (a, b) => (jen[a.jk] || 0) - (jen[b.jk] || 0) || (GU[gaya(a.nama)] || 9) - (GU[gaya(b.nama)] || 9) || a.d - b.d || a.g.localeCompare(b.g), jarak: (a, b) => a.d - b.d || (GU[gaya(a.nama)] || 9) - (GU[gaya(b.nama)] || 9) || (jen[a.jk] || 0) - (jen[b.jk] || 0) || a.g.localeCompare(b.g) }[k];
}
INP['sa-sort'] = i => {
  const A = S.SA, k = i.value; if (!k) return; const f = pembanding(k);
  Object.keys(A.hari).forEach(h => A.hari[h].sort((x, y) => f(A.rows[x], A.rows[y]))); toast('Urutan tiap hari diatur ulang. Putra selalu sebelum putri.'); ubah();
};
INP['sa-pos'] = i => { // pindahkan ke urutan global ke-n (lintas hari)
  const A = S.SA, id = i.dataset.id, hs = Object.keys(A.hari).sort((a, b) => a - b), tot = hs.reduce((s, h) => s + A.hari[h].length, 0);
  let k = Math.min(tot, Math.max(1, Number(i.value) || 1)) - 1; const p = cari(id); if (!p) return; A.hari[p[0]].splice(p[1], 1);
  let ok = false; for (const h of hs) { const L = A.hari[h]; if (k < L.length) { L.splice(k, 0, id); A.rows[id].hari = Number(h); ok = true; break; } k -= L.length; }
  if (!ok) { const h = hs[hs.length - 1]; A.hari[h].push(id); A.rows[id].hari = Number(h); }
  S.SA.sel = id; ubah(); const el = $(`.sa-it[data-id="${CSS.escape(id)}"]`); if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
};
function durasi(id) { // nomor kosong dihitung 1 seri (pendaftaran masih bisa masuk); nomor yang akan dilewati tidak memakan waktu
  const A = S.SA, r = A.rows[id], lanes = Number(A.d.cfg.lintasan) || 8, jeda = Number(A.d.cfg.jeda) || 0;
  if (A.final && akanLewat(r)) return 0; return Math.max(1, Math.ceil((r.n || 0) / lanes)) * r.mn + jeda + (r.istSet ? Number(r.istSet.menit) || 0 : 0);
}
function bagiSeimbang(G, H) { // urutan G tetap; dipotong menjadi H hari dengan durasi seimbang
  const A = S.SA, T = G.reduce((s, id) => s + durasi(id), 0); A.hari = {}; for (let h = 1; h <= H; h++) A.hari[h] = [];
  let cum = 0, di = 1; G.forEach(id => { const x = durasi(id); if (di < H && cum + x / 2 > T * di / H && A.hari[di].length) di++; A.hari[di].push(id); A.rows[id].hari = di; cum += x; });
  Object.keys(A.hari).forEach(h => { if (!A.hari[h].length && Object.keys(A.hari).length > 1) delete A.hari[h]; });
  return T;
}
ACT['sa-bagi'] = async () => { // urutan global tetap; batas antarhari digeser agar durasi tiap hari seimbang
  const A = S.SA, hs = Object.keys(A.hari).sort((a, b) => a - b), H = hs.length; if (H < 2) return toast('Tambah hari dulu (minimal 2 hari) untuk membagi acara.', 'warn');
  const G = [].concat(...hs.map(h => A.hari[h])), T = G.reduce((s, id) => s + durasi(id), 0);
  if (!(await ask(`Bagi ${G.length} nomor ke ${H} hari dengan durasi ±${Math.round(T / H)} menit per hari? Urutan nomor tidak berubah.`, 'Bagi'))) return;
  bagiSeimbang(G, H); ubah(); toast('Acara dibagi ke ' + H + ' hari. Periksa jam selesai tiap hari di atas.');
};
/* ===== Susun ulang dari awal (kapan saja, juga setelah pendaftaran ditutup) ===== */
ACT['sa-ulang'] = () => {
  const A = S.SA, d = A.d, ind = d.induk && (d.induk.rows || []).length ? d.induk : null, H = Math.max(1, Object.keys(A.hari).length), nB = A.batal.length;
  KRP.modal('Susun ulang dari awal', `<form data-submit="sa-ulang" class="sa-ul">
${ind ? `<label class="sa-op"><input type="radio" name="cara" value="induk" checked data-chg="sa-ulc"><span><b>Kembalikan susunan sebelum nomor final</b><small>Disimpan ${E(fdt(ind.t))}${ind.oleh ? ' oleh ' + E(ind.oleh) : ''}. Semua ${ind.rows.length} nomor kembali ke hari & urutan semula, termasuk nomor kosong yang dilewati.</small></span></label>` : ''}
<label class="sa-op"><input type="radio" name="cara" value="pola" ${ind ? '' : 'checked'} data-chg="sa-ulc"><span><b>Susun otomatis dengan pola</b><small>Semua nomor diurutkan dari acara pertama sampai terakhir dengan pola di bawah, lalu dibagi ke beberapa hari dengan durasi seimbang.</small></span></label>
<div class="sa-pola" ${ind ? 'hidden' : ''}><label class="k-f"><span>Pola urutan</span><select class="k-in" name="pola">${Object.keys(POLA).map(k => `<option value="${k}">${POLA[k]}</option>`).join('')}</select><small>Putra selalu sebelum putri pada jarak & gaya yang sama.</small></label>
<label class="k-f"><span>Jumlah hari</span><input class="k-in" type="number" name="hari" min="1" max="9" value="${H}"></label>
${nB ? `<label class="k-check1 sm"><input type="checkbox" name="pulih" checked> Ikutkan ${nB} nomor yang sedang dibatalkan/dilewati</label>` : ''}</div>
<label class="k-check1 sm"><input type="checkbox" name="resetJam" checked> Hapus jam mulai manual (jam dihitung otomatis dari urutan)</label>
${alertx('info', `Hasilnya tampil di papan dan <b>belum tersimpan</b>. Periksa, ubah bila perlu, lalu klik <b>${A.bisaFinal ? 'Simpan & terapkan nomor final' : 'Simpan susunan'}</b>.${A.bisaFinal ? ' Nomor yang tetap kosong otomatis dilewati saat disimpan.' : ''} Jeda istirahat tetap menempel pada nomornya.`, 'bi-info-circle')}
<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange"><i class="bi bi-arrow-repeat"></i> Susun di papan</button></div></form>`);
};
INP['sa-ulc'] = i => { const p = $('.sa-pola'); if (p) p.hidden = i.value !== 'pola'; };
SUBMIT['sa-ulang'] = f => {
  const A = S.SA, d = A.d, o = form(f);
  if (o.cara === 'induk') {
    const ada = {}, hari = {}, batal = [];
    d.induk.rows.forEach(x => { const r = A.rows[x.e]; if (!r || ada[x.e]) return; ada[x.e] = 1; if (x.a) { const h = Math.max(1, Number(x.h) || 1); (hari[h] = hari[h] || []).push(x.e); } else batal.push(x.e); });
    const hs = Object.keys(hari).sort((a, b) => a - b); A.hari = {}; hs.forEach((h, i) => { A.hari[i + 1] = hari[h]; hari[h].forEach(id => { A.rows[id].hari = i + 1; }); }); if (!hs.length) A.hari[1] = [];
    Object.keys(A.rows).forEach(id => { if (ada[id]) return; const r = A.rows[id]; if (r.aktif) { const h = Math.max(...Object.keys(A.hari).map(Number)); A.hari[h].push(id); r.hari = h; } else batal.push(id); }); // nomor baru setelah susunan disimpan
    A.batal = batal; toast('Susunan sebelum nomor final dikembalikan ke papan. Belum tersimpan.', 'warn');
  } else {
    const H = Math.min(9, Math.max(1, Number(o.hari) || 1)), cmp = pembanding(o.pola || 'gaya');
    let G = [].concat(...Object.keys(A.hari).sort((a, b) => a - b).map(h => A.hari[h])); if (o.pulih) { G = G.concat(A.batal); A.batal = []; }
    G.sort((x, y) => cmp(A.rows[x], A.rows[y])); bagiSeimbang(G, H);
    toast(`${G.length} nomor disusun ulang (${POLA[o.pola] || ''}) ke ${Object.keys(A.hari).length} hari. Belum tersimpan.`, 'warn');
  }
  A.induk = true; A.resetJam = !!o.resetJam; if (A.resetJam) Object.keys(A.rows).forEach(id => { A.rows[id].jamManual = ''; });
  if (A.bisaFinal) A.final = true; else if (!d.kunciNo) A.renomor = !(d.cfg.otomatis !== 'OFF' && d.buka);
  KRP.closeModal(); ubah(); const b = $('#sa-board'); if (b) b.scrollIntoView({ block: 'start', behavior: 'smooth' });
};
ACT['sa-bukakunci'] = () => KRP.modal('Buka kunci nomor acara', `<form data-submit="sa-bukakunci"><p class="sm">Tahap event kembali ke <b>Start List</b> sehingga nomor acara bisa disusun ulang dan dinomori ulang. Belum ada hasil lomba, jadi tidak ada data yang hilang.</p>${alertx('warn', 'Setelah selesai menyusun, <b>terbitkan ulang Buku Acara</b> di menu Tahapan Event. Buku Acara lama tetap tampil di portal sampai yang baru terbit.', 'bi-exclamation-triangle')}${KRP.field('Ketik BUKA untuk konfirmasi', KRP.inp('konfirmasi', '', { req: 1, attr: 'autocomplete="off"' }), 1)}<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">Buka kunci</button></div></form>`);
SUBMIT['sa-bukakunci'] = async f => { const b = $('button.k-orange', f); busy(b, true); try { const r = await rp('jd.buka', form(f)); KRP.closeModal(); toast(r.message, 'warn'); bustCache('jd'); bustCache('afase'); await S.refreshAll(); go('a-jadwal'); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
INP['sa-final'] = i => { S.SA.final = i.checked; if (!i.checked) S.SA.renomor = !S.SA.d.kunciNo; gambar(); };
INP['sa-renomor'] = i => { S.SA.renomor = i.checked; gambar(); };
INP['sa-mno'] = i => { S.SA.mulaiNo = Math.max(1, Number(i.value) || 1); gambar(); };
ACT['sa-reset'] = () => { S.SA.dirty = false; go('a-jadwal'); };
ACT['sa-simpan'] = async a => {
  const A = S.SA, urutan = []; Object.keys(A.hari).sort((x, y) => x - y).forEach(h => A.hari[h].forEach(id => urutan.push({ eid: id, hari: Number(h) })));
  if (A.final) {
    const tampil = urutan.filter(u => !akanLewat(A.rows[u.eid])), lewat = urutan.length - tampil.length, ent = urutan.filter(u => akanLewat(A.rows[u.eid])).reduce((s, u) => s + (A.d.fin[u.eid] != null ? A.d.fin[u.eid] : A.rows[u.eid].n), 0);
    if (!tampil.length) return toast('Semua nomor akan dilewati. Periksa susunan atau aturan nomor final.', 'err');
    if (!(await ask(`Simpan susunan dan terapkan nomor acara final <b>#1–#${tampil.length}</b>${lewat ? `; <b>${lewat} nomor</b> ${A.d.cfg.otomatis === 'KOSONG' ? 'tanpa peserta' : 'dengan peserta kurang dari minimal'} dilewati` : ''}?${ent ? ` ${ent} entri ada di nomor yang dilewati.` : ''} Nomor acara di jadwal web, start list, dan Buku Acara ikut berubah.`, 'Simpan & terapkan'))) return;
  }
  busy(a, true);
  try { const r = await rp('jd.susun', { urutan, batal: A.batal, renomor: !A.final && A.renomor && !A.d.kunciNo, mulai: A.mulaiNo, final: A.final, induk: A.induk, resetJam: A.resetJam }); toast(r.message, r.data.pesertaBatal || r.data.entriTerdampak ? 'warn' : 'ok'); A.dirty = false; bustCache('evg'); bustCache('evl'); bustCache('jd'); await S.refreshAll(); go('a-jadwal'); }
  catch (e) { toast(e.message, 'err'); busy(a, false); }
};
/* ===== Simulasi program: susunan induk + pendaftar → acara final, jam tiap hari, nomor yang dilewati =====
   Dihitung di browser (tanpa memanggil server) dari susunan yang sedang tampil, termasuk perubahan yang belum disimpan. */
const ATURAN_L = { KOSONG: 'Lewati nomor tanpa peserta', MINIMAL: 'Lewati nomor dengan peserta kurang dari minimal', OFF: 'Tidak ada yang dilewati (nomor kosong tetap memakai nomor)' };
const ATURAN_P = { KOSONG: 'Lewati nomor kosong', MINIMAL: 'Lewati peserta < minimal', OFF: 'Tidak ada yang dilewati' };
function simAwal() { const c = S.SA.d.cfg; if (!S.SIM || S.SIM._v !== S.SA.d) S.SIM = { _v: S.SA.d, dasar: 'semua', skenario: 'kini', faktor: 1.5, aturan: c.otomatis || 'KOSONG', mulai: c.mulai || '08:00', jeda: Number(c.jeda) || 0, batas: c.batas || '' }; return S.SIM; }
function simHitung(o) {
  const A = S.SA, d = A.d, lanes = Number(d.cfg.lintasan) || 8, minp = Math.max(1, Number(d.minp) || 1), jeda = Number(o.jeda) || 0, hs = Object.keys(A.hari).sort((a, b) => a - b);
  const out = { hari: [], lewat: [], acara: 0, entriLewat: 0, peserta: 0 }; let no = 1;
  hs.forEach(h => {
    let cur = jamM(o.mulai), last = null; const L = [];
    A.hari[h].forEach(id => {
      const r = A.rows[id], n0 = o.dasar === 'sah' ? (d.sah[id] || 0) : (d.fin[id] != null ? d.fin[id] : r.n), n = o.skenario === 'faktor' ? Math.round(n0 * (Number(o.faktor) || 1)) : n0;
      const lewat = o.aturan === 'KOSONG' ? n === 0 : o.aturan === 'MINIMAL' ? n < minp : false;
      if (lewat) { out.lewat.push({ r, n, alasan: n === 0 ? 'tanpa peserta' : 'peserta ' + n + ' < ' + minp }); out.entriLewat += n; }
      else if (!n) L.push({ r, no: no++, n: 0, kosong: true });
      else {
        const heats = n === r.n && o.dasar !== 'sah' && o.skenario !== 'faktor' && r.heats ? r.heats : Math.ceil(n / lanes);
        let st = cur, bentrok = false; if (r.jamManual) { const m = jamM(r.jamManual); bentrok = m < cur; st = m; }
        const it = { r, no: no++, n, heats, mulai: jamF(st), selesai: jamF(st + heats * r.mn), bentrok }; L.push(it); cur = st + heats * r.mn + jeda; last = it; out.peserta += n;
      }
      const b = r.istSet; if (b && Number(b.menit) > 0 && last) { (last.ist = last.ist || []).push({ label: b.label, menit: Number(b.menit), mulai: jamF(cur), selesai: jamF(cur + Number(b.menit)) }); cur += Number(b.menit); }
    });
    const akhir = last ? jamM(last.selesai) : null;
    out.hari.push({ h, L, mulai: o.mulai, selesai: akhir == null ? '' : jamF(akhir), lebih: o.batas && akhir != null && akhir > jamM(o.batas) ? akhir - jamM(o.batas) : 0 });
  });
  out.acara = no - 1; return out;
}
const bisaTerapkanF = d => !d.kunciNo && !d.buka && ['PENDAFTARAN', 'VERIFIKASI', 'STARTLIST'].indexOf(d.fase) >= 0;
const durTeks = m => (m >= 60 ? Math.floor(m / 60) + ' jam ' : '') + (m % 60 ? (m % 60) + ' menit' : '');
function gambarSim() {
  const A = S.SA, d = A.d, o = simAwal(), bisaTerapkan = bisaTerapkanF(d);
  const info = d.kunciNo ? alertx('warn', 'Buku Acara sudah terbit: nomor acara final tidak diubah lagi. Simulasi tetap bisa dipakai untuk memperkirakan jam.', 'bi-lock')
    : d.buka ? alertx('info', `Pendaftaran masih dibuka, jadi ini <b>perkiraan</b>. Jumlah peserta bisa bertambah sampai pendaftaran ditutup. Nomor final diterapkan ${d.cfg.otomatis === 'OFF' ? 'manual (aturan otomatis dimatikan)' : 'otomatis saat Anda menyusun start list di Tahapan Event, memakai aturan yang disimpan di sini'}.`, 'bi-hourglass-split')
    : alertx('ok', 'Pendaftaran sudah ditutup. Bila simulasi sudah sesuai, terapkan nomor final sekarang atau biarkan diterapkan saat start list disusun.', 'bi-check2-circle');
  const opt = (v, l, cur) => `<option value="${v}"${String(cur) === String(v) ? ' selected' : ''}>${l}</option>`;
  main(`<div class="k-wrap pad">${ph('Jadwal & Susun Acara', 'Lihat program final sebelum terjadi: nomor acara, jam tiap hari, dan nomor yang dilewati. Ubah skenario untuk memperkirakan.')}${tabJd()}${info}
${A.dirty ? alertx('warn', 'Simulasi memakai susunan yang <b>belum disimpan</b> dari tab Susun acara. Simpan susunan sebelum menerapkan.', 'bi-pencil') : ''}
<form class="k-card sim-f" onsubmit="return false"><div class="k-card-b"><div class="sim-g">
<label class="k-f"><span>Dasar jumlah peserta</span><select class="k-in" data-chg="sim" name="dasar">${opt('semua', 'Semua pendaftar', o.dasar)}${opt('sah', 'Sah & lunas saja', o.dasar)}</select><small>Semua = belum ditolak, termasuk yang menunggu verifikasi. Dasar ini yang dipakai saat nomor final diterapkan.</small></label>
<label class="k-f"><span>Skenario</span><select class="k-in" data-chg="sim" name="skenario">${opt('kini', 'Pendaftar saat ini', o.skenario)}${opt('faktor', 'Perkiraan (× faktor)', o.skenario)}</select></label>
<label class="k-f"><span>Faktor perkiraan</span><input class="k-in" type="number" step="0.1" min="0.5" max="5" name="faktor" value="${E(o.faktor)}" data-chg="sim" ${o.skenario === 'faktor' ? '' : 'disabled'}><small>Mis. 1,5 bila pendaftar diperkirakan naik 50% sampai ditutup.</small></label>
<label class="k-f"><span>Aturan nomor final</span><select class="k-in" data-chg="sim" name="aturan">${Object.keys(ATURAN_P).map(k => opt(k, ATURAN_P[k] + (k === 'MINIMAL' ? ' (' + (d.minp || 1) + ')' : ''), o.aturan)).join('')}</select></label>
<label class="k-f"><span>Jam mulai tiap hari</span><input class="k-in" type="time" name="mulai" value="${E(o.mulai)}" data-chg="sim"></label>
<label class="k-f"><span>Jeda antarnomor (menit)</span><input class="k-in" type="number" min="0" max="30" name="jeda" value="${E(o.jeda)}" data-chg="sim"></label>
<label class="k-f"><span>Selesai paling lambat</span><input class="k-in" type="time" name="batas" value="${E(o.batas)}" data-chg="sim"><small>Hari yang melewati jam ini ditandai merah.</small></label>
</div></div></form>
<div id="sim-out"></div>
<div class="k-bar sticky sa-save"><span class="mut sm" style="margin-right:auto">Aturan tersimpan: <b>${E(ATURAN_L[d.cfg.otomatis] || d.cfg.otomatis)}</b>${d.cfg.batas ? ' · batas selesai ' + E(d.cfg.batas) : ''}</span>
<button class="k-btn k-outline" data-act="sim-xls"><i class="bi bi-file-earmark-excel"></i> Unduh Excel</button>
<button class="k-btn k-navy" data-act="sim-simpan"><i class="bi bi-save"></i> Simpan aturan & jam</button>
<button class="k-btn lg k-orange" data-act="sim-terapkan" ${bisaTerapkan && o.aturan !== 'OFF' ? '' : 'disabled'} title="${bisaTerapkan ? '' : d.kunciNo ? 'Buku Acara sudah terbit' : 'Aktif setelah pendaftaran ditutup'}"><i class="bi bi-check2-all"></i> Terapkan nomor final</button></div></div>`);
  gambarSimOut();
}
function gambarSimOut() {
  const el = $('#sim-out'); if (!el) return; const A = S.SA, d = A.d, o = S.SIM, R = S.SIMR = simHitung(o);
  const kpi = `<div class="sa-top"><div class="sa-kpi"><span><b>${R.acara}</b> acara final</span><span class="${R.lewat.length ? 'warn' : ''}"><b>${R.lewat.length}</b> nomor dilewati${R.entriLewat ? ` (${R.entriLewat} entri terdampak)` : ''}</span><span><b>${R.peserta}</b> start</span>${R.hari.map(x => `<span class="${x.lebih ? 'bad' : ''}">Hari ${x.h}: <b>${x.selesai ? x.mulai + '–' + x.selesai : 'kosong'}</b>${x.lebih ? ` (lewat ${durTeks(x.lebih)})` : ''}</span>`).join('')}</div></div>`;
  const hari = R.hari.map(x => card(`Hari ${x.h}${x.selesai ? ` · ${x.mulai}–${x.selesai}` : ''}${x.lebih ? ' <span class="k-pill k-err">lewat batas ' + E(o.batas) + '</span>' : ''}`, x.L.length ? `<div class="k-scroll"><table class="k-table sim-t"><thead><tr><th>Acara</th><th>Nomor</th><th>Kelompok</th><th>Peserta</th><th>Seri</th><th>Jam</th></tr></thead><tbody>${x.L.map(it => `<tr class="${it.kosong ? 'mut' : ''}"><td class="mono"><b>#${it.no}</b></td><td><b>${E(it.r.nama)}</b>${!A.renomor || d.kunciNo ? ` <small class="mut mono">(kini #${it.r.no})</small>` : ''}</td><td>${E(jn(it.r.jk))} ${G_L[it.r.g] || ''}</td><td>${it.n}</td><td>${it.kosong ? '—' : it.heats}</td><td class="mono">${it.kosong ? '<span class="sm">kosong · tidak tampil di Buku Acara</span>' : it.mulai + '–' + it.selesai}${it.bentrok ? ' <span class="k-pill k-warn">bentrok jam manual</span>' : ''}</td></tr>${(it.ist || []).map(b => `<tr class="sim-ist"><td></td><td colspan="5"><i class="bi bi-cup-hot"></i> <b>${E(b.label)}</b> — ${b.menit} menit · <span class="mono">${b.mulai}–${b.selesai}</span></td></tr>`).join('')}`).join('')}</tbody></table></div>` : '<p class="mut">Semua nomor di hari ini dilewati. Saat diterapkan, hari berikutnya maju menjadi hari ini.</p>', '', true)).join('');
  const lewat = R.lewat.length ? card(`<i class="bi bi-skip-forward"></i> Dilewati (${R.lewat.length})`, `<div class="sa-tl">${R.lewat.map(x => `<span class="sa-bt"><span class="mono">kini #${x.r.no}</span> ${E(x.r.nama)} · ${E(jn(x.r.jk))} · ${G_L[x.r.g] || ''} <small>(${x.alasan})</small></span>`).join('')}</div>${R.entriLewat ? `<p class="mut sm" style="margin-top:8px">Ada ${R.entriLewat} entri di nomor yang dilewati. Setelah diterapkan, pindahkan pesertanya lewat <b>Akun & Berkas</b> dan beri tahu pendaftarnya.</p>` : ''}`) : '';
  el.innerHTML = kpi + hari + lewat;
}
INP.sim = i => { const o = S.SIM; o[i.name] = i.type === 'number' ? Number(i.value) : i.value; if (i.name === 'skenario') { const f = $('[name=faktor]'); if (f) f.disabled = i.value !== 'faktor'; } if (i.name === 'aturan') { const b = $('[data-act=sim-terapkan]'); if (b) b.disabled = !(bisaTerapkanF(S.SA.d) && i.value !== 'OFF'); } gambarSimOut(); };
ACT['sim-simpan'] = async a => {
  const o = S.SIM; busy(a, true);
  try { await rp('jd.set', { cfg: { otomatis: o.aturan, batas: o.batas || '', mulai: o.mulai, jeda: String(o.jeda || 0) } }); toast('Aturan nomor final, jam mulai, jeda, dan batas selesai disimpan.'); bustCache('jd'); S.SIM = null; go('a-jadwal'); }
  catch (e) { toast(e.message, 'err'); busy(a, false); }
};
ACT['sim-terapkan'] = async a => {
  const A = S.SA, o = S.SIM, R = S.SIMR || simHitung(o); if (A.dirty) return toast('Simpan susunan di tab Susun acara dulu.', 'warn');
  if (o.dasar !== 'semua' || o.skenario !== 'kini') return toast('Terapkan memakai pendaftar saat ini (semua yang belum ditolak). Ubah dasar & skenario ke pilihan pertama, lalu periksa lagi.', 'warn');
  if (!(await ask(`Terapkan nomor acara final <b>#1–#${R.acara}</b>${R.lewat.length ? ` dan lewati <b>${R.lewat.length} nomor</b>` : ''}?${R.entriLewat ? ` ${R.entriLewat} entri ada di nomor yang dilewati.` : ''} Nomor acara di start list, jadwal web, dan Buku Acara ikut berubah.`, 'Terapkan'))) return;
  busy(a, true);
  try { const r = await rp('jd.final', { aturan: o.aturan }); toast(r.message, r.data.entriTerdampak ? 'warn' : 'ok'); bustCache('jd'); bustCache('evl'); bustCache('evg'); await S.refreshAll(); S.SIM = null; go('a-jadwal'); }
  catch (e) { toast(e.message, 'err'); busy(a, false); }
};
ACT['sim-xls'] = async a => {
  const R = S.SIMR || simHitung(S.SIM), o = S.SIM, rows = []; busy(a, true);
  R.hari.forEach(x => x.L.forEach(it => { rows.push({ Hari: x.h, Acara: it.no, Nomor: it.r.nama, Kelompok: jn(it.r.jk), Gender: G_L[it.r.g] || it.r.g, Peserta: it.n, Seri: it.kosong ? '' : it.heats, Mulai: it.kosong ? '' : it.mulai, Selesai: it.kosong ? '' : it.selesai, Keterangan: it.kosong ? 'Kosong' : it.bentrok ? 'Bentrok jam manual' : '' }); (it.ist || []).forEach(b => rows.push({ Hari: x.h, Acara: '', Nomor: b.label, Kelompok: '', Gender: '', Peserta: '', Seri: '', Mulai: b.mulai, Selesai: b.selesai, Keterangan: b.menit + ' menit' })); }));
  const ringkas = [{ Butir: 'Dasar peserta', Nilai: o.dasar === 'sah' ? 'Sah & lunas' : 'Semua pendaftar (belum ditolak)' }, { Butir: 'Skenario', Nilai: o.skenario === 'faktor' ? 'Pendaftar × ' + o.faktor : 'Pendaftar saat ini' }, { Butir: 'Aturan', Nilai: ATURAN_L[o.aturan] }, { Butir: 'Acara final', Nilai: R.acara }, { Butir: 'Nomor dilewati', Nilai: R.lewat.length }].concat(R.hari.map(x => ({ Butir: 'Hari ' + x.h, Nilai: x.selesai ? x.mulai + '–' + x.selesai + (x.lebih ? ' (lewat batas ' + o.batas + ')' : '') : 'kosong' })));
  try { await xlsx([{ name: 'Program', rows }, { name: 'Dilewati', rows: R.lewat.map(x => ({ 'Nomor kini': x.r.no, Nomor: x.r.nama, Kelompok: jn(x.r.jk), Gender: G_L[x.r.g] || x.r.g, Peserta: x.n, Alasan: x.alasan })) }, { name: 'Ringkasan', rows: ringkas }], 'Simulasi_Program_' + new Date().toISOString().slice(0, 10) + '.xlsx'); toast('Excel simulasi diunduh.'); }
  catch (e) { toast(e.message, 'err'); }
  busy(a, false);
};
function pasangDnD() {
  const bd = $('#sa-board'); if (!bd) return; let drag = null;
  $$('.sa-it', bd).forEach(li => {
    li.addEventListener('dragstart', e => { drag = li.dataset.id; li.classList.add('drag'); try { e.dataTransfer.setData('text/plain', drag); e.dataTransfer.effectAllowed = 'move'; } catch (x) { } });
    li.addEventListener('dragend', () => { li.classList.remove('drag'); $$('.sa-over', bd).forEach(x => x.classList.remove('sa-over')); });
  });
  $$('.sa-list', bd).forEach(ol => {
    ol.addEventListener('dragover', e => { e.preventDefault(); $$('.sa-over', bd).forEach(x => x.classList.remove('sa-over')); const it = e.target.closest('.sa-it'); (it || ol).classList.add('sa-over'); });
    ol.addEventListener('drop', e => {
      e.preventDefault(); const id = drag || e.dataTransfer.getData('text/plain'); if (!id) return; const it = e.target.closest('.sa-it'), h = ol.dataset.hari;
      let idx = null; if (it && it.dataset.id !== id) { const L = S.SA.hari[h], j = L.indexOf(it.dataset.id), r = it.getBoundingClientRect(); idx = j + (e.clientY > r.top + r.height / 2 ? 1 : 0); const p = cari(id); if (p && p[0] === h && p[1] < idx) idx--; } else if (it) return;
      pindah(id, h, idx); S.SA.sel = id; ubah();
    });
  });
}
window.addEventListener('beforeunload', e => { if (S.route === 'a-jadwal' && S.SA && S.SA.dirty) { e.preventDefault(); e.returnValue = ''; } });
})();

(function () {
'use strict';
const { $, $$, E, S, V, ACT, SUBMIT, INP, G_L, FASE_L, ROLE_L, pill, rupiah, fdt, jn, kls, evTitle, thumb, logoUrl, rp, swr, bustCache, toast, modal, closeModal, ask, busy, ph, card, empty, kpi, alertx, field, inp, sel, form, dz, readFile, dlB64, viewFile, loadScript, xlsx, go, home, LS } = KRP;
const main = h => { $('#main').innerHTML = h; };
const isSA = () => S.me && S.me.role === 'SUPER_ADMIN';
const refreshAll = () => S.refreshAll();

/* ===== Input hasil (Admin Input Data) ===== */
const rekapHost = '<div id="rk-host"></div>';
function evSelect(list, cur, route) { return `<div class="picker"><select class="k-in" data-chg="hsel-${route}">${list.map(e => `<option value="${e.id}"${e.id === cur ? ' selected' : ''}>#${e.no} · ${E(evTitle(e))} — ${E(KRP.ST[e.st] ? KRP.ST[e.st][1] : e.st)}</option>`).join('')}</select></div>`; }
INP['hsel-a-hasil'] = i => { S.hcur = i.value; go('a-hasil', i.value); }; INP['hsel-a-wasit'] = i => { S.wcur = i.value; go('a-wasit', i.value); };
V['a-hasil'] = function (id) {
  const fase = S.B.cfg.fase, terkunci = !isSA() && fase !== 'PELAKSANAAN';
  swr('hev', 'h.events', {}, L => {
    if (!L.length) return main(`<div class="k-wrap pad">${ph('Input Hasil Lomba', '')}${alertx('info', 'Belum ada start list. Start list dibuat setelah pendaftaran ditutup.')}${rekapHost}</div>`), S.rekapBox('#rk-host');
    S.hevL = L; id = id || S.hcur || (L.filter(e => e.st !== 'SAH')[0] || L[0]).id; S.hcur = id;
    main(`<div class="k-wrap pad">${ph('Input Hasil Lomba', `Fase: <b>${E(FASE_L[fase] || fase)}</b>`, `<button class="k-btn k-outline" data-act="bk-xls"><i class="bi bi-file-earmark-excel"></i> Excel buku acara</button>`)}${terkunci ? alertx('warn', 'Input hasil dibuka setelah Super Admin memulai tahap <b>Pelaksanaan</b>. Anda tetap dapat melihat start list.', 'bi-lock') : ''}${evSelect(L, id, 'a-hasil')}<div id="h-body">${'<div class="k-skel"></div>'}</div>${rekapHost}</div>`);
    S.rekapBox('#rk-host'); loadHasil(id, terkunci);
  }, 3000);
};
/* Cache data nomor (h.load) di memori: pindah nomor tampil seketika, lalu diperiksa ke server.
   Setelah satu nomor terbuka, 2 nomor berikutnya diambil di latar (1 eksekusi batch). Aksi tulis mengosongkan cache ini. */
S.hl = S.hl || {};
const hlCache = (id, umur) => { const c = S.hl[id]; return c && Date.now() - c.t < (umur || 300000) ? c.d : null; };
const hlAmbil = id => rp('h.load', { id }).then(r => { S.hl[id] = { t: Date.now(), d: r.data }; return r.data; });
function hlPrefetch(id, mode) {
  const L = S.hevL || [], i = L.findIndex(e => e.id === id); if (i < 0) return;
  L.slice(i + 1).filter(e => mode === 'h' ? e.st !== 'SAH' : e.st === 'SUBMITTED').slice(0, 2).forEach(e => { if (!hlCache(e.id, 60000)) hlAmbil(e.id).catch(() => { }); });
}
// Prefetch menu Input Hasil / Wasit: daftar nomor, lalu data nomor yang akan dibuka pertama kali
const preNomor = mode => () => [['hev', 'h.events', {}, 3000, L => { S.hevL = L; const cur = mode === 'h' ? S.hcur : S.wcur, id = cur || ((mode === 'h' ? L.filter(e => e.st !== 'SAH')[0] : L.filter(e => e.st === 'SUBMITTED')[0]) || L[0] || {}).id; if (id && !hlCache(id, 60000)) hlAmbil(id).catch(() => { }); }]];
KRP.PRE['a-hasil'] = preNomor('h'); KRP.PRE['a-wasit'] = preNomor('w');
function draftKey(id) { return 'krp_draft_' + (S.me.id) + '_' + id; }
function renderHasil(id, terkunci, d) {
  {
    const el = $('#h-body'); if (!el || S.hcur !== id) return; S.hd = d; S.hDirty = false;
    const lock = terkunci || d.st === 'SAH' || d.st === 'SUBMITTED'; S.hver = d.ver; S.hverId = id; hPantau(id, 'h'); let draft = {}; try { draft = JSON.parse(LS.g(draftKey(id)) || '{}'); } catch (e) { }
    el.innerHTML = `<div class="k-evh"><div><span class="tag">EVENT ${d.event.no}${d.event.jam ? ' · ' + E(d.event.jam) + ' WIB' : ''}</span><h2>${E(evTitle(d.event))}</h2><p>${d.heats.length} seri · status: ${pill(d.st)}</p></div>${d.rec ? `<div class="rec"><small>Rekor</small><b class="mono">${E(d.rec.waktu)}</b><small>${E(d.rec.nama)}</small></div>` : ''}</div>
<div id="h-konflik"></div>${LS.g(draftKey(id) + '_bak') ? `<div class="k-alert warn"><i class="bi bi-life-preserver"></i><div>Isian Anda yang belum tersimpan (karena bentrok dengan perubahan orang lain) masih tersimpan di perangkat ini. <button type="button" class="k-btn sm k-outline" data-act="h-pulih">Pulihkan isian saya ke layar</button> <button type="button" class="k-btn sm k-ghostw" data-act="h-buangbak">Buang</button></div></div>` : ''}${d.ubah && d.ubah.oleh ? `<p class="mut sm">Terakhir diubah oleh <b>${E(d.ubah.oleh)}</b> · ${fdt(d.ubah.at)}</p>` : ''}${d.st === 'SAH' ? alertx('ok', `Disahkan oleh <b>${E(d.so.oleh)}</b> · ${fdt(d.so.at)}. Hasil terkunci.`, 'bi-patch-check') : d.st === 'SUBMITTED' ? alertx('info', 'Hasil sudah dikirim dan menunggu pengesahan wasit.') : ''}
${lock ? '' : '<p class="mut sm h-kb"><i class="bi bi-keyboard"></i> <b>Enter</b> / <b>↓</b> ke atlet berikutnya · <b>↑</b> atlet sebelumnya · <b>→ ←</b> pindah Status / Waktu / Keterangan. Status bisa diganti dengan mengetik huruf O (OK) atau D (DQ/DNS/DNF).</p>'}<form data-submit="hsimpan" onsubmit="return false">${d.heats.map(h => card(`Seri ${h.n}`, `<div class="k-scroll"><table class="k-table"><thead><tr><th>Lane</th><th>Atlet</th><th>Seed</th><th>Status</th><th>Waktu (mm:ss.cc)</th><th>Ket / alasan DQ</th><th>Rank</th></tr></thead><tbody>${h.rows.map(r => { const x = draft[r.id] || {}, w = x.w !== undefined ? x.w : r.waktu, st = x.st || r.st, dq = x.dq !== undefined ? x.dq : r.dq; return `<tr data-aid="${r.id}"><td class="mono"><b>${r.lane}</b></td><td><b>${E(r.nama)}</b><br><small class="mut">${E(r.sk || r.kl)}</small></td><td class="mono">${E(r.seed)}</td><td>${sel('st', ['OK', 'DQ', 'DNS', 'DNF'], st, `data-chg="h-dirty" ${lock ? 'disabled' : ''}`)}</td><td><input class="k-in tm sm mono" name="w" data-in="h-dirty" value="${E(w)}" placeholder="00:00.00" ${lock || st !== 'OK' ? 'disabled' : ''} inputmode="decimal" style="width:120px"></td><td><input class="k-in sm" name="dq" data-in="h-dirty" value="${E(dq)}" placeholder="${st === 'DQ' ? 'Kode DQ wajib' : ''}" ${lock || st === 'OK' || st === 'DNS' ? 'disabled' : ''}></td><td>${r.rank ? `<span class="md ${r.rank === 1 ? 'g' : r.rank === 2 ? 's' : r.rank === 3 ? 'b' : ''}">${r.rank}</span>` : '–'}${r.baru ? ' <span class="k-pill k-warn">Rekor</span>' : ''}</td></tr>`; }).join('')}</tbody></table></div>`, '', true)).join('')}
<div class="k-bar sticky">${d.st === 'SAH' || d.st === 'SUBMITTED' ? `<button type="button" class="k-btn k-ghostw" data-act="h-tarik"><i class="bi bi-arrow-counterclockwise"></i> Tarik untuk perbaikan</button>` : `<span class="mut sm" id="h-saved" style="margin-right:auto"></span><button type="button" class="k-btn k-outline" data-act="h-save" data-k="0" ${lock ? 'disabled' : ''}>Simpan draf</button><button type="button" class="k-btn lg k-orange" data-act="h-save" data-k="1" ${lock ? 'disabled' : ''}><i class="bi bi-send"></i> Kirim ke Wasit</button>`}</div></form>`;
  }
}
async function loadHasil(id, terkunci) {
  const c = hlCache(id); if (c) renderHasil(id, terkunci, c);
  try {
    const d = await hlAmbil(id); if (S.hcur !== id || !$('#h-body')) return;
    if (c && c.ver === d.ver) return hlPrefetch(id, 'h');
    if (c && S.hDirty) { const box = $('#h-konflik'); if (box) box.innerHTML = alertx('warn', 'Data nomor ini sudah diperbarui di server sejak terakhir dibuka. Isian di layar belum tentu yang terbaru. <button type="button" class="k-btn sm k-outline" data-act="h-muat">Muat data terbaru</button>', 'bi-arrow-repeat'); }
    else renderHasil(id, terkunci, d);
    hlPrefetch(id, 'h');
  } catch (e) { if (!c) { const el = $('#h-body'); if (el) el.innerHTML = alertx('err', E(e.message)); } else toast(e.message, 'err'); }
}
function hRows() { return $$('#h-body tr[data-aid]').map(tr => ({ id: tr.dataset.aid, st: $('[name=st]', tr) ? $('select', tr).value : 'OK', waktu: $('[name=w]', tr).value.trim(), dq: $('[name=dq]', tr).value.trim(), cat: '' })); }
INP['h-dirty'] = i => {
  S.hDirty = true;
  const tr = i.closest('tr'); if (i.tagName === 'SELECT') { const st = i.value; $('[name=w]', tr).disabled = st !== 'OK'; $('[name=dq]', tr).disabled = st === 'OK' || st === 'DNS'; if (st !== 'OK') $('[name=w]', tr).value = ''; }
  clearTimeout(S._hd); S._hd = setTimeout(() => { const o = {}; hRows().forEach(r => o[r.id] = { w: r.waktu, st: r.st, dq: r.dq }); LS.s(draftKey(S.hcur), JSON.stringify(o)); const s = $('#h-saved'); if (s) s.textContent = 'Draf otomatis tersimpan di perangkat ' + new Date().toTimeString().slice(0, 5); }, 400);
};
/* Navigasi keyboard di tabel input hasil: Enter / ↓ = atlet berikutnya (kolom sama), ↑ = atlet sebelumnya,
   → / ← = kolom berikut/sebelumnya (status → waktu → keterangan). Isian yang nonaktif dilewati. Berlaku lintas seri. */
const H_KOL = ['st', 'w', 'dq'];
function hSel(tr, k) { return tr && $('[name=' + k + ']', tr); }
function hFokus(el) { if (!el) return false; el.focus(); if (el.select && el.tagName === 'INPUT') el.select(); const r = el.getBoundingClientRect(); if (r.top < 90 || r.bottom > innerHeight - 90) el.scrollIntoView({ block: 'center', behavior: 'smooth' }); return true; }
function hPindah(el, dr, dc) {
  const rows = $$('#h-body tr[data-aid]'), tr = el.closest('tr'); let ri = rows.indexOf(tr), ci = H_KOL.indexOf(el.name); if (ri < 0 || ci < 0) return false;
  if (dc) { for (let c = ci + dc; c >= 0 && c < H_KOL.length; c += dc) { const t = hSel(tr, H_KOL[c]); if (t && !t.disabled) return hFokus(t); } return false; }
  for (let r = ri + dr; r >= 0 && r < rows.length; r += dr) { const t = hSel(rows[r], H_KOL[ci]); if (t && !t.disabled) return hFokus(t); for (const k of ['w', 'dq', 'st']) { const u = hSel(rows[r], k); if (u && !u.disabled) return hFokus(u); } }
  return false;
}
document.addEventListener('keydown', e => {
  const el = e.target; if (!el || !el.closest || !el.closest('#h-body tr[data-aid]') || e.altKey || e.ctrlKey || e.metaKey || e.isComposing) return;
  const k = e.key, inp = el.tagName === 'INPUT', v = inp ? el.value : '', a = inp ? el.selectionStart : 0, b = inp ? el.selectionEnd : 0;
  let ok = false;
  if (k === 'Enter' || k === 'ArrowDown') ok = hPindah(el, e.shiftKey && k === 'Enter' ? -1 : 1, 0) || k === 'Enter';
  else if (k === 'ArrowUp') ok = hPindah(el, -1, 0);
  else if (k === 'ArrowRight' && (!inp || a === v.length && b === v.length || (a === 0 && b === v.length))) ok = hPindah(el, 0, 1);
  else if (k === 'ArrowLeft' && (!inp || a === 0 && b === 0 || (a === 0 && b === v.length))) ok = hPindah(el, 0, -1);
  if (ok) e.preventDefault();
}, true);
ACT['h-save'] = async a => {
  const kirim = a.dataset.k === '1'; if (kirim && !(await ask('Kirim hasil ke Wasit untuk disahkan? Setelah dikirim, input terkunci sampai wasit mengesahkan atau Anda menariknya.', 'Kirim'))) return;
  busy(a, true); try { const r = await rp('h.simpan', { id: S.hcur, kirim, rows: hRows(), ver: S.hver }); if (r.data && r.data.ver) S.hver = r.data.ver; toast(r.message); LS.d(draftKey(S.hcur)); bustCache('hev'); loadHasil(S.hcur, false); } catch (e) { busy(a, false); if (e.code === 'KONFLIK') return hKonflik(e, kirim); toast(e.message, 'err'); }
};
ACT['h-tarik'] = () => modal('Tarik hasil untuk perbaikan', `<form data-submit="htarik">${field('Alasan penarikan', '<textarea class="k-in" name="alasan" rows="3" required minlength="5"></textarea>', 1, 'Pengesahan wasit akan dibatalkan dan tercatat di audit.')}<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">Tarik</button></div></form>`);
SUBMIT.htarik = async f => { const b = $('button.k-orange', f); busy(b, true); try { const r = await rp('h.tarik', { id: S.route === 'a-wasit' ? S.wcur : S.hcur, alasan: form(f).alasan, ver: S.route === 'a-wasit' ? S.wver : S.hver }); toast(r.message); closeModal(); bustCache('hev'); go(S.route, S.param); } catch (e) { toast(e.message, 'err'); busy(b, false); } };

/* ===== Pengaman kerja bersamaan: pantau versi nomor yang sedang dibuka ===== */
// Tiap 20 dtk (hanya saat tab terlihat) cek apakah nomor ini diubah orang lain. Admin diberi peringatan; wasit dimuat ulang
// otomatis bila hasil berubah sebelum ia menandatangani, sehingga yang disahkan selalu sama dengan yang dilihat.
function hPantau(id, mode) {
  clearInterval(S._hPan); S._hPan = setInterval(async () => {
    const rt = mode === 'h' ? 'a-hasil' : 'a-wasit', cur = mode === 'h' ? S.hcur : S.wcur; if (S.route !== rt || cur !== id) return clearInterval(S._hPan); if (document.hidden) return;
    let v; try { v = (await rp('h.ver', { id })).data; } catch (e) { return; }
    if (mode === 'h') { if (v.ver === S.hver) return; const box = $('#h-konflik'); if (box) box.innerHTML = alertx('warn', `Nomor ini baru saja diubah${v.ubah && v.ubah.oleh ? ' oleh <b>' + E(v.ubah.oleh) + '</b> pukul ' + E((/(\d{1,2}:\d{2})(?::\d{2})?\s*$/.exec(String(v.ubah.at)) || [])[1] || '') : ''} (status: ${E(v.st)}). Isian di layar Anda belum tentu yang terbaru. <button type="button" class="k-btn sm k-outline" data-act="h-muat">Muat data terbaru</button>`, 'bi-people'); }
    else if (v.ver !== S.wver) { toast('Hasil nomor ini berubah. Menampilkan data terbaru — periksa ulang sebelum tanda tangan.', 'warn'); delete S.hl[id]; bustCache('hev'); loadWasit(id); }
  }, 20000);
}
function hKonflik(e, kirim) {
  const i = e.info || {}, bisaTimpa = i.st === 'DRAFT' || i.st === 'NONE';
  modal('Data bentrok dengan pengguna lain', `<p>${E(e.message)}</p><p class="mut sm">Isian Anda <b>tidak hilang</b>: tetap tersimpan di perangkat ini dan bisa dipulihkan.</p><p class="mut sm"><b>Muat data terbaru</b>: tampilkan data orang lain; isian Anda disimpan sebagai cadangan.${bisaTimpa ? ' <b>Timpa dengan isian saya</b>: isian Anda menggantikan data tersebut.' : ''}</p><div class="k-bar" style="flex-wrap:wrap"><button type="button" class="k-btn k-navy" data-act="h-muat">Muat data terbaru</button>${bisaTimpa ? `<button type="button" class="k-btn k-orange" data-act="h-timpa" data-k="${kirim ? 1 : 0}">Timpa dengan isian saya</button>` : ''}</div>`);
}
ACT['h-muat'] = () => { const k = draftKey(S.hcur), o = {}; hRows().forEach(r => o[r.id] = { w: r.waktu, st: r.st, dq: r.dq }); LS.s(k + '_bak', JSON.stringify(o)); LS.d(k); closeModal(); delete S.hl[S.hcur]; bustCache('hev'); loadHasil(S.hcur, false); };
ACT['h-timpa'] = async a => { busy(a, true); try { const v = (await rp('h.ver', { id: S.hcur })).data; S.hver = v.ver; closeModal(); const b = $(`[data-act=h-save][data-k="${a.dataset.k}"]`); if (b) { if (a.dataset.k === '1') { const r = await rp('h.simpan', { id: S.hcur, kirim: true, rows: hRows(), ver: S.hver }); toast(r.message); LS.d(draftKey(S.hcur)); bustCache('hev'); loadHasil(S.hcur, false); } else ACT['h-save'](b); } } catch (e) { busy(a, false); if (e.code === 'KONFLIK') return hKonflik(e, a.dataset.k === '1'); toast(e.message, 'err'); } };
ACT['h-pulih'] = () => { const k = draftKey(S.hcur), b = LS.g(k + '_bak'); if (!b) return; LS.s(k, b); LS.d(k + '_bak'); loadHasil(S.hcur, false); toast('Isian Anda dipulihkan ke layar. Periksa, lalu Simpan draf.'); };
ACT['h-buangbak'] = () => { LS.d(draftKey(S.hcur) + '_bak'); loadHasil(S.hcur, false); };

/* ===== Excel buku acara (start list) — Admin Input Data & Super Admin ===== */
ACT['bk-xls'] = async a => {
  busy(a, true);
  try {
    const d = (await rp('buku.xls', {})).data; if (!d.rows.length) { busy(a, false); return toast('Belum ada start list. Start list dibuat setelah pendaftaran ditutup.', 'warn'); }
    const baris = L => L.map(r => ({ 'Hari': r.hari, 'Estimasi Jam': r.jamHeat || r.jam, 'No. Acara': r.no, 'Nomor Lomba': r.nomor, 'Kelompok': r.kel, 'Gender': r.g, 'Heat': r.heat, 'Lane': r.lane, 'BIB': r.bib, 'Nama Atlet': r.nama, 'Kelas': r.kls, 'Asal Sekolah': r.asal, 'Asal Wilayah': r.kota, 'Entry': r.entry, 'Waktu (mm:ss.cc)': '', 'Status (OK/DQ/DNS/DNF)': '', 'Keterangan': '' }));
    const hs = [...new Set(d.rows.map(r => r.hari))].sort((x, y) => x - y), nomor = []; const seen = {};
    d.rows.forEach(r => { const k = r.no + '|' + r.nomor + '|' + r.kel + '|' + r.g; if (seen[k]) { seen[k]['Jumlah Atlet']++; seen[k]['Jumlah Heat'] = Math.max(seen[k]['Jumlah Heat'], r.heat); return; } seen[k] = { 'Hari': r.hari, 'Jam': r.jam, 'No. Acara': r.no, 'Nomor Lomba': r.nomor, 'Kelompok': r.kel, 'Gender': r.g, 'Jumlah Heat': r.heat, 'Jumlah Atlet': 1 }; nomor.push(seen[k]); });
    const sh = [{ name: 'Semua', rows: baris(d.rows) }].concat(hs.length > 1 ? hs.map(h => ({ name: 'Hari ' + h, rows: baris(d.rows.filter(r => r.hari === h)) })) : []).concat([{ name: 'Daftar Nomor', rows: nomor }]);
    await xlsx(sh, ('Buku-Acara-' + (d.musim || '') + '.xlsx').replace(/[^\w.-]+/g, '-'));
    toast(`Excel buku acara diunduh: ${d.rows.length} baris, ${nomor.length} nomor.`);
  } catch (e) { toast(e.message, 'err'); }
  busy(a, false);
};

/* ===== Pengesahan wasit (tanda tangan di tablet) ===== */
V['a-wasit'] = function (id) {
  swr('hev', 'h.events', {}, L => {
    if (!L.length) return main(`<div class="k-wrap pad">${ph('Pengesahan Wasit', '')}${alertx('info', 'Belum ada nomor dengan start list.')}${rekapHost}</div>`), S.rekapBox('#rk-host');
    S.hevL = L; id = id || S.wcur || (L.filter(e => e.st === 'SUBMITTED')[0] || L[0]).id; S.wcur = id; const n = L.filter(e => e.st === 'SUBMITTED').length;
    main(`<div class="k-wrap pad">${ph('Pengesahan Wasit', `${n} nomor menunggu pengesahan · Tanda tangan langsung di layar tablet/iPad`)}${evSelect(L, id, 'a-wasit')}<div id="w-body"><div class="k-skel"></div></div>${rekapHost}</div>`); S.rekapBox('#rk-host'); loadWasit(id);
  }, 3000);
};
function renderWasit(id, d) {
  {
    const el = $('#w-body'); if (!el || S.wcur !== id) return; S.hd = d; S.wver = d.ver; hPantau(id, 'w'); const rows = [];
    d.heats.forEach(h => h.rows.forEach(r => rows.push(Object.assign({ heat: h.n }, r)))); rows.sort((a, b) => (a.rank || 999) - (b.rank || 999) || a.heat - b.heat || a.lane - b.lane);
    el.innerHTML = `<div class="k-evh"><div><span class="tag">EVENT ${d.event.no}</span><h2>${E(evTitle(d.event))}</h2><p>Status: ${pill(d.st)}</p></div>${d.rec ? `<div class="rec"><small>Rekor</small><b class="mono">${E(d.rec.waktu)}</b></div>` : ''}</div>
${card('Hasil untuk diperiksa', `<div class="k-scroll"><table class="k-table"><thead><tr><th>Rank</th><th>Seri/Lane</th><th>Atlet</th><th>Asal</th><th>Waktu</th><th>Ket</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.rank && r.st === 'OK' ? `<span class="md ${r.rank === 1 ? 'g' : r.rank === 2 ? 's' : r.rank === 3 ? 'b' : ''}">${r.rank}</span>` : '–'}</td><td class="mono">${r.heat}/${r.lane}</td><td><b>${E(r.nama)}</b></td><td>${E(r.sk || r.kl)}</td><td class="mono"><b>${E(r.st === 'OK' ? (r.waktu || '—') : r.st)}</b></td><td>${r.baru ? '<span class="k-pill k-warn">Rekor baru</span>' : ''}${E(r.dq)}</td></tr>`).join('')}</tbody></table></div>`, '', true)}
${d.st === 'SUBMITTED' ? `<form class="k-card" data-submit="wsah"><div class="k-card-h"><h3><i class="bi bi-pen"></i> Tanda tangan wasit</h3><button type="button" class="k-btn sm k-ghostw" data-act="ttdclear">Hapus</button></div><div class="k-card-b"><canvas class="k-pad-c" id="ttd"></canvas><p class="mut sm" style="margin-top:6px">Tanda tangan dengan jari atau stylus pada kotak di atas.</p>${field('Catatan (opsional)', inp('catatan', '', { max: 200 }))}<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="h-tarik">Kembalikan ke lapangan</button><button class="k-btn lg k-orange"><i class="bi bi-patch-check"></i> Sahkan & Kunci</button></div></div></form>` : d.st === 'SAH' ? `<div class="k-alert ok"><i class="bi bi-patch-check-fill"></i><div>Disahkan <b>${E(d.so.oleh)}</b> · ${fdt(d.so.at)}<br><small class="mono">${E(String(d.so.hash).slice(0, 24))}…</small> ${d.so.ttd ? `<button class="k-btn sm k-outline" data-act="akun-file" data-id="${E(d.so.ttd)}">Lihat tanda tangan</button>` : ''} <button class="k-btn sm k-ghostw" data-act="h-tarik">Tarik hasil</button></div></div>` : alertx('info', 'Hasil belum dikirim oleh Admin Input Data.')}`;
    if (d.st === 'SUBMITTED') initPad();
  }
}
async function loadWasit(id) {
  const c = hlCache(id); if (c) renderWasit(id, c);
  try {
    const d = await hlAmbil(id); if (S.wcur !== id || !$('#w-body')) return;
    if (!c || c.ver !== d.ver) { if (c && S.padDirty) toast('Hasil nomor ini berubah. Menampilkan data terbaru — periksa ulang sebelum tanda tangan.', 'warn'); renderWasit(id, d); }
    hlPrefetch(id, 'w');
  } catch (e) { if (!c) { const el = $('#w-body'); if (el) el.innerHTML = alertx('err', E(e.message)); } else toast(e.message, 'err'); }
}
function initPad() {
  const c = $('#ttd'); if (!c) return; const r = c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1; c.width = Math.max(300, r.width) * dpr; c.height = 200 * dpr;
  const x = c.getContext('2d'); x.scale(dpr, dpr); x.lineWidth = 2.4; x.lineCap = 'round'; x.lineJoin = 'round'; x.strokeStyle = '#0B1F33'; let dr = false, lx = 0, ly = 0; S.padDirty = false;
  const pt = e => { const b = c.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  c.addEventListener('pointerdown', e => { e.preventDefault(); dr = true; [lx, ly] = pt(e); c.setPointerCapture(e.pointerId); x.beginPath(); x.moveTo(lx, ly); x.lineTo(lx + .1, ly + .1); x.stroke(); S.padDirty = true; });
  c.addEventListener('pointermove', e => { if (!dr) return; e.preventDefault(); const [px, py] = pt(e); x.beginPath(); x.moveTo(lx, ly); x.lineTo(px, py); x.stroke(); lx = px; ly = py; });
  const end = () => { dr = false; }; c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end); c.addEventListener('pointerleave', end);
}
ACT.ttdclear = () => { const c = $('#ttd'); if (c) { c.getContext('2d').clearRect(0, 0, c.width, c.height); S.padDirty = false; } };
SUBMIT.wsah = async f => {
  const c = $('#ttd'); if (!S.padDirty) return toast('Tanda tangan wasit wajib diisi sebelum mengesahkan.', 'err');
  if (!(await ask('Sahkan hasil nomor ini? Hasil akan dikunci dan masuk klasemen & rekor.', 'Sahkan'))) return;
  const b = $('button.k-orange', f); busy(b, true);
  try { const u = c.toDataURL('image/png'); const r = await rp('h.sahkan', { id: S.wcur, catatan: form(f).catatan, ttd: { b64: u.split(',')[1], mime: 'image/png' }, ver: S.wver }); toast(r.message); bustCache(); go('a-wasit', S.wcur); } catch (e) { busy(b, false); if (e.code === 'KONFLIK') { await ask(E(e.message) + '<br><br>Hasil terbaru akan ditampilkan. Periksa lagi lalu tanda tangani ulang.', 'Muat hasil terbaru'); bustCache('hev'); return loadWasit(S.wcur); } toast(e.message, 'err'); }
};
ACT['akun-file'] = ACT['akun-file'] || (a => viewFile(a.dataset.id, 'Berkas'));

/* ===== Impor hasil kejuaraan yang sudah terlaksana ===== */
const IMP_COLS = ['kolam', 'musim', 'event', 'tanggal', 'lokasi', 'no_acara', 'label', 'nama', 'nomor', 'gender', 'kelompok', 'kelas', 'rank', 'sekolah', 'klub', 'kota', 'entry', 'waktu', 'status', 'catatan'];
V['a-impor'] = function () {
  swr('implist', 'imp.list', {}, d => {
    S.imp = S.imp || { rows: [], cek: null }; if ($('#imp-body')) { drawImpList(d); return; }
    main(`<div class="k-wrap pad">${ph('Impor Hasil Kejuaraan Lama', 'Masukkan hasil event yang sudah terlaksana (satu atau banyak event sekaligus) agar menjadi arsip, klasemen, dan rekor.')}
<div class="g-main"><div>${card('1. Siapkan data', `<div class="imp-k0"><b>Jenis kolam data ini</b><div class="k-seg">${[['LCM', 'Long course · kolam 50 m'], ['SCM', 'Short course · kolam 25 m']].map(x => `<label class="imp-kr"><input type="radio" name="imp-k0" value="${x[0]}" data-chg="imp-k0"${S.impKol === x[0] ? ' checked' : ''}> ${x[1]}</label>`).join('')}</div><small class="mut">Pilih sebelum mengunggah. Hasil 25 m dan 50 m diimpor terpisah (dua kali unggah) walaupun nama arsipnya sama. Bila berkas punya kolom <b>kolam</b> (isi 25 atau 50), isi kolom itu yang dipakai.</small></div><p class="mut sm">Kolom wajib: <b>nama, nomor, gender, kelompok/kelas, waktu, status</b>. Kolom opsional: <b>kolam</b> (50 / 25; bila kosong memakai pilihan di atas), <b>musim</b> (nama arsip), <b>event, tanggal</b> (YYYY-MM-DD), <b>lokasi, no_acara, label, kelas, rank</b> (peringkat resmi), <b>sekolah, klub, kota, entry, catatan</b>. Dengan kolom <b>musim</b>, satu berkas dapat berisi banyak event. Contoh nomor “50m Gaya Bebas”, kelompok “SD 3-4”/“SMP Kelas 7-9”, waktu “00:32.15”, status OK/DQ/DNS/NS/DNF.</p><div class="k-qa"><button class="k-btn k-outline" data-act="imp-tpl"><i class="bi bi-download"></i> Unduh templat Excel</button><label class="k-btn k-navy"><i class="bi bi-file-earmark-excel"></i> Unggah Excel/CSV<input type="file" hidden accept=".xlsx,.xls,.csv" data-chg="imp-file"></label></div><p class="mut sm">Atau tempel (copy-paste) dari Excel — baris pertama berisi judul kolom:</p><textarea class="k-in mono" id="imp-paste" rows="5" placeholder="nama\tnomor\tgender\tkelompok\t…"></textarea><div class="k-bar"><button class="k-btn k-navy" data-act="imp-parse">Periksa data</button></div>`)}
<div id="imp-body"></div></div><div id="imp-list"></div></div></div>`);
    drawImpList(d); drawImp();
  }, 3000);
};
function drawImpList(d) {
  const el = $('#imp-list'); if (!el) return; S.impList = d; const belum = d.filter(m => !m.final);
  el.innerHTML = card('Arsip tersimpan', d.length ? `<ul class="k-list">${d.map(m => `<li><span><b>${E(m.event || ('Musim ' + m.musim))}</b><br><small class="mut">${m.tanggal ? E(fdt(m.tanggal)) + ' · ' : ''}arsip “${E(m.musim)}” · ${m.rows} baris · ${m.atlet} atlet · ${m.nomor} nomor</small><br><span class="imp-kols">${Object.keys(m.kol || {}).sort().map(k => `<span class="imp-kc ${k}"><b>${k === 'SCM' ? 'Kolam 25 m' : 'Kolam 50 m'}</b> · ${m.kol[k]} baris <button class="k-btn sm k-ghostw" data-act="imp-kolam" data-m="${E(m.musim)}" data-k="${k}" title="Pindahkan baris ini ke kolam lain">jadi ${k === 'SCM' ? '50 m' : '25 m'}</button><button class="k-btn sm k-ghostw" data-act="imp-del" data-m="${E(m.musim)}" data-k="${k}" title="Hapus data kolam ini saja" aria-label="Hapus"><i class="bi bi-trash"></i></button></span>`).join('')}</span></span>${m.final ? '<span class="k-pill k-ok">Final</span>' : `<span style="white-space:nowrap"><button class="k-btn sm k-orange" data-act="imp-fin" data-m="${E(m.musim)}">Finalkan</button> <button class="k-btn sm k-ghostw" data-act="imp-del" data-m="${E(m.musim)}" aria-label="Hapus"><i class="bi bi-trash"></i></button></span>`}</li>`).join('')}</ul>${belum.length > 1 ? `<div class="k-bar"><button class="k-btn k-orange" data-act="imp-fin-all"><i class="bi bi-check2-all"></i> Finalkan semua (${belum.length}) & hitung rekor</button></div>` : ''}<p class="mut sm">Finalkan menghitung klasemen dan rekor (berurutan menurut tanggal event). Rekor dari arsip selalu dihitung ulang dari data arsip saat ini setiap kali arsip difinalkan, dihapus, atau dipindah kolam.</p><div class="k-bar"><button class="k-btn k-outline sm" data-act="imp-rekor"><i class="bi bi-arrow-repeat"></i> Hitung ulang rekor dari arsip</button></div>` : '<p class="mut">Belum ada data impor.</p>');
}
const KOL_L = { LCM: '50 m (long course)', SCM: '25 m (short course)', '-': 'belum ditentukan' };
const kolTeks = o => Object.keys(o || {}).map(k => `${KOL_L[k] || k}: ${o[k]}`).join(' · ');
const evN = v => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const arsSama = (m, x) => { let n = 0, beda = false; if (m.event && x.event) { n++; if (evN(m.event) !== evN(x.event)) beda = true; } if (m.tanggal && x.tanggal) { n++; if (String(m.tanggal).slice(0, 10) !== String(x.tanggal).slice(0, 10)) beda = true; } return n > 0 && !beda; };
const arsKet = o => (o.event ? `“${o.event}”` : 'event tanpa nama') + (o.tanggal ? ` (${fdt(o.tanggal)})` : '');
const arsUsul = (base, c) => { const ada = new Set((c.arsip || []).map(a => a.musim).concat(c.musim.map(m => m.musim))); for (let i = 2; i < 99; i++) { const t = (base.slice(0, 30 - String(i).length - 1) + ' ' + i); if (!ada.has(t)) return t; } return base; };
function drawImp() {
  const el = $('#imp-body'); if (!el) return; const im = S.imp;
  if (!im.cek) { el.innerHTML = ''; return; }
  const c = im.cek, tanpaMusim = c.n - c.musim.reduce((s, m) => s + m.n, 0);
  el.innerHTML = card('2. Hasil pemeriksaan', `<div class="k-kpis">${kpi('Baris valid', c.n, 'bi-check2-circle')}${kpi('Baris bermasalah', c.nErr, 'bi-exclamation-triangle')}${kpi('Event (arsip)', c.musim.length + (tanpaMusim ? 1 : 0), 'bi-archive')}${kpi('Atlet', c.atlet, 'bi-people')}</div>${c.errors.length ? `<div class="k-alert err"><i class="bi bi-x-octagon"></i><div><b>Perbaiki dulu:</b><ul style="margin:6px 0 0 16px">${c.errors.map(e => `<li>Baris ${e.i}: ${E(e.msg)}</li>`).join('')}</ul></div></div>` : ''}
${c.musim.filter(m => m.ada && !m.ada.sama).map(m => `<div class="k-alert warn"><i class="bi bi-exclamation-triangle"></i><div>Nama arsip <b>${E(m.musim)}</b> di berkas ini sudah dipakai ${E(arsKet(m.ada))}, sedangkan data ini ${E(arsKet(m))}. Supaya tidak tergabung, data ini akan disimpan sebagai arsip <b>${E(arsUsul(m.musim, c))}</b>. Nama bisa diubah di kolom <i>Disimpan ke arsip</i>.</div></div>`).join('')}${c.musim.length ? `<div class="k-scroll"><table class="k-table"><thead><tr><th>Arsip</th><th>Event</th><th>Tanggal</th><th>Lokasi</th><th>Kolam</th><th>Baris</th><th>Disimpan ke arsip</th></tr></thead><tbody>${c.musim.map((m, i) => { const bt = m.ada && !m.ada.sama; return `<tr${bt ? ' class="imp-bt"' : ''}><td><b>${E(m.musim)}</b></td><td>${E(m.event)}</td><td>${E(m.tanggal ? fdt(m.tanggal) : '–')}</td><td class="sm">${E(m.lokasi)}</td><td class="sm">${E(kolTeks(m.kol))}</td><td>${m.n}</td><td><input class="k-in sm" form="imp-simpan-f" name="as${i}" value="${E(bt ? arsUsul(m.musim, c) : m.musim)}" maxlength="30" required><small class="${bt ? 'imp-warn' : 'mut'}">${!m.ada ? 'Arsip baru.' : m.ada.sama ? `Arsip ini sudah ada (${m.ada.n} baris, ${E(kolTeks(m.ada.kol))}). Data ditambahkan ke event yang sama.` : `Nama “${E(m.musim)}” sudah dipakai ${E(arsKet(m.ada))}. Disarankan nama baru agar tidak tergabung.`}</small></td></tr>`; }).join('')}</tbody></table></div>` : ''}
<div class="k-scroll" style="max-height:240px"><table class="k-table"><thead><tr><th>Nama</th><th>Nomor</th><th>Gender</th><th>Kelompok</th><th>Sekolah</th><th>Rank</th><th>Waktu</th><th>Status</th></tr></thead><tbody>${c.rows.slice(0, 30).map(r => `<tr><td>${E(r.nama)}</td><td>${E(r.nomor)}</td><td>${E(r.gender)}</td><td>${E(jn(r.kelompok))}</td><td>${E(r.sekolah)}</td><td>${E(r.rank)}</td><td class="mono">${E(r.waktu)}</td><td>${E(r.status)}</td></tr>`).join('')}</tbody></table></div><p class="mut sm">Pratinjau 30 baris pertama dari ${c.n}.</p>
${!c.nErr && c.n ? `<form data-submit="impsimpan" id="imp-simpan-f" style="margin-top:12px">${(c.kol || {})['-'] ? `<div class="imp-kpil">${field(`Jenis kolam untuk ${c.kol['-']} baris tanpa kolom kolam`, `<div class="k-seg">${[['LCM', 'Long course · kolam 50 m'], ['SCM', 'Short course · kolam 25 m']].map(x => `<label class="imp-kr"><input type="radio" name="kolam" value="${x[0]}" required> ${x[1]}</label>`).join('')}</div>`, 1, 'Wajib dipilih. Hasil 25 m dan 50 m disimpan, diperingkat, dan dicatat rekornya terpisah walaupun nama arsipnya sama.')}</div>` : ''}${tanpaMusim ? field('3. Nama arsip untuk baris tanpa kolom musim', inp('musim', '', { req: 1, ph: 'mis. Kejurda 2025', max: 30 }), 1, `Harus berbeda dari musim berjalan.${(c.arsip || []).length ? ' Nama yang sudah dipakai: ' + c.arsip.map(a => `<b>${E(a.musim)}</b>${a.event ? ' (' + E(a.event) + ')' : ''}`).join(', ') + '. Memakai nama yang sama berarti menambah ke arsip itu.' : ''}`) : ''}<label class="k-check1"><input type="checkbox" name="gabung"> Gabungkan ke arsip yang sudah ada walaupun nama event/tanggalnya berbeda</label><label class="k-check1"><input type="checkbox" name="ganti" checked> Ganti data lama dengan nama arsip <b>dan jenis kolam</b> yang sama (impor ulang tidak menggandakan; data kolam lain tetap)</label><label class="k-check1"><input type="checkbox" name="fin" checked> Langsung finalkan & hitung rekor setelah tersimpan</label><div class="k-bar"><button class="k-btn lg k-orange"><i class="bi bi-cloud-arrow-up"></i> Simpan ${c.n} baris ke arsip</button></div></form>` : ''}`);
}
function parseText(t) { const lines = String(t).replace(/\r/g, '').split('\n').filter(l => l.trim()); if (lines.length < 2) return []; const sep = lines[0].indexOf('\t') >= 0 ? '\t' : lines[0].indexOf(';') >= 0 ? ';' : ','; const hd = lines[0].split(sep).map(h => h.trim().toLowerCase()); return lines.slice(1).map(l => { const c = l.split(sep), o = {}; hd.forEach((h, i) => o[h] = (c[i] || '').trim()); return o; }); }
const norm = r => { r = Object.assign({}, r); if (r.kolam == null || r.kolam === '') r.kolam = r['jenis kolam'] || r.jenis_kolam || r.course || r['jenis_kolam'] || ''; const o = {}; IMP_COLS.forEach(k => o[k] = r[k] == null ? '' : String(r[k]).trim()); return o; };
async function impCek(rows) {
  if (S.impKol) rows.forEach(r => { if (!r.kolam) r.kolam = S.impKol === 'SCM' ? '25' : '50'; }); const addK = (a, b) => Object.keys(b || {}).forEach(k => a[k] = (a[k] || 0) + b[k]);
  const t = toast('Memeriksa ' + rows.length + ' baris…'); const acc = { n: 0, nErr: 0, errors: [], rows: [], atlet: 0, nomor: 0, musim: [], kol: {} }, mm = {};
  try {
    for (let i = 0; i < rows.length; i += 500) {
      const r = (await rp('imp.cek', { rows: rows.slice(i, i + 500) })).data;
      acc.n += r.n; acc.nErr += r.nErr; acc.atlet += r.atlet; acc.nomor += r.nomor; addK(acc.kol, r.kol); acc.arsip = acc.arsip || r.arsip || []; acc.tanpa = acc.tanpa || r.tanpa; if (acc.rows.length < 30) acc.rows = acc.rows.concat(r.rows);
      r.errors.forEach(e => { if (acc.errors.length < 30) acc.errors.push({ i: e.i + i, msg: e.msg }); });
      r.musim.forEach(m => { const x = mm[m.musim] || (mm[m.musim] = { musim: m.musim, event: m.event, tanggal: m.tanggal, lokasi: m.lokasi, n: 0, kol: {} }); x.n += m.n; addK(x.kol, m.kol); x.ada = x.ada || m.ada; x.event = x.event || m.event; x.tanggal = x.tanggal || m.tanggal; x.lokasi = x.lokasi || m.lokasi; });
    }
    acc.musim = Object.keys(mm).map(k => mm[k]).sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)));
    S.imp.rows = rows; S.imp.cek = acc; drawImp(); toast(acc.nErr ? 'Ada baris bermasalah.' : `Data valid: ${acc.n} baris.`, acc.nErr ? 'warn' : 'ok');
  } catch (e) { toast(e.message, 'err'); }
}
INP['imp-k0'] = i => { S.impKol = i.value; };
ACT['imp-parse'] = () => { const rows = parseText($('#imp-paste').value).map(norm); if (!rows.length) return toast('Tempel data dengan baris judul kolom di atas.', 'err'); impCek(rows); };
INP['imp-file'] = async i => { const f = i.files[0]; if (!f) return; try { await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'); const wb = XLSX.read(await f.arrayBuffer(), { type: 'array' }), js = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '', raw: false }); const rows = js.map(r => { const o = {}; Object.keys(r).forEach(k => o[String(k).trim().toLowerCase()] = r[k]); return norm(o); }); if (!rows.length) throw new Error('File kosong.'); impCek(rows); } catch (e) { toast(e.message, 'err'); } i.value = ''; };
ACT['imp-tpl'] = () => xlsx([{ name: 'Impor', rows: [{ kolam: S.impKol === 'SCM' ? '25' : '50', musim: 'Kejurda 2025', event: 'Kejuaraan Renang Pelajar 2025', tanggal: '2025-09-20', lokasi: 'Kolam Renang Bulungan', no_acara: '1', label: '50 M Gaya Bebas Kelompok A Putra', nama: 'Contoh Atlet', nomor: '50m Gaya Bebas', gender: 'Putra', kelompok: 'SD 3-4', kelas: '3', rank: '1', sekolah: 'SDN Contoh 01', klub: '', kota: 'Jakarta Timur', entry: 'NT', waktu: '00:42.15', status: 'OK', catatan: '' }] }], 'Templat-Impor-Hasil.xlsx').catch(e => toast(e.message, 'err'));
async function finalkan(list) { let rk = 0; for (const m of list) { const r = await rp('imp.final', { musim: m, rekor: true }); rk += (r.data && r.data.rekor) || 0; } return rk; }
SUBMIT.impsimpan = async f => {
  const b = $('button.k-orange', f), d = form(f), c = S.imp.cek; if ((c.kol || {})['-'] && !d.kolam) return toast('Pilih jenis kolam (50 m atau 25 m) dulu.', 'err'); busy(b, true);
  try {
    let n = 0; const kolK = k => k === '-' ? d.kolam : k, peta = {}, grup = c.musim.map((m, i) => { const t = String(d['as' + i] || m.musim).trim(); peta[m.musim] = t; return { t, info: m, kol: Object.keys(m.kol || { '-': 1 }).map(kolK) }; });
    if (d.musim) grup.push({ t: d.musim.trim(), info: c.tanpa || {}, kol: Object.keys(c.kol || { '-': 1 }).map(kolK) });
    const R = S.imp.rows.map(r => r.musim && peta[r.musim] && peta[r.musim] !== r.musim ? Object.assign({}, r, { musim: peta[r.musim] }) : r);
    if (!d.gabung) { const bt = grup.filter(g => { const a = (c.arsip || []).find(x => x.musim === g.t); if (!a) return false; if (d.ganti && Object.keys(a.kol || {}).every(k => g.kol.indexOf(k) >= 0)) return false; return !arsSama(a, g.info); }); if (bt.length) { busy(b, false); return toast(bt.map(g => { const a = c.arsip.find(x => x.musim === g.t); return `Nama arsip “${g.t}” sudah dipakai ${arsKet(a)}, sedangkan data ini ${arsKet(g.info)}.`; }).join(' ') + ' Ganti nama arsipnya, atau centang “Gabungkan” bila memang event yang sama.', 'err'); } }
    const ganti = d.ganti ? [].concat(...grup.map(g => g.kol.map(k => g.t + '|' + k))) : [], gabung = d.gabung ? grup.map(g => g.t) : [];
    for (let i = 0; i < R.length; i += 500) { const r = await rp('imp.simpan', { musim: d.musim || '', kolam: d.kolam || '', rows: R.slice(i, i + 500), ganti: i === 0 ? ganti : [], gabung }); n += r.data.n; b.innerHTML = `<span class="k-spin"></span> Menyimpan ${Math.min(i + 500, R.length)}/${R.length}…`; }
    let msg = n + ' baris tersimpan ke arsip.';
    if (d.fin) { b.innerHTML = '<span class="k-spin"></span> Memfinalkan & menghitung rekor…'; const list = [...new Set(grup.map(g => g.t))]; const rk = await finalkan(list); msg += ` ${list.length} arsip difinalkan, ${rk} rekor baru/diperbarui.`; await refreshAll(); }
    toast(msg); S.imp = { rows: [], cek: null }; bustCache('implist'); bustCache('rekor'); bustCache('klas'); go('a-impor');
  } catch (e) { toast(e.message, 'err'); busy(b, false); }
};
ACT['imp-rekor'] = async a => { busy(a, true); try { const r = await rp('imp.rekor', {}); toast(r.message); bustCache('rekor'); } catch (e) { toast(e.message, 'err'); } busy(a, false); };
ACT['imp-kolam'] = async a => { const dari = a.dataset.k, ke = dari === 'SCM' ? 'LCM' : 'SCM'; if (!(await ask(`Pindahkan semua baris kolam ${dari === 'SCM' ? '25 m' : '50 m'} di arsip ${E(a.dataset.m)} menjadi kolam ${ke === 'SCM' ? '25 m (short course)' : '50 m (long course)'}? Rekor dari arsip impor dihitung ulang.`, 'Pindahkan'))) return; busy(a, true); try { const r = await rp('imp.kolam', { musim: a.dataset.m, dari, kolam: ke }); toast(r.message); bustCache('rekor'); bustCache('implist'); go('a-impor'); } catch (e) { toast(e.message, 'err'); busy(a, false); } };
ACT['imp-fin'] = async a => { if (!(await ask(`Finalkan arsip ${a.dataset.m}? Klasemen & rekor dihitung dan ditampilkan di Arsip publik.`, 'Finalkan'))) return; busy(a, true); try { const r = await rp('imp.final', { musim: a.dataset.m, rekor: true }); toast(r.message); bustCache('rekor'); bustCache('klas'); await refreshAll(); go('a-impor'); } catch (e) { toast(e.message, 'err'); busy(a, false); } };
ACT['imp-fin-all'] = async a => { const L = (S.impList || []).filter(m => !m.final).map(m => m.musim); if (!(await ask(`Finalkan ${L.length} arsip berurutan menurut tanggal dan hitung rekor?`, 'Finalkan semua'))) return; busy(a, true); try { const rk = await finalkan(L); toast(`${L.length} arsip difinalkan, ${rk} rekor baru/diperbarui.`); bustCache('rekor'); bustCache('klas'); await refreshAll(); go('a-impor'); } catch (e) { toast(e.message, 'err'); busy(a, false); } };
ACT['imp-del'] = async a => { const k = a.dataset.k || ''; if (!(await ask(`Hapus data impor arsip ${E(a.dataset.m)}${k ? ' untuk kolam ' + (k === 'SCM' ? '25 m' : '50 m') + ' saja' : ' (semua kolam)'}?`, 'Hapus', true))) return; try { const r = await rp('imp.hapus', { musim: a.dataset.m, kolam: k }); toast(r.message); bustCache('rekor'); bustCache('implist'); go('a-impor'); } catch (e) { toast(e.message, 'err'); } };

/* ===== Dokumen, logo, kop ===== */
const DOKS = [['BUKU_ACARA', 'Buku Acara', 'bi-journal-text'], ['START_LIST', 'Start List per Hari', 'bi-list-ol'], ['RESULT_BOOK', 'Buku Hasil', 'bi-trophy'], ['SK_PEMENANG', 'SK Pemenang', 'bi-award'], ['LPJ', 'Laporan LPJ', 'bi-file-earmark-text']];
function logoCard(L, onSave) {
  return `<div class="lgs" id="lg-list">${L.map((l, i) => `<div class="lg-i" data-i="${i}"><img src="${logoUrl(l.id)}" alt="" onerror="this.style.opacity=.25"><div><input class="k-in sm" style="max-width:220px" data-in="lg-nama" data-i="${i}" value="${E(l.nama)}"><label><input type="checkbox" data-chg="lg-f" data-i="${i}" data-f="acara" ${l.acara ? 'checked' : ''}> Buku Acara</label><label><input type="checkbox" data-chg="lg-f" data-i="${i}" data-f="hasil" ${l.hasil ? 'checked' : ''}> Buku Hasil</label><label><input type="checkbox" data-chg="lg-f" data-i="${i}" data-f="web" ${l.web ? 'checked' : ''}> Tampilan web</label></div><div class="lg-a"><button class="k-ibtn" data-act="lg-up" data-i="${i}" aria-label="Naik"><i class="bi bi-arrow-up"></i></button><button class="k-ibtn" data-act="lg-dn" data-i="${i}" aria-label="Turun"><i class="bi bi-arrow-down"></i></button><button class="k-ibtn" data-act="lg-del" data-i="${i}" aria-label="Hapus"><i class="bi bi-trash"></i></button></div></div>`).join('') || '<p class="mut">Belum ada logo. Unggah logo pemerintah daerah, sponsor, atau mitra.</p>'}</div>
<div class="k-qa"><label class="k-btn k-outline"><i class="bi bi-upload"></i> Unggah logo (PNG/JPG)<input type="file" hidden accept="image/png,image/jpeg,image/webp" data-chg="lg-file"></label><button class="k-btn k-navy" data-act="lg-save">Simpan pengaturan logo</button></div><p class="mut sm">Centang tempat logo ditampilkan: <b>Buku Acara</b>, <b>Buku Hasil</b>, dan/atau <b>Tampilan web</b> (beranda & footer). Urutan di sini = urutan tampil.</p>`;
}
function logoState() { return S.logos || []; }
INP['lg-nama'] = i => { S.logos[i.dataset.i].nama = i.value; };
INP['lg-f'] = i => { S.logos[i.dataset.i][i.dataset.f] = i.checked ? 1 : 0; };
const lgRedraw = () => { const h = $('#lg-host'); if (h) h.innerHTML = logoCard(S.logos); };
ACT['lg-up'] = a => { const i = Number(a.dataset.i); if (i > 0) { const L = S.logos; [L[i - 1], L[i]] = [L[i], L[i - 1]]; lgRedraw(); } };
ACT['lg-dn'] = a => { const i = Number(a.dataset.i), L = S.logos; if (i < L.length - 1) { [L[i + 1], L[i]] = [L[i], L[i + 1]]; lgRedraw(); } };
ACT['lg-del'] = async a => { if (await ask('Hapus logo ini? Berkas di Drive ikut dibuang saat disimpan.', 'Hapus', true)) { S.logos.splice(Number(a.dataset.i), 1); lgRedraw(); } };
INP['lg-file'] = async i => { const f = i.files[0]; if (!f) return; try { const x = await readFile(f, true); const r = await rp('dok.logo.up', { nama: f.name.replace(/\.\w+$/, '').slice(0, 40), file: x }); S.logos = r.data; lgRedraw(); toast('Logo ditambahkan.'); } catch (e) { toast(e.message, 'err'); } i.value = ''; };
ACT['lg-save'] = async a => { busy(a, true); try { const r = await rp('dok.logo.set', { list: S.logos }); S.logos = r.data; await refreshAll(); toast(r.message); lgRedraw(); } catch (e) { toast(e.message, 'err'); } busy(a, false); };
V['a-dok'] = function () {
  swr('dok', 'dok.list', {}, d => {
    S.logos = S.logos && $('#lg-host') ? S.logos : d.logos; S.dok = d; const k = d.kop;
    main(`<div class="k-wrap pad">${ph('Dokumen & Logo', 'Buku acara, buku hasil, start list, SK pemenang, dan LPJ — dibuat sebagai PDF di Drive.')}
${card('Buat dokumen', `<div class="g3"><button class="k-tile" style="text-align:left;cursor:pointer;border:1px solid var(--ln)" data-act="bk-xls"><span class="ti"><i class="bi bi-file-earmark-excel"></i></span><b>Excel Buku Acara</b><p class="mut sm">Start list per heat & lintasan (.xlsx), dengan kolom waktu kosong untuk cadangan pencatatan</p></button>${DOKS.map(x => `<button class="k-tile" style="text-align:left;cursor:pointer;border:1px solid var(--ln)" data-act="dok-buat" data-j="${x[0]}"><span class="ti"><i class="bi ${x[2]}"></i></span><b>${x[1]}</b><p class="mut sm">${x[0] === 'START_LIST' ? 'Pilih hari pelaksanaan' : 'Dibuat dari data terbaru'}</p></button>`).join('')}</div>`)}
<div class="g-main"><div>${card('Logo untuk buku & tampilan web', `<div id="lg-host">${logoCard(S.logos)}</div>`)}
<form class="k-card" data-submit="kop"><div class="k-card-h"><h3>Judul buku & tanda tangan</h3></div><div class="k-card-b"><div class="g2">${field('Judul besar (nama kejuaraan)', inp('app_name', S.B.cfg.app_name))}${field('Sub judul (mis. BEST OF THE BEST DKI JAKARTA)', inp('buku_subjudul', S.B.cfg.buku_subjudul || ''))}${field('Nama ketua panitia', inp('ttd_ketua_nama', k.ttd_ketua_nama))}${field('Jabatan penandatangan', inp('ttd_ketua_jabatan', k.ttd_ketua_jabatan))}${field('Kop baris 1 (untuk sampul/dokumen)', inp('kop1', k.kop1))}${field('Kop baris 2', inp('kop2', k.kop2))}</div>${field('Teks panitia (sampul)', `<textarea class="k-in" name="panitia_teks" rows="3">${E(k.panitia_teks)}</textarea>`)}<label class="k-ev"><label><input type="checkbox" name="buku_cover" ${S.B.cfg.buku_cover === '1' ? 'checked' : ''}> <span>Sertakan halaman sampul di buku acara & buku hasil</span></label></label><p class="mut sm">Tanggal & tempat pada buku mengikuti “Tanggal pelaksanaan” dan “Lokasi” di Pengaturan Web.</p><div class="k-bar"><button class="k-btn k-navy">Simpan</button></div></div></form>${bkLayoutForm(S.B.cfg)}</div>
<div>${card('Dokumen musim ini', d.docs.length ? `<ul class="k-list">${d.docs.map(x => `<li><span><b>${E(String(x.jenis).replace(/_/g, ' '))}</b><br><small class="mut">${fdt(x.at)} · ${E(x.by)}</small></span><button class="k-btn sm k-outline" data-act="dok-get" data-id="${x.id}"><i class="bi bi-download"></i></button><button class="k-btn sm ${x.pub ? 'k-ok-b k-navy' : 'k-ghostw'}" data-act="dok-pub" data-id="${x.id}" title="Tampilkan di portal">${x.pub ? 'Publik' : 'Privat'}</button></li>`).join('')}</ul>` : '<p class="mut">Belum ada dokumen.</p>')}</div></div></div>`);
    blMini();
  }, 3000);
};
/* ===== Tata letak halaman buku (v2.3.4): margin, ukuran huruf, jarak baris, isi & kop per halaman + pratinjau ===== */
const BL_BAWAAN = { buku_margin: '12,12,10,10', buku_huruf: 'SEDANG', buku_jarak: 'NORMAL', buku_isi: 'PENUH', buku_kop: 'LENGKAP' };
const BL_FS = { KECIL: 9.5, SEDANG: 10.5, BESAR: 11.5 }, BL_PAD = { RAPAT: 1, NORMAL: 2, LEGA: 4 }, BL_M = ['Atas', 'Bawah', 'Kiri', 'Kanan'];
const blMargin = v => { const p = String(v || '').split(/[,\s]+/).map(Number), d = [12, 12, 10, 10]; return d.map((x, i) => p[i] >= 5 && p[i] <= 30 ? p[i] : x); };
function bkLayoutForm(c) {
  const v = k => c[k] || BL_BAWAAN[k], m = blMargin(c.buku_margin), o = (vals, cur) => vals.indexOf(cur) >= 0 ? cur : vals[0];
  return `<form class="k-card" data-submit="bklay" id="bk-lay"><div class="k-card-h"><h3>Tata letak halaman buku</h3><span class="k-pill k-neu">A4</span></div><div class="k-card-b">
<p class="mut sm" style="margin-top:0">Berlaku untuk Buku Acara, Start List per hari, dan Buku Hasil. Coba dulu dengan <b>Pratinjau</b> — pengaturan baru dipakai setelah disimpan, dan PDF yang sudah terbit tidak berubah sampai dibuat ulang.</p>
<div class="bl-grid"><div class="bl-mini" aria-hidden="true"><div class="bl-pg"><div class="bl-isi" id="bl-isi"><div class="bl-kop"></div><div class="bl-row"></div></div></div><small class="mut" id="bl-info"></small></div>
<div><fieldset class="bl-m"><legend>Margin (mm)</legend><div class="bl-m4">${BL_M.map((l, i) => field(l, inp('bl_m' + i, m[i], { type: 'number', attr: 'min="5" max="30" step="1" inputmode="numeric" data-in="bl"' }))).join('')}</div></fieldset>
<div class="g2">${field('Ukuran huruf isi', sel('buku_huruf', [['KECIL', 'Kecil — lebih banyak baris per halaman'], ['SEDANG', 'Sedang (bawaan)'], ['BESAR', 'Besar — lebih mudah dibaca']], o(['SEDANG', 'KECIL', 'BESAR'], v('buku_huruf')), 'data-chg="bl"'))}${field('Jarak antarbaris', sel('buku_jarak', [['RAPAT', 'Rapat'], ['NORMAL', 'Normal (bawaan)'], ['LEGA', 'Lega']], o(['NORMAL', 'RAPAT', 'LEGA'], v('buku_jarak')), 'data-chg="bl"'))}</div>
${field('Isi per halaman', sel('buku_isi', [['PENUH', 'Penuh — halaman terisi penuh, seri boleh berlanjut ke halaman berikutnya (disarankan)'], ['UTUH', 'Seri utuh — satu seri tidak dipotong, halaman lebih banyak'], ['LONGGAR', 'Longgar — sisakan ruang di bawah tiap halaman']], o(['PENUH', 'UTUH', 'LONGGAR'], v('buku_isi')), 'data-chg="bl"'), 0, 'Seri yang terpotong diberi judul “HEAT n (LANJUTAN)” dan selalu menyisakan minimal 2 lintasan di tiap halaman.')}
${field('Kop di halaman berikutnya', sel('buku_kop', [['LENGKAP', 'Lengkap di setiap halaman (judul, logo, waktu & tempat)'], ['RINGKAS', 'Ringkas — kop lengkap hanya di halaman pertama, berikutnya satu baris']], o(['LENGKAP', 'RINGKAS'], v('buku_kop')), 'data-chg="bl"'))}</div></div>
<div class="bl-bar"><label class="bl-pvj"><span class="mut sm">Pratinjau</span>${sel('bl_pv', [['BUKU_ACARA', 'Buku Acara'], ['RESULT_BOOK', 'Buku Hasil']], 'BUKU_ACARA')}</label><button type="button" class="k-btn k-outline" data-act="bl-pv"><i class="bi bi-eye"></i> Pratinjau</button><button type="button" class="k-btn k-ghostw" data-act="bl-reset">Kembalikan bawaan</button><button class="k-btn k-navy">Simpan</button></div></div></form>`;
}
function blNilai(f) { const d = form(f); return { buku_margin: BL_M.map((x, i) => Math.min(30, Math.max(5, Math.round(Number(d['bl_m' + i]) || [12, 12, 10, 10][i])))).join(','), buku_huruf: d.buku_huruf, buku_jarak: d.buku_jarak, buku_isi: d.buku_isi, buku_kop: d.buku_kop }; }
// Gambar halaman mini + perkiraan jumlah baris atlet per halaman (rumus sama dengan server, untuk gambaran cepat).
function blMini() {
  const f = $('#bk-lay'), isi = $('#bl-isi'); if (!f || !isi) return; const n = blNilai(f), m = blMargin(n.buku_margin), fs = BL_FS[n.buku_huruf] || 10.5, pad = BL_PAD[n.buku_jarak] !== undefined ? BL_PAD[n.buku_jarak] : 2, sk = 120 / 794;
  Object.assign(isi.style, { top: m[0] / 297 * 100 + '%', bottom: m[1] / 297 * 100 + '%', left: m[2] / 210 * 100 + '%', right: m[3] / 210 * 100 + '%' });
  const baris = 2 * pad + 1.2 * fs + 0.55, tinggi = Math.floor((297 - m[0] - m[1]) * 96 / 25.4) - 12 - (n.buku_isi === 'LONGGAR' ? 80 : 0);
  const kepala = 66 + (3 + 2 * pad + fs + 6.8) + (2 * pad + 1.15 * (fs - 0.5) + 3.4) + (2 * pad + 1.2 * (fs - 0.5) + 1.2), jml = Math.max(0, Math.floor((tinggi - kepala) / baris));
  $('.bl-kop', isi).style.height = (66 * sk).toFixed(1) + 'px'; const row = $('.bl-row', isi); row.style.backgroundSize = '100% ' + Math.max(1.6, baris * sk).toFixed(2) + 'px'; row.style.bottom = (n.buku_isi === 'LONGGAR' ? 80 * sk : 0) + 'px';
  $('#bl-info').innerHTML = `Area isi ${210 - m[2] - m[3]} × ${297 - m[0] - m[1]} mm<br>± ${jml} baris atlet di halaman pertama`;
}
INP.bl = () => blMini();
ACT['bl-reset'] = () => { const f = $('#bk-lay'); if (!f) return; const m = blMargin(BL_BAWAAN.buku_margin); BL_M.forEach((x, i) => { f.elements['bl_m' + i].value = m[i]; }); ['buku_huruf', 'buku_jarak', 'buku_isi', 'buku_kop'].forEach(k => { f.elements[k].value = BL_BAWAAN[k]; }); blMini(); toast('Nilai bawaan diisi — klik Simpan untuk menerapkan.'); };
SUBMIT.bklay = async f => { const b = $('button.k-navy', f); busy(b, true); try { const r = await rp('cfg.simpan', { cfg: blNilai(f) }); await refreshAll(); toast(r.message); bustCache('dok'); } catch (e) { toast(e.message, 'err'); } busy(b, false); };
ACT['bl-simpan'] = () => { const f = $('#bk-lay'); closeModal(); if (f) f.requestSubmit(); };
// Pratinjau: HTML buku dari server (dengan pengaturan formulir yang belum disimpan) dipecah per halaman ke lembar A4 di dalam iframe.
ACT['bl-pv'] = async a => {
  const f = $('#bk-lay'); if (!f) return; const set = blNilai(f), jenis = f.elements.bl_pv.value; busy(a, true);
  try {
    const r = (await rp('dok.pratinjau', { jenis, set })).data, mm = r.mm;
    modal('Pratinjau ' + (jenis === 'RESULT_BOOK' ? 'Buku Hasil' : 'Buku Acara'), `<div class="bl-pvh"><span class="k-pill k-neu">${r.halaman} halaman</span>${r.isi ? `<span class="k-pill k-ok">isi rata-rata ${r.isi}%</span>` : ''}<span class="mut sm">Margin ${mm.join(' / ')} mm · garis putus-putus = batas area isi · logo & tanda tangan tampil sebagai kotak abu-abu</span></div><iframe class="bl-frame" id="bl-frame" title="Pratinjau halaman buku"></iframe><p class="mut sm" id="bl-lebih" hidden></p>`,
      `<button class="k-btn k-ghostw" data-act="mx">Tutup</button><button class="k-btn k-navy" data-act="bl-simpan">Simpan pengaturan ini</button>`, true);
    $('#modal .k-modal').classList.add('xl'); const fr = $('#bl-frame');
    fr.onload = () => { const d = fr.contentDocument; if (!d || !d.body) return; d.body.style.zoom = Math.min(1, (fr.clientWidth - 24) / 794).toFixed(3); let n = 0; d.querySelectorAll('.sh').forEach(s => { const i = s.firstElementChild; if (i.scrollHeight > i.clientHeight + 2) { s.classList.add('lebih'); n++; } }); const p = $('#bl-lebih'); if (n) { p.hidden = false; p.textContent = n + ' halaman tampak melewati batas bawah di layar ini (bertanda merah). Hasil PDF bisa sedikit berbeda; bila perlu pilih jarak lebih rapat atau margin lebih kecil.'; } };
    fr.srcdoc = blLembar(r.html, mm);
  } catch (e) { toast(e.message, 'err'); }
  busy(a, false);
};
function blLembar(html, mm) {
  const d = new DOMParser().parseFromString(html, 'text/html'), gaya = [...d.querySelectorAll('style')].map(x => x.outerHTML).join(''), hal = []; let cur = null;
  [...d.body.children].forEach(el => { const pb = el.classList.contains('pb') || /page-break-before:\s*always/.test(el.getAttribute('style') || ''); if (!cur || pb) { cur = []; hal.push(cur); } cur.push(el.outerHTML); });
  return `<!doctype html><html><head><meta charset="utf-8">${gaya}<style>html{background:#E3E8EF}body{margin:0;padding:12px 0}.sh{width:210mm;height:297mm;box-sizing:border-box;padding:${mm[0]}mm ${mm[3]}mm ${mm[1]}mm ${mm[2]}mm;background:#fff;margin:0 auto 12px;box-shadow:0 2px 8px rgba(10,30,60,.18);position:relative;overflow:hidden}.sh>.in{height:100%;outline:1px dashed #B8C4D2}.sh.lebih>.in{outline:2px solid #D64545}.nh{position:absolute;right:8px;bottom:3px;font:600 10px Arial,sans-serif;color:#8A97A8}</style></head><body>${hal.map((h, i) => `<div class="sh"><div class="in">${h.join('')}</div><span class="nh">Hal ${i + 1}</span></div>`).join('')}</body></html>`;
}
ACT['dok-buat'] = async a => {
  const j = a.dataset.j; let hari = 0;
  if (j === 'START_LIST') { const hs = Array.from(new Set(S.B.events.map(e => e.hari))).sort(); hari = Number(await new Promise(res => { modal('Pilih hari', `<div class="k-chips">${hs.map(h => `<button class="k-chip" data-act="dok-hari" data-h="${h}">Hari ${h}</button>`).join('')}</div>`); S.hariRes = res; })); if (!hari) return; }
  const orig = a.innerHTML; a.disabled = true; a.innerHTML = '<span class="k-spin"></span> Membuat PDF…';
  try { const r = await rp('dok.buat', { jenis: j, hari }); dlB64(r.data.nama + '.pdf', r.data.mime, r.data.b64); toast(r.message); bustCache('dok'); if (r.data.pub) await refreshAll(); go('a-dok'); } catch (e) { toast(e.message, 'err'); a.disabled = false; a.innerHTML = orig; }
};
ACT['dok-hari'] = a => { closeModal(); if (S.hariRes) S.hariRes(a.dataset.h); };
ACT['dok-get'] = async a => { busy(a, true); try { const r = await rp('dok.data', { id: a.dataset.id }); dlB64(r.data.name, r.data.mime, r.data.b64); } catch (e) { toast(e.message, 'err'); } busy(a, false); };
ACT['dok-pub'] = async a => { try { const r = await rp('dok.publik', { id: a.dataset.id }); toast(r.message); await refreshAll(); bustCache('dok'); go('a-dok'); } catch (e) { toast(e.message, 'err'); } };
SUBMIT.kop = async f => { const b = $('button.k-navy', f), d = form(f); busy(b, true); d.buku_cover = d.buku_cover ? '1' : '0'; try { const r = await rp('cfg.simpan', { cfg: d }); await refreshAll(); toast(r.message); bustCache('dok'); } catch (e) { toast(e.message, 'err'); } busy(b, false); };

/* ===== Dokumentasi (foto + tautan Drive per event/album) ===== */
V['a-gal'] = function () {
  swr('galadm', 'pub.galeri', {}, d => {
    S.galAll = d; const al = {}; d.forEach(g => (al[g.ev || 'Umum'] = al[g.ev || 'Umum'] || []).push(g)); const albums = Object.keys(al), sa = isSA();
    main(`<div class="k-wrap pad">${ph('Dokumentasi', 'Unggah foto atau tautkan album Google Drive, dikelompokkan per event/album.')}
<div class="g2"><form class="k-card" data-submit="galup"><div class="k-card-h"><h3><i class="bi bi-camera"></i> Unggah foto</h3></div><div class="k-card-b">${field('Album / event', `<input class="k-in" name="album" list="dl-alb" required placeholder="mis. Hari 1 — Pembukaan"><datalist id="dl-alb">${albums.map(a => `<option value="${E(a)}">`).join('')}</datalist>`, 1)}${field('Keterangan (opsional)', inp('caption', '', { max: 120 }))}<label class="k-dz" style="display:block"><label><i class="bi bi-images"></i><b>Pilih foto (boleh banyak)</b><small class="dzn">JPG / PNG / WEBP, maks 5 MB per foto</small><input type="file" hidden multiple accept="image/jpeg,image/png,image/webp" id="gal-files"></label></label><div class="k-bar"><button class="k-btn k-orange">Unggah</button></div></div></form>
<form class="k-card" data-submit="gallink"><div class="k-card-h"><h3><i class="bi bi-google"></i> Tautkan album Google Drive</h3></div><div class="k-card-b">${field('Album / event', `<input class="k-in" name="album" list="dl-alb" required placeholder="mis. Hari 1 — Pembukaan">`, 1)}${field('Judul tautan', inp('caption', '', { req: 1, max: 120, ph: 'mis. Foto lengkap Hari 1' }), 1)}${field('Tautan Google Drive / Foto', inp('url', '', { type: 'url', req: 1, ph: 'https://drive.google.com/…' }), 1, 'Pastikan akses folder: “Siapa saja yang memiliki link”.')}<div class="k-bar"><button class="k-btn k-navy">Tambah tautan</button></div></div></form></div>
${albums.length ? albums.map(k => `<section class="k-alb"><h2><i class="bi bi-folder2-open"></i> ${E(k)} <small class="mut">${al[k].length} item</small></h2><div class="gal">${al[k].map(g => g.tipe === 'LINK' ? `<div class="k-tile"><span class="ti"><i class="bi bi-google"></i></span><b>${E(g.cap)}</b><p class="sm"><a href="${E(g.url)}" target="_blank" rel="noopener">Buka tautan</a></p>${sa ? `<button class="k-btn sm k-ghostw" data-act="gal-del" data-id="${E(g.id)}"><i class="bi bi-trash"></i></button>` : ''}</div>` : `<figure class="k-g"><img loading="lazy" src="${thumb(g.f, 360)}" alt=""><figcaption>${E(g.cap)}</figcaption>${sa ? `<button class="del k-ibtn" data-act="gal-del" data-id="${E(g.id)}" aria-label="Hapus"><i class="bi bi-trash"></i></button>` : ''}</figure>`).join('')}</div></section>`).join('') : empty('bi-images', 'Belum ada dokumentasi.')}</div>`);
  }, 3000);
};
SUBMIT.galup = async f => {
  const fs = Array.from($('#gal-files').files); if (!fs.length) return toast('Pilih minimal satu foto.', 'err'); const d = form(f), b = $('button.k-orange', f); busy(b, true); let ok = 0;
  for (const x of fs) { try { const file = await readFile(x, true); await rp('gal.up', { album: d.album, caption: d.caption || x.name.replace(/\.\w+$/, ''), file }); ok++; b.innerHTML = `<span class="k-spin"></span> ${ok}/${fs.length}`; } catch (e) { toast(x.name + ': ' + e.message, 'err'); } }
  toast(ok + ' foto diunggah.'); bustCache('gal'); go('a-gal');
};
SUBMIT.gallink = async f => { const b = $('button.k-navy', f); busy(b, true); try { const r = await rp('gal.link', form(f)); toast(r.message); bustCache('gal'); go('a-gal'); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
ACT['gal-del'] = async a => { if (!(await ask('Hapus item dokumentasi ini?', 'Hapus', true))) return; try { await rp('gal.del', { id: a.dataset.id }); toast('Dihapus.'); bustCache('gal'); go('a-gal'); } catch (e) { toast(e.message, 'err'); } };

/* ===== Laporan & ekspor Excel ===== */
V['a-lap'] = function () {
  swr('lap', 'lap.get', {}, d => {
    const k = d.kpi, sa = isSA();
    main(`<div class="k-wrap pad">${ph('Laporan & Ekspor', `Musim ${E(d.musim)}`, sa ? `<button class="k-btn k-orange" data-act="exp"><i class="bi bi-file-earmark-spreadsheet"></i> Unduh Excel lengkap</button>` : '')}
${sa ? alertx('info', 'Excel lengkap berisi: <b>Akun</b> (sekolah/klub/mandiri), <b>Peserta</b> (biodata + tautan berkas Drive), <b>Nomor</b> yang diikuti, <b>Pemenang</b>, rekap kelompok, dan rekap per nomor.', 'bi-file-earmark-excel') : ''}
<div class="k-kpis">${kpi('Akun aktif', k.kontingen, 'bi-building')}${kpi('Atlet', k.atlet, 'bi-people')}${kpi('Entri nomor', k.entri, 'bi-list-ol')}${k.lunas !== undefined ? kpi('Terverifikasi', rupiah(k.lunas), 'bi-cash-coin') : ''}${kpi('Menunggu bayar', rupiah(k.pending), 'bi-hourglass-split')}</div>
<div class="g2">${card('Per kelompok', `<table class="k-table"><thead><tr><th>Kelompok</th><th>Atlet</th><th>Entri</th></tr></thead><tbody>${d.jenjang.map(j => `<tr><td>${E(j.nama)}</td><td>${j.atlet}</td><td>${j.entri}</td></tr>`).join('')}</tbody></table>`, '', true)}${card('Sebaran wilayah', `<table class="k-table"><thead><tr><th>Kab/Kota</th><th>Akun</th><th>Atlet</th></tr></thead><tbody>${d.wilayah.map(w => `<tr><td>${E(w.n)}</td><td>${w.kontingen}</td><td>${w.atlet}</td></tr>`).join('')}</tbody></table>`, '', true)}</div>
${card('Peserta per nomor', `<div class="k-scroll"><table class="k-table"><thead><tr><th>No</th><th>Nomor</th><th>Kelompok</th><th>Gender</th><th>Atlet</th></tr></thead><tbody>${d.nomor.map(n => `<tr><td class="mono">#${n.no}</td><td>${E(n.nama)}</td><td>${E(jn(n.jk))}</td><td>${G_L[n.g]}</td><td>${n.atlet}</td></tr>`).join('')}</tbody></table></div>`, '', true)}</div>`);
  }, 5000);
};
ACT.exp = async a => {
  busy(a, true);
  try { const r = (await rp('exp.data', {})).data; await xlsx([{ name: 'Akun', rows: r.akun }, { name: 'Peserta', rows: r.peserta }, { name: 'Nomor Diikuti', rows: r.nomor }, { name: 'Pemenang', rows: r.pemenang }, { name: 'Rekap Kelompok', rows: r.rekapKelompok }, { name: 'Rekap Nomor', rows: r.rekapNomor }], `KRP-${r.musim}-data-lengkap.xlsx`); toast('Excel diunduh.'); }
  catch (e) { toast(e.message, 'err'); } busy(a, false);
};

/* ===== Pengaturan web ===== */
const CFG_TEXT = [['portal_url', 'Alamat portal (URL GitHub Pages, untuk tautan di email & dokumen)'], ['portal_nama', 'Nama portal (judul web utama)'], ['portal_sub', 'Teks kecil di bawah nama portal'], ['hero_aksen', 'Baris kedua judul beranda (warna emas)'], ['tagline', 'Tagline beranda'], ['banner_teks', 'Banner atas (opsional)'], ['teks_berjalan', 'Teks berjalan (opsional)'], ['cta1', 'Tombol utama'], ['cta2', 'Tombol kedua'], ['logo_url', 'URL logo utama (opsional)']];
V['a-cfg'] = function () {
  swr('cfg', 'cfg.get', {}, c => {
    S.cfgv = c; if (!(S.logos && $('#lg-host'))) { rp('dok.list').then(r => { S.logos = r.data.logos; const h = $('#lg-host'); if (h) h.innerHTML = logoCard(S.logos); }).catch(() => { }); }
    main(`<div class="k-wrap pad">${ph('Pengaturan Web', 'Tampilan beranda, media sosial, logo, dan poin klasemen.')}
<div class="k-alert info"><i class="bi bi-calendar-event"></i><div><b>Nama event, tanggal, tempat, pendaftaran, kuota, biaya, kelompok, rekening, dan kontak</b> kini diatur di menu <b>Event & Nomor Lomba</b>.<br><span class="sm">Event aktif: <b>${E(c.app_name)}</b> · ${E(c.tanggal_teks)} · ${E(c.lokasi)}</span></div><button class="k-btn sm k-navy" data-go="a-event">Buka Event & Nomor Lomba</button></div>
<form data-submit="cfg"><div class="k-card"><div class="k-card-h"><h3>Tampilan & informasi</h3></div><div class="k-card-b"><div class="g2">${CFG_TEXT.map(x => field(x[1], inp(x[0], c[x[0]]))).join('')}</div>${field('Persyaratan (satu baris satu syarat)', `<textarea class="k-in" name="persyaratan" rows="5">${E(c.persyaratan)}</textarea>`)}${field('Kartu info beranda (JSON: [{"j":"Judul","d":"Isi"}])', `<textarea class="k-in mono" name="kartu_json" rows="4">${E(c.kartu_json)}</textarea>`)}</div></div>
<div class="k-card"><div class="k-card-h"><h3><i class="bi bi-share"></i> Media sosial (tautan ikuti)</h3></div><div class="k-card-b"><div class="g2">${field('Instagram 1', inp('ig1', c.ig1, { type: 'url' }))}${field('Instagram 2', inp('ig2', c.ig2, { type: 'url' }))}${field('YouTube 1', inp('yt1', c.yt1, { type: 'url' }))}${field('YouTube 2', inp('yt2', c.yt2, { type: 'url' }))}</div></div></div>
<div class="k-card"><div class="k-card-h"><h3><i class="bi bi-broadcast"></i> Hasil live & klasemen</h3></div><div class="k-card-b"><div class="g3">${field('Jeda pembaruan Hasil Live (detik)', inp('live_detik', c.live_detik || '30', { type: 'number', attr: 'min="15" max="300"' }))}<p class="mut sm">Makin besar jeda, makin banyak penonton yang sanggup dilayani server. Saran saat pelaksanaan: 30–60 detik.</p>${''}${field('Poin emas / perak / perunggu', `<div style="display:flex;gap:6px"><input class="k-in" name="poin_emas" value="${E(c.poin_emas)}" type="number"><input class="k-in" name="poin_perak" value="${E(c.poin_perak)}" type="number"><input class="k-in" name="poin_perunggu" value="${E(c.poin_perunggu)}" type="number"></div>`)}</div><p class="mut sm">Kuota, jumlah nomor per atlet, jumlah lintasan, dan minimal peserta per nomor diatur per event di menu Event & Nomor Lomba. Akun pribadi otomatis hanya untuk satu atlet (nama sendiri).</p></div></div>
<div class="k-bar sticky"><button class="k-btn lg k-orange">Simpan & Publikasikan</button></div></form>
${card('Logo di tampilan web', `<div id="lg-host">${logoCard(S.logos || [])}</div>`)}</div>`);
  }, 2000);
};
SUBMIT.cfg = async f => { const b = $('button.k-orange', f), d = form(f); busy(b, true); try { const r = await rp('cfg.simpan', { cfg: d }); await refreshAll(); toast(r.message); S.cache = {}; go('a-cfg'); } catch (e) { toast(e.message, 'err'); busy(b, false); } };

/* ===== Pengguna, audit, arsip ===== */
V['a-usr'] = function () {
  swr('usr', 'usr.list', {}, d => {
    S.usr = d;
    main(`<div class="k-wrap pad">${ph('Pengguna Panitia', 'Admin Pendaftaran, Admin Input Data, Admin Wasit, dan Super Admin', `<button class="k-btn k-orange" data-act="usr-edit" data-id=""><i class="bi bi-person-plus"></i> Tambah pengguna</button>`)}${card('Daftar pengguna', `<div class="k-scroll"><table class="k-table"><thead><tr><th>Nama</th><th>Email</th><th>Peran</th><th>Status</th><th></th></tr></thead><tbody>${d.map(u => `<tr><td><b>${E(u.nama)}</b></td><td>${E(u.email)}</td><td>${E(ROLE_L[u.role] || u.role)}</td><td>${pill(u.st)}</td><td style="text-align:right"><button class="k-btn sm k-outline" data-act="usr-edit" data-id="${u.id}">Ubah</button> <button class="k-btn sm k-ghostw" data-act="usr-reset" data-id="${u.id}"><i class="bi bi-key"></i> Sandi</button> <button class="k-btn sm k-ghostw" data-act="usr-hapus" data-id="${u.id}" title="Hapus pengguna" style="color:var(--er)"><i class="bi bi-trash"></i></button></td></tr>`).join('')}</tbody></table></div>`, '', true)}</div>`);
  }, 3000);
};
ACT['usr-edit'] = a => { const u = S.usr.filter(x => x.id === a.dataset.id)[0] || { nama: '', email: '', role: 'VERIFIKATOR', st: 'ACTIVE', lis: '' }; modal(u.id ? 'Ubah pengguna' : 'Tambah pengguna', `<form data-submit="usr" data-id="${E(u.id || '')}">${field('Nama', inp('nama', u.nama, { req: 1 }), 1)}${field('Email', inp('email', u.email, { type: 'email', req: 1 }), 1)}${field('Peran', sel('role', ['SUPER_ADMIN', 'VERIFIKATOR', 'OPERATOR_LAPANGAN', 'WASIT_UTAMA'].map(r => [r, ROLE_L[r]]), u.role), 1)}${field('Status', sel('st', [['ACTIVE', 'Aktif'], ['NONAKTIF', 'Nonaktif']], u.st))}${field('No. lisensi wasit (opsional)', inp('lis', u.lis))}<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">Simpan</button></div></form>`); };
const sandiBox = (t, p) => modal(t, `<p>Catat kata sandi ini — <b>hanya tampil sekali</b>.</p><div class="k-code mono" style="font-size:18px;padding:14px;background:var(--surf);border-radius:8px;text-align:center;user-select:all">${E(p)}</div>`, '<button class="k-btn k-navy" data-act="mx">Sudah dicatat</button>');
SUBMIT.usr = async f => { const b = $('button.k-orange', f), d = form(f); busy(b, true); try { const r = await rp('usr.simpan', Object.assign({ id: f.dataset.id }, d)); bustCache('usr'); if (r.data && r.data.sandi) sandiBox('Pengguna dibuat', r.data.sandi); else { toast(r.message); closeModal(); } go('a-usr'); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
ACT['usr-reset'] = a => { const u = (S.usr || []).filter(x => x.id === a.dataset.id)[0] || {}; modal('Ganti kata sandi', `<form data-submit="usr-sandi" data-id="${E(a.dataset.id)}"><p class="sm">Pengguna: <b>${E(u.nama)}</b> · ${E(u.email)}</p>${alertx('info', 'Kata sandi lama tidak bisa dilihat karena disimpan terenkripsi. Tetapkan kata sandi baru di sini.', 'bi-shield-lock')}${field('Kata sandi baru', inp('sandi', '', { attr: 'autocomplete="new-password" placeholder="Kosongkan untuk dibuat otomatis"' }))}<p class="mut sm">Minimal 8 karakter berisi huruf dan angka.</p><div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">Simpan sandi baru</button></div></form>`); };
SUBMIT['usr-sandi'] = async f => { const b = $('button.k-orange', f), d = form(f); busy(b, true); try { const r = await rp('usr.reset', { id: f.dataset.id, sandi: d.sandi }); sandiBox('Kata sandi baru', r.data.sandi); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
ACT['usr-hapus'] = async a => { const u = (S.usr || []).filter(x => x.id === a.dataset.id)[0] || {}; if (!(await ask(`Hapus pengguna ${u.nama} (${u.email})? Tindakan ini permanen.`, 'Hapus'))) return; try { const r = await rp('usr.hapus', { id: a.dataset.id }); toast(r.message); bustCache('usr'); go('a-usr'); } catch (e) { toast(e.message, 'err'); } };
V['a-aud'] = function () { swr('aud', 'aud.list', {}, d => main(`<div class="k-wrap pad">${ph('Log Audit', '200 aktivitas terakhir')}${card('Aktivitas', `<div class="k-scroll"><table class="k-table"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Peran</th><th>Aksi</th><th>Rincian</th></tr></thead><tbody>${d.map(l => `<tr><td class="mono sm">${E(String(l.ts).replace('T', ' '))}</td><td>${E(l.user)}</td><td class="sm">${E(l.role)}</td><td><b>${E(l.action)}</b></td><td class="sm">${E(l.entity)} ${E(l.detail)}</td></tr>`).join('')}</tbody></table></div>`, '', true)}</div>`), 5000); };
V['a-ars'] = function () {
  swr('ars', 'ars.get', {}, d => {
    const T = ['Kunci data musim', 'Cadangan database ke Drive', 'Arsipkan dokumen & Hall of Fame', 'Mulai musim baru'], s = d.step;
    main(`<div class="k-wrap pad">${ph('Tutup Event & Arsip', `Musim ${E(d.musim)} · ${d.nomor} nomor`)}${d.belumSah ? alertx('warn', `Masih ada <b>${d.belumSah}</b> nomor yang belum disahkan wasit.`) : ''}
<ol class="k-stepper">${T.map((t, i) => `<li class="${i < s ? 'done' : i === s ? 'cur' : ''}"><span>${i < s ? '<i class="bi bi-check-lg"></i>' : i + 1}</span><div style="flex:1"><h4>${t}</h4>${i === s ? `<form data-submit="ars" data-l="${i + 1}">${i === 0 ? field(`Ketik <b>${E(d.konfirmasi)}</b> untuk konfirmasi`, inp('konfirmasi', '', { req: 1 })) : ''}${i === 3 ? ((d.next || []).length ? field('Aktifkan event berikutnya', sel('evId', [['', '— pilih event dari daftar Event & Nomor Lomba —']].concat(d.next.map(x => [x.id, x.nama + ' (' + x.musim + ')'])), ''), 0, 'Atau kosongkan dan isi nama musim baru di bawah.') : '') + field('Nama musim baru (bila tidak memilih event)', inp('namaBaru', '', { ph: 'mis. 2027' })) : ''}<button class="k-btn k-orange">Jalankan tahap ${i + 1}</button></form>` : ''}</div></li>`).join('')}</ol>
${d.arsip.length ? card('Arsip tersimpan', `<ul class="k-list">${d.arsip.map(a => `<li><span><b>Musim ${E(a.musim)}</b><br><small class="mut">${a.atlet} atlet · ${fdt(a.at)} · ${E(a.oleh)}</small></span>${a.url ? `<a class="k-btn sm k-outline" target="_blank" rel="noopener" href="${E(a.url)}">Cadangan</a>` : ''}</li>`).join('')}</ul>`) : ''}</div>`);
  }, 2000);
};
SUBMIT.ars = async f => { const l = Number(f.dataset.l), d = form(f); if (!(await ask(`Jalankan tahap ${l}? Tahap ini tidak dapat dibatalkan.`, 'Jalankan', true))) return; const b = $('button', f); busy(b, true); try { if (l === 4 && !d.evId && !String(d.namaBaru || '').trim()) { busy(b, false); return toast('Pilih event berikutnya atau isi nama musim baru.', 'err'); } const r = await rp('ars.run', { langkah: l, konfirmasi: d.konfirmasi, namaBaru: d.namaBaru, evId: d.evId }); toast(r.message); await refreshAll(); bustCache('ars'); go('a-ars'); } catch (e) { toast(e.message, 'err'); busy(b, false); } };


})();

(function () {
'use strict';
const { $, $$, E, S, V, ACT, SUBMIT, INP, rp, swr, toast, busy, ph, card, alertx, field, inp, form, ask, kpi, Perf, GAS_URL, go } = KRP;
const main = h => { $('#main').innerHTML = h; };
const samarUrl = u => { const m = /\/s\/([A-Za-z0-9_-]+)\/exec/.exec(u || ''); return m ? u.replace(m[1], m[1].slice(0, 6) + '…' + m[1].slice(-4)) : (u || '—'); };
const NAMA_T = { TBL_PORTAL_CONFIG: 'Pengaturan portal', TBL_MASTER_JENJANG: 'Kelompok/kelas', TBL_EVENT: 'Event', TBL_MASTER_NOMOR_LOMBA: 'Nomor lomba', TBL_USERS_ROLES: 'Akun panitia', TBL_KONTINGEN: 'Akun pendaftar', TBL_ATLET: 'Atlet', TBL_REGISTRASI_ENTRI: 'Pendaftaran nomor', TBL_MUTASI_ATLET: 'Pengajuan', TBL_HEAT_SEEDS: 'Start list', TBL_RACE_RESULTS: 'Hasil lomba', TBL_WASIT_SIGNOFF: 'Pengesahan wasit', TBL_REKOR_KEJUARAAN: 'Rekor', TBL_EVENT_ARCHIVE_LOG: 'Arsip event', TBL_HASIL_ARSIP: 'Hasil lama (impor)', TBL_DOKUMEN: 'Dokumen', TBL_GALERI: 'Galeri', TBL_AUDIT_LOG: 'Log audit', TBL_HASIL_JURNAL: 'Jurnal hasil' };

/* ===== Sistem & Migrasi (Super Admin) ===== */
V['a-sistem'] = function () {
  swr('migg', 'mig.grup', {}, G => {
    S.migG = G; const p = Perf.rata();
    main(`<div class="k-wrap pad">${ph('Sistem & Migrasi', 'Status koneksi frontend ↔ API Apps Script, dan pemindahan data dari app lama.')}
<div id="sys-db">${card('<i class="bi bi-database"></i> Database & kuota Supabase', '<div class="k-skel"></div>')}</div>
<div class="g-main"><div>
${card('Pindahkan data dari app lama', `<p class="sm">Spreadsheet app lama <b>hanya dibaca</b>, tidak pernah diubah. Data dicocokkan berdasarkan nama kolom dan ID, jadi aman dijalankan berulang (tidak dobel). Berkas Drive (foto, akta, bukti bayar, logo) tetap terbaca selama app baru dipasang di <b>akun Google yang sama</b>.</p>
<form data-submit="mig" id="mig-f">${field('URL atau ID spreadsheet database app lama', inp('sumber', S.migSrc || '', { req: 1, ph: 'https://docs.google.com/spreadsheets/d/…' }), 1)}
<div class="mig-g">${G.map(g => `<label class="k-check1"><input type="checkbox" name="g_${g.id}"${g.mati ? '' : ' checked'}> ${E(g.label)}</label>`).join('')}</div>
<label class="k-check1"><input type="checkbox" name="timpa"> <span>Perbarui data yang sudah ada bila berbeda di app lama<small class="mut" style="display:block">Untuk sinkron ulang sebelum pindah. Biarkan kosong bila app baru sudah dipakai.</small></span></label>
<div class="k-bar" style="flex-wrap:wrap"><button type="submit" class="k-btn k-outline" data-k="0"><i class="bi bi-search"></i> Pindai (tanpa menulis)</button><button type="button" class="k-btn k-orange" data-act="mig-run"><i class="bi bi-cloud-download"></i> Jalankan migrasi</button></div></form>
<div id="mig-out"></div>`)}
${card('Langkah pindah ke app baru (cutover)', `<ol class="sm" style="margin:0 0 0 18px;line-height:1.8"><li>Pasang app baru (Apps Script + GitHub Pages), login Super Admin.</li><li><b>Pindai</b> → periksa angka → <b>Jalankan migrasi</b>.</li><li>Cek akun, atlet, event, foto, dan pengaturan. Uji masuk dengan 1 akun pendaftar.</li><li>Tepat sebelum pindah: jalankan migrasi <b>sekali lagi</b> (delta) untuk menangkap data baru di app lama.</li><li>Umumkan alamat baru, lalu arsipkan deployment lama (datanya tetap aman).</li></ol><p class="mut sm" style="margin-top:8px">Sesi login tidak ikut pindah: semua pengguna cukup masuk ulang dengan kata sandi yang sama.</p>`)}
</div><div>
<div id="sys-sec">${card('<i class="bi bi-shield-lock"></i> Keamanan', '<div class="k-skel"></div>')}</div>
${card('Koneksi API', `<div class="k-kpis" id="sys-k">${kpi('Rata-rata total', p ? p.total + ' ms' : '–', 'bi-speedometer')}${kpi('Waktu server', p ? p.server + ' ms' : '–', 'bi-cpu')}${kpi('Jaringan', p ? p.net + ' ms' : '–', 'bi-wifi')}</div>
<p class="sm" style="margin:10px 0 4px">Alamat API: <code>${E(samarUrl(GAS_URL))}</code></p><p class="sm mut" id="sys-v">Versi frontend: ${E((window.KRP_CONFIG || {}).VERSI || '-')}</p>
<div class="k-bar"><button class="k-btn k-navy sm" data-act="sys-ping"><i class="bi bi-activity"></i> Uji koneksi</button></div>
<p class="mut sm" style="margin-top:8px">Diukur dari ${p ? p.n : 0} permintaan terakhir di perangkat ini. Waktu server tinggi → data besar/cache dingin; jaringan tinggi → koneksi pengguna.</p>`)}
${card('Tips performa hari pelaksanaan', `<ul class="sm" style="margin:0 0 0 18px;line-height:1.7"><li>Halaman web dilayani GitHub Pages; hanya data yang memakai kuota Apps Script.</li><li>Cache publik dipanaskan otomatis tiap 10 menit (trigger <code>pemanasan_</code>).</li><li>Atur jeda Hasil Live 45–60 detik di Pengaturan Web saat pengunjung ramai.</li><li>Isi <b>Alamat portal</b> di Pengaturan Web agar tautan di email mengarah ke GitHub Pages.</li></ul>`)}
</div></div></div>`);
    swr('keam', 'sys.keamanan', {}, drawSec, 30000);
    swr('sbst', 'sb.status', {}, drawDb, 60000);
  }, 60000);
};
/* ===== Database & kuota Supabase: status koneksi, pemakaian vs batas paket, pindah Sheets ↔ Supabase dari web ===== */
const fb = n => { n = Number(n) || 0; const f = (v, d) => v.toLocaleString('id-ID', { maximumFractionDigits: d }); return n < 1024 ? f(n, 0) + ' B' : n < 1048576 ? f(n / 1024, 1) + ' KB' : n < 1073741824 ? f(n / 1048576, 1) + ' MB' : f(n / 1073741824, 2) + ' GB'; };
const angka = n => (Number(n) || 0).toLocaleString('id-ID');
const meter = (judul, pakai, batas, ket) => { const p = batas ? Math.min(100, pakai / batas * 100) : 0, k = p >= 95 ? 'err' : p >= 80 ? 'warn' : ''; return `<div class="sb-m"><div class="sb-mh"><span>${judul}</span><b class="mono">${fb(pakai)} <small class="mut">/ ${fb(batas)}</small></b></div><div class="k-prog"><i class="${k}" style="width:${Math.max(p, pakai ? 1 : 0).toFixed(1)}%"></i></div><small class="mut">${p.toLocaleString('id-ID', { maximumFractionDigits: 1 })}% terpakai${ket ? ' · ' + ket : ''}</small></div>`; };
function drawDb(x) {
  const el = $('#sys-db'); if (!el) return; S.sbSt = x;
  const B = x.batas[x.paket] || x.batas.FREE, P = x.pakai || {}, hr = new Date().toISOString().slice(0, 10), hi = (P.hari || {})[Object.keys(P.hari || {}).sort().pop()] || [0, 0];
  const st = !x.siap ? '<span class="k-pill k-neu">Belum diatur</span>' : x.terhubung ? '<span class="k-pill k-ok">Terhubung</span>' : '<span class="k-pill k-err">Gagal terhubung</span>';
  const aktif = x.mode === 'SUPABASE' ? '<span class="k-pill k-ok"><i class="bi bi-database-check"></i> Supabase</span>' : '<span class="k-pill k-navy"><i class="bi bi-table"></i> Google Sheets</span>';
  const tot = x.nama.reduce((s, n) => s + ((x.tabel[n] || {}).n || 0), 0), totS = x.sheet ? x.nama.reduce((s, n) => s + (x.sheet[n] || 0), 0) : 0;
  const info = !x.siap ? alertx('info', `<b>Supabase belum diatur.</b> Data tersimpan di Google Sheets. Untuk pindah: (1) jalankan <code>SETUP_SUPABASE.sql</code> di SQL Editor Supabase, (2) isi <code>SUPABASE_URL</code> & <code>SUPABASE_SERVICE_KEY</code> di Apps Script → Project Settings → Script Properties, (3) muat ulang kartu ini lalu klik <b>Pindahkan ke Supabase</b>.`, 'bi-info-circle')
    : x.galat ? alertx('err', `<b>Tidak bisa terhubung ke Supabase.</b> ${E(x.galat)}`, 'bi-plug')
    : x.kurang.length ? alertx('warn', `Tabel belum ada di Supabase: ${x.kurang.map(E).join(', ')}. Jalankan ulang <code>SETUP_SUPABASE.sql</code>.`, 'bi-exclamation-triangle')
    : x.mode === 'SHEETS' ? alertx(tot ? 'warn' : 'info', `<b>App masih memakai Google Sheets.</b> ${tot ? `Supabase berisi ${angka(tot)} baris dari salinan sebelumnya (bukan data terbaru).` : 'Supabase masih kosong karena app belum dipindahkan.'} Data di spreadsheet: ${angka(totS)} baris. Klik <b>Pindai</b> untuk melihat rinciannya, lalu <b>Pindahkan ke Supabase</b>.`, 'bi-table')
    : alertx('ok', `<b>App memakai Supabase.</b> Semua data baru tersimpan di Supabase. Spreadsheet lama tidak ditulis lagi dan menjadi cadangan.`, 'bi-database-check');
  const kuota = x.terhubung ? `<div class="sb-q"><div class="sb-qh"><b>Pemakaian bulan ini</b><label class="sm">Paket <select class="k-in sb-pk" data-chg="sb-paket">${Object.keys(x.batas).map(k => `<option value="${k}"${k === x.paket ? ' selected' : ''}>${E(x.batas[k].nama)}</option>`).join('')}</select></label></div>
${x.sqlLama ? alertx('warn', 'Ukuran database belum terbaca: jalankan ulang <code>SETUP_SUPABASE.sql</code> versi terbaru (menambah fungsi <code>krp_kuota</code>). Aman diulang, data tidak terhapus.', 'bi-arrow-repeat') : meter('Ukuran database', x.db, B.db, 'termasuk tabel sistem Supabase')}
${meter('Egress (data keluar)', P.b || 0, B.egress, 'perkiraan dari Apps Script')}
<ul class="k-list sec-list"><li><span>Permintaan ke Supabase</span><b>${angka(P.n)} <small class="mut">bulan ini · ${angka(hi[0])} hari ini</small></b></li>
<li><span>Terakhir terhubung</span><b>${P.u ? KRP.fdt(new Date(P.u).toISOString(), 1) : '–'}</b></li>
<li><span>Penyimpanan berkas</span><span class="sm mut">Tidak dipakai: foto, akta & bukti bayar disimpan di Google Drive</span></li>
<li><span>Pengguna aktif (MAU)</span><span class="sm mut">Tidak dipakai: login lewat Apps Script</span></li>
${B.jeda ? '<li><span>Jeda otomatis (Free)</span><span class="sm mut">Proyek dijeda bila 1 minggu tanpa aktivitas. Trigger pemanasan menyentuh database minimal tiap jam, jadi proyek tetap aktif.</span></li>' : ''}</ul>
${P.lalu ? `<p class="sm mut">Bulan lalu (${E(P.lalu.bln)}): ${angka(P.lalu.n)} permintaan · ${fb(P.lalu.b)} egress.</p>` : ''}
<p class="sm mut">Egress dihitung dari isi respons Supabase ke Apps Script (header & akses dasbor Supabase tidak ikut). Angka resmi ada di halaman Usage Supabase.</p></div>` : '';
  const tabel = x.terhubung || x.sheet ? `<details class="sb-det"><summary>Rincian per tabel (${x.nama.length})</summary><div class="k-scroll"><table class="k-table"><thead><tr><th>Data</th>${x.sheet ? '<th>Sheets</th>' : ''}<th>Supabase</th><th>Ukuran</th></tr></thead><tbody>${x.nama.map(n => { const t = x.tabel[n] || {}; return `<tr><td>${E(NAMA_T[n] || n)}</td>${x.sheet ? `<td class="mono">${x.sheet[n] == null ? '–' : angka(x.sheet[n])}</td>` : ''}<td class="mono">${x.terhubung ? (x.tabel[n] ? angka(t.n) : '<span class="err-t">tidak ada</span>') : '–'}</td><td class="mono sm">${t.b ? fb(t.b) : '–'}</td></tr>`; }).join('')}</tbody></table></div></details>` : '';
  const tb = [];
  if (x.siap && x.terhubung && x.mode === 'SHEETS') tb.push('<button class="k-btn k-outline sm" data-act="sb-pindai"><i class="bi bi-search"></i> Pindai</button>', `<button class="k-btn k-orange sm" data-act="sb-pindah" data-v="aktifkan" ${x.kurang.length ? 'disabled' : ''}><i class="bi bi-cloud-upload"></i> Pindahkan ke Supabase</button>`);
  if (x.mode === 'SUPABASE') tb.push('<button class="k-btn k-ghostw sm" data-act="sb-pindah" data-v="kembali"><i class="bi bi-arrow-counterclockwise"></i> Kembali ke Google Sheets</button>', '<button class="k-btn k-ghostw sm" data-act="sb-pindah" data-v="cache"><i class="bi bi-eraser"></i> Kosongkan cache tabel</button>');
  if (x.siap) tb.push('<a class="k-btn k-ghostw sm" href="https://supabase.com/dashboard/org/_/usage" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i> Halaman Usage Supabase</a>');
  el.innerHTML = card('<i class="bi bi-database"></i> Database & kuota Supabase', `<div class="sb-top"><div><small class="mut">Database aktif</small>${aktif}</div><div><small class="mut">Supabase</small><span>${x.host ? `<code>${E(x.host)}</code> ` : ''}${st}</span></div>${x.terhubung ? `<div><small class="mut">Total baris di Supabase</small><b class="mono">${angka(tot)}</b></div>` : ''}</div>
${info}${kuota}${tabel}<div id="sb-out"></div>${tb.length ? `<div class="k-bar" style="flex-wrap:wrap">${tb.join('')}</div>` : ''}`, '<button class="k-btn k-ghostw sm" data-act="sb-muat" title="Muat ulang"><i class="bi bi-arrow-clockwise"></i></button>');
}
ACT['sb-muat'] = async a => { busy(a, true); KRP.bustCache('sbst'); try { drawDb((await rp('sb.status')).data); } catch (e) { toast(e.message, 'err'); } busy(a, false); };
INP['sb-paket'] = async i => { try { const r = await rp('sb.paket', { paket: i.value }); toast(r.message); KRP.bustCache('sbst'); drawDb((await rp('sb.status')).data); } catch (e) { toast(e.message, 'err'); } };
ACT['sb-pindai'] = async a => {
  busy(a, true);
  try {
    const x = (await rp('sb.pindai')).data, L = Object.keys(x.tabel), tot = L.reduce((s, n) => s + x.tabel[n].sheet, 0), masalah = L.filter(n => x.tabel[n].kosong || x.tabel[n].ganda || !x.tabel[n].ada);
    $('#sb-out').innerHTML = alertx(masalah.length ? 'warn' : 'info', `<b>Hasil pindai (tidak ada yang ditulis).</b> ${angka(tot)} baris di Sheets akan disalin ke Supabase.${masalah.length ? ' Periksa catatan di tabel.' : ' Siap dipindahkan.'}`, 'bi-search')
      + `<div class="k-scroll"><table class="k-table"><thead><tr><th>Data</th><th>Di Sheets</th><th>Di Supabase sekarang</th><th>Catatan</th></tr></thead><tbody>${L.map(n => { const t = x.tabel[n]; return `<tr><td>${E(NAMA_T[n] || n)}</td><td class="mono">${angka(t.sheet)}</td><td class="mono">${t.ada ? angka(t.supabase) : '–'}</td><td class="sm ${t.ada ? 'mut' : 'err-t'}">${[!t.ada ? 'tabel belum ada: jalankan SETUP_SUPABASE.sql' : '', t.kosong ? t.kosong + ' baris tanpa ID dilewati' : '', t.ganda ? t.ganda + ' ID ganda digabung' : ''].filter(Boolean).join(' · ')}</td></tr>`; }).join('')}</tbody></table></div>`;
  } catch (e) { toast(e.message, 'err'); }
  busy(a, false);
};
const SB_TEKS = {
  aktifkan: ['Pindahkan ke Supabase', 'Semua tabel disalin dari Google Sheets ke Supabase, isinya dicocokkan baris demi baris, lalu app langsung memakai Supabase. Selama proses (±10–60 detik) pengguna lain tidak bisa menyimpan data. Spreadsheet tidak dihapus dan tetap menjadi cadangan. Bila ada yang tidak cocok, app tetap memakai Sheets.', 'Pindahkan sekarang'],
  kembali: ['Kembali ke Google Sheets', 'Seluruh data Supabase disalin ke spreadsheet (menimpa isi spreadsheet lama), diperiksa identik, lalu app memakai Google Sheets lagi. Data di Supabase tidak dihapus.', 'Kembali ke Sheets'],
  cache: ['Kosongkan cache tabel', 'Pakai bila Anda mengubah data langsung di Table Editor Supabase. Data berikutnya dibaca langsung dari Supabase.', 'Kosongkan']
};
ACT['sb-pindah'] = a => { const t = SB_TEKS[a.dataset.v]; KRP.modal(t[0], `<form data-submit="sbpindah" data-v="${E(a.dataset.v)}" autocomplete="off"><p class="sm">${t[1]}</p>${konf()}<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">${t[2]}</button></div></form>`); };
SUBMIT.sbpindah = async f => {
  const b = $('button.k-orange', f), aksi = f.dataset.v; busy(b, true);
  try {
    const r = await rp('sb.pindah', Object.assign(form(f), { aksi })); KRP.closeModal(); toast(r.message);
    KRP.bustCache('sbst'); KRP.bustCache('keam'); drawDb((await rp('sb.status')).data);
    if (r.data && r.data.lap) { const L = r.data.lap; $('#sb-out').innerHTML = `<div class="k-scroll"><table class="k-table"><thead><tr><th>Data</th><th>Sheets</th><th>Supabase</th><th>Isi</th></tr></thead><tbody>${Object.keys(L).map(n => `<tr><td>${E(NAMA_T[n] || n)}</td><td class="mono">${angka(L[n].sheet)}</td><td class="mono">${angka(L[n].supabase)}</td><td>${L[n].cocok ? '<span class="k-pill k-ok">identik</span>' : '<span class="k-pill k-err">beda</span>'}</td></tr>`).join('')}</tbody></table></div>`; }
  } catch (e) { toast(e.message.replace(/^Server sedang ramai.*$/, 'Proses masih berjalan atau koneksi terputus. Tunggu 1 menit lalu klik muat ulang (↻) untuk melihat status.'), 'err'); busy(b, false); }
};
/* ===== Keamanan: hanya status & versi tersamar (rahasia tetap di Script Properties) ===== */
const ya = (b, t, f) => `<span class="k-pill ${b ? 'k-ok' : 'k-warn'}">${b ? t : f}</span>`;
function drawSec(k) {
  const el = $('#sys-sec'); if (!el) return;
  el.innerHTML = card('<i class="bi bi-shield-lock"></i> Keamanan', `<ul class="k-list sec-list">
<li><span>Kunci sesi login</span>${ya(k.sesi, 'Tersimpan', 'Belum ada')}</li>
<li><span>Akses darurat (<code>${E(k.daruratUser)}</code>)</span>${k.daruratKunci ? '<span class="k-pill k-err">Terkunci 15 menit</span>' : ya(k.darurat && k.daruratRotasi, 'Diganti ' + KRP.fdt(k.daruratRotasi), k.darurat ? 'Masih sandi awal' : 'Belum ada')}</li>
<li><span>Database</span><b>${k.db === 'SUPABASE' ? 'Supabase' : 'Google Sheets'}</b></li>
<li><span>Supabase</span>${k.sbHost ? `<span class="sm"><code>${E(k.sbHost)}</code> · kunci ${k.sbKunci ? '<code>' + E(k.sbSamar) + '</code>' : 'belum diisi'}</span>` : '<span class="mut sm">Belum diatur</span>'}</li>
<li><span>Masa berlaku sesi</span><b>${k.sesiJam} jam</b></li></ul>
${k.darurat && !k.daruratRotasi ? alertx('warn', 'Kata sandi darurat masih sandi awal dari Log eksekusi setup. Ganti sekarang agar sandi lama tidak berlaku.', 'bi-exclamation-triangle') : ''}
<p class="mut sm">Rahasia (kunci sesi, sandi darurat, kunci Supabase) hanya tersimpan di <b>Script Properties</b> Apps Script. Halaman ini tidak pernah menampilkan nilai lengkapnya.</p>
<div class="k-bar" style="flex-wrap:wrap"><button class="k-btn k-navy sm" data-act="sec-darurat"><i class="bi bi-key"></i> Ganti sandi darurat</button><button class="k-btn k-ghostw sm" data-act="sec-keluar"><i class="bi bi-box-arrow-right"></i> Keluarkan semua pengguna</button></div>`);
}
const konf = () => field('Kata sandi Anda (konfirmasi)', '<input class="k-in" type="password" name="konfirmasi" autocomplete="current-password" required>', 1, S.me && S.me.id === 'darurat' ? 'Masuk sebagai akses darurat: isi kata sandi darurat yang sekarang.' : 'Kata sandi akun Super Admin Anda.');
ACT['sec-darurat'] = () => KRP.modal('Ganti kata sandi darurat', `<form data-submit="secdar" autocomplete="off"><p class="sm">Akses darurat dipakai bila tidak ada Super Admin yang bisa masuk. Simpan sandi baru di tempat aman (pengelola sandi). Setelah diganti, sesi darurat lama otomatis keluar.</p>${field('Kata sandi darurat baru', '<input class="k-in" type="password" name="baru" minlength="12" autocomplete="new-password" required>', 1, 'Minimal 12 karakter, berisi huruf dan angka.')}${field('Ulangi kata sandi baru', '<input class="k-in" type="password" name="ulang" minlength="12" autocomplete="new-password" required>', 1)}${konf()}<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">Ganti</button></div></form>`);
SUBMIT.secdar = async f => {
  const d = form(f), b = $('button.k-orange', f); if (d.baru !== d.ulang) return toast('Ulangi kata sandi tidak sama.', 'err'); busy(b, true);
  try { const r = await rp('sys.darurat', d); f.reset(); KRP.closeModal(); toast(r.message); if (r.data && r.data.keluar) return KRP.logout(false); KRP.bustCache('keam'); go('a-sistem'); } catch (e) { toast(e.message, 'err'); busy(b, false); }
};
ACT['sec-keluar'] = () => KRP.modal('Keluarkan semua pengguna', `<form data-submit="seckel"><p class="sm">Semua perangkat yang sedang masuk (panitia dan akun pendaftar, termasuk Anda) harus masuk ulang. Pakai bila ada HP/laptop panitia yang hilang atau sandi diduga bocor.</p>${konf()}<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">Keluarkan semua</button></div></form>`);
SUBMIT.seckel = async f => { const b = $('button.k-orange', f); busy(b, true); try { const r = await rp('sys.keluarsemua', form(f)); KRP.closeModal(); toast(r.message); KRP.logout(false); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
ACT['sys-ping'] = async a => {
  busy(a, true); const t0 = performance.now();
  try { const r = await rp('sys.ping'); const tot = Math.round(performance.now() - t0); $('#sys-v').innerHTML = `Versi frontend: ${E((window.KRP_CONFIG || {}).VERSI || '-')} · backend: <b>${E(r.data.v)}</b> · database: <b>${r.data.db === 'SUPABASE' ? 'Supabase' : 'Google Sheets'}</b> · musim: ${E(r.data.musim)} · tahap: ${E(r.data.fase)}<br>Uji barusan: total <b>${tot} ms</b> (server ${r.ms || 0} ms)`; toast(r.message); }
  catch (e) { toast(e.message, 'err'); }
  busy(a, false);
};
async function migJalan(f, jalankan) {
  const d = form(f), grup = (S.migG || []).filter(g => d['g_' + g.id]).map(g => g.id); S.migSrc = d.sumber;
  if (!String(d.sumber || '').trim()) return toast('Tempel URL spreadsheet app lama.', 'err');
  if (!grup.length) return toast('Pilih minimal satu kelompok data.', 'err');
  if (jalankan && !(await ask('Jalankan migrasi sekarang? Data app lama hanya dibaca. Data di app baru ditambah' + (d.timpa ? ' dan diperbarui' : '') + ' sesuai hasil pindai.', 'Jalankan'))) return;
  const b = jalankan ? $('[data-act=mig-run]', f) : $('button[type=submit]', f); busy(b, true);
  try {
    const r = await rp('mig.run', { sumber: d.sumber, grup, timpa: !!d.timpa, jalankan });
    const x = r.data, L = Object.keys(x.lapor);
    $('#mig-out').innerHTML = `${alertx(x.dryRun ? 'info' : 'ok', `<b>${E(x.sumber.nama)}</b> — ${E(r.message)}${x.appBaru ? '<br><span class="sm">App baru masih kosong: isi bawaan setup (kelompok, nomor, event, pengaturan) diganti data app lama.</span>' : ''}`, x.dryRun ? 'bi-search' : 'bi-check2-circle')}
<div class="k-scroll"><table class="k-table"><thead><tr><th>Data</th><th>Di app lama</th><th>Ditambah</th><th>Diperbarui</th><th>Dilewati</th><th>Catatan</th></tr></thead><tbody>${L.map(t => { const v = x.lapor[t]; return `<tr><td><b>${E(NAMA_T[t] || t)}</b></td><td>${v.sumber}</td><td>${v.tambah}</td><td>${v.ubah}</td><td>${v.lewat}</td><td class="sm mut">${E(v.ket || '')}</td></tr>`; }).join('')}</tbody></table></div>
${x.peringatan.length ? `<div class="k-alert warn"><i class="bi bi-exclamation-triangle"></i><div><b>Perhatian</b><ul style="margin:6px 0 0 16px">${x.peringatan.slice(0, 20).map(w => `<li>${E(w)}</li>`).join('')}</ul></div></div>` : ''}`;
    if (!x.dryRun) { KRP.bustCache(); await S.refreshAll(); }
    toast(r.message);
  } catch (e) { toast(e.message, 'err'); }
  busy(b, false);
}
SUBMIT.mig = f => migJalan(f, false);
ACT['mig-run'] = a => migJalan(a.closest('form'), true);
/* ===== Prefetch menu panitia: [kunci swr, aksi, data, ttl]. Menu berat (audit, arsip, laporan, impor, sistem) hanya saat diarahkan kursor. ===== */
const P1 = (k, a, t) => () => [[k, a, {}, t || 15000]];
Object.assign(KRP.PRE, {
  'a-dash': P1('adash', 'a.dash'), 'a-fase': P1('afase', 'fase.get'), 'a-verif': P1('vlist', 'v.list'), 'a-png': P1('plist', 'p.list'), 'a-akun': P1('akun', 'sa.akun'),
  'a-jadwal': P1('jd', 'jd.get'), 'a-dok': P1('dok', 'dok.list'), 'a-gal': P1('galadm', 'pub.galeri'),
  'a-cfg': P1('cfg', 'cfg.get', 60000), 'a-usr': P1('usr', 'usr.list'), 'a-event': P1('evl', 'ev.list'),
  'a-lap': P1('lap', 'lap.get'), 'a-aud': P1('aud', 'aud.list'), 'a-ars': P1('ars', 'ars.get'), 'a-impor': P1('implist', 'imp.list'), 'a-sistem': () => [['migg', 'mig.grup', {}, 60000], ['keam', 'sys.keamanan', {}, 30000], ['sbst', 'sb.status', {}, 60000]]
});
KRP.PRE_BERAT = { 'a-lap': 1, 'a-aud': 1, 'a-ars': 1, 'a-impor': 1, 'a-sistem': 1 };
})();

(function () {
'use strict';
/* ===== Nomor Lomba Peserta (Super Admin): lihat, tambah, pindah, ubah seed time, hapus nomor setiap atlet —
   termasuk atlet yang didaftarkan sendiri oleh sekolah/klub maupun yang diinput manual oleh panitia. ===== */
const { $, $$, E, S, V, ACT, SUBMIT, INP, G_L, TIPE_L, rp, swr, toast, busy, ph, card, alertx, empty, ask, bustCache, jn, kls, pill, form, go } = KRP;
const main = h => { $('#main').innerHTML = h; };
const HAL = 40; // atlet per halaman (daftar panjang tetap ringan di HP)
const bisaStart = f => f === 'STARTLIST' || f === 'BUKU_ACARA';
const adaStart = f => bisaStart(f) || f === 'PELAKSANAAN'; // tahap yang sudah punya start list (sisip lintasan kosong masih boleh saat pelaksanaan)

V['a-nomor'] = function () {
  S.npF = S.npF || { q: '', ev: '', jk: '', g: '', x: '', n: HAL };
  swr('peserta', 'sa.peserta', {}, d => { S.NP = d; S.NPev = {}; d.nomor.forEach(e => { S.NPev[e.id] = e; }); if ($('#np-list')) return gambarDaftar(); gambar(); }, 15000);
};
function gambar() {
  const d = S.NP, f = S.npF, jks = [...new Set(d.atlet.map(a => a.jk).filter(Boolean))].sort((a, b) => (S.B.jenjang || []).findIndex(j => j.kode === a) - (S.B.jenjang || []).findIndex(j => j.kode === b));
  main(`<div class="k-wrap pad">${ph('Nomor Lomba Peserta', 'Lihat dan ubah data atlet serta nomor lombanya: ubah nama & biodata, tambah, pindah, ubah seed time, atau hapus nomor — juga setelah start list terbit. Berlaku untuk pendaftaran sekolah/klub/mandiri maupun input manual panitia.')}
${!d.buka && d.fase === 'PENDAFTARAN' ? alertx('info', 'Pendaftaran sudah melewati batas waktu. Super Admin tetap bisa menambah dan mengubah nomor di sini.', 'bi-unlock') : d.fase !== 'PENDAFTARAN' ? alertx('info', `Tahap <b>${E(KRP.FASE_L[d.fase] || d.fase)}</b>. Pendaftar tidak bisa mengubah data lagi; revisi dari peserta dilakukan Super Admin di sini: <b>Ubah data</b> (nama, kelas, sekolah, dll.), <b>Seed</b>, <b>Pindah</b>, atau <b>Tambah nomor</b>.${adaStart(d.fase) ? ' Start list ikut diperbarui: seed baru langsung tampil tanpa menggeser lintasan, dan nomor baru bisa disisipkan ke lintasan kosong.' : ''}${d.fase !== 'STARTLIST' && adaStart(d.fase) ? ' Setelah selesai, buat ulang Buku Acara/Start List di <b>Dokumen & Logo</b>.' : ''}`, 'bi-info-circle') : ''}
<div class="k-filter np-f"><input class="k-in" data-in="np-q" placeholder="Cari nama, BIB, sekolah, klub, akun…" value="${E(f.q)}" aria-label="Cari atlet">
<select class="k-in" data-chg="np-ev" aria-label="Saring per nomor"><option value="">Semua nomor</option>${d.nomor.map(e => `<option value="${e.id}"${f.ev === e.id ? ' selected' : ''}>#${e.no} ${E(e.nama)} ${E(jn(e.jk))} ${G_L[e.g] || ''}${e.a ? '' : ' (dibatalkan)'}</option>`).join('')}</select>
<select class="k-in" data-chg="np-jk" aria-label="Saring kelompok"><option value="">Semua kelompok</option>${jks.map(k => `<option value="${E(k)}"${f.jk === k ? ' selected' : ''}>${E(jn(k))}</option>`).join('')}</select>
<select class="k-in" data-chg="np-g" aria-label="Saring jenis kelamin"><option value="">Putra & putri</option><option value="PUTRA"${f.g === 'PUTRA' ? ' selected' : ''}>Putra</option><option value="PUTRI"${f.g === 'PUTRI' ? ' selected' : ''}>Putri</option></select>
<select class="k-in" data-chg="np-x" aria-label="Saring khusus"><option value="">Semua atlet</option><option value="mnl"${f.x === 'mnl' ? ' selected' : ''}>Input manual panitia</option><option value="lebih"${f.x === 'lebih' ? ' selected' : ''}>Melebihi batas ${d.maks} nomor</option><option value="kurang"${f.x === 'kurang' ? ' selected' : ''}>Kurang dari ${d.min} nomor</option><option value="kosong"${f.x === 'kosong' ? ' selected' : ''}>Belum punya nomor</option></select></div>
<div id="np-list"></div></div>`);
  gambarDaftar();
}
function saring() {
  const d = S.NP, f = S.npF, q = f.q.trim().toLowerCase();
  return d.atlet.filter(a => (!q || [a.nama, a.bib, a.sk, a.kl, a.kont].join(' ').toLowerCase().indexOf(q) >= 0) && (!f.ev || a.ent.some(e => e.eid === f.ev)) && (!f.jk || a.jk === f.jk) && (!f.g || a.g === f.g)
    && (!f.x || (f.x === 'mnl' ? a.mnl || a.ent.some(e => e.mnl) : f.x === 'lebih' ? a.ent.length > d.maks : f.x === 'kurang' ? a.ent.length && a.ent.length < d.min : !a.ent.length)))
    .sort((x, y) => x.nama.localeCompare(y.nama));
}
const bayar = b => pill(b);
function baris(a, e) {
  const ev = S.NPev[e.eid] || { no: '?', nama: '(nomor terhapus)', jk: '', g: '' }, kunci = e.h ? 'disabled title="Sudah ada hasil lomba di nomor ini"' : '';
  return `<div class="np-e${ev.a === 0 ? ' off' : ''}"><div class="np-en"><b class="mono">#${ev.no}</b> ${E(ev.nama)} <small class="mut">${E(jn(ev.jk))}${ev.jk !== a.jk ? ' · <span class="warn-t">beda kelompok</span>' : ''}</small><div class="np-tag"><span class="mono np-seed" title="Seed time">${E(e.seed || 'NT')}</span>${pill(e.v)}${bayar(e.b)}${e.sl ? `<span class="k-pill k-info" title="Posisi di start list">seri ${e.sl[0]} · lint. ${e.sl[1]}</span>` : ''}${e.h ? '<span class="k-pill k-gold">ada hasil</span>' : ''}${e.mnl && !a.mnl ? '<span class="k-pill k-neu">input panitia</span>' : ''}${ev.a === 0 ? '<span class="k-pill k-err">nomor dibatalkan</span>' : ''}</div></div>
<div class="np-ea"><button class="k-btn sm k-ghostw" data-act="np-seed" data-a="${E(a.id)}" data-id="${E(e.id)}" ${kunci}><i class="bi bi-stopwatch"></i> Seed</button><button class="k-btn sm k-outline" data-act="np-pindah" data-a="${E(a.id)}" data-id="${E(e.id)}" ${kunci}><i class="bi bi-arrow-left-right"></i> Pindah</button><button class="k-btn sm k-ghostw" data-act="np-hapus" data-id="${E(e.id)}" data-n="${E(a.nama)} #${ev.no}" ${kunci} title="Hapus nomor" aria-label="Hapus nomor" style="color:var(--er)"><i class="bi bi-x-lg"></i></button></div></div><div class="np-fh" id="np-e-${E(e.id)}"></div>`;
}
function kartuAtlet(a) {
  const d = S.NP, lebih = a.ent.length > d.maks, kurang = a.ent.length && a.ent.length < d.min;
  return `<div class="k-card np-a" id="np-a-${E(a.id)}"><div class="k-card-b"><div class="np-ah"><div><b>${E(a.nama)}</b> <span class="mono mut">${E(a.bib)}</span>${a.mnl ? ' <span class="k-pill k-neu">akun input panitia</span>' : ''}${a.demo ? ' <span class="k-pill k-warn">akun uji coba</span>' : ''}<br><small class="mut">${G_L[a.g] || a.g} · Kelas ${kls(a.kelas)} · ${E(jn(a.jk))} · ${E(a.sk || a.kl || '-')}${a.kont && a.kont !== a.sk && a.kont !== a.kl ? ' · akun ' + E(a.kont) : ''}</small></div>
<div class="np-n"><span class="${lebih ? 'err-t' : kurang ? 'warn-t' : ''}"><b>${a.ent.length}</b>/${d.maks} nomor</span><button class="k-btn sm k-outline" data-act="np-data" data-a="${E(a.id)}"><i class="bi bi-pencil"></i> Ubah data</button><button class="k-btn sm k-orange" data-act="np-tambah" data-a="${E(a.id)}"><i class="bi bi-plus-lg"></i> Tambah nomor</button></div></div>
<div class="np-fh" id="np-d-${E(a.id)}"></div><div class="np-el">${a.ent.map(e => baris(a, e)).join('') || '<p class="mut sm" style="margin:6px 0 0">Belum ada nomor musim ini.</p>'}</div><div class="np-fh" id="np-t-${E(a.id)}"></div></div></div>`;
}
function gambarDaftar() {
  const el = $('#np-list'); if (!el) return; const d = S.NP, f = S.npF, L = saring(), ent = L.reduce((s, a) => s + a.ent.length, 0), ev = f.ev && S.NPev[f.ev];
  const lebih = d.atlet.filter(a => a.ent.length > d.maks).length;
  el.innerHTML = `<div class="np-sum"><span><b>${L.length}</b> atlet</span><span><b>${ent}</b> entri nomor</span>${lebih ? `<span class="err-t"><b>${lebih}</b> atlet melebihi batas ${d.maks} nomor</span>` : ''}${ev && bisaStart(d.fase) ? `<button class="k-btn sm k-navy" data-act="np-start" data-id="${E(ev.id)}"><i class="bi bi-list-ol"></i> Susun ulang start list #${ev.no}</button>` : ''}</div>
${L.slice(0, f.n).map(kartuAtlet).join('') || empty('bi-search', 'Tidak ada atlet yang cocok dengan saringan.')}
${L.length > f.n ? `<div class="k-bar" style="justify-content:center"><button class="k-btn k-ghostw" data-act="np-lagi">Tampilkan ${Math.min(HAL, L.length - f.n)} atlet lagi (${L.length - f.n} tersisa)</button></div>` : ''}`;
}
const segar = () => { clearTimeout(S._npT); S._npT = setTimeout(() => { S.npF.n = HAL; gambarDaftar(); }, 140); };
INP['np-q'] = i => { S.npF.q = i.value; segar(); };
['ev', 'jk', 'g', 'x'].forEach(k => { INP['np-' + k] = i => { S.npF[k] = i.value; S.npF.n = HAL; gambarDaftar(); }; });
ACT['np-lagi'] = () => { S.npF.n += HAL; gambarDaftar(); };

/* ── Form bersama: dipakai di halaman ini dan di Akun & Berkas → Detail ── */
const atletOf = id => (S.NP && S.NP.atlet.find(a => a.id === id)) || ((S.akDet || {}).atlet || []).map(t => ({ id: t.id, nama: t.nama, g: t.g, jk: t.jk, ent: t.ent.map(e => ({ id: e.id, eid: e.eid, seed: e.seed || '', sl: 0 })) })).find(a => a.id === id);
const daftarNomor = () => (S.NP ? S.NP.nomor : (S.B.events || []).map(e => ({ id: e.id, no: e.no, nama: e.nama, g: e.g, jk: e.jk, a: 1 })));
function opsiNomor(a, semua, kecuali) {
  const ada = {}; a.ent.forEach(e => { ada[e.eid] = 1; });
  return daftarNomor().filter(e => e.a && e.g === a.g && (semua || e.jk === a.jk) && !ada[e.id] && e.id !== kecuali).map(e => `<option value="${e.id}">#${e.no} · ${E(e.nama)} ${E(jn(e.jk))}</option>`).join('');
}
const fase = () => (S.NP ? S.NP.fase : (S.B.cfg || {}).fase || 'PENDAFTARAN');
// Cara masuk start list setelah start list tersusun: sisip ke lintasan kosong (bawaan, atlet lain tidak berpindah) atau susun ulang semua seri.
const pilihStart = ket => adaStart(fase()) ? `<label class="k-f np-st"><span>Masuk start list${ket ? ' ' + ket : ''}</span><select class="k-in" name="start"><option value="sisip">Sisipkan ke lintasan kosong — atlet lain tidak berpindah</option>${bisaStart(fase()) ? '<option value="susun">Susun ulang semua seri nomor ini (lintasan atlet lain bisa berubah)</option>' : ''}<option value="">Jangan dulu</option></select></label>` : '';
const pilihSeed = () => adaStart(fase()) ? `<label class="k-f np-st"><span>Di start list</span><select class="k-in" name="start"><option value="tetap">Perbarui waktunya saja — seri & lintasan tetap</option>${bisaStart(fase()) ? '<option value="susun">Susun ulang seri & lintasan nomor ini mengikuti seed baru</option>' : ''}</select></label>` : '';
const buka = (host, html) => { const el = $(host); if (!el) return null; if (el.innerHTML) { el.innerHTML = ''; return null; } $$('.np-fh').forEach(x => { if (x !== el) x.innerHTML = ''; }); el.innerHTML = html; const i = el.querySelector('select,input:not([type=checkbox])'); if (i) i.focus(); return el; };
ACT['np-tambah'] = a => {
  const t = atletOf(a.dataset.a); if (!t) return; const maks = S.NP ? S.NP.maks : Number((S.B.cfg || {}).max_individu) || 3, penuh = t.ent.length >= maks;
  buka('#np-t-' + CSS.escape(t.id), `<form class="np-form" data-submit="np-tambah" data-a="${E(t.id)}"><b class="sm">Tambah nomor untuk ${E(t.nama)}</b>
<div class="np-fr"><select class="k-in" name="eid" required aria-label="Nomor lomba">${opsiNomor(t, false) || '<option value="">Tidak ada nomor lain di kelompok ini</option>'}</select><input class="k-in mono" name="seed" placeholder="Seed time, mis. 00:45.12 (kosong = NT)" aria-label="Seed time" autocomplete="off"></div>
<div class="np-ck"><label class="k-check1 sm"><input type="checkbox" name="semua" data-chg="np-semua" data-a="${E(t.id)}"> Tampilkan kelompok lain (izinkan beda kelompok)</label><label class="k-check1 sm"><input type="checkbox" name="lunas" checked> Sudah lunas / dibebaskan</label><label class="k-check1 sm"><input type="checkbox" name="biaya" checked> Hitung biaya nomor ini di laporan</label>
${penuh ? `<label class="k-check1 sm warn-t"><input type="checkbox" name="lewati"> Abaikan batas ${maks} nomor & kuota (atlet sudah ${t.ent.length} nomor)</label>` : '<label class="k-check1 sm"><input type="checkbox" name="lewati"> Abaikan kuota nomor bila penuh</label>'}</div>${pilihStart()}
<div class="k-bar"><button type="button" class="k-btn sm k-ghostw" data-act="np-tutup">Batal</button><button class="k-btn sm k-orange"><i class="bi bi-plus-lg"></i> Tambahkan</button></div></form>`);
};
INP['np-semua'] = c => { const f = c.closest('form'), s = f && f.querySelector('select[name=eid]'), t = atletOf(c.dataset.a); if (s && t) s.innerHTML = opsiNomor(t, c.checked, f.dataset.kec || '') || '<option value="">Tidak ada nomor</option>'; };
ACT['np-tutup'] = a => { const h = a.closest('.np-fh'); if (h) h.innerHTML = ''; };
const selesai = async (r, b) => {
  toast(r.message, r.data && r.data.start && r.data.start.ok === false ? 'warn' : 'ok'); bustCache('peserta'); bustCache('adash'); bustCache('jd'); bustCache('akun');
  if (S.akOpen && $('#modal .k-mb') && !$('#np-list')) { ACT['akun-open']({ dataset: { id: S.akOpen } }); return; }
  try { const d = (await rp('sa.peserta')).data; S.NP = d; S.NPev = {}; d.nomor.forEach(e => { S.NPev[e.id] = e; }); gambarDaftar(); } catch (e) { busy(b, false); }
};
SUBMIT['np-tambah'] = async f => {
  const d = form(f), b = $('button.k-orange', f); if (!d.eid) return toast('Pilih nomor lomba.', 'err'); busy(b, true);
  try { await selesai(await rp('sa.entri.tambah', { aid: f.dataset.a, eid: d.eid, seed: d.seed || '', paksa: !!d.semua, lunas: !!d.lunas, biaya: !!d.biaya, lewati: !!d.lewati, start: d.start || '' }), b); }
  catch (e) { toast(e.message, 'err'); busy(b, false); if (/Abaikan batas/.test(e.message)) { const c = f.querySelector('[name=lewati]'); if (c) c.closest('label').classList.add('warn-t'); } }
};
ACT['np-pindah'] = a => {
  const t = atletOf(a.dataset.a), e = t && t.ent.find(x => x.id === a.dataset.id); if (!e) return; const ev = (S.NPev || {})[e.eid] || {};
  buka('#np-e-' + CSS.escape(e.id), `<form class="np-form" data-submit="np-pindah" data-id="${E(e.id)}" data-kec="${E(e.eid)}"><span class="sm mut">Pindahkan dari <b>#${ev.no || '?'} ${E(ev.nama || '')}</b> ke:</span>
<div class="np-fr"><select class="k-in" name="eid" required aria-label="Nomor tujuan">${opsiNomor(t, false, e.eid) || '<option value="">Tidak ada nomor lain di kelompok ini</option>'}</select><input class="k-in mono" name="seed" value="${E(e.seed || '')}" placeholder="Seed time (kosong = NT)" aria-label="Seed time di nomor tujuan" autocomplete="off"></div>
<div class="np-ck"><label class="k-check1 sm"><input type="checkbox" name="semua" data-chg="np-semua" data-a="${E(t.id)}"> Izinkan beda kelompok</label></div>${pilihStart('(nomor tujuan)')}
<div class="k-bar"><button type="button" class="k-btn sm k-ghostw" data-act="np-tutup">Batal</button><button class="k-btn sm k-orange">Pindahkan</button></div></form>`);
};
SUBMIT['np-pindah'] = async f => {
  const d = form(f), b = $('button.k-orange', f); if (!d.eid) return toast('Pilih nomor tujuan.', 'err'); busy(b, true);
  try { await selesai(await rp('sa.entri.ubah', { id: f.dataset.id, eid: d.eid, seed: d.seed || '', paksa: !!d.semua, start: d.start || '' }), b); } catch (e) { toast(e.message, 'err'); busy(b, false); }
};
ACT['np-seed'] = a => {
  const t = atletOf(a.dataset.a), e = t && t.ent.find(x => x.id === a.dataset.id); if (!e) return;
  buka('#np-e-' + CSS.escape(e.id), `<form class="np-form" data-submit="np-seed" data-id="${E(e.id)}"><div class="np-fr"><input class="k-in mono" name="seed" value="${E(e.seed || '')}" placeholder="Seed time, mis. 00:45.12 (kosong = NT)" aria-label="Seed time baru" autocomplete="off"></div>${e.sl ? pilihSeed() : ''}
<div class="k-bar"><button type="button" class="k-btn sm k-ghostw" data-act="np-tutup">Batal</button><button class="k-btn sm k-orange">Simpan seed time</button></div></form>`);
};
SUBMIT['np-seed'] = async f => { const d = form(f), b = $('button.k-orange', f); busy(b, true); try { await selesai(await rp('sa.entri.ubah', { id: f.dataset.id, seed: d.seed || '', start: d.start || 'tetap' }), b); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
ACT['np-data'] = a => {
  const t = (S.NP && S.NP.atlet.find(x => x.id === a.dataset.a)); if (!t) return;
  const inp = (n, v, l, at) => `<label class="k-f"><span>${l}</span><input class="k-in" name="${n}" value="${E(v == null ? '' : v)}" ${at || ''}></label>`;
  buka('#np-d-' + CSS.escape(t.id), `<form class="np-form" data-submit="np-data" data-a="${E(t.id)}"><b class="sm">Ubah data ${E(t.nama)}</b>
<div class="np-dg">${inp('nama', t.nama, 'Nama lengkap', 'required minlength="3" autocomplete="off"')}
<label class="k-f"><span>Jenis kelamin</span><select class="k-in" name="g"><option value="PUTRA"${t.g === 'PUTRA' ? ' selected' : ''}>Putra</option><option value="PUTRI"${t.g === 'PUTRI' ? ' selected' : ''}>Putri</option></select></label>
<label class="k-f"><span>Kelas</span><select class="k-in" name="kelas">${Array.from({ length: 13 }, (_, i) => `<option value="${i}"${Number(t.kelas) === i ? ' selected' : ''}>${i === 0 ? 'TK' : 'Kelas ' + i}</option>`).join('')}</select></label>
${inp('tgl', t.tgl, 'Tanggal lahir', 'type="date"')}${inp('tmp', t.tmp, 'Tempat lahir')}${inp('nisn', t.nisn, 'NISN', 'inputmode="numeric" maxlength="10" autocomplete="off"')}
${inp('sk', t.sk, 'Sekolah')}${inp('kl', t.kl, 'Klub')}${inp('kota', t.kota, 'Kab/Kota')}${inp('prov', t.prov, 'Provinsi')}${inp('hp', t.hp, 'No. HP', 'inputmode="tel"')}</div>
<p class="sm mut" style="margin:0">Hanya isian yang berubah yang disimpan. Start list, hasil, dan ID card langsung memakai data baru; nomor lomba tidak berubah.</p>
<div class="k-bar"><button type="button" class="k-btn sm k-ghostw" data-act="np-tutup">Batal</button><button class="k-btn sm k-orange"><i class="bi bi-check2"></i> Simpan data</button></div></form>`);
};
SUBMIT['np-data'] = async f => {
  const t = S.NP.atlet.find(x => x.id === f.dataset.a), d = form(f), b = $('button.k-orange', f), kunci = { nama: 'nama', g: 'g', kelas: 'kelas', tgl: 'tgl', tmp: 'tmp', nisn: 'nisn', sk: 'sk', kl: 'kl', kota: 'kota', prov: 'prov', hp: 'hp' }, data = {};
  Object.keys(kunci).forEach(k => { const v = String(d[k] == null ? '' : d[k]).trim(), lama = String(t[kunci[k]] == null ? '' : t[kunci[k]]); if (v !== lama) data[k] = v; });
  if (!Object.keys(data).length) return toast('Tidak ada perubahan.', 'warn');
  if (data.g && t.ent.length && !(await ask(`Ubah jenis kelamin ${E(t.nama)}? Nomor lomba ${t.g === 'PUTRA' ? 'putra' : 'putri'} yang sudah terdaftar harus dipindah dulu.`, 'Lanjutkan'))) return;
  busy(b, true);
  try { const r = await rp('sa.atlet.ubah', { id: t.id, data }); await selesai(r, b); if (r.data && r.data.bedaKel && r.data.bedaKel.length) toast('Nomor ' + r.data.bedaKel.join(', ') + ' kini beda kelompok dengan kelas baru.', 'warn'); }
  catch (e) { toast(e.message, 'err'); busy(b, false); }
};
ACT['np-hapus'] = async a => {
  if (!(await ask(`Hapus nomor <b>${E(a.dataset.n)}</b> dari pendaftaran atlet? Biaya nomor ini tidak dihitung lagi dan atlet dikeluarkan dari start list nomor tersebut.`, 'Hapus nomor', true))) return;
  try { await selesai(await rp('sa.entri.hapus', { id: a.dataset.id })); } catch (e) { toast(e.message, 'err'); }
};
ACT['np-start'] = async a => {
  const ev = S.NPev[a.dataset.id]; if (!(await ask(`Susun ulang start list <b>#${ev.no} ${E(ev.nama)}</b>? Seri & lintasan dihitung ulang dari seed time peserta yang sah dan lunas.${S.NP.fase === 'BUKU_ACARA' ? ' Terbitkan ulang Buku Acara setelahnya.' : ''}`, 'Susun ulang'))) return;
  busy(a, true); try { const r = await rp('s.run', { id: a.dataset.id }); toast(r.message); bustCache('peserta'); go('a-nomor'); } catch (e) { toast(e.message, 'err'); busy(a, false); }
};
KRP.PRE['a-nomor'] = () => [['peserta', 'sa.peserta', {}, 15000]];
})();

(function () {
'use strict';
/* ===== Best Swimmer (Super Admin): calon 3 besar tiap kelompok putra & putri, kirim/cabut gelar, rekor nasional acuan.
   Urutan: medali (emas dulu seperti klasemen, atau total medali), bila sama → poin rekor nasional = Σ 1000 × (rekor ÷ waktu)³. ===== */
const { $, E, S, V, ACT, SUBMIT, INP, rp, swr, toast, busy, ph, card, alertx, empty, ask, bustCache, jn, form, go, modal, closeModal, field, fdt, loadScript } = KRP;
const main = h => { $('#main').innerHTML = h; };
const GL = g => g === 'PUTRI' ? 'Putri' : 'Putra';
const NR_URL = 'https://www.worldaquatics.com/swimming/records?recordCode=NR&eventTypeId=&region=&countryId=0e3db4d6-e413-424d-8eef-5c645699afe2&gender=M&pool=SCM';
const md = (k) => `<span class="bs-md"><span class="md g" title="Emas">${k.e}</span><span class="md s" title="Perak">${k.p}</span><span class="md b" title="Perunggu">${k.b}</span></span>`;
const medali = m => m === 'EMAS' ? '<span class="md g">E</span>' : m === 'PERAK' ? '<span class="md s">P</span>' : m === 'PERUNGGU' ? '<span class="md b">B</span>' : '–';
const rincian = k => `<div class="k-scroll"><table class="k-table bs-rinci"><thead><tr><th>No</th><th>Nomor</th><th>Waktu</th><th>Rank</th><th>Rekor nasional acuan</th><th>Poin</th></tr></thead><tbody>${k.nomor.map(n => `<tr><td class="mono">#${n.no}</td><td>${E(n.nama)}</td><td class="mono">${E(n.waktu)}</td><td>${n.rank || '–'} ${medali(n.medal)}</td><td>${n.acuan ? `<b class="mono">${E(n.acuan)}</b> <small class="mut">${E(n.ket)}</small>` : `<small class="warn-t">${E(n.ket)}</small>`}</td><td class="mono"><b>${n.poin}</b></td></tr>`).join('')}</tbody><tfoot><tr><td colspan="5" style="text-align:right">Total poin</td><td class="mono"><b>${k.poin}</b></td></tr></tfoot></table></div>`;
const baris = (G, k, i) => `<div class="bs-row${i === 0 ? ' top' : ''}"><span class="rk${k.rank === 1 ? ' g' : k.rank === 2 ? ' s' : k.rank === 3 ? ' b' : ''}">${k.rank}</span>
<div class="bs-who"><b>${E(k.nama)}</b><small class="mut">${E(k.kont || '')}</small></div>${md(k)}
<div class="bs-st"><span><small class="mut">Medali</small><b class="mono">${k.e + k.p + k.b}</b></span><span><small class="mut">Poin rekor</small><b class="mono">${k.poin}</b></span></div>
<div class="bs-act"><button class="k-btn ${G.gelar && G.gelar.aid === k.aid ? 'k-ghostw' : i === 0 ? 'k-orange' : 'k-outline'} sm" data-act="bs-kirim" data-jk="${E(G.jk)}" data-g="${G.g}" data-aid="${E(k.aid)}"><i class="bi bi-trophy"></i> ${G.gelar && G.gelar.aid === k.aid ? 'Kirim ulang' : 'Kirim gelar'}</button></div>
<details class="bs-det"><summary>Rincian ${k.nomor.length} nomor</summary>${rincian(k)}</details></div>`;
function grupCard(G) {
  const top = G.kandidat.slice(0, 3), sisa = G.kandidat.slice(3);
  const kanan = G.gelar ? `<span class="k-pill k-ok"><i class="bi bi-trophy-fill"></i> Terkirim</span>` : `<span class="k-pill k-neu">${G.n} perenang</span>`;
  return card(`${E(jn(G.jk))} · ${GL(G.g)}`, `${G.gelar ? alertx('ok', `Gelar Best Swimmer dikirim ke <b>${E(G.gelar.nama)}</b> · ${E(G.gelar.event)}<br><small>oleh ${E(G.gelar.oleh || '')} · ${fdt(G.gelar.at)}</small> <button class="k-btn k-ghostw sm" data-act="bs-cabut" data-id="${E(G.gelar.id)}" data-nm="${E(G.gelar.nama)}">Cabut</button>`, 'bi-trophy-fill') : ''}
${G.belum ? alertx('warn', `<b>${G.belum}</b> nomor di kelompok ini belum disahkan wasit, jadi belum dihitung.`) : ''}
${top.length ? `<p class="mut sm" style="margin:0 0 6px">Calon 3 besar</p>${top.map((k, i) => baris(G, k, i)).join('')}` : '<p class="mut">Belum ada hasil yang disahkan.</p>'}
${sisa.length ? `<details class="bs-more"><summary>Peringkat ${sisa.length > 1 ? '4–' + (3 + sisa.length) : '4'}</summary>${sisa.map((k, i) => baris(G, k, i + 3)).join('')}</details>` : ''}`, kanan);
}
function rekorCard(R) {
  const urut = { 'Gaya Bebas': 1, 'Gaya Punggung': 2, 'Gaya Dada': 3, 'Gaya Kupu-kupu': 4, 'Gaya Ganti Perorangan': 5 };
  const grp = {}; R.rows.forEach(r => (grp[r.kol + ' · ' + GL(r.g)] = grp[r.kol + ' · ' + GL(r.g)] || []).push(r));
  const tabel = Object.keys(grp).sort().map(k => `<details class="bs-nr"><summary>${E(k)} <small class="mut">${grp[k].length} nomor</small></summary><div class="k-scroll"><table class="k-table"><thead><tr><th>Nomor</th><th>Rekor</th><th>Split 25 m</th><th>Pemegang</th><th>Tanggal</th></tr></thead><tbody>${grp[k].sort((a, b) => urut[a.gaya] - urut[b.gaya] || a.jarak - b.jarak).map(r => `<tr><td>${r.jarak}m ${E(r.gaya)}</td><td class="mono"><b>${E(r.waktu)}</b></td><td class="mono">${E(r.s25 || '–')}</td><td>${E(r.nama)}</td><td class="mono">${E(r.tgl)}</td></tr>`).join('')}</tbody></table></div></details>`).join('');
  return card('Rekor nasional acuan', `<p>${R.info.bawaan ? 'Data bawaan' : 'Diimpor'}: <b>${E(R.info.sumber)}</b>${R.info.at ? ` · ${fdt(R.info.at)} oleh ${E(R.info.oleh || '')}` : ''} · ${R.n} nomor perorangan.</p>
<ol class="np-langkah"><li>Buka <a href="${NR_URL}" target="_blank" rel="noopener">halaman rekor nasional World Aquatics</a>, pilih <b>Gender</b> dan <b>Pool</b> (SCM/LCM), lalu klik <b>Export</b>.</li><li>Impor satu atau beberapa file <code>RecordsExport…xlsx</code> sekaligus. Hanya rekor berstatus <i>Approved</i> yang dipakai; nomor yang tidak ada di file tetap memakai rekor lama.</li></ol>
<div class="k-qa"><label class="k-btn k-navy sm" style="cursor:pointer"><i class="bi bi-file-earmark-arrow-up"></i> Impor file World Aquatics<input type="file" accept=".xlsx,.xls" multiple hidden data-chg="bs-file"></label>${R.info.bawaan ? '' : '<button class="k-btn k-ghostw sm" data-act="bs-reset">Kembalikan data bawaan</button>'}</div>${tabel}`);
}
V['a-best'] = function () {
  const q = S.bsMus ? { musim: S.bsMus } : {};
  swr('best_' + (S.bsMus || ''), 'bs.get', q, d => {
    S.bsD = d;
    const aturan = d.mode === 'TOTAL' ? 'total medali terbanyak' : 'emas terbanyak, lalu perak, lalu perunggu (seperti klasemen)';
    main(`<div class="k-wrap pad">${ph('Best Swimmer', 'Perenang terbaik tiap kelompok putra & putri · hanya Super Admin')}
<div class="bs-bar">${d.musimList.length > 1 ? `<label class="k-f" style="margin:0"><span>Musim</span><select class="k-in" data-chg="bs-mus">${d.musimList.map(m => `<option${m === d.musim ? ' selected' : ''}>${E(m)}</option>`).join('')}</select></label>` : ''}<div><small class="mut">Urutan medali</small><div class="k-seg"><button class="${d.mode === 'EMAS' ? 'on' : ''}" data-act="bs-mode" data-v="EMAS">Emas dulu</button><button class="${d.mode === 'TOTAL' ? 'on' : ''}" data-act="bs-mode" data-v="TOTAL">Total medali</button></div></div></div>
${alertx('info', `Peringkat dari hasil yang <b>sudah disahkan wasit</b>. Urutan: ${aturan}. Bila sama, menang yang <b>poin rekor nasional</b>-nya lebih besar: tiap nomor bernilai 1000 × (rekor nasional ÷ waktu)³, lalu dijumlah. Nomor 25 m memakai split 25 m dari rekor 50 m gaya yang sama (atau ½ rekor 50 m).`, 'bi-info-circle')}
${d.grup.length ? d.grup.map(grupCard).join('') : empty('bi-trophy', 'Belum ada hasil lomba yang disahkan wasit pada musim ini.')}
${rekorCard(d.rekor)}</div>`);
  }, 5000);
};
const segar = () => { bustCache('best_'); go('a-best'); };
INP['bs-mus'] = s => { S.bsMus = s.value; go('a-best'); };
ACT['bs-mode'] = async a => { if (a.classList.contains('on')) return; busy(a, true); try { const r = await rp('bs.mode', { mode: a.dataset.v }); toast(r.message); segar(); } catch (e) { toast(e.message, 'err'); busy(a, false); } };
ACT['bs-kirim'] = a => {
  const d = S.bsD, G = d.grup.filter(x => x.jk === a.dataset.jk && x.g === a.dataset.g)[0], k = G && G.kandidat.filter(x => x.aid === a.dataset.aid)[0]; if (!k) return;
  const ganti = G.gelar && G.gelar.aid !== k.aid;
  modal('Kirim gelar Best Swimmer', `<form data-submit="bs-kirim" data-jk="${E(G.jk)}" data-g="${G.g}" data-aid="${E(k.aid)}" data-ganti="${G.gelar ? 1 : 0}">
<div class="bs-sum"><i class="bi bi-trophy-fill"></i><div><b>${E(k.nama)}</b><small class="mut">${E(k.kont || '')}</small><small>Best Swimmer ${E(jn(G.jk))} ${GL(G.g)} · peringkat ${k.rank} · ${k.e} emas, ${k.p} perak, ${k.b} perunggu · ${k.poin} poin</small></div></div>
${ganti ? alertx('warn', `Gelar kelompok ini sudah dikirim ke <b>${E(G.gelar.nama)}</b>. Mengirim ke ${E(k.nama)} akan menggantinya.`) : G.gelar ? alertx('info', 'Gelar sudah dikirim ke atlet ini; kirim ulang untuk mengubah nama event.') : ''}
${field('Nama event', `<input class="k-in" name="event" value="${E(G.gelar ? G.gelar.event : d.eventDefault)}" required minlength="3" maxlength="120">`, 1, 'Tampil di profil atlet, mis. nama kejuaraan dan musimnya.')}
<label class="sa-op"><input type="checkbox" name="email" checked><span><b>Kirim email pemberitahuan ke akun</b><small>Ke email penanggung jawab sekolah/klub atlet, bila tersedia.</small></span></label>
<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">${ganti ? 'Ganti penerima' : 'Kirim gelar'}</button></div></form>`);
};
SUBMIT['bs-kirim'] = async f => {
  const b = $('button.k-orange', f), v = form(f); busy(b, true);
  try { const r = await rp('bs.kirim', { musim: S.bsD.musim, jk: f.dataset.jk, g: f.dataset.g, aid: f.dataset.aid, event: v.event, email: !!$('[name=email]', f).checked, ganti: f.dataset.ganti === '1' }); toast(r.message); closeModal(); bustCache('pf_'); segar(); }
  catch (e) { toast(e.message, 'err'); busy(b, false); }
};
ACT['bs-cabut'] = async a => { if (!(await ask(`Cabut gelar Best Swimmer ${a.dataset.nm}? Gelar tidak tampil lagi di profil atlet.`, 'Cabut gelar', true))) return; busy(a, true); try { const r = await rp('bs.cabut', { musim: S.bsD.musim, id: a.dataset.id }); toast(r.message); bustCache('pf_'); segar(); } catch (e) { toast(e.message, 'err'); busy(a, false); } };
ACT['bs-reset'] = async a => { if (!(await ask('Kembalikan rekor nasional ke data bawaan aplikasi?', 'Kembalikan'))) return; busy(a, true); try { const r = await rp('bs.rekor', { reset: true }); toast(r.message); segar(); } catch (e) { toast(e.message, 'err'); busy(a, false); } };
// Baca file ekspor rekor World Aquatics (RecordsExport.xlsx): Event, Pool, Time, Athlete, Date, Splits, Status
const GAYA_EN = { Freestyle: 'Gaya Bebas', Backstroke: 'Gaya Punggung', Breaststroke: 'Gaya Dada', Butterfly: 'Gaya Kupu-kupu', Medley: 'Gaya Ganti Perorangan' };
const keMs = t => { const p = String(t == null ? '' : t).trim().split(':'); if (!p[0]) return 0; const s = parseFloat(p.pop()), m = p.length ? parseInt(p.pop(), 10) : 0, h = p.length ? parseInt(p.pop(), 10) : 0; return isNaN(s) ? 0 : Math.round((h * 3600 + m * 60 + s) * 1000); };
const tgl = v => v instanceof Date ? new Date(v.getTime() - v.getTimezoneOffset() * 60000).toISOString().slice(0, 10) : String(v || '').slice(0, 10);
function bacaRekor(rows) {
  const hi = rows.findIndex(r => r && r.indexOf('Event') >= 0 && r.indexOf('Time') >= 0); if (hi < 0) return [];
  const H = rows[hi], c = n => H.indexOf(n), out = [];
  rows.slice(hi + 1).forEach(r => {
    const m = /^(Men|Women)'s (\d+)m (Freestyle|Backstroke|Breaststroke|Butterfly|Medley)$/.exec(String(r[c('Event')] || '').trim());
    if (!m || String(r[c('Status')] || '').trim() !== 'Approved') return;
    const ms = keMs(r[c('Time')]), d = Number(m[2]); if (!ms) return;
    const sp = String(r[c('Splits')] || '').split(',').map(x => x.trim()).filter(Boolean), s1 = d === 50 && sp.length >= 2 ? keMs(sp[0]) : 0;
    out.push([String(r[c('Pool')] || '').trim(), m[1] === 'Men' ? 'PUTRA' : 'PUTRI', d, GAYA_EN[m[3]], ms, s1 > ms * 0.4 && s1 < ms * 0.6 ? s1 : 0, String(r[c('Athlete')] || '').trim(), tgl(r[c('Date')])]);
  });
  return out;
}
INP['bs-file'] = async i => {
  const fs = Array.from(i.files || []); if (!fs.length) return;
  try {
    await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
    const best = {};
    for (const f of fs) { const wb = XLSX.read(await f.arrayBuffer(), { cellDates: true }); wb.SheetNames.forEach(n => bacaRekor(XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: '' })).forEach(r => { const k = r.slice(0, 4).join('|'); if (!best[k] || r[4] < best[k][4]) best[k] = r; })); }
    const data = Object.keys(best).map(k => best[k]);
    if (!data.length) { toast('Tidak ada rekor Approved yang terbaca. Pastikan file berasal dari tombol Export di halaman rekor World Aquatics.', 'err'); i.value = ''; return; }
    if (!(await ask(`Perbarui ${data.length} rekor nasional dari ${fs.length} file? Nomor yang tidak ada di file tetap memakai rekor lama.`, 'Perbarui rekor'))) { i.value = ''; return; }
    const r = await rp('bs.rekor', { data, sumber: fs.map(f => f.name).join(', ') }); toast(r.message); segar();
  } catch (e) { toast(e.message, 'err'); }
  i.value = '';
};
})();
