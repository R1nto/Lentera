-- LENTERA V10.6: minimum service-side privileges for the authenticated Teacher -> Add Student API.
-- Apply using Supabase SQL Editor after migration 015, with a database backup.
-- This does NOT grant student INSERT rights to anon or authenticated, and does NOT disable RLS.
BEGIN;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON TABLE public.profiles, public.teacher_classes, public.classes, public.students TO service_role;
GRANT INSERT ON TABLE public.students TO service_role;
COMMIT;

-- Read-only verification. Expected: all true.
SELECT
  has_table_privilege('service_role', 'public.profiles', 'SELECT') AS read_profiles,
  has_table_privilege('service_role', 'public.teacher_classes', 'SELECT') AS read_teacher_classes,
  has_table_privilege('service_role', 'public.classes', 'SELECT') AS read_classes,
  has_table_privilege('service_role', 'public.students', 'SELECT') AS read_students,
  has_table_privilege('service_role', 'public.students', 'INSERT') AS insert_students;
