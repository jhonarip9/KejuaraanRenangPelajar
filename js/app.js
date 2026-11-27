/* KRP Pro v2.4.0 — modul publik & akun pendaftar. Dibuat otomatis oleh tools/build.js dari folder src/. Jangan diedit langsung. */
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
const API_TULIS = new Set(["a.kontak","ars.run","auth.daftar","bs.cabut","bs.kirim","bs.mode","bs.rekor","cfg.simpan","dok.buat","dok.logo.set","dok.logo.up","dok.publik","ev.aktifkan","ev.daftar","ev.demo","ev.demo.hapus","ev.hapus","ev.kel","ev.nomor.gen","ev.nomor.hapus","ev.nomor.massal","ev.nomor.rapikan","ev.nomor.simpan","ev.preset","ev.reset","ev.reset.pedoman","ev.simpan","ev.status","fase.set","fase.tarik","fase.terbit","gal.del","gal.link","gal.up","h.sahkan","h.simpan","h.tarik","imp.final","imp.hapus","imp.kolam","imp.rekor","imp.simpan","jd.buka","jd.final","jd.set","jd.susun","kur.img","kur.simpan","m.atlet","m.daftarnomor","m.klaim","m.klaim.batal","m.pengajuan","m.perbaiki","man.simpan","me.sandi","mig.run","mst.default","mst.hapus","mst.simpan","p.aksi","pf.hapus","pf.simpan","pf.tampil","s.run","sa.akun.hapus","sa.akun.sandi","sa.akun.status","sa.atlet.ubah","sa.entri.hapus","sa.entri.tambah","sa.entri.ubah","sa.klaim.aksi","sb.paket","sb.pindah","sys.darurat","sys.keluarsemua","sys.rollover","usr.hapus","usr.reset","usr.simpan","v.aksi"]);
const Perf = { log: [], add(o) { this.log.push(o); if (this.log.length > 60) this.log.shift(); }, rata() { const L = this.log.filter(x => x.ok); if (!L.length) return null; const t = L.reduce((s, x) => s + x.total, 0) / L.length, m = L.reduce((s, x) => s + (x.server || 0), 0) / L.length; return { n: L.length, total: Math.round(t), server: Math.round(m), net: Math.round(t - m) }; } };
let _epoch = 0, _antre = [], _antreT = 0; const _inflight = {};
const reqId = () => { try { const a = new Uint8Array(12); crypto.getRandomValues(a); return Array.from(a, b => b.toString(36).padStart(2, '0')).join('').slice(0, 20); } catch (e) { return Date.now().toString(36) + Math.random().toString(36).slice(2, 12); } };
async function kirimAPI(body, tulis) {
  const besar = body.length > 1e6, batas = (tulis || body.length > 2e5) ? (besar ? 180000 : 90000) : 25000; // unggah berkas (bukan aksi tulis) juga diberi waktu panjang
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
  if (API_TULIS.has(action)) { _epoch++; S.hl = {}; Object.keys(_inflight).forEach(k => delete _inflight[k]); const id = reqId(); return panggil({ action, token: S.token || '', data, reqId: id }, true).then(hasil1); }
  if (action === 'm.upload') return panggil({ action, token: S.token || '', data }, false).then(hasil1); // berkas: kiriman sendiri (tidak digabung batch), paralel
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
/* ===== Prefetch: data menu berikutnya diambil sebelum diklik → pindah menu tanpa jeda =====
   PRE[route] = param => [[kunciSwr, aksi, data, ttl, lanjut?], …] — lanjut(data) opsional untuk prefetch tahap kedua. Prefetch memakai jalur baca biasa, jadi beberapa
   menu digabung dalam satu 'batch' (1 eksekusi server) dan hasilnya langsung dipakai swr() saat menu dibuka. */
const PRE = {}, _preT = {};
const ckey = key => 'krp_c_' + (S.me ? S.me.id : 'pub') + '_' + key;
function cacheSegar(key, ttl) { const k = ckey(key); let h = S.cache[k]; if (!h) { const raw = LS.g(k); if (raw) { try { h = JSON.parse(raw); S.cache[k] = h; } catch (e) { } } } return h && Date.now() - h.t < (ttl || 8000) ? h : null; }
function simpanCache(key, d) { const k = ckey(key); S.cache[k] = { t: Date.now(), d }; const js = JSON.stringify(S.cache[k]); if (js.length < 400000) LS.s(k, js); }
function prefetch(route, param) {
  const f = PRE[route]; if (!f || !API_SIAP || navigator.onLine === false) return;
  const tag = route + '|' + (param || ''); if (_preT[tag] && Date.now() - _preT[tag] < 15000) return; _preT[tag] = Date.now();
  let L; try { L = f(param) || []; } catch (e) { return; }
  L.forEach(x => { if (!x) return; const h = cacheSegar(x[0], x[3] || 15000), lanjut = x[4]; if (h) { if (lanjut) try { lanjut(h.d); } catch (e) { } return; } rp1(x[1], x[2] || {}).then(r => { simpanCache(x[0], r.data); if (lanjut) lanjut(r.data); }).catch(() => { }); });
}
// Panitia: setelah panel tampil, data semua menu perannya diambil saat browser senggang (± 1–2 eksekusi server).
function prefetchPanel() {
  if (!S.me || S.me.role === 'KONTINGEN' || (S._preP && Date.now() - S._preP < 180000)) return; S._preP = Date.now();
  const jalan = () => { if (!S.me) return; (NAV_APP[S.me.role] || []).forEach(n => { if (n[0] !== S.route && !(KRP.PRE_BERAT || {})[n[0]]) prefetch(n[0]); }); };
  if (window.requestIdleCallback) requestIdleCallback(jalan, { timeout: 3000 }); else setTimeout(jalan, 1200);
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
  return `<div class="k-dz${existing ? ' ok' : ''}" data-dz="${kind}"><label><i class="bi ${existing ? 'bi-check-circle' : 'bi-cloud-arrow-up'}"></i><b>${label}</b><small class="dzn">${existing ? 'Berkas sudah ada — unggah untuk mengganti' : (hint || 'Foto JPG/PNG (otomatis diperkecil) atau PDF maks 5 MB')}</small><input type="file" hidden data-file="${kind}" accept="application/pdf,image/jpeg,image/png,image/webp"></label></div>`;
}
const MAKS_BERKAS = 5 * 1024 * 1024, MAKS_FOTO_ASLI = 25 * 1024 * 1024;
function bacaB64(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = () => rej(new Error('Gagal membaca berkas.')); r.readAsDataURL(file); });
}
// Foto/scan dari HP (3–12 MB) diperkecil di perangkat sebelum dikirim: sisi terpanjang maks 1600 px, JPEG mutu 0,82.
// Hasil umumnya 200–500 KB: unggah lebih cepat di sinyal lemah dan kuota Google Drive panitia jauh lebih awet. PDF tidak diubah.
function kompresGambar(file, sisi, mutu) {
  return new Promise(res => {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || typeof URL === 'undefined' || !URL.createObjectURL) return res(null);
    const url = URL.createObjectURL(file), img = new Image(), akhir = v => { try { URL.revokeObjectURL(url); } catch (e) { } res(v); };
    img.onload = () => {
      try {
        const k = Math.min(1, sisi / Math.max(img.naturalWidth, img.naturalHeight)), w = Math.max(1, Math.round(img.naturalWidth * k)), h = Math.max(1, Math.round(img.naturalHeight * k));
        const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
        x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(img, 0, 0, w, h);
        const d = c.toDataURL('image/jpeg', mutu); akhir(/^data:image\/jpeg/.test(d) ? { b64: d.split(',')[1], mime: 'image/jpeg' } : null);
      } catch (e) { akhir(null); }
    };
    img.onerror = () => akhir(null); img.src = url;
  });
}
async function readFile(file, imgOnly, kompres) {
  if (!file) throw new Error('Berkas tidak dipilih.');
  if (['application/pdf', 'image/jpeg', 'image/png', 'image/webp'].indexOf(file.type) < 0) throw new Error('Format harus PDF, JPG, PNG, atau WEBP.');
  const gambar = file.type.indexOf('image/') === 0;
  if (imgOnly && !gambar) throw new Error('Berkas harus berupa gambar.');
  if (file.size > (kompres && gambar ? MAKS_FOTO_ASLI : MAKS_BERKAS)) throw new Error(kompres && gambar ? 'Ukuran foto maksimal 25 MB.' : 'Ukuran berkas maksimal 5 MB.');
  let hasil = file.size <= MAKS_BERKAS ? { name: file.name, mime: file.type, b64: await bacaB64(file) } : null;
  if (kompres && gambar && (file.size > 400 * 1024 || !hasil)) {
    const z = await kompresGambar(file, 1600, 0.82);
    if (z && (!hasil || z.b64.length < hasil.b64.length)) hasil = { name: file.name.replace(/\.[^.]+$/, '') + '.jpg', mime: z.mime, b64: z.b64 };
  }
  if (!hasil) throw new Error('Foto terlalu besar dan tidak bisa diperkecil di perangkat ini. Pilih foto maksimal 5 MB.');
  if (hasil.b64.length * 0.75 > MAKS_BERKAS) throw new Error('Ukuran berkas maksimal 5 MB.');
  hasil.uk = reqId(); // kunci unggah: dikirim ulang saat koneksi putus → server mengembalikan berkas yang sama (tidak dobel)
  return hasil;
}
// Unggah berkas yang dipilih: maks 3 sekaligus. Berkas yang sudah berhasil terunggah diingat (f.up),
// jadi bila pengiriman formulir gagal (sinyal/server), mencoba lagi tidak mengunggah ulang.
async function uploadPending(kinds) {
  const out = {}, list = kinds.filter(k => S.files[k]); let i = 0, galat = null;
  const kerja = async () => {
    while (i < list.length) {
      const k = list[i++], f = S.files[k];
      try { if (!f.up) { const r = await rp('m.upload', { kind: k, name: f.name, mime: f.mime, b64: f.b64, uk: f.uk }); f.up = { id: r.data.id, sig: r.data.sig }; } out[k] = f.up; }
      catch (e) { galat = galat || e; } // berkas lain tetap diselesaikan; yang gagal saja yang diulang nanti
    }
  };
  await Promise.all([kerja(), kerja(), kerja()]);
  if (galat) throw galat;
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
const NAV_PUB = [['home', 'Beranda', 'bi-house'], ['info', 'Info Lomba', 'bi-info-circle'], ['jadwal', 'Jadwal & Start List', 'bi-calendar3'], ['live', 'Hasil Live', 'bi-broadcast'], ['klas', 'Klasemen', 'bi-trophy'], ['rekor', 'Rekor', 'bi-stopwatch'], ['atlet', 'Atlet', 'bi-people'], ['galeri', 'Galeri', 'bi-images'], ['riwayat', 'Riwayat', 'bi-journal-richtext']];
const NAV_APP = {
  SUPER_ADMIN: [['a-dash', 'Dashboard', 'bi-speedometer2'], ['a-panduan', 'Panduan Event', 'bi-compass'], ['a-event', 'Event & Nomor Lomba', 'bi-calendar-event'], ['a-fase', 'Tahapan Event', 'bi-signpost-split'], ['a-verif', 'Verifikasi', 'bi-patch-check'], ['a-manual', 'Pendaftaran Manual', 'bi-person-plus'], ['a-png', 'Pengajuan', 'bi-arrow-left-right'], ['a-klaim', 'Klaim Prestasi', 'bi-award'], ['a-akun', 'Akun & Berkas', 'bi-person-vcard'], ['a-nomor', 'Nomor Peserta', 'bi-list-check'], ['a-jadwal', 'Jadwal Acara', 'bi-clock-history'], ['a-hasil', 'Input Hasil', 'bi-pencil-square'], ['a-wasit', 'Pengesahan Wasit', 'bi-pen'], ['a-best', 'Best Swimmer', 'bi-trophy'], ['a-impor', 'Impor Hasil Lama', 'bi-file-earmark-arrow-up'], ['a-dok', 'Dokumen & Logo', 'bi-file-earmark-pdf'], ['a-kurasi', 'Kurasi Puspresnas', 'bi-award'], ['a-porto', 'Portofolio', 'bi-journal-richtext'], ['a-gal', 'Dokumentasi', 'bi-camera'], ['a-lap', 'Laporan & Excel', 'bi-file-earmark-spreadsheet'], ['a-cfg', 'Pengaturan Web', 'bi-gear'], ['a-usr', 'Pengguna', 'bi-person-gear'], ['a-aud', 'Log Audit', 'bi-journal-text'], ['a-ars', 'Tutup Event & Arsip', 'bi-archive'], ['a-sistem', 'Sistem & Migrasi', 'bi-hdd-network']],
  VERIFIKATOR: [['a-dash', 'Dashboard', 'bi-speedometer2'], ['a-verif', 'Verifikasi', 'bi-patch-check'], ['a-png', 'Pengajuan', 'bi-arrow-left-right'], ['a-klaim', 'Klaim Prestasi', 'bi-award'], ['a-lap', 'Laporan', 'bi-bar-chart']],
  OPERATOR_LAPANGAN: [['a-hasil', 'Input Hasil', 'bi-pencil-square'], ['a-gal', 'Dokumentasi', 'bi-camera']],
  WASIT_UTAMA: [['a-wasit', 'Pengesahan Wasit', 'bi-pen']],
  KONTINGEN: [['m-dash', 'Beranda Akun', 'bi-house'], ['m-nomor', 'Daftar Nomor Lomba', 'bi-plus-circle'], ['m-baru', 'Tambah Atlet Baru', 'bi-person-plus'], ['m-png', 'Pengajuan Perubahan', 'bi-arrow-left-right'], ['m-akun', 'Akun Saya', 'bi-person-circle']]
};
const isApp = r => /^[am]-/.test(r);
const ADMIN_JS = 'js/admin.js?v=2.4.0-ca941d9a';
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
  if (app && S.me && S.me.role !== 'KONTINGEN' && S._admOK) setTimeout(prefetchPanel, 900);
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
    $('#foot').innerHTML = `<div class="k-wrap"><div class="fg"><div>${brand}<p>${E(c.tagline || '')}</p></div><div><h4>Navigasi</h4>${NAV_PUB.map(n => `<a href="#" data-go="${n[0]}">${n[1]}</a>`).join('')}</div><div><h4>Ikuti Kami</h4>${sm.map(x => `<a href="${E(c[x[0]])}" target="_blank" rel="noopener"><i class="bi ${x[1]}"></i> ${E(handle(c[x[0]]))}</a>`).join('')}</div><div><h4>Kontak</h4>${c.kontak_email ? `<span><i class="bi bi-envelope"></i> ${E(c.kontak_email)}</span>` : ''}${c.kontak_telp ? `<span><i class="bi bi-telephone"></i> ${E(c.kontak_telp)}</span>` : ''}<span><i class="bi bi-geo-alt"></i> ${E(c.lokasi || '')}</span></div></div>${(B.logos || []).length ? `<div class="wlogos">${B.logos.map(l => `<img src="${logoUrl(l.id)}" alt="${E(l.nama)}" title="${E(l.nama)}" loading="lazy">`).join('')}</div>` : ''}<div class="fb"><span>© ${new Date().getFullYear()} ${E(name)}</span></div></div>`;
  } else {
    const nav = NAV_APP[S.me.role] || [];
    $('#side').innerHTML = `<div class="brand sb">${brandImg}<span><b>${E(name)}</b><small>${E(ROLE_L[S.me.role])}</small></span></div><nav>${nav.map(n => `<a class="sl${S.route === n[0] || (S.route === 'm-atlet' && n[0] === 'm-dash') || (S.route === 'a-evform' && n[0] === 'a-event') ? ' on' : ''}" href="#" data-go="${n[0]}"><i class="bi ${n[2]}"></i>${n[1]}</a>`).join('')}</nav><a class="sl" href="#" data-go="home"><i class="bi bi-globe"></i>Lihat Portal Publik</a>${S.me.role !== 'KONTINGEN' && !S.me.darurat && S.me.id !== 'darurat' ? '<a class="sl" href="#" data-act="sandi-saya"><i class="bi bi-key"></i>Ganti kata sandi</a>' : ''}<a class="sl" href="#" data-act="logout"><i class="bi bi-box-arrow-left"></i>Keluar</a>`;
    const cur = nav.filter(n => n[0] === (S.route === 'a-evform' ? 'a-event' : S.route))[0];
    $('#appbar').innerHTML = `<button class="k-ibtn burger" data-act="burger" aria-label="Menu"><i class="bi bi-list"></i></button><h2>${E(cur ? cur[1] : 'Panel')}</h2><div class="ab-r">${th}<div class="ab-u"><span class="k-av ph" style="width:34px;height:34px">${E(initials(S.me.nama))}</span><div class="sm"><b>${E(S.me.nama)}</b><br><span class="mut">${E(ROLE_L[S.me.role])}</span></div></div></div>`;
  }
}
function logout(expired) { S.me = null; S.token = null; LS.d('krp_t'); LS.d('krp_me'); bustCache(); if (expired) toast('Sesi berakhir. Silakan masuk kembali.', 'warn'); go('login'); }
function setSession(token, me) { S.token = token; S.me = me; LS.s('krp_t', token); LS.s('krp_me', JSON.stringify(me)); }
const home = () => S.me ? (S.me.role === 'KONTINGEN' ? 'm-dash' : NAV_APP[S.me.role][0][0]) : 'home';

