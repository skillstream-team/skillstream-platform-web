import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.2';

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// Standard Webhooks HMAC-SHA256 verification
// Message = webhook-id + "." + webhook-timestamp + "." + rawBody
async function verifySignature(
  rawBody: string,
  webhookId: string,
  timestamp: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  try {
    const enc = new TextEncoder();
    const message = `${webhookId}.${timestamp}.${rawBody}`;
    const keyBytes = enc.encode(secret);
    const key = await crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    // signatureHeader may contain multiple sigs separated by spaces, each prefixed "v1,"
    const sigs = signatureHeader.split(' ');
    for (const sig of sigs) {
      const b64 = sig.replace(/^v1,/, '');
      try {
        const sigBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
        const valid = await crypto.subtle.verify('HMAC', key, sigBytes, enc.encode(message));
        if (valid) return true;
      } catch { /* try next sig */ }
    }
    return false;
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json(405, { error: 'Method not allowed' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const webhookSecret = Deno.env.get('DODO_WEBHOOK_SECRET');

  if (!supabaseUrl || !supabaseServiceRoleKey || !webhookSecret) {
    return json(500, { error: 'Missing server configuration' });
  }

  const rawBody = await req.text();
  const webhookId = req.headers.get('webhook-id') || '';
  const webhookTimestamp = req.headers.get('webhook-timestamp') || '';
  const webhookSignature = req.headers.get('webhook-signature') || '';

  const valid = await verifySignature(rawBody, webhookId, webhookTimestamp, webhookSignature, webhookSecret);
  if (!valid) return json(401, { error: 'Invalid webhook signature' });

  let event: { type: string; data: Record<string, unknown> };
  try {
    event = JSON.parse(rawBody) as typeof event;
  } catch {
    return json(400, { error: 'Invalid JSON' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  const { type, data } = event;
  const metadata = (data.metadata || {}) as Record<string, string>;

  // ── payment.succeeded ─────────────────────────────────────────────────────
  if (type === 'payment.succeeded' && metadata.type === 'lesson_payment') {
    const lessonId = metadata.lesson_id;
    const studentUserId = metadata.student_user_id;
    const dodoPaymentId = String(data.payment_id || '');

    if (!lessonId || !studentUserId) return json(400, { error: 'Missing metadata' });

    // Upsert lesson_live_purchases to paid
    const { data: existing } = await supabaseAdmin
      .from('lesson_live_purchases')
      .select('id')
      .eq('lesson_id', lessonId)
      .eq('student_user_id', studentUserId)
      .maybeSingle();

    if (existing) {
      await supabaseAdmin
        .from('lesson_live_purchases')
        .update({ status: 'paid', dodo_payment_id: dodoPaymentId, purchased_at: new Date().toISOString() })
        .eq('id', existing.id);
    } else {
      // Get lesson amount from live config
      const { data: config } = await supabaseAdmin
        .from('lesson_live_configs')
        .select('ticket_price_gbp')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      await supabaseAdmin.from('lesson_live_purchases').insert({
        lesson_id: lessonId,
        student_user_id: studentUserId,
        amount_gbp: config?.ticket_price_gbp || 0,
        status: 'paid',
        provider: 'dodopayments',
        provider_reference: dodoPaymentId,
        dodo_payment_id: dodoPaymentId,
        purchased_at: new Date().toISOString(),
      });
    }

    // Save Dodo customer ID on profile for future reuse
    if (data.customer) {
      const customerData = data.customer as Record<string, string>;
      if (customerData.customer_id) {
        await supabaseAdmin
          .from('profiles')
          .update({ dodo_customer_id: customerData.customer_id })
          .eq('id', studentUserId);
      }
    }

    return json(200, { received: true });
  }

  // ── subscription.created / subscription.active ────────────────────────────
  if ((type === 'subscription.created' || type === 'subscription.active') && metadata.type === 'subscription') {
    const teacherUserId = metadata.teacher_user_id;
    const planCode = metadata.plan_code;
    const dodoSubscriptionId = String(data.subscription_id || '');

    if (!teacherUserId || !planCode) return json(400, { error: 'Missing metadata' });

    // Look up billing plan
    const { data: plan } = await supabaseAdmin
      .from('billing_plans')
      .select('id')
      .eq('code', planCode)
      .maybeSingle();

    if (plan) {
      await supabaseAdmin
        .from('teacher_subscriptions')
        .upsert({
          teacher_user_id: teacherUserId,
          billing_plan_id: plan.id,
          status: 'active',
          dodo_subscription_id: dodoSubscriptionId,
          period_start: new Date().toISOString(),
          period_end: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
        }, { onConflict: 'teacher_user_id' });
    }

    // Save customer ID on profile
    if (data.customer) {
      const customerData = data.customer as Record<string, string>;
      if (customerData.customer_id) {
        await supabaseAdmin
          .from('profiles')
          .update({ dodo_customer_id: customerData.customer_id })
          .eq('id', teacherUserId);
      }
    }

    return json(200, { received: true });
  }

  // ── subscription.cancelled ─────────────────────────────────────────────────
  if (type === 'subscription.cancelled' && metadata.type === 'subscription') {
    const teacherUserId = metadata.teacher_user_id;
    if (!teacherUserId) return json(400, { error: 'Missing metadata' });

    await supabaseAdmin
      .from('teacher_subscriptions')
      .update({ status: 'cancelled' })
      .eq('teacher_user_id', teacherUserId);

    return json(200, { received: true });
  }

  // ── subscription.renewed ───────────────────────────────────────────────────
  if (type === 'subscription.renewed' && metadata.type === 'subscription') {
    const teacherUserId = metadata.teacher_user_id;
    if (!teacherUserId) return json(400, { error: 'Missing metadata' });

    await supabaseAdmin
      .from('teacher_subscriptions')
      .update({
        status: 'active',
        period_start: new Date().toISOString(),
        period_end: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('teacher_user_id', teacherUserId);

    return json(200, { received: true });
  }

  // Unknown event — acknowledge receipt so Dodo doesn't retry
  return json(200, { received: true, ignored: true });
});
