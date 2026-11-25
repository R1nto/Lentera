-- Backend access only. Existing RLS remains enabled.
BEGIN;
GRANT SELECT ON public.schools, public.classes, public.students, public.profiles, public.subjects,
 public.learning_sessions, public.assessment_activities, public.assessment_results,
 public.teaching_modules, public.ai_analyses, public.published_reports TO service_role;
GRANT SELECT, INSERT ON public.school_reports TO service_role;
COMMIT;
NOTIFY pgrst, 'reload schema';
