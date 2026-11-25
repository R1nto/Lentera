# LENTERA V10 — Desain konsisten semua menu

## Cakupan
- Seluruh halaman dashboard Guru, Kepala Sekolah, Wali Murid dibungkus oleh `DashboardLayout` dengan satu design scope (`lentera-design-system`). Ini mencakup submenu dan halaman formulir yang memakai layout tersebut.
- Panel Admin memakai design scope yang sama.
- Konsistensi warna teks, latar, card, heading, tabel, input, tombol, toolbar, focus, dan responsive 640px.
- Komponen pencarian/filter `ListFilterToolbar` V9.5 tetap digunakan, dengan aturan mobile yang eksplisit.
- Membuang sisa CSS toolbar V9.3 yang menimpa aturan layout V9.5.
- Tidak mengubah API, database, query, autentikasi maupun RLS.

## Batas verifikasi
Pemeriksaan syntax dan integritas paket tidak menggantikan browser render/production build. Pengujian akhir pada desktop dan mobile serta fungsi Supabase tetap diperlukan.

## Cara menjalankan
1. Gunakan `.env.local` sendiri (jangan sertakan dalam ZIP).
2. `npm ci`, `npm run build`, lalu `npm run dev`.
3. Buka semua menu setiap role, periksa layout pada lebar 375px, 768px, dan desktop.
