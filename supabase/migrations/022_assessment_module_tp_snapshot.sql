-- V12.10.1: Preserve TP/indicator text from the selected module in the assessment.
-- Existing assessments remain unchanged. TP snapshots are not curriculum UUIDs.
ALTER TABLE public.assessment_activities
  ADD COLUMN IF NOT EXISTS module_tp_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb;
COMMENT ON COLUMN public.assessment_activities.module_tp_snapshot IS
  'TP and indicator descriptions from a selected teaching module, copied when the assessment is created; not a substitute for mapped curriculum TP UUIDs.';
