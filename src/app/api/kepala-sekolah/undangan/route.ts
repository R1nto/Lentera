import { randomBytes, createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

type PrincipalContext = {
  service: Awaited<ReturnType<typeof createServiceClient>>;
  schoolId: string;
  userId: string;
  name: string;
  email: string;
  avatarUrl: string | null;
};

const noStore = { 'Cache-Control': 'no-store' };
const failure = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: noStore });

async function getPrincipal(): Promise<PrincipalContext | NextResponse> {
  const session = await createClient();
  const { data: { user }, error } = await session.auth.getUser();
  if (error || !user) return failure('Sesi tidak ditemukan. Silakan masuk kembali.', 401);

  const service = await createServiceClient();
  const { data: profile, error: profileError } = await service
    .from('profiles')
    .select('role,school_id,full_name,avatar_url')
    .eq('id', user.id)
    .maybeSingle();
  if (profileError) {
    console.error('Invitation principal profile read failed:', profileError);
    return failure('Profil sekolah belum dapat dibaca. Periksa izin service_role pada profiles.', 503);
  }
  if (!profile || profile.role !== 'kepala_sekolah' || !profile.school_id) {
    return failure('Menu ini hanya untuk Kepala Sekolah yang memiliki sekolah.', 403);
  }
  return {
    service, schoolId: profile.school_id, userId: user.id,
    name: profile.full_name || 'Kepala Sekolah',
    email: user.email || '', avatarUrl: profile.avatar_url || null,
  };
}

export async function GET() {
  try {
    const principal = await getPrincipal();
    if (principal instanceof NextResponse) return principal;
    const { service, schoolId } = principal;
    const { data: students, error: studentsError } = await service
      .from('students')
      .select('id,nis,full_name,class_id')
      .eq('school_id', schoolId)
      .eq('is_active', true)
      .order('full_name');
    if (studentsError) throw studentsError;

    const studentIds = (students || []).map((student) => student.id);
    const classIds = [...new Set((students || []).map((student) => student.class_id).filter(Boolean))];
    const { data: classes, error: classesError } = classIds.length
      ? await service.from('classes').select('id,name').eq('school_id', schoolId).in('id', classIds)
      : { data: [], error: null };
    if (classesError) throw classesError;
    const classNames = new Map((classes || []).map((item) => [item.id, item.name]));
    const studentNames = new Map((students || []).map((item) => [item.id, item]));

    const { data: invitations, error: invitationsError } = studentIds.length
      ? await service.from('parent_link_invitations')
        .select('id,student_id,status,expires_at,created_at')
        .in('student_id', studentIds)
        .order('created_at', { ascending: false })
        .limit(50)
      : { data: [], error: null };
    if (invitationsError) throw invitationsError;

    return NextResponse.json({
      user: { full_name: principal.name, role: 'kepala_sekolah', email: principal.email, avatar_url: principal.avatarUrl },
      students: (students || []).map((student) => ({
        id: student.id, nis: student.nis, full_name: student.full_name,
        class_name: classNames.get(student.class_id) || 'Kelas belum tersedia',
      })),
      invitations: (invitations || []).map((invite) => ({
        ...invite,
        student_name: studentNames.get(invite.student_id)?.full_name || 'Siswa',
        student_nis: studentNames.get(invite.student_id)?.nis || '-',
      })),
    }, { headers: noStore });
  } catch (error) {
    console.error('Principal invitation list failed:', error);
    return failure('Data undangan gagal dimuat. Periksa izin service_role pada students, classes, dan parent_link_invitations serta log server.', 503);
  }
}

export async function POST(request: NextRequest) {
  try {
    const principal = await getPrincipal();
    if (principal instanceof NextResponse) return principal;
    let body: unknown;
    try { body = await request.json(); } catch { return failure('Format data tidak valid.', 400); }
    const studentId = body && typeof body === 'object' && 'student_id' in body && typeof body.student_id === 'string' ? body.student_id : '';
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(studentId)) {
      return failure('Pilih siswa yang valid terlebih dahulu.', 400);
    }
    const { service, schoolId, userId } = principal;
    const { data: student, error: studentError } = await service.from('students')
      .select('id').eq('id', studentId).eq('school_id', schoolId).eq('is_active', true).maybeSingle();
    if (studentError) throw studentError;
    if (!student) return failure('Siswa tidak ditemukan pada sekolah Anda atau tidak aktif.', 403);

    const code = randomBytes(24).toString('hex');
    const tokenHash = createHash('sha256').update(code).digest('hex');
    const { error: createError } = await service.from('parent_link_invitations').insert({
      student_id: studentId,
      invitation_token_hash: tokenHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_by: userId,
      status: 'pending',
    });
    if (createError) throw createError;
    return NextResponse.json({ code, message: 'Undangan berhasil dibuat. Salin kode sekarang karena hanya ditampilkan sekali.' }, { status: 201, headers: noStore });
  } catch (error) {
    console.error('Principal invitation creation failed:', error);
    return failure('Gagal membuat undangan. Periksa izin INSERT pada parent_link_invitations untuk service_role di log server.', 503);
  }
}
