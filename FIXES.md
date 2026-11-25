# LENTERA — Perbaikan dan Catatan Implementasi

Paket ini berisi perbaikan source code dan penyegaran UI/UX berdasarkan PRD LENTERA v2.0.

## Perubahan utama

### Keamanan dan autentikasi
- Memperbaiki middleware agar `/` tidak membuat seluruh URL menjadi public; akses dashboard kini dibatasi berdasarkan role.
- Menambahkan login server-side yang memetakan NIP / ID akun / email ke akun Supabase Auth tanpa menaruh secret di browser.
- Akun Guru dan Kepala Sekolah tidak dapat membuat role sendiri melalui formulir publik; provisioning dilakukan oleh sekolah.
- Pendaftaran Wali Murid diarahkan ke `/daftar?role=wali_murid`, memvalidasi kode undangan sebelum membuat akun Auth, dan menghapus akun Auth sementara jika proses penyimpanan gagal.
- Migrasi 006 membuat profil, relasi wali-anak, dan pemakaian kode undangan secara atomik melalui RPC server-only.
- Menambahkan callback untuk pertukaran confirmation code menjadi session.
- Menambahkan migrasi pembatasan kolom profil yang dapat diubah sendiri, perlindungan invitation, dan hardening `SECURITY DEFINER`.

### Database dan proses pembelajaran
- Menyelaraskan query relasi kelas, siswa, orang tua, mata pelajaran, dan laporan dengan tabel yang tersedia.
- Menambahkan kolom kontak profil dan avatar siswa yang memang digunakan UI.
- Menyelaraskan fase pembelajaran dengan enum database (`A`–`F`) dan menyimpan kolom sesi yang benar.
- Menambahkan form pembuatan asesmen yang memetakan TP dan indikator, skor minimum, serta target persentase kelas.
- Menambahkan input nilai per siswa dengan validasi rentang skor dan upsert.
- Analisis menggunakan kriteria yang ditentukan guru. Bila kriteria tidak tersedia, persentase ditandai belum dapat dihitung.
- Analisis gagal dapat dicoba ulang setelah input diperbaiki; hash input memasukkan isi asesmen, refleksi, CP, TP, dan sesi.

### AI
- Mengganti pemilihan provider yang selalu mengembalikan mock dengan adapter API Anthropic dan OpenAI.
- Mode mock hanya diizinkan pada development; production menolak konfigurasi mock.
- Output AI harus berupa JSON; error provider tidak menghasilkan status sukses palsu.
- API key hanya dibaca dari environment server.

### Pelaporan wali murid
- Menambahkan alur publikasi laporan per siswa.
- Wali murid membaca snapshot laporan yang telah diterbitkan, bukan analisis mentah atau refleksi internal guru.
- Menambahkan halaman daftar laporan wali murid.

### UI/UX
- Menyederhanakan pemilihan role agar informasi tidak bertumpuk dan tombol daftar menuju halaman registrasi yang benar.
- Menata ulang halaman login dan registrasi dengan layout dua kolom, tipografi, jarak, label, ikon input, dan warna teks berkontras tinggi.
- Merapikan sidebar mobile/desktop, navigasi aktif, topbar, serta lebar area konten dashboard.
- Memperbarui token global agar input, label, kartu, tabel, dan teks memakai warna foreground yang terbaca.
- Menambahkan maskot visual LENTERA pada brand, landing page, sidebar, dan halaman autentikasi.
- Menambahkan navigasi Asesmen dan Laporan Pembelajaran.
- Menghapus angka/testimoni promosi yang tidak didukung data produk.

## Langkah setup

1. Salin `.env.example` menjadi `.env.local` dan isi konfigurasi Supabase.
2. Untuk project baru, jalankan migrasi SQL `001` sampai `007` secara berurutan. Untuk project lama yang sudah menjalankan `001`–`005`, jalankan hanya `006` dan `007` jika belum diterapkan. Jangan menjalankan ulang migrasi yang sudah sukses.
3. Aktifkan email confirmation Supabase dan tambahkan URL `/auth/callback` ke daftar redirect yang diizinkan.
4. Provision akun Guru/Kepala Sekolah lewat Authentication dan tabel `profiles`; lihat `SUPABASE_SETUP.md`.
5. Kepala Sekolah membuat kode undangan dari menu **Undangan Wali Murid**; alternatif SQL tersedia di `SUPABASE_SETUP.md`.
6. Untuk AI sungguhan, set `AI_PROVIDER=anthropic` atau `AI_PROVIDER=openai`, lalu isi `AI_API_KEY` dan `AI_MODEL` di environment server. `mock` hanya untuk development.
7. Jalankan `npm ci`, `npx tsc --noEmit`, dan `npm run build`.

## Batas verifikasi

Source diperiksa secara statis dan seluruh file TypeScript/TSX lolos pemeriksaan sintaks. Build Next.js penuh belum dapat divalidasi di lingkungan penyuntingan karena pemasangan dependency berhenti/timeout. Setelah dependency dan environment Supabase tersedia, jalankan pemeriksaan build, migrasi staging, serta uji RLS untuk ketiga role sebelum production.


## Pembaruan perbaikan registrasi dan UI

- Tombol `Daftar` dan `Mulai Gratis` pada landing page kini membuka mode registrasi, bukan mode masuk.
- Form registrasi Wali Murid memeriksa kode undangan sebelum membuat akun Auth; NIS anak tetap opsional.
- Profil, relasi wali-anak, dan status undangan dibuat secara atomik melalui RPC migrasi 006.
- Kepala Sekolah kini memiliki halaman **Undangan Wali Murid** untuk menerbitkan kode undangan sekali pakai dari daftar siswa sekolahnya.
- Migrasi 007 memperketat kebijakan RLS pengelolaan undangan.
- Aturan warna global yang sebelumnya menimpa teks di panel gelap telah dihapus; CTA dan footer memiliki warna kontras yang ditetapkan khusus.
- Kerangka dashboard, navigasi mobile, auth pages, dan komponen umum telah dirapikan agar memiliki jarak, tipografi, dan warna yang konsisten.

Jalankan migrasi 006 dan 007 setelah migrasi 001–005. Jika migrasi lama belum pernah dijalankan, jalankan 001–007 secara berurutan.
