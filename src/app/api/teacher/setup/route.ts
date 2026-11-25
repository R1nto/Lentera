import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

export async function GET() {
  const auth = await createClient();
  const { data: authData } = await auth.auth.getUser();
  if (!authData.user) return NextResponse.json({ error: 'Silakan masuk terlebih dahulu.' }, { status: 401 });
  try {
    const db = await createServiceClient();
    const { data: profile, error: profileError } = await db.from('profiles')
      .select('full_name, role, school_id, avatar_url').eq('id', authData.user.id).maybeSingle();
    if (profileError) throw profileError;
    if (profile?.role !== 'guru' || !profile.school_id)
      return NextResponse.json({ error: 'Akses Guru tidak valid.' }, { status: 403 });
    const [assignments, classes, subjects] = await Promise.all([
      db.from('teacher_classes').select('class_id').eq('teacher_id', authData.user.id),
      db.from('classes').select('id,name,grade,phase').eq('school_id', profile.school_id).order('name'),
      db.from('subjects').select('id,name,phase').order('name'),
    ]);
    if (assignments.error || classes.error || subjects.error) throw assignments.error || classes.error || subjects.error;
    const allowed = new Set((assignments.data || []).map((row) => row.class_id));
    return NextResponse.json({
      profile: { full_name: profile.full_name, role: 'guru', avatar_url: profile.avatar_url, email: authData.user.email },
      classes: (classes.data || []).filter((row) => allowed.has(row.id) && /^[1-6]$/.test(String(row.grade))),
      subjects: (subjects.data || []).map((row) => ({ ...row, phase: Array.isArray(row.phase) && row.phase.length ? row.phase : ['A', 'B', 'C'] })).filter((row) => row.phase.some((phase: string) => ['A', 'B', 'C'].includes(phase))),
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    console.error('Teacher setup failed:', (error as { code?: string }).code);
    return NextResponse.json({ error: 'Data kelas belum bisa dimuat. Periksa izin service_role dan relasi Guru–kelas.' }, { status: 503 });
  }
}
