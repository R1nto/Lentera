import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const phases = new Set(['A', 'B', 'C']);
const phaseForGrade = (grade: string) => grade === '1' || grade === '2' ? 'A' : grade === '3' || grade === '4' ? 'B' : grade === '5' || grade === '6' ? 'C' : null;
const deny = (message: string, status: number) => NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'private, no-store' } });

export async function POST(request: NextRequest) {
  const auth = await createClient();
  const { data: { user } } = await auth.auth.getUser();
  if (!user) return deny('Sesi login berakhir. Masuk kembali.', 401);
  // Read the authoritative role through the server service client; browser RLS may
  // be misconfigured and must not silently break API authorization.
  let db: Awaited<ReturnType<typeof createServiceClient>>;
  try { db = await createServiceClient(); }
  catch { return deny('Konfigurasi Supabase server belum tersedia.', 503); }
  const { data: profile, error: profileError } = await db.from('profiles')
    .select('role, school_id').eq('id', user.id).maybeSingle();
  if (profileError) return deny('Database belum dapat memverifikasi profil Guru.', 503);
  if (profile?.role !== 'guru' || !profile.school_id) return deny('Akses Guru tidak valid.', 403);

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return deny('Format JSON tidak valid.', 400); }
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const topic = typeof body.topic === 'string' ? body.topic.trim() : '';
  const classId = typeof body.class_id === 'string' ? body.class_id : '';
  const subjectId = typeof body.subject_id === 'string' ? body.subject_id : '';
  const phase = typeof body.phase === 'string' ? body.phase : '';
  const date = typeof body.date === 'string' ? body.date : '';
  const duration = Number(body.duration_minutes);
  const cp = Array.isArray(body.learning_outcome_ids) ? body.learning_outcome_ids : [];
  const tp = Array.isArray(body.learning_objective_ids) ? body.learning_objective_ids : [];
  const moduleId = typeof body.module_id === 'string' ? body.module_id : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  if (title.length < 3 || title.length > 200 || !topic || topic.length > 300 ||
      !uuid.test(classId) || !uuid.test(subjectId) || !phases.has(phase) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isInteger(duration) || duration < 1 || duration > 1440 ||
      (moduleId !== '' && !uuid.test(moduleId)) || cp.length > 100 || tp.length > 100 || !cp.every(id => typeof id === 'string' && uuid.test(id)) ||
      !tp.every(id => typeof id === 'string' && uuid.test(id)) || notes.length > 10000)
    return deny('Periksa judul, kelas, mata pelajaran, tanggal, durasi, CP/TP, dan catatan.', 400);

  try {
    const [assignment, classResult, subjectResult, moduleResult] = await Promise.all([
      db.from('teacher_classes').select('id,subject_id').eq('teacher_id', user.id).eq('class_id', classId),
      db.from('classes').select('school_id,grade,phase').eq('id', classId).maybeSingle(),
      db.from('subjects').select('id,phase').eq('id', subjectId).maybeSingle(),
      moduleId ? db.from('teaching_modules').select('id,teacher_id,school_id,class_id,subject_id,content,learning_outcome_ids,learning_objective_ids').eq('id', moduleId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    ]);
    if (assignment.error || classResult.error || subjectResult.error || moduleResult.error) throw assignment.error || classResult.error || subjectResult.error || moduleResult.error;
    if (moduleId && (!moduleResult.data || moduleResult.data.teacher_id !== user.id || moduleResult.data.school_id !== profile.school_id || moduleResult.data.class_id !== classId || moduleResult.data.subject_id !== subjectId)) return deny('Modul Ajar tidak sesuai penugasan, sekolah, kelas, atau mata pelajaran.', 403);
    const allowedAssignment = (assignment.data || []).some((row) => row.subject_id === null || row.subject_id === subjectId);
    if (!allowedAssignment || !classResult.data || classResult.data.school_id !== profile.school_id) return deny('Kelas atau mata pelajaran bukan bagian dari penugasan Guru.', 403);
    if (phaseForGrade(String(classResult.data.grade)) !== phase) return deny('Pembelajaran SD hanya boleh untuk kelas 1–6 dan fase A, B, atau C.', 400);
    if (!subjectResult.data) return deny('Mata pelajaran tidak ditemukan.', 400);
    if (subjectResult.data.phase?.length && !subjectResult.data.phase.includes(phase as never)) return deny('Mata pelajaran ini tidak tersedia untuk fase kelas yang dipilih.', 400);
    if (classResult.data.phase !== phase) return deny('Fase pembelajaran harus sesuai fase kelas.', 400);
    // Validate selected curriculum IDs at the server boundary, not just in the UI.
    // A teacher may only attach CP from their school, subject, and grade phase;
    // each TP must belong to a CP explicitly selected in this session.
    const cpIds = [...new Set(cp as string[])];
    const tpIds = [...new Set(tp as string[])];
    if (cpIds.length) {
      const cpCheck = await db.from('learning_outcomes').select('id')
        .in('id', cpIds).eq('school_id', profile.school_id)
        .eq('subject_id', subjectId).eq('phase', phase).eq('is_active', true);
      if (cpCheck.error) throw cpCheck.error;
      if ((cpCheck.data || []).length !== cpIds.length) return deny('CP tidak cocok dengan sekolah, pelajaran, atau fase kelas.', 400);
    }
    if (tpIds.length) {
      if (!cpIds.length) return deny('Pilih CP induk sebelum memilih TP.', 400);
      const tpCheck = await db.from('learning_objectives').select('id,learning_outcome_id')
        .in('id', tpIds).in('learning_outcome_id', cpIds).eq('is_active', true);
      if (tpCheck.error) throw tpCheck.error;
      if ((tpCheck.data || []).length !== tpIds.length) return deny('TP bukan bagian dari CP yang dipilih.', 400);
    }
    // Derive CP/TP snapshot on the server from the validated module (never
    // trust a client-provided snapshot). Module text is not a curriculum UUID.
    const moduleContent = moduleResult.data && typeof moduleResult.data.content === 'object' &&
      moduleResult.data.content && !Array.isArray(moduleResult.data.content)
      ? moduleResult.data.content as Record<string, unknown> : null;
    const snapshotRows = (camel: string, snake: string) => {
      const value = moduleContent?.[camel] ?? moduleContent?.[snake];
      return Array.isArray(value) ? value : [];
    };
    const snapshotText = (v: unknown) => typeof v === 'string' ? v.trim().slice(0, 3000) : '';
    const asRow = (v: unknown): Record<string, unknown> | null =>
      v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : null;
    const moduleCurriculumSnapshot = moduleId ? {
      cp: snapshotRows('learningOutcomes', 'learning_outcomes').slice(0, 100).flatMap((value, i) => {
        const row = asRow(value);
        const description = snapshotText(row?.description ?? value);
        return description ? [{ code: snapshotText(row?.code) || `CP-${i + 1}`, description }] : [];
      }),
      tp: snapshotRows('learningObjectives', 'learning_objectives').slice(0, 100).flatMap((value, i) => {
        const row = asRow(value);
        const description = snapshotText(row?.description ?? value);
        if (!description) return [];
        const indicators = (Array.isArray(row?.indicators) ? row.indicators : []).slice(0, 50).flatMap((ind, j) => {
          const item = asRow(ind);
          const description = snapshotText(item?.description ?? ind);
          return description ? [{ code: snapshotText(item?.code) || `IND-${j + 1}`, description }] : [];
        });
        return [{ code: snapshotText(row?.code) || `TP-${i + 1}`, description, indicators }];
      }),
    } : { cp: [], tp: [] };
    if (moduleId && (!moduleCurriculumSnapshot.cp.length || !moduleCurriculumSnapshot.tp.length)) {
      return deny('Modul Ajar belum memiliki CP dan TP lengkap. Periksa isi modul sebelum membuat analisis.', 400);
    }
    const result = await db.from('learning_sessions').insert({
      teacher_id: user.id, class_id: classId, subject_id: subjectId, module_id: moduleId || null,
      title, topic, phase, date, duration_minutes: duration,
      learning_outcome_ids: cpIds, learning_objective_ids: tpIds, module_curriculum_snapshot: moduleCurriculumSnapshot, notes: notes || null, status: 'draft',
    }).select('id').single();
    if (result.error) throw result.error;
    return NextResponse.json({ ok: true, id: result.data.id }, { status: 201, headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : 'UNKNOWN';
    console.error('Teacher create session failed:', code);
    return deny('Pembelajaran belum tersimpan. Periksa migrasi izin service_role dan struktur tabel learning_sessions.', 503);
  }
}
