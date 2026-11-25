# LENTERA V12.10.7 — indikator laporan dari Modul Ajar

- Saat Guru menerbitkan laporan, backend membaca `teaching_modules.content` jika sesi menggunakan Modul Ajar; kepemilikan, sekolah, kelas dan mapel diverifikasi.
- Indikator dari `module_curriculum_snapshot` dan dari modul digabung berdasarkan kode agar sesi lama yang snapshot-nya kosong tetap memiliki total indikator.
- Indikator tanpa bukti tetap tampil dengan status `insufficient_data`, **tidak** otomatis dianggap tercapai.
- Untuk memperbarui laporan lama, Guru harus menekan **Terbitkan ulang** pada Laporan Pembelajaran dengan sesi yang sama. Nilai asesmen tidak dihapus.
- Tidak perlu migrasi SQL baru jika migrasi sampai 025 sudah terpasang.
- Belum diuji menggunakan Supabase milik pengguna atau production build.
