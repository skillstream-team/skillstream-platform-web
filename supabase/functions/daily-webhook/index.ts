import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';
import {
  normalizeSignature,
  normalizeUnixTimestampSeconds,
  signaturesFromHeader,
  toBase64,
  toBytes,
  toHex,
} from './helpers.js';

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });

const encoder = new TextEncoder();
const MAX_WEBHOOK_AGE_SECONDS = 5 * 60;

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const getNestedString = (root: unknown, path: string[]): string | null => {
  let current: unknown = root;
  for (const key of path) {
    const record = asRecord(current);
    current = record[key];
    if (current === undefined || current === null) return null;
  }
  return typeof current === 'string' && current.trim().length > 0 ? current.trim() : null;
};

const safeParseJson = (value: string | null): Record<string, unknown> => {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return asRecord(parsed);
  } catch {
    return {};
  }
};

const signHmacSha256 = async (secretBase64: string, payload: string): Promise<Uint8Array> => {
  const key = await crypto.subtle.importKey(
    'raw',
    toBytes(secretBase64),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return new Uint8Array(signature);
};

const verifyDailyWebhookSignature = async ({
  secretBase64,
  timestampHeader,
  signatureHeader,
  rawBody,
}: {
  secretBase64: string;
  timestampHeader: string;
  signatureHeader: string;
  rawBody: string;
}): Promise<boolean> => {
  const ts = normalizeUnixTimestampSeconds(timestampHeader);
  if (!ts) return false;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > MAX_WEBHOOK_AGE_SECONDS) return false;

  const provided = new Set(signaturesFromHeader(signatureHeader));
  if (provided.size === 0) return false;

  // Daily docs mention HMAC-SHA256 over event payload. We support common timestamp+payload forms for compatibility.
  const candidates = [rawBody, `${timestampHeader}.${rawBody}`, `${timestampHeader}:${rawBody}`];

  for (const candidate of candidates) {
    const digest = await signHmacSha256(secretBase64, candidate);
    const hex = toHex(digest);
    const base64 = toBase64(digest);
    if (provided.has(hex) || provided.has(base64)) {
      return true;
    }
  }

  return false;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const webhookHmacBase64 = Deno.env.get('DAILY_WEBHOOK_HMAC') || Deno.env.get('DAILY_WEBHOOK_SECRET');
  if (!supabaseUrl || !supabaseServiceRoleKey || !webhookHmacBase64) {
    return json(500, { error: 'Missing server configuration' });
  }

  const signatureHeader = req.headers.get('x-webhook-signature') || '';
  const timestampHeader = req.headers.get('x-webhook-timestamp') || '';
  if (!signatureHeader || !timestampHeader) {
    return json(401, { error: 'Missing webhook signature headers' });
  }

  const rawBody = await req.text();
  const isValid = await verifyDailyWebhookSignature({
    secretBase64: webhookHmacBase64,
    timestampHeader,
    signatureHeader,
    rawBody,
  });
  if (!isValid) {
    return json(401, { error: 'Invalid webhook signature' });
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return json(400, { error: 'Invalid webhook payload' });
  }
  const eventName = payload?.event as string | undefined;
  const payloadData = asRecord(payload?.payload);

  if (!eventName || !payloadData) {
    return json(400, { error: 'Invalid webhook payload' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  const resolveLessonId = async (fallbackPayload: Record<string, unknown>): Promise<string | null> => {
    const directLessonId = getNestedString(fallbackPayload, ['custom_data', 'lesson_id'])
      || getNestedString(fallbackPayload, ['room', 'custom_data', 'lesson_id']);
    if (directLessonId) return directLessonId;

    const userData = safeParseJson(getNestedString(fallbackPayload, ['user_data']));
    const lessonFromUserData = getNestedString(userData, ['lesson_id']);
    if (lessonFromUserData) return lessonFromUserData;

    const roomName = getNestedString(fallbackPayload, ['room_name'])
      || getNestedString(fallbackPayload, ['room', 'name']);
    if (!roomName) return null;

    const { data: liveConfig } = await supabaseAdmin
      .from('lesson_live_configs')
      .select('lesson_id, daily_room_url')
      .ilike('daily_room_url', `%/${roomName}`)
      .limit(1)
      .maybeSingle();
    return liveConfig?.lesson_id || null;
  };

  // Minimal stub: wire this to lesson matching and full attendance/session analytics.
  // We keep this intentionally lightweight for now so rollout can continue safely.
  if (eventName === 'participant.left') {
    const lessonId = await resolveLessonId(payloadData);
    const userId = getNestedString(payloadData, ['custom_data', 'user_id']);
    const sessionId = getNestedString(payloadData, ['session_id']);
    const joinedAt = getNestedString(payloadData, ['joined_at']);
    const leftAt = getNestedString(payloadData, ['left_at']);

    if (lessonId && userId && sessionId && joinedAt && leftAt) {
      await supabaseAdmin.from('live_attendance_events').insert({
        lesson_id: lessonId,
        user_id: userId,
        daily_session_id: sessionId,
        joined_at: joinedAt,
        left_at: leftAt,
      });
    }
  }

  if (eventName === 'recording.ready-to-download' || eventName === 'recording.finished') {
    const lessonId = await resolveLessonId(payloadData);
    const recordingUrl = getNestedString(payloadData, ['download_link'])
      || getNestedString(payloadData, ['recording', 'download_link'])
      || getNestedString(payloadData, ['recording', 'url']);

    if (lessonId && recordingUrl) {
      const { data: lesson } = await supabaseAdmin
        .from('lessons')
        .select('id, class_id, title, created_by_user_id')
        .eq('id', lessonId)
        .maybeSingle();

      if (lesson?.class_id && lesson?.created_by_user_id) {
        const { data: existing } = await supabaseAdmin
          .from('class_resources')
          .select('id')
          .eq('class_id', lesson.class_id)
          .eq('external_url', recordingUrl)
          .maybeSingle();

        if (!existing?.id) {
          await supabaseAdmin.from('class_resources').insert({
            class_id: lesson.class_id,
            title: `Recording: ${lesson.title}`,
            description: 'Auto-published from live session recording.',
            kind: 'video',
            note_body: '',
            external_url: recordingUrl,
            created_by_user_id: lesson.created_by_user_id,
          });
        }
      }
    }
  }

  return json(200, { ok: true });
});
