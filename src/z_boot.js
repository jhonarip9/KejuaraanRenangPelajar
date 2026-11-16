(function () {
'use strict';
const { $, E, S, V, LS, rp, go, home, toast, NAV_APP, isApp, bustCache, shell, API_SIAP, GAS_URL, muatAdmin } = KRP;

/* ===== Boot (frontend statis + API) =====
   1. Tampil instan: data portal (pub.boot) dari salinan lokal terakhir bila ada → layar langsung terisi.
   2. Segarkan di latar (stale-while-revalidate); bila berubah, kerangka & halaman publik diperbarui.
   3. Tautan langsung (#/jadwal, #/profil/ID) dan tombol Back browser berfungsi.
   4. Panitia yang masih login: modul admin diunduh di latar (prefetch) agar menu langsung responsif. */
const KRP_VER = '2.0.0', BOOT_K = 'krp_boot', AMAN_SEGAR = ['home', 'info', 'jadwal', 'klas', 'rekor', 'galeri', 'arsip', 'atlet'];
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
if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { }); });
KRP.resetLokal = resetLokal;
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
