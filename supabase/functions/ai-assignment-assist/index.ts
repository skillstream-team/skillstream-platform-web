import { corsHeaders } from '../_shared/cors.ts';
import {
  callAnthropic,
  json,
  logUsage,
  serviceClient,
  verifyUser,
} from '../_shared/ai.ts';

interface RequestBody {
  assignmentTitle: string;
  assignmentDescription: string;
  studentQuestion: string;
}

const SYSTEM_PROMPT = `You are a helpful teaching assistant for students.
Your role is to GUIDE students, not write their work for them.
- Explain relevant concepts or approaches
- Ask questions that help them think it through
- Point out what to consider or look up
- NEVER write the answer or complete the assignment for them
Keep responses concise, encouraging, and educational.`;

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

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  if (!body.assignmentTitle?.trim()) return json(400, { error: 'assignmentTitle is required' });
  if (!body.assignmentDescription?.trim()) return json(400, { error: 'assignmentDescription is required' });
  if (!body.studentQuestion?.trim()) return json(400, { error: 'studentQuestion is required' });

  // No token limit check for students — they don't have subscriptions
  const userMessage = `Assignment: "${body.assignmentTitle}"\nBrief: "${body.assignmentDescription}"\nStudent question: "${body.studentQuestion}"`;

  let result: Awaited<ReturnType<typeof callAnthropic>>;
  try {
    result = await callAnthropic({
      model: 'claude-haiku-4-5-20251001',
      system: SYSTEM_PROMPT,
      userMessage,
      maxTokens: 600,
    });
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : 'AI call failed' });
  }

  await logUsage({
    userId: user.id,
    feature: 'ai-assignment-assist',
    model: 'claude-haiku-4-5-20251001',
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  });

  return json(200, { result: result.content });
});
