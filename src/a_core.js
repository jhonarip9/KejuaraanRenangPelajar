(function () {
'use strict';
/* ===== Dasar ===== */
const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const E = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const LS = { g(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, s(k, v) { try { localStorage.setItem(k, v); } catch (e) { } }, d(k) { try { localStorage.removeItem(k); } catch (e) { } } };
const S = { me: null, token: null, B: null, route: 'home', param: null, rt: 0, cache: {}, files: {}, timers: [] };
const V = {}, ACT = {}, SUBMIT = {}, INP = {};
const G_L = { PUTRA: 'Putra', PUTRI: 'Putri' };
const ROLE_L = { SUPER_ADMIN: 'Super Admin', VERIFIKATOR: 'Admin Pendaftaran', OPERATOR_LAPANGAN: 'Admin Input Data', WASIT_UTAMA: 'Admin Wasit', KONTINGEN: 'Akun Pendaftar' };
const TIPE_L = { SEKOLAH: 'Sekolah', KLUB: 'Klub', MANDIRI: 'Mandiri' };
const FASE = ['PENDAFTARAN', 'VERIFIKASI', 'STARTLIST', 'BUKU_ACARA', 'PELAKSANAAN', 'SELESAI'];
const FASE_L = { PENDAFTARAN: 'Pendaftaran', VERIFIKASI: 'Verifikasi', STARTLIST: 'Start List', BUKU_ACARA: 'Buku Acara', PELAKSANAAN: 'Pelaksanaan', SELESAI: 'Selesai' };
const ST = { MENUNGGU: ['k-warn', 'Menunggu'], REVISI: ['k-info', 'Perlu revisi'], DITOLAK: ['k-err', 'Ditolak'], SAH: ['k-ok', 'Sah'], PENDING: ['k-warn', 'Menunggu'], VERIFIED: ['k-ok', 'Terverifikasi'], REVISION_REQUIRED: ['k-info', 'Revisi'], REJECTED: ['k-err', 'Ditolak'], UNPAID: ['k-neu', 'Belum bayar'], PENDING_CONFIRMATION: ['k-warn', 'Bayar menunggu'], PAID_VERIFIED: ['k-ok', 'Lunas'], APPROVED: ['k-ok', 'Disetujui'], NONE: ['k-neu', 'Belum mulai'], DRAFT: ['k-warn', 'Draf'], SUBMITTED: ['k-info', 'Menunggu wasit'], OK: ['k-ok', 'OK'], DQ: ['k-err', 'DQ'], DNS: ['k-neu', 'DNS'], DNF: ['k-neu', 'DNF'], ACTIVE: ['k-ok', 'Aktif'], NONAKTIF: ['k-neu', 'Nonaktif'] };
const pill = (s, t) => { const x = ST[s] || ['k-neu', s || '-']; return `<span class="k-pill ${x[0]}">${E(t || x[1])}</span>`; };
const rupiah = n => 'Rp ' + Number(n || 0).toLocaleString('id-ID');
const BLN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const fdt = s => { if (!s) return '-'; const d = new Date(String(s).length <= 10 ? s + 'T00:00:00' : s); return isNaN(d) ? E(s) : d.getDate() + ' ' + BLN[d.getMonth()] + ' ' + d.getFullYear() + (String(s).length > 10 ? ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) : ''); };
// jnK: nama kelas saja (untuk arsip/rekor lintas event). jn: label kelompok event aktif (huruf/kelas sesuai pengaturan event).
const jnK = k => { const j = ((S.B || {}).jenjang || []).filter(x => x.kode === k)[0]; if (j) return j.nama; const m = String(k || '').match(/^(TK|SD|SMP|SMA)_(\d+)(?:_(\d+))?$/); return m ? `${m[1]} Kelas ${m[2]}${m[3] ? '-' + m[3] : ''}` : k || ''; };
const jn = k => { const B = S.B || {}, j = (B.jenjang || []).filter(x => x.kode === k)[0], md = (B.cfg || {}).label_kelompok || 'KELAS'; if (j && j.huruf && md === 'HURUF') return 'Kelompok ' + j.huruf; if (j && j.huruf && md === 'KEDUANYA') return 'Kelompok ' + j.huruf + ' · ' + j.nama; return jnK(k); };
const jkDariKelas = k => (((S.B || {}).jenjang || []).filter(j => Number(k) >= Number(j.min) && Number(k) <= Number(j.max))[0] || {}).kode || '';
// Biaya entri ke-idx seorang atlet (mode paket: total per atlet = harga paket)
const feeIdx = (e, idx) => { const c = (S.B || {}).cfg || {}; if (c.biaya_mode !== 'PAKET') return Number(e.fee) || 0; const pk = Number(c.biaya_paket) || 0, mx = Math.max(1, Number(c.max_individu) || 1), b = Math.floor(pk / mx), r = pk - b * mx; return idx >= mx ? 0 : b + (idx < r ? 1 : 0); };
const kls = n => n === 0 || n === '0' ? 'TK' : n;
const evTitle = e => `${e.nama} ${jn(e.jk)} ${G_L[e.g] || e.g}`;
const thumb = (id, w) => id ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(id)}&sz=w${w || 400}` : '';
const logoUrl = id => `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w240`;
const handle = u => { const m = String(u || '').match(/\/(@?[\w.\-]+)\/?(\?.*)?$/); return m ? (m[1].charAt(0) === '@' ? m[1] : '@' + m[1]) : u; };
const initials = n => String(n || '?').trim().split(/\s+/).slice(0, 2).map(x => x[0]).join('').toUpperCase();
const cfgv = k => ((S.B || {}).cfg || {})[k] || '';

/* ===== RPC & cache SWR ===== */
// Saat server Apps Script penuh (batas eksekusi bersamaan), coba ulang otomatis dengan jeda acak.
const SIBUK = /too many simultaneous|invoked too many|Sistem sedang sibuk|Koneksi gagal|timed out|exceeded maximum execution|Tidak terhubung/i;
function rp(action, data, n) {
  // Jaringan putus/timeout sudah dicoba ulang di panggil(). Di sini hanya mengulang bila server melapor kunci sibuk (aksi belum dijalankan).
  n = n || 0;
  return rp1(action, data).catch(e => {
    if (n < 2 && (e.code === 'SIBUK' || /Sistem sedang sibuk/.test(e.message))) return new Promise(r => setTimeout(r, 900 * (n + 1) + Math.random() * 1200)).then(() => rp(action, data, n + 1));
    if (e.net || SIBUK.test(e.message)) e.message = navigator.onLine === false ? 'Tidak ada koneksi internet. Data terakhir tetap ditampilkan.' : 'Server sedang ramai pengunjung atau koneksi lambat. Coba lagi beberapa detik lagi.';
    throw e;
  });
}
/* ===== Transport REST ke Google Apps Script (fetch, tanpa google.script.run) =====
   - POST text/plain;charset=utf-8 → tidak memicu preflight CORS.
   - Token sesi di body (bukan URL).
   - Baca: permintaan kembar menumpang promise yang sama; beberapa baca dalam satu tick digabung jadi satu 'batch' (1 eksekusi server).
   - Tulis: membawa reqId unik → aman dicoba ulang saat koneksi HP putus (server idempoten).
   - Batas waktu: baca 25 dtk, tulis 90 dtk (unggah besar 180 dtk); coba ulang otomatis bila jaringan/5xx. */
const KCFG = window.KRP_CONFIG || {};
const GAS_URL = String(KCFG.GAS_URL || '').trim();
const API_SIAP = /^https:\/\/script\.google\.com\/(a\/[^/]+\/)?macros\/s\/[A-Za-z0-9_-]{20,}\/exec$/.test(GAS_URL) && !/GANTI|XXXX/.test(GAS_URL);
const API_TULIS = new Set(__API_TULIS__);
const Perf = { log: [], add(o) { this.log.push(o); if (this.log.length > 60) this.log.shift(); }, rata() { const L = this.log.filter(x => x.ok); if (!L.length) return null; const t = L.reduce((s, x) => s + x.total, 0) / L.length, m = L.reduce((s, x) => s + (x.server || 0), 0) / L.length; return { n: L.length, total: Math.round(t), server: Math.round(m), net: Math.round(t - m) }; } };
let _epoch = 0, _antre = [], _antreT = 0; const _inflight = {};
const reqId = () => { try { const a = new Uint8Array(12); crypto.getRandomValues(a); return Array.from(a, b => b.toString(36).padStart(2, '0')).join('').slice(0, 20); } catch (e) { return Date.now().toString(36) + Math.random().toString(36).slice(2, 12); } };
async function kirimAPI(body, tulis) {
  const besar = body.length > 1e6, batas = tulis ? (besar ? 180000 : 90000) : 25000;
  const ac = typeof AbortController !== 'undefined' ? new AbortController() : null, tm = ac ? setTimeout(() => ac.abort(), batas) : 0;
  try {
    const r = await fetch(GAS_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body, redirect: 'follow', cache: 'no-store', signal: ac ? ac.signal : undefined });
    if (!r.ok) throw Object.assign(new Error(r.status === 429 ? 'Server sedang ramai pengunjung.' : 'Server bermasalah (' + r.status + ').'), { net: r.status >= 500 || r.status === 429 });
    const t = await r.text(); try { return JSON.parse(t); } catch (e) { if (/too many|invoked too many|simultaneous|Service unavailable|timed out|exceeded/i.test(t)) throw Object.assign(new Error('Server sedang ramai pengunjung.'), { net: true }); throw Object.assign(new Error(/<html/i.test(t) ? 'Alamat API belum benar atau akses Web App belum "Anyone".' : 'Respons server tidak valid.'), { net: false }); }
  } catch (e) {
    if (e.name === 'AbortError') throw Object.assign(new Error('Koneksi lambat — waktu habis. Coba lagi.'), { net: true });
    if (e.net === undefined) throw Object.assign(new Error(navigator.onLine === false ? 'Tidak ada koneksi internet.' : 'Koneksi gagal. Coba lagi.'), { net: true });
    throw e;
  } finally { if (tm) clearTimeout(tm); }
}
async function panggil(payload, tulis, n) {
  n = n || 0; const t0 = performance.now();
  try { const r = await kirimAPI(JSON.stringify(payload), tulis); Perf.add({ a: payload.action, total: Math.round(performance.now() - t0), server: r.ms || 0, ok: true }); return r; }
  catch (e) { Perf.add({ a: payload.action, total: Math.round(performance.now() - t0), ok: false }); if (e.net && n < 2) { await new Promise(z => setTimeout(z, 700 * (n + 1) + Math.random() * 600)); return panggil(payload, tulis, n + 1); } throw e; }
}
function hasil1(r) { if (!r || !r.success) { if (r && r.code === 'AUTH' && S.me) logout(true); throw Object.assign(new Error(r ? r.message : 'Gagal'), { code: r && r.code, info: r && r.info }); } return r; }
function flushAntre() {
  const q = _antre; _antre = []; _antreT = 0; if (!q.length) return;
  if (q.length === 1) { const x = q[0]; panggil({ action: x.action, token: S.token || '', data: x.data }, false).then(r => { try { x.res(hasil1(r)); } catch (e) { x.rej(e); } }, x.rej); return; }
  for (let i = 0; i < q.length; i += 8) {
    const part = q.slice(i, i + 8);
    panggil({ action: 'batch', token: S.token || '', data: { calls: part.map(x => ({ action: x.action, data: x.data })) } }, false).then(r => {
      if (!r || !r.success) return part.forEach(x => { try { hasil1(r); } catch (e) { x.rej(e); } });
      part.forEach((x, j) => { try { x.res(hasil1(r.data.hasil[j])); } catch (e) { x.rej(e); } });
    }, e => part.forEach(x => x.rej(e)));
  }
}
function rp1(action, data) {
  if (!API_SIAP) return Promise.reject(new Error('Konfigurasi belum lengkap: isi alamat API (GAS_URL) di js/config.js.'));
  data = data || {};
  if (API_TULIS.has(action)) { _epoch++; Object.keys(_inflight).forEach(k => delete _inflight[k]); const id = reqId(); return panggil({ action, token: S.token || '', data, reqId: id }, true).then(hasil1); }
  const k = _epoch + '|' + (S.token || '').slice(-12) + '|' + action + '|' + JSON.stringify(data);
  if (_inflight[k]) return _inflight[k];
  const p = new Promise((res, rej) => { _antre.push({ action, data, res, rej }); if (!_antreT) _antreT = setTimeout(flushAntre, 0); });
  _inflight[k] = p; const hapus = () => { if (_inflight[k] === p) delete _inflight[k]; }; p.then(hapus, hapus);
  return p;
}
function swr(key, action, data, cb, ttl) {
  const t = S.rt, k = 'krp_c_' + (S.me ? S.me.id : 'pub') + '_' + key; let hit = S.cache[k];
  if (!hit) { const raw = LS.g(k); if (raw) { try { hit = JSON.parse(raw); } catch (e) { } } }
  const live = (d, c) => { if (t === S.rt) cb(d, c); };
  if (hit) { S.cache[k] = hit; live(hit.d, true); if (Date.now() - hit.t < (ttl || 8000)) return Promise.resolve(hit.d); }
  return rp(action, data).then(r => { const js = JSON.stringify(r.data); if (!hit || JSON.stringify(hit.d) !== js) live(r.data, false); S.cache[k] = { t: Date.now(), d: r.data }; if (js.length < 400000) LS.s(k, JSON.stringify(S.cache[k])); return r.data; }).catch(e => { if (!hit) { if (t === S.rt) errView(e.message, () => go(S.route, S.param)); } else toast(e.message, 'err'); });
}
function bustCache(prefix) { Object.keys(S.cache).forEach(k => { if (!prefix || k.indexOf(prefix) >= 0) delete S.cache[k]; }); try { Object.keys(localStorage).forEach(k => { if (k.indexOf('krp_c_') === 0 && (!prefix || k.indexOf(prefix) >= 0)) localStorage.removeItem(k); }); } catch (e) { } }

/* ===== UI dasar ===== */
function toast(msg, type) {
  const el = document.createElement('div'); el.className = 'k-toast ' + (type || 'ok');
  el.innerHTML = `<i class="bi ${type === 'err' ? 'bi-exclamation-octagon' : type === 'warn' ? 'bi-exclamation-triangle' : 'bi-check-circle'}"></i><span>${E(msg)}</span>`;
  $('#toasts').appendChild(el); setTimeout(() => el.remove(), type === 'err' ? 6000 : 3500);
}
function modal(title, body, foot, wide) {
  const m = $('#modal'); m.hidden = false; document.body.classList.add('noscroll');
  m.innerHTML = `<div class="k-mback" data-act="mx"></div><div class="k-modal${wide ? ' wide' : ''}" role="dialog" aria-modal="true"><div class="k-mh"><h3>${title}</h3><button class="k-ibtn" data-act="mx" aria-label="Tutup"><i class="bi bi-x-lg"></i></button></div><div class="k-mb">${body}</div>${foot ? `<div class="k-mf">${foot}</div>` : ''}</div>`;
  const f = $('input,textarea,select', m); if (f && !wide) setTimeout(() => f.focus(), 30);
}
function closeModal() { const m = $('#modal'); m.hidden = true; m.innerHTML = ''; document.body.classList.remove('noscroll'); }
function ask(msg, okLabel, danger) {
  return new Promise(res => {
    modal('Konfirmasi', `<p>${msg}</p>`, `<button class="k-btn k-ghostw" data-act="ask-n">Batal</button><button class="k-btn ${danger ? 'k-danger' : 'k-navy'}" data-act="ask-y">${okLabel || 'Ya, lanjutkan'}</button>`);
    S.askRes = v => { S.askRes = null; closeModal(); res(v); };
  });
}
function busy(btn, on) { if (!btn) return; if (on) { btn.disabled = true; btn._h = btn.innerHTML; btn.innerHTML = '<span class="k-spin"></span> Memproses…'; } else { btn.disabled = false; if (btn._h) btn.innerHTML = btn._h; } }
const ph = (t, sub, right) => `<div class="k-ph"><div><h1>${t}</h1>${sub ? `<p>${sub}</p>` : ''}</div>${right ? `<div class="k-ph-r">${right}</div>` : ''}</div>`;
const card = (t, body, right, p0) => `<section class="k-card"><div class="k-card-h"><h3>${t}</h3>${right || ''}</div><div class="k-card-b${p0 ? ' p0' : ''}">${body}</div></section>`;
const empty = (ic, msg) => `<div class="k-empty"><i class="bi ${ic || 'bi-inbox'}"></i><p>${msg}</p></div>`;
const kpi = (l, v, ic, sub) => `<div class="k-kpi"><div class="k-kpi-t"><span>${l}</span><i class="bi ${ic || 'bi-bar-chart'}"></i></div><b>${v}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
const alertx = (t, msg, ic) => `<div class="k-alert ${t}"><i class="bi ${ic || 'bi-info-circle'}"></i><div>${msg}</div></div>`;
const skel = () => '<div class="k-wrap pad"><div class="k-skel"></div><div class="k-skel"></div><div class="k-skel"></div></div>';
function errView(msg, retry) { $('#main').innerHTML = `<div class="k-wrap pad">${empty('bi-wifi-off', E(msg))}<div style="text-align:center"><button class="k-btn k-navy" data-act="retry">Coba lagi</button></div></div>`; S.retry = retry; }
const field = (label, inner, req, hint) => `<label class="k-f"><span>${label}${req ? ' <i class="req">*</i>' : ''}</span>${inner}${hint ? `<small>${hint}</small>` : ''}</label>`;
const inp = (name, v, o) => { o = o || {}; return `<input class="k-in" name="${name}" value="${E(v == null ? '' : v)}" ${o.type ? `type="${o.type}"` : ''} ${o.ph ? `placeholder="${E(o.ph)}"` : ''} ${o.req ? 'required' : ''} ${o.ro ? 'readonly' : ''} ${o.max ? `maxlength="${o.max}"` : ''} ${o.attr || ''}>`; };
const sel = (name, opts, v, attr) => `<select class="k-in" name="${name}" ${attr || ''}>${opts.map(o => { const a = Array.isArray(o) ? o : [o, o]; return `<option value="${E(a[0])}"${String(a[0]) === String(v) ? ' selected' : ''}>${E(a[1])}</option>`; }).join('')}</select>`;
function form(el) { const o = {}; (el.elements ? [...el.elements].filter(i => i.name) : $$('[name]', el)).forEach(i => { if (i.type === 'checkbox') o[i.name] = i.checked; else if (i.type === 'radio') { if (i.checked) o[i.name] = i.value; } else o[i.name] = i.value; }); return o; }
function dz(kind, label, hint, existing) {
  return `<div class="k-dz${existing ? ' ok' : ''}" data-dz="${kind}"><label><i class="bi ${existing ? 'bi-check-circle' : 'bi-cloud-arrow-up'}"></i><b>${label}</b><small class="dzn">${existing ? 'Berkas sudah ada — unggah untuk mengganti' : (hint || 'PDF / JPG / PNG, maks 5 MB')}</small><input type="file" hidden data-file="${kind}" accept="application/pdf,image/jpeg,image/png,image/webp"></label></div>`;
}
function readFile(file, imgOnly) {
  return new Promise((res, rej) => {
    if (!file) return rej(new Error('Berkas tidak dipilih.'));
    if (file.size > 5 * 1024 * 1024) return rej(new Error('Ukuran berkas maksimal 5 MB.'));
    if (['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].indexOf(file.type) < 0) return rej(new Error('Format harus PDF, JPG, PNG, atau WEBP.'));
    if (imgOnly && file.type.indexOf('image/') !== 0) return rej(new Error('Berkas harus berupa gambar.'));
    const r = new FileReader(); r.onload = () => res({ name: file.name, mime: file.type, b64: String(r.result).split(',')[1] }); r.onerror = () => rej(new Error('Gagal membaca berkas.')); r.readAsDataURL(file);
  });
}
async function uploadPending(kinds) {
  const out = {};
  for (const k of kinds) { const f = S.files[k]; if (f) { const r = await rp('m.upload', { kind: k, name: f.name, mime: f.mime, b64: f.b64 }); out[k] = { id: r.data.id, sig: r.data.sig }; } }
  return out;
}
/* ===== Unduh Buku Acara & Buku Hasil lengkap ===== */
ACT['buku-dl'] = async a => { busy(a, true); try { const r = await rp('pub.dok', { id: a.dataset.id }); dlB64(r.data.name, r.data.mime, r.data.b64); toast('Unduhan dimulai.'); } catch (e) { toast(e.message, 'err'); } busy(a, false); };
const BUKU_IT = [['BUKU_ACARA', 'Buku Acara Lengkap', 'Meet program · start list seluruh nomor', 'bi-journal-text'], ['RESULT_BOOK', 'Buku Hasil Lengkap', 'Official results · hasil resmi seluruh nomor', 'bi-trophy']];
function bukuBox(docs, col) {
  const d = docs || [], last = j => d.filter(x => x.jenis === j).slice(-1)[0];
  return `<div class="bk-dl${col ? ' col' : ''}">${BUKU_IT.map(([j, t, s, ic]) => { const x = last(j); return `<div class="k-tile bk-i${x ? '' : ' off'}"><span class="ti"><i class="bi ${ic}"></i></span><b>${t}</b><p class="mut sm">${x ? E(s) + (x.at ? ` · ${fdt(x.at)}` : '') : 'Belum terbit. Akan tersedia setelah panitia menerbitkannya.'}</p>${x ? `<div class="bk-act"><a class="k-btn sm k-orange" target="_blank" rel="noopener" href="https://drive.google.com/uc?export=download&amp;id=${encodeURIComponent(x.id)}"><i class="bi bi-download"></i> Unduh PDF</a><a class="k-btn sm k-outline" target="_blank" rel="noopener" href="https://drive.google.com/file/d/${encodeURIComponent(x.id)}/view"><i class="bi bi-box-arrow-up-right"></i> Buka</a><button class="k-btn sm k-ghostw" data-act="buku-dl" data-id="${E(x.did)}" title="Jika tautan Drive tidak bisa dibuka">Unduh cadangan</button></div>` : ''}</div>`; }).join('')}</div>`;
}
function dlB64(name, mime, b64) { const bin = atob(b64), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); const u = URL.createObjectURL(new Blob([a], { type: mime })), l = document.createElement('a'); l.href = u; l.download = name; document.body.appendChild(l); l.click(); l.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }
function viewFile(id, label) {
  if (!id) return toast('Berkas belum ada.', 'warn');
  modal(E(label || 'Berkas'), '<div class="k-skel"></div>', '', true);
  rp('file.data', { id }).then(r => {
    const d = r.data, bin = atob(d.b64), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    const u = URL.createObjectURL(new Blob([a], { type: d.mime })), mb = $('#modal .k-mb'); if (!mb) return;
    mb.innerHTML = d.mime === 'application/pdf' ? `<iframe class="k-fv" src="${u}"></iframe>` : `<img class="k-fv" style="object-fit:contain" src="${u}" alt="">`;
    mb.insertAdjacentHTML('beforeend', `<div class="k-bar"><a class="k-btn k-outline sm" href="${u}" download="${E(d.name)}"><i class="bi bi-download"></i> Unduh</a></div>`);
  }).catch(e => { const mb = $('#modal .k-mb'); if (mb) mb.innerHTML = alertx('err', E(e.message)); });
}
const _ls = {};
function loadScript(src) { if (_ls[src]) return _ls[src]; const p = _ls[src] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = () => { s.remove(); rej(new Error('Gagal memuat pustaka.')); }; document.head.appendChild(s); }); p.catch(() => { delete _ls[src]; }); return p; }
async function xlsx(sheets, fname) {
  await loadScript('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js');
  const wb = XLSX.utils.book_new();
  sheets.forEach(sh => { const ws = XLSX.utils.json_to_sheet(sh.rows.length ? sh.rows : [{ Info: 'Tidak ada data' }]); const cols = Object.keys(sh.rows[0] || { Info: 1 }); ws['!cols'] = cols.map(c => ({ wch: Math.min(48, Math.max(c.length + 2, ...sh.rows.slice(0, 80).map(r => String(r[c] == null ? '' : r[c]).length + 2))) })); XLSX.utils.book_append_sheet(wb, ws, sh.name.slice(0, 31)); });
  XLSX.writeFile(wb, fname);
}
let _chartP = null; // Chart.js dimuat sekali saat grafik pertama dibutuhkan (tidak membebani halaman publik)
function chart(id, cfg) { const c = document.getElementById(id); if (!c) return; if (!window.Chart) { if (!_chartP) _chartP = loadScript('https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js'); _chartP.then(() => { if (window.Chart) chart(id, cfg); }, () => { }); return; } if (c._ch) c._ch.destroy(); c._ch = new Chart(c, cfg); }
function clearTimers() { S.timers.forEach(clearInterval); S.timers = []; }

