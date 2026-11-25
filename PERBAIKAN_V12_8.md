# LENTERA V12.8 — Perbaikan pemilihan model Gemini

- Model default Gemini pada Admin diganti dari `gemini-2.5-flash` menjadi `gemini-3.8-flash`.
- Endpoint server `GET /api/admin/ai-config/models` meminta daftar model Gemini API menggunakan API key tersimpan; tidak mengirim key ke browser.
- Tombol **Ambil daftar model Gemini** dan dropdown pemilih model ditambahkan pada Admin.
- Daftar dibatasi untuk model Gemini yang mendukung `generateContent`; model khusus audio/image/embedding dikecualikan.
- Daftar model bukan jaminan izin generateContent; **Simpan konfigurasi** dan **Uji koneksi** tetap harus dilakukan.
- Error HTTP 404 dari pengujian dibuat lebih berguna.
- Tidak ada perubahan skema SQL, RLS, atau penyimpanan API key.

**Catatan:** Model yang tersimpan pada versi lama tidak diganti otomatis agar tidak mengubah konfigurasi pengguna tanpa persetujuan. Pilih model baru di Admin dan simpan.
