import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { collectReportIndicators, normalizedIndicatorDescription } from '@/lib/reports/indicators';
import { loadReportChoices } from './selection';

type AssessmentResult = { student_id: string; score: number; notes: string | null };
type Activity = {
  id: string; title: string; type: string; date: string;
  max_score: number; minimum_score: number | null;
  learning_session_id: string | null; module_id: string | null; learning_indicator_ids: string[] | null;
  module_tp_snapshot: unknown; is_published: boolean;
  assessment_results: AssessmentResult[];
};
type Indicator = { id: string; code: string; description: string; criteria: string | null };
type TeacherDecision = { status: 'met' | 'not_met' | 'unassessed'; criterion: string; note: string };
const validTeacherDecision = (raw: unknown): raw is TeacherDecision => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return false;
  const item = raw as Record<string, unknown>;
  if (!['met','not_met','unassessed'].includes(String(item.status))) return false;
  if (typeof item.criterion !== 'string' || item.criterion.length > 500 ||
      typeof item.note !== 'string' || item.note.length > 1000) return false;
  // Explicit attainment decisions must have a documented criterion and observation.
  if (item.status !== 'unassessed' && (item.criterion.trim().length < 5 || item.note.trim().length < 8)) return false;
  return true;
};
type Objective = { id: string; learning_indicators: Indicator[] | null };

const fail = (error: string, status: number) => NextResponse.json({ error }, {
  status, headers: { 'Cache-Control': 'no-store' },
});
const validUUID = (value: unknown): value is string =>
  typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

