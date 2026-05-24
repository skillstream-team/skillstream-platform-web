import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from './cors.ts';

export type AiModel = 'claude-haiku-4-5-20251001' | 'claude-sonnet-4-6';

export interface AiResult {
  content: string;
  inputTokens: number;
  outputTokens: number;
}

// Call Anthropic Messages API (no streaming)
export async function callAnthropic(params: {
  model: AiModel;
  system: string;
  userMessage: string;
  maxTokens?: number;
}): Promise<AiResult> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: params.model,
      max_tokens: params.maxTokens ?? 1024,
      system: params.system,
      messages: [{ role: 'user', content: params.userMessage }],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Anthropic API error ${resp.status}: ${text}`);
  }

  const data = await resp.json() as {
    content: Array<{ type: string; text: string }>;
    usage: { input_tokens: number; output_tokens: number };
  };

  const content = data.content.find((block) => block.type === 'text')?.text ?? '';
  return {
    content,
    inputTokens: data.usage.input_tokens,
    outputTokens: data.usage.output_tokens,
  };
}

// Create a service-role Supabase client
export function serviceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Supabase server configuration missing');
  return createClient(url, key);
}

// Verify JWT from Authorization header, return user (throw on failure)
export async function verifyUser(req: Request) {
  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
  if (!jwt) throw new Error('Missing bearer token');

  const admin = serviceClient();
  const { data: { user }, error } = await admin.auth.getUser(jwt);
  if (error || !user) throw new Error('Invalid user token');
  return user;
}

// Check if user has remaining tokens this month (teachers only — students always pass)
export async function checkTokenLimit(
  userId: string,
  role: string,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  // Students have no token limits
  if (role === 'student') return { allowed: true, used: 0, limit: 0 };

  const admin = serviceClient();

  // Sum tokens used this calendar month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: usageRows } = await admin
    .from('ai_usage_logs')
    .select('input_tokens, output_tokens')
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString());

  const used = (usageRows ?? []).reduce(
    (acc, row) => acc + (row.input_tokens ?? 0) + (row.output_tokens ?? 0),
    0,
  );

  // Fetch subscription plan limit
  const { data: sub } = await admin
    .from('teacher_subscriptions')
    .select('billing_plans(ai_monthly_token_limit)')
    .eq('teacher_user_id', userId)
    .eq('status', 'active')
    .maybeSingle();

  const planData = sub?.billing_plans as { ai_monthly_token_limit?: number } | null;
  const limit = planData?.ai_monthly_token_limit ?? 0;

  // If no subscription found or limit is 0, allow (graceful for demo mode)
  if (!sub || limit === 0) return { allowed: true, used, limit };

  return { allowed: used < limit, used, limit };
}

// Insert a row into ai_usage_logs
export async function logUsage(params: {
  userId: string;
  feature: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}): Promise<void> {
  try {
    const admin = serviceClient();
    await admin.from('ai_usage_logs').insert({
      user_id: params.userId,
      feature: params.feature,
      model: params.model,
      input_tokens: params.inputTokens,
      output_tokens: params.outputTokens,
    });
  } catch {
    // Non-fatal: log failure should not break the feature
  }
}

// Standard JSON response helper (matches the agora-token pattern)
export function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
