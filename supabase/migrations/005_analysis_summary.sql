-- Denormalized headline metric used by school dashboards.
-- NULL means there is not enough configured criteria to calculate an overall percentage.
ALTER TABLE public.ai_analyses
  ADD COLUMN IF NOT EXISTS achievement_percentage NUMERIC(5,2);

ALTER TABLE public.ai_analyses
  DROP CONSTRAINT IF EXISTS ai_analyses_achievement_percentage_range;
ALTER TABLE public.ai_analyses
  ADD CONSTRAINT ai_analyses_achievement_percentage_range
  CHECK (achievement_percentage IS NULL OR (achievement_percentage >= 0 AND achievement_percentage <= 100));

ALTER TABLE public.ai_analyses
  ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE public.ai_analyses
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
