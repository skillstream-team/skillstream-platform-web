import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';

const html = (r: { learnerName: string; courseTitle: string; orgName: string; issuedAt: string }) => `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Inter', sans-serif; background: #fff; }
  .page { width: 900px; height: 640px; border: 3px solid #2563eb; border-radius: 24px; padding: 60px 80px; display: flex; flex-direction: column; justify-content: space-between; }
  .top { display: flex; justify-content: space-between; align-items: flex-start; }
  .brand { font-size: 22px; font-weight: 700; color: #2563eb; letter-spacing: -0.5px; }
  .badge { background: #eff6ff; color: #1d4ed8; font-size: 12px; font-weight: 600; padding: 4px 14px; border-radius: 20px; letter-spacing: 0.08em; text-transform: uppercase; }
  .body { text-align: center; }
  .label { font-size: 13px; font-weight: 600; color: #64748b; letter-spacing: 0.12em; text-transform: uppercase; margin-bottom: 16px; }
  .name { font-size: 42px; font-weight: 700; color: #0f172a; letter-spacing: -1px; margin-bottom: 24px; }
  .completed { font-size: 16px; color: #475569; margin-bottom: 10px; }
  .course { font-size: 28px; font-weight: 600; color: #1e3a8a; letter-spacing: -0.5px; }
  .bottom { display: flex; justify-content: space-between; align-items: flex-end; }
  .org { font-size: 14px; color: #64748b; }
  .org strong { display: block; font-size: 16px; font-weight: 600; color: #0f172a; }
  .date { font-size: 13px; color: #94a3b8; text-align: right; }
  .line { width: 80px; height: 2px; background: #2563eb; margin: 0 auto 24px; }
</style>
</head>
<body>
<div class="page">
  <div class="top">
    <span class="brand">SkillStream</span>
    <span class="badge">Certificate of Completion</span>
  </div>
  <div class="body">
    <p class="label">This certifies that</p>
    <p class="name">${r.learnerName}</p>
    <div class="line"></div>
    <p class="completed">has successfully completed</p>
    <p class="course">${r.courseTitle}</p>
  </div>
  <div class="bottom">
    <div class="org"><span>Issued by</span><strong>${r.orgName}</strong></div>
    <div class="date">Issued ${r.issuedAt}</div>
  </div>
</div>
</body>
</html>`;

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) return json(500, { error: 'Server misconfiguration.' });

  const supabase = createClient(supabaseUrl, serviceKey);

  let certId: string;
  try {
    ({ certId } = await req.json());
  } catch {
    return json(400, { error: 'Invalid JSON body. Expected { certId }.' });
  }

  // Load certificate + enrollment + learner + org + course
  const { data: cert, error: certErr } = await supabase
    .from('certificates')
    .select('id, enrollment_id, issued_at, certificate_url, course_enrollments(user_id, org_id, courses(title), organizations(name))')
    .eq('id', certId)
    .single();

  if (certErr || !cert) return json(404, { error: 'Certificate not found.' });
  if ((cert as { certificate_url: string | null }).certificate_url) {
    return json(200, { url: (cert as { certificate_url: string }).certificate_url });
  }

  const enrollment = (cert as { course_enrollments: { user_id: string; org_id: string; courses: { title: string }; organizations: { name: string } } }).course_enrollments;
  const courseTitle = enrollment?.courses?.title ?? 'Unknown Course';
  const orgName = enrollment?.organizations?.name ?? 'SkillStream';

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', enrollment.user_id)
    .single();

  const learnerName = (profile as { full_name: string } | null)?.full_name ?? 'Learner';
  const issuedAt = new Date((cert as { issued_at: string }).issued_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  const certHtml = html({ learnerName, courseTitle, orgName, issuedAt });
  const fileName = `${certId}.html`;
  const filePath = `certificates/${fileName}`;

  const { error: uploadErr } = await supabase.storage
    .from('certificates')
    .upload(filePath, new Blob([certHtml], { type: 'text/html' }), { upsert: true });

  if (uploadErr) return json(500, { error: `Upload failed: ${uploadErr.message}` });

  const { data: signed } = await supabase.storage
    .from('certificates')
    .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1-year URL

  const url = signed?.signedUrl ?? null;

  await supabase.from('certificates').update({ certificate_url: url }).eq('id', certId);

  return json(200, { url });
});
