import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Check, Copy, Loader2, Tag, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { PaymentTable } from '../components/hub/PaymentTable';
import { useNotifications } from '../components/notifications/NotificationToast';
import { cn } from '../lib/utils';
import { hasSupabaseConfig, supabase } from '../lib/supabase';
import { useAuthStore } from '../store/auth';
import { useTeacherHubStore } from '../store/teacherHub';
import { useCurrencyFormatter } from '../lib/currency';

type PlanId = 'creator' | 'studio' | 'academy';

interface PlanTier {
  id: PlanId;
  name: string;
  tagline: string;
  monthlyFee: number;
  maxStudents: number | null;
  maxLiveParticipants: number;
  includedParticipantMinutes: number;
  overagePerMinute: number;
  transactionFeePercent: number;
  aiTokens: string;
  popular?: boolean;
}

const PLAN_TIERS: PlanTier[] = [
  {
    id: 'creator',
    name: 'Creator',
    tagline: 'Solo tutors, music teachers & local coaches.',
    monthlyFee: 29,
    maxStudents: 15,
    maxLiveParticipants: 5,
    includedParticipantMinutes: 5_000,
    overagePerMinute: 0.002,
    transactionFeePercent: 10,
    aiTokens: '100k',
  },
  {
    id: 'studio',
    name: 'Studio',
    tagline: 'Growing academies and full-time independent educators.',
    monthlyFee: 99,
    maxStudents: 100,
    maxLiveParticipants: 50,
    includedParticipantMinutes: 40_000,
    overagePerMinute: 0.002,
    transactionFeePercent: 6,
    aiTokens: '600k',
    popular: true,
  },
  {
    id: 'academy',
    name: 'Academy',
    tagline: 'Training organisations, corporate L&D, multi-teacher operations.',
    monthlyFee: 249,
    maxStudents: null,
    maxLiveParticipants: 200,
    includedParticipantMinutes: 150_000,
    overagePerMinute: 0.002,
    transactionFeePercent: 5,
    aiTokens: '2.5M',
  },
];

const formatMinutes = (value: number) => new Intl.NumberFormat('en-US').format(value);

interface SubState {
  planCode: PlanId;
  planName: string;
  status: string;
  periodEnd: string;
}

