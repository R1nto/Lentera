-- Atomic parent account registration.
-- The function is only callable by the server-side service_role client.

CREATE OR REPLACE FUNCTION public.register_parent_account(
  p_user_id UUID,
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT,
  p_invitation_token_hash TEXT,
  p_child_nis TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, auth, pg_temp
AS $$
DECLARE
  v_auth_email TEXT;
  v_invitation_id UUID;
  v_student_id UUID;
  v_student_nis TEXT;
  v_school_id UUID;
BEGIN
  IF p_user_id IS NULL
     OR length(btrim(COALESCE(p_full_name, ''))) < 2
     OR length(btrim(COALESCE(p_email, ''))) = 0
     OR length(COALESCE(p_invitation_token_hash, '')) <> 64 THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVALID_REGISTRATION_INPUT';
  END IF;

  SELECT lower(u.email)
    INTO v_auth_email
    FROM auth.users AS u
   WHERE u.id = p_user_id;

  IF v_auth_email IS NULL OR v_auth_email <> lower(btrim(p_email)) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'AUTH_USER_MISMATCH';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles AS p WHERE p.id = p_user_id) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'PROFILE_EXISTS';
  END IF;

  SELECT invitation.id, invitation.student_id
    INTO v_invitation_id, v_student_id
    FROM public.parent_link_invitations AS invitation
   WHERE invitation.invitation_token_hash = p_invitation_token_hash
     AND invitation.status = 'pending'
     AND invitation.expires_at > now()
   FOR UPDATE;

  IF v_invitation_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVITATION_INVALID';
  END IF;

  SELECT student.nis, student.school_id
    INTO v_student_nis, v_school_id
    FROM public.students AS student
   WHERE student.id = v_student_id
     AND student.is_active = TRUE;

  IF v_school_id IS NULL THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVITATION_INVALID';
  END IF;

  IF NULLIF(btrim(COALESCE(p_child_nis, '')), '') IS NOT NULL
     AND v_student_nis <> btrim(p_child_nis) THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'CHILD_NIS_MISMATCH';
  END IF;

  INSERT INTO public.profiles (id, full_name, role, identifier, school_id, phone)
  VALUES (
    p_user_id,
    btrim(p_full_name),
    'wali_murid',
    lower(btrim(p_email)),
    v_school_id,
    NULLIF(btrim(COALESCE(p_phone, '')), '')
  );

  INSERT INTO public.parent_students (
    parent_id, student_id, verification_status, verified_at
  ) VALUES (
    p_user_id, v_student_id, 'verified', now()
  );

  UPDATE public.parent_link_invitations
     SET status = 'used', used_at = now()
   WHERE id = v_invitation_id
     AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION USING ERRCODE = 'P0001', MESSAGE = 'INVITATION_INVALID';
  END IF;

  RETURN v_student_id;
END;
$$;

REVOKE ALL ON FUNCTION public.register_parent_account(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.register_parent_account(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_parent_account(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;
