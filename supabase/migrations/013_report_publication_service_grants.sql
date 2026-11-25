-- LENTERA V8: izin minimal untuk backend publikasi laporan pembelajaran.
-- Jalankan setelah migrasi 001–012. Tidak menonaktifkan RLS.
-- Pastikan endpoint server melakukan verifikasi sesi, role, kepemilikan kelas,
-- dan school_id SEBELUM menggunakan service_role.
BEGIN;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON TABLE
  public.profiles,
  public.classes,
  public.subjects,
  public.students,
  public.learning_sessions,
  public.learning_objectives,
  public.learning_indicators,
  public.assessment_activities,
  public.assessment_results,
  public.published_reports
TO service_role;
GRANT INSERT, UPDATE ON TABLE public.published_reports TO service_role;
-- Izin backend pendaftaran siswa oleh Guru terotorisasi.
GRANT SELECT ON TABLE public.teacher_classes TO service_role;
GRANT INSERT ON TABLE public.students TO service_role;
COMMIT;
