import { createServiceClient } from '@/lib/supabase/server';
import { collectReportIndicators, normalizedIndicatorDescription, type ReportIndicator } from '@/lib/reports/indicators';

/** Only call after a teacher's identity, session ownership and class/school have been verified. */
export async function loadReportChoices(
  session: {
    id: string; class_id: string; subject_id: string; module_id: string | null;
    learning_objective_ids: string[] | null; module_curriculum_snapshot: unknown;
  }, teacherId: string, schoolId: string,
): Promise<{ students: Array<{ id: string; full_name: string }>; indicators: ReportIndicator[];
  evidence: Record<string, string[]>; publishedStudents: string[];
  previousDecisions: Record<string, Record<string, { status: 'met' | 'not_met' | 'unassessed'; criterion: string; note: string }>> }> {
  const db = await createServiceClient();
  const [studentsQuery, objectivesQuery, activitiesQuery, reportsQuery] = await Promise.all([
    db.from('students').select('id,full_name').eq('class_id', session.class_id)
      .eq('school_id', schoolId).eq('is_active', true).order('full_name'),
    session.learning_objective_ids?.length
      ? db.from('learning_objectives').select('id,learning_indicators(id,code,description,criteria)')
          .in('id', session.learning_objective_ids)
      : Promise.resolve({ data: [], error: null }),
    db.from('assessment_activities')
      .select('id,module_id,learning_session_id,learning_indicator_ids,module_tp_snapshot,is_published,assessment_results(student_id)')
      .eq('teacher_id', teacherId).eq('class_id', session.class_id).eq('subject_id', session.subject_id).eq('is_published', true),
    db.from('published_reports').select('student_id,report_snapshot').eq('learning_session_id', session.id)
      .eq('teacher_id', teacherId).eq('publication_status', 'published'),
  ]);
  for (const result of [studentsQuery, objectivesQuery, activitiesQuery, reportsQuery]) {
    if (result.error) throw result.error;
  }
  let moduleContent: unknown = null;
  if (session.module_id) {
    const moduleQuery = await db.from('teaching_modules').select('content')
      .eq('id', session.module_id).eq('teacher_id', teacherId).eq('school_id', schoolId)
      .eq('class_id', session.class_id).eq('subject_id', session.subject_id).maybeSingle();
    if (moduleQuery.error) throw moduleQuery.error;
    if (!moduleQuery.data) throw new Error('Modul Ajar tidak ditemukan atau tidak sesuai penugasan Guru.');
    moduleContent = moduleQuery.data.content;
  }
  type IndicatorObjective = { learning_indicators: ReportIndicator[] | null };
  const curriculum = ((objectivesQuery.data || []) as IndicatorObjective[])
    .flatMap(objective => objective.learning_indicators || []);
  const indicators = collectReportIndicators(curriculum, session.module_curriculum_snapshot, moduleContent);
  const activities = (activitiesQuery.data || []).filter((activity) => session.module_id
    ? activity.module_id === session.module_id
    : activity.learning_session_id === session.id || (activity.learning_indicator_ids || [])
      .some((id: string) => curriculum.some(ind => ind.id === id)));
  const activityIds = activities.map(activity => activity.id);
  const publications = activityIds.length
    ? await db.from('published_assessments').select('assessment_activity_id,student_id')
      .in('assessment_activity_id', activityIds).eq('publication_status', 'published')
    : { data: [], error: null };
  if (publications.error) throw publications.error;
  const publishedPairs = new Set((publications.data || [])
    .map(item => `${item.assessment_activity_id}:${item.student_id}`));
  const normalized = (text: unknown) => String(text || '').trim().toLocaleLowerCase('id-ID');
  const evidence: Record<string, string[]> = {};
  for (const student of studentsQuery.data || []) {
    const linked = activities.filter(activity =>
      (activity.assessment_results || []).some(result => result.student_id === student.id) &&
      publishedPairs.has(`${activity.id}:${student.id}`));
    evidence[student.id] = indicators.filter(indicator => linked.some(activity => {
      if (!indicator.id.startsWith('module-')) return (activity.learning_indicator_ids || []).includes(indicator.id);
      const tpRows = Array.isArray(activity.module_tp_snapshot) ? activity.module_tp_snapshot : [];
      return tpRows.some(tp => {
        if (!tp || typeof tp !== 'object') return false;
        const indicatorsInTP = (tp as { indicators?: unknown }).indicators;
        return Array.isArray(indicatorsInTP) && indicatorsInTP.some(raw => {
          if (!raw || typeof raw !== 'object') return false;
          const item = raw as { code?: string; description?: string };
          return normalized(item.code) === normalized(indicator.code) ||
            (Boolean(item.description) && normalizedIndicatorDescription(item.description) === normalizedIndicatorDescription(indicator.description));
        });
      });
    })).map(indicator => indicator.id);
  }
  const previousDecisions: Record<string, Record<string, { status: 'met' | 'not_met' | 'unassessed'; criterion: string; note: string }>> = {};
  for (const row of reportsQuery.data || []) {
    const snapshot = row.report_snapshot as { indicator_progress?: Array<{
      id?: string; code?: string; description?: string;
      teacher_assessment?: { decision?: string; criterion?: string; note?: string } | null;
    }> } | null;
    const saved = Array.isArray(snapshot?.indicator_progress) ? snapshot.indicator_progress : [];
    const mapped: Record<string, { status: 'met' | 'not_met' | 'unassessed'; criterion: string; note: string }> = {};
    for (const indicator of indicators) {
      const old = saved.find(item => item.code === indicator.code ||
        (item.description && normalizedIndicatorDescription(item.description) === normalizedIndicatorDescription(indicator.description)));
      const teacher = old?.teacher_assessment;
      if (teacher && (teacher.decision === 'met' || teacher.decision === 'not_met')) {
        mapped[indicator.id] = { status: teacher.decision, criterion: String(teacher.criterion || ''), note: String(teacher.note || '') };
      }
    }
    previousDecisions[row.student_id] = mapped;
  }
  return {
    students: studentsQuery.data || [], indicators, evidence, previousDecisions,
    publishedStudents: [...new Set((reportsQuery.data || []).map(item => item.student_id))],
  };
}
