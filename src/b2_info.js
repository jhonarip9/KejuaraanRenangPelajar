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
})();
