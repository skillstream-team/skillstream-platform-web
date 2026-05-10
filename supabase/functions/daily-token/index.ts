import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  normalizeMode,
  normalizeNotes,
  normalizeTicketPrice,
  parseRoomName,
  roomNameFromLessonId,
} from './helpers.js';

interface DailyMeetingTokenResponse {
  token: string;
}

interface DailyTokenRequest {
  lessonId: string;
  sessionMode?: 'free' | 'paid';
  ticketPriceGBP?: number;
  notes?: string;
}

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
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const dailyApiKey = Deno.env.get('DAILY_API_KEY');

  if (!supabaseUrl || !supabaseServiceRoleKey || !dailyApiKey) {
    return json(500, { error: 'Missing server configuration' });
  }

  const authHeader = req.headers.get('Authorization');
  const jwt = authHeader?.replace('Bearer ', '').trim();
  if (!jwt) {
    return json(401, { error: 'Missing bearer token' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser(jwt);

  if (authError || !user) {
    return json(401, { error: 'Invalid user token' });
  }

  let payload: DailyTokenRequest;
  try {
    payload = (await req.json()) as DailyTokenRequest;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  if (!payload.lessonId) {
    return json(400, { error: 'lessonId is required' });
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    return json(403, { error: 'Profile not found' });
  }

  const { data: lesson, error: lessonError } = await supabaseAdmin
    .from('lessons')
    .select(`
      id,
      class_id,
      title,
      classes!inner(name)
    `)
    .eq('id', payload.lessonId)
    .maybeSingle();

  if (lessonError || !lesson) {
    return json(404, { error: 'Lesson not found' });
  }

  const { data: member, error: memberError } = await supabaseAdmin
    .from('class_members')
    .select('member_role')
    .eq('class_id', lesson.class_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (memberError) {
    return json(500, { error: 'Membership lookup failed' });
  }

  const isAdmin = profile.role === 'admin';
  const isTeacher = member?.member_role === 'teacher';
  const isStudent = member?.member_role === 'student';

  if (!isAdmin && !isTeacher && !isStudent) {
    return json(403, { error: 'You are not enrolled in this class' });
  }

  const requestedMode = normalizeMode(payload.sessionMode);
  const requestedTicketPrice = normalizeTicketPrice(requestedMode, payload.ticketPriceGBP);
  const requestedNotes = normalizeNotes(payload.notes);

  let liveConfig: {
    lesson_id: string;
    daily_room_url: string;
    session_mode: 'free' | 'paid';
    ticket_price_gbp: number;
    notes: string;
  } | null = null;

  const { data: existingLiveConfig, error: liveConfigError } = await supabaseAdmin
    .from('lesson_live_configs')
    .select('lesson_id, daily_room_url, session_mode, ticket_price_gbp, notes')
    .eq('lesson_id', lesson.id)
    .maybeSingle();
  if (liveConfigError) {
    return json(500, { error: 'Could not load live lesson settings' });
  }
  liveConfig = existingLiveConfig;

  if (!liveConfig) {
    if (!isTeacher && !isAdmin) {
      return json(409, {
        error: 'Lesson setup pending',
        message: 'The teacher has not started this lesson yet.',
      });
    }

    const roomName = roomNameFromLessonId(lesson.id);
    const createRoomResponse = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${dailyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: roomName,
        privacy: 'private',
      }),
    });

    if (!createRoomResponse.ok) {
      const raw = await createRoomResponse.text();
      return json(502, { error: 'Daily room creation failed', details: raw });
    }

    const roomPayload = (await createRoomResponse.json()) as { url?: string };
    if (!roomPayload.url) {
      return json(502, { error: 'Daily room response missing URL' });
    }

    const { data: insertedConfig, error: insertConfigError } = await supabaseAdmin
      .from('lesson_live_configs')
      .insert({
        lesson_id: lesson.id,
        daily_room_url: roomPayload.url,
        session_mode: requestedMode,
        ticket_price_gbp: requestedTicketPrice,
        notes: requestedNotes,
        updated_by_user_id: user.id,
      })
      .select('lesson_id, daily_room_url, session_mode, ticket_price_gbp, notes')
      .single();
    if (insertConfigError || !insertedConfig) {
      return json(500, {
        error: 'Could not save live lesson settings',
        details: insertConfigError?.message,
      });
    }
    liveConfig = insertedConfig;
  } else if (isTeacher || isAdmin) {
    const { data: updatedConfig, error: updateConfigError } = await supabaseAdmin
      .from('lesson_live_configs')
      .update({
        session_mode: requestedMode,
        ticket_price_gbp: requestedTicketPrice,
        notes: requestedNotes,
        updated_by_user_id: user.id,
      })
      .eq('lesson_id', lesson.id)
      .select('lesson_id, daily_room_url, session_mode, ticket_price_gbp, notes')
      .single();
    if (updateConfigError || !updatedConfig) {
      return json(500, {
        error: 'Could not update live lesson settings',
        details: updateConfigError?.message,
      });
    }
    liveConfig = updatedConfig;
  }

  if (!liveConfig?.daily_room_url) {
    return json(500, { error: 'Live lesson room is not available' });
  }

  if (liveConfig.session_mode === 'paid' && isStudent && !isAdmin) {
    const { data: purchase } = await supabaseAdmin
      .from('lesson_live_purchases')
      .select('status')
      .eq('lesson_id', lesson.id)
      .eq('student_user_id', user.id)
      .maybeSingle();

    if (!purchase || purchase.status !== 'paid') {
      return json(402, {
        error: 'Payment required',
        message: 'This is a paid one-off session. Complete payment before joining.',
      });
    }
  }

  const roomName = parseRoomName(liveConfig.daily_room_url);
  if (!roomName) {
    return json(422, { error: 'Invalid Daily room URL' });
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 2 * 60 * 60;
  const dailyResponse = await fetch('https://api.daily.co/v1/meeting-tokens', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${dailyApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        room_name: roomName,
        is_owner: isTeacher || isAdmin,
        user_name: profile.full_name || user.email,
        user_id: user.id,
        user_data: JSON.stringify({
          lesson_id: lesson.id,
          user_id: user.id,
        }),
        exp: expiresAt,
      },
    }),
  });

  if (!dailyResponse.ok) {
    const raw = await dailyResponse.text();
    return json(502, { error: 'Daily token request failed', details: raw });
  }

  const dailyData = (await dailyResponse.json()) as DailyMeetingTokenResponse;
  return json(200, {
    token: dailyData.token,
    roomUrl: liveConfig.daily_room_url,
    lessonId: lesson.id,
    sessionMode: liveConfig.session_mode,
    ticketPriceGBP: Number(liveConfig.ticket_price_gbp || 0),
  });
});
