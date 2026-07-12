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
  lessonId: string;
}

const SYSTEM_PROMPT = `You are an educational assistant creating session summaries for students.
Create a helpful session recap in markdown that students can use for revision.

## What We Covered
(3-5 bullet points of key topics)

## Key Concepts
(Definitions or brief explanations of important terms)

## Key Takeaways
(2-3 most important things to remember)

## Revision Questions
(3-4 questions students can use to test themselves — no answers provided)`;

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
    return json(403, { error: 'Only teachers can generate session recaps' });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  if (!body.lessonId?.trim()) return json(400, { error: 'lessonId is required' });

  // Fetch lesson data
  const { data: lesson, error: lessonError } = await admin
    .from('lessons')
    .select('id, class_id, title, duration_minutes, ai_recap')
    .eq('id', body.lessonId)
    .maybeSingle();

  if (lessonError || !lesson) return json(404, { error: 'Lesson not found' });

  // Verify the requesting teacher actually teaches this lesson's class
  if (profile.role === 'teacher') {
    const { data: membership } = await admin
      .from('class_members')
      .select('member_role')
      .eq('class_id', (lesson as { class_id: string }).class_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (membership?.member_role !== 'teacher') {
      return json(403, { error: 'You do not teach this lesson' });
    }
  }

  // Return cached recap if it already exists
  if (lesson.ai_recap) {
    return json(200, { result: lesson.ai_recap, cached: true });
  }

  // Fetch teacher's session notes
  const { data: liveConfig } = await admin
    .from('lesson_live_configs')
    .select('notes')
    .eq('lesson_id', body.lessonId)
    .maybeSingle();

  const notes = liveConfig?.notes || '';

  const tokenCheck = await checkTokenLimit(user.id, profile.role);
  if (!tokenCheck.allowed) {
    return json(429, {
      error: 'Monthly AI token limit reached',
      used: tokenCheck.used,
      limit: tokenCheck.limit,
    });
  }

  const userMessage = `Generate a session recap for a ${lesson.duration_minutes}-minute lesson titled "${lesson.title}". ${notes ? `Teacher's session notes: "${notes}"` : 'No additional notes.'}`;

  let result: Awaited<ReturnType<typeof callAnthropic>>;
  try {
    result = await callAnthropic({
      model: 'claude-sonnet-4-6',
      system: SYSTEM_PROMPT,
      userMessage,
      maxTokens: 1200,
    });
  } catch (err) {
    return json(500, { error: err instanceof Error ? err.message : 'AI call failed' });
  }

  // Store the recap on the lesson
  await admin
    .from('lessons')
    .update({ ai_recap: result.content })
    .eq('id', body.lessonId);

  await logUsage({
    userId: user.id,
    feature: 'ai-session-recap',
    model: 'claude-sonnet-4-6',
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
  });

  return json(200, { result: result.content });
});
