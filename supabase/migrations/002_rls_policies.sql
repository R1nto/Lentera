-- LENTERA Row Level Security Policies
-- Phase 1: Security policies for all tables

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_session_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reflection_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE teaching_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE module_generation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE published_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_link_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user's profile
CREATE OR REPLACE FUNCTION get_current_profile()
RETURNS profiles LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  current_profile profiles;
BEGIN
  SELECT * INTO current_profile
  FROM profiles
  WHERE id = auth.uid();

  RETURN current_profile;
END;
$$;

-- Helper function to check if user is guru
CREATE OR REPLACE FUNCTION is_guru()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid()) = 'guru';
END;
$$;

-- Helper function to check if user is kepala_sekolah
CREATE OR REPLACE FUNCTION is_kepala_sekolah()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid()) = 'kepala_sekolah';
END;
$$;

-- Helper function to check if user is wali_murid
CREATE OR REPLACE FUNCTION is_wali_murid()
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = auth.uid()) = 'wali_murid';
END;
$$;

-- Helper function to get current user's school_id
CREATE OR REPLACE FUNCTION get_current_school_id()
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  school_id UUID;
BEGIN
  SELECT school_id INTO school_id
  FROM profiles
  WHERE id = auth.uid();

  RETURN school_id;
END;
$$;

-- ============================================================
-- PROFILES POLICIES
-- ============================================================
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM profiles WHERE id = auth.uid()));

-- Guru can read profiles of students in their classes
CREATE POLICY "Guru can read student profiles in their classes" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_classes tc
      JOIN classes c ON tc.class_id = c.id
      JOIN students s ON c.id = s.class_id
      WHERE tc.teacher_id = auth.uid()
      AND profiles.id = s.parent_id
    )
  );

-- Kepala sekolah can read all profiles in their school
CREATE POLICY "Kepala sekolah can read profiles in school" ON profiles
  FOR SELECT USING (
    is_kepala_sekolah() AND school_id = get_current_school_id()
  );

-- ============================================================
-- SCHOOLS POLICIES
-- ============================================================
-- Users can read their own school
CREATE POLICY "Users can read own school" ON schools
  FOR SELECT USING (id = get_current_school_id());

-- Kepala sekolah can update their school
CREATE POLICY "Kepala sekolah can update school" ON schools
  FOR UPDATE USING (is_kepala_sekolah() AND id = get_current_school_id());

-- ============================================================
-- CLASSES POLICIES
-- ============================================================
-- Guru can read classes they teach
CREATE POLICY "Guru can read own classes" ON classes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_classes tc
      WHERE tc.teacher_id = auth.uid() AND tc.class_id = classes.id
    )
  );

-- Guru can read classes they are homeroom for
CREATE POLICY "Guru can read homeroom classes" ON classes
  FOR SELECT USING (homeroom_teacher_id = auth.uid());

-- Kepala sekolah can read all classes in their school
CREATE POLICY "Kepala sekolah can read school classes" ON classes
  FOR SELECT USING (is_kepala_sekolah() AND school_id = get_current_school_id());

-- Kepala sekolah can manage classes in their school
CREATE POLICY "Kepala sekolah can manage classes" ON classes
  FOR ALL USING (is_kepala_sekolah() AND school_id = get_current_school_id());

-- ============================================================
-- TEACHER_CLASSES POLICIES
-- ============================================================
-- Guru can read their own assignments
CREATE POLICY "Guru can read own teacher_classes" ON teacher_classes
  FOR SELECT USING (teacher_id = auth.uid());

-- Kepala sekolah can manage all teacher_classes in school
CREATE POLICY "Kepala sekolah can manage teacher_classes" ON teacher_classes
  FOR ALL USING (
    is_kepala_sekolah() AND
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = teacher_classes.class_id AND c.school_id = get_current_school_id()
    )
  );

-- ============================================================
-- SUBJECTS POLICIES
-- ============================================================
-- All authenticated users can read subjects
CREATE POLICY "Authenticated users can read subjects" ON subjects
  FOR SELECT USING (auth.role() = 'authenticated');

-- Kepala sekolah can manage subjects
CREATE POLICY "Kepala sekolah can manage subjects" ON subjects
  FOR ALL USING (is_kepala_sekolah());

-- ============================================================
-- STUDENTS POLICIES
-- ============================================================
-- Guru can read students in their classes
CREATE POLICY "Guru can read students in own classes" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_classes tc
      WHERE tc.teacher_id = auth.uid() AND tc.class_id = students.class_id
    )
  );