/* ===== Prefetch berdasarkan niat: kursor berhenti di menu, jari menyentuh, atau fokus keyboard ===== */
let _niatT = 0;
const tautanGo = e => e.target && e.target.closest ? e.target.closest('[data-go]') : null;
document.addEventListener('pointerover', e => { const g = tautanGo(e); if (!g || e.pointerType === 'touch') return; clearTimeout(_niatT); _niatT = setTimeout(() => prefetch(g.dataset.go, g.dataset.p || null), 70); }, { passive: true });
document.addEventListener('pointerout', e => { if (tautanGo(e)) clearTimeout(_niatT); }, { passive: true });
document.addEventListener('touchstart', e => { const g = tautanGo(e); if (g) prefetch(g.dataset.go, g.dataset.p || null); }, { passive: true });
document.addEventListener('focusin', e => { const g = tautanGo(e); if (g) prefetch(g.dataset.go, g.dataset.p || null); });

/* ===== Delegasi event ===== */
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]'); if (g) { e.preventDefault(); go(g.dataset.go, g.dataset.p || null); return; }
  const a = e.target.closest('[data-act]'); if (!a) return;
  const f = ACT[a.dataset.act]; if (f) { if (a.tagName === 'A') e.preventDefault(); f(a, e); }
});
SUBMIT['sandi-saya'] = async f => { const d = form(f), b = $('button.k-orange', f); if (d.baru !== d.ulang) return toast('Ulangi kata sandi tidak sama.', 'err'); busy(b, true); try { const r = await rp('me.sandi', { lama: d.lama, baru: d.baru }); setSession(r.data.token, S.me); closeModal(); toast(r.message); } catch (e) { toast(e.message, 'err'); busy(b, false); } };
document.addEventListener('submit', e => { const f = e.target.closest('[data-submit]'); if (!f) return; e.preventDefault(); const h = SUBMIT[f.dataset.submit]; if (h) h(f, e); });
document.addEventListener('input', e => { const i = e.target.closest('[data-in]'); if (i && INP[i.dataset.in]) INP[i.dataset.in](i, e); });
document.addEventListener('change', async e => {
  const f = e.target.closest('[data-file]'); if (f) {
    const box = f.closest('.k-dz'), kind = f.dataset.file, img = f.dataset.img === '1';
    try { const r = await readFile(f.files[0], img, true); S.files[kind] = r; box.classList.remove('err'); box.classList.add('ok'); $('.dzn', box).textContent = r.name; $('i', box).className = 'bi bi-check-circle'; if (f.dataset.after && INP[f.dataset.after]) INP[f.dataset.after](f, e); }
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
  burger() { $('#side').classList.toggle('open'); },
  'sandi-saya'() { $('#side').classList.remove('open'); modal('Ganti kata sandi saya', `<form data-submit="sandi-saya" autocomplete="off"><p class="sm">Akun: <b>${E(S.me.nama)}</b> · ${E(ROLE_L[S.me.role] || '')}</p>${field('Kata sandi lama', '<input class="k-in" type="password" name="lama" autocomplete="current-password" required>', 1)}${field('Kata sandi baru', '<input class="k-in" type="password" name="baru" minlength="8" autocomplete="new-password" required>', 1, 'Minimal 8 karakter, berisi huruf dan angka.')}${field('Ulangi kata sandi baru', '<input class="k-in" type="password" name="ulang" minlength="8" autocomplete="new-password" required>', 1)}<p class="mut sm">Perangkat lain yang masuk dengan akun ini akan keluar otomatis.</p><div class="k-bar"><button type="button" class="k-btn k-ghostw" data-act="mx">Batal</button><button class="k-btn k-orange">Simpan</button></div></form>`); }, logout() { ask('Keluar dari akun ini?', 'Keluar').then(y => { if (y) { logout(false); toast('Anda telah keluar.'); } }); }
});

window.KRP = { PRE, prefetch, prefetchPanel, cacheSegar, simpanCache, Perf, GAS_URL, API_SIAP, muatAdmin, bukuBox, $, $$, E, LS, S, V, ACT, SUBMIT, INP, G_L, ROLE_L, TIPE_L, FASE, FASE_L, ST, pill, rupiah, fdt, jn, jnK, jkDariKelas, feeIdx, kls, evTitle, thumb, logoUrl, handle, initials, cfgv, rp, swr, bustCache, toast, modal, closeModal, ask, busy, ph, card, empty, kpi, alertx, skel, errView, field, inp, sel, form, dz, readFile, uploadPending, dlB64, viewFile, loadScript, xlsx, chart, clearTimers, go, shell, logout, setSession, home, NAV_APP, isApp };
})();

