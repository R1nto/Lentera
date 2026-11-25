# LENTERA V12.9.10 — Kelengkapan PDF Modul Ajar

Perbaikan ekspor: menampilkan matriks kelengkapan bagian modul yang benar-benar tersedia di `teaching_modules.content`; menambahkan relasi TP pada kegiatan serta jenis asesmen, rubrik, dan indikator; dan menyertakan lampiran audit seluruh data tersimpan secara rekursif sehingga properti nested dan tambahan tidak terabaikan.

Lampiran bisa memperpanjang jumlah halaman karena sebagian data diulang untuk verifikasi. Bila data tidak tersedia dari Gemini, PDF menyebutkan bagian yang belum tersedia, bukan mengarang isinya.

Tidak ada migrasi SQL, perubahan API key, atau perubahan model. Production build dan hasil PDF dari Supabase asli belum terverifikasi.
