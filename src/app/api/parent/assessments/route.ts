import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const reply = (data: Record<string, unknown>, status = 200) => NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET() {
  try {
    const auth = await createClient();
    const { data: { user }, error: authError } = await auth.auth.getUser();
    if (authError || !user) return reply({ error: 'Silakan masuk kembali.' }, 401);
    const { data: profile, error: profileError } = await auth.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (profileError || profile?.role !== 'wali_murid') return reply({ error: 'Hanya Wali Murid yang dapat melihat data ini.' }, 403);
    const db = await createServiceClient();
    const { data: links, error: linkError } = await db.from('parent_students')
      .select('student_id').eq('parent_id', user.id).eq('verification_status', 'verified');
    if (linkError) throw linkError;
    const studentIds = [...new Set((links || []).map(item => item.student_id))];
    if (!studentIds.length) return reply({ items: [], children: [], has_linked_child: false });
    const { data: childrenRows, error: childrenError } = await db.from('students').select('id,full_name,nis,class_id,avatar_url,classes(name,grade,schools(name))').in('id', studentIds);
    if (childrenError) throw childrenError;
    const children = (childrenRows || []).map(child => {
      const cls = child.classes as unknown as { name: string; grade: string; schools: { name: string } } | null;
      return { id: child.id, full_name: child.full_name, nis: child.nis, class_name: cls?.name || 'Kelas belum tersedia', grade: cls?.grade || '', school_name: cls?.schools?.name || '', avatar_url: child.avatar_url };
    });
    const { data: published, error: publicationError } = await db.from('published_assessments')
      .select('id,student_id,assessment_activity_id,published_at')
      .in('student_id', studentIds).eq('publication_status', 'published').order('published_at', { ascending: false }).limit(150);
    if (publicationError) throw publicationError;
    const activityIds = [...new Set((published || []).map(item => item.assessment_activity_id))];
    if (!activityIds.length) return reply({ items: [], children, has_linked_child: true });
    const [{ data: activities, error: activityError }, { data: results, error: resultsError }, { data: pupils, error: pupilError }] = await Promise.all([
      db.from('assessment_activities').select('id,title,type,date,max_score,minimum_score,subject_id,module_id,learning_session_id').in('id', activityIds),
      db.from('assessment_results').select('assessment_activity_id,student_id,score').in('assessment_activity_id', activityIds).in('student_id', studentIds),
      db.from('students').select('id,full_name,nis').in('id', studentIds),
    ]);
    if (activityError || resultsError || pupilError) throw activityError || resultsError || pupilError;
    const subjects = [...new Set((activities || []).map(item => item.subject_id))];
    const { data: subjectRows, error: subjectError } = subjects.length ? await db.from('subjects').select('id,name').in('id',subjects) : { data: [], error: null };
    if (subjectError) throw subjectError;
    const aMap = new Map((activities || []).map(item => [item.id, item]));
    const rMap = new Map((results || []).map(item => [`${item.assessment_activity_id}:${item.student_id}`, item]));
    const pMap = new Map((pupils || []).map(item => [item.id,item]));
    const sMap = new Map((subjectRows || []).map(item => [item.id,item.name]));
    const items = (published || []).flatMap(row => {
      const activity = aMap.get(row.assessment_activity_id);
      const result = rMap.get(`${row.assessment_activity_id}:${row.student_id}`);
      const pupil = pMap.get(row.student_id);
      if (!activity || !result || !pupil) return [];
      return [{ id: row.id, student_id: row.student_id, student_name: pupil.full_name, nis: pupil.nis,
        published_at: row.published_at, title: activity.title, type: activity.type, date: activity.date,
        max_score: activity.max_score, minimum_score: activity.minimum_score, score: result.score,
        subject_name: sMap.get(activity.subject_id) || 'Mata pelajaran', module_id: activity.module_id,
        learning_session_id: activity.learning_session_id }];
    });
    return reply({ items, children, has_linked_child: true });
  } catch (error) {
    const detail = error as { code?: string; message?: string };
    console.error('Parent assessment view failed:', { code: detail.code, message: detail.message });
    return reply({ error: 'Hasil asesmen belum dapat dimuat. Periksa izin dan log server.' }, 503);
  }
}
