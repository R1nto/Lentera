# LENTERA V10.6 — Tambah Siswa

Perubahan:
- API `/api/teacher/students` memverifikasi login memakai Supabase Auth, lalu membaca role, school_id, kelas dan penugasan melalui service-side client.
- Jika database gagal, pesan UI menampilkan kategori penyebab dan kode PostgreSQL (tanpa data rahasia), sedangkan terminal menyimpan detail error untuk pemeriksaan.
- Penanganan khusus untuk 42501 (GRANT), 23505 (duplikat NIS), 23503 (relasi), 23514/23502 (validasi), dan skema yang tidak sesuai.
- Migrasi `016_teacher_student_creation_privileges.sql` memberikan izin minimum service_role yang diperlukan.

Cara menjalankan:
1. Backup database Supabase.
2. Jalankan hanya migrasi 016 jika migrasi 001–015 sudah diterapkan; jangan ulang migrasi lama.
3. Perbarui source code, pertahankan `.env.local` yang telah dirotasi, dan restart Next.js.
4. Login sebagai Guru yang sudah ditugaskan pada sebuah kelas, lalu coba Tambah Siswa.
5. Bila masih gagal, salin hanya kode dan pesan error (tanpa credential) dari terminal.

Batasan: Belum diuji end-to-end pada database Supabase pengguna dan build produksi belum terverifikasi.
