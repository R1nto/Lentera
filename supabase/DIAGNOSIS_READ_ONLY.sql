-- DIAGNOSTIC ONLY. Safe to run before granting anything.
-- PostgreSQL grants, RLS status, and policy inventory for ALL app tables.
SELECT c.relname AS table_name,
       c.relrowsecurity AS rls_enabled,
       has_table_privilege('authenticated', c.oid, 'SELECT') AS authenticated_select,
       has_table_privilege('authenticated', c.oid, 'INSERT') AS authenticated_insert,
       has_table_privilege('authenticated', c.oid, 'UPDATE') AS authenticated_update,
       has_table_privilege('service_role', c.oid, 'SELECT') AS service_select,
       has_table_privilege('service_role', c.oid, 'INSERT') AS service_insert
FROM pg_class AS c
JOIN pg_namespace AS n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relkind IN ('r', 'p')
ORDER BY c.relname;

SELECT tablename, policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Existing out-of-scope rows need manual review BEFORE validating constraints.
SELECT 'classes' AS entity, id::text, grade, phase::text FROM public.classes
WHERE grade !~ '^[1-6]$' OR phase::text <> CASE
  WHEN grade IN ('1','2') THEN 'A'
  WHEN grade IN ('3','4') THEN 'B'
  WHEN grade IN ('5','6') THEN 'C' ELSE '' END
UNION ALL
SELECT 'teaching_modules', id::text, grade, phase::text FROM public.teaching_modules
WHERE grade !~ '^[1-6]$' OR phase::text <> CASE
  WHEN grade IN ('1','2') THEN 'A'
  WHEN grade IN ('3','4') THEN 'B'
  WHEN grade IN ('5','6') THEN 'C' ELSE '' END;
