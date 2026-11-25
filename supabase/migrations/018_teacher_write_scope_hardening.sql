-- LENTERA 018: Restrict direct browser writes by Guru to their actual school,
-- class assignment and subject, and assessments to pupils of that class.
-- Apply AFTER 017, using SQL Editor owner with backup and negative-role tests.
BEGIN;
CREATE OR REPLACE FUNCTION public.lentera_can_teach_subject(p_class_id uuid, p_subject_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_classes AS tc
    JOIN public.classes AS c ON c.id = tc.class_id
    JOIN public.profiles AS p ON p.id = tc.teacher_id
    WHERE tc.teacher_id = (SELECT auth.uid())
      AND p.role = 'guru'::public.user_role
      AND p.school_id = c.school_id
      AND c.id = p_class_id
      AND c.grade ~ '^[1-6]$'
      AND (tc.subject_id = p_subject_id OR tc.subject_id IS NULL)
  );
$$;
REVOKE ALL ON FUNCTION public.lentera_can_teach_subject(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lentera_can_teach_subject(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Guru can manage own sessions" ON public.learning_sessions;
CREATE POLICY "Guru can manage own sessions" ON public.learning_sessions
FOR ALL TO authenticated
USING (teacher_id = (SELECT auth.uid()) AND public.lentera_can_teach_subject(class_id,subject_id))
WITH CHECK (teacher_id = (SELECT auth.uid()) AND public.lentera_can_teach_subject(class_id,subject_id));

DROP POLICY IF EXISTS "Guru can manage own assessments" ON public.assessment_activities;
CREATE POLICY "Guru can manage own assessments" ON public.assessment_activities
FOR ALL TO authenticated
USING (teacher_id = (SELECT auth.uid()) AND public.lentera_can_teach_subject(class_id,subject_id))
WITH CHECK (teacher_id = (SELECT auth.uid()) AND public.lentera_can_teach_subject(class_id,subject_id));

DROP POLICY IF EXISTS "Guru can manage own assessment results" ON public.assessment_results;
CREATE POLICY "Guru can manage own assessment results" ON public.assessment_results
FOR ALL TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.assessment_activities aa
  JOIN public.students s ON s.id = assessment_results.student_id AND s.class_id = aa.class_id
  WHERE aa.id = assessment_results.assessment_activity_id
    AND aa.teacher_id = (SELECT auth.uid())
    AND public.lentera_can_teach_subject(aa.class_id,aa.subject_id)
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.assessment_activities aa
  JOIN public.students s ON s.id = assessment_results.student_id AND s.class_id = aa.class_id
  WHERE aa.id = assessment_results.assessment_activity_id
    AND aa.teacher_id = (SELECT auth.uid())
    AND public.lentera_can_teach_subject(aa.class_id,aa.subject_id)
));
COMMIT;

-- Verify that all four policies are now scoped to authenticated and function calls.
SELECT tablename,policyname,cmd,roles,qual,with_check FROM pg_policies
WHERE schemaname='public' AND policyname IN (
  'Guru can manage own sessions',
  'Guru can manage own assessments',
  'Guru can manage own assessment results'
) ORDER BY tablename;
