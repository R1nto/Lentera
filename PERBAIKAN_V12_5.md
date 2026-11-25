# LENTERA V12.5 — Pengaman loading Modul Ajar

Perubahan: batas waktu loading daftar modul (18 detik), batas waktu data awal Buat Modul (18 detik), pesan error dan coba lagi, pengaman submit ganda, timeout 75 detik pada pemanggilan pembuatan modul, serta penghapusan unduhan font Google di layout.

Tidak ada migrasi SQL baru. Belum diuji langsung pada Supabase/Gemini pengguna. Jika loading lama berlanjut, cek status endpoint di terminal (bukan meminta DevTools Network). Timeout tidak membatalkan operasi di server secara transaksional; periksa daftar modul sebelum menekan ulang untuk menghindari duplikat.
