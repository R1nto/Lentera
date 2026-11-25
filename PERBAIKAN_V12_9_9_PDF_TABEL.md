# LENTERA V12.9.9 — PDF Modul Ajar dalam tabel

Ekspor Modul Ajar pada menu Guru sekarang menggunakan isi `teaching_modules.content`, bukan metadata saja. PDF A4 menggunakan tabel untuk identitas, CP, TP/indikator, kompetensi awal, pemahaman bermakna, pertanyaan pemantik, materi, kegiatan guru/siswa beserta alokasi waktu, asesmen, diferensiasi, remedial, pengayaan, dan refleksi. Bagian yang tidak tersedia dalam konten tersimpan tidak dibuat-buat. Baris panjang akan diteruskan ke halaman berikutnya dan header tabel diulang; footer memuat pelajaran, kelas, dan nomor halaman.

Perubahan file: `src/lib/module-pdf.ts` (baru) dan `src/app/(dashboard)/guru/modul-ajar/page.tsx` (menggunakan renderer baru). Tidak ada migrasi SQL dan tidak ada perubahan Gemini.

Catatan pengujian: parser TypeScript/TSX untuk kedua file lolos; pemeriksaan ZIP lolos. Production build, render PDF pada browser, dan Supabase live belum dijalankan di lingkungan ini. Periksa tabel cetak pada data Modul Ajar sesungguhnya setelah memasang patch. Gunakan konfigurasi `.env.local` pribadi; tidak disertakan dalam ZIP.
