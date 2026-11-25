# LENTERA V9 — audit UI dan perbaikan menu

## Perbaikan visual lintas role
- Semua halaman yang menggunakan `DashboardLayout` dan panel Admin mewarisi ukuran kartu, radius, padding, field, warna teks, tabel, empty state, dan fokus yang konsisten dari `src/app/globals.css`.
- Padding bagian atas card yang tidak mempunyai card-header dipulihkan (penyebab toolbar terasa menempel ke tepi).
- Ikon pencarian pada daftar tidak bertumpuk dengan teks placeholder.
- Ukuran toolbar dan tombol mengikuti lebar layar, tabel tetap dapat digulir horizontal di ponsel.
- Animasi mengikuti `prefers-reduced-motion`.

## Perbaikan menu
- **Guru > Modul Ajar:** pencarian dan filter status bekerja; ekspor daftar CSV; detail dan edit metadata tampil di dialog, bukan link 404; unduh PDF secara eksplisit adalah ringkasan metadata (bukan modul lengkap); status selaras dengan enum SQL. Query kini mengizinkan modul tanpa kelas terpasang.
- **Guru > Pembelajaran & Analisis:** daftar dapat dicari, difilter, diekspor CSV, dilihat, dan informasi dasarnya diedit tanpa tautan 404.
- **Guru > Buat Pembelajaran:** penyimpanan ke `/api/teacher/sessions` di server, bukan langsung dari browser; validasi identitas, role, sekolah, penugasan kelas, fase, dan input; pesan error yang jelas.
- **Guru > Siswa, Asesmen, Riwayat:** pencarian/filter/ekspor CSV diaktifkan; detail Siswa menggunakan panel; tombol Import Excel yang belum diimplementasikan tidak lagi ditampilkan sebagai tindakan aktif.
- **Guru > Kelas:** membetulkan tautan luar yang menyebabkan link bersarang dan membuka halaman detail kelas yang belum ada.
- **Beranda Guru/Wali Murid:** mengganti tautan detail dinamis yang mengarah ke 404 menjadi menu daftar terkait.
- **Halaman data lama:** menampilkan pesan error memuat data (jika ada) daripada sekadar pesan generik untuk query yang melempar error.

## Instruksi instalasi
1. Pindahkan `.env.local` yang sudah diamankan ke project V9. **Jangan** menyertakan secret di ZIP, Git, atau obrolan.
2. Pastikan migrasi `001` sampai `013` yang sesuai kondisi database telah diterapkan. Buat backup database.
3. Jalankan `supabase/migrations/014_teacher_session_service_grants.sql` di SQL Editor. Ini hanya menambah hak baca/insert backend ke `learning_sessions` untuk API yang melakukan verifikasi session/role/class.
4. `npm ci`, `npm run build`, lalu `npm run dev`. Uji seluruh role menggunakan akun uji, bukan data siswa asli.

## Batasan yang belum dapat diverifikasi
- `npm ci --offline` gagal (paket `zod-validation-error@4.0.2` tidak ada di cache). Karena itu **production build dan E2E browser/Supabase belum terverifikasi**.
- PDF modul sekarang adalah **ringkasan metadata**, bukan ekspor seluruh konten modul ajar. Fitur edit konten modul lengkap belum dibuat.
- Migrasi 003 menambahkan `profiles.phone` serta `students.avatar_url`; halaman yang menggunakan kedua kolom tersebut memerlukan migrasi 003. Sebagian formulir/halaman lama masih menggunakan query Supabase langsung dan bergantung pada konfigurasi GRANT/RLS database yang diterapkan.
- Tidak ada klaim semua workflow sudah lulus E2E; pemeriksaan sintaks bukan pengganti pengujian browser dan kebijakan database.
