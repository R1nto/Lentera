-- LENTERA migration 011: repair ambiguous school_id in get_current_school_id.
-- Run in Supabase SQL Editor as the migration/database owner.
-- This replaces the existing zero-argument function without modifying policies.
BEGIN;

CREATE OR REPLACE FUNCTION public.get_current_school_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT p.school_id
  FROM public.profiles AS p
  WHERE p.id = (SELECT auth.uid())
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_current_school_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_current_school_id() TO authenticated;

COMMIT;

-- Inspect definition after deployment:
-- SELECT pg_get_functiondef('public.get_current_school_id()'::regprocedure);
-- The function uses auth.uid(); testing with SQL Editor as postgres (without a JWT)
-- will normally return NULL, which does not mean it is broken.
