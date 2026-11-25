-- LENTERA V12.10: explicitly selected teaching module for assessment and analysis.
-- Safe for existing records: nullable FK, no reassignment or backfill.
ALTER TABLE public.assessment_activities
  ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.teaching_modules(id) ON DELETE SET NULL;
ALTER TABLE public.learning_sessions
  ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.teaching_modules(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_assessment_activities_module_id ON public.assessment_activities(module_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_module_id ON public.learning_sessions(module_id);

-- Database-side guard: API/UI checks alone must not be the only protection.
-- Own module, class, and subject must match. Null module stays supported.
CREATE OR REPLACE FUNCTION public.lentera_check_module_link()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
DECLARE linked public.teaching_modules%ROWTYPE;
BEGIN
  IF NEW.module_id IS NULL THEN RETURN NEW; END IF;
  SELECT * INTO linked FROM public.teaching_modules WHERE id = NEW.module_id;
  IF NOT FOUND OR linked.teacher_id IS DISTINCT FROM NEW.teacher_id
      OR linked.class_id IS DISTINCT FROM NEW.class_id
      OR linked.subject_id IS DISTINCT FROM NEW.subject_id THEN
    RAISE EXCEPTION 'Modul Ajar harus milik guru yang sama dan sesuai kelas serta mata pelajaran.' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS lentera_assessment_module_check ON public.assessment_activities;
CREATE TRIGGER lentera_assessment_module_check BEFORE INSERT OR UPDATE OF module_id,teacher_id,class_id,subject_id
  ON public.assessment_activities FOR EACH ROW EXECUTE FUNCTION public.lentera_check_module_link();
DROP TRIGGER IF EXISTS lentera_session_module_check ON public.learning_sessions;
CREATE TRIGGER lentera_session_module_check BEFORE INSERT OR UPDATE OF module_id,teacher_id,class_id,subject_id
  ON public.learning_sessions FOR EACH ROW EXECUTE FUNCTION public.lentera_check_module_link();
