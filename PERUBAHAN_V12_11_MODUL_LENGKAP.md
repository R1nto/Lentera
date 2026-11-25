# LENTERA V12.11 — Generator Modul Ajar Ringkas dan Lengkap

## Perubahan
- Menu Guru > Modul Ajar > Buat Modul: pilihan Ringkas / Lengkap (default: Lengkap).
- Guru dapat memasukkan rumusan CP dan sumber sesuai dokumen kurikulum yang diperiksa sekolah. Tidak ada scraping CP atau klaim otomatis CP sudah disahkan.
- Keluaran modul lengkap mencakup perencanaan pembelajaran mendalam, bahan ajar, LKPD dan kunci Guru, instrumen asesmen diagnostik/formatif/sumatif, pedoman penskoran, rubrik, dan catatan keselarasan kurikulum.
- Pratinjau dan ekspor PDF menggunakan isi terstruktur yang sama. Lampiran hanya dicetak bila benar-benar tersedia pada hasil AI.
- Rumusan CP AI tidak boleh mengganti CP yang berasal dari tabel kurikulum atau teks Guru. TP yang diusulkan AI tanpa ID kurikulum tidak dibuat seolah-olah memiliki ID resmi.
- Tidak ada perubahan skema database atau migrasi SQL. Struktur identitas CP/TP/indikator tetap digunakan.

## Pemasangan
1. Gunakan source ZIP ini dan `.env.local` milik sendiri yang aman; tidak disertakan dalam paket.
2. Pastikan migrasi sebelumnya sampai 025 telah berlaku sesuai instalasi LENTERA terakhir.
3. Instal dependensi (`npm ci`) jika diperlukan lalu jalankan `npm run dev`.
4. Buka Guru > Modul Ajar > Buat Modul; pilih Ringkas atau Lengkap, isi konteks kelas dan CP resmi jika tersedia.
5. Tinjau hasil AI sebelum menyimpan / mengunduh PDF; periksa kebenaran CP, TP, jawaban soal, rubrik, tingkat kelas, dan alokasi waktu.

## Batasan jujur
- Pemeriksaan sintaks 122 TS/TSX lolos; production build dan pengujian runtime ke Gemini dan Supabase belum dapat dilakukan di lingkungan ini.
- Respons Kompleks tetap berisiko gagal/terpotong sesuai kuota model dan batas waktu yang ada. Draf yang tidak lengkap ditandai; tidak dibuat lampiran fiktif.
- CP dalam teks Guru belum otomatis diverifikasi terhadap katalog peraturan. Pemeriksaan substansi CP resmi dan revisi Guru tetap diperlukan.
- Tidak menambah indikator resmi atau mengubah nilai/snapshot asesmen yang sudah dipublikasikan.

## Referensi resmi untuk verifikasi Guru
- Panduan Pembelajaran dan Asesmen Revisi 2025: https://kurikulum.kemendikdasmen.go.id/file/1755670818_manage_file.pdf
- Panduan Mata Pelajaran: https://kurikulum.kemendikdasmen.go.id/panduan-mapel
- Pembelajaran Mendalam: https://kurikulum.kemendikdasmen.go.id/pembelajaran-mendalam
- Permendikdasmen 13 Tahun 2025: https://kurikulum.kemendikdasmen.go.id/berita/detail/ringkasan-permendikdasmen-nomor-13-tahun-2025-tentang-perubahan-atas-peraturan-menteri-pendidikan-kebudayaan-riset-dan-teknologi-nomor-12-tahun-2024-tentang-kurikulum-pada-pendidikan-anak-usia-dini-jenjang-pendidikan-dasar-dan-jenjang-pendidikan-menengah
