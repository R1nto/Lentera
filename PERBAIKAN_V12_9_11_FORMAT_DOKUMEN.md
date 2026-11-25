# LENTERA V12.9.11 – PDF Modul Ajar gaya dokumen Guru

Perbaikan ekspor PDF berdasarkan pola susunan modul ajar SD: Informasi Umum, Komponen Inti, kegiatan pembelajaran, asesmen, pengayaan/remedial, dan refleksi.

- Meniadakan tabel audit kelengkapan, appendix path JSON, dan ID teknis dari PDF cetak.
- Identitas dan asesmen tetap bertabel; TP/indikator berbentuk uraian bernomor.
- Kegiatan pendahuluan, inti, penutup dipecah per bagian dengan tabel 3 kolom supaya mudah dicetak.
- Tidak membuat data LKPD, rubrik rinci, atau soal latihan fiktif. Jika dibutuhkan, generator modul harus menyimpan konten lampiran tersebut terlebih dahulu.
- Tidak mengubah Gemini, Supabase, RLS, atau basis data.

Pemeriksaan: sintaks TypeScript file ekspor lolos. Production build dan pengujian PDF melalui browser belum dijalankan.
