-- LENTERA platform administration.
-- This is separate from school roles: platform admins do not need a profiles row.

CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.platform_settings (
  setting_key TEXT PRIMARY KEY CHECK (setting_key IN (
    'ai_provider',
    'ai_model',
    'ai_api_key_encrypted'
  )),
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- These tables are only accessed by trusted server code using the Supabase secret key.
REVOKE ALL ON TABLE public.platform_admins FROM anon, authenticated;
REVOKE ALL ON TABLE public.platform_settings FROM anon, authenticated;
GRANT ALL ON TABLE public.platform_admins TO service_role;
GRANT ALL ON TABLE public.platform_settings TO service_role;

CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admins AS admin_user
    WHERE admin_user.user_id = (SELECT auth.uid())
  );
$$;

REVOKE ALL ON FUNCTION public.is_platform_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_platform_admin() TO authenticated;

COMMENT ON TABLE public.platform_admins IS
  'Allowlist for LENTERA platform operators. Separate from school-level profile roles.';
COMMENT ON TABLE public.platform_settings IS
  'Private server-managed configuration. API secrets are encrypted before storage.';
