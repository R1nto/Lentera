# LENTERA — UI Reference Update

Versi ini memperbarui sistem visual halaman publik dan menyelaraskan shell dashboard dengan referensi visual yang diberikan.

## Arah visual
- Latar utama krem lembut dengan panel mint dan hijau pastel.
- Aksen coral, biru muda, dan kuning hangat untuk membedakan kelompok fitur.
- Kartu membulat, border tipis, ruang antarbagian lebih lapang, dan bayangan lembut.
- Maskot lentera-buku tetap menjadi identitas LENTERA.
- Teks utama menggunakan warna gelap dengan kontras tinggi; teks pendukung memakai warna netral yang tetap terbaca.

## Susunan halaman utama
1. Navbar mengambang.
2. Hero dua kolom dengan maskot dan ajakan masuk.
3. Empat kartu keunggulan.
4. Visual alur kerja: asesmen, refleksi, analisis, dan tindak lanjut.
5. Panel tentang LENTERA dan lima proses Planning, Assessment, Reflection, Analysis, Improvement.
6. Kartu tiga role: Guru, Kepala Sekolah, dan Wali Murid.
7. Ajakan masuk/daftar dan footer gradasi.

Konten sekolah seperti PPDB, jadwal kegiatan, berita sekolah, alamat sekolah, dan angka statistik pengguna tidak disalin karena tidak sesuai dengan fungsi LENTERA dan tidak tersedia sebagai data terverifikasi.

## Menjalankan proyek
```bash
npm ci
npm run dev
```

Konfigurasi Supabase, migrasi database, autentikasi, serta panel Admin dari paket sebelumnya tetap disertakan. Jangan menaruh file `.env.local` atau secret key di dalam arsip/repository.
