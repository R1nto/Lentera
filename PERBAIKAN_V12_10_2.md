# LENTERA V12.10.2 — CP/TP otomatis di Analisis

- **Analisis → Buat Pembelajaran Baru:** saat Guru memilih Modul Ajar yang sesuai kelas/mata pelajaran, CP, TP, dan indikator dibaca dari `teaching_modules.content` dan ditampilkan tanpa checkbox maupun form tambah kurikulum.
- **Tanpa modul:** pemilihan dan pembuatan CP/TP manual tetap tersedia.
- **Penyimpanan:** backend mengambil kembali konten modul setelah memverifikasi kepemilikan guru, sekolah, kelas, dan mata pelajaran; snapshot teks CP/TP/indikator disimpan dalam `learning_sessions.module_curriculum_snapshot`.
- **Penting:** snapshot hasil Gemini tidak otomatis menjadi UUID kurikulum. Analisis berbasis ID TP kurikulum tetap membutuhkan pemetaan yang sah; patch ini tidak mengarang ketercapaian atau menyatukan dua skema secara semu.
- **Migrasi:** jalankan 021, 022 (jika diperlukan untuk asesmen), lalu **023_session_module_curriculum_snapshot.sql** pada database yang sama dengan aplikasi.
- **Modul lama:** bisa dipilih apabila `content` memuat `learningOutcomes` dan `learningObjectives`. Jika tidak, halaman memberi peringatan dan penyimpanan dengan modul tersebut ditolak agar tidak menghasilkan sesi tanpa CP/TP.
- **Pengujian:** lint sintaks dan struktur ZIP; belum diuji dengan database live dan build produksi.
