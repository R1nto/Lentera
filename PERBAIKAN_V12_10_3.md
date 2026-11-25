# LENTERA V12.10.3 — Detail Analisis otomatis dari Modul Ajar

Ketika Guru memilih Modul Ajar pada **Analisis Ketercapaian → Buat Pembelajaran Baru**, enam kolom **Deskripsi Singkat, Materi & Sumber Belajar, Metode Pembelajaran, Model Pembelajaran, Media & Alat Bantu, dan Rencana Asesmen** akan disalin dari `teaching_modules.content` (hasil AI yang tersimpan).

- Deskripsi dirangkum dari topik, pemahaman bermakna, dan gambaran tahapan pembelajaran yang ada di modul.
- Materi mengambil `learningMaterials`; metode `learningMethods`; model `learningModel`; media `learningMedia`; asesmen mengambil data diagnostik, formatif, dan sumatif pada `assessments`.
- Semua kolom tetap **dapat diedit** Guru. Pengisian hanya terjadi ketika dropdown pilihan modul berubah, **tanpa effect/fetch berulang**.
- Mengubah modul mengganti rincian dengan data modul baru; memilih **tanpa modul** mengosongkan rincian hasil modul agar tidak tertukar.
- Bagian yang tidak tersimpan pada modul dibiarkan kosong (tidak dikarang).
- Data detail tetap disimpan sebagai `notes` melalui API sesi pembelajaran yang sudah ada; **tidak perlu migrasi SQL baru** untuk perubahan ini. Migrasi 021–023 tetap diperlukan bila belum dijalankan.

Pemeriksaan statis dan ZIP dilakukan, belum diuji browser live atau database Supabase milik pengguna.
