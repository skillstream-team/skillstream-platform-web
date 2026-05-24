import { corsHeaders } from '../_shared/cors.ts';
import {
  callAnthropic,
  checkTokenLimit,
  json,
  logUsage,
  serviceClient,
  verifyUser,
} from '../_shared/ai.ts';

interface RequestBody {
  assignmentTitle: string;
  assignmentDescription: string;
  submissionNote: string;
  fileUrl?: string;
}

const SYSTEM_PROMPT = `You are an educational assistant helping teachers review student work.
Analyse the submission against the assignment brief and give concise feedback highlights.
Format as markdown:

**Strengths**
(2-3 bullet points)

**Areas to Address**
(2-3 specific areas the teacher should focus their written feedback on)

**Suggested Questions to Ask the Student**
(1-2 prompting questions to deepen understanding)

Be constructive and specific. Do not assign grades. This supports the teacher's own judgement.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  let user: Awaited<ReturnType<typeof verifyUser>>;
  try {
    user = await verifyUser(req);
  } catch (err) {
    return json(401, { error: err instanceof Error ? err.message : 'Unauthorized' });
  }

  const admin = serviceClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return json(403, { error: 'Profile not found' });
  if (profile.role !== 'teacher' && profile.role !== 'admin') {
    return json(403, { error: 'Only teachers can use feedback assist' });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  if (!body.assignmentTitle?.trim()) return json(400, { error: 'assignmentTitle is required' });
  if (!body.assignmentDescription?.trim()) return json(400, { error: 'assignmentDescription is required' });

  const tokenCheck = await checkTokenLimit(user.id, profile.role);
  if (!tokenCheck.allowed) {
    return json(429, {
      error: 'Monthly AI token limit reached',
      used: tokenCheck.used,
      limit: tokenCheck.limit,
    });
  }

  const submissionText = body.submissionNote || 'No written submission — student may have submitted a file.';
  const userMessage = `Assignment: "${body.assignmentTitle}"\nBrief: "${body.assignmentDescription}"\nStudent submission: "${submissionText}"`;

  let result: Awaited<ReturnType<typeof callAnthropic>>;
  try {
    result = await callAnthropic({
      model: 'claude-haiku-4-5-20251001',
      system: SYSTEM_PROMPT,
      userMessage,
      maxTokens: 800,
    });
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : 'AI call failed' });
  }

  await logUsage({
    userId: user.id,
    feature: 'ai-assignment-feedback',
    model: 'claude-haiku-4-5-20251001',
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  });

  return json(200, { result: result.content });
});
