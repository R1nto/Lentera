# LENTERA V12.10.14 — Ringkasan UI Perkembangan Belajar

Pada halaman **Wali Murid → Perkembangan Belajar**, kartu identitas anak diperluas menjadi ringkasan perkembangan yang meliputi:
- Identitas siswa dan akses Profil Anak.
- Jumlah mata pelajaran yang memiliki laporan terbit.
- Jumlah asesmen yang dipublikasikan, dengan contoh nilai terbaru.
- Jumlah laporan pembelajaran yang diterbitkan.
- Jumlah indikator yang ditetapkan Guru sebagai Tercapai dibanding indikator dalam laporan.
- Ringkasan indikator yang memiliki bukti serta tautan ke halaman asesmen dan laporan.

Seluruh angka berasal dari `publishedAssessments` dan `progressData` yang sudah dimuat lewat endpoint yang ada. Perubahan ini tidak menambah request ke Supabase, migrasi SQL, ataupun mengubah status/nilai siswa.

Batasan: Ini perubahan frontend; tampilan aktual di browser dan production build belum diuji. Foto profil hanya tampil jika `avatar_url` tersedia; jika tidak, inisial tetap dipakai.
