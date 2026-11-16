# Panduan Fitur — Kejuaraan Renang Pelajar Pro (v2.0.0)

> Cara memakai fitur aplikasi (panitia, pendaftar, publik). Untuk pemasangan, lihat **PANDUAN_INSTALASI.md**. Semua fitur sama dengan v1.6.7; menu baru di v2.0.0: **Sistem & Migrasi** (Super Admin).

## 1. Pasang
Lihat **PANDUAN_INSTALASI.md**. Ringkasnya:
- Backend (`backend/*.gs`) dipasang di Apps Script dan di-deploy sebagai Web App.
- Frontend (`frontend/`) di-push ke GitHub Pages.
- `js/config.js` diisi URL `/exec`.

## 2. Jenis akun
- **Sekolah, Klub, Pribadi (Mandiri)**: daftar akun sekali. Berkas (surat mandat/SK, foto, akte, surat sekolah atlet) diunggah satu kali dan tersimpan di akun.
- Pendaftaran berikutnya: klik nama atlet, pilih nomor lomba, unggah satu bukti bayar. Tanpa unggah ulang berkas.
- Akun Mandiri hanya boleh mendaftarkan satu atlet, yaitu dirinya sendiri (nama sama dengan nama akun).
- Tidak ada kuota atlet per nomor maupun per akun sekolah/klub. Batas yang tersisa: maksimal nomor per atlet (`max_individu`, bawaan 3, bisa diubah di Pengaturan Web).

## 3. Data atlet
Biodata atlet mencakup **Wilayah Sekolah (Kab/Kota)**, tampil di start list dan buku hasil sebagai "Asal Wilayah".

## 4. Super Admin
- **Akun & Berkas**: data pendaftar dipisah Mandiri, Klub, Sekolah. Tiap akun menampilkan biodata dan berkasnya.
- **Jadwal Acara**: jam tiap nomor dihitung otomatis dari jumlah peserta, jumlah seri (heat), menit per seri menurut jarak, dan jeda. Urutan acara otomatis. Hari, urutan, dan jam bisa diatur manual per nomor yang pendaftarannya dibuka. Reset mengembalikan ke otomatis.
- **Dokumen & Logo**: unggah logo, centang tempatnya: Acara (buku acara), Hasil (buku hasil), Web (tampilan web). Urutan bisa diatur. Kop, tanda tangan, dan sampul diatur di sini.
- **Pengaturan Web**: tautan sosial media, batas daftar, minimal peserta, dan lainnya.
- **Tahapan Event**: PENDAFTARAN > VERIFIKASI > STARTLIST > BUKU_ACARA > PELAKSANAAN > SELESAI.
- **Impor Hasil Lama**, **Laporan & Excel**, **Pengguna**, **Log Audit**, **Tutup Event & Arsip**.

## 5. Buku acara dan buku hasil
Mengikuti contoh Meet Program dan Official Results.
- Kepala: label, judul, subjudul, waktu dan tempat, deretan logo.
- Tiap nomor: pil "EVENT n", judul bergaris bawah, perkiraan waktu.
- Buku acara: LANE, NAMA, KLS, ASAL KLUB/SEKOLAH, ASAL WILAYAH, ENTRY, per HEAT.
- Buku hasil: RANK, NAMA, KLS, ASAL, WILAYAH, WAKTU, KET. Tiga besar disorot. Ada pengesahan Referee (Wasit) dengan tanda tangan.

## 6. Operator dan wasit
- Operator mengisi hasil saat tahap PELAKSANAAN. Draf tersimpan otomatis.
- Wasit mengesahkan per nomor dengan tanda tangan di layar (tablet/ponsel). Tanda tangan kosong ditolak.

## 7. Sosial media di web
Instagram: kejuaraanrenangpelajarbulanan, krp_jabodetabek. YouTube: @renangbulananjakarta, @krpbdkijakarta8319. Dapat diubah di Pengaturan Web.

## 8. Kecepatan (v1.2.1)
Bagian ini sudah diperbarui untuk arsitektur Pro. Lihat **PANDUAN_INSTALASI.md → F. Performa & kuota**.