-- Guru can manage students in their classes
CREATE POLICY "Guru can manage students in own classes" ON students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teacher_classes tc
      WHERE tc.teacher_id = auth.uid() AND tc.class_id = students.class_id
    )
  );

-- Kepala sekolah can read all students in school
CREATE POLICY "Kepala sekolah can read school students" ON students
  FOR SELECT USING (is_kepala_sekolah() AND school_id = get_current_school_id());

-- Wali murid can read their own children
CREATE POLICY "Wali murid can read own children" ON students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = auth.uid() AND ps.student_id = students.id AND ps.verification_status = 'verified'
    )
  );

-- ============================================================
-- PARENT_STUDENTS POLICIES
-- ============================================================
-- Wali murid can read their own relationships
CREATE POLICY "Wali murid can read own parent_students" ON parent_students
  FOR SELECT USING (parent_id = auth.uid());

-- Guru/Kepala sekolah can read parent_students for their students
CREATE POLICY "Staff can read parent_students for their students" ON parent_students
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_classes tc
      JOIN classes c ON tc.class_id = c.id
      JOIN students s ON c.id = s.class_id
      WHERE tc.teacher_id = auth.uid() AND s.id = parent_students.student_id
    ) OR
    (is_kepala_sekolah() AND
     EXISTS (
       SELECT 1 FROM students s
       WHERE s.id = parent_students.student_id AND s.school_id = get_current_school_id()
     ))
  );

-- Kepala sekolah can manage parent_students
CREATE POLICY "Kepala sekolah can manage parent_students" ON parent_students
  FOR ALL USING (
    is_kepala_sekolah() AND
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = parent_students.student_id AND s.school_id = get_current_school_id()
    )
  );

-- ============================================================
-- LEARNING_OUTCOMES POLICIES
-- ============================================================
-- Guru can read CP for subjects they teach
CREATE POLICY "Guru can read CP for taught subjects" ON learning_outcomes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teacher_classes tc
      WHERE tc.teacher_id = auth.uid() AND tc.subject_id = learning_outcomes.subject_id
    )
  );

-- Guru can create CP for subjects they teach
CREATE POLICY "Guru can create CP for taught subjects" ON learning_outcomes
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM teacher_classes tc
      WHERE tc.teacher_id = auth.uid() AND tc.subject_id = learning_outcomes.subject_id
    )
  );

-- Guru can update CP they created
CREATE POLICY "Guru can update own CP" ON learning_outcomes
  FOR UPDATE USING (created_by = auth.uid());

-- Kepala sekolah can read all CP in school
CREATE POLICY "Kepala sekolah can read school CP" ON learning_outcomes
  FOR SELECT USING (is_kepala_sekolah() AND school_id = get_current_school_id());

-- ============================================================
-- LEARNING_OBJECTIVES POLICIES
-- ============================================================
-- Guru can read TP for CP they have access to
CREATE POLICY "Guru can read TP for accessible CP" ON learning_objectives
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM learning_outcomes lo
      JOIN teacher_classes tc ON tc.subject_id = lo.subject_id
      WHERE lo.id = learning_objectives.learning_outcome_id AND tc.teacher_id = auth.uid()
    )
  );

-- Guru can manage TP for CP they created
CREATE POLICY "Guru can manage TP for own CP" ON learning_objectives
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM learning_outcomes lo
      WHERE lo.id = learning_objectives.learning_outcome_id AND lo.created_by = auth.uid()
    )
  );

-- Kepala sekolah can read all TP in school
CREATE POLICY "Kepala sekolah can read school TP" ON learning_objectives
  FOR SELECT USING (
    is_kepala_sekolah() AND
    EXISTS (
      SELECT 1 FROM learning_outcomes lo
      WHERE lo.id = learning_objectives.learning_outcome_id AND lo.school_id = get_current_school_id()
    )
  );

-- ============================================================
-- LEARNING_INDICATORS POLICIES
-- ============================================================
-- Guru can read indicators for TP they have access to
CREATE POLICY "Guru can read indicators for accessible TP" ON learning_indicators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM learning_objectives lo
      JOIN learning_outcomes lout ON lo.learning_outcome_id = lout.id
      JOIN teacher_classes tc ON tc.subject_id = lout.subject_id
      WHERE lo.id = learning_indicators.learning_objective_id AND tc.teacher_id = auth.uid()
    )
  );

-- Guru can manage indicators for TP they created
CREATE POLICY "Guru can manage indicators for own TP" ON learning_indicators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM learning_objectives lo
      JOIN learning_outcomes lout ON lo.learning_outcome_id = lout.id
      WHERE lo.id = learning_indicators.learning_objective_id AND lout.created_by = auth.uid()
    )
  );

