# LENTERA V12.13 — Analisis dan Laporan Sekolah

Dasar: V12.12.7, konfigurasi Vercel tidak berubah.

## Instalasi
1. Backup database. Jalankan `supabase/migrations/029_school_analytics_reporting.sql` setelah migrasi 028. Migrasi hanya menambah izin SELECT/INSERT backend service_role, tidak mengubah data atau RLS.
2. Timpa source pada repository lokal, pertahankan `.git` dan `.env.local`, commit lalu push main. Vercel akan membangun versi baru.
3. Masuk Kepala Sekolah → Analisis Sekolah / Laporan Sekolah. Filter default semester kalender berjalan (Januari/Juli), dapat disesuaikan.

## Definisi
- Rekap nilai dari assessment_results termasuk asesmen belum dibagikan ke Wali Murid; rerata persentase per hasil nilai valid (skor 0 hingga max_score, max_score positif).
- Siswa terpantau = jumlah ID siswa sekolah yang memiliki hasil asesmen atau entri indikator pada periode/filter; bukan seluruh siswa terdaftar.
- Keputusan indikator dihitung dari snapshot published_reports terakhir yang masih published per siswa/sesi; hanya keputusan eksplisit Guru yang cocok dengan status snapshot dihitung tercapai/belum tercapai. Lainnya tanpa keputusan. Tidak menganggap skor keseluruhan sebagai ketercapaian indikator. Indikator tanpa entri laporan tidak dihitung. Satu siswa × sesi × indikator adalah satu unit; bukan TP unik, bukan persentase siswa lulus. Filter periode berdasarkan tanggal sesi/asesmen, tanggal pembuatan modul (WIB). Data historis dapat berubah apabila sumber diubah; snapshot yang disimpan tetap.
- Modul dihitung hanya jika terhubung kelas. Analisis selesai = sesi yang memiliki minimal satu ai_analyses completed.
- Laporan PDF dihasilkan dari snapshot tersimpan atau ringkasan terkini. Lima pilihan jenis laporan memakai ringkasan komprehensif yang sama dengan judul berbeda dan beberapa pengurutan bagian; bukan lima instrumen analisis yang berbeda. Riwayat 100 terbaru. Snapshot versi lama tidak dikonversi.
- Tidak mengirim identitas siswa/nilai individual ke browser Kepala Sekolah; tidak menggunakan Gemini untuk menghitung statistik. Akses API memeriksa sesi dan role di server, school_id berasal dari profil, bukan input browser. RLS tidak diubah.

## Pemeriksaan
- Transpilasi sintaks 129 file TS/TSX berhasil (bukan pemeriksaan tipe penuh).
- 12 assertion fungsi statistik/tanggal lulus: `node tests/school-analytics.cjs` (setelah npm ci).
- Build produksi, akses Supabase/RLS langsung, tampilan browser dan PDF aktual belum diuji karena dependensi serta akses database produksi tidak tersedia.
- Belum ada tren antarperiode otomatis, daftar siswa individual, rekap TP unik, status follow-up action aktual, ataupun laporan tindak lanjut tersendiri. Prioritas tindak lanjut berbasis jumlah keputusan belum tercapai per kelas.