(function () {
'use strict';
const { $, $$, E, S, V, ACT, SUBMIT, INP, G_L, TIPE_L, pill, rupiah, fdt, jn, jnK, kls, evTitle, thumb, logoUrl, handle, initials, cfgv, rp, swr, toast, modal, closeModal, busy, ph, card, empty, kpi, alertx, field, inp, sel, form, dz, setSession, home, go, chart } = KRP;
const main = h => { $('#main').innerHTML = h; };
const dayLabel = h => 'Hari ' + h;
const sosmed = () => [['ig1', 'bi-instagram', 'Instagram'], ['ig2', 'bi-instagram', 'Instagram'], ['yt1', 'bi-youtube', 'YouTube'], ['yt2', 'bi-youtube', 'YouTube']].filter(x => cfgv(x[0]));
const sosTiles = () => `<div class="g2 sos">${sosmed().map(x => `<a class="k-tile" href="${E(cfgv(x[0]))}" target="_blank" rel="noopener"><span class="ti"><i class="bi ${x[1]}"></i></span><b>${x[2]}</b><p class="mut sm">${E(handle(cfgv(x[0])))}</p></a>`).join('')}</div>`;
const logoStrip = () => ((S.B || {}).logos || []).length ? `<div class="wlogos lt">${S.B.logos.map(l => `<img src="${logoUrl(l.id)}" alt="${E(l.nama)}" title="${E(l.nama)}" loading="lazy">`).join('')}</div>` : '';
function sisaHari(s) { if (!s) return null; const d = new Date(String(s).length <= 10 ? s + 'T23:59:59' : s); if (isNaN(d)) return null; return Math.ceil((d - Date.now()) / 86400000); }

/* ===== Beranda (portal) ===== */
const heroFakta = c => { const L = [c.biaya_mode === 'PAKET' && Number(c.biaya_paket) ? `<span><i class="bi bi-cash-coin"></i> ${rupiah(c.biaya_paket)} / atlet (${c.max_individu} nomor)</span>` : '', c.min_nomor && c.min_nomor === c.max_individu && Number(c.min_nomor) > 1 ? `<span><i class="bi bi-list-check"></i> Wajib ${E(c.min_nomor)} nomor</span>` : '', c.kolam ? `<span><i class="bi bi-water"></i> Kolam ${c.kolam === 'SCM' ? '25 m' : '50 m'}</span>` : '', (S.B.jenjang || []).some(j => j.huruf) ? `<span><i class="bi bi-people"></i> Kelompok ${(S.B.jenjang || []).map(j => j.huruf).filter(Boolean).join('–').replace(/^(.).*(.)$/, '$1–$2')}</span>` : ''].filter(Boolean); return L.length ? `<div class="hm-fakta">${L.join('')}</div>` : ''; };
const BLN3 = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
function rentangT(a, b) { const p = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? [+m[1], +m[2] - 1, +m[3]] : null; }, x = p(a), y = p(b) || x; if (!x) return ''; if (x.join() === y.join()) return `${x[2]} ${BLN3[x[1]]} ${x[0]}`; if (x[0] === y[0] && x[1] === y[1]) return `${x[2]}–${y[2]} ${BLN3[x[1]]} ${x[0]}`; return `${x[2]} ${BLN3[x[1]]} – ${y[2]} ${BLN3[y[1]]} ${y[0]}`; }
const HM_ST = { AKAN_DATANG: ['hm-p blue', 'Akan datang'], BERLANGSUNG: ['hm-p ora', 'Berlangsung'], LEWAT: ['hm-p neu', 'Selesai lomba'], SELESAI: ['hm-p neu', 'Selesai'], DIUMUMKAN: ['hm-p blue', 'Segera'], DRAFT: ['hm-p neu', 'Draf'] };
const HM_DF = { DIBUKA: ['hm-p green', 'Pendaftaran dibuka'], DITUTUP: ['hm-p red', 'Pendaftaran ditutup'], BELUM_DIBUKA: ['hm-p blue', 'Segera dibuka'], BELUM_AKTIF: ['hm-p neu', 'Pendaftaran belum dibuka'], SELESAI: ['hm-p neu', 'Selesai'] };
const hp = (m, k) => m[k] ? `<span class="${m[k][0]}">${E(m[k][1])}</span>` : '';
const tglMs = (s, akhir) => { if (!s) return NaN; return new Date(String(s).length <= 10 ? s + (akhir ? 'T23:59:59' : 'T00:00:00') : s).getTime(); };
function cdTick() { const el = $('#hm-cd'); if (!el) return; const t = Number(el.dataset.t), d = Math.max(0, t - Date.now()), v = [Math.floor(d / 864e5), Math.floor(d / 36e5) % 24, Math.floor(d / 6e4) % 60, Math.floor(d / 1e3) % 60]; $$('#hm-cd b').forEach((b, i) => { b.textContent = String(v[i]).padStart(2, '0'); }); }
V.home = function () {
  const B = S.B, c = B.cfg, r = B.ring, ag = B.agenda || [], ev = ag.filter(x => x.aktif)[0];
  const acc = S.me ? (S.me.role === 'KONTINGEN' ? 'm-dash' : home()) : 'daftar';
  let kartu = []; try { kartu = JSON.parse(c.kartu_json || '[]'); } catch (e) { }
  const syarat = String(c.persyaratan || '').split('\n').filter(Boolean), top = (B.top || []);
  const evNama = ev ? ev.nama : c.app_name, buka = c.buka === '1';
  let cd = null; if (ev) { const tt = tglMs(ev.tutup, true), tm = tglMs(ev.mulai, false); if (buka && tt > Date.now()) cd = [tt, 'Sisa waktu menuju penutupan pendaftaran']; else if (tm > Date.now()) cd = [tm, 'Hitung mundur menuju hari perlombaan']; }
  const stat = (ic, v, l) => `<div class="hm-stat"><span class="hm-si"><i class="bi ${ic}"></i></span><div><b>${v}</b><small>${l}</small></div></div>`;
  const evCard = x => { const pct = x.kuota ? Math.min(100, Math.round(x.terisi / x.kuota * 100)) : 0; return `<article class="hm-card"><div class="hm-pills"><span class="hm-p gold">${E(x.musim)}</span>${hp(HM_ST, x.st)}${hp(HM_DF, x.daftar)}</div><h3>${E(x.nama)}</h3><p><i class="bi bi-calendar-event"></i> ${rentangT(x.mulai, x.selesai) || '—'}</p><p><i class="bi bi-geo-alt"></i> ${E([x.venue, x.kota].filter(Boolean).join(', ') || '—')}</p><div class="hm-kq"><span>Kuota terisi</span><b>${x.terisi} / ${x.kuota ? x.kuota + ' atlet (' + pct + '%)' : '∞ atlet'}</b></div><div class="hm-bar"><i style="width:${x.kuota ? pct : Math.min(100, x.terisi)}%"></i></div><div class="hm-cact">${x.aktif ? '<button class="k-btn hm-lite" data-go="info">Lihat detail <i class="bi bi-chevron-right"></i></button>' : `<span class="hm-note"><i class="bi bi-hourglass-split"></i> ${x.buka ? 'Pendaftaran dibuka ' + fdt(x.buka) : 'Info pendaftaran segera diumumkan'}</span>`}${x.aktif && x.daftar === 'DIBUKA' ? `<button class="k-btn k-orange" data-go="${acc}">Daftar</button>` : ''}</div></article>`; };
  main(`<section class="hm-hero"><div class="k-wrap hm-g"><div class="hm-l">${c.tingkat_event ? `<span class="hm-tag">Tingkat ${E(c.tingkat_event)}</span>` : `<span class="hm-tag">Musim ${E(c.musim)}</span>`}
<h1 class="hm-h1">${E(c.portal_nama || 'Kejuaraan Renang Pelajar')}${c.hero_aksen ? `<span>${E(c.hero_aksen)}</span>` : ''}</h1><p class="hm-lead">${E(c.tagline || c.subjudul || '')}</p>
<div class="hcta"><button class="k-btn lg k-orange" data-go="${acc}"><i class="bi bi-person-plus"></i> ${S.me ? 'Buka Panel Saya' : E(c.cta1 || 'Daftar Sekarang')}</button><button class="k-btn lg hm-glass" data-go="jadwal"><i class="bi bi-calendar3"></i> Lihat Jadwal Perlombaan</button></div></div>
<div class="hm-evc"><div class="hm-pills">${ev ? hp(HM_ST, ev.st) + hp(HM_DF, ev.daftar) : `<span class="${buka ? 'hm-p green' : 'hm-p red'}">${buka ? 'Pendaftaran dibuka' : 'Pendaftaran ditutup'}</span>`}</div><h2>${E(evNama)}</h2><p><i class="bi bi-calendar-event"></i> ${E(c.tanggal_teks)}</p><p><i class="bi bi-geo-alt"></i> ${E(c.lokasi)}</p>${heroFakta(c)}<div class="hm-evb"><button class="k-btn hm-gold" data-go="info">Detail event <i class="bi bi-arrow-right"></i></button><button class="k-btn hm-glass sm" data-go="live"><i class="bi bi-broadcast"></i> ${E(c.cta2 || 'Hasil Live')}</button></div></div></div></section>
<div class="k-wrap hm-stats">${stat('bi-people', r.atlet, 'Atlet terdata')}${stat('bi-building', r.kontingen, 'Sekolah / klub')}${stat('bi-list-ol', r.nomor, 'Nomor lomba')}${stat('bi-trophy', r.medali || 0, 'Medali dibagikan')}</div>
${ev && cd ? `<div class="k-wrap"><div class="hm-cdbox"><div class="hm-cdl"><span class="hm-p red">${buka ? 'Seri terdekat' : 'Segera dimulai'}</span><h3>${E(ev.nama)}</h3><p class="mut">${cd[1]}</p></div><div class="hm-cd" id="hm-cd" data-t="${cd[0]}">${['Hari', 'Jam', 'Menit', 'Detik'].map(l => `<div><b>00</b><small>${l}</small></div>`).join('')}</div>${buka ? `<button class="k-btn lg k-orange" data-go="${acc}">Registrasi Atlet</button>` : `<button class="k-btn lg k-navy" data-go="jadwal">Lihat Jadwal</button>`}</div></div>` : ''}
${ag.length ? `<div class="k-wrap pad"><div class="hm-sh"><div><small>KALENDER MUSIM</small><h2>Kejuaraan mendatang</h2></div><a class="k-lnk" href="#" data-go="jadwal">Buka seluruh jadwal <i class="bi bi-arrow-right"></i></a></div><div class="hm-cards">${ag.map(evCard).join('')}</div></div>` : ''}
${(B.baru || []).length ? `<div class="k-wrap"><div class="k-newrec hm-rec"><b><i class="bi bi-stars"></i> Rekor baru</b>${B.baru.map(x => `<div>${E(x.nama)} — ${E(x.event)} ${G_L[x.g] || ''} <span class="mono">${E(x.waktu)}</span></div>`).join('')}</div></div>` : ''}
${logoStrip()}
<div class="k-wrap pad"><div class="k-sh"><small>CARA DAFTAR</small><h2>Satu akun, daftar sekali, ikut berkali-kali</h2></div>
<ol class="k-steps"><li><span>1</span><h4>Buat akun sekali</h4><p class="mut sm">Pilih jenis akun: Sekolah, Klub, atau Pribadi (mandiri). Unggah surat mandat/SK satu kali saja.</p></li><li><span>2</span><h4>Daftarkan atlet sekali</h4><p class="mut sm">Biodata, foto, akte, dan surat sekolah tersimpan di akun untuk musim-musim berikutnya.</p></li><li><span>3</span><h4>Klik nama, pilih nomor</h4><p class="mut sm">Untuk pendaftaran berikutnya cukup pilih atlet dan nomor lomba — tanpa unggah ulang berkas.</p></li><li><span>4</span><h4>Unggah bukti bayar</h4><p class="mut sm">Satu bukti bayar untuk semua atlet yang dipilih. Panitia memverifikasi.</p></li><li><span>5</span><h4>Start list & lomba</h4><p class="mut sm">Setelah pendaftaran ditutup, start list dan buku acara terbit otomatis dengan estimasi jam.</p></li></ol></div>
<div class="k-surf"><div class="k-wrap pad"><div class="g2"><div>${top.length ? `<div class="k-sh"><small>KLASEMEN</small><h2>Sekolah teratas</h2></div>${top.map((t, i) => `<div class="k-card top"><div class="k-card-b"><span class="rk r${i + 1}">${i + 1}</span><div><b>${E(t.nama)}</b><br><small class="mut">${E(t.kota || '')}</small></div><span class="mm"><span class="md g">${t.e}</span><span class="md s">${t.p}</span><span class="md b">${t.b}</span></span><span class="pt mono"><b>${t.poin}</b> poin</span></div></div>`).join('')}<a class="k-lnk" href="#" data-go="klas">Lihat klasemen lengkap →</a>` : `<div class="k-sh"><small>SYARAT</small><h2>Persyaratan Peserta</h2></div>`}</div>
<div><div class="k-sh"><small>PERSYARATAN</small><h2>Berkas yang diperlukan</h2></div><ul class="k-check">${syarat.map(s => `<li><i class="bi bi-check-circle-fill"></i><span>${E(s)}</span></li>`).join('')}</ul></div></div></div></div>
<div class="k-wrap pad"><div class="k-sh"><small>IKUTI KAMI</small><h2>Ikuti akun resmi panitia</h2><p class="mut">Bukti mengikuti akun media sosial panitia dilampirkan saat mendaftarkan atlet.</p></div>${sosTiles()}</div>
${kartu.length ? `<div class="k-wrap pad"><div class="g3">${kartu.map(k => `<div class="k-tile"><span class="ti"><i class="bi bi-info-circle"></i></span><b>${E(k.j)}</b><p class="mut sm">${E(k.d)}</p></div>`).join('')}</div></div>` : ''}
<div class="k-wrap pad"><div class="k-sh"><small>BUKU RESMI</small><h2>Unduh Buku Acara & Buku Hasil</h2><p class="mut">Versi lengkap seluruh nomor lomba dalam PDF.</p></div>${KRP.bukuBox(B.dok)}</div>
${(B.dok || []).filter(d => ['BUKU_ACARA', 'RESULT_BOOK'].indexOf(d.jenis) < 0).length ? `<div class="k-wrap pad"><div class="k-sh"><small>DOKUMEN</small><h2>Dokumen resmi lainnya</h2></div><div class="g3">${B.dok.filter(d => ['BUKU_ACARA', 'RESULT_BOOK'].indexOf(d.jenis) < 0).map(d => `<a class="k-tile" target="_blank" rel="noopener" href="https://drive.google.com/file/d/${E(d.id)}/view"><span class="ti"><i class="bi bi-file-earmark-pdf"></i></span><b>${E(String(d.jenis).replace(/_/g, ' '))}</b><p class="mut sm">${E(d.nama)}</p></a>`).join('')}</div></div>` : ''}`);
  if (cd) { cdTick(); S.timers.push(setInterval(cdTick, 1000)); }
};

/* ===== Jadwal & start list ===== */
function evPicker(route, cur, onlyStart) {
  const B = S.B, L = B.events.filter(e => !onlyStart || (B.st[e.id] && B.st[e.id].a > 0));
  return `<div class="picker"><select class="k-in" data-chg="pick-${route}">${(L.length ? L : B.events).map(e => `<option value="${e.id}"${e.id === cur ? ' selected' : ''}>#${e.no} · ${E(evTitle(e))}</option>`).join('')}</select></div>`;
}
INP['pick-startlist'] = i => go('startlist', i.value); INP['pick-live'] = i => go('live', i.value);
V.jadwal = function () {
  const B = S.B, byDay = {}; B.events.forEach(e => (byDay[e.hari || 1] = byDay[e.hari || 1] || []).push(e));
  const any = B.events.some(e => e.jam);
  main(`<div class="k-wrap pad">${ph('Jadwal & Start List', `${E(B.cfg.tanggal_teks)} · ${E(B.cfg.lokasi)}`)}${B.cfg.tarik === '1' ? alertx('warn', '<b>Start list sedang direvisi panitia.</b> Seri dan lintasan akan tampil lagi setelah diterbitkan ulang.', 'bi-hourglass-split') : ''}${KRP.bukuBox(B.dok)}<br>${any ? alertx('info', 'Jam adalah <b>estimasi otomatis</b> dari jumlah peserta dan seri, dan dapat berubah mengikuti kelancaran lomba.', 'bi-clock') : ''}
${Object.keys(byDay).sort((a, b) => a - b).map(h => card(dayLabel(h), `<div class="k-scroll"><table class="k-table"><thead><tr><th>No</th><th>Estimasi</th><th>Nomor</th><th>Kelompok</th><th>Seri</th><th></th></tr></thead><tbody>${byDay[h].sort((a, b) => (a.jam || '99') < (b.jam || '99') ? -1 : (a.jam || '99') > (b.jam || '99') ? 1 : a.no - b.no).map(e => { const s = B.st[e.id] || { h: 0, a: 0, s: 'NONE' }; return `<tr><td class="mono">#${e.no}</td><td class="mono">${e.jam ? E(e.jam) + (e.jamS ? '–' + E(e.jamS) : '') : '—'}</td><td><b>${E(e.nama)}</b></td><td>${E(jn(e.jk))} ${G_L[e.g]}</td><td>${s.h || '—'}</td><td style="text-align:right">${s.a ? `<button class="k-btn sm k-outline" data-go="startlist" data-p="${e.id}">Start list</button> <button class="k-btn sm k-navy" data-go="live" data-p="${e.id}">${s.s === 'SAH' ? 'Hasil' : 'Live'}</button>` : '<span class="mut sm">Belum tersedia</span>'}</td></tr>${(e.ist || []).map(b => `<tr style="background:var(--gold,#FFF7DC)"><td colspan="6"><i class="bi bi-cup-hot"></i> <b>${E(b.label)}</b> — ${b.menit} menit · <span class="mono">${E(b.mulai)}–${E(b.selesai)}</span></td></tr>`).join('')}`; }).join('')}</tbody></table></div>`, '', true)).join('') || empty('bi-calendar-x', 'Belum ada nomor lomba.')}</div>`);
};
const idStart = () => { const B = S.B || { events: [], st: {} }; return (B.events.filter(e => B.st[e.id] && B.st[e.id].a > 0)[0] || B.events[0] || {}).id; };
const idLive = () => { const B = S.B || { events: [], st: {} }; return (B.events.filter(e => B.st[e.id] && B.st[e.id].s !== 'NONE')[0] || B.events.filter(e => B.st[e.id] && B.st[e.id].a > 0)[0] || B.events[0] || {}).id; };
V.startlist = function (id) {
  S.slF = Object.assign({ q: '', jk: '', g: '', urut: 'nama' }, S.slF || {}, { ev: id || '', n: 150 }, id ? { q: '', jk: '', g: '' } : {}); // dari tautan nomor (Jadwal): tampilkan semua atlet nomor itu
  swr('slall', 'pub.sl', {}, d => {
    S.slD = d; const B = S.B, f = S.slF, evI = {}; B.events.forEach(e => { evI[e.id] = e; });
    const ada = d.rows.filter(r => evI[r[4]]), pakai = {}; ada.forEach(r => { pakai[r[4]] = 1; });
    const evs = B.events.filter(e => pakai[e.id]), jks = (B.jenjang || []).map(j => j.kode).filter(k => evs.some(e => e.jk === k));
    main(`<div class="k-wrap pad">${ph('Start List', 'Daftar atlet, nomor lomba yang diikuti, dan catatan waktu entry')}
${d.tarik ? alertx('warn', '<b>Start list sedang direvisi panitia.</b> Daftar akan tampil lagi setelah diterbitkan ulang.', 'bi-hourglass-split') : !ada.length ? empty('bi-list-ol', 'Start list belum terbit. Daftar ini tampil setelah pendaftaran ditutup dan start list disusun panitia.') : `<div class="sl-f"><input class="k-in" data-in="sl-q" placeholder="Cari nama atlet atau sekolah…" value="${E(f.q)}">
<select class="k-in" data-chg="sl-jk" aria-label="Kelompok"><option value="">Semua kelompok</option>${jks.map(k => `<option value="${E(k)}"${k === f.jk ? ' selected' : ''}>${E(jn(k))}</option>`).join('')}</select>
<select class="k-in" data-chg="sl-g" aria-label="Putra/putri"><option value="">Putra &amp; putri</option><option value="PUTRA"${f.g === 'PUTRA' ? ' selected' : ''}>Putra</option><option value="PUTRI"${f.g === 'PUTRI' ? ' selected' : ''}>Putri</option></select>
<select class="k-in" data-chg="sl-ev" aria-label="Nomor lomba"><option value="">Semua nomor lomba</option>${evs.map(e => `<option value="${e.id}"${e.id === f.ev ? ' selected' : ''}>#${e.no} · ${E(evTitle(e))}</option>`).join('')}</select>
<div class="k-seg"><button class="${f.urut === 'nama' ? 'on' : ''}" data-act="sl-urut" data-v="nama">Urut nama</button><button class="${f.urut === 'nomor' ? 'on' : ''}" data-act="sl-urut" data-v="nomor">Urut nomor lomba</button></div></div><div id="sl-list"></div>`}</div>`);
    drawSL();
  }, 30000);
};
const slMs = t => { const m = /^(?:(\d+):)?(\d+(?:\.\d+)?)$/.exec(String(t || '').trim()); return m ? (Number(m[1] || 0) * 60 + Number(m[2])) * 1000 : 9e12; };
function drawSL() {
  const el = $('#sl-list'), d = S.slD; if (!el || !d) return;
  const f = S.slF, evI = {}; S.B.events.forEach(e => { evI[e.id] = e; }); const q = f.q.toLowerCase().trim();
  const L = d.rows.filter(r => { const e = evI[r[4]]; return e && (!f.jk || e.jk === f.jk) && (!f.g || e.g === f.g) && (!f.ev || e.id === f.ev) && (!q || (r[1] + ' ' + r[2]).toLowerCase().indexOf(q) >= 0); });
  L.sort(f.urut === 'nomor' ? (a, b) => evI[a[4]].no - evI[b[4]].no || slMs(a[5]) - slMs(b[5]) || String(a[1]).localeCompare(String(b[1]), 'id') : (a, b) => String(a[1]).localeCompare(String(b[1]), 'id') || String(a[0]).localeCompare(String(b[0])) || evI[a[4]].no - evI[b[4]].no);
  const nAtl = new Set(L.map(r => r[0])).size;
  el.innerHTML = L.length ? `<p class="mut sm">${nAtl} atlet · ${L.length} nomor diikuti${f.ev ? ` · <a href="#" data-go="live" data-p="${f.ev}">Lihat hasil nomor ini</a>` : ''}</p><section class="k-card"><div class="k-scroll"><table class="k-table sl-t"><thead><tr><th>Nama</th><th>Kelompok</th><th>Asal Sekolah</th><th>Kelas</th><th>Nomor Lomba</th><th>Catatan Waktu</th></tr></thead><tbody>${L.slice(0, f.n).map(r => { const e = evI[r[4]]; return `<tr><td><a href="#" data-go="profil" data-p="${E(r[0])}"><b>${E(r[1])}</b></a></td><td>${E(jn(e.jk))}</td><td>${E(r[2])}</td><td>${E(kls(r[3]))}</td><td><span class="mono">#${e.no}</span> ${E(e.nama)} <small class="mut">${E(G_L[e.g] || e.g)}</small></td><td class="mono"><b>${E(r[5])}</b></td></tr>`; }).join('')}</tbody></table></div></section>${L.length > f.n ? `<div class="k-bar"><button class="k-btn k-outline" data-act="sl-more">Tampilkan ${Math.min(150, L.length - f.n)} lagi (${L.length - f.n} tersisa)</button></div>` : ''}` : '<p class="mut">Tidak ada atlet yang cocok dengan pencarian atau filter.</p>';
}
INP['sl-q'] = i => { S.slF.q = i.value; S.slF.n = 150; clearTimeout(S._slq); S._slq = setTimeout(drawSL, 150); };
INP['sl-jk'] = i => { S.slF.jk = i.value; S.slF.n = 150; drawSL(); };
INP['sl-g'] = i => { S.slF.g = i.value; S.slF.n = 150; drawSL(); };
INP['sl-ev'] = i => { S.slF.ev = i.value; S.slF.n = 150; drawSL(); };
ACT['sl-urut'] = a => { S.slF.urut = a.dataset.v; $$('.sl-f .k-seg button').forEach(b => b.classList.toggle('on', b === a)); drawSL(); };
ACT['sl-more'] = () => { S.slF.n += 150; drawSL(); };
const liveDetik = () => Math.max(15, Math.min(300, Number(cfgv('live_detik')) || 30));
ACT['live-now'] = a => { busy(a, true); Promise.resolve(S.liveNow && S.liveNow()).then(() => busy(a, false)); };
V.live = function (id) {
  id = id || idLive(); S.param = id;
  if (!id) return main(`<div class="k-wrap pad">${empty('bi-broadcast', 'Belum ada nomor lomba.')}</div>`);
  const draw = d => {
    const e = d.event, top3 = d.rows.filter(r => r.rank && r.rank <= 3 && r.st === 'OK');
    main(`<div class="k-wrap pad">${evPicker('live', id, true)}<div class="k-evh"><div><span class="tag">EVENT ${e.no}</span><h2>${E(evTitle(e))}</h2><p>${d.so ? `<i class="bi bi-patch-check-fill"></i> Disahkan ${E(d.so.oleh)} · ${fdt(d.so.at)}` : 'Hasil sementara — menunggu pengesahan wasit'}</p></div>${d.rec ? `<div class="rec"><small>Rekor</small><b class="mono">${E(d.rec.waktu)}</b><small>${E(d.rec.nama)}</small></div>` : ''}</div>
<div class="k-livebar"><span class="live-dot"></span> Diperbarui otomatis tiap ${liveDetik()} detik · <span class="mut">${fdt(d.at)}</span> <button class="k-btn sm k-ghostw" data-act="live-now">Perbarui sekarang</button></div>
${top3.length === 3 ? `<div class="podium">${[1, 0, 2].map(i => { const r = top3[i]; return `<div class="pd p${i + 1}"><span class="rk r${i + 1}">${r.rank}</span><b>${E(r.nama)}</b><small>${E(r.sk || r.kl || '')}</small><span class="mono big">${E(r.waktu)}</span></div>`; }).join('')}</div>` : ''}
${d.rows.length ? card('Hasil', `<div class="k-scroll"><table class="k-table"><thead><tr><th>Rank</th><th>Lane</th><th>Nama</th><th>Asal</th><th>Waktu</th><th>Ket</th></tr></thead><tbody>${d.rows.map(r => `<tr><td>${r.rank && r.st === 'OK' ? `<span class="md ${r.rank === 1 ? 'g' : r.rank === 2 ? 's' : r.rank === 3 ? 'b' : ''}">${r.rank}</span>` : '–'}</td><td class="mono">${r.lane}</td><td><a href="#" data-go="profil" data-p="${r.id}"><b>${E(r.nama)}</b></a></td><td>${E(r.sk || r.kl || '')}</td><td class="mono"><b>${E(r.st === 'OK' ? r.waktu : r.st)}</b></td><td>${r.baru ? '<span class="k-pill k-warn">Rekor baru</span>' : ''}${r.dq ? E(r.dq) : ''}${r.sah ? '' : ' <span class="mut sm">sementara</span>'}</td></tr>`).join('')}</tbody></table></div>`, '', true) : empty('bi-hourglass-split', 'Belum ada hasil untuk nomor ini.')}</div>`);
  };
  // Polling hemat: jeda diatur panitia (bawaan 30 dtk) + acak ±20%, berhenti saat tab tidak dilihat, melambat saat server ramai.
  let gagal = 0, jedaSrv = 0;
  const ck = 'live_' + id, c0 = KRP.cacheSegar(ck, 600000); let terakhir = c0 ? JSON.stringify(c0.d) : '';
  const tampil = d => { KRP.simpanCache(ck, d); const js = JSON.stringify(d); if (js === terakhir && $('.k-livebar')) return; terakhir = js; draw(d); };
  if (c0) draw(c0.d); // salinan terakhir langsung tampil, lalu diperbarui dari server
  const tarik = () => rp('pub.live', { id }).then(x => { gagal = 0; jedaSrv = Number(x.data && x.data.jeda) || 0; if (S.route === 'live' && S.param === id) tampil(x.data); }).catch(() => { gagal = Math.min(gagal + 1, 3); });
  const jadwal = () => { const ms = Math.max(liveDetik(), jedaSrv) * 1000 * Math.pow(2, gagal) * (0.8 + Math.random() * 0.4); S.timers.push(setTimeout(() => { if (S.route !== 'live' || S.param !== id) return; if (document.hidden) return jadwal(); tarik().then(jadwal); }, ms)); };
  S.liveNow = () => tarik();
  rp('pub.live', { id }).then(r => { jedaSrv = Number(r.data && r.data.jeda) || 0; if (S.route === 'live' && S.param === id) { tampil(r.data); jadwal(); } }).catch(e => { if (!c0) KRP.errView(e.message, () => go('live', id)); else { toast(e.message, 'err'); jadwal(); } });
};

/* ===== Klasemen, rekor ===== */
// Klasemen: bawaan = klasemen tahunan (mulai dari 0 tiap Januari; tahun sebelumnya tetap bisa dibuka). Tab kedua = event yang sedang berjalan.
V.klas = function () {
  if ((S.klasMode || 'tahun') === 'tahun') return klasTahun();
  swr('klas', 'pub.klas', {}, d => {
    const st = S.klasTab || 'sekolah', jk = S.klasJk || '', L = jk ? (d.jenjang[jk] || {})[st] || [] : d[st];
    main(`<div class="k-wrap pad">${ph('Klasemen Medali', `Poin: emas ${E(cfgv('poin_emas'))} · perak ${E(cfgv('poin_perak'))} · perunggu ${E(cfgv('poin_perunggu'))}`)}${klasModeBar()}<p class="mut sm">Klasemen event yang sedang berjalan: <b>${E(cfgv('app_name'))}</b>.</p>
<div class="k-filter"><div class="k-seg"><button class="${st === 'sekolah' ? 'on' : ''}" data-act="klas-tab" data-v="sekolah">Sekolah</button><button class="${st === 'klub' ? 'on' : ''}" data-act="klas-tab" data-v="klub">Klub</button></div>
<div class="k-chips"><button class="k-chip${!jk ? ' on' : ''}" data-act="klas-jk" data-v="">Semua kelompok</button>${S.B.jenjang.map(j => `<button class="k-chip${jk === j.kode ? ' on' : ''}" data-act="klas-jk" data-v="${j.kode}">${E(j.nama)}</button>`).join('')}</div></div><br>
${L.length ? card('Peringkat', `<div class="k-scroll"><table class="k-table"><thead><tr><th>#</th><th>Nama</th><th>Kab/Kota</th><th>Atlet</th><th>🥇</th><th>🥈</th><th>🥉</th><th>Poin</th></tr></thead><tbody>${L.map((x, i) => `<tr><td><span class="rk r${i + 1}" style="width:28px;height:28px">${i + 1}</span></td><td><b>${E(x.nama)}</b></td><td>${E(x.kota)}</td><td>${x.atlet}</td><td>${x.e}</td><td>${x.p}</td><td>${x.b}</td><td class="mono"><b>${x.poin}</b></td></tr>`).join('')}</tbody></table></div>`, '', true) : empty('bi-trophy', 'Belum ada medali yang disahkan.')}</div>`);
  }, 30000);
};
const klasModeBar = (th, daftar) => `<div class="k-seg kl-mode"><button class="${(S.klasMode || 'tahun') === 'tahun' ? 'on' : ''}" data-act="klas-mode" data-v="tahun"><i class="bi bi-calendar3"></i> Klasemen tahunan</button><button class="${S.klasMode === 'event' ? 'on' : ''}" data-act="klas-mode" data-v="event"><i class="bi bi-flag"></i> Event berjalan</button></div>${th && daftar && daftar.length > 1 ? ` <label class="kl-th">Tahun <select class="k-in" data-chg="klas-th">${daftar.map(y => `<option value="${y}"${y === th ? ' selected' : ''}>${y}${y === daftar[0] ? '' : ' (arsip)'}</option>`).join('')}</select></label>` : ''}`;
function klasTahun() {
  const th = S.klasTh || 0;
  swr('klt_' + (th || 'kini'), 'pub.klas.tahun', th ? { tahun: th } : {}, d => {
    if (S.route !== 'klas') return; const st = S.klasTab || 'sekolah', jk = S.klasJk || '', L = jk ? (d.jenjang[jk] || {})[st] || [] : d[st], arsip = d.tahun !== d.tahunIni;
    const jks = Object.keys(d.jenjang || {}).filter(k => k !== '-').sort((a, b) => ((S.B.jenjang.find(j => j.kode === a) || {}).urutan || 99) - ((S.B.jenjang.find(j => j.kode === b) || {}).urutan || 99) || a.localeCompare(b));
    main(`<div class="k-wrap pad">${ph(`Klasemen Medali ${d.tahun}`, `Akumulasi semua event KRP tahun ${d.tahun}. Dimulai lagi dari nol setiap 1 Januari. Poin: emas ${E(cfgv('poin_emas'))} · perak ${E(cfgv('poin_perak'))} · perunggu ${E(cfgv('poin_perunggu'))}`)}
<div class="kl-top">${klasModeBar(d.tahun, d.daftar)}</div>
${arsip ? `<div class="k-alert info"><i class="bi bi-archive"></i><div>Arsip klasemen tahun <b>${d.tahun}</b> (sudah ditutup). <a href="#" data-act="klas-kini">Lihat tahun ${d.tahunIni}</a></div></div>` : ''}
${d.events.length ? `<div class="kl-evs"><span class="mut sm">Dihitung dari ${d.events.length} event:</span>${d.events.map(e => `<span class="kl-ev"><b>${E(e.nama)}</b>${e.tgl ? ' · ' + E(fdt(e.tgl)) : ''}</span>`).join('')}</div>` : ''}
<div class="k-filter"><div class="k-seg"><button class="${st === 'sekolah' ? 'on' : ''}" data-act="klas-tab" data-v="sekolah">Sekolah</button><button class="${st === 'klub' ? 'on' : ''}" data-act="klas-tab" data-v="klub">Klub</button></div>
${jks.length ? `<div class="k-chips"><button class="k-chip${!jk ? ' on' : ''}" data-act="klas-jk" data-v="">Semua kelompok</button>${jks.map(k => `<button class="k-chip${jk === k ? ' on' : ''}" data-act="klas-jk" data-v="${E(k)}">${E(jnK(k))}</button>`).join('')}</div>` : ''}</div><br>
${L.length ? card('Peringkat', `<div class="k-scroll"><table class="k-table"><thead><tr><th>#</th><th>Nama</th><th>Kab/Kota</th><th>Atlet</th><th>🥇</th><th>🥈</th><th>🥉</th><th>Poin</th></tr></thead><tbody>${L.map((x, i) => `<tr><td><span class="rk r${i + 1}" style="width:28px;height:28px">${i + 1}</span></td><td><b>${E(x.nama)}</b></td><td>${E(x.kota)}</td><td>${x.atlet}</td><td>${x.e}</td><td>${x.p}</td><td>${x.b}</td><td class="mono"><b>${x.poin}</b></td></tr>`).join('')}</tbody></table></div>`, '', true) : empty('bi-trophy', d.events.length ? 'Belum ada medali di kelompok ini.' : `Belum ada event dengan hasil sah di tahun ${d.tahun}. Klasemen dimulai dari nol.`)}</div>`);
  }, 60000);
}
ACT['klas-mode'] = a => { S.klasMode = a.dataset.v; S.klasJk = ''; go('klas'); };
INP['klas-th'] = i => { S.klasTh = Number(i.value); S.klasJk = ''; go('klas'); };
ACT['klas-kini'] = () => { S.klasTh = 0; go('klas'); };
ACT['klas-tab'] = a => { S.klasTab = a.dataset.v; go('klas'); }; ACT['klas-jk'] = a => { S.klasJk = a.dataset.v; go('klas'); };
V.rekor = function () {
  swr('rekor', 'pub.rekor', {}, d => {
    S.rk = d; S.rkF = S.rkF || { jk: '', g: '', q: '', ct: cfgv('kolam') === 'SCM' ? 'SCM' : 'LCM' }; const f = S.rkF, jks = [...new Set(d.map(r => r.jk))], nCt = c => d.filter(r => (r.ct || 'LCM') === c).length;
    main(`<div class="k-wrap pad">${ph('Rekor Kejuaraan', 'Rekor kolam pendek (short course, 25 m) dan kolam panjang (long course, 50 m) dicatat terpisah, lengkap dengan event tempat rekor dicetak.')}
<div class="k-seg rk-ct rk-tabs">${[['LCM', 'Long course · kolam 50 m'], ['SCM', 'Short course · kolam 25 m']].map(x => `<button class="${f.ct === x[0] ? 'on' : ''}" data-act="rk-ct" data-v="${x[0]}">${x[1]} <small>(${nCt(x[0])})</small></button>`).join('')}</div>
<div class="k-filter rk-f"><div class="k-chips">${[['', 'Semua kelompok']].concat(jks.map(k => [k, jnK(k)])).map(x => `<button class="k-chip${f.jk === x[0] ? ' on' : ''}" data-act="rk-jk" data-v="${E(x[0])}">${E(x[1])}</button>`).join('')}</div>
<div class="rk-f2"><div class="k-seg">${[['', 'Semua'], ['PUTRA', 'Putra'], ['PUTRI', 'Putri']].map(x => `<button class="${f.g === x[0] ? 'on' : ''}" data-act="rk-g" data-v="${x[0]}">${x[1]}</button>`).join('')}</div><input class="k-in" data-in="rk-q" placeholder="Cari nama, sekolah, atau event…" value="${E(f.q)}"></div></div><div id="rk-list"></div></div>`);
    drawRekor();
  }, 60000);
};
function drawRekor() {
  const el = $('#rk-list'); if (!el) return; const f = S.rkF, q = f.q.toLowerCase();
  const L = S.rk.filter(r => (r.ct || 'LCM') === f.ct && (!f.jk || r.jk === f.jk) && (!f.g || r.g === f.g) && (!q || [r.nama, r.kont, r.ev, r.lokasi, r.event].join(' ').toLowerCase().indexOf(q) >= 0));
  el.innerHTML = L.length ? `<p class="mut sm">${L.length} rekor ${f.ct === 'SCM' ? 'short course (25 m)' : 'long course (50 m)'}</p><div class="g3">${L.map(r => `<div class="k-card"><div class="k-card-b rec"><span class="mut sm">${E(r.event)} ${G_L[r.g] || ''} · ${E(jnK(r.jk))} <span class="rk-ctb">${r.ct === 'SCM' ? '25 m' : '50 m'}</span></span><div class="big mono">${E(r.waktu)}</div><div class="who"><span class="k-av ph">${E(initials(r.nama))}</span><div><b>${E(r.nama)}</b><small>${E(r.kont)}</small></div></div>
<div class="rk-ev"><i class="bi bi-flag-fill"></i><div><b>${E(r.ev || ('Musim ' + r.tahun))}</b>${r.lokasi ? `<small>${E(r.lokasi)}</small>` : ''}</div></div>${r.sebelum ? `<small class="mut rk-prev">Memecahkan ${E(r.sebelum.w)} · ${E(r.sebelum.n)}${r.sebelum.ev ? ' (' + E(r.sebelum.ev) + ')' : ''}</small>` : ''}${r.baru ? '<span class="k-pill k-warn">Rekor baru musim ini</span>' : ''}</div></div>`).join('')}</div>` : empty('bi-stopwatch', S.rk.some(r => (r.ct || 'LCM') === f.ct) ? 'Tidak ada rekor yang cocok dengan filter.' : `Belum ada rekor ${f.ct === 'SCM' ? 'short course (kolam 25 m)' : 'long course (kolam 50 m)'} tercatat.`);
}
ACT['rk-jk'] = a => { S.rkF.jk = a.dataset.v; $$('.rk-f .k-chip').forEach(b => b.classList.toggle('on', b === a)); drawRekor(); };
ACT['rk-ct'] = a => { S.rkF.ct = a.dataset.v; $$('.rk-ct button').forEach(b => b.classList.toggle('on', b === a)); const l = $('#rk-list'); drawRekor(); };
ACT['rk-g'] = a => { S.rkF.g = a.dataset.v; $$('.rk-f2 .k-seg button').forEach(b => b.classList.toggle('on', b === a)); drawRekor(); };
INP['rk-q'] = i => { S.rkF.q = i.value; clearTimeout(S._rkq); S._rkq = setTimeout(drawRekor, 150); };

/* ===== Atlet & profil ===== */
V.atlet = function () {
  swr('atlet', 'pub.atlet', {}, d => {
    S.atletAll = d; const q = (S.atletQ || '').toLowerCase();
    main(`<div class="k-wrap pad">${ph('Direktori Atlet', 'Atlet dengan pendaftaran terverifikasi')}<div class="k-filter"><input class="k-in" data-in="atlet-q" placeholder="Cari nama atlet atau sekolah…" value="${E(S.atletQ || '')}"><div class="k-chips"><button class="k-chip${!S.atletJk ? ' on' : ''}" data-act="atlet-jk" data-v="">Semua</button>${S.B.jenjang.map(j => `<button class="k-chip${S.atletJk === j.kode ? ' on' : ''}" data-act="atlet-jk" data-v="${j.kode}">${E(j.nama)}</button>`).join('')}</div></div><br><div id="atl-list" class="g3"></div></div>`);
    drawAtlet();
  }, 30000);
};
function drawAtlet() {
  const q = (S.atletQ || '').toLowerCase().trim(), L = (S.atletAll || []).filter(a => (!S.atletJk || a.jk === S.atletJk) && (!q || (a.n + ' ' + a.sk + ' ' + a.kl).toLowerCase().indexOf(q) >= 0)).slice(0, 90), el = $('#atl-list'); if (!el) return;
  el.innerHTML = L.length ? L.map(a => `<div class="k-card ath"><div class="k-card-b"><div class="who">${a.f ? `<img class="k-av" loading="lazy" src="${thumb(a.f, 120)}" alt="">` : `<span class="k-av ph">${E(initials(a.n))}</span>`}<div><h3>${E(a.n)}</h3><small class="mut">${E(a.sk || a.kl)} · ${E(jn(a.jk))}</small></div></div><div class="pl"><span class="mm"><span class="md g">${a.e}</span><span class="md s">${a.p}</span><span class="md b">${a.b}</span></span>${a.rk ? `<span class="k-pill k-warn">${a.rk} rekor</span>` : ''}</div><button class="k-btn sm k-outline" data-go="profil" data-p="${a.id}">Lihat profil</button></div></div>`).join('') : `<div style="grid-column:1/-1">${empty('bi-search', 'Tidak ada atlet yang cocok.')}</div>`;
}
INP['atlet-q'] = i => { S.atletQ = i.value; clearTimeout(S._aq); S._aq = setTimeout(drawAtlet, 120); };
ACT['atlet-jk'] = a => { S.atletJk = a.dataset.v; go('atlet'); };
V.profil = function (id) {
  swr('pf_' + id, 'pub.profil', { id }, d => main(`<div class="k-wrap pad"><button class="k-btn k-ghostw sm" data-go="atlet"><i class="bi bi-arrow-left"></i> Direktori</button><br><br><div class="k-card pfh"><div class="k-card-b">${d.f ? `<img class="k-av xl" src="${thumb(d.f, 300)}" alt="">` : `<span class="k-av ph xl">${E(initials(d.nama))}</span>`}<div style="flex:1"><span class="bib mono">${E(d.bib)}</span><h1>${E(d.nama)}</h1><p class="mut">${E(d.sk || '')}${d.kl ? ' · ' + E(d.kl) : ''} · ${E(jn(d.jk))} · ${G_L[d.g]}</p>${(d.best || []).map(b => `<div class="bs-badge"><i class="bi bi-trophy-fill"></i><div><b>Best Swimmer ${E(jn(b.jk))} ${b.g === 'PUTRI' ? 'Putri' : 'Putra'}</b><small>${E(b.event)} · ${b.e} emas, ${b.p} perak, ${b.b} perunggu · ${b.poin} poin rekor nasional</small></div></div>`).join('')}</div><div class="mm big"><div><span class="md g">${d.med.e}</span><small>Emas</small></div><div><span class="md s">${d.med.p}</span><small>Perak</small></div><div><span class="md b">${d.med.b}</span><small>Perunggu</small></div></div></div></div>
<div class="g2">${card('Nomor musim ini', d.nomor.length ? `<table class="k-table"><thead><tr><th>No</th><th>Nomor</th><th>Seri/Lane</th><th>Seed</th></tr></thead><tbody>${d.nomor.map(n => `<tr><td class="mono">#${n.no}</td><td>${E(n.event)}</td><td>${n.heat ? n.heat + ' / ' + n.lane : '—'}</td><td class="mono">${E(n.seed)}</td></tr>`).join('')}</tbody></table>` : '<p class="mut">Belum ada nomor terverifikasi.</p>', '', true)}
${(d.arsip || []).length ? card('Riwayat prestasi KRP (event sebelumnya)', `<table class="k-table"><thead><tr><th>Event</th><th>Nomor</th><th>Waktu</th><th>Rank</th></tr></thead><tbody>${d.arsip.map(h => `<tr><td>${E(h.event)}<br><small class="mut">${E(fdt(h.tanggal))} · kolam ${h.kolam === 'SCM' ? '25' : '50'} m</small></td><td>${E(h.nomor)}</td><td class="mono">${E(h.waktu)}</td><td>${h.rank || '–'} ${h.medal ? `<span class="k-pill k-warn">${E(h.medal)}</span>` : ''}</td></tr>`).join('')}</tbody></table>`, '', true) : ''}
${card('Riwayat hasil', d.hasil.length ? `<table class="k-table"><thead><tr><th>Musim</th><th>Nomor</th><th>Waktu</th><th>Rank</th></tr></thead><tbody>${d.hasil.map(h => `<tr><td>${E(h.musim)}</td><td>${E(h.event)}</td><td class="mono">${E(h.st === 'OK' ? h.waktu : h.st)}</td><td>${h.rank || '–'} ${h.medal ? `<span class="k-pill k-warn">${E(h.medal)}</span>` : ''}</td></tr>`).join('')}</tbody></table>` : '<p class="mut">Belum ada hasil.</p>', '', true)}</div></div>`), 60000);
};

/* ===== Galeri ===== */
V.galeri = function () {
  swr('galeri', 'pub.galeri', {}, d => {
    const al = {}; d.forEach(g => (al[g.ev || 'Umum'] = al[g.ev || 'Umum'] || []).push(g)); S.galAll = d;
    main(`<div class="k-wrap pad">${ph('Galeri Dokumentasi', 'Foto dan album resmi per kegiatan')}${Object.keys(al).length ? Object.keys(al).map(k => `<section class="k-alb"><h2><i class="bi bi-folder2-open"></i> ${E(k)} <small class="mut">${al[k].length} item</small></h2><div class="gal">${al[k].map(g => g.tipe === 'LINK' ? `<a class="k-tile" href="${E(g.url)}" target="_blank" rel="noopener"><span class="ti"><i class="bi bi-google"></i></span><b>${E(g.cap)}</b><p class="mut sm">Album Google Drive · buka tautan</p></a>` : `<figure class="k-g" data-act="gal-open" data-id="${E(g.id)}"><img loading="lazy" src="${thumb(g.f, 420)}" alt="${E(g.cap)}"><figcaption>${E(g.cap)}</figcaption></figure>`).join('')}</div></section>`).join('') : empty('bi-images', 'Belum ada dokumentasi.')}</div>`);
  }, 60000);
};
ACT['gal-open'] = a => { const g = (S.galAll || []).filter(x => x.id === a.dataset.id)[0]; if (g) modal(E(g.cap), `<img style="width:100%;border-radius:8px" src="${thumb(g.f, 1200)}" alt="">`, '', true); };

/* ===== Arsip ===== */
V.arsip = function (musim) { S.arsK = ''; S.arsQ = '';
  if (musim) return swr('ars_' + musim, 'pub.arsip', { musim }, d => {
    const m = d.meta || {}, kt = (judul, L, kol) => card(judul, L.length ? `<table class="k-table"><thead><tr><th>#</th><th>${kol}</th><th>🥇</th><th>🥈</th><th>🥉</th><th>Poin</th></tr></thead><tbody>${L.slice(0, 15).map((x, i) => `<tr><td>${i + 1}</td><td>${E(x.nama)}</td><td>${x.e}</td><td>${x.p}</td><td>${x.b}</td><td class="mono"><b>${x.poin}</b></td></tr>`).join('')}</tbody></table>` : '<p class="mut">Tidak ada data.</p>', '', true);
    const baris = r => `<tr><td>${r.rank || '–'}</td><td><b>${E(r.nama)}</b>${r.kelas !== '' && r.kelas != null ? ` <small class="mut">kls ${E(kls(r.kelas))}</small>` : ''}</td><td>${E([r.sk, r.kl].filter(Boolean).join(' / '))}</td><td class="mono">${E(r.st === 'OK' ? r.waktu : r.st)}</td><td>${r.medal ? `<span class="k-pill k-warn">${E(r.medal)}</span>` : ''}${r.baru ? ' <span class="k-pill k-ok">Rekor</span>' : ''}${r.cat ? ` <small class="mut">${E(r.cat)}</small>` : ''}</td></tr>`;
    const thd = '<thead><tr><th>Rank</th><th>Nama</th><th>Asal</th><th>Waktu</th><th></th></tr></thead>';
    main(`<div class="k-wrap pad"><button class="k-btn k-ghostw sm" data-go="riwayat"><i class="bi bi-arrow-left"></i> Riwayat kejuaraan</button>${ph(E(m.event || ('Arsip Musim ' + d.musim)), [m.tglTeks, m.lokasi].filter(Boolean).map(E).join(' · ') || (d.sumber === 'IMPOR' ? 'Data hasil kejuaraan yang telah dilaksanakan (diinput panitia)' : 'Hasil resmi musim tersebut'))}
${(d.dok || []).length ? card('Buku Acara & Buku Hasil', KRP.bukuBox(d.dok)) : ''}
<div class="k-kpis">${kpi('Nomor lomba', d.nomor.length, 'bi-list-ol')}${kpi('Hasil tercatat', d.nomor.reduce((s, n) => s + n.rows.length, 0), 'bi-stopwatch')}${kpi('Atlet', new Set([].concat(...d.nomor.map(n => n.rows.map(r => r.nama + '|' + r.sk)))).size, 'bi-people')}${kpi('Juara umum', E((d.klas.sekolah[0] || {}).nama || '–'), 'bi-trophy')}</div>
<div class="g2">${kt('Klasemen Sekolah', d.klas.sekolah, 'Sekolah')}${kt('Klasemen Klub', d.klas.klub, 'Klub')}</div>
${new Set(d.nomor.map(n => n.kol)).size > 1 ? `<div class="k-seg ars-kol">${[['', 'Semua kolam'], ['LCM', 'Long course · 50 m'], ['SCM', 'Short course · 25 m']].map(x => `<button class="${!x[0] ? 'on' : ''}" data-act="ars-kol" data-v="${x[0]}">${x[1]} <small>(${d.nomor.filter(n => !x[0] || n.kol === x[0]).length})</small></button>`).join('')}</div>` : ''}<input class="k-in" data-in="ars-q" placeholder="Cari nama atlet atau sekolah di arsip ini…" style="margin:6px 0 14px"><div id="ars-list">${d.nomor.map(n => `<div class="ars-n" data-kol="${E(n.kol || '')}" data-s="${E([].concat(n.rows.map(r => r.nama + ' ' + r.sk + ' ' + r.kl)).join(' ').toLowerCase())}">${card(`${n.no ? '#' + n.no + ' · ' : ''}${E(n.event)} · ${G_L[n.g] || n.g} · ${E(jnK(n.jk))}${n.kol ? ` <span class="rk-ctb">${n.kol === 'SCM' ? '25 m' : '50 m'}</span>` : ''}`, `<div class="k-scroll"><table class="k-table">${thd}<tbody>${n.rows.slice(0, 8).map(baris).join('')}</tbody></table></div>${n.rows.length > 8 ? `<details class="ars-more"><summary>Lihat semua ${n.rows.length} hasil</summary><div class="k-scroll"><table class="k-table">${thd}<tbody>${n.rows.slice(8).map(baris).join('')}</tbody></table></div></details>` : ''}`, '', true)}</div>`).join('')}</div></div>`);
  }, 60000);
  setTimeout(() => go('riwayat', null, 'r')); // daftar arsip kini menjadi halaman Riwayat (portofolio)
};
const arsTampil = () => { const q = (S.arsQ || '').toLowerCase(), k = S.arsK || ''; $$('#ars-list .ars-n').forEach(n => { n.hidden = (!!q && n.dataset.s.indexOf(q) < 0) || (!!k && n.dataset.kol !== k); }); };
ACT['ars-kol'] = a => { S.arsK = a.dataset.v; $$('.ars-kol button').forEach(b => b.classList.toggle('on', b === a)); arsTampil(); };
INP['ars-q'] = i => { const q = i.value.trim().toLowerCase(); S.arsQ = q; clearTimeout(S._aq); S._aq = setTimeout(() => $$('#ars-list .ars-n').forEach(n => { n.hidden = (!!q && n.dataset.s.indexOf(q) < 0) || (!!S.arsK && n.dataset.kol !== S.arsK); if (q) { const dt = n.querySelector('details'); if (dt) dt.open = true; } }), 150); };

/* ===== Masuk & daftar akun ===== */
V.login = function () {
  const mode = S.loginMode || 'KONTINGEN';
  main(`<div class="k-wrap pad"><div class="k-auth"><div class="k-auth-l"><span class="k-tag"><i class="bi bi-shield-lock"></i> Portal ${E(cfgv('app_name'))}</span><h1>Masuk ke akun Anda</h1><p>Akun sekolah, klub, atau pribadi cukup dibuat satu kali. Setelah masuk, Anda tinggal memilih nama atlet, nomor lomba, dan mengunggah bukti bayar.</p><ul class="k-check inv"><li><i class="bi bi-check-circle-fill"></i> Berkas atlet tersimpan di akun</li><li><i class="bi bi-check-circle-fill"></i> Satu bukti bayar untuk banyak atlet</li><li><i class="bi bi-check-circle-fill"></i> Pantau status verifikasi langsung</li></ul></div>
<div class="k-auth-r"><div class="k-seg"><button class="${mode === 'KONTINGEN' ? 'on' : ''}" data-act="login-mode" data-v="KONTINGEN">Sekolah / Klub / Pribadi</button><button class="${mode === 'PANITIA' ? 'on' : ''}" data-act="login-mode" data-v="PANITIA">Panitia</button></div>
<form data-submit="login" autocomplete="on">${field(mode === 'PANITIA' ? 'Email panitia' : 'NPSN / kode klub / email akun', inp('id', '', { req: 1, attr: 'autocomplete="username" autocapitalize="off"' }), 1)}${field('Kata sandi', `<div class="pw"><input class="k-in" name="password" type="password" required autocomplete="current-password"><button type="button" class="k-ibtn" data-act="pw-eye" aria-label="Tampilkan sandi"><i class="bi bi-eye"></i></button></div>`, 1)}<button class="k-btn lg k-navy block" style="width:100%">Masuk</button></form>
<p class="sm" style="margin-top:12px"><a href="#" data-act="lupa-sandi">Lupa kata sandi?</a></p>${mode === 'KONTINGEN' ? `<p class="mut sm" style="margin-top:6px">Belum punya akun? <a href="#" data-go="daftar"><b>Buat akun sekarang</b></a></p>` : ''}</div></div></div>`);
};
ACT['lupa-sandi'] = () => { const em = cfgv('kontak_email'), tl = cfgv('kontak_telp'), w = String(tl || '').replace(/\D/g, '').replace(/^0/, '62'); modal('Lupa kata sandi', `<p>Demi keamanan, kata sandi tidak bisa dilihat siapa pun. <b>Panitia (Super Admin) dapat menetapkan kata sandi baru</b> untuk akun Anda.</p><p>Hubungi panitia dan sebutkan <b>nama akun</b> serta <b>NPSN / kode klub / email</b> yang dipakai saat mendaftar.</p><div class="k-bar" style="justify-content:flex-start">${w.length > 8 ? `<a class="k-btn k-navy" target="_blank" rel="noopener" href="https://wa.me/${w}?text=${encodeURIComponent('Halo panitia, saya lupa kata sandi akun ' + cfgv('app_name') + '. Nama akun: ... , NPSN/kode/email: ...')}"><i class="bi bi-whatsapp"></i> WhatsApp panitia</a>` : ''}${em ? `<a class="k-btn k-outline" href="mailto:${E(em)}?subject=${encodeURIComponent('Lupa kata sandi')}"><i class="bi bi-envelope"></i> ${E(em)}</a>` : ''}</div>${!em && w.length <= 8 ? '<p class="mut sm">Hubungi panitia melalui kontak resmi kejuaraan.</p>' : ''}`, '<button class="k-btn k-ghostw" data-act="mx">Tutup</button>'); };
ACT['login-mode'] = a => { S.loginMode = a.dataset.v; go('login'); };
ACT['pw-eye'] = a => { const i = a.parentElement.querySelector('input'); i.type = i.type === 'password' ? 'text' : 'password'; a.firstElementChild.className = 'bi ' + (i.type === 'password' ? 'bi-eye' : 'bi-eye-slash'); };
SUBMIT.login = async (f) => {
  const b = $('button.k-btn', f), d = form(f); busy(b, true);
  try { const r = await rp('auth.login', { mode: S.loginMode || 'KONTINGEN', id: d.id, password: d.password }); setSession(r.data.token, r.data.me); KRP.bustCache(); toast('Selamat datang, ' + r.data.me.nama); go(home()); }
  catch (e) { toast(e.message, 'err'); busy(b, false); }
};
V.daftar = function () {
  const boleh = String(S.B.cfg.tipe_akun || 'SEKOLAH,KLUB,MANDIRI').split(','), t = boleh.indexOf(S.daftarTipe) >= 0 ? S.daftarTipe : (boleh[0] || 'SEKOLAH'), mand = t === 'MANDIRI', jns = [['', '— pilih —']].concat(S.B.jenjang.map(j => [j.kode, j.nama]));
  main(`<div class="k-wrap pad"><div class="k-form">${ph('Buat Akun Pendaftar', 'Cukup sekali. Berkas dan data atlet akan tersimpan untuk pendaftaran berikutnya.')}
${S.B.cfg.buka !== '1' ? alertx('warn', 'Pendaftaran saat ini ditutup. Akun baru tidak dapat dibuat.', 'bi-door-closed') : ''}
<form class="k-card" data-submit="daftar" autocomplete="off"><div class="k-card-b"><div class="k-radios">${[['SEKOLAH', 'Akun Sekolah', 'Mendaftarkan banyak atlet dari satu sekolah. Wajib NPSN & surat mandat.'], ['KLUB', 'Akun Klub', 'Mendaftarkan atlet dari klub renang. Wajib nomor SK/kode klub & surat mandat.'], ['MANDIRI', 'Akun Pribadi', 'Atlet mendaftar sendiri (hanya nama sendiri). Medali menambah poin sekolah yang Anda pilih.']].filter(x => boleh.indexOf(x[0]) >= 0).map(x => `<label class="k-rc${t === x[0] ? ' on' : ''}" data-act="dtipe" data-v="${x[0]}"><input type="radio" name="tipe" value="${x[0]}"${t === x[0] ? ' checked' : ''}><b>${x[1]}</b><small>${x[2]}</small></label>`).join('')}</div>
<div class="g2"><div>${field(mand ? 'Nama lengkap atlet (sesuai akte)' : t === 'SEKOLAH' ? 'Nama sekolah' : 'Nama klub', inp('nama', '', { req: 1, max: 90 }), 1)}
${mand ? '' : field(t === 'SEKOLAH' ? 'NPSN (8 digit)' : 'Nomor SK / kode klub', inp('npsn', '', { req: 1, max: 40, attr: t === 'SEKOLAH' ? 'inputmode="numeric" pattern="\\d{8}"' : '' }), 1)}
${field('Provinsi', inp('provinsi', 'DKI Jakarta', {}), 0)}${field(mand ? 'Kabupaten/kota tempat tinggal' : 'Kabupaten/kota ' + (t === 'SEKOLAH' ? 'sekolah' : 'klub'), inp('kota', '', { req: 1, ph: 'mis. Jakarta Selatan' }), 1)}${field('Alamat', `<textarea class="k-in" name="alamat" rows="2" maxlength="240"></textarea>`)}${mand ? '' : field('Jenjang utama', sel('jenjang', jns, ''))}</div>
<div>${mand ? '' : field('Nama penanggung jawab', inp('pj', '', { req: 1 }), 1)}${mand ? '' : field('Jabatan', inp('jabatan', '', { ph: 'Kepala sekolah / Ketua klub / Pelatih' }))}${field('Email aktif', inp('email', '', { type: 'email', req: 1 }), 1, 'Dipakai untuk masuk dan menerima notifikasi.')}${field('Telepon / WhatsApp', inp('telepon', '', { req: 1, attr: 'inputmode="tel"' }), 1)}${field('Kata sandi', `<input class="k-in" name="password" type="password" required minlength="8" autocomplete="new-password">`, 1, 'Minimal 8 karakter, kombinasi huruf dan angka.')}</div></div>
${mand ? alertx('info', 'Akun pribadi hanya boleh mendaftarkan <b>nama sendiri</b>. Sekolah asal dipilih dari daftar sekolah yang sudah terdaftar saat mendaftarkan atlet.', 'bi-person') : dz('mandat', t === 'SEKOLAH' ? 'Surat mandat / keterangan sekolah' : 'SK / surat mandat klub', 'PDF/JPG/PNG maks 5 MB — diunggah sekali')}
<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
<div class="k-bar"><button class="k-btn lg k-orange" ${S.B.cfg.buka !== '1' ? 'disabled' : ''}>Buat Akun</button></div></div></form></div></div>`);
};
ACT.dtipe = a => { S.daftarTipe = a.dataset.v; go('daftar'); };
SUBMIT.daftar = async f => {
  const b = $('button.k-btn', f), d = form(f); busy(b, true);
  try { if (d.tipe !== 'MANDIRI' && !S.files.mandat) throw new Error('Surat mandat/SK wajib diunggah.'); const r = await rp('auth.daftar', Object.assign({}, d, { mandat: S.files.mandat })); toast(r.message); go('login'); }
  catch (e) { toast(e.message, 'err'); busy(b, false); }
};
/* ===== Prefetch menu publik (dipicu niat: kursor/jari di tautan) ===== */
Object.assign(KRP.PRE, {
  klas: () => (S.klasMode || 'tahun') === 'tahun' ? [['klt_' + (S.klasTh || 'kini'), 'pub.klas.tahun', S.klasTh ? { tahun: S.klasTh } : {}, 30000]] : [['klas', 'pub.klas', {}, 30000]],
  rekor: () => [['rekor', 'pub.rekor', {}, 60000]], atlet: () => [['atlet', 'pub.atlet', {}, 60000]], galeri: () => [['galeri', 'pub.galeri', {}, 60000]], arsip: () => [['klas', 'pub.klas', {}, 30000]],
  startlist: () => [['slall', 'pub.sl', {}, 30000]],
  live: id => { id = id || idLive(); return id ? [['live_' + id, 'pub.live', { id }, 15000]] : []; },
  profil: id => id ? [['pf_' + id, 'pub.profil', { id }, 60000]] : []
});
})();

(function () {
'use strict';
/* ===== Info Lomba (publik) — dipindah dari modul event agar tidak perlu mengunduh modul panitia ===== */
const { $, $$, E, S, V, ACT, rp, swr, card, rupiah, fdt, jn, go, home } = KRP;
const main = h => { $('#main').innerHTML = h; };
const BLN3 = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const tglS = s => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || ''); return m ? { y: +m[1], m: +m[2] - 1, d: +m[3] } : null; };
function rentang(a, b) {
  const x = tglS(a), y = tglS(b) || x; if (!x) return '<span class="mut">—</span>';
  if (y.y === x.y && y.m === x.m && y.d === x.d) return `${x.d} ${BLN3[x.m]} ${x.y}`;
  if (x.y === y.y && x.m === y.m) return `${x.d}–${y.d} ${BLN3[x.m]} ${x.y}`;
  if (x.y === y.y) return `${x.d} ${BLN3[x.m]} – ${y.d} ${BLN3[y.m]} ${x.y}`;
  return `${x.d} ${BLN3[x.m]} ${x.y} – ${y.d} ${BLN3[y.m]} ${y.y}`;
}
const lines = t => String(t || '').split('\n').map(x => x.replace(/^\s*(?:\d+[.)]|[a-z][.)]|[-•])\s*/i, '').trim()).filter(Boolean);
/* ---------- Info Lomba (publik) ---------- */
const INF_SEC = [['syarat', 'Persyaratan peserta', 'bi-person-check'], ['lomba', 'Ketentuan perlombaan', 'bi-list-check'], ['bayar', 'Biaya & pembayaran', 'bi-cash-coin'], ['penghargaan', 'Penghargaan', 'bi-award'], ['terbaik', 'Penentuan perenang terbaik', 'bi-star'], ['protes', 'Protes', 'bi-megaphone'], ['kesehatan', 'Kesehatan & tanggung jawab peserta', 'bi-heart-pulse'], ['lain', 'Lain-lain', 'bi-three-dots']];
V.info = function () { swr('pev', 'pub.event', {}, d => { S.PEV = d; drawInfo(); }, 60000); };
function sisaTeks(d) {
  const e = d.ev, now = Date.now(), t = e.daftar_tutup ? new Date(String(e.daftar_tutup).length <= 10 ? e.daftar_tutup + 'T23:59:59' : e.daftar_tutup) : null, m = e.daftar_mulai ? new Date(e.daftar_mulai) : null;
  if (d.buka) { if (!t) return ['ok', 'Pendaftaran dibuka']; const h = Math.floor((t - now) / 3600000); return ['ok', h >= 48 ? `Pendaftaran dibuka · tutup ${Math.ceil(h / 24)} hari lagi` : h >= 1 ? `Pendaftaran dibuka · tutup ${h} jam lagi` : 'Pendaftaran segera ditutup']; }
  if (m && m > now && d.fase === 'PENDAFTARAN') return ['info', 'Pendaftaran dibuka mulai ' + fdt(e.daftar_mulai)];
  return ['warn', 'Pendaftaran ditutup'];
}
function drawInfo() {
  const d = S.PEV, e = d.ev, i = e.info || {}, acc = S.me ? (S.me.role === 'KONTINGEN' ? 'm-dash' : KRP.home()) : 'daftar', st = sisaTeks(d);
  const maps = e.maps || ('https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([e.venue, e.alamat, e.kota].filter(Boolean).join(', ')));
  const wa = String(i.kontak_hp || '').replace(/\D/g, '').replace(/^0/, '62');
  const fakta = [['bi-calendar-event', 'Pelaksanaan', E(e.tanggal_teks || rentang(e.tgl_mulai, e.tgl_selesai))], ['bi-door-open', 'Pendaftaran', `${e.daftar_mulai ? fdt(e.daftar_mulai) + ' – ' : 'Sampai '}${fdt(e.daftar_tutup)}${String(e.daftar_tutup).length > 10 ? ' WIB' : ''}`],
    ['bi-cash-coin', 'Biaya', e.mode === 'PAKET' ? `${rupiah(e.paket)} / atlet <small>(${e.nmax} nomor)</small>` : `${rupiah(e.biaya_nomor)} / nomor`], ['bi-list-check', 'Nomor per atlet', e.nmin === e.nmax ? `Wajib ${e.nmin} nomor` : `${e.nmin}–${e.nmax} nomor`],
    ['bi-people', 'Kuota peserta', e.kuota ? `${d.terisi} / ${e.kuota} atlet` : `${d.terisi} atlet terdaftar <small>· tanpa batas</small>`], ['bi-water', 'Kolam', `${e.kolam === 'SCM' ? 'Short course 25 m' : e.kolam === 'LCM' ? 'Long course 50 m' : '—'} <small>· ${e.lintasan || '-'} lintasan</small>`],
    ['bi-stopwatch', 'Sistem lomba', E(i.sistem || '—')], ['bi-flag', 'Start', E(i.start || '—')]];
  S.ik = S.ik && d.kel.some(k => k.kode === S.ik) ? S.ik : (d.kel[0] || {}).kode;
  main(`<section class="inf-hero"><div class="k-wrap"><div class="inf-tags">${e.tingkat ? `<span class="k-tag"><i class="bi bi-bar-chart-steps"></i> Tingkat ${E(e.tingkat)}</span>` : ''}${e.wilayah ? `<span class="k-tag"><i class="bi bi-pin-map"></i> ${E(e.wilayah)}</span>` : ''}<span class="k-tag"><i class="bi bi-water"></i> ${E(e.musim)}</span></div><h1>${E(e.nama)}</h1>
<div class="hmeta"><span><i class="bi bi-calendar-event"></i> ${E(e.tanggal_teks)}</span><a href="${E(maps)}" target="_blank" rel="noopener"><i class="bi bi-geo-alt"></i> ${E([e.venue, e.alamat, e.kota].filter(Boolean).join(', '))} <i class="bi bi-box-arrow-up-right sm"></i></a></div>
<div class="inf-st ${st[0]}"><i class="bi ${st[0] === 'ok' ? 'bi-door-open' : st[0] === 'info' ? 'bi-hourglass-split' : 'bi-door-closed'}"></i> ${E(st[1])}</div>
<div class="hcta"><button class="k-btn lg k-orange" data-go="${acc}">${S.me ? 'Buka Panel Saya' : 'Daftar Sekarang'}</button>${i.wa_grup ? `<a class="k-btn lg k-outline inf-wa" href="${E(i.wa_grup)}" target="_blank" rel="noopener"><i class="bi bi-whatsapp"></i> Grup WhatsApp</a>` : ''}<button class="k-btn lg k-outline inf-wa" data-go="jadwal"><i class="bi bi-calendar3"></i> Jadwal & Start List</button></div></div></section>
<div class="k-wrap pad"><div class="inf-facts">${fakta.map(f => `<div class="inf-f"><i class="bi ${f[0]}"></i><div><small>${f[1]}</small><b>${f[2]}</b></div></div>`).join('')}</div>
${d.kel.length ? `<div class="k-sh"><small>KELOMPOK & NOMOR</small><h2>Nomor lomba per kelompok</h2><p class="mut">Atlet otomatis masuk kelompok sesuai kelasnya dan hanya bisa memilih nomor kelompoknya.${e.minp ? ` Nomor dengan peserta kurang dari ${e.minp} dapat dibatalkan.` : ''}</p></div>
<div class="k-chips inf-kchips">${d.kel.map(k => `<button class="k-chip${S.ik === k.kode ? ' on' : ''}" data-act="inf-k" data-v="${E(k.kode)}">${k.huruf ? `<b>${E(k.huruf)}</b> · ` : ''}${E(k.nama)} <small>(${k.nomor.length})</small></button>`).join('')}</div><div id="inf-kel">${infKel()}</div>` : ''}
<div class="k-sh" style="margin-top:28px"><small>KETENTUAN</small><h2>Ketentuan lengkap</h2></div>
<div class="inf-secs">${INF_SEC.filter(s => lines(i[s[0]]).length).map((s, n) => `<details class="inf-sec"${n < 2 ? ' open' : ''}><summary><i class="bi ${s[2]}"></i> ${s[1]}</summary><ol>${lines(i[s[0]]).map(l => `<li>${E(l)}</li>`).join('')}</ol>${s[0] === 'protes' && (i.uang_protes || i.batas_protes) ? `<p class="sm mut">${i.batas_protes ? 'Batas waktu: ' + E(i.batas_protes) + '. ' : ''}${i.uang_protes ? 'Uang jaminan: ' + rupiah(i.uang_protes) + '.' : ''}</p>` : ''}${s[0] === 'bayar' ? '<p class="sm mut"><i class="bi bi-shield-lock"></i> Nomor rekening tampil di akun pendaftar setelah masuk.</p>' : ''}</details>`).join('') || '<p class="mut">Ketentuan belum diisi panitia.</p>'}</div>
<div class="g2" style="margin-top:20px">${card('<i class="bi bi-headset"></i> Kontak panitia', `<ul class="k-list">${i.kontak_nama || i.kontak_hp ? `<li><span>${E(i.kontak_nama || 'Panitia')}</span>${wa.length > 8 ? `<a class="k-btn sm k-navy" target="_blank" rel="noopener" href="https://wa.me/${wa}"><i class="bi bi-whatsapp"></i> ${E(i.kontak_hp)}</a>` : `<b>${E(i.kontak_hp || '')}</b>`}</li>` : ''}${i.kontak_email ? `<li><span>Email</span><a href="mailto:${E(i.kontak_email)}">${E(i.kontak_email)}</a></li>` : ''}${i.wa_grup ? `<li><span>Grup WhatsApp peserta</span><a class="k-btn sm k-outline" href="${E(i.wa_grup)}" target="_blank" rel="noopener">Gabung</a></li>` : ''}${i.tgl_buku_acara ? `<li><span>Buku Acara terbit</span><b>${fdt(i.tgl_buku_acara)}</b></li>` : ''}${i.tm ? `<li><span>Technical meeting</span><b>${E(i.tm)}</b></li>` : ''}</ul>`)}
${card('<i class="bi bi-person-plus"></i> Cara mendaftar', `<ol class="sm ev-ol"><li>Buat akun ${e.tipe.map(t => ({ SEKOLAH: 'sekolah', KLUB: 'klub', MANDIRI: 'pribadi (mandiri)' })[t]).filter(Boolean).join(' / ')} sekali saja.</li><li>Tambahkan atlet (biodata & berkas tersimpan untuk event berikutnya).</li><li>Pilih nomor sesuai kelompok atlet${e.nmin === e.nmax ? ` (wajib ${e.nmin} nomor)` : ''} dan isi waktu terbaik${i.nt ? '; tanpa catatan waktu pakai ' + E(i.nt) : ''}.</li><li>Transfer biaya, unggah bukti bayar, tunggu verifikasi panitia.</li></ol>${i.link_daftar ? `<p class="mut sm">Tautan pendaftaran lain dari panitia: <a href="${E(i.link_daftar)}" target="_blank" rel="noopener">${E(i.link_daftar)}</a></p>` : ''}<button class="k-btn k-orange" data-go="${acc}">${S.me ? 'Buka Panel Saya' : 'Buat akun / Masuk'}</button>`)}</div></div>`);
}
function infKel() {
  const d = S.PEV, k = d.kel.filter(x => x.kode === S.ik)[0]; if (!k) return '';
  const grp = {}, ord = [], GU = { 'Gaya Bebas': 1, 'Gaya Punggung': 2, 'Gaya Dada': 3, 'Gaya Kupu-kupu': 4, 'Gaya Ganti Perorangan': 5 }; k.nomor.forEach(n => { const key = n.d + '|' + n.s; if (!grp[key]) { grp[key] = {}; ord.push(key); } grp[key][n.g] = n; });
  ord.sort((a, b) => { const x = a.split('|'), y = b.split('|'); return (GU[x[1]] || 9) - (GU[y[1]] || 9) || x[0] - y[0]; });
  const stt = n => !n ? '' : !n.b ? '<span class="k-pill k-err">Ditutup</span>' : n.q && n.n >= n.q ? '<span class="k-pill k-err">Penuh</span>' : n.q ? `<span class="k-pill k-ok">Sisa ${n.q - n.n}</span>` : '<span class="k-pill k-ok">Dibuka</span>';
  return `<div class="k-card"><div class="k-card-h"><h3>${k.huruf ? 'Kelompok ' + E(k.huruf) + ' · ' : ''}${E(k.nama)}</h3><span class="mut sm">${k.nomor.length} nomor</span></div><div class="k-scroll"><table class="k-table"><thead><tr><th>Nomor lomba</th><th>Putra</th><th>Putri</th><th>Hari</th></tr></thead><tbody>${ord.map(key => { const g = grp[key], a = g.PUTRA || g.PUTRI; return `<tr><td><b>${a.d} m ${E(a.s.replace('Gaya ', 'Gaya '))}</b></td><td>${g.PUTRA ? `<span class="mono">#${g.PUTRA.no}</span> ${stt(g.PUTRA)}` : '<span class="mut">—</span>'}</td><td>${g.PUTRI ? `<span class="mono">#${g.PUTRI.no}</span> ${stt(g.PUTRI)}` : '<span class="mut">—</span>'}</td><td>${a.hari ? 'Hari ' + a.hari : ''}</td></tr>`; }).join('')}</tbody></table></div></div>`;
}
ACT['inf-k'] = a => { S.ik = a.dataset.v; $$('.inf-kchips .k-chip').forEach(c => c.classList.toggle('on', c === a)); $('#inf-kel').innerHTML = infKel(); };
KRP.PRE.info = () => [['pev', 'pub.event', {}, 60000]];
})();

