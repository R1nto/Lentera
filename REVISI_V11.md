# V11 — Audit lintas role, permission baseline dan SD-only

Basis: V10.6. Perubahan:
- SQL 017: GRANT operasional sesuai endpoint/halaman yang ditemukan, tanpa membuka tabel Admin kepada authenticated/anon, plus CHECK jenjang SD.
- Diagnostik SQL read-only untuk daftar seluruh izin/RLS dan data kelas di luar SD.
- `api/teacher/setup`: verifikasi profil lewat service client dan filter tingkat 1–6.
- `api/teacher/sessions`: validasi fase SD dan penugasan Guru+mata pelajaran; verifikasi role server-side.
- `api/ai/module-generator`: kelas 1–6 diwajibkan dan divalidasi server-side, data dibaca dari backend dan modul draf disimpan melalui service client terotorisasi.
- `guru/asesmen/input`: penugasan wali kelas dengan subject_id NULL kini menampilkan mata pelajaran.
- `AUDIT_SEMUA_ROLE_V11.md`: matriks semua menu, daftar fitur belum lengkap, serta rencana uji negatif lintas sekolah.

Yang **tidak diklaim**: full end-to-end, tidak ada bug, semua CRUD/fitur lengkap, atau production build sukses. Jalankan migrasi hanya setelah backup database dan uji secara terbatas.
- SQL 018: hardening pada operasi tulis browser milik Guru (sesi, asesmen dan nilai), terikat kelas dan mata pelajaran yang ditugaskan serta siswa dalam kelas asesmen. Membutuhkan uji negatif lintas sekolah.
