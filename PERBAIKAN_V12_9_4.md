# LENTERA V12.9.4 — Diagnostik jaringan Gemini

- `AI_NETWORK` sebelumnya menyembunyikan semua exception `fetch` selain timeout.
- Kini `AI_DNS`, `AI_TLS`, `AI_CONNECTION`, `AI_TIMEOUT`, dan `AI_NETWORK` dibedakan pada Uji Koneksi Admin, layanan AI, dan Generator Modul Ajar.
- Terminal mencatat hanya kode alasan dari Node (mis. `ENOTFOUND`) dan kategori, **bukan** API key atau isi error upstream.
- Tidak ada fetch otomatis baru, perubahan database, atau percobaan berulang baru.
- Ini hanya memperbaiki diagnosis; jika DNS/firewall/proxy benar-benar memblokir, konfigurasi jaringan harus diperbaiki pada mesin yang menjalankan Next.js.
- Simpan `GEMINI_API_KEY` hanya pada `.env.local`, jangan dibagikan. Rotasi key yang sempat dikirim dalam chat.
