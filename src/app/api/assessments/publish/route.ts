import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const response = (data: Record<string, unknown>, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
const isUUID = (value: unknown): value is string => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export async function POST(request: NextRequest) {
  try {
    const auth = await createClient();
    const { data: { user }, error: authError } = await auth.auth.getUser();
    if (authError || !user) return response({ error: 'Silakan masuk sebagai Guru.' }, 401);
    const { data: profile, error: profileError } = await auth.from('profiles').select('role,school_id').eq('id', user.id).maybeSingle();
    if (profileError || profile?.role !== 'guru' || !profile.school_id) return response({ error: 'Akun Guru dan sekolah belum terverifikasi.' }, 403);
    const body = await request.json().catch(() => ({}));
    if (!isUUID(body.assessment_id)) return response({ error: 'ID asesmen tidak valid.' }, 400);
    const db = await createServiceClient();
    const { data: activity, error: activityError } = await db.from('assessment_activities')
      .select('id,teacher_id,class_id,subject_id,max_score,classes!inner(school_id)')
      .eq('id', body.assessment_id).eq('teacher_id', user.id).maybeSingle();
    if (activityError) throw activityError;
    const school = activity?.classes as unknown as { school_id: string } | null;
    if (!activity || school?.school_id !== profile.school_id) return response({ error: 'Asesmen bukan milik Guru/sekolah ini.' }, 403);
    const [{ data: results, error: resultError }, { data: pupils, error: pupilError }] = await Promise.all([
      db.from('assessment_results').select('student_id,score').eq('assessment_activity_id', activity.id),
      db.from('students').select('id').eq('class_id', activity.class_id).eq('school_id', profile.school_id).eq('is_active', true),
    ]);
    if (resultError || pupilError) throw resultError || pupilError;
    const pupilIds = new Set((pupils || []).map(row => row.id));
    const validResults = (results || []).filter(row => pupilIds.has(row.student_id) && Number.isFinite(row.score) && row.score >= 0 && row.score <= activity.max_score);
    if (!validResults.length) return response({ error: 'Belum ada nilai siswa valid. Simpan nilai terlebih dahulu.' }, 409);
    const ids = validResults.map(row => row.student_id);
    const { data: existing, error: existingError } = await db.from('published_assessments')
      .select('id,student_id').eq('assessment_activity_id', activity.id).in('student_id', ids);
    if (existingError) throw existingError;
    const prior = new Map((existing || []).map(row => [row.student_id, row.id]));
    const now = new Date().toISOString();
    const rows = validResults.map(row => ({
      id: prior.get(row.student_id) || randomUUID(), assessment_activity_id: activity.id,
      student_id: row.student_id, published_by: user.id, publication_status: 'published', published_at: now,
    }));
    const { error: saveError } = await db.from('published_assessments').upsert(rows, { onConflict: 'id' });
    if (saveError) throw saveError;
    const { error: statusError } = await db.from('assessment_activities').update({ is_published: true }).eq('id', activity.id).eq('teacher_id', user.id);
    if (statusError) throw statusError;
    return response({ ok: true, published_count: rows.length });
  } catch (error) {
    const detail = error as { code?: string; message?: string };
    console.error('Assessment publication failed:', { code: detail.code, message: detail.message });
    return response({ error: detail.code === '42501' ? 'Akses publikasi database ditolak. Jalankan migrasi 025.' : 'Gagal menerbitkan asesmen. Periksa log server.' }, 503);
  }
}
