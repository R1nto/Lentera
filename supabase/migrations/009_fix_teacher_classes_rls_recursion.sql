-- LENTERA V6.5 - Repair recursive RLS dependency among profiles/classes/teacher_classes.
-- Apply once in Supabase SQL Editor as a project database administrator.
-- This migration does NOT disable RLS and does NOT grant broad read access.
BEGIN;

-- SECURITY DEFINER functions are created by the migration owner (normally postgres
-- in the Supabase SQL Editor), and read the underlying relationship tables without
-- recursively evaluating the requesting user's policies. Identity is always auth.uid().
CREATE OR REPLACE FUNCTION public.lentera_teaches_class(p_class_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teacher_classes AS tc
    WHERE tc.class_id = p_class_id
      AND tc.teacher_id = (SELECT auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.lentera_teaches_student_parent(p_parent_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.teacher_classes tc
    JOIN public.students s ON s.class_id = tc.class_id
    WHERE tc.teacher_id = (SELECT auth.uid())
      AND s.parent_id = p_parent_id
  );
$$;

CREATE OR REPLACE FUNCTION public.lentera_principal_manages_class(p_class_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.classes c
    JOIN public.profiles p ON p.school_id = c.school_id
    WHERE c.id = p_class_id
      AND p.id = (SELECT auth.uid())
      AND p.role = 'kepala_sekolah'
  );
$$;

REVOKE ALL ON FUNCTION public.lentera_teaches_class(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lentera_teaches_student_parent(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lentera_principal_manages_class(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lentera_teaches_class(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lentera_teaches_student_parent(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.lentera_principal_manages_class(uuid) TO authenticated;

-- profiles -> teacher_classes -> classes -> teacher_classes was recursive.
DROP POLICY IF EXISTS "Guru can read student profiles in their classes" ON public.profiles;
CREATE POLICY "Guru can read student profiles in their classes"
ON public.profiles FOR SELECT TO authenticated
USING (public.lentera_teaches_student_parent(id));

-- classes -> teacher_classes -> classes was recursive.
DROP POLICY IF EXISTS "Guru can read own classes" ON public.classes;
CREATE POLICY "Guru can read own classes"
ON public.classes FOR SELECT TO authenticated
USING (public.lentera_teaches_class(id));

-- teacher_classes -> classes -> teacher_classes was recursive.
DROP POLICY IF EXISTS "Kepala sekolah can manage teacher_classes" ON public.teacher_classes;
CREATE POLICY "Kepala sekolah can manage teacher_classes"
ON public.teacher_classes FOR ALL TO authenticated
USING (public.lentera_principal_manages_class(class_id))
WITH CHECK (public.lentera_principal_manages_class(class_id));

-- An existing profile update policy also self-queries profiles. Restrict mutation
-- through the column-level GRANT established in migration 003 instead.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated
USING (id = (SELECT auth.uid()))
WITH CHECK (id = (SELECT auth.uid()));

COMMIT;

-- Read-only checks (run after migrating):
-- SELECT tablename, policyname, cmd FROM pg_policies
-- WHERE schemaname='public' AND tablename IN ('profiles','classes','teacher_classes');
