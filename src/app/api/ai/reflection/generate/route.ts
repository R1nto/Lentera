import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAIProvider } from '@/services/ai/ai-provider';

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
    const { learning_session_id } = body;

    if (!learning_session_id) {
      return NextResponse.json({ error: 'learning_session_id is required' }, { status: 400 });
    }

    // Verify ownership
    const { data: session, error: sessionError } = await supabase
      .from('learning_sessions')
      .select('id, teacher_id, class_id, subject_id, topic, phase, duration_minutes, learning_outcome_ids, learning_objective_ids')
      .eq('id', learning_session_id)
      .eq('teacher_id', user.id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Session not found or access denied' }, { status: 404 });
    }

    // Fetch CP
    const { data: cpData } = await supabase
      .from('learning_outcomes')
      .select('code, description')
      .in('id', session.learning_outcome_ids);

    // Fetch TP with indicators
    const { data: tpData } = await supabase
      .from('learning_objectives')
      .select(`
        id,
        code,
        description,
        learning_indicators!inner(id, code, description, criteria)
      `)
      .in('id', session.learning_objective_ids);

    // Get class info
    const { data: classData } = await supabase
      .from('classes')
      .select('name, grade, phase')
      .eq('id', session.class_id)
      .single();

    const { data: subjectData } = await supabase
      .from('subjects')
      .select('name')
      .eq('id', session.subject_id)
      .single();

    const { data: studentCount } = await supabase
      .from('students')
      .select('id', { count: 'exact' })
      .eq('class_id', session.class_id)
      .eq('is_active', true);

    // Prepare AI input
    const aiInput = {
      subject: subjectData?.name || '',
      grade: classData?.grade || '',
      phase: classData?.phase || '',
      topic: session.topic,
      durationMinutes: session.duration_minutes,
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
      classInfo: {
        studentCount: studentCount?.length || 0,
      },
    };

    // Call AI
    const aiProvider = await createAIProvider();
    const result = await aiProvider.generateReflectionQuestions(aiInput);

    // Save questions to database
    const questionsToInsert = result.questions.map((q, index) => ({
      learning_session_id: session.id,
      question: q.question,
      purpose: q.purpose,
      related_indicator_ids: q.relatedIndicatorIds,
      response_type: q.responseType,
      options: q.options,
      is_required: q.required,
      order_index: index,
      generated_by_ai: true,
    }));

    const { error: insertError } = await supabase
      .from('reflection_questions')
      .insert(questionsToInsert);

    if (insertError) {
      console.error('Error saving reflection questions:', insertError);
      return NextResponse.json({ error: 'Failed to save questions' }, { status: 500 });
    }

    // Fetch saved questions
    const { data: savedQuestions } = await supabase
      .from('reflection_questions')
      .select('*')
      .eq('learning_session_id', session.id)
      .order('order_index');

    return NextResponse.json({ questions: savedQuestions });
  } catch (error) {
    console.error('AI reflection generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}