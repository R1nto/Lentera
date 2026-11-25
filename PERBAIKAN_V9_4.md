# LENTERA V9.4 — Perbaikan Analisis dan Modul Ajar

- Mengganti toolbar pada `/guru/analisis` dan `/guru/modul-ajar` secara langsung dengan satu komponen `ListFilterToolbar` dan CSS Module terisolasi.
- Pencarian, filter status, penghitung data, dan ekspor CSV tetap terhubung ke state yang sudah ada.
- Elemen pencarian/filter/ekspor sekarang memakai ukuran konsisten dan pengaturan responsif 3 breakpoint, tanpa mengandalkan aturan `.page-toolbar` lama.
- Pada daftar Analisis, query status AI tidak dijalankan dengan `.in()` kosong jika guru belum punya sesi pembelajaran.
- Tidak ada migrasi SQL baru.

## Batas validasi
Pemeriksaan sintaks pada file yang diubah lulus, tetapi build dan tampilan live di browser belum diverifikasi. Supabase tetap membutuhkan policy RLS dan GRANT yang benar.
