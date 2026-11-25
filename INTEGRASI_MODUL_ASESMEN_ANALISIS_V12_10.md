# LENTERA V12.10 — Menghubungkan Modul Ajar, Asesmen, Analisis

## Penting: jalankan migrasi 021
Di Supabase SQL Editor jalankan `supabase/migrations/021_module_assessment_analysis_links.sql` **setelah migrasi 001–020**. Cadangkan database lebih dulu. Tanpa migrasi ini, pemilihan modul tidak dapat disimpan.

## Asesmen
- Guru memilih kelas dan mata pelajaran, lalu Modul Ajar miliknya untuk kelas/pelajaran yang sama, atau memilih asesmen mandiri.
- Jika Modul Ajar memiliki referensi UUID TP asli, pilihan TP dibatasi kepada TP tersebut. Indikator tetap dipilih Guru dan nilai tetap diinput Guru.
- Modul lama dengan hanya CP/TP berupa teks tidak otomatis memiliki UUID kurikulum; TP dipilih manual. Tidak ada pemetaan palsu.
- Relasi disimpan ke `assessment_activities.module_id`. Data nilai historis tidak diubah.

## Analisis ketercapaian
- Menu Buat Pembelajaran Baru menyediakan pilihan Modul Ajar.
- Pilihan disimpan pada `learning_sessions.module_id`; TP/CP bawaan terisi jika ID kurikulum tersedia.
- Saat analisis sesi terkait modul, data asesmen dibatasi ke `assessment_activities.module_id` yang sama. Hanya nilai siswa yang benar-benar tersimpan digunakan.
- Untuk sesi tanpa modul, perilaku analisis lama (pencocokan indikator) dipertahankan.
- Asesmen yang dihubungkan ke modul tapi belum ada pada sesi pembelajaran terkait tidak otomatis membentuk sesi baru; buat sesi melalui menu Analisis dengan modul yang sama.

## Keamanan
Database memvalidasi kepemilikan Guru, kelas, dan mata pelajaran melalui trigger; RLS yang ada tetap berlaku. Modul dari kelas berbeda tidak boleh digunakan.

## Pengujian yang perlu dilakukan di Supabase nyata
1. Terapkan migrasi 021.
2. Buat asesmen dengan modul yang sesuai; input nilai siswa pada asesmen itu.
3. Buat sesi Analisis menggunakan modul yang sama dan CP/TP yang relevan.
4. Jalankan analisis; periksa nilai yang diambil hanya dari modul tersebut.
5. Uji modul dari kelas lain ditolak dan asesmen mandiri tetap bisa dibuat.

Tidak ada API key dalam arsip ini. Production build serta pengujian Supabase langsung belum diklaim berhasil.
