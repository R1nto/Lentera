# LENTERA V12.10.13 — Beranda Wali Murid tersambung

## Bug
Beranda sebelumnya membaca `published_assessments` / `published_reports` secara langsung di browser dengan join tambahan pada `assessment_results`, lalu mengabaikan error query. Karena RLS dan relasi pembacaan berbeda dari halaman detail, beranda tampak kosong walaupun nilai asesmen dan laporan yang diterbitkan sudah terlihat di halaman lain.

## Perbaikan
- Beranda sekarang memanggil endpoint server yang sudah dipakai halaman detail: `/api/parent/assessments` dan `/api/parent/reports` (cache `no-store`). Keduanya memverifikasi sesi Wali Murid dan hubungan terverifikasi ke anak sebelum mengambil publikasi.
- Filter `student_id` memastikan ringkasan hanya berisi data anak yang sedang ditampilkan.
- Kartu **Asesmen diterbitkan** mengikuti banyaknya hasil publikasi anak; **Laporan tersedia** mengikuti laporan yang sudah diterbitkan.
- **Data perkembangan** mengikuti laporan yang memuat indikator. Daftar beranda menampilkan hitungan keputusan `meets_criterion` dari snapshot laporan, misalnya `2/2 tercapai`. Ini berbeda dari nilai asesmen 100/100.
- Jika endpoint gagal, beranda menampilkan pesan dan tombol Coba lagi, bukan keliru mengklaim nol data.

## Cara memakai
Pertahankan `.env.local` yang sudah aman; tidak ada migrasi SQL baru jika migrasi sampai 025 telah diterapkan. Jalankan ulang aplikasi, masuk kembali sebagai Wali Murid, lalu buka Beranda. Nilai, laporan, dan indikator yang sudah diterbitkan tidak perlu dibuat ulang.

## Batas pengujian
Pemeriksaan sintaks TSX dan inspeksi endpoint lulus. Production build dan verifikasi dengan akun Supabase nyata belum dilakukan. Beranda saat ini tetap memperlihatkan ringkasan anak pertama untuk akun yang memiliki beberapa anak; halaman detail menangani pembacaan data anak yang terhubung.
