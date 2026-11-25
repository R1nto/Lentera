# V12.12.6 — perbaikan prerender Vercel
Berdasarkan log commit 006e7ec: TypeScript lolos, prerender /guru/asesmen/input gagal karena new Date() pada render awal.
- Input Asesmen dan Buat Sesi Pembelajaran: tanggal awal kosong, lalu diisi melalui useEffect dengan tanggal lokal browser; tanggal yang sudah dipilih tidak ditimpa.
- Footer: tahun dihitung oleh komponen client kecil setelah mount.
- Cache Components dan konfigurasi TypeScript tetap. Tidak ada migrasi SQL atau perubahan Gemini.
- Pemeriksaan sintaks menggunakan TypeScript parser; build penuh belum diuji karena dependensi proyek tidak tersedia di lingkungan ini.
