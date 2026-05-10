import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';
import { startOfDayIso } from './helpers.js';

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
  const opsSecret = Deno.env.get('OPS_CRON_SECRET');
  if (!supabaseUrl || !serviceKey || !opsSecret) {
    return json(500, { error: 'Missing server configuration' });
  }

  const providedSecret = req.headers.get('x-skillstream-cron-secret') || '';
  if (!providedSecret || providedSecret !== opsSecret) {
    return json(401, { error: 'Unauthorized' });
  }

  const admin = createClient(supabaseUrl, serviceKey);
  const startedAt = new Date().toISOString();

  const { data: startRun, error: runStartError } = await admin
    .from('background_job_runs')
    .insert({
      job_name: 'ops-cron',
      status: 'started',
      details: { started_at: startedAt },
    })
    .select('id')
    .single();

  if (runStartError || !startRun) {
    return json(500, { error: 'Could not create job run', details: runStartError?.message });
  }

  try {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);

    const daysToRollup = [startOfDayIso(yesterday), startOfDayIso(new Date())];
    for (const day of daysToRollup) {
      const { error } = await admin.rpc('rollup_analytics_day', { p_day: day });
      if (error) throw error;
    }

    const cleanupBefore = new Date();
    cleanupBefore.setUTCDate(cleanupBefore.getUTCDate() - 3);
    const { error: cleanupError } = await admin
      .from('request_rate_limits')
      .delete()
      .lt('window_started_at', cleanupBefore.toISOString());
    if (cleanupError) throw cleanupError;

    const { data: revokedInvites, error: revokeInvitesError } = await admin
      .from('teacher_invites')
      .update({ status: 'revoked' })
      .eq('status', 'pending')
      .not('expires_at', 'is', null)
      .lt('expires_at', new Date().toISOString())
      .select('id');
    if (revokeInvitesError) throw revokeInvitesError;

    const { error: runUpdateError } = await admin
      .from('background_job_runs')
      .update({
        status: 'success',
        details: {
          started_at: startedAt,
          completed_at: new Date().toISOString(),
          analytics_days_rolled_up: daysToRollup,
          request_rate_limits_pruned_before: cleanupBefore.toISOString(),
          revoked_expired_teacher_invites: (revokedInvites || []).length,
        },
      })
      .eq('id', startRun.id);

    if (runUpdateError) throw runUpdateError;
    return json(200, { ok: true, runId: startRun.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await admin
      .from('background_job_runs')
      .update({
        status: 'failed',
        details: {
          started_at: startedAt,
          failed_at: new Date().toISOString(),
          error: message,
        },
      })
      .eq('id', startRun.id);

    return json(500, { error: 'Ops cron failed', details: message, runId: startRun.id });
  }
});
