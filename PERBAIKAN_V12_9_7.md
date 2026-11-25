# LENTERA V12.9.7 — Transport Modul Ajar Gemini

## Masalah yang ditangani

`Module creation failed: { stage: 'ai', message: 'AI_TIMEOUT: ...' }` dan respons POST /api/ai/module-generator 504 dalam sekitar 11 detik, padahal layanan AI memberi batas 60 detik. Node.js fetch (Undici) dapat memunculkan `UND_ERR_CONNECT_TIMEOUT` di sekitar 10 detik saat membuka koneksi.

## Perubahan

- Generator AI Gemini memakai `node:https` alih-alih `fetch` Node.js. Batas total koneksi sampai pembacaan respons 65 detik dan respons dibatasi 3 MiB.
- Tidak menambahkan retry, polling, atau fetch daftar model. Modul Ajar tetap mengirim satu permintaan Gemini per klik.
- Menjaga JSON request `POST /v1beta/interactions` dan respons yang sudah ada.
- Klasifikasi error jaringan mengenali kode error langsung dari `node:https` selain error yang dibungkus `cause`.
- Uji Koneksi Admin tidak diubah: model gemini-3.1-flash-lite sebelumnya telah terbukti berhasil dari server pengguna.

## Instalasi

Pertahankan `.env.local` milik Anda (jangan simpan dalam ZIP / repository), terutama `GEMINI_MODEL=gemini-3.1-flash-lite`, lalu jalankan `npm ci` dan `npm run dev`. Jangan menaruh API key langsung pada source code.

## Batas verifikasi

Sintaks 3 file yang disentuh lolos transpilasi TypeScript. Build tidak dapat dijalankan karena dependensi node_modules tidak tersedia di lingkungan pemeriksaan. Panggilan API ke Google menggunakan kredensial pengguna dan penyimpanan Supabase juga belum dapat diuji. HTTP 503 / respons lambat model dari layanan Google tetap mungkin terjadi, dan keluaran JSON modul panjang bisa gagal karena batas token/kualitas respons.
