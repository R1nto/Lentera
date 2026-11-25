# LENTERA V12.9.5 — Interactions API

## Latar belakang
Kode **Get code** Google AI Studio untuk `gemini-3.8-flash` memakai endpoint `POST /v1beta/interactions`, bukan `POST /v1beta/models/{model}:generateContent` yang dipakai LENTERA sebelumnya.

## Perubahan
- Endpoint Uji Koneksi Admin memakai Gemini Interactions API, dengan prompt singkat dan timeout 30 detik.
- Generator Modul Ajar, Analisis, dan Refleksi memakai Interactions API dan `input` berupa teks perintah untuk menghasilkan JSON.
- Pembacaan respons berganti dari `candidates[].content.parts[]` ke `steps[].type=model_output` dan `content[].type=text`.
- Tidak mengaktifkan `google_search` untuk menjaga data pembelajaran agar tidak diteruskan ke pencarian web.
- Tidak melakukan fallback model otomatis, sehingga tidak memicu beberapa permintaan yang tak perlu.
- Konfigurasi tetap server-side (`GEMINI_API_KEY`, `GEMINI_MODEL`), Admin tidak meminta key.

## Cara memasang
1. Ekstrak ZIP dan pindahkan `.env.local` milik sendiri (jangan masukkan ke repositori/ZIP).
2. Set `GEMINI_MODEL=gemini-3.8-flash` dan gunakan **API key baru** yang belum pernah dibagikan.
3. Instal dependensi (`npm ci`), jalankan `npm run dev`.
4. Masuk Admin, klik Uji Koneksi. Setelah berhasil, coba Modul Ajar.

## Batas verifikasi
Tiga file TS yang diperbarui telah lolos pemeriksaan sintaks TypeScript. Belum ada production build atau uji Gemini/Supabase langsung pada project pengguna. Endpoint berbeda tidak menjamin kendala jaringan atau kuota hilang.
