# KRP Pro — Panduan Instalasi, Deploy & Migrasi

**Kejuaraan Renang Pelajar Pro v2.0.0**: semua fitur v1.6.7 dengan arsitektur baru.

- **Frontend statis di GitHub Pages:** cepat, bisa dibuka ribuan orang, dan bisa dipasang sebagai aplikasi (PWA).
- **Backend Google Apps Script sebagai REST API JSON murni:** Google Sheets sebagai database, Drive untuk berkas, Gmail untuk notifikasi.

```text
┌──────────────────────────────┐      fetch POST (text/plain, JSON)       ┌──────────────────────────────┐
│ FRONTEND — GitHub Pages      │ ───────────────────────────────────────▶ │ BACKEND — Apps Script /exec  │
│ index.html · css/ · js/      │ ◀─────────────────────────────────────── │ doPost/doGet → rpc() → JSON  │
│ app.js (publik + pendaftar)  │        { success, data, ms, v }          │ Sheets · Drive · Gmail       │
│ admin.js (dimuat saat perlu) │                                          │ CacheService · LockService   │
│ sw.js (PWA, cangkang)        │                                          │ Script Properties (rahasia)  │
└──────────────────────────────┘                                          └──────────────────────────────┘
```

## Isi paket

| Folder | Isi | Ke mana |
|---|---|---|
| `backend/` | `Kode.gs`, `Api.gs`, `Event.gs`, `Kurasi.gs`, `Operasional.gs`, `Migrasi.gs`, `appsscript.json` | Proyek Apps Script |
| `frontend/` | `index.html`, `css/style.css`, `js/config.js`, `js/app.js`, `js/admin.js`, `sw.js`, `manifest.webmanifest`, `img/`, `.nojekyll` | Repositori GitHub (GitHub Pages) |
| `src/` | Sumber JavaScript yang bisa diedit | Tetap di komputer Anda, tidak di-deploy |
| `tools/build.js` | Penyusun `src/` menjadi `frontend/js/*.js` | Dijalankan dengan `node tools/build.js` |

> Hanya isi folder `frontend/` yang naik ke GitHub. Jangan menaruh berkas `.gs` di repositori.

---

## A. Backend — Google Apps Script

1. Masuk dengan **akun Google pemilik app lama** (wajib bila akan memindahkan data, supaya foto, akta, bukti bayar, dan logo di Drive tetap terbaca).
2. Buka <https://script.google.com>, lalu **New project**. Beri nama, misalnya `KRP Pro API`.
3. Buat 6 file skrip, lalu salin isinya dari folder `backend/`:
   - `Kode.gs`: ganti isi file `Code.gs` bawaan, lalu ubah namanya menjadi `Kode`.
   - Lima file lain lewat tombol **+ → Script**: `Api`, `Event`, `Kurasi`, `Operasional`, `Migrasi`.
4. Atur manifest:
   - Buka **⚙️ Project Settings** dan centang **Show "appsscript.json" manifest file in editor**.
   - Kembali ke editor, buka `appsscript.json`, lalu ganti isinya dengan `backend/appsscript.json`.
5. Jalankan setup:
   - Pilih fungsi **`setupAppEnvironment`**, klik **Run**, lalu izinkan akses (*Review permissions → Advanced → Go to … (unsafe) → Allow*).
   - Buka **Execution log** dan **catat sekarang** (hanya tampil sekali):
     - Email & kata sandi **SUPER ADMIN**.
     - **Akses darurat**: nama pengguna `darurat` dan kata sandinya.
   - Setup membuat folder Drive, spreadsheet database, rahasia sesi, trigger rollover kelas, dan trigger **pemanasan cache tiap 10 menit**.
   - Setup aman dijalankan ulang: data dan rahasia yang sudah ada tidak ditimpa.
6. Deploy sebagai Web App:
   - Buka **Deploy → New deployment → ⚙️ Select type: Web app**.
   - *Execute as*: **Me**. *Who has access*: **Anyone**.
   - Klik **Deploy**, lalu **salin URL yang berakhiran `/exec`**.
7. Uji URL itu di browser. Yang benar: muncul teks JSON berisi `"API Kejuaraan Renang Pelajar aktif."`.

**Memperbarui kode backend nanti:** ganti isi file, lalu buka **Deploy → Manage deployments → ✏️ Edit → Version: New version → Deploy**. URL `/exec` tetap sama, jadi frontend tidak perlu diubah.

---

## B. Frontend — GitHub Pages (lewat Terminal)

> Jangan memakai tombol "Upload files" di web GitHub. Cara itu meratakan folder (`css/` dan `js/` hilang), sehingga tampilan rusak (CSS/JS 404).

