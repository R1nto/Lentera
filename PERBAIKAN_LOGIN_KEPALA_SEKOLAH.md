# Perbaikan login Kepala Sekolah

- Form login `/masuk?role=kepala_sekolah` menerima **email Auth** atau **ID akun** yang ditetapkan Admin.
- Login email diperiksa langsung oleh Supabase Auth, sedangkan ID akun dicari pada `profiles.identifier` menggunakan service credential di server.
- Setelah password benar, backend memverifikasi role `kepala_sekolah` dari `profiles` sebelum membuat login sah; role lain ditolak.
- Jika login masih gagal, cek apakah pembuatan akun dari panel Admin benar-benar sukses dan ada record `auth.users` sekaligus `public.profiles` dengan UUID sama dan role `kepala_sekolah`.
- Jika terjadi `42501`, periksa grants khusus `service_role` untuk `profiles` (SELECT), dan pastikan Secret Key yang digunakan server cocok dengan project.
- Hapus sesi yang lama dengan logout atau coba private browser dan pilih role **Kepala Sekolah** pada layar pemilihan peran.
- **Keamanan:** jangan bagikan `.env.local` atau password. Rotasi secret key yang pernah terpapar.

Catatan: ZIP ini belum diuji dengan koneksi Supabase milik pengguna atau production build lengkap.