## 10. Baru di v1.3
- **Ubah nomor lomba peserta**: Super Admin > Akun & Berkas > Detail > tombol "Ubah nomor" di tiap nomor atlet. Gender harus cocok. Beda kelompok hanya bila dicentang "Izinkan beda kelompok". Nomor yang sudah punya hasil lomba tidak bisa dipindah (tarik hasilnya dulu). Jika start list sudah disusun, atlet dikeluarkan dari nomor lama, lalu jalankan ulang Susun Start List. Ada juga tombol hapus nomor.
- **Kata sandi akun**: tombol kunci di Akun & Berkas (pendaftar) dan tombol "Sandi" di Pengguna (panitia). Isi sandi sendiri atau kosongkan agar dibuat otomatis. Sandi lama tidak bisa dilihat karena disimpan terenkripsi (hash), jadi Super Admin menetapkan sandi baru lalu memberikannya ke pemilik akun.
- **Hapus akun**: satu per satu (ikon tempat sampah) atau banyak sekaligus (centang, lalu "Hapus terpilih"), dengan konfirmasi mengetik HAPUS. Atlet, nomor, dan berkasnya ikut terhapus. Atlet yang sudah punya hasil resmi disimpan sebagai arsip agar buku hasil, klasemen, dan rekor tetap utuh. Ada juga tombol nonaktifkan akun tanpa menghapus.
- **Buku Acara & Buku Hasil**: tata letak mengikuti contoh MEET PROGRAM / OFFICIAL RESULTS, tanpa tulisan "DISAHKAN OLEH REFEREE (WASIT)". Tanda tangan wasit tetap tampil di bawah tiap nomor.
- **Unduh buku lengkap**: setiap kali Super Admin membuat Buku Acara atau Buku Hasil (Dokumen & Logo atau Tahapan Event), versi terbaru langsung tersedia di Beranda, Jadwal & Start List, dan Beranda Akun peserta.
- **Arsip**: saat Tutup Event & Arsip tahap 3, buku acara dan buku hasil musim itu dipastikan terbit (dibuat otomatis bila belum ada). Halaman Arsip per musim tetap menyediakan unduhan PDF setelah musim baru dimulai.

## 11. Baru di v1.3.1
- **Estimasi waktu di Buku Acara**: di kanan tiap event tertulis "ESTIMASI 08:00 – 08:06 WIB", dan di baris tiap heat tertulis "± 08:03". Hitungannya dari menu Jadwal Acara (jam mulai, menit per seri, jeda, atau jam manual).
- **Ganti sandi akun**: Super Admin > Akun & Berkas > tombol **Sandi** di tiap baris, atau tombol **Ganti kata sandi** di dalam Detail. Untuk panitia: Pengguna > **Sandi**. Halaman masuk sekarang punya tautan **Lupa kata sandi?** yang mengarahkan peserta menghubungi panitia lewat WhatsApp/email (isi Kontak di Pengaturan Web).
- **Tahan ramai**: cache halaman publik melayani salinan terakhir saat data berubah (hanya satu eksekusi yang membaca Sheets). Script Properties juga dicache. Hasil Live diperbarui sesuai **Jeda pembaruan Hasil Live** (Pengaturan Web, bawaan 30 detik) dengan jeda acak, berhenti saat tab tidak dilihat, dan melambat saat server penuh. Permintaan yang ditolak karena server penuh dicoba ulang otomatis. Tombol Unduh PDF buku memakai tautan langsung Google Drive.

## 12. Kapasitas pengunjung (perkiraan)
Bagian ini sudah diperbarui untuk arsitektur Pro. Lihat **PANDUAN_INSTALASI.md → F. Performa & kuota**.

## 13. Modul Kurasi Puspresnas (v1.4)
Menu **Kurasi Puspresnas** (Super Admin) menyusun berkas pengajuan kurasi ajang talenta ke Pusat Prestasi Nasional. Acuannya: Pedoman Pengelolaan Ajang Talenta Peserta Didik (Puspresnas 2023), daftar 13 dokumen penyelenggara di FAQ Kurasi Prestasi, dan tiga prasyarat Instrumen 1A (juknis, struktur kepanitiaan, kualifikasi juri).

**Terisi otomatis dari aplikasi:** peserta terverifikasi, sebaran kab/kota dan provinsi, kelompok dan jenis kelamin, sekolah, nomor lomba, rasio juara : peserta, daftar juara, klasemen, rekor, persyaratan, biaya, dan jadwal.

**Yang Anda lengkapi (tersimpan otomatis per musim):**
- *Penyelenggara & Ajang*: nama lembaga, legalitas (akta, SK Kemenkumham), alamat, penanda tangan, nomor surat/SK, unggah tanda tangan dan cap, tingkat yang diajukan, tanggal, edisi, frekuensi, dan riwayat penyelenggaraan (bisa diisi dari arsip).
- *Panitia*: Panitia Pengarah (SC) dan Panitia Penyelenggara (OC). Tombol "Tambahkan susunan baku" mengisi jabatan standar, dan uraian tugas jabatan baku terisi otomatis.
- *Juri*: nama, peran, lisensi, nomor lisensi, instansi, asal wilayah, dan rekam jejak.
- *Pendukung*: sumber dana dan pernyataan nirlaba, penghargaan, mitra, tautan publikasi juara, liputan media, album foto (dari menu Dokumentasi), format nomor sertifikat, dan catatan monev.

**Tab Kesiapan** menunjukkan status ke-13 komponen, skor kesiapan, prasyarat Instrumen 1A, tingkat yang terpenuhi data peserta, serta ringkasan aturan kurasi (alur, aspek nilai, predikat bintang, helpdesk).

**Berkas yang diunduh (PDF, juga dalam satu paket ZIP):**
00 Daftar Periksa Kesiapan (internal) · 01 Surat Permohonan Kurasi · 02 Petunjuk Teknis Penyelenggaraan · 03 SK Panitia + uraian tugas · 04 SK Juri + kualifikasi + pakta integritas per juri · 05 Laporan Kepesertaan & Peta Sebaran · 06 SK Penetapan Pemenang + daftar juara + klasemen · 07 Laporan Pelaksanaan (sarpras & foto, pembiayaan, penghargaan, publikasi, liputan media, mitra, keberlanjutan, monev) · 08 Rekap Sertifikat Juara. Tersedia juga data Excel (peserta, pemenang, sebaran, juri) dan **piagam juara bernomor** per 25 lembar.