**Persiapan**
1. Buka `frontend/js/config.js` dan ganti `GAS_URL` dengan URL `/exec` dari langkah A6. Ini satu-satunya nilai yang diisi manual dan bukan rahasia. Jangan menaruh token atau kata sandi di sini.
2. Pastikan Git terpasang: `git --version`. Kalau belum ada, unduh dari <https://git-scm.com/download/win> (Windows) atau `sudo apt install git` (Linux).
3. Buat repositori di GitHub (**+ → New repository**):
   - Nama, misalnya `krp`.
   - Pilih **Public**.
   - **Jangan** centang README, `.gitignore`, atau lisensi.
4. Atur identitas Git (cukup sekali per komputer):
   ```bash
   git config --global user.name "Nama Anda"
   git config --global user.email "email-github@contoh.com"
   ```

**Push pertama**, dijalankan dari dalam folder `frontend`:
```bash
cd "PATH/KE/KRP_PRO/frontend"
git init
git add .
git commit -m "KRP Pro v2.0.0"
git branch -M main
git remote add origin https://github.com/USERNAME/krp.git
git push -u origin main
```
Saat diminta kredensial:
- *Username*: username GitHub Anda.
- *Password*: isi **Personal Access Token**, bukan kata sandi akun. Buat di <https://github.com/settings/tokens> → *Generate new token (classic)* → centang **repo**. Saat token di-paste, layar memang tidak menampilkan apa-apa; itu normal.

**Aktifkan Pages:**
1. Buka repositori → **Settings → Pages**.
2. *Source*: **Deploy from a branch**. *Branch*: **main / (root)**, lalu **Save**.
3. Centang **Enforce HTTPS**.
4. Tunggu 1–2 menit sampai muncul *Your site is live at `https://USERNAME.github.io/krp/`*.

**Memperbarui frontend:**
```bash
git add .
git commit -m "Pembaruan"
git push
```
Kalau tampilan belum berubah, tekan `Ctrl+Shift+R` atau buka jendela Incognito.

---

## C. Pengaturan awal setelah online

1. Buka portal, lalu **Masuk → Panitia** dengan email & kata sandi Super Admin dari log setup.
2. Segera **ganti kata sandi** di menu akun.
3. Buka **Pengaturan Web** dan isi **Alamat portal** dengan URL GitHub Pages. Alamat ini dipakai untuk tombol "Buka portal" di email dan tautan di dokumen kurasi.
4. Buka **Sistem & Migrasi → Uji koneksi**. Pastikan versi backend tampil `2.0.0`.
5. Akses darurat: login di tab Panitia dengan email `darurat` dan sandi dari log. Untuk menggantinya, jalankan `resetAksesDarurat()` di editor (sandi baru tampil di log).

---

## D. Memindahkan data dari app lama (migrasi)

Di **Sistem & Migrasi** (khusus Super Admin):

1. Tempel **URL spreadsheet database app lama**. Spreadsheet itu hanya dibaca, tidak pernah diubah.
2. Pilih kelompok data. Semua tercentang secara bawaan, kecuali *Log audit & jurnal*.
3. Klik **Pindai**. Sistem menampilkan tabel per data: berapa yang ada di app lama, akan ditambah, diperbarui, atau dilewati. Belum ada yang ditulis.
4. Klik **Jalankan migrasi**.

Cara kerjanya:
- Data dibaca berdasarkan **nama kolom**, jadi urutan kolom yang berbeda tidak masalah.
- Data dicocokkan per **ID**. Menjalankan migrasi dua kali tidak membuat data dobel.
- Kalau app baru masih kosong, kelompok, nomor lomba, event, dan pengaturan bawaan setup **diganti** dengan data app lama.
- Kata sandi semua akun (panitia & pendaftar) ikut pindah dalam bentuk hash, jadi **kata sandi lama tetap berlaku**. Super Admin yang emailnya sama memakai kata sandi app lama.
- Nomor HP yang kehilangan angka 0 di depan dipulihkan. Nomor BIB berikutnya melanjutkan dari app lama.
- Sesi login **tidak** ikut pindah. Semua pengguna cukup masuk ulang.

**Checklist pindah (cutover):**
1. Pindai → Jalankan migrasi → cek akun, atlet, event, foto, dan pengaturan. Uji masuk dengan 1 akun pendaftar.
2. Tepat sebelum pindah, jalankan migrasi **sekali lagi** (delta) untuk menangkap data baru di app lama. Centang **Perbarui data yang sudah ada** hanya kalau app baru belum dipakai untuk input.
3. Umumkan alamat baru, lalu arsipkan deployment lama (*Manage deployments → Archive*). Data app lama tetap aman.

> **Alternatif cepat (tanpa migrasi):** di proyek Apps Script baru, buka *Project Settings → Script Properties*, isi `SPREADSHEET_ID` dan `DRIVE_ROOT_FOLDER_ID`/`FOLDER_*` dengan nilai dari app lama, lalu jalankan `setupAppEnvironment()`. Kedua app kemudian memakai database yang sama. Matikan app lama setelah yang baru berjalan agar tidak ada dua pintu tulis.

