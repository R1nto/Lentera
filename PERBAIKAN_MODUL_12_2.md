# LENTERA V12.2 — Diagnostik Modul Ajar

## Apa yang diperbaiki
- Endpoint Modul Ajar kini menjelaskan kegagalan izin database (42501), tabel hilang, kolom salah, foreign key, dan konfigurasi AI tanpa membocorkan secret.
- Mode AI mock **tetap dilarang pada production**. Admin harus mengatur provider/model/API key.
- Jika pencatatan log generasi gagal, modul yang sudah berhasil disimpan tidak dianggap gagal.
- Perbandingan tingkat kelas dinormalisasi agar string/angka tidak salah ditolak; kelas tetap dibatasi SD 1–6 dan fase A/B/C.
- Antarmuka menampilkan kode error aman bila tersedia.

## Verifikasi
Jalankan `npm ci`, `npm run build`, dan uji pembuatan Modul Ajar dengan akun Guru dan Supabase pengujian. Lihat terminal server untuk `Module creation failed:` bila masih gagal. Tidak ada migrasi baru pada patch ini.

## Batasan
Belum diuji end-to-end pada Supabase pengguna atau provider AI. Jika database menolak akses tabel, perbaiki GRANT/RLS yang spesifik setelah melihat kode error asli; jangan matikan RLS.