**Catatan penting:**
- Kurasi diajukan **setelah ajang selesai**, lewat aplikasi Kurasi Prestasi (kurasi-prestasi.kemendikdasmen.go.id) oleh operator pengusul. Modul ini menyiapkan berkas; formulir Instrumen 1A tetap diisi dan diunggah di aplikasi resmi.
- Berkas adalah draf profesional berbasis pedoman. Periksa isi, nomor, dan nama sebelum diunggah. Format resmi Puspresnas dapat berubah.
- Pakta integritas memerlukan meterai dan tanda tangan basah juri. Tanpa gambar tanda tangan pimpinan, cetak lalu tanda tangani dan pindai surat/SK.
- Aplikasi belum mencatat **kecamatan** peserta, sehingga syarat tingkat kabupaten/kota (≥4 kecamatan) tidak dapat dihitung otomatis. Tingkat provinsi (≥4 kab/kota) dan nasional (≥4 provinsi) dihitung otomatis.
- Data kurasi tidak tampil di portal publik.

## 15. Panduan operasional event (v1.5)
Menu **Panduan Event** (Super Admin) menampilkan langkah-langkah berikut. Status tiap langkah (Selesai / Berjalan / Belum) dihitung langsung dari data, lengkap dengan tombol ke menu terkait. Ada dua jalur: **pendaftaran online lewat web** dan **data pendaftar sudah ada (input manual)**.

**A. Persiapan**
1. *Atur identitas event* (Pengaturan Web): nama event, subjudul, tanggal, lokasi, nama musim (berbeda tiap event), kontak, rekening.
2. *Logo, kop & petugas* (Dokumen & Logo, Pengguna): unggah logo, buat akun Admin Input Data dan Wasit.
3. *Nomor lomba & kelompok* (Nomor Lomba): jarak, gaya, putra/putri, kelompok, biaya. Nonaktifkan yang tidak dipakai.
4. *Susunan acara & estimasi jam* (Jadwal Acara): jam mulai, menit per seri, jeda. Urutan/hari/jam bisa diatur manual per nomor.

**B. Pendaftaran — jalur online**
5. Buka pendaftaran dan bagikan tautan. 6. Verifikasi berkas & pembayaran. 7. Tutup pendaftaran (Tahapan Event → Verifikasi).

**B. Pendaftaran — jalur manual (data pendaftar sudah ada)**
5. *Pendaftaran Manual*: unduh templat, salin data lama, unggah, periksa, simpan. Satu atlet boleh satu baris per nomor, atau beberapa nomor dipisah titik koma (`105;107`, entry `00:42.15;NT`). Nomor bisa berupa nomor acara atau nama (`50m Gaya Bebas`). Bila nomornya belum ada, centang "buat nomor otomatis". Entri langsung **terverifikasi & lunas**. Sekolah/klub baru otomatis menjadi akun tanpa sandi (login `MNL00001` dst.); beri sandi di Akun & Berkas bila sekolah ingin masuk. Atlet dan entri yang sama tidak digandakan, jadi impor ulang aman. Peserta susulan bisa ditambah satu per satu di halaman yang sama.
6. Tutup pendaftaran online (Tahapan Event → Verifikasi) agar tidak ada pendaftar ganda.

**C. Menjelang hari H**
8. *Start list*: Tahapan Event → Start List. Seri & lintasan disusun otomatis dari entry time (NT di seri awal).
9. *Buku Acara*: Tahapan Event → Buku Acara. PDF lengkap dengan estimasi jam langsung terbit di web.
10. *Petugas*: uji akun operator & wasit di tablet. Atur jeda Hasil Live 30–60 detik.

**D. Hari H**
11. Tahapan Event → Pelaksanaan. Operator mengisi hasil (draf otomatis), lalu kirim ke wasit. Hasil tampil di Hasil Live.
12. Wasit mengesahkan dengan tanda tangan di layar. Rekor baru tercatat otomatis beserta nama event.

**E. Setelah lomba**
13. Buku Hasil, SK Pemenang, dan sertifikat (Dokumen & Logo).
14. Laporan & Excel serta Kurasi Puspresnas (opsional).
15. Tutup Event & Arsip (4 tahap). Musim baru memakai akun, atlet, dan rekor yang sama.