---

## E. Keamanan & rahasia

| Disimpan di | Isi | Keterangan |
|---|---|---|
| **Script Properties** | `SESSION_SECRET`, `EMERGENCY_USER`, `EMERGENCY_PASS_HASH`, `EMERGENCY_SALT`, `SPREADSHEET_ID`, `DRIVE_ROOT_FOLDER_ID`, `FOLDER_*`, `SEQ_BIB`, `REV_*` | Dibuat otomatis oleh setup. Tidak pernah dikirim ke browser. |
| `js/config.js` | `GAS_URL` saja | Bukan rahasia. Keamanan dijaga token sesi + cek peran di server. |
| Sheets | Data aplikasi. Kata sandi hanya berupa **hash + salt** | Jangan bagikan spreadsheet database ke orang lain. |

- Token sesi bertanda tangan HMAC, berlaku 12 jam, dikirim di body POST (bukan di URL), dan bisa dicabut per akun.
- Login gagal 5× → diblokir 15 menit.
- Simpan ulang memakai `reqId`. Hasilnya disimpan di cache **tanpa** kata sandi atau token.
- **Rotasi** lewat editor Apps Script:
  - `rotasiSecretSesi()`: semua pengguna dikeluarkan.
  - `resetAksesDarurat()`: sandi darurat baru.
- Batasi editor proyek Apps Script ke orang tepercaya saja, karena siapa pun yang bisa mengedit dapat melihat Script Properties.

---

## F. Performa & kuota (hari pelaksanaan)

| Lapisan | Yang dilakukan |
|---|---|
| Hosting | Halaman web dilayani GitHub Pages (CDN), jadi membuka portal **tidak** memakai kuota Apps Script. Hanya data yang memakai kuota. |
| Klien | Tampil instan dari salinan lokal lalu diperbarui di latar (SWR). Permintaan kembar digabung. Beberapa permintaan baca dalam satu saat dikirim sebagai **satu `batch`** (1 eksekusi server). Batas waktu & coba ulang otomatis untuk jaringan HP. |
| Modul | Pengunjung umum hanya mengunduh `app.js` (±115 KB). Modul panitia `admin.js` dan Chart.js baru diunduh saat dibutuhkan. |
| Server | Cache berlapis berversi (per eksekusi → CacheService ber-chunk). Halaman publik stale-while-revalidate. Pemanasan cache tiap 10 menit. Email dikirim **setelah** kunci dilepas. |
| Tulis bersamaan | LockService, versi data per nomor (anti-bentrok), jurnal hasil, dan `reqId` idempoten. |
| Hasil Live | Jeda polling bisa diatur (bawaan 30 dtk). Berhenti saat tab tidak dilihat. Otomatis melambat saat server ramai. |

**Batas Google yang perlu diingat:**
- Maksimal **30 eksekusi bersamaan per akun pemilik**.
- Pada hari H dengan ribuan pengunjung, atur **Jeda pembaruan Hasil Live** ke 45–60 detik di Pengaturan Web.
- Pantau rata-rata waktu respons di **Sistem & Migrasi**.

---

## G. Mengubah tampilan/kode (pengembang)

1. Edit berkas di `src/` (`a_core.js` … `g_sistem.js`, `style.css`).
2. Jalankan `node tools/build.js`. Ini menyusun `frontend/js/app.js`, `admin.js`, `css/style.css`, dan memperbarui nomor versi aset.
3. Push folder `frontend` seperti di bagian B.

Untuk mengganti versi, ubah `APP_VERSION` di `backend/Api.gs` dan `VERSI` di `frontend/js/config.js`. Lalu deploy backend sebagai *New version* dan push frontend.

---

## H. Mengatasi masalah

| Gejala | Penyebab & solusi |
|---|---|
| "Konfigurasi belum lengkap" | `GAS_URL` di `js/config.js` belum diisi atau salah. Isi URL `/exec`, lalu push. |
| "Alamat API belum benar atau akses Web App belum Anyone" | Deployment belum *Who has access: Anyone*, atau URL yang dipakai adalah `/dev`. Deploy ulang dengan pengaturan yang benar. |
| Tampilan polos (CSS/JS 404) | Folder rata karena upload lewat web. Perbaiki dengan `git mv` sesuai struktur `css/` dan `js/`. |
| Perubahan tidak muncul | Cache browser atau service worker. Tekan `Ctrl+Shift+R`. Versi aset otomatis berubah setiap `build.js`. |
| "Sistem sedang sibuk" | Banyak aksi tulis bersamaan. Klien mencoba ulang otomatis; bila masih muncul, tunggu beberapa detik. |
| `Password authentication is not supported` saat push | Pakai Personal Access Token sebagai password. |
| Foto/berkas lama tidak tampil setelah migrasi | Proyek baru bukan di akun Google yang sama dengan app lama. |