-- Kepala sekolah can read all indicators in school
CREATE POLICY "Kepala sekolah can read school indicators" ON learning_indicators
  FOR SELECT USING (
    is_kepala_sekolah() AND
    EXISTS (
      SELECT 1 FROM learning_objectives lo
      JOIN learning_outcomes lout ON lo.learning_outcome_id = lout.id
      WHERE lo.id = learning_indicators.learning_objective_id AND lout.school_id = get_current_school_id()
    )
  );

-- ============================================================
-- LEARNING_SESSIONS POLICIES
-- ============================================================
-- Guru can manage their own sessions
CREATE POLICY "Guru can manage own sessions" ON learning_sessions
  FOR ALL USING (teacher_id = auth.uid());

-- Kepala sekolah can read all sessions in school
CREATE POLICY "Kepala sekolah can read school sessions" ON learning_sessions
  FOR SELECT USING (
    is_kepala_sekolah() AND
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = learning_sessions.class_id AND c.school_id = get_current_school_id()
    )
  );

-- ============================================================
-- LEARNING_SESSION_OBJECTIVES POLICIES
-- ============================================================
-- Guru can manage objectives for their sessions
CREATE POLICY "Guru can manage session objectives" ON learning_session_objectives
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM learning_sessions ls
      WHERE ls.id = learning_session_objectives.learning_session_id AND ls.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- ASSESSMENT_ACTIVITIES POLICIES
-- ============================================================
-- Guru can manage their own assessment activities
CREATE POLICY "Guru can manage own assessments" ON assessment_activities
  FOR ALL USING (teacher_id = auth.uid());

-- Kepala sekolah can read all assessments in school
CREATE POLICY "Kepala sekolah can read school assessments" ON assessment_activities
  FOR SELECT USING (
    is_kepala_sekolah() AND
    EXISTS (
      SELECT 1 FROM classes c
      WHERE c.id = assessment_activities.class_id AND c.school_id = get_current_school_id()
    )
  );

-- ============================================================
-- ASSESSMENT_RESULTS POLICIES
-- ============================================================
-- Guru can manage results for their assessments
CREATE POLICY "Guru can manage own assessment results" ON assessment_results
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM assessment_activities aa
      WHERE aa.id = assessment_results.assessment_activity_id AND aa.teacher_id = auth.uid()
    )
  );

-- Kepala sekolah can read results for school assessments
CREATE POLICY "Kepala sekolah can read school results" ON assessment_results
  FOR SELECT USING (
    is_kepala_sekolah() AND
    EXISTS (
      SELECT 1 FROM assessment_activities aa
      JOIN classes c ON aa.class_id = c.id
      WHERE aa.id = assessment_results.assessment_activity_id AND c.school_id = get_current_school_id()
    )
  );

-- Wali murid can read published results for their children
CREATE POLICY "Wali murid can read published results" ON assessment_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM assessment_activities aa
      JOIN published_assessments pa ON pa.assessment_activity_id = aa.id
      JOIN parent_students ps ON ps.student_id = assessment_results.student_id
      WHERE pa.student_id = assessment_results.student_id
        AND pa.publication_status = 'published'
        AND ps.parent_id = auth.uid()
        AND ps.verification_status = 'verified'
    )
  );

-- ============================================================
-- REFLECTION_QUESTIONS POLICIES
-- ============================================================
-- Guru can manage questions for their sessions
CREATE POLICY "Guru can manage reflection questions" ON reflection_questions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM learning_sessions ls
      WHERE ls.id = reflection_questions.learning_session_id AND ls.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- REFLECTION_ANSWERS POLICIES
-- ============================================================
-- Guru can manage their own answers
CREATE POLICY "Guru can manage own reflection answers" ON reflection_answers
  FOR ALL USING (teacher_id = auth.uid());

-- ============================================================
-- AI_ANALYSES POLICIES
-- ============================================================
-- Guru can manage analyses for their sessions
CREATE POLICY "Guru can manage own AI analyses" ON ai_analyses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM learning_sessions ls
      WHERE ls.id = ai_analyses.learning_session_id AND ls.teacher_id = auth.uid()
    )
  );

-- Kepala sekolah can read analyses for school sessions
CREATE POLICY "Kepala sekolah can read school AI analyses" ON ai_analyses
  FOR SELECT USING (
    is_kepala_sekolah() AND
    EXISTS (
      SELECT 1 FROM learning_sessions ls
      JOIN classes c ON ls.class_id = c.id
      WHERE ls.id = ai_analyses.learning_session_id AND c.school_id = get_current_school_id()
    )
  );

