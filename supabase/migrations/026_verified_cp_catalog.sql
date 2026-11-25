-- LENTERA V12.12: catalog CP terkurasi berbasis dokumen resmi.
-- Catatan: seed di bawah berupa KUTIPAN BAGIAN dari elemen CP Matematika, bukan keseluruhan rumusan CP.
-- CP lainnya dapat ditambahkan setelah kurasi dokumen resmi oleh pengelola sekolah.
CREATE TABLE IF NOT EXISTS public.curriculum_cp_catalog (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code text NOT NULL UNIQUE,
  subject_name text NOT NULL,
  phase text NOT NULL CHECK (phase IN ('A','B','C')),
  element text NOT NULL,
  cp_excerpt text NOT NULL,
  source_title text NOT NULL,
  source_url text NOT NULL,
  source_version text NOT NULL,
  verified_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS curriculum_cp_catalog_lookup_idx ON public.curriculum_cp_catalog (phase, active, subject_name);
ALTER TABLE public.curriculum_cp_catalog ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.curriculum_cp_catalog FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.curriculum_cp_catalog TO service_role;

INSERT INTO public.curriculum_cp_catalog
(reference_code, subject_name, phase, element, cp_excerpt, source_title, source_url, source_version, verified_at, active)
VALUES
('BSKAP-046-2025-MAT-A-ALJ','Matematika','A','Aljabar',
 'Memahami makna tanda sama dengan dalam kalimat matematika penjumlahan dan pengurangan bilangan cacah sampai 20 menggunakan gambar; mengenali dan melanjutkan pola bukan bilangan.',
 'Lampiran II Keputusan Kepala BSKAP 046/H/KR/2025',
 'https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf','046/H/KR/2025',now(),true),
('BSKAP-046-2025-MAT-B-ALJ','Matematika','B','Aljabar',
 'Menemukan nilai yang belum diketahui pada kalimat matematika penjumlahan dan pengurangan bilangan cacah sampai 100 dengan sifat bilangan dan operasinya; mengembangkan pola gambar dan bilangan.',
 'Lampiran II Keputusan Kepala BSKAP 046/H/KR/2025',
 'https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf','046/H/KR/2025',now(),true),
('BSKAP-046-2025-MAT-C-ALJ','Matematika','C','Aljabar',
 'Menemukan nilai yang belum diketahui dalam kalimat matematika penjumlahan, pengurangan, perkalian, dan pembagian bilangan cacah sampai 1000; mengembangkan pola bilangan serta penalaran proporsional.',
 'Lampiran II Keputusan Kepala BSKAP 046/H/KR/2025',
 'https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf','046/H/KR/2025',now(),true)
ON CONFLICT (reference_code) DO UPDATE SET
  subject_name=EXCLUDED.subject_name,phase=EXCLUDED.phase,element=EXCLUDED.element,
  cp_excerpt=EXCLUDED.cp_excerpt,source_title=EXCLUDED.source_title,
  source_url=EXCLUDED.source_url,source_version=EXCLUDED.source_version,
  updated_at=now();
NOTIFY pgrst, 'reload schema';
-- Ringkasan BAGIAN elemen lain Matematika dari Lampiran II untuk memudahkan navigasi.
-- Semua teks pendek ini adalah ringkasan kurasi, bukan pengganti rumusan CP lengkap.
INSERT INTO public.curriculum_cp_catalog
(reference_code, subject_name, phase, element, cp_excerpt, source_title, source_url, source_version, verified_at, active)
VALUES
('BSKAP-046-2025-MAT-A-BIL','Matematika','A','Bilangan','Bilangan cacah sampai 100, penjumlahan dan pengurangan konkret sampai 20, pecahan setengah dan seperempat.','Lampiran II Keputusan Kepala BSKAP 046/H/KR/2025','https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf','046/H/KR/2025',now(),true),
('BSKAP-046-2025-MAT-B-BIL','Matematika','B','Bilangan','Bilangan sampai 10.000, operasi hitung, faktor dan kelipatan, pecahan, desimal, dan persen.','Lampiran II Keputusan Kepala BSKAP 046/H/KR/2025','https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf','046/H/KR/2025',now(),true),
('BSKAP-046-2025-MAT-C-BIL','Matematika','C','Bilangan','Bilangan sampai satu juta, operasi hitung sampai 100.000, KPK/FPB, pecahan dan desimal.','Lampiran II Keputusan Kepala BSKAP 046/H/KR/2025','https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf','046/H/KR/2025',now(),true),
('BSKAP-046-2025-MAT-A-UKR','Matematika','A','Pengukuran','Membandingkan panjang, berat dan waktu; pengukuran panjang serta berat dengan satuan tidak baku.','Lampiran II Keputusan Kepala BSKAP 046/H/KR/2025','https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf','046/H/KR/2025',now(),true),
('BSKAP-046-2025-MAT-B-UKR','Matematika','B','Pengukuran','Mengukur panjang dan berat dengan satuan baku; mengestimasi luas dan volume.','Lampiran II Keputusan Kepala BSKAP 046/H/KR/2025','https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf','046/H/KR/2025',now(),true),
('BSKAP-046-2025-MAT-C-UKR','Matematika','C','Pengukuran','Keliling dan luas bangun datar, durasi waktu, serta besar sudut.','Lampiran II Keputusan Kepala BSKAP 046/H/KR/2025','https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf','046/H/KR/2025',now(),true),
('BSKAP-046-2025-MAT-A-GEO','Matematika','A','Geometri','Mengenal bangun datar dan ruang, menyusun serta mengurai bentuk, dan posisi benda.','Lampiran II Keputusan Kepala BSKAP 046/H/KR/2025','https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf','046/H/KR/2025',now(),true),
('BSKAP-046-2025-MAT-B-GEO','Matematika','B','Geometri','Ciri bangun datar; menyusun dan mengurai bentuk bangun datar.','Lampiran II Keputusan Kepala BSKAP 046/H/KR/2025','https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf','046/H/KR/2025',now(),true),
('BSKAP-046-2025-MAT-C-GEO','Matematika','C','Geometri','Bangun ruang, visualisasi spasial, karakteristik bangun, dan lokasi pada peta petak.','Lampiran II Keputusan Kepala BSKAP 046/H/KR/2025','https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf','046/H/KR/2025',now(),true),
('BSKAP-046-2025-MAT-A-DAT','Matematika','A','Analisis Data dan Peluang','Mengelompokkan dan membandingkan data benda; menyajikan data dengan turus dan piktogram.','Lampiran II Keputusan Kepala BSKAP 046/H/KR/2025','https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf','046/H/KR/2025',now(),true),
('BSKAP-046-2025-MAT-B-DAT','Matematika','B','Analisis Data dan Peluang','Menyajikan dan menafsirkan data menggunakan tabel, piktogram, dan diagram batang.','Lampiran II Keputusan Kepala BSKAP 046/H/KR/2025','https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf','046/H/KR/2025',now(),true),
('BSKAP-046-2025-MAT-C-DAT','Matematika','C','Analisis Data dan Peluang','Menganalisis data dalam tabel dan diagram; membandingkan kemungkinan kejadian acak.','Lampiran II Keputusan Kepala BSKAP 046/H/KR/2025','https://bpmpbabel.kemendikdasmen.go.id/PPID/wp-content/uploads/2025/07/KepKaBSKAP-046_2025-ttg-CP.pdf','046/H/KR/2025',now(),true)
ON CONFLICT (reference_code) DO UPDATE SET cp_excerpt=EXCLUDED.cp_excerpt, source_title=EXCLUDED.source_title,source_url=EXCLUDED.source_url,source_version=EXCLUDED.source_version,updated_at=now();
