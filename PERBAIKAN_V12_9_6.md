# LENTERA V12.9.6 — Pengaman Uji Koneksi Gemini

Patch dari V12.9.5 berdasarkan log `UND_ERR_CONNECT_TIMEOUT` dan respons HTTP 503.

- Mencegah klik Uji Koneksi bertumpuk menggunakan `useRef` yang aktif seketika, ditambah status tombol.
- Satu Uji Koneksi aktif per proses Node.js; request tambahan dibalas `409 / AI_TEST_IN_PROGRESS` dan tidak diteruskan ke Gemini. Ini **bukan distributed lock** untuk deployment multi-instance.
- Uji koneksi browser berhenti setelah 40 detik, tanpa auto-retry. Batas server tetap 30 detik; koneksi transport dapat gagal lebih cepat.
- HTTP 5xx dari jalur API dicatat sebagai `upstreamHttpStatus`; error ditampilkan sebagai HTTP 502 dari LENTERA, sambil menyertakan status HTTP asli dalam pesan aman.
- Tidak mengubah Gemini model, API key, database, ataupun generator Modul Ajar. Tidak menambahkan pengambilan model otomatis.

**Batasan:** patch tidak memperbaiki jaringan atau layanan upstream yang mengembalikan HTTP 503 dan tidak membuktikan koneksi Google API berhasil. Rotasi API key yang pernah dibagikan di chat tetap diperlukan.
