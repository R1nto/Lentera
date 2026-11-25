# LENTERA V12.10.5 — Publikasi asesmen untuk Wali Murid

1. Jalankan migrasi `supabase/migrations/025_assessment_publication_links.sql` setelah migrasi 021–024.
2. Guru → Asesmen → Input Nilai dan Simpan; kemudian dari daftar Asesmen klik **Publikasikan** pada asesmen yang berisi nilai.
3. Wali Murid terverifikasi → Hasil Asesmen dan Perkembangan Belajar. Nilai yang diterbitkan terlihat tanpa harus membuat sesi analisis.
4. Untuk indikator dan analisis per TP, Guru tetap menerbitkan Laporan Pembelajaran pada sesi terkait. Laporan kini turut mempertimbangkan asesmen yang terhubung melalui `module_id`.
5. Perubahan nilai setelah publikasi: tombol **Terbitkan ulang** menerbitkan kembali hasil siswa dengan nilai terbaru. Anak tanpa nilai tidak diterbitkan.

Keamanan: endpoint publikasi memverifikasi cookie Guru, role, sekolah, kepemilikan asesmen, kelas siswa. Endpoint baca Wali Murid memverifikasi cookie, role, dan tautan siswa berstatus verified, lalu membatasi hasil ke siswa tersebut. Kredensial service role hanya ada di server.

Keterbatasan: status `is_published` menandakan pernah diterbitkan. Jika nilai berubah setelahnya, tekan Terbitkan ulang. Tabel `published_reports` tetap digunakan untuk laporan analisis per sesi, sedangkan Perkembangan Belajar juga menampilkan daftar nilai yang telah dipublikasikan tanpa mengarang metrik TP.
