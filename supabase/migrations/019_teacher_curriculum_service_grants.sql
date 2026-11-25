-- LENTERA 019 — Guru kurikulum, server API only.
-- Jalankan setelah 018, dengan backup dan setelah meninjau hak akses.
-- Tidak memberi hak INSERT CP/TP kepada anon ataupun authenticated.
BEGIN;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT SELECT, INSERT ON TABLE public.learning_outcomes, public.learning_objectives TO service_role;
COMMIT;
-- Verify (read-only):
SELECT
  has_table_privilege('service_role', 'public.learning_outcomes', 'SELECT') AS read_cp,
  has_table_privilege('service_role', 'public.learning_outcomes', 'INSERT') AS create_cp,
  has_table_privilege('service_role', 'public.learning_objectives', 'SELECT') AS read_tp,
  has_table_privilege('service_role', 'public.learning_objectives', 'INSERT') AS create_tp;
