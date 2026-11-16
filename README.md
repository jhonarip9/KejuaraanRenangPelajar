# KRP Pro — Kejuaraan Renang Pelajar (v2.0.0)

Aplikasi web full-stack kejuaraan renang pelajar:
- **Frontend statis di GitHub Pages:** PWA, tampil instan, tahan sinyal HP lemah.
- **Backend Google Apps Script sebagai REST API JSON:** Sheets, Drive, dan Gmail.

## Fitur (semua dari v1.6.7, kini terpisah frontend/backend)

- **Portal publik:**
  - Beranda event, Info Lomba, jadwal & start list.
  - Hasil live dengan jeda adaptif.
  - Klasemen tahunan (mulai dari nol tiap 1 Januari, arsip per tahun) dan klasemen event berjalan.
  - Rekor short course & long course terpisah.
  - Profil atlet dengan riwayat prestasi, galeri, arsip hasil lama.
- **Akun pendaftar** (sekolah / klub / mandiri):
  - Daftar atlet & nomor lomba (kuota, paket biaya, kelompok per event).
  - Klaim prestasi lama, pengajuan perubahan.
- **Panitia:**
  - Event & nomor pertandingan, preset pedoman Short Course Seri II 2026 (+ reset ulang).
  - Tahapan event, verifikasi, pendaftaran manual (Excel), susun acara drag & drop.
  - Input hasil dengan navigasi keyboard.
  - Pengesahan wasit dengan tanda tangan, pengaman kerja bersamaan (versi, jurnal).
  - Buku acara & buku hasil PDF (kop tiap halaman, heat tidak terpisah, hanya nama sekolah), Excel buku acara.
  - Impor hasil lama (25 m/50 m), klaim prestasi.
  - Kurasi Puspresnas, laporan Excel, tutup event & arsip, bersihkan data percobaan.
- **Baru di Pro:**
  - REST API dengan `batch` & idempotensi `reqId`, telemetri `ms`/`v`.
  - Email dikirim di luar kunci, pemanasan cache terjadwal.
  - Modul admin dimuat saat dibutuhkan, SWR boot.
  - Tautan langsung & tombol Back.
  - PWA/offline cangkang.
  - Menu **Sistem & Migrasi**: uji koneksi dan migrasi aman dari app lama.

## Struktur

```text
backend/   → tempel ke proyek Apps Script (Kode, Api, Event, Kurasi, Operasional, Migrasi, appsscript.json)
frontend/  → push ke GitHub (GitHub Pages): index.html, css/, js/, img/, sw.js, manifest.webmanifest
src/       → sumber JavaScript & CSS yang diedit
tools/     → node tools/build.js  (menyusun src/ → frontend/)
```

Langkah lengkap ada di **PANDUAN_INSTALASI.md**: backend, GitHub Pages lewat terminal, pengaturan awal, migrasi & cutover, keamanan, performa, dan troubleshooting.
