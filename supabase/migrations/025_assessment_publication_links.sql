-- LENTERA V12.10.5: publication grants; safe to run after migration 024.
-- Keep parent-facing reads behind a verified-link API and do not broaden RLS.
GRANT SELECT, UPDATE ON public.assessment_activities TO service_role;
GRANT SELECT ON public.assessment_results, public.students, public.subjects, public.parent_students TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.published_assessments TO service_role;
-- Avoid creating a unique constraint before inspecting legacy duplicate rows.
-- Existing rows are reused by ID in the publication endpoint.
NOTIFY pgrst, 'reload schema';
