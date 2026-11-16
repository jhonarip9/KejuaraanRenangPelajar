(function () {
'use strict';
const { $, $$, E, S, V, ACT, SUBMIT, rp, swr, toast, busy, ph, card, alertx, field, inp, form, ask, kpi, Perf, GAS_URL } = KRP;
const main = h => { $('#main').innerHTML = h; };
const samarUrl = u => { const m = /\/s\/([A-Za-z0-9_-]+)\/exec/.exec(u || ''); return m ? u.replace(m[1], m[1].slice(0, 6) + '…' + m[1].slice(-4)) : (u || '—'); };
const NAMA_T = { TBL_PORTAL_CONFIG: 'Pengaturan portal', TBL_MASTER_JENJANG: 'Kelompok/kelas', TBL_EVENT: 'Event', TBL_MASTER_NOMOR_LOMBA: 'Nomor lomba', TBL_USERS_ROLES: 'Akun panitia', TBL_KONTINGEN: 'Akun pendaftar', TBL_ATLET: 'Atlet', TBL_REGISTRASI_ENTRI: 'Pendaftaran nomor', TBL_MUTASI_ATLET: 'Pengajuan', TBL_HEAT_SEEDS: 'Start list', TBL_RACE_RESULTS: 'Hasil lomba', TBL_WASIT_SIGNOFF: 'Pengesahan wasit', TBL_REKOR_KEJUARAAN: 'Rekor', TBL_EVENT_ARCHIVE_LOG: 'Arsip event', TBL_HASIL_ARSIP: 'Hasil lama (impor)', TBL_DOKUMEN: 'Dokumen', TBL_GALERI: 'Galeri', TBL_AUDIT_LOG: 'Log audit', TBL_HASIL_JURNAL: 'Jurnal hasil' };

/* ===== Sistem & Migrasi (Super Admin) ===== */
V['a-sistem'] = function () {
  swr('migg', 'mig.grup', {}, G => {
    S.migG = G; const p = Perf.rata();
    main(`<div class="k-wrap pad">${ph('Sistem & Migrasi', 'Status koneksi frontend ↔ API Apps Script, dan pemindahan data dari app lama.')}
<div class="g-main"><div>
${card('Pindahkan data dari app lama', `<p class="sm">Spreadsheet app lama <b>hanya dibaca</b>, tidak pernah diubah. Data dicocokkan berdasarkan nama kolom dan ID, jadi aman dijalankan berulang (tidak dobel). Berkas Drive (foto, akta, bukti bayar, logo) tetap terbaca selama app baru dipasang di <b>akun Google yang sama</b>.</p>
<form data-submit="mig" id="mig-f">${field('URL atau ID spreadsheet database app lama', inp('sumber', S.migSrc || '', { req: 1, ph: 'https://docs.google.com/spreadsheets/d/…' }), 1)}
<div class="mig-g">${G.map(g => `<label class="k-check1"><input type="checkbox" name="g_${g.id}"${g.mati ? '' : ' checked'}> ${E(g.label)}</label>`).join('')}</div>
<label class="k-check1"><input type="checkbox" name="timpa"> <span>Perbarui data yang sudah ada bila berbeda di app lama<small class="mut" style="display:block">Untuk sinkron ulang sebelum pindah. Biarkan kosong bila app baru sudah dipakai.</small></span></label>
<div class="k-bar" style="flex-wrap:wrap"><button type="submit" class="k-btn k-outline" data-k="0"><i class="bi bi-search"></i> Pindai (tanpa menulis)</button><button type="button" class="k-btn k-orange" data-act="mig-run"><i class="bi bi-cloud-download"></i> Jalankan migrasi</button></div></form>
<div id="mig-out"></div>`)}
${card('Langkah pindah ke app baru (cutover)', `<ol class="sm" style="margin:0 0 0 18px;line-height:1.8"><li>Pasang app baru (Apps Script + GitHub Pages), login Super Admin.</li><li><b>Pindai</b> → periksa angka → <b>Jalankan migrasi</b>.</li><li>Cek akun, atlet, event, foto, dan pengaturan. Uji masuk dengan 1 akun pendaftar.</li><li>Tepat sebelum pindah: jalankan migrasi <b>sekali lagi</b> (delta) untuk menangkap data baru di app lama.</li><li>Umumkan alamat baru, lalu arsipkan deployment lama (datanya tetap aman).</li></ol><p class="mut sm" style="margin-top:8px">Sesi login tidak ikut pindah: semua pengguna cukup masuk ulang dengan kata sandi yang sama.</p>`)}
</div><div>
${card('Koneksi API', `<div class="k-kpis" id="sys-k">${kpi('Rata-rata total', p ? p.total + ' ms' : '–', 'bi-speedometer')}${kpi('Waktu server', p ? p.server + ' ms' : '–', 'bi-cpu')}${kpi('Jaringan', p ? p.net + ' ms' : '–', 'bi-wifi')}</div>
<p class="sm" style="margin:10px 0 4px">Alamat API: <code>${E(samarUrl(GAS_URL))}</code></p><p class="sm mut" id="sys-v">Versi frontend: ${E((window.KRP_CONFIG || {}).VERSI || '-')}</p>
<div class="k-bar"><button class="k-btn k-navy sm" data-act="sys-ping"><i class="bi bi-activity"></i> Uji koneksi</button></div>
<p class="mut sm" style="margin-top:8px">Diukur dari ${p ? p.n : 0} permintaan terakhir di perangkat ini. Waktu server tinggi → data besar/cache dingin; jaringan tinggi → koneksi pengguna.</p>`)}
${card('Tips performa hari pelaksanaan', `<ul class="sm" style="margin:0 0 0 18px;line-height:1.7"><li>Halaman web dilayani GitHub Pages; hanya data yang memakai kuota Apps Script.</li><li>Cache publik dipanaskan otomatis tiap 10 menit (trigger <code>pemanasan_</code>).</li><li>Atur jeda Hasil Live 45–60 detik di Pengaturan Web saat pengunjung ramai.</li><li>Isi <b>Alamat portal</b> di Pengaturan Web agar tautan di email mengarah ke GitHub Pages.</li></ul>`)}
</div></div></div>`);
  }, 60000);
};
ACT['sys-ping'] = async a => {
  busy(a, true); const t0 = performance.now();
  try { const r = await rp('sys.ping'); const tot = Math.round(performance.now() - t0); $('#sys-v').innerHTML = `Versi frontend: ${E((window.KRP_CONFIG || {}).VERSI || '-')} · backend: <b>${E(r.data.v)}</b> · musim: ${E(r.data.musim)} · tahap: ${E(r.data.fase)}<br>Uji barusan: total <b>${tot} ms</b> (server ${r.ms || 0} ms)`; toast(r.message); }
  catch (e) { toast(e.message, 'err'); }
  busy(a, false);
};
async function migJalan(f, jalankan) {
  const d = form(f), grup = (S.migG || []).filter(g => d['g_' + g.id]).map(g => g.id); S.migSrc = d.sumber;
  if (!String(d.sumber || '').trim()) return toast('Tempel URL spreadsheet app lama.', 'err');
  if (!grup.length) return toast('Pilih minimal satu kelompok data.', 'err');
  if (jalankan && !(await ask('Jalankan migrasi sekarang? Data app lama hanya dibaca. Data di app baru ditambah' + (d.timpa ? ' dan diperbarui' : '') + ' sesuai hasil pindai.', 'Jalankan'))) return;
  const b = jalankan ? $('[data-act=mig-run]', f) : $('button[type=submit]', f); busy(b, true);
  try {
    const r = await rp('mig.run', { sumber: d.sumber, grup, timpa: !!d.timpa, jalankan });
    const x = r.data, L = Object.keys(x.lapor);
    $('#mig-out').innerHTML = `${alertx(x.dryRun ? 'info' : 'ok', `<b>${E(x.sumber.nama)}</b> — ${E(r.message)}${x.appBaru ? '<br><span class="sm">App baru masih kosong: isi bawaan setup (kelompok, nomor, event, pengaturan) diganti data app lama.</span>' : ''}`, x.dryRun ? 'bi-search' : 'bi-check2-circle')}
<div class="k-scroll"><table class="k-table"><thead><tr><th>Data</th><th>Di app lama</th><th>Ditambah</th><th>Diperbarui</th><th>Dilewati</th><th>Catatan</th></tr></thead><tbody>${L.map(t => { const v = x.lapor[t]; return `<tr><td><b>${E(NAMA_T[t] || t)}</b></td><td>${v.sumber}</td><td>${v.tambah}</td><td>${v.ubah}</td><td>${v.lewat}</td><td class="sm mut">${E(v.ket || '')}</td></tr>`; }).join('')}</tbody></table></div>
${x.peringatan.length ? `<div class="k-alert warn"><i class="bi bi-exclamation-triangle"></i><div><b>Perhatian</b><ul style="margin:6px 0 0 16px">${x.peringatan.slice(0, 20).map(w => `<li>${E(w)}</li>`).join('')}</ul></div></div>` : ''}`;
    if (!x.dryRun) { KRP.bustCache(); await S.refreshAll(); }
    toast(r.message);
  } catch (e) { toast(e.message, 'err'); }
  busy(b, false);
}
SUBMIT.mig = f => migJalan(f, false);
ACT['mig-run'] = a => migJalan(a.closest('form'), true);
})();
