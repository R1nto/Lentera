# LENTERA V12.3 — Google Gemini di Admin

- Login Admin di `/lentera-system-access`, buka `/panel-internal-lentera`.
- Pada Konfigurasi AI pilih **Google Gemini**.
- Model awal `gemini-2.5-flash` (pastikan tersedia di project Google AI Studio).
- Buat API key di https://aistudio.google.com/api-keys, tempel ke kolom API Key lalu **Simpan konfigurasi**, **Uji koneksi**.
- Key disimpan terenkripsi memakai `APP_ENCRYPTION_KEY`, dan dipakai hanya oleh backend.
- Saat berganti dari OpenAI/Anthropic ke Gemini, **API key baru wajib diisi**.
- Semua generator yang menggunakan `createAIProvider` (Modul Ajar, Analisis Pembelajaran dan Refleksi) otomatis memakai provider yang dipilih.
- Tidak diperlukan migrasi database baru bila migrasi 008 `platform_settings` sudah ada.
- Layanan eksternal belum diuji karena tidak ada akses API key pengguna.
- Kuota gratis Gemini terbatas; output pedagogis harus diperiksa Guru.
