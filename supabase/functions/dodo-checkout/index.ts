import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';
import { corsHeaders } from '../_shared/cors.ts';

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const DODO_BASE = Deno.env.get('DODO_ENV') === 'live'
  ? 'https://live.dodopayments.com'
  : 'https://test.dodopayments.com';

// Plan code → Dodo product ID (configured in Dodo dashboard, stored as secrets)
const PLAN_PRODUCTS: Record<string, string> = {
  creator: Deno.env.get('DODO_PRODUCT_CREATOR') || '',
  studio: Deno.env.get('DODO_PRODUCT_STUDIO') || '',
  academy: Deno.env.get('DODO_PRODUCT_ACADEMY') || '',
};

interface CheckoutRequest {
  type: 'subscription' | 'lesson';
  // subscription
  planCode?: string;
  // lesson payment
  lessonId?: string;
  classId?: string;
  // common
  returnUrl: string;
  cancelUrl?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const dodoApiKey = Deno.env.get('DODO_API_KEY');

  if (!supabaseUrl || !supabaseServiceRoleKey || !dodoApiKey) {
    return json(500, { error: 'Missing server configuration' });
  }

  const jwt = req.headers.get('Authorization')?.replace('Bearer ', '').trim();
  if (!jwt) return json(401, { error: 'Missing bearer token' });

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt);
  if (authError || !user) return json(401, { error: 'Invalid user token' });

  let payload: CheckoutRequest;
  try {
    payload = (await req.json()) as CheckoutRequest;
  } catch {
    return json(400, { error: 'Invalid JSON body' });
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name, role, dodo_customer_id')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile) return json(403, { error: 'Profile not found' });

  const customerName = profile.full_name || user.email || 'User';
  const customerEmail = user.email || '';

  // Reuse existing Dodo customer ID if available
  const customer = profile.dodo_customer_id
    ? { customer_id: profile.dodo_customer_id }
    : { email: customerEmail, name: customerName };

  // ── SUBSCRIPTION CHECKOUT ──────────────────────────────────────────────────
  if (payload.type === 'subscription') {
    const planCode = payload.planCode || '';
    const productId = PLAN_PRODUCTS[planCode];
    if (!productId) {
      return json(400, { error: `No product configured for plan: ${planCode}` });
    }
    if (profile.role !== 'teacher') {
      return json(403, { error: 'Only teachers can subscribe to plans' });
    }

    const dodoResp = await fetch(`${DODO_BASE}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dodoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_cart: [{ product_id: productId, quantity: 1 }],
        customer,
        return_url: payload.returnUrl,
        cancel_url: payload.cancelUrl || payload.returnUrl,
        metadata: {
          type: 'subscription',
          plan_code: planCode,
          teacher_user_id: user.id,
        },
      }),
    });

    if (!dodoResp.ok) {
      const details = await dodoResp.text();
      return json(502, { error: 'Dodo checkout failed', details });
    }

    const dodoData = await dodoResp.json() as { checkout_url?: string; session_id?: string };
    if (!dodoData.checkout_url) {
      return json(502, { error: 'No checkout URL returned from Dodo' });
    }

    return json(200, { checkoutUrl: dodoData.checkout_url, sessionId: dodoData.session_id });
  }

  // ── LESSON PAYMENT CHECKOUT ───────────────────────────────────────────────
  if (payload.type === 'lesson') {
    if (!payload.lessonId || !payload.classId) {
      return json(400, { error: 'lessonId and classId are required for lesson payments' });
    }

    const lessonProductId = Deno.env.get('DODO_PRODUCT_LESSON') || '';
    if (!lessonProductId) {
      return json(500, { error: 'Lesson payment product not configured' });
    }

    // Verify student is enrolled
    const { data: lesson } = await supabaseAdmin
      .from('lessons')
      .select('id, class_id')
      .eq('id', payload.lessonId)
      .maybeSingle();
    if (!lesson) return json(404, { error: 'Lesson not found' });

    const { data: membership } = await supabaseAdmin
      .from('class_members')
      .select('member_role')
      .eq('class_id', lesson.class_id)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!membership) return json(403, { error: 'Not enrolled in this class' });

    // Get ticket price
    const { data: liveConfig } = await supabaseAdmin
      .from('lesson_live_configs')
      .select('ticket_price_gbp, session_mode')
      .eq('lesson_id', payload.lessonId)
      .maybeSingle();
    if (!liveConfig || liveConfig.session_mode !== 'paid') {
      return json(400, { error: 'This lesson does not require payment' });
    }

    const dodoResp = await fetch(`${DODO_BASE}/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dodoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_cart: [{ product_id: lessonProductId, quantity: 1 }],
        customer,
        return_url: payload.returnUrl,
        cancel_url: payload.cancelUrl || payload.returnUrl,
        metadata: {
          type: 'lesson_payment',
          lesson_id: payload.lessonId,
          class_id: payload.classId,
          student_user_id: user.id,
          amount_gbp: String(liveConfig.ticket_price_gbp),
        },
      }),
    });

    if (!dodoResp.ok) {
      const details = await dodoResp.text();
      return json(502, { error: 'Dodo checkout failed', details });
    }

    const dodoData = await dodoResp.json() as { checkout_url?: string; session_id?: string };
    if (!dodoData.checkout_url) {
      return json(502, { error: 'No checkout URL returned from Dodo' });
    }

    return json(200, { checkoutUrl: dodoData.checkout_url, sessionId: dodoData.session_id });
  }

  return json(400, { error: 'Unknown checkout type' });
});
