# Panduan Setup Supabase untuk LENTERA

## 1. Buat Project Supabase

1. Buka [supabase.com](https://supabase.com) dan login/daftar
2. Klik "New Project"
3. Pilih organization
4. Isi:
   - **Name**: `lentera-production` (atau nama yang diinginkan)
   - **Database Password**: Buat password yang kuat (simpan dengan aman)
   - **Region**: Pilih region terdekat (Singapore untuk Indonesia)
5. Klik "Create new project"
6. Tunggu hingga project siap (2-3 menit)

## 2. Dapatkan Credential

Setelah project siap, buka **Settings > API Keys** atau panel **Connect**:

- **Project URL**: `https://your-project-ref.supabase.co`
- **Publishable key**: diawali `sb_publishable_...`; dipakai frontend bersama RLS.
- **Secret key**: diawali `sb_secret_...`; hanya untuk backend/server karena melewati RLS. **Jangan bagikan atau masukkan ke kode frontend.**

Key lama `anon` dan `service_role` masih dapat dipakai selama masa transisi, tetapi untuk project baru gunakan publishable dan secret key.

## 3. Konfigurasi Environment Variables

Buat file `.env.local` di root project:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your-publishable-key
SUPABASE_SECRET_KEY=sb_secret_your-secret-key

# AI Configuration
# Lokal: AI_PROVIDER=mock (hanya untuk data demo, tidak aktif di production)
# Production: gunakan AI_PROVIDER=anthropic atau openai, dengan model dan API key yang valid.
AI_PROVIDER=mock
AI_API_KEY=
AI_MODEL=

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=LENTERA
```

## 4. Jalankan Migrasi Database

### Opsi A: Menggunakan Supabase Dashboard (SQL Editor)

1. Buka **SQL Editor** di Supabase Dashboard
2. Klik "New query"
3. **Project Supabase baru:** jalankan setiap file di `supabase/migrations` secara berurutan dari `001_initial_schema.sql` sampai `007_invitation_policy_hardening.sql`.
4. **Project yang sudah memakai migrasi sebelumnya:** jangan jalankan ulang file yang sudah sukses. Periksa riwayat migrasi; bila `001`–`005` sudah diterapkan, jalankan hanya `006_parent_registration_rpc.sql` dan `007_invitation_policy_hardening.sql` yang belum diterapkan.
5. Klik "Run" setelah setiap file selesai dijalankan dan pastikan tidak ada error. Hentikan proses bila satu migrasi gagal; perbaiki error itu sebelum menjalankan file berikutnya.

### Opsi B: Menggunakan Supabase CLI

Gunakan CLI hanya bila migrasi proyek sudah dikelola melalui Supabase CLI dan file migrasi memiliki versi yang tercatat pada `supabase_migrations`. Untuk database yang sebelumnya dibuat manual melalui SQL Editor, gunakan Opsi A agar tidak terjadi migrasi ganda atau konflik riwayat.

## 5. Konfigurasi Authentication

### Email Auth (Default)

1. Buka **Authentication > Settings**
2. Pastikan **Enable email confirmations** sesuai kebutuhan
3. Atur **Site URL**: `http://localhost:3000` (development) atau domain production
4. Tambahkan **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`

### Email Templates (Opsional)

Di **Authentication > Email Templates**, kustomisasi:
- **Confirm signup**: Template verifikasi email
- **Magic Link**: Template login tanpa password
- **Reset Password**: Template reset password


## 6. Provisioning Akun dan Undangan Wali Murid

Akun Guru dan Kepala Sekolah tidak dibuat melalui formulir pendaftaran publik. Buat user terlebih dahulu melalui **Authentication > Users**, lalu masukkan profilnya melalui SQL Editor (ganti UUID dan nilai contoh):

```sql
INSERT INTO public.profiles (id, full_name, role, identifier, school_id)
VALUES (
  'AUTH_USER_UUID',
  'Nama Guru',
  'guru',
  'NIP_GURU',
  'SCHOOL_UUID'
);
```

Untuk Kepala Sekolah, gunakan `role = 'kepala_sekolah'` dan `identifier` berupa ID akun atau ID sekolah yang dipakai untuk login. Penugasan guru ke kelas tetap harus diisi pada tabel `teacher_classes`.

Kepala Sekolah yang sudah memiliki akun dapat menerbitkan undangan dari menu **Undangan Wali Murid** di dashboard. Pilih siswa aktif, lalu buat kode. Kode berlaku 7 hari, hanya ditampilkan sekali, dan database menyimpan SHA-256 hash. Migrasi 007 memperketat kebijakan agar hanya Kepala Sekolah dari sekolah tersebut yang dapat mengelola undangan.

Wali Murid mendaftar melalui `/daftar?role=wali_murid` (atau tombol **Daftar** di beranda) menggunakan kode undangan tersebut. Pastikan domain aplikasi juga sudah ditambahkan ke daftar **Redirect URLs** Supabase Auth. Form memeriksa undangan sebelum membuat akun Auth. Setelah validasi, fungsi `register_parent_account` pada migrasi 006 membuat profil, relasi wali-anak, dan menandai undangan sebagai terpakai dalam satu transaksi. Jika sekolah perlu menerbitkan kode lewat SQL, gunakan contoh alternatif berikut:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ganti STUDENT_UUID dan CREATOR_UUID. Query menghasilkan kode sekali pakai.
WITH generated AS (
  SELECT encode(gen_random_bytes(24), 'hex') AS invitation_code
), inserted AS (
  INSERT INTO public.parent_link_invitations
    (student_id, invitation_token_hash, expires_at, created_by)
  SELECT
    'STUDENT_UUID',
    encode(digest(generated.invitation_code, 'sha256'), 'hex'),
    now() + interval '7 days',
    'CREATOR_UUID'
  FROM generated
  RETURNING id
)
SELECT generated.invitation_code
FROM generated CROSS JOIN inserted;
```

Salin kode yang dihasilkan dan berikan hanya kepada wali murid yang bersangkutan melalui kanal sekolah yang aman. Database hanya menyimpan hash kode tersebut. Setelah berhasil diverifikasi, sistem membuat relasi wali murid-anak dan menandai undangan sebagai `used`. Jangan jalankan query lagi untuk kode yang sama karena setiap eksekusi menghasilkan undangan baru.

## 7. Konfigurasi Storage (Opsional)

Jika perlu upload file (bukti asesmen, avatar, dll):

1. Buka **Storage**
2. Klik "New bucket"
3. Buat bucket:
   - `avatars` (public: true) - untuk foto profil
   - `evidence` (public: false) - untuk bukti asesmen siswa
   - `documents` (public: false) - untuk dokumen laporan

4. Set policies di **Storage > Policies**:

```sql
-- Avatars: public read, authenticated write own
CREATE POLICY "Public read avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Evidence: only teachers can upload, only involved parties can read
CREATE POLICY "Teachers upload evidence" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'evidence' AND auth.role() = 'authenticated');
-- Jangan memakai policy SELECT generik untuk bucket evidence.
-- Terapkan policy berdasarkan relasi kelas/siswa di database dan uji dengan
-- akun Guru, Kepala Sekolah, dan Wali Murid yang berbeda sebelum menyimpan file pribadi.
```

## 8. Verifikasi Setup

Jalankan project lokal:

```bash
npm run dev
```

Buka `http://localhost:3000` dan test:
1. Landing page tampil
2. Klik "Masuk" → pilih peran → login
3. Dashboard muncul sesuai role

## 9. Production Deployment

### Vercel

1. Push ke GitHub
2. Import project di Vercel
3. Tambah Environment Variables di Vercel Project Settings
4. Deploy

### Supabase Production Settings

1. **Authentication > Settings**:
   - Update **Site URL** ke domain production
   - Tambah **Redirect URLs** production

2. **Database > Settings**:
   - Enable **Point-in-Time Recovery** (PITR) untuk backup otomatis
   - Set **Maintenance window** sesuai jam sepi

3. **API Settings**:
   - Pastikan **JWT expiry** sesuai kebutuhan (default 1 jam)
   - Enable **Realtime** jika diperlukan

## 10. Monitoring & Maintenance

### Logs
- **Logs > Database**: Query performance, errors
- **Logs > Auth**: Login attempts, errors
- **Logs > Realtime**: Connection status

### Backup
- Supabase otomatis backup harian (PITR)
- Manual backup via **Database > Backups**

### Performance
- Monitor **Database > Advisors** untuk index suggestions
- Gunakan **pg_stat_statements** untuk query lambat

## 10. Troubleshooting

### Error: "relation does not exist"
- Untuk project baru, pastikan migrasi `001` sampai `007` sudah dijalankan berurutan; untuk project lama, jalankan hanya migrasi yang belum diterapkan (biasanya `006` dan `007`).
- Cek **Table Editor** apakah tabel sudah terbuat

### Error: "Row Level Security policy violation"
- Pastikan user sudah login dan punya profile
- Cek policies di **Authentication > Policies**
- Verifikasi `school_id` di profile user

### Error: "JWT expired"
- User perlu login ulang
- Cek **Auth > Settings > JWT expiry**

### Registrasi Wali Murid gagal
- Pastikan migrasi `001` sampai `007` telah berhasil dijalankan.
- Pastikan `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, dan `SUPABASE_SECRET_KEY` terisi di `.env.local`, lalu restart server Next.js.
- Pastikan Kepala Sekolah sudah membuat undangan dari menu **Undangan Wali Murid** dan kode belum digunakan/kedaluwarsa.
- Bila muncul pesan kode tidak valid, buat kode baru dan pastikan kode disalin utuh tanpa spasi tambahan.
- Pastikan Email Auth di Supabase aktif dan URL `/auth/callback` diizinkan.

### Build error di Vercel
- Pastikan semua env variables di-set di Vercel
- Cek `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

## 11. Security Checklist

- [ ] Secret key hanya di server (Vercel env, tidak di client); key lama `service_role` juga tidak boleh berada di frontend
- [ ] RLS enabled di SEMUA tabel sensitif
- [ ] Policies diuji dengan user berbeda
- [ ] Bucket storage private untuk data sensitif
- [ ] Auth redirect URLs hanya domain trusted
- [ ] Password strength requirements enabled
- [ ] MFA enabled untuk admin accounts
- [ ] Audit logs ditinjau berkala

## 12. Migration Management

### Membuat Migrasi Baru

```bash
# Local development
supabase migration new nama_migrasi

# Edit file di supabase/migrations/
# Test local
supabase db reset

# Push ke production
supabase db push
```

### Rollback (Hati-hati!)

```bash
# Hanya untuk development
supabase db reset

# Production: buat migrasi baru yang reverse perubahan
# JANGAN gunakan supabase db reset di production
```

## 13. Useful Queries untuk Debug

```sql
-- Cek user profiles
SELECT * FROM profiles WHERE id = auth.uid();

-- Cek RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- Cek table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables WHERE schemaname = 'public' ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Cek index usage
SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public' ORDER BY idx_scan DESC;
```

## Support

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: https://github.com/supabase/supabase/issues
## Catatan penting keamanan

- `SUPABASE_SECRET_KEY` hanya boleh berada di server, tidak boleh memakai prefix `NEXT_PUBLIC_`, dan tidak boleh dikomit ke Git.
- `AI_API_KEY` juga hanya dipakai di backend.
- Jangan memasukkan data siswa nyata sebelum pengujian RLS untuk setiap role selesai.
- `AI_PROVIDER=mock` hanya untuk development; konfigurasi ini sengaja ditolak pada production.
- Terapkan migrasi di staging dan backup database sebelum menerapkannya di production.