(function () {
'use strict';
/* ===== Riwayat & Portofolio kejuaraan (publik, v2.4.0)
   Satu kartu per edisi (terbaru di atas): angka peserta, juara umum, Best Swimmer, rekor, buku hasil, tautan, dan predikat kurasi Puspresnas.
   Data otomatis dari hasil web & arsip hasil yang diunggah; dilengkapi Super Admin di menu Portofolio. ===== */
const { $, $$, E, S, V, INP, swr, ph, card, empty, kpi, thumb, go } = KRP;
const main = h => { $('#main').innerHTML = h; };
const angka = n => Number(n || 0).toLocaleString('id-ID');
const KOL = { SCM: 'Kolam 25 m', LCM: 'Kolam 50 m' };
const ST = { BERLANGSUNG: ['k-warn', 'Sedang berlangsung'], AKAN_DATANG: ['k-neu', 'Akan datang'] };
const bintang = p => { const n = Number(p) || 0; return n ? `<span class="pf-star" aria-label="Bintang ${n}">${'★'.repeat(n)}<i>${'★'.repeat(5 - n)}</i></span>` : ''; };
const md = t => t && t.e !== undefined ? `<span class="bs-md"><span class="md g" title="Emas">${t.e}</span><span class="md s" title="Perak">${t.p}</span><span class="md b" title="Perunggu">${t.b}</span></span>` : '';
const drive = id => 'https://drive.google.com/file/d/' + encodeURIComponent(id) + '/view';

function kartu(e) {
  const meta = [e.tglTeks, e.lokasi, e.tingkat ? 'Tingkat ' + e.tingkat : '', KOL[e.kolam]].filter(Boolean), st = ST[e.status];
  const stat = [['bi-people', e.atlet, 'atlet'], ['bi-building', e.sekolah, 'sekolah/klub'], ['bi-list-ol', e.nomor, 'nomor lomba'], ['bi-award', e.medali, 'medali'], ['bi-lightning-charge', e.rekor, 'rekor baru']].filter(x => Number(x[1]) > 0);
  const buku = (e.dok || []).filter(d => d.jenis === 'RESULT_BOOK' || d.jenis === 'BUKU_ACARA'), top = (e.top || []).length ? e.top : e.juara ? [{ nama: e.juara }] : [];
  const cari = [e.judul, e.lokasi, e.tahun, e.juara, e.tingkat].concat(top.map(t => t.nama), (e.bs || []).map(b => b.nama)).join(' ').toLowerCase();
  return `<article class="pf-ed" data-s="${E(cari)}"><div class="pf-yr"><b>${e.tahun || '–'}</b></div><div class="k-card pf-card">
${e.foto ? `<div class="pf-cover"><img src="${thumb(e.foto, 1200)}" alt="${E(e.judul)}" loading="lazy"></div>` : ''}<div class="k-card-b">
<div class="pf-badges">${e.edisi ? `<span class="k-pill k-neu">Edisi ke-${E(e.edisi)}</span>` : ''}${st ? `<span class="k-pill ${st[0]}">${st[1]}</span>` : ''}${e.kur ? `<span class="pf-kur">${bintang(e.kur.pred)}<span>${e.kur.pred === '0' ? 'Terkurasi Puspresnas' : 'Terkurasi Puspresnas · Bintang ' + E(e.kur.pred)}</span></span>` : ''}</div>
<h3 class="pf-t">${E(e.judul)}</h3>${meta.length ? `<p class="pf-meta">${meta.map(E).join(' · ')}</p>` : ''}${e.ringkas ? `<p class="pf-desc">${E(e.ringkas)}</p>` : ''}
${stat.length ? `<div class="pf-stat">${stat.map(x => `<span><i class="bi ${x[0]}"></i><b>${angka(x[1])}</b> ${x[2]}</span>`).join('')}</div>` : ''}
${top.length || (e.bs || []).length ? `<div class="pf-grid">${top.length ? `<div class="pf-box"><small>JUARA UMUM</small>${top.map((t, i) => `<div class="pf-jr"><span class="rk ${['g', 's', 'b'][i]}">${i + 1}</span><b>${E(t.nama)}</b>${md(t)}</div>`).join('')}${e.klub ? `<p class="mut sm" style="margin:6px 0 0">Klub terbaik: ${E(e.klub)}</p>` : ''}</div>` : ''}
${(e.bs || []).length ? `<div class="pf-box"><small>BEST SWIMMER</small><ul class="pf-bs">${e.bs.map(b => `<li><i class="bi bi-star-fill"></i><span><b>${E(b.nama)}</b><br><span class="mut sm">${E([b.kel, b.g === 'PUTRI' ? 'Putri' : 'Putra'].filter(Boolean).join(' · '))}${b.kont ? ' · ' + E(b.kont) : ''}</span></span></li>`).join('')}</ul></div>` : ''}</div>` : ''}
${e.arsip && e.musim || buku.length || (e.tautan || []).length ? `<div class="pf-act">${e.arsip && e.musim ? `<a class="k-btn sm k-navy" href="#" data-go="arsip" data-p="${E(e.musim)}"><i class="bi bi-table"></i> Hasil & klasemen</a>` : ''}${buku.map(d => `<a class="k-btn sm k-outline" target="_blank" rel="noopener" href="${drive(d.id)}"><i class="bi bi-file-earmark-pdf"></i> ${d.jenis === 'RESULT_BOOK' ? 'Buku Hasil' : 'Buku Acara'}</a>`).join('')}${(e.tautan || []).map(l => `<a class="k-btn sm k-ghostw" target="_blank" rel="noopener" href="${E(l.u)}"><i class="bi bi-box-arrow-up-right"></i> ${E(l.j || 'Tautan')}</a>`).join('')}</div>` : ''}
</div></div></article>`;
}

function riwayatKurasi(L) {
  const K = L.filter(e => e.kur).sort((a, b) => (Number(b.kur.thn) || b.tahun) - (Number(a.kur.thn) || a.tahun));
  if (!K.length) return '';
  return card('<i class="bi bi-patch-check"></i> Riwayat kurasi Puspresnas', `<div class="k-scroll"><table class="k-table pf-kt"><thead><tr><th>Tahun</th><th>Edisi</th><th>Predikat</th><th>No. SK / surat</th><th>Bukti</th></tr></thead><tbody>${K.map(e => `<tr><td class="mono">${E(e.kur.thn || e.tahun || '–')}</td><td><b>${E(e.judul)}</b></td><td>${bintang(e.kur.pred)} <span class="sm">${E(e.kur.predTeks)}</span></td><td>${E(e.kur.sk || '–')}</td><td>${[e.kur.file ? `<a href="${drive(e.kur.file)}" target="_blank" rel="noopener"><i class="bi bi-file-earmark-check"></i> Sertifikat</a>` : '', e.kur.url ? `<a href="${E(e.kur.url)}" target="_blank" rel="noopener"><i class="bi bi-box-arrow-up-right"></i> Tautan</a>` : ''].filter(Boolean).join(' · ') || '–'}</td></tr>`).join('')}</tbody></table></div><p class="mut sm" style="margin:8px 0 0">Predikat hasil kurasi ajang dari Pusat Prestasi Nasional (Puspresnas): Bintang 5 (Istimewa) sampai Bintang 1, atau tanpa peringkat.</p>`);
}

V.riwayat = function () {
  swr('porto', 'pub.porto', {}, d => {
    const L = d.edisi || [], r = d.ringkas || {}, nama = (S.B && S.B.cfg && (S.B.cfg.portal_nama || S.B.cfg.app_name)) || 'Kejuaraan Renang Pelajar';
    if (!L.length) return main(`<div class="k-wrap pad">${ph('Riwayat Kejuaraan', 'Portofolio setiap edisi ' + E(nama))}${empty('bi-journal-richtext', 'Belum ada riwayat kejuaraan yang ditampilkan.')}</div>`);
    main(`<div class="k-wrap pad">${ph('Riwayat Kejuaraan', `Portofolio ${E(nama)}${r.tahunAwal ? ' sejak ' + r.tahunAwal : ''}: peserta, juara, rekor, dan kurasi tiap edisi.`)}
<div class="k-kpis pf-kp">${kpi('Edisi', angka(r.edisi), 'bi-journal-richtext', r.tahunAwal ? 'sejak ' + r.tahunAwal : '')}${kpi('Partisipasi atlet', angka(r.atlet), 'bi-people', 'jumlah dari semua edisi')}${kpi('Sekolah/klub', angka(r.sekolah), 'bi-building', 'jumlah dari semua edisi')}${kpi('Rekor tercipta', angka(r.rekor), 'bi-lightning-charge')}${r.terkurasi ? kpi('Terkurasi Puspresnas', r.terkurasi + ' edisi', 'bi-patch-check', r.predTop ? 'tertinggi Bintang ' + r.predTop : '') : ''}</div>
${riwayatKurasi(L)}
${L.length > 4 ? '<input class="k-in pf-q" data-in="pf-q" placeholder="Cari edisi, tahun, lokasi, juara, atau Best Swimmer…">' : ''}
<div class="pf-tl" id="pf-tl">${L.map(kartu).join('')}</div><p class="mut sm" id="pf-kosong" hidden>Tidak ada edisi yang cocok.</p></div>`);
  }, 60000);
};
INP['pf-q'] = i => { const q = i.value.trim().toLowerCase(); clearTimeout(S._pfq); S._pfq = setTimeout(() => { let n = 0; $$('#pf-tl .pf-ed').forEach(a => { a.hidden = !!q && a.dataset.s.indexOf(q) < 0; if (!a.hidden) n++; }); const k = $('#pf-kosong'); if (k) k.hidden = n > 0; }, 150); };
Object.assign(KRP.PRE, { riwayat: () => [['porto', 'pub.porto', {}, 60000]] });
})();

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
${d.tipeOk === false ? alertx('err', `<b>${E(KRP.cfgv('app_name'))}</b> tidak menerima pendaftaran dari akun ${E(TIPE_L[k.tipe] || k.tipe)}. Hubungi panitia bila ada pertanyaan.`, 'bi-slash-circle') : !d.buka ? (d.fix ? alertx('warn', `<b>Pendaftaran ditutup</b> (tahap: ${E(KRP.FASE_L[d.fase] || d.fase)}). Sampai start list terbit, Anda masih dapat memperbaiki berkas bila diminta panitia dan <a href="#" data-go="m-png">mengajukan perubahan data</a>.`, 'bi-door-closed') : alertx('info', `${d.tarik ? '<b>Start list sedang direvisi panitia</b> dan akan diterbitkan ulang.' : `<b>Start list sudah terbit</b> (tahap: ${E(KRP.FASE_L[d.fase] || d.fase)}).`} Data atlet dan nomor lomba tidak bisa diubah lagi dari akun ini. Bila ada revisi (nama, seed time, nomor), hubungi panitia; perubahan dilakukan Super Admin.`, 'bi-lock')) : alertx('info', `Pendaftaran dibuka${d.dl ? ` hingga <b>${fdt(d.dl)}</b>` : ''}. ${d.atlet.length ? 'Atlet Anda sudah tersimpan — cukup <b>pilih nama, pilih nomor, unggah bukti bayar</b>.' : mand ? 'Mulai dengan melengkapi data dan berkas Anda.' : 'Mulai dengan menambahkan atlet pertama.'}<br><span class="sm">${aturanTeks()} · <a href="#" data-go="info">Info & ketentuan lomba</a></span>`, 'bi-door-open')}
${d.atlet.filter(a => (a.bs || []).length).map(a => a.bs.map(b => alertx('ok', `<b>Selamat!</b> ${E(a.nama)} meraih gelar <b>Best Swimmer ${E(jn(b.jk))} ${b.g === 'PUTRI' ? 'Putri' : 'Putra'}</b> pada ${E(b.event)}. <a href="#" data-go="m-atlet" data-p="${a.id}">Lihat atlet</a>`, 'bi-trophy-fill')).join('')).join('')}<div id="pr-ban"></div><div class="k-kpis">${kpi('Atlet', d.atlet.length, 'bi-people')}${kpi('Nomor didaftarkan', nEnt, 'bi-list-ol')}${kpi('Total biaya', rupiah(d.inv.total), 'bi-receipt')}${kpi('Belum lunas', rupiah(d.inv.sisa), 'bi-hourglass-split', `Lunas ${rupiah(d.inv.lunas)}`)}</div>
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
      return card(`2. Nomor untuk ${E(a.nama)}`, `<p class="mut sm">${E(jn(a.jk))} · ${G_L[a.g]} · sudah ${used} nomor · ${minEv === maxEv ? 'wajib ' + maxEv : 'minimal ' + minEv + ', maksimal ' + maxEv} nomor per atlet</p>${kurang ? `<p class="mn-kurang"><i class="bi bi-exclamation-circle"></i> Pilih ${kurang} nomor lagi.</p>` : ''}${semua.length ? semua.map(e => { const on = sel[id][e.id] !== undefined, off = tutup(e) || penuh(e), lock = !on && (off || used + cnt >= maxEv); return `<div class="k-ev${off ? ' off' : ''}"><label><input type="checkbox" data-chg="nm-e" data-a="${id}" value="${e.id}" ${on ? 'checked' : ''} ${lock ? 'disabled' : ''}><span><b>#${e.no} ${E(e.nama)}</b><small>${e.jam ? 'Estimasi ' + E(e.jam) + ' · ' : ''}Hari ${e.hari}</small></span>${evState(e) || (pk ? '' : `<b>${rupiah(e.fee)}</b>`)}</label>${on ? seedBox(a, e, sel[id][e.id]) : ''}</div>`; }).join('') : '<p class="mut">Tidak ada nomor tersisa untuk atlet ini.</p>'}`);
    }).join('');
  let tot = 0, n = 0; Object.keys(sel).forEach(id => { const a = d.atlet.filter(x => x.id === id)[0], used = a ? a.ent.filter(e => e.v !== 'REJECTED').length : 0; Object.keys(sel[id]).forEach((eid, j) => { n++; tot += feeIdx(S.B.events.filter(e => e.id === eid)[0] || {}, used + j); }); }); S.nm.total = tot; S.nm.n = n;
  $('#nm-sum').innerHTML = `<div class="k-sum"><span>${Object.keys(sel).length} atlet · ${n} nomor${pk ? ' · paket ' + rupiah(EVR().paket) + '/atlet' : ''}</span><b class="big">${rupiah(tot)}</b></div><br>`;
  if (!$('#nm-dz').innerHTML) $('#nm-dz').innerHTML = dz('bayar', 'Bukti transfer pembayaran', 'PDF/JPG/PNG maks 5 MB — satu bukti untuk semua nomor di atas');
}
INP['nm-a'] = i => { if (i.checked) S.nm.sel[i.value] = S.nm.sel[i.value] || {}; else delete S.nm.sel[i.value]; drawNm(); };
INP['nm-e'] = i => { const a = S.nm.sel[i.dataset.a], at = S.M.atlet.filter(x => x.id === i.dataset.a)[0], pb = at && (at.pb || {})[i.value]; if (i.checked) a[i.value] = pb ? pb.w : ''; else delete a[i.value]; drawNm(); };
// Entry time: bila atlet sudah punya catatan waktu resmi di nomor yang sama (kejuaraan sebelumnya), terisi otomatis dan tidak bisa NT.
const kolL = k => k === 'SCM' ? 'kolam 25 m' : 'kolam 50 m';
function seedBox(a, e, v) {
  const pb = (a.pb || {})[e.id];
  if (!pb) return `<input class="k-in tm sm" data-in="nm-seed" data-a="${a.id}" data-e="${e.id}" placeholder="Waktu terbaik, mis. 00:57.94 (kosong = NT)" value="${E(v)}">`;
  return `<input class="k-in tm sm" data-in="nm-seed" data-a="${a.id}" data-e="${e.id}" placeholder="Wajib diisi, mis. ${E(pb.w)}" value="${E(v)}" required><small class="nm-pb"><i class="bi bi-clock-history"></i> Catatan sebelumnya <b class="mono">${E(pb.w)}</b> · ${E(pb.src)}${e.ct && pb.kol !== e.ct ? ' (' + kolL(pb.kol) + ')' : ''}. Ubah bila ada catatan yang lebih baru; tidak bisa NT.</small>`;
}
const seedOk = v => { // sama dengan parseWaktu_ di server: [jj:]mm:dd.ss atau dd.ss, bukan NT, > 0
  const s = String(v || '').trim().replace(',', '.'); if (!s || /^nt$/i.test(s)) return false; const p = s.split(':'); if (p.length > 3) return false;
  const last = p.pop(); if (!/^\d{1,2}(\.\d{1,3})?$/.test(last) || parseFloat(last) >= 60 || !p.every(x => /^\d{1,2}$/.test(x)) || (p.length && Number(p[p.length - 1]) >= 60)) return false;
  return parseFloat(last) > 0 || p.some(x => Number(x) > 0);
};
INP['nm-seed'] = i => { S.nm.sel[i.dataset.a][i.dataset.e] = i.value; };
SUBMIT.nomor = async () => {
  const b = $('#nm-go'), n = S.nm; if (!n.n) return toast('Pilih minimal satu atlet dan satu nomor.', 'err');
  const minEv = EVR().min || 1; for (const id of Object.keys(n.sel)) { const a = S.M.atlet.filter(x => x.id === id)[0], used = a.ent.filter(e => e.v !== 'REJECTED').length, c = Object.keys(n.sel[id]).length; if (used + c < minEv) return toast(`${a.nama}: wajib ${minEv} nomor per atlet (terpilih ${used + c}).`, 'err'); }
  for (const id of Object.keys(n.sel)) { const a = S.M.atlet.filter(x => x.id === id)[0]; for (const eid of Object.keys(n.sel[id])) { const pb = (a.pb || {})[eid], v = String(n.sel[id][eid] || '').trim(), ev = S.B.events.filter(e => e.id === eid)[0] || {}; if (pb && (!v || /^nt$/i.test(v) || !seedOk(v))) return toast(`${a.nama} #${ev.no}: catatan waktu wajib diisi dan tidak bisa NT karena sudah punya catatan ${pb.w}. Isi waktu terbaru, mis. ${pb.w}.`, 'err'); } }
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
    main(`<div class="k-wrap pad"><button class="k-btn k-ghostw sm" data-go="m-dash"><i class="bi bi-arrow-left"></i> Kembali</button><br><br><div class="k-card pfh"><div class="k-card-b">${a.f ? `<img class="k-av xl" src="${thumb(a.f, 300)}" alt="">` : `<span class="k-av ph xl">${E(initials(a.nama))}</span>`}<div style="flex:1"><span class="bib mono">${E(a.bib)}</span><h1>${E(a.nama)}</h1><p class="mut">${E(a.sk || '')}${a.kl ? ' · ' + E(a.kl) : ''} · ${E(a.wl || '')}<br>${E(jn(a.jk))} · ${G_L[a.g]} · Kelas ${kls(a.kelas)} · NISN ${E(a.nisn)}</p>${pill(a.st)}${(a.bs || []).map(b => `<div class="bs-badge"><i class="bi bi-trophy-fill"></i><div><b>Best Swimmer ${E(jn(b.jk))} ${b.g === 'PUTRI' ? 'Putri' : 'Putra'}</b><small>${E(b.event)}</small></div></div>`).join('')}</div><div class="k-qa" style="flex-direction:column"><button class="k-btn k-outline sm" data-act="idcard" data-id="${a.id}"><i class="bi bi-person-badge"></i> Kartu ID</button>${d.buka ? `<button class="k-btn k-outline sm" data-go="m-nomor"><i class="bi bi-plus-circle"></i> Tambah nomor</button>` : ''}${d.fix ? `<button class="k-btn k-ghostw sm" data-go="m-png" data-p="${a.id}"><i class="bi bi-pencil"></i> Ajukan perubahan</button>` : ''}</div></div></div>
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
    main(`<div class="k-wrap pad">${ph('Pengajuan Perubahan', 'Revisi data atlet atau mutasi ke sekolah/klub lain — diputuskan Super Admin / Admin Pendaftaran.')}${d.fix ? alertx('info', 'Pengajuan bisa dikirim sampai start list terbit. Setelah itu, perubahan hanya dilakukan panitia.', 'bi-info-circle') : alertx('warn', 'Start list sudah terbit. Pengajuan tidak bisa dikirim lagi dari akun ini; hubungi panitia bila ada revisi. Riwayat pengajuan tetap tampil di bawah.', 'bi-lock')}
<div class="g-main"><form class="k-card" data-submit="png"><div class="k-card-h"><h3>Form pengajuan</h3></div><div class="k-card-b"><div class="k-seg" style="margin-bottom:12px"><button type="button" class="on" data-act="png-t" data-v="REVISI">Revisi data</button>${mand ? '' : '<button type="button" data-act="png-t" data-v="MUTASI">Mutasi</button>'}</div>
${field('Atlet', sel('atletId', d.atlet.map(a => [a.id, a.nama]), pre || ''), 1)}<div id="png-f"></div>${field('Alasan', `<textarea class="k-in" name="alasan" rows="3" required minlength="5"></textarea>`, 1)}${dz('bukti', 'Bukti pendukung', 'Wajib — PDF/JPG/PNG maks 5 MB')}<div class="k-bar"><button class="k-btn k-orange" ${d.fix ? '' : 'disabled'}>Kirim Pengajuan</button></div></div></form>
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
['m-dash', 'm-nomor', 'm-baru', 'm-png', 'm-akun'].forEach(r => { KRP.PRE[r] = () => [['mboot', 'm.boot', {}, 5000]]; });
})();

