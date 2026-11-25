-- LENTERA: profile compatibility and access hardening.
-- Safe to apply to an existing project; uses IF EXISTS / IF NOT EXISTS where possible.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Identifiers are used by the server-side login resolver and must be unambiguous per role.
CREATE UNIQUE INDEX IF NOT EXISTS profiles_role_identifier_unique
  ON public.profiles (role, lower(identifier));

-- User-editable profile attributes only. Role, identifier, and school ownership remain admin-managed.
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, avatar_url, updated_at) ON TABLE public.profiles TO authenticated;

-- Invitation tokens are verified by a server route using the service key.
-- Do not allow anonymous clients to enumerate active invitations.
DROP POLICY IF EXISTS "Public can read invitation for verification" ON public.parent_link_invitations;

-- System-generated rows must be written by trusted server code (service-role client bypasses RLS).
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

-- SECURITY DEFINER helpers use an explicit search path to avoid object-shadowing attacks.
ALTER FUNCTION public.get_current_profile() SET search_path = pg_catalog, public, auth, pg_temp;
ALTER FUNCTION public.is_guru() SET search_path = pg_catalog, public, auth, pg_temp;
ALTER FUNCTION public.is_kepala_sekolah() SET search_path = pg_catalog, public, auth, pg_temp;
ALTER FUNCTION public.is_wali_murid() SET search_path = pg_catalog, public, auth, pg_temp;
ALTER FUNCTION public.get_current_school_id() SET search_path = pg_catalog, public, auth, pg_temp;

REVOKE ALL ON FUNCTION public.get_current_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_guru() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_kepala_sekolah() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_wali_murid() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_current_school_id() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_current_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_guru() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_kepala_sekolah() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_wali_murid() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_school_id() TO authenticated;
