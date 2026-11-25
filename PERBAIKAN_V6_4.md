# LENTERA V6.4 — UI refresh & perbaikan menu Kepala Sekolah

## Perubahan
- Beranda Kepala Sekolah diperbarui dengan navigasi kartu, metrik, dan aktivitas sekolah yang sesuai tabel di `001_initial_schema.sql`.
- Halaman Monitoring Kelas, Laporan Guru, Analisis Sekolah, Laporan Sekolah, dan Profil dirapikan secara konsisten.
- Link detail yang sebelumnya menuju rute 404 digantikan dengan panel detail dialog pada halaman terkait.
- Pencarian, filter, ekspor CSV, dan tombol detail di daftar kini memiliki tindakan nyata.
- Menghilangkan query yang meminta `achievement_percentage` langsung dari `ai_analyses`, `email` dari `profiles`, atau kolom `title/period/status` dari `school_reports` yang tidak ada di schema dasar.
- Data dibatasi per sekolah dari profil Kepala Sekolah dan UUID sekolah terverifikasi; RLS Supabase tetap harus dikonfigurasi.
- Undangan wali murid dibatasi dengan `school_id` untuk daftar siswa dan daftar undangan.
- Dashboard bersama Guru/Wali Murid menerima peningkatan kontras, input, kartu, focus state, dan overflow mobile.
- Dialog detail tidak menampilkan data mentah JSON yang dapat mengandung informasi sensitif.

## Cara memasang
1. Ekstrak ZIP dan gunakan `.env.local` milikmu di komputer/server. Jangan membagikan key.
2. Jalankan `npm ci` lalu `npm run build` dan `npm run dev`.
3. Login Kepala Sekolah dan periksa seluruh menu dari sidebar, terutama Monitoring Kelas, Laporan Guru, Analisis Sekolah, Laporan Sekolah, Profil, dan Undangan.
4. Jika data kosong karena RLS/izin, halaman akan menampilkan pesan kesalahan yang lebih terarah. Jangan menonaktifkan RLS.

## Batas pengujian
- Pemeriksaan sintaks seluruh file TypeScript/TSX berhasil.
- Production build dan integrasi dengan Supabase pengguna tidak dapat dijalankan dari lingkungan ini tanpa dependency serta kredensial yang aman.
- Belum ada audit fungsional penuh pada semua form Guru dan Wali Murid; perubahan CSS hanya memperbaiki tampilan bersama.
- Laporan Sekolah ditampilkan sebagai metadata laporan; isi snapshot tidak dipublikasikan otomatis.
