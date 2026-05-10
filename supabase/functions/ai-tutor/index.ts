import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';
import { asLower, inferIntent } from './helpers.js';

type TutorPayload = {
  question?: string;
  classId?: string;
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return json(500, { error: 'Missing server configuration' });
  }

  const authHeader = req.headers.get('Authorization') || '';
  const jwt = authHeader.replace('Bearer ', '').trim();
  if (!jwt) {
    return json(401, { error: 'Missing bearer token' });
  }

  let payload: TutorPayload;
  try {
    payload = (await req.json()) as TutorPayload;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const question = (payload.question || '').trim();
  if (!question) {
    return json(422, { error: 'question is required' });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: authData, error: authError } = await admin.auth.getUser(jwt);
  if (authError || !authData.user) {
    return json(401, { error: 'Invalid token' });
  }

  const userId = authData.user.id;
  const { data: profile, error: profileError } = await admin.from('profiles').select('role').eq('id', userId).maybeSingle();
  if (profileError || !profile) {
    return json(404, { error: 'Profile not found' });
  }

  const { data: studyAssistFlag, error: studyAssistFlagError } = await admin
    .from('admin_feature_flags')
    .select('enabled, rollout')
    .eq('key', 'study_assist')
    .maybeSingle();
  if (studyAssistFlagError) {
    return json(500, { error: 'Could not evaluate assistant feature availability.' });
  }
  if (profile.role !== 'admin' && !studyAssistFlag) {
    return json(403, { error: 'Assistant is currently unavailable.' });
  }
  if (profile.role !== 'admin' && studyAssistFlag) {
    const allowedByRollout =
      studyAssistFlag.rollout === 'all'
      || (studyAssistFlag.rollout === 'teachers' && profile.role === 'teacher')
      || (studyAssistFlag.rollout === 'students' && profile.role === 'student');
    if (!studyAssistFlag.enabled || !allowedByRollout) {
      return json(403, { error: 'Assistant is currently disabled for your account.' });
    }
  }

  const { data: rateAllowed, error: rateError } = await admin.rpc('check_rate_limit', {
    p_key: `ai-tutor:${userId}`,
    p_limit: 25,
    p_window_seconds: 60,
  });
  if (rateError) {
    return json(500, { error: 'Rate-limit check failed', details: rateError.message });
  }
  if (!rateAllowed) {
    return json(429, { error: 'Rate limit exceeded' });
  }

  const intent = inferIntent(question);

  let classIds: string[] = [];
  if (profile.role === 'admin') {
    const { data: allClasses } = await admin.from('classes').select('id').order('created_at', { ascending: false }).range(0, 99);
    classIds = (allClasses || []).map((row) => row.id as string);
  } else {
    const { data: memberships } = await admin
      .from('class_members')
      .select('class_id')
      .eq('user_id', userId)
      .range(0, 99);
    classIds = (memberships || []).map((row) => row.class_id as string);
  }

  let targetClassId = payload.classId || classIds[0] || null;
  if (targetClassId && !classIds.includes(targetClassId)) {
    return json(403, { error: 'You do not have access to this class.' });
  }

  const [{ data: lessons }, { data: assignments }, { data: insights }] = await Promise.all([
    targetClassId
      ? admin.from('lessons').select('title, scheduled_at').eq('class_id', targetClassId).order('scheduled_at', { ascending: true }).range(0, 4)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    targetClassId
      ? admin
          .from('class_assignments')
          .select('title, due_at, completion_rate, submissions_pending_review')
          .eq('class_id', targetClassId)
          .order('due_at', { ascending: true })
          .range(0, 4)
      : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    admin.from('student_insights').select('progress, homework_completion, needs_attention').eq('user_id', userId).maybeSingle(),
  ]);

  const responseLines: string[] = [];
  const tips: string[] = [];

  if (intent === 'schedule') {
    const nextLesson = (lessons || []).find((row) => new Date(String(row.scheduled_at)).getTime() > Date.now());
    if (nextLesson) {
      responseLines.push(`Your next lesson is "${String(nextLesson.title)}".`);
      responseLines.push(`It is scheduled for ${new Date(String(nextLesson.scheduled_at)).toLocaleString('en-GB')}.`);
      tips.push('Join 5 minutes early and review your last class notes first.');
    } else {
      responseLines.push('No upcoming lesson is scheduled yet.');
      tips.push('Open Schedule and set your next lesson now.');
    }
  } else if (intent === 'homework') {
    const nextAssignment = (assignments || [])[0];
    if (nextAssignment) {
      responseLines.push(`Next assignment: "${String(nextAssignment.title)}".`);
      responseLines.push(`Due date: ${new Date(String(nextAssignment.due_at)).toLocaleString('en-GB')}.`);
      tips.push('Break it into 2 focused sessions instead of one long session.');
    } else {
      responseLines.push('No assignment is currently listed for your class.');
      tips.push('Check class messages for any teacher updates.');
    }
  } else if (intent === 'progress') {
    const progress = Number(insights?.progress || 0);
    const homeworkCompletion = Number(insights?.homework_completion || 0);
    responseLines.push(`Current progress is ${progress}%.`);
    responseLines.push(`Homework completion is ${homeworkCompletion}%.`);
    if (progress < 70 || homeworkCompletion < 70 || Boolean(insights?.needs_attention)) {
      tips.push('Focus on one weak topic per day for the next 5 days.');
      tips.push('Send one question to your teacher after each lesson recap.');
    } else {
      tips.push('Keep your current rhythm and maintain weekly recap notes.');
    }
  } else {
    responseLines.push('I can help with homework planning, schedule checks, and progress improvement.');
    tips.push('Try asking: "What should I focus on this week?"');
    tips.push('Try asking: "When is my next lesson?"');
  }

  const role = asLower(profile.role);
  if (role === 'teacher') {
    tips.push('As a teacher, use class messages to send one action item after each live session.');
  }

  return json(200, {
    mode: 'rule_based',
    provider: 'skillstream_rules_v1',
    intent,
    answer: responseLines.join(' '),
    tips: tips.slice(0, 3),
    generatedAt: new Date().toISOString(),
  });
});
