import { createClient } from '@/lib/supabase/server';

export async function isCurrentUserPlatformAdmin() {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return { isAdmin: false, user: null };

  const { data, error } = await supabase.rpc('is_platform_admin');
  if (error) return { isAdmin: false, user };
  return { isAdmin: data === true, user };
}
