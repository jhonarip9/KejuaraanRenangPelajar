/**
 * ============================================================
 * KRP PRO — Pintu masuk REST API (Api.gs)
 * Google Apps Script sebagai backend JSON murni untuk frontend statis (GitHub Pages).
 *
 *   POST /exec   body (text/plain): { action, token, data, reqId }        → satu aksi
 *                                   { action:'batch', token, data:{ calls:[{action,data},…] } } → ≤ 8 aksi baca sekaligus
 *   GET  /exec?action=pub.boot      → hanya aksi PUBLIK baca (untuk uji cepat / tautan)
 *
 * Aturan:
 *  - Frontend WAJIB mengirim POST dengan Content-Type 'text/plain;charset=utf-8' (tanpa preflight CORS).
 *  - Token sesi dikirim di BODY, tidak pernah di URL.
 *  - Setiap respons memuat: success, data, message, ms (durasi server), v (versi backend).
 *  - Aksi tulis membawa reqId unik → aman dikirim ulang (idempoten, lihat rpc() di Kode.gs).
 *  - Email/tugas lambat dijalankan setelah kunci (LockService) dilepas.
 * ============================================================
 */
const APP_VERSION = '2.0.0';
const BATCH_MAKS = 8;

// ── Antrean "setelah kunci": email dll. tidak dijalankan di dalam LockService ──
let _IN_WEB = false;
let _AFTER = [];
function tundaSetelah_(fn) { if (!_IN_WEB) return false; _AFTER.push(fn); return true; }
function jalankanSetelah_() { const q = _AFTER; _AFTER = []; q.forEach(function (f) { try { f(); } catch (e) { console.error('setelah: ' + e.message); } }); }
function buangSetelah_() { _AFTER = []; }

function json_(res, t0) {
  res = res || fail_('Tidak ada respons.');
  res.ms = Date.now() - t0; res.v = APP_VERSION;
  if (res.ms > 4000) console.warn('LAMBAT ' + (res._aksi || '') + ' ' + res.ms + ' ms');
  delete res._aksi;
  return ContentService.createTextOutput(JSON.stringify(res)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const t0 = Date.now(); let res, body = {};
  _IN_WEB = true; _AFTER = [];
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}') || {};
    const action = String(body.action || '');
    if (action === 'batch') res = batch_(body.token || '', body.data || {});
    else res = rpc(action, body.token || '', body.data || {}, body.reqId || '');
    if (res) res._aksi = action;
  } catch (err) {
    res = fail_('Format permintaan tidak valid.');
  }
  jalankanSetelah_(); _IN_WEB = false;
  return json_(res, t0);
}

function doGet(e) {
  const t0 = Date.now(), p = (e && e.parameter) || {};
  let res;
  try {
    if (p.action) {
      const r = ROUTES[p.action];
      if (!r || r.roles !== 'PUBLIC' || r.write) res = fail_('Lewat GET hanya aksi publik baca. Gunakan POST.');
      else { let d = {}; try { d = JSON.parse(p.data || '{}') || {}; } catch (x) { } res = rpc(p.action, '', d, ''); }
    } else {
      let portal = ''; try { portal = cfg_().portal_url || ''; } catch (x) { }
      res = ok_({ app: 'KRP Pro API', v: APP_VERSION, portal: portal }, 'API Kejuaraan Renang Pelajar aktif.' + (portal ? ' Buka portal di ' + portal : ''));
    }
  } catch (err) { res = fail_(err.message || 'Gagal'); }
  return json_(res, t0);
}

// ── Batch: beberapa aksi BACA dalam satu eksekusi (hemat kuota 30 eksekusi bersamaan) ──
function batch_(token, d) {
  const calls = Array.isArray(d.calls) ? d.calls.slice(0, BATCH_MAKS) : [];
  if (!calls.length) return fail_('Batch kosong.');
  const hasil = calls.map(function (c) {
    const a = String((c && c.action) || ''), r = ROUTES[a];
    if (!r) return fail_('Aksi tidak dikenal.');
    if (r.write) return fail_('Aksi tulis tidak boleh di dalam batch.');
    const t1 = Date.now(), x = rpc(a, token, (c && c.data) || {}, '');
    if (x) x.ms = Date.now() - t1;
    return x;
  });
  return ok_({ hasil: hasil });
}

// ── Cek kesehatan (dipakai frontend untuk menguji konfigurasi URL & mengukur latensi) ──
function hSysPing_() {
  const siap = !!prop_('SPREADSHEET_ID');
  let c = {}; if (siap) { try { c = cfg_(); } catch (e) { c = {}; } }
  return ok_({ v: APP_VERSION, t: nowIso_(), siap: siap, musim: c.musim || '', fase: c.fase || '' }, siap ? 'Backend siap.' : 'Backend belum disiapkan: jalankan setupAppEnvironment().');
}

// ── Pemanasan cache (trigger tiap 10 menit): halaman publik selalu siap dari cache ──
function pemanasan_() {
  if (!prop_('SPREADSHEET_ID')) return;
  const t0 = Date.now(), aman = function (f) { try { f(); } catch (e) { console.warn('pemanasan: ' + e.message); } };
  aman(function () { hPubBoot_(); });
  aman(function () { hPubKlas_(); });
  aman(function () { hPubKlasTahun_(null, {}); });
  aman(function () { hPubRekor_(); });
  aman(function () { aktifMap_(); });
  console.log('Pemanasan cache selesai ' + (Date.now() - t0) + ' ms');
}
/** Jalankan sekali dari editor bila trigger pemanasan belum ada (setupAppEnvironment juga memasangnya). */
function pasangPemanasan() { pasangTrigger(); Logger.log('✅ Trigger pemanasan (10 menit) & rollover terpasang.'); }
