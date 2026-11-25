# LENTERA V12.9.3 — Perbaikan 404 Gemini tanpa fetch looping

- Tetap membaca GEMINI_API_KEY / GEMINI_MODEL dari environment server.
- Saat `generateContent` mengembalikan **404**, mencoba model alternatif `gemini-3.8-flash` lalu `gemini-3.5-flash-lite`, masing-masing paling banyak satu kali.
- Kode selain 404 (misalnya 401/403 atau 429) **tidak** memicu fallback supaya kesalahan key dan kuota tidak disamarkan.
- Tombol Uji Koneksi menggunakan mekanisme yang sama dengan Modul Ajar dan menyebut model yang berhasil digunakan.
- Tidak menambah `useEffect`, timer, fetch daftar model, atau perubahan konfigurasi Supabase.
- Jika semua model 404, error tetap ditampilkan dengan jelas. Model alternatif tidak dijamin tersedia bagi setiap project.
- API key tidak dibundel; rotasi key yang pernah dibagikan dan isi `.env.local` di server saja.

Pemeriksaan sintaks dan ZIP bukan pengganti production build atau uji langsung ke Google.
