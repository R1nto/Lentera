# LENTERA V8 — Semua Menu dan Perbaikan Laporan Guru

## Cakupan desain

Komponen bersama `DashboardLayout`, `Sidebar`, `Header`, `Card`, `Button`, formulir dan tabel diperbarui. Perubahan ini dipakai **semua halaman submenu** Guru, Kepala Sekolah, dan Wali Murid, bukan hanya halaman beranda. Panel Admin juga mendapatkan gaya formulir dan panel yang lebih konsisten. Ini adalah penerapan **design system** lintas menu; tata letak spesifik setiap submenu tidak dirombak total menjadi identik dengan konsep ilustrasi.

- Kontras teks navy dengan latar putih, biru pastel dan mint.
- Sidebar aktif dan responsif, akses keyboard (skip link dan focus ring).
- Kartu dengan radius dan spasi konsisten; tabel bisa dibaca dengan jelas.
- Input, tombol, kondisi loading dan notifikasi error lebih jelas.
- Animasi masuk ringan dengan dukungan reduced motion.
- Tidak menambahkan metrik palsu atau mengubah aturan akses RLS.

## Navigasi dan formulir Guru

Audit tautan menemukan dua URL yang sebelumnya 404. Sekarang tersedia:

- `/guru/siswa/tambah`: formulir nama/NIS/kelas dengan verifikasi role Guru, kesesuaian kelas, dan sekolah di API server.
- `/guru/modul-ajar/buat`: formulir pembuatan modul ajar yang terhubung ke endpoint AI yang ada, menggunakan kelas dan mata pelajaran sekolah. Modul disimpan sebagai draf dan harus ditinjau.

Kedua formulir memerlukan izin database dan pengujian Supabase langsung. Modul AI masih bergantung pada konfigurasi provider.

## Bug laporan Guru

Endpoint `GET /api/reports/publish` sekarang memuat sesi dan ringkasan status penerbitan dari backend; pengguna harus mempunyai sesi autentikasi dan profil Guru. Endpoint `POST /api/reports/publish`:

1. Memvalidasi role Guru berdasarkan identitas sesi, tidak pernah mempercayai role dari request.
2. Memverifikasi kepemilikan sesi dan kesesuaian sekolah.
3. Membatasi siswa aktif, asesmen, dan laporan ke kelas/sesi yang benar.
4. Menyimpan laporan untuk seluruh siswa melalui **satu upsert batch**, bukan loop per siswa. Jika statement gagal tidak ada laporan parsial yang tersimpan oleh statement itu.
5. Mempertahankan `id` laporan lama sehingga penerbitan ulang memperbarui laporan yang telah tersedia.
6. Menampilkan jumlah siswa dan waktu penerbitan terakhir pada halaman Guru; menyediakan tombol coba lagi ketika terjadi error.

**Catatan:** data laporan yang sudah terbit sebagian pada versi lama tidak dibatalkan otomatis. Jika sudah ada duplikasi laporan lama untuk siswa/sesi yang sama, versi ini memilih laporan terbaru untuk diperbarui; deduplikasi historis memerlukan pemeriksaan manual.

## Database

Jalankan SQL `supabase/migrations/013_report_publication_service_grants.sql` pada Supabase SQL Editor, setelah migrasi 001–012 dan dengan backup tersedia. Migrasi ini memberi izin SELECT tabel terkait laporan dan INSERT/UPDATE pada `published_reports`, serta izin backend pendaftaran siswa **hanya kepada `service_role`**, bukan role browser. Jangan menjalankan ulang migrasi RLS awal setelah policy baru diterapkan.

## Cara menjalankan

1. Ekstrak ZIP, lalu buat `.env.local` di root berdasarkan `.env.example` dan konfigurasi aman milikmu.
2. **Rotasi Supabase Secret Key dan kunci enkripsi** bila pernah dibagikan, dan atur ulang konfigurasi AI bila kunci enkripsinya berubah.
3. Jalankan migration 013 pada project Supabase yang sama.
4. `npm ci`, `npm run build`, kemudian `npm run dev`.
5. Uji login Guru → Laporan Pembelajaran → pilih sesi → terbitkan → cek jumlah publikasi → masuk sebagai Wali Murid terverifikasi → cek laporan anak.
6. Uji semua menu untuk tiga role dan Admin, termasuk navigasi dan responsif mobile.

## Batas verifikasi

Pemeriksaan sintaks TypeScript/TSX dan integritas ZIP dilakukan. Production build dan pengujian terintegrasi ke Supabase **belum terverifikasi** pada lingkungan ini karena dependency project tidak terpasang dan kredensial server tidak digunakan.
