-- LENTERA V6.7: minimal service-only privileges for server-side invitation management.
-- Run after 001-011 in the same Supabase project, with database admin privileges.
-- Do not grant invitation SELECT or INSERT to anon.
BEGIN;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT ON TABLE public.profiles, public.students, public.classes TO service_role;
GRANT SELECT, INSERT ON TABLE public.parent_link_invitations TO service_role;
COMMIT;

-- Diagnostics; all should be true:
SELECT
  has_table_privilege('service_role', 'public.profiles', 'SELECT') AS profiles_read,
  has_table_privilege('service_role', 'public.students', 'SELECT') AS students_read,
  has_table_privilege('service_role', 'public.classes', 'SELECT') AS classes_read,
  has_table_privilege('service_role', 'public.parent_link_invitations', 'SELECT') AS invitations_read,
  has_table_privilege('service_role', 'public.parent_link_invitations', 'INSERT') AS invitations_create;
