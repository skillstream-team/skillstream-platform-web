import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';
import { compact } from './helpers.js';

type SummarizePayload = {
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

  let payload: SummarizePayload = {};
  try {
    payload = (await req.json()) as SummarizePayload;
  } catch {
    payload = {};
  }

  const { data: rateAllowed, error: rateError } = await admin.rpc('check_rate_limit', {
    p_key: `ai-summarize:${userId}`,
    p_limit: 15,
    p_window_seconds: 60,
  });
  if (rateError) {
    return json(500, { error: 'Rate-limit check failed', details: rateError.message });
  }
  if (!rateAllowed) {
    return json(429, { error: 'Rate limit exceeded' });
  }

  let classIds: string[] = [];
  if (payload.classId) {
    const targetClassId = payload.classId;
    if (profile.role === 'admin') {
      const { data: targetClass } = await admin.from('classes').select('id').eq('id', targetClassId).maybeSingle();
      if (!targetClass) {
        return json(404, { error: 'Class not found' });
      }
      classIds = [targetClassId];
    } else {
      const { data: membership } = await admin
        .from('class_members')
        .select('class_id')
        .eq('class_id', targetClassId)
        .eq('user_id', userId)
        .maybeSingle();
      if (!membership) {
        return json(403, { error: 'You do not have access to this class.' });
      }
      classIds = [targetClassId];
    }
  } else {
    if (profile.role === 'admin') {
      const { data: allClasses } = await admin.from('classes').select('id').order('created_at', { ascending: false }).range(0, 49);
      classIds = (allClasses || []).map((row) => row.id as string);
    } else {
      const { data: memberships } = await admin
        .from('class_members')
        .select('class_id')
        .eq('user_id', userId)
        .range(0, 49);
      classIds = (memberships || []).map((row) => row.class_id as string);
    }
  }

  if (classIds.length === 0) {
    return json(200, {
      mode: 'rule_based',
      provider: 'skillstream_rules_v1',
      summary: 'No class data is available yet.',
      bullets: ['Create or join a class to unlock summaries.'],
      generatedAt: new Date().toISOString(),
    });
  }

  const [{ data: classes }, { data: lessons }, { data: assignments }, { data: messages }] = await Promise.all([
    admin.from('classes').select('id, name').in('id', classIds).range(0, 49),
    admin.from('lessons').select('class_id, title, scheduled_at').in('class_id', classIds).order('scheduled_at', { ascending: false }).range(0, 9),
    admin.from('class_assignments').select('class_id, title, completion_rate, submissions_pending_review').in('class_id', classIds).range(0, 9),
    admin.from('class_messages').select('class_id, body, sent_at').in('class_id', classIds).order('sent_at', { ascending: false }).range(0, 9),
  ]);

  const classNames = new Map((classes || []).map((row) => [row.id as string, row.name as string]));
  const latestLesson = lessons?.[0];
  const lowestCompletion = (assignments || []).reduce<{ title: string; completion_rate: number } | null>((acc, row) => {
    const candidate = {
      title: row.title as string,
      completion_rate: Number(row.completion_rate || 0),
    };
    if (!acc) return candidate;
    return candidate.completion_rate < acc.completion_rate ? candidate : acc;
  }, null);
  const pendingReviews = (assignments || []).reduce((sum, row) => sum + Number(row.submissions_pending_review || 0), 0);
  const latestMessage = messages?.[0];

  const bullets: string[] = [];
  if (latestLesson) {
    bullets.push(
      `Latest lesson: ${compact(latestLesson.title as string)} (${classNames.get(latestLesson.class_id as string) || 'Class'}).`
    );
  }
  if (lowestCompletion) {
    bullets.push(`Lowest assignment completion: ${compact(lowestCompletion.title)} at ${Math.round(lowestCompletion.completion_rate)}%.`);
  }
  if (pendingReviews > 0) {
    bullets.push(`${pendingReviews} assignment submission${pendingReviews === 1 ? '' : 's'} still need review.`);
  }
  if (latestMessage) {
    bullets.push(`Recent learner message: "${compact(String(latestMessage.body || ''))}"`);
  }
  if (bullets.length === 0) {
    bullets.push('Your class data is still sparse. Keep posting lessons and updates for richer summaries.');
  }

  const summary =
    profile.role === 'student'
      ? 'Here is your latest class snapshot, based on lessons, assignments, and messages.'
      : 'Here is your teaching snapshot, based on current class activity and learner progress.';

  return json(200, {
    mode: 'rule_based',
    provider: 'skillstream_rules_v1',
    summary,
    bullets,
    generatedAt: new Date().toISOString(),
  });
});
