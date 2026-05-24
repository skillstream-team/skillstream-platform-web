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
  topic: string;
  durationMinutes: number;
  level?: string;
  additionalNotes?: string;
}

const SYSTEM_PROMPT = `You are an expert educator helping teachers prepare structured lesson plans.
Generate a clear, practical lesson plan in markdown format with these sections:
## Learning Objectives
(3-4 bullet points of what students will achieve)

## Materials Needed
(brief list)

## Lesson Structure
(Time-allocated breakdown: Introduction, Main Teaching, Practice/Activity, Wrap-up)

## Key Discussion Questions
(3-4 questions to check understanding)

## Homework / Follow-up (optional)

Keep it concise, actionable, and appropriate for the specified level.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  let user: Awaited<ReturnType<typeof verifyUser>>;
  try {
    user = await verifyUser(req);
  } catch (err) {
    return json(401, { error: err instanceof Error ? err.message : 'Unauthorized' });
  }

  // Get user profile to check role
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

  if (!body.topic?.trim()) return json(400, { error: 'topic is required' });
  if (!body.durationMinutes || body.durationMinutes <= 0) {
    return json(400, { error: 'durationMinutes is required and must be positive' });
  }

  // Check token limit
  const tokenCheck = await checkTokenLimit(user.id, profile.role);
  if (!tokenCheck.allowed) {
    return json(429, {
      error: 'Monthly AI token limit reached',
      used: tokenCheck.used,
      limit: tokenCheck.limit,
    });
  }

  const userMessage = `Create a lesson plan for: "${body.topic}". Duration: ${body.durationMinutes} minutes.${body.level ? ` Student level: ${body.level}.` : ''}${body.additionalNotes ? ` Teacher notes: ${body.additionalNotes}` : ''}`;

  let result: Awaited<ReturnType<typeof callAnthropic>>;
  try {
    result = await callAnthropic({
      model: 'claude-sonnet-4-6',
      system: SYSTEM_PROMPT,
      userMessage,
      maxTokens: 1500,
    });
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : 'AI call failed' });
  }

  await logUsage({
    userId: user.id,
    feature: 'ai-lesson-plan',
    model: 'claude-sonnet-4-6',
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  });

  return json(200, { result: result.content });
});
