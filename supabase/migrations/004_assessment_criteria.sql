-- Explicit numeric criteria prevent the analysis engine from inventing thresholds.
ALTER TABLE public.assessment_activities
  ADD COLUMN IF NOT EXISTS minimum_score NUMERIC(6,2);

ALTER TABLE public.assessment_activities
  DROP CONSTRAINT IF EXISTS assessment_activities_minimum_score_range;
ALTER TABLE public.assessment_activities
  ADD CONSTRAINT assessment_activities_minimum_score_range
  CHECK (minimum_score IS NULL OR (minimum_score >= 0 AND minimum_score <= max_score));

ALTER TABLE public.learning_indicators
  ADD COLUMN IF NOT EXISTS achievement_threshold NUMERIC(5,2);

ALTER TABLE public.learning_indicators
  DROP CONSTRAINT IF EXISTS learning_indicators_achievement_threshold_range;
ALTER TABLE public.learning_indicators
  ADD CONSTRAINT learning_indicators_achievement_threshold_range
  CHECK (achievement_threshold IS NULL OR (achievement_threshold >= 0 AND achievement_threshold <= 100));

COMMENT ON COLUMN public.assessment_activities.minimum_score IS
  'Minimum score for meeting criteria in this assessment; NULL means teacher has not configured a numeric rubric threshold.';
COMMENT ON COLUMN public.learning_indicators.achievement_threshold IS
  'Required percentage of students meeting criteria for an indicator to be marked achieved; NULL means no aggregation rule has been configured.';

ALTER TABLE public.assessment_activities
  ADD COLUMN IF NOT EXISTS achievement_threshold NUMERIC(5,2);

ALTER TABLE public.assessment_activities
  DROP CONSTRAINT IF EXISTS assessment_activities_achievement_threshold_range;
ALTER TABLE public.assessment_activities
  ADD CONSTRAINT assessment_activities_achievement_threshold_range
  CHECK (achievement_threshold IS NULL OR (achievement_threshold >= 0 AND achievement_threshold <= 100));

COMMENT ON COLUMN public.assessment_activities.achievement_threshold IS
  'Minimum percentage of students who should meet the score criterion before an indicator can be marked achieved.';

ALTER TABLE public.assessment_activities
  ADD COLUMN IF NOT EXISTS learning_session_id UUID REFERENCES public.learning_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS assessment_activities_learning_session_idx
  ON public.assessment_activities (learning_session_id);