/* ===== Router & shell ===== */
const NAV_PUB = [['home', 'Beranda', 'bi-house'], ['info', 'Info Lomba', 'bi-info-circle'], ['jadwal', 'Jadwal & Start List', 'bi-calendar3'], ['live', 'Hasil Live', 'bi-broadcast'], ['klas', 'Klasemen', 'bi-trophy'], ['rekor', 'Rekor', 'bi-stopwatch'], ['atlet', 'Atlet', 'bi-people'], ['galeri', 'Galeri', 'bi-images'], ['arsip', 'Arsip', 'bi-archive']];
const NAV_APP = {
  SUPER_ADMIN: [['a-dash', 'Dashboard', 'bi-speedometer2'], ['a-panduan', 'Panduan Event', 'bi-compass'], ['a-event', 'Event & Nomor Lomba', 'bi-calendar-event'], ['a-fase', 'Tahapan Event', 'bi-signpost-split'], ['a-verif', 'Verifikasi', 'bi-patch-check'], ['a-manual', 'Pendaftaran Manual', 'bi-person-plus'], ['a-png', 'Pengajuan', 'bi-arrow-left-right'], ['a-klaim', 'Klaim Prestasi', 'bi-award'], ['a-akun', 'Akun & Berkas', 'bi-person-vcard'], ['a-jadwal', 'Jadwal Acara', 'bi-clock-history'], ['a-hasil', 'Input Hasil', 'bi-pencil-square'], ['a-wasit', 'Pengesahan Wasit', 'bi-pen'], ['a-impor', 'Impor Hasil Lama', 'bi-file-earmark-arrow-up'], ['a-dok', 'Dokumen & Logo', 'bi-file-earmark-pdf'], ['a-kurasi', 'Kurasi Puspresnas', 'bi-award'], ['a-gal', 'Dokumentasi', 'bi-camera'], ['a-lap', 'Laporan & Excel', 'bi-file-earmark-spreadsheet'], ['a-cfg', 'Pengaturan Web', 'bi-gear'], ['a-usr', 'Pengguna', 'bi-person-gear'], ['a-aud', 'Log Audit', 'bi-journal-text'], ['a-ars', 'Tutup Event & Arsip', 'bi-archive'], ['a-sistem', 'Sistem & Migrasi', 'bi-hdd-network']],
  VERIFIKATOR: [['a-dash', 'Dashboard', 'bi-speedometer2'], ['a-verif', 'Verifikasi', 'bi-patch-check'], ['a-png', 'Pengajuan', 'bi-arrow-left-right'], ['a-klaim', 'Klaim Prestasi', 'bi-award'], ['a-lap', 'Laporan', 'bi-bar-chart']],
  OPERATOR_LAPANGAN: [['a-hasil', 'Input Hasil', 'bi-pencil-square'], ['a-gal', 'Dokumentasi', 'bi-camera']],
  WASIT_UTAMA: [['a-wasit', 'Pengesahan Wasit', 'bi-pen']],
  KONTINGEN: [['m-dash', 'Beranda Akun', 'bi-house'], ['m-nomor', 'Daftar Nomor Lomba', 'bi-plus-circle'], ['m-baru', 'Tambah Atlet Baru', 'bi-person-plus'], ['m-png', 'Pengajuan Perubahan', 'bi-arrow-left-right'], ['m-akun', 'Akun Saya', 'bi-person-circle']]
};
const isApp = r => /^[am]-/.test(r);
const ADMIN_JS = 'js/admin.js?v=' + (KCFG.VERSI || '2');
function muatAdmin() { if (!S._adm) S._adm = loadScript(ADMIN_JS).then(() => { if (!V['a-dash']) throw new Error('Modul admin tidak lengkap.'); S._admOK = true; }).catch(e => { S._adm = null; throw e; }); return S._adm; }
function go(route, param, noPush) {
  if (isApp(route) && !S.me) { route = 'login'; param = null; }
  if (/^a-/.test(route) && !V[route] && !S._admOK) { // modul panitia dimuat saat dibutuhkan (pengunjung publik tidak mengunduhnya)
    const rt = ++S.rt; document.body.dataset.shell = 'app'; S.route = route; S.param = param; shell(); $('#main').innerHTML = skel();
    muatAdmin().then(() => { if (S.rt === rt) go(route, param, noPush); }, e => { if (S.rt === rt) errView('Gagal memuat modul panitia: ' + e.message, () => go(route, param, noPush)); });
    return;
  }
  closeModal(); clearTimers(); S.rt++; S.route = route; S.param = param; S.files = {};
  const app = isApp(route); document.body.dataset.shell = app ? 'app' : 'public';
  shell(); const f = V[route] || V.home; $('#main').innerHTML = skel();
  try { f(param); } catch (e) { console.error(e); errView('Terjadi kesalahan tampilan: ' + e.message, () => go(route, param)); }
  window.scrollTo(0, 0); const sd = $('#side'); if (sd) sd.classList.remove('open');
  try { const h = '#/' + route + (param ? '/' + encodeURIComponent(param) : ''); if (location.hash !== h) { if (noPush === 'r' || noPush) history.replaceState(null, '', h); else history.pushState(null, '', h); } } catch (e) { }
}
function shell() {
  const B = S.B || { cfg: {} }, c = B.cfg, name = c.portal_nama || 'Kejuaraan Renang Pelajar', wl = (B.logos || [])[0];
  const brandImg = c.logo_url ? `<img class="brand-img" src="${E(c.logo_url)}" alt="">` : wl ? `<img class="brand-img" src="${logoUrl(wl.id)}" alt="">` : '<span class="brand-ic"><i class="bi bi-water"></i></span>';
  const brand = `<a class="brand" href="#" data-go="${S.me ? (S.me.role === 'KONTINGEN' ? 'm-dash' : NAV_APP[S.me.role][0][0]) : 'home'}">${brandImg}<span><b>${E(name)}</b><small>${E(c.portal_sub || c.musim || '')}</small></span></a>`;
  const dark = document.documentElement.dataset.theme === 'dark', th = `<button class="k-ibtn" data-act="theme" aria-label="Ganti tema"><i class="bi ${dark ? 'bi-sun' : 'bi-moon-stars'}"></i></button>`;
  if (!isApp(S.route)) {
    $('#pubbar').innerHTML = `${c.banner_teks ? `<div class="k-banner">${E(c.banner_teks)}</div>` : ''}<div class="k-wrap tb">${brand}<nav class="k-nav">${NAV_PUB.map(n => `<a class="k-nl${S.route === n[0] ? ' on' : ''}" href="#" data-go="${n[0]}">${n[1]}</a>`).join('')}</nav><div class="tb-r">${th}${S.me ? `<button class="k-btn k-orange sm" data-go="${S.me.role === 'KONTINGEN' ? 'm-dash' : NAV_APP[S.me.role][0][0]}"><i class="bi bi-grid"></i> Panel</button>` : `<button class="k-btn k-outline sm" style="color:#fff;border-color:rgba(255,255,255,.5)" data-go="login">Masuk</button><button class="k-btn k-orange sm" data-go="daftar">Daftar Akun</button>`}</div></div>${c.teks_berjalan ? `<div class="k-ticker"><div><span>${E(c.teks_berjalan)}</span><span>${E(c.teks_berjalan)}</span></div></div>` : ''}`;
    $('#bnav').innerHTML = [['home', 'Beranda', 'bi-house'], ['jadwal', 'Jadwal', 'bi-calendar3'], ['live', 'Live', 'bi-broadcast'], ['PENDAFTARAN', 'VERIFIKASI'].indexOf(c.fase || 'PENDAFTARAN') >= 0 ? ['info', 'Info', 'bi-info-circle'] : ['klas', 'Klasemen', 'bi-trophy'], [S.me ? (S.me.role === 'KONTINGEN' ? 'm-dash' : NAV_APP[S.me.role][0][0]) : 'login', S.me ? 'Panel' : 'Masuk', S.me ? 'bi-grid' : 'bi-box-arrow-in-right']].map(n => `<a href="#" data-go="${n[0]}" class="${S.route === n[0] ? 'on' : ''}"><i class="bi ${n[2]}"></i>${n[1]}</a>`).join('');
    const sm = [['ig1', 'bi-instagram'], ['ig2', 'bi-instagram'], ['yt1', 'bi-youtube'], ['yt2', 'bi-youtube']].filter(x => c[x[0]]);
    $('#foot').innerHTML = `<div class="k-wrap"><div class="fg"><div>${brand}<p>${E(c.tagline || '')}</p></div><div><h4>Navigasi</h4>${NAV_PUB.slice(0, 5).map(n => `<a href="#" data-go="${n[0]}">${n[1]}</a>`).join('')}</div><div><h4>Ikuti Kami</h4>${sm.map(x => `<a href="${E(c[x[0]])}" target="_blank" rel="noopener"><i class="bi ${x[1]}"></i> ${E(handle(c[x[0]]))}</a>`).join('')}</div><div><h4>Kontak</h4>${c.kontak_email ? `<span><i class="bi bi-envelope"></i> ${E(c.kontak_email)}</span>` : ''}${c.kontak_telp ? `<span><i class="bi bi-telephone"></i> ${E(c.kontak_telp)}</span>` : ''}<span><i class="bi bi-geo-alt"></i> ${E(c.lokasi || '')}</span></div></div>${(B.logos || []).length ? `<div class="wlogos">${B.logos.map(l => `<img src="${logoUrl(l.id)}" alt="${E(l.nama)}" title="${E(l.nama)}" loading="lazy">`).join('')}</div>` : ''}<div class="fb"><span>© ${new Date().getFullYear()} ${E(name)}</span></div></div>`;
  } else {
    const nav = NAV_APP[S.me.role] || [];
    $('#side').innerHTML = `<div class="brand sb">${brandImg}<span><b>${E(name)}</b><small>${E(ROLE_L[S.me.role])}</small></span></div><nav>${nav.map(n => `<a class="sl${S.route === n[0] || (S.route === 'm-atlet' && n[0] === 'm-dash') || (S.route === 'a-evform' && n[0] === 'a-event') ? ' on' : ''}" href="#" data-go="${n[0]}"><i class="bi ${n[2]}"></i>${n[1]}</a>`).join('')}</nav><a class="sl" href="#" data-go="home"><i class="bi bi-globe"></i>Lihat Portal Publik</a><a class="sl" href="#" data-act="logout"><i class="bi bi-box-arrow-left"></i>Keluar</a>`;
    const cur = nav.filter(n => n[0] === (S.route === 'a-evform' ? 'a-event' : S.route))[0];
    $('#appbar').innerHTML = `<button class="k-ibtn burger" data-act="burger" aria-label="Menu"><i class="bi bi-list"></i></button><h2>${E(cur ? cur[1] : 'Panel')}</h2><div class="ab-r">${th}<div class="ab-u"><span class="k-av ph" style="width:34px;height:34px">${E(initials(S.me.nama))}</span><div class="sm"><b>${E(S.me.nama)}</b><br><span class="mut">${E(ROLE_L[S.me.role])}</span></div></div></div>`;
  }
}
function logout(expired) { S.me = null; S.token = null; LS.d('krp_t'); LS.d('krp_me'); bustCache(); if (expired) toast('Sesi berakhir. Silakan masuk kembali.', 'warn'); go('login'); }
function setSession(token, me) { S.token = token; S.me = me; LS.s('krp_t', token); LS.s('krp_me', JSON.stringify(me)); }
const home = () => S.me ? (S.me.role === 'KONTINGEN' ? 'm-dash' : NAV_APP[S.me.role][0][0]) : 'home';

