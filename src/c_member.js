(function () {
'use strict';
const { $, $$, E, S, V, ACT, SUBMIT, INP, G_L, TIPE_L, pill, rupiah, fdt, jn, jkDariKelas, feeIdx, kls, thumb, initials, cfgv, rp, swr, bustCache, toast, busy, ph, card, empty, kpi, alertx, field, inp, sel, form, dz, uploadPending, dlB64, go, setSession } = KRP;
const main = h => { $('#main').innerHTML = h; };
const KLS_J = k => jkDariKelas(k); // kelompok mengikuti pengaturan event aktif
const KLS_OPT = [[-1, '— pilih kelas —'], [0, 'TK']].concat(Array.from({ length: 12 }, (_, i) => [i + 1, (i < 6 ? 'SD' : i < 9 ? 'SMP' : 'SMA') + ' Kelas ' + (i + 1)]));
const mboot = cb => swr('mboot', 'm.boot', {}, d => { S.M = d; cb(d); }, 5000);
const refreshM = () => { bustCache('mboot'); };
const EVR = () => (S.M && S.M.ev) || { min: 1, max: (S.M && S.M.maxEv) || 3, mode: 'NOMOR', nomor: {} };
const evN = e => (EVR().nomor || {})[e.id] || { n: 0, q: e.q || 0, b: e.b === 0 ? 0 : 1 };
const tutup = e => e.b === 0 || evN(e).b === 0, penuh = e => { const x = evN(e); return x.q > 0 && x.n >= x.q; };
const evAtlet = a => S.B.events.filter(e => e.g === a.g && e.jk === (a.jk || KLS_J(a.kelas)));
const eligible = (a, ent) => evAtlet(a).filter(e => !tutup(e) && !penuh(e) && !(ent || []).some(x => x.eid === e.id && x.v !== 'REJECTED'));
const evState = e => tutup(e) ? '<span class="k-pill k-err">Ditutup</span>' : penuh(e) ? '<span class="k-pill k-err">Kuota penuh</span>' : evN(e).q ? `<span class="k-pill k-ok">Sisa ${evN(e).q - evN(e).n}</span>` : '';
const aturanTeks = () => { const r = EVR(); return [r.min === r.max ? `Wajib <b>${r.min} nomor</b> per atlet` : `${r.min}–${r.max} nomor per atlet`, r.mode === 'PAKET' ? `Biaya paket <b>${rupiah(r.paket)}</b> per atlet` : 'Biaya per nomor', r.dl ? `Ditutup <b>${fdt(r.dl)}</b>` : '', r.kuota ? `Kuota ${r.terisi}/${r.kuota} atlet` : ''].filter(Boolean).join(' · '); };
function kartuNomor(d) { // nomor yang dibuka untuk atlet akun ini, per kelompok & gender
  const grp = {}, ord = []; d.atlet.forEach(a => { const jk = a.jk || KLS_J(a.kelas), k = jk + '|' + a.g; if (!grp[k]) { grp[k] = { jk, g: a.g, at: [] }; ord.push(k); } grp[k].at.push(a.nama); });
  if (!ord.length) { const ks = (S.B.jenjang || []); return `<p class="mut sm">Belum ada atlet. Nomor yang dibuka per kelompok:</p><div class="k-chips">${ks.map(j => `<span class="k-chip sm">${E(jn(j.kode))} · ${S.B.events.filter(e => e.jk === j.kode && !tutup(e)).length} nomor</span>`).join('')}</div>`; }
  return `<div class="mn-kels">${ord.map((k, i) => { const g = grp[k], evs = S.B.events.filter(e => e.jk === g.jk && e.g === g.g), buka = evs.filter(e => !tutup(e) && !penuh(e)).length; return `<details class="mn-kel"${i === 0 ? ' open' : ''}><summary><span class="mn-kel-h"><b>${E(jn(g.jk) || 'Tidak masuk kelompok')} · ${G_L[g.g]}</b><small class="mut">${g.at.map(E).join(', ')}</small></span><span class="k-pill ${buka ? 'k-ok' : 'k-neu'}">${buka} dibuka</span></summary>${evs.length ? `<div class="mn-evs">${evs.map(e => `<span class="mn-ev${tutup(e) || penuh(e) ? ' off' : ''}"><span class="mono">#${e.no}</span> ${E(e.nama)}${tutup(e) ? ' · ditutup' : penuh(e) ? ' · penuh' : evN(e).q ? ` · sisa ${evN(e).q - evN(e).n}` : ''}</span>`).join('')}</div>` : '<p class="mut sm">Belum ada nomor dibuka untuk kelompok ini.</p>'}</details>`; }).join('')}</div>`;
}
const rekBox = d => d.rekening ? `<div class="k-card"><div class="k-card-h"><h3><i class="bi bi-bank"></i> Rekening pembayaran</h3></div><div class="k-card-b" style="white-space:pre-line">${E(d.rekening)}</div></div>` : '';
const soc = () => ['ig1', 'ig2', 'yt1', 'yt2'].filter(k => cfgv(k)).map(k => `<a class="k-chip sm" href="${E(cfgv(k))}" target="_blank" rel="noopener" style="cursor:pointer"><i class="bi ${k[0] === 'i' ? 'bi-instagram' : 'bi-youtube'}"></i> ${E(KRP.handle(cfgv(k)))}</a>`).join(' ');

/* ===== Beranda akun ===== */
V['m-dash'] = function () {
  mboot(d => {
    if (d.atlet.length) { const t = S.rt; rp('m.klaim.cari', {}).then(r => { const el = $('#pr-ban'), per = r.data.per, ids = Object.keys(per); if (t !== S.rt || !el || !ids.length) return; el.innerHTML = alertx('info', `<b>Ditemukan ${ids.reduce((s, i) => s + per[i], 0)} hasil kejuaraan sebelumnya</b> yang cocok dengan atlet Anda: ${ids.map(i => { const a = d.atlet.filter(x => x.id === i)[0]; return a ? `<a href="#" data-go="m-atlet" data-p="${a.id}">${E(a.nama)} (${per[i]})</a>` : ''; }).join(', ')}. Buka detail atlet untuk mengklaimnya sebagai riwayat prestasi.`, 'bi-award'); }).catch(() => { }); }
    const k = d.kont, mand = k.tipe === 'MANDIRI', nEnt = d.atlet.reduce((s, a) => s + a.ent.length, 0), q = (S.mq || '').toLowerCase();
    const canNew = d.buka && d.tipeOk !== false && !(mand && d.atlet.length >= 1);
    main(`<div class="k-wrap pad">${ph(`Halo, ${E(k.nama)}`, `${TIPE_L[k.tipe]} · ${E(k.kota)}`, `<button class="k-btn k-orange" data-go="m-nomor" ${d.buka && d.atlet.length && d.tipeOk !== false ? '' : 'disabled'}><i class="bi bi-plus-circle"></i> Daftarkan Nomor Lomba</button>${canNew ? `<button class="k-btn k-navy" data-go="m-baru"><i class="bi bi-person-plus"></i> ${mand ? 'Lengkapi Data Atlet' : 'Atlet Baru'}</button>` : ''}`)}
${d.tipeOk === false ? alertx('err', `<b>${E(KRP.cfgv('app_name'))}</b> tidak menerima pendaftaran dari akun ${E(TIPE_L[k.tipe] || k.tipe)}. Hubungi panitia bila ada pertanyaan.`, 'bi-slash-circle') : !d.buka ? alertx('warn', `<b>Pendaftaran ditutup</b> (tahap: ${E(KRP.FASE_L[d.fase] || d.fase)}). Anda masih dapat memantau status dan memperbaiki berkas bila diminta panitia.`, 'bi-door-closed') : alertx('info', `Pendaftaran dibuka${d.dl ? ` hingga <b>${fdt(d.dl)}</b>` : ''}. ${d.atlet.length ? 'Atlet Anda sudah tersimpan — cukup <b>pilih nama, pilih nomor, unggah bukti bayar</b>.' : mand ? 'Mulai dengan melengkapi data dan berkas Anda.' : 'Mulai dengan menambahkan atlet pertama.'}<br><span class="sm">${aturanTeks()} · <a href="#" data-go="info">Info & ketentuan lomba</a></span>`, 'bi-door-open')}
<div id="pr-ban"></div><div class="k-kpis">${kpi('Atlet', d.atlet.length, 'bi-people')}${kpi('Nomor didaftarkan', nEnt, 'bi-list-ol')}${kpi('Total biaya', rupiah(d.inv.total), 'bi-receipt')}${kpi('Belum lunas', rupiah(d.inv.sisa), 'bi-hourglass-split', `Lunas ${rupiah(d.inv.lunas)}`)}</div>
<div class="g-main"><div>${card('Atlet terdaftar', d.atlet.length ? `<div style="padding:12px 18px"><input class="k-in" data-in="mq" placeholder="Cari nama atlet…" value="${E(S.mq || '')}"></div><div class="k-scroll"><table class="k-table" id="m-tbl"><thead><tr><th>Atlet</th><th>Kelompok</th><th>Nomor lomba</th><th>Status</th><th></th></tr></thead><tbody>${rowsM(d, q)}</tbody></table></div>` : empty('bi-person-plus', 'Belum ada atlet. Tambahkan atlet pertama Anda.'), '', true)}${card('<i class="bi bi-list-check"></i> Nomor lomba dibuka untuk atlet Anda', '<p class="mut sm">Sesuai kelompok kelas & gender tiap atlet. Klik kelompok untuk melihat nomornya.</p>' + kartuNomor(d), d.buka && d.atlet.length && d.tipeOk !== false ? '<button class="k-btn sm k-orange" data-go="m-nomor">Daftarkan nomor</button>' : '')}</div>
<div>${card('Buku Acara & Buku Hasil', KRP.bukuBox(S.B.dok, true))}${rekBox(d)}${card('Ikuti akun panitia', `<p class="mut sm">Bukti mengikuti akun panitia diunggah saat melengkapi data atlet.</p><div class="k-chips">${soc()}</div>`)}${d.png.length ? card('Pengajuan terakhir', `<ul class="k-list">${d.png.slice(0, 4).map(p => `<li><span>${E(p.atlet)} · ${E(p.field)}</span>${pill(p.st)}</li>`).join('')}</ul>`) : ''}</div></div></div>`);
  });
};
function rowsM(d, q) {
  return d.atlet.filter(a => !q || a.nama.toLowerCase().indexOf(q) >= 0).map(a => `<tr><td><div class="who">${a.f ? `<img class="k-av" style="width:38px;height:38px" loading="lazy" src="${thumb(a.f, 80)}" alt="">` : `<span class="k-av ph" style="width:38px;height:38px">${E(initials(a.nama))}</span>`}<div><b>${E(a.nama)}</b><small class="mono">${E(a.bib)}</small></div></div></td><td>${E(jn(a.jk))}<br><small class="mut">${G_L[a.g]} · Kls ${kls(a.kelas)}</small></td><td>${a.ent.length ? a.ent.map(e => `<div class="sm">#${e.no} ${E(e.nama)} ${pill(e.v)}</div>`).join('') : '<span class="mut sm">Belum ada nomor</span>'}</td><td>${pill(a.st)}${a.ent.some(e => e.cat) ? '<br><small class="warn-t">Ada catatan</small>' : ''}</td><td style="text-align:right"><button class="k-btn sm k-outline" data-go="m-atlet" data-p="${a.id}">Detail</button></td></tr>`).join('') || '<tr><td colspan="5" class="mut" style="text-align:center">Tidak ditemukan.</td></tr>';
}
INP.mq = i => { S.mq = i.value; clearTimeout(S._mq); S._mq = setTimeout(() => { const t = $('#m-tbl tbody'); if (t && S.M) t.innerHTML = rowsM(S.M, S.mq.toLowerCase()); }, 120); };

/* ===== Daftar nomor lomba (atlet sudah tersimpan) ===== */
V['m-nomor'] = function () {
  mboot(d => {
    if (!d.buka) return main(`<div class="k-wrap pad">${ph('Daftar Nomor Lomba', '')}${alertx('warn', 'Pendaftaran sudah ditutup. Tidak ada pendaftaran nomor baru.', 'bi-door-closed')}<button class="k-btn k-navy" data-go="m-dash">Kembali</button></div>`);
    if (!d.atlet.length) return main(`<div class="k-wrap pad">${ph('Daftar Nomor Lomba', '')}${empty('bi-person-plus', 'Belum ada atlet tersimpan. Tambahkan atlet terlebih dahulu.')}<div style="text-align:center"><button class="k-btn k-navy" data-go="m-baru">Tambah Atlet</button></div></div>`);
    if ($('#nm-body')) { drawNm(); return; }
    S.nm = { sel: {} };
    main(`<div class="k-wrap pad"><div class="k-form">${ph('Daftar Nomor Lomba', 'Klik nama atlet → pilih nomor → unggah satu bukti bayar. Berkas atlet tidak perlu diunggah ulang.')}<div id="nm-body"></div>
<form class="k-card" data-submit="nomor"><div class="k-card-h"><h3><i class="bi bi-receipt"></i> Pembayaran</h3></div><div class="k-card-b"><div id="nm-sum"></div>${rekBox(d)}<div id="nm-dz"></div><div class="k-bar sticky"><button class="k-btn k-ghostw" type="button" data-go="m-dash">Batal</button><button class="k-btn lg k-orange" id="nm-go">Kirim Pendaftaran</button></div></div></form></div></div>`);
    drawNm();
  });
};
function drawNm() {
  const d = S.M, el = $('#nm-body'); if (!el || !S.nm) return; const sel = S.nm.sel, maxEv = EVR().max || d.maxEv || 3, minEv = EVR().min || 1, pk = EVR().mode === 'PAKET';
  el.innerHTML = card('1. Pilih atlet', `<div class="k-chips" style="gap:8px">${d.atlet.map(a => { const used = a.ent.filter(e => e.v !== 'REJECTED').length, full = used >= maxEv || !eligible(a, a.ent).length; return `<label class="k-chip${sel[a.id] ? ' on' : ''}" style="${full ? 'opacity:.5;cursor:not-allowed' : ''}"><input type="checkbox" hidden data-chg="nm-a" value="${a.id}" ${sel[a.id] ? 'checked' : ''} ${full ? 'disabled' : ''}> ${E(a.nama)} <small>(${used}/${maxEv})</small></label>`; }).join('')}</div>`) +
    Object.keys(sel).map(id => { const a = d.atlet.filter(x => x.id === id)[0]; if (!a) return ''; const used = a.ent.filter(e => e.v !== 'REJECTED').length, evs = eligible(a, a.ent), cnt = Object.keys(sel[id]).length;
      const semua = evAtlet(a).filter(e => !a.ent.some(x => x.eid === e.id && x.v !== 'REJECTED')), kurang = Math.max(0, minEv - used - cnt);
      return card(`2. Nomor untuk ${E(a.nama)}`, `<p class="mut sm">${E(jn(a.jk))} · ${G_L[a.g]} · sudah ${used} nomor · ${minEv === maxEv ? 'wajib ' + maxEv : 'minimal ' + minEv + ', maksimal ' + maxEv} nomor per atlet</p>${kurang ? `<p class="mn-kurang"><i class="bi bi-exclamation-circle"></i> Pilih ${kurang} nomor lagi.</p>` : ''}${semua.length ? semua.map(e => { const on = sel[id][e.id] !== undefined, off = tutup(e) || penuh(e), lock = !on && (off || used + cnt >= maxEv); return `<div class="k-ev${off ? ' off' : ''}"><label><input type="checkbox" data-chg="nm-e" data-a="${id}" value="${e.id}" ${on ? 'checked' : ''} ${lock ? 'disabled' : ''}><span><b>#${e.no} ${E(e.nama)}</b><small>${e.jam ? 'Estimasi ' + E(e.jam) + ' · ' : ''}Hari ${e.hari}</small></span>${evState(e) || (pk ? '' : `<b>${rupiah(e.fee)}</b>`)}</label>${on ? `<input class="k-in tm sm" data-in="nm-seed" data-a="${id}" data-e="${e.id}" placeholder="Waktu terbaik, mis. 00:57.94 (kosong = NT)" value="${E(sel[id][e.id])}">` : ''}</div>`; }).join('') : '<p class="mut">Tidak ada nomor tersisa untuk atlet ini.</p>'}`);
    }).join('');
  let tot = 0, n = 0; Object.keys(sel).forEach(id => { const a = d.atlet.filter(x => x.id === id)[0], used = a ? a.ent.filter(e => e.v !== 'REJECTED').length : 0; Object.keys(sel[id]).forEach((eid, j) => { n++; tot += feeIdx(S.B.events.filter(e => e.id === eid)[0] || {}, used + j); }); }); S.nm.total = tot; S.nm.n = n;
  $('#nm-sum').innerHTML = `<div class="k-sum"><span>${Object.keys(sel).length} atlet · ${n} nomor${pk ? ' · paket ' + rupiah(EVR().paket) + '/atlet' : ''}</span><b class="big">${rupiah(tot)}</b></div><br>`;
  if (!$('#nm-dz').innerHTML) $('#nm-dz').innerHTML = dz('bayar', 'Bukti transfer pembayaran', 'PDF/JPG/PNG maks 5 MB — satu bukti untuk semua nomor di atas');
}
INP['nm-a'] = i => { if (i.checked) S.nm.sel[i.value] = S.nm.sel[i.value] || {}; else delete S.nm.sel[i.value]; drawNm(); };
INP['nm-e'] = i => { const a = S.nm.sel[i.dataset.a]; if (i.checked) a[i.value] = ''; else delete a[i.value]; drawNm(); };
INP['nm-seed'] = i => { S.nm.sel[i.dataset.a][i.dataset.e] = i.value; };
SUBMIT.nomor = async () => {
  const b = $('#nm-go'), n = S.nm; if (!n.n) return toast('Pilih minimal satu atlet dan satu nomor.', 'err');
  const minEv = EVR().min || 1; for (const id of Object.keys(n.sel)) { const a = S.M.atlet.filter(x => x.id === id)[0], used = a.ent.filter(e => e.v !== 'REJECTED').length, c = Object.keys(n.sel[id]).length; if (used + c < minEv) return toast(`${a.nama}: wajib ${minEv} nomor per atlet (terpilih ${used + c}).`, 'err'); }
  if (n.total > 0 && !S.files.bayar) return toast('Unggah bukti pembayaran terlebih dahulu.', 'err');
  busy(b, true);
  try { const up = await uploadPending(['bayar']); const items = Object.keys(n.sel).map(id => ({ atletId: id, events: Object.keys(n.sel[id]).map(eid => ({ eid, seed: n.sel[id][eid] })) })); const r = await rp('m.daftarnomor', { items, bayar: up.bayar }); S.nm = null; refreshM(); toast(r.message); go('m-dash'); }
  catch (e) { toast(e.message, 'err'); busy(b, false); }
};

/* ===== Tambah atlet baru ===== */
V['m-baru'] = function () {
  mboot(d => {
    if ($('form[data-submit=baru]')) return; const k = d.kont, mand = k.tipe === 'MANDIRI';
    if (!d.buka) return main(`<div class="k-wrap pad">${alertx('warn', 'Pendaftaran sudah ditutup.')}<button class="k-btn k-navy" data-go="m-dash">Kembali</button></div>`);
    if (mand && d.atlet.length) return main(`<div class="k-wrap pad">${alertx('info', 'Akun pribadi hanya dapat mendaftarkan satu atlet (nama sendiri). Untuk menambah nomor, gunakan menu Daftar Nomor Lomba.')}<button class="k-btn k-navy" data-go="m-nomor">Daftar Nomor Lomba</button></div>`);
    const t = S.rt, fin = list => { if (t !== S.rt) return; S.B_sek = list; S.nb = { g: 'PUTRA', kelas: -1, sel: {} }; drawBaru(); };
    rp('m.sekolah').then(r => fin(r.data)).catch(() => fin([]));
  });
};
function drawBaru() {
  const d = S.M, k = d.kont, mand = k.tipe === 'MANDIRI', sekolah = k.tipe === 'SEKOLAH';
  main(`<div class="k-wrap pad"><div class="k-form">${ph(mand ? 'Data Atlet (Pribadi)' : 'Tambah Atlet Baru', 'Isi sekali. Data & berkas tersimpan dan dipakai lagi untuk pendaftaran berikutnya.')}
<form data-submit="baru" autocomplete="off"><div class="k-card"><div class="k-card-h"><h3><i class="bi bi-person-vcard"></i> Biodata</h3></div><div class="k-card-b"><div class="g2"><div>
${field('Nama lengkap (sesuai akte)', inp('nama', mand ? k.nama : '', { req: 1, ro: mand, max: 80 }), 1, mand ? 'Akun pribadi hanya boleh mendaftarkan nama sendiri.' : '')}${field('NISN (10 digit)', inp('nisn', '', { req: 1, attr: 'inputmode="numeric" pattern="\\d{10}" maxlength="10"' }), 1)}
${field('Jenis kelamin', `<div class="k-seg"><button type="button" class="${S.nb.g === 'PUTRA' ? 'on' : ''}" data-act="nb-g" data-v="PUTRA">Putra</button><button type="button" class="${S.nb.g === 'PUTRI' ? 'on' : ''}" data-act="nb-g" data-v="PUTRI">Putri</button></div>`, 1)}
${field('Tempat lahir', inp('tempat', '', { req: 1 }), 1)}${field('Tanggal lahir', inp('tgl', '', { type: 'date', req: 1 }), 1)}${field('Kelas', sel('kelas', KLS_OPT, S.nb.kelas, 'data-chg="nb-kls" required'), 1)}</div><div>
${field('Sekolah asal', sekolah ? inp('sekolah', k.nama, { ro: 1 }) : `<input class="k-in" name="sekolah" list="dl-sek" required placeholder="${mand ? 'Pilih dari sekolah terdaftar' : 'Nama sekolah atlet'}" autocomplete="off"><datalist id="dl-sek">${(S.B_sek || []).map(s => `<option value="${E(s)}">`).join('')}</datalist>`, 1, mand ? 'Medali atlet akan menambah poin sekolah ini.' : '')}
${k.tipe === 'KLUB' ? field('Klub', inp('klub', k.nama, { ro: 1 })) : field('Klub (jika ada)', inp('klub', ''))}
${field('Wilayah sekolah atlet (Kab/Kota)', inp('kota', sekolah ? k.kota : '', { req: 1, ph: 'mis. Jakarta Timur' }), 1, 'Tampil sebagai “Asal Wilayah” di buku acara dan hasil.')}${field('Provinsi', inp('provinsi', k.provinsi || 'DKI Jakarta'))}${field('No. HP orang tua / pendamping', inp('hp', '', { attr: 'inputmode="tel"' }))}</div></div></div></div>
<div class="k-card"><div class="k-card-h"><h3><i class="bi bi-paperclip"></i> Berkas (diunggah sekali)</h3></div><div class="k-card-b"><div class="g2">${dz('foto', 'Foto resmi atlet', 'JPG/PNG — latar biru/merah')}${dz('akta', 'Akte kelahiran')}${dz('surat', 'Surat keterangan sekolah')}${dz('sosmed', 'Bukti mengikuti akun panitia', 'Tangkapan layar follow')}</div><div class="k-chips" style="margin-top:6px"><span class="mut sm">Akun panitia:</span> ${soc()}</div></div></div>
<div id="nb-ev"></div>
<div class="k-card"><div class="k-card-h"><h3><i class="bi bi-receipt"></i> Pembayaran</h3></div><div class="k-card-b"><div id="nb-sum"></div>${rekBox(d)}${dz('bayar', 'Bukti transfer pembayaran')}</div></div>
<div class="k-bar sticky"><button type="button" class="k-btn k-ghostw" data-go="m-dash">Batal</button><button class="k-btn lg k-orange" id="nb-go">Simpan & Daftar</button></div></form></div></div>`);
  drawNbEv();
}
ACT['nb-g'] = a => { S.nb.g = a.dataset.v; S.nb.sel = {}; $$('[data-act="nb-g"]').forEach(x => x.classList.toggle('on', x === a)); drawNbEv(); };
INP['nb-kls'] = i => { S.nb.kelas = Number(i.value); S.nb.sel = {}; drawNbEv(); };
function drawNbEv() {
  const el = $('#nb-ev'); if (!el) return; const nb = S.nb, jk = nb.kelas >= 0 ? KLS_J(nb.kelas) : '', maxEv = EVR().max || S.M.maxEv || 3, minEv = EVR().min || 1, pk = EVR().mode === 'PAKET';
  const evs = jk ? S.B.events.filter(e => e.g === nb.g && e.jk === jk) : [];
  const nSel = Object.keys(nb.sel).length, kurang = Math.max(0, minEv - nSel);
  el.innerHTML = card(`Pilih nomor lomba ${jk ? `<small class="mut">· ${E(jn(jk))} ${G_L[nb.g]}</small>` : ''}`, nb.kelas >= 0 && !jk ? '<p class="mut">Kelas ini tidak termasuk kelompok yang dipertandingkan pada event ini.</p>' : !jk ? '<p class="mut">Pilih kelas terlebih dahulu untuk melihat nomor yang tersedia.</p>' : evs.length ? `<p class="mut sm">${minEv === maxEv ? 'Wajib ' + maxEv : 'Minimal ' + minEv + ', maksimal ' + maxEv} nomor per atlet${pk ? ' · paket ' + rupiah(EVR().paket) : ''}.</p>${kurang ? `<p class="mn-kurang"><i class="bi bi-exclamation-circle"></i> Pilih ${kurang} nomor lagi.</p>` : ''}` + evs.map(e => { const on = nb.sel[e.id] !== undefined, off = tutup(e) || penuh(e), lock = !on && (off || nSel >= maxEv); return `<div class="k-ev${off ? ' off' : ''}"><label><input type="checkbox" data-chg="nb-e" value="${e.id}" ${on ? 'checked' : ''} ${lock ? 'disabled' : ''}><span><b>#${e.no} ${E(e.nama)}</b><small>Hari ${e.hari}</small></span>${evState(e) || (pk ? '' : `<b>${rupiah(e.fee)}</b>`)}</label>${on ? `<input class="k-in tm sm" data-in="nb-seed" data-e="${e.id}" placeholder="Waktu terbaik, mis. 00:57.94 (kosong = NT)" value="${E(nb.sel[e.id])}">` : ''}</div>`; }).join('') : '<p class="mut">Belum ada nomor untuk kelompok ini.</p>');
  const tot = Object.keys(nb.sel).reduce((s, id, j) => s + feeIdx(S.B.events.filter(e => e.id === id)[0] || {}, j), 0); nb.total = tot; const sm = $('#nb-sum'); if (sm) sm.innerHTML = `<div class="k-sum"><span>${nSel} nomor</span><b class="big">${rupiah(tot)}</b></div><br>`;
}
INP['nb-e'] = i => { if (i.checked) S.nb.sel[i.value] = ''; else delete S.nb.sel[i.value]; drawNbEv(); };
INP['nb-seed'] = i => { S.nb.sel[i.dataset.e] = i.value; };
SUBMIT.baru = async f => {
  const b = $('#nb-go'), d = form(f), nb = S.nb; if (nb.kelas < 0) return toast('Pilih kelas.', 'err'); if (!Object.keys(nb.sel).length) return toast('Pilih minimal satu nomor lomba.', 'err'); if (Object.keys(nb.sel).length < (EVR().min || 1)) return toast(`Wajib memilih ${EVR().min} nomor per atlet.`, 'err');
  for (const k of ['foto', 'akta', 'surat', 'sosmed']) if (!S.files[k]) return toast('Berkas ' + { foto: 'foto resmi', akta: 'akte kelahiran', surat: 'surat sekolah', sosmed: 'bukti follow akun panitia' }[k] + ' wajib diunggah.', 'err');
  if (nb.total > 0 && !S.files.bayar) return toast('Unggah bukti pembayaran.', 'err');
  busy(b, true);
  try { const up = await uploadPending(['foto', 'akta', 'surat', 'sosmed', 'bayar']); const r = await rp('m.atlet', Object.assign({}, d, { g: nb.g, events: Object.keys(nb.sel).map(eid => ({ eid, seed: nb.sel[eid] })) }, up)); refreshM(); toast(r.message); go('m-dash'); }
  catch (e) { toast(e.message, 'err'); busy(b, false); }
};

/* ===== Detail atlet & perbaikan ===== */
V['m-atlet'] = function (id) {
  mboot(d => {
    const a = d.atlet.filter(x => x.id === id)[0]; if (!a) return main(`<div class="k-wrap pad">${empty('bi-person-x', 'Atlet tidak ditemukan.')}</div>`);
    if ($('form[data-submit=perbaiki]') && S.files && Object.keys(S.files).length) return;
    const perlu = ['REVISI', 'DITOLAK'].indexOf(a.st) >= 0 && d.fix, post = ['PELAKSANAAN', 'SELESAI'].indexOf(d.fase) >= 0;
    main(`<div class="k-wrap pad"><button class="k-btn k-ghostw sm" data-go="m-dash"><i class="bi bi-arrow-left"></i> Kembali</button><br><br><div class="k-card pfh"><div class="k-card-b">${a.f ? `<img class="k-av xl" src="${thumb(a.f, 300)}" alt="">` : `<span class="k-av ph xl">${E(initials(a.nama))}</span>`}<div style="flex:1"><span class="bib mono">${E(a.bib)}</span><h1>${E(a.nama)}</h1><p class="mut">${E(a.sk || '')}${a.kl ? ' · ' + E(a.kl) : ''} · ${E(a.wl || '')}<br>${E(jn(a.jk))} · ${G_L[a.g]} · Kelas ${kls(a.kelas)} · NISN ${E(a.nisn)}</p>${pill(a.st)}</div><div class="k-qa" style="flex-direction:column"><button class="k-btn k-outline sm" data-act="idcard" data-id="${a.id}"><i class="bi bi-person-badge"></i> Kartu ID</button>${d.buka ? `<button class="k-btn k-outline sm" data-go="m-nomor"><i class="bi bi-plus-circle"></i> Tambah nomor</button>` : ''}<button class="k-btn k-ghostw sm" data-go="m-png" data-p="${a.id}"><i class="bi bi-pencil"></i> Ajukan perubahan</button></div></div></div>
<div id="pr-box">${card('<i class="bi bi-award"></i> Riwayat prestasi KRP', '<div class="k-skel" style="height:60px"></div>')}</div>
${card('Nomor lomba musim ini', a.ent.length ? `<div class="k-scroll"><table class="k-table"><thead><tr><th>No</th><th>Nomor</th><th>Seed</th><th>Verifikasi</th><th>Bayar</th><th>Biaya</th><th></th></tr></thead><tbody>${a.ent.map(e => `<tr><td class="mono">#${e.no}</td><td>${E(e.nama)}</td><td class="mono">${E(e.seed || 'NT')}</td><td>${pill(e.v)}${e.cat ? `<br><small class="warn-t">${E(e.cat)}</small>` : ''}</td><td>${pill(e.b)}</td><td>${rupiah(e.fee)}</td><td>${post && e.v === 'VERIFIED' ? `<button class="k-btn sm k-outline" data-act="sert" data-id="${a.id}" data-e="${e.eid}">Sertifikat</button>` : ''}</td></tr>`).join('')}</tbody></table></div>` : '<p class="mut">Belum ada nomor. Gunakan “Tambah nomor”.</p>', '', true)}
${perlu ? `<form class="k-card" data-submit="perbaiki" data-id="${a.id}"><div class="k-card-h"><h3><i class="bi bi-tools"></i> Perbaiki berkas</h3></div><div class="k-card-b">${alertx('warn', 'Panitia meminta perbaikan. Unggah hanya berkas yang perlu diganti.')}<div class="g2">${dz('foto', 'Foto resmi')}${dz('akta', 'Akte kelahiran')}${dz('surat', 'Surat sekolah')}${dz('sosmed', 'Bukti follow')}${dz('bayar', 'Bukti bayar')}</div><div class="k-bar"><button class="k-btn k-orange">Kirim Perbaikan</button></div></div></form>` : ''}</div>`);
    muatPrestasi(a.id);
  });
};
/* ----- Klaim prestasi dari hasil event sebelumnya ----- */
const PR_ST = { SAH: '<span class="k-pill k-ok">Tercatat</span>', MENUNGGU: '<span class="k-pill k-warn">Menunggu panitia</span>' };
const medali = h => h.medal ? `<span class="k-pill k-warn">${E(h.medal)}</span>` : '';
function muatPrestasi(id) {
  const t = S.rt; rp('m.klaim.cari', { atletId: id }).then(r => { if (t !== S.rt) return; S.PR = r.data; S.prSel = {}; gambarPrestasi(); }).catch(e => { const b = $('#pr-box'); if (b) b.innerHTML = card('Riwayat prestasi KRP', alertx('err', E(e.message))); });
}
function gambarPrestasi() {
  const d = S.PR, el = $('#pr-box'); if (!el) return; const s = d.sudah, k = d.kandidat, nSel = Object.keys(S.prSel).length;
  const med = { EMAS: 0, PERAK: 0, PERUNGGU: 0 }; s.filter(h => h.klaim === 'SAH').forEach(h => { if (med[h.medal] !== undefined) med[h.medal]++; });
  const cek = (ok, t) => ok === null ? '' : `<span class="pr-c ${ok ? 'ok' : 'no'}"><i class="bi ${ok ? 'bi-check-lg' : 'bi-x-lg'}"></i> ${t}</span>`;
  el.innerHTML = card('<i class="bi bi-award"></i> Riwayat prestasi KRP', `${s.length ? `<p class="sm">Medali tercatat: <b>${med.EMAS}</b> emas · <b>${med.PERAK}</b> perak · <b>${med.PERUNGGU}</b> perunggu</p><div class="k-scroll"><table class="k-table"><thead><tr><th>Event</th><th>Nomor</th><th>Waktu</th><th>Rank</th><th>Status</th><th></th></tr></thead><tbody>${s.map(h => `<tr><td>${E(h.event)}<br><small class="mut">${E(fdt(h.tanggal))} · kolam ${h.kolam === 'SCM' ? '25' : '50'} m</small></td><td>${E(h.nomor)}</td><td class="mono">${E(h.waktu)}</td><td>${h.rank || '–'} ${medali(h)}</td><td>${PR_ST[h.klaim] || ''}</td><td><button class="k-btn sm k-ghostw" data-act="pr-batal" data-id="${E(h.id)}" title="Batalkan klaim">Batal</button></td></tr>`).join('')}</tbody></table></div>` : '<p class="mut sm">Belum ada prestasi dari event sebelumnya yang tercatat untuk atlet ini.</p>'}
${k.length ? `<div class="pr-k"><h4><i class="bi bi-search"></i> Ditemukan ${k.length} hasil lama yang mungkin milik ${E(d.atlet.nama)}</h4><p class="mut sm">Dicocokkan dari nama, jenis kelamin, sekolah/klub, dan kelas pada data hasil kejuaraan sebelumnya. Centang yang benar, lalu klaim. Yang cocok kuat langsung tercatat; selebihnya diperiksa panitia.</p><div class="k-scroll"><table class="k-table"><thead><tr><th></th><th>Event</th><th>Nomor</th><th>Nama & asal di data</th><th>Hasil</th><th>Kecocokan</th></tr></thead><tbody>${k.map(h => `<tr><td><input type="checkbox" data-chg="pr-sel" value="${E(h.id)}" ${S.prSel[h.id] ? 'checked' : ''} aria-label="Pilih"></td><td>${E(h.event)}<br><small class="mut">${E(fdt(h.tanggal))}</small></td><td>${E(h.nomor)}</td><td><b>${E(h.nama)}</b><br><small class="mut">${E([h.sk, h.kl].filter(Boolean).join(' / '))}${h.kelas !== '' ? ' · kls ' + E(h.kelas) : ''}</small></td><td class="mono">${E(h.waktu)} ${h.rank ? '· #' + h.rank : ''} ${medali(h)}</td><td>${cek(h.cn === 2, h.cn === 2 ? 'Nama sama' : 'Nama mirip')}${cek(h.cl, 'Sekolah/klub')}${cek(h.ck, 'Kelas')}${h.auto ? '<br><small class="ok-t">langsung tercatat</small>' : '<br><small class="mut">perlu persetujuan</small>'}</td></tr>`).join('')}</tbody></table></div><div class="k-bar"><button class="k-btn k-orange" data-act="pr-klaim" ${nSel ? '' : 'disabled'}><i class="bi bi-award"></i> Klaim ${nSel || ''} hasil terpilih</button></div></div>` : ''}`);
}
INP['pr-sel'] = i => { if (i.checked) S.prSel[i.value] = 1; else delete S.prSel[i.value]; const b = $('[data-act=pr-klaim]'); if (b) { const n = Object.keys(S.prSel).length; b.disabled = !n; b.innerHTML = `<i class="bi bi-award"></i> Klaim ${n || ''} hasil terpilih`; } };
ACT['pr-klaim'] = async a => { busy(a, true); try { const r = await rp('m.klaim', { atletId: S.PR.atlet.id, ids: Object.keys(S.prSel) }); toast(r.message); muatPrestasi(S.PR.atlet.id); } catch (e) { toast(e.message, 'err'); busy(a, false); } };
ACT['pr-batal'] = async a => { try { const r = await rp('m.klaim.batal', { ids: [a.dataset.id] }); toast(r.message); muatPrestasi(S.PR.atlet.id); } catch (e) { toast(e.message, 'err'); } };
SUBMIT.perbaiki = async f => {
  const b = $('button.k-btn', f); busy(b, true);
  try { const up = await uploadPending(['foto', 'akta', 'surat', 'sosmed', 'bayar']); if (!Object.keys(up).length) throw new Error('Pilih minimal satu berkas.'); const r = await rp('m.perbaiki', { atletId: f.dataset.id, files: up }); refreshM(); toast(r.message); go('m-dash'); }
  catch (e) { toast(e.message, 'err'); busy(b, false); }
};
ACT.idcard = async a => { busy(a, true); try { const r = await rp('m.idcard', { atletId: a.dataset.id }); dlB64(r.data.name, r.data.mime, r.data.b64); } catch (e) { toast(e.message, 'err'); } busy(a, false); };
ACT.sert = async a => { busy(a, true); try { const r = await rp('m.sertifikat', { atletId: a.dataset.id, eventId: a.dataset.e }); dlB64(r.data.name, r.data.mime, r.data.b64); } catch (e) { toast(e.message, 'err'); } busy(a, false); };

/* ===== Pengajuan perubahan ===== */
const FIELDS = [['nama_lengkap', 'Nama'], ['nisn', 'NISN'], ['tanggal_lahir', 'Tanggal lahir (YYYY-MM-DD)'], ['tempat_lahir', 'Tempat lahir'], ['kelas_num', 'Kelas (angka 0–12)'], ['klub_nama', 'Klub'], ['hp_kontak', 'No. HP'], ['seed_time', 'Seed time']];
V['m-png'] = function (pre) {
  mboot(d => {
    if ($('form[data-submit=png]')) return; const mand = d.kont.tipe === 'MANDIRI'; S.png = { tipe: 'REVISI' };
    main(`<div class="k-wrap pad">${ph('Pengajuan Perubahan', 'Revisi data atlet atau mutasi ke sekolah/klub lain — diputuskan Super Admin / Admin Pendaftaran.')}${d.buka ? '' : alertx('warn', 'Pengajuan hanya dapat dilakukan sebelum pendaftaran ditutup.')}
<div class="g-main"><form class="k-card" data-submit="png"><div class="k-card-h"><h3>Form pengajuan</h3></div><div class="k-card-b"><div class="k-seg" style="margin-bottom:12px"><button type="button" class="on" data-act="png-t" data-v="REVISI">Revisi data</button>${mand ? '' : '<button type="button" data-act="png-t" data-v="MUTASI">Mutasi</button>'}</div>
${field('Atlet', sel('atletId', d.atlet.map(a => [a.id, a.nama]), pre || ''), 1)}<div id="png-f"></div>${field('Alasan', `<textarea class="k-in" name="alasan" rows="3" required minlength="5"></textarea>`, 1)}${dz('bukti', 'Bukti pendukung', 'Wajib — PDF/JPG/PNG maks 5 MB')}<div class="k-bar"><button class="k-btn k-orange" ${d.buka ? '' : 'disabled'}>Kirim Pengajuan</button></div></div></form>
${card('Riwayat', d.png.length ? `<ul class="k-list">${d.png.map(p => `<li><span><b>${E(p.atlet)}</b><br><small class="mut">${E(p.tipe)} · ${E(p.field)}: ${E(p.lama)} → ${E(p.baru)}</small>${p.cat ? `<br><small class="warn-t">${E(p.cat)}</small>` : ''}</span>${pill(p.st)}</li>`).join('')}</ul>` : '<p class="mut">Belum ada pengajuan.</p>')}</div></div>`);
    drawPng();
  });
};
function drawPng() {
  const t = S.png.tipe, el = $('#png-f'); if (!el) return;
  if (t === 'MUTASI') { el.innerHTML = '<div class="k-skel"></div>'; rp('m.kont').then(r => { el.innerHTML = field('Pindah ke akun', sel('kontBaru', [['', '— pilih sekolah/klub tujuan —']].concat(r.data.map(k => [k.id, `${k.nama} (${TIPE_L[k.tipe]})`])), ''), 1); }); return; }
  el.innerHTML = field('Data yang diubah', sel('field', FIELDS, 'nama_lengkap', 'data-chg="png-fld"'), 1) + `<div id="png-ev"></div>` + field('Nilai baru', inp('nilai', '', { req: 1 }), 1);
}
ACT['png-t'] = a => { S.png.tipe = a.dataset.v; $$('[data-act="png-t"]').forEach(x => x.classList.toggle('on', x === a)); drawPng(); };
INP['png-fld'] = i => { const el = $('#png-ev'); if (i.value !== 'seed_time') { el.innerHTML = ''; return; } const id = $('[name=atletId]').value, a = S.M.atlet.filter(x => x.id === id)[0]; el.innerHTML = field('Nomor lomba', sel('eventId', (a ? a.ent : []).map(e => [e.eid, `#${e.no} ${e.nama}`]), ''), 1); };
SUBMIT.png = async f => {
  const b = $('button.k-btn.k-orange', f), d = form(f); busy(b, true);
  try { if (!S.files.bukti) throw new Error('Bukti pendukung wajib diunggah.'); const up = await uploadPending(['bukti']); const r = await rp('m.pengajuan', Object.assign({}, d, { tipe: S.png.tipe, bukti: up.bukti })); refreshM(); toast(r.message); go('m-png'); }
  catch (e) { toast(e.message, 'err'); busy(b, false); }
};

/* ===== Akun saya ===== */
V['m-akun'] = function () {
  mboot(d => { const k = d.kont; main(`<div class="k-wrap pad">${ph('Akun Saya', TIPE_L[k.tipe])}<div class="g2">${card('Profil akun', `<dl class="k-dl"><dt>Nama</dt><dd>${E(k.nama)}</dd><dt>${k.tipe === 'SEKOLAH' ? 'NPSN' : k.tipe === 'KLUB' ? 'Kode/SK' : 'Email login'}</dt><dd>${E(k.npsn)}</dd><dt>Kab/Kota</dt><dd>${E(k.kota)}</dd><dt>Provinsi</dt><dd>${E(k.provinsi)}</dd><dt>Penanggung jawab</dt><dd>${E(k.pj)} ${k.jabatan ? '(' + E(k.jabatan) + ')' : ''}</dd><dt>Email</dt><dd>${E(k.email)}</dd><dt>Telepon</dt><dd>${E(k.telp)}</dd></dl>`)}
<form class="k-card" data-submit="sandi"><div class="k-card-h"><h3>Ganti kata sandi</h3></div><div class="k-card-b">${field('Kata sandi lama', '<input class="k-in" type="password" name="lama" required autocomplete="current-password">', 1)}${field('Kata sandi baru', '<input class="k-in" type="password" name="baru" required minlength="8" autocomplete="new-password">', 1, 'Minimal 8 karakter, huruf dan angka.')}<div class="k-bar"><button class="k-btn k-navy">Simpan</button></div></div></form></div></div>`); });
};
SUBMIT.sandi = async f => { const b = $('button', f), d = form(f); busy(b, true); try { const r = await rp('me.sandi', d); setSession(r.data.token, S.me); toast(r.message); f.reset(); } catch (e) { toast(e.message, 'err'); } busy(b, false); };
})();