## 16. Data event lama & rekor (v1.5)
- **Impor Hasil Lama** kini menerima satu berkas Excel berisi **banyak event** sekaligus (kolom `musim`, `event`, `tanggal`, `lokasi`), memeriksa ribuan baris (per 500), menyimpan kelas atlet, nomor acara, dan **peringkat resmi** dari dokumen sumber. Impor ulang mengganti data lama (tidak menggandakan). Ada opsi langsung finalkan & hitung rekor berurutan menurut tanggal.
- **Rekor** mencatat **event tempat rekor dicetak** (nama event, tanggal, lokasi) dan rekor sebelumnya yang dipecahkan. Ini berlaku untuk rekor dari pengesahan wasit maupun dari impor. Halaman Rekor punya filter kelompok, putra/putri, dan pencarian.
- **Kelompok gabungan** event lain (mis. SMP Kelas 7-9) tetap satu daftar hasil di arsip. Untuk rekor, atlet dipisah sesuai kelompok aplikasi berdasarkan kelasnya.
- **Arsip publik** menampilkan nama event, tanggal, lokasi, klasemen, dan seluruh hasil per nomor (urut nomor acara), dengan pencarian nama atlet/sekolah.
- **Data tiga event Jabodetabek 2026** tersedia di berkas `Data_Arsip_KRP_Jabodetabek_2026.xlsx` (3.248 hasil):
  - 23 Mei 2026: 47 nomor, 954 hasil.
  - 8 Agustus 2026: 30 nomor, 1.002 hasil.
  - Series 2, 22 Agustus 2026: 52 nomor, 1.292 hasil.

  Cara memuat: Impor Hasil Lama → Unggah Excel → Periksa → biarkan kedua kotak tercentang → Simpan. Hasilnya **58 rekor** dengan nama event masing-masing.
- Catatan data sumber: Event 21 Series 2 tidak memiliki peringkat 4 di dokumen aslinya (dipertahankan). Satu waktu salah ketik (peringkat 17, Event 26 Series 2, "00;46.31") ditandai "Periksa" dan tidak dipakai untuk rekor. Dokumen 23 Mei tidak mencantumkan kelas, jadi kelompok dipetakan dari huruf A–E (A = SD 1-2 … E = SMP 8-9, terbukti dari atlet yang sama di event Agustus).
- Setelah memperbarui berkas, **jalankan `setupAppEnvironment()` sekali** agar judul kolom baru (kelas, peringkat resmi, event rekor) tertulis di Sheets. Aplikasi juga menambahkannya otomatis saat impor pertama.

## 17. Event & Nomor Pertandingan (v1.6)
Menu Super Admin **Event & Nomor Lomba** punya tiga tab.

**Tab Event**
- Daftar event: nama, tanggal, status (Draf, Akan datang, Berlangsung, Selesai), kuota (terisi / kuota), dan status pendaftaran. Klik label pendaftaran (Dibuka/Ditutup) untuk membuka atau menutup cepat.
- **Tambah event / Ubah**: 7 bagian.
  1. Identitas: nama, kode musim, tingkat (Kab/Kota, Provinsi, Nasional, Internasional), wilayah, penyelenggara.
  2. Waktu & tempat: tanggal, kolam, alamat, kab/kota, tautan peta.
  3. Teknis: kolam 25 m atau 50 m, jumlah lintasan, minimal peserta per nomor, sistem lomba, aturan start, peraturan, waktu NT.
  4. Pendaftaran: waktu buka & tutup (WIB), kuota atlet, nomor per atlet (minimal–maksimal; sama = wajib), jenis akun yang boleh mendaftar, biaya paket per atlet atau per nomor, tanggal buku acara, technical meeting.
  5. Kelompok peserta: centang kelompok dan beri huruf (A–F). Bisa menambah kelompok gabungan (mis. SMP 7–9). Label di web & buku acara: "Kelompok A (SD Kelas 1-2)", "Kelompok A", atau "SD Kelas 1-2".
  6. Pembayaran & kontak: rekening (hanya tampil di akun peserta), konfirmasi pembayaran, kontak panitia, grup WhatsApp, tautan pendaftaran lain.
  7. Ketentuan: persyaratan, ketentuan lomba, biaya, penghargaan, perenang terbaik, protes, kesehatan, lain-lain. Tampil di halaman publik **Info Lomba**.
- Event baru bisa **menyalin** pengaturan dan susunan nomor dari event lain (seri berikutnya).
- **Aktifkan**: satu event aktif di web. Beranda, Info Lomba, jadwal, dan akun peserta beralih ke event itu. Data event lain tetap tersimpan dan bisa diaktifkan lagi.
- Hapus event: hanya event yang tidak aktif. Pendaftaran terkait tidak ikut terhapus. Gunakan status "Selesai" untuk mengarsipkan.

**Tab Nomor pertandingan**
- Pilih event, saring per kelompok, gender, status (Dibuka, Ditutup, Dibatalkan, Peserta < minimal, Kuota penuh).
- **Generator nomor**: centang gaya × jarak per kelompok; tiap centang = nomor putra & putri. Urutan nomor acara "per gaya lalu kelompok" (gaya penomoran KRP) atau "per kelompok".
- **Dibuka** = peserta bisa memilih nomor ini di akunnya. **Ditutup** = tetap dipertandingkan tanpa pendaftar baru. **Dibatalkan** = tidak dipertandingkan (pindahkan pesertanya lewat Akun & Berkas).
- Aksi massal: buka, tutup, batalkan, pulihkan, pindah hari, kuota, hapus. **Rapikan nomor** menomori ulang tanpa celah (sebelum Buku Acara terbit).

