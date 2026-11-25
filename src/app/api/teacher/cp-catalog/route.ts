import { cpSubjectMatches } from '@/lib/cp-catalog-match';
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const noStore = { 'Cache-Control': 'private, no-store' };

export async function GET(request: NextRequest) {
  try {
    const auth = await createClient();
    const { data: { user } } = await auth.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Silakan masuk kembali.' }, { status: 401, headers: noStore });
    const classId = request.nextUrl.searchParams.get('class_id') || '';
    const subjectId = request.nextUrl.searchParams.get('subject_id') || '';
    if (!uuid.test(classId) || !uuid.test(subjectId)) return NextResponse.json({ error: 'Pilih kelas dan mata pelajaran.' }, { status: 400, headers: noStore });
    const db = await createServiceClient();
    const [profile, klass, subject, assignments] = await Promise.all([
      db.from('profiles').select('school_id,role').eq('id',user.id).maybeSingle(),
      db.from('classes').select('school_id,grade,phase').eq('id',classId).maybeSingle(),
      db.from('subjects').select('id,name,code').eq('id',subjectId).maybeSingle(),
      db.from('teacher_classes').select('class_id,subject_id').eq('teacher_id',user.id).eq('class_id',classId),
    ]);
    if (profile.error || klass.error || subject.error || assignments.error) throw profile.error || klass.error || subject.error || assignments.error;
    const permitted = profile.data?.role === 'guru' && !!profile.data.school_id &&
      klass.data?.school_id === profile.data.school_id && !!subject.data &&
      (assignments.data || []).some(x => x.subject_id === null || x.subject_id === subjectId);
    if (!permitted) return NextResponse.json({ error: 'Kelas atau mata pelajaran di luar penugasan Guru.' }, { status: 403, headers: noStore });
    const phase = String(klass.data?.phase || '').toUpperCase();
    const grade = String(klass.data?.grade || '');
    const expected = ['1','2'].includes(grade) ? 'A' : ['3','4'].includes(grade) ? 'B' : ['5','6'].includes(grade) ? 'C' : null;
    if (!expected || expected !== phase) return NextResponse.json({ error: 'Fase kelas tidak sesuai jenjang SD.' }, { status: 400, headers: noStore });
    const { data, error } = await db.from('curriculum_cp_catalog')
      .select('id,reference_code,subject_name,phase,element,cp_excerpt,source_title,source_url,source_version')
      .eq('phase',phase).eq('active',true).order('element').limit(1000);
    if (error) {
      if (error.code === '42P01' || error.code === 'PGRST205' || error.code === 'PGRST204')
        return NextResponse.json({ error: 'Katalog CP belum dipasang. Jalankan migrasi SQL 026.', code: 'CP_CATALOG_MIGRATION' }, { status: 503, headers: noStore });
      throw error;
    }
    const list = (data || []).filter(cp => cpSubjectMatches(subject.data!.name, subject.data!.code || '', cp.subject_name));
    // An empty catalog is not an AI failure. Tell the teacher precisely why it is empty.
    const reason = list.length ? 'available' : !(data || []).length ? 'no_seed_for_phase' : 'subject_not_curated';
    return NextResponse.json({ items: list, phase, subject: subject.data!.name,
      reason, catalog_rows_for_phase: (data || []).length,
      curated_subjects: [...new Set((data || []).map(cp => cp.subject_name))]
    }, { headers: noStore });
  } catch (error) {
    console.error('CP catalog lookup failed:', (error as {code?:string}).code || 'unknown');
    return NextResponse.json({ error: 'Katalog CP belum dapat dibaca. Periksa migrasi 026 dan izin database.' }, { status: 503, headers: noStore });
  }
}
