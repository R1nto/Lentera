# Perbaikan CP/TP — LENTERA V12

Halaman **Guru → Analisis → Buat Pembelajaran** sebelumnya menampilkan `Belum ada data CP` juga ketika query CP gagal, karena error database diabaikan.

Perubahan:
1. CP/TP sekarang dimuat lewat endpoint server setelah kelas dan mata pelajaran dipilih, dibatasi pada **sekolah, mata pelajaran, dan fase SD A/B/C**.
2. Pesan izin database tidak disamarkan sebagai CP kosong.
3. Guru yang benar-benar ditugaskan pada kelas dapat mengisi CP dan TP melalui formulir kecil dengan kode dan deskripsi. Konten harus berasal dari **dokumen kurikulum yang disahkan sekolah**; tidak ada data CP/TP resmi yang dikarang aplikasi.
4. Pilihan fase otomatis mengikuti kelas 1–6; fase D/E/F tidak lagi tersedia di formulir.
5. Dibutuhkan migrasi `019_teacher_curriculum_service_grants.sql` untuk backend Supabase.

Ini belum diuji end-to-end ke project Supabase dan bukan pengganti peninjauan substansi CP/TP oleh pengelola kurikulum sekolah. Struktur database terdahulu harus sudah tersedia. Jangan memberikan service key kepada browser.
