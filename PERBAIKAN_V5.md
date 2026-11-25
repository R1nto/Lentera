# LENTERA V5 – Patch stabilitas dan animasi

## Perbaikan
- Menghapus tiga deklarasi `force-dynamic` yang tidak kompatibel dengan `cacheComponents: true` (Next.js 16).
- Menambah endpoint `GET /api/admin/session` untuk memeriksa status admin tanpa ketergantungan pada konfigurasi AI.
- Login Admin memeriksa endpoint baru; akses tetap wajib melalui RPC Supabase `is_platform_admin`.
- Menghindari metadata favicon/OG/manifest yang menunjuk file tidak ada.

## Interaksi visual
- Maskot mengambang lembut pada hero.
- Section dan kartu muncul bertahap saat terlihat (IntersectionObserver).
- Hover, active, focus dan kontras disesuaikan.
- `prefers-reduced-motion` didukung, konten tetap muncul jika JS mati.

## Batas verifikasi
- Belum ada pengujian koneksi langsung ke Supabase. Migrasi SQL dan akun Admin perlu dikonfigurasi pada project yang benar.
- Jalankan `npm ci`, `npm run build`, `npm run lint` pada lingkungan dengan dependency.
