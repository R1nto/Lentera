-- Grant minimum server-only privileges for POST /api/kepala-sekolah/kelas.
-- The endpoint validates the signed-in user's principal role, school, and teacher's school.
BEGIN;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON public.profiles, public.classes, public.teacher_classes TO service_role;
GRANT INSERT, DELETE ON public.classes TO service_role;
GRANT INSERT ON public.teacher_classes TO service_role;
COMMIT;
