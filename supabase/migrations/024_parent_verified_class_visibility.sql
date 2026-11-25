-- LENTERA V12.10.4: allow a verified parent to read only the class of their linked child.
-- Run after migrations 010 and 023; does not bypass RLS for unrelated classes.
BEGIN;

CREATE OR REPLACE FUNCTION public.lentera_parent_can_read_class(p_class_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.parent_students ps
    JOIN public.students s ON s.id = ps.student_id
    JOIN public.profiles p ON p.id = ps.parent_id
    WHERE ps.parent_id = (SELECT auth.uid())
      AND ps.verification_status = 'verified'
      AND p.role = 'wali_murid'
      AND s.class_id = p_class_id
      AND s.is_active = TRUE
      AND s.school_id = p.school_id
  );
$$;

REVOKE ALL ON FUNCTION public.lentera_parent_can_read_class(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lentera_parent_can_read_class(uuid) TO authenticated;

DROP POLICY IF EXISTS "Verified wali murid can read child's class" ON public.classes;
CREATE POLICY "Verified wali murid can read child's class"
ON public.classes FOR SELECT TO authenticated
USING (public.lentera_parent_can_read_class(id));

GRANT SELECT ON public.classes TO authenticated;
COMMIT;

-- Diagnostic (run as database admin):
-- SELECT ps.parent_id, ps.student_id, ps.verification_status, s.class_id
-- FROM public.parent_students ps JOIN public.students s ON s.id = ps.student_id;
