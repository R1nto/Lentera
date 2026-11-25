# LENTERA V12.10.12 — Alur keputusan ketercapaian Guru

## Perubahan
- Pada **Guru → Laporan untuk Wali Murid**, centang indikator hanya memilih apa yang dibagikan. Setiap kombinasi siswa–indikator harus dipilih statusnya: Tercapai, Belum Tercapai, atau Belum Dinilai.
- Belum ada pilihan status ditandai kuning dan memblokir publikasi. Tidak ada lagi pengisian Belum Dinilai diam-diam.
- Untuk Tercapai/Belum Tercapai, Guru wajib mengisi kriteria dan catatan bukti.
- Rekap keputusan ditampilkan sebelum konfirmasi, dan jumlah keputusan tersimpan ditampilkan setelah publikasi.
- Endpoint melakukan validasi ulang, mempertahankan nilai asesmen asli, dan memeriksa ulang snapshot laporan setelah upsert.
- Untuk semua indikator, status Tercapai/Belum Tercapai hanya berasal dari keputusan eksplisit Guru, bukan dari skor total asesmen.
- Publikasi sebelumnya tidak diubah otomatis. Pilih siswa, tinjau keputusan pada langkah 3, lalu **Terbitkan laporan** untuk memperbarui laporan yang dipilih.

## Cara uji (contoh Rizky)
1. Pilih sesi Matematika–Aljabar.
2. Centang Rizky di Langkah 1, dan IND-02 di Langkah 2.
3. Di Langkah 3, pilih **Tercapai** untuk Rizky/IND-02 hanya jika ada bukti yang sesuai, isi kriteria + catatan bukti.
4. Pastikan rekap menunjukkan `Tercapai: 1`, lalu konfirmasi dan terbitkan.
5. Setelah berhasil, masuk ke Wali Murid → Perkembangan Belajar; status IND-02 yang diterbitkan harus menjadi Tercapai. IND-01 yang tidak dipilih tetap tidak ditampilkan dalam laporan.

## Persyaratan
- Tidak ada migrasi SQL baru. Migrasi sampai 025 harus sudah diterapkan.
- Gunakan `.env.local` milik sendiri, jangan masukkan ke ZIP dan jangan membagikan kredensial.

## Batas verifikasi
- Pemeriksaan sintaks statis sudah dijalankan.
- Production build dan uji Supabase nyata tidak tersedia; jangan menganggap fitur terbukti berjalan di deployment sebelum uji end-to-end.