export const PaymentsPage: React.FC = () => {
  const { format: formatMoney, formatPrecise: formatMoneyPrecise } = useCurrencyFormatter();
  const user = useAuthStore((state) => state.user);
  const isStudent = user?.role === 'STUDENT';
  const isTeacher = user?.role === 'TEACHER';
  const isDemoUser = Boolean(user?.id.startsWith('demo-') || user?.email.endsWith('@skillstream.demo'));
  const { addNotification } = useNotifications();
  const [searchParams] = useSearchParams();
  const planActivated = searchParams.get('plan_activated') === '1';

  const allPayments = useTeacherHubStore((state) => state.payments);
  const classes = useTeacherHubStore((state) => state.classes);
  const students = useTeacherHubStore((state) => state.students);
  const currentStudent = students.find((s) => s.email.toLowerCase() === (user?.email || '').toLowerCase());
  const payments = isStudent
    ? currentStudent ? allPayments.filter((p) => p.studentId === currentStudent.id) : []
    : allPayments;

  const [sub, setSub] = useState<SubState | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState<PlanId | null>(null);

  // Demo plan fallback
  const [demoPlan, setDemoPlan] = useState<PlanId>('studio');

  // Promo code
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState<{ code: string; discountPercent: number; appliesTo: string } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  // Affiliate code for teacher
  const [affiliateCode, setAffiliateCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isTeacher || !user || !hasSupabaseConfig || isDemoUser) { setSubLoading(false); return; }
    supabase
      .from('teacher_subscriptions')
      .select('status, period_end, billing_plans(code, name)')
      .eq('teacher_user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          const plan = (Array.isArray(data.billing_plans) ? data.billing_plans[0] : data.billing_plans) as { code: string; name: string } | null;
          setSub({
            planCode: (plan?.code || 'studio') as PlanId,
            planName: plan?.name || 'Studio',
            status: data.status,
            periodEnd: data.period_end,
          });
        }
        setSubLoading(false);
      });
  }, [user?.id, user, isTeacher, isDemoUser]);

  useEffect(() => {
    if (!isTeacher || !user) return;
    if (isDemoUser) { setAffiliateCode('DEMO-TEACHER'); return; }
    if (!hasSupabaseConfig) return;
    supabase
      .from('affiliate_codes')
      .select('code')
      .eq('teacher_user_id', user.id)
      .maybeSingle()
      .then(({ data }) => { if (data?.code) setAffiliateCode(data.code as string); });
  }, [user?.id, user, isTeacher, isDemoUser]);

  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();
  const monthlyParticipantMinutes = classes
    .flatMap((c) => c.lessons)
    .filter((l) => {
      const d = new Date(l.scheduledAt);
      return d.getMonth() === month && d.getFullYear() === year;
    })
    .reduce((sum, l) => sum + l.studentCount * l.durationMinutes, 0);

  const activePlanId: PlanId = sub?.planCode || (isDemoUser ? demoPlan : 'studio');
  const activePlan = PLAN_TIERS.find((p) => p.id === activePlanId) || PLAN_TIERS[1];
  const includedMinutes = activePlan.includedParticipantMinutes;
  const overageMinutes = Math.max(monthlyParticipantMinutes - includedMinutes, 0);
  const overageAmount = overageMinutes * activePlan.overagePerMinute;
  const projectedMonthlyTotal = activePlan.monthlyFee + overageAmount;
  const usagePercentage = Math.min((monthlyParticipantMinutes / includedMinutes) * 100, 100);

  const handleCheckout = async (planCode: PlanId) => {
    if (isDemoUser) {
      setDemoPlan(planCode);
      addNotification({ type: 'success', title: 'Demo: plan switched', message: `Switched to ${PLAN_TIERS.find((p) => p.id === planCode)?.name} (demo only).`, duration: 2200 });
      return;
    }
    if (!hasSupabaseConfig) {
      addNotification({ type: 'info', title: 'Not configured', message: 'Supabase connection required for billing.', duration: 3000 });
      return;
    }
    setCheckingOut(planCode);
    try {
      const returnUrl = `${window.location.origin}/payments?plan_activated=1`;
      const { data, error } = await supabase.functions.invoke('dodo-checkout', {
        body: { type: 'subscription', planCode, returnUrl, cancelUrl: `${window.location.origin}/payments` },
      });
      if (error || !data?.checkoutUrl) throw error || new Error('No checkout URL returned');
      window.location.href = data.checkoutUrl as string;
    } catch {
      setCheckingOut(null);
      addNotification({ type: 'error', title: 'Checkout failed', message: 'Could not start checkout. Please try again.', duration: 3500 });
    }
  };

  const handleApplyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) { setPromoError('Enter a promo code first.'); return; }
    setPromoError('');
    if (isDemoUser) {
      setPromoApplied({ code, discountPercent: 15, appliesTo: 'all' });
      addNotification({ type: 'success', title: 'Promo applied', message: `${code} gives 15% off (demo).`, duration: 2200 });
      return;
    }
    if (!hasSupabaseConfig) return;
    setPromoLoading(true);
    try {
      const { data, error } = await supabase
        .from('promo_codes')
        .select('code, discount_percent, applies_to, is_active, valid_until, max_uses, used_count')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();
      if (error || !data) { setPromoError('Invalid or expired promo code.'); return; }
      if (data.valid_until && new Date(data.valid_until) < new Date()) { setPromoError('This promo code has expired.'); return; }
      if (data.max_uses != null && data.used_count >= data.max_uses) { setPromoError('This promo code has reached its usage limit.'); return; }
      setPromoApplied({ code: data.code as string, discountPercent: Number(data.discount_percent), appliesTo: data.applies_to as string });
      addNotification({ type: 'success', title: 'Promo applied', message: `${data.code} gives ${data.discount_percent}% off.`, duration: 2200 });
    } finally {
      setPromoLoading(false);
    }
  };

  const discountedFee = (plan: typeof PLAN_TIERS[0]) => {
    if (!promoApplied) return plan.monthlyFee;
    if (promoApplied.appliesTo !== 'all' && promoApplied.appliesTo !== plan.id) return plan.monthlyFee;
    return plan.monthlyFee * (1 - promoApplied.discountPercent / 100);
  };

  const isActivePlan = (planId: PlanId) => sub?.planCode === planId && sub?.status === 'active';
  const periodEndFormatted = sub?.periodEnd
    ? new Intl.DateTimeFormat('en-GB', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(sub.periodEnd))
    : null;

  return (
    <div className="space-y-6">
      {!isStudent ? (
        <>
          {/* Success banner */}
          {planActivated ? (
            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
              Payment confirmed — your subscription is now active.
            </div>
          ) : null}

          {/* Current plan + usage */}
          <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Current plan</p>
                {subLoading ? (
                  <div className="mt-2 flex items-center gap-2 text-[color:var(--hub-muted)]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading…</span>
                  </div>
                ) : (
                  <>
                    <h3 className="mt-2 text-2xl font-semibold text-[color:var(--hub-text)]">{activePlan.name}</h3>
                    <p className="mt-1 text-sm text-[color:var(--hub-muted)]">
                      {sub
                        ? sub.status === 'active'
                          ? `Active${periodEndFormatted ? ` · renews ${periodEndFormatted}` : ''}`
                          : `Status: ${sub.status}`
                        : isDemoUser
                        ? 'Demo mode — billing not active'
                        : 'No active subscription'}
                    </p>
                  </>
                )}
              </div>
              <div className="rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--hub-muted)]">Projected bill</p>
                <p className="mt-1 text-2xl font-semibold text-[color:var(--hub-text)]">{formatMoney(projectedMonthlyTotal)}</p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-[color:var(--hub-border)] p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-[color:var(--hub-text)]">Live minute usage this month</span>
                <span className="text-[color:var(--hub-muted)]">{formatMinutes(monthlyParticipantMinutes)} / {formatMinutes(includedMinutes)}</span>
              </div>
              <div className="h-2.5 rounded-full bg-[color:var(--hub-soft)]">
                <div className="h-2.5 rounded-full bg-[color:var(--hub-primary)] transition-all" style={{ width: `${usagePercentage}%` }} />
              </div>
              <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                {[
                  { label: 'Base fee', value: formatMoney(activePlan.monthlyFee) },
                  { label: 'Student cap', value: activePlan.maxStudents !== null ? String(activePlan.maxStudents) : 'Unlimited' },
                  { label: 'Max per session', value: String(activePlan.maxLiveParticipants) },
                  { label: 'Included minutes', value: formatMinutes(includedMinutes) },
                  { label: 'Overage minutes', value: formatMinutes(overageMinutes) },
                  { label: 'Overage charge', value: formatMoney(overageAmount) },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl bg-[color:var(--hub-soft)] p-3">
                    <p className="text-[color:var(--hub-muted)]">{item.label}</p>
                    <p className="mt-1 font-semibold text-[color:var(--hub-text)]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Promo code input */}
          {!sub || sub.status !== 'active' ? (
            <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)]">
              <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
                <Tag className="h-4 w-4" />
                <p className="text-sm font-semibold uppercase tracking-[0.18em]">Have a promo code?</p>
              </div>
              {promoApplied ? (
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700">
                    <Check className="h-4 w-4" />
                    <span className="font-mono">{promoApplied.code}</span>
                    <span>— {promoApplied.discountPercent}% off applied</span>
                  </div>
                  <button type="button" onClick={() => { setPromoApplied(null); setPromoInput(''); }} className="text-sm text-[color:var(--hub-muted)] underline">Remove</button>
                </div>
              ) : (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-start">
                  <div className="flex-1">
                    <div className="flex gap-2">
                      <input
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); if (promoError) setPromoError(''); }}
                        placeholder="Enter promo code"
                        className="flex-1 rounded-2xl border border-[color:var(--hub-border)] px-4 py-2.5 font-mono text-sm uppercase outline-none"
                        onKeyDown={(e) => { if (e.key === 'Enter') void handleApplyPromo(); }}
                      />
                      <button
                        type="button"
                        onClick={() => void handleApplyPromo()}
                        disabled={promoLoading}
                        className="rounded-2xl bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {promoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                      </button>
                    </div>
                    {promoError ? <p className="mt-1.5 text-xs text-red-600">{promoError}</p> : null}
                  </div>
                </div>
              )}
            </section>
          ) : null}

          {/* Plan tier cards */}
          <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
            <div className="flex items-center gap-2 text-[color:var(--hub-primary)]">
              <Users className="h-5 w-5" />
              <p className="text-sm font-semibold uppercase tracking-[0.18em]">Plans</p>
            </div>
            <div className="mt-5 grid gap-4 lg:grid-cols-3">
              {PLAN_TIERS.map((plan) => {
                const active = isActivePlan(plan.id) || (isDemoUser && demoPlan === plan.id);
                const isLoading = checkingOut === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={cn('relative rounded-3xl border p-5 transition', active ? 'border-[color:var(--hub-primary)] bg-[color:var(--hub-soft)]' : 'border-[color:var(--hub-border)]')}
                  >
                    {plan.popular ? (
                      <span className="absolute right-4 top-4 rounded-full bg-[color:var(--hub-primary)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        Popular
                      </span>
                    ) : null}

                    <div className="flex items-center justify-between gap-3 pr-16">
                      <p className="text-lg font-semibold text-[color:var(--hub-text)]">{plan.name}</p>
                      {active ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--hub-primary)] px-2.5 py-1 text-xs font-semibold text-white">
                          <Check className="h-3.5 w-3.5" />
                          Active
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 text-xs text-[color:var(--hub-muted)]">{plan.tagline}</p>

                    <div className="mt-3 flex flex-wrap items-baseline gap-2">
                      <p className="text-2xl font-semibold text-[color:var(--hub-text)]">
                        {formatMoney(discountedFee(plan))}
                        <span className="text-sm font-medium text-[color:var(--hub-muted)]"> /month</span>
                      </p>
                      {promoApplied && discountedFee(plan) < plan.monthlyFee ? (
                        <span className="text-sm text-[color:var(--hub-muted)] line-through">{formatMoney(plan.monthlyFee)}</span>
                      ) : null}
                    </div>

                    <ul className="mt-3 space-y-1.5 text-sm text-[color:var(--hub-muted)]">
                      <li>{plan.maxStudents !== null ? `Up to ${plan.maxStudents} active students` : 'Unlimited students'}</li>
                      <li>Up to {plan.maxLiveParticipants} per live session</li>
                      <li>{formatMinutes(plan.includedParticipantMinutes)} live minutes/month</li>
                      <li>{formatMoneyPrecise(plan.overagePerMinute)} per extra minute</li>
                      <li>{plan.transactionFeePercent}% platform fee on paid lessons</li>
                      <li>{plan.aiTokens} AI tokens / month</li>
                    </ul>

                    {!active ? (
                      <button
                        type="button"
                        disabled={isLoading || Boolean(checkingOut)}
                        onClick={() => void handleCheckout(plan.id)}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[color:var(--hub-primary)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        {isLoading ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting…</>
                        ) : (
                          <><ArrowUpRight className="h-4 w-4" />{sub ? 'Switch to this plan' : 'Subscribe'}</>
                        )}
                      </button>
                    ) : (
                      <div className="mt-4 rounded-2xl bg-[color:var(--hub-primary)]/10 px-4 py-2.5 text-center text-sm font-semibold text-[color:var(--hub-primary)]">
                        Your current plan
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="mt-4 text-xs text-[color:var(--hub-muted)]">
              Payments are processed securely by Dodo Payments. Subscriptions renew monthly and can be cancelled any time from your billing portal.
            </p>
          </section>

          {/* Affiliate code */}
          {affiliateCode ? (
            <section className="rounded-[32px] border border-[color:var(--hub-border)] bg-white p-6 shadow-[0_18px_48px_rgba(15,23,42,0.05)] sm:p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Your referral code</p>
              <p className="mt-2 text-sm text-[color:var(--hub-muted)]">Share this code with other teachers. When they sign up and activate a subscription, you both receive a subscription discount.</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-2xl border border-[color:var(--hub-border)] bg-[color:var(--hub-soft)] px-5 py-3 font-mono text-xl font-bold tracking-widest text-[color:var(--hub-text)]">
                  {affiliateCode}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard?.writeText(affiliateCode);
                    addNotification({ type: 'success', title: 'Copied', message: 'Referral code copied to clipboard.', duration: 1800 });
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--hub-border)] px-4 py-3 text-sm font-semibold text-[color:var(--hub-text)]"
                >
                  <Copy className="h-4 w-4" />
                  Copy code
                </button>
              </div>
            </section>
          ) : null}
        </>
      ) : null}

      {/* Learner invoices */}
      {payments.length > 0 ? (
        <div>
          {!isStudent ? (
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-[color:var(--hub-primary)]">Learner invoices</p>
          ) : null}
          <PaymentTable payments={payments} />
        </div>
      ) : (
        <div className="rounded-[28px] border border-[color:var(--hub-border)] bg-white p-6 text-sm text-[color:var(--hub-muted)] shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
          No payment records yet.
        </div>
      )}
    </div>
  );
};
