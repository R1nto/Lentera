-- Usulan pengembangan sekolah, bukan CP nasional.
BEGIN;
INSERT INTO public.curriculum_cp_catalog (reference_code,subject_name,phase,element,cp_excerpt,source_title,source_url,source_version,verified_at,active) VALUES
('LENTERA-SEKOLAH-IPAS-A-01','Ilmu Pengetahuan Alam dan Sosial (IPAS)','A','Tubuh dan indra','Mengenali anggota tubuh dan fungsi indra melalui pengamatan sederhana.','Usulan pengembangan sekolah LENTERA — perlu persetujuan sekolah','','SEKOLAH-DRAF-1',NULL,true),
('LENTERA-SEKOLAH-IPAS-A-02','Ilmu Pengetahuan Alam dan Sosial (IPAS)','A','Hewan dan tumbuhan','Mengamati ciri hewan dan tumbuhan di lingkungan sekitar serta cara merawatnya.','Usulan pengembangan sekolah LENTERA — perlu persetujuan sekolah','','SEKOLAH-DRAF-1',NULL,true),
('LENTERA-SEKOLAH-IPAS-A-03','Ilmu Pengetahuan Alam dan Sosial (IPAS)','A','Kebersihan dan kesehatan','Mempraktikkan kebiasaan menjaga kebersihan diri dan lingkungan.','Usulan pengembangan sekolah LENTERA — perlu persetujuan sekolah','','SEKOLAH-DRAF-1',NULL,true),
('LENTERA-SEKOLAH-IPAS-A-04','Ilmu Pengetahuan Alam dan Sosial (IPAS)','A','Keluarga dan lingkungan sosial','Mengenali peran anggota keluarga dan warga sekolah serta kebiasaan bekerja sama.','Usulan pengembangan sekolah LENTERA — perlu persetujuan sekolah','','SEKOLAH-DRAF-1',NULL,true),
('LENTERA-SEKOLAH-IPAS-A-05','Ilmu Pengetahuan Alam dan Sosial (IPAS)','A','Kebutuhan makhluk hidup','Mengamati kebutuhan air, makanan, dan tempat hidup makhluk hidup sekitar.','Usulan pengembangan sekolah LENTERA — perlu persetujuan sekolah','','SEKOLAH-DRAF-1',NULL,true),
('LENTERA-SEKOLAH-BIG-A-06','Bahasa Inggris','A','Greetings and introductions','Merespons sapaan dan memperkenalkan nama secara lisan dengan bantuan gambar atau contoh.','Usulan pengembangan sekolah LENTERA — perlu persetujuan sekolah','','SEKOLAH-DRAF-1',NULL,true),
('LENTERA-SEKOLAH-BIG-A-07','Bahasa Inggris','A','Numbers and colours','Mengenali dan menyebut bilangan serta warna sederhana melalui permainan.','Usulan pengembangan sekolah LENTERA — perlu persetujuan sekolah','','SEKOLAH-DRAF-1',NULL,true),
('LENTERA-SEKOLAH-BIG-A-08','Bahasa Inggris','A','Animals and plants','Mengenali kosakata hewan dan tumbuhan yang dekat dengan kehidupan anak.','Usulan pengembangan sekolah LENTERA — perlu persetujuan sekolah','','SEKOLAH-DRAF-1',NULL,true),
('LENTERA-SEKOLAH-BIG-A-09','Bahasa Inggris','A','Family and body parts','Mengenali kosakata keluarga dan anggota tubuh melalui gambar, lagu, atau gerak.','Usulan pengembangan sekolah LENTERA — perlu persetujuan sekolah','','SEKOLAH-DRAF-1',NULL,true),
('LENTERA-SEKOLAH-BIG-A-10','Bahasa Inggris','A','Classroom objects and instructions','Mengenali benda kelas dan mengikuti instruksi pendek dengan bantuan visual.','Usulan pengembangan sekolah LENTERA — perlu persetujuan sekolah','','SEKOLAH-DRAF-1',NULL,true)
ON CONFLICT (reference_code) DO NOTHING;
UPDATE public.subjects SET phase=array_append(phase,'A'::public.class_phase) WHERE upper(btrim(code))='IPAS' AND NOT ('A'::public.class_phase = ANY(phase));
COMMIT;
NOTIFY pgrst, 'reload schema';
