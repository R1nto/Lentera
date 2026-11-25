export type UserRole = 'guru' | 'kepala_sekolah' | 'wali_murid';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  identifier: string; // NIP for guru, school_id for kepala_sekolah, email for wali_murid
  school_id: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface School {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  logo_url?: string;
  academic_year: string;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  school_id: string;
  name: string;
  grade: string; // e.g., "IV", "VII", "X"
  phase: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  academic_year: string;
  homeroom_teacher_id?: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherClass {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id?: string;
  is_homeroom: boolean;
  created_at: string;
}

export interface Subject {
  id: string;
  name: string;
  code?: string;
  description?: string;
  phase: ('A' | 'B' | 'C' | 'D' | 'E' | 'F')[];
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  school_id: string;
  class_id: string;
  nis: string;
  nisn?: string;
  full_name: string;
  gender?: 'L' | 'P';
  birth_date?: string;
  birth_place?: string;
  address?: string;
  parent_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParentStudent {
  id: string;
  parent_id: string;
  student_id: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'revoked';
  verified_at?: string;
  created_at: string;
}

export interface LearningOutcome {
  id: string;
  school_id: string;
  subject_id: string;
  phase: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  code: string;
  description: string;
  curriculum_version?: string;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LearningObjective {
  id: string;
  learning_outcome_id: string;
  code: string;
  description: string;
  order_index: number;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LearningIndicator {
  id: string;
  learning_objective_id: string;
  code: string;
  description: string;
  criteria: string; // rubrik/kriteria ketercapaian
  assessment_method?: string;
  order_index: number;
  is_mandatory: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface LearningSession {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  title: string;
  topic: string;
  phase: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  date: string;
  duration_minutes: number;
  learning_outcome_ids: string[];
  learning_objective_ids: string[];
  notes?: string;
  status: 'draft' | 'planned' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface LearningSessionObjective {
  id: string;
  learning_session_id: string;
  learning_objective_id: string;
  order_index: number;
}

export type AssessmentType = 'formatif' | 'sumatif';

export interface AssessmentActivity {
  id: string;
  teacher_id: string;
  class_id: string;
  subject_id: string;
  learning_session_id?: string;
  learning_objective_id?: string;
  learning_indicator_ids: string[];
  title: string;
  description?: string;
  type: AssessmentType;
  max_score: number;
  date: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface AssessmentResult {
  id: string;
  assessment_activity_id: string;
  student_id: string;
  score: number;
  notes?: string;
  evidence_urls?: string[];
  created_at: string;
  updated_at: string;
}

export interface ReflectionQuestion {
  id: string;
  learning_session_id: string;
  question: string;
  purpose: string;
  related_indicator_ids: string[];
  response_type: 'short_text' | 'long_text' | 'single_choice' | 'multiple_choice' | 'scale';
  options?: string[];
  is_required: boolean;
  order_index: number;
  generated_by_ai: boolean;
  created_at: string;
}

export interface ReflectionAnswer {
  id: string;
  reflection_question_id: string;
  teacher_id: string;
  answer: string;
  is_draft: boolean;
  created_at: string;
  updated_at: string;
}

export interface AIAnalysis {
  id: string;
  learning_session_id: string;
  teacher_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input_snapshot: Record<string, unknown>;
  input_hash: string;
  deterministic_metrics: DeterministicMetrics;
  ai_output?: AIAnalysisOutput;
  provider?: string;
  model?: string;
  prompt_version?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface DeterministicMetrics {
  total_students: number;
  students_with_valid_evidence: number;
  students_meeting_criteria: number;
  students_needing_support: number;
  achievement_percentage: number;
  indicator_analysis: IndicatorAnalysis[];
  data_completeness: {
    indicator_id: string;
    students_with_data: number;
    students_without_data: number;
  }[];
}

export interface IndicatorAnalysis {
  indicator_id: string;
  indicator_code: string;
  indicator_description: string;
  students_meeting_criteria: number;
  students_with_valid_evidence: number;
  percentage: number;
  status: 'achieved' | 'needs_improvement' | 'insufficient_data';
}

export interface AIAnalysisOutput {
  summary: string;
  overall_interpretation: string;
  indicator_analysis: AIIndicatorAnalysis[];
  reflection_analysis: {
    strengths: string[];
    challenges: string[];
    alignment_with_assessment: string;
  };
  student_support_groups: StudentSupportGroup[];
  recommendations: AIRecommendation[];
  limitations: string[];
}

export interface AIIndicatorAnalysis {
  indicator_id: string;
  status: 'achieved' | 'needs_improvement' | 'insufficient_data';
  evidence_summary: string;
  learning_gap: string;
  interpretation: string;
}

export interface StudentSupportGroup {
  student_ref: string; // anonymous reference
  related_indicator_ids: string[];
  evidence_summary: string;
  suggested_support: string;
}

export interface AIRecommendation {
  category: 'remedial' | 'enrichment' | 'teaching_strategy' | 'media' | 'assessment';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  rationale: string;
  related_indicator_ids: string[];
}

export interface FollowUpAction {
  id: string;
  ai_analysis_id: string;
  teacher_id: string;
  title: string;
  description: string;
  category: 'remedial' | 'enrichment' | 'teaching_strategy' | 'media' | 'assessment' | 'other';
  priority: 'high' | 'medium' | 'low';
  target_date?: string;
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  related_indicator_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface TeachingModule {
  id: string;
  teacher_id: string;
  school_id: string;
  class_id?: string;
  subject_id: string;
  title: string;
  grade: string;
  phase: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  duration: string; // e.g., "4 x 35 menit"
  meetings_count: number;
  learning_outcome_ids: string[];
  learning_objective_ids: string[];
  status: 'draft' | 'completed' | 'archived';
  content: TeachingModuleContent;
  created_at: string;
  updated_at: string;
}

export interface TeachingModuleContent {
  identity: {
    title: string;
    grade: string;
    phase: string;
    subject: string;
    topic: string;
    duration: string;
    meetings_count: number;
  };
  learning_outcomes: Array<{ id: string; code: string; description: string }>;
  learning_objectives: Array<{ id: string; code: string; description: string; indicators: Array<{ id: string; code: string; description: string; criteria: string }> }>;
  initial_competencies: string[];
  meaningful_understanding: string[];
  trigger_questions: string[];
  learning_materials: string[];
  learning_activities: {
    introduction: LearningActivity[];
    main: LearningActivity[];
    closing: LearningActivity[];
  };
  assessments: {
    diagnostic: AssessmentPlan[];
    formative: AssessmentPlan[];
    summative: AssessmentPlan[];
  };
  differentiation: {
    content: string[];
    process: string[];
    product: string[];
  };
  remedial: string[];
  enrichment: string[];
  teacher_reflection: string[];
  student_reflection: string[];
}

export interface LearningActivity {
  description: string;
  teacher_activity: string;
  student_activity: string;
  duration_minutes: number;
  related_objective_ids: string[];
}

export interface AssessmentPlan {
  name: string;
  type: AssessmentType;
  technique: string;
  instrument: string;
  related_indicator_ids: string[];
  rubric?: string;
}

export interface ModuleVersion {
  id: string;
  module_id: string;
  version_number: number;
  content_snapshot: TeachingModuleContent;
  created_by: string;
  created_at: string;
}

export interface ModuleGenerationLog {
  id: string;
  module_id: string;
  provider: string;
  model: string;
  prompt_version: string;
  generation_status: 'success' | 'failed' | 'partial';
  error_message?: string;
  created_at: string;
}

export interface PublishedReport {
  id: string;
  student_id: string;
  teacher_id: string;
  learning_session_id: string;
  report_snapshot: Record<string, unknown>;
  publication_status: 'draft' | 'published' | 'unpublished';
  published_at?: string;
  unpublished_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PublishedAssessment {
  id: string;
  student_id: string;
  assessment_activity_id: string;
  published_by: string;
  publication_status: 'draft' | 'published' | 'unpublished';
  published_at?: string;
  created_at: string;
}

export interface ParentLinkInvitation {
  id: string;
  student_id: string;
  invitation_token_hash: string;
  expires_at: string;
  status: 'pending' | 'used' | 'expired' | 'revoked';
  created_by: string;
  used_at?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_id: string;
  notification_type: 'new_report' | 'new_assessment' | 'recommendation' | 'status_change' | 'system';
  title: string;
  message: string;
  related_resource_id?: string;
  related_resource_type?: string;
  is_read: boolean;
  created_at: string;
}

export interface SchoolReport {
  id: string;
  school_id: string;
  created_by: string;
  report_type: 'learning_summary' | 'assessment_summary' | 'tp_progress' | 'teacher_activity' | 'class_progress';
  period_start: string;
  period_end: string;
  report_snapshot: Record<string, unknown>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}