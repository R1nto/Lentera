# LENTERA V12.10.6 — Laporan perkembangan dari asesmen diterbitkan

## Alur Guru
1. Buat Modul Ajar dan Asesmen dengan modul tersebut.
2. Input nilai, lalu **Publikasikan** asesmen dari menu Guru → Asesmen. Nilai lama tidak perlu diinput ulang.
3. Buat sesi Analisis Ketercapaian dengan **modul yang sama**. Untuk sesi yang sudah ada, gunakan sesi tersebut.
4. Buka Guru → Laporan Pembelajaran. Pilih sesi yang sama. Jumlah asesmen terbit yang terhubung ditampilkan.
5. Tinjau bagian yang dibagikan, kemudian klik **Terbitkan laporan**. Ini tindakan eksplisit Guru; tidak ada publikasi otomatis terhadap seluruh data anak.
6. Wali Murid terverifikasi membuka Laporan Pembelajaran dan Perkembangan Belajar.

## Perbaikan teknis
- Publikasi laporan menggunakan `learning_sessions.module_id` dan `module_curriculum_snapshot` bila tersedia, termasuk indikator teks hasil Modul Ajar.
- Hanya asesmen `is_published=true` **dan** pasangan aktivitas-siswa yang benar-benar tercatat sebagai diterbitkan di `published_assessments` yang dipakai dalam laporan.
- Skor disimpan sebagai bukti. Status `evidence_only` dipakai jika belum ada kriteria ketercapaian yang dapat diperiksa; tidak ada angka pencapaian palsu.
- Laporan kosong tidak diterbitkan tanpa nilai yang sudah dibagikan atau catatan Guru.
- Halaman Wali Murid membaca laporan dari API server yang memeriksa akun Wali Murid dan tautan anak terverifikasi, sehingga error RLS tidak diam-diam dianggap 'tidak ada laporan'.
- Tidak ada migrasi SQL baru. Migrasi sampai 025 dari versi sebelumnya tetap diperlukan.

## Batasan
- Perhitungan TP membutuhkan bukti asesmen yang mengacu indikator yang sesuai, serta kriteria nilai yang diketahui. Tidak setiap asesmen 100/100 berarti seluruh TP tercapai.
- Untuk modul lama dengan kode indikator tidak konsisten antara modul dan asesmen, bukti tidak dipetakan secara otomatis secara sembarangan.
- Belum diuji end-to-end dengan Supabase nyata dan akun pengguna; tidak boleh dianggap telah terverifikasi di produksi.
