# LENTERA V12.9.13 — Perbaikan isi PDF Modul Ajar

PDF V12.9.12 melewatkan bagian F, G, H ketika Gemini mengembalikan bentuk data yang berbeda dari skema yang diharapkan. Pratinjau menerima objek atau array, tetapi ekspor PDF sebelumnya hanya menerima array untuk kegiatan dan asesmen, serta array untuk nilai diferensiasi.

Perbaikan dalam `src/lib/module-pdf.ts`:
- Kegiatan `introduction/main/closing` menerima satu objek atau array, juga nama tahap alternatif.
- Asesmen menerima array datar maupun objek dikelompokkan `diagnostic/formative/summative`.
- Diferensiasi konten/proses/produk menerima teks atau array.
- Aktivitas Guru, aktivitas siswa, durasi dan TP terkait tidak dibuang.
- Metode, model, dan media tetap diambil dari data modul; tidak ditambah secara fiktif.

Pengujian: pemeriksaan sintaks TypeScript dan simulasi renderer PDF dengan data Aljabar (ketiga bagian yang hilang berhasil dicetak). **Build production dan PDF asli di browser belum diuji**, karena dependensi aplikasi tidak lengkap di lingkungan pengujian. Tidak diperlukan migrasi SQL.