/** Publikasi wajib dilakukan setelah otorisasi Guru memakai identitas cookie Supabase. */
export async function POST(request: NextRequest) {
  try {
    const auth = await createClient();
    const { data: authData, error: authError } = await auth.auth.getUser();
    const user = authData.user;
    if (authError || !user) return fail('Sesi login sudah berakhir. Silakan masuk kembali.', 401);

    const { data: profile, error: profileError } = await auth.from('profiles')
      .select('role, full_name, school_id').eq('id', user.id).maybeSingle();
    if (profileError) {
      console.error('Teacher report profile permission:', profileError.code);
      return fail('Profil Guru tidak dapat diverifikasi. Periksa izin profiles dan RLS.', 403);
    }
    if (profile?.role !== 'guru' || !profile.school_id) {
      return fail('Akun ini bukan Guru dengan sekolah yang terverifikasi.', 403);
    }

    let payload: Record<string, unknown>;
    try { payload = await request.json(); } catch { return fail('Format permintaan tidak valid.', 400); }
    const sessionId = payload.learning_session_id;
    if (!validUUID(sessionId)) return fail('Pilih sesi pembelajaran yang valid.', 400);
    // Explicit selection is required; never silently publish for the whole class.
    if (!Array.isArray(payload.student_ids) || !payload.student_ids.length || payload.student_ids.length > 300 ||
        !payload.student_ids.every(validUUID) || new Set(payload.student_ids).size !== payload.student_ids.length) {
      return fail('Pilih minimal satu siswa yang valid.', 400);
    }
    const selectedStudentIds = payload.student_ids as string[];
    if (!Array.isArray(payload.indicator_ids) || payload.indicator_ids.length > 300 ||
        !payload.indicator_ids.every((value: unknown) => typeof value === 'string' && value.length > 0 && value.length < 120) ||
        new Set(payload.indicator_ids).size !== payload.indicator_ids.length) {
      return fail('Daftar indikator tidak valid.', 400);
    }
    const selectedIndicatorIds = payload.indicator_ids as string[];
    const rawDecisions = payload.indicator_decisions;
    if (!rawDecisions || typeof rawDecisions !== 'object' || Array.isArray(rawDecisions)) {
      return fail('Data peninjauan ketercapaian indikator belum tersedia.', 400);
    }
    const allDecisions = rawDecisions as Record<string, unknown>;
    if (Object.keys(allDecisions).length > selectedStudentIds.length) return fail('Data keputusan siswa tidak valid.', 400);
    for (const [studentId, row] of Object.entries(allDecisions)) {
      if (!selectedStudentIds.includes(studentId) || !row || typeof row !== 'object' || Array.isArray(row)) {
        return fail('Keputusan ketercapaian tidak sesuai siswa terpilih.', 400);
      }
      const decisions = row as Record<string, unknown>;
      if (Object.keys(decisions).some(id => !selectedIndicatorIds.includes(id)) ||
          Object.values(decisions).some(value => !validTeacherDecision(value))) {
        return fail('Keputusan ketercapaian indikator tidak valid atau belum memiliki dasar penilaian.', 400);
      }
    }
    // Tidak boleh diam-diam mengubah pilihan indikator menjadi 'Belum Dinilai'.
    // Setiap kombinasi siswa–indikator harus memiliki keputusan eksplisit dari Guru.
    const includeProgress = payload.include_indicator_progress !== false;
    if (includeProgress) {
      for (const studentId of selectedStudentIds) {
        const row = allDecisions[studentId];
        if (!row || typeof row !== 'object' || Array.isArray(row)) {
          return fail('Tinjau dan tentukan keputusan untuk setiap siswa dan indikator sebelum menerbitkan.', 400);
        }
        const decisions = row as Record<string, unknown>;
        if (selectedIndicatorIds.some(id => !validTeacherDecision(decisions[id]))) {
          return fail('Masih ada indikator tanpa keputusan Guru. Pilih Tercapai, Belum Tercapai, atau Belum Dinilai secara eksplisit.', 400);
        }
      }
    }
    const includeAssessments = payload.include_assessments !== false;
    const includeIndicators = payload.include_indicator_progress !== false;
    if (typeof payload.teacher_note !== 'undefined' && typeof payload.teacher_note !== 'string') {
      return fail('Catatan guru harus berupa teks.', 400);
    }
    const note = String(payload.teacher_note || '').trim();
    if (note.length > 1500) return fail('Catatan guru maksimal 1500 karakter.', 400);
    if (includeIndicators && !selectedIndicatorIds.length) return fail('Pilih indikator yang akan dibagikan.', 400);
    if (!includeAssessments && !includeIndicators && !note) {
      return fail('Pilih setidaknya satu isi laporan.', 400);
    }

    // Service client digunakan hanya SETELAH identitas/role diverifikasi.
    // Semua sumber data berikut tetap dibatasi eksplisit pada guru dan sekolah ini.
    const db = await createServiceClient();
    const { data: session, error: sessionError } = await db.from('learning_sessions')
      .select('id,title,topic,phase,date,class_id,subject_id,teacher_id,module_id,learning_objective_ids,module_curriculum_snapshot,classes(name,school_id),subjects(name)')
      .eq('id', sessionId).eq('teacher_id', user.id).maybeSingle();
    if (sessionError) throw sessionError;
    if (!session) return fail('Sesi pembelajaran tidak ditemukan atau bukan milik Guru ini.', 404);
    const classData = session.classes as unknown as { name: string; school_id: string } | null;
    const subjectData = session.subjects as unknown as { name: string } | null;
    if (!classData || classData.school_id !== profile.school_id || !subjectData) {
      return fail('Sesi tidak terhubung dengan sekolah Guru yang benar.', 403);
    }

    const [studentResult, objectiveResult, activityResult, previousResult] = await Promise.all([
      db.from('students').select('id,full_name').eq('class_id', session.class_id)
        .eq('school_id', profile.school_id).eq('is_active', true).order('full_name'),
      (session.learning_objective_ids || []).length
        ? db.from('learning_objectives').select('id,learning_indicators(id,code,description,criteria)')
          .in('id', session.learning_objective_ids || [])
        : Promise.resolve({ data: [] as Objective[], error: null }),
      db.from('assessment_activities')
        .select('id,title,type,date,max_score,minimum_score,learning_session_id,module_id,learning_indicator_ids,module_tp_snapshot,is_published,assessment_results(student_id,score,notes)')
        .eq('teacher_id', user.id).eq('class_id', session.class_id).eq('subject_id', session.subject_id),
      db.from('published_reports').select('id,student_id,updated_at')
        .eq('learning_session_id', session.id).eq('teacher_id', user.id).order('updated_at', { ascending: false }),
    ]);
    for (const result of [studentResult, objectiveResult, activityResult, previousResult]) {
      if (result.error) throw result.error;
    }
    // The session snapshot can be absent/partial for older sessions. Read the
    // actual module (with teacher and school ownership checked) before falling
    // back to it, rather than interpreting a missing snapshot as zero indicators.
    let moduleContent: Record<string, unknown> | null = null;
    if (session.module_id) {
      const { data: linkedModule, error: linkedModuleError } = await db.from('teaching_modules')
        .select('id,teacher_id,school_id,class_id,subject_id,content')
        .eq('id', session.module_id).eq('teacher_id', user.id)
        .eq('school_id', profile.school_id).eq('class_id', session.class_id)
        .eq('subject_id', session.subject_id).maybeSingle();
      if (linkedModuleError) throw linkedModuleError;
      if (!linkedModule) return fail('Modul Ajar sesi ini tidak ditemukan atau tidak sesuai penugasan Guru.', 409);
      if (linkedModule.content && typeof linkedModule.content === 'object' && !Array.isArray(linkedModule.content)) {
        moduleContent = linkedModule.content as Record<string, unknown>;
      }
    }
    const classStudents = studentResult.data || [];
    const allowedStudents = new Set(classStudents.map(student => student.id));
    if (selectedStudentIds.some(id => !allowedStudents.has(id))) return fail('Salah satu siswa bukan anggota aktif kelas Guru.', 403);
    const selectedIds = new Set(selectedStudentIds);
    const students = classStudents.filter(student => selectedIds.has(student.id));
    const objectives = (objectiveResult.data || []) as Objective[];
    const indicators = objectives.flatMap((item) => item.learning_indicators || []);
    const indicatorIds = new Set(indicators.map((item) => item.id));
    // Only the assessment results explicitly published by the teacher are eligible.
    // A linked module takes priority over unrelated curriculum-indicator matches.
    const activities = ((activityResult.data || []) as unknown as Activity[]).filter((activity) =>
      activity.is_published && (session.module_id
        ? activity.module_id === session.module_id
        : activity.learning_session_id === session.id ||
          (activity.learning_indicator_ids || []).some((id) => indicatorIds.has(id))));

    // Normalisasi indikator bersama dengan endpoint pilihan Guru agar ID-nya konsisten.
    const reportIndicators = collectReportIndicators(indicators, session.module_curriculum_snapshot, moduleContent);
    const allowedIndicatorIds = new Set(reportIndicators.map(item => item.id));
    if (selectedIndicatorIds.some(id => !allowedIndicatorIds.has(id))) {
      return fail('Indikator yang dipilih tidak ditemukan pada Modul Ajar atau sesi ini.', 403);
    }
    const selectedIndicators = new Set(selectedIndicatorIds);
    if (selectedStudentIds.length * selectedIndicatorIds.length > 1500) {
      return fail('Terlalu banyak kombinasi siswa dan indikator untuk satu publikasi.', 400);
    }
    const normalize = (value: string) => value.trim().toLocaleLowerCase('id-ID');
    const referencesIndicator = (activity: Activity, indicator: Indicator) => {
      if (indicator.id.startsWith('module-')) {
        const objectives = Array.isArray(activity.module_tp_snapshot) ? activity.module_tp_snapshot : [];
        // A module-linked assessment without an indicator snapshot is not
        // evidence for every indicator. It remains an overall assessment only.
        return objectives.some((objective) => {
          if (!objective || typeof objective !== 'object') return false;
          const data = objective as { indicators?: Array<{ code?: string; description?: string }> };
          return (Array.isArray(data.indicators) ? data.indicators : []).some((item) =>
            normalize(String(item.code || '')) === normalize(indicator.code) ||
            (!!item.description && normalizedIndicatorDescription(String(item.description)) === normalizedIndicatorDescription(indicator.description)));
        });
      }
      return (activity.learning_indicator_ids || []).includes(indicator.id);
    };
    if (!activities.length && !note && !includeIndicators) return fail('Belum ada asesmen terkait sesi ini yang diterbitkan. Terbitkan nilai asesmen atau pilih indikator untuk dilaporkan sebagai belum memiliki bukti.', 409);
    // A teacher may have published an assessment for only some students.
    // Respect per-student publication, not only the activity-level flag.
    const activityIds = activities.map(item => item.id);
    const { data: publicationRows, error: publicationRowsError } = activityIds.length
      ? await db.from('published_assessments')
          .select('assessment_activity_id,student_id')
          .in('assessment_activity_id', activityIds).eq('publication_status', 'published')
      : { data: [] as Array<{ assessment_activity_id: string; student_id: string }>, error: null };
    if (publicationRowsError) throw publicationRowsError;
    const publishedPairs = new Set((publicationRows || []).map(row => `${row.assessment_activity_id}:${row.student_id}`));
    const publishedForStudent = (activityId: string, studentId: string) =>
      publishedPairs.has(`${activityId}:${studentId}`);
    const previous = new Map<string, string>();
    for (const row of previousResult.data || []) if (!previous.has(row.student_id)) previous.set(row.student_id, row.id);
    const publishedAt = new Date().toISOString();

    const reports = students.map((student) => {
      const indicatorProgress = includeIndicators ? reportIndicators.filter(item => selectedIndicators.has(item.id)).map((indicator) => {
        const evidence = activities.filter((item) => referencesIndicator(item, indicator))
          .flatMap((activity) => (activity.assessment_results || [])
            .filter((result) => result.student_id === student.id && publishedForStudent(activity.id, student.id) && Number.isFinite(result.score)
              && activity.max_score > 0 && result.score >= 0 && result.score <= activity.max_score)
            .map((result) => ({
              assessment_title: activity.title, assessment_date: activity.date,
              score: result.score, max_score: activity.max_score, minimum_score: activity.minimum_score,
              meets_criterion: activity.minimum_score == null ? null : result.score >= activity.minimum_score,
            })));
        const teacherDecision = (allDecisions[student.id] as Record<string, TeacherDecision> | undefined)?.[indicator.id];
        // Publikasi indikator selalu menggunakan keputusan yang eksplisit dibuat
        // oleh Guru. Skor asesmen keseluruhan bukan penetapan otomatis TP.
        const explicit = teacherDecision && teacherDecision.status !== 'unassessed'
          ? teacherDecision : null;
        const status = explicit
          ? (explicit.status === 'met' ? 'meets_criterion' : 'needs_follow_up')
          : (evidence.length ? 'evidence_only' : 'insufficient_data');
        return {
          id: indicator.id, code: indicator.code, description: indicator.description,
          criteria: explicit?.criterion || indicator.criteria, evidence, status,
          // Teacher's written observation is different from an imported test score.
          teacher_assessment: explicit ? { criterion: explicit.criterion.trim(), note: explicit.note.trim(),
            decision: explicit.status, assessed_by: user.id, assessed_at: publishedAt } : null,
          percentage: null,
        };
      }) : [];
      const assessmentResults = includeAssessments ? activities.flatMap((activity) =>
        (activity.assessment_results || []).filter((result) => result.student_id === student.id && publishedForStudent(activity.id, student.id))
          .map((result) => ({
            title: activity.title, type: activity.type, date: activity.date,
            score: result.score, max_score: activity.max_score,
          }))) : [];
      return {
        id: previous.get(student.id) || randomUUID(),
        student_id: student.id, teacher_id: user.id, learning_session_id: session.id,
        publication_status: 'published', published_at: publishedAt, unpublished_at: null,
        updated_at: publishedAt,
        report_snapshot: {
          version: 2, title: `Laporan Pembelajaran — ${session.topic}`,
          subject_name: subjectData.name, topic: session.topic, date: session.date,
          phase: session.phase, class_name: classData.name,
          teacher_name: profile.full_name || 'Guru', teacher_note: note || null,
          achievement_percentage: null, indicator_progress: indicatorProgress,
          // Total indikator yang ada pada Modul Ajar / sesi, bukan hanya yang dipilih Guru.
          // Dibutuhkan Wali Murid untuk membedakan 1/2 dipublikasikan dari 1/1 berbukti.
          total_module_indicators: includeIndicators ? reportIndicators.length : 0,
          selected_indicator_count: includeIndicators ? indicatorProgress.length : 0,
          assessment_results: assessmentResults,
          evidence_note: 'Bukti indikator hanya berasal dari asesmen yang diterbitkan dan memetakan indikator. Skor tidak otomatis membuktikan ketercapaian tanpa kriteria.',
          selected_indicator_ids: includeIndicators ? selectedIndicatorIds : [],
          included_sections: { assessments: includeAssessments, indicator_progress: includeIndicators, teacher_note: !!note },
        },
      };
    });

    // The teacher deliberately selected students and indicators. Even without evidence,
    // publish the selected indicators as 'insufficient_data' rather than silently omitting students.
    const eligibleReports = reports;

    // Satu statement upsert: kegagalan satu baris membatalkan seluruh batch,
    // berbeda dengan loop INSERT per siswa pada versi sebelumnya.
    const { error: publicationError } = await db.from('published_reports').upsert(eligibleReports, { onConflict: 'id' });
    if (publicationError) throw publicationError;
    // Verifikasi round-trip ke database agar UI tidak mengaku status berhasil
    // jika snapshot keputusan yang disimpan tidak sesuai dengan pilihan Guru.
    const savedResult = await db.from('published_reports').select('id,student_id,report_snapshot')
      .eq('teacher_id', user.id).eq('learning_session_id', session.id)
      .in('id', eligibleReports.map(item => item.id));
    if (savedResult.error) throw savedResult.error;
    const savedByStudent = new Map((savedResult.data || []).map(row => [row.student_id, row.report_snapshot]));
    for (const studentId of selectedStudentIds) {
      const saved = savedByStudent.get(studentId) as { indicator_progress?: Array<{
        id: string; status: string; teacher_assessment?: { decision: string } | null;
      }> } | undefined;
      if (!saved || !Array.isArray(saved.indicator_progress)) {
        return fail('Laporan telah dikirim ke database, tetapi pembacaan ulang keputusan Guru belum cocok. Periksa laporan terbit sebelum mencoba ulang.', 503);
      }
      if (includeIndicators && selectedIndicatorIds.some(id => {
        const expected = (allDecisions[studentId] as Record<string, TeacherDecision>)[id];
        const actual = saved.indicator_progress?.find(indicator => indicator.id === id);
        return !actual || (expected.status === 'met' && (actual.status !== 'meets_criterion' || actual.teacher_assessment?.decision !== 'met')) ||
          (expected.status === 'not_met' && (actual.status !== 'needs_follow_up' || actual.teacher_assessment?.decision !== 'not_met')) ||
          (expected.status === 'unassessed' && !!actual.teacher_assessment);
      })) {
        return fail('Keputusan Guru tidak cocok setelah disimpan. Periksa laporan terbit sebelum melakukan publikasi ulang.', 503);
      }
    }
    const decisionCounts = { met: 0, notMet: 0, unassessed: 0 };
    for (const report of eligibleReports) {
      for (const indicator of report.report_snapshot.indicator_progress) {
        if (indicator.status === 'meets_criterion') decisionCounts.met++;
        else if (indicator.status === 'needs_follow_up') decisionCounts.notMet++;
        else decisionCounts.unassessed++;
      }
    }
    return NextResponse.json({ ok: true, published_count: eligibleReports.length, published_at: publishedAt, decision_counts: decisionCounts },
      { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const issue = error as { code?: string; message?: string };
    console.error('Publish report failed:', { code: issue?.code, message: issue?.message });
    if (issue?.code === '42501') return fail('Database menolak akses publikasi. Periksa GRANT service_role pada tabel laporan dan data pembelajaran.', 503);
    if (issue?.code === 'PGRST204' || issue?.code === '42703') return fail('Skema database belum sesuai. Pastikan semua migrasi LENTERA sudah dijalankan.', 503);
    if (issue?.message?.includes('server secret')) return fail('Secret Key Supabase server belum dikonfigurasi.', 503);
    return fail('Laporan gagal diterbitkan. Periksa log server untuk kode kesalahannya.', 500);
  }
}

/** Daftar sesi dan status publikasi khusus Guru yang sedang login. */
export async function GET(request: NextRequest) {
  try {
    const auth = await createClient();
    const { data: authData, error: authError } = await auth.auth.getUser();
    if (authError || !authData.user) return fail('Silakan masuk kembali.', 401);
    const user = authData.user;
    const { data: profile, error: profileError } = await auth.from('profiles')
      .select('role,school_id,full_name,avatar_url').eq('id', user.id).maybeSingle();
    if (profileError || profile?.role !== 'guru' || !profile.school_id) return fail('Akses Guru tidak dapat diverifikasi.', 403);
    const db = await createServiceClient();
    const choicesSessionId = request.nextUrl.searchParams.get('session_id');
    if (choicesSessionId !== null) {
      if (!validUUID(choicesSessionId)) return fail('Sesi pembelajaran tidak valid.', 400);
      const { data: choiceSession, error: choiceSessionError } = await db.from('learning_sessions')
        .select('id,teacher_id,class_id,subject_id,module_id,learning_objective_ids,module_curriculum_snapshot,classes(school_id)')
        .eq('id', choicesSessionId).eq('teacher_id', user.id).maybeSingle();
      if (choiceSessionError) throw choiceSessionError;
      if (!choiceSession) return fail('Sesi tidak ditemukan.', 404);
      const choiceClass = choiceSession.classes as unknown as { school_id: string } | null;
      if (choiceClass?.school_id !== profile.school_id) return fail('Sesi tidak berada di sekolah Guru.', 403);
      const choices = await loadReportChoices(choiceSession, user.id, profile.school_id);
      return NextResponse.json(choices, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    const { data: sessions, error: sessionsError } = await db.from('learning_sessions')
      .select('id,title,topic,date,phase,module_id,class_id,classes(name,school_id),subjects(name)')
      .eq('teacher_id', user.id).order('date', { ascending: false }).limit(80);
    if (sessionsError) throw sessionsError;
    const validSessions = (sessions || []).filter((session) => {
      const cls = session.classes as unknown as { school_id: string } | null;
      return cls?.school_id === profile.school_id;
    });
    const ids = validSessions.map((session) => session.id);
    const publication = ids.length
      ? await db.from('published_reports').select('learning_session_id,student_id,published_at')
        .eq('teacher_id', user.id).eq('publication_status', 'published').in('learning_session_id', ids)
      : { data: [], error: null };
    if (publication.error) throw publication.error;
    const { data: publishedActivities, error: activityListError } = await db.from('assessment_activities')
      .select('id,module_id,learning_session_id,subject_id,class_id,is_published')
      .eq('teacher_id', user.id).eq('is_published', true);
    if (activityListError) throw activityListError;
    const progress = new Map<string, { count: number; last: string | null }>();
    const unique = new Set<string>();
    for (const report of publication.data || []) {
      const uniqueKey = `${report.learning_session_id}:${report.student_id}`;
      if (unique.has(uniqueKey)) continue;
      unique.add(uniqueKey);
      const item = progress.get(report.learning_session_id) || { count: 0, last: null };
      item.count++;
      if (report.published_at && (!item.last || report.published_at > item.last)) item.last = report.published_at;
      progress.set(report.learning_session_id, item);
    }
    return NextResponse.json({
      profile: { full_name: profile.full_name, role: 'guru', avatar_url: profile.avatar_url, email: user.email },
      sessions: validSessions.map((session) => ({
        ...session,
        ready_assessments: (publishedActivities || []).filter(activity =>
          activity.class_id === session.class_id &&
          (session.module_id ? activity.module_id === session.module_id : activity.learning_session_id === session.id)).length,
        published_count: progress.get(session.id)?.count || 0,
        last_published_at: progress.get(session.id)?.last || null,
      })),
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (error) {
    const issue = error as { code?: string; message?: string };
    console.error('Report sessions read failed:', { code: issue?.code, message: issue?.message });
    return fail(issue?.code === '42501'
      ? 'Izin database untuk sesi/laporan belum lengkap. Periksa GRANT service_role.'
      : 'Sesi dan riwayat laporan belum dapat dimuat. Periksa log server.', 503);
  }
}
