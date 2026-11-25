# V12.10.4 — Tautan Wali Murid dan Anak

## Akar masalah
- Registrasi dengan undangan menggunakan RPC `register_parent_account` yang membuat `parent_students.verification_status = verified`.
- Dashboard dan Profil Anak memakai relasi `classes!inner`; RLS `classes` sebelumnya hanya mengizinkan Guru dan Kepala Sekolah, bukan Wali Murid. Join dapat menghapus anak dari hasil.
- Error query Supabase sebelumnya diabaikan sehingga ditampilkan pesan keliru “belum ada anak terhubung”.

## Pemasangan
1. Cadangkan database. Pastikan migrasi 010 dan 023 telah dijalankan.
2. Jalankan `supabase/migrations/024_parent_verified_class_visibility.sql` di SQL Editor project Supabase yang dipakai LENTERA.
3. Deploy source, restart, dan login Wali Murid yang telah terdaftar.
4. Periksa Beranda serta Profil Anak. Jangan daftarkan ulang akun atau gunakan undangan lama.

## Batasan
- Patch ini **tidak** membuat tautan orang tua-anak yang memang belum ada; jika parent_students kosong perlu audit registrasi menggunakan akun administrator, dengan verifikasi identitas, sebelum penautan.
- Pengujian live terhadap Supabase belum dilakukan.