-- ============================================================
-- FOLLOW_UP_ACTIONS POLICIES
-- ============================================================
-- Guru can manage follow-ups for their analyses
CREATE POLICY "Guru can manage own follow-ups" ON follow_up_actions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM ai_analyses aa
      JOIN learning_sessions ls ON aa.learning_session_id = ls.id
      WHERE aa.id = follow_up_actions.ai_analysis_id AND ls.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- TEACHING_MODULES POLICIES
-- ============================================================
-- Guru can manage their own modules
CREATE POLICY "Guru can manage own modules" ON teaching_modules
  FOR ALL USING (teacher_id = auth.uid());

-- Kepala sekolah can read modules in school
CREATE POLICY "Kepala sekolah can read school modules" ON teaching_modules
  FOR SELECT USING (
    is_kepala_sekolah() AND school_id = get_current_school_id()
  );

-- ============================================================
-- MODULE_VERSIONS POLICIES
-- ============================================================
-- Guru can read versions for their modules
CREATE POLICY "Guru can read module versions" ON module_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teaching_modules tm
      WHERE tm.id = module_versions.module_id AND tm.teacher_id = auth.uid()
    )
  );

-- Guru can create versions for their modules
CREATE POLICY "Guru can create module versions" ON module_versions
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM teaching_modules tm
      WHERE tm.id = module_versions.module_id AND tm.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- MODULE_GENERATION_LOGS POLICIES
-- ============================================================
-- Guru can read logs for their modules
CREATE POLICY "Guru can read module logs" ON module_generation_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teaching_modules tm
      WHERE tm.id = module_generation_logs.module_id AND tm.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- PUBLISHED_REPORTS POLICIES
-- ============================================================
-- Guru can manage reports for their sessions
CREATE POLICY "Guru can manage own published reports" ON published_reports
  FOR ALL USING (
    teacher_id = auth.uid()
  );

-- Wali murid can read published reports for their children
CREATE POLICY "Wali murid can read published reports" ON published_reports
  FOR SELECT USING (
    publication_status = 'published' AND
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = auth.uid()
        AND ps.student_id = published_reports.student_id
        AND ps.verification_status = 'verified'
    )
  );

-- Kepala sekolah can read published reports in school
CREATE POLICY "Kepala sekolah can read school published reports" ON published_reports
  FOR SELECT USING (
    is_kepala_sekolah() AND
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = published_reports.student_id AND s.school_id = get_current_school_id()
    )
  );

-- ============================================================
-- PUBLISHED_ASSESSMENTS POLICIES
-- ============================================================
-- Guru can manage published assessments they created
CREATE POLICY "Guru can manage own published assessments" ON published_assessments
  FOR ALL USING (published_by = auth.uid());

-- Wali murid can read published assessments for their children
CREATE POLICY "Wali murid can read published assessments" ON published_assessments
  FOR SELECT USING (
    publication_status = 'published' AND
    EXISTS (
      SELECT 1 FROM parent_students ps
      WHERE ps.parent_id = auth.uid()
        AND ps.student_id = published_assessments.student_id
        AND ps.verification_status = 'verified'
    )
  );

-- ============================================================
-- PARENT_LINK_INVITATIONS POLICIES
-- ============================================================
-- Kepala sekolah can manage invitations
CREATE POLICY "Kepala sekolah can manage invitations" ON parent_link_invitations
  FOR ALL USING (
    is_kepala_sekolah() AND
    EXISTS (
      SELECT 1 FROM students s
      WHERE s.id = parent_link_invitations.student_id AND s.school_id = get_current_school_id()
    )
  );

-- Anyone with valid token can read invitation (for verification)
CREATE POLICY "Public can read invitation for verification" ON parent_link_invitations
  FOR SELECT USING (status = 'pending' AND expires_at > NOW());

-- ============================================================
-- NOTIFICATIONS POLICIES
-- ============================================================
-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON notifications
  FOR SELECT USING (recipient_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (recipient_id = auth.uid());

-- System can insert notifications
CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- ============================================================
-- SCHOOL_REPORTS POLICIES
-- ============================================================
-- Kepala sekolah can manage school reports
CREATE POLICY "Kepala sekolah can manage school reports" ON school_reports
  FOR ALL USING (
    is_kepala_sekolah() AND school_id = get_current_school_id()
  );

-- ============================================================
-- AUDIT_LOGS POLICIES
-- ============================================================
-- Kepala sekolah can read audit logs for their school
CREATE POLICY "Kepala sekolah can read school audit logs" ON audit_logs
  FOR SELECT USING (
    is_kepala_sekolah() AND
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = audit_logs.user_id AND p.school_id = get_current_school_id()
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);