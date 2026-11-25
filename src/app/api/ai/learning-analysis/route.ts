import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAIProvider } from '@/services/ai/ai-provider';
import { getServerAISettings } from '@/lib/admin/ai-settings';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { learning_session_id, assessment_activity_ids } = body;

    if (!learning_session_id) {
      return NextResponse.json({ error: 'learning_session_id is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('learning_sessions')
      .select('id, teacher_id, class_id, subject_id, title, topic, phase, date, duration_minutes, learning_outcome_ids, learning_objective_ids, module_id, notes')
      .eq('id', learning_session_id)
      .eq('teacher_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // Fetch CP
    const { data: cpData } = await supabase
      .from('learning_outcomes')
      .select('id, code, description')
      .in('id', session.learning_outcome_ids || [])
      .order('code');

    // Fetch TP with indicators
    const { data: tpData } = await supabase
      .from('learning_objectives')
      .select(`
        id,
        code,
        description,
        learning_indicators!inner(id, code, description, criteria, assessment_method, achievement_threshold)
      `)
      .in('id', session.learning_objective_ids || [])
      .order('code');

    // Fetch assessment activities
    let assessmentQuery = supabase
      .from('assessment_activities')
      .select(`
        id,
        title,
        type,
        max_score,
        date,
        learning_indicator_ids,
        minimum_score,
        achievement_threshold,
        assessment_results!inner(id, student_id, score, notes)
      `)
      .eq('class_id', session.class_id)
      .eq('subject_id', session.subject_id);

    // A linked session must analyze assessments from its selected module only.
    // For legacy sessions without a module, retain the original TP/indicator matching.
    if (session.module_id) {
      assessmentQuery = assessmentQuery.eq('module_id', session.module_id);
    }
    if (assessment_activity_ids && assessment_activity_ids.length > 0) {
      assessmentQuery = assessmentQuery.in('id', assessment_activity_ids);
    } else {
      // Only get activities linked to this session's TP/indicators
      const indicatorIds = tpData?.flatMap((tp) => tp.learning_indicators.map((i) => i.id)) || [];
      assessmentQuery = assessmentQuery.overlaps('learning_indicator_ids', indicatorIds);
    }

    const { data: assessmentData } = await assessmentQuery;

    // Fetch reflection answers
    const { data: reflectionData } = await supabase
      .from('reflection_questions')
      .select(`
        id,
        question,
        purpose,
        reflection_answers!inner(answer, is_draft)
      `)
      .eq('learning_session_id', session.id)
      .eq('reflection_answers.teacher_id', user.id)
      .eq('reflection_answers.is_draft', false);

    // Get students in class
    const { data: students } = await supabase
      .from('students')
      .select('id, nis, full_name')
      .eq('class_id', session.class_id)
      .eq('is_active', true);

    // Calculate deterministic metrics
    const totalStudents = students?.length || 0;
    const indicatorIds = tpData?.flatMap((tp) => tp.learning_indicators.map((i) => i.id)) || [];

    const indicatorAnalysis = [];
    let totalStudentsWithValidEvidence = 0;
    let totalStudentsMeetingCriteria = 0;

    const dataCompleteness = [];

    for (const indicatorId of indicatorIds) {
      const indicator = tpData?.flatMap((tp) => tp.learning_indicators).find((i) => i.id === indicatorId);
      if (!indicator) continue;

      // Get assessment activities for this indicator
      const relevantActivities = assessmentData?.filter((a) =>
        a.learning_indicator_ids.includes(indicatorId)
      ) || [];

      const studentsWithValidEvidence = new Set<string>();
      const studentsWithConfiguredCriteria = new Set<string>();
      const studentsMeetingCriteria = new Set<string>();

      for (const activity of relevantActivities) {
        for (const result of activity.assessment_results) {
          const scoreIsValid = Number.isFinite(result.score) && result.score >= 0 && result.score <= activity.max_score;
          if (!scoreIsValid) continue;

          studentsWithValidEvidence.add(result.student_id);
          if (activity.minimum_score !== null && activity.minimum_score !== undefined) {
            studentsWithConfiguredCriteria.add(result.student_id);
            if (result.score >= activity.minimum_score) {
              studentsMeetingCriteria.add(result.student_id);
            }
          }
        }
      }

      const studentsWithData = studentsWithValidEvidence.size;
      const studentsWithCriteria = studentsWithConfiguredCriteria.size;
      const studentsMeeting = studentsMeetingCriteria.size;
      const percentage = studentsWithCriteria > 0
        ? Math.round((studentsMeeting / studentsWithCriteria) * 10000) / 100
        : null;

      const activityThreshold = relevantActivities.find((activity) => activity.achievement_threshold !== null && activity.achievement_threshold !== undefined)?.achievement_threshold;
      const achievementThreshold = indicator.achievement_threshold ?? activityThreshold ?? null;
      let status: 'achieved' | 'needs_improvement' | 'insufficient_data' = 'insufficient_data';
      if (studentsWithCriteria > 0 && achievementThreshold !== null && achievementThreshold !== undefined) {
        status = (percentage ?? 0) >= achievementThreshold ? 'achieved' : 'needs_improvement';
      }

      indicatorAnalysis.push({
        indicator_id: indicatorId,
        indicator_code: indicator.code,
        indicator_description: indicator.description,
        students_meeting_criteria: studentsMeeting,
        students_with_valid_evidence: studentsWithData,
        students_with_configured_criteria: studentsWithCriteria,
        achievement_threshold: achievementThreshold ?? null,
        percentage,
        status,
      });

      totalStudentsWithValidEvidence += studentsWithData;
      totalStudentsMeetingCriteria += studentsMeeting;

      dataCompleteness.push({
        indicatorId: indicatorId,
        studentsWithData: studentsWithData,
        studentsWithoutData: totalStudents - studentsWithData,
        studentsWithConfiguredCriteria: studentsWithCriteria,
        achievementThreshold: achievementThreshold ?? null,
      });
    }

    const totalStudentsWithConfiguredCriteria = indicatorAnalysis.reduce(
      (total, indicator) => total + indicator.students_with_configured_criteria,
      0,
    );
    const achievementPercentage = totalStudentsWithConfiguredCriteria > 0
      ? Math.round((totalStudentsMeetingCriteria / totalStudentsWithConfiguredCriteria) * 10000) / 100
      : null;

    const deterministicMetrics = {
      total_students: totalStudents,
      students_with_valid_evidence: totalStudentsWithValidEvidence,
      students_meeting_criteria: totalStudentsMeetingCriteria,
      students_needing_support: Math.max(0, totalStudentsWithConfiguredCriteria - totalStudentsMeetingCriteria),
      achievement_percentage: achievementPercentage,
      indicator_analysis: indicatorAnalysis,
      data_completeness: dataCompleteness,
    };

    // Create input hash for deduplication
    const inputSnapshot = {
      session: {
        id: session.id,
        title: session.title,
        topic: session.topic,
        date: session.date,
        phase: session.phase,
        duration_minutes: session.duration_minutes,
        class_id: session.class_id,
        subject_id: session.subject_id,
        learning_outcome_ids: session.learning_outcome_ids,
        learning_objective_ids: session.learning_objective_ids,
        notes: session.notes,
      },
      learning_outcomes: cpData || [],
      learning_objectives: (tpData || []).map((tp) => ({ id: tp.id, code: tp.code, description: tp.description })),
      assessments: (assessmentData || []).map((activity) => ({
        id: activity.id,
        date: activity.date,
        minimum_score: activity.minimum_score,
        achievement_threshold: activity.achievement_threshold,
        max_score: activity.max_score,
        learning_indicator_ids: activity.learning_indicator_ids,
        results: activity.assessment_results
          .map((result) => ({ student_id: result.student_id, score: result.score }))
          .sort((a, b) => a.student_id.localeCompare(b.student_id)),
      })).sort((a, b) => a.id.localeCompare(b.id)),
      reflections: (reflectionData || []).map((item) => ({
        question_id: item.id,
        question: item.question,
        purpose: item.purpose,
        answer: item.reflection_answers[0]?.answer || '',
      })).sort((a, b) => a.question_id.localeCompare(b.question_id)),
      indicators: (tpData || []).flatMap((tp) => tp.learning_indicators.map((indicator) => ({
        id: indicator.id,
        code: indicator.code,
        description: indicator.description,
        criteria: indicator.criteria,
        achievement_threshold: indicator.achievement_threshold,
      }))).sort((a, b) => a.id.localeCompare(b.id)),
    };
    const inputHash = await generateHash(JSON.stringify(inputSnapshot));

    // Check if analysis already exists with same input
    const { data: existingAnalysis } = await supabase
      .from('ai_analyses')
      .select('id')
      .eq('learning_session_id', session.id)
      .eq('input_hash', inputHash)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingAnalysis) {
      const { data: analysis } = await supabase
        .from('ai_analyses')
        .select('*')
        .eq('id', existingAnalysis.id)
        .single();
      return NextResponse.json({ analysis });
    }

    // Create analysis record
    const { data: analysisRecord, error: createError } = await supabase
      .from('ai_analyses')
      .insert({
        learning_session_id: session.id,
        teacher_id: user.id,
        status: 'processing',
        input_snapshot: inputSnapshot,
        input_hash: inputHash,
        deterministic_metrics: deterministicMetrics,
        achievement_percentage: achievementPercentage,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating analysis record:', createError);
      return NextResponse.json({ error: 'Failed to create analysis' }, { status: 500 });
    }

    // Prepare AI input
    const [{ data: subjectData }, { data: classData }] = await Promise.all([
      supabase.from('subjects').select('name').eq('id', session.subject_id).maybeSingle(),
      supabase.from('classes').select('grade').eq('id', session.class_id).maybeSingle(),
    ]);
    const aiInput = {
      session: {
        subject: subjectData?.name || '',
        grade: classData?.grade || '',
        phase: session.phase,
        topic: session.topic,
        date: session.date,
        durationMinutes: session.duration_minutes,
      },
      cp: cpData || [],
      tp: tpData?.map((tp) => ({
        id: tp.id,
        code: tp.code,
        description: tp.description,
        indicators: tp.learning_indicators.map((ind) => ({
          id: ind.id,
          code: ind.code,
          description: ind.description,
          criteria: ind.criteria,
        })),
      })) || [],
      assessmentData: indicatorAnalysis.map((ia) => ({
        indicatorId: ia.indicator_id,
        totalStudents,
        studentsWithValidEvidence: ia.students_with_valid_evidence,
        studentsMeetingCriteria: ia.students_meeting_criteria,
        percentage: ia.percentage,
        status: ia.status,
        scoreDistribution: [],
      })),
      reflectionAnswers: reflectionData?.map((rq) => ({
        question: rq.question,
        answer: rq.reflection_answers[0]?.answer || '',
      })) || [],
      dataCompleteness,
    };

    // Call AI
    const aiProvider = await createAIProvider();
    const aiSettings = await getServerAISettings();
    let aiResult;
    try {
      aiResult = await aiProvider.analyzeLearning(aiInput);
    } catch (aiError) {
      await supabase.from('ai_analyses').update({
        status: 'failed',
        error_message: aiError instanceof Error ? aiError.message.slice(0, 1000) : 'AI request failed',
        updated_at: new Date().toISOString(),
      }).eq('id', analysisRecord.id);
      throw aiError;
    }

    // Update analysis with AI output
    const { error: updateError } = await supabase
      .from('ai_analyses')
      .update({
        status: 'completed',
        ai_output: aiResult,
        achievement_percentage: achievementPercentage,
        provider: aiSettings.provider,
        model: aiSettings.model || 'unspecified',
        prompt_version: '1.0',
        updated_at: new Date().toISOString(),
      })
      .eq('id', analysisRecord.id);

    if (updateError) {
      console.error('Error updating analysis:', updateError);
    }

    // Fetch updated analysis
    const { data: updatedAnalysis } = await supabase
      .from('ai_analyses')
      .select('*')
      .eq('id', analysisRecord.id)
      .single();

    return NextResponse.json({ analysis: updatedAnalysis });
  } catch (error) {
    console.error('AI learning analysis error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function generateHash(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}