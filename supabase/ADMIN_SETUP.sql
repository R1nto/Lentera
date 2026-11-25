-- LANGKAH PERTAMA ADMIN LENTERA
-- 1. Buat user melalui Supabase Dashboard > Authentication > Users > Add user.
-- 2. Ganti email di bawah dengan email akun yang baru dibuat.
-- 3. Jalankan SQL ini setelah migration 008 dijalankan.
-- 4. Jangan pernah menyimpan password atau API key di file SQL ini.

DO $$
DECLARE
  target_admin_id UUID;
BEGIN
  SELECT id
  INTO target_admin_id
  FROM auth.users
  WHERE lower(email) = lower('ganti-dengan-email-admin@domain.sch.id')
  LIMIT 1;

  IF target_admin_id IS NULL THEN
    RAISE EXCEPTION 'Akun belum ditemukan. Buat user terlebih dahulu di Supabase Authentication > Users.';
  END IF;

  INSERT INTO public.platform_admins (user_id)
  VALUES (target_admin_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Pastikan akun terdaftar sebagai admin:
SELECT auth_user.id, auth_user.email, platform_admin.created_at
FROM public.platform_admins AS platform_admin
JOIN auth.users AS auth_user ON auth_user.id = platform_admin.user_id
WHERE lower(auth_user.email) = lower('ganti-dengan-email-admin@domain.sch.id');
