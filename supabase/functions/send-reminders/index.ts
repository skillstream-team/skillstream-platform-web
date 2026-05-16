import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const secret = req.headers.get('x-cron-secret');
  if (secret !== Deno.env.get('OPS_CRON_SECRET')) return json(401, { error: 'Unauthorized' });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const now = new Date();

  // Fetch all orgs with reminders enabled
  const { data: orgs, error: orgsErr } = await supabase
    .from('organizations')
    .select('id, name, reminders_enabled, reminder_days_before')
    .eq('reminders_enabled', true);

  if (orgsErr) return json(500, { error: orgsErr.message });
  if (!orgs || orgs.length === 0) return json(200, { sent: 0, message: 'No orgs with reminders enabled.' });

  let totalSent = 0;

  for (const org of orgs) {
    const daysAhead = org.reminder_days_before ?? 3;
    const windowStart = new Date(now);
    windowStart.setDate(windowStart.getDate() + daysAhead);
    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowEnd.getDate() + 1);

    // Find enrollments with deadline in window, not yet completed, not already reminded
    const { data: enrollments, error: enrollErr } = await supabase
      .from('course_enrollments')
      .select('id, user_id, course_id, deadline_at, profiles(full_name, email), courses(title)')
      .eq('org_id', org.id)
      .is('completed_at', null)
      .gte('deadline_at', windowStart.toISOString())
      .lt('deadline_at', windowEnd.toISOString());

    if (enrollErr || !enrollments) continue;

    for (const enroll of enrollments) {
      const profile = enroll.profiles as { full_name: string; email: string } | null;
      const course = enroll.courses as { title: string } | null;
      if (!profile?.email || !course?.title) continue;

      // Log reminder — actual email sending requires an email provider (Resend, SendGrid, etc.)
      console.log(`[reminder] org=${org.name} user=${profile.email} course="${course.title}" deadline=${enroll.deadline_at}`);

      // In a production integration, call your email provider here:
      // await sendEmail({ to: profile.email, subject: `Reminder: "${course.title}" due soon`, ... });

      totalSent++;
    }
  }

  return json(200, { sent: totalSent, orgsChecked: orgs.length });
});
