# V12.12 — CP otomatis dari katalog terkurasi

1. Cadangkan basis data, lalu jalankan `supabase/migrations/026_verified_cp_catalog.sql` di SQL Editor Supabase setelah migrasi 025.
2. Pasang source V12.12, jaga `.env.local` server dan jalankan aplikasi.
3. Masuk Guru → Modul Ajar → Buat Modul Ajar. Pilih kelas dan mata pelajaran. Katalog CP dimuat satu kali per perubahan kelas/mata pelajaran, bukan melalui AI.
4. Pilih elemen CP sesuai topik. Ringkasan elemen CP dan sumber ditampilkan; Guru dapat membuka dokumen acuan sebelum generate.
5. Backend memvalidasi ID, fase, mapel, serta status aktif. CP buatan pengguna tidak bisa menyamar sebagai entri katalog.

## Cakupan katalog awal
- Terdapat **15 ringkasan elemen CP Matematika**: Fase A/B/C, lima elemen Matematika, dari Lampiran II Keputusan BSKAP 046/H/KR/2025.
- Ini **bukan** salinan lengkap semua CP dan bukan seluruh elemen atau semua mapel SD. Tambahkan CP lain dari dokumen resmi melalui proses kurasi sekolah, sebelum menjadikannya pilihan otomatis.
- Untuk mata pelajaran Agama dan Budi Pekerti, periksa penyesuaian keputusan BKPDM 020 Tahun 2026; jangan otomatis menggunakan rumusan lama.
- Kolom `source_url`, `source_version`, dan `verified_at` disediakan agar catalog dapat diperbarui secara terkendali.
- Jika katalog belum mempunyai CP cocok, isian manual tetap ada dan jelas diberi status draf.

## Pengaman
- Hanya Guru terautentikasi yang ditugaskan ke kelas dapat membaca katalog melalui API.
- Endpoint pembuatan modul membacakan ulang catatan resmi berdasarkan ID dari DB; tidak percaya teks referensi dari browser.
- Permintaan tidak menyimpan data murid ke katalog.
- Isi CP merupakan ringkasan elemen untuk kemudahan pemilihan, bukan pengganti pengecekan rumusan CP utuh oleh Guru.

Sumber: https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf
