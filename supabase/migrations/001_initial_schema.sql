-- LENTERA Database Schema
-- Phase 1: Foundation tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Custom types
CREATE TYPE user_role AS ENUM ('guru', 'kepala_sekolah', 'wali_murid');
CREATE TYPE class_phase AS ENUM ('A', 'B', 'C', 'D', 'E', 'F');
CREATE TYPE session_status AS ENUM ('draft', 'planned', 'completed', 'archived');
CREATE TYPE assessment_type AS ENUM ('formatif', 'sumatif');
CREATE TYPE publication_status AS ENUM ('draft', 'published', 'unpublished');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected', 'revoked');
CREATE TYPE analysis_status AS ENUM ('pending', 'processing', 'completed', 'failed');
CREATE TYPE module_status AS ENUM ('draft', 'completed', 'archived');
CREATE TYPE generation_status AS ENUM ('success', 'failed', 'partial');
CREATE TYPE follow_up_status AS ENUM ('planned', 'in_progress', 'completed', 'cancelled');
CREATE TYPE recommendation_category AS ENUM ('remedial', 'enrichment', 'teaching_strategy', 'media', 'assessment', 'other');
CREATE TYPE priority_level AS ENUM ('high', 'medium', 'low');
CREATE TYPE indicator_status AS ENUM ('achieved', 'needs_improvement', 'insufficient_data');
CREATE TYPE response_type AS ENUM ('short_text', 'long_text', 'single_choice', 'multiple_choice', 'scale');
CREATE TYPE notification_type AS ENUM ('new_report', 'new_assessment', 'recommendation', 'status_change', 'system');
CREATE TYPE school_report_type AS ENUM ('learning_summary', 'assessment_summary', 'tp_progress', 'teacher_activity', 'class_progress');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL,
  identifier TEXT NOT NULL, -- NIP for guru, school_id for kepala_sekolah, email for wali_murid
  school_id UUID NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schools table
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  academic_year TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  grade TEXT NOT NULL,
  phase class_phase NOT NULL,
  academic_year TEXT NOT NULL,
  homeroom_teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subjects table
CREATE TABLE subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  phase class_phase[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teacher-Class assignments
CREATE TABLE teacher_classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
  is_homeroom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(teacher_id, class_id, subject_id)
);

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  nis TEXT NOT NULL,
  nisn TEXT,
  full_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('L', 'P')),
  birth_date DATE,
  birth_place TEXT,
  address TEXT,
  parent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(school_id, nis)
);

-- Parent-Student relationships
CREATE TABLE parent_students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  verification_status verification_status DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

-- Learning Outcomes (CP)
CREATE TABLE learning_outcomes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  phase class_phase NOT NULL,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  curriculum_version TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Objectives (TP)
CREATE TABLE learning_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learning_outcome_id UUID NOT NULL REFERENCES learning_outcomes(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Indicators
CREATE TABLE learning_indicators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learning_objective_id UUID NOT NULL REFERENCES learning_objectives(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  description TEXT NOT NULL,
  criteria TEXT NOT NULL, -- rubrik/kriteria ketercapaian
  assessment_method TEXT,
  order_index INTEGER DEFAULT 0,
  is_mandatory BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Sessions
CREATE TABLE learning_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  topic TEXT NOT NULL,
  phase class_phase NOT NULL,
  date DATE NOT NULL,
  duration_minutes INTEGER NOT NULL,
  learning_outcome_ids UUID[] NOT NULL DEFAULT '{}',
  learning_objective_ids UUID[] NOT NULL DEFAULT '{}',
  notes TEXT,
  status session_status DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Learning Session Objectives (junction table for multiple TP per session)
CREATE TABLE learning_session_objectives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learning_session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  learning_objective_id UUID NOT NULL REFERENCES learning_objectives(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  UNIQUE(learning_session_id, learning_objective_id)
);

-- Assessment Activities
CREATE TABLE assessment_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  learning_session_id UUID REFERENCES learning_sessions(id) ON DELETE SET NULL,
  learning_objective_id UUID REFERENCES learning_objectives(id) ON DELETE SET NULL,
  learning_indicator_ids UUID[] NOT NULL DEFAULT '{}',
  title TEXT NOT NULL,
  description TEXT,
  type assessment_type NOT NULL,
  max_score INTEGER NOT NULL DEFAULT 100,
  date DATE NOT NULL,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment Results
CREATE TABLE assessment_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_activity_id UUID NOT NULL REFERENCES assessment_activities(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  notes TEXT,
  evidence_urls TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assessment_activity_id, student_id)
);

-- Reflection Questions
CREATE TABLE reflection_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learning_session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  purpose TEXT,
  related_indicator_ids UUID[] DEFAULT '{}',
  response_type response_type DEFAULT 'long_text',
  options TEXT[],
  is_required BOOLEAN DEFAULT TRUE,
  order_index INTEGER DEFAULT 0,
  generated_by_ai BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reflection Answers
CREATE TABLE reflection_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reflection_question_id UUID NOT NULL REFERENCES reflection_questions(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_draft BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(reflection_question_id, teacher_id)
);

-- AI Analyses
CREATE TABLE ai_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  learning_session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status analysis_status DEFAULT 'pending',
  input_snapshot JSONB NOT NULL,
  input_hash TEXT NOT NULL,
  deterministic_metrics JSONB NOT NULL,
  ai_output JSONB,
  provider TEXT,
  model TEXT,
  prompt_version TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Follow Up Actions
CREATE TABLE follow_up_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ai_analysis_id UUID NOT NULL REFERENCES ai_analyses(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category recommendation_category NOT NULL,
  priority priority_level NOT NULL DEFAULT 'medium',
  target_date DATE,
  status follow_up_status DEFAULT 'planned',
  related_indicator_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Teaching Modules
CREATE TABLE teaching_modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  grade TEXT NOT NULL,
  phase class_phase NOT NULL,
  duration TEXT NOT NULL,
  meetings_count INTEGER NOT NULL DEFAULT 1,
  learning_outcome_ids UUID[] NOT NULL DEFAULT '{}',
  learning_objective_ids UUID[] NOT NULL DEFAULT '{}',
  status module_status DEFAULT 'draft',
  content JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Module Versions
CREATE TABLE module_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES teaching_modules(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content_snapshot JSONB NOT NULL,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(module_id, version_number)
);

-- Module Generation Logs
CREATE TABLE module_generation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES teaching_modules(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  prompt_version TEXT,
  generation_status generation_status NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Published Reports
CREATE TABLE published_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  learning_session_id UUID NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  report_snapshot JSONB NOT NULL,
  publication_status publication_status DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  unpublished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Published Assessments
CREATE TABLE published_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  assessment_activity_id UUID NOT NULL REFERENCES assessment_activities(id) ON DELETE CASCADE,
  published_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  publication_status publication_status DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parent Link Invitations
CREATE TABLE parent_link_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  invitation_token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'used', 'expired', 'revoked')),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_resource_id UUID,
  related_resource_type TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- School Reports
CREATE TABLE school_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  report_type school_report_type NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  report_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_profiles_school_id ON profiles(school_id);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_classes_school_id ON classes(school_id);
CREATE INDEX idx_classes_homeroom_teacher ON classes(homeroom_teacher_id);
CREATE INDEX idx_teacher_classes_teacher ON teacher_classes(teacher_id);
CREATE INDEX idx_teacher_classes_class ON teacher_classes(class_id);
CREATE INDEX idx_students_school_id ON students(school_id);
CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_nis ON students(nis);
CREATE INDEX idx_learning_outcomes_school_subject ON learning_outcomes(school_id, subject_id);
CREATE INDEX idx_learning_objectives_outcome ON learning_objectives(learning_outcome_id);
CREATE INDEX idx_learning_indicators_objective ON learning_indicators(learning_objective_id);
CREATE INDEX idx_learning_sessions_teacher ON learning_sessions(teacher_id);
CREATE INDEX idx_learning_sessions_class ON learning_sessions(class_id);
CREATE INDEX idx_learning_sessions_date ON learning_sessions(date);
CREATE INDEX idx_assessment_activities_teacher ON assessment_activities(teacher_id);
CREATE INDEX idx_assessment_activities_session ON assessment_activities(learning_session_id);
CREATE INDEX idx_assessment_results_activity ON assessment_results(assessment_activity_id);
CREATE INDEX idx_assessment_results_student ON assessment_results(student_id);
CREATE INDEX idx_reflection_questions_session ON reflection_questions(learning_session_id);
CREATE INDEX idx_reflection_answers_question ON reflection_answers(reflection_question_id);
CREATE INDEX idx_reflection_answers_teacher ON reflection_answers(teacher_id);
CREATE INDEX idx_ai_analyses_session ON ai_analyses(learning_session_id);
CREATE INDEX idx_ai_analyses_teacher ON ai_analyses(teacher_id);
CREATE INDEX idx_follow_up_actions_analysis ON follow_up_actions(ai_analysis_id);
CREATE INDEX idx_teaching_modules_teacher ON teaching_modules(teacher_id);
CREATE INDEX idx_published_reports_student ON published_reports(student_id);
CREATE INDEX idx_published_assessments_student ON published_assessments(student_id);
CREATE INDEX idx_parent_students_parent ON parent_students(parent_id);
CREATE INDEX idx_parent_students_student ON parent_students(student_id);
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);