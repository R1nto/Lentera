# LENTERA V12.4 — Diagnostik Modul Ajar Gemini

Perubahan terbatas pada `src/app/api/ai/module-generator/route.ts`.

- Membedakan error Gemini (`AI_AUTH`, `AI_LIMIT`, `AI_MODEL_NOT_FOUND`, `AI_REQUEST_REJECTED`, `AI_UPSTREAM`) dari error internal umum.
- Menandai tahap kegagalan (`authentication`, `validation`, `ai`, `storage`, `logging`) di log server.
- Tidak menampilkan data siswa, isi prompt, atau API key dalam log diagnostik.
- Tidak mengubah API key, database, RLS, atau algoritme generasi Modul Ajar.

## Setelah memasang

1. Salin `.env.local` milik Anda yang sudah menggunakan kunci aman.
2. Jalankan `npm ci` dan `npm run dev`.
3. Buka Admin, pilih Gemini, simpan dan lakukan **Uji koneksi**.
4. Coba Buat Modul Ajar lagi.
5. Jika masih gagal, laporkan **kode error dan tahapan** dari UI serta **kode/status** pada log server, tanpa API key, token, atau data siswa.

## Batas verifikasi

Patch ini memperbaiki keterbacaan error dan beberapa respons yang sebelumnya salah diklasifikasikan. Penyebab sebenarnya dari pesan MODULE_SERVER_ERROR sebelumnya belum dapat dipastikan tanpa respons/log aktual. Belum diuji dengan Gemini maupun Supabase yang aktif.
