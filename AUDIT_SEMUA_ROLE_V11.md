# AUDIT MENYELURUH LENTERA V11 — 24 November 2026

**Basis:** arsip `LENTERA-V10.6-perbaikan-tambah-siswa.zip` yang digunakan sebagai sumber V11. Ini merupakan audit **kode statis**, bukan sertifikat aplikasi siap produksi. Login sungguhan, Supabase, visual browser, dan build produksi belum berhasil diuji dalam lingkungan audit ini.

## Ringkasan yang perlu dipahami sebelum dipakai

1. **Database belum memiliki konsolidasi GRANT.** Migrasi 001–016 mengaktifkan RLS dan menambahkan izin hanya pada beberapa tabel. Banyak halaman melakukan SELECT melalui JWT pengguna; endpoint server lain membaca melalui `service_role`. Migrasi 017 mengonsolidasikan izin operasi yang benar-benar dipakai. Policy RLS tetap menjadi pembatas tingkat baris; GRANT tidak membuktikan policy sudah benar.
2. **Kelas SD 1–6.** Pembuatan kelas sudah dibatasi 1–6 di API sebelumnya. Migrasi 017 juga menambah CHECK pada tabel `classes` dan `teaching_modules`, fase A = kelas 1–2, B = 3–4, C = 5–6. CHECK `NOT VALID`: baris lama yang menyimpang tidak langsung dihapus, tetapi data baru dan perubahan baris harus mematuhinya. Periksa `supabase/DIAGNOSIS_READ_ONLY.sql` sebelum VALIDATE.
3. **Pembelajaran dan Modul Ajar.** Endpoint Pembelajaran memakai verifikasi role dari service-side, memeriksa kelas, mata pelajaran, fase, serta penugasan Guru. Endpoint generator Modul Ajar memerlukan kelas yang sah (bukan hanya grade dari browser) dan membaca/menyimpan data melalui service setelah otorisasi.
4. **Asesmen dan input nilai.** Operasi yang sekarang dilakukan browser membutuhkan GRANT `authenticated` untuk INSERT asesmen serta INSERT/UPDATE nilai. Ini diatur di 017, tetapi RLS harus benar-benar diuji untuk setiap role dan sekolah.
5. **Hindari klaim sudah selesai.** Pembuatan kelas dan siswa, undangan orang tua, publikasi laporan, modul, analisis AI, profil dan dashboard butuh uji database nyata; tanpa itu semuanya belum lulus end-to-end.

## Inventaris halaman dan pekerjaan yang belum tervalidasi

| Role | Halaman / alur | Penilaian audit kode | Uji berikutnya |
|---|---|---|---|
| Admin | Login akses khusus, dashboard Admin | Implementasi tersedia; sesi dan allowlist Admin | Login akun admin benar; pengguna lain ditolak |
| Admin | Tambah sekolah | API POST + form tersedia | Simpan sekolah, validasi URL/key server dan GRANT |
| Admin | Daftar/buat akun Guru & Kepala Sekolah | API Auth Admin + profil + rollback tersedia | Buat dua akun, cek email, school_id, identifier dan redirect |
| Admin | Pengaturan dan tes provider AI | API/config tersedia, perlu key terenkripsi | Simpan, uji, reset key, periksa kebocoran secret |
| Kepala Sekolah | Beranda | Memuat ringkasan kelas/siswa/guru | Angka sesuai sekolah; tidak bocor data sekolah lain |
| Kepala Sekolah | Monitoring Kelas | Form Tambah Kelas tersedia | Kelas 1–6, wali kelas, duplikat, dan kegagalan penugasan |
| Kepala Sekolah | Laporan Guru | Daftar aktivitas tersedia | Query terbatas sekolah, detail dan CSV |
| Kepala Sekolah | Analisis Sekolah | Baca analisis tersimpan | Tidak menampilkan analisis sekolah lain |
| Kepala Sekolah | Laporan Sekolah | Menampilkan laporan tersimpan; **belum ada workflow pembuatan laporan penuh** | Baca setelah ada laporan nyata |
| Kepala Sekolah | Undangan Wali Murid | API baca/buat kode tersedia | Kode aktif, kedaluwarsa, hanya siswa sekolah sendiri |
| Kepala Sekolah | Profil | Ubah nama tersedia | UPDATE hanya kolom aman |
| Guru | Beranda, kelas, siswa | List tersedia; form tambah siswa via API | Pemisahan sekolah dan penugasan guru |
| Guru | CP / TP / Indikator | Tabel dan query ada; **belum tersedia menu CRUD CP/TP lengkap** | Perlu implementasi dan tes terpisah |
| Guru | Pembelajaran & Analisis | Daftar, buat sesi, edit metadata, hasil AI | Akses kelas 1–6, mata pelajaran, sesi, hasil analisis |
| Guru | Asesmen (buat & nilai) | Form dan mutasi browser tersedia | INSERT/UPSERT, nilai minimum dan ambang, RLS |
| Guru | Modul Ajar | Generate draf, daftar, edit metadata | Provider AI, simpan draf, modul berbeda kelas |
| Guru | Isi modul dan PDF | **Editor konten penuh dan PDF lengkap belum tersedia** | Implementasi terpisah, jangan dinyatakan selesai |
| Guru | Laporan Pembelajaran | Publikasi batch via backend tersedia | Data siswa, nilai, laporan diterima wali murid |
| Guru | Riwayat Pembelajaran | Daftar, filter, ekspor | Validasi data dan pengelompokan sesi |
| Guru | Impor massal siswa | **Belum tersedia** (tercantum eksplisit pada halaman) | Perlu form dan validasi berkas terpisah |
| Wali Murid | Registrasi kode undangan | Auth signup + RPC tersedia | Email terkonfirmasi, undangan satu kali, NIS opsional |
| Wali Murid | Beranda dan Profil Anak | Membaca relasi `parent_students` | Relasi verified, anak dari sekolah yang benar |
| Wali Murid | Perkembangan | Baca laporan perkembangan | Data tidak muncul sebelum publikasi |
| Wali Murid | Hasil Asesmen | Baca data terpublikasi | Tidak dapat melihat nilai anak lain |
| Wali Murid | Laporan | Baca laporan yang terbit | Laporan baru muncul setelah Guru menerbitkan |
| Wali Murid | Profil | UPDATE data profil | Batasan kolom dan pengujian simpan |

