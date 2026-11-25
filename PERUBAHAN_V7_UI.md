# LENTERA V7 — Dashboard UI Reference Edition

## Beranda yang diperbarui
- `/guru` — banner maskot, kelas, siswa, asesmen, pembelajaran terbaru dan aksi cepat.
- `/kepala-sekolah` — banner maskot, metrik sekolah, aktivitas kelas, analisis dan undangan wali murid.
- `/wali-murid` — banner maskot, profil anak, perkembangan berdasarkan laporan terbit, asesmen dan laporan.
- `/panel-internal-lentera` — banner admin, aksi kelola sekolah/staf, status AI dan formulir yang sudah ada.

Menggunakan komponen React `src/components/dashboard/home-kit.tsx` serta CSS khusus pada `src/app/globals.css`. Efek animasi ringan menghormati prefers-reduced-motion. Semua kartu navigasi mengarah ke halaman yang tersedia. Gambar konsep UI sebelumnya hanya referensi; dashboard sebenarnya adalah elemen React dan tetap menggunakan query aplikasi.

## Menjalankan
1. Ganti project versi V6.7 dengan folder ini, atau merge perubahan UI ke project aktif.
2. Pindahkan konfigurasi `.env.local` milik sendiri secara lokal, **jangan masukkan secrets ke Git/ZIP**. Rotasi secret key Supabase jika pernah dibagikan.
3. Pastikan migrasi database sebelumnya sudah diterapkan secara berurutan; V7 tidak memerlukan migrasi SQL tambahan untuk perubahan beranda. File 011 yang sebelumnya terpisah sekarang disertakan di direktori migrasi.
4. `npm ci && npm run build && npm run dev`.
5. Uji login masing-masing role dan penulisan/pembacaan Supabase di proyek sendiri.

## Pengujian yang dapat dikonfirmasi di lingkungan pembuatan
- AST parser TypeScript: 101 file TS/TSX, 0 syntax errors.
- ZIP integritas: diperiksa saat pengepakan.
- Production build: tidak dapat diverifikasi, karena npm ci --offline gagal pada dependensi yang tidak ada di cache (`zod-validation-error`).
- Integrasi langsung dengan Supabase: belum diuji.

## Catatan desain
Tidak ada skor fiktif, jadwal, notifikasi, atau metrik performa yang dibuat-buat; tampilan menunjukkan data yang sudah tersedia atau empty state. Beranda Guru dan Wali Murid menggunakan daftar publikasi/data yang sudah diambil source code. Dashboard bukan hasil screenshot statis.
