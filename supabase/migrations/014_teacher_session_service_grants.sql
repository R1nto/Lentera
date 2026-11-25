-- V9: limited backend privileges for teacher session creation.
-- Requires session API to verify logged-in Guru and assigned school/class.
-- Does NOT grant INSERT to anonymous or authenticated roles.
BEGIN;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON public.profiles, public.teacher_classes, public.classes, public.subjects, public.learning_sessions TO service_role;
GRANT INSERT ON public.learning_sessions TO service_role;
COMMIT;