**Tab Akun demo**
- Membuat 3 akun uji coba dengan satu kata sandi: Sekolah (`99990001`, 4 atlet SMP 7–9), Klub (`DEMO-KLUB`, 8 atlet kelas 1–6 & 10–11), Mandiri (`demo.mandiri@krp.test`, 1 atlet kelas 4). Masuk lewat tab "Sekolah / Klub / Pribadi".
- Entri akun demo tidak pernah masuk start list, tetapi ikut terhitung kuota. **Hapus akun demo sebelum pendaftaran ditutup.**

**Di akun peserta**
- Beranda akun menampilkan **Nomor lomba dibuka untuk atlet Anda**, per kelompok & gender atlet, beserta aturan (mis. wajib 3 nomor, paket Rp 300.000, batas waktu).
- Saat mendaftar, hanya nomor kelompok & gender atlet yang muncul; nomor ditutup/penuh terlihat tetapi tidak bisa dipilih. Jumlah minimal–maksimal nomor dan kuota dicek di layar dan di server.
- Mode paket: total biaya per atlet = harga paket.

**Halaman publik Info Lomba** (menu atas dan tombol di beranda): fakta event, nomor per kelompok (Putra/Putri, status, sisa kuota), ketentuan lengkap, kontak & grup WhatsApp. Rekening tidak ditampilkan di sini.

**Pengaturan Web** kini hanya untuk tampilan beranda, media sosial, logo, jeda hasil live, dan poin klasemen. Identitas event, pendaftaran, rekening, dan kontak diatur di Event & Nomor Lomba.

**Tutup Event & Arsip** tahap 4 bisa langsung mengaktifkan event berikutnya dari daftar event.

