import { NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';

const reply = (data: Record<string, unknown>, status = 200) =>
  NextResponse.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });

/** Read only reports for students linked to this verified parent. */
export async function GET() {
  try {
    const auth = await createClient();
    const { data: { user }, error: authError } = await auth.auth.getUser();
    if (authError || !user) return reply({ error: 'Silakan masuk kembali.' }, 401);
    const db = await createServiceClient();
    const { data: profile, error: profileError } = await db.from('profiles')
      .select('role').eq('id', user.id).maybeSingle();
    if (profileError || profile?.role !== 'wali_murid') return reply({ error: 'Akses khusus Wali Murid.' }, 403);
    const { data: links, error: linkError } = await db.from('parent_students')
      .select('student_id').eq('parent_id', user.id).eq('verification_status', 'verified');
    if (linkError) throw linkError;
    const studentIds = [...new Set((links || []).map(row => row.student_id))];
    if (!studentIds.length) return reply({ reports: [] });
    const { data: reports, error: reportError } = await db.from('published_reports')
      .select('id,student_id,report_snapshot,published_at,students!inner(full_name,nis),learning_sessions!inner(topic,date,subjects!inner(name))')
      .in('student_id', studentIds).eq('publication_status', 'published')
      .order('published_at', { ascending: false }).limit(100);
    if (reportError) throw reportError;
    return reply({ reports: reports || [] });
  } catch (error) {
    const issue = error as { code?: string };
    console.error('Parent published report read failed:', { code: issue?.code });
    return reply({ error: 'Laporan belum dapat dimuat. Periksa akses dan struktur database.' }, 503);
  }
}
