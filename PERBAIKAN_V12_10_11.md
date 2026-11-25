# LENTERA V12.10.11 — Penetapan Ketercapaian Indikator oleh Guru

## Perubahan
- Guru → Laporan untuk Wali Murid: setelah memilih siswa dan indikator, Guru dapat menetapkan **Belum Dinilai**, **Tercapai**, atau **Belum Tercapai** untuk **setiap kombinasi siswa dan indikator**.
- Keputusan Tercapai / Belum Tercapai wajib disertai **kriteria ketercapaian** (minimal 5 karakter) dan **catatan bukti atau pengamatan** (minimal 8 karakter). Hasil asesmen keseluruhan (misalnya 100/100) tidak otomatis mengubah status indikator.
- Server memvalidasi siswa, indikator, keputusan, dan panjang catatan; hanya Guru pemilik sesi sekolah/kelas tersebut boleh menerbitkan.
- Status dan catatan Guru tersimpan **dalam `published_reports.report_snapshot.indicator_progress[*].teacher_assessment`**. Nilai asli `assessment_results` tidak diubah. Tidak diperlukan SQL baru.
- Pilihan Guru yang sudah diterbitkan dimuat kembali untuk peninjauan dan penerbitan ulang agar tidak hilang karena form ter-reset.
- Wali Murid → Laporan Pembelajaran dan Perkembangan Belajar menampilkan status serta catatan dan kriteria Guru; pengamatan tertulis Guru ikut dihitung sebagai bukti penilaian, tetapi tidak direkayasa menjadi skor atau persentase.

## Cara penggunaan
1. Pilih sesi Aljabar, centang Rizky dan indikator yang akan dibagikan.
2. Pada **3. Tinjau ketercapaian**, pilih `Tercapai`, `Belum Tercapai`, atau `Belum Dinilai` per indikator. Bila memilih dua status pertama, isi kriteria dan catatan bukti nyata.
3. Centang bagian laporan dan klik **Terbitkan laporan**.
4. Di akun Wali Murid, buka **Perkembangan Belajar** dan **Laporan Pembelajaran**. Status diperbarui tanpa input ulang nilai 100/100.

## Catatan keselamatan dan batasan
- Ini adalah keputusan pedagogis Guru berdasarkan bukti, **bukan keputusan otomatis AI**.
- Jika Guru tidak mempunyai bukti, biarkan Belum Dinilai. Tidak ada status Tercapai otomatis dari satu nilai asesmen.
- Keputusan baru diperlihatkan ke Wali Murid sesudah Guru menerbitkan laporan.
- Pemeriksaan sintaks berhasil, tetapi production build, SQL live, dan end-to-end autentikasi tidak dapat dijalankan di lingkungan ini.
