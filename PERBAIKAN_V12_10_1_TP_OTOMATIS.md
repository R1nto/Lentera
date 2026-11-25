# LENTERA V12.10.1 — TP otomatis dari Modul Ajar pada Asesmen

## Perubahan
- Saat Guru memilih Modul Ajar, halaman Asesmen membaca `teaching_modules.content.learningObjectives` dan menampilkan TP serta indikator secara otomatis; dropdown TP manual hanya tampil saat opsi **asesmen mandiri** dipilih.
- Ketika modul mengandung tepat satu ID TP kurikulum yang tersedia, asesmen memakai ID tersebut beserta ID indikator terkait secara otomatis.
- Ketika modul berisi TP hasil Gemini berbentuk teks (`TP-01`, `IND-01`) tetapi belum terkait UUID kurikulum, teksnya disimpan dalam `assessment_activities.module_tp_snapshot`. Tidak dibuat ID kurikulum fiktif.
- Jika ada beberapa ID TP kurikulum dalam satu modul, snapshot semua TP disimpan dan kolom `learning_objective_id` tidak diisi sembarangan.

## Instalasi
1. Pertahankan `.env.local` secara lokal; **jangan** unggah API key ke repositori atau ZIP.
2. Setelah migrasi `021`, jalankan `supabase/migrations/022_assessment_module_tp_snapshot.sql` melalui SQL Editor Supabase.
3. Jalankan LENTERA dan buka **Guru → Asesmen → Buat Asesmen**.
4. Pilih kelas, mata pelajaran, Modul Ajar; periksa panel TP dan indikator otomatis.

## Batasan
- Snapshot teks mempertahankan rujukan asesmen ke modul, tetapi **belum otomatis menjadikan teks TP tersebut sebagai TP kurikulum**. Analisis ketercapaian per TP yang bergantung pada ID TP/indikator kurikulum memerlukan pemetaan lebih lanjut.
- `npm run build` dan pengujian Supabase langsung belum dilakukan di lingkungan ini. Perubahan sintaks file TSX diperiksa dengan TypeScript transpile.
