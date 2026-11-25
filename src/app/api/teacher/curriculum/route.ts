import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

type Db = Awaited<ReturnType<typeof createServiceClient>>;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const errorResponse = (error: string, status: number) => NextResponse.json({ error }, { status, headers: { 'Cache-Control': 'private, no-store' } });
const phaseForGrade = (grade: string) => grade === '1' || grade === '2' ? 'A' : grade === '3' || grade === '4' ? 'B' : grade === '5' || grade === '6' ? 'C' : null;

async function context(classId: string, subjectId: string) {
  const auth = await createClient();
  const { data: { user }, error: authError } = await auth.auth.getUser();
  if (authError || !user) return { failure: errorResponse('Sesi login tidak ditemukan.', 401) };
  if (!uuid.test(classId) || !uuid.test(subjectId)) return { failure: errorResponse('Pilih kelas dan mata pelajaran yang valid.', 400) };
  let db: Db;
  try { db = await createServiceClient(); }
  catch { return { failure: errorResponse('Koneksi server ke Supabase belum dikonfigurasi.', 503) }; }
  const [profile, chosenClass, assignment, subject] = await Promise.all([
    db.from('profiles').select('school_id,role').eq('id', user.id).maybeSingle(),
    db.from('classes').select('id,grade,phase,school_id').eq('id', classId).maybeSingle(),
    db.from('teacher_classes').select('id,subject_id').eq('class_id', classId).eq('teacher_id', user.id),
    db.from('subjects').select('id').eq('id', subjectId).maybeSingle(),
  ]);
  const dbError = profile.error || chosenClass.error || assignment.error || subject.error;
  if (dbError) {
    console.error('Curriculum context database error:', dbError.code, dbError.message);
    return { failure: errorResponse('Tidak dapat memverifikasi penugasan Guru. Periksa GRANT tabel profiles, classes, teacher_classes, dan subjects untuk service_role.', 503) };
  }
  const selectedClass = chosenClass.data;
  const phase = selectedClass ? phaseForGrade(String(selectedClass.grade)) : null;
  if (profile.data?.role !== 'guru' || !profile.data.school_id ||
      !selectedClass || selectedClass.school_id !== profile.data.school_id ||
      !subject.data || !phase || selectedClass.phase !== phase ||
      !(assignment.data || []).some(a => a.subject_id === null || a.subject_id === subjectId)) {
    return { failure: errorResponse('Kelas atau mata pelajaran tidak sesuai penugasan Guru SD (kelas 1–6).', 403) };
  }
  return { db, schoolId: profile.data.school_id as string, teacherId: user.id, phase };
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const ctx = await context(url.searchParams.get('class_id') || '', url.searchParams.get('subject_id') || '');
  if ('failure' in ctx) return ctx.failure;
  const db = ctx.db!;
  const { data: outcomes, error: cpError } = await db.from('learning_outcomes')
    .select('id,code,description').eq('school_id', ctx.schoolId!).eq('subject_id', url.searchParams.get('subject_id')!)
    .eq('phase', ctx.phase!).eq('is_active', true).order('code');
  if (cpError) {
    console.error('Curriculum CP lookup:', cpError.code, cpError.message);
    return errorResponse('Gagal membaca CP di database. Periksa migrasi dan izin learning_outcomes untuk service_role.', 503);
  }
  const cpIds = (outcomes || []).map(cp => cp.id);
  if (!cpIds.length) return NextResponse.json({ outcomes: [], objectives: [] }, { headers: { 'Cache-Control': 'private, no-store' } });
  const { data: objectives, error: tpError } = await db.from('learning_objectives')
    .select('id,code,description,learning_outcome_id').in('learning_outcome_id', cpIds)
    .eq('is_active', true).order('code');
  if (tpError) {
    console.error('Curriculum TP lookup:', tpError.code, tpError.message);
    return errorResponse('Gagal membaca TP di database. Periksa migrasi dan izin learning_objectives untuk service_role.', 503);
  }
  return NextResponse.json({ outcomes, objectives: objectives || [] }, { headers: { 'Cache-Control': 'private, no-store' } });
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return errorResponse('Format JSON tidak valid.', 400); }
  const classId = typeof body.class_id === 'string' ? body.class_id : '';
  const subjectId = typeof body.subject_id === 'string' ? body.subject_id : '';
  const ctx = await context(classId, subjectId);
  if ('failure' in ctx) return ctx.failure;
  const kind = body.kind;
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  if (!['cp','tp'].includes(String(kind)) || code.length < 2 || code.length > 80 || description.length < 10 || description.length > 4000) {
    return errorResponse('Kode minimal 2 karakter dan deskripsi minimal 10 karakter.', 400);
  }
  const db = ctx.db!;
  if (kind === 'cp') {
    const existing = await db.from('learning_outcomes').select('id').eq('school_id', ctx.schoolId!)
      .eq('subject_id', subjectId).eq('phase', ctx.phase!).eq('code', code).limit(1);
    if (existing.error) return errorResponse('Gagal memeriksa kode CP. Periksa izin database.', 503);
    if (existing.data?.length) return errorResponse('Kode CP sudah digunakan untuk mata pelajaran dan fase ini.', 409);
    const result = await db.from('learning_outcomes').insert({
      school_id: ctx.schoolId, subject_id: subjectId, phase: ctx.phase,
      code, description, is_active: true, created_by: ctx.teacherId,
    }).select('id').single();
    if (result.error) {
      console.error('Create CP:', result.error.code, result.error.message);
      return errorResponse('Gagal menyimpan CP. Periksa izin INSERT learning_outcomes untuk service_role.', 503);
    }
    return NextResponse.json({ id: result.data.id }, { status: 201 });
  }
  const cpId = typeof body.learning_outcome_id === 'string' ? body.learning_outcome_id : '';
  if (!uuid.test(cpId)) return errorResponse('Pilih CP induk yang valid.', 400);
  const cp = await db.from('learning_outcomes').select('id').eq('id', cpId).eq('school_id', ctx.schoolId!)
    .eq('subject_id', subjectId).eq('phase', ctx.phase!).eq('is_active', true).maybeSingle();
  if (cp.error) return errorResponse('Gagal memverifikasi CP induk.', 503);
  if (!cp.data) return errorResponse('CP induk bukan bagian dari sekolah, mata pelajaran, atau fase yang dipilih.', 403);
  const existing = await db.from('learning_objectives').select('id').eq('learning_outcome_id', cpId).eq('code', code).limit(1);
  if (existing.error) return errorResponse('Gagal memeriksa kode TP.', 503);
  if (existing.data?.length) return errorResponse('Kode TP sudah digunakan pada CP ini.', 409);
  const result = await db.from('learning_objectives').insert({
    learning_outcome_id: cpId, code, description, created_by: ctx.teacherId, is_active: true,
  }).select('id').single();
  if (result.error) {
    console.error('Create TP:', result.error.code, result.error.message);
    return errorResponse('Gagal menyimpan TP. Periksa izin INSERT learning_objectives untuk service_role.', 503);
  }
  return NextResponse.json({ id: result.data.id }, { status: 201 });
}
