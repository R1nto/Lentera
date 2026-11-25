# LENTERA V12.1 — Mata pelajaran SD

## Mengapa kosong?
Skema `public.subjects` dibuat sejak migrasi 001, tetapi migrasi sebelumnya belum mengisi daftar referensi mata pelajaran. Pada database baru dropdown bisa kosong walau query sukses.

## Pemasangan
1. Backup database pengujian.
2. Jalankan `supabase/migrations/020_sd_subject_catalog.sql` lewat Supabase SQL Editor setelah migrasi 001–019 yang relevan. Script dapat dijalankan ulang tanpa menggandakan kode/nama yang sama.
3. Jalankan aplikasi V12.1, login sebagai Guru, pilih kelas 1–6, lalu buka pilihan Mata Pelajaran.
4. Jika muncul error akses, periksa GRANT SELECT `service_role` untuk `subjects` dan tabel otorisasi pada API `/api/teacher/setup`.

Katalog awal memuat mapel umum SD serta Bahasa Inggris dan Muatan Lokal sebagai pilihan opsional yang perlu ditinjau sekolah. IPAS hanya tersedia untuk Fase B/C (kelas 3–6); jangan membuat CP/TP otomatis dari nama mata pelajaran. Katalog adalah referensi global dan tidak mengklaim semua mata pelajaran wajib di semua sekolah.

## Yang diperbaiki
- Halaman Buat Pembelajaran mengambil daftar melalui endpoint backend `/api/teacher/setup`, bukan query browser yang sensitif pada GRANT/RLS.
- Dropdown disaring menurut fase kelas; mengganti kelas mengosongkan mata pelajaran lama agar tidak salah fase.
- Mata pelajaran dengan fase kosong dari data lama tetap tampil demi kompatibilitas.
- Error backend dibedakan dari katalog kosong, disertai langkah pemasangan.
- Endpoint simpan sesi menolak mapel yang tidak sesuai fase bila mapel memiliki batasan fase.

## Batas pengujian
Pemeriksaan sintaks pada file diubah dilakukan. Build lengkap dan baca-tulis langsung ke Supabase pengguna belum terverifikasi.
