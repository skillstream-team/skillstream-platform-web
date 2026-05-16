import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const secret = req.headers.get('x-ops-secret');
  if (secret !== Deno.env.get('OPS_CRON_SECRET')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  );

  const now = new Date();
  const isMonday = now.getDay() === 1;
  const isFirstOfMonth = now.getDate() === 1;

  // Load orgs with scheduled reports enabled
  const { data: orgs, error: orgsErr } = await supabase
    .from('organizations')
    .select('id, name, report_schedule_enabled, report_schedule_frequency, report_schedule_email')
    .eq('report_schedule_enabled', true);

  if (orgsErr || !orgs) {
    return new Response(JSON.stringify({ error: orgsErr?.message ?? 'No orgs' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }

  const results: { orgId: string; sent: boolean; reason?: string }[] = [];

  for (const org of orgs) {
    const freq = org.report_schedule_frequency as 'weekly' | 'monthly';
    const shouldRun = (freq === 'weekly' && isMonday) || (freq === 'monthly' && isFirstOfMonth);

    if (!shouldRun) {
      results.push({ orgId: org.id, sent: false, reason: 'not scheduled today' });
      continue;
    }

    if (!org.report_schedule_email) {
      results.push({ orgId: org.id, sent: false, reason: 'no recipient email' });
      continue;
    }

    // Fetch stats
    const [membersRes, enrollmentsRes] = await Promise.all([
      supabase.from('org_members').select('user_id, org_role').eq('org_id', org.id),
      supabase.from('course_enrollments').select('id, completed_at, is_mandatory, deadline_at').eq('org_id', org.id),
    ]);

    const members = membersRes.data ?? [];
    const enrollments = enrollmentsRes.data ?? [];
    const learnerCount = members.filter((m) => m.org_role === 'learner').length;
    const completedCount = enrollments.filter((e) => e.completed_at).length;
    const totalCount = enrollments.length;
    const mandatoryTotal = enrollments.filter((e) => e.is_mandatory).length;
    const mandatoryDone = enrollments.filter((e) => e.is_mandatory && e.completed_at).length;
    const overdueCount = enrollments.filter((e) => !e.completed_at && e.deadline_at && new Date(e.deadline_at) < now).length;
    const avgCompletion = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    const complianceRate = mandatoryTotal > 0 ? Math.round((mandatoryDone / mandatoryTotal) * 100) : null;

    const reportBody = `
${org.name} — ${freq === 'weekly' ? 'Weekly' : 'Monthly'} Learning Report
Date: ${now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}

Summary:
• Learners: ${learnerCount}
• Enrolments: ${totalCount}
• Completed: ${completedCount} (${avgCompletion}% avg completion)
• Compliance: ${complianceRate !== null ? `${complianceRate}% (${mandatoryDone}/${mandatoryTotal} mandatory)` : 'No mandatory courses'}
• Overdue: ${overdueCount}

This report was generated automatically by SkillStream.
    `.trim();

    // In production, send via Resend/SendGrid. Log for now.
    console.log(`[send-report] org=${org.id} recipient=${org.report_schedule_email}\n${reportBody}`);

    results.push({ orgId: org.id, sent: true });
  }

  return new Response(JSON.stringify({ processed: results.length, results }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