(function () {
'use strict';
const { $, E, S, V, LS, rp, go, home, toast, NAV_APP, isApp, bustCache, shell, API_SIAP, GAS_URL, muatAdmin } = KRP;

/* ===== Boot (frontend statis + API) =====
   1. Tampil instan: data portal (pub.boot) dari salinan lokal terakhir bila ada → layar langsung terisi.
   2. Segarkan di latar (stale-while-revalidate); bila berubah, kerangka & halaman publik diperbarui.
   3. Tautan langsung (#/jadwal, #/profil/ID) dan tombol Back browser berfungsi.
   4. Panitia yang masih login: modul admin diunduh di latar (prefetch) agar menu langsung responsif. */
const KRP_VER = '2.0.0', BOOT_K = 'krp_boot', AMAN_SEGAR = ['home', 'info', 'jadwal', 'klas', 'rekor', 'galeri', 'arsip', 'riwayat', 'atlet'];
function resetLokal() { try { Object.keys(localStorage).forEach(k => { if (k.indexOf('krp_') === 0 && k !== 'krp_th') localStorage.removeItem(k); }); } catch (e) { } S.me = null; S.token = null; S.cache = {}; }
function fatal(msg) {
  const m = document.getElementById('main'); if (!m) return;
  m.innerHTML = '<div class="k-wrap pad" style="text-align:center;padding-top:40px"><h2>Aplikasi belum bisa ditampilkan</h2><p class="mut" style="margin:8px 0 16px">' + E(msg || 'Terjadi kesalahan.') + '</p><button class="k-btn k-navy" id="fx-reload">Muat ulang</button> <button class="k-btn" id="fx-reset">Hapus data lokal &amp; muat ulang</button></div>';
  const r = document.getElementById('fx-reload'), x = document.getElementById('fx-reset');
  if (r) r.onclick = () => location.reload(); if (x) x.onclick = () => { resetLokal(); LS.d('krp_ver'); location.reload(); };
}
function belumSiap() {
  const m = document.getElementById('main'); if (!m) return;
  m.innerHTML = `<div class="k-wrap pad" style="max-width:640px;padding-top:40px"><h2>Konfigurasi belum lengkap</h2><p class="mut">Alamat API Google Apps Script belum diisi dengan benar di <code>js/config.js</code>.</p><ol class="sm" style="margin:12px 0 0 18px;line-height:1.8"><li>Di Apps Script: <b>Deploy → New deployment → Web app</b> (Execute as: Me, Who has access: Anyone).</li><li>Salin URL yang berakhiran <code>/exec</code>.</li><li>Tempel ke <code>GAS_URL</code> di <code>js/config.js</code>, lalu <code>git add . && git commit -m "config" && git push</code>.</li></ol><p class="mut sm" style="margin-top:12px">Nilai sekarang: <code>${E(GAS_URL || '(kosong)')}</code></p></div>`;
}
window.addEventListener('error', e => { if (document.querySelector('#main .k-skel')) fatal((e.message || 'Kesalahan skrip') + (e.lineno ? ' (baris ' + e.lineno + ')' : '')); });
window.addEventListener('unhandledrejection', e => { if (document.querySelector('#main .k-skel')) fatal(String((e.reason && e.reason.message) || e.reason || 'Kesalahan')); });
const B0 = { cfg: {}, events: [], jenjang: [], st: {}, ring: { atlet: 0, kontingen: 0, nomor: 0, sah: 0 }, top: [], dok: [], logos: [], baru: [] };
function dariHash() { const m = /^#\/([a-z0-9-]+)(?:\/(.+))?$/i.exec(location.hash || ''); if (!m) return null; let p = m[2] || null; try { p = p ? decodeURIComponent(p) : null; } catch (e) { } return { r: m[1], p }; }
const rutBoleh = r => !!r && (!!V[r] || /^a-/.test(r));
async function refreshAll() { bustCache(); try { const r = await rp('pub.boot'); S.B = r.data; LS.s(BOOT_K, JSON.stringify({ t: Date.now(), v: KRP_VER, d: r.data })); } catch (e) { } }
S.refreshAll = refreshAll;
async function segarkan(bootT) {
  try {
    const r = await rp('pub.boot'), js = JSON.stringify(r.data), lama = JSON.stringify(S.B);
    LS.s(BOOT_K, JSON.stringify({ t: Date.now(), v: KRP_VER, d: r.data }));
    if (js === lama) return; S.B = r.data; document.title = S.B.cfg.app_name || document.title;
    if (!isApp(S.route) && AMAN_SEGAR.indexOf(S.route) >= 0 && Date.now() - bootT < 4000 && !document.querySelector('#main form')) go(S.route, S.param, 'r'); else shell();
  } catch (e) { /* tetap memakai salinan lokal */ }
}
async function boot() {
  try {
    const bootT = Date.now();
    try { const th = LS.g('krp_th'); if (th) document.documentElement.dataset.theme = th; } catch (e) { }
    if (!API_SIAP) return belumSiap();
    $('#main').innerHTML = KRP.skel();
    if (LS.g('krp_ver') !== KRP_VER) { resetLokal(); LS.s('krp_ver', KRP_VER); }
    const t = LS.g('krp_t'); let me = null; try { me = JSON.parse(LS.g('krp_me') || 'null'); } catch (e) { }
    if (t && me && me.id && NAV_APP[me.role]) { S.token = t; S.me = me; } else if (t || me) { resetLokal(); LS.s('krp_ver', KRP_VER); }
    if (S.me && S.me.role !== 'KONTINGEN') setTimeout(() => muatAdmin().catch(() => { }), 50); // prefetch modul panitia
    let c = null; try { c = JSON.parse(LS.g(BOOT_K) || 'null'); } catch (e) { }
    if (c && c.d && c.d.cfg && c.v === KRP_VER) { S.B = c.d; segarkan(bootT); }
    else {
      try { const r = await rp('pub.boot'); S.B = r.data; LS.s(BOOT_K, JSON.stringify({ t: Date.now(), v: KRP_VER, d: r.data })); }
      catch (e) { S.B = S.B || B0; KRP.errView(e.message, boot); return; }
    }
    document.title = S.B.cfg.app_name || document.title;
    const h = dariHash(); let start = S.me ? home() : 'home', param = null;
    if (h && rutBoleh(h.r) && !(h.r === 'login' && S.me)) { start = h.r; param = h.p; }
    go(start, param, 'r');
  } catch (e) { console.error(e); resetLokal(); fatal(e.message); }
}
// Tombol Back/Forward browser & ubah alamat manual
window.addEventListener('popstate', () => { const h = dariHash(); if (h && rutBoleh(h.r)) go(h.r, h.p, 'r'); else if (!h) go(S.me ? home() : 'home', null, 'r'); });
// Koneksi HP: beri tahu saat offline, segarkan halaman saat online kembali
window.addEventListener('offline', () => toast('Anda sedang offline. Data terakhir tetap ditampilkan.', 'warn'));
window.addEventListener('online', () => { toast('Koneksi kembali.'); if (!document.querySelector('#main form') && !isApp(S.route)) go(S.route, S.param, 'r'); });
// PWA: service worker untuk cangkang aplikasi (bukan untuk data API)
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { }); });
  // Versi baru aplikasi sudah terunduh di latar → tawarkan muat ulang (tidak memaksa, isian yang sedang diketik aman)
  navigator.serviceWorker.addEventListener('message', e => {
    if (!e.data || e.data.krp !== 'versi-baru' || document.getElementById('k-upd')) return;
    const b = document.createElement('div'); b.id = 'k-upd'; b.className = 'k-upd'; b.setAttribute('role', 'status');
    b.innerHTML = '<i class="bi bi-arrow-repeat"></i><span>Versi baru aplikasi tersedia.</span><button class="k-btn sm k-orange" type="button">Muat ulang</button><button class="k-ibtn" type="button" aria-label="Tutup"><i class="bi bi-x"></i></button>';
    b.querySelector('.k-orange').onclick = () => location.reload(); b.querySelector('.k-ibtn').onclick = () => b.remove(); document.body.appendChild(b);
  });
  try { navigator.serviceWorker.startMessages(); } catch (e) { }
  setTimeout(() => { const c = navigator.serviceWorker.controller; if (c) c.postMessage({ krp: 'tanya' }); }, 2500);
}
KRP.resetLokal = resetLokal;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
