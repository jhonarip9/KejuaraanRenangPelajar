/* KRP Pro — Service worker: cangkang aplikasi cepat & tetap tampil saat sinyal hilang.
   - Berkas aplikasi (HTML/CSS/JS/ikon) : network-first (selalu versi terbaru), cadangan dari cache bila offline/lambat.
   - Font & ikon CDN                     : cache-first.
   - Permintaan API Apps Script          : TIDAK pernah disentuh (selalu langsung ke server). */
const VERSI = '2.0.0', CACHE = 'krp-shell-' + VERSI;
const SHELL = ['./', 'index.html', 'css/style.css?v=' + VERSI, 'js/config.js?v=' + VERSI, 'js/app.js?v=' + VERSI, 'manifest.webmanifest', 'img/icon.svg', 'img/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => { })); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.indexOf('krp-') === 0 && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || /script\.google(usercontent)?\.com$/.test(u.hostname)) return; // API: tidak di-cache
  if (u.origin === location.origin) {
    e.respondWith(Promise.race([fetch(r).then(res => { if (res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; }), new Promise((_, rej) => setTimeout(rej, 4000))])
      .catch(() => caches.match(r, { ignoreSearch: false }).then(x => x || caches.match(r, { ignoreSearch: true })).then(x => x || (r.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$|cdn\.jsdelivr\.net$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(x => x || fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open(CACHE + '-cdn').then(c => c.put(r, cp)); } return res; })));
  }
});
