import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';

const DAILY_API_KEY = Deno.env.get('DAILY_API_KEY') ?? '';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  if (!DAILY_API_KEY) return json(500, { error: 'DAILY_API_KEY not configured.' });

  try {
    const body = await req.json() as { lessonId?: string; roomUrl?: string };
    const { lessonId, roomUrl } = body;

    if (!lessonId || !roomUrl) {
      return json(400, { error: 'lessonId and roomUrl are required.' });
    }

    let roomName: string;
    try {
      roomName = new URL(roomUrl).pathname.replace(/^\//, '');
    } catch {
      return json(400, { error: 'Invalid roomUrl.' });
    }

    // Fetch recordings from Daily.co
    const dailyRes = await fetch(
      `https://api.daily.co/v1/recordings?room_name=${encodeURIComponent(roomName)}&limit=10`,
      { headers: { Authorization: `Bearer ${DAILY_API_KEY}` } },
    );

    if (!dailyRes.ok) {
      return json(502, { error: 'Failed to reach Daily.co API.' });
    }

    const dailyData = await dailyRes.json() as {
      data?: Array<{ id: string; download_link?: string; status: string; created_at?: number }>;
    };

    const finished = (dailyData.data ?? [])
      .filter((r) => r.status === 'finished' && r.download_link)
      .sort((a, b) => (b.created_at ?? 0) - (a.created_at ?? 0));

    if (finished.length === 0) {
      return json(200, {
        recordingUrl: null,
        message: 'Recording is still processing. Try again in a minute.',
      });
    }

    const recordingUrl = finished[0].download_link!;

    // Persist recording URL to the lesson row
    if (SUPABASE_SERVICE_ROLE_KEY) {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      await sb.from('lessons').update({ recording_url: recordingUrl }).eq('id', lessonId);
    }

    return json(200, { recordingUrl });
  } catch (err) {
    return json(500, { error: String(err) });
  }
});
