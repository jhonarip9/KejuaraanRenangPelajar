(function () {
'use strict';
/* ===== Susun Acara dinamis: seret & lepas, pindah hari, batalkan/pulihkan nomor, estimasi jam langsung ===== */
const { $, $$, E, S, V, ACT, INP, G_L, FASE_L, rp, toast, busy, ph, alertx, go, ask, bustCache, jn } = KRP;
const main = h => { $('#main').innerHTML = h; };
const tabelLama = V['a-jadwal']; // tampilan tabel & jam manual (versi sebelumnya)
const GU = { 'Gaya Bebas': 1, 'Gaya Punggung': 2, 'Gaya Dada': 3, 'Gaya Kupu-kupu': 4, 'Gaya Ganti Perorangan': 5 };
const gaya = nama => String(nama || '').replace(/^\d+m\s*/, '');
const jamF = m => { m = Math.max(0, Math.round(m)); return ('0' + Math.floor(m / 60) % 24).slice(-2) + ':' + ('0' + m % 60).slice(-2); };
const jamM = t => { const q = String(t || '08:00').split(':'); return Number(q[0]) * 60 + Number(q[1] || 0); };

V['a-jadwal'] = function () {
  S.jdTab = S.jdTab || 'susun';
  if (S.jdTab === 'tabel') return tabelLama();
  const t = S.rt;
  rp('jd.get', {}).then(r => { if (t !== S.rt) return; muat(r.data); gambar(); }).catch(e => KRP.errView(e.message, () => go('a-jadwal')));
};
const tabJd = () => `<div class="k-seg ev-tabs">${[['susun', 'Susun acara', 'bi-arrows-move'], ['tabel', 'Tabel & jam manual', 'bi-table']].map(x => `<button class="${S.jdTab === x[0] ? 'on' : ''}" data-act="jd-tab" data-v="${x[0]}"><i class="bi ${x[2]}"></i> ${x[1]}</button>`).join('')}</div>`;
ACT['jd-tab'] = a => { if (S.SA && S.SA.dirty && a.dataset.v !== 'susun') { toast('Simpan atau batalkan perubahan susunan dulu.', 'warn'); return; } S.jdTab = a.dataset.v; go('a-jadwal'); };
// Sisipkan tab ke tampilan tabel lama
S.jdTabBar = tabJd;

function muat(d) {
  const rows = {}, hari = {};
  d.rows.forEach(r => { rows[r.eid] = Object.assign({}, r, { aktif: 1 }); (hari[r.hari] = hari[r.hari] || []).push(r.eid); });
  d.batal.forEach(r => { rows[r.eid] = Object.assign({ heats: Math.max(1, Math.ceil(r.n / (Number(d.cfg.lintasan) || 8))), mn: 3, jamManual: '' }, r, { aktif: 0 }); });
  let menit = {}; try { menit = JSON.parse(d.cfg.menit || '{}'); } catch (e) { }
  d.batal.forEach(r => { rows[r.eid].mn = Number(menit[r.d]) || Math.max(2, Math.round(r.d / 25) + 1); });
  if (!Object.keys(hari).length) hari[1] = [];
  S.SA = { d, rows, hari, batal: d.batal.map(r => r.eid), dirty: false, renomor: !d.kunciNo, mulaiNo: 1, sel: null };
}
function hitung() { // estimasi jam per hari, sama dengan perhitungan server
  const A = S.SA, c = A.d.cfg, jeda = Number(c.jeda) || 0, out = {}; let no = A.mulaiNo;
  Object.keys(A.hari).sort((a, b) => a - b).forEach(h => {
    let cur = jamM(c.mulai); out[h] = { mulai: jamF(cur), selesai: '', n: A.hari[h].length };
    A.hari[h].forEach(id => { const r = A.rows[id]; r._no = A.renomor ? no++ : r.no; if (!r.n) { r._jam = ''; return; } let st = cur; if (r.jamManual) st = Math.max(jamM(r.jamManual), 0); r._jam = jamF(st); cur = st + r.heats * r.mn + jeda; r._sel = jamF(cur - jeda); });
    out[h].selesai = A.hari[h].some(id => A.rows[id].n) ? jamF(cur - jeda) : '';
  });
  A.batal.forEach(id => { A.rows[id]._no = A.renomor ? no++ : A.rows[id].no; });
  return out;
}
function kartu(id, i, n) {
  const A = S.SA, r = A.rows[id], kurang = A.d.fase !== 'PENDAFTARAN' && A.d.minp && r.n < A.d.minp;
  return `<li class="sa-it${kurang ? ' warn' : ''}${A.sel === id ? ' sel' : ''}" draggable="true" data-id="${E(id)}"><span class="sa-h" aria-hidden="true"><i class="bi bi-grip-vertical"></i></span><span class="sa-no mono">#${r._no}</span>
<div class="sa-b"><b>${E(r.nama)}</b><small>${E(jn(r.jk))} · ${G_L[r.g] || r.g}</small></div>
<div class="sa-m"><span class="sa-pes${kurang ? ' warn' : ''}" title="Peserta${kurang ? ' (kurang dari minimal ' + A.d.minp + ')' : ''}"><i class="bi bi-people"></i> ${r.n}</span><span class="mono sa-jam">${r._jam || '—'}</span></div>
<div class="sa-a"><button type="button" class="ev-ib" data-act="sa-up" data-id="${E(id)}" ${i === 0 ? 'disabled' : ''} title="Naik" aria-label="Naik"><i class="bi bi-arrow-up"></i></button><button type="button" class="ev-ib" data-act="sa-down" data-id="${E(id)}" ${i === n - 1 ? 'disabled' : ''} title="Turun" aria-label="Turun"><i class="bi bi-arrow-down"></i></button><select class="k-in sa-hr" data-chg="sa-hari" data-id="${E(id)}" aria-label="Pindah hari">${Object.keys(A.hari).concat([String(Object.keys(A.hari).length + 1)]).filter((v, j, a) => a.indexOf(v) === j).map(h => `<option value="${h}"${String(r.hari) === String(h) ? ' selected' : ''}>H${h}</option>`).join('')}</select><button type="button" class="ev-ib del" data-act="sa-batal" data-id="${E(id)}" title="Batalkan nomor (tidak dilaksanakan)" aria-label="Batalkan"><i class="bi bi-x-circle"></i></button></div></li>`;
}
function gambar() {
  const A = S.SA, d = A.d, est = hitung(), hs = Object.keys(A.hari).sort((a, b) => a - b), aktif = hs.reduce((s, h) => s + A.hari[h].length, 0);
  const kurang = hs.reduce((s, h) => s + A.hari[h].filter(id => d.minp && A.rows[id].n < d.minp).length, 0);
  main(`<div class="k-wrap pad">${ph('Jadwal & Susun Acara', 'Seret nomor untuk mengubah urutan atau memindahkan hari. Batalkan nomor yang tidak bisa dilaksanakan; estimasi jam langsung dihitung ulang.')}${tabJd()}
${d.kunciNo ? alertx('warn', `Buku Acara sudah terbit (tahap ${E(FASE_L[d.fase] || d.fase)}). Urutan & hari masih bisa diubah, tetapi <b>nomor acara tidak diurutkan ulang</b> agar sama dengan dokumen. Terbitkan ulang Buku Acara setelah menyimpan.`, 'bi-lock') : ''}
<div class="sa-top"><div class="sa-kpi"><span><b>${aktif}</b> dipertandingkan</span><span><b>${A.batal.length}</b> dibatalkan</span><span class="${kurang ? 'warn' : ''}"><b>${kurang}</b> peserta &lt; ${d.minp || '-'}</span>${hs.map(h => `<span>Hari ${h}: <b>${est[h].mulai}–${est[h].selesai || '?'}</b></span>`).join('')}</div>
<div class="sa-tool"><button class="k-btn k-outline sm" data-act="sa-kurang" ${kurang && d.fase !== 'PENDAFTARAN' ? '' : 'disabled'} title="${d.fase === 'PENDAFTARAN' ? 'Aktif setelah pendaftaran ditutup' : ''}"><i class="bi bi-x-octagon"></i> Batalkan semua &lt; ${d.minp || '-'} peserta</button><select class="k-in sa-sort" data-chg="sa-sort" aria-label="Urutkan otomatis"><option value="">Urutkan otomatis tiap hari…</option><option value="no">Nomor acara lama</option><option value="gaya">Per gaya & jarak, lalu kelompok</option><option value="kel">Per kelompok, lalu gaya & jarak</option><option value="jarak">Jarak pendek dulu</option></select><button class="k-btn k-outline sm" data-act="sa-hari-baru"><i class="bi bi-plus-lg"></i> Tambah hari</button></div></div>
<div class="sa-board" id="sa-board">${hs.map(h => `<section class="sa-day" data-hari="${h}"><header><div><b>Hari ${h}</b><small class="mut">${A.hari[h].length} nomor · mulai ${est[h].mulai}${est[h].selesai ? ' · selesai ±' + est[h].selesai : ''}</small></div></header><ol class="sa-list" data-hari="${h}">${A.hari[h].map((id, i) => kartu(id, i, A.hari[h].length)).join('') || '<li class="sa-empty">Seret nomor ke sini</li>'}</ol></section>`).join('')}</div>
<section class="sa-tray"><header><b><i class="bi bi-slash-circle"></i> Dibatalkan / tidak dilaksanakan (${A.batal.length})</b><small class="mut">Tidak tampil di jadwal, start list, dan Buku Acara. Pendaftarnya perlu dipindah lewat Akun & Berkas.</small></header><div class="sa-tl">${A.batal.map(id => { const r = A.rows[id]; return `<span class="sa-bt"><span class="mono">#${r._no}</span> ${E(r.nama)} · ${E(jn(r.jk))} · ${G_L[r.g] || ''} <small>(${r.n} peserta)</small><button type="button" class="k-btn sm k-outline" data-act="sa-pulih" data-id="${E(id)}">Pulihkan</button></span>`; }).join('') || '<span class="mut sm">Belum ada nomor yang dibatalkan.</span>'}</div></section>
<div class="k-bar sticky sa-save"><label class="k-check1"><input type="checkbox" data-chg="sa-renomor" ${A.renomor ? 'checked' : ''} ${d.kunciNo ? 'disabled' : ''}> Urutkan ulang nomor acara mulai #<input class="k-in sa-mno" type="number" min="1" value="${A.mulaiNo}" data-chg="sa-mno" ${d.kunciNo ? 'disabled' : ''} aria-label="Nomor awal"> sesuai susunan</label><span class="sa-dirty">${A.dirty ? '<i class="bi bi-circle-fill"></i> Ada perubahan belum disimpan' : ''}</span><button class="k-btn k-ghostw" data-act="sa-reset" ${A.dirty ? '' : 'disabled'}>Batalkan perubahan</button><button class="k-btn lg k-orange" data-act="sa-simpan" ${A.dirty || A.renomor ? '' : 'disabled'}><i class="bi bi-check2-circle"></i> Simpan susunan</button></div></div>`);
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
INP['sa-sort'] = i => {
  const A = S.SA, k = i.value; if (!k) return; const jen = {}; (S.B.jenjang || []).forEach((j, n) => { jen[j.kode] = n; });
  const f = { no: (a, b) => a.no - b.no, gaya: (a, b) => (GU[gaya(a.nama)] || 9) - (GU[gaya(b.nama)] || 9) || a.d - b.d || (jen[a.jk] || 0) - (jen[b.jk] || 0) || a.g.localeCompare(b.g), kel: (a, b) => (jen[a.jk] || 0) - (jen[b.jk] || 0) || (GU[gaya(a.nama)] || 9) - (GU[gaya(b.nama)] || 9) || a.d - b.d || a.g.localeCompare(b.g), jarak: (a, b) => a.d - b.d || (GU[gaya(a.nama)] || 9) - (GU[gaya(b.nama)] || 9) || (jen[a.jk] || 0) - (jen[b.jk] || 0) || a.g.localeCompare(b.g) }[k];
  Object.keys(A.hari).forEach(h => A.hari[h].sort((x, y) => f(A.rows[x], A.rows[y]))); toast('Urutan tiap hari diatur ulang. Putra selalu sebelum putri.'); ubah();
};
INP['sa-renomor'] = i => { S.SA.renomor = i.checked; gambar(); };
INP['sa-mno'] = i => { S.SA.mulaiNo = Math.max(1, Number(i.value) || 1); gambar(); };
ACT['sa-reset'] = () => { S.SA.dirty = false; go('a-jadwal'); };
ACT['sa-simpan'] = async a => {
  const A = S.SA, urutan = []; Object.keys(A.hari).sort((x, y) => x - y).forEach(h => A.hari[h].forEach(id => urutan.push({ eid: id, hari: Number(h) })));
  busy(a, true);
  try { const r = await rp('jd.susun', { urutan, batal: A.batal, renomor: A.renomor && !A.d.kunciNo, mulai: A.mulaiNo }); toast(r.message, r.data.pesertaBatal ? 'warn' : 'ok'); A.dirty = false; bustCache('evg'); bustCache('evl'); bustCache('jd'); await S.refreshAll(); go('a-jadwal'); }
  catch (e) { toast(e.message, 'err'); busy(a, false); }
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
