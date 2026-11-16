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
    const i = FASE.indexOf(d.fase), nm = d.nomorStart;
    const step = (k, t, ds) => { const j = FASE.indexOf(k), cls = j < i ? 'done' : j === i ? 'cur' : ''; return `<li class="${cls}"><span>${j < i ? '<i class="bi bi-check-lg"></i>' : j + 1}</span><div><h4>${t}</h4><p class="mut sm">${ds}</p></div></li>`; };
    main(`<div class="k-wrap pad">${ph('Tahapan Event', `Musim ${E(d.musim)} — kendalikan alur dari pendaftaran sampai pelaksanaan`)}
<div class="k-kpis">${kpi('Tahap saat ini', E(FASE_L[d.fase]), 'bi-signpost-split')}${kpi('Atlet terdaftar', d.atlet, 'bi-people')}${kpi('Perlu diproses', d.menunggu, 'bi-hourglass-split', 'menunggu / revisi')}${kpi('Nomor bersusun', nm, 'bi-list-ol')}</div>
<ol class="k-stepper">${step('PENDAFTARAN', 'Pendaftaran', d.buka ? 'Dibuka' + (d.deadline ? ' sampai ' + fdt(d.deadline) : '') + '. Akun dapat mendaftarkan atlet & nomor.' : 'Ditutup — tidak ada pendaftar baru.')}${step('VERIFIKASI', 'Verifikasi', 'Admin Pendaftaran memeriksa berkas dan pembayaran.')}${step('STARTLIST', 'Start list', 'Seeding otomatis (spearhead) hanya dari peserta sah dan lunas.')}${step('BUKU_ACARA', 'Buku acara', 'Buku acara terbit di portal dengan estimasi jam tiap nomor.')}${step('PELAKSANAAN', 'Pelaksanaan', 'Admin Input Data mengisi hasil, Wasit mengesahkan dengan tanda tangan.')}${step('SELESAI', 'Selesai & arsip', 'Tutup event dan arsipkan musim.')}</ol>
<div class="k-card"><div class="k-card-h"><h3>Tindakan</h3></div><div class="k-card-b" id="fase-act">${faseAct(d)}</div></div></div>`);
  }, 3000);
};
function faseAct(d) {
  const f = d.fase, btn = (ke, label, cls, ic) => `<button class="k-btn lg ${cls}" data-act="fase" data-ke="${ke}"><i class="bi ${ic}"></i> ${label}</button>`;
  if (f === 'PENDAFTARAN') return `<p>Tutup pendaftaran pada batas waktu yang ditetapkan. Setelah ditutup, <b>tidak ada lagi peserta yang dapat mendaftar</b>.</p><label class="k-ev" style="display:block"><label><input type="checkbox" id="fase-email"> <span>Kirim email pemberitahuan ke semua akun pendaftar</span></label></label><div class="k-qa">${btn('VERIFIKASI', 'Tutup Pendaftaran', 'k-orange', 'bi-door-closed')}<button class="k-btn lg k-outline" data-act="kurang">Periksa nomor kurang peserta</button><button class="k-btn lg k-ghostw" data-go="a-cfg">Atur batas waktu</button></div>`;
  if (f === 'VERIFIKASI') return `${d.menunggu ? alertx('warn', `Masih ada <b>${d.menunggu}</b> atlet menunggu/perlu revisi. Hanya yang sah dan lunas masuk start list.`) : alertx('ok', 'Seluruh pendaftar sudah diproses.')}<div class="k-qa">${btn('STARTLIST', 'Susun Start List', 'k-orange', 'bi-list-ol')}<button class="k-btn lg k-outline" data-go="a-verif">Buka verifikasi</button><button class="k-btn lg k-ghostw" data-act="fase-buka">Buka kembali pendaftaran</button></div>`;
  if (f === 'STARTLIST') return `<p>Start list tersusun untuk <b>${d.nomorStart}</b> nomor. Periksa jadwal estimasi, lalu terbitkan buku acara.</p><div class="k-qa">${btn('BUKU_ACARA', 'Terbitkan Buku Acara', 'k-orange', 'bi-journal-text')}<button class="k-btn lg k-outline" data-act="seed">Susun ulang start list</button><button class="k-btn lg k-ghostw" data-go="a-jadwal">Atur jadwal</button><button class="k-btn lg k-ghostw" data-go="a-dok">Dokumen & logo</button></div>`;
  if (f === 'BUKU_ACARA') return `${alertx('ok', d.bukuAcara ? 'Buku acara sudah dipublikasikan di portal.' : 'Buku acara dibuat.')}<div class="k-qa">${btn('PELAKSANAAN', 'Mulai Pelaksanaan', 'k-orange', 'bi-play-circle')}<button class="k-btn lg k-outline" data-go="a-dok">Kelola dokumen</button></div>`;
  if (f === 'PELAKSANAAN') return `<p>Pelaksanaan berlangsung. Input hasil dibuka untuk Admin Input Data.</p><div class="k-qa"><button class="k-btn lg k-navy" data-go="a-hasil">Input hasil</button><button class="k-btn lg k-outline" data-go="a-wasit">Pengesahan wasit</button><button class="k-btn lg k-ghostw" data-go="a-ars">Tutup event & arsip</button></div>`;
  return '<p>Event telah diselesaikan dan diarsipkan.</p>';
}
ACT.fase = async a => {
  const ke = a.dataset.ke, em = $('#fase-email') && $('#fase-email').checked, T = { VERIFIKASI: 'Tutup pendaftaran sekarang? Setelah ditutup tidak ada peserta yang bisa mendaftar lagi.', STARTLIST: 'Susun start list dari peserta sah dan lunas?', BUKU_ACARA: 'Terbitkan buku acara ke portal publik?', PELAKSANAAN: 'Mulai pelaksanaan? Input hasil akan dibuka.' };
  if (!(await ask(T[ke] || 'Lanjutkan?', 'Ya, lanjutkan'))) return; busy(a, true);
  try { const r = await rp('fase.set', { ke, email: em }); toast(r.message); await refreshAll(); go('a-fase'); } catch (e) { toast(e.message, 'err'); busy(a, false); }
};
ACT['fase-buka'] = () => modal('Buka kembali pendaftaran', `<form data-submit="fasebuka">${field('Alasan', '<textarea class="k-in" name="alasan" rows="3" required minlength="5"></textarea>', 1)}<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">Buka kembali</button></div></form>`);
SUBMIT.fasebuka = async f => { const b = $('button.k-orange', f); busy(b, true); try { const r = await rp('fase.set', { ke: 'PENDAFTARAN', alasan: form(f).alasan }); toast(r.message); closeModal(); await refreshAll(); go('a-fase'); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
ACT.seed = async a => { if (!(await ask('Susun ulang start list? Nomor yang sudah punya hasil tidak diubah.'))) return; busy(a, true); try { const r = await rp('s.run', { id: 'ALL' }); toast(r.message); bustCache(); go('a-fase'); } catch (e) { toast(e.message, 'err'); busy(a, false); } };
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
<h4 style="margin:6px 0 10px">Atlet (${d.atlet.length})</h4>${d.atlet.map(t => `<div class="k-card"><div class="k-card-b"><div class="who"><div><b>${E(t.nama)}</b> <span class="mono mut">${E(t.bib)}</span> ${pill(t.st)}<br><small class="mut">NISN ${E(t.nisn)} · ${G_L[t.g]} · ${E(t.tmp)}, ${fdt(t.tgl)} · Kelas ${kls(t.kelas)} · ${E(jn(t.jk))}<br>${E(t.sk)}${t.kl ? ' / ' + E(t.kl) : ''} · ${E(t.wl)} · HP ${E(t.hp)}</small></div></div><div class="k-chips" style="margin:8px 0">${[['foto', 'Foto'], ['akta', 'Akte'], ['surat', 'Surat sekolah'], ['sosmed', 'Bukti follow']].map(x => t[x[0]] ? `<button class="k-chip" data-act="akun-file" data-id="${E(t[x[0]])}"><i class="bi bi-paperclip"></i> ${x[1]}</button>` : '').join('')}${t.ent.filter(e => e.bukti).slice(0, 1).map(e => `<button class="k-chip" data-act="akun-file" data-id="${E(e.bukti)}"><i class="bi bi-receipt"></i> Bukti bayar</button>`).join('')}</div><div class="ent-l">${t.ent.map(e => `<div class="ent-r"><span><b>#${e.no}</b> ${E(e.nama)} ${pill(e.v)}</span><span><button class="k-btn sm k-outline" data-act="ent-ubah" data-id="${E(e.id)}" data-a="${E(t.id)}"><i class="bi bi-arrow-left-right"></i> Ubah nomor</button> <button class="k-btn sm k-ghostw" data-act="ent-hapus" data-id="${E(e.id)}" title="Hapus nomor" style="color:var(--er)"><i class="bi bi-x-lg"></i></button></span></div><div id="eu-${E(e.id)}"></div>`).join('') || '<span class="mut sm">Belum ada nomor musim ini</span>'}</div></div></div>`).join('') || '<p class="mut">Belum ada atlet.</p>'}`;
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
${Object.keys(byDay).sort((a, b) => a - b).map(h => card(`Hari ${h}`, `<div class="k-scroll"><table class="k-table"><thead><tr><th>No</th><th>Nomor</th><th>Peserta</th><th>Seri</th><th>Hari</th><th>Urut</th><th>Jam manual</th><th>Estimasi</th><th></th></tr></thead><tbody>${byDay[h].map(r => `<tr><td class="mono">#${r.no}</td><td><b>${E(r.nama)}</b><br><small class="mut">${E(jn(r.jk))} ${G_L[r.g]}</small></td><td>${r.n}</td><td>${r.heats} × ${r.mn}′</td><td><input class="k-in sm" style="width:64px" type="number" min="1" max="9" value="${r.hari}" data-chg="jd-f" data-f="hari" data-id="${E(r.eid)}"></td><td><input class="k-in sm" style="width:72px" type="number" value="${r.urut}" data-chg="jd-f" data-f="urut" data-id="${E(r.eid)}"></td><td><input class="k-in sm" style="width:110px" type="time" value="${E(r.jamManual)}" data-chg="jd-f" data-f="jam" data-id="${E(r.eid)}"></td><td class="mono">${r.n ? `<b>${E(r.mulai)}</b> – ${E(r.selesai)}` : '<span class="mut">—</span>'}${r.bentrok ? ' <span class="k-pill k-warn" title="Jam manual lebih awal dari selesainya nomor sebelumnya">bentrok</span>' : ''}</td><td>${r.manual ? `<button class="k-btn sm k-ghostw" data-act="jd-r" data-id="${E(r.eid)}">Auto</button>` : '<span class="k-pill k-neu">auto</span>'}</td></tr>`).join('')}</tbody></table></div>`, '', true)).join('')}</div>`);
  }, 2000);
};
INP['jd-f'] = async i => { const o = { eid: i.dataset.id }; o[i.dataset.f] = i.value; try { const r = await rp('jd.set', o); S.cache = {}; bustCache('jd'); toast('Jadwal diperbarui.'); await refreshAll(); go('a-jadwal'); } catch (e) { toast(e.message, 'err'); } };
ACT['jd-r'] = async a => { try { await rp('jd.set', { eid: a.dataset.id, reset: true }); await refreshAll(); toast('Kembali ke otomatis.'); go('a-jadwal'); } catch (e) { toast(e.message, 'err'); } };
ACT['jd-reset'] = async () => { if (!(await ask('Hapus semua pengaturan manual (hari, urutan, jam)?', 'Reset', true))) return; try { await rp('jd.set', { resetAll: true }); await refreshAll(); toast('Semua jadwal kembali otomatis.'); go('a-jadwal'); } catch (e) { toast(e.message, 'err'); } };
SUBMIT.jdcfg = async f => { const b = $('button.k-navy', f), d = form(f); busy(b, true); const m = {}; Object.keys(d).forEach(k => { if (/^m\d+$/.test(k) && Number(d[k]) > 0) m[k.slice(1)] = Number(d[k]); }); try { await rp('jd.set', { cfg: { mulai: d.mulai, jeda: d.jeda || '0', menit: JSON.stringify(m) } }); await refreshAll(); toast('Pengaturan jadwal tersimpan.'); go('a-jadwal'); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
})();
