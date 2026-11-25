# LENTERA V6.5 — Perbaikan infinite recursion RLS

Pesan `infinite recursion detected in policy for relation "teacher_classes"` terjadi karena hubungan siklik antara policy `profiles`, `classes`, dan `teacher_classes`.

## Pemasangan
1. Backup database / review migrasi.
2. Jalankan `supabase/migrations/009_fix_teacher_classes_rls_recursion.sql` di SQL Editor Supabase pada project LENTERA.
3. Jangan menjalankan ulang migrasi 002 setelah 009 karena 002 menggunakan CREATE POLICY non-idempoten.
4. Refresh dan login ulang sebagai Kepala Sekolah.
5. Uji membaca profil, daftar kelas, dan penugasan guru dengan akun sesuai role.

Migration ini tidak menonaktifkan RLS atau memberi akses tabel secara publik. `SECURITY DEFINER` harus dimiliki role DB yang berwenang (misalnya postgres) agar tidak terjebak dalam policy yang sama.

Perubahan SQL ini belum dapat diuji pada Supabase pengguna.