/* ===== Delegasi event ===== */
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); go(g.dataset.go, g.dataset.p || null); return; }
  const a = e.target.closest('[data-act]'); if (!a) return;
  const f = ACT[a.dataset.act]; if (f) { if (a.tagName === 'A') e.preventDefault(); f(a, e); }
});
document.addEventListener('submit', e => { const f = e.target.closest('[data-submit]'); if (!f) return; e.preventDefault(); const h = SUBMIT[f.dataset.submit]; if (h) h(f, e); });
document.addEventListener('input', e => { const i = e.target.closest('[data-in]'); if (i && INP[i.dataset.in]) INP[i.dataset.in](i, e); });
document.addEventListener('change', async e => {
  const f = e.target.closest('[data-file]'); if (f) {
    const box = f.closest('.k-dz'), kind = f.dataset.file, img = f.dataset.img === '1';
    try { const r = await readFile(f.files[0], img); S.files[kind] = r; box.classList.remove('err'); box.classList.add('ok'); $('.dzn', box).textContent = r.name; $('i', box).className = 'bi bi-check-circle'; if (f.dataset.after && INP[f.dataset.after]) INP[f.dataset.after](f, e); }
    catch (x) { delete S.files[kind]; box.classList.remove('ok'); box.classList.add('err'); $('.dzn', box).textContent = x.message; toast(x.message, 'err'); }
    return;
  }
  const c = e.target.closest('[data-chg]'); if (c && INP[c.dataset.chg]) INP[c.dataset.chg](c, e);
});
document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('#modal').hidden) { if (S.askRes) S.askRes(false); else closeModal(); } });
Object.assign(ACT, {
  mx() { if (S.askRes) S.askRes(false); else closeModal(); }, 'ask-y'() { if (S.askRes) S.askRes(true); }, 'ask-n'() { if (S.askRes) S.askRes(false); },
  retry() { if (S.retry) S.retry(); else go(S.route, S.param); },
  theme() { const d = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'; document.documentElement.dataset.theme = d; LS.s('krp_th', d); shell(); },
  burger() { $('#side').classList.toggle('open'); }, logout() { ask('Keluar dari akun ini?', 'Keluar').then(y => { if (y) { logout(false); toast('Anda telah keluar.'); } }); }
});

window.KRP = { Perf, GAS_URL, API_SIAP, muatAdmin, bukuBox, $, $$, E, LS, S, V, ACT, SUBMIT, INP, G_L, ROLE_L, TIPE_L, FASE, FASE_L, ST, pill, rupiah, fdt, jn, jnK, jkDariKelas, feeIdx, kls, evTitle, thumb, logoUrl, handle, initials, cfgv, rp, swr, bustCache, toast, modal, closeModal, ask, busy, ph, card, empty, kpi, alertx, skel, errView, field, inp, sel, form, dz, readFile, uploadPending, dlB64, viewFile, loadScript, xlsx, chart, clearTimers, go, shell, logout, setSession, home, NAV_APP, isApp };
})();
