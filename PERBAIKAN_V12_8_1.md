# LENTERA V12.8.1 — Perbaikan kompatibilitas Next.js 16

## Penyebab
Route `src/app/api/admin/ai-config/models/route.ts` pada V12.8 berisi `export const dynamic = 'force-dynamic'`. Deklarasi tersebut tidak didukung ketika `cacheComponents: true` diaktifkan pada `next.config.ts` (Next.js 16).

## Perbaikan
Menghapus deklarasi `dynamic` dari route daftar model Gemini. Header `Cache-Control: no-store` dan `fetch(..., { cache: 'no-store' })` tetap ada. Tidak ada perubahan database, migrasi SQL, atau API key.

## Instalasi
1. Ekstrak paket ini menggantikan source V12.8.
2. Salin `.env.local` lama secara lokal (jangan kirim atau unggah API key).
3. Hentikan server, lalu jalankan `npm run dev`.
4. Masuk ke Admin > Konfigurasi Layanan AI > Ambil daftar model Gemini.

Catatan: Lolos pemeriksaan source untuk konflik route config, namun koneksi ke Gemini dan build produksi memerlukan pengujian pada lingkungan aplikasi Anda.
