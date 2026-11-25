# LENTERA V12.9.1 — Next.js 16 Admin blocking prerender

Error: `Next.js encountered the unstable value Date.now() while prerendering`, call stack `PlatformAdminPage`.

Penanganan:
- Pindahkan pemeriksaan sesi Supabase ke komponen async yang berjalan setelah `await connection()`.
- Bungkus komponen tersebut dengan `Suspense` agar Cache Components tidak memblokir prerender shell.
- Pertahankan `cacheComponents`, otorisasi Admin, redirect, serta konfigurasi Gemini dari environment.
- Tidak menambah `export const dynamic = 'force-dynamic'` (tidak kompatibel dengan cacheComponents).

Catatan: ini mengatasi pola render yang ditunjukkan pada screenshot, bukan bukti bahwa koneksi Gemini atau seluruh aplikasi telah lulus end-to-end.
