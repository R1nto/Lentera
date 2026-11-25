-- LENTERA 017: Consolidate PostgreSQL GRANTs for routes present in V10.6.
-- Apply after 001-016, using a migration-capable database owner, with a backup.
-- GRANT controls table operations; existing RLS continues to restrict which ROWS
-- the authenticated user may see or modify. Do not turn off RLS.
BEGIN;

GRANT USAGE ON SCHEMA public TO authenticated, service_role;

-- Browser reads used by Guru / Kepala Sekolah / Wali Murid.
-- Neither invitation tokens nor private admin settings are exposed.
GRANT SELECT ON TABLE
  public.profiles, public.schools, public.classes, public.teacher_classes,
  public.subjects, public.students, public.parent_students,
  public.learning_outcomes, public.learning_objectives, public.learning_indicators,
  public.learning_sessions, public.learning_session_objectives,
  public.assessment_activities, public.assessment_results,
  public.reflection_questions, public.reflection_answers,
  public.ai_analyses, public.follow_up_actions,
  public.teaching_modules, public.module_versions, public.module_generation_logs,
  public.published_reports, public.published_assessments,
  public.notifications, public.school_reports
TO authenticated;

-- Browser mutations still present in this version. RLS is mandatory and
-- profile ownership/teacher ownership is enforced by its policies.
GRANT INSERT ON TABLE public.assessment_activities, public.assessment_results TO authenticated;
GRANT UPDATE ON TABLE public.assessment_results, public.learning_sessions,
  public.ai_analyses, public.teaching_modules TO authenticated;
-- Keep profile updates restricted to safe columns (migration 003).
REVOKE UPDATE ON TABLE public.profiles FROM authenticated;
GRANT UPDATE (full_name, phone, avatar_url, updated_at)
  ON TABLE public.profiles TO authenticated;

-- Server reads for verified endpoints. The secret key stays SERVER ONLY.
GRANT SELECT ON TABLE
  public.profiles, public.schools, public.classes, public.teacher_classes,
  public.subjects, public.students, public.parent_students,
  public.learning_outcomes, public.learning_objectives, public.learning_indicators,
  public.learning_sessions, public.assessment_activities, public.assessment_results,
  public.reflection_questions, public.ai_analyses,
  public.teaching_modules, public.module_generation_logs,
  public.published_reports, public.parent_link_invitations
TO service_role;

GRANT INSERT ON TABLE public.schools, public.profiles, public.classes,
  public.teacher_classes, public.students, public.learning_sessions,
  public.assessment_activities, public.reflection_questions,
  public.ai_analyses, public.teaching_modules,
  public.module_generation_logs, public.published_reports,
  public.parent_link_invitations TO service_role;
GRANT UPDATE ON TABLE public.ai_analyses, public.published_reports TO service_role;
GRANT DELETE ON TABLE public.classes TO service_role; -- compensation after failed class assignment

-- IMPORTANT: private tokens and admin settings remain server-only.
REVOKE ALL ON TABLE public.parent_link_invitations FROM anon;
REVOKE ALL ON TABLE public.platform_admins, public.platform_settings FROM anon, authenticated;

-- SD-only restriction, including requests outside the application API.
-- NOT VALID preserves legacy rows until reviewed; still enforced on new/updated rows.
DO $sd$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lentera_sd_class_grade_phase' AND conrelid = 'public.classes'::regclass) THEN
    ALTER TABLE public.classes ADD CONSTRAINT lentera_sd_class_grade_phase CHECK (
      grade ~ '^[1-6]$' AND phase = CASE
        WHEN grade IN ('1','2') THEN 'A'::public.class_phase
        WHEN grade IN ('3','4') THEN 'B'::public.class_phase
        WHEN grade IN ('5','6') THEN 'C'::public.class_phase
        ELSE NULL END
    ) NOT VALID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'lentera_sd_module_grade_phase' AND conrelid = 'public.teaching_modules'::regclass) THEN
    ALTER TABLE public.teaching_modules ADD CONSTRAINT lentera_sd_module_grade_phase CHECK (
      grade ~ '^[1-6]$' AND phase = CASE
        WHEN grade IN ('1','2') THEN 'A'::public.class_phase
        WHEN grade IN ('3','4') THEN 'B'::public.class_phase
        WHEN grade IN ('5','6') THEN 'C'::public.class_phase
        ELSE NULL END
    ) NOT VALID;
  END IF;
END $sd$;
COMMIT;

-- Read-only verification: a false row indicates a missing grant.
SELECT role_name, table_name, operation, allowed FROM (
  SELECT 'authenticated' AS role_name, 'learning_sessions' AS table_name, 'SELECT' AS operation,
    has_table_privilege('authenticated', 'public.learning_sessions', 'SELECT') AS allowed
  UNION ALL SELECT 'authenticated','assessment_activities','INSERT',
    has_table_privilege('authenticated','public.assessment_activities','INSERT')
  UNION ALL SELECT 'authenticated','assessment_results','UPDATE',
    has_table_privilege('authenticated','public.assessment_results','UPDATE')
  UNION ALL SELECT 'authenticated','teaching_modules','SELECT',
    has_table_privilege('authenticated','public.teaching_modules','SELECT')
  UNION ALL SELECT 'service_role','students','INSERT',
    has_table_privilege('service_role','public.students','INSERT')
  UNION ALL SELECT 'service_role','classes','INSERT',
    has_table_privilege('service_role','public.classes','INSERT')
  UNION ALL SELECT 'service_role','published_reports','UPDATE',
    has_table_privilege('service_role','public.published_reports','UPDATE')
) AS permissions ORDER BY role_name, table_name;
