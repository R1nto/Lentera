# LENTERA V12.9.12 — Model/Metode dan PDF Modul Ajar

## Perubahan
- Formulir Guru > Buat Modul: dapat memilih model pembelajaran serta memasukkan metode/media pembelajaran.
- Nilai model, metode, media dipersist bersama `teaching_modules.content` setelah generasi Gemini (bukan bergantung pada AI untuk menebak pilihan Guru).
- Guru > Modul Ajar > Edit metadata: dapat menambahkan/mengubah model, metode, media modul lama tanpa memanggil Gemini.
- Pratinjau detail menampilkan model, metode, media dari konten yang tersimpan.
- PDF A4 menampilkan tabel model, metode, media (bila tersedia); termasuk kriteria indikator, TP kegiatan, jenis asesmen, dan referensi indikator yang sebelumnya tidak tercetak.
- Tidak mengarang materi, CP/TP, soal, LKPD, atau model/metode yang belum dipilih.

## Cara pakai modul yang sudah ada
1. Pada daftar Modul Ajar, klik Edit metadata untuk modul lama.
2. Isi model, metode, dan media sesuai rancangan Guru; klik Simpan.
3. Klik Unduh PDF lengkap pada modul itu.

## Pengujian
- Seluruh 117 berkas TS/TSX diproses dengan TypeScript transpileModule tanpa diagnostik sintaks.
- Arsip ZIP lulus `unzip -t`.
- Belum diuji dengan build Next.js atau Supabase/Gemini nyata. Izin update JSONB tabel `teaching_modules` bergantung pada RLS/grant sekolah.
