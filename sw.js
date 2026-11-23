/* KRP Pro — Service worker: aplikasi terbuka seketika & tetap tampil saat sinyal hilang.
   - Aset bersidik (app.js/admin.js/style.css?v=<versi>-<sidik>) : cache-first. Sidik berubah setiap kode berubah,
     jadi berkas lama tidak pernah tertukar dengan yang baru.
   - index.html & config.js : salinan tersimpan langsung dipakai, sambil versi terbaru diambil di latar. Bila
     index.html berubah (ada versi baru), halaman diberi tahu untuk menawarkan "Muat ulang".
   - Font & ikon CDN : cache-first.
   - Permintaan API Apps Script : TIDAK pernah disentuh (selalu langsung ke server). */
const VERSI = '2.1.0-f2881329', CACHE = 'krp-shell-' + VERSI;
const SHELL = ['index.html', 'css/style.css?v=' + VERSI, 'js/config.js?v=2.1.0', 'js/app.js?v=' + VERSI, 'manifest.webmanifest', 'img/icon.svg', 'img/icon-192.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).catch(() => { })); self.skipWaiting(); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.indexOf('krp-') === 0 && k !== CACHE && k !== 'krp-cdn' && k !== TANDA).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
const simpan = (r, res) => { if (res && res.ok) { const cp = res.clone(); caches.open(CACHE).then(c => c.put(r, cp)); } return res; };
// Tanda "ada versi baru" disimpan di cache (service worker bisa dimatikan browser kapan saja), lalu halaman diberi tahu.
const TANDA = 'krp-meta', TANDA_K = 'versi-baru';
async function kabari() { const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true }); cs.forEach(c => c.postMessage({ krp: 'versi-baru' })); }
async function tandai(ada) { const c = await caches.open(TANDA); if (ada) { await c.put(TANDA_K, new Response('1')); setTimeout(kabari, 1500); } else await c.delete(TANDA_K); }
self.addEventListener('message', e => { if (e.data && e.data.krp === 'tanya') e.waitUntil(caches.open(TANDA).then(c => c.match(TANDA_K)).then(x => { if (x && e.source) e.source.postMessage({ krp: 'versi-baru' }); })); });
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || /script\.google(usercontent)?\.com$/.test(u.hostname)) return; // API: tidak di-cache
  if (u.origin === location.origin) {
    if (/\.(js|css)$/.test(u.pathname) && /[?&]v=[\w.]+-[a-f0-9]{8}/.test(u.search)) { // aset bersidik: kekal
      e.respondWith(caches.match(r).then(x => x || fetch(r).then(res => simpan(r, res))));
      return;
    }
    if (/config\.js$/.test(u.pathname)) { // alamat API: selalu versi terbaru (cadangan dari cache bila offline)
      e.respondWith(Promise.race([fetch(r).then(res => simpan(r, res)), new Promise((_, rej) => setTimeout(rej, 3500))]).catch(() => caches.match(r, { ignoreSearch: true }).then(x => x || Response.error())));
      return;
    }
    const navigasi = r.mode === 'navigate' || /\/(index\.html)?$/.test(u.pathname), kunci = navigasi ? new URL('index.html', self.registration.scope).href : r;
    e.respondWith(caches.match(kunci).then(lama => {
      const salinan = navigasi && lama ? lama.clone() : null; // disalin sebelum isi 'lama' dibaca browser
      const baru = fetch(r).then(async res => {
        if (salinan && res.ok) { try { const [x, y] = await Promise.all([salinan.text(), res.clone().text()]); await tandai(x !== y); } catch (z) { } }
        return simpan(kunci, res);
      });
      if (lama) { e.waitUntil(baru.catch(() => { })); return lama; } // tampil dari cache, segarkan di latar
      return baru.catch(() => navigasi ? caches.match(kunci) : Response.error());
    }));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com$|cdn\.jsdelivr\.net$/.test(u.hostname)) {
    e.respondWith(caches.match(r).then(x => x || fetch(r).then(res => { if (res.ok || res.type === 'opaque') { const cp = res.clone(); caches.open('krp-cdn').then(c => c.put(r, cp)); } return res; })));
  }
});
