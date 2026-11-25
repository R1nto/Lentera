-- LENTERA 020: initial, editable SD (kelas 1-6) subject catalogue.
-- Requires public.subjects and public.class_phase from migration 001.
-- Subjects are shared reference data, not CP/TP curricula. Schools must review
-- optional/local offerings; no curriculum statements are invented here.
-- Safe to re-run; preserves existing rows and IDs (including hand-added subjects).
BEGIN;

GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON TABLE public.subjects TO authenticated, service_role;

WITH initial_subjects(code, name, description, phases) AS (
  VALUES
    ('PABP', 'Pendidikan Agama dan Budi Pekerti', 'Pilihan pendidikan agama disesuaikan dengan kebutuhan sekolah.', ARRAY['A','B','C']::public.class_phase[]),
    ('PP', 'Pendidikan Pancasila', 'Mata pelajaran SD.', ARRAY['A','B','C']::public.class_phase[]),
    ('BIN', 'Bahasa Indonesia', 'Mata pelajaran SD.', ARRAY['A','B','C']::public.class_phase[]),
    ('MTK', 'Matematika', 'Mata pelajaran SD.', ARRAY['A','B','C']::public.class_phase[]),
    ('IPAS', 'Ilmu Pengetahuan Alam dan Sosial (IPAS)', 'Untuk kelas 3–6 (Fase B dan C).', ARRAY['B','C']::public.class_phase[]),
    ('PJOK', 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)', 'Mata pelajaran SD.', ARRAY['A','B','C']::public.class_phase[]),
    ('SENI', 'Seni', 'Sekolah dapat menyesuaikan cabang seni yang diajarkan.', ARRAY['A','B','C']::public.class_phase[]),
    ('BIG', 'Bahasa Inggris', 'Tersedia sebagai pilihan sesuai kebijakan sekolah dan kurikulum.', ARRAY['A','B','C']::public.class_phase[]),
    ('MULOK', 'Muatan Lokal', 'Hanya digunakan bila diselenggarakan oleh sekolah.', ARRAY['A','B','C']::public.class_phase[])
)
INSERT INTO public.subjects (code, name, description, phase)
SELECT s.code, s.name, s.description, s.phases
FROM initial_subjects s
WHERE NOT EXISTS (
  SELECT 1 FROM public.subjects existing
  WHERE upper(btrim(coalesce(existing.code, ''))) = s.code
     OR lower(btrim(existing.name)) = lower(s.name)
);

COMMIT;

-- Verification. Existing custom subjects remain unchanged.
SELECT code, name, phase FROM public.subjects ORDER BY name;
