# V12.12.1 — Perbaikan CP katalog kosong

- Katalog bawaan V12.12 **hanya** berisi 15 ringkasan elemen Matematika fase A–C, bukan semua mata pelajaran.
- Endpoint sekarang mengenali nama mapel Matematika berdasarkan kode stabil `MTK` dan beberapa variasi nama.
- Jika tidak ada CP, UI membedakan katalog tidak terisi/migrasi 026 belum dijalankan dari mapel yang memang belum terkurasi. Dilengkapi tombol **Muat ulang katalog**.
- Saran CP otomatis hanya dipilih jika topik jelas cocok dengan elemen (contoh: aljabar → Aljabar). Bila tidak ada kecocokan, Guru memilih sendiri, tanpa saran yang mengada-ada.
- Tidak ada SQL tambahan. Jika SQL 026 belum dijalankan, jalankan migrasi aslinya pada Supabase project yang terhubung dengan LENTERA.
- Jangan melabeli ringkasan CP sebagai rumusan resmi lengkap; cocokkan dengan dokumen sumber.
- Koneksi Gemini dan publikasi Wali Murid tidak diubah.