## 18. Event 27–28 November 2026 (pedoman KRP Short Course Series II)
1. Buka **Event & Nomor Lomba** → klik **Pasang event ini** pada kotak pedoman (centang "Langsung aktifkan").
2. Isi yang terpasang: Jumat–Sabtu 27–28 Nov 2026, Kolam Renang Gelanggang Remaja Jakarta Selatan (Jl. Bulungan No. 1 Blok C), kolam 25 m, Kelompok A–F, 136 nomor, wajib 3 nomor, paket Rp 300.000, minimal 5 peserta per nomor, tutup 20 Nov 2026 12.00 WIB, Buku Acara 26 Nov 2026, rekening BCA a.n. Nadila, konfirmasi Nadila 082327874782, grup WhatsApp, tautan bit.ly, serta seluruh ketentuan, penghargaan, perenang terbaik, protes, dan klausul kesehatan.
3. Susunan acara (bisa diubah di tab Nomor atau Jadwal Acara):
   - Hari 1 (#1–68): 200 IM C–F, 50 Bebas A–F, 25 Dada A, 100 Punggung B–F, 50 Kupu A–F, 200 Bebas C–F, 100 Dada B–F, 25 Punggung A, 25 Bebas A, 400 Bebas F.
   - Hari 2 (#69–136): 100 IM A–B, 50 Dada A–F, 100 Bebas B–F, 25 Kupu A, 50 Punggung A–F, 200 Dada D–F, 100 Kupu B–F, 200 Punggung D–F, 200 Kupu D–F.
   - Tiap kelompok: putra lalu putri.
4. Periksa **Penyelenggara** dan **jumlah lintasan** (tidak tercantum di pedoman; diisi 8).
5. Masukkan pendaftar yang sudah ada: menu **Pendaftaran Manual** → unggah ekspor formulir apa adanya, atau isi `Template_Pendaftar_KRP_Short_Course_Series_II_2026.xlsx`. Judul kolom formulir (Nama Peserta, Jenis Kelamin, Kelas/Kelompok, Asal Sekolah, Nomor Lomba 1–3, Waktu Terbaik 1–3, Nama & HP Pendaftar) dikenali otomatis. Kelas boleh angka romawi (VII, X). Atlet kurang dari 3 nomor diberi peringatan.
6. Pendaftar baru tetap bisa lewat web sampai 20 Nov 12.00 WIB. Setelah itu: Tahapan Event → Verifikasi → Start List → Buku Acara.
7. Rekor kolam 25 m dicatat terpisah dari rekor kolam 50 m (halaman Rekor punya filter kolam).

## 19. Beranda portal (v1.6.1)
- Web utama bernama **Kejuaraan Renang Pelajar** (portal). Nama event aktif tampil di kartu event, Info Lomba, dan buku acara/hasil.
- Ubah nama portal, teks kecil di bawahnya, baris emas judul beranda, dan tagline di **Pengaturan Web**.
- Beranda: judul portal, kartu event aktif (status, tanggal, tempat, Detail event), 4 statistik (atlet, sekolah/klub, nomor, medali), hitung mundur ke penutupan pendaftaran (atau ke hari lomba), dan **Kalender musim**.
- Kalender musim berisi event aktif plus event lain yang diumumkan. Di Event & Nomor Lomba, klik ikon megafon pada event yang belum aktif untuk **Umumkan di kalender beranda** (klik lagi untuk menyembunyikan). Event draf tidak tampil.
- Palet baru: biru laut dalam, aqua, oranye koral, dan emas; judul memakai huruf Barlow Condensed.

## 20. Susun acara dinamis (v1.6.2)
Menu **Jadwal Acara** → tab **Susun acara** (tab **Tabel & jam manual** tetap ada untuk jam manual).
- Papan per hari: **seret & lepas** nomor untuk mengubah urutan atau memindah hari. Di HP pakai tombol ↑ ↓ dan pilihan H1/H2.
- Estimasi jam mulai–selesai tiap nomor dan tiap hari dihitung ulang langsung (dari jumlah peserta × seri).
- **Batalkan** nomor yang tidak bisa dilaksanakan (ikon ✕) atau sekaligus **Batalkan semua < 5 peserta** (aktif setelah pendaftaran ditutup). Nomor batal masuk baki "Dibatalkan"; klik **Pulihkan** untuk mengembalikan.
- **Urutkan otomatis** tiap hari: nomor lama, per gaya, per kelompok, atau jarak pendek dulu. **Tambah hari** bila lomba lebih dari 2 hari.
- **Simpan susunan**: centang "Urutkan ulang nomor acara" agar nomor jadi #1, #2, … tanpa celah sesuai susunan. Setelah Buku Acara terbit, urutan masih bisa diubah tetapi nomor acara tidak diganti; terbitkan ulang Buku Acara.
- Nomor yang dibatalkan otomatis tertutup untuk pendaftaran dan hilang dari jadwal, start list, dan Buku Acara. Bila ada pesertanya, aplikasi memberi peringatan: pindahkan peserta lewat Akun & Berkas.

## 21. Rekor short course & long course, klaim prestasi (v1.6.3)
**Rekor terpisah per kolam**
- Rekor kolam 25 m (short course) dan kolam 50 m (long course) selalu dicatat terpisah. Halaman Rekor punya dua tab: *Long course · kolam 50 m* dan *Short course · kolam 25 m*.
- Event di web: jenis kolam diatur di pengaturan event (bagian Teknis).
- Arsip hasil lama: lihat bagian 22.

**Klaim prestasi**
- Akun sekolah, klub, atau mandiri: buka **detail atlet** → kartu **Riwayat prestasi KRP**. Hasil lama yang cocok (nama & jenis kelamin; dicek juga sekolah/klub dan kelas) muncul di bawahnya. Centang lalu **Klaim**.
- Cocok kuat (nama sama + sekolah/klub sama + kelas sesuai tahun ajaran) langsung tercatat. Selain itu menunggu persetujuan panitia.
- Beranda akun menampilkan pemberitahuan bila ada hasil lama yang cocok.
- Panitia (Super Admin & Admin Pendaftaran): menu **Klaim Prestasi** untuk mengesahkan/menolak, dengan tanda kecocokan nama, sekolah/klub, dan kelas.
- Satu hasil hanya bisa dimiliki satu atlet. Prestasi tercatat tampil di biodata atlet dan profil publik (medali ikut dihitung).
- Catatan: impor ulang arsip dengan opsi "ganti" menghapus tautan klaim pada arsip itu.

## 22. Impor hasil lama 25 m dan 50 m dalam satu arsip (v1.6.4)
- Di **Impor Hasil Lama → 1. Siapkan data**, kotak paling atas **Jenis kolam data ini**: pilih *Long course · kolam 50 m* atau *Short course · kolam 25 m* **sebelum** mengunggah/menempel data. Lalu unggah dan klik **Periksa data**; hasil periksa menampilkan kolamnya.
- Bila lupa memilih, pilihan kolam muncul lagi (wajib) di formulir simpan setelah Periksa data.
- Alternatif: templat Excel kini punya kolom `kolam` (isi `50` atau `25`). Bila kolom itu terisi, isinya yang dipakai, jadi satu berkas bisa memuat kedua kolam. Berkas lama tanpa kolom ini tetap bisa dipakai.
- Urutan untuk dua berkas: pilih 50 m → unggah berkas long course → Simpan; lalu pilih 25 m → unggah berkas short course → Simpan.
- Data 25 m dan 50 m disimpan, diperingkat, dan dicatat rekornya **terpisah**, walaupun nama arsip (musim) sama.
- Opsi **Ganti data lama** hanya mengganti data dengan nama arsip **dan** kolam yang sama. Impor 50 m lalu impor 25 m → keduanya tetap ada.
- Daftar **Arsip tersimpan** menampilkan bagian per kolam (mis. "Kolam 50 m · 1292 baris") dengan tombol **jadi 25 m / jadi 50 m** (bila salah pilih) dan tombol hapus untuk kolam itu saja.
- Halaman Arsip publik punya tab **Semua kolam / Long course · 50 m / Short course · 25 m**, dan setiap nomor diberi label kolamnya.
- **Nama arsip = identitas arsip.** Data dengan nama arsip (kolom `musim` atau isian "Nama arsip") yang sama dianggap event yang sama. Mulai versi ini, bila nama itu sudah dipakai event lain (nama event/tanggal berbeda, atau tidak bisa dibandingkan), hasil periksa memberi peringatan dan mengusulkan nama baru di kolom **Disimpan ke arsip**. Ubah nama itu sesuai keinginan. Untuk tetap menggabungkan, ketik nama lama dan centang **Gabungkan ke arsip yang sudah ada**.
- Impor 50 m dan 25 m dari event yang **sama** (nama event/tanggal sama) tetap masuk ke satu arsip tanpa peringatan.
- Menghapus seluruh arsip kini juga menghapus info event lamanya, jadi nama arsip bisa dipakai ulang dengan judul event baru.
- **Rekor dari arsip selalu dihitung ulang dari data arsip saat ini** setiap kali arsip difinalkan, dihapus, atau dipindah kolam. Rekor dari arsip yang sudah dihapus tidak tertinggal lagi. Tombol **Hitung ulang rekor dari arsip** (di bawah daftar Arsip tersimpan) melakukan hal yang sama secara manual.
- Arsip lama yang tergabung atau tertimpa sebelum versi ini: hapus arsipnya, lalu impor ulang dua kali (sekali pilih 50 m, sekali pilih 25 m), lalu **Finalkan**.

## 23. Hari pelaksanaan: input cepat, buku, kerja bersamaan, pengunjung ramai (v1.6.5)
**Input hasil dengan keyboard** (menu Input Hasil)
- Ketik waktu lalu **Enter** atau **↓** → pindah ke atlet berikutnya (kolom yang sama, lintas seri). **↑** ke atlet sebelumnya. **Shift+Enter** juga naik.
- **→ / ←** pindah antar kolom Status · Waktu · Keterangan. Di kotak waktu yang berisi teks, panah kanan/kiri berpindah kolom saat kursor di ujung (atau isi sedang terpilih).
- Isian yang nonaktif (mis. waktu saat status DQ) otomatis dilewati. Isi kotak terpilih saat dimasuki, jadi langsung ketik untuk mengganti.
- Status diganti dengan mengetik huruf: O = OK, D = DQ/DNS/DNF (tekan berulang).

**Kop buku acara & buku hasil di setiap halaman**
- Buku dipecah per halaman oleh sistem; setiap halaman diawali kop (judul kejuaraan, waktu, tempat, logo).
- Nomor yang terpotong ke halaman berikutnya diberi judul "(LANJUTAN)", judul kolom, dan judul heat "(lanjutan)".
- Di **Dokumen & Logo → Judul buku**, pilihan **Isi per halaman**: Normal (bawaan), Rapat, atau Longgar. Pilih **Longgar** bila ada halaman PDF tanpa kop (tanda halaman terlalu penuh). Buat ulang PDF setelah mengubah.

**Kerja bersamaan (Admin Input Data, Super Admin, Wasit)**
- Setiap nomor punya *versi*. Simpan draf, Kirim ke Wasit, Tarik, dan Sahkan hanya berhasil bila data di layar masih versi terbaru. Bila orang lain sudah mengubah lebih dulu, muncul dialog **Data bentrok** berisi siapa dan jam berapa. Tidak ada data yang tertimpa diam-diam.
- Pilihan di dialog: **Muat data terbaru** (isian Anda disimpan sebagai cadangan; tombol **Pulihkan isian saya** muncul di atas tabel) atau **Timpa dengan isian saya** (hanya bila status masih draf).
- Layar Input Hasil dan Pengesahan memeriksa perubahan tiap 20 detik. Admin mendapat peringatan; layar wasit otomatis menampilkan hasil terbaru bila berubah sebelum ditandatangani, sehingga yang disahkan selalu sama dengan yang dilihat wasit.
- Hasil yang sudah **dikirim ke wasit** tidak bisa ditimpa dari layar lain; tarik dulu bila perlu perbaikan.
- Kirim/sahkan yang terulang karena koneksi putus tidak dihitung dobel dan tidak dianggap bentrok.
- Setiap simpan/kirim/tarik/sah dicatat di sheet **TBL_HASIL_JURNAL** (hanya ditambah, tidak pernah ditimpa) untuk pemulihan bila perlu.
- Penulisan ulang tabel kini menulis data baru dulu baru membersihkan sisa, sehingga sheet tidak pernah kosong walau eksekusi terhenti.
- Saran operasional: satu nomor diisi oleh satu Admin Input Data (bagi per hari/sesi atau per nomor ganjil/genap); wasit cukup satu perangkat per meja; gunakan Wi-Fi/hotspot khusus panitia, terpisah dari penonton.

**Pengunjung ramai (mis. 3.000 orang)**
- Apps Script membatasi **30 eksekusi bersamaan per akun pemilik**. Semua pengunjung web publik dilayani akun pemilik, jadi yang menentukan adalah jumlah permintaan per detik, bukan jumlah orang.
- Hasil Live sudah hemat: data diambil dari cache (bukan Sheets), jeda pembaruan diatur panitia (bawaan 30 dtk) ±20% acak, berhenti saat tab tidak dilihat, dan otomatis melambat saat server sibuk/gagal.
- Baru: server mengukur kepadatan pengunjung per menit dan menyuruh browser memperlambat pembaruan (60/90/120 dtk) saat ramai.
- Disarankan pada hari H: atur **Jeda pembaruan Hasil Live** ke 45–60 detik; terbitkan PDF hasil per sesi; tampilkan hasil di layar venue dari satu perangkat; minta penonton tidak memuat ulang halaman berulang-ulang.

## 24. Klasemen tahunan, bersihkan data percobaan, Excel buku acara (v1.6.6)
**Klasemen tahunan**
- Halaman **Klasemen** kini default menampilkan **Klasemen Medali [tahun]**: akumulasi medali semua event KRP yang tanggalnya di tahun itu (event di web yang hasilnya sudah disahkan + arsip hasil lama yang sudah difinalkan).
- Setiap 1 Januari klasemen otomatis mulai dari nol (dihitung menurut tanggal event, tanpa perlu tombol).
- Tahun sebelumnya tetap bisa dibuka lewat pilihan **Tahun** (ditandai "arsip").
- Di atas tabel tampil daftar event yang dihitung. Tab **Event berjalan** tetap menampilkan klasemen event yang sedang aktif seperti sebelumnya.
- Tahun event diambil dari tanggal mulai event (Event & Nomor Lomba) atau tanggal arsip impor. Pastikan tanggalnya benar.

**Bersihkan data percobaan** (Event & Nomor Lomba → tombol *Bersihkan data percobaan*, khusus Super Admin)
- Centang event yang datanya dihapus. Terhapus: pendaftaran nomor, start list, hasil, pengesahan wasit, jurnal hasil, dokumen, dan rekor dari hasil event tersebut (rekor kembali ke pemegang sebelumnya).
- Opsi **Hapus juga event & nomornya**. Event yang sedang aktif tidak dihapus, tetapi dikosongkan dan kembali ke tahap Pendaftaran dengan pendaftaran ditutup. Ubah datanya atau buat event baru lalu aktifkan; setelah itu event lama bisa dihapus.
- Opsi akun peserta: jangan hapus / hapus akun uji coba (DEMO-…) / hapus SEMUA akun peserta & atlet.
- Arsip hasil lama (Impor Hasil Lama) dan akun panitia tidak disentuh.
- Wajib mengetik HAPUS. Sebelum menghapus, sistem membuat **salinan spreadsheet** di Drive (folder dokumen) sebagai cadangan.

**Excel buku acara**
- Tombol **Excel buku acara** ada di halaman **Input Hasil** (Admin Input Data & Super Admin) dan di **Dokumen & Logo**.
- Isi: sheet *Semua*, sheet per hari (bila lebih dari 1 hari), dan sheet *Daftar Nomor*. Kolom: hari, estimasi jam heat, no. acara, nomor, kelompok, gender, heat, lane, BIB, nama, kelas, asal, wilayah, entry, serta kolom kosong **Waktu / Status / Keterangan** untuk pencatatan cadangan.
- Selalu dibuat dari start list terbaru; unduh ulang bila start list berubah.

## 25. Tata letak buku & reset event pedoman (v1.6.7)
**Buku acara & buku hasil**
- Halaman A4 diisi sepenuh mungkin (margin 12 mm × 10 mm). Kop tetap di setiap halaman.
- **Satu heat tidak pernah terpisah halaman**: bila heat berikutnya tidak muat, heat itu pindah utuh ke halaman berikutnya (sisa ruang paling banyak setinggi satu heat). Judul nomor tidak pernah tertinggal sendirian di bawah halaman.
- Buku hasil: baris terakhir selalu satu halaman dengan kotak tanda tangan wasit; nomor yang berlanjut diberi "(LANJUTAN)".
- Kolom asal hanya **ASAL SEKOLAH** (nama klub tetap tersimpan di database, tidak dicetak). Halaman klasemen di buku hasil hanya klasemen sekolah. Excel buku acara juga hanya memuat sekolah.
- Jarak antarbaris sedang (± 5,8 mm per baris). Pengaturan **Isi per halaman** tetap ada: Rapat / Normal / Longgar.

**Reset ulang event Short Course Seri II 2026**
- Menu **Event & Nomor Lomba** → ikon ⟳ pada baris event tersebut → pilih nasib akun peserta → ketik RESET.
- Hasil: pengaturan event + 136 nomor dipasang ulang persis dari pedoman; pendaftaran nomor, start list, susunan acara, hasil, pengesahan, dan dokumen event ini dihapus. Bila event ini aktif, langsung aktif lagi di tahap Pendaftaran dengan pendaftaran dibuka (tutup 20 Nov 2026 12.00 WIB).
- Salinan spreadsheet dibuat otomatis di Drive sebelum reset.
- Alternatif dari editor Apps Script: jalankan fungsi `resetEventSeriII()` (akun peserta tidak dihapus).

## 14. Batasan
- Uji v1.6 dilakukan di simulasi Apps Script (backend 71 cek, tampilan 46 cek, seluruh uji lama lulus), belum di Apps Script sungguhan.
- Hanya nomor perorangan (tanpa estafet), tanpa QR, notifikasi hanya lewat email. Tautan WhatsApp dibuka manual oleh admin.
- Jam hanya perkiraan. Atur menit per seri di Jadwal Acara.
- Mengikuti kuota Apps Script (email harian, waktu eksekusi). Berkas maksimal 5 MB.
- Belum diuji pada Sheets, Drive, dan Gmail sungguhan. Uji dengan data contoh sebelum dipakai.