## Uji keamanan yang WAJIB dilakukan setelah memasang SQL 017

1. Buat **dua sekolah uji**, Guru A/B, Kepala Sekolah A/B, Wali Murid A/B dan dua anak uji (semua pakai data sintetis).
2. Guru A bisa membaca dan menulis hanya sesi/asesmen untuk penugasannya. Guru A **harus gagal** membaca siswa dan hasil sekolah B, bahkan saat ID diketahui.
3. Kepala Sekolah A bisa tambah kelas 1–6 di sekolah A dan tidak bisa menambah/menulis kelas sekolah B. Tolak tingkat 7–12 dan fase yang tidak cocok, termasuk melalui request API langsung.
4. Wali Murid A hanya boleh melihat siswa A yang hubungan `parent_students`-nya `verified`, serta hanya laporan dan asesmen yang **published**.
5. Wali Murid tidak boleh INSERT/UPDATE nilai, membuat kelas, atau mengubah role/school_id di `profiles`.
6. Admin Platform bisa membuat sekolah dan akun Guru/Kepala Sekolah; tidak semua akun authenticated dapat memakai endpoint Admin.
7. Undangan tidak dapat dibaca/ditebak oleh pengguna tanpa hak akses. Token mentah tidak tersimpan di database.
8. Perubahan password, logout, refresh browser, sesi kedaluwarsa, dan redirect role harus diuji untuk keempat role.
9. Buat asesmen, input nilai, jalankan analisis, buat modul, terbitkan laporan, lalu masuk sebagai Wali Murid terkait dan pastikan data sampai.
10. Coba ulang kesalahan yang pernah muncul: `42501`, recursion RLS, `school_id ambiguous`, error enum/kolom, dan konfirmasi tidak muncul lagi pada alur yang relevan.

## Mengapa SQL 017 tidak otomatis menyelesaikan semua RLS?

- GRANT mengizinkan suatu operasi di tabel; RLS memutuskan **baris apa** yang boleh dilihat/ditulis. SQL 017 tidak menonaktifkan RLS.
- Policy lama sangat bergantung pada fungsi `SECURITY DEFINER`. Jika policy telah dimodifikasi manual atau migrasi 009–011 tidak berhasil, audit perlu membandingkan policy aktual database dengan file migrasi. **Jangan menjalankan ulang 002** pada database yang sudah memakai policy baru.
- Pengujian RLS lintas sekolah **belum dilakukan**. Jangan masukkan data siswa asli sampai pengujian negatif berhasil.

## Masalah teknis/fitur yang masih perlu kerja nyata

- Beberapa submenu hanya menyediakan ringkasan, bukan CRUD lengkap, terutama CP/TP/indikator, import massal, editor modul penuh dan ekspor PDF menyeluruh.
- Sebagian query client belum membedakan `data kosong` dan `permission denied` dengan baik; beberapa respons error masih umum.
- Pembuatan kelas lalu penugasan wali kelas memakai operasi berurutan + kompensasi; perlu transaksi database/RPC untuk atomicity yang kuat.
- Publikasi laporan menggunakan batch upsert satu statement, namun tetap perlu pengujian RLS dan relasi pada data nyata.
- Dashboard/Admin belum diuji visual dengan browser desktop dan mobile.
- Paket npm untuk production build tidak seluruhnya tersedia di cache audit (`zod-validation-error@4.0.2`), sehingga `npm ci --offline` gagal. Ini **bukan** bukti kode akan gagal di mesin dengan akses registry.

## Urutan penerapan yang aman

1. **Backup database** dan pastikan Secret Key serta APP_ENCRYPTION_KEY pernah dibagikan telah dirotasi; jangan menaruhnya ke ZIP.
2. Jalankan `supabase/DIAGNOSIS_READ_ONLY.sql`, simpan hasilnya (tanpa kredensial).
3. Pastikan migrasi 001–016 sudah diterapkan dengan urut. Jalankan **017** lalu **018** lewat SQL Editor, periksa hasil SELECT verifikasi dan uji penolakan lintas sekolah.
4. Restart aplikasi dengan `.env.local` baru dan jalankan `npm ci && npm run build && npm run dev` di lingkungan dengan akses npm.
5. Jalankan sepuluh skenario uji keamanan/fitur di atas menggunakan **akun dan siswa sintetis**, catat kasus gagal untuk diperbaiki.

**Status final audit:** audit sumber + patch izin/kontrol SD tersedia. **Belum production-ready; belum ada bukti 100% alur berfungsi.**
