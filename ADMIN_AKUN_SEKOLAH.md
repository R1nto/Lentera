# LENTERA V6 — Pendaftaran Guru dan Kepala Sekolah

Fitur ini ada pada `/panel-internal-lentera` → **Kelola akun sekolah**. Halaman tidak ditautkan dari navigasi publik dan server tetap memeriksa admin dari `platform_admins`.

## Syarat

- Jalankan migrasi `001` sampai `008` pada project Supabase yang sama dengan `.env.local` (untuk database lama, jalankan hanya migrasi yang belum diterapkan).
- Pastikan akun admin sudah terdaftar di `platform_admins` dan dapat login.
- Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, dan `SUPABASE_SECRET_KEY` (atau service role key) di environment **server**. Jangan pakai secret key di frontend.
- Fitur pendaftaran Guru/Kepala Sekolah tidak membutuhkan `APP_ENCRYPTION_KEY`; variabel tersebut hanya dipakai untuk konfigurasi API AI.

## Cara pakai

1. Masuk Admin → bagian Kelola akun sekolah.
2. Jika sekolah belum tersedia, isi nama sekolah dan tahun ajaran (misalnya `2026/2027`), lalu klik **Tambah sekolah**.
3. Pilih peran Guru / Kepala Sekolah, sekolah, nama lengkap, email, NIP (untuk Guru) atau ID akun (untuk Kepala Sekolah), serta password awal yang kuat.
4. Klik **Buat akun**. Backend membuat user `auth.users` dan profil `public.profiles`. Jika pembuatan profil gagal, backend mencoba membatalkan user Auth yang baru dibuat.
5. Pengguna bisa login dengan NIP / ID akun dan password awal melalui halaman login biasa sesuai perannya.

**Keamanan:** jangan pernah mengirim password awal lewat chat umum. Pengguna perlu mengganti password awal setelah menerima akun. API memastikan hanya pengguna yang sudah masuk allowlist `platform_admins` yang bisa membuat akun dan membatasi role hanya `guru` atau `kepala_sekolah`.

**Catatan:** `auth.admin.createUser` dengan `email_confirm: true` digunakan untuk provisioning oleh admin tepercaya; akun langsung diaktifkan. Untuk produksi dengan onboarding email yang lebih ketat, tambahkan alur undangan/reset password dan kebijakan perubahan password pada login pertama. Kode ini tidak otomatis menjamin perubahan password saat login pertama.

**Pengujian:** lakukan smoke test langsung pada Supabase dev/staging sebelum memproses data siswa; tidak ada akses langsung ke proyek Supabase pengguna selama pembuatan ini.


## Jika muncul “Sekolah gagal ditambahkan”

1. Periksa terminal yang menjalankan `npm run dev`; cari `Admin school creation failed` dan kode error Supabase. Jangan bagikan nilai secret.
2. Periksa `.env.local`: `NEXT_PUBLIC_SUPABASE_URL` harus berasal dari project yang sama dengan `SUPABASE_SECRET_KEY`. Secret key baru (`sb_secret_...`) atau service-role key lama disimpan **hanya di server**, bukan `NEXT_PUBLIC_`.
3. Restart server setelah mengubah `.env.local`. Untuk Vercel, atur environment variable lalu redeploy.
4. Jalankan SQL **baca-saja** ini di SQL Editor pada project yang sama:

```sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'schools';

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'schools'
ORDER BY ordinal_position;
```

5. Jika tabel tidak ada, migrasi awal belum diterapkan pada project tersebut. Jika error `42501`/RLS, periksa bahwa server memakai secret key yang benar (jangan nonaktifkan RLS sebagai solusi).
6. Jangan memasukkan secret key ke browser, tangkapan layar, atau chat.
