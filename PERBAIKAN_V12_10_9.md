# LENTERA V12.10.9 — Indikator laporan tanpa duplikat

## Perubahan
- Daftar indikator Guru dan publikasi Wali Murid memakai fungsi normalisasi yang sama (`src/lib/reports/indicators.ts`).
- Modul Ajar asli diprioritaskan daripada snapshot sesi yang dapat menyimpan kode indikator buatan.
- Duplikat digabung berdasarkan deskripsi yang sudah dinormalisasi (termasuk jika deskripsi pada snapshot diawali kode indikator seperti `IND-01:`).
- Identitas indikator dari modul dibuat konsisten setelah deduplikasi; validasi pilihan siswa dan indikator di endpoint publikasi tetap diterapkan.
- Pencocokan bukti asesmen juga menyamakan deskripsi yang telah dinormalisasi.

## Hasil yang diharapkan
Dua indikator berbeda dari modul Aljabar hanya ditampilkan dua kali total (IND-01 dan IND-02), bukan empat entri. Laporan yang sudah terbit **tidak ditulis ulang otomatis**. Guru perlu memilih siswa dan kedua indikator lalu menekan **Terbitkan laporan** kembali untuk memperbarui snapshot laporan siswa yang dipilih.

## Batasan
Ini deduplikasi berdasar isi, bukan pengukuran ketercapaian. Bukti asesmen dan status tercapai tetap bergantung pada pemetaan serta kriteria penilaian yang tersedia. Tidak ada migrasi SQL. Pengujian logika dengan sampel Aljabar berhasil; end-to-end browser, database Supabase, dan production build belum diverifikasi.
