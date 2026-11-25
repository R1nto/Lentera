# LENTERA V12.6 — Diagnostik kegagalan generasi Modul Ajar

## Yang berubah
- Memisahkan kegagalan jaringan, timeout, respons kosong, keluaran diblokir, JSON tidak valid, dan output Gemini terpotong dari pesan umum `MODULE_SERVER_ERROR`.
- Mengidentifikasi `finishReason=MAX_TOKENS` dari respons Gemini sebagai `AI_OUTPUT_TRUNCATED`.
- Menaikkan batas output token untuk generator Modul Ajar dari 8000 menjadi 12000. Ini dapat meningkatkan biaya/pemakaian token dan tidak menjamin output akan selalu valid.
- Membatasi waktu koneksi provider AI menjadi 60 detik, tetap lebih pendek dari batas 75 detik di browser.
- Tidak mengubah GRANT, RLS, isi kurikulum, kredensial, atau logika kepemilikan data.

## Batasan
Perbaikan ini memisahkan penyebab kegagalan dan mengurangi satu jenis pemotongan respons. Belum ada pengujian AI langsung di project pengguna. Jika pesan tetap MODULE_SERVER_ERROR, lihat catatan terminal `Module creation failed` yang sekarang menyertakan `stage`, `code` dan `message` tanpa kredensial.
