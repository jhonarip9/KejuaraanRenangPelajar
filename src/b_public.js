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
  main(`<div class="k-wrap pad">${ph('Jadwal & Start List', `${E(B.cfg.tanggal_teks)} · ${E(B.cfg.lokasi)}`)}${KRP.bukuBox(B.dok)}<br>${any ? alertx('info', 'Jam adalah <b>estimasi otomatis</b> dari jumlah peserta dan seri, dan dapat berubah mengikuti kelancaran lomba.', 'bi-clock') : ''}
${Object.keys(byDay).sort((a, b) => a - b).map(h => card(dayLabel(h), `<div class="k-scroll"><table class="k-table"><thead><tr><th>No</th><th>Estimasi</th><th>Nomor</th><th>Kelompok</th><th>Seri</th><th></th></tr></thead><tbody>${byDay[h].sort((a, b) => (a.jam || '99') < (b.jam || '99') ? -1 : (a.jam || '99') > (b.jam || '99') ? 1 : a.no - b.no).map(e => { const s = B.st[e.id] || { h: 0, a: 0, s: 'NONE' }; return `<tr><td class="mono">#${e.no}</td><td class="mono">${e.jam ? E(e.jam) + (e.jamS ? '–' + E(e.jamS) : '') : '—'}</td><td><b>${E(e.nama)}</b></td><td>${E(jn(e.jk))} ${G_L[e.g]}</td><td>${s.h || '—'}</td><td style="text-align:right">${s.a ? `<button class="k-btn sm k-outline" data-go="startlist" data-p="${e.id}">Start list</button> <button class="k-btn sm k-navy" data-go="live" data-p="${e.id}">${s.s === 'SAH' ? 'Hasil' : 'Live'}</button>` : '<span class="mut sm">Belum tersedia</span>'}</td></tr>`; }).join('')}</tbody></table></div>`, '', true)).join('') || empty('bi-calendar-x', 'Belum ada nomor lomba.')}</div>`);
};
V.startlist = function (id) {
  const B = S.B; id = id || (B.events.filter(e => B.st[e.id] && B.st[e.id].a > 0)[0] || B.events[0] || {}).id;
  if (!id) return main(`<div class="k-wrap pad">${empty('bi-list-ol', 'Belum ada nomor lomba.')}</div>`);
  swr('sl_' + id, 'pub.start', { id }, d => {
    const e = d.event;
    main(`<div class="k-wrap pad">${evPicker('startlist', id, true)}<div class="k-evh"><div><span class="tag">EVENT ${e.no}${e.jam ? ' · ' + E(e.jam) + ' WIB (estimasi)' : ''}</span><h2>${E(evTitle(e))}</h2><p>${d.heats.length} seri · ${d.lanes} lintasan</p></div>${d.rec ? `<div class="rec"><small>Rekor kejuaraan</small><b class="mono">${E(d.rec.waktu)}</b><small>${E(d.rec.nama)}</small></div>` : ''}</div>
${d.heats.length ? d.heats.map(h => card(`Seri ${h.n} dari ${d.heats.length}`, `<div class="k-scroll"><table class="k-table"><thead><tr><th>Lane</th><th>Nama Atlet</th><th>Kls</th><th>Asal Klub / Sekolah</th><th>Asal Wilayah</th><th>Entry</th></tr></thead><tbody>${h.rows.map(r => `<tr><td class="mono"><b>${r.lane}</b></td><td><a href="#" data-go="profil" data-p="${r.id}"><b>${E(r.nama)}</b></a></td><td>${kls(r.kls)}</td><td>${E([r.sk, r.kl].filter(Boolean).join(' / '))}</td><td>${E(r.wl || '')}</td><td class="mono">${E(r.seed)}</td></tr>`).join('')}</tbody></table></div>`, '', true)).join('') : empty('bi-hourglass', 'Start list belum tersedia untuk nomor ini.')}
<div class="k-bar"><button class="k-btn k-navy" data-go="live" data-p="${id}">Lihat hasil nomor ini</button></div></div>`);
  }, 30000);
};
const liveDetik = () => Math.max(15, Math.min(300, Number(cfgv('live_detik')) || 30));
ACT['live-now'] = a => { busy(a, true); Promise.resolve(S.liveNow && S.liveNow()).then(() => busy(a, false)); };
V.live = function (id) {
  const B = S.B; id = id || (B.events.filter(e => B.st[e.id] && B.st[e.id].s !== 'NONE')[0] || B.events.filter(e => B.st[e.id] && B.st[e.id].a > 0)[0] || B.events[0] || {}).id;
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
  const tarik = () => rp('pub.live', { id }).then(x => { gagal = 0; jedaSrv = Number(x.data && x.data.jeda) || 0; if (S.route === 'live' && S.param === id) draw(x.data); }).catch(() => { gagal = Math.min(gagal + 1, 3); });
  const jadwal = () => { const ms = Math.max(liveDetik(), jedaSrv) * 1000 * Math.pow(2, gagal) * (0.8 + Math.random() * 0.4); S.timers.push(setTimeout(() => { if (S.route !== 'live' || S.param !== id) return; if (document.hidden) return jadwal(); tarik().then(jadwal); }, ms)); };
  S.liveNow = () => tarik();
  rp('pub.live', { id }).then(r => { jedaSrv = Number(r.data && r.data.jeda) || 0; if (S.route === 'live') { draw(r.data); jadwal(); } }).catch(e => KRP.errView(e.message, () => go('live', id)));
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
  swr('pf_' + id, 'pub.profil', { id }, d => main(`<div class="k-wrap pad"><button class="k-btn k-ghostw sm" data-go="atlet"><i class="bi bi-arrow-left"></i> Direktori</button><br><br><div class="k-card pfh"><div class="k-card-b">${d.f ? `<img class="k-av xl" src="${thumb(d.f, 300)}" alt="">` : `<span class="k-av ph xl">${E(initials(d.nama))}</span>`}<div style="flex:1"><span class="bib mono">${E(d.bib)}</span><h1>${E(d.nama)}</h1><p class="mut">${E(d.sk || '')}${d.kl ? ' · ' + E(d.kl) : ''} · ${E(jn(d.jk))} · ${G_L[d.g]}</p></div><div class="mm big"><div><span class="md g">${d.med.e}</span><small>Emas</small></div><div><span class="md s">${d.med.p}</span><small>Perak</small></div><div><span class="md b">${d.med.b}</span><small>Perunggu</small></div></div></div></div>
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
    main(`<div class="k-wrap pad"><button class="k-btn k-ghostw sm" data-go="arsip"><i class="bi bi-arrow-left"></i> Semua arsip</button>${ph(E(m.event || ('Arsip Musim ' + d.musim)), [m.tglTeks, m.lokasi].filter(Boolean).map(E).join(' · ') || (d.sumber === 'IMPOR' ? 'Data hasil kejuaraan yang telah dilaksanakan (diinput panitia)' : 'Hasil resmi musim tersebut'))}
${(d.dok || []).length ? card('Buku Acara & Buku Hasil', KRP.bukuBox(d.dok)) : ''}
<div class="k-kpis">${kpi('Nomor lomba', d.nomor.length, 'bi-list-ol')}${kpi('Hasil tercatat', d.nomor.reduce((s, n) => s + n.rows.length, 0), 'bi-stopwatch')}${kpi('Atlet', new Set([].concat(...d.nomor.map(n => n.rows.map(r => r.nama + '|' + r.sk)))).size, 'bi-people')}${kpi('Juara umum', E((d.klas.sekolah[0] || {}).nama || '–'), 'bi-trophy')}</div>
<div class="g2">${kt('Klasemen Sekolah', d.klas.sekolah, 'Sekolah')}${kt('Klasemen Klub', d.klas.klub, 'Klub')}</div>
${new Set(d.nomor.map(n => n.kol)).size > 1 ? `<div class="k-seg ars-kol">${[['', 'Semua kolam'], ['LCM', 'Long course · 50 m'], ['SCM', 'Short course · 25 m']].map(x => `<button class="${!x[0] ? 'on' : ''}" data-act="ars-kol" data-v="${x[0]}">${x[1]} <small>(${d.nomor.filter(n => !x[0] || n.kol === x[0]).length})</small></button>`).join('')}</div>` : ''}<input class="k-in" data-in="ars-q" placeholder="Cari nama atlet atau sekolah di arsip ini…" style="margin:6px 0 14px"><div id="ars-list">${d.nomor.map(n => `<div class="ars-n" data-kol="${E(n.kol || '')}" data-s="${E([].concat(n.rows.map(r => r.nama + ' ' + r.sk + ' ' + r.kl)).join(' ').toLowerCase())}">${card(`${n.no ? '#' + n.no + ' · ' : ''}${E(n.event)} · ${G_L[n.g] || n.g} · ${E(jnK(n.jk))}${n.kol ? ` <span class="rk-ctb">${n.kol === 'SCM' ? '25 m' : '50 m'}</span>` : ''}`, `<div class="k-scroll"><table class="k-table">${thd}<tbody>${n.rows.slice(0, 8).map(baris).join('')}</tbody></table></div>${n.rows.length > 8 ? `<details class="ars-more"><summary>Lihat semua ${n.rows.length} hasil</summary><div class="k-scroll"><table class="k-table">${thd}<tbody>${n.rows.slice(8).map(baris).join('')}</tbody></table></div></details>` : ''}`, '', true)}</div>`).join('')}</div></div>`);
  }, 60000);
  swr('klas', 'pub.klas', {}, d => main(`<div class="k-wrap pad">${ph('Arsip Kejuaraan', 'Hasil, klasemen, dan rekor dari event yang telah dilaksanakan')}${d.arsip.length ? `<div class="g3">${d.arsip.slice().reverse().map(a => `<a class="k-tile" href="#" data-go="arsip" data-p="${E(a.musim)}"><span class="ti"><i class="bi bi-archive"></i></span><b>${E(a.event || ('Musim ' + a.musim))}</b><p class="mut sm">${a.tglTeks ? E(a.tglTeks) + '<br>' : ''}${a.atlet} atlet · ${a.kontingen} sekolah/klub${a.juara ? '<br>Juara umum: ' + E(a.juara) : ''}</p></a>`).join('')}</div>` : empty('bi-archive', 'Belum ada arsip.')}</div>`), 60000);
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
})();
