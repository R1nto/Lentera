# LENTERA V10.2 — Ilustrasi Ikon Kontekstual

Source: V10.1 dengan gaya dropdown ilustrasi tetap dipertahankan.

## Perubahan
- `src/components/ui/illustrated-icon.tsx`: ikon garis dibedakan menjadi ilustrasi SVG mini sesuai konteks (beranda, sekolah/kelas, siswa/akun, modul/buku, pembelajaran, analisis, asesmen, laporan, undangan, riwayat, profil/pengaturan, dan sistem).
- Ilustrasi dibagikan secara konsisten ke sidebar semua role, kartu metrik/aksi cepat Guru, Kepala Sekolah, Wali Murid, dan Admin melalui komponen bersama.
- Tampilan kosong pada beberapa daftar Guru menggunakan ilustrasi dan tetap menampilkan pesan aslinya.
- Ikon tombol operasional kecil seperti Tutup, Edit, Unduh, dan navigasi tetap sederhana demi kejelasan affordance dan aksesibilitas.
- CSS dropdown status V10.1 dipertahankan. Tidak ada perubahan API, RLS, atau database.

## Validasi dan batasan
109 file TS/TSX lolos pemeriksaan parse sintaks TypeScript. Tidak ada klaim bahwa production build / rendering browser / alur Supabase telah diuji. Ilustrasi menggunakan SVG internal React, tanpa ketergantungan pada gambar atau API eksternal.

## Menjalankan
Salin file .env.local sendiri (jangan commit atau kirimkan secret key), kemudian `npm ci`, `npm run build`, `npm run dev`. Bila menimpa folder proyek lama, bersihkan cache `.next` dan lakukan hard refresh.
