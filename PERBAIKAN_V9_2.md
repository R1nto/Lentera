# LENTERA V9.2 — Rollback CSS V9.1

Versi ini menggunakan source V9 yang lebih stabil, **bukan** CSS grid agresif V9.1.
Perubahan hanya pada toolbar di semua halaman yang memakai `.page-toolbar`:
- area pencarian dibatasi maksimal 440px pada layar desktop, tetapi tetap responsif;
- ikon pencarian berada di dalam input;
- kontrol filter dan ekspor dibiarkan dalam flex wrap yang sederhana;
- tidak mengubah kode permintaan ke Supabase dan tidak mengubah fungsi tombol.

## Batasan
Belum diuji rendering di browser atau production build. Jika tampilan perangkat tertentu tetap bermasalah, perlu pengujian pada ukuran layar dan screenshot yang sama.

Jangan salin `.env.local` lama yang kuncinya pernah dibagikan tanpa merotasi kredensial terkait.
