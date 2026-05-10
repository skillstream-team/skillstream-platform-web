import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';
import { normalizeEventType } from './helpers.js';

type AnalyticsPayload = {
  eventType?: string;
  classId?: string | null;
  lessonId?: string | null;
  metadata?: Record<string, unknown> | null;
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

  const bearer = req.headers.get('Authorization') || '';
  const jwt = bearer.replace('Bearer ', '').trim();
  if (!jwt) {
    return json(401, { error: 'Missing bearer token' });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  if (userError || !userData.user) {
    return json(401, { error: 'Invalid token' });
  }

  let payload: AnalyticsPayload;
  try {
    payload = (await req.json()) as AnalyticsPayload;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const eventType = normalizeEventType(payload.eventType);
  if (!eventType) {
    return json(422, { error: 'eventType is required' });
  }
  if (eventType.length > 64) {
    return json(422, { error: 'eventType is too long' });
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (profileError || !profile) {
    return json(404, { error: 'Profile not found' });
  }

  let normalizedClassId = payload.classId || null;
  let normalizedLessonId = payload.lessonId || null;

  if (normalizedLessonId) {
    const { data: lesson, error: lessonError } = await admin
      .from('lessons')
      .select('id, class_id')
      .eq('id', normalizedLessonId)
      .maybeSingle();
    if (lessonError || !lesson) {
      return json(422, { error: 'lessonId is invalid' });
    }
    if (normalizedClassId && normalizedClassId !== lesson.class_id) {
      return json(422, { error: 'lessonId does not belong to classId' });
    }
    normalizedClassId = lesson.class_id;
  }

  if (normalizedClassId && profile.role !== 'admin') {
    const { data: membership, error: membershipError } = await admin
      .from('class_members')
      .select('class_id')
      .eq('class_id', normalizedClassId)
      .eq('user_id', userData.user.id)
      .maybeSingle();
    if (membershipError || !membership) {
      return json(403, { error: 'You do not have access to this class.' });
    }
  }

  const rateKey = `analytics:${userData.user.id}:${eventType}`;
  const { data: isAllowed, error: rateLimitError } = await admin.rpc('check_rate_limit', {
    p_key: rateKey,
    p_limit: 120,
    p_window_seconds: 60,
  });
  if (rateLimitError) {
    return json(500, { error: 'Rate-limit check failed', details: rateLimitError.message });
  }
  if (!isAllowed) {
    return json(429, { error: 'Rate limit exceeded' });
  }

  const { error: insertError } = await admin.from('analytics_events').insert({
    actor_user_id: userData.user.id,
    class_id: normalizedClassId,
    lesson_id: normalizedLessonId,
    event_type: eventType,
    metadata: payload.metadata || {},
  });

  if (insertError) {
    return json(500, { error: 'Could not record analytics event', details: insertError.message });
  }

  return json(200, { ok: true });
});
