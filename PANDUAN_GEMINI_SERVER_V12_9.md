# LENTERA V12.9 — Gemini langsung dari environment server

## Pemasangan
1. Salin `.env.example` menjadi `.env.local` apabila belum ada. Jangan mengunggah `.env.local` ke Git atau membagikannya.
2. Isi `GEMINI_API_KEY` dengan API key milikmu dari Google AI Studio.
3. Isi `GEMINI_MODEL` dengan nama model yang memang dapat digunakan proyek Google-mu (contohnya periksa daftar model di dokumentasi/API Google di luar LENTERA). Jangan memakai nama model tebakan.
4. Restart `npm run dev` (atau restart deployment). Variabel server dibaca ketika aplikasi dijalankan.
5. Panel Admin kini hanya menampilkan status dan tombol **Uji koneksi Gemini**. Modul Ajar, Refleksi, dan Analisis menggunakan konfigurasi server yang sama.

## Perubahan penting
- Konfigurasi AI pada tabel `platform_settings` **tidak lagi dibaca**; nilai AI lama di database tidak dapat menimpa environment.
- Endpoint `PUT /api/admin/ai-config` kini menolak perubahan (405).
- Endpoint `/api/admin/ai-config/models` dihapus; tidak ada lagi fetch daftar model dari halaman Admin.
- Tidak ada perubahan migrasi SQL ataupun Supabase RLS.
- Tidak ada API key yang ditanam dalam file TypeScript atau dikemas dalam ZIP.
- Jika key atau model salah, Gemini masih akan menolak permintaan; perubahan ini tidak dapat menghilangkan kuota atau batas izin Google.

**Keamanan:** Jika API key pernah dibagikan kepada pihak lain, rotasi key terlebih dahulu. `.env.local` dan secret hosting wajib dijaga tetap privat.
