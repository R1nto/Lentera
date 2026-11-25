# LENTERA V9.5 — perbaikan regresi toolbar V9.4

- Mengganti `ListFilterToolbar` agar tata letak utama dan kontrol tidak lagi bergantung pada CSS Module yang pada screenshot V9.4 tampak tidak aktif.
- Tata letak memakai flex-wrap: pencarian fleksibel, filter dan ekspor berdampingan; pada layar sempit terbungkus secara alami.
- Label pencarian/filter tetap tersedia bagi pembaca layar.
- Berlaku pada Guru → Pembelajaran (`/guru/analisis`) dan Guru → Modul Ajar (`/guru/modul-ajar`).
- Tidak mengubah query, RLS, migrasi, atau logika ekspor; data kosong tetap menonaktifkan ekspor.

Validasi: pemeriksaan struktur dan sintaks statis; tampilan browser/production build belum diuji secara langsung.
