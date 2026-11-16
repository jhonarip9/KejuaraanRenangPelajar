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
    id = id || S.hcur || (L.filter(e => e.st !== 'SAH')[0] || L[0]).id; S.hcur = id;
    main(`<div class="k-wrap pad">${ph('Input Hasil Lomba', `Fase: <b>${E(FASE_L[fase] || fase)}</b>`, `<button class="k-btn k-outline" data-act="bk-xls"><i class="bi bi-file-earmark-excel"></i> Excel buku acara</button>`)}${terkunci ? alertx('warn', 'Input hasil dibuka setelah Super Admin memulai tahap <b>Pelaksanaan</b>. Anda tetap dapat melihat start list.', 'bi-lock') : ''}${evSelect(L, id, 'a-hasil')}<div id="h-body">${'<div class="k-skel"></div>'}</div>${rekapHost}</div>`);
    S.rekapBox('#rk-host'); loadHasil(id, terkunci);
  }, 3000);
};
function draftKey(id) { return 'krp_draft_' + (S.me.id) + '_' + id; }
async function loadHasil(id, terkunci) {
  try {
    const d = (await rp('h.load', { id })).data, el = $('#h-body'); if (!el || S.hcur !== id) return; S.hd = d;
    const lock = terkunci || d.st === 'SAH' || d.st === 'SUBMITTED'; S.hver = d.ver; S.hverId = id; hPantau(id, 'h'); let draft = {}; try { draft = JSON.parse(LS.g(draftKey(id)) || '{}'); } catch (e) { }
    el.innerHTML = `<div class="k-evh"><div><span class="tag">EVENT ${d.event.no}${d.event.jam ? ' · ' + E(d.event.jam) + ' WIB' : ''}</span><h2>${E(evTitle(d.event))}</h2><p>${d.heats.length} seri · status: ${pill(d.st)}</p></div>${d.rec ? `<div class="rec"><small>Rekor</small><b class="mono">${E(d.rec.waktu)}</b><small>${E(d.rec.nama)}</small></div>` : ''}</div>
<div id="h-konflik"></div>${LS.g(draftKey(id) + '_bak') ? `<div class="k-alert warn"><i class="bi bi-life-preserver"></i><div>Isian Anda yang belum tersimpan (karena bentrok dengan perubahan orang lain) masih tersimpan di perangkat ini. <button type="button" class="k-btn sm k-outline" data-act="h-pulih">Pulihkan isian saya ke layar</button> <button type="button" class="k-btn sm k-ghostw" data-act="h-buangbak">Buang</button></div></div>` : ''}${d.ubah && d.ubah.oleh ? `<p class="mut sm">Terakhir diubah oleh <b>${E(d.ubah.oleh)}</b> · ${fdt(d.ubah.at)}</p>` : ''}${d.st === 'SAH' ? alertx('ok', `Disahkan oleh <b>${E(d.so.oleh)}</b> · ${fdt(d.so.at)}. Hasil terkunci.`, 'bi-patch-check') : d.st === 'SUBMITTED' ? alertx('info', 'Hasil sudah dikirim dan menunggu pengesahan wasit.') : ''}
${lock ? '' : '<p class="mut sm h-kb"><i class="bi bi-keyboard"></i> <b>Enter</b> / <b>↓</b> ke atlet berikutnya · <b>↑</b> atlet sebelumnya · <b>→ ←</b> pindah Status / Waktu / Keterangan. Status bisa diganti dengan mengetik huruf O (OK) atau D (DQ/DNS/DNF).</p>'}<form data-submit="hsimpan" onsubmit="return false">${d.heats.map(h => card(`Seri ${h.n}`, `<div class="k-scroll"><table class="k-table"><thead><tr><th>Lane</th><th>Atlet</th><th>Seed</th><th>Status</th><th>Waktu (mm:ss.cc)</th><th>Ket / alasan DQ</th><th>Rank</th></tr></thead><tbody>${h.rows.map(r => { const x = draft[r.id] || {}, w = x.w !== undefined ? x.w : r.waktu, st = x.st || r.st, dq = x.dq !== undefined ? x.dq : r.dq; return `<tr data-aid="${r.id}"><td class="mono"><b>${r.lane}</b></td><td><b>${E(r.nama)}</b><br><small class="mut">${E(r.sk || r.kl)}</small></td><td class="mono">${E(r.seed)}</td><td>${sel('st', ['OK', 'DQ', 'DNS', 'DNF'], st, `data-chg="h-dirty" ${lock ? 'disabled' : ''}`)}</td><td><input class="k-in tm sm mono" name="w" data-in="h-dirty" value="${E(w)}" placeholder="00:00.00" ${lock || st !== 'OK' ? 'disabled' : ''} inputmode="decimal" style="width:120px"></td><td><input class="k-in sm" name="dq" data-in="h-dirty" value="${E(dq)}" placeholder="${st === 'DQ' ? 'Kode DQ wajib' : ''}" ${lock || st === 'OK' || st === 'DNS' ? 'disabled' : ''}></td><td>${r.rank ? `<span class="md ${r.rank === 1 ? 'g' : r.rank === 2 ? 's' : r.rank === 3 ? 'b' : ''}">${r.rank}</span>` : '–'}${r.baru ? ' <span class="k-pill k-warn">Rekor</span>' : ''}</td></tr>`; }).join('')}</tbody></table></div>`, '', true)).join('')}
<div class="k-bar sticky">${d.st === 'SAH' || d.st === 'SUBMITTED' ? `<button type="button" class="k-btn k-ghostw" data-act="h-tarik"><i class="bi bi-arrow-counterclockwise"></i> Tarik untuk perbaikan</button>` : `<span class="mut sm" id="h-saved" style="margin-right:auto"></span><button type="button" class="k-btn k-outline" data-act="h-save" data-k="0" ${lock ? 'disabled' : ''}>Simpan draf</button><button type="button" class="k-btn lg k-orange" data-act="h-save" data-k="1" ${lock ? 'disabled' : ''}><i class="bi bi-send"></i> Kirim ke Wasit</button>`}</div></form>`;
  } catch (e) { const el = $('#h-body'); if (el) el.innerHTML = alertx('err', E(e.message)); }
}
function hRows() { return $$('#h-body tr[data-aid]').map(tr => ({ id: tr.dataset.aid, st: $('[name=st]', tr) ? $('select', tr).value : 'OK', waktu: $('[name=w]', tr).value.trim(), dq: $('[name=dq]', tr).value.trim(), cat: '' })); }
INP['h-dirty'] = i => {
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
    else if (v.ver !== S.wver) { toast('Hasil nomor ini berubah. Menampilkan data terbaru — periksa ulang sebelum tanda tangan.', 'warn'); bustCache('hev'); loadWasit(id); }
  }, 20000);
}
function hKonflik(e, kirim) {
  const i = e.info || {}, bisaTimpa = i.st === 'DRAFT' || i.st === 'NONE';
  modal('Data bentrok dengan pengguna lain', `<p>${E(e.message)}</p><p class="mut sm">Isian Anda <b>tidak hilang</b>: tetap tersimpan di perangkat ini dan bisa dipulihkan.</p><p class="mut sm"><b>Muat data terbaru</b>: tampilkan data orang lain; isian Anda disimpan sebagai cadangan.${bisaTimpa ? ' <b>Timpa dengan isian saya</b>: isian Anda menggantikan data tersebut.' : ''}</p><div class="k-bar" style="flex-wrap:wrap"><button type="button" class="k-btn k-navy" data-act="h-muat">Muat data terbaru</button>${bisaTimpa ? `<button type="button" class="k-btn k-orange" data-act="h-timpa" data-k="${kirim ? 1 : 0}">Timpa dengan isian saya</button>` : ''}</div>`);
}
ACT['h-muat'] = () => { const k = draftKey(S.hcur), o = {}; hRows().forEach(r => o[r.id] = { w: r.waktu, st: r.st, dq: r.dq }); LS.s(k + '_bak', JSON.stringify(o)); LS.d(k); closeModal(); bustCache('hev'); loadHasil(S.hcur, false); };
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
    id = id || S.wcur || (L.filter(e => e.st === 'SUBMITTED')[0] || L[0]).id; S.wcur = id; const n = L.filter(e => e.st === 'SUBMITTED').length;
    main(`<div class="k-wrap pad">${ph('Pengesahan Wasit', `${n} nomor menunggu pengesahan · Tanda tangan langsung di layar tablet/iPad`)}${evSelect(L, id, 'a-wasit')}<div id="w-body"><div class="k-skel"></div></div>${rekapHost}</div>`); S.rekapBox('#rk-host'); loadWasit(id);
  }, 3000);
};
async function loadWasit(id) {
  try {
    const d = (await rp('h.load', { id })).data, el = $('#w-body'); if (!el || S.wcur !== id) return; S.hd = d; S.wver = d.ver; hPantau(id, 'w'); const rows = [];
    d.heats.forEach(h => h.rows.forEach(r => rows.push(Object.assign({ heat: h.n }, r)))); rows.sort((a, b) => (a.rank || 999) - (b.rank || 999) || a.heat - b.heat || a.lane - b.lane);
    el.innerHTML = `<div class="k-evh"><div><span class="tag">EVENT ${d.event.no}</span><h2>${E(evTitle(d.event))}</h2><p>Status: ${pill(d.st)}</p></div>${d.rec ? `<div class="rec"><small>Rekor</small><b class="mono">${E(d.rec.waktu)}</b></div>` : ''}</div>
${card('Hasil untuk diperiksa', `<div class="k-scroll"><table class="k-table"><thead><tr><th>Rank</th><th>Seri/Lane</th><th>Atlet</th><th>Asal</th><th>Waktu</th><th>Ket</th></tr></thead><tbody>${rows.map(r => `<tr><td>${r.rank && r.st === 'OK' ? `<span class="md ${r.rank === 1 ? 'g' : r.rank === 2 ? 's' : r.rank === 3 ? 'b' : ''}">${r.rank}</span>` : '–'}</td><td class="mono">${r.heat}/${r.lane}</td><td><b>${E(r.nama)}</b></td><td>${E(r.sk || r.kl)}</td><td class="mono"><b>${E(r.st === 'OK' ? (r.waktu || '—') : r.st)}</b></td><td>${r.baru ? '<span class="k-pill k-warn">Rekor baru</span>' : ''}${E(r.dq)}</td></tr>`).join('')}</tbody></table></div>`, '', true)}
${d.st === 'SUBMITTED' ? `<form class="k-card" data-submit="wsah"><div class="k-card-h"><h3><i class="bi bi-pen"></i> Tanda tangan wasit</h3><button type="button" class="k-btn sm k-ghostw" data-act="ttdclear">Hapus</button></div><div class="k-card-b"><canvas class="k-pad-c" id="ttd"></canvas><p class="mut sm" style="margin-top:6px">Tanda tangan dengan jari atau stylus pada kotak di atas.</p>${field('Catatan (opsional)', inp('catatan', '', { max: 200 }))}<div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="h-tarik">Kembalikan ke lapangan</button><button class="k-btn lg k-orange"><i class="bi bi-patch-check"></i> Sahkan & Kunci</button></div></div></form>` : d.st === 'SAH' ? `<div class="k-alert ok"><i class="bi bi-patch-check-fill"></i><div>Disahkan <b>${E(d.so.oleh)}</b> · ${fdt(d.so.at)}<br><small class="mono">${E(String(d.so.hash).slice(0, 24))}…</small> ${d.so.ttd ? `<button class="k-btn sm k-outline" data-act="akun-file" data-id="${E(d.so.ttd)}">Lihat tanda tangan</button>` : ''} <button class="k-btn sm k-ghostw" data-act="h-tarik">Tarik hasil</button></div></div>` : alertx('info', 'Hasil belum dikirim oleh Admin Input Data.')}`;
    if (d.st === 'SUBMITTED') initPad();
  } catch (e) { const el = $('#w-body'); if (el) el.innerHTML = alertx('err', E(e.message)); }
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
<form class="k-card" data-submit="kop"><div class="k-card-h"><h3>Judul buku & tanda tangan</h3></div><div class="k-card-b"><div class="g2">${field('Judul besar (nama kejuaraan)', inp('app_name', S.B.cfg.app_name))}${field('Sub judul (mis. BEST OF THE BEST DKI JAKARTA)', inp('buku_subjudul', S.B.cfg.buku_subjudul || ''))}${field('Nama ketua panitia', inp('ttd_ketua_nama', k.ttd_ketua_nama))}${field('Jabatan penandatangan', inp('ttd_ketua_jabatan', k.ttd_ketua_jabatan))}${field('Kop baris 1 (untuk sampul/dokumen)', inp('kop1', k.kop1))}${field('Kop baris 2', inp('kop2', k.kop2))}</div>${field('Teks panitia (sampul)', `<textarea class="k-in" name="panitia_teks" rows="3">${E(k.panitia_teks)}</textarea>`)}<label class="k-ev"><label><input type="checkbox" name="buku_cover" ${S.B.cfg.buku_cover === '1' ? 'checked' : ''}> <span>Sertakan halaman sampul di buku acara & buku hasil</span></label></label>${field('Isi per halaman buku', sel('buku_isi', [['NORMAL', 'Normal (disarankan)'], ['RAPAT', 'Rapat (lebih banyak baris per halaman)'], ['LONGGAR', 'Longgar (pilih bila ada halaman tanpa kop)']], S.B.cfg.buku_isi || 'NORMAL'), 0, 'Kop buku tampil di setiap halaman. Nomor yang terpotong diberi judul “(lanjutan)”.')}<p class="mut sm">Tanggal & tempat pada buku mengikuti “Tanggal pelaksanaan” dan “Lokasi” di Pengaturan Web.</p><div class="k-bar"><button class="k-btn k-navy">Simpan</button></div></div></form></div>
<div>${card('Dokumen musim ini', d.docs.length ? `<ul class="k-list">${d.docs.map(x => `<li><span><b>${E(String(x.jenis).replace(/_/g, ' '))}</b><br><small class="mut">${fdt(x.at)} · ${E(x.by)}</small></span><button class="k-btn sm k-outline" data-act="dok-get" data-id="${x.id}"><i class="bi bi-download"></i></button><button class="k-btn sm ${x.pub ? 'k-ok-b k-navy' : 'k-ghostw'}" data-act="dok-pub" data-id="${x.id}" title="Tampilkan di portal">${x.pub ? 'Publik' : 'Privat'}</button></li>`).join('')}</ul>` : '<p class="mut">Belum ada dokumen.</p>')}</div></div></div>`);
  }, 3000);
};
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
