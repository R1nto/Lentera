-- V12.10.2: keep CP/TP/indicator text from the selected teaching module on
-- the learning session. Historical sessions remain compatible.
ALTER TABLE public.learning_sessions
  ADD COLUMN IF NOT EXISTS module_curriculum_snapshot jsonb NOT NULL DEFAULT '{"cp":[],"tp":[]}'::jsonb;
COMMENT ON COLUMN public.learning_sessions.module_curriculum_snapshot IS
  'Immutable-at-creation text snapshot from selected teaching module CP/TP/indicators; not a mapping to curriculum UUIDs.';
NOTIFY pgrst, 'reload schema';
