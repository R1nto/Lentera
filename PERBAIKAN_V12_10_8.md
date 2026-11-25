# LENTERA V12.10.8 — Pilih siswa dan indikator saat publikasi laporan

## Perubahan
- Guru → Laporan untuk Wali Murid: pilih satu/beberapa/semua siswa aktif dalam kelas pada sesi terpilih; **tidak ada siswa terpilih secara default**.
- Pilih indikator CP/TP dari Modul Ajar atau snapshot sesi. Guru bisa memilih seluruh atau sebagian indikator.
- Tinjau banyaknya siswa, indikator dan pasangan siswa–indikator dengan bukti asesmen yang memang telah dipublikasikan dan dipetakan ke indikator.
- Server memvalidasi pemilik sesi, sekolah, kelas, daftar siswa dan indikator berdasarkan data Supabase, bukan mempercayai pilihan dari browser.
- Upsert `published_reports` hanya untuk siswa yang dipilih. Laporan siswa lain (termasuk laporan lama) tidak diubah.
- Indikator tanpa bukti tetap dapat diterbitkan dengan status `insufficient_data`, bukan dicap tercapai.
- Daftar pilihan dibaca dari `GET /api/reports/publish?session_id=...`, dengan otorisasi Guru dan header no-store.

## Cara memakai
1. Jalankan source terbaru dan masuk sebagai Guru.
2. Buka Laporan untuk Wali Murid; pilih sesi yang terhubung ke Modul Ajar.
3. Centang nama siswa yang akan menerima laporan; lalu pilih indikator yang relevan.
4. Tinjau ringkasan bukti dan atur bagian laporan/catatan, kemudian klik Terbitkan laporan.
5. Periksa akun Wali Murid terverifikasi.

Tidak ada migrasi SQL baru di versi ini, dengan prasyarat migrasi hingga 025 sudah diterapkan.
Tidak menghapus hasil asesmen, tidak mengubah Gemini, dan tidak menerbitkan ulang laporan siswa yang tidak dipilih.

## Status validasi
Syntax/transpile semua file TS/TSX lolos; pengujian normalisasi indikator dua item lolos; production build dan Supabase end-to-end belum dijalankan.
