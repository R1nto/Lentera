# LENTERA V12.10.10 — Konsistensi cakupan indikator dan bukti

- Laporan baru menyimpan `total_module_indicators` (jumlah indikator unik pada sesi/modul), terpisah dari indikator yang dipilih Guru.
- Wali Murid melihat `Indikator dibagikan: 1/2` jika Guru hanya mencentang satu dari dua indikator. Ini berbeda dari `indikator memiliki bukti`.
- Perkembangan Belajar menangani `evidence_only` sebagai **Ada Bukti, belum ditetapkan tercapai**, bukan **Data Kurang**.
- Grafik pencapaian tidak lagi menggambar batang 0% jika belum ada persentase ketercapaian yang sah.
- Untuk laporan yang sudah diterbitkan, Guru perlu **Terbitkan ulang**. Laporan lama tanpa metadata total tetap memakai jumlah indikator yang terkandung dalam snapshot, agar tidak mengarang denominator.
- Tidak ada migrasi SQL baru: metadata disimpan dalam `published_reports.report_snapshot` JSON.
- Skor keseluruhan asesmen tidak dipakai sebagai bukti ketercapaian semua indikator.
