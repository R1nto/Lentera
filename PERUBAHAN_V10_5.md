# LENTERA V10.5 — Tingkat kelas SD

- Form Tambah Kelas Kepala Sekolah hanya menampilkan Kelas 1–6.
- Endpoint POST /api/kepala-sekolah/kelas menolak tingkat di luar 1–6.
- Pemetaan fase SD: kelas 1–2 fase A, kelas 3–4 fase B, kelas 5–6 fase C.
- Tidak ada perubahan database atau migrasi SQL baru.
- Perubahan ini tidak menghapus data kelas lama yang sudah tersimpan.
