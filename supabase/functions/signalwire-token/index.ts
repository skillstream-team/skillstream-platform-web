import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';
import { normalizeMode, normalizeNotes, normalizeTicketPrice, roomNameFromLessonId } from './helpers.ts';

interface TokenRequest {
  lessonId: string;
  sessionMode?: 'free' | 'paid';
  ticketPriceGBP?: number;
  notes?: string;
}

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const swSpaceUrl = Deno.env.get('SIGNALWIRE_SPACE_URL');   // e.g. myspace.signalwire.com
  const swProjectId = Deno.env.get('SIGNALWIRE_PROJECT_ID');
  const swApiToken = Deno.env.get('SIGNALWIRE_API_TOKEN');

  if (!supabaseUrl || !supabaseServiceRoleKey || !swSpaceUrl || !swProjectId || !swApiToken) {
    return json(500, { error: 'Missing server configuration' });
  }

  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
  if (!jwt) return json(401, { error: 'Missing bearer token' });

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
  if (authError || !user) return json(401, { error: 'Invalid user token' });

  let payload: TokenRequest;
  try {
    payload = (await req.json()) as TokenRequest;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }
  if (!payload.lessonId) return json(400, { error: 'lessonId is required' });

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, role, full_name')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile) return json(403, { error: 'Profile not found' });

  const { data: lesson } = await supabaseAdmin
    .from('lessons')
    .select('id, class_id, title')
    .eq('id', payload.lessonId)
    .maybeSingle();
  if (!lesson) return json(404, { error: 'Lesson not found' });

  const { data: member, error: memberError } = await supabaseAdmin
    .from('class_members')
    .select('member_role')
    .eq('class_id', lesson.class_id)
    .eq('user_id', user.id)
    .maybeSingle();
  if (memberError) return json(500, { error: 'Membership lookup failed' });

  const isAdmin = profile.role === 'admin';
  const isTeacher = member?.member_role === 'teacher';
  const isStudent = member?.member_role === 'student';
  if (!isAdmin && !isTeacher && !isStudent) {
    return json(403, { error: 'You are not enrolled in this class' });
  }

  const requestedMode = normalizeMode(payload.sessionMode);
  const requestedTicketPrice = normalizeTicketPrice(requestedMode, payload.ticketPriceGBP);
  const requestedNotes = normalizeNotes(payload.notes);
  const roomName = roomNameFromLessonId(lesson.id);

  // Load or create live config
  const { data: existingConfig, error: configError } = await supabaseAdmin
    .from('lesson_live_configs')
    .select('lesson_id, room_name, session_mode, ticket_price_gbp, notes')
    .eq('lesson_id', lesson.id)
    .maybeSingle();
  if (configError) return json(500, { error: 'Could not load live lesson settings' });

  type LiveConfig = { lesson_id: string; room_name: string; session_mode: 'free' | 'paid'; ticket_price_gbp: number; notes: string };
  let liveConfig: LiveConfig | null = existingConfig as LiveConfig | null;

  if (!liveConfig) {
    if (!isTeacher && !isAdmin) {
      return json(409, { error: 'Lesson setup pending', message: 'The teacher has not started this lesson yet.' });
    }
    const { data: inserted, error: insertError } = await supabaseAdmin
      .from('lesson_live_configs')
      .insert({
        lesson_id: lesson.id,
        room_name: roomName,
        session_mode: requestedMode,
        ticket_price_gbp: requestedTicketPrice,
        notes: requestedNotes,
        updated_by_user_id: user.id,
      })
      .select('lesson_id, room_name, session_mode, ticket_price_gbp, notes')
      .single();
    if (insertError || !inserted) {
      return json(500, { error: 'Could not save live lesson settings', details: insertError?.message });
    }
    liveConfig = inserted as LiveConfig;
  } else if (isTeacher || isAdmin) {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('lesson_live_configs')
      .update({
        session_mode: requestedMode,
        ticket_price_gbp: requestedTicketPrice,
        notes: requestedNotes,
        updated_by_user_id: user.id,
      })
      .eq('lesson_id', lesson.id)
      .select('lesson_id, room_name, session_mode, ticket_price_gbp, notes')
      .single();
    if (updateError || !updated) {
      return json(500, { error: 'Could not update live lesson settings', details: updateError?.message });
    }
    liveConfig = updated as LiveConfig;
  }

  if (!liveConfig?.room_name) {
    return json(500, { error: 'Live lesson room is not available' });
  }

  // Participant limit gate: check teacher's plan capacity before admitting a student
  if (isStudent && !isAdmin) {
    const { data: classTeacher } = await supabaseAdmin
      .from('class_members')
      .select('user_id')
      .eq('class_id', lesson.class_id)
      .eq('member_role', 'teacher')
      .maybeSingle();

    if (classTeacher?.user_id) {
      const { data: sub } = await supabaseAdmin
        .from('teacher_subscriptions')
        .select('billing_plans(max_live_participants)')
        .eq('teacher_user_id', classTeacher.user_id)
        .eq('status', 'active')
        .maybeSingle();

      const planData = sub?.billing_plans as { max_live_participants?: number } | null;
      const maxParticipants = planData?.max_live_participants ?? null;

      if (maxParticipants !== null) {
        // Count participants currently in session (joined but not yet left)
        const { count } = await supabaseAdmin
          .from('live_attendance_events')
          .select('id', { count: 'exact', head: true })
          .eq('lesson_id', lesson.id)
          .is('left_at', null);

        if ((count ?? 0) >= maxParticipants) {
          return json(403, {
            error: 'Session is full',
            message: `This session has reached its maximum of ${maxParticipants} participants.`,
          });
        }
      }
    }
  }

  // Payment gate for paid sessions
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
        ticketPriceGBP: Number(liveConfig.ticket_price_gbp),
      });
    }
  }

  // Look up the teacher for this class so clients can verify broadcast authenticity
  const { data: classTeacherRow } = await supabaseAdmin
    .from('class_members')
    .select('user_id')
    .eq('class_id', lesson.class_id)
    .eq('member_role', 'teacher')
    .maybeSingle();

  const isModerator = isTeacher || isAdmin;
  const userName = profile.full_name || user.email || 'Guest';

  // Moderators get room management permissions; students get self-only permissions
  const permissions = isModerator
    ? [
        'room.self.audio_mute', 'room.self.audio_unmute',
        'room.self.video_mute', 'room.self.video_unmute',
        'room.member.audio_mute', 'room.member.remove',
        'room.recording', 'room.list_available_layouts',
      ]
    : [
        'room.self.audio_mute', 'room.self.audio_unmute',
        'room.self.video_mute', 'room.self.video_unmute',
      ];

  const swResp = await fetch(`https://${swSpaceUrl}/api/video/room_tokens`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${swProjectId}:${swApiToken}`)}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      room_name: liveConfig.room_name,
      user_name: userName,
      permissions,
    }),
  });

  if (!swResp.ok) {
    const details = await swResp.text();
    return json(502, { error: 'Could not create video session', details });
  }

  const swData = await swResp.json() as { token: string };

  return json(200, {
    roomName: liveConfig.room_name,
    roomToken: swData.token,
    isModerator,
    userName,
    sessionMode: liveConfig.session_mode,
    ticketPriceGBP: Number(liveConfig.ticket_price_gbp || 0),
    teacherUserId: classTeacherRow?.user_id ?? null,
  });
});
