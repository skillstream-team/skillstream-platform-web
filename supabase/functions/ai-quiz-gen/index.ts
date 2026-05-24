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
  lessonTitle: string;
  topic?: string;
  level?: string;
  questionCount?: number;
}

const SYSTEM_PROMPT = `You are an expert educator creating quiz questions.
Return ONLY a valid JSON array. Each element:
{ "type": "mcq" | "short", "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."] (mcq only), "answer": "..." }
Mix question types. Make questions educational and clear. Return NO other text — just the JSON array.`;

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
    return json(403, { error: 'Only teachers can use this feature' });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  if (!body.lessonTitle?.trim()) return json(400, { error: 'lessonTitle is required' });

  const tokenCheck = await checkTokenLimit(user.id, profile.role);
  if (!tokenCheck.allowed) {
    return json(429, {
      error: 'Monthly AI token limit reached',
      used: tokenCheck.used,
      limit: tokenCheck.limit,
    });
  }

  const count = body.questionCount || 5;
  const userMessage = `Create ${count} quiz questions about "${body.topic || body.lessonTitle}" for a lesson titled "${body.lessonTitle}"${body.level ? ` (${body.level} level)` : ''}.`;

  let result: Awaited<ReturnType<typeof callAnthropic>>;
  try {
    result = await callAnthropic({
      model: 'claude-haiku-4-5-20251001',
      system: SYSTEM_PROMPT,
      userMessage,
      maxTokens: 1200,
    });
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : 'AI call failed' });
  }

  await logUsage({
    userId: user.id,
    feature: 'ai-quiz-gen',
    model: 'claude-haiku-4-5-20251001',
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  });

  return json(200, { result: result.content });
});
