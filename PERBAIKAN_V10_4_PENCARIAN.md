# LENTERA V10.4 — Penyelarasan Pencarian Lintas Role

Basis: V10.3. Tidak ada perubahan skema Supabase atau migrasi baru.

- Membuat `src/components/ui/search-field.tsx`: kontrol pencarian bersama yang responsif, label aksesibel, dan tombol hapus.
- Guru: kontrol pencarian pada Pembelajaran/Analisis, Modul Ajar, Siswa, Asesmen, dan Riwayat diseragamkan tanpa mengganti fungsi filter datanya.
- Kepala Sekolah: pencarian daftar monitoring memakai komponen sama.
- Admin: menambahkan pencarian lokal pada daftar akun staf (nama, NIP/ID, peran, sekolah) dan jumlah hasil. Pencarian hanya terhadap maksimal 100 akun yang sudah dimuat.
- Wali Murid: menambahkan pencarian lokal pada laporan yang telah dipublikasikan dan status tidak ditemukan. Pencarian hanya pada laporan yang telah dimuat (maksimal 30 laporan).
- Tombol X mengosongkan pencarian dan memulihkan hasil tanpa refresh.

Batasan:
- Belum ada pencarian universal seluruh data atau pencarian server-side/pagination.
- Belum menjalankan `npm run build` atau pengujian browser dan Supabase langsung; parse 111 file TypeScript/TSX lolos.
- Perubahan tidak menjamin bahwa semua bug UI lain sudah diselesaikan.
