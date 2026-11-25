-- LENTERA V6.6: break the students <-> parent_students RLS dependency.
-- Run in Supabase SQL Editor as the database owner, AFTER migration 009.
-- Keeps RLS enabled and preserves school/teacher/parent scope.
BEGIN;

-- These trusted lookups execute under the function owner's privileges.
-- SQL Editor should create them as the database owner (usually postgres).
-- They use the active signed-in identity; input UUIDs do not confer access.
CREATE OR REPLACE FUNCTION public.lentera_is_verified_parent_of(p_student_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.parent_students ps
    WHERE ps.student_id = p_student_id
      AND ps.parent_id = (SELECT auth.uid())
      AND ps.verification_status = 'verified'
  );
$$;

CREATE OR REPLACE FUNCTION public.lentera_staff_can_access_student(p_student_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.teacher_classes tc ON tc.class_id = s.class_id
    JOIN public.profiles p ON p.id = tc.teacher_id
    WHERE s.id = p_student_id
      AND tc.teacher_id = (SELECT auth.uid())
      AND p.role = 'guru'
      AND p.school_id = s.school_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.profiles p ON p.school_id = s.school_id
    WHERE s.id = p_student_id
      AND p.id = (SELECT auth.uid())
      AND p.role = 'kepala_sekolah'
  );
$$;

CREATE OR REPLACE FUNCTION public.lentera_principal_can_access_student(p_student_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.students s
    JOIN public.profiles p ON p.school_id = s.school_id
    WHERE s.id = p_student_id
      AND p.id = (SELECT auth.uid())
      AND p.role = 'kepala_sekolah'
  );
$$;

REVOKE ALL ON FUNCTION public.lentera_is_verified_parent_of(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lentera_staff_can_access_student(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lentera_principal_can_access_student(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lentera_is_verified_parent_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lentera_staff_can_access_student(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lentera_principal_can_access_student(uuid) TO authenticated;

-- students -> parent_students: replace subquery with scoped definer lookup.
DROP POLICY IF EXISTS "Wali murid can read own children" ON public.students;
CREATE POLICY "Wali murid can read own children"
ON public.students FOR SELECT TO authenticated
USING (public.lentera_is_verified_parent_of(id));

-- parent_students -> students: replace both cross-table policy checks.
DROP POLICY IF EXISTS "Staff can read parent_students for their students" ON public.parent_students;
CREATE POLICY "Staff can read parent_students for their students"
ON public.parent_students FOR SELECT TO authenticated
USING (public.lentera_staff_can_access_student(student_id));

DROP POLICY IF EXISTS "Kepala sekolah can manage parent_students" ON public.parent_students;
CREATE POLICY "Kepala sekolah can manage parent_students"
ON public.parent_students FOR ALL TO authenticated
USING (public.lentera_principal_can_access_student(student_id))
WITH CHECK (public.lentera_principal_can_access_student(student_id));

-- These are table-level privileges only; existing RLS still restricts rows.
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.students, public.parent_students TO authenticated;

COMMIT;

-- Check the policies and verify RLS remains enabled:
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname = 'public' AND tablename IN ('students', 'parent_students');
-- SELECT relname, relrowsecurity FROM pg_class WHERE oid IN
-- ('public.students'::regclass, 'public.parent_students'::regclass);
