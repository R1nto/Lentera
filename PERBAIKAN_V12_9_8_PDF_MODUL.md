# V12.9.8 — Pratinjau dan PDF isi Modul Ajar

- Sebelumnya halaman daftar hanya mengambil metadata `teaching_modules` dan secara eksplisit membuat `LENTERA - RINGKASAN MODUL` satu halaman.
- Sekarang query mengambil `teaching_modules.content`, yaitu objek JSONB hasil AI yang disimpan endpoint `module-generator`.
- Dialog detail menampilkan isi modul (identitas, CP, TP, kegiatan, asesmen, diferensiasi, refleksi, dan bagian lain yang benar-benar ada pada objek).
- PDF menggunakan isi yang sama, membungkus teks dan menambahkan halaman serta nomor halaman sesuai kebutuhan.
- Jika konten modul kosong, fitur tidak lagi membuat PDF ringkasan yang disangka hasil lengkap. Guru melihat peringatan.
- Tidak mengubah API key, Gemini provider, autentikasi, atau migrasi SQL.

## Batasan pengujian

Dua file diubah dan lolos pemeriksaan sintaks melalui TypeScript transpiler. Production build, integrasi database, dan hasil PDF dengan data nyata belum dijalankan. Editor masih hanya mendukung perubahan **metadata**, belum penyuntingan per seksi modul.
