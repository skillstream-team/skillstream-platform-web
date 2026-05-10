import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';
import { isValidEmail } from './helpers.js';

type InviteEmailPayload = {
  classId?: string;
  email?: string;
  inviteLink?: string;
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

  let payload: InviteEmailPayload;
  try {
    payload = (await req.json()) as InviteEmailPayload;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const classId = (payload.classId || '').trim();
  const email = (payload.email || '').trim().toLowerCase();
  const inviteLink = (payload.inviteLink || '').trim();
  if (!classId || !email || !inviteLink) {
    return json(422, { error: 'classId, email, and inviteLink are required' });
  }
  if (!isValidEmail(email)) {
    return json(422, { error: 'Email format is invalid' });
  }

  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .maybeSingle();
  if (profileError || !profile) {
    return json(403, { error: 'Profile not found' });
  }

  const { data: targetClass, error: classError } = await admin
    .from('classes')
    .select('id')
    .eq('id', classId)
    .maybeSingle();
  if (classError || !targetClass) {
    return json(404, { error: 'Class not found' });
  }

  if (profile.role !== 'admin') {
    const { data: membership, error: membershipError } = await admin
      .from('class_members')
      .select('class_id')
      .eq('class_id', classId)
      .eq('user_id', userData.user.id)
      .eq('member_role', 'teacher')
      .maybeSingle();
    if (membershipError || !membership) {
      return json(403, { error: 'Not allowed to invite students to this class' });
    }
  }

  const { data: rateAllowed, error: rateError } = await admin.rpc('check_rate_limit', {
    p_key: `class-invite-email:${userData.user.id}`,
    p_limit: 10,
    p_window_seconds: 60,
  });
  if (rateError) {
    return json(500, { error: 'Rate-limit check failed', details: rateError.message });
  }
  if (!rateAllowed) {
    return json(429, { error: 'Rate limit exceeded' });
  }

  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: inviteLink,
    data: {
      role: 'student',
      invited_via: 'class_invite',
      class_id: classId,
    },
  });

  if (inviteError) {
    const lower = inviteError.message.toLowerCase();
    const alreadyExists = lower.includes('already been registered') || lower.includes('already registered');
    if (!alreadyExists) {
      return json(500, { error: 'Failed to send invite email', details: inviteError.message });
    }
  }

  return json(200, { ok: true });
});
