-- Prevent accidental duplicate token hashes.
CREATE UNIQUE INDEX IF NOT EXISTS parent_link_invitations_token_hash_unique
  ON public.parent_link_invitations (invitation_token_hash);

-- Restrict invitation management to the authenticated school principal
-- and require the creator identity to match the active session.
DROP POLICY IF EXISTS "Kepala sekolah can manage invitations" ON public.parent_link_invitations;

CREATE POLICY "Kepala sekolah can manage school invitations"
ON public.parent_link_invitations
FOR ALL
USING (
  public.is_kepala_sekolah()
  AND EXISTS (
    SELECT 1
    FROM public.students AS student
    WHERE student.id = parent_link_invitations.student_id
      AND student.school_id = public.get_current_school_id()
  )
)
WITH CHECK (
  public.is_kepala_sekolah()
  AND created_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.students AS student
    WHERE student.id = parent_link_invitations.student_id
      AND student.school_id = public.get_current_school_id()
  )
);
